from pathlib import Path

import logfire

from src.ingestion.loaders import DEFAULT_LOADERS, Loader


class DocumentProcessor:
    def __init__(self, loaders: tuple[Loader, ...] = DEFAULT_LOADERS) -> None:
        self._registry: dict[str, Loader] = {}
        for loader in loaders:
            for ext in loader.extensions:
                self._registry[ext.lower()] = loader

    def parse(self, file_path: str) -> str:
        ext = Path(file_path).suffix.lower()
        loader = self._registry.get(ext)

        if loader is None:
            logfire.error(f"No loader registered for extension: {ext} ({file_path})")
            raise ValueError(
                f"Unsupported file type '{ext}'. "
                f"Supported: {', '.join(sorted(self._registry))}"
            )

        return loader.parse(file_path)
