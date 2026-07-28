"""CLI to push individual files into Qdrant.

Examples:
  uv run python -m src.ingest data/true_data/cronjobs.docx
  uv run python -m src.ingest data/true_data/*.html data/noisy_data/*.pdf
  uv run python -m src.ingest --recreate data/true_data/job_management.html
"""

from __future__ import annotations

import argparse
import time
from pathlib import Path

import logfire

from src.observability import Observability
from src.services.ingestion.chunking import Chunker
from src.services.ingestion.pipeline import IngestionPipeline
from src.services.ingestion.processor import DocumentProcessor
from src.services.retrieval.embeddings import GeminiEmbedder
from src.services.retrieval.vector_store import QdrantStore

_REPO_ROOT = Path(__file__).resolve().parents[1]
_DATA_ROOT = _REPO_ROOT / "data"
_SKIP_NAMES = {"readme.txt", "readme.md", "__init__.py"}


def build_pipeline(collection: str | None = None) -> tuple[IngestionPipeline, QdrantStore]:
    store = QdrantStore(collection=collection) if collection else QdrantStore()
    pipeline = IngestionPipeline(
        processor=DocumentProcessor(),
        chunker=Chunker(),
        embedder=GeminiEmbedder(task_type="RETRIEVAL_DOCUMENT"),
        store=store,
    )
    return pipeline, store


def _source_label(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(_DATA_ROOT.resolve()))
    except ValueError:
        return path.name


def _expand(paths: list[Path]) -> list[Path]:
    """Expand any directories into their supported files; keep explicit files."""
    files: list[Path] = []
    for path in paths:
        if path.is_dir():
            files.extend(
                p
                for p in path.rglob("*")
                if p.is_file() and p.name.lower() not in _SKIP_NAMES
            )
        elif path.is_file():
            if path.name.lower() not in _SKIP_NAMES:
                files.append(path)
        else:
            logfire.error(f"Skipping missing path: {path}")
    return sorted(set(files))


def run(
    paths: list[Path],
    *,
    recreate: bool,
    collection: str | None,
    delay: float,
) -> None:
    Observability.configure()
    pipeline, store = build_pipeline(collection)

    if recreate:
        logfire.info("Recreating Qdrant collection before ingest")
        store.delete_collection()

    store.ensure_collection()

    files = _expand(paths)
    logfire.info(f"Ingesting {len(files)} files (delay={delay}s between files)")

    totals = {"files": 0, "chunks": 0, "failed": 0}
    for index, path in enumerate(files):
        try:
            embedded = pipeline.ingest(str(path.resolve()), source=_source_label(path))
            totals["files"] += 1
            totals["chunks"] += len(embedded)
        except Exception:
            totals["failed"] += 1
            logfire.exception(f"Failed to ingest {path}")

        if delay > 0 and index < len(files) - 1:
            time.sleep(delay)

    logfire.info(
        f"Ingest complete: {totals['files']} files, "
        f"{totals['chunks']} chunks, {totals['failed']} failed"
    )
    if totals["failed"]:
        raise SystemExit(1)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Ingest files into Qdrant.")
    parser.add_argument(
        "paths",
        nargs="+",
        type=Path,
        help="Files or directories to ingest (directories are walked recursively)",
    )
    parser.add_argument(
        "--collection",
        default=None,
        help="Override QDRANT_COLLECTION_NAME from .env",
    )
    parser.add_argument(
        "--recreate",
        action="store_true",
        help="Delete and recreate the collection before ingesting",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=2.0,
        help="Seconds to wait between files to avoid rate limits (default: 2.0)",
    )
    args = parser.parse_args(argv)
    run(
        list(args.paths),
        recreate=args.recreate,
        collection=args.collection,
        delay=args.delay,
    )


if __name__ == "__main__":
    main()
