"""Tests of the errors of the public web API: documents that do not fit the schema (HTTP 422),
the media type (HTTP 415), the size of the body (HTTP 413), failures of the object directory.

Error answers have fixed texts. They name no path, no exception text and no value of the
request; for a document that does not fit the schema they name the place of each error in the
document and its error type.
"""

import json
import logging
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from pipwerk_domain import limits
from web_api_support import (
    JSON,
    body,
    check,
    load_case,
    post,
    put,
    rule_document,
)

from pipwerk_studio import web_api

MARKER = "MARKER-VALUE-4711"
LEAKS = ("Traceback", "site-packages", "Value error", "pydantic", "/tmp", "/home", ".py")  # noqa: S108


def assert_no_leak(text: str) -> None:
    for leak in LEAKS:
        assert leak not in text, leak
    assert MARKER not in text


# --- the schema (acceptance criterion 6) -------------------------------------------------------


@pytest.mark.parametrize("path", ["/api/v1/strategies", "/api/v1/check"])
def test_an_additional_field_is_422(client: TestClient, path: str) -> None:
    document = load_case("str-03")
    document["zusaetzlich"] = MARKER
    response = client.post(path, content=body(document), headers=JSON)
    assert response.status_code == 422
    assert response.json() == {
        "detail": "The document does not fit the document schema.",
        "code": "document.invalid",
        "params": {},
        "errors": [{"location": ["zusaetzlich"], "type": "extra_forbidden"}],
    }
    assert MARKER not in response.text
    assert client.get("/api/v1/strategies").json() == {"items": []}


def test_an_additional_field_is_422_for_put_too_and_the_object_stays(
    client: TestClient, objects: Path
) -> None:
    object_id = post(client, "strategies", load_case("str-03")).json()["id"]
    before = (objects / f"{object_id}.strategy.json").read_bytes()
    document = load_case("str-03")
    document["id"] = object_id
    document["zusaetzlich"] = 1
    assert put(client, "strategies", object_id, document).status_code == 422
    assert (objects / f"{object_id}.strategy.json").read_bytes() == before


def test_an_additional_field_deep_in_the_document_is_named_with_its_place(
    client: TestClient,
) -> None:
    document = load_case("str-03")
    assert document["elements"][3]["type"] == "trigger.candle_close"
    document["elements"][3]["parameters"]["zeiteinheit"]["extra"] = 1
    response = post(client, "strategies", document)
    assert response.status_code == 422
    assert response.json()["errors"] == [
        {
            "location": ["elements", 3, "parameters", "zeiteinheit", "extra"],
            "type": "extra_forbidden",
        }
    ]


def test_a_wrong_type_names_the_place_and_not_the_value(client: TestClient) -> None:
    document = load_case("str-03")
    document["elements"][0]["position"] = MARKER
    response = post(client, "strategies", document)
    assert response.status_code == 422
    assert response.json()["errors"][0]["location"] == ["elements", 0, "position"]
    assert_no_leak(response.text)


@pytest.mark.parametrize(
    "mutate",
    [
        lambda d: d.update(format_version="3.0"),
        lambda d: d.update(format_version="1"),
        lambda d: d.update(id="not-a-uuid"),
        lambda d: d.update(id=str(d["id"]).upper()),
        lambda d: d.pop("name"),
        lambda d: d.update(name=5),
        lambda d: d.update(elements="no list"),
        lambda d: d["parameters"].append({"key": "p", "name": "p", "datatype": "unknown"}),
        lambda d: d["elements"][0].update(position={"x": float("inf"), "y": 0}),
    ],
    ids=[
        "higher major version",
        "version without minor",
        "identifier not a UUID",
        "identifier in capitals",
        "missing name",
        "name not a text",
        "elements not a list",
        "unknown data type",
        "infinite number",
    ],
)
def test_documents_that_do_not_fit_the_schema_are_422(client: TestClient, mutate: Any) -> None:
    document = load_case("str-03")
    mutate(document)
    response = client.post(
        "/api/v1/strategies",
        content=json.dumps(document).encode("utf-8"),
        headers=JSON,
    )
    assert response.status_code == 422
    answer = response.json()
    assert answer["detail"] == "The document does not fit the document schema."
    assert (answer["code"], answer["params"]) == ("document.invalid", {})
    assert answer["errors"]
    assert_no_leak(response.text)
    assert client.get("/api/v1/strategies").json() == {"items": []}


