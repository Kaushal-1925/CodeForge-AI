from pathlib import Path

from app.agents.tester import tester_agent


def test_tester_stores_structured_pass_result(monkeypatch, tmp_path: Path):
    def fake_run_tests(workspace: Path) -> dict[str, object]:
        return {
            "status": "passed",
            "exit_code": 0,
            "stdout": "2 passed",
            "stderr": "",
        }

    monkeypatch.setattr("app.agents.tester.run_tests", fake_run_tests)

    state = {
        "user_request": "Create a test project",
        "requirements": "",
        "architecture": "",
        "tasks": [],
        "current_task_index": 0,
        "current_task": "",
        "files": {},
        "validation_errors": [],
        "workspace": str(tmp_path),
        "test_results": {},
        "current_agent": "",
        "status": "",
        "iteration": 0,
        "retry_count": 0,
    }

    result = tester_agent(state)

    assert result["status"] == "tests_passed"
    assert result["test_results"]["status"] == "passed"
    assert result["test_results"]["failure_type"] is None
    assert result["test_results"]["summary"] == "All tests passed."


def test_tester_stores_structured_failure(monkeypatch, tmp_path: Path):
    def fake_run_tests(workspace: Path) -> dict[str, object]:
        return {
            "status": "failed",
            "exit_code": 1,
            "stdout": "AssertionError: expected 2 but got 1",
            "stderr": "",
        }

    monkeypatch.setattr("app.agents.tester.run_tests", fake_run_tests)

    state = {
        "user_request": "Create a test project",
        "requirements": "",
        "architecture": "",
        "tasks": [],
        "current_task_index": 0,
        "current_task": "",
        "files": {},
        "validation_errors": [],
        "workspace": str(tmp_path),
        "test_results": {},
        "current_agent": "",
        "status": "",
        "iteration": 0,
    }

    result = tester_agent(state)

    assert result["status"] == "tests_failed"
    assert result["test_results"]["failure_type"] == "assertion_failure"
    assert result["test_results"]["summary"] == "A test assertion failed."
