from app.graph.state import CodeForgeState


def advance_to_next_task(
    state: CodeForgeState,
) -> CodeForgeState:
    next_index = state["current_task_index"] + 1

    state["current_task_index"] = next_index

    if next_index < len(state["tasks"]):
        state["current_task"] = state["tasks"][next_index]
        state["status"] = "next_task_ready"
    else:
        state["current_task"] = ""
        state["status"] = "all_tasks_completed"

    state["current_agent"] = "task_progression"

    return state
