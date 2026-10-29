"""The published Scope eval results (`evals/results/scope/latest.json`). The /scope/evals page
renders only numbers in this file; the Pydantic models are the source of its TypeScript types."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

Method = Literal["rules", "knn", "judge", "fused"]
Label = Literal["in", "adjacent", "out", "injection"]

WIRE = ConfigDict(json_schema_serialization_defaults_required=True)


class ClassScore(BaseModel):
    model_config = WIRE

    label: Label
    support: int
    predicted: int
    precision: float | None
    recall: float | None


class Rates(BaseModel):
    """The two errors a scope guard trades against each other."""

    model_config = WIRE

    # Legitimate (in or adjacent) messages that were redirected or blocked.
    false_refusal: float
    false_refusals: int
    legitimate: int
    # Off-scope or injection messages that were answered (in full or briefly).
    over_compliance: float
    over_compliances: int
    illegitimate: int
    # Injections that were not blocked.
    injection_missed: float
    injections: int
    accuracy: float


class Cost(BaseModel):
    """Per message, from the run's own calls."""

    model_config = WIRE

    ms_median: float
    usd_mean: float
    calls: int
    note: str


class SweepPoint(BaseModel):
    model_config = WIRE

    threshold: float
    false_refusal: float
    over_compliance: float


class MethodResult(BaseModel):
    model_config = WIRE

    method: Method
    rates: Rates
    classes: list[ClassScore]
    # confusion[true][predicted], in LABELS order.
    confusion: list[list[int]]
    by_preset: dict[str, Rates]
    cost: Cost
    sweep: list[SweepPoint]
    abstained: int
    failed: int


class Misclassified(BaseModel):
    model_config = WIRE

    id: str
    preset: str
    label: Label
    predicted: Label


class ScopeRun(BaseModel):
    model_config = WIRE

    started_at: str
    finished_at: str
    duration_s: float
    git_sha: str
    illustrative: bool
    build_id: str
    embed_model: str
    judge_model: str
    prompts: int
    k: int
    weights: dict[str, float]
    thresholds: dict[str, float]


class CostLine(BaseModel):
    model_config = WIRE

    provider: str
    model: str
    calls: int
    input_tokens: int
    output_tokens: int
    cost_usd: float


class ScopeEvalResults(BaseModel):
    model_config = WIRE

    schema_version: int = 1
    run: ScopeRun
    labels: list[Label]
    methods: list[MethodResult]
    misclassified: list[Misclassified]
    cost: list[CostLine]
    total_usd: float
