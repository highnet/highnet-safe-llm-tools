"""`highnet-scope record`: every example message, run once through the pipeline with the real
models, with and without its conversation context. A visit then replays these calls.

Besides the run itself, both answers are recorded (the full one and the brief one), so a visitor
who moves a threshold and changes the action still gets a real recorded answer. The judge is
recorded with each preset's original rubric only; an edited rubric is skipped on replay, honestly.
Calls already in the store are reused, so a rerun resumes and pays only for what is missing.
"""

from collections.abc import Callable
from dataclasses import dataclass, field

from highnet_core.trace import RunDone
from highnet_scope.models import LiveModels
from highnet_scope.pipeline import ScopeDeps, ScopeParams, answer_messages, answer_system, run_scope
from highnet_scope.presets import load_preset
from highnet_scope.store import Example


@dataclass
class RecorderState:
    """The recorder's own ledger: no rate limit, no visitor budget (the owner pays)."""

    def record_run(self, run_id: str, ip_hash: str, settings_json: str) -> None:
        return None

    def finish_run(self, run_id: str, status: str, ms: int, cost_usd: float) -> None:
        return None

    def record_spend(
        self,
        run_id: str | None,
        provider: str,
        model: str,
        stage: str,
        input_tokens: int,
        output_tokens: int,
        cost_usd: float,
    ) -> None:
        return None  # the recorder's spend is counted from the calls it paid for

    def month_spend(self) -> float:
        return 0.0

    def runs_since(self, ip_hash: str, seconds: int) -> int:
        return 0


@dataclass
class RecordReport:
    runs: int = 0
    failed: list[str] = field(default_factory=list)
    calls: int = 0
    cost_usd: float = 0.0


def context_modes(example: Example) -> tuple[bool, ...]:
    return (True, False) if example.context else (True,)


async def record_examples(
    examples: list[Example],
    deps: ScopeDeps,
    models: LiveModels,
    log: Callable[[str], None] = print,
) -> RecordReport:
    report = RecordReport()
    rig = ScopeDeps(deps.settings, deps.store, RecorderState(), models)
    for example in examples:
        preset = load_preset(example.preset)
        for use_context in context_modes(example):
            params = ScopeParams(
                preset=example.preset, example_id=example.id, use_context=use_context
            )
            status = "unfinished"
            async for item in run_scope(params, rig, "recorder"):
                if isinstance(item, RunDone):
                    status = item.status
            report.runs += 1
            if status != "ok":
                report.failed.append(f"{example.id} context={use_context}: {status}")
            if preset.id != "rag":
                turns = example.context if use_context else []
                for brief in (False, True):
                    cap = (
                        deps.settings.scope_brief_max_tokens
                        if brief
                        else deps.settings.scope_answer_max_tokens
                    )
                    await models.complete(
                        "brief" if brief else "answer",
                        answer_system(preset, brief),
                        answer_messages(example.text, turns[-deps.settings.scope_context_turns :]),
                        cap,
                    )
        log(f"{example.id}: recorded ({len(models.paid)} calls paid so far)")
    report.calls = len(models.paid)
    report.cost_usd = round(sum(c.cost_usd for c in models.paid), 6)
    return report
