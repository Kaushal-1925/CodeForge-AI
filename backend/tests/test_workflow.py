from pathlib import Path

from app.graph.workflow import (
    MAX_ITERATIONS,
    architecture_validation_agent,
    artifact_validation_agent,
    increment_iteration,
    task_progression_router,
    task_validation_agent,
    test_router,
    validation_router,
)
import app.graph.workflow as workflow_module

def test_artifact_validation_passes_for_valid_artifacts(
    tmp_path: Path,
):
    file_path = (
        tmp_path
        / "backend"
        / "app"
        / "example.py"
    )

    file_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    content = "print('hello')\n"

    file_path.write_text(
        content,
        encoding="utf-8",
    )

    state = {
        "files": {
            "backend/app/example.py": content,
        },
        "workspace": str(tmp_path),
    }

    result = artifact_validation_agent(state)

    assert result["validation_errors"] == []

    assert result["status"] == (
        "artifact_validation_passed"
    )

    assert result["current_agent"] == (
        "artifact_validator"
    )


def test_artifact_validation_fails_for_missing_artifact(
    tmp_path: Path,
):
    state = {
        "files": {
            "backend/app/missing.py": "print('hello')",
        },
        "workspace": str(tmp_path),
    }

    result = artifact_validation_agent(state)

    assert result["status"] == (
        "artifact_validation_failed"
    )

    assert result["current_agent"] == (
        "artifact_validator"
    )

    assert result["validation_errors"] == [
        "Generated artifact was not written: "
        "backend/app/missing.py"
    ]


def test_validation_router_passes_when_no_errors():
    state = {
        "validation_errors": []
    }

    assert validation_router(state) == "passed"


def test_validation_router_fails_when_errors_exist():
    state = {
        "validation_errors": [
            "Invalid generated file"
        ]
    }

    assert validation_router(state) == "failed"


def test_architecture_validation_passes_for_valid_architecture():
    state = {
        "architecture": """
        Backend: FastAPI
        Database: PostgreSQL
        ORM: SQLAlchemy
        Driver: psycopg
        Frontend: Next.js with TypeScript
        Testing: pytest
        """
    }

    result = architecture_validation_agent(state)

    assert result["validation_errors"] == []

    assert result["status"] == (
        "architecture_validation_passed"
    )

    assert result["current_agent"] == (
        "architecture_validator"
    )


def test_architecture_validation_fails_for_invalid_architecture():
    state = {
        "architecture": """
        Backend: Flask
        Database: SQLite
        Driver: asyncpg
        """
    }

    result = architecture_validation_agent(state)

    assert (
        "SQLite is not allowed. CodeForge uses PostgreSQL."
        in result["validation_errors"]
    )

    assert (
        "asyncpg is not allowed. Use the existing psycopg driver."
        in result["validation_errors"]
    )

    assert (
        "Flask is not allowed. The approved backend framework is FastAPI."
        in result["validation_errors"]
    )

    assert result["status"] == (
        "architecture_validation_failed"
    )

    assert result["current_agent"] == (
        "architecture_validator"
    )


def test_task_validation_passes_for_valid_tasks():
    state = {
        "tasks": [
            (
                "Create Task model\n\n"
                "Implement the Task model using the existing Base."
            ),
            (
                "Create Task API\n\n"
                "Implement CRUD endpoints using the existing FastAPI app."
            ),
        ]
    }

    result = task_validation_agent(state)

    assert result["validation_errors"] == []

    assert result["status"] == "task_validation_passed"

    assert result["current_agent"] == "task_validator"


def test_task_validation_fails_for_invalid_tasks():
    state = {
        "tasks": [
            "Create SQLite database using asyncpg."
        ]
    }

    result = task_validation_agent(state)

    assert result["status"] == "task_validation_failed"

    assert result["current_agent"] == "task_validator"

    assert len(result["validation_errors"]) == 2


def test_task_validation_fails_for_empty_tasks():
    state = {
        "tasks": []
    }

    result = task_validation_agent(state)

    assert result["validation_errors"] == [
        "No tasks were generated."
    ]

    assert result["status"] == "task_validation_failed"


