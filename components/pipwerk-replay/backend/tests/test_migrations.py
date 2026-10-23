"""Tests for the Alembic migrations of the pipwerk replay database.

Covered: a new database, a second start without any change, a current database, rejection
of a newer schema, a failed migration that leaves the database unchanged, equality of the
migrated schema with the ORM model, the migrations being part of the package and the start
through the command line.
"""

import sqlite3
from importlib import resources
from pathlib import Path
from typing import Any

import pytest
import uvicorn
from alembic import command
from alembic import op as alembic_op
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

from pipwerk_replay import cli
from pipwerk_replay.app import create_app
from pipwerk_replay.migrate import DatabaseMigrationError, _alembic_config, migrate_database
from pipwerk_replay.storage import Base, create_replay_engine

NEWEST_REVISION = "0003"


def database_url(tmp_path: Path) -> str:
    return f"sqlite:///{tmp_path / 'replay.db'}"


def sqlite_rows(tmp_path: Path, statement: str) -> list[tuple[object, ...]]:
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        return connection.execute(statement).fetchall()


def column_names(tmp_path: Path, table: str) -> list[str]:
    return [str(row[1]) for row in sqlite_rows(tmp_path, f"PRAGMA table_info({table})")]


def test_new_database_gets_the_newest_schema(tmp_path: Path) -> None:
    engine = create_replay_engine(database_url(tmp_path))
    engine.dispose()

    assert column_names(tmp_path, "replay_settings") == ["id", "language", "test_run_broker"]
    assert column_names(tmp_path, "test_accounts") == [
        "id",
        "name",
        "initial_capital",
        "currency",
        "leverage",
        "spread_mode",
        "spread_points",
        "commission_per_lot_side",
    ]
    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [(NEWEST_REVISION,)]
    assert sqlite_rows(tmp_path, "SELECT count(*) FROM replay_settings") == [(0,)]
    assert sqlite_rows(tmp_path, "SELECT count(*) FROM test_accounts") == [(0,)]


def test_second_start_changes_nothing(tmp_path: Path) -> None:
    first = TestClient(create_app(database_url(tmp_path)))
    first.put("/api/replay/settings/language", json={"language": "en"})
    before = sqlite_rows(tmp_path, "SELECT * FROM replay_settings")
    accounts_before = sqlite_rows(tmp_path, "SELECT * FROM test_accounts")

    second = TestClient(create_app(database_url(tmp_path)))

    assert sqlite_rows(tmp_path, "SELECT * FROM replay_settings") == before
    assert sqlite_rows(tmp_path, "SELECT * FROM test_accounts") == accounts_before
    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [(NEWEST_REVISION,)]
    assert second.get("/api/replay/settings/language").json() == {"language": "en"}


def test_migrating_a_current_database_again_is_possible(tmp_path: Path) -> None:
    engine = create_replay_engine(database_url(tmp_path))

    migrate_database(engine)
    migrate_database(engine)
    engine.dispose()

    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [(NEWEST_REVISION,)]


def test_database_of_a_newer_version_is_rejected(tmp_path: Path) -> None:
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
        connection.execute("INSERT INTO alembic_version VALUES ('9999')")

    with pytest.raises(DatabaseMigrationError) as caught:
        create_replay_engine(database_url(tmp_path))

    assert str(tmp_path) not in str(caught.value)
    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [("9999",)]
    assert sqlite_rows(tmp_path, "SELECT name FROM sqlite_master WHERE type = 'table'") == [
        ("alembic_version",)
    ]


def test_migrated_schema_equals_the_orm_model(tmp_path: Path) -> None:
    create_replay_engine(database_url(tmp_path)).dispose()
    engine = create_engine(database_url(tmp_path))

    with engine.connect() as connection:
        differences = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    engine.dispose()

    assert differences == []


def test_the_migrations_are_part_of_the_package() -> None:
    versions = resources.files("pipwerk_replay").joinpath("migrations", "versions")

    names = sorted(item.name for item in versions.iterdir() if item.name.endswith(".py"))

    assert "v0001_initial.py" in names
    assert "v0002_default_source.py" in names
    assert "v0003_test_run_broker.py" in names
    assert resources.files("pipwerk_replay").joinpath("migrations", "env.py").is_file()


def to_revision(tmp_path: Path, revision: str, *, down: bool = False) -> None:
    """Bring the database in the test directory to ``revision`` with Alembic, step by step."""
    engine = create_engine(database_url(tmp_path))
    with engine.begin() as connection:
        config = _alembic_config(connection)
        if down:
            command.downgrade(config, revision)
        else:
            command.upgrade(config, revision)
    engine.dispose()


