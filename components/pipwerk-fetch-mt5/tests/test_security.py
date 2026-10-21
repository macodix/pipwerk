"""Security tests (specification backtest 5.4 and 11, order 03 acceptance criterion 2).

The shared key: missing, wrong and right. No answer without the right key carries data or
tells anything about instruments or paths. The comparison takes constant time. The key
appears in no answer, no log and no output. The check of the ``Host`` header and the limit of
the size of a request.
"""

import asyncio
import hmac
import logging
from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient
from starlette.types import Message, Receive, Scope, Send
from support import KEY, ScriptedGateway, candle, make_config, naive

from pipwerk_fetch_mt5.auth import SharedKeyMiddleware
from pipwerk_fetch_mt5.body_limit import MAX_BODY_BYTES, BodyLimitMiddleware
from pipwerk_fetch_mt5.cli import allowed_hosts_of
from pipwerk_fetch_mt5.host_check import (
    DEFAULT_ALLOWED_HOSTS,
    InvalidAllowedHostError,
    build_allowed_hosts,
    host_name,
    normalize_entry,
)

FETCH = "/api/v1/fetch"
HEALTH = "/api/v1/health"
CANDLES = {
    "kind": "candles",
    "instrument": "EURUSD",
    "time_unit": "m5",
    "start": "2026-01-05T08:00:00Z",
    "end": "2026-01-05T09:00:00Z",
}
UNAUTHORIZED = {
    "error": {"code": "unauthorized", "reason": "Schlüssel fehlt oder ist falsch"},
}


def data_client(make_client: Callable[..., TestClient], **keywords: Any) -> TestClient:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 8, 0))])
    return make_client(gateway, **keywords)


# --- the shared key --------------------------------------------------------------------------


def test_the_right_key_is_served(make_client: Callable[..., TestClient]) -> None:
    client = data_client(make_client)
    assert client.post(FETCH, json=CANDLES).status_code == 200
    assert client.get(HEALTH).status_code == 200


def test_without_a_key_nothing_is_served(make_client: Callable[..., TestClient]) -> None:
    client = data_client(make_client, headers={"X-Other": "1"})
    for response in (client.post(FETCH, json=CANDLES), client.get(HEALTH)):
        assert response.status_code == 401
        assert response.json() == UNAUTHORIZED
        assert response.headers["www-authenticate"] == "Bearer"
        assert "candles" not in response.text
        assert "Test-Server" not in response.text


@pytest.mark.parametrize(
    "header",
    [
        "Bearer wrong-key-0123456789abcdef",
        "Bearer ",
        "Bearer",
        f"Bearer {KEY}x",
        f"Bearer x{KEY}",
        f"Bearer {KEY[:-1]}",
        f"Bearer {KEY.upper()}",
        f"Basic {KEY}",
        f"Token {KEY}",
        KEY,
        "",
        f"Bearer  {KEY} extra",
    ],
)
def test_a_wrong_key_is_refused_like_a_missing_one(
    make_client: Callable[..., TestClient], header: str
) -> None:
    client = data_client(make_client, headers={"Authorization": header})
    response = client.post(FETCH, json=CANDLES)
    assert response.status_code == 401
    assert response.json() == UNAUTHORIZED


def test_the_scheme_may_be_written_in_any_case(make_client: Callable[..., TestClient]) -> None:
    client = data_client(make_client, headers={"Authorization": f"bearer {KEY}"})
    assert client.get(HEALTH).status_code == 200


def test_two_authorization_headers_are_refused(make_client: Callable[..., TestClient]) -> None:
    client = data_client(make_client, headers={})
    response = client.get(
        HEALTH, headers=[("Authorization", f"Bearer {KEY}"), ("Authorization", f"Bearer {KEY}")]
    )
    assert response.status_code == 401


