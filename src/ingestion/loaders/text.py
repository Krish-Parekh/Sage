import logfire

def parse_text(file_path: str) -> str:
    with logfire.span("Text Parsing", filename=file_path):
        try:
            with open(file_path, "r") as file:
                content = file.read()
            if not content.strip():
                logfire.error(f"No content found in text file: {file_path}")
            else:
                logfire.info(f"Text file parsed successfully: {len(content)} characters")

            return content
        except Exception as e:
            logfire.error(f"Error parsing text file: {e}")
            raise e