def test_the_migration_takes_over_the_default_source_as_the_broker_for_test_runs(
    tmp_path: Path,
) -> None:
    to_revision(tmp_path, "0002")
    assert column_names(tmp_path, "replay_settings") == ["id", "language", "default_source"]
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute(
            "INSERT INTO replay_settings (id, language, default_source) VALUES (1, 'en', 'Live-1')"
        )

    engine = create_replay_engine(database_url(tmp_path))  # migrates to the newest schema
    engine.dispose()

    assert column_names(tmp_path, "replay_settings") == ["id", "language", "test_run_broker"]
    assert sqlite_rows(tmp_path, "SELECT id, language, test_run_broker FROM replay_settings") == [
        (1, "en", "Live-1")
    ]
    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [(NEWEST_REVISION,)]


def test_the_migration_keeps_a_setting_without_a_default_source_and_a_database_without_one(
    tmp_path: Path,
) -> None:
    to_revision(tmp_path, "0002")
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute("INSERT INTO replay_settings (id, language) VALUES (1, 'de')")

    create_replay_engine(database_url(tmp_path)).dispose()

    assert sqlite_rows(tmp_path, "SELECT id, language, test_run_broker FROM replay_settings") == [
        (1, "de", None)
    ]
    other = tmp_path / "other"
    other.mkdir()
    to_revision(other, "0002")
    create_replay_engine(database_url(other)).dispose()
    assert sqlite_rows(other, "SELECT count(*) FROM replay_settings") == [(0,)]


def test_the_migration_back_gives_the_value_to_the_old_column(tmp_path: Path) -> None:
    create_replay_engine(database_url(tmp_path)).dispose()
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute(
            "INSERT INTO replay_settings (id, language, test_run_broker) VALUES (1, 'de', 'B')"
        )

    to_revision(tmp_path, "0002", down=True)

    assert column_names(tmp_path, "replay_settings") == ["id", "language", "default_source"]
    assert sqlite_rows(tmp_path, "SELECT language, default_source FROM replay_settings") == [
        ("de", "B")
    ]


def test_the_old_name_of_the_setting_is_gone_from_the_schema(tmp_path: Path) -> None:
    create_replay_engine(database_url(tmp_path)).dispose()

    assert "default_source" not in column_names(tmp_path, "replay_settings")


def test_there_is_no_alembic_configuration_file_with_a_fixed_url() -> None:
    """The database URL comes from the startup configuration only."""
    backend = Path(__file__).resolve().parents[1]

    assert [path for path in backend.rglob("alembic.ini") if ".venv" not in path.parts] == []


def failing_migration(monkeypatch: pytest.MonkeyPatch) -> None:
    """Let revision 0001 fail after its changes were made."""
    real_create_table = alembic_op.create_table

    def create_table_then_fail(name: str, *args: Any, **kwargs: Any) -> Any:
        result = real_create_table(name, *args, **kwargs)
        if name == "test_accounts":
            raise RuntimeError("simulated failure with a secret detail")
        return result

    monkeypatch.setattr(alembic_op, "create_table", create_table_then_fail)


def test_a_failed_migration_leaves_no_table_and_the_next_start_works(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    with monkeypatch.context() as patched:
        failing_migration(patched)

        with pytest.raises(DatabaseMigrationError) as caught:
            create_replay_engine(database_url(tmp_path))

    message = str(caught.value)
    assert "migration" in message
    assert "connection" not in message
    assert "secret" not in message
    assert sqlite_rows(tmp_path, "SELECT name FROM sqlite_master WHERE type = 'table'") == []

    client = TestClient(create_app(database_url(tmp_path)))

    assert client.get("/api/replay/settings/language").json() == {"language": "de"}
    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [(NEWEST_REVISION,)]


def test_a_failed_migration_stops_the_start_with_the_migration_as_the_cause(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    started: list[object] = []
    monkeypatch.setattr(uvicorn, "run", lambda *args, **kwargs: started.append(args))
    config_path = tmp_path / "pipwerk-replay.ini"
    config_path.write_text(f"[database]\nurl = {database_url(tmp_path)}\n", encoding="utf-8")
    failing_migration(monkeypatch)

    exit_code = cli.main(["-c", str(config_path)])

    error_output = capsys.readouterr().err
    assert exit_code == 1
    assert "migration" in error_output
    assert "connection" not in error_output
    assert "secret" not in error_output
    assert started == []


def test_an_unreachable_database_is_still_reported_as_a_connection_problem(tmp_path: Path) -> None:
    with pytest.raises(OperationalError):
        create_replay_engine(f"sqlite:///{tmp_path / 'missing' / 'replay.db'}")
