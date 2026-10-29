"""Scope's settings: the shared ones (`CoreSettings`: providers, budget, rate limits) plus its own.
Every variable is listed in `.env.example`."""

from functools import lru_cache
from pathlib import Path

from highnet_core.config import CoreSettings


class ScopeSettings(CoreSettings):
    # Built by `highnet-scope ingest`, filled by `highnet-scope record`; read-only on a visit.
    scope_db_path: Path = Path("data/scope.sqlite")
    # false: visitors replay recorded model calls only (no model is called, nothing is spent).
    # true: free-text messages are embedded and judged live, paid from the shared budget.
    scope_live: bool = False
    scope_max_message_chars: int = 2000
    # Earlier turns read with the message when context is on.
    scope_context_turns: int = 4
    # 1 replays model steps at their recorded pace (pauses capped at 1.5 s); 2 twice as fast.
    scope_replay_speed: float = 1.0
    # Hard caps on what the product says back, so it can't be used as a free chatbot.
    scope_answer_max_tokens: int = 300
    scope_brief_max_tokens: int = 120
    scope_answer_max_chars: int = 1500
    scope_brief_max_chars: int = 500

    @property
    def judge_model(self) -> str:
        return self.claude_model_default


@lru_cache
def get_scope_settings() -> ScopeSettings:
    return ScopeSettings()
