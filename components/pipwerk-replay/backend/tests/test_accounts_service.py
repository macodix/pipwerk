"""Tests of the test account service and of the default test account (specification 6.2).

The default test account is made at the start if the account with its fixed identifier is
missing. Covered: the first start, a second start (exactly one), the change of the default test
account and a second start (the change stays), delete and start (it is back with the
default values), a test account of the user with the same name (not overwritten, not counted as
the default one), concurrent starts and damaged rows.
"""

import sqlite3
import threading
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import text

from pipwerk_replay.accounts import (
    DEFAULT_ACCOUNT_ID,
    DEFAULT_ACCOUNT_NAME,
    AccountInput,
    AccountNotFoundError,
    AccountService,
    default_account_input,
)
from pipwerk_replay.app import create_app
from pipwerk_replay.storage import create_replay_engine, create_session_factory

CHANGED = {
    "name": "My account",
    "initial_capital": 1234.5,
    "currency": "CHF",
    "leverage": 2,
    "spread_mode": "fixed",
    "spread_points": 7.0,
    "commission_per_lot_side": 4.0,
}


def make_service(database_url: str) -> AccountService:
    return AccountService(create_session_factory(create_replay_engine(database_url)))


def rows(tmp_path: Path) -> list[tuple[object, ...]]:
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        return connection.execute("SELECT id, name FROM test_accounts ORDER BY id").fetchall()


def test_the_values_of_the_default_test_account() -> None:
    data = default_account_input()

    assert data.name == "Standard-Testkonto"
    assert data.initial_capital == 10_000
    assert data.currency == "EUR"
    assert data.leverage == 30
    assert data.spread_mode == "candle"
    assert data.spread_points is None
    assert data.commission_per_lot_side == 0


def test_the_start_creates_the_default_test_account(tmp_path: Path, database_url: str) -> None:
    assert not (tmp_path / "replay.db").exists()

    TestClient(create_app(database_url))

    assert rows(tmp_path) == [(DEFAULT_ACCOUNT_ID, DEFAULT_ACCOUNT_NAME)]


def test_a_second_start_creates_nothing_more(tmp_path: Path, database_url: str) -> None:
    TestClient(create_app(database_url))
    TestClient(create_app(database_url))

    assert rows(tmp_path) == [(DEFAULT_ACCOUNT_ID, DEFAULT_ACCOUNT_NAME)]


def test_ensure_reports_whether_it_created_the_account(database_url: str) -> None:
    engine = create_replay_engine(database_url)
    service = AccountService(create_session_factory(engine))

    assert service.ensure_default_account() is True
    assert service.ensure_default_account() is False
    service.delete_account(DEFAULT_ACCOUNT_ID)
    assert service.ensure_default_account() is True


def test_a_changed_default_test_account_is_not_overwritten_at_the_next_start(
    database_url: str,
) -> None:
    first = TestClient(create_app(database_url))
    assert first.put(f"/api/v1/accounts/{DEFAULT_ACCOUNT_ID}", json=CHANGED).status_code == 200

    second = TestClient(create_app(database_url))

    item = second.get(f"/api/v1/accounts/{DEFAULT_ACCOUNT_ID}").json()
    assert item["name"] == "My account"
    assert item["initial_capital"] == 1234.5
    assert item["is_default"] is True
    assert len(second.get("/api/v1/accounts").json()["items"]) == 1


def test_after_deleting_and_restarting_the_default_test_account_is_back_with_its_values(
    database_url: str,
) -> None:
    first = TestClient(create_app(database_url))
    first.put(f"/api/v1/accounts/{DEFAULT_ACCOUNT_ID}", json=CHANGED)
    assert first.delete(f"/api/v1/accounts/{DEFAULT_ACCOUNT_ID}").status_code == 204
    assert first.get("/api/v1/accounts").json() == {"items": []}

    second = TestClient(create_app(database_url))

    items = second.get("/api/v1/accounts").json()["items"]
    assert len(items) == 1
    assert items[0] == {
        "id": DEFAULT_ACCOUNT_ID,
        "is_default": True,
        "name": "Standard-Testkonto",
        "initial_capital": 10000.0,
        "currency": "EUR",
        "leverage": 30,
        "spread_mode": "candle",
        "spread_points": None,
        "commission_per_lot_side": 0.0,
    }


