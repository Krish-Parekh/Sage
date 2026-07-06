from pydantic import BaseModel


class QueryRequest(BaseModel):
    query: str


class Chunk(BaseModel):
    text: str
    source: str
    score: float


class QueryResponse(BaseModel):
    results: list[Chunk]
