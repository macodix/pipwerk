"""Tests for databases in memory and for the setting of the migration connection.

A SQLite database in memory (as URI with ``mode=memory`` and ``cache=shared``,
or ``sqlite://`` without a file) keeps its schema after the migration and
serves the endpoints of the settings. The migration changes the transaction
control of the driver only for its own connection; afterwards a connection of
the pool has the default setting again.
"""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine

from pipwerk_studio.app import create_app
from pipwerk_studio.migrate import migrate_database
from pipwerk_studio.storage import create_studio_engine

MEMORY_URLS = [
    "sqlite:///file:pipwerk-test-memory?mode=memory&cache=shared&uri=true",
    "sqlite://",
    "sqlite:///:memory:",
]


@pytest.mark.parametrize("url", MEMORY_URLS)
def test_a_database_in_memory_keeps_its_schema_and_serves_the_settings(url: str) -> None:
    client = TestClient(create_app(url))

    assert client.get("/api/studio/settings/language").status_code == 200
    assert client.get("/api/studio/settings/language").json() == {"language": "de"}
    written = client.put("/api/studio/settings/language", json={"language": "en"})
    assert written.status_code == 200
    assert client.get("/api/studio/settings/language").json() == {"language": "en"}
    assert client.get("/api/studio/settings/object-directory").status_code == 200
    saved = client.put(
        "/api/studio/settings/object-directory", json={"path": "/absolute/path", "move": False}
    )
    assert saved.status_code == 200


@pytest.mark.parametrize("url", MEMORY_URLS)
def test_a_second_start_on_a_database_in_memory_changes_nothing(url: str) -> None:
    engine = create_studio_engine(url)

    migrate_database(engine)
    migrate_database(engine)

    with engine.connect() as connection:
        tables = connection.exec_driver_sql(
            "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
        ).fetchall()
    assert tables == [("alembic_version",), ("studio_settings",)]


@pytest.mark.parametrize("kind", ["file", *MEMORY_URLS])
def test_after_the_migration_the_connection_has_the_default_of_the_driver(
    kind: str, tmp_path: Path
) -> None:
    url = f"sqlite:///{tmp_path / 'studio.db'}" if kind == "file" else kind
    engine = create_studio_engine(url)

    with engine.connect() as connection:
        isolation_level = getattr(connection.connection.driver_connection, "isolation_level", None)
        in_transaction = getattr(connection.connection.driver_connection, "in_transaction", None)

    assert isolation_level == ""
    assert in_transaction is False


def test_the_migration_leaves_the_setting_of_an_engine_that_is_not_changed_by_it(
    tmp_path: Path,
) -> None:
    """The migration works on one connection of the given engine and on no other."""
    engine = create_engine(f"sqlite:///{tmp_path / 'studio.db'}")

    migrate_database(engine)

    with engine.connect() as connection:
        assert getattr(connection.connection.driver_connection, "isolation_level", None) == ""
    assert engine.pool.__class__.__name__ != "StaticPool"
