"""Provider interfaces. Only modules in `providers/` talk to external APIs."""

from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any, Literal, Protocol

import numpy as np

InputType = Literal["query", "document"]


class ProviderNotConfiguredError(RuntimeError):
    """An API key is missing. Raised on first use, never at startup."""


@dataclass
class Embeddings:
    vectors: np.ndarray  # shape (n, dims), float32
    tokens: int
    retries: int = 0  # rate-limit or transient-error retries before success


@dataclass
class RerankResult:
    index: int
    relevance: float


@dataclass
class Reranked:
    results: list[RerankResult]
    tokens: int
    retries: int = 0


@dataclass
class Citation:
    document_index: int
    cited_text: str


@dataclass
class AnswerBlock:
    text: str
    citations: list[Citation] = field(default_factory=list)


@dataclass
class FinalAnswer:
    blocks: list[AnswerBlock]
    stop_reason: str | None
    input_tokens: int
    output_tokens: int
    cache_read_input_tokens: int = 0

    @property
    def text(self) -> str:
        return "".join(b.text for b in self.blocks)


@dataclass
class ToolCall:
    id: str
    name: str
    input: dict[str, Any]


@dataclass
class AgentTurn:
    """One model turn in the agent loop: its text, the tools it called, and what it cost."""

    text: str
    calls: list[ToolCall]
    stop_reason: str | None
    input_tokens: int
    output_tokens: int
    # The assistant message to append to the conversation, as plain dicts.
    content: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class ToolAnswer:
    """A forced tool call's input: structured output from one model call."""

    input: dict[str, Any]
    input_tokens: int
    output_tokens: int


@dataclass
class Completion:
    """One plain text completion: the reply text and what it cost."""

    text: str
    stop_reason: str | None
    input_tokens: int
    output_tokens: int


@dataclass
class Decision:
    """A decision model's typed answers (one per question), as returned, and what it cost."""

    answers: dict[str, Any]
    input_tokens: int
    output_tokens: int
    # The gateway's own cost figure, kept beside ours (pricing.py) so the two can be compared.
    reported_cost_usd: float | None = None
    retries: int = 0


class Embedder(Protocol):
    provider: str
    model: str
    dims: int

    async def embed(self, texts: list[str], input_type: InputType) -> Embeddings: ...


class Reranker(Protocol):
    provider: str
    model: str

    async def rerank(self, query: str, documents: list[str], top_k: int) -> Reranked: ...


class AnswerModel(Protocol):
    provider: str
    model: str

    async def count_tokens(
        self,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> int: ...

    async def agent_turn(
        self,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        max_tokens: int,
    ) -> AgentTurn: ...

    def stream_answer(
        self, system: str, messages: list[dict[str, Any]], max_tokens: int
    ) -> AsyncIterator[str | FinalAnswer]:
        """Yields text deltas, then exactly one FinalAnswer."""
        ...


class Judge(Protocol):
    """The eval judge: one model call that must answer through the given tool."""

    provider: str
    model: str

    async def call(self, system: str, prompt: str, tool: dict[str, Any]) -> ToolAnswer: ...


class TextModel(Protocol):
    """A plain completion (no tools, no streaming): Scope's judge and its short answers."""

    provider: str
    model: str

    async def complete(
        self, system: str, messages: list[dict[str, Any]], max_tokens: int
    ) -> Completion: ...


class DecisionModel(Protocol):
    """A decision model: typed questions about a piece of state, answered with probabilities."""

    provider: str
    model: str

    async def decide(self, state: Any, questions: dict[str, Any]) -> Decision: ...
