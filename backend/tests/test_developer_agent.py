from pathlib import Path

from app.agents.developer import developer_agent


class FakeResponse:
    content = ""
    text = ""


class FakeModel:
    def __init__(self):
        self.prompt = ""

    def invoke(self, prompt: str) -> FakeResponse:
        self.prompt = prompt
        return FakeResponse()


def make_state(tmp_path: Path) -> dict:
    return {
        "user_request": "Create a simple application",
        "requirements": "Create a health endpoint",
        "architecture": "FastAPI application",
        "tasks": ["Create health endpoint"],
        "current_task_index": 0,
        "current_task": "Create health endpoint",
        "files": {},
        "validation_errors": [],
        "workspace": str(tmp_path),
        "test_results": {
            "status": "failed",
            "exit_code": 1,
            "stdout": "AssertionError: expected 200 but got 500",
            "stderr": "",
            "failure_type": "assertion_failure",
            "summary": "A test assertion failed.",
            "details": "Health endpoint returned HTTP 500.",
        },
        "current_agent": "",
        "status": "",
        "iteration": 1,
        "retry_count": 0,
    }


def test_developer_receives_structured_test_feedback(
    monkeypatch,
    tmp_path: Path,
):
    fake_model = FakeModel()

    monkeypatch.setattr(
        "app.agents.developer.model",
        fake_model,
    )

    result = developer_agent(make_state(tmp_path))

    assert result["status"] == "developer_completed"

    assert "assertion_failure" in fake_model.prompt
    assert "A test assertion failed." in fake_model.prompt
    assert "Health endpoint returned HTTP 500." in fake_model.prompt
    assert "AssertionError: expected 200 but got 500" in fake_model.prompt


def test_developer_receives_empty_feedback_on_first_attempt(
    monkeypatch,
    tmp_path: Path,
):
    fake_model = FakeModel()

    monkeypatch.setattr(
        "app.agents.developer.model",
        fake_model,
    )

    state = make_state(tmp_path)
    state["test_results"] = {}

    developer_agent(state)

    assert "Failure type:\nNone" in fake_model.prompt
    assert "Failure summary:\nNone" in fake_model.prompt
