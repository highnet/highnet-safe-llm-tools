"""Scope: one message through twelve steps, one trace event per step (ARCHITECTURE section 13).

Rule zero holds here too: if a step runs, it emits a trace event, and a step that does not run
says why (switched off, nothing to read, rubric changed, budget). On a visit the three model
steps (embed, judge, decide) and the answer are replayed from recordings; everything else is
computed now, so weights, thresholds, toggles and an edited scope definition change the run at
no model cost.
"""

import asyncio
import hashlib
import json
import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from pydantic import BaseModel, Field, ValidationError

from highnet_core.budget import budget_state, rate_state
from highnet_core.storage.base import StateStore
from highnet_core.trace import RunDone, StageClock, TraceEvent, Tracer
from highnet_scope.config import ScopeSettings
from highnet_scope.decider import (
    InvalidDecisionError,
    decision_distribution,
    decision_questions,
    decision_state,
)
from highnet_scope.fusion import Fused, Signal, Thresholds, Weights, decide, fuse, scope_score
from highnet_scope.judge import (
    JUDGE_MAX_TOKENS,
    judge_messages,
    judge_system,
    parse_verdict,
    verdict_distribution,
)
from highnet_scope.knn import DEFAULT_K, knn_vote
from highnet_scope.models import NotRecordedError, ScopeModels
from highnet_scope.presets import Label, Preset, TopicClass, load_preset
from highnet_scope.rules import run_rules
from highnet_scope.store import Call, Example, ScopeStore, Turn, reading
from highnet_scope.text import detect_language, views

Event = TraceEvent | RunDone
# A replay keeps a model step's recorded pace, but no pause longer than this.
MAX_PAUSE_MS = 1500
RUBRIC_CHANGED = "rubric changed; this run was recorded with the original rubric"


class ScopeParams(BaseModel):
    preset: str
    example_id: str | None = None
    text: str | None = None
    context: list[Turn] = Field(default_factory=list)
    use_context: bool = True
    rules: bool = True
    knn: bool = True
    judge: bool = True
    decide: bool = True
    weights: Weights = Field(default_factory=Weights)
    thresholds: Thresholds = Field(default_factory=Thresholds)
    k: int = Field(default=DEFAULT_K, ge=1, le=15)
    # The visitor's edit of the scope definition: topic id -> its new class.
    overrides: dict[str, TopicClass] = Field(default_factory=dict)


@dataclass
class ScopeDeps:
    settings: ScopeSettings
    store: ScopeStore
    state: StateStore
    models: ScopeModels


@dataclass
class Costs:
    """What each signal's steps took in this run, for the cost/latency trade-off."""

    ms: dict[str, int] = field(default_factory=dict)
    usd: dict[str, float] = field(default_factory=dict)

    def add(self, signal: str, ms: int, usd: float) -> None:
        self.ms[signal] = self.ms.get(signal, 0) + ms
        self.usd[signal] = round(self.usd.get(signal, 0.0) + usd, 6)


def new_run_id() -> str:
    return uuid.uuid4().hex


def clip(text: str, limit: int = 160) -> str:
    return text if len(text) <= limit else text[: limit - 1] + "…"


