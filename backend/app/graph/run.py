from pathlib import Path

from app.graph.workflow import build_graph


def main() -> None:
    graph = build_graph()

    workspace = Path("sandbox/runs/test-run")
    workspace.mkdir(
        parents=True,
        exist_ok=True,
    )

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
        "current_task": "",
        "files": {},
        "validation_errors": [],
        "test_results": {},
        "current_agent": "",
        "status": "started",
        "iteration": 0,
        "retry_count": 0,
        "architecture_retry_count": 0,
    }

    final_state = graph.invoke(initial_state)

    print("Final state:")
    print(final_state)


if __name__ == "__main__":
    main()