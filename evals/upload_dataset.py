import json
from pathlib import Path

from dotenv import load_dotenv
from langfuse import Langfuse

from src.config import settings

load_dotenv()

GOLDEN = Path(__file__).parent / "golden_dataset.json"


def upload() -> int:
    client = Langfuse(
        public_key=settings.LANGFUSE_PUBLIC_KEY,
        secret_key=settings.LANGFUSE_SECRET_KEY,
        base_url=settings.LANGFUSE_BASE_URL,
    )
    client.create_dataset(
        name=settings.EVAL_DATASET,
        description="Golden questions for RAG retrieval evaluation.",
    )

    samples = json.loads(GOLDEN.read_text())["rag_samples"]
    for sample in samples:
        client.create_dataset_item(
            dataset_name=settings.EVAL_DATASET,
            id=f"rag-{sample['id']}",
            input=sample["question"],
            expected_output=sample["reference"],
            metadata={"domain": sample["domain"]},
        )

    client.flush()
    print(f"{settings.EVAL_DATASET}: {len(samples)} items")
    return len(samples)


if __name__ == "__main__":
    upload()
