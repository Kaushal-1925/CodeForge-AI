from app.graph.state import CodeForgeState
from app.services.llm import create_llm


model = create_llm()


def manager_agent(state: CodeForgeState) -> CodeForgeState:
    response = model.invoke(
        f"""
You are the Project Manager of CodeForge AI.

Analyze the following software requirement:

{state["user_request"]}

Break the requirement into a clear, concise list of functional requirements.
Do not write code.

Return only the functional requirements.
"""
    )

    state["requirements"] = str(response.text)
    state["current_agent"] = "project_manager"
    state["status"] = "manager_completed"

    return state