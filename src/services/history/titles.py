import logfire

from src.config import settings
from src.db.session import SessionLocal
from src.services.graph.prompts import TITLE_PROMPT
from src.services.history.repository import ConversationRepository
from src.services.llm import LLMClient


def generate_title(message: str) -> str:
    llm = LLMClient.create(
        settings.PORTKEY_GUARDRAILS_MODEL, temperature=0, max_tokens=20
    )
    chain = TITLE_PROMPT | llm
    title = chain.invoke({"message": message[:500]}).content
    return title.strip().strip("\"'").rstrip(".")[:80]


def store_title(thread_id: str, message: str) -> None:
    db = SessionLocal()
    try:
        ConversationRepository(db).set_title(thread_id, generate_title(message))
    except Exception as exc:
        logfire.warn("title generation failed", error=str(exc))
    finally:
        db.close()
