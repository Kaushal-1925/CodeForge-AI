from typing import TypedDict


class CodeForgeState(TypedDict):
    user_request: str
    requirements: str
    architecture: str
    current_task: str
    files: dict[str, str]
    validation_errors: list[str]
    workspace: str
    test_results: dict[str, object]
    current_agent: str
    status: str
    iteration: int