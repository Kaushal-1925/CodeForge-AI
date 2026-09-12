import json

from langchain_groq import ChatGroq
from pydantic import ValidationError

from app.config import settings
from app.graph.state import CodeForgeState
from app.schemas.task import TaskPlan


model = ChatGroq(
    model="openai/gpt-oss-20b",
    api_key=settings.groq_api_key,
)


PLANNER_PROMPT = """
You are the Task Planner of CodeForge AI.

Create a precise, ordered implementation plan for the requested
software project.

==================================================
USER REQUEST
==================================================

{user_request}

==================================================
FUNCTIONAL REQUIREMENTS
==================================================

{requirements}

==================================================
APPROVED ARCHITECTURE
==================================================

{architecture}

==================================================
EXISTING CODEFORGE PROJECT
==================================================

The project already contains:

backend/app/main.py
backend/app/config.py
backend/app/database/base.py
backend/app/database/session.py
backend/app/database/dependencies.py
backend/app/models/
backend/app/schemas/
backend/app/api/
backend/app/services/
backend/tests/

The existing infrastructure is AUTHORITATIVE.

==================================================
CRITICAL RULE
==================================================

The Developer will implement your tasks inside the EXISTING
CodeForge project.

NEVER create tasks that rebuild existing infrastructure.

DO NOT create tasks for:

- creating a new FastAPI application
- creating another FastAPI app instance
- creating database.py
- creating another SQLAlchemy Base
- creating app/db/
- creating a new database/session system
- installing python-dotenv
- creating or modifying .env
- creating a new Python project
- replacing the existing configuration system
- replacing the existing database system
- switching synchronous SQLAlchemy to asynchronous SQLAlchemy
- introducing asyncpg
- introducing SQLite
- recreating existing project infrastructure

Use the existing infrastructure instead.

==================================================
APPROVED TECHNOLOGY
==================================================

Backend: Python + FastAPI
Database: PostgreSQL
ORM: SQLAlchemy 2.x
Database driver: psycopg
Configuration: pydantic-settings
Testing: pytest
Frontend: Next.js + TypeScript

==================================================
TASK RULES
==================================================

1. Create ONLY tasks required by the user request.

2. Every task must directly contribute to a functional requirement.

3. Order tasks according to dependencies.

4. Each task must be small enough for ONE Developer implementation
   step.

5. Do not combine unrelated implementation tasks.

6. Reuse existing infrastructure.

7. If an existing file must be modified, explicitly identify it.

8. Do not invent requirements.

9. Do not add authentication, payments, notifications, deployment,
   Docker, documentation, or other functionality unless explicitly
   required.

10. Do not create setup tasks for technologies already configured.

11. Do not write implementation code.

12. Return ONLY the task plan.

Each task must contain:
- title: short task name
- description: precise implementation instructions

==================================================
FINAL CHECK
==================================================

Before returning the plan, verify that no task:

- recreates existing infrastructure
- introduces SQLite
- introduces asyncpg
- introduces python-dotenv
- creates another SQLAlchemy Base
- creates app/db/
- creates another FastAPI application
- modifies .env
"""


FALLBACK_PROMPT = """
You are the Task Planner of CodeForge AI.

Create an ordered implementation plan for this software project.

USER REQUEST:
{user_request}

FUNCTIONAL REQUIREMENTS:
{requirements}

APPROVED ARCHITECTURE:
{architecture}

EXISTING PROJECT:
- backend/app/main.py already exists
- backend/app/config.py already exists
- backend/app/database/base.py already exists
- backend/app/database/session.py already exists
- backend/app/database/dependencies.py already exists
- backend/app/models/ already exists
- backend/app/schemas/ already exists
- backend/app/api/ already exists
- backend/app/services/ already exists
- backend/tests/ already exists

IMPORTANT:
Do NOT recreate existing infrastructure.

Do NOT create:
- another FastAPI application
- database.py
- another SQLAlchemy Base
- app/db/
- python-dotenv
- .env
- SQLite
- asyncpg
- asynchronous SQLAlchemy infrastructure
- a new Python project

Use:
- FastAPI
- PostgreSQL
- SQLAlchemy 2.x
- psycopg
- pydantic-settings
- pytest

Create only tasks required by the user's request.

Each task must have:
- title
- description

Return ONLY valid JSON.

The JSON must have exactly this structure:

{{
  "tasks": [
    {{
      "title": "short task name",
      "description": "precise implementation instructions"
    }}
  ]
}}
"""


def _build_tasks(task_plan: TaskPlan) -> list[str]:
    return [
        f"{task.title}\n\n{task.description}"
        for task in task_plan.tasks
    ]


def _apply_task_plan(
    state: CodeForgeState,
    task_plan: TaskPlan,
) -> CodeForgeState:
    state["tasks"] = _build_tasks(task_plan)
    state["current_task_index"] = 0

    if state["tasks"]:
        state["current_task"] = state["tasks"][0]
        state["status"] = "task_planning_completed"
    else:
        state["current_task"] = ""
        state["status"] = "task_planning_failed"

    state["current_agent"] = "task_planner"

    return state


def task_planner_agent(state: CodeForgeState) -> CodeForgeState:
    prompt = PLANNER_PROMPT.format(
        user_request=state["user_request"],
        requirements=state["requirements"],
        architecture=state["architecture"],
    )

    try:
        response = model.with_structured_output(
            TaskPlan
        ).invoke(prompt)

        return _apply_task_plan(state, response)

    except Exception as structured_error:
        fallback_prompt = FALLBACK_PROMPT.format(
            user_request=state["user_request"],
            requirements=state["requirements"],
            architecture=state["architecture"],
        )

        try:
            response = model.invoke(fallback_prompt)

            content = str(response.content).strip()
            data = json.loads(content)

            task_plan = TaskPlan.model_validate(data)

            return _apply_task_plan(state, task_plan)

        except (json.JSONDecodeError, ValidationError, TypeError) as fallback_error:
            state["tasks"] = []
            state["current_task_index"] = 0
            state["current_task"] = ""
            state["current_agent"] = "task_planner"
            state["status"] = "task_planning_failed"
            state["validation_errors"] = [
                "Structured task planning failed.",
                str(structured_error),
                "Fallback task planning failed.",
                str(fallback_error),
            ]

            return state