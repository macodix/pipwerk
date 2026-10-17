"""Tests of the public web API with an invalid stored object directory (finding B1 of the
function test).

If the stored setting is not an absolute path (a database changed by hand, specification 4.1 and
technical documentation 2.8), every endpoint under ``/api/v1/`` that needs the object directory
answers like the internal endpoint of the setting: HTTP 503 with a fixed JSON text, without a
path and without an exception text. Endpoints that need no object directory keep working.
"""

import sqlite3
from collections.abc import Callable
from pathlib import Path
from typing import Any
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from web_api_support import (
    JSON,
    RISK_TEMPLATE_ID,
    body,
    check,
    indicator_document,
    load_case,
    post,
    put,
    rule_document,
    ruleset_document,
    trend_document,
)

from pipwerk_studio.app import create_app

TEXT = {"detail": "The stored pipwerk Studio object directory is invalid."}
ARTS = ["strategies", "indicators", "trends", "rules", "rulesets"]
DOCUMENTS: dict[str, Callable[[], dict[str, Any]]] = {
    "strategies": lambda: load_case("str-03"),
    "indicators": indicator_document,
    "trends": trend_document,
    "rules": rule_document,
    "rulesets": lambda: ruleset_document("Regelwerk", []),
}


@pytest.fixture
def broken(tmp_path: Path, home: Path) -> TestClient:
    """A backend whose stored object directory is a relative path."""
    database = tmp_path / "studio.db"
    client = TestClient(create_app(f"sqlite:///{database}"))
    assert (
        client.put(
            "/api/studio/settings/object-directory",
            json={"path": str(tmp_path / "objects"), "move": False},
        ).status_code
        == 200
    )
    with sqlite3.connect(database) as connection:
        connection.execute("UPDATE studio_settings SET object_directory = 'relative/path'")
    assert client.get("/api/studio/settings/object-directory").status_code == 503
    return client


def assert_fixed(response_text: str, status: int, expected: int = 503) -> None:
    assert status == expected
    assert "relative/path" not in response_text
    assert "Traceback" not in response_text
    assert "StoredObjectDirectoryInvalidError" not in response_text


@pytest.mark.parametrize("art", ARTS)
def test_list_read_create_replace_delete_and_usages_answer_503(
    broken: TestClient, art: str
) -> None:
    some_id = str(uuid4())
    document = DOCUMENTS[art]()
    document["id"] = some_id
    answers = [
        broken.get(f"/api/v1/{art}"),
        broken.get(f"/api/v1/{art}/{some_id}"),
        post(broken, art, document),
        put(broken, art, some_id, document),
        broken.delete(f"/api/v1/{art}/{some_id}"),
        broken.get(f"/api/v1/{art}/{some_id}/usages"),
    ]
    for answer in answers:
        assert_fixed(answer.text, answer.status_code)
        assert answer.json() == TEXT
        assert answer.headers["content-type"] == "application/json"


def test_the_answer_is_the_one_of_the_internal_endpoint(broken: TestClient) -> None:
    internal = broken.get("/api/studio/settings/object-directory")
    assert internal.status_code == 503
    assert internal.json() == TEXT
    assert broken.get("/api/v1/strategies").json() == internal.json()


def test_the_usages_of_the_delivered_template_need_the_directory_too(broken: TestClient) -> None:
    answer = broken.get(f"/api/v1/rules/{RISK_TEMPLATE_ID}/usages")
    assert answer.status_code == 503
    assert answer.json() == TEXT


def test_endpoints_without_the_object_directory_keep_working(broken: TestClient) -> None:
    assert broken.get("/api/v1/element-types").status_code == 200
    assert check(broken, load_case("str-03")).status_code == 200
    read = broken.get(f"/api/v1/rules/{RISK_TEMPLATE_ID}")  # the delivered template
    assert read.status_code == 200
    changed = put(broken, "rules", RISK_TEMPLATE_ID, read.json())
    assert changed.status_code == 403  # the rule that it is not changeable comes first
    assert broken.delete(f"/api/v1/rules/{RISK_TEMPLATE_ID}").status_code == 403
    assert broken.get("/api/health").status_code == 200


def test_a_document_that_is_wrong_is_422_before_the_directory_is_needed(
    broken: TestClient,
) -> None:
    assert broken.post("/api/v1/strategies", content=b"{}", headers=JSON).status_code == 422
    assert broken.post("/api/v1/strategies", content=body([]), headers=JSON).status_code == 422
    assert broken.get("/api/v1/strategies/not-a-uuid").status_code == 422


def test_saving_the_setting_without_moving_repairs_the_state(
    broken: TestClient, tmp_path: Path
) -> None:
    repaired = broken.put(
        "/api/studio/settings/object-directory",
        json={"path": str(tmp_path / "repaired"), "move": False},
    )
    assert repaired.status_code == 200
    assert broken.get("/api/v1/rules").json() == {"items": []}
    assert post(broken, "rules", rule_document()).status_code == 201


def test_the_failure_is_logged_without_the_value(
    broken: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    broken.get("/api/v1/strategies")
    messages = [record.getMessage() for record in caplog.records]
    assert any("object directory" in message for message in messages)
    assert all("relative/path" not in message for message in messages)
