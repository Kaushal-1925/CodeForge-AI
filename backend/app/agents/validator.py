from app.graph.state import CodeForgeState
from app.services.file_validator import validate_generated_files


def validator_agent(state: CodeForgeState) -> CodeForgeState:
    errors = validate_generated_files(state["files"])

    state["validation_errors"] = errors
    state["current_agent"] = "validator"

    if errors:
        state["status"] = "validation_failed"
    else:
        state["status"] = "validation_passed"

    return state
