"""Tests of the web API of the test accounts under ``/api/v1/accounts`` (specification 6.2).

Covered: create, read, list, change and delete; the default test account; every error case of
the strict check (additional fields, wrong types, ranges, name, spread rule, JSON errors,
media type, identifier); the format of the error answers.
"""

import json
from typing import Any
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from pipwerk_replay.accounts import (
    DEFAULT_ACCOUNT_ID,
    DEFAULT_ACCOUNT_NAME,
    MAX_COMMISSION,
    MAX_INITIAL_CAPITAL,
    MAX_LEVERAGE,
    MAX_NAME_LENGTH,
    MAX_SPREAD_POINTS,
)

JSON = {"content-type": "application/json"}
URL = "/api/v1/accounts"
ABSENT = "11111111-2222-4333-8444-555555555555"

VALID: dict[str, Any] = {
    "name": "Eurusd small",
    "initial_capital": 5000.5,
    "currency": "USD",
    "leverage": 100,
    "spread_mode": "fixed",
    "spread_points": 12.5,
    "commission_per_lot_side": 3.5,
}
CANDLE: dict[str, Any] = {**VALID, "spread_mode": "candle", "spread_points": None}


def create(client: TestClient, body: dict[str, Any] = VALID) -> dict[str, Any]:
    response = client.post(URL, json=body)
    assert response.status_code == 201, response.text
    return dict(response.json())


def places(response: Any) -> list[tuple[tuple[Any, ...], str]]:
    assert response.status_code == 422, response.text
    body = response.json()
    assert body["detail"] == "The request body does not fit the schema."
    return [(tuple(item["location"]), item["type"]) for item in body["errors"]]


# --- the default test account -----------------------------------------------------------------


def test_the_default_test_account_exists_after_the_start(client: TestClient) -> None:
    response = client.get(URL)

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
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
        ]
    }
    assert DEFAULT_ACCOUNT_NAME == "Standard-Testkonto"
    assert str(UUID(DEFAULT_ACCOUNT_ID)) == DEFAULT_ACCOUNT_ID


def test_the_default_test_account_can_be_read_by_its_identifier(client: TestClient) -> None:
    response = client.get(f"{URL}/{DEFAULT_ACCOUNT_ID}")

    assert response.status_code == 200
    assert response.json()["is_default"] is True


# --- create, read, list ------------------------------------------------------------------------


def test_create_answers_201_with_a_new_identifier_and_the_values(client: TestClient) -> None:
    created = create(client)

    assert UUID(created["id"]).version == 4
    assert created["id"] != DEFAULT_ACCOUNT_ID
    assert created["is_default"] is False
    assert {key: created[key] for key in VALID} == VALID
    assert client.get(f"{URL}/{created['id']}").json() == created


def test_create_with_the_spread_of_the_candles(client: TestClient) -> None:
    created = create(client, CANDLE)

    assert created["spread_mode"] == "candle"
    assert created["spread_points"] is None


def test_integers_are_accepted_for_the_numbers_with_a_fraction(client: TestClient) -> None:
    created = create(
        client, {**VALID, "initial_capital": 1000, "spread_points": 0, "commission_per_lot_side": 0}
    )

    assert created["initial_capital"] == 1000.0
    assert created["spread_points"] == 0.0


def test_two_accounts_may_have_the_same_name(client: TestClient) -> None:
    first = create(client)
    second = create(client)

    assert first["id"] != second["id"]
    assert [item["name"] for item in client.get(URL).json()["items"]].count(VALID["name"]) == 2


def test_an_account_of_the_user_with_the_default_name_is_a_different_account(
    client: TestClient,
) -> None:
    created = create(client, {**VALID, "name": DEFAULT_ACCOUNT_NAME})

    assert created["is_default"] is False
    items = client.get(URL).json()["items"]
    assert [item["is_default"] for item in items].count(True) == 1
    assert len(items) == 2


def test_the_list_is_sorted_by_name_without_regard_to_case(client: TestClient) -> None:
    for name in ("b second", "A first", "c third", "B Second 2"):
        create(client, {**VALID, "name": name})

    names = [item["name"] for item in client.get(URL).json()["items"]]

    assert names == ["A first", "b second", "B Second 2", "c third", "Standard-Testkonto"]


