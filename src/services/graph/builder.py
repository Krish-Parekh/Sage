from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from src.services.graph.nodes import (
    RAGNodes,
    route_after_guard,
    route_after_planner,
)
from src.services.graph.state import RAGState
from src.services.guardrails import Guardrails
from src.services.retrieval.retriever import Retriever


def build_graph(
    guardrails: Guardrails,
    retriever: Retriever,
) -> CompiledStateGraph:
    nodes = RAGNodes(guardrails, retriever)

    builder = StateGraph(RAGState)
    builder.add_node("guard", nodes.guard)
    builder.add_node("planner", nodes.planner)
    builder.add_node("retriever", nodes.retriever)
    builder.add_node("responder", nodes.responder)

    builder.add_edge(START, "guard")
    builder.add_conditional_edges(
        "guard", route_after_guard, {"block": END, "plan": "planner"}
    )
    builder.add_conditional_edges(
        "planner",
        route_after_planner,
        {"retrieve": "retriever", "respond": "responder"},
    )
    builder.add_edge("retriever", "responder")
    builder.add_edge("responder", END)

    return builder.compile(checkpointer=InMemorySaver())
