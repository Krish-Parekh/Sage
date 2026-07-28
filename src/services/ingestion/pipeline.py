import time

import logfire

from src.models import EmbeddedChunk
from src.services.ingestion.chunking import Chunker
from src.services.ingestion.processor import DocumentProcessor
from src.services.retrieval.embeddings import Embedder
from src.services.retrieval.vector_store import VectorStore


class IngestionPipeline:
    def __init__(
        self,
        processor: DocumentProcessor,
        chunker: Chunker,
        embedder: Embedder,
        store: VectorStore,
    ) -> None:
        self._processor = processor
        self._chunker = chunker
        self._embedder = embedder
        self._store = store

    def ingest(
        self, file_path: str, *, source: str | None = None
    ) -> list[EmbeddedChunk]:
        source_label = source or file_path
        with logfire.span("Ingestion Pipeline", filename=file_path, source=source_label):
            start = time.perf_counter()

            text = self._processor.parse(file_path)
            chunks = self._chunker.chunk(text)

            if not chunks:
                logfire.error(f"No chunks produced for {file_path}")
                return []

            vectors = self._embedder.embed(chunks)

            embedded = [
                EmbeddedChunk(text=chunk, vector=vector, source=source_label)
                for chunk, vector in zip(chunks, vectors, strict=True)
            ]

            self._store.upsert(embedded)

            elapsed = time.perf_counter() - start
            logfire.info(
                f"Ingested {len(embedded)} chunks from {source_label} in {elapsed:.2f}s"
            )

            return embedded
