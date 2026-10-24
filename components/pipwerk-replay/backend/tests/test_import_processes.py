"""Tests of the import processes (specification 5.3 and 5.5): begin, one request per file, end or
abort, the end by itself after the idle time, and that no deletion is done while one exists.

The idle time is measured with a clock that the tests set (``import_clock`` of ``create_app``), so
no test waits.
"""

from __future__ import annotations

import threading
from pathlib import Path
from typing import Any

import pytest
from datastock import (
    BROKER,
    PROCESSES_URL,
    SERIES_URL,
    begin,
    candles_json,
    end,
    import_json_file,
    make_app,
    upload_file,
)
from fastapi.testclient import TestClient

from pipwerk_replay.config import MarketDataSettings
from pipwerk_replay.import_processes import (
    ImportGoingOnError,
    ImportProcesses,
    ImportProcessNotFoundError,
)

DELETE_BROKER = "/api/v1/market-data/deletions/broker"
NOT_FOUND = {"detail": "The import process does not exist. It has ended or its time has run out."}
RUNNING = {
    "detail": "Data cannot be deleted while an import process exists. End it first.",
    "reason": "import_running",
}


class Clock:
    """A clock in seconds that only moves when a test says so."""

    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now

    def advance(self, seconds: float) -> None:
        self.now += seconds


# --- the processes without HTTP -----------------------------------------------------------------


def test_a_process_begins_and_ends_with_its_counts() -> None:
    processes = ImportProcesses(300, Clock())
    first = processes.begin()
    second = processes.begin()

    assert first.id != second.id
    assert processes.exists()
    processes.counted(first.id, imported=True)
    processes.counted(first.id, imported=True)
    processes.counted(first.id, imported=False)
    ended = processes.end(first.id)
    assert (ended.imported_count, ended.refused_count) == (2, 1)
    assert processes.exists()  # the second one still exists
    processes.end(second.id)
    assert not processes.exists()


def test_an_unknown_or_ended_process_is_not_found() -> None:
    processes = ImportProcesses(300, Clock())
    started = processes.begin()
    processes.end(started.id)

    for action in (
        lambda: processes.end(started.id),
        lambda: processes.end("never-begun"),
        lambda: processes.request(started.id).__enter__(),
    ):
        with pytest.raises(ImportProcessNotFoundError):
            action()
    processes.counted(started.id, imported=True)  # a count after the end is no error


def test_a_process_ends_by_itself_when_no_request_arrives_for_the_idle_time() -> None:
    clock = Clock()
    processes = ImportProcesses(300, clock)
    started = processes.begin()

    clock.advance(300)  # exactly the idle time: it still exists
    assert processes.exists()
    clock.advance(0.5)
    assert not processes.exists()
    with pytest.raises(ImportProcessNotFoundError):
        processes.end(started.id)


def test_every_request_starts_the_idle_time_again() -> None:
    clock = Clock()
    processes = ImportProcesses(300, clock)
    started = processes.begin()

    for _ in range(5):
        clock.advance(250)
        with processes.request(started.id):
            pass
    assert processes.exists()  # 1250 seconds after the beginning, 250 after the last request
    clock.advance(301)
    assert not processes.exists()


def test_a_process_with_a_file_being_imported_does_not_run_out() -> None:
    clock = Clock()
    processes = ImportProcesses(300, clock)
    started = processes.begin()

    with processes.request(started.id):
        clock.advance(10_000)  # the file takes long
        assert processes.exists()
    # the idle time starts when the request is done
    assert processes.exists()
    clock.advance(301)
    assert not processes.exists()


def test_a_file_that_is_taken_over_when_its_process_is_ended_still_counts_as_an_import() -> None:
    processes = ImportProcesses(300, Clock())
    started = processes.begin()

    with processes.request(started.id):
        processes.end(started.id)  # aborted while the file is being taken over
        assert processes.exists()
        with pytest.raises(ImportGoingOnError), processes.exclusive():
            pass
    assert not processes.exists()


def test_exclusive_holds_the_processes_still_and_refuses_while_one_exists() -> None:
    processes = ImportProcesses(300, Clock())
    with processes.exclusive():
        pass  # none exists: allowed
    started = processes.begin()
    with pytest.raises(ImportGoingOnError), processes.exclusive():
        pass
    processes.end(started.id)
    with processes.exclusive():
        pass


