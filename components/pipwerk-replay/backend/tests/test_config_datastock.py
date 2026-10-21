"""Tests of the entries of the startup configuration for the data stock and the source.

Sections ``[marketdata]`` and ``[source]``: defaults, every entry, every invalid value, the
rule that address and key belong together, and that no error and no text repeats a value of
the file (the key above all).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from datastock import API, SECRET_KEY, candles_json, make_app
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect

from pipwerk_replay import cli
from pipwerk_replay.app import create_app
from pipwerk_replay.config import (
    DEFAULT_FETCH_TIMEOUT_SECONDS,
    DEFAULT_MAX_CONCURRENT_ACQUISITIONS,
    DEFAULT_MAX_CONCURRENT_IMPORTS,
    DEFAULT_MAX_KEPT_ACQUISITIONS,
    DEFAULT_MAX_LISTED_ITEMS,
    DEFAULT_MAX_PARTS_PER_REQUEST,
    DEFAULT_MAX_REPORTED_REJECTIONS,
    DEFAULT_MAX_ROWS_PER_FILE,
    DEFAULT_MAX_UPLOAD_BYTES,
    MarketDataSettings,
    SourceSettings,
    StartupConfigError,
    load_startup_config,
)

DATABASE = "[database]\nurl = sqlite:///x.db\n"


def load(tmp_path: Path, text: str) -> Any:
    path = tmp_path / "pipwerk-replay.ini"
    path.write_text(DATABASE + text, encoding="utf-8")
    return load_startup_config(path)


def error_of(tmp_path: Path, text: str) -> str:
    with pytest.raises(StartupConfigError) as caught:
        load(tmp_path, text)
    return str(caught.value)


def test_the_defaults_are_those_of_the_data_stock_library(tmp_path: Path) -> None:
    config = load(tmp_path, "")

    assert config.marketdata == MarketDataSettings()
    assert config.source == SourceSettings()
    assert config.source.configured is False
    assert config.marketdata.database_url is None
    assert config.marketdata.max_upload_bytes == DEFAULT_MAX_UPLOAD_BYTES == 32 * 1024 * 1024
    assert config.marketdata.max_rows == DEFAULT_MAX_ROWS_PER_FILE == 500_000
    assert config.marketdata.max_reported_rejections == DEFAULT_MAX_REPORTED_REJECTIONS == 1000
    assert config.marketdata.max_concurrent_imports == DEFAULT_MAX_CONCURRENT_IMPORTS == 2
    assert config.marketdata.max_listed_items == DEFAULT_MAX_LISTED_ITEMS == 1000
    assert config.marketdata.max_parts_per_request == DEFAULT_MAX_PARTS_PER_REQUEST == 100
    assert config.source.timeout_seconds == DEFAULT_FETCH_TIMEOUT_SECONDS == 300
    assert config.source.max_concurrent_acquisitions == DEFAULT_MAX_CONCURRENT_ACQUISITIONS == 2
    assert config.source.max_kept_acquisitions == DEFAULT_MAX_KEPT_ACQUISITIONS == 100


def test_every_entry_is_read(tmp_path: Path) -> None:
    config = load(
        tmp_path,
        "[marketdata]\n"
        "url = sqlite:///data.db\n"
        "max_upload_bytes = 2048\n"
        "max_rows = 7\n"
        "max_reported_rejections = 0\n"
        "max_concurrent_imports = 5\n"
        "max_listed_items = 3\n"
        "max_parts_per_request = 9\n"
        "[source]\n"
        "fetch_url = https://fetch.example:8765/base\n"
        f"fetch_key = {SECRET_KEY}\n"
        "timeout_seconds = 12\n"
        "max_concurrent_acquisitions = 4\n"
        "max_kept_acquisitions = 6\n",
    )

    assert config.marketdata == MarketDataSettings(
        database_url="sqlite:///data.db",
        max_upload_bytes=2048,
        max_rows=7,
        max_reported_rejections=0,
        max_concurrent_imports=5,
        max_listed_items=3,
        max_parts_per_request=9,
    )
    assert config.source == SourceSettings(
        url="https://fetch.example:8765/base",
        key=SECRET_KEY,
        timeout_seconds=12,
        max_concurrent_acquisitions=4,
        max_kept_acquisitions=6,
    )
    assert config.source.configured is True


@pytest.mark.parametrize(
    ("section", "entry", "values"),
    [
        (
            "marketdata",
            "max_upload_bytes",
            ["1023", "1073741825", "0", "-1", "x", "1.5", "1e3", ""],
        ),
        ("marketdata", "max_rows", ["0", "100000001", "-5", "ten", "1 000"]),
        ("marketdata", "max_reported_rejections", ["-1", "1000001", "all"]),
        ("marketdata", "max_concurrent_imports", ["0", "65", "two"]),
        ("marketdata", "max_listed_items", ["0", "1000001", "many"]),
        ("marketdata", "max_parts_per_request", ["0", "10001", "x"]),
        ("source", "timeout_seconds", ["0", "3601", "slow"]),
        ("source", "max_concurrent_acquisitions", ["0", "65", "x"]),
        ("source", "max_kept_acquisitions", ["0", "100001", "x"]),
    ],
)
def test_an_invalid_number_names_the_entry_and_never_the_value(
    tmp_path: Path, section: str, entry: str, values: list[str]
) -> None:
    for value in values:
        message = error_of(tmp_path, f"[{section}]\n{entry} = {value}\n")

        assert f"[{section}] {entry}" in message
        assert "invalid" in message
        if value.strip():
            assert f"= {value}" not in message


@pytest.mark.parametrize(
    ("section", "entry", "value"),
    [
        ("marketdata", "max_upload_bytes", "1024"),
        ("marketdata", "max_upload_bytes", "1073741824"),
        ("marketdata", "max_rows", "1"),
        ("marketdata", "max_rows", "100000000"),
        ("marketdata", "max_reported_rejections", "0"),
        ("marketdata", "max_reported_rejections", "1000000"),
        ("marketdata", "max_concurrent_imports", "1"),
        ("marketdata", "max_concurrent_imports", "64"),
        ("marketdata", "max_listed_items", "1"),
        ("marketdata", "max_parts_per_request", "10000"),
        ("source", "timeout_seconds", "1"),
        ("source", "timeout_seconds", "3600"),
        ("source", "max_concurrent_acquisitions", "64"),
        ("source", "max_kept_acquisitions", "100000"),
    ],
)
def test_the_bounds_of_the_numbers_are_valid(
    tmp_path: Path, section: str, entry: str, value: str
) -> None:
    load(tmp_path, f"[{section}]\n{entry} = {value}\n")


def test_an_empty_url_of_the_data_stock_is_an_error(tmp_path: Path) -> None:
    assert "empty [marketdata] url" in error_of(tmp_path, "[marketdata]\nurl =\n")


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1:8765",
        "http://127.0.0.1",
        "https://fetch.example",
        "https://fetch.example/prefix",
        "http://[::1]:8765",
        "http://192.0.2.7:8765/",
    ],
)
def test_valid_addresses_of_the_source(tmp_path: Path, url: str) -> None:
    config = load(tmp_path, f"[source]\nfetch_url = {url}\nfetch_key = {SECRET_KEY}\n")

    assert config.source.url == url.rstrip("/")


@pytest.mark.parametrize(
    "url",
    [
        "ftp://fetch.example",
        "fetch.example:8765",
        "//fetch.example",
        "http://",
        "http:///path",
        "http://user:password-secret@fetch.example",
        "http://user@fetch.example",
        "http://fetch.example?x=secret",
        "http://fetch.example/#secret",
        "http://fetch.example:99999",
        "http://fetch.example:port",
        "http://fetch example",
        "http://fetch.example/" + "a" * 2048,
        "file:///etc/passwd",
        "javascript:alert(1)",
    ],
)
def test_invalid_addresses_of_the_source_are_refused_without_repeating_them(
    tmp_path: Path, url: str
) -> None:
    message = error_of(tmp_path, f"[source]\nfetch_url = {url}\nfetch_key = {SECRET_KEY}\n")

    assert "invalid [source] fetch_url" in message
    assert "secret" not in message
    assert url not in message
    assert SECRET_KEY not in message


@pytest.mark.parametrize(
    "key",
    [
        "short",
        "k" * 15,
        "k" * 257,
        "with space in it 0123456789",
        "umlaut-ä-0123456789ab",
        "tab\tinside-0123456789",
    ],
)
def test_an_invalid_key_is_refused_without_repeating_it(tmp_path: Path, key: str) -> None:
    message = error_of(tmp_path, f"[source]\nfetch_url = http://127.0.0.1\nfetch_key = {key}\n")

    assert "invalid [source] fetch_key" in message
    assert key not in message


@pytest.mark.parametrize(
    "key", ["k" * 16, "k" * 256, "pa%ss%(word)s-with-percent-0123", "~!@#$^&*()[]{}<>"]
)
def test_a_valid_key_may_have_any_printable_character_even_a_percent_sign(
    tmp_path: Path, key: str
) -> None:
    config = load(tmp_path, f"[source]\nfetch_url = http://127.0.0.1\nfetch_key = {key}\n")

    assert config.source.key == key


def test_address_and_key_belong_together(tmp_path: Path) -> None:
    only_url = error_of(tmp_path, "[source]\nfetch_url = http://127.0.0.1\n")
    only_key = error_of(tmp_path, f"[source]\nfetch_key = {SECRET_KEY}\n")

    for message in (only_url, only_key):
        assert "fetch_url and fetch_key belong together" in message
        assert SECRET_KEY not in message


def test_empty_values_count_as_no_source(tmp_path: Path) -> None:
    config = load(tmp_path, "[source]\nfetch_url =\nfetch_key =\n")

    assert config.source.configured is False
    assert error_of(tmp_path, "[source]\nfetch_url = http://127.0.0.1\nfetch_key =\n")


def test_the_key_is_not_shown_by_repr_or_str(tmp_path: Path) -> None:
    config = load(tmp_path, f"[source]\nfetch_url = http://127.0.0.1\nfetch_key = {SECRET_KEY}\n")

    for text in (repr(config), str(config), repr(config.source), str(config.source)):
        assert SECRET_KEY not in text
    assert "http://127.0.0.1" in repr(config.source)


def test_a_syntax_error_names_only_the_line_and_never_the_key(tmp_path: Path) -> None:
    path = tmp_path / "pipwerk-replay.ini"
    path.write_text(
        f"fetch_key = {SECRET_KEY}\n[database]\nurl = sqlite:///x.db\n", encoding="utf-8"
    )

    with pytest.raises(StartupConfigError) as caught:
        load_startup_config(path)

    assert SECRET_KEY not in str(caught.value)
    assert "syntax error in line 1" in str(caught.value)


def test_a_line_that_is_no_entry_names_only_its_number(tmp_path: Path) -> None:
    path = tmp_path / "pipwerk-replay.ini"
    path.write_text(f"{DATABASE}[source]\n{SECRET_KEY}\n", encoding="utf-8")

    with pytest.raises(StartupConfigError) as caught:
        load_startup_config(path)

    assert SECRET_KEY not in str(caught.value)
    assert "line 4" in str(caught.value)


def test_a_file_that_is_no_utf8_text_names_no_content(tmp_path: Path) -> None:
    path = tmp_path / "pipwerk-replay.ini"
    path.write_bytes(DATABASE.encode() + b"[source]\nfetch_key = \xff\xfe" + SECRET_KEY.encode())

    with pytest.raises(StartupConfigError) as caught:
        load_startup_config(path)

    assert SECRET_KEY not in str(caught.value)
    assert "not UTF-8" in str(caught.value)


def test_a_percent_sign_in_the_database_url_is_taken_literally(tmp_path: Path) -> None:
    path = tmp_path / "pipwerk-replay.ini"
    path.write_text("[database]\nurl = sqlite:///x%20y.db\n", encoding="utf-8")

    assert load_startup_config(path).database_url == "sqlite:///x%20y.db"


# --- the settings reach the application ---------------------------------------------------------


def test_the_command_line_start_gives_the_settings_to_the_application(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import uvicorn

    started: list[Any] = []
    monkeypatch.setattr(uvicorn, "run", lambda app, **_kwargs: started.append(app))
    config = tmp_path / "pipwerk-replay.ini"
    config.write_text(
        f"[database]\nurl = sqlite:///{tmp_path / 'replay.db'}\n"
        "[marketdata]\nmax_listed_items = 2\nmax_rows = 3\n"
        f"[source]\nfetch_url = http://127.0.0.1:1\nfetch_key = {SECRET_KEY}\n",
        encoding="utf-8",
    )

    assert cli.main(["-c", str(config)]) == 0

    client = TestClient(started[0])
    assert client.get(f"{API}/overview").json()["limit"] == 2
    refused = client.post(
        f"{API}/imports/json", content=candles_json(4), headers={"content-type": "application/json"}
    )
    assert refused.json()["code"] == "too_many_rows"
    # a source is set up: the acquisition starts (and fails, nothing listens at the address)
    started_acquisition = client.post(
        f"{API}/acquisitions",
        json={"parts": [{"kind": "instrument", "instrument": "EURUSD"}]},
    )
    assert started_acquisition.status_code == 202


def test_without_a_source_in_the_configuration_the_acquisition_is_409(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import uvicorn

    started: list[Any] = []
    monkeypatch.setattr(uvicorn, "run", lambda app, **_kwargs: started.append(app))
    config = tmp_path / "pipwerk-replay.ini"
    config.write_text(f"[database]\nurl = sqlite:///{tmp_path / 'replay.db'}\n", encoding="utf-8")

    assert cli.main(["-c", str(config)]) == 0

    response = TestClient(started[0]).post(
        f"{API}/acquisitions", json={"parts": [{"kind": "instrument", "instrument": "EURUSD"}]}
    )
    assert response.status_code == 409


def test_create_app_without_arguments_takes_the_settings_of_the_configuration(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    directory = tmp_path / "home" / "pipwerk" / "etc"
    directory.mkdir(parents=True)
    (directory / "pipwerk-replay.ini").write_text(
        f"[database]\nurl = sqlite:///{tmp_path / 'replay.db'}\n"
        "[marketdata]\nmax_listed_items = 5\n",
        encoding="utf-8",
    )
    monkeypatch.setattr("pipwerk_replay.config._POSIX_SYSTEM_DIR", tmp_path / "system")

    client = TestClient(create_app())

    assert client.get(f"{API}/overview").json()["limit"] == 5


# --- the databases ------------------------------------------------------------------------------


def tables(path: Path) -> set[str]:
    engine = create_engine(f"sqlite:///{path}")
    try:
        return set(inspect(engine).get_table_names())
    finally:
        engine.dispose()


def test_the_data_stock_shares_the_database_of_pipwerk_replay_by_default(tmp_path: Path) -> None:
    TestClient(make_app(tmp_path))

    names = tables(tmp_path / "replay.db")
    assert {"alembic_version", "replay_settings", "test_accounts"} <= names
    assert {"marketdata_alembic_version", "marketdata_series", "marketdata_candle"} <= names


def test_the_data_stock_can_have_its_own_database(tmp_path: Path) -> None:
    settings = MarketDataSettings(database_url=f"sqlite:///{tmp_path / 'data.db'}")
    client = TestClient(make_app(tmp_path, marketdata=settings))

    imported = client.post(
        f"{API}/imports/json", content=candles_json(3), headers={"content-type": "application/json"}
    )

    assert imported.status_code == 200
    own, data = tables(tmp_path / "replay.db"), tables(tmp_path / "data.db")
    assert not any(name.startswith("marketdata_") for name in own)
    assert {"alembic_version", "replay_settings", "test_accounts"} <= own
    assert {"marketdata_alembic_version", "marketdata_series", "marketdata_candle"} <= data
    assert not {"alembic_version", "replay_settings", "test_accounts"} & data


def test_the_same_url_for_both_is_the_same_database(tmp_path: Path) -> None:
    url = f"sqlite:///{tmp_path / 'replay.db'}"
    client = TestClient(create_app(url, marketdata=MarketDataSettings(database_url=url)))

    assert client.get(f"{API}/overview").status_code == 200
    assert "marketdata_series" in tables(tmp_path / "replay.db")


def test_the_two_schemas_are_migrated_separately_each_with_its_own_version_table(
    tmp_path: Path,
) -> None:
    import sqlite3

    TestClient(make_app(tmp_path))
    TestClient(make_app(tmp_path))  # a second start changes nothing and does not fail

    with sqlite3.connect(tmp_path / "replay.db") as connection:
        replay = connection.execute("SELECT version_num FROM alembic_version").fetchall()
        data = connection.execute("SELECT version_num FROM marketdata_alembic_version").fetchall()
    assert replay == [("0002",)]
    assert len(data) == 1
    assert data != replay


def test_an_existing_database_of_the_first_order_gets_the_new_column(tmp_path: Path) -> None:
    """The step from revision 0001 to 0002 keeps the rows and adds the default source."""
    import sqlite3

    from pipwerk_replay.storage import create_database_engine

    engine = create_database_engine(f"sqlite:///{tmp_path / 'replay.db'}")
    with engine.begin() as connection:
        connection.exec_driver_sql(
            "CREATE TABLE replay_settings (id INTEGER NOT NULL PRIMARY KEY, "
            "language VARCHAR(8) NOT NULL)"
        )
        connection.exec_driver_sql("INSERT INTO replay_settings VALUES (1, 'en')")
        connection.exec_driver_sql(
            "CREATE TABLE test_accounts (id VARCHAR(36) NOT NULL PRIMARY KEY, "
            "name VARCHAR(100) NOT NULL, initial_capital FLOAT NOT NULL, "
            "currency VARCHAR(3) NOT NULL, leverage INTEGER NOT NULL, "
            "spread_mode VARCHAR(8) NOT NULL, spread_points FLOAT, "
            "commission_per_lot_side FLOAT NOT NULL)"
        )
        connection.exec_driver_sql(
            "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
        )
        connection.exec_driver_sql("INSERT INTO alembic_version VALUES ('0001')")
    engine.dispose()

    client = TestClient(make_app(tmp_path))

    assert client.get("/api/replay/settings/language").json() == {"language": "en"}
    assert client.get("/api/replay/settings/default-source").json() == {"broker": None}
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        assert connection.execute("SELECT version_num FROM alembic_version").fetchall() == [
            ("0002",)
        ]


def test_the_start_fails_when_the_schema_of_the_data_stock_is_from_a_newer_version(
    tmp_path: Path,
) -> None:
    import sqlite3

    from pipwerk_replay.migrate import DatabaseMigrationError

    TestClient(make_app(tmp_path))
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute("UPDATE marketdata_alembic_version SET version_num = '9999'")

    with pytest.raises(DatabaseMigrationError) as caught:
        make_app(tmp_path)

    assert str(tmp_path) not in str(caught.value)
    assert "market data" in str(caught.value) or "library" in str(caught.value)


def test_nothing_in_the_startup_reads_the_network(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Setting up a source does not contact it: only an acquisition does."""

    def forbidden(*_args: Any, **_kwargs: Any) -> Any:
        raise AssertionError("the network was used")

    monkeypatch.setattr("socket.socket.connect", forbidden)
    create_app(
        f"sqlite:///{tmp_path / 'replay.db'}",
        source=SourceSettings(url="http://fetch.example", key=SECRET_KEY),
    )


