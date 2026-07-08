import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")

    QDRANT_URL: str = os.getenv("QDRANT_URL")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY")
    QDRANT_COLLECTION_NAME: str = os.getenv("QDRANT_COLLECTION_NAME")

    GROQ_MODEL_NAME: str = os.getenv("GROQ_MODEL_NAME")

    LANGFUSE_PUBLIC_KEY: str = os.getenv("LANGFUSE_PUBLIC_KEY")
    LANGFUSE_SECRET_KEY: str = os.getenv("LANGFUSE_SECRET_KEY")
    LANGFUSE_BASE_URL: str = os.getenv("LANGFUSE_BASE_URL", "http://localhost:3000")

    PORT_API_KEY: str = os.getenv("PORT_API_KEY")
    PORTKEY_BASE_URL: str = os.getenv("PORTKEY_BASE_URL")
    PORTKEY_GUARDRAILS_MODEL: str = os.getenv("PORTKEY_GUARDRAILS_MODEL")

    DATABASE_URL: str = os.getenv("DATABASE_URL")

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()