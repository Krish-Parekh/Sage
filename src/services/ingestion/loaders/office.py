import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from liteparse import LiteParse
from liteparse.types import ParseError

from src.services.ingestion.loaders.base import LoggingLoader

_WORD_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
_DRAW_NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}


class OfficeLoader(LoggingLoader):
    name = "Office"
    extensions = (".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls")

    def _extract(self, file_path: str) -> str:
        suffix = Path(file_path).suffix.lower()
        if suffix == ".docx":
            return self._extract_docx(file_path)
        if suffix == ".pptx":
            return self._extract_pptx(file_path)
        try:
            return LiteParse(quiet=True).parse(file_path).text
        except ParseError:
            raise

    def _extract_docx(self, file_path: str) -> str:
        with zipfile.ZipFile(file_path) as archive:
            xml = archive.read("word/document.xml")
        root = ET.fromstring(xml)
        paragraphs: list[str] = []
        for paragraph in root.iter(f"{{{_WORD_NS['w']}}}p"):
            texts = [
                node.text
                for node in paragraph.iter(f"{{{_WORD_NS['w']}}}t")
                if node.text
            ]
            if texts:
                paragraphs.append("".join(texts))
        return "\n".join(paragraphs)

    def _extract_pptx(self, file_path: str) -> str:
        with zipfile.ZipFile(file_path) as archive:
            slide_names = sorted(
                name
                for name in archive.namelist()
                if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)
            )
            blocks: list[str] = []
            for name in slide_names:
                root = ET.fromstring(archive.read(name))
                texts = [
                    node.text
                    for node in root.iter(f"{{{_DRAW_NS['a']}}}t")
                    if node.text
                ]
                if texts:
                    blocks.append("\n".join(texts))
        return "\n\n".join(blocks)
