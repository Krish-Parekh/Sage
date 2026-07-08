import logfire
from fastapi import APIRouter, Depends, Request
from langchain_core.messages import HumanMessage

from src.api.dependencies import get_current_user
from src.models import AuthUser
from src.models.api import Chunk, QueryRequest, QueryResponse
from src.services.graph.state import UserContext

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
def query(
    body: QueryRequest,
    request: Request,
    user: AuthUser = Depends(get_current_user),
) -> QueryResponse:
    with logfire.span(
        "POST /query",
        thread_id=body.thread_id,
        query=body.query,
        **{
            "langfuse.user.id": user.username,
            "langfuse.session.id": body.thread_id,
            "langfuse.trace.metadata.user_id": user.id,
        },
    ) as span:
        state = request.app.state.graph.invoke(
            {"query": body.query, "messages": [HumanMessage(body.query)]},
            config={"configurable": {"thread_id": body.thread_id}},
            context=UserContext(user_id=user.id, username=user.username),
        )

        answer = state.get("answer") or state.get("guard_response") or ""
        chunks = state.get("chunks") or []
        span.set_attribute("guard_fired", bool(state.get("guard_fired")))
        span.set_attribute("route", state.get("route") or "")
        span.set_attribute("chunk_count", len(chunks))
        return QueryResponse(
            answer=answer,
            results=[
                Chunk(text=c.text, source=c.source, score=c.score) for c in chunks
            ],
        )
