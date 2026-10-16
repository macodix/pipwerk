"""Tests of ``GET /api/v1/element-types`` (specification 4.2, order 03 point 2).

The answer carries all type descriptions of the element register with the labels in German
and English, the delivered templates ("Risiko je Trade" with the expression of specification
3.5) and the functions. The backend knows no single type: the answer is the register of the
library, and the models of the answer follow the classes of the library field by field.
"""

import dataclasses
import re
from pathlib import Path

from fastapi.testclient import TestClient
from pipwerk_domain.defaults import default_registry
from pipwerk_domain.expressions.functions import list_functions
from pipwerk_domain.risk_rule import RISK_PER_TRADE_EXPRESSION, RISK_PER_TRADE_RULE_ID
from pipwerk_domain.typedesc import (
    Choice,
    Condition,
    Label,
    OutputDescription,
    ParameterDescription,
    PropertyDescription,
    TypeDescription,
)
from pydantic import BaseModel
from web_api_support import RISK_TEMPLATE_ID

from pipwerk_studio import web_api
from pipwerk_studio.app import create_app

SOURCE = Path(web_api.__file__).resolve().parent


def fetch(client: TestClient) -> dict[str, object]:
    response = client.get("/api/v1/element-types")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    return response.json()  # type: ignore[no-any-return]


def test_the_answer_lists_every_type_of_the_register(client: TestClient) -> None:
    answer = fetch(client)
    assert set(answer) == {"types", "templates", "functions"}
    types = answer["types"]
    assert isinstance(types, list)
    assert [item["id"] for item in types] == [item.id for item in default_registry().list()]


def test_every_type_has_labels_in_german_and_english(client: TestClient) -> None:
    types = fetch(client)["types"]
    assert isinstance(types, list)
    assert len(types) >= 25
    for item in types:
        assert item["name"]["de"].strip() and item["name"]["en"].strip(), item["id"]
        assert item["description"]["de"].strip() and item["description"]["en"].strip()
        for parameter in item["parameters"] + item["properties"] + item["outputs"]:
            assert parameter["label"]["de"].strip(), (item["id"], parameter["id"])
            assert parameter["label"]["en"].strip(), (item["id"], parameter["id"])
            for choice in parameter.get("choices", []):
                assert choice["label"]["de"].strip() and choice["label"]["en"].strip()


def test_the_types_are_the_descriptions_of_the_library_without_loss(client: TestClient) -> None:
    types = {item["id"]: item for item in fetch(client)["types"]}  # type: ignore[attr-defined]
    for description in default_registry().list():
        item = types[description.id]
        expected = dataclasses.asdict(description)
        # the answer is the description as JSON: tuples become lists, enumerations their value
        assert item == _as_json(expected), description.id


def _as_json(value: object) -> object:
    if isinstance(value, dict):
        return {key: _as_json(item) for key, item in value.items()}
    if isinstance(value, tuple | list):
        return [_as_json(item) for item in value]
    return value


def test_the_groups_of_the_delivered_types_are_there(client: TestClient) -> None:
    types = {item["id"]: item for item in fetch(client)["types"]}  # type: ignore[attr-defined]
    kinds = {item["kind"] for item in types.values()}
    assert kinds == {
        "trigger",
        "flow",
        "object_type",
        "application_object",
        "order_type",
        "trend_method",
    }
    # a few identifiers of the specification 3.2, as examples of every group
    for identifier in (
        "trigger.candle_close",
        "trigger.tick",
        "flow.condition",
        "flow.place_order",
        "MarketOrder",
        "CloseOrder",
        "Konto",
        "Instrument",
        "Kerze",
        "EMA",
        "ATR",
        "Markttechnik",
        "Indikator",
        "Trend",
        "Regel",
        "Regelwerk",
    ):
        assert identifier in types, identifier
    assert types["trigger.candle_close"]["name"] == {"de": "Kerzenschluss", "en": "Candle close"}


