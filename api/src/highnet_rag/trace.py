"""The RAG pipeline's stages. The event models are shared (`highnet_core.trace`); this module
narrows `stage` to the RAG stages (same model name, so the schema is unchanged) so the exported
JSON Schema, and the TypeScript types generated
from it (`highnet-rag schema` -> web/lib/generated/), list exactly these.
"""

from typing import Literal

from highnet_core.trace import TraceEvent as CoreTraceEvent

Stage = Literal[
    "request",
    "embed_query",
    "map_project",
    "bm25",
    "vector",
    "fuse",
    "rerank",
    "select_context",
    "prompt",
    "generate",
    "citations",
    "agent_plan",
    "agent_step",
]


class TraceEvent(CoreTraceEvent):
    """SSE `event: trace`."""

    stage: Stage
