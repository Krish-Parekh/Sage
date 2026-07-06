from typing import Protocol, runtime_checkable

import logfire


@runtime_checkable
class Embedder(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]: ...


class BaseEmbedder:
    name: str = "Embedder"

    def __init__(self, batch_size: int = 100) -> None:
        self._batch_size = batch_size

    def _embed(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError

    def embed(self, texts: list[str]) -> list[list[float]]:
        with logfire.span(f"{self.name} Embedding", total=len(texts)):
            if not texts:
                logfire.error("No texts provided to embed")
                return []

            vectors = self._embed(texts)
            logfire.info(f"Embedded {len(vectors)} texts")
            return vectors
