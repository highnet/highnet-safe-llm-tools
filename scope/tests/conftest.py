"""Scope test fixtures: one scope.sqlite built from the real labeled prompts and example messages
with offline embeddings (dims=64), then recorded with the offline judge. No real API is called."""

import asyncio
import shutil
from pathlib import Path

import pytest
from scope_helpers import EXAMPLES, GOLDEN, scope_settings

from highnet_core.providers.fake import FakeEmbedder
from highnet_core.storage.state import SqliteStateStore
from highnet_scope.ingest import build_scope, load_examples, load_golden
from highnet_scope.models import FakeTextModel, LiveModels, RecordedModels
from highnet_scope.pipeline import ScopeDeps
from highnet_scope.recorder import record_examples
from highnet_scope.store import ScopeStore


@pytest.fixture(scope="session")
def built_db(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """A built and recorded scope.sqlite; copy it before writing to it."""
    tmp = tmp_path_factory.mktemp("scope")
    settings = scope_settings(tmp)
    store = ScopeStore(settings.scope_db_path)
    embedder = FakeEmbedder(64)

    async def build() -> None:
        await build_scope(
            load_golden(GOLDEN),
            load_examples(EXAMPLES),
            store,
            embedder,
            settings,
            log=lambda _: None,
        )
        models = LiveModels(store, embedder, FakeTextModel(), settings)
        deps = ScopeDeps(settings, store, SqliteStateStore(settings.state_db_path), models)
        report = await record_examples(store.examples(), deps, models, log=lambda _: None)
        assert report.failed == []

    asyncio.run(build())
    return settings.scope_db_path


@pytest.fixture
def db_copy(built_db: Path, tmp_path: Path) -> Path:
    path = tmp_path / "scope.sqlite"
    shutil.copy(built_db, path)
    return path


@pytest.fixture
def recorded_deps(built_db: Path, tmp_path: Path) -> ScopeDeps:
    """Visitor deps: the recorded store, read-only, replayed instantly."""
    settings = scope_settings(tmp_path, scope_db_path=built_db)
    store = ScopeStore(built_db, readonly=True)
    models = RecordedModels(store, ("fake", FakeEmbedder.model), ("fake", FakeTextModel.model))
    return ScopeDeps(settings, store, SqliteStateStore(settings.state_db_path), models)
