"""Tests for the INI startup configuration (req-system-016/017/018)."""

from pathlib import Path

import pytest

from pipwerk_studio.config import (
    StartupConfigError,
    _posix_search_locations,
    _windows_search_locations,
    default_search_locations,
    load_database_url,
    resolve_config_path,
)


def write_ini(path: Path, url: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"[database]\nurl = {url}\n", encoding="utf-8")


@pytest.fixture(autouse=True)
def isolated_system_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Point the system-wide search directory at an empty temporary directory.

    A real ``/etc/pipwerk/pipwerk-studio.ini`` of the machine running the
    tests must never influence the result.
    """
    system_dir = tmp_path / "system-etc-pipwerk"
    monkeypatch.setattr("pipwerk_studio.config._POSIX_SYSTEM_DIR", system_dir)
    return system_dir


def test_falls_back_to_development_default_when_nothing_found(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))

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


def test_automatic_search_falls_back_to_system_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, isolated_system_dir: Path
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path / "empty-home"))
    write_ini(isolated_system_dir / "pipwerk-studio.ini", "sqlite:///system.db")

    assert load_database_url(None) == "sqlite:///system.db"


def test_home_config_has_priority_over_system_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, isolated_system_dir: Path
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    write_ini(isolated_system_dir / "pipwerk-studio.ini", "sqlite:///system.db")
    write_ini(tmp_path / ".config" / "pipwerk" / "pipwerk-studio.ini", "sqlite:///home.db")

    assert load_database_url(None) == "sqlite:///home.db"


def test_posix_search_locations_in_documented_order(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, isolated_system_dir: Path
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))

    assert _posix_search_locations() == [
        tmp_path / "pipwerk" / "etc" / "pipwerk-studio.ini",
        tmp_path / ".config" / "pipwerk" / "pipwerk-studio.ini",
        isolated_system_dir / "pipwerk-studio.ini",
    ]


def test_windows_search_locations_in_documented_order(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("USERPROFILE", str(tmp_path / "profile"))
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))
    monkeypatch.setenv("PROGRAMDATA", str(tmp_path / "programdata"))

    assert _windows_search_locations() == [
        tmp_path / "profile" / "pipwerk" / "etc" / "pipwerk-studio.ini",
        tmp_path / "appdata" / "pipwerk" / "pipwerk-studio.ini",
        tmp_path / "programdata" / "pipwerk" / "pipwerk-studio.ini",
    ]


@pytest.mark.parametrize("value", [None, "", "relative/home"])
def test_posix_search_locations_never_become_relative(
    value: str | None, monkeypatch: pytest.MonkeyPatch, isolated_system_dir: Path
) -> None:
    if value is None:
        monkeypatch.delenv("HOME", raising=False)
    else:
        monkeypatch.setenv("HOME", value)

    locations = default_search_locations()

    assert locations == [isolated_system_dir / "pipwerk-studio.ini"]
    assert all(location.is_absolute() for location in locations)


@pytest.mark.parametrize("value", [None, "", "relative"])
def test_windows_search_locations_never_become_relative(
    value: str | None, monkeypatch: pytest.MonkeyPatch
) -> None:
    for name in ("USERPROFILE", "APPDATA", "PROGRAMDATA"):
        if value is None:
            monkeypatch.delenv(name, raising=False)
        else:
            monkeypatch.setenv(name, value)

    assert _windows_search_locations() == []


def test_relative_ini_in_working_directory_is_not_found_with_empty_home(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", "")
    monkeypatch.chdir(tmp_path)
    write_ini(tmp_path / "pipwerk" / "etc" / "pipwerk-studio.ini", "sqlite:///wrong.db")
    write_ini(tmp_path / ".config" / "pipwerk" / "pipwerk-studio.ini", "sqlite:///wrong.db")

    assert resolve_config_path(None) is None
