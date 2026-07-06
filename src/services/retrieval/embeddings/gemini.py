import logfire
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from tenacity import (
    before_sleep_log,
    retry,
    stop_after_attempt,
    wait_exponential,
)

from src.config import settings
from src.services.retrieval.embeddings.base import BaseEmbedder


class GeminiEmbedder(BaseEmbedder):
    name = "Gemini"

    def __init__(
        self,
        model: str = "gemini-embedding-001",
        dimensions: int | None = None,
        batch_size: int = 100,
        task_type: str = "RETRIEVAL_DOCUMENT",
    ) -> None:
        super().__init__(batch_size=batch_size)
        self._client = GoogleGenerativeAIEmbeddings(
            model=model,
            google_api_key=settings.GEMINI_API_KEY,
            task_type=task_type,
            output_dimensionality=dimensions,
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        reraise=True,
        before_sleep=before_sleep_log(logfire, "warning"),
    )
    def _embed(self, texts: list[str]) -> list[list[float]]:
        return self._client.embed_documents(texts, batch_size=self._batch_size)
