"""The recorder: every example through the pipeline, with both answers, resumable."""

from pathlib import Path

from scope_helpers import ScriptedText, scope_settings

from highnet_core.providers.fake import FakeEmbedder
from highnet_core.storage.state import SqliteStateStore
from highnet_scope.models import LiveModels
from highnet_scope.pipeline import ScopeDeps
from highnet_scope.recorder import RecorderState, context_modes, record_examples
from highnet_scope.store import Example, ScopeStore


def test_the_recorder_ledger_is_a_no_op() -> None:
    state = RecorderState()
    assert state.record_run("r", "ip", "{}") is None
    assert state.finish_run("r", "ok", 1, 0.0) is None
    assert state.record_spend("r", "p", "m", "judge", 1, 1, 1.0) is None
    assert state.month_spend() == 0.0 and state.runs_since("ip", 60) == 0


def test_context_modes() -> None:
    assert context_modes(Example("a", "career", "t", [], "")) == (True,)
    assert context_modes(Example("a", "career", "t", [{"role": "user", "text": "x"}], "")) == (
        True,
        False,
    )


async def test_failed_runs_are_reported_and_answers_recorded(db_copy: Path, tmp_path: Path) -> None:
    settings = scope_settings(tmp_path, scope_db_path=db_copy)
    store = ScopeStore(db_copy)
    text = ScriptedText(fail=RuntimeError)
    models = LiveModels(store, FakeEmbedder(64), text, settings)
    deps = ScopeDeps(settings, store, SqliteStateStore(settings.state_db_path), models)
    examples = [e for e in store.examples() if e.id in ("career-fibonacci", "rag-normandy")]
    logged: list[str] = []
    report = await record_examples(examples, deps, models, logged.append)
    assert report.runs == 3
    assert report.failed == [
        "career-fibonacci context=True: error",
        "career-fibonacci context=False: error",
        "rag-normandy context=True: error",
    ]
    # Embeddings were already recorded (reused); the judge failed; the RAG preset has no answers.
    kinds = sorted(c.kind for c in models.paid)
    assert kinds == ["answer", "answer", "brief", "brief"]  # with and without the context
    assert report.calls == 4 and report.cost_usd == 0.0
    assert logged[-1] == "rag-normandy: recorded (4 calls paid so far)"
