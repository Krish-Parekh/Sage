import logfire
import liteparse

def parse_pdf(file_path: str) -> str:
    with logfire.span("PDF Parsing", filename=file_path):
        try:
            parser = liteparse.Parser()
            parser.parse(file_path)
            content = parser.text

            if not content.strip():
                logfire.error(f"No content found in PDF file: {file_path}")
            else:
                logfire.info(f"PDF file parsed successfully: {len(content)} characters")

            return content

        except Exception as e:
            logfire.error(f"Error parsing PDF: {e}")
            raise e