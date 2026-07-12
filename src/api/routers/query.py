import logfire
from fastapi import APIRouter, BackgroundTasks, Depends, Request
from langchain_core.messages import HumanMessage
from sqlalchemy.orm import Session

from src.api.dependencies import get_current_user
from src.db.session import get_db
from src.models import AuthUser
from src.models.api import Chunk, QueryRequest, QueryResponse
from src.services.graph.state import UserContext
from src.services.history import ConversationRepository
from src.services.history.titles import store_title

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
def query(
    body: QueryRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db),
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

        ConversationRepository(db).append_turn(
            user_id=user.id,
            thread_id=body.thread_id,
            user_text=body.query,
            assistant_text=answer,
        )
        background_tasks.add_task(store_title, body.thread_id)

        return QueryResponse(
            answer=answer,
            results=[
                Chunk(text=c.text, source=c.source, score=c.score) for c in chunks
            ],
        )
