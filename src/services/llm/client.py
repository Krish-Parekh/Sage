import json

from langchain_openai import ChatOpenAI

from src.config import settings


class LLMClient:
    @staticmethod
    def create(
        model: str,
        *,
        metadata: dict | None = None,
        trace_id: str | None = None,
        config: dict | str | None = None,
        **kwargs,
    ) -> ChatOpenAI:
        """A Portkey-fronted chat model with config/caching/tracing headers."""
        config = config if config is not None else settings.PORTKEY_CONFIG

        headers = {}
        if config:
            headers["x-portkey-config"] = (
                config if isinstance(config, str) else json.dumps(config)
            )
        if metadata:
            headers["x-portkey-metadata"] = json.dumps(metadata)
        if trace_id:
            headers["x-portkey-trace-id"] = trace_id

        return ChatOpenAI(
            model=model,
            base_url=settings.PORTKEY_BASE_URL,
            api_key=settings.PORT_API_KEY,
            default_headers=headers or None,
            **kwargs,
        )