def test_nothing_can_begin_while_a_deletion_holds_the_processes_still() -> None:
    processes = ImportProcesses(300, Clock())
    inside = threading.Event()
    release = threading.Event()
    began: list[str] = []

    def hold() -> None:
        with processes.exclusive():
            inside.set()
            assert release.wait(30)

    holder = threading.Thread(target=hold)
    holder.start()
    assert inside.wait(30)
    beginner = threading.Thread(target=lambda: began.append(processes.begin().id))
    beginner.start()
    beginner.join(0.2)
    assert beginner.is_alive()  # waits for the deletion
    assert began == []
    release.set()
    holder.join(30)
    beginner.join(30)
    assert len(began) == 1


def test_the_idle_time_must_be_positive() -> None:
    with pytest.raises(ValueError, match="positive"):
        ImportProcesses(0, Clock())


# --- the web API -------------------------------------------------------------------------------


@pytest.fixture
def clock() -> Clock:
    return Clock()


@pytest.fixture
def client(tmp_path: Path, clock: Clock) -> TestClient:
    return TestClient(make_app(tmp_path, import_clock=clock))


def series(client: TestClient) -> list[Any]:
    items: list[Any] = client.get(SERIES_URL).json()["items"]
    return items


def test_a_process_is_begun_with_an_identifier_and_the_idle_time(client: TestClient) -> None:
    response = client.post(PROCESSES_URL, json={})

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "idle_timeout_seconds"}
    assert body["idle_timeout_seconds"] == 300
    assert client.post(PROCESSES_URL, json={}).json()["id"] != body["id"]


def test_the_idle_time_comes_from_the_startup_configuration(tmp_path: Path) -> None:
    client = TestClient(
        make_app(tmp_path, marketdata=MarketDataSettings(import_idle_timeout_seconds=42))
    )

    assert client.post(PROCESSES_URL, json={}).json()["idle_timeout_seconds"] == 42


def test_a_file_for_an_unknown_process_is_404_and_changes_nothing(client: TestClient) -> None:
    unknown = "00000000-0000-4000-8000-000000000000"

    response = upload_file(client, unknown, "a.json", candles_json(2))

    assert response.status_code == 404
    assert response.json() == NOT_FOUND
    assert series(client) == []
    for how in ("finish", "abort"):
        answer = end(client, unknown, how)
        assert (answer.status_code, answer.json()) == (404, NOT_FOUND)


def test_an_identifier_that_is_no_uuid_is_422(client: TestClient) -> None:
    response = client.post(f"{PROCESSES_URL}/not-an-id/finish", json={})

    assert response.status_code == 422
    assert response.json()["errors"] == [{"location": ["path", "id"], "type": "uuid_parsing"}]


def test_a_process_ends_by_itself_and_its_later_requests_are_404(
    client: TestClient, clock: Clock
) -> None:
    process = begin(client)
    assert upload_file(client, process, "a.json", candles_json(2)).status_code == 200

    clock.advance(301)

    for answer in (
        upload_file(client, process, "b.json", candles_json(2, instrument="BBB")),
        end(client, process),
        end(client, process, "abort"),
    ):
        assert (answer.status_code, answer.json()) == (404, NOT_FOUND)
    assert [item["instrument"] for item in series(client)] == ["EURUSD"]  # the first file stays


def test_a_request_of_a_file_keeps_the_process_alive(client: TestClient, clock: Clock) -> None:
    process = begin(client)

    for number in range(4):
        clock.advance(200)  # never 300 seconds without a request
        answer = upload_file(
            client, process, f"{number}.json", candles_json(2, instrument=f"I{number}")
        )
        assert answer.status_code == 200, number

    assert end(client, process).json()["imported_count"] == 4


def test_finish_and_abort_end_the_process_and_keep_the_files_taken_over(
    client: TestClient,
) -> None:
    finished = begin(client)
    aborted = begin(client)
    upload_file(client, finished, "a.json", candles_json(2, instrument="AAA"))
    upload_file(client, finished, "b.json", b"not json")
    upload_file(client, aborted, "c.json", candles_json(2, instrument="CCC"))

    first = end(client, finished)
    second = end(client, aborted, "abort")

    assert first.json() == {
        "id": finished,
        "state": "finished",
        "imported_count": 1,
        "refused_count": 1,
    }
    assert second.json() == {
        "id": aborted,
        "state": "aborted",
        "imported_count": 1,
        "refused_count": 0,
    }
    assert [item["instrument"] for item in series(client)] == ["AAA", "CCC"]
    # an ended process takes no further file and cannot be ended twice
    assert upload_file(client, aborted, "d.json", candles_json(2)).status_code == 404
    assert end(client, aborted).status_code == 404
    assert end(client, finished, "abort").status_code == 404


