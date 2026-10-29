"""scope.sqlite round-trips: prompts and PCA, examples, recorded calls."""

from pathlib import Path

import numpy as np
import pytest

from highnet_core.storage.base import Projection
from highnet_scope.store import Call, Example, Prompt, ScopeStore, call_key, now, reading


def make_call(embedding: np.ndarray | None = None) -> Call:
    return Call(
        kind="embed" if embedding is not None else "judge",
        provider="fake",
        model="m",
        request={"input": "héllo"},
        response="r",
        embedding=embedding,
        input_tokens=3,
        output_tokens=1,
        ms=12,
        cost_usd=0.5,
        recorded_at="2026-01-01T00:00:00+00:00",
    )


def test_a_missing_file_cannot_be_opened_read_only(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError, match="highnet-scope ingest"):
        ScopeStore(tmp_path / "none.sqlite", readonly=True)


def test_prompts_and_projection_round_trip(tmp_path: Path) -> None:
    store = ScopeStore(tmp_path / "nested" / "scope.sqlite")
    rows = [
        Prompt("a", "career", "in", "cv", "one", [], ["t"], "en", 0.1, 0.2),
        Prompt(
            "b", "career", "out", "cooking", "two", [{"role": "user", "text": "x"}], [], "de", 0, 0
        ),
    ]
    projection = Projection(np.zeros(2), np.eye(2), (0.7, 0.3))
    store.save_prompts(rows, np.array([[3.0, 4.0], [0.0, 2.0]]), {"career": projection})
    matrix, prompts = store.prompts("career")
    assert prompts == rows
    assert matrix.tolist() == [[pytest.approx(0.6), pytest.approx(0.8)], [0.0, 1.0]]
    assert store.prompts("career")[1] is prompts  # cached
    assert store.all_prompts() == rows
    loaded = store.projection("career")
    assert loaded.explained_variance == (0.7, 0.3)
    assert store.projection("career") is loaded  # cached
    with pytest.raises(LookupError, match="No PCA stored for preset bank"):
        store.projection("bank")


def test_examples_meta_and_calls_round_trip(tmp_path: Path) -> None:
    store = ScopeStore(tmp_path / "scope.sqlite")
    assert store.recorded_at() is None and store.call("k") is None and store.call_stats() == []
    examples = [Example("e1", "rag", "q", [{"role": "user", "text": "t"}], "n", "normandy")]
    store.save_examples(examples)
    assert store.examples() == examples
    store.set_meta({"build_id": "abc"})
    assert store.meta() == {"build_id": "abc"}

    store.save_call("k1", make_call(np.array([1.0, 2.0])))
    store.save_call("k2", make_call())
    embedded = store.call("k1")
    judged = store.call("k2")
    assert embedded is not None and judged is not None
    assert embedded.embedding is not None and embedded.embedding.tolist() == [1.0, 2.0]
    assert judged.embedding is None and judged.request == {"input": "héllo"}
    assert store.recorded_at() == "2026-01-01T00:00:00+00:00"
    stats = {s["kind"]: s for s in store.call_stats()}
    assert stats["embed"]["calls"] == 1 and stats["judge"]["cost_usd"] == 0.5


def test_keys_and_readings() -> None:
    assert call_key("judge", "a", {"b": 1}) == call_key("judge", "a", {"b": 1})
    assert call_key("judge", "a") != call_key("answer", "a")
    assert reading("q", []) == "q"
    assert reading("q", [{"role": "user", "text": "hi"}]) == "user: hi\nuser: q"
    assert now().endswith("+00:00")
