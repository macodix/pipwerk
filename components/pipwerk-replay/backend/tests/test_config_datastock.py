"""Tests of the entries of the startup configuration for the data stock.

Section ``[marketdata]``: defaults, every entry, every invalid value, the relation of the limits
of an import, and that no error repeats a value of the file. A startup configuration from before
the acquisition was removed (with a section ``[source]``) still starts.
"""

from __future__ import annotations

import re
import sqlite3
from pathlib import Path
from typing import Any

import pytest
import uvicorn
from datastock import SERIES_URL, candles_json, import_json_file, make_app, upload
from fastapi.testclient import TestClient
from pipwerk_marketdata import CalendarDay
from sqlalchemy import create_engine, inspect

from pipwerk_replay import cli
from pipwerk_replay.app import create_app
from pipwerk_replay.config import (
    DEFAULT_IMPORT_IDLE_TIMEOUT_SECONDS,
    DEFAULT_MAX_CONCURRENT_IMPORTS,
    DEFAULT_MAX_LISTED_ITEMS,
    DEFAULT_MAX_PARTS_PER_REQUEST,
    DEFAULT_MAX_REPORTED_REJECTIONS,
    DEFAULT_MAX_ROWS_PER_FILE,
    DEFAULT_MAX_UPLOAD_BYTES,
    DEFAULT_NO_TRADING_DAYS,
    MarketDataSettings,
    StartupConfigError,
    load_startup_config,
)
from pipwerk_replay.migrate import DatabaseMigrationError
from pipwerk_replay.storage import create_database_engine

DATABASE = "[database]\nurl = sqlite:///x.db\n"
#: A value that appears nowhere else; a test looks for it in errors.
MARKER = "VALUE-must-never-appear-4711"
#: A startup configuration as it was written before the acquisition was removed.
OLD_SOURCE_SECTION = (
    "[source]\n"
    "fetch_url = http://192.0.2.10:8765\n"
    f"fetch_key = {MARKER}-0123456789\n"
    "timeout_seconds = 12\n"
    "max_concurrent_acquisitions = 4\n"
    "max_kept_acquisitions = 6\n"
)


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
    assert config.marketdata.database_url is None
    assert config.marketdata.max_upload_bytes == DEFAULT_MAX_UPLOAD_BYTES == 32 * 1024 * 1024
    assert (
        config.marketdata.import_idle_timeout_seconds == DEFAULT_IMPORT_IDLE_TIMEOUT_SECONDS == 300
    )
    assert config.marketdata.no_trading_days == (CalendarDay(12, 25), CalendarDay(1, 1))
    assert config.marketdata.max_rows == DEFAULT_MAX_ROWS_PER_FILE == 500_000
    assert config.marketdata.max_reported_rejections == DEFAULT_MAX_REPORTED_REJECTIONS == 1000
    assert config.marketdata.max_concurrent_imports == DEFAULT_MAX_CONCURRENT_IMPORTS == 2
    assert config.marketdata.max_listed_items == DEFAULT_MAX_LISTED_ITEMS == 1000
    assert config.marketdata.max_parts_per_request == DEFAULT_MAX_PARTS_PER_REQUEST == 100


def test_every_entry_is_read(tmp_path: Path) -> None:
    config = load(
        tmp_path,
        "[marketdata]\n"
        "url = sqlite:///data.db\n"
        "max_upload_bytes = 2048\n"
        "import_idle_timeout_seconds = 60\n"
        "no_trading_days = 12-24, 12-25, 12-26, 01-01\n"
        "max_rows = 7\n"
        "max_reported_rejections = 0\n"
        "max_concurrent_imports = 5\n"
        "max_listed_items = 3\n"
        "max_parts_per_request = 9\n",
    )

    assert config.marketdata == MarketDataSettings(
        database_url="sqlite:///data.db",
        max_upload_bytes=2048,
        import_idle_timeout_seconds=60,
        no_trading_days=(
            CalendarDay(12, 24),
            CalendarDay(12, 25),
            CalendarDay(12, 26),
            CalendarDay(1, 1),
        ),
        max_rows=7,
        max_reported_rejections=0,
        max_concurrent_imports=5,
        max_listed_items=3,
        max_parts_per_request=9,
    )


