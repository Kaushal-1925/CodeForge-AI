from uuid import uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database.base import Base
from app.models.project import Project
from app.models.workflow_run import WorkflowRun
from app.services.workflow_execution_service import (
    execute_workflow_run,
    start_workflow_run,
)


TEST_DATABASE_URL = (
    "postgresql+psycopg://codeforge:codeforge_password"
    "@localhost:5432/codeforge_test"
)


def test_start_workflow_run():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="Workflow Test Project",
                description="Project for workflow execution.",
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            workflow_run = start_workflow_run(
                db=db,
                project_id=project.id,
            )

            assert workflow_run.id is not None
            assert workflow_run.project_id == project.id
            assert workflow_run.status == "started"
            assert workflow_run.iteration == 0

            stored_run = db.get(
                WorkflowRun,
                workflow_run.id,
            )

            assert stored_run is not None
            assert stored_run.project_id == project.id

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_start_workflow_run_rejects_unknown_project():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            unknown_project_id = uuid4()

            try:
                start_workflow_run(
                    db=db,
                    project_id=unknown_project_id,
                )
            except ValueError as exc:
                assert str(unknown_project_id) in str(exc)
            else:
                raise AssertionError(
                    "Expected ValueError for an unknown project."
                )

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_execute_workflow_run_completes_successfully():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="Successful Workflow",
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            final_state = {
                "user_request": "Build a test application.",
                "requirements": "Test requirements.",
                "architecture": "FastAPI and PostgreSQL.",
                "tasks": ["Implement feature"],
                "current_task_index": 1,
                "current_task": "",
                "files": {},
                "validation_errors": [],
                "workspace": "/tmp/test-workspace",
                "test_results": {
                    "status": "passed",
                },
                "current_agent": "task_progression",
                "status": "all_tasks_completed",
                "iteration": 0,
                "retry_count": 0,
            }

            class FakeGraph:
                def stream(self, state):
                    yield {
                        "task_progression": final_state,
                    }

            workflow_run, returned_state = (
                execute_workflow_run(
                    db=db,
                    project_id=project.id,
                    graph=FakeGraph(),
                    initial_state=final_state,
                )
            )

            assert returned_state == final_state
            assert workflow_run.project_id == project.id
            assert workflow_run.status == "completed"
            assert workflow_run.current_agent == (
                "task_progression"
            )
            assert workflow_run.current_task == ""
            assert workflow_run.iteration == 0
            assert workflow_run.completed_at is not None

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_execute_workflow_run_persists_failure():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="Failed Workflow",
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            final_state = {
                "user_request": "Build a test application.",
                "requirements": "",
                "architecture": "",
                "tasks": [],
                "current_task_index": 0,
                "current_task": "",
                "files": {},
                "validation_errors": [
                    "Task validation failed."
                ],
                "workspace": "/tmp/test-workspace",
                "test_results": {},
                "current_agent": "task_validator",
                "status": "task_validation_failed",
                "iteration": 0,
                "retry_count": 0,
            }

            class FakeGraph:
                def stream(self, state):
                    yield {
                        "task_validator": final_state,
                    }

            workflow_run, returned_state = (
                execute_workflow_run(
                    db=db,
                    project_id=project.id,
                    graph=FakeGraph(),
                    initial_state=final_state,
                )
            )

            assert returned_state == final_state
            assert workflow_run.project_id == project.id
            assert workflow_run.status == "failed"
            assert workflow_run.current_agent == (
                "task_validator"
            )
            assert workflow_run.completed_at is None

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_execute_workflow_run_marks_exception_as_failed():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="Exception Workflow",
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            class FailingGraph:
                def stream(self, state):
                    raise RuntimeError(
                        "Simulated workflow failure."
                    )

            initial_state = {
                "user_request": "Build a test application.",
                "requirements": "",
                "architecture": "",
                "tasks": [],
                "current_task_index": 0,
                "current_task": "",
                "files": {},
                "validation_errors": [],
                "workspace": "/tmp/test-workspace",
                "test_results": {},
                "current_agent": "",
                "status": "started",
                "iteration": 0,
                "retry_count": 0,
            }

            try:
                execute_workflow_run(
                    db=db,
                    project_id=project.id,
                    graph=FailingGraph(),
                    initial_state=initial_state,
                )
            except RuntimeError as exc:
                assert str(exc) == (
                    "Simulated workflow failure."
                )
            else:
                raise AssertionError(
                    "Expected RuntimeError to be raised."
                )

            runs = db.query(WorkflowRun).all()

            assert len(runs) == 1

            stored_run = runs[0]

            assert stored_run.project_id == project.id
            assert stored_run.status == "failed"
            assert stored_run.completed_at is None

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_execute_workflow_run_persists_each_streamed_node():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="Streaming Persistence",
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            first_state = {
                "current_agent": "manager",
                "current_task": "Plan project",
                "status": "manager_completed",
                "iteration": 0,
            }

            final_state = {
                "current_agent": "developer",
                "current_task": "Implement feature",
                "status": "all_tasks_completed",
                "iteration": 1,
            }

            class FakeGraph:
                def stream(self, state):
                    yield {
                        "manager": first_state,
                    }
                    yield {
                        "developer": final_state,
                    }

            initial_state = {
                "user_request": "Build a test application.",
                "requirements": "",
                "architecture": "",
                "tasks": [],
                "current_task_index": 0,
                "current_task": "",
                "files": {},
                "validation_errors": [],
                "workspace": "/tmp/test-workspace",
                "test_results": {},
                "current_agent": "",
                "status": "started",
                "iteration": 0,
                "retry_count": 0,
            }

            workflow_run, returned_state = (
                execute_workflow_run(
                    db=db,
                    project_id=project.id,
                    graph=FakeGraph(),
                    initial_state=initial_state,
                )
            )

            assert returned_state == final_state
            assert workflow_run.status == "completed"
            assert workflow_run.current_agent == "developer"
            assert workflow_run.current_task == (
                "Implement feature"
            )
            assert workflow_run.iteration == 1
            assert workflow_run.completed_at is not None

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_execute_workflow_run_updates_database_after_each_node():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="Node Update Test",
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            observed_states = []

            class FakeGraph:
                def stream(self, state):
                    yield {
                        "manager": {
                            "current_agent": "manager",
                            "current_task": "Plan project",
                            "status": "manager_completed",
                            "iteration": 0,
                        }
                    }

                    run = db.query(WorkflowRun).first()

                    assert run is not None
                    observed_states.append(
                        (
                            run.current_agent,
                            run.current_task,
                            run.status,
                            run.iteration,
                        )
                    )

                    yield {
                        "developer": {
                            "current_agent": "developer",
                            "current_task": "Implement feature",
                            "status": "all_tasks_completed",
                            "iteration": 1,
                        }
                    }

                    run = db.query(WorkflowRun).first()

                    assert run is not None
                    observed_states.append(
                        (
                            run.current_agent,
                            run.current_task,
                            run.status,
                            run.iteration,
                        )
                    )

            initial_state = {
                "user_request": "Build a test application.",
                "requirements": "",
                "architecture": "",
                "tasks": [],
                "current_task_index": 0,
                "current_task": "",
                "files": {},
                "validation_errors": [],
                "workspace": "/tmp/test-workspace",
                "test_results": {},
                "current_agent": "",
                "status": "started",
                "iteration": 0,
                "retry_count": 0,
            }

            execute_workflow_run(
                db=db,
                project_id=project.id,
                graph=FakeGraph(),
                initial_state=initial_state,
            )

            assert observed_states == [
                (
                    "manager",
                    "Plan project",
                    "manager_completed",
                    0,
                ),
                (
                    "developer",
                    "Implement feature",
                    "all_tasks_completed",
                    1,
                ),
            ]

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_execute_workflow_run_does_not_persist_none_as_string():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="None Value Workflow",
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            final_state = {
                "current_agent": None,
                "current_task": None,
                "status": "all_tasks_completed",
                "iteration": 0,
            }

            class FakeGraph:
                def stream(self, state):
                    yield {
                        "task_progression": final_state,
                    }

            initial_state = {
                "user_request": "Build a test application.",
                "requirements": "",
                "architecture": "",
                "tasks": [],
                "current_task_index": 1,
                "current_task": "",
                "files": {},
                "validation_errors": [],
                "workspace": "/tmp/test-workspace",
                "test_results": {
                    "status": "passed",
                },
                "current_agent": "task_progression",
                "status": "started",
                "iteration": 0,
                "retry_count": 0,
            }

            workflow_run, returned_state = (
                execute_workflow_run(
                    db=db,
                    project_id=project.id,
                    graph=FakeGraph(),
                    initial_state=initial_state,
                )
            )

            assert returned_state == final_state
            assert workflow_run.status == "completed"
            assert workflow_run.current_agent is None
            assert workflow_run.current_task is None
            assert workflow_run.iteration == 0

            assert workflow_run.current_agent != "None"
            assert workflow_run.current_task != "None"

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()