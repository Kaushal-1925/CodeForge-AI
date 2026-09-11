from langchain_groq import ChatGroq

from app.config import settings
from app.graph.state import CodeForgeState


model = ChatGroq(
    model="openai/gpt-oss-20b",
    api_key=settings.groq_api_key,
)


def architect_agent(state: CodeForgeState) -> CodeForgeState:
    response = model.invoke(
        f"""
You are the Software Architect of CodeForge AI.

The Project Manager has produced these functional requirements:

{state["requirements"]}

Design a practical technical architecture for ONLY the requirements above.

CodeForge's approved technology stack is:

- Backend: Python + FastAPI
- Database: PostgreSQL
- ORM: SQLAlchemy
- Frontend: Next.js + TypeScript
- Testing: pytest
- Containerization: Docker

Rules:
1. Use the approved technology stack.
2. Do not introduce another programming language or backend framework.
3. Do not add authentication, payments, notifications, real-time systems,
   microservices, or other features unless explicitly required.
4. Do not invent additional user requirements.
5. Keep the architecture as simple as possible while satisfying the requirements.
6. Do not write implementation code.

Return the architecture using these sections:

1. Backend
2. Frontend
3. Database
4. API Endpoints
5. Application Components
6. Component Communication
"""
    )

    state["architecture"] = str(response.content)
    state["current_agent"] = "architect"
    state["status"] = "architect_completed"

    return state