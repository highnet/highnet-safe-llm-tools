"""The `highnet-scope-evals` command line, offline."""

import json
import subprocess
import sys
from collections.abc import Iterator
from pathlib import Path

import pytest

from highnet_scope.config import get_scope_settings
from highnet_scope_evals import cli


@pytest.fixture(autouse=True)
def fresh_settings() -> Iterator[None]:
    get_scope_settings.cache_clear()
    yield
    get_scope_settings.cache_clear()


def main(monkeypatch: pytest.MonkeyPatch, *args: str) -> None:
    monkeypatch.setattr(sys, "argv", ["highnet-scope-evals", *args])
    cli.main()


def test_run_writes_latest_dated_and_details(
    scope_db: Path,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    out = tmp_path / "results"
    main(
        monkeypatch,
        "run",
        "--db", str(scope_db),
        "--cache", str(tmp_path / "cache.sqlite"),
        "--out", str(out),
        "--presets", "career,recipe",
        "--limit", "3",
        "--concurrency", "2",
        "--fake",
    )  # fmt: skip
    latest = json.loads((out / "latest.json").read_text(encoding="utf-8"))
    assert latest["run"]["prompts"] == 6 and latest["run"]["illustrative"] is True
    assert len(list(out.glob("*.json"))) == 2
    details = next(out.glob("*.details.jsonl")).read_text(encoding="utf-8").splitlines()
    assert len(details) == 6
    printed = capsys.readouterr().out
    assert "fused  accuracy" in printed and "fake/fake-judge: 6 calls" in printed


def test_run_defaults_to_every_preset(
    scope_db: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # The database and the offline providers come from the environment instead of the flags.
    monkeypatch.setenv("SCOPE_DB_PATH", str(scope_db))
    monkeypatch.setenv("FAKE_PROVIDERS", "true")
    monkeypatch.setenv("EMBED_DIMS", "64")
    out = tmp_path / "results"
    main(
        monkeypatch, "run", "--cache", str(tmp_path / "c.sqlite"), "--out", str(out), "--limit", "1"
    )
    latest = json.loads((out / "latest.json").read_text(encoding="utf-8"))
    assert latest["run"]["prompts"] == 4


def test_git_sha(monkeypatch: pytest.MonkeyPatch) -> None:
    def broken(*args: object, **kwargs: object) -> None:
        raise OSError("no git")

    def failing(*args: object, **kwargs: object) -> None:
        raise subprocess.CalledProcessError(128, "git")

    monkeypatch.setattr(
        cli.subprocess,
        "run",
        lambda *a, **k: subprocess.CompletedProcess(a, 0, stdout="abc\n"),
    )
    assert cli.git_sha() == "abc"
    monkeypatch.setattr(cli.subprocess, "run", broken)
    assert cli.git_sha() == "unknown"
    monkeypatch.setattr(cli.subprocess, "run", failing)
    assert cli.git_sha() == "unknown"


def test_schema(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    out = tmp_path / "gen" / "scope-evals.schema.json"
    main(monkeypatch, "schema", "--out", str(out))
    schema = json.loads(out.read_text(encoding="utf-8"))
    assert schema["title"] == "Scope eval results"
    assert "ScopeRun" in schema["$defs"]
