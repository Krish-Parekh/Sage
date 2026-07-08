from dataclasses import dataclass


@dataclass
class AuthUser:
    id: str
    username: str


@dataclass
class EmbeddedChunk:
    text: str
    vector: list[float]
    source: str


@dataclass
class RetrievedChunk:
    text: str
    source: str
    score: float
