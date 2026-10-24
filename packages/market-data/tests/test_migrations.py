"""Migrations: empty database, repetition, foreign tables, equality with the table definitions."""

from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext

from pipwerk_marketdata import DatabaseMigrationError, migrate_database
from pipwerk_marketdata.migrate import _alembic_config
from pipwerk_marketdata.tables import VERSION_TABLE, metadata
from tests.helpers import make_engine

OWN_TABLES = {
    "marketdata_series",
    "marketdata_candle",
    "marketdata_tick",
    "marketdata_coverage",
    "marketdata_session",
    "marketdata_instrument",
    VERSION_TABLE,
}


def test_empty_database_gets_all_tables(tmp_path: Path) -> None:
    engine = make_engine(tmp_path, migrate=False)
    migrate_database(engine)
    assert set(sa.inspect(engine).get_table_names()) == OWN_TABLES
    with engine.connect() as connection:
        query = sa.text("SELECT version_num FROM marketdata_alembic_version")
        assert connection.execute(query).scalar() == "0002"


def test_repetition_changes_nothing(tmp_path: Path) -> None:
    engine = make_engine(tmp_path, migrate=False)
    migrate_database(engine)
    with engine.begin() as connection:
        connection.execute(
            sa.text(
                "INSERT INTO marketdata_series (broker, instrument, unit) VALUES ('b', 'i', 'm1')"
            )
        )
    migrate_database(engine)
    migrate_database(engine)
    with engine.connect() as connection:
        assert connection.execute(sa.text("SELECT count(*) FROM marketdata_series")).scalar() == 1


def test_runs_next_to_foreign_tables_and_foreign_version_table(tmp_path: Path) -> None:
    engine = make_engine(tmp_path, migrate=False)
    with engine.begin() as connection:
        connection.execute(
            sa.text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
        )
        connection.execute(sa.text("INSERT INTO alembic_version VALUES ('other-revision')"))
        connection.execute(
            sa.text("CREATE TABLE customer_orders (id INTEGER PRIMARY KEY, note TEXT)")
        )
        connection.execute(sa.text("INSERT INTO customer_orders VALUES (1, 'kept')"))
    migrate_database(engine)
    tables = set(sa.inspect(engine).get_table_names())
    assert tables >= OWN_TABLES
    assert {"alembic_version", "customer_orders"} <= tables
    with engine.connect() as connection:
        assert (
            connection.execute(sa.text("SELECT version_num FROM alembic_version")).scalar()
            == "other-revision"
        )
        assert connection.execute(sa.text("SELECT note FROM customer_orders")).scalar() == "kept"


def test_migrated_schema_equals_the_table_definitions(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    with engine.connect() as connection:
        context = MigrationContext.configure(
            connection,
            opts={
                "compare_type": True,
                "include_object": lambda _obj, name, type_, _reflected, _compare: (
                    not (type_ == "table" and (name not in OWN_TABLES or name == VERSION_TABLE))
                ),
            },
        )
        assert compare_metadata(context, metadata) == []


def _database_at_revision_0001(tmp_path: Path) -> sa.Engine:
    """A database as earlier versions left it: schema 0001, the covered periods are the periods
    from the first to the last entry."""
    engine = make_engine(tmp_path, migrate=False)
    with engine.connect() as connection:
        command.upgrade(_alembic_config(connection), "0001")
        connection.commit()
    return engine


def _insert_coverage(engine: sa.Engine, rows: list[tuple[int, str, str]]) -> None:
    with engine.begin() as connection:
        for series_id in {row[0] for row in rows}:
            connection.execute(
                sa.text(
                    "INSERT INTO marketdata_series (id, broker, instrument, unit) "
                    "VALUES (:id, 'b', :instrument, 'm1')"
                ),
                {"id": series_id, "instrument": f"i{series_id}"},
            )
        for series_id, start, end in rows:
            connection.execute(
                sa.text(
                    "INSERT INTO marketdata_coverage (series_id, period_start, period_end) "
                    "VALUES (:series_id, :start, :end)"
                ),
                {"series_id": series_id, "start": start, "end": end},
            )


def _coverage(engine: sa.Engine) -> list[tuple[int, str, str]]:
    with engine.connect() as connection:
        rows = connection.execute(
            sa.text(
                "SELECT series_id, period_start, period_end FROM marketdata_coverage "
                "ORDER BY series_id, period_start"
            )
        ).all()
    return [(row[0], str(row[1])[:19], str(row[2])[:19]) for row in rows]


def test_migration_0002_widens_the_covered_periods_to_whole_days_in_utc(tmp_path: Path) -> None:
    engine = _database_at_revision_0001(tmp_path)
    _insert_coverage(
        engine,
        [
            # first to last entry, as earlier versions stored it
            (1, "2024-01-02 10:00:00", "2024-01-02 20:59:00"),
            # already whole days: unchanged
            (2, "2024-01-02 00:00:00", "2024-01-05 00:00:00"),
            # two periods of one series on different days stay two periods
            (3, "2024-01-02 10:00:00", "2024-01-02 12:00:00"),
            (3, "2024-01-04 10:00:00", "2024-01-04 12:00:00"),
        ],
    )

    migrate_database(engine)

    assert _coverage(engine) == [
        (1, "2024-01-02 00:00:00", "2024-01-03 00:00:00"),
        (2, "2024-01-02 00:00:00", "2024-01-05 00:00:00"),
        (3, "2024-01-02 00:00:00", "2024-01-03 00:00:00"),
        (3, "2024-01-04 00:00:00", "2024-01-05 00:00:00"),
    ]
    with engine.connect() as connection:
        version = connection.execute(sa.text("SELECT version_num FROM marketdata_alembic_version"))
        assert version.scalar() == "0002"


def test_migration_0002_joins_periods_that_touch_after_the_widening(tmp_path: Path) -> None:
    engine = _database_at_revision_0001(tmp_path)
    _insert_coverage(
        engine,
        [
            (1, "2024-01-02 10:00:00", "2024-01-02 12:00:00"),
            (1, "2024-01-02 18:00:00", "2024-01-02 23:59:00"),
            (1, "2024-01-03 08:00:00", "2024-01-03 09:00:00"),
            (2, "2024-01-02 10:00:00", "2024-01-02 12:00:00"),
        ],
    )

    migrate_database(engine)

    assert _coverage(engine) == [
        (1, "2024-01-02 00:00:00", "2024-01-04 00:00:00"),
        (2, "2024-01-02 00:00:00", "2024-01-03 00:00:00"),
    ]


def test_migration_0002_keeps_the_end_at_the_last_supported_moment(tmp_path: Path) -> None:
    engine = _database_at_revision_0001(tmp_path)
    _insert_coverage(engine, [(1, "2099-12-31 10:00:00", "2100-01-01 00:00:00")])
    migrate_database(engine)
    assert _coverage(engine) == [(1, "2099-12-31 00:00:00", "2100-01-01 00:00:00")]


def test_migration_0002_on_a_database_without_periods_changes_nothing(tmp_path: Path) -> None:
    engine = _database_at_revision_0001(tmp_path)
    migrate_database(engine)
    assert _coverage(engine) == []


def test_failed_migration_leaves_the_database_as_it_was(tmp_path: Path) -> None:
    engine = make_engine(tmp_path, migrate=False)
    with engine.begin() as connection:
        # a table of the caller with a name the migration needs: the migration fails in the middle
        connection.execute(sa.text("CREATE TABLE marketdata_tick (x INTEGER)"))
    with pytest.raises(DatabaseMigrationError):
        migrate_database(engine)
    assert set(sa.inspect(engine).get_table_names()) == {"marketdata_tick"}
