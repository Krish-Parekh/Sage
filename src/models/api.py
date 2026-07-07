from pydantic import BaseModel


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
