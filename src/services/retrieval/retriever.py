import logfire

from src.models import RetrievedChunk
from src.services.retrieval.embeddings import Embedder
from src.services.retrieval.reranking import Reranker
from src.services.retrieval.vector_store import VectorStore


class Retriever:
    def __init__(
        self,
        embedder: Embedder,
        store: VectorStore,
        reranker: Reranker,
    ) -> None:
        self._embedder = embedder
        self._store = store
        self._reranker = reranker

    def retrieve(
        self, query: str, top_n: int = 20, top_k: int = 5
    ) -> list[RetrievedChunk]:
        with logfire.span("Retrieval", query=query, top_n=top_n, top_k=top_k):
            vector = self._embedder.embed([query])[0]
            candidates = self._store.search(vector, top_n)
            return self._reranker.rerank(query, candidates, top_k)
