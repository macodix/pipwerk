"""Migrations: empty database, repetition, foreign tables, equality with the table definitions."""

from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext

from pipwerk_marketdata import DatabaseMigrationError, migrate_database
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
        assert connection.execute(query).scalar() == "0001"


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


def test_failed_migration_leaves_the_database_as_it_was(tmp_path: Path) -> None:
    engine = make_engine(tmp_path, migrate=False)
    with engine.begin() as connection:
        # a table of the caller with a name the migration needs: the migration fails in the middle
        connection.execute(sa.text("CREATE TABLE marketdata_tick (x INTEGER)"))
    with pytest.raises(DatabaseMigrationError):
        migrate_database(engine)
    assert set(sa.inspect(engine).get_table_names()) == {"marketdata_tick"}
