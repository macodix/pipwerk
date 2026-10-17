"""Tests of the check of the ``Host`` header against DNS rebinding (specification 8).

The backend accepts a request on every path only if the name in ``Host`` (without the port) is
on its list of allowed names; otherwise it answers HTTP 400 with a fixed text and nothing
happens. Default list: ``127.0.0.1``, ``localhost``, ``::1``. More names come from the startup
configuration (``[server] allowed_hosts``) and from the command line (``--allowed-host``).
"""

import asyncio
from pathlib import Path

import pytest
import uvicorn
from fastapi.testclient import TestClient
from starlette.types import Message, Receive, Scope, Send
from web_api_support import JSON, body, load_case, rule_document

from pipwerk_studio import cli
from pipwerk_studio.app import create_app
from pipwerk_studio.config import StartupConfigError, load_startup_config
from pipwerk_studio.host_check import (
    DEFAULT_ALLOWED_HOSTS,
    HOST_NOT_ALLOWED_TEXT,
    HostCheckMiddleware,
    InvalidAllowedHostError,
    build_allowed_hosts,
    host_name,
    normalize_entry,
)

REJECTED = {"detail": "The Host header of the request is not allowed."}


def make_client(tmp_path: Path, *allowed: str) -> TestClient:
    app = create_app(f"sqlite:///{tmp_path / 'studio.db'}", allowed_hosts=list(allowed))
    return TestClient(app)


# --- the names that are allowed ---------------------------------------------------------------


@pytest.mark.parametrize(
    "host",
    [
        "127.0.0.1",
        "127.0.0.1:8000",
        "127.0.0.1:1",
        "localhost",
        "localhost:5173",
        "LOCALHOST:5173",
        "localhost.:5173",
        "[::1]",
        "[::1]:8000",
        "[0:0:0:0:0:0:0:1]:8000",
    ],
)
def test_the_default_names_are_allowed_with_and_without_a_port(tmp_path: Path, host: str) -> None:
    client = make_client(tmp_path)
    response = client.get("/api/health", headers={"host": host})
    assert response.status_code == 200, host
    assert response.json() == {"status": "ok"}


@pytest.mark.parametrize(
    "host",
    [
        "rebind.example",
        "rebind.example:8000",
        "localhost.example",
        "evil.localhost",
        "127.0.0.2",
        "192.0.2.7:8000",
        "[::2]:8000",
        "0.0.0.0",
        "testserver",
        "127.0.0.1.example",
        "xn--e1afmkfd.example",
    ],
)
def test_a_foreign_name_is_rejected_with_a_fixed_text(tmp_path: Path, host: str) -> None:
    client = make_client(tmp_path)
    response = client.get("/api/health", headers={"host": host})
    assert response.status_code == 400, host
    assert response.json() == REJECTED
    assert host.split(":")[0] not in response.text  # the name is not repeated
    assert response.json()["detail"] == HOST_NOT_ALLOWED_TEXT


@pytest.mark.parametrize(
    "host",
    ["", " ", "a b", "localhost:", "localhost:abc", "localhost:123456", "localhost:80:80",
     "::1", "::1:8000", "[::1", "[::1]x", "[::1]:", "[::1]:abc", "[localhost]", "[::zz]",
     "localhost/x", "localhost@evil.example", "local\thost", "-", ".", "localhost,evil.example"],
)  # fmt: skip
def test_a_header_that_is_no_host_is_rejected(tmp_path: Path, host: str) -> None:
    client = make_client(tmp_path)
    response = client.get("/api/health", headers={"host": host})
    assert response.status_code == 400, repr(host)
    assert response.json() == REJECTED


def test_a_missing_or_repeated_host_header_is_rejected() -> None:
    """On the ASGI level, where a request without ``Host`` or with two can be built."""
    results: list[int] = []

    async def application(scope: Scope, receive: Receive, send: Send) -> None:
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b""})

    async def call(headers: list[tuple[bytes, bytes]]) -> int:
        sent: list[Message] = []

        async def receive() -> Message:
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message: Message) -> None:
            sent.append(message)

        middleware = HostCheckMiddleware(application, allowed_hosts=build_allowed_hosts([]))
        await middleware({"type": "http", "path": "/", "headers": headers}, receive, send)
        return int(next(item["status"] for item in sent if item["type"] == "http.response.start"))

    results.append(asyncio.run(call([])))
    results.append(asyncio.run(call([(b"host", b"localhost"), (b"host", b"localhost")])))
    results.append(asyncio.run(call([(b"host", b"localhost")])))
    assert results == [400, 400, 200]


