"""Fusion over the signals that ran, the threshold bands and the action."""

import pytest

from highnet_scope.fusion import ACTION_LABEL, Thresholds, Weights, decide, fuse, scope_score
from highnet_scope.presets import Label

IN: dict[Label, float] = {"in": 1.0, "adjacent": 0.0, "out": 0.0, "injection": 0.0}
OUT: dict[Label, float] = {"in": 0.0, "adjacent": 0.0, "out": 1.0, "injection": 0.0}


def test_no_active_signal_lands_in_the_middle_band() -> None:
    fused = fuse({"rules": None, "knn": None, "judge": None}, Weights())
    assert fused.label == "adjacent" and fused.used_weights == {} and fused.contributions == {}
    assert decide(fused.distribution, Thresholds())[0] == "answer_briefly"


def test_a_zero_weight_drops_a_signal_and_the_rest_are_reweighted() -> None:
    fused = fuse({"rules": OUT, "knn": IN, "judge": IN}, Weights(rules=0, knn=0.3, judge=0.1))
    assert fused.used_weights == {"knn": 0.75, "judge": 0.25}
    assert fused.distribution["in"] == 1.0 and fused.label == "in" and fused.confidence == 1.0
    assert fused.contributions["knn"]["in"] == 0.75
    assert fuse({"rules": IN}, Weights(rules=0)).used_weights == {}


def test_weights_are_averaged() -> None:
    fused = fuse({"rules": None, "knn": IN, "judge": OUT}, Weights(knn=0.5, judge=0.5))
    assert fused.distribution == {"in": 0.5, "adjacent": 0.0, "out": 0.5, "injection": 0.0}
    assert Weights().of("judge") == 0.4


@pytest.mark.parametrize(
    ("dist", "action", "score"),
    [
        ({"in": 0.2, "adjacent": 0.0, "out": 0.2, "injection": 0.6}, "block", 0.5),
        ({"in": 0.8, "adjacent": 0.0, "out": 0.2, "injection": 0.0}, "answer", 0.8),
        ({"in": 0.2, "adjacent": 0.6, "out": 0.2, "injection": 0.0}, "answer_briefly", 0.5),
        ({"in": 0.0, "adjacent": 0.2, "out": 0.8, "injection": 0.0}, "redirect", 0.1),
        ({"in": 0.0, "adjacent": 0.0, "out": 0.0, "injection": 0.4}, "answer_briefly", 0.5),
    ],
)
def test_threshold_bands(dist: dict[Label, float], action: str, score: float) -> None:
    assert decide(dist, Thresholds()) == (action, score)
    assert scope_score(dist) == score
    assert ACTION_LABEL[decide(dist, Thresholds())[0]] in ("in", "adjacent", "out", "injection")
