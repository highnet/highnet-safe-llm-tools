"""Scope's HTTP routes on the shared FastAPI app."""

from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import SecretStr
from scope_helpers import parse_sse, scope_settings

from highnet_core.providers.voyage import VoyageEmbedder
from highnet_rag.app import create_app
from highnet_rag.config import Settings
from highnet_scope.api import build_models, build_scope_deps, parse_edit
from highnet_scope.config import ScopeSettings
from highnet_scope.models import LiveModels, RecordedModels
from highnet_scope.store import ScopeStore


def rag_settings(tmp: Path) -> Settings:
    return Settings(
        fake_providers=True,
        embed_dims=64,
        corpus_db_path=tmp / "no-corpus.sqlite",
        state_db_path=tmp / "state.sqlite",
        static_dir=tmp / "no-static",
        recordings_db_path=tmp / "no-recordings.sqlite",
        _env_file=None,  # pyright: ignore[reportCallIssue]
    )


def client_for(tmp: Path, scope: ScopeSettings) -> TestClient:
    return TestClient(create_app(rag_settings(tmp), scope_settings=scope))


@pytest.fixture
def recorded(built_db: Path, tmp_path: Path) -> Iterator[TestClient]:
    with client_for(tmp_path, scope_settings(tmp_path, scope_db_path=built_db)) as c:
        yield c


def run_events(client: TestClient, **params: Any) -> list[tuple[str, dict[str, Any]]]:
    response = client.get("/api/scope/run", params=params)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    return parse_sse(response.text)


def test_health_and_config_report_the_recorded_build(recorded: TestClient) -> None:
    health = recorded.get("/api/health").json()
    assert health["scope"] and health["scope_error"] is None
    config = recorded.get("/api/scope/config").json()
    assert [p["id"] for p in config["presets"]] == ["career", "recipe", "bank", "rag"]
    assert config["presets"][0]["topics"][0]["class"] == "in"
    assert len(config["examples"]) == 80
    assert config["defaults"]["k"] == 7 and config["defaults"]["weights"]["judge"] == 0.4
    assert config["models"]["judge"] == {"provider": "fake", "model": "fake-judge"}
    assert config["live"] is False and config["illustrative"] is True
    assert config["recorded_at"] and config["build"]["build_id"] == health["scope"]
    assert config["budget"]["tier"] == "normal" and config["max_chars"] == 2000


def test_a_recorded_example_streams_every_stage(recorded: TestClient) -> None:
    events = run_events(
        recorded, preset="career", example="career-salary", edit="cv:out,,salary:in", w_judge=0.5
    )
    names = [n for n, _ in events]
    assert names == ["trace"] * 11 + ["done"]
    request = events[0][1]["data"]
    assert request["settings"]["overrides"] == {"cv": "out", "salary": "in"}
    assert request["settings"]["weights"]["judge"] == 0.5
    assert events[-1][1]["status"] == "ok"


def test_a_visit_must_pick_an_example(recorded: TestClient) -> None:
    response = recorded.get("/api/scope/run", params={"preset": "career", "text": "hi"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Pick one of the listed messages."


@pytest.mark.parametrize("edit", ["cv:maybe", ":in", "cv"])
def test_a_malformed_edit_is_a_422(recorded: TestClient, edit: str) -> None:
    response = recorded.get(
        "/api/scope/run", params={"preset": "career", "example": "career-salary", "edit": edit}
    )
    assert response.status_code == 422 and "Bad scope edit" in response.json()["detail"]


def test_without_scope_sqlite_the_api_still_starts_and_scope_is_503(tmp_path: Path) -> None:
    scope = scope_settings(tmp_path, scope_db_path=tmp_path / "missing.sqlite")
    with client_for(tmp_path, scope) as c:
        health = c.get("/api/health").json()
        assert health["scope"] is None and "highnet-scope ingest" in health["scope_error"]
        response = c.get("/api/scope/config")
        assert response.status_code == 503 and "highnet-scope ingest" in response.json()["detail"]
        c.app.state.scope_error = None  # pyright: ignore[reportAttributeAccessIssue]
        assert c.get("/api/scope/config").json()["detail"] == "Scope is not loaded."


def test_live_mode_runs_free_text(db_copy: Path, tmp_path: Path) -> None:
    scope = scope_settings(tmp_path, scope_db_path=db_copy, scope_live=True)
    with client_for(tmp_path, scope) as c:
        assert c.get("/api/scope/config").json()["live"] is True
        events = run_events(
            c, preset="career", text="How do I negotiate my salary?", context=False, k=3
        )
        knn = next(d for n, d in events if n == "trace" and d["stage"] == "knn")
        assert len(knn["data"]["neighbours"]) == 3
        assert events[-1][1]["status"] == "ok"


def test_parse_edit() -> None:
    assert parse_edit("") == {}
    assert parse_edit("a:in,b:adjacent,c:out") == {"a": "in", "b": "adjacent", "c": "out"}
    with pytest.raises(HTTPException):
        parse_edit("a:injection")


def test_models_follow_the_settings(built_db: Path, db_copy: Path, tmp_path: Path) -> None:
    store = ScopeStore(built_db, readonly=True)
    fake = build_models(scope_settings(tmp_path), store)
    assert isinstance(fake, RecordedModels) and fake.embed_model == "fake-hashed-bow"
    real = build_models(scope_settings(tmp_path, fake_providers=False), store)
    assert isinstance(real, RecordedModels)
    assert (real.embed_provider, real.text_model) == ("voyage", "claude-haiku-4-5")

    writable = ScopeStore(db_copy)
    live_fake = build_models(scope_settings(tmp_path, scope_live=True), writable)
    assert isinstance(live_fake, LiveModels) and live_fake.text_provider == "fake"
    # Real providers are built lazily: no key is needed until the first call.
    live_real = build_models(
        scope_settings(
            tmp_path, scope_live=True, fake_providers=False, voyage_api_key=SecretStr("")
        ),
        writable,
    )
    assert isinstance(live_real, LiveModels) and isinstance(live_real.embedder, VoyageEmbedder)
    assert (live_real.text_provider, live_real.text_model) == ("anthropic", "claude-haiku-4-5")


def test_build_scope_deps_explains_a_missing_database(tmp_path: Path) -> None:
    deps, error = build_scope_deps(scope_settings(tmp_path, scope_db_path=tmp_path / "x.sqlite"))
    assert deps is None and error is not None and "x.sqlite" in error
