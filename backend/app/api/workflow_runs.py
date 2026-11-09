from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.workflow_run import WorkflowRun
from app.schemas.workflow_run import (
    ArtifactFile,
    ArtifactListResponse,
    WorkflowRunApprovalUpdate,
    WorkflowRunCreate,
    WorkflowRunResponse,
)
from app.services.workflow_execution_service import (
    WORKFLOW_RUNS_DIRECTORY,
    run_workflow_in_background,
    start_workflow_run,
)
from app.services.workflow_run_service import set_workflow_run_approval
from app.services.workspace_reader import read_workspace_files

router = APIRouter(prefix="/projects", tags=["workflow runs"])


def _get_run_or_404(
    db: Session,
    project_id: UUID,
    run_id: UUID,
) -> WorkflowRun:
    workflow_run = db.get(WorkflowRun, run_id)

    if workflow_run is None or workflow_run.project_id != project_id:
        raise HTTPException(
            status_code=404,
            detail="Workflow run not found",
        )

    return workflow_run


@router.post(
    "/{project_id}/runs",
    response_model=WorkflowRunResponse,
    status_code=201,
    summary="Start a workflow run",
)
def create_workflow_run(
    project_id: UUID,
    run_data: WorkflowRunCreate,
    background_tasks: BackgroundTasks,
    db: Annotated[Session, Depends(get_db)],
) -> WorkflowRun:
    try:
        workflow_run = start_workflow_run(
            db=db,
            project_id=project_id,
            user_request=run_data.user_request,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        ) from exc

    background_tasks.add_task(
        run_workflow_in_background,
        workflow_run.id,
    )

    return workflow_run


@router.get(
    "/{project_id}/runs",
    response_model=list[WorkflowRunResponse],
    summary="List workflow runs for a project",
)
def list_workflow_runs(
    project_id: UUID,
    db: Annotated[Session, Depends(get_db)],
) -> list[WorkflowRun]:
    statement = (
        select(WorkflowRun)
        .where(WorkflowRun.project_id == project_id)
        .order_by(WorkflowRun.started_at.desc())
    )

    return list(db.scalars(statement).all())


@router.get(
    "/{project_id}/runs/{run_id}",
    response_model=WorkflowRunResponse,
    summary="Get a workflow run",
)
def get_workflow_run(
    project_id: UUID,
    run_id: UUID,
    db: Annotated[Session, Depends(get_db)],
) -> WorkflowRun:
    return _get_run_or_404(db, project_id, run_id)


@router.patch(
    "/{project_id}/runs/{run_id}/approval",
    response_model=WorkflowRunResponse,
    summary="Approve or reject a completed workflow run",
)
def update_workflow_run_approval(
    project_id: UUID,
    run_id: UUID,
    approval_data: WorkflowRunApprovalUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> WorkflowRun:
    workflow_run = _get_run_or_404(db, project_id, run_id)

    if workflow_run.status != "completed":
        raise HTTPException(
            status_code=409,
            detail="Only completed workflow runs can be approved or rejected",
        )

    return set_workflow_run_approval(
        db=db,
        workflow_run_id=workflow_run.id,
        approval_status=approval_data.approval_status,
    )


@router.get(
    "/{project_id}/runs/{run_id}/artifacts",
    response_model=ArtifactListResponse,
    summary="List generated artifacts for a workflow run",
)
def list_workflow_run_artifacts(
    project_id: UUID,
    run_id: UUID,
    db: Annotated[Session, Depends(get_db)],
) -> ArtifactListResponse:
    workflow_run = _get_run_or_404(db, project_id, run_id)

    workspace = WORKFLOW_RUNS_DIRECTORY / str(workflow_run.id)
    files = read_workspace_files(workspace)

    return ArtifactListResponse(
        run_id=workflow_run.id,
        files=[ArtifactFile(path=path, content=content) for path, content in sorted(files.items())],
    )
