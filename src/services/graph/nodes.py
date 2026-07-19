import logfire
from langchain_core.messages import AIMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.runtime import Runtime
from pydantic import BaseModel, Field

from src.config import settings
from src.services.graph.prompts import PLANNER_PROMPT, RESPONDER_PROMPT
from src.services.graph.state import RAGState, Route, UserContext
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
    ) -> None:
        self._guardrails = guardrails
        self._retriever = retriever

    def _build_llm(self, user: UserContext, model: str) -> ChatOpenAI:
        return LLMClient.create(
            model,
            metadata={"_user": user.user_id, "username": user.username},
            trace_id=user.user_id,
        )

    def guard(self, state: RAGState) -> dict:
        with logfire.span("Node: guard"):
            fired, response, masked = self._guardrails.guard(state["query"])
            update: dict = {
                "guard_fired": fired,
                "guard_response": response,
                "answer": "",
                "chunks": [],
            }
            if not fired and masked != state["query"]:
                last = state["messages"][-1]
                update["query"] = masked
                update["messages"] = [HumanMessage(content=masked, id=last.id)]
            return update

    def planner(self, state: RAGState, runtime: Runtime[UserContext]) -> dict:
        with logfire.span("Node: planner"):
            chain = PLANNER_PROMPT | self._build_llm(
                runtime.context, settings.PORTKEY_GUARDRAILS_MODEL
            ).with_structured_output(Plan)
            plan: Plan = chain.invoke({"messages": state["messages"][-4:]})
            logfire.info(f"Planned route={plan.route} query={plan.search_query!r}")
            return {"route": plan.route, "search_query": plan.search_query}

    def retriever(self, state: RAGState) -> dict:
        with logfire.span("Node: retriever"):
            chunks = self._retriever.retrieve(state["search_query"])
            return {"chunks": chunks}

    def responder(self, state: RAGState, runtime: Runtime[UserContext]) -> dict:
        with logfire.span("Node: responder"):
            chunks = state.get("chunks") or []
            context = "\n\n".join(f"[{c.source}] {c.text}" for c in chunks)
            chain = RESPONDER_PROMPT | self._build_llm(
                runtime.context, settings.PORTKEY_RESPONDER_MODEL
            )
            answer = chain.invoke(
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
