import logfire
import liteparse

def parse_office(file_path: str) -> str:
    
    with logfire.span("Office Documents Parsing", filename=file_path):
        try:
            parser = liteparse.Parser()
            parser.parse(file_path)

            content = parser.text

            if not content.strip():
                logfire.error(f"No content found in office file: {file_path}")
            else:
                logfire.info(f"Office file parsed successfully: {len(content)} characters")

            return content
        except Exception as e:
            logfire.error(f"Error parsing office file: {e}")
            raise e