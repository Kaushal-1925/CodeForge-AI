from app.graph.workflow import build_graph


def main() -> None:
    graph = build_graph()

    initial_state = {
    "user_request": "Build a todo application where users can create, edit, delete, and mark tasks as completed.",
    "requirements": "",
    "architecture": "",
    "current_agent": "",
    "status": "started",
}

    final_state = graph.invoke(initial_state)

    print("Final state:")
    print(final_state)


if __name__ == "__main__":
    main()

