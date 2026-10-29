"""The `highnet-scope` command line, offline (--fake) and into temporary paths."""

import json
import sys
from collections.abc import Iterator
from pathlib import Path

import pytest
from scope_helpers import EXAMPLES, GOLDEN, scope_settings

from highnet_scope import cli, recorder
from highnet_scope.config import get_scope_settings
from highnet_scope.store import ScopeStore


@pytest.fixture(autouse=True)
def isolated(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Settings come from the environment: point every path at tmp_path."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("SCOPE_DB_PATH", str(tmp_path / "env-scope.sqlite"))
    monkeypatch.setenv("STATE_DB_PATH", str(tmp_path / "state.sqlite"))
    monkeypatch.setenv("SCOPE_REPLAY_SPEED", "1e9")
    get_scope_settings.cache_clear()
    yield
    get_scope_settings.cache_clear()


def main(monkeypatch: pytest.MonkeyPatch, *args: str) -> None:
    monkeypatch.setattr(sys, "argv", ["highnet-scope", *args])
    cli.main()


def test_ingest_builds_the_database(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    db = tmp_path / "built.sqlite"
    main(
        monkeypatch,
        "ingest",
        "--golden", str(GOLDEN),
        "--examples", str(EXAMPLES),
        "--db", str(db),
        "--fake",
    )  # fmt: skip
    store = ScopeStore(db, readonly=True)
    assert store.meta()["prompts"] == "1200" and store.meta()["embed_model"] == "fake-hashed-bow"
    assert len(store.examples()) == 80


def test_record_resumes_and_reports(
    db_copy: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    only = "career-salary,rag-normandy"
    main(monkeypatch, "record", "--db", str(db_copy), "--only", only, "--fake")
    out = capsys.readouterr().out
    # Everything was recorded already, so the rerun pays for nothing.
    assert "2 runs recorded; 0 calls paid, $0.000000" in out


def test_record_exits_non_zero_when_a_run_failed(
    db_copy: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    async def failing(*args: object, **kwargs: object) -> recorder.RecordReport:
        return recorder.RecordReport(runs=1, failed=["career-salary context=True: error"])

    monkeypatch.setattr(recorder, "record_examples", failing)
    with pytest.raises(SystemExit) as exit_info:
        main(monkeypatch, "record", "--db", str(db_copy), "--fake")
    assert exit_info.value.code == 1
    assert "failed: career-salary context=True: error" in capsys.readouterr().out


def test_export_writes_the_dataset_and_rag_verdicts(
    built_db: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    dataset, verdicts = tmp_path / "out" / "dataset.json", tmp_path / "gen" / "verdicts.json"
    main(
        monkeypatch,
        "export",
        "--db", str(built_db),
        "--dataset-out", str(dataset),
        "--verdicts-out", str(verdicts),
        "--fake",
    )  # fmt: skip
    body = json.loads(dataset.read_text(encoding="utf-8"))
    assert body["build"]["prompts"] == "1200" and body["drafted_by"] == "Claude"
    assert len(body["presets"]["career"]["rows"]) == 300
    found = json.loads(verdicts.read_text(encoding="utf-8"))
    assert len(found["verdicts"]) == 15 and found["recorded_at"]
    normandy = found["verdicts"]["normandy"]
    assert normandy["example_id"] == "rag-normandy" and normandy["judge"]["label"] == "in"
    # Every RAG-preset message is exported by example id; only RAG's own questions by question.
    assert len(found["examples"]) == 20 and found["examples"]["rag-normandy"] == normandy
    assert "rag-lasagna" in found["examples"]
    assert all(v["example_id"] != "rag-lasagna" for v in found["verdicts"].values())
    assert all(e.startswith("rag-") for e in found["examples"])


def test_export_reads_the_database_from_the_environment(
    built_db: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Without --fake the models are the real ones, which this database never recorded: the
    # verdicts still export, with no judge verdict.
    monkeypatch.setenv("SCOPE_DB_PATH", str(built_db))
    get_scope_settings.cache_clear()
    main(monkeypatch, "export", "--dataset-out", "d.json", "--verdicts-out", "v.json")
    found = json.loads((tmp_path / "v.json").read_text(encoding="utf-8"))
    assert found["verdicts"]["normandy"]["judge"] is None


async def test_verdicts_need_the_database(tmp_path: Path) -> None:
    with pytest.raises(SystemExit, match="highnet-scope ingest"):
        await cli.verdicts(scope_settings(tmp_path, scope_db_path=tmp_path / "missing.sqlite"))


def test_schema_lists_the_scope_stages(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    out = tmp_path / "gen" / "schema.json"
    main(monkeypatch, "schema", "--out", str(out))
    schema = json.loads(out.read_text(encoding="utf-8"))
    stage = schema["$defs"]["ScopeTraceEvent"]["properties"]["stage"]
    assert "judge" in stage["enum"] and "generate" not in stage["enum"]
