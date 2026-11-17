import os
from langchain_deepseek import ChatDeepSeek
from pydantic import SecretStr

from app.core.config import get_settings


_runtime_api_key: str | None = None


def set_runtime_api_key(key: str | None) -> None:
    global _runtime_api_key
    _runtime_api_key = key
    reset_llm_cache()


def get_runtime_api_key() -> str | None:
    return _runtime_api_key


def create_llm(api_key_override: str | None = None) -> ChatDeepSeek:
    if hasattr(get_settings, "cache_clear"):
        get_settings.cache_clear()
    settings = get_settings()

    api_key = api_key_override or _runtime_api_key or settings.deepseek_api_key

    if not api_key:
        raise RuntimeError(
            "DEEPSEEK_API_KEY is not configured. Set it in the environment "
            "before starting a workflow run."
        )

    return ChatDeepSeek(
        model_name=settings.llm_model,
        api_key=SecretStr(api_key),
        temperature=0,
        max_tokens=2048,
        max_retries=0,
        request_timeout=60,
    )


def reset_llm_cache() -> None:
    from app.agents import architect, developer, manager, task_planner

    architect.model = None
    developer.model = None
    manager.model = None
    task_planner.model = None
