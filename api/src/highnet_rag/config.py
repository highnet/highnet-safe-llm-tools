"""Every environment variable the RAG API reads, validated once. Mirrors `.env.example`; the
fields both products share live in `highnet_core.config.CoreSettings`."""

from functools import lru_cache
from pathlib import Path

from highnet_core.config import CoreSettings, ModelPrice

__all__ = ["ModelPrice", "Settings", "get_settings"]


class Settings(CoreSettings):
    demo_mode: bool = False
    max_answer_tokens: int = 1024

    # Storage
    corpus_db_path: Path = Path("data/corpus.sqlite")
    static_dir: Path = Path("web/out")
    evals_results_path: Path = Path("evals/results/latest.json")
    # Visitors pick from pre-recorded questions and the page replays the recorded run (no model
    # call, no cost). LIVE_QUERIES=true brings back free-text questions answered live.
    live_queries: bool = False
    recordings_db_path: Path = Path("data/recordings.sqlite")
    # 1 replays at the recorded pace (pauses capped); 2 twice as fast.
    replay_speed: float = 1.0

    # Query limits
    max_query_chars: int = 500
    default_top_k: int = 5
    max_top_k: int = 10
    agent_max_steps: int = 4
    # Input + output tokens across all agent turns of one question (the final answer excluded).
    agent_token_cap: int = 30_000
    agent_turn_max_tokens: int = 512

    # The web app is hosted on Vercel and calls this API cross-origin. Comma-separated exact
    # origins (production domain, `next dev`) plus an optional regex for preview deployments.
    cors_origins: str = ""
    cors_origin_regex: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def answer_model(self) -> str:
        return self.claude_model_demo if self.demo_mode else self.claude_model_default


@lru_cache
def get_settings() -> Settings:
    return Settings()
