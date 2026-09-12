from app.services.test_result_analyzer import analyze_test_results


def test_passed_results_are_analyzed():
    result = analyze_test_results(
        {
            "status": "passed",
            "stdout": "2 passed",
            "stderr": "",
        }
    )

    assert result["status"] == "passed"
    assert result["failure_type"] is None
    assert result["summary"] == "All tests passed."


def test_assertion_failure_is_detected():
    result = analyze_test_results(
        {
            "status": "failed",
            "stdout": "E AssertionError: expected 2 but got 1",
            "stderr": "",
        }
    )

    assert result["status"] == "failed"
    assert result["failure_type"] == "assertion_failure"


def test_missing_module_is_detected():
    result = analyze_test_results(
        {
            "status": "failed",
            "stdout": "ModuleNotFoundError: No module named 'jwt'",
            "stderr": "",
        }
    )

    assert result["failure_type"] == "missing_dependency_or_module"


def test_syntax_error_is_detected():
    result = analyze_test_results(
        {
            "status": "failed",
            "stdout": "",
            "stderr": "SyntaxError: invalid syntax",
        }
    )

    assert result["failure_type"] == "syntax_error"


def test_timeout_is_detected():
    result = analyze_test_results(
        {
            "status": "timeout",
            "stdout": "",
            "stderr": "",
        }
    )

    assert result["status"] == "failed"
    assert result["failure_type"] == "timeout"
