import logfire
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.dependencies import get_current_user
from src.db.session import get_db
from src.models import AuthUser
from src.models.api import ConversationDetail, ConversationSummary
from src.services.history import ConversationRepository

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationSummary])
def list_conversations(
    user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ConversationSummary]:
    with logfire.span("GET /conversations", **{"langfuse.user.id": user.username}):
        conversations = ConversationRepository(db).list_conversations(user.id)
        return [ConversationSummary.model_validate(c) for c in conversations]


@router.get("/{thread_id}", response_model=ConversationDetail)
def get_conversation(
    thread_id: str,
    user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationDetail:
    with logfire.span("GET /conversations/{thread_id}", thread_id=thread_id):
        conversation = ConversationRepository(db).get_conversation(user.id, thread_id)
        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
        return ConversationDetail.model_validate(conversation)
