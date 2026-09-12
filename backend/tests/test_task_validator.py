from app.services.task_validator import validate_tasks


def test_valid_tasks_pass():
    tasks = [
        (
            "Create Task model\n\n"
            "Implement the Task SQLAlchemy model using the existing Base."
        ),
        (
            "Create Task API\n\n"
            "Implement CRUD endpoints using the existing FastAPI application."
        ),
    ]

    assert validate_tasks(tasks) == []


def test_empty_task_list_fails():
    errors = validate_tasks([])

    assert errors == ["No tasks were generated."]


def test_sqlite_task_fails():
    tasks = [
        "Create SQLite test database."
    ]

    errors = validate_tasks(tasks)

    assert "SQLite is not allowed. CodeForge uses PostgreSQL." in errors[0]


def test_asyncpg_task_fails():
    tasks = [
        "Configure the database using asyncpg."
    ]

    errors = validate_tasks(tasks)

    assert "asyncpg is not allowed. CodeForge uses psycopg." in errors[0]


def test_python_dotenv_task_fails():
    tasks = [
        "Install python-dotenv and create a .env loader."
    ]

    errors = validate_tasks(tasks)

    assert any(
        "python-dotenv is not allowed" in error
        for error in errors
    )


def test_new_database_infrastructure_fails():
    tasks = [
        "Create app/db/base.py using declarative_base()."
    ]

    errors = validate_tasks(tasks)

    assert any(
        "app/db/" in error
        for error in errors
    )

    assert any(
        "declarative_base()" in error
        for error in errors
    )
