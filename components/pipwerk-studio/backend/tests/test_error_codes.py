"""Tests of the codes of the error answers (specification 4.2, order 04 point 7 and 12).

Every error answer has the English ``detail``, the ``code`` of the cause and the ``params`` for the
text. The table ``ERROR_CODES`` is the one list of the codes; the technical documentation and the
description of the interface name every code of it, and every code is caused in a test.
"""

import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from web_api_support import CONTRACT_FILE, JSON, REPOSITORY

from pipwerk_studio.errors import ERROR_CODES, ApiException, error_body, error_codes_markdown

TESTS = Path(__file__).resolve().parent
DOCUMENTATION = REPOSITORY / "docs" / "technical" / "pipwerk-studio.md"


def test_the_codes_are_named_by_the_area_and_the_cause() -> None:
    assert len(ERROR_CODES) >= 30
    for code, info in ERROR_CODES.items():
        assert re.fullmatch(r"[a-z]+(_[a-z]+)*\.[a-z]+(_[a-z]+)*", code), code
        assert 400 <= info.status < 600, code
        assert info.text.endswith("."), code
        assert info.text[0].isupper(), code
        assert all(re.fullmatch(r"[a-z_]+", name) for name in info.params), code


def test_the_text_of_a_code_names_no_path_no_value_and_no_exception() -> None:
    for code, info in ERROR_CODES.items():
        for leak in ("Traceback", "Error:", "/home", "/tmp", ".py", "{"):  # noqa: S108
            assert leak not in info.text, (code, leak)


def test_an_error_body_has_the_text_the_code_and_the_params() -> None:
    assert error_body("object.not_found") == {
        "detail": "The object does not exist.",
        "code": "object.not_found",
        "params": {},
    }
    assert error_body("request.too_large", {"limit_bytes": 5}, errors=[1]) == {
        "detail": "The request body is larger than the limit of 2 MiB.",
        "code": "request.too_large",
        "params": {"limit_bytes": 5},
        "errors": [1],
    }
    assert ApiException("keys.scope_invalid").params == {}


def test_every_code_is_caused_in_a_test() -> None:
    """Each code stands in the text of at least one other test file, in the form of the body."""
    texts = [
        path.read_text(encoding="utf-8")
        for path in sorted(TESTS.glob("test_*.py"))
        if path.name != Path(__file__).name
    ]
    missing = [
        code
        for code in ERROR_CODES
        if not any(f'"code": "{code}"' in text or f'== "{code}"' in text for text in texts)
    ]
    assert missing == []


def test_the_documentation_names_every_code_with_its_status() -> None:
    text = DOCUMENTATION.read_text(encoding="utf-8")
    for code, info in ERROR_CODES.items():
        assert f"`{code}`" in text, code
        line = next(item for item in text.splitlines() if f"`{code}`" in item)
        assert str(info.status) in line, code


def test_the_description_of_the_interface_names_every_code(client: TestClient) -> None:
    description = client.get("/openapi.json").json()
    schema = description["components"]["schemas"]["ApiError"]
    assert schema["properties"]["code"]["enum"] == list(ERROR_CODES)
    assert "params" in schema["required"]
    invalid = description["components"]["schemas"]["InvalidRequest"]
    assert invalid["properties"]["code"]["enum"] == list(ERROR_CODES)
    assert {"errors"} <= set(invalid["required"])
    text = CONTRACT_FILE.read_text(encoding="utf-8")
    for code in ERROR_CODES:
        assert f"`{code}`" in text, code
    assert error_codes_markdown() in text.replace("\\n", "\n")


# --- answers of the framework ---------------------------------------------------------------------


@pytest.mark.parametrize("path", ["/api/v1/unknown", "/api/unknown", "/unknown", "/api/v1/"])
def test_a_path_that_does_not_exist_is_404_with_a_code(client: TestClient, path: str) -> None:
    response = client.get(path)
    assert response.status_code == 404
    assert response.json() == {
        "detail": "There is no such path.",
        "code": "request.not_found",
        "params": {},
    }


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("post", "/api/health"),
        ("delete", "/api/studio/revision"),
        ("patch", "/api/v1/strategies"),
        ("get", "/api/v1/check"),
        ("get", "/api/v1/expressions"),
        ("put", "/api/v1/keys"),
    ],
)
def test_a_method_that_is_not_allowed_is_405_with_a_code(
    client: TestClient, method: str, path: str
) -> None:
    response = client.request(method, path)
    assert response.status_code == 405
    assert response.json() == {
        "detail": "The method is not allowed for this path.",
        "code": "request.method_not_allowed",
        "params": {},
    }


def test_a_body_that_is_no_json_for_the_language_is_422_with_the_place(
    client: TestClient,
) -> None:
    response = client.put("/api/studio/settings/language", content=b"{", headers=JSON)
    assert response.status_code == 422
    assert response.json()["code"] == "request.invalid"
    assert response.json()["errors"] == [{"location": ["body", 1], "type": "json_invalid"}]