async def run_scope(
    params: ScopeParams, deps: ScopeDeps, ip_hash: str, run_id: str | None = None
) -> AsyncIterator[Event]:
    settings, state, store, models = deps.settings, deps.state, deps.store, deps.models
    tracer = Tracer(run_id or new_run_id())
    costs = Costs()

    def finish(status: str | None = None) -> RunDone:
        done = tracer.done(status)  # type: ignore[arg-type]
        state.finish_run(tracer.run_id, done.status, done.ms, done.cost_usd)
        return done

    def spend(stage: str, call: Call) -> None:
        # Only a call made now costs anything; a replayed call was paid when it was recorded.
        if models.live and call.cost_usd:
            state.record_spend(
                tracer.run_id, call.provider, call.model, stage,
                call.input_tokens, call.output_tokens, call.cost_usd,
            )  # fmt: skip

    async def pace(call: Call) -> None:
        if not models.live:
            await asyncio.sleep(min(call.ms, MAX_PAUSE_MS) / 1000 / settings.scope_replay_speed)

    def recorded(call: Call) -> dict[str, Any]:
        return {"recorded_at": call.recorded_at, "replayed": not models.live}

    # snippet: request | Check the request: preset, length, language, rate limit, budget
    # 1 · request: the checks that run before anything is read.
    clock = StageClock()
    rate = rate_state(state, ip_hash, settings)
    budget = budget_state(state, settings)
    state.record_run(tracer.run_id, ip_hash, params.model_dump_json())
    example: Example | None = None
    preset: Preset | None = None
    refusal: tuple[str, str] | None = None
    try:
        preset = load_preset(params.preset)
    except KeyError:
        refusal = ("unknown_preset", f"No preset named {params.preset!r}.")
    if params.example_id is not None:
        example = next((e for e in store.examples() if e.id == params.example_id), None)
        if example is None or example.preset != params.preset:
            refusal = refusal or ("unknown_example", "Pick one of the listed messages.")
    message = example.text if example else (params.text or "")
    turns = example.context if example else params.context
    language, language_words = detect_language(message)
    request_data: dict[str, Any] = {
        "run_id": tracer.run_id,
        "preset": params.preset,
        "example_id": params.example_id,
        "message": message,
        "chars": len(message),
        "max_chars": settings.scope_max_message_chars,
        "language": language,
        "language_words": language_words,
        "settings": params.model_dump(exclude={"text", "context", "example_id", "preset"}),
        "models": {
            "embed": {"provider": models.embed_provider, "model": models.embed_model},
            "judge": {"provider": models.text_provider, "model": models.text_model},
            "decide": {"provider": models.decide_provider, "model": models.decide_model},
        },
        "live": models.live,
        "recorded_at": store.recorded_at() if not models.live else None,
        "rate_limit": rate.as_dict(),
        "budget": budget.as_dict(),
    }
    if refusal is None:
        if rate.limited:
            refusal = ("rate_limited", "You've reached the request limit for now. Try later.")
        elif models.live and budget.tier == "stopped":
            refusal = ("budget_exhausted", "This month's API budget is used up until the 1st.")
        elif not message.strip():
            refusal = ("empty", "There is no message to check.")
        elif len(message) > settings.scope_max_message_chars:
            refusal = (
                "too_long",
                f"Messages are capped at {settings.scope_max_message_chars} characters.",
            )
    if refusal:
        request_data["error"] = {"type": refusal[0], "message": refusal[1]}
        yield tracer.event("request", clock, request_data, status="error")
        yield finish("limited" if refusal[0] in ("rate_limited", "budget_exhausted") else "error")
        return
    assert preset is not None
    yield tracer.event("request", clock, request_data)
    # /snippet

    # snippet: context | Add the conversation context
    # 2 · context: earlier turns can change how the message reads.
    clock = StageClock()
    used_turns = turns[-settings.scope_context_turns :] if params.use_context else []
    text = reading(message, used_turns)
    if not turns:
        yield tracer.skipped("context", "This message has no earlier turns.")
    elif not params.use_context:
        yield tracer.event(
            "context",
            clock,
            {"reason": "Context is switched off: the message is read on its own.", "turns": turns},
            status="skipped",
        )
    else:
        yield tracer.event(
            "context",
            clock,
            {"turns": used_turns, "dropped": len(turns) - len(used_turns), "reading": text},
        )
    # /snippet

    edited = preset.with_classes(params.overrides) if params.overrides else preset
    changed = sorted(t for t, c in params.overrides.items() if preset.topic_class().get(t) != c)
    signals: dict[Signal, dict[Label, float] | None] = {
        "rules": None,
        "knn": None,
        "judge": None,
        "decide": None,
    }
    rule_hits: list[str] = []

    # 3 · rules: injection patterns in every view of the message, topic keywords.
    clock = StageClock()
    if not params.rules:
        yield tracer.skipped("rules", "The rules signal is switched off in the settings.")
    else:
        result = run_rules(views(reading(message, used_turns)), edited)
        signals["rules"] = result.distribution
        rule_hits = sorted({h.rule for h in result.hits if h.kind != "topic"})
        costs.add("rules", clock.ms(), 0.0)
        yield tracer.event(
            "rules",
            clock,
            {
                "hits": [h.as_dict() for h in result.hits],
                "injection_score": result.injection_score,
                "topic_votes": result.topic_votes,
                "distribution": result.distribution,
                "abstained": result.distribution is None,
            },
        )

    # 4 · embed, 5 · map, 6 · knn: the embedding only serves the map and the vote.
    vector: np.ndarray | None = None
    if not params.knn:
        reason = "The kNN signal is switched off, so nothing needs an embedding."
        yield tracer.skipped("embed", reason)
        yield tracer.skipped("map", reason)
        yield tracer.skipped("knn", "The kNN signal is switched off in the settings.")
    else:
        # snippet: embed | Embed the message (replayed from the recording on a visit)
        clock = StageClock()
        try:
            call = await models.embed(text)
        except Exception as exc:
            yield tracer.error("embed", clock, exc)
            yield tracer.skipped("map", "There is no embedding to place.")
            yield tracer.skipped("knn", "There is no embedding to compare.")
        else:
            await pace(call)
            assert call.embedding is not None
            vector = call.embedding
            spend("embed", call)
            costs.add("knn", call.ms, call.cost_usd)
            yield tracer.event(
                "embed",
                clock,
                {
                    "provider": call.provider,
                    "model": call.model,
                    "input": text,
                    "input_type": "query",
                    "dims": int(vector.shape[0]),
                    "vector_preview": [round(float(v), 4) for v in vector[:8]],
                    "norm": round(float(np.linalg.norm(vector)), 4),
                    **recorded(call),
                },
                tokens=call.input_tokens,
                cost_usd=call.cost_usd,
                ms=call.ms,
            )
        # /snippet

    if vector is not None:
        # snippet: map | Place the message on the map
        clock = StageClock()
        matrix, prompts = store.prompts(params.preset)
        projection = store.projection(params.preset)
        x, y = projection.project(vector)
        points = np.array([[p.x, p.y] for p in prompts])
        near = np.argsort(np.hypot(points[:, 0] - x, points[:, 1] - y))[:5]
        yield tracer.event(
            "map",
            clock,
            {
                "x": round(x, 5),
                "y": round(y, 5),
                "explained_variance": list(projection.explained_variance),
                "points": len(prompts),
                "neighbours_2d": [prompts[i].id for i in near],
            },
        )
        # /snippet

        # 6 · knn: the labels follow the definition in force, edits included.
        clock = StageClock()
        topic_class = edited.topic_class()
        labels: list[Label] = [topic_class[p.topic] for p in prompts]
        vote = knn_vote(vector, matrix, labels, params.k)
        signals["knn"] = vote.distribution
        costs.add("knn", clock.ms(), 0.0)
        yield tracer.event(
            "knn",
            clock,
            {
                "k": params.k,
                "metric": "cosine",
                "neighbours": [
                    {
                        "id": prompts[n.index].id,
                        "text": clip(prompts[n.index].text),
                        "topic": prompts[n.index].topic,
                        "label": n.label,
                        "relabelled": n.label != prompts[n.index].label,
                        "similarity": round(n.similarity, 4),
                    }
                    for n in vote.neighbours
                ],
                "distribution": vote.distribution,
                "relabelled_topics": changed,
            },
        )

    # snippet: judge | Ask the judge, then validate its JSON
    # 7 · judge: Claude reads the rubric and the message (as data) and must reply in JSON.
    clock = StageClock()
    system = judge_system(edited)
    messages = judge_messages(message, used_turns)
    if not params.judge:
        yield tracer.skipped("judge", "The LLM judge is switched off in the settings.")
    elif changed and not models.live:
        yield tracer.event(
            "judge",
            clock,
            {"reason": RUBRIC_CHANGED, "relabelled_topics": changed, "system": system},
            status="skipped",
        )
    elif models.live and budget.tier != "normal":
        yield tracer.skipped("judge", "The budget is past 80%, so the judge is switched off.")
    else:
        judge_data: dict[str, Any] = {"system": system, "messages": messages}
        try:
            call = await models.complete("judge", system, messages, JUDGE_MAX_TOKENS)
        except Exception as exc:
            judge_data["error"] = {"type": type(exc).__name__, "message": str(exc)}
            yield tracer.event("judge", clock, judge_data, status="error")
        else:
            await pace(call)
            spend("judge", call)
            costs.add("judge", call.ms, call.cost_usd)
            judge_data |= {
                "provider": call.provider,
                "model": call.model,
                "max_tokens": JUDGE_MAX_TOKENS,
                "raw": "{" + call.response,
                **recorded(call),
            }
            try:
                verdict = parse_verdict(call.response)
            except (ValueError, ValidationError) as exc:
                # A reply that is not exactly the schema fails the step; the judge drops out.
                judge_data["error"] = {"type": "invalid_verdict", "message": str(exc)}
                status = "error"
            else:
                judge_data["verdict"] = verdict.model_dump()
                judge_data["distribution"] = signals["judge"] = verdict_distribution(verdict)
                status = "ok"
            yield tracer.event(
                "judge",
                clock,
                judge_data,
                status=status,
                tokens=call.input_tokens + call.output_tokens,
                cost_usd=call.cost_usd,
                ms=call.ms,
            )
    # /snippet

    # snippet: decide | Ask the second judge: a probability for every label
    # 8 · decide: a decision model answers one typed question; no reply to parse.
    clock = StageClock()
    questions = decision_questions(edited)
    state_in = decision_state(message, used_turns)
    if not params.decide:
        yield tracer.skipped("decide", "The second judge is switched off in the settings.")
    elif changed and not models.live:
        yield tracer.event(
            "decide",
            clock,
            {"reason": RUBRIC_CHANGED, "relabelled_topics": changed, "questions": questions},
            status="skipped",
        )
    elif models.live and budget.tier != "normal":
        yield tracer.skipped("decide", "The budget is past 80%, so the second judge is off.")
    else:
        decide_data: dict[str, Any] = {"state": state_in, "questions": questions}
        try:
            call = await models.decide(state_in, questions)
        except Exception as exc:
            decide_data["error"] = {"type": type(exc).__name__, "message": str(exc)}
            yield tracer.event("decide", clock, decide_data, status="error")
        else:
            await pace(call)
            spend("decide", call)
            costs.add("decide", call.ms, call.cost_usd)
            reply = json.loads(call.response)
            decide_data |= {
                "provider": call.provider,
                "model": call.model,
                "answers": reply["answers"],
                "reported_cost_usd": reply["reported_cost_usd"],
                **recorded(call),
            }
            try:
                dist = decision_distribution(reply["answers"])
            except InvalidDecisionError as exc:
                decide_data["error"] = {"type": "invalid_decision", "message": str(exc)}
                status = "error"
            else:
                decide_data["distribution"] = signals["decide"] = dist
                decide_data["choice"] = max(dist, key=lambda k: dist[k])
                status = "ok"
            yield tracer.event(
                "decide",
                clock,
                decide_data,
                status=status,
                tokens=call.input_tokens + call.output_tokens,
                cost_usd=call.cost_usd,
                ms=call.ms,
            )
    # /snippet

    # 9 · fuse: a weighted average over the signals that ran.
    clock = StageClock()
    active = {s: d for s, d in signals.items() if getattr(params, s) and d is not None}
    fused: Fused = fuse({s: active.get(s) for s in signals}, params.weights)
    tiers = [
        ("rules",),
        ("rules", "knn"),
        ("rules", "knn", "judge"),
        ("rules", "knn", "judge", "decide"),
    ]
    yield tracer.event(
        "fuse",
        clock,
        {
            "weights": params.weights.model_dump(),
            "used_weights": fused.used_weights,
            "signals": {s: signals[s] for s in signals},
            "contributions": fused.contributions,
            "distribution": fused.distribution,
            "label": fused.label,
            "confidence": fused.confidence,
            # The cost/latency trade-off, from this run's own steps.
            "tradeoff": {
                "per_signal": {
                    s: {"ms": costs.ms.get(s, 0), "cost_usd": costs.usd.get(s, 0.0)}
                    for s in signals
                },
                "cumulative": [
                    {
                        "signals": list(t),
                        "ms": sum(costs.ms.get(s, 0) for s in t),
                        "cost_usd": round(sum(costs.usd.get(s, 0.0) for s in t), 6),
                    }
                    for t in tiers
                ],
            },
        },
    )

    # 10 · thresholds: which band the fused scores fall in.
    clock = StageClock()
    action, score = decide(fused.distribution, params.thresholds)
    yield tracer.event(
        "thresholds",
        clock,
        {
            "thresholds": params.thresholds.model_dump(),
            "p_injection": fused.distribution["injection"],
            "scope_score": score,
            "action": action,
        },
    )

    # snippet: respond | Choose the action and respond, under a hard length cap
    # 11 · respond: the action, and what the product says back.
    clock = StageClock()
    respond: dict[str, Any] = {"action": action}
    status = "ok"
    tokens, spent, ms = 0, 0.0, None
    if action == "redirect":
        respond["text"] = preset.redirect
    elif action == "block":
        respond["text"] = preset.block
    elif preset.id == "rag":
        respond["handoff"] = "rag"
        respond["rag_question"] = example.rag_question if example else None
        respond["brief"] = action == "answer_briefly"
    else:
        brief = action == "answer_briefly"
        cap = settings.scope_brief_max_tokens if brief else settings.scope_answer_max_tokens
        chars = settings.scope_brief_max_chars if brief else settings.scope_answer_max_chars
        system = answer_system(preset, brief)
        conversation = answer_messages(message, used_turns)
        respond |= {"system": system, "max_tokens": cap, "max_chars": chars}
        try:
            call = await models.complete("brief" if brief else "answer", system, conversation, cap)
        except NotRecordedError as exc:
            status = "warning"
            respond["error"] = {"type": "not_recorded", "message": str(exc)}
        else:
            await pace(call)
            spend("respond", call)
            respond |= {
                "provider": call.provider,
                "model": call.model,
                "text": call.response[:chars],
                "truncated": len(call.response) > chars,
                **recorded(call),
            }
            tokens, spent, ms = call.input_tokens + call.output_tokens, call.cost_usd, call.ms
    yield tracer.event(
        "respond", clock, respond, status=status, tokens=tokens, cost_usd=spent, ms=ms
    )
    # /snippet

    # snippet: audit | The record kept for human review
    # 12 · audit: what a real deployment would store for a reviewer (shown, not stored here).
    clock = StageClock()
    agree = {max(d, key=lambda k: d[k]) for d in active.values()}
    review = fused.confidence < 0.6 or len(agree) > 1 or action == "block"
    yield tracer.event(
        "audit",
        clock,
        {
            "stored": False,
            "record": {
                "run_id": tracer.run_id,
                "preset": preset.id,
                "message_sha256": hashlib.sha256(message.encode()).hexdigest(),
                "action": action,
                "label": fused.label,
                "confidence": fused.confidence,
                "scope_score": scope_score(fused.distribution),
                "signals": {s: max(d, key=lambda k: d[k]) for s, d in active.items()},
                "rule_hits": rule_hits,
                "rubric": edited.rubric_hash(),
                "relabelled_topics": changed,
                "needs_review": review,
            },
            "review_reasons": [
                r
                for r, on in (
                    ("low confidence", fused.confidence < 0.6),
                    ("signals disagree", len(agree) > 1),
                    ("blocked", action == "block"),
                )
                if on
            ],
        },
    )
    # /snippet
    yield finish()


def answer_system(preset: Preset, brief: bool) -> str:
    if brief:
        return (
            f"{preset.answer_style} This message is adjacent to what you are for: answer in at "
            "most two sentences, then say in a few words what you mainly help with."
        )
    return f"{preset.answer_style} Keep the answer under 200 words."


def answer_messages(message: str, context: list[Turn]) -> list[dict[str, Any]]:
    turns = [{"role": t["role"], "content": t["text"]} for t in context]
    return [*turns, {"role": "user", "content": message}]
