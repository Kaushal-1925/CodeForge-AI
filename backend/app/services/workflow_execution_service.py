from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.graph.state import CodeForgeState
from app.models.project import Project
from app.models.workflow_run import WorkflowRun
from app.services.workflow_run_service import (
    complete_workflow_run,
    create_workflow_run,
    update_workflow_run,
)
from app.services.workflow_status import get_workflow_run_status


def start_workflow_run(
    db: Session,
    project_id: UUID,
) -> WorkflowRun:
    project = db.get(Project, project_id)

    if project is None:
        raise ValueError(
            f"Project not found: {project_id}"
        )

    workflow_run = create_workflow_run(
        db=db,
        project_id=project_id,
    )

    return workflow_run


def execute_workflow_run(
    db: Session,
    project_id: UUID,
    graph: Any,
    initial_state: CodeForgeState,
) -> tuple[WorkflowRun, CodeForgeState]:
    workflow_run = start_workflow_run(
        db=db,
        project_id=project_id,
    )

    final_state = initial_state

    try:
        for event in graph.stream(initial_state):
            if not event:
                continue

            node_name, node_state = next(
                iter(event.items())
            )

            if not isinstance(node_state, dict):
                continue

            final_state = node_state

            update_workflow_run(
                db=db,
                workflow_run_id=workflow_run.id,
                status=str(
                    node_state.get(
                        "status",
                        workflow_run.status,
                    )
                ),
                current_agent=str(
                    node_state.get(
                        "current_agent",
                        workflow_run.current_agent,
                    )
                ),
                current_task=str(
                    node_state.get(
                        "current_task",
                        workflow_run.current_task,
                    )
                ),
                iteration=int(
                    node_state.get(
                        "iteration",
                        workflow_run.iteration,
                    )
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