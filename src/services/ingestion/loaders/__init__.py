from src.services.ingestion.loaders.base import Loader, LoggingLoader
from src.services.ingestion.loaders.html import HTMLLoader
from src.services.ingestion.loaders.office import OfficeLoader
from src.services.ingestion.loaders.pdf import PDFLoader
from src.services.ingestion.loaders.text import TextLoader

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