def test_read_of_an_unknown_account_is_404(client: TestClient) -> None:
    response = client.get(f"{URL}/{ABSENT}")

    assert response.status_code == 404
    assert response.json() == {"detail": "The test account does not exist."}


# --- change -----------------------------------------------------------------------------------


def test_change_replaces_all_values(client: TestClient) -> None:
    created = create(client)
    new = {
        "name": "Other",
        "initial_capital": 20000,
        "currency": "EUR",
        "leverage": 5,
        "spread_mode": "candle",
        "spread_points": None,
        "commission_per_lot_side": 0,
    }

    response = client.put(f"{URL}/{created['id']}", json=new)

    assert response.status_code == 200
    changed = response.json()
    assert changed["id"] == created["id"]
    assert changed["is_default"] is False
    assert changed["name"] == "Other"
    assert changed["initial_capital"] == 20000.0
    assert changed["spread_points"] is None
    assert client.get(f"{URL}/{created['id']}").json() == changed


def test_the_default_test_account_can_be_changed_and_stays_the_default(client: TestClient) -> None:
    response = client.put(f"{URL}/{DEFAULT_ACCOUNT_ID}", json=VALID)

    assert response.status_code == 200
    assert response.json()["is_default"] is True
    assert response.json()["name"] == VALID["name"]


def test_change_never_creates_an_account(client: TestClient) -> None:
    response = client.put(f"{URL}/{ABSENT}", json=VALID)

    assert response.status_code == 404
    assert len(client.get(URL).json()["items"]) == 1


def test_a_change_with_an_invalid_body_changes_nothing(client: TestClient) -> None:
    created = create(client)

    response = client.put(f"{URL}/{created['id']}", json={**VALID, "leverage": 0})

    assert response.status_code == 422
    assert client.get(f"{URL}/{created['id']}").json() == created


def test_the_identifier_and_the_mark_cannot_be_set_in_the_body(client: TestClient) -> None:
    created = create(client)

    for extra in ({"id": ABSENT}, {"is_default": True}):
        assert client.post(URL, json={**VALID, **extra}).status_code == 422
        assert client.put(f"{URL}/{created['id']}", json={**VALID, **extra}).status_code == 422


# --- delete -----------------------------------------------------------------------------------


def test_delete_answers_204_without_a_body_and_removes_the_account(client: TestClient) -> None:
    created = create(client)

    response = client.delete(f"{URL}/{created['id']}")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"{URL}/{created['id']}").status_code == 404
    assert client.delete(f"{URL}/{created['id']}").status_code == 404


def test_the_default_test_account_can_be_deleted(client: TestClient) -> None:
    assert client.delete(f"{URL}/{DEFAULT_ACCOUNT_ID}").status_code == 204

    assert client.get(URL).json() == {"items": []}


def test_delete_of_an_unknown_account_is_404(client: TestClient) -> None:
    response = client.delete(f"{URL}/{ABSENT}")

    assert response.status_code == 404
    assert response.json() == {"detail": "The test account does not exist."}


# --- the strict check of the values ------------------------------------------------------------


@pytest.mark.parametrize(
    ("field", "value", "kind"),
    [
        ("name", "", "string_too_short"),
        ("name", "x" * (MAX_NAME_LENGTH + 1), "string_too_long"),
        ("name", 5, "string_type"),
        ("name", None, "string_type"),
        ("initial_capital", 0, "greater_than"),
        ("initial_capital", -1, "greater_than"),
        ("initial_capital", MAX_INITIAL_CAPITAL * 2, "less_than_equal"),
        ("initial_capital", "1000", "float_type"),
        ("initial_capital", None, "float_type"),
        ("initial_capital", True, "float_type"),
        ("currency", "eur", "string_pattern_mismatch"),
        ("currency", "EURO", "string_pattern_mismatch"),
        ("currency", "EU", "string_pattern_mismatch"),
        ("currency", "E1R", "string_pattern_mismatch"),
        ("currency", "ÄÖÜ", "string_pattern_mismatch"),
        ("currency", "EUR\n", "string_pattern_mismatch"),
        ("currency", 1, "string_type"),
        ("leverage", 0, "greater_than_equal"),
        ("leverage", -5, "greater_than_equal"),
        ("leverage", MAX_LEVERAGE + 1, "less_than_equal"),
        ("leverage", 30.5, "int_type"),
        ("leverage", 30.0, "int_type"),
        ("leverage", "30", "int_type"),
        ("leverage", True, "int_type"),
        ("spread_mode", "Fixed", "literal_error"),
        ("spread_mode", "", "literal_error"),
        ("spread_mode", None, "literal_error"),
        ("spread_points", -0.1, "greater_than_equal"),
        ("spread_points", MAX_SPREAD_POINTS + 1, "less_than_equal"),
        ("spread_points", "5", "float_type"),
        ("commission_per_lot_side", -1, "greater_than_equal"),
        ("commission_per_lot_side", MAX_COMMISSION + 1, "less_than_equal"),
        ("commission_per_lot_side", "3", "float_type"),
        ("commission_per_lot_side", None, "float_type"),
    ],
)
def test_an_invalid_value_is_rejected_with_its_place_and_error_type(
    client: TestClient, field: str, value: object, kind: str
) -> None:
    body = {**VALID, field: value}

    for response in (
        client.post(URL, json=body),
        client.put(f"{URL}/{DEFAULT_ACCOUNT_ID}", json=body),
    ):
        assert places(response) == [((field,), kind)], (field, value)

    assert len(client.get(URL).json()["items"]) == 1


