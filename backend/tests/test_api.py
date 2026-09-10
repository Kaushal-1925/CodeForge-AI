def test_health_check(client) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_project(client) -> None:
    response = client.post(
        "/projects",
        json={
            "name": "Test Project",
            "description": "Created during automated testing",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Test Project"
    assert data["description"] == "Created during automated testing"
    assert data["status"] == "created"
    assert "id" in data


def test_get_project(client) -> None:
    create_response = client.post(
        "/projects",
        json={
            "name": "Project To Retrieve",
            "description": "Testing GET endpoint",
        },
    )

    assert create_response.status_code == 200

    project_id = create_response.json()["id"]

    response = client.get(f"/projects/{project_id}")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == project_id
    assert data["name"] == "Project To Retrieve"
    assert data["description"] == "Testing GET endpoint"
    assert data["status"] == "created"