def test_the_key_in_the_address_or_the_body_does_not_count(
    make_client: Callable[..., TestClient],
) -> None:
    client = data_client(make_client, headers={})
    assert client.get(f"{HEALTH}?key={KEY}").status_code == 401
    assert client.post(FETCH, json={**CANDLES, "key": KEY}).status_code == 401
    assert client.get(HEALTH, headers={"X-Api-Key": KEY}).status_code == 401


def test_every_path_and_method_needs_the_key(make_client: Callable[..., TestClient]) -> None:
    client = data_client(make_client, headers={})
    for method in ("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"):
        for path in (FETCH, HEALTH, "/", "/docs", "/openapi.json", "/api/v1/unknown", "/nope"):
            response = client.request(method, path)
            assert response.status_code == 401, (method, path)


def test_the_answer_without_a_key_tells_nothing_about_instruments_or_paths(
    make_client: Callable[..., TestClient],
) -> None:
    client = data_client(make_client, headers={})
    known = client.post(FETCH, json=CANDLES)
    unknown = client.post(FETCH, json={**CANDLES, "instrument": "XXXYYY"})
    invalid = client.post(FETCH, json={"nonsense": True})
    garbage = client.post(FETCH, content=b"\xff\xfe not json")
    other_path = client.get("/api/v1/unknown")
    texts = {response.text for response in (known, unknown, invalid, garbage, other_path)}
    assert len(texts) == 1
    assert {response.status_code for response in (known, unknown, invalid, garbage)} == {401}


def test_the_key_is_compared_in_constant_time(
    make_client: Callable[..., TestClient], monkeypatch: pytest.MonkeyPatch
) -> None:
    calls: list[tuple[bytes, bytes]] = []
    original = hmac.compare_digest

    def spy(first: Any, second: Any) -> bool:
        calls.append((first, second))
        return original(first, second)

    monkeypatch.setattr(hmac, "compare_digest", spy)  # auth.py calls hmac.compare_digest
    client = data_client(make_client, headers={"Authorization": "Bearer a"})
    client.get(HEALTH)
    client.get(HEALTH, headers={"Authorization": f"Bearer {KEY}"})
    client.get(HEALTH, headers={"Authorization": "Bearer " + "z" * 200})
    assert len(calls) == 3
    # Both sides are digests of the same length, whatever the lengths of the keys are.
    assert {(len(first), len(second)) for first, second in calls} == {(32, 32)}
    assert all(isinstance(value, bytes) for pair in calls for value in pair)


def test_the_middleware_works_on_the_asgi_level_for_http_and_websocket() -> None:
    sent: list[Message] = []
    reached: list[str] = []

    async def application(scope: Scope, receive: Receive, send: Send) -> None:
        reached.append(scope["type"])

    middleware = SharedKeyMiddleware(application, shared_key=KEY)

    async def send(message: Message) -> None:
        sent.append(message)

    async def receive() -> Message:
        return {"type": "http.disconnect"}

    async def run() -> None:
        await middleware({"type": "websocket", "headers": []}, receive, send)
        await middleware({"type": "http", "headers": []}, receive, send)
        await middleware(
            {"type": "http", "headers": [(b"authorization", f"Bearer {KEY}".encode())]},
            receive,
            send,
        )
        await middleware({"type": "lifespan"}, receive, send)

    asyncio.run(run())
    assert reached == ["http", "lifespan"]
    assert sent[0] == {"type": "websocket.close", "code": 1008}
    assert sent[1]["status"] == 401


# --- the key appears nowhere ---------------------------------------------------------------


