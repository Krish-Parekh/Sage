from contextlib import asynccontextmanager

import logfire
from fastapi import FastAPI

from src.api.routers import health_router, query_router
from src.services.retrieval.embeddings import GeminiEmbedder
from src.services.retrieval.reranking import CrossEncoderReranker
from src.services.retrieval.retriever import Retriever
from src.services.retrieval.vector_store import QdrantStore

logfire.configure(send_to_logfire=False, console=logfire.ConsoleOptions())


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.retriever = Retriever(
        embedder=GeminiEmbedder(task_type="RETRIEVAL_QUERY"),
        store=QdrantStore(),
        reranker=CrossEncoderReranker(),
    )
    yield


app = FastAPI(title="Enterprise RAG", lifespan=lifespan)
logfire.instrument_fastapi(app)

app.include_router(health_router)
app.include_router(query_router)
