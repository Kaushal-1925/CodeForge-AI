from types import SimpleNamespace

from app.agents import task_planner


class MockPlannerModel:
    def __init__(self, tasks):
        self.tasks = tasks

    def with_structured_output(self, schema):
        return self

    def invoke(self, prompt):
        task_objects = [
            SimpleNamespace(
                title=task["title"],
                description=task["description"],
                model_dump=lambda task=task: task,
            )
            for task in self.tasks
        ]

        return SimpleNamespace(tasks=task_objects)


def make_state():
    return {
        "user_request": "Build a todo application.",
        "requirements": "Users can create, edit, delete, and complete tasks.",
        "architecture": """
        Backend: FastAPI
        Database: PostgreSQL
        ORM: SQLAlchemy
        Frontend: Next.js with TypeScript
        Testing: pytest
        """,
        "tasks": [],
        "current_task_index": 0,
        "current_task": "",
        "files": {},
        "validation_errors": [],
        "workspace": "sandbox/test-run",
        "test_results": {},
        "current_agent": "",
        "status": "started",
        "iteration": 0,
    }


def test_task_planner_creates_ordered_tasks(monkeypatch):
    mock_tasks = [
        {
            "title": "Create Task model",
            "description": "Implement the SQLAlchemy Task model.",
        },
        {
            "title": "Create Task API",
            "description": "Implement the Task CRUD API endpoints.",
        },
    ]

    monkeypatch.setattr(
        task_planner,
        "model",
        MockPlannerModel(mock_tasks),
    )

    state = make_state()

    result = task_planner.task_planner_agent(state)

    assert len(result["tasks"]) == 2
    assert result["tasks"][0] == ("Create Task model\n\nImplement the SQLAlchemy Task model.")
    assert result["tasks"][1] == ("Create Task API\n\nImplement the Task CRUD API endpoints.")
    assert result["current_task_index"] == 0
    assert result["current_task"] == result["tasks"][0]
    assert result["current_agent"] == "task_planner"
    assert result["status"] == "task_planning_completed"


def test_task_planner_handles_empty_task_list(monkeypatch):
    monkeypatch.setattr(
        task_planner,
        "model",
        MockPlannerModel([]),
    )

    state = make_state()

    result = task_planner.task_planner_agent(state)

    assert result["tasks"] == []
    assert result["current_task_index"] == 0
    assert result["current_task"] == ""
    assert result["current_agent"] == "task_planner"
    assert result["status"] == "task_planning_failed"
