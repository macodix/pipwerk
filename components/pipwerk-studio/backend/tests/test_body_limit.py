"""Tests of the limit of the request body (specification 8, order 03 point 3).

The middleware is tested on the ASGI level with a program that stands in for the application
and a stream of messages: the body is checked before the application reads it, whatever
``Content-Length`` says (missing, too small, too large, no number) and also if it comes in
chunks.
"""

import asyncio
from typing import Any

from starlette.types import Message, Receive, Scope, Send

from pipwerk_studio.body_limit import BODY_TOO_LARGE_TEXT, BodyLimitMiddleware

LIMIT = 100


class Recorder:
    """Stands in for the application: reads the whole body and answers with its size."""

    def __init__(self) -> None:
        self.calls = 0
        self.body = b""

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        self.calls += 1
        more = True
        while more:
            message = await receive()
            self.body += message.get("body", b"")
            more = message.get("more_body", False)
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": str(len(self.body)).encode()})


def scope(path: str = "/api/v1/x", headers: list[tuple[bytes, bytes]] | None = None) -> Scope:
    return {"type": "http", "method": "POST", "path": path, "headers": headers or []}


def run(
    path: str,
    chunks: list[bytes],
    declared: bytes | None,
    app: Recorder,
) -> tuple[list[Message], int]:
    """Send the chunks; return the messages sent and the number of messages read."""
    headers = [] if declared is None else [(b"content-length", declared)]
    messages: list[Message] = [
        {"type": "http.request", "body": chunk, "more_body": index < len(chunks) - 1}
        for index, chunk in enumerate(chunks)
    ]
    read = 0
    sent: list[Message] = []

    async def receive() -> Message:
        nonlocal read
        read += 1
        if messages:
            return messages.pop(0)
        await asyncio.sleep(0)
        return {"type": "http.disconnect"}

    async def send(message: Message) -> None:
        sent.append(message)

    middleware = BodyLimitMiddleware(app, limit=LIMIT, prefix="/api/v1")
    asyncio.run(middleware(scope(path, headers), receive, send))
    return sent, read


def status(sent: list[Message]) -> int:
    return int(next(item["status"] for item in sent if item["type"] == "http.response.start"))


def answer(sent: list[Message]) -> bytes:
    return b"".join(item.get("body", b"") for item in sent if item["type"] == "http.response.body")


def test_a_body_within_the_limit_is_handed_on_unchanged() -> None:
    app = Recorder()
    sent, _ = run("/api/v1/x", [b"a" * LIMIT], str(LIMIT).encode(), app)
    assert status(sent) == 200
    assert app.body == b"a" * LIMIT
    assert app.calls == 1


def test_a_body_in_chunks_within_the_limit_is_handed_on_whole() -> None:
    app = Recorder()
    sent, _ = run("/api/v1/x", [b"a" * 40, b"b" * 40, b"c" * 20], None, app)
    assert status(sent) == 200
    assert app.body == b"a" * 40 + b"b" * 40 + b"c" * 20


def test_an_empty_body_is_handed_on() -> None:
    app = Recorder()
    sent, _ = run("/api/v1/x", [b""], b"0", app)
    assert status(sent) == 200
    assert app.body == b""


def test_a_declared_size_above_the_limit_is_413_without_reading_the_body() -> None:
    app = Recorder()
    sent, read = run("/api/v1/x", [b"a" * 10], str(LIMIT + 1).encode(), app)
    assert status(sent) == 413
    assert read == 0
    assert app.calls == 0
    assert BODY_TOO_LARGE_TEXT.encode() in answer(sent)


def test_without_a_declared_size_the_body_is_counted() -> None:
    app = Recorder()
    sent, _ = run("/api/v1/x", [b"a" * LIMIT, b"b"], None, app)
    assert status(sent) == 413
    assert app.calls == 0


def test_a_declared_size_that_is_too_small_does_not_help() -> None:
    app = Recorder()
    sent, _ = run("/api/v1/x", [b"a" * (LIMIT + 1)], b"5", app)
    assert status(sent) == 413
    assert app.calls == 0


def test_a_declared_size_that_is_not_a_number_does_not_help() -> None:
    for declared in (b"abc", b"-5", b"1e9", b"", b"1 2", "٣".encode()):
        app = Recorder()
        sent, _ = run("/api/v1/x", [b"a" * (LIMIT + 1)], declared, app)
        assert status(sent) == 413, declared
        assert app.calls == 0


def test_a_declared_size_that_is_not_a_number_with_a_small_body_is_handed_on() -> None:
    app = Recorder()
    sent, _ = run("/api/v1/x", [b"abc"], b"abc", app)
    assert status(sent) == 200
    assert app.body == b"abc"


def test_chunks_are_counted_and_reading_stops_at_the_limit() -> None:
    app = Recorder()
    chunks = [b"a" * 60, b"b" * 60] + [b"c" * 60] * 1000
    sent, read = run("/api/v1/x", chunks, None, app)
    assert status(sent) == 413
    assert read == 2  # not the 1000 chunks that follow


def test_a_client_that_goes_away_gets_no_answer() -> None:
    app = Recorder()
    sent: list[Message] = []

    async def receive() -> Message:
        return {"type": "http.disconnect"}

    async def send(message: Message) -> None:
        sent.append(message)

    middleware = BodyLimitMiddleware(app, limit=LIMIT, prefix="/api/v1")
    asyncio.run(middleware(scope(), receive, send))
    assert sent == []
    assert app.calls == 0


def test_other_paths_and_other_scopes_are_not_limited() -> None:
    for path in ("/api/studio/settings/language", "/api/v1x", "/api", "/docs"):
        app = Recorder()
        sent, _ = run(path, [b"a" * (LIMIT + 1)], str(LIMIT + 1).encode(), app)
        assert status(sent) == 200, path
        assert app.body == b"a" * (LIMIT + 1)

    called: list[Any] = []

    async def application(scope: Scope, receive: Receive, send: Send) -> None:
        called.append(scope["type"])

    async def receive() -> Message:
        return {"type": "lifespan.startup"}

    async def send(message: Message) -> None:
        return None

    middleware = BodyLimitMiddleware(application, limit=LIMIT, prefix="/api/v1")
    asyncio.run(middleware({"type": "lifespan", "path": "/api/v1/x"}, receive, send))
    assert called == ["lifespan"]


def test_the_prefix_itself_and_everything_below_it_is_limited() -> None:
    for path in ("/api/v1", "/api/v1/", "/api/v1/strategies/abc/usages"):
        app = Recorder()
        sent, _ = run(path, [b"a" * (LIMIT + 1)], None, app)
        assert status(sent) == 413, path


def test_the_application_can_read_after_the_body_the_disconnect_of_the_client() -> None:
    messages: list[Message] = []

    async def application(scope: Scope, receive: Receive, send: Send) -> None:
        messages.append(await receive())
        messages.append(await receive())
        await send({"type": "http.response.start", "status": 204, "headers": []})
        await send({"type": "http.response.body", "body": b""})

    async def receive() -> Message:
        if not sent_body:
            sent_body.append(1)
            return {"type": "http.request", "body": b"abc", "more_body": False}
        return {"type": "http.disconnect"}

    sent_body: list[int] = []

    async def send(message: Message) -> None:
        return None

    middleware = BodyLimitMiddleware(application, limit=LIMIT, prefix="/api/v1")
    asyncio.run(middleware(scope(), receive, send))
    assert messages == [
        {"type": "http.request", "body": b"abc", "more_body": False},
        {"type": "http.disconnect"},
    ]
