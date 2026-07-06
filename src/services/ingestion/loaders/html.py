from bs4 import BeautifulSoup

from src.services.ingestion.loaders.base import LoggingLoader


class HTMLLoader(LoggingLoader):
    name = "HTML"
    extensions = (".html", ".htm")

    def _extract(self, file_path: str) -> str:
        with open(file_path, "r") as file:
            html = file.read()

        soup = BeautifulSoup(html, "html.parser")

        for script in soup(["script", "style", "meta", "noscript"]):
            script.decompose()

        text = soup.get_text(separator="\n", strip=True)

        lines = (line.strip() for line in text.splitlines() if line.strip())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        return "\n".join(chunk for chunk in chunks if chunk)
