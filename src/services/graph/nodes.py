import logfire
from langchain_core.messages import AIMessage
from pydantic import BaseModel, Field

from src.config import settings
from src.services.graph.prompts import PLANNER_PROMPT, RESPONDER_PROMPT
from src.services.graph.state import RAGState, Route
from src.services.guardrails import Guardrails
from src.services.llm import LLMClient
from src.services.retrieval.retriever import Retriever


class Plan(BaseModel):
    route: Route = Field(
        description=(
            "'retrieve' if answering needs the document knowledge base; "
            "'respond' for greetings, chit-chat, or questions answerable from "
            "the conversation so far."
        )
    )
    search_query: str = Field(
        description=(
            "A standalone, retrieval-optimized rephrasing of the user's request "
            "that resolves pronouns/follow-ups using the conversation. Echo the "
            "query unchanged if no rewrite helps."
        )
    )


class RAGNodes:
    def __init__(
        self,
        guardrails: Guardrails,
        retriever: Retriever,
        model: str | None = None,
    ) -> None:
        self._guardrails = guardrails
        self._retriever = retriever
        llm = LLMClient.create(model or settings.PORTKEY_GUARDRAILS_MODEL)
        self._planner = PLANNER_PROMPT | llm.with_structured_output(Plan)
        self._responder = RESPONDER_PROMPT | llm

    def guard(self, state: RAGState) -> dict:
        with logfire.span("Node: guard"):
            fired, response = self._guardrails.guard(state["query"])
            return {"guard_fired": fired, "guard_response": response}

    def planner(self, state: RAGState) -> dict:
        with logfire.span("Node: planner"):
            plan: Plan = self._planner.invoke({"messages": state["messages"]})
            logfire.info(f"Planned route={plan.route} query={plan.search_query!r}")
            return {"route": plan.route, "search_query": plan.search_query}

    def retriever(self, state: RAGState) -> dict:
        with logfire.span("Node: retriever"):
            chunks = self._retriever.retrieve(state["search_query"])
            return {"chunks": chunks}

    def responder(self, state: RAGState) -> dict:
        with logfire.span("Node: responder"):
            chunks = state.get("chunks") or []
            context = "\n\n".join(f"[{c.source}] {c.text}" for c in chunks)
            answer = self._responder.invoke(
                {
                    "context": context or "(no retrieved context)",
                    "messages": state["messages"],
                }
            )
            text = answer.content
            return {"answer": text, "messages": [AIMessage(text)]}


def route_after_guard(state: RAGState) -> str:
    return "block" if state["guard_fired"] else "plan"


def route_after_planner(state: RAGState) -> str:
    return state["route"]
