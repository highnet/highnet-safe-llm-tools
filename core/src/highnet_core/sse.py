"""Server-sent events for both products: one `event: trace` per stage as it finishes, streamed
unbuffered, with keep-alive comments while a stage runs."""

import asyncio
from collections.abc import AsyncIterator

from fastapi import Request
from fastapi.responses import StreamingResponse

from highnet_core.trace import AnswerDelta, RunDone, TraceEvent

SSE_HEADERS = {
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
    "Connection": "keep-alive",
}
Item = TraceEvent | AnswerDelta | RunDone


def sse(event: str, payload: str) -> str:
    return f"event: {event}\ndata: {payload}\n\n"


def client_ip(request: Request) -> str:
    return request.headers.get("fly-client-ip") or (request.client.host if request.client else "")


async def stream_events(events: AsyncIterator[Item], keepalive: float) -> AsyncIterator[str]:
    queue: asyncio.Queue[Item | None] = asyncio.Queue()

    async def produce() -> None:
        try:
            async for item in events:
                await queue.put(item)
        finally:
            await queue.put(None)

    task = asyncio.create_task(produce())
    try:
        while True:
            try:
                item = await asyncio.wait_for(queue.get(), timeout=keepalive)
            except TimeoutError:
                # Starlette cancels this generator when the client disconnects.
                yield ": keep-alive\n\n"
                continue
            if item is None:
                break
            if isinstance(item, TraceEvent):
                yield sse("trace", item.model_dump_json())
            elif isinstance(item, AnswerDelta):
                yield sse("answer_delta", item.model_dump_json())
            else:
                yield sse("done", item.model_dump_json())
    finally:
        task.cancel()


def event_stream(events: AsyncIterator[Item], keepalive: float) -> StreamingResponse:
    return StreamingResponse(
        stream_events(events, keepalive), media_type="text/event-stream", headers=SSE_HEADERS
    )
