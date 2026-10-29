"""The decision model client: the request it sends, the reply it reads, its retries."""

import json

import httpx
import pytest
from pydantic import SecretStr

from highnet_core.config import CoreSettings
from highnet_core.providers.base import ProviderNotConfiguredError
from highnet_core.providers.gateway import GatewayDecisionModel

SETTINGS = CoreSettings(ai_gateway_api_key=SecretStr("k"), _env_file=None)  # pyright: ignore[reportCallIssue]
REPLY = {
    "model": "typesafe-ai/jev",
    "answers": {"label": {"type": "choice", "choice": "in", "probabilities": {"in": 0.9}}},
    "usage": {"inputTokens": 275, "outputTokens": 20},
    "providerMetadata": {"gateway": {"cost": "0.00001155"}},
}


def model_with(responses: list[httpx.Response], sleeps: list[float]) -> GatewayDecisionModel:
    async def fake_sleep(seconds: float) -> None:
        sleeps.append(seconds)

    model = GatewayDecisionModel(SETTINGS, "typesafe-ai/jev", sleep=fake_sleep)
    queue = iter(responses)
    seen: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return next(queue)

    model._http = httpx.AsyncClient(
        base_url=SETTINGS.ai_gateway_base_url, transport=httpx.MockTransport(handler)
    )
    model.seen = seen  # pyright: ignore[reportAttributeAccessIssue]
    return model


async def test_the_request_and_the_reply() -> None:
    model = model_with([httpx.Response(200, json=REPLY)], [])
    decision = await model.decide({"message": "hi"}, {"label": {"type": "choice"}})
    request = model.seen[0]  # pyright: ignore[reportAttributeAccessIssue]
    assert request.url.path == "/v1/evaluate"
    assert json.loads(request.content) == {
        "model": "typesafe-ai/jev",
        "state": {"message": "hi"},
        "questions": {"label": {"type": "choice"}},
    }
    assert decision.answers == REPLY["answers"]
    assert (decision.input_tokens, decision.output_tokens) == (275, 20)
    assert decision.reported_cost_usd == pytest.approx(0.00001155)
    assert decision.retries == 0


async def test_a_reply_without_usage_or_cost() -> None:
    model = model_with([httpx.Response(200, json={"answers": {}})], [])
    decision = await model.decide("s", {})
    assert (decision.input_tokens, decision.reported_cost_usd) == (0, None)


async def test_rate_limits_are_retried_then_give_up() -> None:
    sleeps: list[float] = []
    ok = [httpx.Response(429), httpx.Response(200, json=REPLY)]
    assert (await model_with(ok, sleeps).decide("s", {})).retries == 1
    assert sleeps == [2.0]
    failing = [httpx.Response(503)] * 3
    with pytest.raises(httpx.HTTPStatusError):
        await model_with(failing, []).decide("s", {})
    with pytest.raises(httpx.HTTPStatusError):
        await model_with([httpx.Response(400)], []).decide("s", {})


async def test_the_key_is_needed_on_first_use_and_the_client_is_made_once() -> None:
    missing = GatewayDecisionModel(CoreSettings(_env_file=None), "m")  # pyright: ignore[reportCallIssue]
    with pytest.raises(ProviderNotConfiguredError, match="AI_GATEWAY_API_KEY"):
        await missing.decide("s", {})
    model = GatewayDecisionModel(SETTINGS, "m")
    assert model._client() is model._client()
    assert model._client().headers["authorization"] == "Bearer k"
