"""SQLite implementations: the corpus (sqlite-vec + FTS5, read-only at runtime) and the recorded
runs. The shared state store (spend ledger, runs) is `highnet_core.storage.state`. Schema
documented in docs/ARCHITECTURE.md section 6."""

import json
import sqlite3
import zlib
from pathlib import Path

import numpy as np
import sqlite_vec

from highnet_core.storage.state import SqliteStateStore
from highnet_rag.storage.base import (
    Chunk,
    ChunkSet,
    DemoQuestion,
    Document,
    Hit,
    MapPoint,
    Projection,
    Recording,
    Span,
)

__all__ = ["SqliteCorpusStore", "SqliteRecordingStore", "SqliteStateStore"]

CORPUS_SCHEMA = """
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE documents (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  source_url TEXT NOT NULL
);
CREATE TABLE chunk_sets (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  target_tokens INTEGER NOT NULL,
  overlap_tokens INTEGER NOT NULL
);
CREATE TABLE chunks (
  id INTEGER PRIMARY KEY,
  chunk_set_id INTEGER NOT NULL REFERENCES chunk_sets(id),
  doc_id INTEGER NOT NULL REFERENCES documents(id),
  ord INTEGER NOT NULL,
  text TEXT NOT NULL,
  start_char INTEGER NOT NULL,
  end_char INTEGER NOT NULL,
  approx_tokens INTEGER NOT NULL,
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0
);
CREATE INDEX chunks_set_doc ON chunks(chunk_set_id, doc_id, ord);
CREATE VIRTUAL TABLE chunks_fts USING fts5(
  text, chunk_set_id UNINDEXED,
  content='chunks', content_rowid='id', tokenize='porter unicode61'
);
CREATE TABLE pca (
  chunk_set_id INTEGER PRIMARY KEY REFERENCES chunk_sets(id),
  mean BLOB NOT NULL,
  components BLOB NOT NULL,
  explained_variance TEXT NOT NULL
);
"""

RECORDINGS_SCHEMA = """
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY, position INTEGER NOT NULL, question TEXT NOT NULL, compound INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS recordings (
  question_id TEXT NOT NULL REFERENCES questions(id), combo TEXT NOT NULL,
  recorded_at TEXT NOT NULL, items BLOB NOT NULL, PRIMARY KEY (question_id, combo)
);
"""


def vec_table_sql(dims: int) -> str:
    return (
        "CREATE VIRTUAL TABLE chunk_vec USING vec0("
        "chunk_id INTEGER PRIMARY KEY, chunk_set_id INTEGER PARTITION KEY, "
        f"embedding FLOAT[{dims}] distance_metric=cosine)"
    )


def connect_corpus(path: Path, *, readonly: bool = True) -> sqlite3.Connection:
    uri = f"file:{path}?mode=ro" if readonly else f"file:{path}?mode=rwc"
    conn = sqlite3.connect(uri, uri=True, check_same_thread=False)
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    conn.row_factory = sqlite3.Row
    return conn


