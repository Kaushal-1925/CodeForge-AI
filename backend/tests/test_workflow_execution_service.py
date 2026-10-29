from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy.orm import Session, sessionmaker

from app.models.project import Project
from app.models.workflow_run import WorkflowRun
from app.services import workflow_execution_service
from app.services.workflow_execution_service import (
    build_initial_state,
    execute_workflow_run,
    run_workflow_in_background,
    start_workflow_run,
)


def test_start_workflow_run(db_session: Session) -> None:
    project = Project(
        name="Workflow Test Project",
        description="Project for workflow execution.",
    )

    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    user_request = "Build a test application."

    workflow_run = start_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request=user_request,
    )

    assert workflow_run.id is not None
    assert workflow_run.project_id == project.id
    assert workflow_run.user_request == user_request
    assert workflow_run.status == "started"
    assert workflow_run.iteration == 0

    stored_run = db_session.get(
        WorkflowRun,
        workflow_run.id,
    )

    assert stored_run is not None
    assert stored_run.project_id == project.id
    assert stored_run.user_request == user_request


def test_start_workflow_run_rejects_unknown_project(db_session: Session) -> None:
    unknown_project_id = uuid4()

    with pytest.raises(ValueError) as exc_info:
        start_workflow_run(
            db=db_session,
            project_id=unknown_project_id,
            user_request="Build a test application.",
        )

    assert str(unknown_project_id) in str(exc_info.value)


def test_build_initial_state(
    db_session: Session,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        workflow_execution_service,
        "WORKFLOW_RUNS_DIRECTORY",
        tmp_path / "runs",
    )

    project = Project(
        name="Initial State Project",
    )

    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = start_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )

    state = build_initial_state(workflow_run)

    workspace = state["workspace"]

    assert state["user_request"] == ("Build a test application.")
    assert state["requirements"] == ""
    assert state["architecture"] == ""
    assert state["tasks"] == []
    assert state["current_task_index"] == 0
    assert state["current_task"] == ""
    assert state["files"] == {}
    assert state["validation_errors"] == []
    assert state["test_results"] == {}
    assert state["current_agent"] == ""
    assert state["status"] == "started"
    assert state["iteration"] == 0
    assert state["retry_count"] == 0

    assert workspace.endswith(str(workflow_run.id))
    assert Path(workspace).is_dir()


def test_execute_workflow_run_completes_successfully(db_session: Session) -> None:
    project = Project(
        name="Successful Workflow",
    )

    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = start_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )

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

    returned_run, returned_state = execute_workflow_run(
        db=db_session,
        workflow_run_id=workflow_run.id,
        graph=FakeGraph(),
        initial_state=final_state,
    )

    assert returned_state == final_state
    assert returned_run.id == workflow_run.id
    assert returned_run.project_id == project.id
    assert returned_run.user_request == ("Build a test application.")
    assert returned_run.status == "completed"
    assert returned_run.current_agent == ("task_progression")
    assert returned_run.current_task == ""
    assert returned_run.iteration == 0
    assert returned_run.completed_at is not None

    runs = db_session.query(WorkflowRun).all()

    assert len(runs) == 1


def test_execute_workflow_run_persists_failure(db_session: Session) -> None:
    project = Project(
        name="Failed Workflow",
    )

    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = start_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )

    final_state = {
        "user_request": "Build a test application.",
        "requirements": "",
        "architecture": "",
        "tasks": [],
        "current_task_index": 0,
        "current_task": "",
        "files": {},
        "validation_errors": ["Task validation failed."],
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

    returned_run, returned_state = execute_workflow_run(
        db=db_session,
        workflow_run_id=workflow_run.id,
        graph=FakeGraph(),
        initial_state=final_state,
    )

    assert returned_state == final_state
    assert returned_run.id == workflow_run.id
    assert returned_run.project_id == project.id
    assert returned_run.user_request == ("Build a test application.")
    assert returned_run.status == "failed"
    assert returned_run.current_agent == ("task_validator")
    assert returned_run.completed_at is None

    runs = db_session.query(WorkflowRun).all()

    assert len(runs) == 1


def test_execute_workflow_run_marks_exception_as_failed(db_session: Session) -> None:
    project = Project(
        name="Exception Workflow",
    )

    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = start_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )

    class FailingGraph:
        def stream(self, state):
            raise RuntimeError("Simulated workflow failure.")

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

    with pytest.raises(RuntimeError) as exc_info:
        execute_workflow_run(
            db=db_session,
            workflow_run_id=workflow_run.id,
            graph=FailingGraph(),
            initial_state=initial_state,
        )

    assert str(exc_info.value) == ("Simulated workflow failure.")

    runs = db_session.query(WorkflowRun).all()

    assert len(runs) == 1

    stored_run = runs[0]

    assert stored_run.id == workflow_run.id
    assert stored_run.project_id == project.id
    assert stored_run.user_request == ("Build a test application.")
    assert stored_run.status == "failed"
    assert stored_run.completed_at is None