def test_test_router_passes_when_tests_pass():
    state = {
        "test_results": {
            "status": "passed"
        },
        "iteration": 1,
        "retry_count": 1,
    }

    assert test_router(state) == "passed"


def test_test_router_retries_when_tests_fail():
    state = {
        "test_results": {
            "status": "failed",
            "stdout": "1 failed",
        },
        "iteration": 1,
        "retry_count": 1,
    }

    assert test_router(state) == "failed"


def test_test_router_stops_at_max_iterations():
    state = {
        "test_results": {
            "status": "failed"
        },
        "iteration": MAX_ITERATIONS,
        "retry_count": MAX_ITERATIONS,
    }

    assert test_router(state) == "max_iterations"


def test_increment_iteration():
    state = {
        "iteration": 0,
        "retry_count": 0,
    }

    result = increment_iteration(state)

    assert result["iteration"] == 1
    assert result["retry_count"] == 1


def test_task_progression_router_moves_to_next_task():
    state = {
        "status": "next_task_ready"
    }

    assert task_progression_router(state) == "next_task"


def test_task_progression_router_ends_when_all_tasks_complete():
    state = {
        "status": "all_tasks_completed"
    }

    assert task_progression_router(state) == "completed"


def test_failed_tests_route_back_to_developer():
    state = {
        "test_results": {
            "status": "failed",
            "failure_type": "assertion_failure",
            "summary": "A test assertion failed.",
        },
        "iteration": 1,
        "retry_count": 1,
    }

    assert test_router(state) == "failed"

    incremented_state = increment_iteration(state)

    assert incremented_state["retry_count"] == 2
    assert incremented_state["iteration"] == 2

    assert test_router(incremented_state) == "failed"


def test_passed_tests_route_to_task_progression():
    state = {
        "test_results": {
            "status": "passed",
            "failure_type": None,
            "summary": "All tests passed.",
        },
        "iteration": 2,
        "retry_count": 1,
    }

    assert test_router(state) == "passed"


def test_failed_tests_stop_after_max_iterations():
    state = {
        "test_results": {
            "status": "failed",
            "failure_type": "assertion_failure",
            "summary": "A test assertion failed.",
        },
        "iteration": MAX_ITERATIONS,
        "retry_count": MAX_ITERATIONS,
    }

    assert test_router(state) == "max_iterations"


def test_test_router_allows_retry_before_max_iterations():
    state = {
        "test_results": {
            "status": "failed",
        },
        "iteration": 4,
        "retry_count": 4,
    }

    assert test_router(state) == "failed"


def test_test_router_stops_exactly_at_max_retries():
    state = {
        "test_results": {
            "status": "failed",
        },
        "iteration": MAX_ITERATIONS,
        "retry_count": MAX_ITERATIONS,
    }

    assert test_router(state) == "max_iterations"


