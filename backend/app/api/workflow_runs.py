from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.workflow_run import WorkflowRun
from app.schemas.workflow_run import (
    WorkflowRunCreate,
    WorkflowRunResponse,
)
from app.services.workflow_execution_service import (
    run_workflow_in_background,
    start_workflow_run,
)


router = APIRouter(
    prefix="/projects",
    tags=["Workflow Runs"],
)


@router.post(
    "/{project_id}/runs",
    response_model=WorkflowRunResponse,
)
def create_workflow_run(
    project_id: UUID,
    run_data: WorkflowRunCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    try:
        workflow_run = start_workflow_run(
            db=db,
            project_id=project_id,
            user_request=run_data.user_request,
        )
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    background_tasks.add_task(
        run_workflow_in_background,
        workflow_run.id,
    )

    return workflow_run


@router.get(
    "/{project_id}/runs/{run_id}",
    response_model=WorkflowRunResponse,
)
def get_workflow_run(
    project_id: UUID,
    run_id: UUID,
    db: Session = Depends(get_db),
):
    workflow_run = db.get(
        WorkflowRun,
        run_id,
    )

    if workflow_run is None:
        raise HTTPException(
            status_code=404,
            detail="Workflow run not found",
        )

    if workflow_run.project_id != project_id:
        raise HTTPException(
            status_code=404,
            detail="Workflow run not found",
        )

    return workflow_run