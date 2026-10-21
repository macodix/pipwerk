"""Tests of ``POST /api/v1/keys`` (specification 3.3, order 04 point 2 and 7): the key of a new
object is formed from its name by the library, never by the user interface."""

from typing import Any

import pytest
from fastapi.testclient import TestClient
from pipwerk_domain import limits
from web_api_support import JSON, load_case, load_case_v1, post_json, rule_document


def key_of(client: TestClient, scope: str, name: str, **more: Any) -> Any:
    return post_json(
        client,
        "/api/v1/keys",
        {"document": load_case("str-03"), "scope": scope, "name": name, **more},
    )


@pytest.mark.parametrize(
    ("scope", "name", "key"),
    [
        ("/parameters", "Risiko pro Trade", "risiko_pro_trade"),
        ("/parameters", "Stop-Abstand", "stop_abstand_2"),  # taken by a parameter
        ("/parameters", "Zeiteinheit", "zeiteinheit_2"),
        ("/parameters", "Größe der Äpfel", "groesse_der_aepfel"),
        ("/parameters", "20 Tage", "n_20_tage"),  # a key does not begin with a digit
        ("/parameters", "Kerze", "kerze"),  # a strategy parameter is addressed behind "Strategie"
        ("/elements", "Kerze", "kerze_2"),  # the identifier of an object of the application
        ("/elements", "IF", "if_2"),  # the name of a function
        ("/elements", "EMA 20", "ema_20"),
        ("/elements", "ATR14", "atr14_2"),  # taken by an instance
        ("/elements", "Kreuzen", "kreuzen_2"),  # taken by a condition
        ("/elements", "Neue Bedingung", "neue_bedingung"),
        ("/rules", "Risiko", "risiko_2"),
    ],
)
def test_the_key_is_formed_from_the_name(
    client: TestClient, scope: str, name: str, key: str
) -> None:
    response = key_of(client, scope, name)
    assert response.status_code == 200, response.text
    assert response.json() == {"key": key}


def test_the_key_of_a_name_without_letters_follows_the_kind(client: TestClient) -> None:
    assert key_of(client, "/parameters", "!!!").json() == {"key": "parameter"}
    assert key_of(client, "/rules", "").json() == {"key": "regel"}
    assert key_of(client, "/elements", "???", kind="condition").json() == {"key": "bedingung"}
    assert key_of(client, "/elements", "???", kind="calculation").json() == {"key": "berechnung"}
    assert key_of(client, "/elements", "???", kind="instance", object_type="Trend").json() == {
        "key": "trend"
    }


def test_the_key_is_different_from_the_keys_of_its_namespace_only(client: TestClient) -> None:
    """A strategy parameter and an element have their own namespaces."""
    assert key_of(client, "/elements", "Stop-Abstand").json() == {"key": "stop_abstand"}
    assert key_of(client, "/parameters", "Kreuzen").json() == {"key": "kreuzen"}


def test_the_scope_may_be_a_list_inside_an_element(client: TestClient) -> None:
    """The element "Order aufgeben" holds the rule "Mindestvolumen"."""
    assert key_of(client, "/elements/7/rules", "Mindestvolumen").json() == {
        "key": "mindestvolumen_2"
    }
    assert key_of(client, "/elements/7/rules", "Neue Regel").json() == {"key": "neue_regel"}


def test_a_document_of_the_format_one_is_accepted(client: TestClient) -> None:
    response = post_json(
        client,
        "/api/v1/keys",
        {"document": load_case_v1("str-03"), "scope": "/parameters", "name": "Zeiteinheit"},
    )
    assert response.json() == {"key": "zeiteinheit_2"}


def test_the_scope_of_a_template_is_its_own_lists(client: TestClient) -> None:
    document = rule_document()
    document["parameters"] = [{"key": "grenze", "name": "Grenze", "datatype": "number"}]
    for scope, name, key in (("/parameters", "Grenze", "grenze_2"), ("/rules", "Eine", "eine")):
        response = post_json(
            client, "/api/v1/keys", {"document": document, "scope": scope, "name": name}
        )
        assert response.json() == {"key": key}, scope


@pytest.mark.parametrize(
    "scope",
    ["", "parameters", "/", "/name", "/nowhere", "/elements/99/rules", "/elements/x/rules",
     "/elements/4/parameters", "/connections", "/parameters/0", "/parameters/~2"],
)  # fmt: skip
def test_a_scope_that_is_no_list_for_a_new_object_is_422(client: TestClient, scope: str) -> None:
    response = key_of(client, scope, "Name")
    assert response.status_code == 422
    assert response.json() == {
        "detail": "The pointer names no list of the document that takes a new object.",
        "code": "keys.scope_invalid",
        "params": {},
    }


@pytest.mark.parametrize(
    "data",
    [
        {},
        {"scope": "/parameters", "name": "x"},
        {"document": {}, "name": "x"},
        {"document": {}, "scope": "/parameters"},
        {"document": {}, "scope": "/parameters", "name": 5},
        {"document": {}, "scope": "/parameters", "name": "x", "kind": "unknown"},
        {"document": {}, "scope": "/parameters", "name": "x", "extra": 1},
        {"document": {}, "scope": "/parameters", "name": "x" * (limits.MAX_NAME_LENGTH + 1)},
        {"document": {}, "scope": "/parameters", "name": "x", "object_type": "y" * 201},
        [],
        None,
    ],
)
def test_an_invalid_request_is_422(client: TestClient, data: Any) -> None:
    response = post_json(client, "/api/v1/keys", data)
    assert response.status_code == 422
    assert response.json()["code"] == "request.invalid"


def test_the_longest_name_is_accepted(client: TestClient) -> None:
    name = "a" * limits.MAX_NAME_LENGTH
    response = key_of(client, "/parameters", name)
    assert response.status_code == 200
    key = response.json()["key"]
    assert key == "a" * len(key)  # the key is cut so that a number can still be added
    assert 0 < len(key) <= limits.MAX_KEY_LENGTH


def test_a_document_that_does_not_fit_is_422_with_the_place_below_the_document(
    client: TestClient,
) -> None:
    document = load_case("str-03")
    document["zusaetzlich"] = 1
    response = post_json(
        client, "/api/v1/keys", {"document": document, "scope": "/parameters", "name": "x"}
    )
    assert response.status_code == 422
    assert response.json()["code"] == "document.invalid"
    assert response.json()["errors"] == [
        {"location": ["document", "zusaetzlich"], "type": "extra_forbidden"}
    ]


@pytest.mark.parametrize("raw", [b"", b"nonsense", b"["])
def test_a_body_that_is_no_json_is_422(client: TestClient, raw: bytes) -> None:
    response = client.post("/api/v1/keys", content=raw, headers=JSON)
    assert response.status_code == 422
    assert response.json()["errors"] == [{"location": [], "type": "json_invalid"}]


def test_the_media_type_must_be_json(client: TestClient) -> None:
    response = client.post("/api/v1/keys", content=b"{}", headers={"content-type": "text/plain"})
    assert response.status_code == 415
    assert response.json()["code"] == "request.not_json"