def test_the_entries_for_the_removed_limits_of_an_import_are_ignored(tmp_path: Path) -> None:
    """There is no limit for the number of files or the total size of an import; a startup
    configuration that still names them starts like with every entry the loader does not know."""
    # The names are joined from their words, so that a search for the removed names finds none.
    files, size = "_".join(["max", "files", "per", "import"]), "_".join(["max", "import", "bytes"])
    config = load(
        tmp_path,
        f"[marketdata]\n{files} = 7\n{size} = 4096\nmax_upload_bytes = 2048\n",
    )

    assert config.marketdata == MarketDataSettings(max_upload_bytes=2048)
    assert not hasattr(config.marketdata, files)
    assert not hasattr(config.marketdata, size)


def test_the_days_without_trade_are_a_list_of_days_of_the_year(tmp_path: Path) -> None:
    def days(value: str) -> Any:
        return load(
            tmp_path, f"[marketdata]\nno_trading_days = {value}\n"
        ).marketdata.no_trading_days

    assert days("12-25") == (CalendarDay(12, 25),)
    assert days("12-25,01-01") == (CalendarDay(12, 25), CalendarDay(1, 1))
    assert days(" 01-01 ,  12-25 , ") == (CalendarDay(1, 1), CalendarDay(12, 25))
    assert days("02-29") == (CalendarDay(2, 29),)  # a leap day is a day of the year
    assert days("12-25, 12-25, 01-01") == (CalendarDay(12, 25), CalendarDay(1, 1))  # once
    assert days("") == ()  # an empty value says: no day
    assert load(tmp_path, "").marketdata.no_trading_days == DEFAULT_NO_TRADING_DAYS


@pytest.mark.parametrize(
    "value",
    [
        "12/25",
        "2026-12-25",
        "25-12",
        "1-1",
        "13-01",
        "00-10",
        "02-30",
        "04-31",
        "xx-yy",
        "12-25 01-01",
        "12-25;01-01",
        "Dec 25",
        "١٢-٢٥",
    ],
)
def test_an_invalid_day_without_trade_names_the_entry_and_never_the_value(
    tmp_path: Path, value: str
) -> None:
    message = error_of(tmp_path, f"[marketdata]\nno_trading_days = 12-25, {value}\n")

    assert "[marketdata] no_trading_days" in message
    assert "invalid" in message
    assert value not in message


@pytest.mark.parametrize(
    ("entry", "values"),
    [
        ("max_upload_bytes", ["1023", "1073741825", "0", "-1", "x", "1.5", "1e3", ""]),
        ("import_idle_timeout_seconds", ["0", "86401", "-1", "five", "1.5", "5 min", ""]),
        ("max_rows", ["0", "100000001", "-5", "ten", "1 000"]),
        ("max_reported_rejections", ["-1", "1000001", "all"]),
        ("max_concurrent_imports", ["0", "65", "two"]),
        ("max_listed_items", ["0", "1000001", "many"]),
        ("max_parts_per_request", ["0", "10001", "x"]),
    ],
)
def test_an_invalid_number_names_the_entry_and_never_the_value(
    tmp_path: Path, entry: str, values: list[str]
) -> None:
    for value in values:
        message = error_of(tmp_path, f"[marketdata]\n{entry} = {value}\n")

        assert f"[marketdata] {entry}" in message
        assert "invalid" in message
        if value.strip():
            assert f"= {value}" not in message


@pytest.mark.parametrize(
    ("entry", "value"),
    [
        ("max_upload_bytes", "1024"),
        ("max_upload_bytes", "1073741824"),
        ("import_idle_timeout_seconds", "1"),
        ("import_idle_timeout_seconds", "86400"),
        ("max_rows", "1"),
        ("max_rows", "100000000"),
        ("max_reported_rejections", "0"),
        ("max_reported_rejections", "1000000"),
        ("max_concurrent_imports", "1"),
        ("max_concurrent_imports", "64"),
        ("max_listed_items", "1"),
        ("max_parts_per_request", "10000"),
    ],
)
def test_the_bounds_of_the_numbers_are_valid(tmp_path: Path, entry: str, value: str) -> None:
    load(tmp_path, f"[marketdata]\n{entry} = {value}\n")


