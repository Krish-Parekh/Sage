import logfire

from src.config import settings
from src.db.models import Message
from src.db.session import SessionLocal
from src.services.graph.prompts import TITLE_PROMPT
from src.services.history.repository import ConversationRepository
from src.services.llm import LLMClient

TITLE_MESSAGE_COUNT = 5


def generate_title(messages: list[Message]) -> str:
    transcript = "\n".join(f"{m.role}: {m.content}" for m in messages)
    llm = LLMClient.create(
        settings.PORTKEY_GUARDRAILS_MODEL, temperature=0, max_tokens=20
    )
    chain = TITLE_PROMPT | llm
    title = chain.invoke({"message": transcript[:2000]}).content
    return title.strip().strip("\"'").rstrip(".")[:80]


def store_title(thread_id: str) -> None:
    db = SessionLocal()
    try:
        repo = ConversationRepository(db)
        messages = repo.messages_for_title(thread_id, limit=TITLE_MESSAGE_COUNT)
        if messages is None:
            return
        repo.set_title(thread_id, generate_title(messages))
    except Exception as exc:
        logfire.warn("title generation failed", error=str(exc))
    finally:
        db.close()