def test_the_key_appears_in_no_answer_log_or_output(
    make_client: Callable[..., TestClient],
    caplog: pytest.LogCaptureFixture,
    capsys: pytest.CaptureFixture[str],
) -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 8, 0))])
    client = make_client(gateway)
    bare = make_client(gateway, headers={})
    wrong = make_client(gateway, headers={"Authorization": "Bearer another-key-0123456789"})
    responses = [
        client.post(FETCH, json=CANDLES),
        client.post(FETCH, json={**CANDLES, "instrument": "XXXYYY"}),
        client.post(FETCH, json={**CANDLES, "time_unit": "M7"}),
        client.post(FETCH, json={"kind": "instrument", "instrument": "EURUSD"}),
        client.get(HEALTH),
        client.get("/unknown"),
        bare.get(HEALTH),
        wrong.get(HEALTH),
        client.post(FETCH, content=b"x" * (MAX_BODY_BYTES + 1)),
    ]
    with caplog.at_level(logging.DEBUG):
        responses.append(client.post(FETCH, json=CANDLES))
        responses.append(wrong.post(FETCH, json=CANDLES))
    captured = capsys.readouterr()
    for response in responses:
        assert KEY not in response.text
        assert KEY not in str(dict(response.headers))
    assert KEY not in caplog.text
    assert KEY not in captured.out + captured.err


def test_the_key_appears_in_no_error_of_an_unexpected_failure(
    make_client: Callable[..., TestClient], caplog: pytest.LogCaptureFixture
) -> None:
    class Broken(ScriptedGateway):
        def candles(self, *arguments: Any, **keywords: Any) -> Any:
            raise RuntimeError("failed")

    client = make_client(Broken(candle_rows=[candle(naive(2026, 1, 5, 8, 0))]))
    with caplog.at_level(logging.DEBUG):
        response = client.post(FETCH, json=CANDLES)
    assert response.status_code == 500
    assert KEY not in response.text
    assert KEY not in caplog.text


def test_the_configuration_object_does_not_show_the_key() -> None:
    config = make_config()
    assert KEY not in repr(config)
    assert KEY not in str(config)


# --- the Host header --------------------------------------------------------------------------


@pytest.mark.parametrize(
    "host",
    ["127.0.0.1", "127.0.0.1:8765", "localhost", "LOCALHOST:8765", "[::1]", "[::1]:8765"],
)
def test_the_default_names_are_allowed(make_client: Callable[..., TestClient], host: str) -> None:
    assert data_client(make_client).get(HEALTH, headers={"host": host}).status_code == 200


@pytest.mark.parametrize(
    "host",
    ["evil.example", "evil.example:8765", "127.0.0.2", "localhost.evil.example", "", "a b", ":80"],
)
def test_another_name_is_refused_even_with_the_right_key(
    make_client: Callable[..., TestClient], host: str
) -> None:
    response = data_client(make_client).get(HEALTH, headers={"host": host})
    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "host_not_allowed",
            "reason": "Der Kopf Host der Anfrage ist nicht erlaubt",
        }
    }


def test_the_host_is_checked_before_the_key(make_client: Callable[..., TestClient]) -> None:
    client = data_client(make_client, headers={})
    assert client.get(HEALTH, headers={"host": "evil.example"}).status_code == 400
    assert client.get(HEALTH).status_code == 401


def test_configured_names_and_any_ip_are_allowed(make_client: Callable[..., TestClient]) -> None:
    named = data_client(make_client, allowed_hosts=("MT5-PC.example", "192.0.2.10"))
    for host in ("mt5-pc.example:8765", "192.0.2.10:8765"):
        assert named.get(HEALTH, headers={"host": host}).status_code == 200
    assert named.get(HEALTH, headers={"host": "192.0.2.11"}).status_code == 400
    any_ip = data_client(make_client, allowed_hosts=("*ip",))
    for host in ("192.0.2.99", "[2001:db8::1]:80"):
        assert any_ip.get(HEALTH, headers={"host": host}).status_code == 200
    assert any_ip.get(HEALTH, headers={"host": "evil.example"}).status_code == 400


def test_the_helpers_of_the_check() -> None:
    assert set(DEFAULT_ALLOWED_HOSTS) <= build_allowed_hosts([])
    assert host_name("Example.COM:80") == "example.com"
    assert host_name("[::1]:80") == "::1"
    assert host_name("::1") is None  # an IPv6 address needs brackets in a Host header
    assert host_name("host:port") is None
    assert normalize_entry("[::1]") == "::1"
    with pytest.raises(InvalidAllowedHostError):
        normalize_entry("bad host")


