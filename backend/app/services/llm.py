from langchain_deepseek import ChatDeepSeek
from pydantic import SecretStr

from app.core.config import get_settings


def create_llm() -> ChatDeepSeek:
    settings = get_settings()

    if not settings.deepseek_api_key:
        raise RuntimeError(
            "DEEPSEEK_API_KEY is not configured. Set it in the environment "
            "before starting a workflow run."
        )

    return ChatDeepSeek(
        model_name=settings.llm_model,
        api_key=SecretStr(settings.deepseek_api_key),
        temperature=0,
        max_tokens=2048,
        max_retries=0,
        request_timeout=60,
    )
