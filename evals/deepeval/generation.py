import nest_asyncio
from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric, GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langfuse import Evaluation, Langfuse

from src.config import settings
from src.observability import Observability
from src.services.graph import build_graph
from src.services.graph.state import UserContext
from src.services.guardrails import Guardrails
from src.services.retrieval.embeddings import GeminiEmbedder
from src.services.retrieval.reranking import CrossEncoderReranker
from src.services.retrieval.retriever import Retriever
from src.services.retrieval.vector_store import QdrantStore

load_dotenv()

nest_asyncio.apply()


def _correctness() -> GEval:
    return GEval(
        name="answer_correctness",
        criteria=(
            "Does the actual output state the same facts as the expected output? "
            "Ignore wording, ordering and extra detail that does not contradict."
        ),
        evaluation_params=[
            LLMTestCaseParams.INPUT,
            LLMTestCaseParams.ACTUAL_OUTPUT,
            LLMTestCaseParams.EXPECTED_OUTPUT,
        ],
        model=settings.EVAL_JUDGE_MODEL,
    )


METRICS = {
    "faithfulness": (
        lambda: FaithfulnessMetric(
            model=settings.EVAL_JUDGE_MODEL, include_reason=True
        ),
        True,
    ),
    "answer_relevancy": (
        lambda: AnswerRelevancyMetric(
            model=settings.EVAL_JUDGE_MODEL, include_reason=True
        ),
        False,
    ),
    "answer_correctness": (_correctness, False),
}


class GenerationEval:
    def __init__(self) -> None:
        Observability.configure()
        retriever = Retriever(
            embedder=GeminiEmbedder(task_type="RETRIEVAL_QUERY"),
            store=QdrantStore(),
            reranker=CrossEncoderReranker(),
        )
        self._graph = build_graph(Guardrails(), retriever)
        self._langfuse = Langfuse(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            base_url=settings.LANGFUSE_BASE_URL,
        )

    def _answer(self, *, item, **kwargs) -> dict:
        state = self._graph.invoke(
            {"query": item.input, "messages": [HumanMessage(item.input)]},
            config={"configurable": {"thread_id": f"eval-{item.id}"}},
            context=UserContext(user_id="eval", username="eval"),
        )
        chunks = state.get("chunks") or []
        return {
            "answer": state.get("answer") or state.get("guard_response") or "",
            "chunks": [{"text": c.text, "source": c.source} for c in chunks],
            "route": state.get("route") or "",
            "search_query": state.get("search_query") or "",
            "guard_fired": bool(state.get("guard_fired")),
        }

    def _evaluator(self, name: str, build_metric, needs_context: bool):
        def evaluate(*, input, output, expected_output, metadata, **kwargs):
            context = [chunk["text"] for chunk in output["chunks"]]
            if needs_context and not context:
                return []

            metric = build_metric()
            metric.measure(
                LLMTestCase(
                    input=input,
                    actual_output=output["answer"],
                    expected_output=expected_output,
                    retrieval_context=context or None,
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
            name="Generation",
            run_name=run_name,
            description="Faithfulness, relevancy and correctness of the final answer.",
            task=self._answer,
            evaluators=[
                self._evaluator(name, build_metric, needs_context)
                for name, (build_metric, needs_context) in METRICS.items()
            ],
            run_evaluators=[self._averages],
            max_concurrency=2,
        )
        self._langfuse.flush()
        print(result.format())
        return result


if __name__ == "__main__":
    GenerationEval().run()