@pytest.mark.parametrize(
    "raw",
    [
        b"",
        b"   ",
        b"not json",
        b"[]",
        b"null",
        b"5",
        b'"text"',
        b"{",
        b'{"format": "pipwerk.rule"}',
        b'{"format": "unknown"}',
        b"\xff\xfe{}",
        b"\xef\xbb\xbf{}",
        b'{"a": 1, "a": 2}',
        b'{"format": "pipwerk.rule", "x": NaN}',
        b'{"format": "pipwerk.rule", "x": Infinity}',
        b'{"format": "pipwerk.rule", "name": "\\ud800"}',
        b"[" * 100000,
    ],
    ids=[
        "empty",
        "blank",
        "no json",
        "array",
        "null",
        "number",
        "text",
        "unclosed",
        "missing fields",
        "unknown format",
        "utf-16 byte order mark",
        "utf-8 byte order mark",
        "duplicate key",
        "NaN",
        "Infinity",
        "single surrogate",
        "deeply nested",
    ],
)
def test_a_body_that_is_no_document_is_422_with_a_fixed_text(
    client: TestClient, raw: bytes
) -> None:
    for path in ("/api/v1/rules", "/api/v1/check"):
        response = client.post(path, content=raw, headers=JSON)
        assert response.status_code == 422, (path, raw[:20])
        assert response.json()["detail"] == "The document does not fit the document schema."
        assert response.json()["code"] == "document.invalid"
        assert isinstance(response.json()["errors"], list)
        assert_no_leak(response.text)


def test_the_limits_of_the_library_are_422(client: TestClient) -> None:
    long_expression = rule_document(expression="1+" * limits.MAX_EXPRESSION_LENGTH)
    deep_expression = rule_document(
        expression="(" * (limits.MAX_EXPRESSION_NESTING + 1)
        + "1"
        + ")" * (limits.MAX_EXPRESSION_NESTING + 1)
    )
    many_elements = load_case("str-03")
    many_elements["elements"] = [
        {"id": f"00000000-0000-4000-8000-{number:012d}", "type": "trigger.tick"}
        for number in range(limits.MAX_ELEMENTS + 1)
    ]
    many_rules = load_case("str-03")
    many_rules["rules"] = [
        {"name": f"r{number}", "key": f"r{number}", "object_type": "Regel"}
        for number in range(limits.MAX_RULES_PER_LIST + 1)
    ]
    many_parameters = load_case("str-03")
    many_parameters["parameters"] = [
        {"key": f"p{number}", "name": f"p{number}", "datatype": "number", "value": 1}
        for number in range(limits.MAX_STRATEGY_PARAMETERS + 1)
    ]
    many_connections = load_case("str-03")
    many_connections["connections"] = [
        many_connections["connections"][0] for _ in range(limits.MAX_CONNECTIONS + 1)
    ]
    nested: dict[str, Any] = {"name": "innen", "key": "innen", "object_type": "Regelwerk"}
    for _ in range(limits.MAX_INSTANCE_NESTING + 1):
        nested = {"name": "aussen", "key": "aussen", "object_type": "Regelwerk", "rules": [nested]}
    deep_instances = load_case("str-03")
    deep_instances["rules"] = [nested]
    for art, document in (
        ("rules", long_expression),
        ("rules", deep_expression),
        ("strategies", many_elements),
        ("strategies", many_rules),
        ("strategies", many_parameters),
        ("strategies", many_connections),
        ("strategies", deep_instances),
    ):
        response = post(client, art, document)
        assert response.status_code == 422, art
        assert response.json()["errors"]
        assert check(client, document).status_code == 422
    assert client.get("/api/v1/strategies").json() == {"items": []}
    assert client.get("/api/v1/rules").json() == {"items": []}


def test_the_limits_of_the_library_are_met_exactly_at_the_value(client: TestClient) -> None:
    depth = limits.MAX_EXPRESSION_NESTING
    at_limit = rule_document(expression="(" * depth + "1" + ")" * depth + " > 0")
    assert post(client, "rules", at_limit).status_code == 201
    parameters = load_case("str-03")
    parameters["parameters"] = [
        {"key": f"p{number}", "name": f"p{number}", "datatype": "number", "value": 1}
        for number in range(limits.MAX_STRATEGY_PARAMETERS)
    ]
    assert post(client, "strategies", parameters).status_code == 201


def test_at_most_fifty_errors_are_named_and_a_long_place_is_shortened(
    client: TestClient,
) -> None:
    document = load_case("str-03")
    for number in range(80):
        document[f"zusaetzlich{number}"] = 1
    document["y" * 500] = 1
    response = post(client, "strategies", document)
    assert response.status_code == 422
    errors = response.json()["errors"]
    assert len(errors) == web_api.MAX_LISTED_ERRORS == 50
    long = post(client, "strategies", {**load_case("str-03"), "y" * 500: 1})
    place = long.json()["errors"][0]["location"][0]
    assert place == "y" * web_api.MAX_LOCATION_TEXT + "…"


