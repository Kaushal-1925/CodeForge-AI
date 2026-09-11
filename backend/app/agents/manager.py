from langchain_groq import ChatGroq

from app.config import settings
from app.graph.state import CodeForgeState


model = ChatGroq(
    model="openai/gpt-oss-20b",
    api_key=settings.groq_api_key,
)


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

    state["requirements"] = str(response.content)
    state["current_agent"] = "project_manager"
    state["status"] = "manager_completed"

    return state