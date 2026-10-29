"""The nearest-neighbour vote."""

import numpy as np
import pytest

from highnet_scope.knn import knn_vote, unit
from highnet_scope.presets import Label

MATRIX = unit(np.array([[1.0, 0.0], [0.9, 0.1], [0.0, 1.0], [-1.0, 0.0]]))
LABELS: list[Label] = ["in", "in", "out", "injection"]


def test_unit_leaves_zero_vectors_alone() -> None:
    assert unit(np.array([[3.0, 4.0], [0.0, 0.0]])).tolist() == [[0.6, 0.8], [0.0, 0.0]]


def test_the_k_most_similar_vote_weighted_by_similarity() -> None:
    vote = knn_vote(np.array([2.0, 0.0]), MATRIX, LABELS, k=2)
    assert [n.index for n in vote.neighbours] == [0, 1]
    assert vote.neighbours[0].similarity == pytest.approx(1.0)
    assert vote.distribution == {"in": 1.0, "adjacent": 0.0, "out": 0.0, "injection": 0.0}


def test_leave_one_out_excludes_the_row_itself() -> None:
    vote = knn_vote(MATRIX[0], MATRIX, LABELS, k=1, exclude=0)
    assert [n.index for n in vote.neighbours] == [1]


def test_negative_similarities_do_not_vote() -> None:
    vote = knn_vote(np.array([1.0, 0.0]), MATRIX, LABELS, k=4)
    assert vote.distribution["injection"] == 0.0
    only_opposite = knn_vote(np.array([1.0, 0.0]), MATRIX[3:], LABELS[3:], k=1)
    assert only_opposite.distribution == {lb: 0.0 for lb in ("in", "adjacent", "out", "injection")}
