"""Step 3 · the rule prefilter: cheap, fast and transparent. Injection patterns are searched in
every view of the message (see `text.py`); topic keywords from the scope definition are searched
in the normalized text. Each hit names its rule, its view and its weight, so a visitor can see
exactly why the rules fired, and why they stayed silent.

Rules alone are easy to evade (a paraphrase or a new language slips past a regex). They exist
because they cost nothing, run in microseconds, and catch the lazy attacks before any model call.
"""

import re
from dataclasses import dataclass, field

from highnet_scope.presets import LABELS, Label, Preset
from highnet_scope.text import Views

# (rule id, what it catches, weight, pattern). Weights are how sure one hit makes us; several
# hits combine as independent evidence: score = 1 - product(1 - weight).
INJECTION_RULES: list[tuple[str, str, float, re.Pattern[str]]] = [
    (
        "override",
        "asks to ignore or replace the instructions",
        0.9,
        re.compile(
            r"\b(ignore|disregard|forget|override|bypass|skip|drop)\b[^.\n]{0,40}?"
            r"\b(previous|prior|above|earlier|all|your|the|these|those|system|safety|usual)\b"
            r"[^.\n]{0,30}?\b(instructions?|rules?|guidelines?|guidance|prompts?|directions?|"
            r"checks?|filters?|polic(y|ies)|restrictions?|verification)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "override_multilingual",
        "the same, in German, Spanish, French, Italian or Portuguese",
        0.85,
        re.compile(
            r"\b(ignorier\w*|vergiss|ignora\w*|olvida\w*|ignorez|ignorer|oublie\w*|dimentica\w*)\b"
            r"[^.\n]{0,40}?\b(anweisungen|regeln|instrucciones|reglas|consignes|"
            r"règles|istruzioni|regole|instruções|regras)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "extraction",
        "asks for the system prompt or hidden instructions",
        0.85,
        re.compile(
            r"\b(print|reveal|show|repeat|output|tell me|display|leak|share|give me|recite|"
            r"read me|what (is|are|were))\b[^.\n]{0,50}?\b(system prompt|hidden (prompt|rules|"
            r"instructions)|your (instructions|rules|prompt|guidelines|tools|configuration)|"
            r"initial prompt|tool list|instructions you were given)",
            re.IGNORECASE,
        ),
    ),
    (
        "role_tag",
        "pretends to be a system or developer message",
        0.7,
        re.compile(
            r"(^|[\n>\]\-\s])(system|developer|admin)\s*:\s|<\s*/?\s*system\s*>|\[/?inst\]|"
            r"###\s*(instruction|system)|\bnote to (ai|the assistant|the model)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "jailbreak",
        "a known jailbreak phrase",
        0.8,
        re.compile(
            r"\b(jailbreak|dan mode|developer mode|do anything now|no restrictions|unfiltered|"
            r"without (any )?(restrictions|filters|rules|checks)|switch off your (safety|rules))\b",
            re.IGNORECASE,
        ),
    ),
    (
        "manipulate_rating",
        "tries to dictate a score or ranking",
        0.6,
        re.compile(
            r"\b(rate|score|rank|grade|recommend)\b[^.\n]{0,30}?\b(10\s*/\s*10|10 out of 10|"
            r"first|highest|top candidate|best candidate|immediate hire)\b",
            re.IGNORECASE,
        ),
    ),
]
# Hiding something is evidence on its own, even when the hidden text matches no pattern.
CHANNEL_WEIGHTS = {"zero_width": 0.5, "hidden_html": 0.6, "encoded": 0.4, "homoglyph": 0.5}


@dataclass
class RuleHit:
    rule: str
    kind: str  # "injection" | "topic" | "channel"
    view: str
    match: str
    weight: float
    label: Label | None = None
    topic: str | None = None

    def as_dict(self) -> dict[str, object]:
        return {
            "rule": self.rule,
            "kind": self.kind,
            "view": self.view,
            "match": self.match,
            "weight": self.weight,
            "label": self.label,
            "topic": self.topic,
        }


@dataclass
class RulesResult:
    hits: list[RuleHit] = field(default_factory=list)
    injection_score: float = 0.0
    topic_votes: dict[str, int] = field(default_factory=dict)
    # None when no rule fired: the rules abstain and drop out of the fusion.
    distribution: dict[Label, float] | None = None


def _clip(text: str, limit: int = 80) -> str:
    text = " ".join(text.split())
    return text if len(text) <= limit else text[: limit - 1] + "…"


def keyword_pattern(keyword: str) -> re.Pattern[str]:
    return re.compile(r"(?<!\w)" + re.escape(keyword.lower()) + r"(?!\w)")


# snippet: rules | Rule prefilter: injection patterns in every view, topic keywords
def run_rules(v: Views, preset: Preset) -> RulesResult:
    hits: list[RuleHit] = []
    for rule, _, weight, pattern in INJECTION_RULES:
        for view, text in v.all():
            if m := pattern.search(text):
                hits.append(RuleHit(rule, "injection", view, _clip(m.group(0)), weight))
                break  # one hit per rule: the first view that shows it
    channels = {
        "zero_width": (v.zero_width, f"{v.zero_width} zero-width characters"),
        "hidden_html": (len(v.hidden), _clip(" | ".join(v.hidden))),
        "encoded": (len(v.decoded) - 1, _clip(" | ".join(v.decoded[:-1]))),
        "homoglyph": (len(v.homoglyph_words), _clip(" ".join(v.homoglyph_words))),
    }
    for channel, (count, shown) in channels.items():
        if count:
            hits.append(RuleHit(channel, "channel", "raw", shown, CHANNEL_WEIGHTS[channel]))

    votes = {"in": 0, "adjacent": 0, "out": 0}
    for topic in preset.topics:
        if topic.class_ == "injection":
            continue
        for keyword in topic.keywords:
            if keyword_pattern(keyword).search(v.normalized):
                votes[topic.class_] += 1
                hits.append(
                    RuleHit("keyword", "topic", "normalized", keyword, 1.0, topic.class_, topic.id)
                )

    not_injection = 1.0
    for hit in hits:
        if hit.kind != "topic":
            not_injection *= 1.0 - hit.weight
    injection = round(1.0 - not_injection, 6)
    total = sum(votes.values())
    if not hits:
        return RulesResult()
    rest = 1.0 - injection
    dist: dict[Label, float] = {
        label: round(rest * votes[label] / total, 6) if total else round(rest / 3, 6)
        for label in LABELS
        if label != "injection"
    }
    dist["injection"] = injection
    return RulesResult(hits, injection, votes, {label: dist[label] for label in LABELS})


# /snippet