def test_end_to_end_multi_task_workflow(
    tmp_path: Path,
    monkeypatch,
):
    execution_order = []

    tasks = [
        "Implement feature one",
        "Implement feature two",
        "Implement feature three",
    ]

    def mock_manager(state):
        execution_order.append("manager")
        state["requirements"] = "Three features are required."
        state["current_agent"] = "project_manager"
        state["status"] = "manager_completed"
        return state

    def mock_architect(state):
        execution_order.append("architect")
        state["architecture"] = """
        Backend: FastAPI
        Database: PostgreSQL
        ORM: SQLAlchemy
        Driver: psycopg
        Frontend: Next.js with TypeScript
        Testing: pytest
        """
        state["current_agent"] = "architect"
        state["status"] = "architect_completed"
        return state

    def mock_task_planner(state):
        execution_order.append("task_planner")
        state["tasks"] = tasks.copy()
        state["current_task_index"] = 0
        state["current_task"] = tasks[0]
        state["current_agent"] = "task_planner"
        state["status"] = "task_planning_completed"
        return state

    def mock_developer(state):
        execution_order.append(
            f"developer:{state['current_task']}"
        )

        state["files"] = {
            "backend/app/example.py": (
                f"# {state['current_task']}\n"
            )
        }

        state["validation_errors"] = []
        state["current_agent"] = "developer"
        state["status"] = "developer_completed"

        return state

    def mock_validator(state):
        execution_order.append(
            f"validator:{state['current_task']}"
        )

        state["validation_errors"] = []
        state["current_agent"] = "validator"
        state["status"] = "validation_passed"

        return state

    def mock_artifact_writer(state):
        execution_order.append(
            f"artifact_writer:{state['current_task']}"
        )

        file_path = (
            Path(state["workspace"])
            / "backend"
            / "app"
            / "example.py"
        )

        file_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        file_path.write_text(
            state["files"]["backend/app/example.py"],
            encoding="utf-8",
        )

        state["current_agent"] = "artifact_writer"
        state["status"] = "artifacts_written"

        return state

    def mock_tester(state):
        execution_order.append(
            f"tester:{state['current_task']}"
        )

        state["test_results"] = {
            "status": "passed",
            "exit_code": 0,
            "stdout": "All tests passed.",
            "stderr": "",
        }

        state["current_agent"] = "tester"
        state["status"] = "tests_passed"

        return state

    monkeypatch.setattr(
        workflow_module,
        "manager_agent",
        mock_manager,
    )

    monkeypatch.setattr(
        workflow_module,
        "architect_agent",
        mock_architect,
    )

    monkeypatch.setattr(
        workflow_module,
        "task_planner_agent",
        mock_task_planner,
    )

    monkeypatch.setattr(
        workflow_module,
        "developer_agent",
        mock_developer,
    )

    monkeypatch.setattr(
        workflow_module,
        "validator_agent",
        mock_validator,
    )

    monkeypatch.setattr(
        workflow_module,
        "artifact_writer_agent",
        mock_artifact_writer,
    )

    monkeypatch.setattr(
        workflow_module,
        "tester_agent",
        mock_tester,
    )

    graph = workflow_module.build_graph()

    initial_state = {
        "workspace": str(tmp_path),
        "user_request": "Build a three-feature application.",
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
    }

    final_state = graph.invoke(initial_state)

    assert final_state["status"] == "all_tasks_completed"

    assert final_state["current_task"] == ""

    assert final_state["current_task_index"] == 3

    assert final_state["retry_count"] == 0

    assert execution_order == [
        "manager",
        "architect",
        "task_planner",
        "developer:Implement feature one",
        "validator:Implement feature one",
        "artifact_writer:Implement feature one",
        "tester:Implement feature one",
        "developer:Implement feature two",
        "validator:Implement feature two",
        "artifact_writer:Implement feature two",
        "tester:Implement feature two",
        "developer:Implement feature three",
        "validator:Implement feature three",
        "artifact_writer:Implement feature three",
        "tester:Implement feature three",
    ]

    generated_file = (
        tmp_path
        / "backend"
        / "app"
        / "example.py"
    )

    assert generated_file.exists()

    assert (
        "Implement feature three"
        in generated_file.read_text(
            encoding="utf-8"
        )
    )



