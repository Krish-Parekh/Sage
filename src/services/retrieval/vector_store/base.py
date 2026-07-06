from typing import Protocol, runtime_checkable

from src.models import EmbeddedChunk, RetrievedChunk


@runtime_checkable
class VectorStore(Protocol):
    def upsert(self, chunks: list[EmbeddedChunk]) -> None: ...

    def search(self, vector: list[float], limit: int) -> list[RetrievedChunk]: ...
