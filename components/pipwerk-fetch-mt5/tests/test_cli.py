"""Tests of the command line (``-c <PATH>``, req-system-017 and req-system-018).

The server itself is replaced (``uvicorn.run``): the tests look at what the command starts it
with. Nothing binds a port, except the last test, which starts the real program on a free port
of the local machine.
"""

import logging
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import pytest
import uvicorn
from fastapi.testclient import TestClient
from support import KEY

from pipwerk_fetch_mt5.cli import build_parser, main
from pipwerk_fetch_mt5.config import CONFIG_FILE_NAME

INI = f"""
[server]
host = 192.0.2.10
port = 9100
allowed_hosts = mt5-pc.example

[security]
shared_key = {KEY}

[broker]
server_time_zone = Europe/Athens
name = Demo-Broker

[symbols]
EURUSD = EURUSD.r
"""


@pytest.fixture
def started(monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
    record: dict[str, Any] = {}

    def fake_run(app: Any, **keywords: Any) -> None:
        record["app"] = app
        record.update(keywords)

    monkeypatch.setattr(uvicorn, "run", fake_run)  # cli.py calls uvicorn.run
    # MetaTrader 5 is not there: the program starts anyway and tries again at every request.
    monkeypatch.setitem(sys.modules, "MetaTrader5", None)
    return record


def write_ini(tmp_path: Path, text: str = INI) -> Path:
    path = tmp_path / CONFIG_FILE_NAME
    path.write_text(text, encoding="utf-8")
    return path


def test_the_parser_knows_c_and_nothing_about_addresses() -> None:
    parser = build_parser()
    assert parser.parse_args([]).config_path is None
    assert parser.parse_args(["-c", "x.ini"]).config_path == "x.ini"
    assert parser.parse_args(["--config", "y.ini"]).config_path == "y.ini"
    with pytest.raises(SystemExit):
        parser.parse_args(["--port", "1"])
    assert "pipwerk-fetch-mt5" in parser.format_help()


def test_the_server_starts_with_address_and_port_of_the_startup_configuration(
    tmp_path: Path, started: dict[str, Any]
) -> None:
    assert main(["-c", str(write_ini(tmp_path))]) == 0
    assert (started["host"], started["port"]) == ("192.0.2.10", 9100)
    assert started["server_header"] is False


def test_the_started_application_serves_with_the_key_and_the_allowed_names(
    tmp_path: Path, started: dict[str, Any]
) -> None:
    main(["-c", str(write_ini(tmp_path))])
    headers = {"Authorization": f"Bearer {KEY}"}
    for host in ("192.0.2.10", "mt5-pc.example", "127.0.0.1"):
        client = TestClient(started["app"], base_url=f"http://{host}", headers=headers)
        # MetaTrader 5 is missing in the test: the answer says so, the program stands.
        response = client.get("/api/v1/health")
        assert response.status_code == 503, host
        assert response.json()["error"]["code"] == "terminal_unavailable"
    other = TestClient(started["app"], base_url="http://evil.example", headers=headers)
    assert other.get("/api/v1/health").status_code == 400
    bare = TestClient(started["app"], base_url="http://192.0.2.10")
    assert bare.get("/api/v1/health").status_code == 401


def test_a_name_of_the_designation_table_reaches_the_service(
    tmp_path: Path, started: dict[str, Any]
) -> None:
    main(["-c", str(write_ini(tmp_path))])
    client = TestClient(
        started["app"], base_url="http://192.0.2.10", headers={"Authorization": f"Bearer {KEY}"}
    )
    response = client.post("/api/v1/fetch", json={"kind": "instrument", "instrument": "EURUSD"})
    assert response.status_code == 503  # no MetaTrader 5, but the request was valid


def test_without_a_startup_configuration_the_program_does_not_start(
    tmp_path: Path,
    started: dict[str, Any],
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert main(["-c", str(tmp_path / "missing.ini")]) == 1
    assert "app" not in started
    assert "pipwerk-fetch-mt5:" in capsys.readouterr().err


def test_an_invalid_startup_configuration_does_not_start_and_does_not_print_the_key(
    tmp_path: Path, started: dict[str, Any], capsys: pytest.CaptureFixture[str]
) -> None:
    path = write_ini(tmp_path, INI.replace("Europe/Athens", "Mars/Olympus"))
    assert main(["-c", str(path)]) == 1
    captured = capsys.readouterr()
    assert "app" not in started
    assert "server_time_zone" in captured.err
    assert KEY not in captured.err + captured.out


def test_the_search_locations_are_used_without_c(
    tmp_path: Path, started: dict[str, Any], monkeypatch: pytest.MonkeyPatch
) -> None:
    home = tmp_path / "home"
    (home / "pipwerk" / "etc").mkdir(parents=True)
    (home / "pipwerk" / "etc" / CONFIG_FILE_NAME).write_text(INI, encoding="utf-8")
    monkeypatch.setenv("HOME", str(home))
    assert main([]) == 0
    assert started["port"] == 9100


def test_the_start_logs_the_state_of_metatrader_5_and_never_the_key(
    tmp_path: Path, started: dict[str, Any], caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.INFO):
        main(["-c", str(write_ini(tmp_path))])
    assert "not reachable" in caplog.text
    assert KEY not in caplog.text


def request_status(url: str, key: str | None) -> int:
    headers = {} if key is None else {"Authorization": f"Bearer {key}"}
    try:
        with urllib.request.urlopen(  # noqa: S310
            urllib.request.Request(url, headers=headers),  # noqa: S310
            timeout=20,
        ) as response:
            status: int = response.status
            return status
    except urllib.error.HTTPError as error:
        return error.code


def test_the_program_runs_as_a_process_on_the_address_of_its_startup_configuration(
    tmp_path: Path,
) -> None:
    """The real program, started like an operator starts it: with ``-c`` and nothing else.
    Where MetaTrader 5 is not installed or not running it answers 503 (terminal unavailable)."""
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port: int = probe.getsockname()[1]
    ini = write_ini(tmp_path, INI.replace("192.0.2.10", "127.0.0.1").replace("9100", str(port)))
    process = subprocess.Popen(  # noqa: S603
        [sys.executable, "-I", "-m", "pipwerk_fetch_mt5.cli", "-c", str(ini)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    try:
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            try:
                with socket.create_connection(("127.0.0.1", port), timeout=0.5):
                    break
            except OSError:
                time.sleep(0.2)
        else:
            raise AssertionError("the program did not start")
        url = f"http://127.0.0.1:{port}/api/v1/health"
        assert request_status(url, KEY) in (200, 503)
        assert request_status(url, None) == 401
        assert request_status(url, KEY + "x") == 401
    finally:
        process.terminate()
        output = process.communicate(timeout=20)[0]
    assert KEY not in output