class SqliteCorpusStore:
    def __init__(self, path: Path) -> None:
        if not path.exists():
            raise FileNotFoundError(
                f"Corpus database not found at {path}. Build it with `highnet-rag ingest`."
            )
        self.path = path
        self._conn = connect_corpus(path)
        self._projections: dict[int, Projection] = {}

    def meta(self) -> dict[str, str]:
        return {r["key"]: r["value"] for r in self._conn.execute("SELECT key, value FROM meta")}

    def chunk_sets(self) -> list[ChunkSet]:
        rows = self._conn.execute(
            "SELECT s.id, s.name, s.target_tokens, s.overlap_tokens, COUNT(c.id) AS n "
            "FROM chunk_sets s LEFT JOIN chunks c ON c.chunk_set_id = s.id "
            "GROUP BY s.id ORDER BY s.target_tokens"
        )
        return [
            ChunkSet(r["id"], r["name"], r["target_tokens"], r["overlap_tokens"], r["n"])
            for r in rows
        ]

    # snippet: bm25 | FTS5 BM25 ranking
    def bm25(self, fts_query: str, chunk_set_id: int, k: int) -> list[Hit]:
        rows = self._conn.execute(
            "SELECT rowid, bm25(chunks_fts) AS score FROM chunks_fts "
            "WHERE chunks_fts MATCH ? AND chunk_set_id = ? ORDER BY score LIMIT ?",
            (fts_query, chunk_set_id, k),
        )
        # FTS5 bm25() is lower-is-better (negative); flip the sign so higher = more relevant.
        return [Hit(r["rowid"], i + 1, -float(r["score"])) for i, r in enumerate(rows)]

    # /snippet

    def term_docs(self, terms: list[str], chunk_set_id: int) -> dict[str, int]:
        """How many chunks of the set contain each term, counted the way BM25 counts them."""
        return {
            term: self._conn.execute(
                "SELECT count(*) FROM chunks_fts WHERE chunks_fts MATCH ? AND chunk_set_id = ?",
                (f'"{term}"', chunk_set_id),
            ).fetchone()[0]
            for term in terms
        }

    # snippet: vector | sqlite-vec nearest neighbours
    def knn(self, vector: np.ndarray, chunk_set_id: int, k: int) -> list[Hit]:
        rows = self._conn.execute(
            "SELECT chunk_id, distance FROM chunk_vec "
            "WHERE embedding MATCH ? AND k = ? AND chunk_set_id = ? ORDER BY distance",
            (vector.astype(np.float32).tobytes(), k, chunk_set_id),
        )
        return [Hit(r["chunk_id"], i + 1, float(r["distance"])) for i, r in enumerate(rows)]

    # /snippet

    def chunks(self, ids: list[int]) -> list[Chunk]:
        if not ids:
            return []
        marks = ",".join("?" * len(ids))
        rows = self._conn.execute(
            "SELECT c.*, d.title AS doc_title FROM chunks c JOIN documents d ON d.id = c.doc_id "
            f"WHERE c.id IN ({marks})",
            ids,
        )
        by_id = {
            r["id"]: Chunk(
                id=r["id"],
                chunk_set_id=r["chunk_set_id"],
                doc_id=r["doc_id"],
                doc_title=r["doc_title"],
                ord=r["ord"],
                text=r["text"],
                start_char=r["start_char"],
                end_char=r["end_char"],
                approx_tokens=r["approx_tokens"],
                x=r["x"],
                y=r["y"],
            )
            for r in rows
        }
        return [by_id[i] for i in ids if i in by_id]

    def map_points(self, chunk_set_id: int) -> list[MapPoint]:
        rows = self._conn.execute(
            "SELECT id, doc_id, x, y FROM chunks WHERE chunk_set_id = ? ORDER BY id",
            (chunk_set_id,),
        )
        return [MapPoint(r["id"], r["doc_id"], r["x"], r["y"]) for r in rows]

    def documents(self) -> dict[int, str]:
        rows = self._conn.execute("SELECT id, title FROM documents ORDER BY id")
        return {r["id"]: r["title"] for r in rows}

    def spans(self, chunk_set_id: int) -> list[Span]:
        rows = self._conn.execute(
            "SELECT id, doc_id, start_char, end_char FROM chunks WHERE chunk_set_id = ? "
            "ORDER BY id",
            (chunk_set_id,),
        )
        return [Span(r["id"], r["doc_id"], r["start_char"], r["end_char"]) for r in rows]

    def document_text(self, doc_id: int) -> str:
        row = self._conn.execute("SELECT text FROM documents WHERE id = ?", (doc_id,)).fetchone()
        if row is None:
            raise LookupError(f"No document {doc_id}")
        return row["text"]

    def document_list(self) -> list[Document]:
        rows = self._conn.execute(
            "SELECT id, title, source_url, length(text) AS chars FROM documents ORDER BY title"
        )
        return [Document(r["id"], r["title"], r["source_url"], r["chars"]) for r in rows]

    def projection(self, chunk_set_id: int) -> Projection:
        if chunk_set_id not in self._projections:
            r = self._conn.execute(
                "SELECT mean, components, explained_variance FROM pca WHERE chunk_set_id = ?",
                (chunk_set_id,),
            ).fetchone()
            if r is None:
                raise LookupError(f"No PCA stored for chunk set {chunk_set_id}")
            mean = np.frombuffer(r["mean"], dtype=np.float32)
            components = np.frombuffer(r["components"], dtype=np.float32).reshape(2, -1)
            ev = [float(v) for v in r["explained_variance"].strip("[]").split(",")]
            self._projections[chunk_set_id] = Projection(mean, components, (ev[0], ev[1]))
        return self._projections[chunk_set_id]


class SqliteRecordingStore:
    """Recorded runs for the demo questions: written by `highnet-rag record`, read on replay."""

    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.executescript(RECORDINGS_SCHEMA)

    def questions(self) -> list[DemoQuestion]:
        rows = self._conn.execute(
            "SELECT id, question, compound FROM questions ORDER BY position"
        ).fetchall()
        return [DemoQuestion(r[0], r[1], bool(r[2])) for r in rows]

    def save_questions(self, questions: list[DemoQuestion]) -> None:
        with self._conn:
            self._conn.executemany(
                "INSERT INTO questions (id, position, question, compound) VALUES (?, ?, ?, ?) "
                "ON CONFLICT(id) DO UPDATE SET position = excluded.position, "
                "question = excluded.question, compound = excluded.compound",
                [(q.id, i, q.question, int(q.compound)) for i, q in enumerate(questions)],
            )

    def combos(self, question_id: str) -> set[str]:
        rows = self._conn.execute(
            "SELECT combo FROM recordings WHERE question_id = ?", (question_id,)
        ).fetchall()
        return {r[0] for r in rows}

    def save(self, recording: Recording) -> None:
        with self._conn:
            self._conn.execute(
                "INSERT OR REPLACE INTO recordings (question_id, combo, recorded_at, items) "
                "VALUES (?, ?, ?, ?)",
                (
                    recording.question_id,
                    recording.combo,
                    recording.recorded_at,
                    # Traces repeat the same passages across settings: zlib shrinks them ~10x.
                    zlib.compress(json.dumps(recording.items).encode()),
                ),
            )

    def load(self, question_id: str, combo: str) -> Recording | None:
        row = self._conn.execute(
            "SELECT recorded_at, items FROM recordings WHERE question_id = ? AND combo = ?",
            (question_id, combo),
        ).fetchone()
        if row is None:
            return None
        return Recording(question_id, combo, row[0], json.loads(zlib.decompress(row[1])))

    def recorded_at(self) -> str | None:
        return self._conn.execute("SELECT max(recorded_at) FROM recordings").fetchone()[0]
