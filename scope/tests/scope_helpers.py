"""Shared helpers for the Scope tests (fixtures live in conftest.py)."""

import json
from pathlib import Path
from typing import Any

from highnet_core.providers.base import Completion
from highnet_core.trace import RunDone, TraceEvent
from highnet_scope.config import ScopeSettings
from highnet_scope.pipeline import Event

REPO = Path(__file__).resolve().parents[2]
GOLDEN = REPO / "evals/golden/scope"
EXAMPLES = REPO / "recordings/scope/examples.json"


def scope_settings(tmp: Path, **overrides: Any) -> ScopeSettings:
    base: dict[str, Any] = {
        "fake_providers": True,
        "embed_dims": 64,
        "scope_db_path": tmp / "scope.sqlite",
        "state_db_path": tmp / "state.sqlite",
        "scope_replay_speed": 1e9,
        "_env_file": None,
    }
    return ScopeSettings(**{**base, **overrides})  # pyright: ignore[reportArgumentType]


def by_stage(events: list[Event]) -> dict[str, TraceEvent]:
    return {e.stage: e for e in events if isinstance(e, TraceEvent)}


def done_of(events: list[Event]) -> RunDone:
    last = events[-1]
    assert isinstance(last, RunDone)
    return last


def parse_sse(body: str) -> list[tuple[str, dict[str, Any]]]:
    out: list[tuple[str, dict[str, Any]]] = []
    for block in body.strip().split("\n\n"):
        lines = block.splitlines()
        if not lines or lines[0].startswith(":"):
            continue
        out.append((lines[0].removeprefix("event: "), json.loads(lines[1].removeprefix("data: "))))
    return out


class ScriptedText:
    """A text model whose judge reply (and answer) the test chooses; it can also raise."""

    provider = "fake"
    model = "fake-scripted"

    def __init__(
        self,
        judge: str = '"label": "in", "confidence": 0.9, "reason": "ok"}',
        answer: str = "A scripted answer.",
        fail: type[Exception] | None = None,
        fail_kinds: tuple[str, ...] = ("judge",),
    ) -> None:
        self.judge, self.answer, self.fail, self.fail_kinds = judge, answer, fail, fail_kinds
        self.calls = 0

    async def complete(
        self, system: str, messages: list[dict[str, Any]], max_tokens: int
    ) -> Completion:
        self.calls += 1
        is_judge = messages[-1]["content"] == "{"
        if self.fail and ("judge" if is_judge else "answer") in self.fail_kinds:
            raise self.fail("scripted failure")
        return Completion(self.judge if is_judge else self.answer, "end_turn", 100, 10)