def test_the_delivered_template_risk_per_trade_has_the_expression_of_the_specification(
    client: TestClient,
) -> None:
    templates = fetch(client)["templates"]
    assert isinstance(templates, list)
    assert [item["id"] for item in templates] == [RISK_TEMPLATE_ID]
    template = templates[0]
    assert RISK_TEMPLATE_ID == RISK_PER_TRADE_RULE_ID
    assert template["format"] == "pipwerk.rule"
    assert template["title"] == "Risiko je Trade"
    assert template["object_type"] == "Regel"
    assert template["expression"] == RISK_PER_TRADE_EXPRESSION
    assert template["determined_property"] == "volumen"
    assert template["comparison"] == "hoechstens"
    assert template["parameters"] == [
        {
            "name": "risikogrenze",
            "datatype": "percent",
            "required": True,
            "default": 0.01,
            "choices": [],
        }
    ]
    assert "IF(ISNA(Position.volumen);" in template["expression"]
    assert "FLOOR(" in template["expression"]


def test_the_functions_are_those_of_the_library(client: TestClient) -> None:
    functions = fetch(client)["functions"]
    assert isinstance(functions, list)
    signatures = list_functions()
    assert [item["name"] for item in functions] == [item.name for item in signatures]
    names = {item["name"] for item in functions}
    assert {"IF", "AND", "OR", "NOT", "MIN", "MAX", "ABS", "FLOOR", "CEILING"} <= names
    assert {"ISNA", "IFNA", "ISBLANK", "PREVIOUS"} <= names
    for item, signature in zip(functions, signatures, strict=True):
        assert item["min_arguments"] == signature.min_arguments
        assert item["max_arguments"] == signature.max_arguments
        assert item["description"] == {
            "de": signature.description.de,
            "en": signature.description.en,
        }
        assert [part["name"] for part in item["parameters"]] == [
            part.name for part in signature.parameters
        ]
        assert item["variadic"] == (
            None if signature.variadic is None else signature.variadic.value
        )
        assert item["result"] == signature.result.value


def test_the_models_follow_the_classes_of_the_library_field_by_field() -> None:
    pairs: list[tuple[type[BaseModel], type]] = [
        (web_api.LabelModel, Label),
        (web_api.ChoiceModel, Choice),
        (web_api.ConditionModel, Condition),
        (web_api.ParameterModel, ParameterDescription),
        (web_api.PropertyModel, PropertyDescription),
        (web_api.OutputModel, OutputDescription),
        (web_api.TypeDescriptionModel, TypeDescription),
    ]
    for model, source in pairs:
        assert list(model.model_fields) == [item.name for item in dataclasses.fields(source)], (
            source.__name__
        )
    assert list(web_api.FunctionModel.model_fields) == [
        "name",
        "parameters",
        "variadic",
        "result",
        "description",
        "min_arguments",
        "max_arguments",
    ]


def test_the_models_of_the_answers_reject_additional_fields() -> None:
    for model in (
        web_api.ElementTypesResponse,
        web_api.TypeDescriptionModel,
        web_api.ObjectList,
        web_api.ObjectListEntry,
        web_api.UsagesResponse,
        web_api.CheckResponse,
        web_api.FindingModel,
        web_api.ApiError,
        web_api.InvalidRequest,
    ):
        assert model.model_config.get("extra") == "forbid", model.__name__


def test_the_answer_equals_a_second_request_and_changes_nothing(client: TestClient) -> None:
    assert fetch(client) == fetch(client)


def test_a_register_given_to_the_application_is_the_one_used(tmp_path: Path) -> None:
    from pipwerk_domain.defaults import create_registry

    registry = create_registry(entry_points=False)
    registry.register(
        TypeDescription(
            id="x.probe",
            kind=default_registry().list()[0].kind,
            name=Label("Probe", "Probe"),
            description=Label("Eine Probe", "A probe"),
        )
    )
    client = TestClient(create_app(f"sqlite:///{tmp_path / 'studio.db'}", registry=registry))
    ids = [item["id"] for item in fetch(client)["types"]]  # type: ignore[attr-defined]
    assert "x.probe" in ids


def test_the_backend_names_no_single_type() -> None:
    """E2: types, check and documents come from the library; no source file of the backend
    names an element type or an object type."""
    identifiers = {item.id for item in default_registry().list()}
    pattern = re.compile(
        r"(?<![A-Za-z0-9_.])(" + "|".join(map(re.escape, identifiers)) + r")(?![A-Za-z0-9_])"
    )
    offending: list[str] = []
    for path in sorted(SOURCE.rglob("*.py")):
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            if pattern.search(line):
                offending.append(f"{path.relative_to(SOURCE)}:{number}: {line.strip()}")
    assert offending == []
