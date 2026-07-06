from typing import Protocol, runtime_checkable

import logfire


@runtime_checkable
class Loader(Protocol):
    name: str
    extensions: tuple[str, ...]

    def parse(self, file_path: str) -> str: ...


class LoggingLoader:
    name: str = "Document"
    extensions: tuple[str, ...] = ()

    def _extract(self, file_path: str) -> str:
        raise NotImplementedError

    def parse(self, file_path: str) -> str:
        with logfire.span(f"{self.name} Parsing", filename=file_path):
            try:
                content = self._extract(file_path)

                if not content.strip():
                    logfire.error(f"No content found in {self.name} file: {file_path}")
                else:
                    logfire.info(
                        f"{self.name} file parsed successfully: {len(content)} characters"
                    )

                return content

            except Exception as e:
                logfire.error(f"Error parsing {self.name} file: {e}")
                raise e
