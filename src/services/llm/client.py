from langchain_openai import ChatOpenAI

from src.config import settings


class LLMClient:
    @staticmethod
    def create(model: str, **kwargs) -> ChatOpenAI:
        """A Portkey-fronted chat model."""
        return ChatOpenAI(
            model=model,
            base_url=settings.PORTKEY_BASE_URL,
            api_key=settings.PORT_API_KEY,
            **kwargs,
        )