def test_execute_workflow_run_persists_each_streamed_node(db_session: Session) -> None:
    project = Project(
        name="Streaming Persistence",
    )

    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = start_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )

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

    returned_run, returned_state = execute_workflow_run(
        db=db_session,
        workflow_run_id=workflow_run.id,
        graph=FakeGraph(),
        initial_state=initial_state,
    )

    assert returned_state == final_state
    assert returned_run.id == workflow_run.id
    assert returned_run.user_request == ("Build a test application.")
    assert returned_run.status == "completed"
    assert returned_run.current_agent == "developer"
    assert returned_run.current_task == ("Implement feature")
    assert returned_run.iteration == 1
    assert returned_run.completed_at is not None

    runs = db_session.query(WorkflowRun).all()

    assert len(runs) == 1


def test_execute_workflow_run_updates_database_after_each_node(db_session: Session) -> None:
    project = Project(
        name="Node Update Test",
    )

    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = start_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )

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

            run = db_session.get(
                WorkflowRun,
                workflow_run.id,
            )

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

            run = db_session.get(
                WorkflowRun,
                workflow_run.id,
            )

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
        "test_results": {},
        "workspace": "/tmp/test-workspace",
        "current_agent": "",
        "status": "started",
        "iteration": 0,
        "retry_count": 0,
    }

    execute_workflow_run(
        db=db_session,
        workflow_run_id=workflow_run.id,
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


def test_execute_workflow_run_does_not_persist_none_as_string(db_session: Session) -> None:
    project = Project(
        name="None Value Workflow",
    )

    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = start_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )

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
        "test_results": {
            "status": "passed",
        },
        "current_agent": "task_progression",
        "status": "started",
        "iteration": 0,
        "retry_count": 0,
    }

    returned_run, returned_state = execute_workflow_run(
        db=db_session,
        workflow_run_id=workflow_run.id,
        graph=FakeGraph(),
        initial_state=initial_state,
    )

    assert returned_state == final_state
    assert returned_run.id == workflow_run.id
    assert returned_run.user_request == ("Build a test application.")
    assert returned_run.status == "completed"
    assert returned_run.current_agent is None
    assert returned_run.current_task is None
    assert returned_run.iteration == 0

    assert returned_run.current_agent != "None"
    assert returned_run.current_task != "None"


def test_run_workflow_in_background_executes_existing_run(
    session_factory: sessionmaker[Session],
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        workflow_execution_service,
        "WORKFLOW_RUNS_DIRECTORY",
        tmp_path / "runs",
    )

    with session_factory() as db:
        project = Project(
            name="Background Workflow",
        )

        db.add(project)
        db.commit()
        db.refresh(project)

        workflow_run = start_workflow_run(
            db=db,
            project_id=project.id,
            user_request="Build a background test application.",
        )

        run_id = workflow_run.id

    class FakeGraph:
        def stream(self, state):
            yield {
                "task_progression": {
                    **state,
                    "current_agent": "task_progression",
                    "current_task": "",
                    "status": "all_tasks_completed",
                    "iteration": 0,
                }
            }

    monkeypatch.setattr(
        workflow_execution_service,
        "build_graph",
        lambda: FakeGraph(),
    )

    monkeypatch.setattr(
        workflow_execution_service,
        "SessionLocal",
        session_factory,
    )

    run_workflow_in_background(run_id)

    with session_factory() as db:
        stored_run = db.get(
            WorkflowRun,
            run_id,
        )

        assert stored_run is not None
        assert stored_run.id == run_id
        assert stored_run.user_request == ("Build a background test application.")
        assert stored_run.status == "completed"
        assert stored_run.current_agent == ("task_progression")
        assert stored_run.current_task == ""
        assert stored_run.iteration == 0
        assert stored_run.completed_at is not None

        runs = db.query(WorkflowRun).all()

        assert len(runs) == 1
