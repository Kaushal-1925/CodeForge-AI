from typing import TypedDict


class CodeForgeState(TypedDict):
    user_request: str
    current_agent: str
    status: str
