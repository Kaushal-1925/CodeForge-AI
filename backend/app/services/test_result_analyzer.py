import re
from typing import Final

ERROR_PATTERNS: Final[list[tuple[str, str]]] = [
    (
        "ModuleNotFoundError",
        "missing_dependency_or_module",
    ),
    (
        "ImportError",
        "import_error",
    ),
    (
        "SyntaxError",
        "syntax_error",
    ),
    (
        "AssertionError",
        "assertion_failure",
    ),
    (
        "TypeError",
        "type_error",
    ),
    (
        "NameError",
        "name_error",
    ),
    (
        "AttributeError",
        "attribute_error",
    ),
    (
        "KeyError",
        "key_error",
    ),
    (
        "ValueError",
        "value_error",
    ),
    (
        "Timeout",
        "timeout",
    ),
]


def analyze_test_results(
    test_results: dict[str, object],
) -> dict[str, object]:
    status = str(test_results.get("status", "unknown"))
    stdout = str(test_results.get("stdout", ""))
    stderr = str(test_results.get("stderr", ""))

    combined_output = f"{stdout}\n{stderr}"

    if status == "passed":
        return {
            "status": "passed",
            "failure_type": None,
            "summary": "All tests passed.",
            "details": "",
        }

    if status == "timeout":
        return {
            "status": "failed",
            "failure_type": "timeout",
            "summary": "Test execution exceeded the allowed timeout.",
            "details": combined_output.strip(),
        }

    failure_type = "unknown_failure"

    for pattern, category in ERROR_PATTERNS:
        if re.search(rf"\b{re.escape(pattern)}\b", combined_output):
            failure_type = category
            break

    summary = "Generated project tests failed."

    if failure_type == "missing_dependency_or_module":
        summary = "A required Python module could not be imported."
    elif failure_type == "import_error":
        summary = "A Python import failed."
    elif failure_type == "syntax_error":
        summary = "Generated Python code contains a syntax error."
    elif failure_type == "assertion_failure":
        summary = "A test assertion failed."
    elif failure_type == "type_error":
        summary = "Generated code raised a TypeError."
    elif failure_type == "name_error":
        summary = "Generated code referenced an undefined name."
    elif failure_type == "attribute_error":
        summary = "Generated code accessed an unavailable attribute."
    elif failure_type == "key_error":
        summary = "Generated code accessed a missing dictionary key."
    elif failure_type == "value_error":
        summary = "Generated code received an invalid value."

    return {
        "status": "failed",
        "failure_type": failure_type,
        "summary": summary,
        "details": combined_output.strip(),
    }
