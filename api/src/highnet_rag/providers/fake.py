"""The RAG pipeline's offline "LLM" (FAKE_PROVIDERS=true): it copies the best-matching sentence
from the passages, and its agent searches once per part of a compound question. The embedder and
reranker stand-ins are shared and live in `highnet_core.providers.fake`.
"""

import asyncio
import json
import re
from collections.abc import AsyncIterator
from typing import Any

from highnet_core.providers.base import AgentTurn, AnswerBlock, Citation, FinalAnswer, ToolCall
from highnet_core.providers.fake import (
    STOPWORDS,
    WORD,
    FakeEmbedder,
    FakeReranker,
    approx_tokens,
    hashed_vector,
    words,
)
from highnet_rag.pipeline.prompt import NOT_FOUND

__all__ = [
    "STOPWORDS",
    "WORD",
    "FakeAnswerModel",
    "FakeEmbedder",
    "FakeReranker",
    "approx_tokens",
    "hashed_vector",
    "words",
]

SENTENCE = re.compile(r"(?<=[.!?])\s+")
# Where the fake agent splits a compound question into one search per part.
COMPOUND = re.compile(r",|\bor\b|\band\b|\bbefore\b|\bafter\b|\bthan\b", re.IGNORECASE)


def _documents(messages: list[dict[str, Any]]) -> tuple[list[str], str]:
    content = messages[-1]["content"]
    docs = [
        " ".join(part["text"] for part in block["source"]["content"])
        for block in content
        if block.get("type") == "document"
    ]
    question = " ".join(b["text"] for b in content if b.get("type") == "text")
    return docs, question


class FakeAnswerModel:
    provider = "fake"
    model = "fake-extractive"
    not_found = NOT_FOUND

    async def count_tokens(
        self,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> int:
        if tools is not None:
            return approx_tokens(system + json.dumps(messages) + json.dumps(tools))
        docs, question = _documents(messages)
        return approx_tokens(system) + approx_tokens(question) + sum(approx_tokens(d) for d in docs)

    async def agent_turn(
        self,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        max_tokens: int,
    ) -> AgentTurn:
        """Search once per part of a compound question, then answer. Deterministic."""
        searched = any(
            isinstance(m["content"], list) and m["content"][0].get("type") == "tool_result"
            for m in messages
        )
        if searched:
            text, calls = "The passages cover every part.", [ToolCall("answer-1", "answer", {})]
        else:
            question = str(messages[0]["content"]).removeprefix("Question: ")
            parts = [p.strip(" ?,.") for p in COMPOUND.split(question) if len(p.split()) >= 2]
            queries = parts[:3] or [question]
            text = f"I'll search for each part: {len(queries)} search(es)."
            calls = [ToolCall(f"search-{i}", "search", {"query": q}) for i, q in enumerate(queries)]
        content = [{"type": "text", "text": text}] + [
            {"type": "tool_use", "id": c.id, "name": c.name, "input": c.input} for c in calls
        ]
        return AgentTurn(
            text=text,
            calls=calls,
            stop_reason="tool_use",
            input_tokens=await self.count_tokens(system, messages, tools),
            output_tokens=approx_tokens(json.dumps(content)),
            content=content,
        )

    async def stream_answer(
        self, system: str, messages: list[dict[str, Any]], max_tokens: int
    ) -> AsyncIterator[str | FinalAnswer]:
        docs, question = _documents(messages)
        q = set(words(question))
        best: tuple[int, int, str] = (0, -1, "")
        for i, doc in enumerate(docs):
            for sentence in SENTENCE.split(doc):
                overlap = len(q & set(words(sentence)))
                if overlap > best[0]:
                    best = (overlap, i, sentence.strip())
        if best[1] < 0:
            blocks = [AnswerBlock(text=self.not_found)]
        else:
            blocks = [
                AnswerBlock(text="According to the retrieved passage: "),
                AnswerBlock(text=best[2], citations=[Citation(best[1], best[2])]),
            ]
        for block in blocks:
            for token in re.findall(r"\S+\s*", block.text):
                await asyncio.sleep(0)
                yield token
        output = "".join(b.text for b in blocks)
        yield FinalAnswer(
            blocks=blocks,
            stop_reason="end_turn",
            input_tokens=await self.count_tokens(system, messages),
            output_tokens=approx_tokens(output),
        )
