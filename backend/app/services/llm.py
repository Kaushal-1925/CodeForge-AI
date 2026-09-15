from langchain_groq import ChatGroq

from app.config import settings


MODEL_NAME = "openai/gpt-oss-20b"


def create_llm() -> ChatGroq:
    return ChatGroq(
        model=MODEL_NAME,
        api_key=settings.groq_api_key,
        max_retries=0,
        request_timeout=60,
    )