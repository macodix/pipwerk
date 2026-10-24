"""The database: migration (Alembic), check of the version, and the store."""

from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from pipwerk_relaycore import DatabaseMigrationError, alembic_config

from pipwerk_relay.database import (
    MIGRATIONS_DIRECTORY,
    create_engine,
    current_revision,
    ensure_current_schema,
    migrate,
    newest_revision,
)
from pipwerk_relay.errors import SchemaOutdated
from pipwerk_relay.store import NewEntry, RelayStore
from pipwerk_relay.tables import VERSION_TABLE, metadata
from tests.support import make_message

OWN_TABLES = {"relay_queue", "relay_seen", "relay_config", VERSION_TABLE}
NOW = datetime(2026, 10, 24, 12, 0, tzinfo=UTC)


def make_engine(directory: Path) -> sa.Engine:
    return create_engine(sa.URL.create("sqlite", database=str(directory / "data.db")))


def version_of(engine: sa.Engine) -> str | None:
    with engine.connect() as connection:
        query = sa.text(f"SELECT version_num FROM {VERSION_TABLE}")  # noqa: S608
        return connection.execute(query).scalar()


# Migration -------------------------------------------------------------------------------------


def test_an_empty_database_gets_the_tables(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    migrate(engine)
    assert set(sa.inspect(engine).get_table_names()) == OWN_TABLES
    assert version_of(engine) == "0001" == newest_revision()


def test_a_repetition_changes_nothing(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    migrate(engine)
    RelayStore(engine).put_config("{}", NOW)
    migrate(engine)
    migrate(engine)
    assert RelayStore(engine).config_version() == 1


def test_it_runs_next_to_foreign_tables_and_a_foreign_version_table(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    with engine.begin() as connection:
        connection.execute(sa.text("CREATE TABLE alembic_version (version_num VARCHAR(32))"))
        connection.execute(sa.text("INSERT INTO alembic_version VALUES ('other-revision')"))
        connection.execute(sa.text("CREATE TABLE orders (id INTEGER PRIMARY KEY, note TEXT)"))
        connection.execute(sa.text("INSERT INTO orders VALUES (1, 'kept')"))
    migrate(engine)
    with engine.connect() as connection:
        assert connection.execute(sa.text("SELECT version_num FROM alembic_version")).scalar() == (
            "other-revision"
        )
        assert connection.execute(sa.text("SELECT note FROM orders")).scalar() == "kept"
    assert set(sa.inspect(engine).get_table_names()) >= OWN_TABLES


def test_the_migration_produces_exactly_the_table_definitions(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    migrate(engine)
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


def test_the_migration_can_be_taken_back(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    migrate(engine)
    with engine.begin() as connection:
        command.downgrade(alembic_config(connection, MIGRATIONS_DIRECTORY), "base")
    assert set(sa.inspect(engine).get_table_names()) == {VERSION_TABLE}


def test_a_database_of_a_newer_version_is_refused_and_left_alone(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    migrate(engine)
    with engine.begin() as connection:
        connection.execute(sa.text(f"UPDATE {VERSION_TABLE} SET version_num = '9999'"))  # noqa: S608
    with pytest.raises(DatabaseMigrationError) as error:
        migrate(engine)
    assert str(tmp_path) not in str(error.value)
    assert version_of(engine) == "9999"
    with pytest.raises(SchemaOutdated):
        ensure_current_schema(engine)


def test_a_failed_migration_is_rolled_back(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    with engine.begin() as connection:
        connection.execute(sa.text("CREATE TABLE relay_config (id INTEGER)"))
    with pytest.raises(DatabaseMigrationError, match="rolled back"):
        migrate(engine)
    # the tables that come before the failing one are not there: all or nothing
    assert set(sa.inspect(engine).get_table_names()) == {"relay_config"}


# Check of the version -----------------------------------------------------------------------


def test_a_database_that_was_never_migrated_is_refused_with_a_hint(tmp_path: Path) -> None:
    engine = make_engine(tmp_path)
    assert current_revision(engine) is None
    with pytest.raises(SchemaOutdated, match="pipwerk-relay migrate"):
        ensure_current_schema(engine)
    migrate(engine)
    ensure_current_schema(engine)
    assert current_revision(engine) == newest_revision()


# The store -------------------------------------------------------------------------------------


@pytest.fixture
def store(tmp_path: Path) -> RelayStore:
    engine = make_engine(tmp_path)
    migrate(engine)
    return RelayStore(engine)


def entry(key: str | None = None, *, at: datetime = NOW, size: int = 0) -> NewEntry:
    message = make_message("a.n.r", "b.n.r", created_at=at)
    return NewEntry(
        entry_key=key or str(uuid4()),
        message=message,
        hops=("n.x",),
        attachment_count=1 if size else 0,
        attachment_bytes=size,
        created_at=at,
        next_attempt_at=at,
    )


def test_accept_marks_the_handover_and_stores_the_entries_together(store: RelayStore) -> None:
    first = entry()
    assert store.accept(first.message.id, 1, NOW, NOW - timedelta(days=7), [first])
    assert store.is_seen(first.message.id, 1, NOW - timedelta(days=7))
    assert not store.is_seen(first.message.id, 2, NOW - timedelta(days=7))  # another handover
    (stored,) = store.all_entries()
    assert stored.message_id == first.message.id
    assert stored.hops == ("n.x",)
    assert (stored.sender, stored.recipient, stored.kind) == ("a.n.r", "b.n.r", "probe.message")
    assert (stored.state, stored.attempts, stored.last_error) == ("new", 0, None)
    assert stored.created_at == NOW


def test_a_handover_that_was_seen_stores_nothing(store: RelayStore) -> None:
    first = entry()
    other = entry()
    assert store.accept(first.message.id, 1, NOW, NOW - timedelta(days=7), [first])
    assert not store.accept(first.message.id, 1, NOW, NOW - timedelta(days=7), [other])
    assert [e.entry_key for e in store.all_entries()] == [first.entry_key]  # all or nothing


def test_a_seen_mark_that_ran_out_is_replaced(store: RelayStore) -> None:
    first = entry()
    old = NOW - timedelta(days=10)
    store.accept(first.message.id, 1, old, old - timedelta(days=7), [])
    assert not store.is_seen(first.message.id, 1, NOW - timedelta(days=7))
    assert store.accept(first.message.id, 1, NOW, NOW - timedelta(days=7), [first])
    assert store.purge_seen(NOW - timedelta(days=1)) == 0


def test_purge_removes_the_old_marks(store: RelayStore) -> None:
    for days in (1, 5, 9):
        moment = NOW - timedelta(days=days)
        store.accept(uuid4(), 0, moment, moment - timedelta(days=30), [])
    assert store.purge_seen(NOW - timedelta(days=7)) == 1


def test_due_entries_come_oldest_first_and_only_when_due(store: RelayStore) -> None:
    later = entry(at=NOW + timedelta(hours=1))
    first = entry()
    second = entry()
    for item in (later, first, second):
        store.accept(item.message.id, 0, NOW, NOW - timedelta(days=7), [item])
    assert [e.entry_key for e in store.due(NOW, 10)] == [first.entry_key, second.entry_key]
    assert len(store.due(NOW, 1)) == 1
    assert len(store.due(NOW + timedelta(hours=2), 10)) == 3


def test_reschedule_counts_attempts_and_names_the_last_error(store: RelayStore) -> None:
    item = entry()
    store.accept(item.message.id, 0, NOW, NOW - timedelta(days=7), [item])
    (stored,) = store.all_entries()
    store.reschedule(stored.seq, 3, NOW + timedelta(minutes=5), "WayUnavailableError")
    (stored,) = store.all_entries()
    assert (stored.state, stored.attempts, stored.last_error) == (
        "retrying",
        3,
        "WayUnavailableError",
    )
    assert store.due(NOW, 10) == []


def test_replace_removes_the_entry_and_stores_the_notice_in_one_step(store: RelayStore) -> None:
    item = entry()
    notice = entry()
    store.accept(item.message.id, 0, NOW, NOW - timedelta(days=7), [item])
    (stored,) = store.all_entries()
    store.replace(stored.seq, notice)
    assert [e.entry_key for e in store.all_entries()] == [notice.entry_key]
    (second,) = store.all_entries()
    store.replace(second.seq, None)
    assert store.all_entries() == []


def test_the_totals_count_messages_and_bytes(store: RelayStore) -> None:
    assert (store.totals().messages, store.totals().attachment_bytes) == (0, 0)
    for size in (10, 0, 5):
        item = entry(size=size)
        store.accept(item.message.id, 0, NOW, NOW - timedelta(days=7), [item])
    assert (store.totals().messages, store.totals().attachment_bytes) == (3, 15)
    assert len(store.entry_keys()) == 3


def test_sequence_numbers_are_never_used_again(store: RelayStore) -> None:
    item = entry()
    store.accept(item.message.id, 0, NOW, NOW - timedelta(days=7), [item])
    (first,) = store.all_entries()
    store.replace(first.seq, None)
    other = entry()
    store.accept(other.message.id, 0, NOW, NOW - timedelta(days=7), [other])
    (second,) = store.all_entries()
    assert second.seq > first.seq  # the order of the queue is the order of arrival


def test_the_configuration_gets_a_new_version_each_time(store: RelayStore) -> None:
    assert store.config_version() is None
    assert store.get_config() is None
    assert store.put_config('{"a": 1}', NOW) == 1
    assert store.put_config('{"a": 2}', NOW + timedelta(seconds=1)) == 2
    stored = store.get_config()
    assert stored is not None
    assert (stored.version, stored.document, stored.loaded_at) == (
        2,
        '{"a": 2}',
        NOW + timedelta(seconds=1),
    )
