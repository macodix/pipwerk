"""Tests for the INI startup configuration (req-system-016/017/018)."""

from pathlib import Path

import pytest

from pipwerk_replay.config import (
    DEFAULT_HOST,
    DEFAULT_MAX_BODY_BYTES,
    DEFAULT_PORT,
    StartupConfigError,
    _posix_search_locations,
    _windows_search_locations,
    default_search_locations,
    load_startup_config,
    resolve_config_path,
)


def write_ini(path: Path, url: str, server: str = "") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"[database]\nurl = {url}\n{server}", encoding="utf-8")


def load_url(path: Path | None) -> str:
    return load_startup_config(path).database_url


@pytest.fixture(autouse=True)
def isolated_system_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Point the system-wide search directory at an empty temporary directory.

    A real ``/etc/pipwerk/pipwerk-replay.ini`` of the machine running the
    tests must never influence the result.
    """
    system_dir = tmp_path / "system-etc-pipwerk"
    monkeypatch.setattr("pipwerk_replay.config._POSIX_SYSTEM_DIR", system_dir)
    return system_dir


def test_nothing_found_raises_with_searched_locations_and_hint(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, isolated_system_dir: Path
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))

    with pytest.raises(StartupConfigError) as caught:
        load_url(None)

    message = str(caught.value)
    assert "No startup configuration found" in message
    assert str(tmp_path / "pipwerk" / "etc" / "pipwerk-replay.ini") in message
    assert str(tmp_path / ".config" / "pipwerk" / "pipwerk-replay.ini") in message
    assert str(isolated_system_dir / "pipwerk-replay.ini") in message
    assert "-c <PATH>" in message


def test_explicit_path_has_highest_priority(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    write_ini(tmp_path / "pipwerk" / "etc" / "pipwerk-replay.ini", "sqlite:///home-config.db")
    explicit_config = tmp_path / "explicit.ini"
    write_ini(explicit_config, "sqlite:///explicit.db")

    assert load_url(explicit_config) == "sqlite:///explicit.db"


def test_explicit_path_missing_raises(tmp_path: Path) -> None:
    with pytest.raises(StartupConfigError):
        load_url(tmp_path / "does-not-exist.ini")


def test_the_file_of_pipwerk_studio_is_not_found(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    write_ini(tmp_path / "pipwerk" / "etc" / "pipwerk-studio.ini", "sqlite:///studio.db")

    with pytest.raises(StartupConfigError, match="No startup configuration found"):
        resolve_config_path(None)


def test_automatic_search_order_prefers_pipwerk_etc_over_config_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    etc_config = tmp_path / "pipwerk" / "etc" / "pipwerk-replay.ini"
    write_ini(etc_config, "sqlite:///etc.db")
    write_ini(tmp_path / ".config" / "pipwerk" / "pipwerk-replay.ini", "sqlite:///config-dir.db")

    assert resolve_config_path(None) == etc_config


def test_automatic_search_falls_back_to_config_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    write_ini(tmp_path / ".config" / "pipwerk" / "pipwerk-replay.ini", "sqlite:///config-dir.db")

    assert load_url(None) == "sqlite:///config-dir.db"


def test_automatic_search_falls_back_to_system_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, isolated_system_dir: Path
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path / "empty-home"))
    write_ini(isolated_system_dir / "pipwerk-replay.ini", "sqlite:///system.db")

    assert load_url(None) == "sqlite:///system.db"


def test_home_config_has_priority_over_system_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, isolated_system_dir: Path
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    write_ini(isolated_system_dir / "pipwerk-replay.ini", "sqlite:///system.db")
    write_ini(tmp_path / ".config" / "pipwerk" / "pipwerk-replay.ini", "sqlite:///home.db")

    assert load_url(None) == "sqlite:///home.db"


def test_posix_search_locations_in_documented_order(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, isolated_system_dir: Path
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))

    assert _posix_search_locations() == [
        tmp_path / "pipwerk" / "etc" / "pipwerk-replay.ini",
        tmp_path / ".config" / "pipwerk" / "pipwerk-replay.ini",
        isolated_system_dir / "pipwerk-replay.ini",
    ]


def test_windows_search_locations_in_documented_order(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("USERPROFILE", str(tmp_path / "profile"))
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))
    monkeypatch.setenv("PROGRAMDATA", str(tmp_path / "programdata"))

    assert _windows_search_locations() == [
        tmp_path / "profile" / "pipwerk" / "etc" / "pipwerk-replay.ini",
        tmp_path / "appdata" / "pipwerk" / "pipwerk-replay.ini",
        tmp_path / "programdata" / "pipwerk" / "pipwerk-replay.ini",
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

    assert locations == [isolated_system_dir / "pipwerk-replay.ini"]
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


def test_missing_database_section_raises(tmp_path: Path) -> None:
    config_path = tmp_path / "broken.ini"
    config_path.write_text("[other]\nkey = value\n", encoding="utf-8")

    with pytest.raises(StartupConfigError, match="missing a"):
        load_url(config_path)


@pytest.mark.parametrize("content", ["[database]\nurl =\n", "[database]\nurl =    \n"])
def test_empty_url_raises(tmp_path: Path, content: str) -> None:
    config_path = tmp_path / "empty.ini"
    config_path.write_text(content, encoding="utf-8")

    with pytest.raises(StartupConfigError, match="empty"):
        load_url(config_path)


def test_unparsable_file_raises(tmp_path: Path) -> None:
    config_path = tmp_path / "broken.ini"
    config_path.write_text("no section header\nurl = sqlite://\n", encoding="utf-8")

    with pytest.raises(StartupConfigError, match="invalid"):
        load_url(config_path)


def test_url_is_returned_without_surrounding_whitespace(tmp_path: Path) -> None:
    config_path = tmp_path / "ok.ini"
    config_path.write_text("[database]\nurl =   sqlite:///x.db   \n", encoding="utf-8")

    assert load_url(config_path) == "sqlite:///x.db"


def test_the_server_section_is_optional_and_the_defaults_apply(tmp_path: Path) -> None:
    config_path = tmp_path / "ok.ini"
    write_ini(config_path, "sqlite:///x.db")

    config = load_startup_config(config_path)

    assert config.host == DEFAULT_HOST == "127.0.0.1"
    assert config.port == DEFAULT_PORT == 8000
    assert config.max_body_bytes == DEFAULT_MAX_BODY_BYTES == 2 * 1024 * 1024
    assert config.allowed_hosts == ()


def test_the_server_section_is_read(tmp_path: Path) -> None:
    config_path = tmp_path / "ok.ini"
    write_ini(
        config_path,
        "sqlite:///x.db",
        "[server]\nhost = 0.0.0.0\nport = 8123\nallowed_hosts = Replay.Example, 192.0.2.7, ,\n"
        "max_body_bytes = 4096\n",
    )

    config = load_startup_config(config_path)

    assert config.host == "0.0.0.0"
    assert config.port == 8123
    assert config.max_body_bytes == 4096
    assert config.allowed_hosts == ("replay.example", "192.0.2.7")


@pytest.mark.parametrize(
    "server",
    [
        "host =\n",
        "host = a b\n",
        "host = a/b\n",
        "port = 0\n",
        "port = 65536\n",
        "port = abc\n",
        "port = -1\n",
        "port = 8000.5\n",
        "port =\n",
        "max_body_bytes = 1023\n",
        "max_body_bytes = 1073741825\n",
        "max_body_bytes = lots\n",
        "allowed_hosts = bad host\n",
        "allowed_hosts = http://x\n",
    ],
)
def test_an_invalid_server_entry_raises(tmp_path: Path, server: str) -> None:
    config_path = tmp_path / "bad.ini"
    write_ini(config_path, "sqlite:///x.db", f"[server]\n{server}")

    with pytest.raises(StartupConfigError, match="invalid"):
        load_startup_config(config_path)


def test_the_error_of_an_invalid_server_entry_does_not_repeat_the_value(
    tmp_path: Path,
) -> None:
    config_path = tmp_path / "bad.ini"
    write_ini(config_path, "sqlite:///x.db", "[server]\nallowed_hosts = secret value\n")

    with pytest.raises(StartupConfigError) as caught:
        load_startup_config(config_path)

    assert "secret" not in str(caught.value)
