from app.graph.state import CodeForgeState
from app.services.llm import create_llm


model = create_llm()


def architect_agent(state: CodeForgeState) -> CodeForgeState:
    validation_errors = state.get(
        "validation_errors",
        [],
    )

    previous_errors = ""

    if validation_errors:
        previous_errors = f"""
The previous architecture was rejected by the
Architecture Validator.

You MUST correct these validation errors:

{chr(10).join(f"- {error}" for error in validation_errors)}

Do not repeat the rejected architecture choices.
"""

    response = model.invoke(
        f"""
You are the Software Architect of CodeForge AI.

The Project Manager has produced these functional requirements:

{state["requirements"]}

Design a practical technical architecture for ONLY
the requirements above.

CodeForge's approved technology stack is:

- Backend: Python + FastAPI
- Database: PostgreSQL
- ORM: SQLAlchemy
- Database driver: psycopg
- Frontend: Next.js + TypeScript
- Testing: pytest
- Containerization: Docker
- Configuration: pydantic-settings

{previous_errors}

Rules:
1. Use only the approved technology stack.
2. Use PostgreSQL as the database.
3. Use SQLAlchemy as the ORM.
4. Use psycopg as the PostgreSQL driver.
5. Use FastAPI for the backend.
6. Do not introduce another programming language or backend framework.
7. Do not introduce asyncpg.
8. Do not introduce SQLite.
9. Do not introduce Flask or Django.
10. Do not create a separate database.py.
11. Do not create another SQLAlchemy Base.
12. Use the existing CodeForge database infrastructure.
13. Do not add authentication, payments, notifications,
    real-time systems, microservices, or other features
    unless explicitly required.
14. Do not invent additional user requirements.
15. Keep the architecture as simple as possible while
    satisfying the requirements.
16. Do not write implementation code.

Return the architecture using exactly these sections:

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