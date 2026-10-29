"""The Scope eval runner: every labeled prompt through rules, kNN, the judge and the fusion."""

from pathlib import Path
from typing import Any

from highnet_core.config import CoreSettings
from highnet_core.providers.base import Completion
from highnet_core.providers.fake import FakeEmbedder
from highnet_scope.fusion import Thresholds, Weights
from highnet_scope.models import FakeTextModel, LiveModels
from highnet_scope.presets import Label
from highnet_scope.store import Prompt, ScopeStore
from highnet_scope_evals.runner import (
    SWEEP,
    Collected,
    RowSignals,
    ScopeEvaluator,
    class_scores,
    method_signals,
    predict,
    rates,
)

SETTINGS = CoreSettings(fake_providers=True, _env_file=None)  # pyright: ignore[reportCallIssue]
IN: dict[Label, float] = {"in": 1.0, "adjacent": 0.0, "out": 0.0, "injection": 0.0}
INJECTION: dict[Label, float] = {"in": 0.0, "adjacent": 0.0, "out": 0.0, "injection": 1.0}


class PickyJudge:
    """Fails the call for one message, replies with invalid JSON for another."""

    provider = "fake"
    model = "fake-picky"

    def __init__(self, fail_on: str, invalid_on: str) -> None:
        self.fail_on, self.invalid_on = fail_on, invalid_on

    async def complete(
        self, system: str, messages: list[dict[str, Any]], max_tokens: int
    ) -> Completion:
        body = str(messages[0]["content"])
        if self.fail_on in body:
            raise RuntimeError("overloaded")
        if self.invalid_on in body:
            return Completion('"label": "perhaps"}', "end_turn", 10, 2)
        return Completion('"label": "in", "confidence": 0.8, "reason": "ok"}', "end_turn", 10, 5)


def evaluator(scope_db: Path, tmp_path: Path, text: Any = None) -> ScopeEvaluator:
    cache = ScopeStore(tmp_path / "cache.sqlite")
    models = LiveModels(cache, FakeEmbedder(64), text or FakeTextModel(), SETTINGS)
    return ScopeEvaluator(
        ScopeStore(scope_db, readonly=True), models, concurrency=2, log=lambda _: None
    )


def prompt(label: str, preset: str = "career") -> Prompt:
    return Prompt(f"{preset}-{label}", preset, label, "t", "text", [], [], "en", 0.0, 0.0)  # pyright: ignore[reportArgumentType]


async def test_a_full_run_scores_every_method(scope_db: Path, tmp_path: Path) -> None:
    ev = evaluator(scope_db, tmp_path)
    results = await ev.run("abc123", ("career", "bank"), limit=6)
    assert results.run.prompts == 12 and results.run.git_sha == "abc123"
    assert results.run.illustrative is True and results.run.embed_model == "fake-hashed-bow"
    assert [m.method for m in results.methods] == ["rules", "knn", "judge", "fused"]
    for m in results.methods:
        assert sum(map(sum, m.confusion)) == 12
        assert set(m.by_preset) == {"career", "bank"}
        assert [p.threshold for p in m.sweep] == SWEEP
        assert m.failed == 0
    judge = results.methods[2]
    assert judge.cost.calls == 12 and judge.abstained == 0
    assert results.methods[1].cost.calls == 12  # the embedding latency sample
    assert {(c.provider, c.model) for c in results.cost} == {
        ("fake", "fake-hashed-bow"),
        ("fake", "fake-judge"),
    }
    assert len(ev.details) == 12 and set(ev.details[0]) >= {"rules", "knn", "judge", "fused"}
    fused_wrong = {d["id"] for d in ev.details if d["fused"] != d["label"]}
    assert {m.id for m in results.misclassified} == fused_wrong


async def test_a_failed_or_invalid_judge_drops_out_for_that_row(
    scope_db: Path, tmp_path: Path
) -> None:
    _, prompts = ScopeStore(scope_db, readonly=True).prompts("recipe")
    ev = evaluator(scope_db, tmp_path, PickyJudge(prompts[0].text, prompts[1].text))
    collected = await ev.collect(("recipe",), limit=4)
    rows = collected.rows
    assert rows[0].judge is None and rows[0].judge_reason == "call failed: overloaded"
    assert rows[1].judge is None and rows[1].judge_reason.startswith("invalid: ")
    assert rows[2].judge is not None and rows[2].judge_reason == "ok"
    assert len(collected.judge_ms) == 3  # the failed call was never made
    methods, _ = ev.score(collected)
    assert methods[2].failed == 2 and methods[0].failed == 0


def test_score_without_any_model_call() -> None:
    row = RowSignals(prompt("in"), rules=None, knn=IN, rules_ms=0.5)
    collected = Collected(rows=[row])
    ev = ScopeEvaluator(None, None, log=lambda _: None)  # type: ignore[arg-type]
    methods, misclassified = ev.score(collected)
    by = {m.method: m for m in methods}
    assert by["rules"].abstained == 1 and by["judge"].abstained == 1 and by["knn"].abstained == 0
    assert by["judge"].cost.ms_median == 0.0 and by["judge"].cost.usd_mean == 0.0
    assert by["knn"].cost.calls == 0 and by["rules"].cost.ms_median == 0.5
    assert misclassified == []
    assert ev.details[0]["knn"] == "in" and ev.details[0]["rules"] == "adjacent"


def test_method_signals_and_predict() -> None:
    row = RowSignals(prompt("injection"), rules=INJECTION, knn=IN, judge=IN)
    assert method_signals("knn", row) == {"rules": None, "knn": IN, "judge": None}
    assert method_signals("fused", row) == {"rules": INJECTION, "knn": IN, "judge": IN}
    assert predict("rules", row, Weights(), Thresholds()) == "injection"
    assert predict("judge", row, Weights(), Thresholds()) == "in"


def test_rates_and_class_scores() -> None:
    pairs = [("in", "out"), ("adjacent", "adjacent"), ("out", "in"), ("injection", "out")]
    r = rates(pairs)  # pyright: ignore[reportArgumentType]
    assert (r.false_refusal, r.false_refusals, r.legitimate) == (0.5, 1, 2)
    assert (r.over_compliance, r.over_compliances, r.illegitimate) == (0.5, 1, 2)
    assert (r.injection_missed, r.injections, r.accuracy) == (1.0, 1, 0.25)
    empty = rates([])
    assert empty.false_refusal == empty.over_compliance == empty.accuracy == 0.0
    scores = {s.label: s for s in class_scores(pairs)}  # pyright: ignore[reportArgumentType]
    assert scores["out"].precision == 0.0 and scores["out"].recall == 0.0
    assert scores["adjacent"].precision == 1.0
    assert scores["injection"].precision is None and scores["injection"].recall == 0.0
    assert class_scores([])[0].recall is None


async def test_no_limit_reads_the_whole_preset(scope_db: Path, tmp_path: Path) -> None:
    ev = evaluator(scope_db, tmp_path)
    collected = await ev.collect(("rag",))
    assert len(collected.rows) == 300 and len(collected.embed_ms) == 24
