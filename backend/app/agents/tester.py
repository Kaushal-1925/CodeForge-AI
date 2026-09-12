from pathlib import Path

from app.graph.state import CodeForgeState
from app.services.test_result_analyzer import analyze_test_results
from app.services.test_runner import run_tests


def tester_agent(state: CodeForgeState) -> CodeForgeState:
    workspace = Path(state["workspace"])

    raw_results = run_tests(workspace)

    analyzed_results = analyze_test_results(raw_results)

    state["test_results"] = {
        **raw_results,
        **analyzed_results,
    }

    state["current_agent"] = "tester"

    if analyzed_results["status"] == "passed":
        state["status"] = "tests_passed"
    else:
        state["status"] = "tests_failed"

    return state

tester_agent.__test__ = False