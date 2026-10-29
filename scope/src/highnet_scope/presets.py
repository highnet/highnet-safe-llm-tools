"""Scope definitions. A preset is a product with a scope: a list of topics, each in, adjacent or
out of scope, plus the messages the product sends when it redirects or blocks.

Every labeled prompt carries one topic, so a visitor's edit (moving a topic to another class)
relabels the prompts with that topic and changes the keyword rules, with no model call. The LLM
judge's rubric is built from the same definition, so any edit makes the recorded judge stale.
"""

import hashlib
import json
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

Label = Literal["in", "adjacent", "out", "injection"]
TopicClass = Literal["in", "adjacent", "out"]
LABELS: tuple[Label, ...] = ("in", "adjacent", "out", "injection")
PRESET_IDS = ("career", "recipe", "bank", "rag")
PRESET_DIR = Path(__file__).parent / "presets"
INJECTION_TOPIC = "injection"


class Topic(BaseModel):
    id: str
    name: str
    # Injection is not a scope decision: its class is fixed and cannot be edited.
    class_: Label = Field(alias="class")
    keywords: list[str] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class Preset(BaseModel):
    id: str
    name: str
    product: str
    description: str
    topics: list[Topic]
    redirect: str
    block: str
    answer_style: str

    def topic_class(self) -> dict[str, Label]:
        return {t.id: t.class_ for t in self.topics}

    def with_classes(self, overrides: dict[str, TopicClass]) -> "Preset":
        """The visitor's edit: some topics moved to another class. Injection stays fixed."""
        topics = [
            t.model_copy(update={"class_": overrides[t.id]})
            if t.id in overrides and t.id != INJECTION_TOPIC
            else t
            for t in self.topics
        ]
        return self.model_copy(update={"topics": topics})

    def rubric_hash(self) -> str:
        """Fingerprint of everything the judge sees; a recorded verdict is valid only for it."""
        body = json.dumps(
            {
                "description": self.description,
                "topics": [[t.id, t.name, t.class_] for t in self.topics],
            },
            sort_keys=True,
        )
        return hashlib.sha256(body.encode()).hexdigest()[:12]


@lru_cache
def load_preset(preset_id: str) -> Preset:
    if preset_id not in PRESET_IDS:
        raise KeyError(f"Unknown preset {preset_id!r}")
    raw = json.loads((PRESET_DIR / f"{preset_id}.json").read_text(encoding="utf-8"))
    return Preset.model_validate(raw)


def all_presets() -> list[Preset]:
    return [load_preset(p) for p in PRESET_IDS]
