"""Scope settings and its narrowed trace stage list."""

import pytest
from pydantic import ValidationError

from highnet_scope.config import ScopeSettings, get_scope_settings
from highnet_scope.trace import STAGES, ScopeTraceEvent


def test_settings_are_cached_and_the_judge_is_the_default_model() -> None:
    get_scope_settings.cache_clear()
    try:
        assert get_scope_settings() is get_scope_settings()
    finally:
        get_scope_settings.cache_clear()
    settings = ScopeSettings(claude_model_default="claude-x", _env_file=None)  # pyright: ignore[reportCallIssue]
    assert settings.judge_model == "claude-x"


def test_the_trace_event_only_accepts_scope_stages() -> None:
    assert len(STAGES) == 12
    event = ScopeTraceEvent(run_id="r", seq=1, stage="judge", label="7", ms=1)
    assert event.stage == "judge"
    with pytest.raises(ValidationError):
        ScopeTraceEvent(run_id="r", seq=1, stage="generate", label="7", ms=1)  # pyright: ignore[reportArgumentType]
