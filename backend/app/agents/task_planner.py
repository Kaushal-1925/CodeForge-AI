import json

from pydantic import ValidationError

from app.graph.state import CodeForgeState
from app.schemas.task import TaskPlan
from app.services.llm import create_llm


model = create_llm()


PLANNER_PROMPT = """
You are the Task Planner of CodeForge AI.

Create a precise, ordered implementation plan for the requested
software project.

USER REQUEST:
{user_request}

FUNCTIONAL REQUIREMENTS:
{requirements}

APPROVED ARCHITECTURE:
{architecture}

EXISTING CODEFORGE PROJECT:

The following infrastructure already exists and is authoritative:

- backend/app/main.py
- backend/app/config.py
- backend/app/database/base.py
- backend/app/database/session.py
- backend/app/database/dependencies.py
- backend/app/models/
- backend/app/schemas/
- backend/app/api/
- backend/app/services/
- backend/tests/

Do NOT create tasks that recreate existing infrastructure.

Do NOT create tasks for:

- another FastAPI application
- another SQLAlchemy Base
- database.py
- app/db/
- a new database/session system
- python-dotenv
- .env
- SQLite
- asyncpg
- asynchronous SQLAlchemy infrastructure
- a new Python project
- replacing the existing configuration system
- replacing the existing database system
- Docker unless explicitly required
- authentication unless explicitly required
- deployment unless explicitly required
- documentation unless explicitly required

APPROVED TECHNOLOGY:

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy 2.x
- psycopg
- pydantic-settings
- pytest

TASK RULES:

1. Create ONLY tasks required by the user request.
2. Every task must directly contribute to a functional requirement.
3. Order tasks according to dependencies.
4. Each task must be small enough for ONE Developer implementation step.
5. Do not combine unrelated implementation tasks.
6. Reuse existing infrastructure.
7. If an existing file must be modified, explicitly identify it.
8. Do not invent requirements.
9. Do not write implementation code.
10. Return ONLY valid JSON.

The JSON must have exactly this structure:

{{
  "tasks": [
    {{
      "title": "short task name",
      "description": "precise implementation instructions"
    }}
  ]
}}

Before returning the JSON, verify that no task recreates existing
infrastructure or introduces forbidden technologies.
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


def _response_to_task_plan(response: object) -> TaskPlan:
    """
    Convert either a structured response or a normal text response
    into the validated TaskPlan schema.

    Real ChatGroq responses are expected to contain JSON text.

    Existing unit-test mocks return an object with a `tasks`
    attribute, so those responses are converted directly.
    """

    if hasattr(response, "tasks"):
        tasks = []

        for task in response.tasks:
            if hasattr(task, "model_dump"):
                tasks.append(task.model_dump())
            else:
                tasks.append(
                    {
                        "title": task.title,
                        "description": task.description,
                    }
                )

        return TaskPlan.model_validate({"tasks": tasks})

    content = getattr(response, "content", None)

    if content is None:
        raise TypeError(
            "Task planner model response contains neither "
            "'tasks' nor 'content'."
        )

    content = str(content).strip()

    data = json.loads(content)

    return TaskPlan.model_validate(data)


def task_planner_agent(
    state: CodeForgeState,
) -> CodeForgeState:
    prompt = PLANNER_PROMPT.format(
        user_request=state["user_request"],
        requirements=state["requirements"],
        architecture=state["architecture"],
    )

    try:
        response = model.invoke(prompt)

        task_plan = _response_to_task_plan(response)

        return _apply_task_plan(
            state,
            task_plan,
        )

    except (
        json.JSONDecodeError,
        ValidationError,
        TypeError,
        AttributeError,
    ) as error:
        state["tasks"] = []
        state["current_task_index"] = 0
        state["current_task"] = ""
        state["current_agent"] = "task_planner"
        state["status"] = "task_planning_failed"
        state["validation_errors"] = [
            "Task planning failed.",
            str(error),
        ]

        return state


task_planner_agent.__test__ = False