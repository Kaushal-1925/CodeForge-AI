from pathlib import Path
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from pytest import MonkeyPatch
from sqlalchemy.orm import Session, sessionmaker

from app.api import workflow_runs as workflow_runs_api
from app.models.workflow_run import WorkflowRun


def test_health_check(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_and_list_projects(client: TestClient) -> None:
    create_response = client.post(
        "/api/v1/projects",
        json={
            "name": "Test Project",
            "description": "A test project.",
        },
    )

    assert create_response.status_code == 201
    project = create_response.json()
    assert project["name"] == "Test Project"
    assert project["description"] == "A test project."
    assert project["status"] == "created"
    assert "id" in project

    list_response = client.get("/api/v1/projects")

    assert list_response.status_code == 200
    assert list_response.json() == [project]

    get_response = client.get(f"/api/v1/projects/{project['id']}")

    assert get_response.status_code == 200
    assert get_response.json() == project


def test_get_unknown_project_returns_404(client: TestClient) -> None:
    response = client.get(f"/api/v1/projects/{uuid4()}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}


def test_create_and_get_workflow_run(
    client: TestClient,
    monkeypatch: MonkeyPatch,
) -> None:
    project = client.post(
        "/api/v1/projects",
        json={"name": "Workflow Project"},
    ).json()

    monkeypatch.setattr(
        workflow_runs_api,
        "run_workflow_in_background",
        lambda run_id: None,
    )

    create_response = client.post(
        f"/api/v1/projects/{project['id']}/runs",
        json={"user_request": "Build a todo application."},
    )

    assert create_response.status_code == 201
    workflow_run = create_response.json()
    assert workflow_run["project_id"] == project["id"]
    assert workflow_run["user_request"] == "Build a todo application."
    assert workflow_run["status"] == "started"
    assert workflow_run["iteration"] == 0
    assert workflow_run["current_agent"] is None
    assert workflow_run["current_task"] is None
    assert workflow_run["completed_at"] is None

    get_response = client.get(f"/api/v1/projects/{project['id']}/runs/{workflow_run['id']}")

    assert get_response.status_code == 200
    assert get_response.json() == workflow_run

    list_response = client.get(f"/api/v1/projects/{project['id']}/runs")

    assert list_response.status_code == 200
    assert list_response.json() == [workflow_run]


def test_create_workflow_run_rejects_unknown_project(
    client: TestClient,
) -> None:
    response = client.post(
        f"/api/v1/projects/{uuid4()}/runs",
        json={"user_request": "Build a todo application."},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}


def test_workflow_run_is_scoped_to_project(
    client: TestClient,
    session_factory: sessionmaker[Session],
) -> None:
    project_a = client.post(
        "/api/v1/projects",
        json={"name": "Project A"},
    ).json()
    project_b = client.post(
        "/api/v1/projects",
        json={"name": "Project B"},
    ).json()

    with session_factory() as session:
        workflow_run = WorkflowRun(
            project_id=UUID(project_b["id"]),
            user_request="Build a private application.",
            status="started",
            iteration=0,
        )
        session.add(workflow_run)
        session.commit()
        session.refresh(workflow_run)
        run_id = workflow_run.id

    response = client.get(f"/api/v1/projects/{project_a['id']}/runs/{run_id}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Workflow run not found"}


def test_artifacts_are_read_from_run_workspace(
    client: TestClient,
    monkeypatch: MonkeyPatch,
    tmp_path: Path,
) -> None:
    project = client.post(
        "/api/v1/projects",
        json={"name": "Artifact Project"},
    ).json()

    monkeypatch.setattr(
        workflow_runs_api,
        "run_workflow_in_background",
        lambda run_id: None,
    )

    workflow_run = client.post(
        f"/api/v1/projects/{project['id']}/runs",
        json={"user_request": "Build an artifact project."},
    ).json()

    workspace = tmp_path / "runs" / workflow_run["id"]
    artifact = workspace / "backend" / "app" / "main.py"
    artifact.parent.mkdir(parents=True)
    artifact.write_text("print('hello')\n", encoding="utf-8")

    monkeypatch.setattr(
        workflow_runs_api,
        "WORKFLOW_RUNS_DIRECTORY",
        tmp_path / "runs",
    )

    response = client.get(f"/api/v1/projects/{project['id']}/runs/{workflow_run['id']}/artifacts")

    assert response.status_code == 200
    assert response.json() == {
        "run_id": workflow_run["id"],
        "files": [
            {
                "path": "backend/app/main.py",
                "content": "print('hello')\n",
            }
        ],
    }


def test_approve_completed_workflow_run(
    client: TestClient,
    monkeypatch: MonkeyPatch,
    session_factory: sessionmaker[Session],
) -> None:
    project = client.post(
        "/api/v1/projects",
        json={"name": "Approval Project"},
    ).json()

    monkeypatch.setattr(
        workflow_runs_api,
        "run_workflow_in_background",
        lambda run_id: None,
    )

    workflow_run = client.post(
        f"/api/v1/projects/{project['id']}/runs",
        json={"user_request": "Build an approval project."},
    ).json()

    with session_factory() as session:
        completed_run = session.get(WorkflowRun, UUID(workflow_run["id"]))
        assert completed_run is not None
        completed_run.status = "completed"
        session.commit()

    response = client.patch(
        f"/api/v1/projects/{project['id']}/runs/{workflow_run['id']}/approval",
        json={"approval_status": "approved"},
    )

    assert response.status_code == 200
    approved_run = response.json()
    assert approved_run["approval_status"] == "approved"
    assert approved_run["status"] == "completed"

    get_response = client.get(f"/api/v1/projects/{project['id']}/runs/{workflow_run['id']}")

    assert get_response.status_code == 200
    assert get_response.json()["approval_status"] == "approved"


def test_reject_completed_workflow_run(
    client: TestClient,
    monkeypatch: MonkeyPatch,
    session_factory: sessionmaker[Session],
) -> None:
    project = client.post(
        "/api/v1/projects",
        json={"name": "Rejection Project"},
    ).json()

    monkeypatch.setattr(
        workflow_runs_api,
        "run_workflow_in_background",
        lambda run_id: None,
    )

    workflow_run = client.post(
        f"/api/v1/projects/{project['id']}/runs",
        json={"user_request": "Build a rejection project."},
    ).json()

    with session_factory() as session:
        completed_run = session.get(WorkflowRun, UUID(workflow_run["id"]))
        assert completed_run is not None
        completed_run.status = "completed"
        session.commit()

    response = client.patch(
        f"/api/v1/projects/{project['id']}/runs/{workflow_run['id']}/approval",
        json={"approval_status": "rejected"},
    )

    assert response.status_code == 200
    assert response.json()["approval_status"] == "rejected"


def test_workflow_run_approval_requires_completed_run(
    client: TestClient,
    monkeypatch: MonkeyPatch,
) -> None:
    project = client.post(
        "/api/v1/projects",
        json={"name": "Incomplete Approval Project"},
    ).json()

    monkeypatch.setattr(
        workflow_runs_api,
        "run_workflow_in_background",
        lambda run_id: None,
    )

    workflow_run = client.post(
        f"/api/v1/projects/{project['id']}/runs",
        json={"user_request": "Build an incomplete approval project."},
    ).json()

    response = client.patch(
        f"/api/v1/projects/{project['id']}/runs/{workflow_run['id']}/approval",
        json={"approval_status": "approved"},
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "Only completed workflow runs can be approved or rejected"}


def test_workflow_run_approval_rejects_invalid_status(
    client: TestClient,
    monkeypatch: MonkeyPatch,
    session_factory: sessionmaker[Session],
) -> None:
    project = client.post(
        "/api/v1/projects",
        json={"name": "Invalid Approval Project"},
    ).json()

    monkeypatch.setattr(
        workflow_runs_api,
        "run_workflow_in_background",
        lambda run_id: None,
    )

    workflow_run = client.post(
        f"/api/v1/projects/{project['id']}/runs",
        json={"user_request": "Build an invalid approval project."},
    ).json()

    with session_factory() as session:
        completed_run = session.get(WorkflowRun, UUID(workflow_run["id"]))
        assert completed_run is not None
        completed_run.status = "completed"
        session.commit()

    response = client.patch(
        f"/api/v1/projects/{project['id']}/runs/{workflow_run['id']}/approval",
        json={"approval_status": "maybe"},
    )

    assert response.status_code == 422
