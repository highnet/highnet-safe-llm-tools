"""Offline settings for the eval tests (fake providers, small vectors, no .env)."""

from highnet_rag.config import Settings


def fake_settings(**overrides: object) -> Settings:
    base: dict[str, object] = {"fake_providers": True, "embed_dims": 64, "_env_file": None}
    return Settings(**{**base, **overrides})  # pyright: ignore[reportArgumentType]