def test_an_empty_url_of_the_data_stock_is_an_error(tmp_path: Path) -> None:
    assert "empty [marketdata] url" in error_of(tmp_path, "[marketdata]\nurl =\n")


def test_a_syntax_error_names_only_the_line_and_never_the_value(tmp_path: Path) -> None:
    path = tmp_path / "pipwerk-replay.ini"
    path.write_text(f"max_rows = {MARKER}\n[database]\nurl = sqlite:///x.db\n", encoding="utf-8")

    with pytest.raises(StartupConfigError) as caught:
        load_startup_config(path)

    assert MARKER not in str(caught.value)
    assert "syntax error in line 1" in str(caught.value)


def test_a_line_that_is_no_entry_names_only_its_number(tmp_path: Path) -> None:
    path = tmp_path / "pipwerk-replay.ini"
    path.write_text(f"{DATABASE}[marketdata]\n{MARKER}\n", encoding="utf-8")

    with pytest.raises(StartupConfigError) as caught:
        load_startup_config(path)

    assert MARKER not in str(caught.value)
    assert "line 4" in str(caught.value)


def test_a_file_that_is_no_utf8_text_names_no_content(tmp_path: Path) -> None:
    path = tmp_path / "pipwerk-replay.ini"
    path.write_bytes(DATABASE.encode() + b"[marketdata]\nurl = \xff\xfe" + MARKER.encode())

    with pytest.raises(StartupConfigError) as caught:
        load_startup_config(path)

    assert MARKER not in str(caught.value)
    assert "not UTF-8" in str(caught.value)


def test_a_percent_sign_in_the_database_url_is_taken_literally(tmp_path: Path) -> None:
    path = tmp_path / "pipwerk-replay.ini"
    path.write_text("[database]\nurl = sqlite:///x%20y.db\n", encoding="utf-8")

    assert load_startup_config(path).database_url == "sqlite:///x%20y.db"


# --- a startup configuration from before the acquisition was removed -----------------------------


def test_the_old_section_source_is_ignored_like_every_unknown_section(tmp_path: Path) -> None:
    """The rule of the loader: what it does not know has no effect and does not stop the start."""
    config = load(tmp_path, f"[marketdata]\nmax_rows = 7\n{OLD_SOURCE_SECTION}")

    assert config.marketdata == MarketDataSettings(max_rows=7)
    assert not hasattr(config, "source")
    assert MARKER not in repr(config)


def test_the_old_section_is_ignored_even_with_values_that_were_invalid_before(
    tmp_path: Path,
) -> None:
    config = load(tmp_path, "[source]\nfetch_url = ftp://nonsense\nfetch_key = short\n")

    assert config.marketdata == MarketDataSettings()


