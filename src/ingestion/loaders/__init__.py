from src.ingestion.loaders.base import Loader, LoggingLoader
from src.ingestion.loaders.html import HTMLLoader
from src.ingestion.loaders.office import OfficeLoader
from src.ingestion.loaders.pdf import PDFLoader
from src.ingestion.loaders.text import TextLoader

DEFAULT_LOADERS: tuple[Loader, ...] = (
    PDFLoader(),
    OfficeLoader(),
    HTMLLoader(),
    TextLoader(),
)

__all__ = [
    "Loader",
    "LoggingLoader",
    "PDFLoader",
    "OfficeLoader",
    "HTMLLoader",
    "TextLoader",
    "DEFAULT_LOADERS",
]
