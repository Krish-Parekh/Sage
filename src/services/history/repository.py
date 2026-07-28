from __future__ import annotations

import uuid

import logfire
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from src.db.models import Conversation, Message


class ConversationRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def append_turn(
        self,
        *,
        user_id: uuid.UUID | str,
        thread_id: str,
        user_text: str,
        assistant_text: str,
    ) -> bool:
        with logfire.span("history.append_turn", thread_id=thread_id):
            conversation = self._db.scalar(
                select(Conversation).where(Conversation.thread_id == thread_id)
            )
            created = conversation is None
            if conversation is None:
                conversation = Conversation(thread_id=thread_id, user_id=user_id)
                self._db.add(conversation)
                self._db.flush()
            else:
                conversation.updated_at = func.now()

            conversation.messages.append(Message(role="user", content=user_text))
            conversation.messages.append(
                Message(role="assistant", content=assistant_text)
            )
            self._db.commit()
            return created

    def messages_for_title(
        self, thread_id: str, limit: int = 5
    ) -> list[Message] | None:
        conversation = self._db.scalar(
            select(Conversation).where(Conversation.thread_id == thread_id)
        )
        if conversation is None or conversation.title is not None:
            return None

        messages = list(
            self._db.scalars(
                select(Message)
                .where(Message.conversation_id == conversation.id)
                .order_by(Message.id)
                .limit(limit)
            )
        )
        return messages or None

    def set_title(self, thread_id: str, title: str) -> None:
        conversation = self._db.scalar(
            select(Conversation).where(Conversation.thread_id == thread_id)
        )
        if conversation is not None:
            conversation.title = title
            self._db.commit()

    def list_conversations(self, user_id: uuid.UUID | str) -> list[Conversation]:
        return list(
            self._db.scalars(
                select(Conversation)
                .where(Conversation.user_id == user_id)
                .order_by(Conversation.updated_at.desc())
            )
        )

    def get_conversation(
        self, user_id: uuid.UUID | str, thread_id: str
    ) -> Conversation | None:
        return self._db.scalar(
            select(Conversation)
            .where(
                Conversation.thread_id == thread_id,
                Conversation.user_id == user_id,
            )
            .options(selectinload(Conversation.messages))
        )

    def delete_conversation(
        self, user_id: uuid.UUID | str, thread_id: str
    ) -> bool:
        with logfire.span("history.delete_conversation", thread_id=thread_id):
            conversation = self._db.scalar(
                select(Conversation).where(
                    Conversation.thread_id == thread_id,
                    Conversation.user_id == user_id,
                )
            )
            if conversation is None:
                return False
            self._db.delete(conversation)
            self._db.commit()
            return True
