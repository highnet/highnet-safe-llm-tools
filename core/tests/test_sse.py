"""Server-sent events: one frame per item, keep-alive comments while a stage runs."""

import asyncio
from collections.abc import AsyncIterator

from fastapi import Request
from fastapi.responses import StreamingResponse

from highnet_core.sse import SSE_HEADERS, Item, client_ip, event_stream, sse, stream_events
from highnet_core.trace import AnswerDelta, RunDone, TraceEvent


def request(headers: list[tuple[bytes, bytes]], client: tuple[str, int] | None) -> Request:
    scope: dict[str, object] = {"type": "http", "headers": headers}
    if client:
        scope["client"] = client
    return Request(scope)  # pyright: ignore[reportArgumentType]


def test_frames_and_client_ip() -> None:
    assert sse("trace", "{}") == "event: trace\ndata: {}\n\n"
    assert client_ip(request([(b"fly-client-ip", b"1.2.3.4")], ("10.0.0.1", 1))) == "1.2.3.4"
    assert client_ip(request([], ("10.0.0.1", 1))) == "10.0.0.1"
    assert client_ip(request([], None)) == ""


async def items(pause: float = 0.0) -> AsyncIterator[Item]:
    yield TraceEvent(run_id="r", seq=1, stage="request", label="1", ms=0)
    await asyncio.sleep(pause)
    yield AnswerDelta(run_id="r", text="Hi")
    yield RunDone(run_id="r", status="ok", ms=1, tokens=0, cost_usd=0.0, stages=1)


async def test_each_item_becomes_its_own_event_with_keep_alives_between() -> None:
    frames = [f async for f in stream_events(items(pause=0.05), keepalive=0.01)]
    names = [f.split("\n")[0] for f in frames]
    assert names[0] == "event: trace" and names[-2:] == ["event: answer_delta", "event: done"]
    assert ": keep-alive" in names


def test_event_stream_is_unbuffered_text_event_stream() -> None:
    response = event_stream(items(), keepalive=1.0)
    assert isinstance(response, StreamingResponse)
    assert response.media_type == "text/event-stream"
    assert all(response.headers[k] == v for k, v in SSE_HEADERS.items())
