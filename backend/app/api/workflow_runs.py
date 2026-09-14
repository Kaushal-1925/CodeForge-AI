from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.workflow_run import WorkflowRun
from app.schemas.workflow_run import WorkflowRunResponse
from app.services.workflow_execution_service import start_workflow_run


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
    db: Session = Depends(get_db),
) -> WorkflowRun:
    try:
        workflow_run = start_workflow_run(
            db=db,
            project_id=project_id,
        )
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return workflow_run