@pytest.mark.parametrize("field", list(VALID))
def test_a_missing_field_is_rejected(client: TestClient, field: str) -> None:
    body = {key: value for key, value in VALID.items() if key != field}

    assert places(client.post(URL, json=body)) == [((field,), "missing")]


def test_an_additional_field_is_rejected(client: TestClient) -> None:
    response = client.post(URL, json={**VALID, "spread_fixed": 1})

    assert places(response) == [(("spread_fixed",), "extra_forbidden")]


@pytest.mark.parametrize(
    "name",
    ["   ", "\t", "a\nb", "a\x00b", "a\x1fb", "a\x7fb", "a\u2028b", "a\x85b"],
)
def test_a_name_must_be_visible_and_without_control_characters(
    client: TestClient, name: str
) -> None:
    response = client.post(URL, json={**VALID, "name": name})

    assert places(response) == [((), "value_error")]


def test_a_name_of_the_largest_length_with_any_letters_is_accepted(client: TestClient) -> None:
    for name in ("x" * MAX_NAME_LENGTH, "Übung ✓ 日本語", " leading and trailing "):
        assert create(client, {**VALID, "name": name})["name"] == name


def test_a_name_counts_characters_not_bytes(client: TestClient) -> None:
    assert create(client, {**VALID, "name": "ä" * MAX_NAME_LENGTH})["name"] == "ä" * MAX_NAME_LENGTH
    assert client.post(URL, json={**VALID, "name": "ä" * (MAX_NAME_LENGTH + 1)}).status_code == 422


@pytest.mark.parametrize(
    ("capital", "leverage", "points", "commission"),
    [
        (1e-9, 1, 0, 0),
        (MAX_INITIAL_CAPITAL, MAX_LEVERAGE, MAX_SPREAD_POINTS, MAX_COMMISSION),
    ],
)
def test_the_limits_of_the_ranges_are_accepted(
    client: TestClient, capital: float, leverage: int, points: float, commission: float
) -> None:
    body = {
        **VALID,
        "initial_capital": capital,
        "leverage": leverage,
        "spread_points": points,
        "commission_per_lot_side": commission,
    }

    created = create(client, body)

    assert created["initial_capital"] == capital
    assert created["leverage"] == leverage


def test_the_spread_mode_fixed_needs_spread_points(client: TestClient) -> None:
    response = client.post(URL, json={**VALID, "spread_points": None})

    assert places(response) == [((), "value_error")]


def test_the_spread_mode_candle_takes_no_spread_points(client: TestClient) -> None:
    response = client.post(URL, json={**CANDLE, "spread_points": 1.5})

    assert places(response) == [((), "value_error")]


def test_all_errors_are_listed_together(client: TestClient) -> None:
    response = client.post(URL, json={**VALID, "leverage": 0, "currency": "x", "name": ""})

    assert sorted(location for location, _ in places(response)) == [
        ("currency",),
        ("leverage",),
        ("name",),
    ]


# --- JSON errors, media type, identifier, other methods ----------------------------------------


