"""Scope's twelve stages. The event models are shared (`highnet_core.trace`); this narrows `stage`
so the exported JSON Schema, and the TypeScript types generated from it, list exactly these."""

from typing import Literal

from highnet_core.trace import TraceEvent as CoreTraceEvent

ScopeStage = Literal[
    "request",
    "context",
    "rules",
    "embed",
    "map",
    "knn",
    "judge",
    "decide",
    "fuse",
    "thresholds",
    "respond",
    "audit",
]
STAGES: tuple[ScopeStage, ...] = (
    "request",
    "context",
    "rules",
    "embed",
    "map",
    "knn",
    "judge",
    "decide",
    "fuse",
    "thresholds",
    "respond",
    "audit",
)


class ScopeTraceEvent(CoreTraceEvent):
    """SSE `event: trace` from `/api/scope/run`."""

    stage: ScopeStage
