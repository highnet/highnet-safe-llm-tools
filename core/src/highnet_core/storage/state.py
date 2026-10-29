"""The writable state both products share (`state.sqlite`): the spend ledger the monthly budget
reads, and the per-IP request log the rate limit reads. Schema in docs/ARCHITECTURE.md section 6."""

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


STATE_SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
  run_id TEXT PRIMARY KEY, ts TEXT NOT NULL, ip_hash TEXT NOT NULL,
  settings TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'running', ms INTEGER, cost_usd REAL
);
CREATE INDEX IF NOT EXISTS runs_ip_ts ON runs(ip_hash, ts);
CREATE TABLE IF NOT EXISTS spend (
  id INTEGER PRIMARY KEY, ts TEXT NOT NULL, run_id TEXT, provider TEXT NOT NULL,
  model TEXT NOT NULL, stage TEXT NOT NULL, input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL, cost_usd REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS spend_ts ON spend(ts);
"""


class SqliteStateStore:
    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.path = path
        with self._conn() as conn:
            conn.executescript(STATE_SCHEMA)
            cutoff = (datetime.now(UTC) - timedelta(days=30)).isoformat(timespec="seconds")
            conn.execute("DELETE FROM runs WHERE ts < ?", (cutoff,))

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.path, timeout=5)
        try:
            conn.execute("PRAGMA journal_mode=WAL")
            yield conn
            conn.commit()
        finally:
            conn.close()

    def record_run(self, run_id: str, ip_hash: str, settings_json: str) -> None:
        with self._conn() as conn:
            conn.execute(
                "INSERT INTO runs (run_id, ts, ip_hash, settings) VALUES (?, ?, ?, ?)",
                (run_id, _now(), ip_hash, settings_json),
            )

    def finish_run(self, run_id: str, status: str, ms: int, cost_usd: float) -> None:
        with self._conn() as conn:
            conn.execute(
                "UPDATE runs SET status = ?, ms = ?, cost_usd = ? WHERE run_id = ?",
                (status, ms, cost_usd, run_id),
            )

    def record_spend(
        self,
        run_id: str | None,
        provider: str,
        model: str,
        stage: str,
        input_tokens: int,
        output_tokens: int,
        cost_usd: float,
    ) -> None:
        with self._conn() as conn:
            conn.execute(
                "INSERT INTO spend (ts, run_id, provider, model, stage, input_tokens, "
                "output_tokens, cost_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (_now(), run_id, provider, model, stage, input_tokens, output_tokens, cost_usd),
            )

    def month_spend(self) -> float:
        start = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        with self._conn() as conn:
            (total,) = conn.execute(
                "SELECT COALESCE(SUM(cost_usd), 0) FROM spend WHERE ts >= ?",
                (start.isoformat(timespec="seconds"),),
            ).fetchone()
        return float(total)

    def runs_since(self, ip_hash: str, seconds: int) -> int:
        since = (datetime.now(UTC) - timedelta(seconds=seconds)).isoformat(timespec="seconds")
        with self._conn() as conn:
            (n,) = conn.execute(
                "SELECT COUNT(*) FROM runs WHERE ip_hash = ? AND ts >= ?", (ip_hash, since)
            ).fetchone()
        return int(n)
