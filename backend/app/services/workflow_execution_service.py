from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.graph.state import CodeForgeState
from app.graph.workflow import build_graph
from app.models.project import Project
from app.models.workflow_run import WorkflowRun
from app.services.workflow_run_service import (
    complete_workflow_run,
    create_workflow_run,
    update_workflow_run,
)
from app.services.workflow_status import get_workflow_run_status


PROJECT_ROOT = Path(__file__).resolve().parents[3]
WORKFLOW_RUNS_DIRECTORY = PROJECT_ROOT / "sandbox" / "runs"


def start_workflow_run(
    db: Session,
    project_id: UUID,
    user_request: str,
) -> WorkflowRun:
    project = db.get(Project, project_id)

    if project is None:
        raise ValueError(
            f"Project not found: {project_id}"
        )

    workflow_run = create_workflow_run(
        db=db,
        project_id=project_id,
        user_request=user_request,
    )

    return workflow_run


def build_initial_state(
    workflow_run: WorkflowRun,
) -> CodeForgeState:
    workspace = (
        WORKFLOW_RUNS_DIRECTORY / str(workflow_run.id)
    )

    workspace.mkdir(
        parents=True,
        exist_ok=True,
    )

    return {
        "workspace": str(workspace),
        "user_request": workflow_run.user_request,
        "requirements": "",
        "architecture": "",
        "tasks": [],
        "current_task_index": 0,
        "current_task": "",
        "files": {},
        "validation_errors": [],
        "test_results": {},
        "current_agent": "",
        "status": "started",
        "iteration": 0,
        "retry_count": 0,
        "architecture_retry_count": 0,
    }


def execute_workflow_run(
    db: Session,
    workflow_run_id: UUID,
    graph: Any,
    initial_state: CodeForgeState,
) -> tuple[WorkflowRun, CodeForgeState]:
    workflow_run = db.get(
        WorkflowRun,
        workflow_run_id,
    )

    if workflow_run is None:
        raise ValueError(
            f"Workflow run not found: {workflow_run_id}"
        )

    final_state = initial_state

    try:
        for event in graph.stream(initial_state):
            if not event:
                continue

            _, node_state = next(iter(event.items()))

            if not isinstance(node_state, dict):
                continue

            final_state = node_state

            status = node_state.get("status")
            current_agent = node_state.get("current_agent")
            current_task = node_state.get("current_task")
            iteration = node_state.get("iteration")

            workflow_run = update_workflow_run(
                db=db,
                workflow_run_id=workflow_run.id,
                status=(
                    status
                    if status is not None
                    else workflow_run.status
                ),
                current_agent=(
                    current_agent
                    if current_agent is not None
                    else workflow_run.current_agent
                ),
                current_task=(
                    current_task
                    if current_task is not None
                    else workflow_run.current_task
                ),
                iteration=(
                    iteration
                    if isinstance(iteration, int)
                    else workflow_run.iteration
                ),
            )

        workflow_status = get_workflow_run_status(
            final_state
        )

        if workflow_status == "completed":
            workflow_run = complete_workflow_run(
                db=db,
                workflow_run_id=workflow_run.id,
            )
        else:
            workflow_run = update_workflow_run(
                db=db,
                workflow_run_id=workflow_run.id,
                status="failed",
            )

        return workflow_run, final_state

    except Exception:
        update_workflow_run(
            db=db,
            workflow_run_id=workflow_run.id,
            status="failed",
        )
        raise


def run_workflow_in_background(
    workflow_run_id: UUID,
) -> None:
    db = SessionLocal()

    try:
        workflow_run = db.get(
            WorkflowRun,
            workflow_run_id,
        )

        if workflow_run is None:
            return

        initial_state = build_initial_state(
            workflow_run
        )

        graph = build_graph()

        execute_workflow_run(
            db=db,
            workflow_run_id=workflow_run_id,
            graph=graph,
            initial_state=initial_state,
        )

    except Exception:
        workflow_run = db.get(
            WorkflowRun,
            workflow_run_id,
        )

        if workflow_run is not None:
            update_workflow_run(
                db=db,
                workflow_run_id=workflow_run_id,
                status="failed",
            )

    finally:
        db.close()