def test_other_kinds_of_scope_are_handled_without_error() -> None:
    sent: list[Message] = []
    called: list[str] = []

    async def application(scope: Scope, receive: Receive, send: Send) -> None:
        called.append(scope["type"])

    async def receive() -> Message:
        return {"type": "lifespan.startup"}

    async def send(message: Message) -> None:
        sent.append(message)

    middleware = HostCheckMiddleware(application, allowed_hosts=build_allowed_hosts([]))
    asyncio.run(middleware({"type": "lifespan"}, receive, send))
    assert called == ["lifespan"]
    asyncio.run(
        middleware(
            {"type": "websocket", "path": "/", "headers": [(b"host", b"evil.example")]},
            receive,
            send,
        )
    )
    assert sent == [{"type": "websocket.close", "code": 1008}]
    assert called == ["lifespan"]


# --- every path, every method; the rebinding of the finding S1 ---------------------------------


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", "/api/health"),
        ("get", "/api/studio/revision"),
        ("get", "/api/studio/settings/language"),
        ("put", "/api/studio/settings/language"),
        ("get", "/api/studio/settings/object-directory"),
        ("put", "/api/studio/settings/object-directory"),
        ("get", "/api/v1/element-types"),
        ("get", "/api/v1/strategies"),
        ("post", "/api/v1/strategies"),
        ("post", "/api/v1/check"),
        ("delete", "/api/v1/strategies/11111111-2222-4333-8444-555555555555"),
        ("get", "/docs"),
        ("get", "/openapi.json"),
        ("get", "/unknown/path"),
        ("get", "/"),
    ],
)
def test_a_foreign_host_is_rejected_on_every_path_before_anything_else(
    tmp_path: Path, method: str, path: str
) -> None:
    client = make_client(tmp_path)
    response = client.request(
        method,
        path,
        content=b"not even read as json",
        headers={"host": "rebind.example:18000", "origin": "http://rebind.example:18000"} | JSON,
    )
    assert response.status_code == 400, path
    assert response.json() == REJECTED


def test_a_page_that_rebinds_its_name_cannot_write_read_or_delete(
    tmp_path: Path, home: Path, objects: Path
) -> None:
    """Finding S1: the request that a rebound page sends carries its own name in Host."""
    client = TestClient(create_app(f"sqlite:///{tmp_path / 'studio.db'}"))
    rebound = {"host": "rebind.example:18000", "origin": "http://rebind.example:18000"} | JSON
    created = client.post("/api/v1/strategies", content=body(load_case("str-03")), headers=rebound)
    assert created.status_code == 400
    assert not objects.exists()

    own = client.post("/api/v1/rules", content=body(rule_document()), headers=JSON)
    assert own.status_code == 201
    object_id = own.json()["id"]
    assert client.get(f"/api/v1/rules/{object_id}", headers=rebound).status_code == 400
    assert client.delete(f"/api/v1/rules/{object_id}", headers=rebound).status_code == 400
    assert (
        client.put(
            "/api/studio/settings/object-directory",
            json={"path": str(tmp_path / "x"), "move": True},
            headers=rebound,
        ).status_code
        == 400
    )
    assert client.get(f"/api/v1/rules/{object_id}").status_code == 200  # nothing changed
    assert client.get("/api/studio/settings/object-directory").json()["is_default"] is True


