"""Decision models through Vercel AI Gateway's HTTP API (`POST /v1/evaluate`). Plain httpx, like
Voyage: one endpoint, no SDK. The client opens lazily on first request."""

import asyncio
from collections.abc import Awaitable, Callable
from typing import Any

import httpx

from highnet_core.config import CoreSettings
from highnet_core.providers.base import Decision, ProviderNotConfiguredError

# Rate limits (429) and transient server errors are retried; everything else fails at once.
RETRYABLE = frozenset({429, 500, 502, 503, 504})


class GatewayDecisionModel:
    provider = "vercel-ai-gateway"

    def __init__(
        self,
        settings: CoreSettings,
        model: str,
        sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ) -> None:
        self._settings = settings
        self.model = model
        self._http: httpx.AsyncClient | None = None
        self._sleep = sleep

    def _client(self) -> httpx.AsyncClient:
        key = self._settings.ai_gateway_api_key
        if key is None or not key.get_secret_value():
            raise ProviderNotConfiguredError("AI_GATEWAY_API_KEY is not set.")
        if self._http is None:
            self._http = httpx.AsyncClient(
                base_url=self._settings.ai_gateway_base_url,
                headers={"Authorization": f"Bearer {key.get_secret_value()}"},
                timeout=httpx.Timeout(30.0, connect=5.0),
            )
        return self._http

    # snippet: scope/decide | The decision model request: typed questions about the message
    async def decide(self, state: Any, questions: dict[str, Any]) -> Decision:
        payload = {"model": self.model, "state": state, "questions": questions}
        retries = 0
        while True:
            response = await self._client().post("/evaluate", json=payload)
            retry = response.status_code in RETRYABLE
            if retry and retries < self._settings.ai_gateway_max_retries:
                retries += 1
                await self._sleep(min(2.0**retries, 10.0))
                continue
            response.raise_for_status()
            body = response.json()
            break
        usage = body.get("usage", {})
        cost = body.get("providerMetadata", {}).get("gateway", {}).get("cost")
        return Decision(
            answers=body["answers"],
            input_tokens=int(usage.get("inputTokens", 0)),
            output_tokens=int(usage.get("outputTokens", 0)),
            reported_cost_usd=None if cost is None else float(cost),
            retries=retries,
        )

    # /snippet
