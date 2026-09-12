from app.services.architecture_validator import validate_architecture


def test_valid_architecture_passes():
    architecture = """
    Backend: FastAPI
    Database: PostgreSQL
    ORM: SQLAlchemy
    Driver: psycopg
    Frontend: Next.js with TypeScript
    Testing: pytest
    """

    assert validate_architecture(architecture) == []


def test_sqlite_is_rejected():
    architecture = """
    Backend: FastAPI
    Database: SQLite
    """

    errors = validate_architecture(architecture)

    assert any("SQLite" in error for error in errors)


def test_database_py_is_rejected():
    architecture = """
    Backend:
    - database.py
    - main.py
    """

    errors = validate_architecture(architecture)

    assert any("database.py" in error for error in errors)


def test_db_session_is_rejected():
    architecture = """
    Database:
    - db/session.py
    """

    errors = validate_architecture(architecture)

    assert any("db/session.py" in error for error in errors)


def test_asyncpg_is_rejected():
    architecture = """
    Database: PostgreSQL
    Driver: asyncpg
    """

    errors = validate_architecture(architecture)

    assert any("asyncpg" in error for error in errors)


def test_flask_is_rejected():
    architecture = """
    Backend framework: Flask
    """

    errors = validate_architecture(architecture)

    assert any("Flask" in error for error in errors)


def test_django_is_rejected():
    architecture = """
    Backend framework: Django
    """

    errors = validate_architecture(architecture)

    assert any("Django" in error for error in errors)


def test_empty_architecture_is_rejected():
    assert validate_architecture("") == ["Architecture is empty."]
