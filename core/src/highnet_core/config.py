"""The settings both products share, validated once. Each product extends `CoreSettings` with its
own fields; `.env.example` lists every variable."""

from pathlib import Path

from pydantic import BaseModel, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class ModelPrice(BaseModel):
    """USD per one million tokens."""

    input: float
    output: float = 0.0


class CoreSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Providers. Keys are optional at startup; the first stage that needs one fails loudly.
    anthropic_api_key: SecretStr | None = None
    voyage_api_key: SecretStr | None = None
    # Vercel AI Gateway: Scope's second judge, a decision model (typed answers, probabilities).
    ai_gateway_api_key: SecretStr | None = None
    # Deterministic offline providers (hashed bag-of-words embeddings, extractive "LLM").
    # For local development and tests only; every trace event says provider="fake".
    fake_providers: bool = False

    claude_model_default: str = "claude-haiku-4-5"
    claude_model_demo: str = "claude-opus-5"
    claude_model_judge: str = "claude-sonnet-5"
    # The SDK's own retries on 429/5xx. Keep it low for live questions; eval runs raise it.
    anthropic_max_retries: int = 2

    voyage_base_url: str = "https://api.voyageai.com/v1"
    voyage_embed_model: str = "voyage-3.5-lite"
    voyage_rerank_model: str = "rerank-2.5-lite"
    embed_dims: int = 1024
    # Retries on 429/5xx. Keep them short for live questions; the corpus build raises both.
    voyage_max_retries: int = 2
    voyage_max_retry_wait_seconds: float = 10.0

    ai_gateway_base_url: str = "https://ai-gateway.vercel.sh/v1"
    decision_model: str = "typesafe-ai/jev"
    ai_gateway_max_retries: int = 2

    # The spend ledger and the per-IP request log, shared by both products.
    state_db_path: Path = Path("data/state.sqlite")
    sse_keepalive_seconds: float = 15.0

    # Budget and rate limits: one monthly cap across both products.
    budget_monthly_usd: float = 20.0
    budget_degrade_at: float = 0.8
    rate_limit_per_min: int = 20
    rate_limit_per_day: int = 200
    ip_hash_salt: SecretStr = SecretStr("dev-only-salt")
    price_overrides: dict[str, ModelPrice] = Field(default_factory=dict)
