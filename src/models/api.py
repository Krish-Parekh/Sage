from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QueryRequest(BaseModel):
    query: str
    thread_id: str = "default"


class Chunk(BaseModel):
    text: str
    source: str
    score: float


class QueryResponse(BaseModel):
    answer: str
    results: list[Chunk] = []


class ConversationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    thread_id: str
    title: str | None
    created_at: datetime
    updated_at: datetime


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role: str
    content: str
    created_at: datetime


class ConversationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    thread_id: str
    title: str | None
    messages: list[MessageOut] = []
