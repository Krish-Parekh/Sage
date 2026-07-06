from typing import Protocol, runtime_checkable

from src.models import RetrievedChunk


@runtime_checkable
class Reranker(Protocol):
    def rerank(
        self, query: str, chunks: list[RetrievedChunk], top_k: int
    ) -> list[RetrievedChunk]: ...
