from pathlib import Path

import logfire
from nemoguardrails import LLMRails, RailsConfig

from src.config import settings
from src.services.llm import LLMClient

_CONFIG_PATH = Path(__file__).parent / "config"
_OPTIONS = {"output_vars": ["triggered_input_rail", "user_message"]}


class Guardrails:
    def __init__(self) -> None:
        guard_llm = LLMClient.create(settings.PORTKEY_GUARDRAILS_MODEL)
        config = RailsConfig.from_path(str(_CONFIG_PATH))
        self._rails = LLMRails(config, llm=guard_llm)
        logfire.info("NeMo Guardrails initialised")

    def guard(self, message: str) -> tuple[bool, str | None, str]:
        with logfire.span("Guardrails Check", query=message):
            result = self._rails.generate(
                messages=[{"role": "user", "content": message}],
                options=_OPTIONS,
            )
            response = result.response[0]["content"].strip()
            output_data = result.output_data or {}
            triggered = output_data.get("triggered_input_rail")
            masked = output_data.get("user_message") or message

            if response:
                logfire.info(f"Guardrails fired | input_rail={triggered}")
                return True, response, masked

            if masked != message:
                logfire.info("Guardrails masked sensitive data in input")
            logfire.info("Guardrails passed")
            return False, None, masked
