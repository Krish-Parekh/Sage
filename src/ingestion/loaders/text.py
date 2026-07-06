from src.ingestion.loaders.base import LoggingLoader


class TextLoader(LoggingLoader):
    name = "Text"
    extensions = (".txt", ".md", ".markdown")

    def _extract(self, file_path: str) -> str:
        with open(file_path, "r") as file:
            return file.read()
