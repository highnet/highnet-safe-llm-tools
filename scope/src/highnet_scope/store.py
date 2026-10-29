"""Scope's own SQLite file (`scope.sqlite`): the labeled prompts with their vectors and the PCA
fitted at ingest, the example messages visitors pick, and every model call recorded for them.

A recorded call is keyed by exactly what was sent, so a replay can only reuse a call whose input
was identical: an embedding by the text embedded, a judge verdict by preset, rubric, message and
conversation, an answer by preset, kind and message. Schema in docs/ARCHITECTURE.md section 13.
"""

import hashlib
import json
import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np

from highnet_core.storage.base import Projection
from highnet_scope.presets import Label

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY, preset TEXT NOT NULL, ord INTEGER NOT NULL, label TEXT NOT NULL,
  topic TEXT NOT NULL, text TEXT NOT NULL, context TEXT NOT NULL, tags TEXT NOT NULL,
  lang TEXT NOT NULL, x REAL NOT NULL DEFAULT 0, y REAL NOT NULL DEFAULT 0,
  embedding BLOB NOT NULL
);
CREATE INDEX IF NOT EXISTS prompts_preset ON prompts(preset, ord);
CREATE TABLE IF NOT EXISTS pca (
  preset TEXT PRIMARY KEY, mean BLOB NOT NULL, components BLOB NOT NULL,
  explained_variance TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS examples (
  id TEXT PRIMARY KEY, preset TEXT NOT NULL, ord INTEGER NOT NULL, text TEXT NOT NULL,
  context TEXT NOT NULL, note TEXT NOT NULL, rag_question TEXT
);
CREATE TABLE IF NOT EXISTS calls (
  key TEXT PRIMARY KEY, kind TEXT NOT NULL, provider TEXT NOT NULL, model TEXT NOT NULL,
  request TEXT NOT NULL, response TEXT NOT NULL, embedding BLOB,
  input_tokens INTEGER NOT NULL, output_tokens INTEGER NOT NULL, ms INTEGER NOT NULL,
  cost_usd REAL NOT NULL, recorded_at TEXT NOT NULL
);
"""

Turn = dict[str, str]


@dataclass(frozen=True)
class Prompt:
    id: str
    preset: str
    label: Label
    topic: str
    text: str
    context: list[Turn]
    tags: list[str]
    lang: str
    x: float
    y: float


@dataclass(frozen=True)
class Example:
    id: str
    preset: str
    text: str
    context: list[Turn]
    note: str
    # The RAG pipeline's recorded question this message is, if any (linked both ways in the UI).
    rag_question: str | None = None


@dataclass(frozen=True)
class Call:
    """One model call as it was made: what was sent, what came back, and what it cost."""

    kind: str  # "embed" | "judge" | "answer" | "brief"
    provider: str
    model: str
    request: dict[str, Any]
    response: str
    embedding: np.ndarray | None
    input_tokens: int
    output_tokens: int
    ms: int
    cost_usd: float
    recorded_at: str


def reading(message: str, context: list[Turn]) -> str:
    """The text that is embedded: the message alone, or with the earlier turns before it."""
    if not context:
        return message
    turns = "\n".join(f"{t['role']}: {t['text']}" for t in context)
    return f"{turns}\nuser: {message}"


def call_key(kind: str, *parts: object) -> str:
    body = json.dumps([kind, *parts], ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(body.encode()).hexdigest()


def now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


class ScopeStore:
    def __init__(self, path: Path, *, readonly: bool = False) -> None:
        if readonly and not path.exists():
            raise FileNotFoundError(
                f"Scope database not found at {path}. Build it with `highnet-scope ingest`."
            )
        if not readonly:
            path.parent.mkdir(parents=True, exist_ok=True)
        uri = f"file:{path}?mode=ro" if readonly else f"file:{path}?mode=rwc"
        self.path = path
        self._conn = sqlite3.connect(uri, uri=True, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        if not readonly:
            self._conn.executescript(SCHEMA)
        self._matrices: dict[str, tuple[np.ndarray, list[Prompt]]] = {}
        self._projections: dict[str, Projection] = {}

    # --- meta -------------------------------------------------------------------------------
    def meta(self) -> dict[str, str]:
        return {r["key"]: r["value"] for r in self._conn.execute("SELECT key, value FROM meta")}

    def set_meta(self, values: dict[str, str]) -> None:
        with self._conn:
            self._conn.executemany(
                "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", list(values.items())
            )

    # --- labeled prompts --------------------------------------------------------------------
    def save_prompts(
        self, rows: list[Prompt], vectors: np.ndarray, projection: dict[str, Projection]
    ) -> None:
        with self._conn:
            self._conn.execute("DELETE FROM prompts")
            self._conn.execute("DELETE FROM pca")
            self._conn.executemany(
                "INSERT INTO prompts (id, preset, ord, label, topic, text, context, tags, lang, "
                "x, y, embedding) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    (
                        r.id, r.preset, i, r.label, r.topic, r.text, json.dumps(r.context),
                        json.dumps(r.tags), r.lang, r.x, r.y,
                        vectors[i].astype(np.float32).tobytes(),
                    )
                    for i, r in enumerate(rows)
                ],
            )  # fmt: skip
            self._conn.executemany(
                "INSERT INTO pca (preset, mean, components, explained_variance) VALUES "
                "(?, ?, ?, ?)",
                [
                    (
                        preset,
                        p.mean.astype(np.float32).tobytes(),
                        p.components.astype(np.float32).tobytes(),
                        json.dumps(list(p.explained_variance)),
                    )
                    for preset, p in projection.items()
                ],
            )
        self._matrices.clear()
        self._projections.clear()

    def _prompt(self, r: sqlite3.Row) -> Prompt:
        return Prompt(
            r["id"], r["preset"], r["label"], r["topic"], r["text"], json.loads(r["context"]),
            json.loads(r["tags"]), r["lang"], r["x"], r["y"],
        )  # fmt: skip

    def prompts(self, preset: str) -> tuple[np.ndarray, list[Prompt]]:
        """The preset's prompts in order, with their embeddings as unit rows of one matrix."""
        if preset not in self._matrices:
            rows = self._conn.execute(
                "SELECT * FROM prompts WHERE preset = ? ORDER BY ord", (preset,)
            ).fetchall()
            matrix = np.stack([np.frombuffer(r["embedding"], dtype=np.float32) for r in rows])
            matrix = matrix / np.linalg.norm(matrix, axis=1, keepdims=True)
            self._matrices[preset] = (matrix, [self._prompt(r) for r in rows])
        return self._matrices[preset]

    def all_prompts(self) -> list[Prompt]:
        rows = self._conn.execute("SELECT * FROM prompts ORDER BY preset, ord").fetchall()
        return [self._prompt(r) for r in rows]

    def projection(self, preset: str) -> Projection:
        if preset not in self._projections:
            r = self._conn.execute(
                "SELECT mean, components, explained_variance FROM pca WHERE preset = ?", (preset,)
            ).fetchone()
            if r is None:
                raise LookupError(f"No PCA stored for preset {preset}")
            mean = np.frombuffer(r["mean"], dtype=np.float32)
            components = np.frombuffer(r["components"], dtype=np.float32).reshape(2, -1)
            ev = json.loads(r["explained_variance"])
            self._projections[preset] = Projection(mean, components, (ev[0], ev[1]))
        return self._projections[preset]

    # --- example messages -------------------------------------------------------------------
    def save_examples(self, examples: list[Example]) -> None:
        with self._conn:
            self._conn.execute("DELETE FROM examples")
            self._conn.executemany(
                "INSERT INTO examples (id, preset, ord, text, context, note, rag_question) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    (e.id, e.preset, i, e.text, json.dumps(e.context), e.note, e.rag_question)
                    for i, e in enumerate(examples)
                ],
            )

    def examples(self) -> list[Example]:
        rows = self._conn.execute("SELECT * FROM examples ORDER BY ord").fetchall()
        return [
            Example(
                r["id"],
                r["preset"],
                r["text"],
                json.loads(r["context"]),
                r["note"],
                r["rag_question"],
            )
            for r in rows
        ]

    # --- recorded calls ---------------------------------------------------------------------
    def save_call(self, key: str, call: Call) -> None:
        with self._conn:
            self._conn.execute(
                "INSERT OR REPLACE INTO calls (key, kind, provider, model, request, response, "
                "embedding, input_tokens, output_tokens, ms, cost_usd, recorded_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    key, call.kind, call.provider, call.model,
                    json.dumps(call.request, ensure_ascii=False), call.response,
                    None if call.embedding is None else call.embedding.astype(np.float32).tobytes(),
                    call.input_tokens, call.output_tokens, call.ms, call.cost_usd,
                    call.recorded_at,
                ),
            )  # fmt: skip

    def call(self, key: str) -> Call | None:
        r = self._conn.execute("SELECT * FROM calls WHERE key = ?", (key,)).fetchone()
        if r is None:
            return None
        return Call(
            kind=r["kind"],
            provider=r["provider"],
            model=r["model"],
            request=json.loads(r["request"]),
            response=r["response"],
            embedding=(
                None if r["embedding"] is None else np.frombuffer(r["embedding"], np.float32)
            ),
            input_tokens=r["input_tokens"],
            output_tokens=r["output_tokens"],
            ms=r["ms"],
            cost_usd=r["cost_usd"],
            recorded_at=r["recorded_at"],
        )

    def call_stats(self) -> list[dict[str, Any]]:
        """Calls per kind and model, with their tokens and cost: what the recordings paid."""
        rows = self._conn.execute(
            "SELECT kind, provider, model, COUNT(*) AS calls, SUM(input_tokens) AS input_tokens, "
            "SUM(output_tokens) AS output_tokens, SUM(cost_usd) AS cost_usd, "
            "MAX(recorded_at) AS last FROM calls GROUP BY kind, provider, model ORDER BY kind"
        ).fetchall()
        return [dict(r) for r in rows]

    def recorded_at(self) -> str | None:
        return self._conn.execute("SELECT max(recorded_at) FROM calls").fetchone()[0]
