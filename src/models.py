from dataclasses import dataclass


@dataclass
class EmbeddedChunk:
    text: str
    vector: list[float]
    source: str
