import liteparse

from src.ingestion.loaders.base import LoggingLoader


class PDFLoader(LoggingLoader):
    name = "PDF"
    extensions = (".pdf",)

    def _extract(self, file_path: str) -> str:
        parser = liteparse.Parser()
        parser.parse(file_path)
        return parser.text
