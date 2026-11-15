import shutil
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.project import Project
from app.models.workflow_run import WorkflowRun
from app.schemas.project import ProjectCreate, ProjectResponse
from app.services.workflow_execution_service import WORKFLOW_RUNS_DIRECTORY

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=201,
    summary="Create a project",
)
def create_project(
    project_data: ProjectCreate,
    db: Annotated[Session, Depends(get_db)],
) -> Project:
    project = Project(
        name=project_data.name,
        description=project_data.description,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@router.get(
    "",
    response_model=list[ProjectResponse],
    summary="List projects",
)
def list_projects(
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[Project]:
    statement = select(Project).order_by(Project.created_at.desc()).limit(limit).offset(offset)

    return list(db.scalars(statement).all())


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get a project",
)
def get_project(
    project_id: UUID,
    db: Annotated[Session, Depends(get_db)],
) -> Project:
    project = db.get(Project, project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return project


@router.delete(
    "/{project_id}",
    status_code=204,
    summary="Delete a project",
)
def delete_project(
    project_id: UUID,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    project = db.get(Project, project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    # 1. Clean up associated workflow runs and sandbox directories on disk
    runs_statement = select(WorkflowRun).where(WorkflowRun.project_id == project_id)
    runs = list(db.scalars(runs_statement).all())
    for run in runs:
        run_workspace = WORKFLOW_RUNS_DIRECTORY / str(run.id)
        if run_workspace.exists():
            shutil.rmtree(run_workspace, ignore_errors=True)
        db.delete(run)

    # 2. Delete the project itself
    db.delete(project)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

