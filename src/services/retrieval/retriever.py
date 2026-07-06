import logfire

from src.models import RetrievedChunk
from src.services.retrieval.embeddings import Embedder
from src.services.retrieval.vector_store import VectorStore


class Retriever:
    def __init__(self, embedder: Embedder, store: VectorStore) -> None:
        self._embedder = embedder
        self._store = store

    def retrieve(self, query: str, limit: int = 5) -> list[RetrievedChunk]:
        with logfire.span("Retrieval", query=query, limit=limit):
            vector = self._embedder.embed([query])[0]
            return self._store.search(vector, limit)
