"""Deterministic offline providers for local development and tests (FAKE_PROVIDERS=true).

Honest stand-ins, not mocks of quality: the embedder is a hashed bag of words, so retrieval is
lexical. Every trace event names provider="fake" so the UI can label the run as illustrative.
Each product adds its own fake language model on top.
"""

import hashlib
import re

import numpy as np

from highnet_core.providers.base import Embeddings, InputType, Reranked, RerankResult

WORD = re.compile(r"[a-z0-9]+")
STOPWORDS = frozenset(
    [
        "a",
        "an",
        "and",
        "are",
        "as",
        "at",
        "be",
        "by",
        "did",
        "do",
        "does",
        "for",
        "from",
        "had",
        "has",
        "have",
        "how",
        "in",
        "is",
        "it",
        "its",
        "of",
        "on",
        "or",
        "that",
        "the",
        "their",
        "this",
        "to",
        "was",
        "were",
        "what",
        "when",
        "where",
        "which",
        "who",
        "whom",
        "why",
        "with",
    ]
)


def words(text: str) -> list[str]:
    return [w.rstrip("s") for w in WORD.findall(text.lower()) if w not in STOPWORDS]


def approx_tokens(text: str) -> int:
    return max(1, round(len(WORD.findall(text.lower())) * 4 / 3))


def hashed_vector(text: str, dims: int) -> np.ndarray:
    vec = np.zeros(dims, dtype=np.float32)
    for w in words(text):
        digest = hashlib.blake2b(w.encode(), digest_size=8).digest()
        n = int.from_bytes(digest, "little")
        vec[n % dims] += 1.0 if (n >> 63) & 1 else -1.0
    norm = float(np.linalg.norm(vec))
    return vec / norm if norm else vec


class FakeEmbedder:
    provider = "fake"
    model = "fake-hashed-bow"

    def __init__(self, dims: int) -> None:
        self.dims = dims

    async def embed(self, texts: list[str], input_type: InputType) -> Embeddings:
        vectors = np.stack([hashed_vector(t, self.dims) for t in texts]).astype(np.float32)
        return Embeddings(vectors=vectors, tokens=sum(approx_tokens(t) for t in texts))


class FakeReranker:
    provider = "fake"
    model = "fake-word-overlap"

    async def rerank(self, query: str, documents: list[str], top_k: int) -> Reranked:
        q = set(words(query))
        scored = [
            RerankResult(i, len(q & set(words(d))) / (len(q) or 1)) for i, d in enumerate(documents)
        ]
        scored.sort(key=lambda r: r.relevance, reverse=True)
        return Reranked(results=scored[:top_k], tokens=sum(approx_tokens(d) for d in documents))
