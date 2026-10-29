"""Step 6 · the nearest-neighbour vote. The message's embedding is compared with every labeled
prompt of the preset by cosine similarity; the k most similar vote with their labels, each vote
weighted by its similarity. The labels come from the scope definition in force, so moving a topic
to another class changes the vote without any new embedding.
"""

from dataclasses import dataclass

import numpy as np

from highnet_scope.presets import LABELS, Label

DEFAULT_K = 7


@dataclass
class Neighbour:
    index: int
    similarity: float
    label: Label


@dataclass
class Vote:
    neighbours: list[Neighbour]
    distribution: dict[Label, float]


def unit(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=-1, keepdims=True)
    return vectors / np.where(norms == 0, 1.0, norms)


# snippet: knn | Cosine similarity and the weighted vote
def knn_vote(
    query: np.ndarray,
    matrix: np.ndarray,
    labels: list[Label],
    k: int = DEFAULT_K,
    exclude: int | None = None,
) -> Vote:
    """`matrix` rows are unit vectors; `exclude` leaves one row out (leave-one-out evals)."""
    similarity = matrix @ unit(query)  # cosine similarity, since both sides have length 1
    if exclude is not None:
        similarity[exclude] = -np.inf
    top = np.argsort(-similarity)[:k]
    neighbours = [Neighbour(int(i), float(similarity[i]), labels[i]) for i in top]
    weights: dict[Label, float] = {label: 0.0 for label in LABELS}
    for n in neighbours:
        weights[n.label] += max(n.similarity, 0.0)
    total = sum(weights.values()) or 1.0
    distribution: dict[Label, float] = {lb: round(w / total, 6) for lb, w in weights.items()}
    return Vote(neighbours, distribution)


# /snippet
