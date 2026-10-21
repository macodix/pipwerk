"""Helpers of the tests of the public web API: test case documents, a client with an
object directory below a temporary home and builders for documents (format 2.0)."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

REPOSITORY = Path(__file__).resolve().parents[4]
TESTCASE_DIRECTORY = REPOSITORY / "contracts" / "strategies" / "v2" / "testcases"
TESTCASE_DIRECTORY_V1 = REPOSITORY / "contracts" / "strategies" / "v1" / "testcases"
EXAMPLE_DIRECTORY = REPOSITORY / "contracts" / "strategies" / "v2" / "examples"
CONTRACT_FILE = REPOSITORY / "contracts" / "api" / "pipwerk-studio" / "v1" / "openapi.json"
EMA_TRENDFOLGE_FILE = (
    REPOSITORY
    / "development"
    / "strategiedesign"
    / "wp02"
    / "acceptance"
    / "ema-trendfolge-auftraggeber.strategy.json"
)
JSON = {"content-type": "application/json"}
RISK_TEMPLATE_ID = "7c1d4e2a-5b3f-4a86-9d27-e1f0a3c8b645"
OTHER_ID = "11111111-2222-4333-8444-555555555555"


def load_case(name: str) -> dict[str, Any]:
    """The test case document ``str-01`` or ``str-03`` (format 2.0) as a new dictionary."""
    path = TESTCASE_DIRECTORY / f"{name}.strategy.json"
    return json.loads(path.read_text(encoding="utf-8"))  # type: ignore[no-any-return]


def load_case_v1(name: str) -> dict[str, Any]:
    """The test case document of the format 1.0."""
    path = TESTCASE_DIRECTORY_V1 / f"{name}.strategy.json"
    return json.loads(path.read_text(encoding="utf-8"))  # type: ignore[no-any-return]


def body(document: object) -> bytes:
    return json.dumps(document).encode("utf-8")


def post(client: TestClient, art: str, document: object) -> Any:
    return client.post(f"/api/v1/{art}", content=body(document), headers=JSON)


def put(client: TestClient, art: str, object_id: str, document: object) -> Any:
    return client.put(f"/api/v1/{art}/{object_id}", content=body(document), headers=JSON)


def check(client: TestClient, document: object) -> Any:
    return client.post("/api/v1/check", content=body(document), headers=JSON)


def post_json(client: TestClient, path: str, data: object) -> Any:
    return client.post(path, content=body(data), headers=JSON)


def codes(findings: list[dict[str, Any]]) -> list[str]:
    return [item["code"] for item in findings]


def without_id(document: dict[str, Any]) -> dict[str, Any]:
    copied = copy.deepcopy(document)
    copied.pop("id", None)
    return copied


def instance(
    name: str, object_type: str = "Regel", key: str | None = None, **fields: Any
) -> dict[str, Any]:
    """An instance document; the other fields keep the defaults of the model."""
    return {"name": name, "key": key or name.lower(), "object_type": object_type, **fields}


def instance_of(template_id: str, name: str, key: str = "mindest") -> dict[str, Any]:
    """A rule instance whose origin is the template ``template_id``."""
    return instance(
        name,
        "Regel",
        key,
        origin={"object_type": "Regel", "template_id": template_id, "template_name": name},
        expression="Order.volumen >= Instrument.mindestvolumen",
    )


def rule_document(name: str = "Mindestvolumen", expression: str | None = None) -> dict[str, Any]:
    """A rule template (checking, without determined property)."""
    return {
        "format": "pipwerk.rule",
        "format_version": "2.0",
        "id": OTHER_ID,
        "name": name,
        "description": "Test rule",
        "object_type": "Regel",
        "expression": expression or "Order.volumen >= Instrument.mindestvolumen",
    }


def ruleset_document(name: str, rules: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "format": "pipwerk.ruleset",
        "format_version": "2.0",
        "id": OTHER_ID,
        "name": name,
        "description": "",
        "object_type": "Regelwerk",
        "rules": rules,
    }


def indicator_document(name: str = "Eigener Indikator") -> dict[str, Any]:
    return {
        "format": "pipwerk.indicator",
        "format_version": "2.0",
        "id": OTHER_ID,
        "name": name,
        "description": "",
        "object_type": "Indikator",
    }


def trend_document(name: str = "Eigener Trend") -> dict[str, Any]:
    return {
        "format": "pipwerk.trend",
        "format_version": "2.0",
        "id": OTHER_ID,
        "name": name,
        "description": "",
        "object_type": "Trend",
        "parameter_values": {
            "zeiteinheit": {"kind": "fixed", "value": "h1"},
            "berechnungsverfahren": {"kind": "fixed", "value": "trend_method.expression"},
        },
        "properties": [
            {"key": "richtung", "name": "Richtung", "datatype": "text", "expression": '"aufwaerts"'}
        ],
    }
