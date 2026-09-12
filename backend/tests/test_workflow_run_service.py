from uuid import uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database.base import Base
from app.models.project import Project
from app.models.workflow_run import WorkflowRun
from app.services.workflow_run_service import (
    complete_workflow_run,
    create_workflow_run,
    update_workflow_run,
)

def test_complete_workflow_run():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="Complete Test Project",
            )
            db.add(project)
            db.commit()
            db.refresh(project)

            workflow_run = create_workflow_run(
                db=db,
                project_id=project.id,
            )

            completed_run = complete_workflow_run(
                db=db,
                workflow_run_id=workflow_run.id,
            )

            assert completed_run.id == workflow_run.id
            assert completed_run.status == "completed"
            assert completed_run.completed_at is not None

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_complete_workflow_run_preserves_workflow_data():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="Preserve Complete Test",
            )
            db.add(project)
            db.commit()
            db.refresh(project)

            workflow_run = create_workflow_run(
                db=db,
                project_id=project.id,
            )

            update_workflow_run(
                db=db,
                workflow_run_id=workflow_run.id,
                current_agent="tester",
                current_task="Run generated tests",
                iteration=2,
            )

            completed_run = complete_workflow_run(
                db=db,
                workflow_run_id=workflow_run.id,
            )

            assert completed_run.status == "completed"
            assert completed_run.current_agent == "tester"
            assert completed_run.current_task == "Run generated tests"
            assert completed_run.iteration == 2
            assert completed_run.completed_at is not None

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_complete_workflow_run_rejects_unknown_run():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            unknown_run_id = uuid4()

            try:
                complete_workflow_run(
                    db=db,
                    workflow_run_id=unknown_run_id,
                )
            except ValueError as exc:
                assert str(unknown_run_id) in str(exc)
            else:
                raise AssertionError(
                    "Expected ValueError for an unknown workflow run."
                )

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()

TEST_DATABASE_URL = (
    "postgresql+psycopg://codeforge:codeforge_password"
    "@localhost:5432/codeforge_test"
)


def test_create_workflow_run():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="Test Project",
                description="Test project",
            )
            db.add(project)
            db.commit()
            db.refresh(project)

            workflow_run = create_workflow_run(
                db=db,
                project_id=project.id,
            )

            assert workflow_run.id is not None
            assert workflow_run.project_id == project.id
            assert workflow_run.status == "started"
            assert workflow_run.current_agent is None
            assert workflow_run.current_task is None
            assert workflow_run.iteration == 0
            assert workflow_run.started_at is not None
            assert workflow_run.completed_at is None

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_create_workflow_run_persists_record():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        project_id = uuid4()

        with Session(engine) as db:
            project = Project(
                id=project_id,
                name="Persistent Project",
            )
            db.add(project)
            db.commit()

            workflow_run = create_workflow_run(
                db=db,
                project_id=project_id,
            )

            stored_run = db.get(
                WorkflowRun,
                workflow_run.id,
            )

            assert stored_run is not None
            assert stored_run.id == workflow_run.id
            assert stored_run.project_id == project_id
            assert stored_run.status == "started"

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_create_workflow_run_rolls_back_on_failure():
    from sqlalchemy.exc import IntegrityError

    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        unknown_project_id = uuid4()

        with Session(engine) as db:
            try:
                create_workflow_run(
                    db=db,
                    project_id=unknown_project_id,
                )
            except IntegrityError:
                pass
            else:
                raise AssertionError(
                    "Expected an IntegrityError."
                )

            project = Project(
                name="After Rollback",
                description="Session should remain usable.",
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            assert project.id is not None

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_update_workflow_run():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="Update Test Project",
                description="Testing workflow run updates.",
            )
            db.add(project)
            db.commit()
            db.refresh(project)

            workflow_run = create_workflow_run(
                db=db,
                project_id=project.id,
            )

            updated_run = update_workflow_run(
                db=db,
                workflow_run_id=workflow_run.id,
                status="developer_completed",
                current_agent="developer",
                current_task="Implement Task model",
                iteration=1,
            )

            assert updated_run.id == workflow_run.id
            assert updated_run.status == "developer_completed"
            assert updated_run.current_agent == "developer"
            assert updated_run.current_task == "Implement Task model"
            assert updated_run.iteration == 1

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_update_workflow_run_preserves_unspecified_fields():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            project = Project(
                name="Preserve Test Project",
            )
            db.add(project)
            db.commit()
            db.refresh(project)

            workflow_run = create_workflow_run(
                db=db,
                project_id=project.id,
            )

            update_workflow_run(
                db=db,
                workflow_run_id=workflow_run.id,
                status="tests_failed",
            )

            stored_run = db.get(
                WorkflowRun,
                workflow_run.id,
            )

            assert stored_run is not None
            assert stored_run.status == "tests_failed"
            assert stored_run.current_agent is None
            assert stored_run.current_task is None
            assert stored_run.iteration == 0

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_update_workflow_run_rejects_unknown_run():
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    Base.metadata.create_all(bind=engine)

    try:
        with Session(engine) as db:
            unknown_run_id = uuid4()

            try:
                update_workflow_run(
                    db=db,
                    workflow_run_id=unknown_run_id,
                    status="completed",
                )
            except ValueError as exc:
                assert str(unknown_run_id) in str(exc)
            else:
                raise AssertionError(
                    "Expected ValueError for an unknown workflow run."
                )

    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()