def test_the_rejection_comes_before_the_limit_of_the_body(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    response = client.post(
        "/api/v1/check", content=b"x" * (3 * 1024 * 1024), headers={"host": "evil.example"} | JSON
    )
    assert response.status_code == 400


# --- the list is a setting --------------------------------------------------------------------


def test_names_given_to_the_application_join_the_defaults(tmp_path: Path) -> None:
    client = make_client(tmp_path, "Studio.Example", "192.0.2.7", "[2001:db8::1]")
    for host in ("studio.example:5173", "STUDIO.EXAMPLE", "192.0.2.7:5173", "[2001:db8::1]:5173"):
        assert client.get("/api/health", headers={"host": host}).status_code == 200, host
    assert client.get("/api/health", headers={"host": "localhost"}).status_code == 200
    assert client.get("/api/health", headers={"host": "other.example"}).status_code == 400
    assert client.get("/api/health", headers={"host": "192.0.2.8"}).status_code == 400


def test_the_entry_any_ip_allows_every_ip_address_and_no_name(tmp_path: Path) -> None:
    client = make_client(tmp_path, "*ip")
    for host in ("192.0.2.7:5173", "203.0.113.200", "[2001:db8::7]:80", "10.0.0.1"):
        assert client.get("/api/health", headers={"host": host}).status_code == 200, host
    for host in ("rebind.example", "192.0.2.7.example", "999.1.1.1", "1.2.3"):
        assert client.get("/api/health", headers={"host": host}).status_code == 400, host


def test_without_the_entry_an_ip_address_that_is_not_listed_is_rejected(tmp_path: Path) -> None:
    assert (
        make_client(tmp_path).get("/api/health", headers={"host": "192.0.2.7"}).status_code == 400
    )


def test_the_defaults_are_the_documented_ones() -> None:
    assert DEFAULT_ALLOWED_HOSTS == ("127.0.0.1", "localhost", "::1")
    assert build_allowed_hosts([]) == frozenset(DEFAULT_ALLOWED_HOSTS)


@pytest.mark.parametrize(
    ("entry", "normalized"),
    [
        ("Localhost", "localhost"),
        (" studio.example. ", "studio.example"),
        ("[::1]", "::1"),
        ("2001:DB8::1", "2001:db8::1"),
        ("*ip", "*ip"),
        ("*IP", "*ip"),
        ("my_host-1.example", "my_host-1.example"),
    ],
)
def test_entries_are_normalized(entry: str, normalized: str) -> None:
    assert normalize_entry(entry) == normalized


@pytest.mark.parametrize(
    "entry",
    [
        "",
        "  ",
        "a b",
        "host:8000",
        "http://host",
        "host/path",
        "*",
        "*.example",
        "ä.example",
        "::zz",
        "a,b",
        "[host]",
    ],
)
def test_an_entry_that_is_no_name_is_rejected(entry: str) -> None:
    with pytest.raises(InvalidAllowedHostError):
        normalize_entry(entry)
    with pytest.raises(InvalidAllowedHostError):
        build_allowed_hosts([entry])


def test_the_name_of_a_header() -> None:
    assert host_name("Example.COM:80") == "example.com"
    assert host_name("[::1]:80") == "::1"
    assert host_name("localhost") == "localhost"
    assert host_name("") is None
    assert host_name("a:b:c") is None


# --- startup configuration and command line ------------------------------------------------


def write_config(tmp_path: Path, extra: str) -> Path:
    path = tmp_path / "studio.ini"
    path.write_text(
        f"[database]\nurl = sqlite:///{tmp_path / 'studio.db'}\n{extra}", encoding="utf-8"
    )
    return path


def test_the_startup_configuration_may_list_allowed_hosts(tmp_path: Path) -> None:
    path = write_config(tmp_path, "[server]\nallowed_hosts = Studio.Example, 192.0.2.7 ,, [::1]\n")
    assert load_startup_config(path).allowed_hosts == ("studio.example", "192.0.2.7", "::1")


def test_the_startup_configuration_needs_no_server_section(tmp_path: Path) -> None:
    assert load_startup_config(write_config(tmp_path, "")).allowed_hosts == ()
    assert load_startup_config(write_config(tmp_path, "[server]\n")).allowed_hosts == ()


def test_an_invalid_entry_of_the_startup_configuration_stops_the_start(tmp_path: Path) -> None:
    path = write_config(tmp_path, "[server]\nallowed_hosts = good.example, bad host\n")
    with pytest.raises(StartupConfigError, match="allowed_hosts"):
        load_startup_config(path)


@pytest.fixture
def started(monkeypatch: pytest.MonkeyPatch) -> list[object]:
    servers: list[object] = []
    monkeypatch.setattr(uvicorn, "run", lambda app, **kwargs: servers.append(app))
    return servers


def test_the_command_line_and_the_configuration_both_add_names(
    tmp_path: Path, started: list[object], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    path = write_config(tmp_path, "[server]\nallowed_hosts = from-file.example\n")
    exit_code = cli.main(
        ["-c", str(path), "--allowed-host", "from-line.example", "--allowed-host", "*ip"]
    )
    assert exit_code == 0
    assert len(started) == 1
    client = TestClient(started[0])  # type: ignore[arg-type]
    for host in ("from-file.example", "from-line.example", "203.0.113.5", "localhost"):
        assert client.get("/api/health", headers={"host": host}).status_code == 200, host
    assert client.get("/api/health", headers={"host": "other.example"}).status_code == 400


def test_without_a_setting_the_started_backend_knows_the_defaults_only(
    tmp_path: Path, started: list[object], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    assert cli.main(["-c", str(write_config(tmp_path, ""))]) == 0
    client = TestClient(started[0])  # type: ignore[arg-type]
    assert client.get("/api/health", headers={"host": "localhost:8000"}).status_code == 200
    assert client.get("/api/health", headers={"host": "192.0.2.7:8000"}).status_code == 400


def test_an_invalid_name_on_the_command_line_stops_the_start(
    tmp_path: Path,
    started: list[object],
    capsys: pytest.CaptureFixture[str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    exit_code = cli.main(["-c", str(write_config(tmp_path, "")), "--allowed-host", "bad host"])
    assert exit_code == 1
    assert "--allowed-host" in capsys.readouterr().err
    assert started == []
