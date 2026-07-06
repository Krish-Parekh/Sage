import logfire
from sentence_transformers import CrossEncoder

from src.models import RetrievedChunk


class CrossEncoderReranker:
    name = "CrossEncoder"

    def __init__(self, model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2") -> None:
        self._model = CrossEncoder(model)

    def rerank(
        self, query: str, chunks: list[RetrievedChunk], top_k: int = 5
    ) -> list[RetrievedChunk]:
        with logfire.span("Reranking", candidates=len(chunks), top_k=top_k):
            if not chunks:
                return []

            pairs = [(query, chunk.text) for chunk in chunks]
            scores = self._model.predict(pairs)

            ranked = sorted(
                zip(chunks, scores, strict=True),
                key=lambda pair: pair[1],
                reverse=True,
            )

            reranked = [
                RetrievedChunk(text=chunk.text, source=chunk.source, score=float(score))
                for chunk, score in ranked[:top_k]
            ]

            logfire.info(f"Reranked {len(chunks)} -> {len(reranked)} chunks")
            return reranked
