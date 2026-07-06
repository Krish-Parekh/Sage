import logfire
from bs4 import BeautifulSoup

def parse_html(file_path: str) -> str:

    with logfire.span("HTML Parsing", filename=file_path):
        try:
            with open(file_path, "r") as file:
                html = file.read()
            
            soup = BeautifulSoup(html, "html.parser")

            for script in soup(["script", "style", "meta", "noscript"]):
                script.decompose()

            text = soup.get_text(separator="\n", strip=True)

            lines = (line.strip() for line in text.splitlines() if line.strip())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = "\n".join(chunk for chunk in chunks if chunk)

            return text

        except Exception as e:
            logfire.error(f"Error parsing HTML: {e}")
            raise e