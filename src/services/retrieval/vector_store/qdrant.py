import uuid

import logfire
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from src.config import settings
from src.models import EmbeddedChunk


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
