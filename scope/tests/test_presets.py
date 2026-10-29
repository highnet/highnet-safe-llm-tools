"""Scope definitions: loading, the visitor's edit, and the rubric fingerprint."""

import pytest

from highnet_scope.presets import INJECTION_TOPIC, PRESET_IDS, all_presets, load_preset


def test_every_preset_loads_with_a_fixed_injection_topic() -> None:
    presets = all_presets()
    assert [p.id for p in presets] == list(PRESET_IDS)
    for preset in presets:
        assert preset.topic_class()[INJECTION_TOPIC] == "injection"


def test_an_unknown_preset_is_a_key_error() -> None:
    with pytest.raises(KeyError, match="Unknown preset 'nope'"):
        load_preset("nope")


def test_an_edit_moves_topics_but_never_the_injection_topic() -> None:
    career = load_preset("career")
    edited = career.with_classes({"salary": "out", INJECTION_TOPIC: "in"})
    assert edited.topic_class()["salary"] == "out"
    assert edited.topic_class()[INJECTION_TOPIC] == "injection"
    # The original is untouched, and the judge's rubric fingerprint changes with the edit.
    assert career.topic_class()["salary"] == "in"
    assert edited.rubric_hash() != career.rubric_hash()
    assert career.with_classes({"salary": "in"}).rubric_hash() == career.rubric_hash()
    assert len(career.rubric_hash()) == 12
