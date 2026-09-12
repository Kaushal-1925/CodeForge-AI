from app.services.task_progression import advance_to_next_task


def make_state():
    return {
        "user_request": "Build a todo application.",
        "requirements": "Users can manage tasks.",
        "architecture": "FastAPI + PostgreSQL",
        "tasks": [
            "Create Task model\n\nImplement the Task model.",
            "Create Task API\n\nImplement the Task API.",
            "Create Task tests\n\nImplement the Task tests.",
        ],
        "current_task_index": 0,
        "current_task": (
            "Create Task model\n\n"
            "Implement the Task model."
        ),
        "files": {},
        "validation_errors": [],
        "workspace": "sandbox/test-run",
        "test_results": {},
        "current_agent": "tester",
        "status": "tests_passed",
        "iteration": 0,
    }


def test_advance_to_next_task():
    state = make_state()

    result = advance_to_next_task(state)

    assert result["current_task_index"] == 1

    assert result["current_task"] == (
        "Create Task API\n\n"
        "Implement the Task API."
    )

    assert result["status"] == "next_task_ready"

    assert result["current_agent"] == "task_progression"


def test_advance_to_final_task():
    state = make_state()
    state["current_task_index"] = 1
    state["current_task"] = state["tasks"][1]

    result = advance_to_next_task(state)

    assert result["current_task_index"] == 2

    assert result["current_task"] == (
        "Create Task tests\n\n"
        "Implement the Task tests."
    )

    assert result["status"] == "next_task_ready"


def test_all_tasks_completed():
    state = make_state()
    state["current_task_index"] = 2
    state["current_task"] = state["tasks"][2]

    result = advance_to_next_task(state)

    assert result["current_task_index"] == 3
    assert result["current_task"] == ""
    assert result["status"] == "all_tasks_completed"
    assert result["current_agent"] == "task_progression"
