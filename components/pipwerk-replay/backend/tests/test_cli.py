"""Tests for the command line start of pipwerk replay (req-system-016/017/018).

pipwerk replay must not start without a valid startup configuration.
"""

from pathlib import Path
from typing import Any

import pytest
import uvicorn

from pipwerk_replay import cli
from pipwerk_replay.app import create_app
from pipwerk_replay.config import StartupConfigError


@pytest.fixture(autouse=True)
def isolated_environment(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """No real startup configuration of the machine may be found."""
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    monkeypatch.setattr("pipwerk_replay.config._POSIX_SYSTEM_DIR", tmp_path / "system")
    monkeypatch.chdir(tmp_path)


@pytest.fixture
def started_servers(monkeypatch: pytest.MonkeyPatch) -> list[dict[str, Any]]:
    """Replace the real server start; collects the host and port of every start."""
    started: list[dict[str, Any]] = []
    monkeypatch.setattr(uvicorn, "run", lambda _app, **kwargs: started.append(kwargs))
    return started


def write_config(tmp_path: Path, server: str = "") -> Path:
    config_path = tmp_path / "ok.ini"
    config_path.write_text(
        f"[database]\nurl = sqlite:///{tmp_path / 'replay.db'}\n{server}", encoding="utf-8"
    )
    return config_path


def test_start_without_configuration_fails_with_message_and_exit_code(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], started_servers: list[dict[str, Any]]
) -> None:
    exit_code = cli.main([])

    assert exit_code == 1
    error_output = capsys.readouterr().err
    assert "pipwerk-replay: No startup configuration found" in error_output
    assert str(tmp_path / "home" / "pipwerk" / "etc" / "pipwerk-replay.ini") in error_output
    assert "-c <PATH>" in error_output
    assert started_servers == []
    assert list(tmp_path.glob("*.db")) == []


def test_start_with_missing_explicit_file_fails(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], started_servers: list[dict[str, Any]]
) -> None:
    exit_code = cli.main(["-c", str(tmp_path / "missing.ini")])

    assert exit_code == 1
    assert "not found" in capsys.readouterr().err
    assert started_servers == []


def test_start_with_empty_url_fails(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], started_servers: list[dict[str, Any]]
) -> None:
    config_path = tmp_path / "empty.ini"
    config_path.write_text("[database]\nurl =\n", encoding="utf-8")

    exit_code = cli.main(["-c", str(config_path)])

    assert exit_code == 1
    assert "empty" in capsys.readouterr().err
    assert started_servers == []


def test_start_with_unusable_database_url_fails(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], started_servers: list[dict[str, Any]]
) -> None:
    config_path = tmp_path / "bad.ini"
    config_path.write_text("[database]\nurl = not-a-database-url\n", encoding="utf-8")

    exit_code = cli.main(["-c", str(config_path)])

    assert exit_code == 1
    assert "cannot be used" in capsys.readouterr().err
    assert started_servers == []


def test_start_with_an_invalid_server_entry_fails(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], started_servers: list[dict[str, Any]]
) -> None:
    config_path = write_config(tmp_path, "[server]\nport = 0\n")

    exit_code = cli.main(["-c", str(config_path)])

    assert exit_code == 1
    assert "invalid [server] port" in capsys.readouterr().err
    assert started_servers == []


def test_start_with_a_database_of_a_newer_version_fails_without_changing_it(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], started_servers: list[dict[str, Any]]
) -> None:
    import sqlite3

    config_path = write_config(tmp_path)
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
        connection.execute("INSERT INTO alembic_version VALUES ('9999')")

    exit_code = cli.main(["-c", str(config_path)])

    assert exit_code == 1
    assert "cannot be updated by this version of pipwerk replay" in capsys.readouterr().err
    assert started_servers == []
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        tables = connection.execute("SELECT name FROM sqlite_master").fetchall()
    assert tables == [("alembic_version",)]


def test_start_with_valid_configuration_starts_the_server_with_the_defaults(
    tmp_path: Path, started_servers: list[dict[str, Any]]
) -> None:
    exit_code = cli.main(["-c", str(write_config(tmp_path))])

    assert exit_code == 0
    assert started_servers == [{"host": "127.0.0.1", "port": 8000}]


def test_host_and_port_of_the_configuration_apply(
    tmp_path: Path, started_servers: list[dict[str, Any]]
) -> None:
    config_path = write_config(tmp_path, "[server]\nhost = ::1\nport = 8123\n")

    assert cli.main(["-c", str(config_path)]) == 0

    assert started_servers == [{"host": "::1", "port": 8123}]


def test_host_and_port_of_the_command_line_override_the_configuration(
    tmp_path: Path, started_servers: list[dict[str, Any]]
) -> None:
    config_path = write_config(tmp_path, "[server]\nhost = ::1\nport = 8123\n")

    assert cli.main(["-c", str(config_path), "--host", "127.0.0.1", "--port", "9001"]) == 0

    assert started_servers == [{"host": "127.0.0.1", "port": 9001}]


@pytest.mark.parametrize("port", ["0", "65536", "x", "-1"])
def test_an_invalid_port_on_the_command_line_is_rejected(
    tmp_path: Path, port: str, started_servers: list[dict[str, Any]]
) -> None:
    with pytest.raises(SystemExit) as caught:
        cli.main(["-c", str(write_config(tmp_path)), "--port", port])

    assert caught.value.code == 2
    assert started_servers == []


def test_an_invalid_allowed_host_on_the_command_line_fails(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], started_servers: list[dict[str, Any]]
) -> None:
    exit_code = cli.main(["-c", str(write_config(tmp_path)), "--allowed-host", "bad host"])

    assert exit_code == 1
    assert "invalid value of --allowed-host" in capsys.readouterr().err
    assert started_servers == []


def test_the_database_is_created_by_alembic_at_start(
    tmp_path: Path, started_servers: list[dict[str, Any]]
) -> None:
    import sqlite3

    assert cli.main(["-c", str(write_config(tmp_path))]) == 0

    with sqlite3.connect(tmp_path / "replay.db") as connection:
        version = connection.execute("SELECT version_num FROM alembic_version").fetchall()
        data_stock = connection.execute(
            "SELECT version_num FROM marketdata_alembic_version"
        ).fetchall()
    assert version == [("0004",)]
    assert len(data_stock) == 1  # the data stock has its own version table


def test_create_app_without_configuration_raises_and_creates_no_database(
    tmp_path: Path,
) -> None:
    with pytest.raises(StartupConfigError, match="No startup configuration found"):
        create_app()

    assert list(tmp_path.glob("*.db")) == []


def test_create_app_without_url_uses_the_startup_configuration(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from fastapi.testclient import TestClient

    write_config(tmp_path, "[server]\nallowed_hosts = replay.example\nmax_body_bytes = 2048\n")
    config_dir = tmp_path / "home" / "pipwerk" / "etc"
    config_dir.mkdir(parents=True)
    (tmp_path / "ok.ini").rename(config_dir / "pipwerk-replay.ini")

    client = TestClient(create_app(), base_url="http://replay.example")

    assert client.get("/api/health").status_code == 200
    too_large = client.put(
        "/api/replay/settings/language",
        content=b" " * 3000,
        headers={"content-type": "application/json"},
    )
    assert too_large.status_code == 413
