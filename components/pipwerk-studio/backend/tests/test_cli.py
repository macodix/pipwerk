"""Tests for the command line start of Pipwerk Studio (req-system-016/017/018).

Pipwerk Studio must not start without a valid startup configuration.
"""

from pathlib import Path

import pytest
import uvicorn

from pipwerk_studio import cli
from pipwerk_studio.app import create_app
from pipwerk_studio.config import StartupConfigError


@pytest.fixture(autouse=True)
def isolated_environment(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """No real startup configuration of the machine may be found."""
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    monkeypatch.setattr("pipwerk_studio.config._POSIX_SYSTEM_DIR", tmp_path / "system")
    monkeypatch.chdir(tmp_path)


@pytest.fixture
def started_servers(monkeypatch: pytest.MonkeyPatch) -> list[object]:
    """Replace the real server start; collects one entry per start."""
    started: list[object] = []
    monkeypatch.setattr(uvicorn, "run", lambda *args, **kwargs: started.append(args))
    return started


def test_start_without_configuration_fails_with_message_and_exit_code(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], started_servers: list[object]
) -> None:
    exit_code = cli.main([])

    assert exit_code == 1
    error_output = capsys.readouterr().err
    assert "No startup configuration found" in error_output
    assert str(tmp_path / "home" / "pipwerk" / "etc" / "pipwerk-studio.ini") in error_output
    assert "-c <PATH>" in error_output
    assert started_servers == []
    assert list(tmp_path.glob("*.db")) == []


def test_start_with_missing_explicit_file_fails(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], started_servers: list[object]
) -> None:
    exit_code = cli.main(["-c", str(tmp_path / "missing.ini")])

    assert exit_code == 1
    assert "not found" in capsys.readouterr().err
    assert started_servers == []


def test_start_with_empty_url_fails(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], started_servers: list[object]
) -> None:
    config_path = tmp_path / "empty.ini"
    config_path.write_text("[database]\nurl =\n", encoding="utf-8")

    exit_code = cli.main(["-c", str(config_path)])

    assert exit_code == 1
    assert "empty" in capsys.readouterr().err
    assert started_servers == []


def test_start_with_unusable_database_url_fails(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], started_servers: list[object]
) -> None:
    config_path = tmp_path / "bad.ini"
    config_path.write_text("[database]\nurl = not-a-database-url\n", encoding="utf-8")

    exit_code = cli.main(["-c", str(config_path)])

    assert exit_code == 1
    assert "cannot be used" in capsys.readouterr().err
    assert started_servers == []


def test_start_with_valid_configuration_starts_the_server(
    tmp_path: Path, started_servers: list[object]
) -> None:
    config_path = tmp_path / "ok.ini"
    config_path.write_text(
        f"[database]\nurl = sqlite:///{tmp_path / 'studio.db'}\n", encoding="utf-8"
    )

    exit_code = cli.main(["-c", str(config_path)])

    assert exit_code == 0
    assert len(started_servers) == 1


def test_create_app_without_configuration_raises_and_creates_no_database(
    tmp_path: Path,
) -> None:
    with pytest.raises(StartupConfigError, match="No startup configuration found"):
        create_app()

    assert list(tmp_path.glob("*.db")) == []
