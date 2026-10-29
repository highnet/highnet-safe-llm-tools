"""Shared by every test suite: tests never call real APIs. Provider keys in the developer's shell
(or a .env file) are removed, so a test that forgets to fake a provider fails instead of paying."""

import pytest

PROVIDER_KEYS = ("ANTHROPIC_API_KEY", "VOYAGE_API_KEY")


@pytest.fixture(autouse=True)
def _no_provider_keys(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in PROVIDER_KEYS:
        monkeypatch.delenv(key, raising=False)
