from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.workflow_run import WorkflowRun


def create_workflow_run(
    db: Session,
    project_id: UUID,
    user_request: str,
) -> WorkflowRun:
    workflow_run = WorkflowRun(
        project_id=project_id,
        user_request=user_request,
        status="started",
        current_agent=None,
        current_task=None,
        iteration=0,
    )

    try:
        db.add(workflow_run)
        db.commit()
        db.refresh(workflow_run)
    except Exception:
        db.rollback()
        raise

    return workflow_run


def update_workflow_run(
    db: Session,
    workflow_run_id: UUID,
    *,
    status: str | None = None,
    current_agent: str | None = None,
    current_task: str | None = None,
    iteration: int | None = None,
) -> WorkflowRun:
    workflow_run = db.get(
        WorkflowRun,
        workflow_run_id,
    )

    if workflow_run is None:
        raise ValueError(
            f"Workflow run not found: {workflow_run_id}"
        )

    if status is not None:
        workflow_run.status = status

    if current_agent is not None:
        workflow_run.current_agent = current_agent

    if current_task is not None:
        workflow_run.current_task = current_task

    if iteration is not None:
        workflow_run.iteration = iteration

    try:
        db.commit()
        db.refresh(workflow_run)
    except Exception:
        db.rollback()
        raise

    return workflow_run


def complete_workflow_run(
    db: Session,
    workflow_run_id: UUID,
) -> WorkflowRun:
    workflow_run = db.get(
        WorkflowRun,
        workflow_run_id,
    )

    if workflow_run is None:
        raise ValueError(
            f"Workflow run not found: {workflow_run_id}"
        )

    workflow_run.status = "completed"
    workflow_run.completed_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(workflow_run)
    except Exception:
        db.rollback()
        raise

    return workflow_run