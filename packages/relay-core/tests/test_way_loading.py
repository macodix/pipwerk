"""Ways as extension (specification 3.4): a way from its own package is loaded by its name."""

import importlib.metadata
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from typing import Any, ClassVar

import pytest
from pipwerk_relay_testway import BOXES, MemoryWay

from pipwerk_relaycore import (
    WAY_API_VERSION,
    Envelope,
    Incoming,
    ReceivedEnvelope,
    Way,
    WayError,
    WayLoadError,
    WayRefusedError,
    WaySettings,
    WaySettingsError,
    available_ways,
    load_way,
    load_way_class,
)
from pipwerk_relaycore import loader as loader_module
from pipwerk_relaycore.ways.files import FilesWay
from tests.helpers import LIBRARY_SOURCE, make_envelope, make_message


@pytest.fixture(autouse=True)
def clean_boxes() -> None:
    BOXES.clear()


def test_the_ways_are_registered_through_entry_points() -> None:
    assert {"files", "memory"} <= set(available_ways())


def test_the_test_way_comes_from_a_package_of_its_own() -> None:
    entry = importlib.metadata.entry_points(group="pipwerk_relay.ways", name="memory")
    assert {item.dist.name for item in entry if item.dist} == {"pipwerk-relay-testway"}
    files = importlib.metadata.entry_points(group="pipwerk_relay.ways", name="files")
    assert {item.dist.name for item in files if item.dist} == {"pipwerk-relaycore"}


def test_the_library_knows_no_way_in_its_code() -> None:
    for path in LIBRARY_SOURCE.rglob("*.py"):
        if path.parts[-2] == "ways":
            continue
        text = path.read_text(encoding="utf-8")
        assert "pipwerk_relay_testway" not in text, path
        assert "ways.files" not in text or path.name == "__init__.py", path


def test_a_way_is_loaded_by_its_name_with_its_own_settings() -> None:
    way = load_way("memory", {"box": "inbox-1"})
    assert isinstance(way, MemoryWay)
    assert way.settings.box == "inbox-1"
    assert way.settings.refuse is False
    assert load_way_class("files") is FilesWay


def test_the_loaded_test_way_hands_over_reads_and_acknowledges() -> None:
    sender = load_way("memory", {"box": "inbox-1"})
    reader = load_way("memory", {"box": "inbox-1"})
    other = load_way("memory", {"box": "inbox-2"})
    message = make_message([("a.csv", b"one")])
    envelope = make_envelope(message)
    sender.send(envelope, [b"one"])
    assert other.read() == []
    (item,) = reader.read()
    assert isinstance(item, ReceivedEnvelope)
    assert item.envelope == envelope
    assert item.attachments == (b"one",)
    reader.acknowledge(item.token)
    reader.acknowledge(item.token)
    assert reader.read() == []


def test_a_way_that_does_not_know_clean_up_removes_nothing() -> None:
    way = load_way("memory", {"box": "inbox-3"})
    assert way.clean_up(timedelta(0), datetime.now(UTC)) == 0


def test_the_own_settings_of_the_test_way_can_make_it_refuse() -> None:
    way = load_way("memory", {"box": "x", "refuse": True})
    with pytest.raises(WayRefusedError):
        way.send(make_envelope(), [])


def test_the_error_of_unknown_settings_names_the_entry_not_the_value() -> None:
    secret = "hunter2-secret-value"  # noqa: S105 - a value that must not appear
    with pytest.raises(WaySettingsError) as raised:
        load_way("memory", {"box": "x", "unknown_entry": secret})
    assert raised.value.entries == ("unknown_entry",)
    assert "unknown_entry" in str(raised.value)
    assert secret not in str(raised.value)
    assert raised.value.way == "memory"


def test_an_invalid_value_is_reported_by_the_name_of_the_entry_only() -> None:
    secret = "Not Valid!"  # noqa: S105 - a value that must not appear
    with pytest.raises(WaySettingsError) as raised:
        load_way("memory", {"box": secret})
    assert raised.value.entries == ("box",)
    assert secret not in str(raised.value)
    assert "Valid" not in str(raised.value)


def test_a_missing_entry_is_named() -> None:
    with pytest.raises(WaySettingsError) as raised:
        load_way("memory", {})
    assert raised.value.entries == ("box",)


def test_the_settings_of_the_way_files_are_checked_the_same_way() -> None:
    with pytest.raises(WaySettingsError) as raised:
        load_way("files", {"directory": "/somewhere", "port": 22, "max_envelope_bytes": 0})
    assert raised.value.entries == ("max_envelope_bytes", "port")
    assert "/somewhere" not in str(raised.value)


def test_numbers_from_an_ini_file_are_converted() -> None:
    way = load_way("files", {"directory": "x", "max_envelope_bytes": "2048"})
    assert isinstance(way, FilesWay)
    assert way.settings.max_envelope_bytes == 2048


@pytest.mark.parametrize("name", ["", "Files", "files ", "../files", "a.b", "x" * 33, "1way"])
def test_an_invalid_name_of_a_way_is_refused(name: str) -> None:
    with pytest.raises(WayLoadError):
        load_way_class(name)


def test_an_unknown_way_is_refused() -> None:
    with pytest.raises(WayLoadError, match="unknown way 'nothing'"):
        load_way("nothing", {})


class _FakeEntry:
    def __init__(self, name: str, value: str, loaded: object) -> None:
        self.name, self.value, self._loaded = name, value, loaded

    def load(self) -> object:
        if isinstance(self._loaded, Exception):
            raise self._loaded
        return self._loaded


def patch_entries(monkeypatch: pytest.MonkeyPatch, entries: Sequence[_FakeEntry]) -> None:
    def fake(*, group: str, name: str | None = None) -> list[_FakeEntry]:
        assert group == "pipwerk_relay.ways"
        return [entry for entry in entries if name is None or entry.name == name]

    monkeypatch.setattr(loader_module, "entry_points", fake)


def test_a_name_that_two_packages_register_is_refused(monkeypatch: pytest.MonkeyPatch) -> None:
    patch_entries(
        monkeypatch,
        [_FakeEntry("dup", "one:Way", MemoryWay), _FakeEntry("dup", "two:Way", FilesWay)],
    )
    with pytest.raises(WayLoadError, match="more than once"):
        load_way_class("dup")


class _OtherVersion(Way[WaySettings]):
    api_version: ClassVar[int] = WAY_API_VERSION + 1

    def send(self, envelope: Envelope, attachments: Sequence[bytes]) -> None: ...

    def read(self, limit: int = 100) -> list[Incoming]:
        return []

    def acknowledge(self, token: str) -> None: ...


def test_a_way_of_another_version_of_the_interface_is_refused(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    patch_entries(monkeypatch, [_FakeEntry("future", "x:Way", _OtherVersion)])
    with pytest.raises(WayLoadError, match="version"):
        load_way_class("future")


@pytest.mark.parametrize("loaded", [object(), "text", 5, object, Exception])
def test_an_entry_point_that_is_no_way_is_refused(
    monkeypatch: pytest.MonkeyPatch, loaded: Any
) -> None:
    patch_entries(monkeypatch, [_FakeEntry("odd", "x:Odd", loaded)])
    with pytest.raises(WayLoadError, match="not a way"):
        load_way_class("odd")


def test_a_package_that_cannot_be_imported_gives_one_clean_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    patch_entries(monkeypatch, [_FakeEntry("broken", "x:Way", ImportError("secret path"))])
    with pytest.raises(WayLoadError) as raised:
        load_way_class("broken")
    assert "secret path" not in str(raised.value)
    assert isinstance(raised.value, WayError)
