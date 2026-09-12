from app.graph.state import CodeForgeState


SUCCESS_STATUSES = {
    "all_tasks_completed",
}


FAILURE_STATUSES = {
    "architecture_validation_failed",
    "task_validation_failed",
    "validation_failed",
    "artifact_validation_failed",
    "tests_failed",
    "max_retries_reached",
}


def get_workflow_run_status(state: CodeForgeState) -> str:
    status = state["status"]

    if status in SUCCESS_STATUSES:
        return "completed"

    if status in FAILURE_STATUSES:
        return "failed"

    return "failed"

