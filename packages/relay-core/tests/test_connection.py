"""The connection of a component to its relay, read from the sections ``[relay]`` and
``[relay.way]`` (specification 3.5, 6.1) and opened.

Every error names the entry, never a value.
"""

import configparser
from datetime import UTC, datetime
from pathlib import Path

import pytest

from pipwerk_relaycore import (
    DEFAULT_POLL_INTERVAL_SECONDS,
    ConnectionSettings,
    ConnectionSettingsError,
    Message,
    SecretsDirectory,
    connector_config,
    open_connector,
    read_connection_settings,
)
from pipwerk_relaycore.connection import RELAY_OPTIONS, RELAY_REQUIRED

SECRET = "never-print-this-value-0123456789"  # noqa: S105 - a value that must never be shown
ORIGIN = "Startup configuration x.ini"

RELAY = """
[relay]
address = tool.net1.relay1
way = files
secrets_directory = /secrets
key_file = tool.key
database = /state/tool.db
"""
WAY = """
[relay.way]
target.directory = /relay/from
inbox.directory = /relay/to
"""


def parse(text: str) -> configparser.ConfigParser:
    parser = configparser.ConfigParser(interpolation=None)
    parser.optionxform = str  # type: ignore[assignment,method-assign]
    parser.read_string(text)
    return parser


def read(text: str) -> ConnectionSettings | None:
    return read_connection_settings(parse(text), ORIGIN)


def read_required(text: str) -> ConnectionSettings:
    settings = read(text)
    assert settings is not None
    return settings


# --- reading ------------------------------------------------------------------------------------


def test_the_sections_are_read_with_their_defaults() -> None:
    settings = read_required(RELAY + WAY)
    assert settings.address == "tool.net1.relay1"
    assert settings.way == "files"
    assert settings.secrets_directory == Path("/secrets")
    assert settings.key_file == "tool.key"
    assert settings.database == Path("/state/tool.db")
    assert settings.relay_link is None
    assert settings.poll_interval_seconds == DEFAULT_POLL_INTERVAL_SECONDS == 2
    assert dict(settings.target) == {"directory": "/relay/from"}
    assert dict(settings.inbox) == {"directory": "/relay/to"}


def test_the_optional_entries_are_read() -> None:
    settings = read_required(RELAY + "relay_link = net1.relay9\npoll_interval_seconds = 30\n" + WAY)
    assert settings.relay_link == "net1.relay9"
    assert settings.poll_interval_seconds == 30


def test_the_settings_of_the_way_are_passed_on_unchanged() -> None:
    way = (
        "\n[relay.way]\ntarget.directory = C:\\relay\\from\ninbox.directory = C:\\relay\\to\n"
        "target.max_attachment_bytes = 1000\ninbox.other_setting = a b c\n"
    )
    settings = read_required(RELAY + way)
    assert dict(settings.target) == {"directory": "C:\\relay\\from", "max_attachment_bytes": "1000"}
    assert dict(settings.inbox) == {"directory": "C:\\relay\\to", "other_setting": "a b c"}


def test_a_file_without_the_section_gives_none() -> None:
    assert read("[other]\nx = 1\n") is None


def test_the_settings_do_not_change() -> None:
    settings = read_required(RELAY + WAY)
    with pytest.raises(TypeError):
        settings.target["directory"] = "/elsewhere"  # type: ignore[index]


def test_every_entry_is_known_and_the_required_ones_are_a_part_of_them() -> None:
    assert set(RELAY_REQUIRED) < RELAY_OPTIONS
    assert RELAY_OPTIONS - set(RELAY_REQUIRED) == {"relay_link", "poll_interval_seconds"}


# --- what is rejected ---------------------------------------------------------------------------


@pytest.mark.parametrize("entry", RELAY_REQUIRED)
def test_a_missing_entry_is_named(entry: str) -> None:
    text = "\n".join(line for line in RELAY.splitlines() if not line.startswith(entry + " ="))
    with pytest.raises(ConnectionSettingsError, match=entry) as raised:
        read(text + WAY)
    assert str(raised.value) == f"{ORIGIN} is missing the entry {entry} in section [relay]."


def test_an_entry_without_a_value_counts_as_missing() -> None:
    with pytest.raises(ConnectionSettingsError, match="key_file"):
        read(RELAY.replace("key_file = tool.key", "key_file =") + WAY)


@pytest.mark.parametrize("value", ["0", "3601", "often", "-1", "1.5", "٣", SECRET])
def test_an_invalid_poll_interval_is_rejected_by_naming_the_entry(value: str) -> None:
    with pytest.raises(ConnectionSettingsError, match="poll_interval_seconds") as raised:
        read(RELAY + f"poll_interval_seconds = {value}\n" + WAY)
    assert SECRET not in str(raised.value)


def test_an_unknown_entry_is_rejected_without_its_value() -> None:
    with pytest.raises(ConnectionSettingsError, match="adress") as raised:
        read(RELAY + f"adress = {SECRET}\n" + WAY)
    assert SECRET not in str(raised.value)


