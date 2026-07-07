from langchain_openai import ChatOpenAI

from src.config import settings


def guard_chat_model(model: str, **kwargs) -> ChatOpenAI:
    return ChatOpenAI(
        model=model,
        base_url=settings.PORTKEY_BASE_URL,
        api_key=settings.PORT_API_KEY,
        **kwargs,
    )
