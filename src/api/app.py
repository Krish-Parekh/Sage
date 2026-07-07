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