def test_an_entry_of_the_way_must_say_whether_it_is_for_the_target_or_for_the_inbox() -> None:
    with pytest.raises(ConnectionSettingsError, match="directory") as raised:
        read(RELAY + f"\n[relay.way]\ndirectory = {SECRET}\n")
    assert SECRET not in str(raised.value)
    with pytest.raises(ConnectionSettingsError, match="target"):
        read(RELAY + "\n[relay.way]\ntarget. = x\n")


def test_the_settings_of_the_way_without_the_section_are_an_error() -> None:
    with pytest.raises(ConnectionSettingsError, match=r"\[relay.way\] without \[relay\]"):
        read(WAY)


# --- opening ------------------------------------------------------------------------------------


def settings_in(root: Path, **changes: object) -> ConnectionSettings:
    secrets = root / "secrets"
    secrets.mkdir(mode=0o700)
    SecretsDirectory(secrets).new_key("tool.key")
    (root / "to-relay").mkdir()
    (root / "from-relay").mkdir()
    values: dict[str, object] = {
        "address": "tool.net1.relay1",
        "way": "files",
        "secrets_directory": secrets,
        "key_file": "tool.key",
        "database": root / "state" / "tool.db",
        "target": {"directory": str(root / "to-relay")},
        "inbox": {"directory": str(root / "from-relay")},
    }
    values.update(changes)
    return ConnectionSettings(**values)  # type: ignore[arg-type]


def test_the_connection_is_opened_and_the_directory_of_the_database_is_created(
    tmp_path: Path,
) -> None:
    settings = settings_in(tmp_path)
    with open_connector(settings) as connector:
        assert str(connector.address) == "tool.net1.relay1"
        message = connector.send("other.net1.relay1", "probe.message", {"text": "hello"})
    assert isinstance(message, Message)
    assert (tmp_path / "state" / "tool.db").is_file()
    assert len(list((tmp_path / "to-relay").glob("*.json"))) == 1


def test_the_clock_is_passed_on(tmp_path: Path) -> None:
    moment = datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC)
    with open_connector(settings_in(tmp_path), clock=lambda: moment) as connector:
        message = connector.send("other.net1.relay1", "probe.message", {"text": "hello"})
    assert message.created_at == moment


def test_the_configuration_of_the_connector_names_both_sides(tmp_path: Path) -> None:
    config = connector_config(settings_in(tmp_path, relay_link="net1.relay9"))
    assert config.component == "tool"
    assert config.relay == "net1.relay9"
    assert config.target.name == config.inbox.name == "files"


def test_a_key_file_that_others_can_read_is_refused(tmp_path: Path) -> None:
    settings = settings_in(tmp_path)
    (settings.secrets_directory / "tool.key").chmod(0o644)
    with pytest.raises(ConnectionSettingsError, match="accessible for others"):
        open_connector(settings)
    assert not (tmp_path / "state").exists()  # nothing is created for an invalid start


def test_a_missing_key_file_is_refused(tmp_path: Path) -> None:
    settings = settings_in(tmp_path, key_file="other.key")
    with pytest.raises(ConnectionSettingsError, match=r"other\.key"):
        open_connector(settings)


def test_a_way_that_is_not_installed_is_refused(tmp_path: Path) -> None:
    with pytest.raises(ConnectionSettingsError, match="nosuchway"):
        open_connector(settings_in(tmp_path, way="nosuchway"))


def test_a_setting_the_way_does_not_know_is_refused_without_its_value(tmp_path: Path) -> None:
    settings = settings_in(
        tmp_path, target={"directory": str(tmp_path / "to-relay"), "bogus": SECRET}
    )
    with pytest.raises(ConnectionSettingsError, match="bogus") as raised:
        open_connector(settings)
    assert SECRET not in str(raised.value)


def test_an_address_that_is_not_an_address_is_refused(tmp_path: Path) -> None:
    with pytest.raises(ConnectionSettingsError, match="address"):
        open_connector(settings_in(tmp_path, address="tool.net1"))


def test_a_link_that_is_not_a_name_is_refused(tmp_path: Path) -> None:
    with pytest.raises(ConnectionSettingsError, match="not a valid relay name"):
        open_connector(settings_in(tmp_path, relay_link="not a name"))


def test_a_directory_for_the_database_that_cannot_be_created_is_refused(tmp_path: Path) -> None:
    blocker = tmp_path / "blocker"
    blocker.write_text("a file", encoding="utf-8")
    with pytest.raises(ConnectionSettingsError, match="cannot be created"):
        open_connector(settings_in(tmp_path, database=blocker / "tool.db"))


def test_a_database_that_cannot_be_used_is_refused_without_a_path(tmp_path: Path) -> None:
    settings = settings_in(tmp_path)
    (tmp_path / "state").mkdir()
    (tmp_path / "state" / "tool.db").write_text("not a database" * 100, encoding="utf-8")
    with pytest.raises(ConnectionSettingsError, match="migration") as raised:
        open_connector(settings)
    assert str(tmp_path) not in str(raised.value)
