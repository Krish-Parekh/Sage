from liteparse import LiteParse

from src.services.ingestion.loaders.base import LoggingLoader


class PDFLoader(LoggingLoader):
    name = "PDF"
    extensions = (".pdf",)

    def _extract(self, file_path: str) -> str:
        return LiteParse(quiet=True).parse(file_path).text
