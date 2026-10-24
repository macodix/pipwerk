"""Giving the free space of the database back (specification 5.6): after deleting and replacing the
SQLite file becomes smaller; a file that is not yet in the mode ``INCREMENTAL`` is converted once."""

from datetime import timedelta
from pathlib import Path

import pytest
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.exc import OperationalError

from pipwerk_marketdata import (
    MarketDataStore,
    enable_space_return,
    migrate_database,
    return_space,
)
from pipwerk_marketdata import space as space_module
from tests.helpers import BROKER, INSTRUMENT, candle_document, candle_entry, to_bytes, utc

SERIES_ROWS = 20_000


def import_rows(store: MarketDataStore, count: int, *, price: float = 1.1) -> None:
    start = utc(2024, 1, 2, 10)
    entries = [candle_entry(start + timedelta(minutes=index), price) for index in range(count)]
    outcome = store.import_json(to_bytes(candle_document(entries)))
    assert outcome.accepted == count


def mode(engine: Engine) -> int:
    with engine.connect() as connection:
        return int(connection.execute(text("PRAGMA auto_vacuum")).scalar_one())


def free_pages(engine: Engine) -> int:
    with engine.connect() as connection:
        return int(connection.execute(text("PRAGMA freelist_count")).scalar_one())


def size(path: Path) -> int:
    return path.stat().st_size


@pytest.fixture
def path(tmp_path: Path) -> Path:
    return tmp_path / "space.db"


@pytest.fixture
def prepared(path: Path) -> Engine:
    engine = create_engine(f"sqlite:///{path}")
    migrate_database(engine)
    enable_space_return(engine)
    return engine


def test_a_file_gets_smaller_after_a_series_is_deleted(prepared: Engine, path: Path) -> None:
    store = MarketDataStore(prepared)
    import_rows(store, SERIES_ROWS)
    full = size(path)

    store.delete_series(BROKER, INSTRUMENT, "m1")

    assert size(path) < full / 4
    assert free_pages(prepared) == 0


def test_a_file_gets_smaller_after_a_period_is_deleted(prepared: Engine, path: Path) -> None:
    store = MarketDataStore(prepared)
    import_rows(store, SERIES_ROWS)
    full = size(path)

    store.delete_period(BROKER, INSTRUMENT, "m1", utc(2024, 1, 2, 10), utc(2024, 1, 10))

    assert size(path) < full


def test_a_file_gets_smaller_after_a_broker_is_deleted(prepared: Engine, path: Path) -> None:
    store = MarketDataStore(prepared)
    import_rows(store, SERIES_ROWS)
    full = size(path)

    store.delete_broker(BROKER)

    assert size(path) < full / 4


def test_a_plan_of_a_deletion_changes_nothing(prepared: Engine, path: Path) -> None:
    store = MarketDataStore(prepared)
    import_rows(store, 2_000)
    before = size(path)

    store.plan_delete_series(BROKER, INSTRUMENT, "m1")

    assert size(path) == before


def test_replacing_rows_leaves_no_free_pages(prepared: Engine) -> None:
    store = MarketDataStore(prepared)
    import_rows(store, 5_000)

    # The same moments with another price: every row is replaced.
    import_rows(store, 5_000, price=1.3)

    assert free_pages(prepared) == 0


def test_a_file_with_another_mode_is_converted_once_with_vacuum(path: Path) -> None:
    engine = create_engine(f"sqlite:///{path}")
    migrate_database(engine)
    assert mode(engine) == 0

    assert enable_space_return(engine) is True
    assert mode(engine) == space_module.AUTO_VACUUM_INCREMENTAL
    assert enable_space_return(engine) is False


def test_free_space_of_an_old_file_is_returned_after_the_conversion(path: Path) -> None:
    """A file from before: it has free pages that no deletion made after the conversion."""
    engine = create_engine(f"sqlite:///{path}")
    migrate_database(engine)
    store = MarketDataStore(engine)
    import_rows(store, SERIES_ROWS)
    store.delete_series(BROKER, INSTRUMENT, "m1")
    assert free_pages(engine) > 0
    before = size(path)

    enable_space_return(engine)

    assert size(path) < before / 4


def test_the_data_stay_readable_after_the_conversion(path: Path) -> None:
    engine = create_engine(f"sqlite:///{path}")
    migrate_database(engine)
    store = MarketDataStore(engine)
    import_rows(store, 1_000)

    enable_space_return(engine)

    assert store.list_series().total == 1


def test_a_database_in_memory_is_left_alone() -> None:
    engine = create_engine("sqlite://")
    migrate_database(engine)

    assert enable_space_return(engine) is False
    return_space(engine)


def test_a_failure_of_the_return_is_logged_and_the_deletion_stays_valid(
    prepared: Engine, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    store = MarketDataStore(prepared)
    import_rows(store, 1_000)

    def fail(_connection: object, _statement: str) -> int:
        raise OperationalError("PRAGMA", {}, Exception("busy"))

    monkeypatch.setattr(space_module, "_pragma", fail)
    deletion = store.delete_series(BROKER, INSTRUMENT, "m1")
    monkeypatch.undo()

    assert deletion.candle_count == 1_000
    assert store.list_series().total == 0
    assert "was not returned" in caplog.text
