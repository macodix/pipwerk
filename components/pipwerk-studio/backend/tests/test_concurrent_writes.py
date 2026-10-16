"""Tests for concurrent writes of the settings and concurrent starts.

Concurrent requests to one backend process run in several threads. Writing the
language and the object directory (without moving files) must not fail when they
happen at the same time, through the service on the engine of
``create_studio_engine`` and through HTTP. Two processes that start at the same
time on a new database must both succeed.
"""

import threading
from collections.abc import Callable
from pathlib import Path

from fastapi.testclient import TestClient

from pipwerk_studio.app import create_app
from pipwerk_studio.settings_service import Language, SettingsService
from pipwerk_studio.storage import create_session_factory, create_studio_engine

THREADS = 8
ROUNDS = 25


def run_concurrently(work: Callable[[int], None]) -> list[BaseException]:
    """Run ``work(index)`` in several threads at once; return the errors."""
    errors: list[BaseException] = []
    barrier = threading.Barrier(THREADS)

    def target(index: int) -> None:
        barrier.wait(timeout=30)
        try:
            work(index)
        except BaseException as error:
            errors.append(error)

    threads = [threading.Thread(target=target, args=(index,)) for index in range(THREADS)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=120)
    return errors


def test_concurrent_writes_of_the_language_through_the_service_do_not_fail(
    tmp_path: Path,
) -> None:
    engine = create_studio_engine(f"sqlite:///{tmp_path / 'studio.db'}")
    service = SettingsService(create_session_factory(engine))
    languages: tuple[Language, Language] = ("de", "en")

    def work(index: int) -> None:
        for round_number in range(ROUNDS):
            service.set_language(languages[(index + round_number) % 2])
            assert service.get_language() in languages

    assert run_concurrently(work) == []
    assert service.get_language() in languages


def test_concurrent_writes_of_the_language_over_http_do_not_fail(tmp_path: Path) -> None:
    client = TestClient(create_app(f"sqlite:///{tmp_path / 'studio.db'}"))

    def work(index: int) -> None:
        for round_number in range(ROUNDS):
            language = "en" if (index + round_number) % 2 else "de"
            response = client.put("/api/studio/settings/language", json={"language": language})
            assert response.status_code == 200
            assert client.get("/api/studio/settings/language").status_code == 200

    assert run_concurrently(work) == []


def test_concurrent_writes_of_the_object_directory_without_moving_do_not_fail(
    tmp_path: Path,
) -> None:
    client = TestClient(create_app(f"sqlite:///{tmp_path / 'studio.db'}"))
    directories = [str(tmp_path / f"objects-{index}") for index in range(THREADS)]

    def work(index: int) -> None:
        for round_number in range(ROUNDS):
            # Language and object directory are written by different threads
            # in turn, as two browser tabs would do.
            if round_number % 2:
                response = client.put(
                    "/api/studio/settings/object-directory",
                    json={"path": directories[index], "move": False},
                )
            else:
                response = client.put("/api/studio/settings/language", json={"language": "en"})
            assert response.status_code == 200

    assert run_concurrently(work) == []
    final = client.get("/api/studio/settings/object-directory").json()
    assert final["path"] in directories
    assert final["is_default"] is False


def test_two_starts_at_the_same_time_on_a_new_database_both_succeed(tmp_path: Path) -> None:
    url = f"sqlite:///{tmp_path / 'studio.db'}"
    engines: list[object] = []

    def work(_index: int) -> None:
        engines.append(create_studio_engine(url))

    assert run_concurrently(work) == []
    assert len(engines) == THREADS
    client = TestClient(create_app(url))
    assert client.get("/api/studio/settings/language").json() == {"language": "de"}


def test_the_engine_of_the_operation_keeps_the_default_transaction_behaviour(
    tmp_path: Path,
) -> None:
    """The engine does not begin transactions explicitly; only the migration does."""
    engine = create_studio_engine(f"sqlite:///{tmp_path / 'studio.db'}")

    with engine.connect() as connection:
        raw = connection.connection.driver_connection
        isolation_level = getattr(raw, "isolation_level", "missing")

    assert isolation_level == ""
