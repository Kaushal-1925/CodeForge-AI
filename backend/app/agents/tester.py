from pathlib import Path

from app.graph.state import CodeForgeState
from app.services.test_runner import run_tests


def tester_agent(state: CodeForgeState) -> CodeForgeState:
    workspace = Path(state["workspace"])

    results = run_tests(workspace)

    state["test_results"] = results
    state["current_agent"] = "tester"

    if results["status"] == "passed":
        state["status"] = "tests_passed"
    else:
        state["status"] = "tests_failed"

    return state

