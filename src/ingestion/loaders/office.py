import liteparse

from src.ingestion.loaders.base import LoggingLoader


class OfficeLoader(LoggingLoader):
    name = "Office"
    extensions = (".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls")

    def _extract(self, file_path: str) -> str:
        parser = liteparse.Parser()
        parser.parse(file_path)
        return parser.text
