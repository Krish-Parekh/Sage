"""Project entrypoints.

Ingest files into Qdrant:
  uv run python main.py data/true_data/cronjobs.docx
  uv run python main.py --recreate data/true_data/*.html
"""

from src.ingest import main

if __name__ == "__main__":
    main()
