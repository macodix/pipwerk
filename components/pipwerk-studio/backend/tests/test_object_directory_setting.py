"""Tests for the setting "object directory": default, storage and origin.

Covered: the default of the object directory for each origin of the startup
configuration (system-wide location, user location, ``-c``) on POSIX and on
Windows, also without the needed environment variable; the origin the startup
configuration passes on; reading and storing the setting in the service.
"""

import sqlite3
from pathlib import Path
from types import SimpleNamespace

import pytest
import uvicorn
from fastapi.testclient import TestClient

from pipwerk_studio import cli
from pipwerk_studio.app import create_app
from pipwerk_studio.config import (
    ConfigOrigin,
    StartupConfig,
    load_startup_config,
    system_search_location,
)
from pipwerk_studio.object_store import ObjectDirectoryNotSetError
from pipwerk_studio.settings_service import (
    InvalidObjectDirectoryError,
    SettingsService,
    StoredObjectDirectoryInvalidError,
    default_object_directory,
)
from pipwerk_studio.storage import create_session_factory, create_studio_engine

ORIGINS: tuple[ConfigOrigin, ...] = ("system", "user", "explicit")


def write_ini(path: Path, url: str = "sqlite:///x.db") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"[database]\nurl = {url}\n", encoding="utf-8")


def make_service(
    tmp_path: Path,
    origin: ConfigOrigin = "explicit",
    *,
    windows: bool | None = False,
    environ: dict[str, str] | None = None,
) -> SettingsService:
    engine = create_studio_engine(f"sqlite:///{tmp_path / 'studio.db'}")
    return SettingsService(
        create_session_factory(engine), origin, windows=windows, environ=environ or {}
    )


@pytest.fixture(autouse=True)
def isolated_system_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    system_dir = tmp_path / "system-etc-pipwerk"
    monkeypatch.setattr("pipwerk_studio.config._POSIX_SYSTEM_DIR", system_dir)
    return system_dir


# --- default of the object directory ------------------------------------------


@pytest.mark.parametrize("origin", ["user", "explicit"])
def test_posix_default_for_the_user(origin: ConfigOrigin, tmp_path: Path) -> None:
    result = default_object_directory(origin, windows=False, environ={"HOME": str(tmp_path)})

    assert result == tmp_path / ".local" / "share" / "pipwerk" / "studio" / "objects"


def test_posix_default_for_the_system_does_not_need_an_environment_variable() -> None:
    expected = Path("/var/lib/pipwerk/studio/objects")

    assert default_object_directory("system", windows=False, environ={}) == expected
    assert default_object_directory("system", windows=False, environ={"HOME": "x"}) == expected


@pytest.mark.parametrize("origin", ["user", "explicit"])
@pytest.mark.parametrize("environ", [{}, {"HOME": ""}, {"HOME": "relative/home"}])
def test_posix_default_for_the_user_is_not_set_without_a_usable_home(
    origin: ConfigOrigin, environ: dict[str, str]
) -> None:
    assert default_object_directory(origin, windows=False, environ=environ) is None


@pytest.mark.parametrize("origin", ["user", "explicit"])
def test_windows_default_for_the_user(origin: ConfigOrigin, tmp_path: Path) -> None:
    environ = {"LOCALAPPDATA": str(tmp_path / "local"), "PROGRAMDATA": str(tmp_path / "program")}

    result = default_object_directory(origin, windows=True, environ=environ)

    assert result == tmp_path / "local" / "pipwerk" / "studio" / "objects"


def test_windows_default_for_the_system(tmp_path: Path) -> None:
    environ = {"LOCALAPPDATA": str(tmp_path / "local"), "PROGRAMDATA": str(tmp_path / "program")}

    result = default_object_directory("system", windows=True, environ=environ)

    assert result == tmp_path / "program" / "pipwerk" / "studio" / "objects"


@pytest.mark.parametrize("value", [None, "", "relative"])
def test_windows_default_is_not_set_without_a_usable_variable(
    value: str | None, tmp_path: Path
) -> None:
    def environ(name: str) -> dict[str, str]:
        other = {"LOCALAPPDATA": "PROGRAMDATA", "PROGRAMDATA": "LOCALAPPDATA"}[name]
        result = {other: str(tmp_path)}
        if value is not None:
            result[name] = value
        return result

    assert default_object_directory("user", windows=True, environ=environ("LOCALAPPDATA")) is None
    assert (
        default_object_directory("explicit", windows=True, environ=environ("LOCALAPPDATA")) is None
    )
    assert default_object_directory("system", windows=True, environ=environ("PROGRAMDATA")) is None


