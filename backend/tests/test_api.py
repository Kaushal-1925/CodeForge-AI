from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database.base import Base
from app.database.dependencies import get_db
from app.main import app
from app.models.project import Project
from app.models.workflow_run import WorkflowRun
from app.services import workflow_execution_service


TEST_DATABASE_URL = (
    "postgresql+psycopg://codeforge:codeforge_password"
    "@localhost:5432/codeforge_test"
)


engine = create_engine(
    TEST_DATABASE_URL,
    echo=False,
)


def override_get_db():
    with Session(engine) as db:
        yield db


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def setup_database():
    Base.metadata.create_all(bind=engine)


def teardown_database():
    Base.metadata.drop_all(bind=engine)


def test_health_check():
    setup_database()

    try:
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {
            "status": "ok"
        }

    finally:
        teardown_database()


def test_create_project():
    setup_database()

    try:
        response = client.post(
            "/projects/",
            json={
                "name": "Test Project",
                "description": "A test project.",
            },
        )

        assert response.status_code == 200

        data = response.json()

        assert data["name"] == "Test Project"
        assert data["description"] == "A test project."
        assert data["status"] == "created"
        assert "id" in data

    finally:
        teardown_database()


def test_create_workflow_run():
    setup_database()

    try:
        with Session(engine) as db:
            project = Project(
                name="Workflow API Project",
                description="Project for API testing.",
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            project_id = str(project.id)

        def fake_background_workflow(run_id):
            return None

        original_background_function = (
            workflow_execution_service.run_workflow_in_background
        )

        workflow_execution_service.run_workflow_in_background = (
            fake_background_workflow
        )

        try:
            response = client.post(
                f"/projects/{project_id}/runs",
                json={
                    "user_request": (
                        "Build a todo application."
                    )
                },
            )

        finally:
            workflow_execution_service.run_workflow_in_background = (
                original_background_function
            )

        assert response.status_code == 200

        data = response.json()

        assert data["project_id"] == project_id
        assert data["user_request"] == (
            "Build a todo application."
        )
        assert data["status"] == "started"
        assert data["iteration"] == 0
        assert data["current_agent"] is None
        assert data["current_task"] is None
        assert data["completed_at"] is None

        run_id = data["id"]

        with Session(engine) as db:
            stored_run = db.get(
                WorkflowRun,
                run_id,
            )

            assert stored_run is not None
            assert stored_run.project_id == project.id
            assert stored_run.user_request == (
                "Build a todo application."
            )

    finally:
        teardown_database()


def test_create_workflow_run_rejects_unknown_project():
    setup_database()

    try:
        unknown_project_id = uuid4()

        response = client.post(
            f"/projects/{unknown_project_id}/runs",
            json={
                "user_request": (
                    "Build a todo application."
                )
            },
        )

        assert response.status_code == 404
        assert response.json() == {
            "detail": "Project not found"
        }

    finally:
        teardown_database()


def test_get_workflow_run():
    setup_database()

    try:
        with Session(engine) as db:
            project = Project(
                name="Get Workflow Project",
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            workflow_run = WorkflowRun(
                project_id=project.id,
                user_request="Build a test application.",
                status="developer_completed",
                current_agent="developer",
                current_task="Implement the task model.",
                iteration=1,
            )

            db.add(workflow_run)
            db.commit()
            db.refresh(workflow_run)

            project_id = project.id
            run_id = workflow_run.id

        response = client.get(
            f"/projects/{project_id}/runs/{run_id}"
        )

        assert response.status_code == 200

        data = response.json()

        assert data["id"] == str(run_id)
        assert data["project_id"] == str(project_id)
        assert data["user_request"] == (
            "Build a test application."
        )
        assert data["status"] == "developer_completed"
        assert data["current_agent"] == "developer"
        assert data["current_task"] == (
            "Implement the task model."
        )
        assert data["iteration"] == 1
        assert data["completed_at"] is None

    finally:
        teardown_database()


def test_get_workflow_run_rejects_unknown_run():
    setup_database()

    try:
        with Session(engine) as db:
            project = Project(
                name="Unknown Run Project",
            )

            db.add(project)
            db.commit()
            db.refresh(project)

            project_id = project.id

        unknown_run_id = uuid4()

        response = client.get(
            f"/projects/{project_id}/runs/{unknown_run_id}"
        )

        assert response.status_code == 404
        assert response.json() == {
            "detail": "Workflow run not found"
        }

    finally:
        teardown_database()


def test_get_workflow_run_rejects_run_from_another_project():
    setup_database()

    try:
        with Session(engine) as db:
            project_a = Project(
                name="Project A",
            )

            project_b = Project(
                name="Project B",
            )

            db.add_all(
                [
                    project_a,
                    project_b,
                ]
            )

            db.commit()

            db.refresh(project_a)
            db.refresh(project_b)

            workflow_run = WorkflowRun(
                project_id=project_b.id,
                user_request="Build a private application.",
                status="started",
                iteration=0,
            )

            db.add(workflow_run)
            db.commit()
            db.refresh(workflow_run)

            project_a_id = project_a.id
            run_id = workflow_run.id

        response = client.get(
            f"/projects/{project_a_id}/runs/{run_id}"
        )

        assert response.status_code == 404
        assert response.json() == {
            "detail": "Workflow run not found"
        }

    finally:
        teardown_database()