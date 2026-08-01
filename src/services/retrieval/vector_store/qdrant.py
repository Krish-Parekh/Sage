import uuid

import logfire
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from tenacity import (
    before_sleep_log,
    retry,
    stop_after_attempt,
    wait_exponential,
)

from src.config import settings
from src.models import EmbeddedChunk, RetrievedChunk


class QdrantStore:
    name = "Qdrant"

    def __init__(
        self,
        collection: str = settings.QDRANT_COLLECTION_NAME,
        vector_size: int = 3072,
        distance: Distance = Distance.COSINE,
    ) -> None:
        self._collection = collection
        self._vector_size = vector_size
        self._distance = distance
        self._client = QdrantClient(
            url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY
        )

    def ensure_collection(self) -> None:
        if self._client.collection_exists(self._collection):
            return

        self._client.create_collection(
            collection_name=self._collection,
            vectors_config=VectorParams(
                size=self._vector_size, distance=self._distance
            ),
        )
        logfire.info(
            f"Created Qdrant collection '{self._collection}' "
            f"(size={self._vector_size})"
        )

    def delete_collection(self) -> None:
        if not self._client.collection_exists(self._collection):
            logfire.info(f"Qdrant collection '{self._collection}' does not exist")
            return

        self._client.delete_collection(collection_name=self._collection)
        logfire.info(f"Deleted Qdrant collection '{self._collection}'")

    def sources(self) -> set[str]:
        """Distinct `source` values already stored in the collection."""
        if not self._client.collection_exists(self._collection):
            return set()

        found: set[str] = set()
        offset = None
        while True:
            points, offset = self._client.scroll(
                collection_name=self._collection,
                limit=1000,
                offset=offset,
                with_payload=["source"],
                with_vectors=False,
            )
            found.update(p.payload["source"] for p in points if p.payload)
            if offset is None:
                break

        return found

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        reraise=True,
        before_sleep=before_sleep_log(logfire, "warning"),
    )
    def upsert(self, chunks: list[EmbeddedChunk]) -> None:
        with logfire.span("Qdrant Upsert", count=len(chunks)):
            if not chunks:
                logfire.error("No chunks to upsert")
                return

            points = [
                PointStruct(
                    id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"{c.source}:{c.text}")),
                    vector=c.vector,
                    payload={"text": c.text, "source": c.source},
                )
                for c in chunks
            ]

            self._client.upsert(collection_name=self._collection, points=points)
            logfire.info(f"Upserted {len(points)} points into '{self._collection}'")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        reraise=True,
        before_sleep=before_sleep_log(logfire, "warning"),
    )
    def search(self, vector: list[float], limit: int = 5) -> list[RetrievedChunk]:
        with logfire.span("Qdrant Search", limit=limit):
            response = self._client.query_points(
                collection_name=self._collection,
                query=vector,
                limit=limit,
                with_payload=True,
            )

            results = [
                RetrievedChunk(
                    text=point.payload["text"],
                    source=point.payload["source"],
                    score=point.score,
                )
                for point in response.points
            ]

            logfire.info(f"Retrieved {len(results)} chunks from '{self._collection}'")
            return results
