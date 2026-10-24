"""Migrations of the connector tables: empty database, repetition, foreign tables, equality."""

from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext

from pipwerk_relaycore import DatabaseMigrationError, migrate_database
from pipwerk_relaycore.tables import VERSION_TABLE, metadata

OWN_TABLES = {"relaycore_seen", "relaycore_waiting", VERSION_TABLE}


def make_engine(directory: Path) -> sa.Engine:
    return sa.create_engine(sa.URL.create("sqlite", database=str(directory / "data.db")))


def test_an_empty_database_gets_the_tables(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    migrate_database(engine)
    assert set(sa.inspect(engine).get_table_names()) == OWN_TABLES
    with engine.connect() as connection:
        version = connection.execute(sa.text(f"SELECT version_num FROM {VERSION_TABLE}"))  # noqa: S608
        assert version.scalar() == "0001"


def test_a_repetition_changes_nothing(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    migrate_database(engine)
    with engine.begin() as connection:
        connection.execute(
            sa.text("INSERT INTO relaycore_seen (message_id, seen_at) VALUES ('x', '2026-01-01')")
        )
    migrate_database(engine)
    migrate_database(engine)
    with engine.connect() as connection:
        assert connection.execute(sa.text("SELECT count(*) FROM relaycore_seen")).scalar() == 1


def test_it_runs_next_to_foreign_tables_and_a_foreign_version_table(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    with engine.begin() as connection:
        connection.execute(sa.text("CREATE TABLE alembic_version (version_num VARCHAR(32))"))
        connection.execute(sa.text("INSERT INTO alembic_version VALUES ('other-revision')"))
        connection.execute(sa.text("CREATE TABLE orders (id INTEGER PRIMARY KEY, note TEXT)"))
        connection.execute(sa.text("INSERT INTO orders VALUES (1, 'kept')"))
    migrate_database(engine)
    with engine.connect() as connection:
        assert connection.execute(sa.text("SELECT version_num FROM alembic_version")).scalar() == (
            "other-revision"
        )
        assert connection.execute(sa.text("SELECT note FROM orders")).scalar() == "kept"
    assert set(sa.inspect(engine).get_table_names()) >= OWN_TABLES


def test_the_migration_produces_exactly_the_table_definitions(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    migrate_database(engine)
    with engine.connect() as connection:
        context = MigrationContext.configure(
            connection,
            opts={
                "compare_type": True,
                "include_object": lambda _o, name, kind, *_: (
                    kind != "table" or name != VERSION_TABLE
                ),
            },
        )
        assert compare_metadata(context, metadata) == []


def test_a_database_of_a_newer_version_is_refused_and_left_alone(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    migrate_database(engine)
    with engine.begin() as connection:
        connection.execute(sa.text(f"UPDATE {VERSION_TABLE} SET version_num = '9999'"))  # noqa: S608
    with pytest.raises(DatabaseMigrationError) as error:
        migrate_database(engine)
    assert str(tmp_path) not in str(error.value)
    with engine.connect() as connection:
        version = connection.execute(sa.text(f"SELECT version_num FROM {VERSION_TABLE}"))  # noqa: S608
        assert version.scalar() == "9999"


def test_a_failed_migration_is_rolled_back(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    with engine.begin() as connection:
        connection.execute(sa.text("CREATE TABLE relaycore_waiting (message_id TEXT)"))
    with pytest.raises(DatabaseMigrationError, match="rolled back"):
        migrate_database(engine)
    # The first table of the migration is not there: all or nothing.
    assert set(sa.inspect(engine).get_table_names()) == {"relaycore_waiting"}