def test_the_error_of_a_request_names_the_place_and_never_the_value(client: TestClient) -> None:
    response = client.get(f"/api/v1/strategies/{MARKER}")
    assert response.status_code == 422
    assert_no_leak(response.text)
    assert response.json() == {
        "detail": "The request is invalid.",
        "code": "request.invalid",
        "params": {},
        "errors": [{"location": ["path", "id"], "type": "uuid_parsing"}],
    }


# --- the media type -----------------------------------------------------------------------------


@pytest.mark.parametrize(
    "headers",
    [
        {},
        {"content-type": "text/plain"},
        {"content-type": "application/x-www-form-urlencoded"},
        {"content-type": "multipart/form-data; boundary=x"},
        {"content-type": "application/jsonx"},
        {"content-type": "text/json"},
    ],
)
def test_a_body_that_is_not_declared_as_json_is_415(
    client: TestClient, headers: dict[str, str]
) -> None:
    for method, path in (
        ("post", "/api/v1/strategies"),
        ("post", "/api/v1/check"),
        ("put", "/api/v1/rules/11111111-2222-4333-8444-555555555555"),
    ):
        response = client.request(method, path, content=body(rule_document()), headers=headers)
        assert response.status_code == 415, (path, headers)
        assert response.json() == {
            "detail": "The request body must be JSON (Content-Type: application/json).",
            "code": "request.not_json",
            "params": {},
        }
    assert client.get("/api/v1/strategies").json() == {"items": []}


@pytest.mark.parametrize(
    "media_type",
    [
        "application/json",
        "application/json; charset=utf-8",
        "Application/JSON",
        " application/json ;x=1",
    ],
)
def test_the_media_type_json_is_accepted_with_parameters(
    client: TestClient, media_type: str
) -> None:
    response = client.post(
        "/api/v1/rules", content=body(rule_document()), headers={"content-type": media_type}
    )
    assert response.status_code == 201


# --- the size of the body (specification 8) ---------------------------------------------------


def padded_rule(size: int) -> bytes:
    """A rule document whose JSON text has exactly ``size`` bytes."""
    document = rule_document()
    document["description"] = ""
    base = len(body(document))
    document["description"] = "x" * (size - base)
    text = body(document)
    assert len(text) == size
    return text


