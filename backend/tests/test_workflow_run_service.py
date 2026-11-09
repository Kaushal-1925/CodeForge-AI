from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.workflow_run import WorkflowRun
from app.services.workflow_run_service import (
    complete_workflow_run,
    create_workflow_run,
    set_workflow_run_approval,
    update_workflow_run,
)


def test_complete_workflow_run(db_session: Session) -> None:
    project = Project(
        name="Complete Test Project",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = create_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )

    completed_run = complete_workflow_run(
        db=db_session,
        workflow_run_id=workflow_run.id,
    )

    assert completed_run.id == workflow_run.id
    assert completed_run.user_request == ("Build a test application.")
    assert completed_run.status == "completed"
    assert completed_run.completed_at is not None


def test_complete_workflow_run_preserves_workflow_data(db_session: Session) -> None:
    project = Project(
        name="Preserve Complete Test",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = create_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )

    update_workflow_run(
        db=db_session,
        workflow_run_id=workflow_run.id,
        current_agent="tester",
        current_task="Run generated tests",
        iteration=2,
    )

    completed_run = complete_workflow_run(
        db=db_session,
        workflow_run_id=workflow_run.id,
    )

    assert completed_run.status == "completed"
    assert completed_run.user_request == ("Build a test application.")
    assert completed_run.current_agent == "tester"
    assert completed_run.current_task == ("Run generated tests")
    assert completed_run.iteration == 2
    assert completed_run.completed_at is not None


def test_complete_workflow_run_rejects_unknown_run(db_session: Session) -> None:
    unknown_run_id = uuid4()

    with pytest.raises(ValueError) as exc_info:
        complete_workflow_run(
            db=db_session,
            workflow_run_id=unknown_run_id,
        )

    assert str(unknown_run_id) in str(exc_info.value)


def test_create_workflow_run(db_session: Session) -> None:
    project = Project(
        name="Test Project",
        description="Test project",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    user_request = "Build a test application."

    workflow_run = create_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request=user_request,
    )

    assert workflow_run.id is not None
    assert workflow_run.project_id == project.id
    assert workflow_run.user_request == user_request
    assert workflow_run.status == "started"
    assert workflow_run.current_agent is None
    assert workflow_run.current_task is None
    assert workflow_run.iteration == 0
    assert workflow_run.started_at is not None
    assert workflow_run.completed_at is None


def test_create_workflow_run_persists_record(db_session: Session) -> None:
    project_id = uuid4()
    user_request = "Build a persistent test application."

    project = Project(
        id=project_id,
        name="Persistent Project",
    )
    db_session.add(project)
    db_session.commit()

    workflow_run = create_workflow_run(
        db=db_session,
        project_id=project_id,
        user_request=user_request,
    )

    stored_run = db_session.get(
        WorkflowRun,
        workflow_run.id,
    )

    assert stored_run is not None
    assert stored_run.id == workflow_run.id
    assert stored_run.project_id == project_id
    assert stored_run.user_request == user_request
    assert stored_run.status == "started"


def test_create_workflow_run_rolls_back_on_failure(db_session: Session) -> None:
    unknown_project_id = uuid4()

    with pytest.raises(IntegrityError):
        create_workflow_run(
            db=db_session,
            project_id=unknown_project_id,
            user_request="Build a test application.",
        )

    project = Project(
        name="After Rollback",
        description="Session should remain usable.",
    )

    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    assert project.id is not None


def test_update_workflow_run(db_session: Session) -> None:
    project = Project(
        name="Update Test Project",
        description="Testing workflow run updates.",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = create_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )

    updated_run = update_workflow_run(
        db=db_session,
        workflow_run_id=workflow_run.id,
        status="developer_completed",
        current_agent="developer",
        current_task="Implement Task model",
        iteration=1,
    )

    assert updated_run.id == workflow_run.id
    assert updated_run.user_request == ("Build a test application.")
    assert updated_run.status == "developer_completed"
    assert updated_run.current_agent == "developer"
    assert updated_run.current_task == ("Implement Task model")
    assert updated_run.iteration == 1


def test_update_workflow_run_preserves_unspecified_fields(db_session: Session) -> None:
    project = Project(
        name="Preserve Test Project",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = create_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )

    update_workflow_run(
        db=db_session,
        workflow_run_id=workflow_run.id,
        status="tests_failed",
    )

    stored_run = db_session.get(
        WorkflowRun,
        workflow_run.id,
    )

    assert stored_run is not None
    assert stored_run.user_request == ("Build a test application.")
    assert stored_run.status == "tests_failed"
    assert stored_run.current_agent is None
    assert stored_run.current_task is None
    assert stored_run.iteration == 0


def test_update_workflow_run_rejects_unknown_run(db_session: Session) -> None:
    unknown_run_id = uuid4()

    with pytest.raises(ValueError) as exc_info:
        update_workflow_run(
            db=db_session,
            workflow_run_id=unknown_run_id,
            status="completed",
        )

    assert str(unknown_run_id) in str(exc_info.value)


def test_set_workflow_run_approval(db_session: Session) -> None:
    project = Project(
        name="Approval Test Project",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    workflow_run = create_workflow_run(
        db=db_session,
        project_id=project.id,
        user_request="Build a test application.",
    )
    complete_workflow_run(
        db=db_session,
        workflow_run_id=workflow_run.id,
    )

    approved_run = set_workflow_run_approval(
        db=db_session,
        workflow_run_id=workflow_run.id,
        approval_status="approved",
    )

    assert approved_run.id == workflow_run.id
    assert approved_run.approval_status == "approved"

    rejected_run = set_workflow_run_approval(
        db=db_session,
        workflow_run_id=workflow_run.id,
        approval_status="rejected",
    )

    assert rejected_run.approval_status == "rejected"


def test_set_workflow_run_approval_rejects_unknown_run(db_session: Session) -> None:
    unknown_run_id = uuid4()

    with pytest.raises(ValueError) as exc_info:
        set_workflow_run_approval(
            db=db_session,
            workflow_run_id=unknown_run_id,
            approval_status="approved",
        )

    assert str(unknown_run_id) in str(exc_info.value)
