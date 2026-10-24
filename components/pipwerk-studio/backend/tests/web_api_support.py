"""Helpers of the tests of the public web API: test case documents, a client with an
object directory below a temporary home and builders for documents (format 2.0)."""

from __future__ import annotations

import copy
import dataclasses
import json
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from pipwerk_domain.defaults import create_registry
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import (
    ArgumentDescription,
    Choice,
    DataType,
    Label,
    MethodDescription,
    PropertyDescription,
)

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
CASES = ("str-01", "str-03")
"""The test case documents."""
CHECKED_CASES = ("str-01", "str-03")
"""The test cases whose content the tests check (no finding, names): both, ``str-01`` uses the
``ZigZag`` (specification 3.2, 6)."""
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


SERIES = "Messreihe"
"""An object type with methods that the tests register in the element register: the delivered
types have no methods (specification 3.2), a package that registers types can have them (E7)."""


def registry_with_methods() -> ElementRegistry:
    """The register of the delivered types and the object type ``Messreihe`` with the methods
    ``wert_vor`` (two arguments, the second optional) and ``tendenz`` (a choice, no argument)."""
    registry = create_registry(entry_points=False)
    base = registry.get("EMA")
    assert base is not None
    prices = (
        Choice("schluss", Label("Schlusskurs", "close price")),
        Choice("eroeffnung", Label("Eröffnungskurs", "open price")),
    )
    registry.register(
        dataclasses.replace(
            base,
            id=SERIES,
            name=Label("Messreihe", "Series"),
            description=Label("Eine Reihe von Werten.", "A series of values."),
            explanation=Label("Eine Reihe von Werten.", "A series of values."),
            parameters=base.parameters[:2],
            properties=(
                PropertyDescription(
                    "wert",
                    DataType.NUMBER,
                    Label("Wert", "Value"),
                    must=True,
                    explanation=Label("Der aktuelle Wert.", "The current value."),
                ),
            ),
            methods=(
                MethodDescription(
                    "wert_vor",
                    DataType.NUMBER,
                    Label("Wert vor", "Value before"),
                    (
                        ArgumentDescription(
                            "anzahl",
                            DataType.INTEGER,
                            Label("Anzahl", "Count"),
                            required=True,
                            explanation=Label("Wie viele Werte zurück.", "How many values back."),
                        ),
                        ArgumentDescription(
                            "kurs",
                            DataType.CHOICE,
                            Label("Kurs", "Price"),
                            default="schluss",
                            choices=prices,
                            explanation=Label("Welcher Kurs.", "Which price."),
                        ),
                    ),
                    explanation=Label(
                        "Der Wert vor einer Anzahl Werten.", "The value before a number of values."
                    ),
                ),
                MethodDescription(
                    "tendenz",
                    DataType.CHOICE,
                    Label("Tendenz", "Tendency"),
                    choices=(
                        Choice("aufwaerts", Label("aufwärts", "up")),
                        Choice("abwaerts", Label("abwärts", "down")),
                    ),
                    explanation=Label("Die Richtung.", "The direction."),
                ),
            ),
            can_refresh=True,
        )
    )
    return registry


def series_document(*, inputs: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """A strategy (format 2.0) with an instance of ``Messreihe`` called "Reihe A" (key
    ``reihe_a``) and a condition "Prüfen" that uses a method of it."""

    def uid(number: int) -> str:
        return f"00000000-0000-4000-8000-{number:012d}"

    return {
        "format": "pipwerk.strategy",
        "format_version": "2.0",
        "id": uid(900),
        "name": "Methoden",
        "elements": [
            {
                "id": uid(1),
                "type": "trigger.candle_close",
                "parameters": {"zeiteinheit": {"kind": "fixed", "value": "h1"}},
            },
            {
                "id": uid(3),
                "type": SERIES,
                "instance": {
                    "name": "Reihe A",
                    "key": "reihe_a",
                    "object_type": SERIES,
                    "origin": {"object_type": SERIES},
                    "parameter_values": {"zeiteinheit": {"kind": "fixed", "value": "h1"}},
                },
            },
            {
                "id": uid(5),
                "type": "flow.condition",
                "name": "Prüfen",
                "key": "pruefen",
                "parameters": {
                    "ausdruck": {"kind": "expression", "value": "reihe_a.wert_vor(3) > 1"}
                },
                "inputs": inputs or [],
            },
            {
                "id": uid(2),
                "type": "flow.place_order",
                "parameters": {"ordertyp": {"kind": "fixed", "value": "MarketOrder"}},
                "properties": {
                    "richtung": {"kind": "fixed", "value": "buy"},
                    "volumen": {"kind": "fixed", "value": 1.0},
                },
            },
        ],
        "connections": [
            {"id": uid(50), "source": uid(1), "output": "weiter", "target": uid(5)},
            {"id": uid(51), "source": uid(5), "output": "wahr", "target": uid(2)},
        ],
    }


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