def test_two_processes_run_side_by_side(client: TestClient) -> None:
    one = begin(client)
    two = begin(client)

    upload_file(client, one, "a.json", candles_json(2, instrument="AAA"))
    upload_file(client, two, "b.json", candles_json(2, instrument="BBB"))
    assert end(client, one).json()["imported_count"] == 1
    assert end(client, two).json()["imported_count"] == 1


def test_a_file_that_is_refused_as_a_whole_does_not_end_the_process(client: TestClient) -> None:
    process = begin(client)

    refused = upload_file(client, process, "a.json", b"this is not json")
    taken = upload_file(client, process, "b.json", candles_json(2))

    assert refused.status_code == 200
    assert refused.json()["refused"] is True
    assert taken.json()["refused"] is False
    assert end(client, process).json()["state"] == "finished"


# --- no deletion while an import process exists -------------------------------------------------


def test_nothing_is_deleted_while_an_import_process_exists(client: TestClient) -> None:
    import_json_file(client, candles_json(2))
    process = begin(client)

    for confirm in (False, True):
        answer = client.post(DELETE_BROKER, json={"broker": BROKER, "confirm": confirm})
        assert answer.status_code == 409, confirm
        assert answer.json() == RUNNING
    assert [item["broker"] for item in series(client)] == [BROKER]  # the data stay
    assert end(client, process).status_code == 200
    answer = client.post(DELETE_BROKER, json={"broker": BROKER, "confirm": True})
    assert answer.status_code == 200
    assert answer.json()["deleted"] is True
    assert series(client) == []


def test_every_kind_of_deletion_is_refused_while_an_import_process_exists(
    client: TestClient,
) -> None:
    import_json_file(client, candles_json(2))
    begin(client)
    bodies = {
        "series": {"broker": BROKER, "instrument": "EURUSD", "data": "m1"},
        "period": {
            "broker": BROKER,
            "instrument": "EURUSD",
            "data": "m1",
            "start": "2024-01-02T10:00:00Z",
            "end": "2024-01-02T10:01:00Z",
        },
        "contract": {"broker": BROKER, "instrument": "EURUSD"},
        "broker": {"broker": BROKER},
    }

    for kind, body in bodies.items():
        answer = client.post(
            f"/api/v1/market-data/deletions/{kind}", json={**body, "confirm": True}
        )
        assert (answer.status_code, answer.json()) == (409, RUNNING), kind
    assert len(series(client)) == 1


def test_a_deletion_is_possible_again_when_the_process_has_run_out(
    client: TestClient, clock: Clock
) -> None:
    import_json_file(client, candles_json(2))
    begin(client)
    request = {"broker": BROKER, "confirm": True}
    assert client.post(DELETE_BROKER, json=request).status_code == 409

    clock.advance(301)

    assert client.post(DELETE_BROKER, json=request).status_code == 200


def test_a_deletion_waits_for_all_processes(client: TestClient) -> None:
    import_json_file(client, candles_json(2))
    one, two = begin(client), begin(client)
    request = {"broker": BROKER, "confirm": True}

    end(client, one)
    assert client.post(DELETE_BROKER, json=request).status_code == 409
    end(client, two, "abort")
    assert client.post(DELETE_BROKER, json=request).status_code == 200


def test_a_file_that_is_being_taken_over_blocks_a_deletion_even_after_the_abort(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from pipwerk_marketdata import MarketDataStore

    client = TestClient(make_app(tmp_path))
    import_json_file(client, candles_json(2))
    process = begin(client)
    entered = threading.Event()
    release = threading.Event()
    real = MarketDataStore.import_files

    def slow(self: MarketDataStore, *args: Any, **kwargs: Any) -> Any:
        entered.set()
        assert release.wait(30)
        return real(self, *args, **kwargs)

    monkeypatch.setattr(MarketDataStore, "import_files", slow)
    answers: list[Any] = []
    worker = threading.Thread(
        target=lambda: answers.append(
            upload_file(client, process, "b.json", candles_json(2, instrument="BBB"))
        )
    )
    worker.start()
    try:
        assert entered.wait(30)
        assert end(client, process, "abort").status_code == 200
        blocked = client.post(DELETE_BROKER, json={"broker": BROKER, "confirm": True})
    finally:
        release.set()
        worker.join(30)

    assert (blocked.status_code, blocked.json()) == (409, RUNNING)
    assert answers[0].status_code == 200  # the file is finished by its own request
    assert client.post(DELETE_BROKER, json={"broker": BROKER, "confirm": True}).status_code == 200
