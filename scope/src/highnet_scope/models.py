"""The model calls Scope makes (an embedding, Claude for the judge and the answers, and a decision
model for the second judge), live or replayed from `scope.sqlite`.

- `LiveModels` calls the providers, measures each call, prices it with `pricing.py` and records it
  in the store (the recorder, the evals and `SCOPE_LIVE=true` use it).
- `RecordedModels` only looks calls up. Visitors get these: no model is called on a visit, and a
  call whose exact input was never recorded is an honest `NotRecordedError`, never a guess.
"""

import json
import time
from typing import Any, Protocol

import numpy as np

from highnet_core.config import CoreSettings
from highnet_core.pricing import cost_usd
from highnet_core.providers.base import Completion, Decision, DecisionModel, Embedder, TextModel
from highnet_core.providers.fake import approx_tokens
from highnet_scope.store import Call, ScopeStore, call_key, now


class NotRecordedError(LookupError):
    """This exact call was never recorded, so it cannot be replayed."""


class ScopeModels(Protocol):
    embed_provider: str
    embed_model: str
    text_provider: str
    text_model: str
    decide_provider: str
    decide_model: str
    live: bool

    async def embed(self, text: str) -> Call: ...
    async def complete(
        self, kind: str, system: str, messages: list[dict[str, Any]], max_tokens: int
    ) -> Call: ...
    async def decide(self, state: dict[str, Any], questions: dict[str, Any]) -> Call: ...


def embed_key(model: str, text: str) -> str:
    return call_key("embed", model, text)


def complete_key(
    kind: str, model: str, system: str, messages: list[dict[str, Any]], max_tokens: int
) -> str:
    return call_key(kind, model, system, messages, max_tokens)


def decide_key(model: str, state: dict[str, Any], questions: dict[str, Any]) -> str:
    return call_key("decide", model, state, questions)


class LiveModels:
    live = True

    def __init__(
        self,
        store: ScopeStore,
        embedder: Embedder,
        text: TextModel,
        decider: DecisionModel,
        settings: CoreSettings,
        *,
        reuse: bool = True,
    ) -> None:
        self._store, self.embedder, self._text, self._settings = store, embedder, text, settings
        self._decider = decider
        self.embed_provider, self.embed_model = embedder.provider, embedder.model
        self.text_provider, self.text_model = text.provider, text.model
        self.decide_provider, self.decide_model = decider.provider, decider.model
        # Reuse a call already recorded with the same input (a resumed recording pays once).
        self._reuse = reuse
        self.paid: list[Call] = []

    async def embed(self, text: str) -> Call:
        key = embed_key(self.embed_model, text)
        if self._reuse and (found := self._store.call(key)):
            return found
        started = time.perf_counter()
        result = await self.embedder.embed([text], "query")
        ms = round((time.perf_counter() - started) * 1000)
        call = Call(
            kind="embed",
            provider=self.embed_provider,
            model=self.embed_model,
            request={"input": text, "input_type": "query"},
            response=json.dumps({"dims": int(result.vectors.shape[1])}),
            embedding=result.vectors[0].astype(np.float32),
            input_tokens=result.tokens,
            output_tokens=0,
            ms=ms,
            cost_usd=cost_usd(self.embed_model, self._settings, result.tokens),
            recorded_at=now(),
        )
        self._store.save_call(key, call)
        self.paid.append(call)
        return call

    async def complete(
        self, kind: str, system: str, messages: list[dict[str, Any]], max_tokens: int
    ) -> Call:
        key = complete_key(kind, self.text_model, system, messages, max_tokens)
        if self._reuse and (found := self._store.call(key)):
            return found
        started = time.perf_counter()
        result: Completion = await self._text.complete(system, messages, max_tokens)
        ms = round((time.perf_counter() - started) * 1000)
        call = Call(
            kind=kind,
            provider=self.text_provider,
            model=self.text_model,
            request={"system": system, "messages": messages, "max_tokens": max_tokens},
            response=result.text,
            embedding=None,
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens,
            ms=ms,
            cost_usd=cost_usd(
                self.text_model, self._settings, result.input_tokens, result.output_tokens
            ),
            recorded_at=now(),
        )
        self._store.save_call(key, call)
        self.paid.append(call)
        return call

    async def decide(self, state: dict[str, Any], questions: dict[str, Any]) -> Call:
        key = decide_key(self.decide_model, state, questions)
        if self._reuse and (found := self._store.call(key)):
            return found
        started = time.perf_counter()
        result: Decision = await self._decider.decide(state, questions)
        ms = round((time.perf_counter() - started) * 1000)
        call = Call(
            kind="decide",
            provider=self.decide_provider,
            model=self.decide_model,
            request={"state": state, "questions": questions},
            response=json.dumps(
                {"answers": result.answers, "reported_cost_usd": result.reported_cost_usd}
            ),
            embedding=None,
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens,
            ms=ms,
            cost_usd=cost_usd(
                self.decide_model, self._settings, result.input_tokens, result.output_tokens
            ),
            recorded_at=now(),
        )
        self._store.save_call(key, call)
        self.paid.append(call)
        return call


