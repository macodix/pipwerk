"""Tests of the internal endpoints below ``/api/replay/``: the broker for test runs and what all of
them have in common (limits, media type, host check, no place in the public description).

The language has its own tests (``test_settings.py``), the revision too (``test_revision.py``).
The broker for test runs is the setting of specification 5.1: the chosen broker as far as it
occurs in the data stock, else the first broker of the data stock in alphabetical order.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

import pytest
from datastock import (
    BROKER,
    EXAMPLE_BROKER,
    JSON,
    TEST_RUN_BROKER_URL,
    candles_json,
    example,
    import_json_file,
    make_app,
)
from fastapi.testclient import TestClient

from pipwerk_replay import contract
from pipwerk_replay.settings_service import (
    InvalidBrokerNameError,
    SettingsService,
    StoredTestRunBrokerInvalidError,
)
from pipwerk_replay.storage import create_replay_engine, create_session_factory

URL = TEST_RUN_BROKER_URL
LANGUAGE = "/api/replay/settings/language"
INTERNAL_PATHS = [URL, LANGUAGE, "/api/replay/revision"]


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    return TestClient(make_app(tmp_path))


def fill(client: TestClient, *brokers: str) -> None:
    """Brokers into the data stock, each with a series."""
    for broker in brokers:
        import_json_file(client, candles_json(2), broker=broker)


def test_an_empty_data_stock_has_no_broker_for_test_runs(client: TestClient) -> None:
    response = client.get(URL)

    assert response.status_code == 200
    assert response.json() == {"broker": None, "chosen": False}


def test_without_a_choice_the_first_broker_in_alphabetical_order_applies(
    client: TestClient,
) -> None:
    fill(client, "Zeta", "beta", "Alpha")

    assert client.get(URL).json() == {"broker": "Alpha", "chosen": False}


def test_the_broker_for_test_runs_is_chosen_read_and_removed(client: TestClient) -> None:
    fill(client, "Alpha", "beta")

    written = client.put(URL, json={"broker": "beta"})
    assert written.status_code == 200
    assert written.json() == {"broker": "beta", "chosen": True}
    assert client.get(URL).json() == {"broker": "beta", "chosen": True}

    other = client.put(URL, json={"broker": "Alpha"})
    assert other.json() == {"broker": "Alpha", "chosen": True}

    removed = client.put(URL, json={"broker": None})
    assert removed.status_code == 200
    assert removed.json() == {"broker": "Alpha", "chosen": False}
    assert client.get(URL).json() == {"broker": "Alpha", "chosen": False}


def test_only_a_broker_that_occurs_in_the_data_stock_can_be_chosen(client: TestClient) -> None:
    fill(client, "Alpha")
    client.put(URL, json={"broker": "Alpha"})

    response = client.put(URL, json={"broker": "NoDataYet"})

    assert response.status_code == 422
    assert response.json() == {
        "detail": "The broker has no data in the data stock.",
        "errors": [{"location": ["broker"], "type": "broker_not_in_data_stock"}],
    }
    assert client.get(URL).json() == {"broker": "Alpha", "chosen": True}  # unchanged


def test_a_broker_with_instrument_data_only_occurs_in_the_data_stock(client: TestClient) -> None:
    import_json_file(client, example("instrument.json"), broker=EXAMPLE_BROKER)

    assert client.put(URL, json={"broker": EXAMPLE_BROKER}).status_code == 200


def test_a_chosen_broker_that_no_longer_occurs_falls_back_to_the_first_one(
    tmp_path: Path, client: TestClient
) -> None:
    fill(client, "Alpha", "Zeta")
    client.put(URL, json={"broker": "Zeta"})
    with sqlite3.connect(tmp_path / "replay.db") as connection:  # the data of Zeta are gone
        for table in ("marketdata_candle", "marketdata_coverage"):
            connection.execute(
                f"DELETE FROM {table} WHERE series_id IN "  # noqa: S608 - fixed table names
                "(SELECT id FROM marketdata_series WHERE broker = 'Zeta')"
            )
        connection.execute("DELETE FROM marketdata_series WHERE broker = 'Zeta'")

    # "Zeta" is still stored, but it does not occur any more
    assert client.get(URL).json() == {"broker": "Alpha", "chosen": False}
    engine = create_replay_engine(f"sqlite:///{tmp_path / 'replay.db'}")
    assert SettingsService(create_session_factory(engine)).get_test_run_broker() == "Zeta"
    # it applies again as soon as its data come back
    fill(client, "Zeta")
    assert client.get(URL).json() == {"broker": "Zeta", "chosen": True}


def test_the_broker_for_test_runs_and_the_language_do_not_disturb_each_other(
    client: TestClient,
) -> None:
    fill(client, BROKER)
    client.put(LANGUAGE, json={"language": "en"})
    client.put(URL, json={"broker": BROKER})
    client.put(LANGUAGE, json={"language": "de"})

    assert client.get(URL).json() == {"broker": BROKER, "chosen": True}
    assert client.get(LANGUAGE).json() == {"language": "de"}
    client.put(URL, json={"broker": None})
    assert client.get(LANGUAGE).json() == {"language": "de"}


def test_the_choice_survives_a_new_application_on_the_same_database(tmp_path: Path) -> None:
    first = TestClient(make_app(tmp_path))
    fill(first, "Alpha", "Beta")
    first.put(URL, json={"broker": "Beta"})

    assert TestClient(make_app(tmp_path)).get(URL).json() == {"broker": "Beta", "chosen": True}


def test_at_most_one_row_is_kept(tmp_path: Path, client: TestClient) -> None:
    fill(client, "A", "B")
    for broker in ("A", None, "B"):
        client.put(URL, json={"broker": broker})
    client.put(LANGUAGE, json={"language": "en"})

    with sqlite3.connect(tmp_path / "replay.db") as connection:
        rows = connection.execute("SELECT id, language, test_run_broker FROM replay_settings")
        assert rows.fetchall() == [(1, "en", "B")]


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"broker": ""},
        {"broker": " "},
        {"broker": " leading"},
        {"broker": "trailing "},
        {"broker": "tab\tinside"},
        {"broker": "new\nline"},
        {"broker": "x" * 129},
        {"broker": 7},
        {"broker": ["B"]},
        {"broker": True},
        {"broker": "B", "other": 1},
        {"source": "B"},
    ],
)
def test_an_invalid_body_is_422_and_changes_nothing(client: TestClient, body: Any) -> None:
    fill(client, BROKER)
    client.put(URL, json={"broker": BROKER})

    response = client.put(URL, json=body)

    assert response.status_code == 422, body
    assert response.json()["detail"] == "The request body does not fit the schema."
    assert client.get(URL).json() == {"broker": BROKER, "chosen": True}


def test_the_longest_name_and_a_name_with_inner_blanks_are_valid(client: TestClient) -> None:
    longest = "x" * 128
    inner = "Broker, Inc. (Live) - Server 1"
    fill(client, longest, inner)

    assert client.put(URL, json={"broker": longest}).status_code == 200
    assert client.put(URL, json={"broker": inner}).status_code == 200


@pytest.mark.parametrize(
    "content",
    [b"", b"not json", b"[]", b'"B"', b"null", b'{"broker": "B"} x', b"\xff", b'{"broker": NaN}'],
)
def test_a_body_that_is_no_json_object_is_422(client: TestClient, content: bytes) -> None:
    response = client.put(URL, content=content, headers=JSON)

    assert response.status_code == 422
    assert response.json()["detail"] == "The request body does not fit the schema."


def test_a_duplicate_key_is_422_and_the_value_is_not_repeated(client: TestClient) -> None:
    duplicate = client.put(URL, content=b'{"broker": "A", "broker": "B"}', headers=JSON)
    secret = client.put(URL, json={"broker": "secret-value-8 ", "other": 1})

    assert duplicate.status_code == 422
    assert duplicate.json()["errors"] == [{"location": [], "type": "json_invalid"}]
    assert secret.status_code == 422
    assert "secret-value-8" not in secret.text


def test_the_media_type_must_be_json(client: TestClient) -> None:
    for headers in ({}, {"content-type": "text/plain"}, {"content-type": "text/csv"}):
        for path, body in ((URL, b'{"broker": "B"}'), (LANGUAGE, b'{"language": "en"}')):
            response = client.put(path, content=body, headers=headers)
            assert response.status_code == 415, (path, headers)
            assert response.json() == {
                "detail": "The request body must be JSON (Content-Type: application/json)."
            }
    assert client.get(URL).json() == {"broker": None, "chosen": False}


def test_other_methods_are_405(client: TestClient) -> None:
    for path in (URL, LANGUAGE):
        assert client.post(path, json={}).status_code == 405
        assert client.delete(path).status_code == 405
        assert client.patch(path, json={}).status_code == 405
    for method in ("post", "put", "delete"):
        assert client.request(method, "/api/replay/revision").status_code == 405


def test_an_unknown_internal_path_is_404(client: TestClient) -> None:
    assert client.get("/api/replay/unknown").status_code == 404
    assert client.get("/api/replay/settings").status_code == 404
    assert client.get("/api/v1/settings/test-run-broker").status_code == 404
    assert client.get("/api/replay/settings/default-source").status_code == 404


def test_an_invalid_stored_value_is_503_and_a_valid_write_repairs_it(
    tmp_path: Path, client: TestClient
) -> None:
    fill(client, BROKER)
    client.put(URL, json={"broker": BROKER})
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute("UPDATE replay_settings SET test_run_broker = ' bad '")

    response = client.get(URL)

    assert response.status_code == 503
    assert response.json() == {
        "detail": "The stored pipwerk replay broker for test runs is invalid."
    }
    assert client.put(URL, json={"broker": BROKER}).status_code == 200
    assert client.get(URL).json() == {"broker": BROKER, "chosen": True}


def test_the_service_raises_for_an_invalid_stored_value_and_refuses_an_invalid_name(
    tmp_path: Path,
) -> None:
    engine = create_replay_engine(f"sqlite:///{tmp_path / 'replay.db'}")
    service = SettingsService(create_session_factory(engine))
    service.set_test_run_broker(BROKER)
    with engine.begin() as connection:
        connection.exec_driver_sql("UPDATE replay_settings SET test_run_broker = ''")

    with pytest.raises(StoredTestRunBrokerInvalidError):
        service.get_test_run_broker()
    for name in ("", " x", "x ", "a\x00b", "x" * 129):
        with pytest.raises(InvalidBrokerNameError):
            service.set_test_run_broker(name)
    assert service.set_test_run_broker(None) is None


def test_the_limit_of_the_body_applies_to_the_internal_endpoints(tmp_path: Path) -> None:
    client = TestClient(make_app(tmp_path, max_body_bytes=1024))

    for path in (URL, LANGUAGE):
        too_large = client.put(path, content=b" " * 1025, headers=JSON)
        within = client.put(path, content=b" " * 1024, headers=JSON)
        assert too_large.status_code == 413, path
        assert too_large.json() == {"detail": "The request body is larger than the limit."}
        assert within.status_code == 422, path


@pytest.mark.parametrize("path", INTERNAL_PATHS)
def test_a_foreign_host_is_rejected_before_anything_else(client: TestClient, path: str) -> None:
    for method in ("get", "put"):
        response = client.request(
            method,
            path,
            content=b'{"broker": "B"}',
            headers={"host": "rebind.example:18000", "origin": "http://rebind.example:18000"}
            | JSON,
        )

        assert response.status_code == 400
        assert response.json() == {"detail": "The Host header of the request is not allowed."}
    assert client.get(URL).json() == {"broker": None, "chosen": False}


def test_the_internal_endpoints_are_in_the_live_description_but_not_in_the_contract(
    client: TestClient,
) -> None:
    live = client.get("/openapi.json").json()
    public = contract.public_description(live)["paths"]

    for path in INTERNAL_PATHS:
        assert path in live["paths"]
        assert path not in public
    assert all(path.startswith("/api/v1/") for path in public)
    assert set(live["paths"][URL]) == {"get", "put"}
    assert "/api/replay/settings/default-source" not in live["paths"]
