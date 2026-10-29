"""Storage interfaces both products share: the spend and request ledger, and the 2D projection
fitted at ingest. Pipeline code depends only on these Protocols, never on sqlite3."""

from dataclasses import dataclass
from typing import Protocol

import numpy as np


@dataclass(frozen=True)
class Projection:
    """PCA fitted at ingest: 2D = (v - mean) @ components.T"""

    mean: np.ndarray
    components: np.ndarray
    explained_variance: tuple[float, float]

    # snippet: map_project,scope/map | Project a vector to 2D
    def project(self, vector: np.ndarray) -> tuple[float, float]:
        x, y = (vector - self.mean) @ self.components.T
        return float(x), float(y)

    # /snippet


class StateStore(Protocol):
    def record_run(self, run_id: str, ip_hash: str, settings_json: str) -> None: ...
    def finish_run(self, run_id: str, status: str, ms: int, cost_usd: float) -> None: ...
    def record_spend(
        self,
        run_id: str | None,
        provider: str,
        model: str,
        stage: str,
        input_tokens: int,
        output_tokens: int,
        cost_usd: float,
    ) -> None: ...
    def month_spend(self) -> float: ...
    def runs_since(self, ip_hash: str, seconds: int) -> int: ...