class RecordedModels:
    live = False

    def __init__(
        self,
        store: ScopeStore,
        embed: tuple[str, str],
        text: tuple[str, str],
        decide: tuple[str, str],
    ) -> None:
        self._store = store
        self.embed_provider, self.embed_model = embed
        self.text_provider, self.text_model = text
        self.decide_provider, self.decide_model = decide

    async def embed(self, text: str) -> Call:
        found = self._store.call(embed_key(self.embed_model, text))
        if found is None:
            raise NotRecordedError("This message was not recorded with these settings.")
        return found

    async def complete(
        self, kind: str, system: str, messages: list[dict[str, Any]], max_tokens: int
    ) -> Call:
        found = self._store.call(complete_key(kind, self.text_model, system, messages, max_tokens))
        if found is None:
            raise NotRecordedError(f"No {kind} call was recorded for exactly this input.")
        return found

    async def decide(self, state: dict[str, Any], questions: dict[str, Any]) -> Call:
        found = self._store.call(decide_key(self.decide_model, state, questions))
        if found is None:
            raise NotRecordedError("No decide call was recorded for exactly this input.")
        return found


class FakeTextModel:
    """Offline stand-in for Claude (FAKE_PROVIDERS=true, tests): a judge that reads two words and
    a fixed short answer. Illustrative only; every event names provider="fake"."""

    provider = "fake"
    model = "fake-judge"

    async def complete(
        self, system: str, messages: list[dict[str, Any]], max_tokens: int
    ) -> Completion:
        prompt = str(messages[0]["content"]).lower()
        if messages[-1]["content"] == "{":
            label = "injection" if "ignore" in prompt or "system prompt" in prompt else "in"
            text = f'"label": "{label}", "confidence": 0.7, "reason": "Fake judge."}}'
        else:
            text = "An illustrative answer from the offline stand-in."
        return Completion(text, "end_turn", approx_tokens(system + prompt), approx_tokens(text))


class FakeDecisionModel:
    """Offline stand-in for the decision model: probabilities from two words. Illustrative only;
    every event names provider="fake"."""

    provider = "fake"
    model = "fake-decider"

    async def decide(self, state: Any, questions: dict[str, Any]) -> Decision:
        text = str(state).lower()
        if "ignore" in text or "system prompt" in text:
            probs = {"in": 0.05, "adjacent": 0.05, "out": 0.1, "injection": 0.8}
        else:
            probs = {"in": 0.6, "adjacent": 0.2, "out": 0.15, "injection": 0.05}
        answers = {"label": {"type": "choice", "choice": max(probs, key=probs.__getitem__),
                             "probabilities": probs}}  # fmt: skip
        return Decision(answers, approx_tokens(text + str(questions)), 0, 0.0)