def test_the_bind_address_is_allowed_unless_it_is_a_wildcard() -> None:
    assert allowed_hosts_of(make_config(host="192.0.2.10")) == ["192.0.2.10"]
    assert allowed_hosts_of(make_config(host="0.0.0.0", allowed_hosts=("a.example",))) == [
        "a.example"
    ]
    assert allowed_hosts_of(make_config(host="::")) == []


# --- the size of a request ---------------------------------------------------------------------


def test_a_body_above_the_limit_is_refused(make_client: Callable[..., TestClient]) -> None:
    client = data_client(make_client)
    response = client.post(FETCH, content=b"{" + b" " * MAX_BODY_BYTES + b"}")
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "body_too_large"


def test_a_body_at_the_limit_is_read(make_client: Callable[..., TestClient]) -> None:
    client = data_client(make_client)
    padding = " " * (MAX_BODY_BYTES - len(b"{}"))
    response = client.post(FETCH, content="{" + padding + "}")
    assert response.status_code == 422  # read, and not a request
    assert response.json()["error"]["code"] == "invalid_request"


def test_a_large_body_without_the_key_is_not_read(make_client: Callable[..., TestClient]) -> None:
    client = data_client(make_client, headers={})
    response = client.post(FETCH, content=b"x" * (MAX_BODY_BYTES * 4))
    assert response.status_code == 401


def run_limit(chunks: list[bytes], declared: bytes | None) -> tuple[list[Message], int]:
    reads = 0
    handled: list[int] = []

    async def application(scope: Scope, receive: Receive, send: Send) -> None:
        body = b""
        more = True
        while more:
            message = await receive()
            body += message.get("body", b"")
            more = message.get("more_body", False)
        handled.append(len(body))
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b"ok"})

    middleware = BodyLimitMiddleware(application, limit=10, prefix="/api/v1")
    incoming: list[Message] = [
        {"type": "http.request", "body": chunk, "more_body": index < len(chunks) - 1}
        for index, chunk in enumerate(chunks)
    ]
    sent: list[Message] = []

    async def receive() -> Message:
        nonlocal reads
        reads += 1
        return incoming.pop(0) if incoming else {"type": "http.disconnect"}

    async def send(message: Message) -> None:
        sent.append(message)

    headers = [] if declared is None else [(b"content-length", declared)]
    scope: Scope = {"type": "http", "path": "/api/v1/fetch", "headers": headers}
    asyncio.run(middleware(scope, receive, send))
    return sent, reads


def test_the_limit_counts_the_bytes_that_arrive_whatever_content_length_says() -> None:
    sent, _reads = run_limit([b"12345", b"67890", b"x"], declared=b"3")
    assert sent[0]["status"] == 413
    sent, _reads = run_limit([b"12345", b"67890"], declared=b"3")
    assert sent[0]["status"] == 200  # exactly at the limit
    sent, _reads = run_limit([b"12345"], declared=None)
    assert sent[0]["status"] == 200
    sent, _reads = run_limit([b"x" * 11], declared=b"not a number")
    assert sent[0]["status"] == 413


def test_a_declared_size_above_the_limit_is_refused_without_reading() -> None:
    sent, reads = run_limit([b"x"], declared=b"11")
    assert sent[0]["status"] == 413
    assert reads == 0


def test_a_client_that_goes_away_gets_no_answer() -> None:
    async def application(scope: Scope, receive: Receive, send: Send) -> None:
        raise AssertionError("not reached")

    middleware = BodyLimitMiddleware(application, limit=10, prefix="/api/v1")
    sent: list[Message] = []

    async def receive() -> Message:
        return {"type": "http.disconnect"}

    async def send(message: Message) -> None:
        sent.append(message)

    asyncio.run(middleware({"type": "http", "path": "/api/v1/fetch", "headers": []}, receive, send))
    assert sent == []
