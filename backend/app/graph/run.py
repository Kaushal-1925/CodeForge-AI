from pathlib import Path

from app.graph.workflow import build_graph


def main() -> None:
    graph = build_graph()

    workspace = Path("sandbox/runs/test-run")
    workspace.mkdir(parents=True, exist_ok=True)

    initial_state = {
        "workspace": str(workspace),
        "user_request": (
            "Build a todo application where users can create, edit, "
            "delete, and mark tasks as completed."
        ),
        "requirements": "",
"architecture": "",
"tasks": [],
"current_task_index": 0,
"current_task": """
Implement the SQLAlchemy Task model for the todo application.

The Task model MUST:
- inherit from app.database.base.Base
- use the existing SQLAlchemy setup
- have an integer primary key id
- have a required title
- have an optional description
- have an optional due_date
- have a priority field stored as a string
- have priority default to "medium"
- have a boolean completed field
- have completed default to False
- have created_at
- have updated_at

Generate ONLY:
backend/app/models/task.py

Do not generate schemas, tests, API routes, services, frontend code,
migrations, or configuration.
""",
        "files": {},
        "validation_errors": [],
        "test_results": {},
        "current_agent": "",
        "status": "started",
        "iteration": 0,
        "retry_count": 0,
    }

    final_state = graph.invoke(initial_state)

    print("Final state:")
    print(final_state)


if __name__ == "__main__":
    main()