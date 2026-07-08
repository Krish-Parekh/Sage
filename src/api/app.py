from contextlib import asynccontextmanager

import logfire
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routers import health_router, query_router
from src.observability import Observability
from src.services.graph import build_graph
from src.services.guardrails import Guardrails
from src.services.retrieval.embeddings import GeminiEmbedder
from src.services.retrieval.reranking import CrossEncoderReranker
from src.services.retrieval.retriever import Retriever
from src.services.retrieval.vector_store import QdrantStore

Observability.configure()


def _patch_otel_included_router() -> None:
    """Work around a bug in opentelemetry-instrumentation-fastapi 0.63b1.

    Its ``_get_route_details`` reads ``route.path`` unguarded on a PARTIAL
    match. With Starlette 1.3, routes mounted via ``include_router`` surface as
    ``_IncludedRouter`` objects that have no ``.path``, so CORS preflight
    ``OPTIONS`` requests raise ``AttributeError`` and return 500 — which the
    browser sees as a failed request. We wrap the function to fall back to the
    raw request path instead of crashing.
    """
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
    app.state.graph = build_graph(guardrails, retriever)
    yield


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
