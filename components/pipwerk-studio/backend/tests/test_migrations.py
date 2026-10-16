"""Tests for the Alembic migrations of the pipwerk Studio database.

Covered: a new database, a database of the schema before Alembic (without a
version table; the stored language is kept), a second start without any change,
a current database, rejection of an unknown or newer schema, equality of the
migrated schema with the ORM model, the migrations being part of the package
and the start through the command line.
"""

import sqlite3
from importlib import resources
from pathlib import Path

import pytest
import uvicorn
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from fastapi.testclient import TestClient
from sqlalchemy import create_engine

from pipwerk_studio import cli
from pipwerk_studio.app import create_app
from pipwerk_studio.migrate import DatabaseMigrationError, migrate_database
from pipwerk_studio.storage import Base, create_studio_engine

NEWEST_REVISION = "0002"

#: The statement the schema before Alembic was created with (table
#: ``studio_settings`` with the columns ``id`` and ``language``).
LEGACY_SCHEMA = (
    "CREATE TABLE studio_settings ("
    "id INTEGER NOT NULL, language VARCHAR(8) NOT NULL, PRIMARY KEY (id))"
)


def database_url(tmp_path: Path) -> str:
    return f"sqlite:///{tmp_path / 'studio.db'}"


def sqlite_rows(tmp_path: Path, statement: str) -> list[tuple[object, ...]]:
    with sqlite3.connect(tmp_path / "studio.db") as connection:
        return connection.execute(statement).fetchall()


def create_legacy_database(tmp_path: Path, language: str | None) -> None:
    with sqlite3.connect(tmp_path / "studio.db") as connection:
        connection.execute(LEGACY_SCHEMA)
        if language is not None:
            connection.execute(
                "INSERT INTO studio_settings (id, language) VALUES (1, ?)", (language,)
            )


def column_names(tmp_path: Path) -> list[str]:
    return [str(row[1]) for row in sqlite_rows(tmp_path, "PRAGMA table_info(studio_settings)")]


def test_new_database_gets_the_newest_schema(tmp_path: Path) -> None:
    engine = create_studio_engine(database_url(tmp_path))
    engine.dispose()

    assert column_names(tmp_path) == ["id", "language", "object_directory"]
    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [(NEWEST_REVISION,)]
    assert sqlite_rows(tmp_path, "SELECT count(*) FROM studio_settings") == [(0,)]


def test_database_of_the_schema_before_alembic_is_updated_and_keeps_the_language(
    tmp_path: Path,
) -> None:
    create_legacy_database(tmp_path, "en")
    assert (
        sqlite_rows(tmp_path, "SELECT name FROM sqlite_master WHERE name = 'alembic_version'") == []
    )

    client = TestClient(create_app(database_url(tmp_path)))

    assert client.get("/api/studio/settings/language").json() == {"language": "en"}
    assert column_names(tmp_path) == ["id", "language", "object_directory"]
    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [(NEWEST_REVISION,)]
    assert sqlite_rows(tmp_path, "SELECT id, language, object_directory FROM studio_settings") == [
        (1, "en", None)
    ]
    # The updated database works for both settings.
    assert client.put("/api/studio/settings/language", json={"language": "de"}).status_code == 200
    assert client.get("/api/studio/settings/language").json() == {"language": "de"}


def test_legacy_database_without_a_stored_row_is_updated(tmp_path: Path) -> None:
    create_legacy_database(tmp_path, None)

    client = TestClient(create_app(database_url(tmp_path)))

    assert client.get("/api/studio/settings/language").json() == {"language": "de"}
    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [(NEWEST_REVISION,)]


def test_second_start_changes_nothing(tmp_path: Path) -> None:
    first = TestClient(create_app(database_url(tmp_path)))
    first.put("/api/studio/settings/language", json={"language": "en"})
    directory = str(tmp_path / "objects")
    first.put("/api/studio/settings/object-directory", json={"path": directory, "move": False})
    before = sqlite_rows(tmp_path, "SELECT * FROM studio_settings")

    second = TestClient(create_app(database_url(tmp_path)))

    assert sqlite_rows(tmp_path, "SELECT * FROM studio_settings") == before
    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [(NEWEST_REVISION,)]
    assert second.get("/api/studio/settings/language").json() == {"language": "en"}
    assert second.get("/api/studio/settings/object-directory").json() == {
        "path": directory,
        "is_default": False,
    }


def test_migrating_a_current_database_again_is_possible(tmp_path: Path) -> None:
    engine = create_studio_engine(database_url(tmp_path))

    migrate_database(engine)
    migrate_database(engine)
    engine.dispose()

    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [(NEWEST_REVISION,)]


def test_unknown_schema_without_version_table_is_rejected_and_left_unchanged(
    tmp_path: Path,
) -> None:
    with sqlite3.connect(tmp_path / "studio.db") as connection:
        connection.execute(
            "CREATE TABLE studio_settings (id INTEGER NOT NULL, language VARCHAR(8) NOT NULL, "
            "other TEXT, PRIMARY KEY (id))"
        )

    with pytest.raises(DatabaseMigrationError) as caught:
        create_studio_engine(database_url(tmp_path))

    assert str(tmp_path) not in str(caught.value)
    assert (
        sqlite_rows(tmp_path, "SELECT name FROM sqlite_master WHERE name = 'alembic_version'") == []
    )
    assert column_names(tmp_path) == ["id", "language", "other"]


def test_database_of_a_newer_version_is_rejected(tmp_path: Path) -> None:
    with sqlite3.connect(tmp_path / "studio.db") as connection:
        connection.execute("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
        connection.execute("INSERT INTO alembic_version VALUES ('9999')")

    with pytest.raises(DatabaseMigrationError) as caught:
        create_studio_engine(database_url(tmp_path))

    assert str(tmp_path) not in str(caught.value)
    assert sqlite_rows(tmp_path, "SELECT version_num FROM alembic_version") == [("9999",)]


def test_migrated_schema_equals_the_orm_model(tmp_path: Path) -> None:
    create_studio_engine(database_url(tmp_path)).dispose()
    engine = create_engine(database_url(tmp_path))

    with engine.connect() as connection:
        differences = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    engine.dispose()

    assert differences == []


def test_the_migrations_are_part_of_the_package() -> None:
    versions = resources.files("pipwerk_studio").joinpath("migrations", "versions")

    names = sorted(item.name for item in versions.iterdir() if item.name.endswith(".py"))

    assert "v0001_initial.py" in names
    assert "v0002_object_directory.py" in names
    assert resources.files("pipwerk_studio").joinpath("migrations", "env.py").is_file()


def test_there_is_no_alembic_configuration_file_with_a_fixed_url() -> None:
    """The database URL comes from the startup configuration only."""
    backend = Path(__file__).resolve().parents[1]

    assert [path for path in backend.rglob("alembic.ini") if ".venv" not in path.parts] == []


def test_start_with_an_unusable_schema_fails_with_a_message(
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    started: list[object] = []
    monkeypatch.setattr(uvicorn, "run", lambda *args, **kwargs: started.append(args))
    with sqlite3.connect(tmp_path / "studio.db") as connection:
        connection.execute("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
        connection.execute("INSERT INTO alembic_version VALUES ('9999')")
    config_path = tmp_path / "pipwerk-studio.ini"
    config_path.write_text(f"[database]\nurl = {database_url(tmp_path)}\n", encoding="utf-8")

    exit_code = cli.main(["-c", str(config_path)])

    assert exit_code == 1
    assert "cannot be updated" in capsys.readouterr().err
    assert started == []
