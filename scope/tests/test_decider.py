"""The second judge's question and how its reply becomes a distribution."""

import pytest

from highnet_scope.decider import (
    InvalidDecisionError,
    decision_distribution,
    decision_questions,
    decision_state,
)
from highnet_scope.presets import load_preset


def test_the_question_carries_the_scope_definition() -> None:
    preset = load_preset("career")
    question = decision_questions(preset)["label"]
    assert question["type"] == "choice"
    assert set(question["criteria"]) == {"in", "adjacent", "out", "injection"}
    in_scope = [t.name for t in preset.topics if t.class_ == "in"]
    assert in_scope[0] in question["criteria"]["in"]
    assert preset.product in question["instructions"]
    empty = preset.with_classes({t.id: "in" for t in preset.topics if t.class_ == "out"})
    assert decision_questions(empty)["label"]["criteria"]["out"].endswith("(none)")


def test_the_state_holds_the_message_and_any_turns_as_data() -> None:
    assert decision_state("hi", []) == {"message": "hi"}
    turns = [{"role": "assistant", "text": "Hello", "extra": "x"}]
    assert decision_state("hi", turns)["conversation"] == [{"role": "assistant", "text": "Hello"}]


def test_probabilities_are_normalised_and_bad_replies_fail() -> None:
    probs = {"in": 2, "adjacent": 1, "out": 1, "injection": 0}
    dist = decision_distribution({"label": {"probabilities": probs}})
    assert dist == {"in": 0.5, "adjacent": 0.25, "out": 0.25, "injection": 0.0}
    with pytest.raises(InvalidDecisionError, match="every label"):
        decision_distribution({"label": {"probabilities": {"in": 1}}})
    with pytest.raises(InvalidDecisionError, match="distribution"):
        decision_distribution({"label": {"probabilities": dict.fromkeys(probs, 0)}})
    with pytest.raises(InvalidDecisionError, match="distribution"):
        decision_distribution(
            {"label": {"probabilities": {"in": 2, "adjacent": -1, "out": 0, "injection": 0}}}
        )