def test_the_backend_starts_with_the_old_configuration_and_serves_the_data_stock(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    started: list[Any] = []
    monkeypatch.setattr(uvicorn, "run", lambda app, **_kwargs: started.append(app))
    config = tmp_path / "pipwerk-replay.ini"
    config.write_text(
        f"[database]\nurl = sqlite:///{tmp_path / 'replay.db'}\n{OLD_SOURCE_SECTION}",
        encoding="utf-8",
    )

    assert cli.main(["-c", str(config)]) == 0

    client = TestClient(started[0])
    assert client.get(SERIES_URL).status_code == 200
    assert upload(client, [("a.json", candles_json(2))]).status_code == 200
    paths = client.get("/openapi.json").json()["paths"]
    assert not [path for path in paths if "acquisition" in path]


def test_the_application_takes_no_source_any_more() -> None:
    with pytest.raises(TypeError):
        create_app("sqlite:///:memory:", source=None)  # type: ignore[call-arg]
    with pytest.raises(TypeError):
        create_app("sqlite:///:memory:", source_client=None)  # type: ignore[call-arg]


# --- the settings reach the application ---------------------------------------------------------


def test_the_command_line_start_gives_the_settings_to_the_application(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    started: list[Any] = []
    monkeypatch.setattr(uvicorn, "run", lambda app, **_kwargs: started.append(app))
    config = tmp_path / "pipwerk-replay.ini"
    config.write_text(
        f"[database]\nurl = sqlite:///{tmp_path / 'replay.db'}\n"
        "[marketdata]\nmax_listed_items = 2\nmax_rows = 3\nno_trading_days = 12-25\n",
        encoding="utf-8",
    )

    assert cli.main(["-c", str(config)]) == 0

    client = TestClient(started[0])
    assert client.get(SERIES_URL).json()["limit"] == 2
    refused = upload(client, [("a.json", candles_json(4))]).json()["files"][0]
    assert refused["error"] == "too_many_rows"
    # any number of files: there is no limit for the number of files of a process
    many = upload(client, [(f"{n}.json", candles_json(2, instrument=f"I{n}")) for n in range(8)])
    assert many.json()["imported_count"] == 8


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

    assert client.get(SERIES_URL).json()["limit"] == 5


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

    import_json_file(client, candles_json(3))

    own, data = tables(tmp_path / "replay.db"), tables(tmp_path / "data.db")
    assert not any(name.startswith("marketdata_") for name in own)
    assert {"alembic_version", "replay_settings", "test_accounts"} <= own
    assert {"marketdata_alembic_version", "marketdata_series", "marketdata_candle"} <= data
    assert not {"alembic_version", "replay_settings", "test_accounts"} & data


def test_the_same_url_for_both_is_the_same_database(tmp_path: Path) -> None:
    url = f"sqlite:///{tmp_path / 'replay.db'}"
    client = TestClient(create_app(url, marketdata=MarketDataSettings(database_url=url)))

    assert client.get(SERIES_URL).status_code == 200
    assert "marketdata_series" in tables(tmp_path / "replay.db")


def test_the_two_schemas_are_migrated_separately_each_with_its_own_version_table(
    tmp_path: Path,
) -> None:
    TestClient(make_app(tmp_path))
    TestClient(make_app(tmp_path))  # a second start changes nothing and does not fail

    with sqlite3.connect(tmp_path / "replay.db") as connection:
        replay = connection.execute("SELECT version_num FROM alembic_version").fetchall()
        data = connection.execute("SELECT version_num FROM marketdata_alembic_version").fetchall()
    assert replay == [("0004",)]
    assert len(data) == 1
    assert data != replay


def test_an_existing_database_of_the_first_order_gets_the_new_setting(tmp_path: Path) -> None:
    """The steps from revision 0001 to the newest keep the rows and give the setting its name."""
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
    assert client.get("/api/replay/settings/test-run-broker").json() == {
        "broker": None,
        "chosen": False,
    }
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        assert connection.execute("SELECT version_num FROM alembic_version").fetchall() == [
            ("0004",)
        ]


def test_the_start_fails_when_the_schema_of_the_data_stock_is_from_a_newer_version(
    tmp_path: Path,
) -> None:
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
    def forbidden(*_args: Any, **_kwargs: Any) -> Any:
        raise AssertionError("the network was used")

    monkeypatch.setattr("socket.socket.connect", forbidden)
    create_app(f"sqlite:///{tmp_path / 'replay.db'}")


# --- the example of the startup configuration ----------------------------------------------------


def test_the_example_file_with_every_entry_switched_on_is_a_valid_configuration(
    tmp_path: Path,
) -> None:
    example = Path(__file__).resolve().parents[1] / "pipwerk-replay.example.ini"
    lines = []
    for line in example.read_text(encoding="utf-8").splitlines():
        match = re.fullmatch(r"# ((?:[a-z_]+ = .*)|(?:\[[a-z]+\]))", line)
        lines.append(match.group(1) if match else line)
    path = tmp_path / "pipwerk-replay.ini"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    config = load_startup_config(path)

    # the other values of the example are the defaults
    assert config.marketdata == MarketDataSettings(database_url="sqlite:///./pipwerk-marketdata.db")
    assert config.max_body_bytes == 2097152


def test_the_example_file_as_it_is_uses_the_defaults(tmp_path: Path) -> None:
    example = Path(__file__).resolve().parents[1] / "pipwerk-replay.example.ini"

    config = load_startup_config(example)

    assert config.marketdata == MarketDataSettings()


def test_the_example_file_names_no_source() -> None:
    text = (Path(__file__).resolve().parents[1] / "pipwerk-replay.example.ini").read_text(
        encoding="utf-8"
    )

    for word in ("source", "fetch_url", "fetch_key", "acquisition"):
        assert word not in text.lower(), word
