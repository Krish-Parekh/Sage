from contextlib import asynccontextmanager

import logfire
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routers import conversations_router, health_router, query_router
from src.db.checkpointer import build_checkpointer
from src.observability import Observability
from src.services.graph import build_graph
from src.services.guardrails import Guardrails
from src.services.retrieval.embeddings import GeminiEmbedder
from src.services.retrieval.reranking import CrossEncoderReranker
from src.services.retrieval.retriever import Retriever
from src.services.retrieval.vector_store import QdrantStore

Observability.configure()


def _patch_otel_included_router() -> None:
    try:
        from opentelemetry.instrumentation import fastapi as otel_fastapi
    except ImportError:
        return

    original = otel_fastapi._get_route_details

    def safe_get_route_details(scope):
        try:
            return original(scope)
        except AttributeError:
            return scope.get("path")

    otel_fastapi._get_route_details = safe_get_route_details


_patch_otel_included_router()


@asynccontextmanager
async def lifespan(app: FastAPI):
    retriever = Retriever(
        embedder=GeminiEmbedder(task_type="RETRIEVAL_QUERY"),
        store=QdrantStore(),
        reranker=CrossEncoderReranker(),
    )
    guardrails = Guardrails()
    checkpointer, pool = build_checkpointer()
    app.state.graph = build_graph(guardrails, retriever, checkpointer)
    try:
        yield
    finally:
        pool.close()


app = FastAPI(title="Enterprise RAG", lifespan=lifespan)
logfire.instrument_fastapi(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(query_router)
app.include_router(conversations_router)
