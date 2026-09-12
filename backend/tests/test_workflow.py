from app.graph.workflow import (
    MAX_ITERATIONS,
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

