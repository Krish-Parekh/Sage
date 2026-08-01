import os
from pathlib import Path

import logfire
from nemoguardrails import LLMRails, RailsConfig

from src.config import settings
from src.services.llm import LLMClient

_CONFIG_PATH = Path(__file__).parent / "config"
_CACHE_PATH = Path(__file__).parents[3] / ".cache" / "fastembed"
_OPTIONS = {
    "output_vars": ["triggered_input_rail", "user_message"],
    "log": {"internal_events": True},
}
_INTERNAL_ERROR_INTENT = "inform internal error occurred"

os.environ.setdefault("FASTEMBED_CACHE_PATH", str(_CACHE_PATH))


class GuardrailsError(RuntimeError):
    pass


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
            self._raise_on_internal_error(result)

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

    @staticmethod
    def _raise_on_internal_error(result) -> None:
        events = (result.log.internal_events if result.log else None) or []
        crashed = any(
            event.get("type") == "BotIntent"
            and event.get("intent") == _INTERNAL_ERROR_INTENT
            for event in events
        )
        if crashed:
            logfire.error("NeMo Guardrails failed internally — no rail was applied")
            raise GuardrailsError(
                "NeMo Guardrails failed internally, so no rail was applied. "
                "Check the action_dispatcher warnings above for the cause."
            )
