"""Built once, ahead of time (`highnet-scope ingest`): the labeled prompts are validated against
their preset, embedded with Voyage, projected to 2D with a PCA fitted per preset, and stored in
`scope.sqlite` with the example messages visitors pick from.

Each prompt is embedded as it is read: with its earlier turns, when it has them, because its
label is how it reads in that conversation.
"""

import hashlib
import json
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal

import numpy as np
from pydantic import BaseModel, Field, model_validator

from highnet_core.config import CoreSettings
from highnet_core.pca import fit_pca
from highnet_core.pricing import cost_usd
from highnet_core.providers.base import Embedder
from highnet_core.storage.base import Projection
from highnet_scope.presets import PRESET_IDS, Label, load_preset
from highnet_scope.store import Example, Prompt, ScopeStore, reading

GOLDEN_DIR = Path("evals/golden/scope")
EXAMPLES_PATH = Path("recordings/scope/examples.json")


class TurnRow(BaseModel):
    role: Literal["user", "assistant"]
    text: str


class GoldenRow(BaseModel):
    """One labeled prompt (`evals/golden/scope/<preset>.jsonl`)."""

    id: str
    preset: str
    label: Label
    topic: str
    text: str = Field(min_length=1)
    context: list[TurnRow] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    lang: str = "en"

    @model_validator(mode="after")
    def label_matches_topic(self) -> "GoldenRow":
        classes = load_preset(self.preset).topic_class()
        if classes.get(self.topic) != self.label:
            raise ValueError(f"{self.id}: topic {self.topic!r} is not labelled {self.label!r}")
        return self


class ExampleRow(BaseModel):
    id: str
    preset: str
    text: str
    context: list[TurnRow] = Field(default_factory=list)
    note: str = ""
    rag_question: str | None = None


def load_golden(directory: Path = GOLDEN_DIR) -> list[GoldenRow]:
    rows: list[GoldenRow] = []
    for preset in PRESET_IDS:
        path = directory / f"{preset}.jsonl"
        lines = path.read_text(encoding="utf-8").splitlines()
        rows += [GoldenRow.model_validate_json(line) for line in lines if line.strip()]
    return rows


def load_examples(path: Path = EXAMPLES_PATH) -> list[Example]:
    rows = [ExampleRow.model_validate(r) for r in json.loads(path.read_text(encoding="utf-8"))]
    return [
        Example(r.id, r.preset, r.text, [t.model_dump() for t in r.context], r.note, r.rag_question)
        for r in rows
    ]


def prompt_text(row: GoldenRow) -> str:
    return reading(row.text, [t.model_dump() for t in row.context])


# snippet: map | Fit the map at ingest: PCA per preset over the labeled prompts
async def build_scope(
    rows: list[GoldenRow],
    examples: list[Example],
    store: ScopeStore,
    embedder: Embedder,
    settings: CoreSettings,
    batch_size: int = 64,
    log: Callable[[str], None] = print,
) -> dict[str, str]:
    texts = [prompt_text(r) for r in rows]
    vectors: list[np.ndarray] = []
    tokens = 0
    for start in range(0, len(texts), batch_size):
        result = await embedder.embed(texts[start : start + batch_size], "query")
        vectors.append(result.vectors)
        tokens += result.tokens
        log(f"  embedded {min(start + batch_size, len(texts))}/{len(texts)}")
    matrix = np.concatenate(vectors).astype(np.float32)

    projections: dict[str, Projection] = {}
    xy = np.zeros((len(rows), 2), dtype=np.float32)
    for preset in PRESET_IDS:
        index = [i for i, r in enumerate(rows) if r.preset == preset]
        mean, components, explained = fit_pca(matrix[index])
        projections[preset] = Projection(mean, components, explained)
        xy[index] = (matrix[index] - mean) @ components.T
    # /snippet

    prompts = [
        Prompt(
            r.id, r.preset, r.label, r.topic, r.text, [t.model_dump() for t in r.context],
            r.tags, r.lang, float(xy[i, 0]), float(xy[i, 1]),
        )
        for i, r in enumerate(rows)
    ]  # fmt: skip
    store.save_prompts(prompts, matrix, projections)
    store.save_examples(examples)
    cost = cost_usd(embedder.model, settings, tokens)
    built = {
        "built_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "embed_provider": embedder.provider,
        "embed_model": embedder.model,
        "embed_dims": str(matrix.shape[1]),
        "prompts": str(len(rows)),
        "embed_tokens": str(tokens),
        "embed_cost_usd": f"{cost:.6f}",
        "build_id": hashlib.sha256("\n".join(texts).encode()).hexdigest()[:12],
    }
    store.set_meta(built)
    log(f"Stored {len(rows)} prompts and {len(examples)} examples: {tokens} tokens, ${cost:.6f}")
    return built
