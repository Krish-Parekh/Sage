from fastapi import APIRouter, Request

from src.models.api import Chunk, QueryRequest, QueryResponse

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
def query(body: QueryRequest, request: Request) -> QueryResponse:
    results = request.app.state.retriever.retrieve(body.query)
    return QueryResponse(
        results=[
            Chunk(text=r.text, source=r.source, score=r.score) for r in results
        ]
    )
