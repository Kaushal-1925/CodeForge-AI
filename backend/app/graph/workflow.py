from langgraph.graph import END, START, StateGraph

from app.agents.architect import architect_agent
from app.agents.artifact_writer import artifact_writer_agent
from app.agents.developer import developer_agent
from app.agents.manager import manager_agent
from app.agents.task_planner import task_planner_agent
from app.agents.tester import tester_agent
from app.agents.validator import validator_agent
from app.graph.state import CodeForgeState
from app.services.architecture_validator import validate_architecture
from app.services.artifact_validator import validate_written_artifacts
from app.services.task_progression import advance_to_next_task
from app.services.task_validator import validate_tasks


MAX_ITERATIONS = 5


def validation_router(state: CodeForgeState) -> str:
    if state["validation_errors"]:
        return "failed"

    return "passed"


def architecture_validation_agent(
    state: CodeForgeState,
) -> CodeForgeState:
    errors = validate_architecture(
        state["architecture"]
    )

    state["validation_errors"] = errors
    state["current_agent"] = "architecture_validator"

    if errors:
        state["status"] = "architecture_validation_failed"
    else:
        state["status"] = "architecture_validation_passed"

    return state


def task_validation_agent(
    state: CodeForgeState,
) -> CodeForgeState:
    errors = validate_tasks(
        state["tasks"]
    )

    state["validation_errors"] = errors
    state["current_agent"] = "task_validator"

    if errors:
        state["status"] = "task_validation_failed"
    else:
        state["status"] = "task_validation_passed"

    return state


def artifact_validation_agent(
    state: CodeForgeState,
) -> CodeForgeState:
    from pathlib import Path

    errors = validate_written_artifacts(
        state["files"],
        Path(state["workspace"]),
    )

    state["validation_errors"] = errors
    state["current_agent"] = "artifact_validator"

    if errors:
        state["status"] = "artifact_validation_failed"
    else:
        state["status"] = "artifact_validation_passed"

    return state


def task_progression_router(
    state: CodeForgeState,
) -> str:
    if state["status"] == "all_tasks_completed":
        return "completed"

    return "next_task"


def test_router(state: CodeForgeState) -> str:
    test_results = state["test_results"]

    if test_results.get("status") == "passed":
        return "passed"

    if state["iteration"] >= MAX_ITERATIONS:
        return "max_iterations"

    return "failed"


test_router.__test__ = False


def increment_iteration(
    state: CodeForgeState,
) -> CodeForgeState:
    state["iteration"] += 1
    return state


def build_graph():
    graph = StateGraph(CodeForgeState)

    graph.add_node(
        "manager",
        manager_agent,
    )

    graph.add_node(
        "architect",
        architect_agent,
    )

    graph.add_node(
        "architecture_validator",
        architecture_validation_agent,
    )

    graph.add_node(
        "task_planner",
        task_planner_agent,
    )

    graph.add_node(
        "task_validator",
        task_validation_agent,
    )

    graph.add_node(
        "developer",
        developer_agent,
    )

    graph.add_node(
        "validator",
        validator_agent,
    )

    graph.add_node(
        "artifact_writer",
        artifact_writer_agent,
    )

    graph.add_node(
        "artifact_validator",
        artifact_validation_agent,
    )

    graph.add_node(
        "tester",
        tester_agent,
    )

    graph.add_node(
        "task_progression",
        advance_to_next_task,
    )

    graph.add_node(
        "increment_iteration",
        increment_iteration,
    )

    graph.add_edge(
        START,
        "manager",
    )

    graph.add_edge(
        "manager",
        "architect",
    )

    graph.add_edge(
        "architect",
        "architecture_validator",
    )

    graph.add_conditional_edges(
        "architecture_validator",
        validation_router,
        {
            "passed": "task_planner",
            "failed": END,
        },
    )

    graph.add_edge(
        "task_planner",
        "task_validator",
    )

    graph.add_conditional_edges(
        "task_validator",
        validation_router,
        {
            "passed": "developer",
            "failed": END,
        },
    )

    graph.add_edge(
        "developer",
        "validator",
    )

    graph.add_conditional_edges(
        "validator",
        validation_router,
        {
            "passed": "artifact_writer",
            "failed": END,
        },
    )

    graph.add_edge(
        "artifact_writer",
        "artifact_validator",
    )

    graph.add_conditional_edges(
        "artifact_validator",
        validation_router,
        {
            "passed": "tester",
            "failed": END,
        },
    )

    graph.add_conditional_edges(
        "tester",
        test_router,
        {
            "passed": "task_progression",
            "failed": "increment_iteration",
            "max_iterations": END,
        },
    )

    graph.add_conditional_edges(
        "task_progression",
        task_progression_router,
        {
            "next_task": "developer",
            "completed": END,
        },
    )

    graph.add_edge(
        "increment_iteration",
        "developer",
    )

    return graph.compile()