import base64

import logfire
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import SpanProcessor
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from src.config import settings

_SERVICE_NAME = "rag"


class Observability:
    @staticmethod
    def configure() -> None:
        langfuse = Observability._langfuse_span_processor()

        logfire.configure(
            service_name=_SERVICE_NAME,
            send_to_logfire=False,
            console=logfire.ConsoleOptions(),
            additional_span_processors=[langfuse] if langfuse else [],
        )

        Observability._instrument_langchain()

        logfire.info(
            "Observability configured",
            langfuse_export=langfuse is not None,
            langfuse_base_url=settings.LANGFUSE_BASE_URL,
        )

    @staticmethod
    def _langfuse_span_processor() -> SpanProcessor | None:
        if not (settings.LANGFUSE_PUBLIC_KEY and settings.LANGFUSE_SECRET_KEY):
            logfire.warning(
                "Langfuse keys not set — skipping OTLP export (console only)."
            )
            return None

        auth = base64.b64encode(
            f"{settings.LANGFUSE_PUBLIC_KEY}:{settings.LANGFUSE_SECRET_KEY}".encode()
        ).decode()
        endpoint = f"{settings.LANGFUSE_BASE_URL.rstrip('/')}/api/public/otel/v1/traces"

        exporter = OTLPSpanExporter(
            endpoint=endpoint,
            headers={"Authorization": f"Basic {auth}"},
            timeout=30,
        )
        return BatchSpanProcessor(exporter)

    @staticmethod
    def _instrument_langchain() -> None:
        from opentelemetry.instrumentation.langchain import LangchainInstrumentor

        LangchainInstrumentor().instrument()
