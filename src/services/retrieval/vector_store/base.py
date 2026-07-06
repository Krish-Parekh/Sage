from typing import Protocol, runtime_checkable

from src.models import EmbeddedChunk


@runtime_checkable
class VectorStore(Protocol):
    def upsert(self, chunks: list[EmbeddedChunk]) -> None: ...
