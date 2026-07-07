from typing import Annotated, Literal, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

from src.models import RetrievedChunk

Route = Literal["retrieve", "respond"]


class RAGState(TypedDict, total=False):
    messages: Annotated[list[BaseMessage], add_messages]
    query: str
    search_query: str
    guard_fired: bool
    guard_response: str | None
    route: Route
    chunks: list[RetrievedChunk]
    answer: str
