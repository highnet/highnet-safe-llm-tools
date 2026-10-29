"""Steps 8 to 10 · fuse the signals, apply the thresholds, choose the action.

Each signal gives a distribution over the four labels. The fusion is their weighted average over
the signals that ran (a skipped or failed signal drops out and the rest are re-weighted). The
thresholds then read two numbers from the fused distribution: the injection probability, and a
scope score from 0 (off scope) to 1 (in scope) in which adjacent counts half.
"""

from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, Field

from highnet_scope.presets import LABELS, Label

Signal = Literal["rules", "knn", "judge", "decide"]
SIGNALS: tuple[Signal, ...] = ("rules", "knn", "judge", "decide")
Action = Literal["answer", "answer_briefly", "redirect", "block"]
ACTION_LABEL: dict[Action, Label] = {
    "answer": "in",
    "answer_briefly": "adjacent",
    "redirect": "out",
    "block": "injection",
}


class Weights(BaseModel):
    rules: float = Field(default=0.25, ge=0, le=1)
    knn: float = Field(default=0.35, ge=0, le=1)
    judge: float = Field(default=0.4, ge=0, le=1)
    # The second judge counts as much as the first; neither weight was tuned on the evals.
    decide: float = Field(default=0.4, ge=0, le=1)

    def of(self, signal: Signal) -> float:
        return getattr(self, signal)


class Thresholds(BaseModel):
    block: float = Field(
        default=0.5, ge=0, le=1, description="Block when P(injection) reaches this."
    )
    answer: float = Field(
        default=0.7, ge=0, le=1, description="Answer in full at this scope score."
    )
    brief: float = Field(
        default=0.4, ge=0, le=1, description="Answer briefly from here; below: redirect."
    )


@dataclass
class Fused:
    distribution: dict[Label, float]
    contributions: dict[Signal, dict[Label, float]]
    used_weights: dict[Signal, float]
    confidence: float
    label: Label


# snippet: fuse | Weighted fusion over the signals that ran
def fuse(signals: dict[Signal, dict[Label, float] | None], weights: Weights) -> Fused:
    active: dict[Signal, dict[Label, float]] = {
        s: d for s, d in signals.items() if d is not None and weights.of(s) > 0
    }
    total = sum(weights.of(s) for s in active)
    if not active:
        # Nothing to go on: no label is favoured, so the scope score lands in the middle band.
        flat: dict[Label, float] = {"in": 1 / 3, "adjacent": 1 / 3, "out": 1 / 3, "injection": 0.0}
        return Fused(flat, {}, {}, round(1 / 3, 6), "adjacent")
    used: dict[Signal, float] = {s: weights.of(s) / total for s in active}
    contributions: dict[Signal, dict[Label, float]] = {
        s: {lb: round(used[s] * active[s][lb], 6) for lb in LABELS} for s in active
    }
    fused: dict[Label, float] = {
        lb: round(sum(used[s] * active[s][lb] for s in active), 6) for lb in LABELS
    }
    label = max(LABELS, key=lambda lb: fused[lb])
    rounded: dict[Signal, float] = {s: round(w, 6) for s, w in used.items()}
    return Fused(fused, contributions, rounded, fused[label], label)


# /snippet


# snippet: thresholds,respond | Threshold bands and the action
def scope_score(dist: dict[Label, float]) -> float:
    """0 = off scope, 1 = in scope; adjacent counts half. Injection is judged separately."""
    mass = dist["in"] + dist["adjacent"] + dist["out"]
    return round((dist["in"] + 0.5 * dist["adjacent"]) / mass, 6) if mass else 0.5


def decide(dist: dict[Label, float], t: Thresholds) -> tuple[Action, float]:
    if dist["injection"] >= t.block:
        return "block", scope_score(dist)
    score = scope_score(dist)
    if score >= t.answer:
        return "answer", score
    if score >= t.brief:
        return "answer_briefly", score
    return "redirect", score


# /snippet
