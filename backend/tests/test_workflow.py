from app.graph.workflow import (
    MAX_ITERATIONS,
    architecture_validation_agent,
    increment_iteration,
    test_router,
    validation_router,
)


def test_validation_router_passes_when_no_errors():
    state = {
        "validation_errors": [],
    }

    assert validation_router(state) == "passed"


def test_validation_router_fails_when_errors_exist():
    state = {
        "validation_errors": ["Invalid generated file"],
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
    assert result["status"] == "architecture_validation_passed"
    assert result["current_agent"] == "architecture_validator"


def test_architecture_validation_fails_for_invalid_architecture():
    state = {
        "architecture": """
        Backend: Flask
        Database: SQLite
        Driver: asyncpg
        """
    }

    result = architecture_validation_agent(state)

    assert "SQLite is not allowed. CodeForge uses PostgreSQL." in result[
        "validation_errors"
    ]

    assert "asyncpg is not allowed. Use the existing psycopg driver." in result[
        "validation_errors"
    ]

    assert (
        "Flask is not allowed. The approved backend framework is FastAPI."
        in result["validation_errors"]
    )

    assert result["status"] == "architecture_validation_failed"
    assert result["current_agent"] == "architecture_validator"


def test_test_router_passes_when_tests_pass():
    state = {
        "test_results": {"status": "passed"},
        "iteration": 1,
    }

    assert test_router(state) == "passed"


def test_test_router_retries_when_tests_fail():
    state = {
        "test_results": {
            "status": "failed",
            "stdout": "1 failed",
        },
        "iteration": 1,
    }

    assert test_router(state) == "failed"


def test_test_router_stops_at_max_iterations():
    state = {
        "test_results": {
            "status": "failed",
        },
        "iteration": MAX_ITERATIONS,
    }

    assert test_router(state) == "max_iterations"


def test_increment_iteration():
    state = {
        "iteration": 0,
    }

    result = increment_iteration(state)

    assert result["iteration"] == 1