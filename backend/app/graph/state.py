from typing import TypedDict


class CodeForgeState(TypedDict):
    user_request: str
    requirements: str
    architecture: str
    current_agent: str
    status: str