@pytest.mark.parametrize(
    "content",
    [
        b"",
        b"not json",
        b"[]",
        b"[1]",
        b"null",
        b'"x"',
        b"7",
        b"{",
        b'{"name": "a"} trailing',
        b"\xff\xfe",
    ],
)
def test_a_body_that_is_no_json_object_is_rejected(client: TestClient, content: bytes) -> None:
    response = client.post(URL, content=content, headers=JSON)

    assert response.status_code == 422
    assert response.json()["detail"] == "The request body does not fit the schema."


def test_a_duplicate_key_is_rejected(client: TestClient) -> None:
    text = json.dumps(VALID)[:-1] + ', "leverage": 5}'

    response = client.post(URL, content=text.encode(), headers=JSON)

    assert response.status_code == 422
    assert response.json()["errors"] == [{"location": [], "type": "json_invalid"}]
    assert len(client.get(URL).json()["items"]) == 1


@pytest.mark.parametrize("constant", ["NaN", "Infinity", "-Infinity"])
def test_nan_and_infinity_are_rejected(client: TestClient, constant: str) -> None:
    text = json.dumps(VALID).replace("5000.5", constant)

    response = client.post(URL, content=text.encode(), headers=JSON)

    assert response.status_code == 422
    assert response.json()["errors"] == [{"location": [], "type": "json_invalid"}]


def test_a_number_that_is_too_large_for_a_float_is_rejected(client: TestClient) -> None:
    text = json.dumps(VALID).replace("5000.5", "1e999")

    response = client.post(URL, content=text.encode(), headers=JSON)

    assert response.status_code == 422


def test_deep_nesting_does_not_crash(client: TestClient) -> None:
    response = client.post(URL, content=b"[" * 100_000, headers=JSON)

    assert response.status_code == 422


@pytest.mark.parametrize(
    "headers",
    [{}, {"content-type": "text/plain"}, {"content-type": "application/x-www-form-urlencoded"},
     {"content-type": "multipart/form-data; boundary=x"}, {"content-type": "application/jsonx"}],
)  # fmt: skip
def test_the_media_type_must_be_json(client: TestClient, headers: dict[str, str]) -> None:
    content = json.dumps(VALID).encode()

    for response in (
        client.post(URL, content=content, headers=headers),
        client.put(f"{URL}/{DEFAULT_ACCOUNT_ID}", content=content, headers=headers),
    ):
        assert response.status_code == 415
        assert response.json() == {
            "detail": "The request body must be JSON (Content-Type: application/json)."
        }
    assert len(client.get(URL).json()["items"]) == 1


def test_the_media_type_may_have_parameters_and_any_case(client: TestClient) -> None:
    response = client.post(
        URL,
        content=json.dumps(VALID).encode(),
        headers={"content-type": "Application/JSON; charset=utf-8"},
    )

    assert response.status_code == 201


@pytest.mark.parametrize(
    "identifier", ["abc", "1", "11111111-2222-4333-8444-55555555555", "x" * 100]
)
def test_an_identifier_that_is_no_uuid_is_422(client: TestClient, identifier: str) -> None:
    for response in (
        client.get(f"{URL}/{identifier}"),
        client.put(f"{URL}/{identifier}", json=VALID),
        client.delete(f"{URL}/{identifier}"),
    ):
        assert response.status_code == 422
        body = response.json()
        assert body["detail"] == "The request is invalid."
        assert body["errors"][0]["location"] == ["path", "id"]
        assert body["errors"][0]["type"] == "uuid_parsing"
        assert identifier not in response.text


def test_other_methods_are_405(client: TestClient) -> None:
    assert client.delete(URL).status_code == 405
    assert client.put(URL, json=VALID).status_code == 405
    assert client.post(f"{URL}/{DEFAULT_ACCOUNT_ID}", json=VALID).status_code == 405
    assert client.patch(f"{URL}/{DEFAULT_ACCOUNT_ID}", json=VALID).status_code == 405


def test_the_answers_do_not_name_paths_or_exceptions(client: TestClient) -> None:
    created = create(client)
    bodies = [
        client.get(f"{URL}/{ABSENT}").text,
        client.post(URL, json={**VALID, "leverage": 0}).text,
        client.post(URL, content=b"{", headers=JSON).text,
        client.post(URL, content=b"{}").text,
        client.get(f"{URL}/not-a-uuid").text,
    ]
    for text in bodies:
        for forbidden in ("Traceback", "sqlalchemy", "/srv/", ".py", created["id"]):
            assert forbidden not in text
