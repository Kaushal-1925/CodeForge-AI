from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings


MODEL_NAME = "gemini-3.6-flash"


def create_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=MODEL_NAME,
        api_key=settings.gemini_api_key,
        temperature=0,
        max_tokens=2048,
        retries=0,
        request_timeout=60,
    )