def test_end_to_end_retry_then_continue_to_next_task(
    tmp_path: Path,
    monkeypatch,
):
    execution_order = []
    tester_calls = 0

    tasks = [
        "Implement feature one",
        "Implement feature two",
    ]

    def mock_manager(state):
        execution_order.append("manager")

        state["requirements"] = (
            "Two features are required."
        )
        state["current_agent"] = "project_manager"
        state["status"] = "manager_completed"

        return state

    def mock_architect(state):
        execution_order.append("architect")

        state["architecture"] = """
        Backend: FastAPI
        Database: PostgreSQL
        ORM: SQLAlchemy
        Driver: psycopg
        Testing: pytest
        """

        state["current_agent"] = "architect"
        state["status"] = "architect_completed"

        return state

    def mock_task_planner(state):
        execution_order.append("task_planner")

        state["tasks"] = tasks.copy()
        state["current_task_index"] = 0
        state["current_task"] = tasks[0]
        state["current_agent"] = "task_planner"
        state["status"] = "task_planning_completed"

        return state

    def mock_developer(state):
        execution_order.append(
            f"developer:{state['current_task']}"
        )

        content = (
            f"# {state['current_task']}\n"
        )

        state["files"] = {
            "backend/app/example.py": content,
        }

        state["validation_errors"] = []
        state["current_agent"] = "developer"
        state["status"] = "developer_completed"

        return state

    def mock_validator(state):
        execution_order.append(
            f"validator:{state['current_task']}"
        )

        state["validation_errors"] = []
        state["current_agent"] = "validator"
        state["status"] = "validation_passed"

        return state

    def mock_artifact_writer(state):
        execution_order.append(
            f"artifact_writer:{state['current_task']}"
        )

        file_path = (
            Path(state["workspace"])
            / "backend"
            / "app"
            / "example.py"
        )

        file_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        file_path.write_text(
            state["files"][
                "backend/app/example.py"
            ],
            encoding="utf-8",
        )

        state["current_agent"] = "artifact_writer"
        state["status"] = "artifacts_written"

        return state

    def mock_tester(state):
        nonlocal tester_calls

        tester_calls += 1

        execution_order.append(
            f"tester:{state['current_task']}"
            f":attempt_{tester_calls}"
        )

        if tester_calls == 1:
            state["test_results"] = {
                "status": "failed",
                "exit_code": 1,
                "stdout": "1 failed",
                "stderr": "AssertionError",
                "failure_type": "assertion_failure",
                "summary": "A test assertion failed.",
            }
            state["current_agent"] = "tester"
            state["status"] = "tests_failed"
            return state

        state["test_results"] = {
            "status": "passed",
            "exit_code": 0,
            "stdout": "All tests passed.",
            "stderr": "",
            "failure_type": None,
            "summary": "All tests passed.",
        }

        state["current_agent"] = "tester"
        state["status"] = "tests_passed"

        return state

    monkeypatch.setattr(
        workflow_module,
        "manager_agent",
        mock_manager,
    )

    monkeypatch.setattr(
        workflow_module,
        "architect_agent",
        mock_architect,
    )

    monkeypatch.setattr(
        workflow_module,
        "task_planner_agent",
        mock_task_planner,
    )

    monkeypatch.setattr(
        workflow_module,
        "developer_agent",
        mock_developer,
    )

    monkeypatch.setattr(
        workflow_module,
        "validator_agent",
        mock_validator,
    )

    monkeypatch.setattr(
        workflow_module,
        "artifact_writer_agent",
        mock_artifact_writer,
    )

    monkeypatch.setattr(
        workflow_module,
        "tester_agent",
        mock_tester,
    )

    graph = workflow_module.build_graph()

    initial_state = {
        "workspace": str(tmp_path),
        "user_request": (
            "Build a two-feature application."
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
    }

    final_state = graph.invoke(
        initial_state
    )

    assert final_state["status"] == (
        "all_tasks_completed"
    )

    assert final_state["current_task"] == ""

    assert final_state["current_task_index"] == 2

    assert final_state["retry_count"] == 0

    assert final_state["iteration"] == 0

    assert execution_order == [
        "manager",
        "architect",
        "task_planner",
        "developer:Implement feature one",
        "validator:Implement feature one",
        "artifact_writer:Implement feature one",
        "tester:Implement feature one:attempt_1",
        "developer:Implement feature one",
        "validator:Implement feature one",
        "artifact_writer:Implement feature one",
        "tester:Implement feature one:attempt_2",
        "developer:Implement feature two",
        "validator:Implement feature two",
        "artifact_writer:Implement feature two",
        "tester:Implement feature two:attempt_3",
    ]

    generated_file = (
        tmp_path
        / "backend"
        / "app"
        / "example.py"
    )

    assert generated_file.exists()

    assert (
        "Implement feature two"
        in generated_file.read_text(
            encoding="utf-8"
        )
    )