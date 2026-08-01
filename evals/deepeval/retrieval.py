from deepeval.metrics import (
    ContextualPrecisionMetric,
    ContextualRecallMetric,
    ContextualRelevancyMetric,
)
from deepeval.test_case import LLMTestCase
from dotenv import load_dotenv
from langfuse import Evaluation, Langfuse

from src.config import settings
from src.observability import Observability
from src.services.retrieval.embeddings import GeminiEmbedder
from src.services.retrieval.reranking import CrossEncoderReranker
from src.services.retrieval.retriever import Retriever
from src.services.retrieval.vector_store import QdrantStore

load_dotenv()

METRICS = {
    "context_recall": ContextualRecallMetric,
    "context_precision": ContextualPrecisionMetric,
    "context_relevancy": ContextualRelevancyMetric,
}


class RetrievalEval:
    def __init__(self) -> None:
        Observability.configure()
        self._retriever = Retriever(
            embedder=GeminiEmbedder(task_type="RETRIEVAL_QUERY"),
            store=QdrantStore(),
            reranker=CrossEncoderReranker(),
        )
        self._langfuse = Langfuse(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            base_url=settings.LANGFUSE_BASE_URL,
        )

    def _retrieve(self, *, item, **kwargs) -> list[dict]:
        chunks = self._retriever.retrieve(item.input)
        return [{"text": c.text, "source": c.source} for c in chunks]

    def _evaluator(self, name: str, metric_cls):
        def evaluate(*, input, output, expected_output, metadata, **kwargs):
            metric = metric_cls(model=settings.EVAL_JUDGE_MODEL, include_reason=True)
            metric.measure(
                LLMTestCase(
                    input=input,
                    expected_output=expected_output,
                    retrieval_context=[chunk["text"] for chunk in output],
                ),
                _show_indicator=False,
            )
            return Evaluation(name=name, value=metric.score, comment=metric.reason)

        evaluate.__name__ = name
        return evaluate

    def _averages(self, *, item_results, **kwargs) -> list[Evaluation]:
        averages = []
        for name in METRICS:
            scores = [
                evaluation.value
                for result in item_results
                for evaluation in result.evaluations
                if evaluation.name == name
            ]
            if scores:
                averages.append(
                    Evaluation(name=f"{name}_avg", value=sum(scores) / len(scores))
                )
        return averages

    def run(self, run_name: str | None = None):
        dataset = self._langfuse.get_dataset(settings.EVAL_DATASET)
        result = dataset.run_experiment(
            name="Retrieval",
            run_name=run_name,
            description="Recall, precision and relevancy of the retrieved chunks.",
            task=self._retrieve,
            evaluators=[
                self._evaluator(name, metric_cls)
                for name, metric_cls in METRICS.items()
            ],
            run_evaluators=[self._averages],
            max_concurrency=4,
        )
        self._langfuse.flush()
        print(result.format())
        return result


if __name__ == "__main__":
    RetrievalEval().run()
