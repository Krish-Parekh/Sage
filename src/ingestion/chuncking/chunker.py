import logfire
from langchain_text_splitters import RecursiveCharacterTextSplitter


class Chunker:
    def __init__(self, chunk_size: int = 1000, overlap: int = 100) -> None:
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap,
        )

    def chunk(self, text: str) -> list[str]:
        with logfire.span("Chunking"):
            if not text.strip():
                logfire.error("No text provided to chunk")
                return []

            chunks = self._splitter.split_text(text)
            logfire.info(f"Text split into {len(chunks)} chunks")
            return chunks
