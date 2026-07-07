from fastapi import APIRouter, Request
from langchain_core.messages import HumanMessage

from src.models.api import Chunk, QueryRequest, QueryResponse

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
def query(body: QueryRequest, request: Request) -> QueryResponse:
    config = {"configurable": {"thread_id": body.thread_id}}
    state = request.app.state.graph.invoke(
        {"query": body.query, "messages": [HumanMessage(body.query)]},
        config,
    )

    answer = state.get("answer") or state.get("guard_response") or ""
    chunks = state.get("chunks") or []
    return QueryResponse(
        answer=answer,
        results=[Chunk(text=c.text, source=c.source, score=c.score) for c in chunks],
    )