# --- the example of the startup configuration ----------------------------------------------------


def test_the_example_file_with_every_entry_switched_on_is_a_valid_configuration(
    tmp_path: Path,
) -> None:
    import re

    example = Path(__file__).resolve().parents[1] / "pipwerk-replay.example.ini"
    lines = []
    for line in example.read_text(encoding="utf-8").splitlines():
        match = re.fullmatch(r"# ((?:[a-z_]+ = .*)|(?:\[[a-z]+\]))", line)
        lines.append(match.group(1) if match else line)
    path = tmp_path / "pipwerk-replay.ini"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    config = load_startup_config(path)

    assert config.marketdata == MarketDataSettings(database_url="sqlite:///./pipwerk-marketdata.db")
    assert config.source.url == "http://192.0.2.10:8765"
    assert config.source.key == "replace-with-the-shared-key"
    # the other values of the example are the defaults
    assert config.source == SourceSettings(
        url="http://192.0.2.10:8765", key="replace-with-the-shared-key"
    )
    assert config.max_body_bytes == 2097152


def test_the_example_file_as_it_is_names_no_source(tmp_path: Path) -> None:
    example = Path(__file__).resolve().parents[1] / "pipwerk-replay.example.ini"

    config = load_startup_config(example)

    assert config.source == SourceSettings()
    assert config.marketdata == MarketDataSettings()