def test_a_body_of_exactly_two_mebibytes_is_accepted(client: TestClient) -> None:
    text = padded_rule(limits.MAX_DOCUMENT_BYTES)
    response = client.post("/api/v1/rules", content=text, headers=JSON)
    assert response.status_code == 201, response.text[:200]
    object_id = response.json()["id"]
    # the stored file is a little larger than the body (indentation) and is read back
    assert client.get(f"/api/v1/rules/{object_id}").status_code == 200
    assert client.get("/api/v1/rules").json()["items"][0]["unreadable"] is False
    assert (
        client.put(
            f"/api/v1/rules/{object_id}",
            content=text.replace(
                b'"id": "11111111-2222-4333-8444-555555555555"', f'"id": "{object_id}"'.encode()
            ),
            headers=JSON,
        ).status_code
        == 200
    )


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("post", "/api/v1/rules"),
        ("post", "/api/v1/strategies"),
        ("post", "/api/v1/check"),
        ("put", "/api/v1/rules/11111111-2222-4333-8444-555555555555"),
        ("delete", "/api/v1/rules/11111111-2222-4333-8444-555555555555"),
        ("get", "/api/v1/rules"),
        ("get", "/api/v1/element-types"),
    ],
)
def test_a_body_above_two_mebibytes_is_413_before_the_json_is_read(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, method: str, path: str
) -> None:
    def forbidden(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("the JSON must not be read")

    monkeypatch.setattr(web_api, "parse_document", forbidden)
    response = client.request(
        method, path, content=padded_rule(limits.MAX_DOCUMENT_BYTES + 1), headers=JSON
    )
    assert response.status_code == 413
    assert response.json() == {
        "detail": "The request body is larger than the limit of 2 MiB.",
        "code": "request.too_large",
        "params": {"limit_bytes": limits.MAX_DOCUMENT_BYTES},
    }


def test_a_big_body_that_is_not_json_is_413_not_415_or_422(client: TestClient) -> None:
    response = client.post(
        "/api/v1/rules",
        content=b"x" * (limits.MAX_DOCUMENT_BYTES + 1),
        headers={"content-type": "text/plain"},
    )
    assert response.status_code == 413


def test_the_limit_applies_to_the_public_web_api_only(client: TestClient) -> None:
    response = client.put(
        "/api/studio/settings/language",
        content=b" " * (limits.MAX_DOCUMENT_BYTES + 1),
        headers=JSON,
    )
    assert response.status_code == 422  # answered by the endpoint, not by the limit
    assert response.json()["code"] == "request.invalid"


# --- failures of the object directory -----------------------------------------------------


def test_a_directory_that_cannot_be_written_is_500_with_a_fixed_text(
    client: TestClient, tmp_path: Path
) -> None:
    blocker = tmp_path / "file"
    blocker.write_text("x", encoding="utf-8")
    answer = client.put(
        "/api/studio/settings/object-directory", json={"path": str(blocker), "move": False}
    )
    assert answer.status_code == 200
    response = post(client, "rules", rule_document())
    assert response.status_code == 500
    assert response.json() == {
        "detail": "The object file could not be written or deleted.",
        "code": "object.write_failed",
        "params": {},
    }
    assert str(tmp_path) not in response.text
    listing = client.get("/api/v1/rules")  # the setting names a file, the directory cannot be read
    assert listing.status_code == 500
    assert listing.json() == {
        "detail": "The object directory of pipwerk Studio cannot be read.",
        "code": "object_directory.unreadable",
        "params": {},
    }
    assert str(tmp_path) not in listing.text
    assert client.get("/api/v1/rules/11111111-2222-4333-8444-555555555555").status_code == 404


def test_the_log_of_a_500_has_a_fixed_text_with_the_class_and_the_error_number(
    client: TestClient, tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    blocker = tmp_path / "file"
    blocker.write_text("x", encoding="utf-8")
    client.put("/api/studio/settings/object-directory", json={"path": str(blocker), "move": False})
    caplog.clear()
    with caplog.at_level(logging.DEBUG):
        assert post(client, "rules", rule_document()).status_code == 500
        assert client.get("/api/v1/rules").status_code == 500
    records = [record for record in caplog.records if record.levelno >= logging.ERROR]
    assert len(records) == 2  # the entries are written
    messages = [record.getMessage() for record in records]
    assert messages[0].startswith("An object file could not be written or deleted. (")
    assert "errno" in messages[0]
    assert messages[1].startswith("The object directory cannot be read. (")
    assert all(record.exc_info is None for record in records)
    for text in (caplog.text, *messages):
        assert str(tmp_path) not in text
        assert "file/" not in text
        assert "Traceback" not in text
        assert "Not a directory" not in text
        assert "Errno" not in text


def test_without_an_object_directory_writing_is_503_and_reading_is_empty(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("HOME")
    assert client.get("/api/v1/rules").json() == {"items": []}
    assert client.get("/api/v1/strategies/11111111-2222-4333-8444-555555555555").status_code == 404
    response = post(client, "rules", rule_document())
    assert response.status_code == 503
    assert response.json() == {
        "detail": "The object directory of pipwerk Studio is not set.",
        "code": "object_directory.not_set",
        "params": {},
    }


def test_a_document_that_is_too_large_to_be_stored_is_413_with_the_limit(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from pipwerk_studio import object_service

    monkeypatch.setattr(object_service, "MAX_STORED_FILE_BYTES", 100)
    monkeypatch.setattr(web_api, "MAX_STORED_FILE_BYTES", 100)
    response = post(client, "rules", rule_document())
    assert response.status_code == 413
    assert response.json() == {
        "detail": "The document is too large to be stored.",
        "code": "document.too_large",
        "params": {"limit_bytes": 100},
    }
    assert client.get("/api/v1/rules").json() == {"items": []}


def test_an_error_of_the_framework_without_a_code_of_its_own_is_answered_with_a_code() -> None:
    """A status of the framework that no code names keeps its status and gets the code
    ``request.failed``."""
    from starlette.exceptions import HTTPException

    bad = web_api.handle_http_exception(None, HTTPException(status_code=400))  # type: ignore[arg-type]
    assert bad.status_code == 400
    assert json.loads(bytes(bad.body)) == {
        "detail": "The request cannot be processed.",
        "code": "request.failed",
        "params": {},
    }
    conflict = web_api.handle_http_exception(None, HTTPException(status_code=409))  # type: ignore[arg-type]
    assert conflict.status_code == 409
    assert json.loads(bytes(conflict.body))["code"] == "request.failed"
