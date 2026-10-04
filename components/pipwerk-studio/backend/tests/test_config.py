"""Tests for the INI startup configuration (req-system-016/017/018)."""

from pathlib import Path

import pytest

from pipwerk_studio.config import StartupConfigError, load_database_url, resolve_config_path


def write_ini(path: Path, url: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"[database]\nurl = {url}\n", encoding="utf-8")


def test_falls_back_to_development_default_when_nothing_found(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.setattr("os.name", "posix")

    url = load_database_url(None)

    assert url.startswith("sqlite://")


def test_explicit_path_has_highest_priority(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    home_config = tmp_path / "pipwerk" / "etc" / "pipwerk-studio.ini"
    write_ini(home_config, "sqlite:///home-config.db")

    explicit_config = tmp_path / "explicit.ini"
    write_ini(explicit_config, "sqlite:///explicit.db")

    url = load_database_url(explicit_config)

    assert url == "sqlite:///explicit.db"


def test_explicit_path_missing_raises(tmp_path: Path) -> None:
    with pytest.raises(StartupConfigError):
        load_database_url(tmp_path / "does-not-exist.ini")


def test_automatic_search_order_prefers_pipwerk_etc_over_config_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))

    etc_config = tmp_path / "pipwerk" / "etc" / "pipwerk-studio.ini"
    write_ini(etc_config, "sqlite:///etc.db")
    config_dir = tmp_path / ".config" / "pipwerk" / "pipwerk-studio.ini"
    write_ini(config_dir, "sqlite:///config-dir.db")

    resolved = resolve_config_path(None)

    assert resolved == etc_config


def test_automatic_search_falls_back_to_config_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))

    config_dir = tmp_path / ".config" / "pipwerk" / "pipwerk-studio.ini"
    write_ini(config_dir, "sqlite:///config-dir.db")

    url = load_database_url(None)

    assert url == "sqlite:///config-dir.db"


def test_missing_database_section_raises(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    config_path = tmp_path / "broken.ini"
    config_path.write_text("[other]\nkey = value\n", encoding="utf-8")

    with pytest.raises(StartupConfigError):
        load_database_url(config_path)