def test_the_default_follows_the_running_system(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))

    assert default_object_directory("user") == (
        tmp_path / ".local" / "share" / "pipwerk" / "studio" / "objects"
    )


# --- origin of the startup configuration ---------------------------------------


def test_origin_explicit_for_a_file_given_with_c(tmp_path: Path) -> None:
    write_ini(tmp_path / "given.ini", "sqlite:///given.db")

    assert load_startup_config(tmp_path / "given.ini") == StartupConfig(
        "sqlite:///given.db", "explicit"
    )


def test_origin_explicit_even_for_the_file_at_the_system_location(
    isolated_system_dir: Path, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    write_ini(isolated_system_dir / "pipwerk-studio.ini")

    assert load_startup_config(isolated_system_dir / "pipwerk-studio.ini").origin == "explicit"


@pytest.mark.parametrize(
    "relative",
    [("pipwerk", "etc", "pipwerk-studio.ini"), (".config", "pipwerk", "pipwerk-studio.ini")],
)
def test_origin_user_for_the_user_locations(
    relative: tuple[str, ...], tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    write_ini(tmp_path.joinpath("home", *relative))

    assert load_startup_config().origin == "user"


def test_origin_system_for_the_system_location(
    isolated_system_dir: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    write_ini(isolated_system_dir / "pipwerk-studio.ini")

    assert load_startup_config().origin == "system"


def test_a_user_location_has_priority_over_the_system_location(
    isolated_system_dir: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    write_ini(isolated_system_dir / "pipwerk-studio.ini", "sqlite:///system.db")
    write_ini(tmp_path / "home" / ".config" / "pipwerk" / "pipwerk-studio.ini", "sqlite:///user.db")

    assert load_startup_config() == StartupConfig("sqlite:///user.db", "user")


def test_the_windows_locations_give_their_origin(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    environment = {
        "USERPROFILE": str(tmp_path / "profile"),
        "APPDATA": str(tmp_path / "appdata"),
        "PROGRAMDATA": str(tmp_path / "programdata"),
    }
    monkeypatch.setattr("pipwerk_studio.config.os", SimpleNamespace(name="nt", environ=environment))

    assert system_search_location() == tmp_path / "programdata" / "pipwerk" / "pipwerk-studio.ini"
    write_ini(tmp_path / "programdata" / "pipwerk" / "pipwerk-studio.ini")
    assert load_startup_config().origin == "system"
    write_ini(tmp_path / "appdata" / "pipwerk" / "pipwerk-studio.ini")
    assert load_startup_config().origin == "user"


def test_the_windows_system_location_is_missing_without_programdata(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("pipwerk_studio.config.os", SimpleNamespace(name="nt", environ={}))

    assert system_search_location() is None


def test_the_origin_reaches_the_application_through_the_command_line(
    tmp_path: Path, isolated_system_dir: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    servers: list[tuple[object, ...]] = []
    monkeypatch.setattr(uvicorn, "run", lambda *args, **kwargs: servers.append(args))
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    write_ini(isolated_system_dir / "pipwerk-studio.ini", f"sqlite:///{tmp_path / 'system.db'}")
    write_ini(tmp_path / "given.ini", f"sqlite:///{tmp_path / 'given.db'}")

    assert cli.main([]) == 0
    assert cli.main(["-c", str(tmp_path / "given.ini")]) == 0

    system_app, given_app = (TestClient(server[0]) for server in servers)  # type: ignore[arg-type]
    assert system_app.get("/api/studio/settings/object-directory").json() == {
        "path": "/var/lib/pipwerk/studio/objects",
        "is_default": True,
    }
    assert given_app.get("/api/studio/settings/object-directory").json() == {
        "path": str(tmp_path / "home" / ".local" / "share" / "pipwerk" / "studio" / "objects"),
        "is_default": True,
    }


def test_create_app_without_url_loads_the_origin_from_the_startup_configuration(
    tmp_path: Path, isolated_system_dir: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    write_ini(isolated_system_dir / "pipwerk-studio.ini", f"sqlite:///{tmp_path / 'system.db'}")

    client = TestClient(create_app())

    assert client.get("/api/studio/settings/object-directory").json()["path"] == (
        "/var/lib/pipwerk/studio/objects"
    )


# --- reading and storing the setting ---------------------------------------------


def test_reading_gives_the_default_while_nothing_is_stored(tmp_path: Path) -> None:
    service = make_service(tmp_path, "user", environ={"HOME": str(tmp_path / "home")})

    setting = service.get_object_directory()

    assert setting.path == tmp_path / "home" / ".local" / "share" / "pipwerk" / "studio" / "objects"
    assert setting.is_default is True
    assert service.effective_object_directory() == setting.path


def test_reading_gives_the_default_of_the_system_origin(tmp_path: Path) -> None:
    service = make_service(tmp_path, "system", environ={"HOME": str(tmp_path / "home")})

    assert service.get_object_directory().path == Path("/var/lib/pipwerk/studio/objects")


def test_reading_reports_not_set_without_a_default(tmp_path: Path) -> None:
    service = make_service(tmp_path, "user", environ={})

    setting = service.get_object_directory()

    assert setting.path is None
    assert setting.is_default is True
    assert service.effective_object_directory() is None


def test_writing_an_object_without_a_directory_fails_with_a_message_without_a_path(
    tmp_path: Path,
) -> None:
    service = make_service(tmp_path, "user", environ={})

    with pytest.raises(ObjectDirectoryNotSetError) as caught:
        service.object_store.create("strategy", "{}")

    assert str(tmp_path) not in str(caught.value)
    assert service.object_store.list_objects("strategy") == []


def test_a_stored_directory_replaces_the_default(tmp_path: Path) -> None:
    service = make_service(tmp_path, "user", environ={"HOME": str(tmp_path / "home")})

    result = service.set_object_directory(str(tmp_path / "chosen"), move=False)

    assert result.path == tmp_path / "chosen"
    assert result.is_default is False
    assert service.get_object_directory() == result
    assert service.effective_object_directory() == tmp_path / "chosen"


def test_a_stored_directory_is_used_even_without_a_default(tmp_path: Path) -> None:
    service = make_service(tmp_path, "user", environ={})

    service.set_object_directory(str(tmp_path / "chosen"), move=False)

    assert service.effective_object_directory() == tmp_path / "chosen"
    assert service.object_store.create("rule", "{}")
    assert len(list((tmp_path / "chosen").iterdir())) == 1


def test_the_stored_directory_survives_a_new_service(tmp_path: Path) -> None:
    service = make_service(tmp_path, "user", environ={})
    service.set_object_directory(str(tmp_path / "chosen"), move=False)

    again = make_service(tmp_path, "system", environ={})

    assert again.get_object_directory().path == tmp_path / "chosen"
    assert again.get_object_directory().is_default is False


def test_storing_the_directory_keeps_the_language_and_creates_the_default_language(
    tmp_path: Path,
) -> None:
    service = make_service(tmp_path)
    service.set_object_directory(str(tmp_path / "chosen"), move=False)
    assert service.get_language() == "de"

    service.set_language("en")
    service.set_object_directory(str(tmp_path / "other"), move=False)

    assert service.get_language() == "en"


@pytest.mark.parametrize(
    "value",
    ["", "relative/path", "./objects", "objects", "~/objects", "\x00", "/a\x00b", "/" + "a" * 4100],
)
def test_a_directory_that_is_not_an_absolute_path_is_rejected(tmp_path: Path, value: str) -> None:
    service = make_service(tmp_path)

    with pytest.raises(InvalidObjectDirectoryError) as caught:
        service.set_object_directory(value, move=True)

    assert str(caught.value) == "The object directory must be an absolute path."
    assert service.get_object_directory().is_default is True


def test_a_stored_value_that_is_not_absolute_is_reported_and_repaired_by_a_write(
    tmp_path: Path,
) -> None:
    service = make_service(tmp_path)
    service.set_language("en")
    with sqlite3.connect(tmp_path / "studio.db") as connection:
        connection.execute("UPDATE studio_settings SET object_directory = 'relative'")

    with pytest.raises(StoredObjectDirectoryInvalidError):
        service.get_object_directory()
    service.set_object_directory(str(tmp_path / "chosen"), move=False)

    assert service.get_object_directory().path == tmp_path / "chosen"
