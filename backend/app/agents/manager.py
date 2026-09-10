from app.graph.state import CodeForgeState


def manager_agent(state: CodeForgeState) -> CodeForgeState:
    state["current_agent"] = "project_manager"
    state["status"] = "manager_completed"

    return state