def test_an_account_of_the_user_with_the_default_name_is_not_overwritten_and_not_counted(
    tmp_path: Path, database_url: str
) -> None:
    first = TestClient(create_app(database_url))
    first.delete(f"/api/v1/accounts/{DEFAULT_ACCOUNT_ID}")
    mine = first.post("/api/v1/accounts", json={**CHANGED, "name": DEFAULT_ACCOUNT_NAME}).json()

    second = TestClient(create_app(database_url))

    items = second.get("/api/v1/accounts").json()["items"]
    assert len(items) == 2  # the default one is made again, mine stays
    by_id = {item["id"]: item for item in items}
    assert by_id[mine["id"]]["initial_capital"] == 1234.5
    assert by_id[mine["id"]]["is_default"] is False
    assert by_id[DEFAULT_ACCOUNT_ID]["initial_capital"] == 10000.0
    assert by_id[DEFAULT_ACCOUNT_ID]["is_default"] is True
    assert len(rows(tmp_path)) == 2


def test_an_account_that_is_renamed_to_the_default_name_does_not_become_the_default_one(
    database_url: str,
) -> None:
    client = TestClient(create_app(database_url))
    mine = client.post("/api/v1/accounts", json=CHANGED).json()

    changed = client.put(
        f"/api/v1/accounts/{mine['id']}", json={**CHANGED, "name": DEFAULT_ACCOUNT_NAME}
    ).json()

    assert changed["is_default"] is False


def test_the_default_test_account_renamed_stays_the_default_one(database_url: str) -> None:
    client = TestClient(create_app(database_url))
    client.put(f"/api/v1/accounts/{DEFAULT_ACCOUNT_ID}", json={**CHANGED, "name": "Renamed"})

    TestClient(create_app(database_url))

    assert [item["is_default"] for item in client.get("/api/v1/accounts").json()["items"]] == [True]


def test_concurrent_starts_make_the_default_test_account_once(
    tmp_path: Path, database_url: str
) -> None:
    engine = create_replay_engine(database_url)
    results: list[bool] = []
    errors: list[Exception] = []
    barrier = threading.Barrier(8)

    def start() -> None:
        try:
            service = AccountService(create_session_factory(engine))
            barrier.wait()
            results.append(service.ensure_default_account())
        except Exception as error:  # collected and asserted below
            errors.append(error)

    threads = [threading.Thread(target=start) for _ in range(8)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert errors == []
    assert results.count(True) == 1
    assert rows(tmp_path) == [(DEFAULT_ACCOUNT_ID, DEFAULT_ACCOUNT_NAME)]


def test_the_service_raises_for_an_unknown_account(database_url: str) -> None:
    service = make_service(database_url)
    data = default_account_input()

    with pytest.raises(AccountNotFoundError):
        service.get_account("11111111-2222-4333-8444-555555555555")
    with pytest.raises(AccountNotFoundError):
        service.update_account("11111111-2222-4333-8444-555555555555", data)
    with pytest.raises(AccountNotFoundError):
        service.delete_account("11111111-2222-4333-8444-555555555555")


def test_create_gives_every_account_its_own_identifier(database_url: str) -> None:
    service = make_service(database_url)
    data = AccountInput.model_validate(CHANGED)

    first = service.create_account(data)
    second = service.create_account(data)

    assert first.id != second.id
    assert DEFAULT_ACCOUNT_ID not in (first.id, second.id)
    assert not first.is_default


def test_the_model_rejects_what_the_api_rejects() -> None:
    with pytest.raises(ValidationError):
        AccountInput.model_validate({**CHANGED, "leverage": 0})
    with pytest.raises(ValidationError):
        AccountInput.model_validate({**CHANGED, "other": 1})
    with pytest.raises(ValidationError):
        AccountInput.model_validate({**CHANGED, "initial_capital": float("nan")})
    with pytest.raises(ValidationError):
        AccountInput.model_validate({**CHANGED, "initial_capital": float("inf")})


def test_a_damaged_row_is_not_passed_on_as_a_valid_account(database_url: str) -> None:
    engine = create_replay_engine(database_url)
    service = AccountService(create_session_factory(engine))
    service.ensure_default_account()
    with engine.begin() as connection:
        connection.execute(text("UPDATE test_accounts SET leverage = 0"))

    with pytest.raises(ValidationError):
        service.get_account(DEFAULT_ACCOUNT_ID)
