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
from pipwerk_domain.expressions.functions import FunctionParameter, list_functions
from pipwerk_domain.risk_rule import (
    RISK_PER_TRADE_EXPLANATION,
    RISK_PER_TRADE_EXPRESSION,
    RISK_PER_TRADE_RULE_ID,
)
from pipwerk_domain.typedesc import (
    DATATYPE_LABELS,
    ArgumentDescription,
    Choice,
    Condition,
    DataType,
    Label,
    MethodDescription,
    OutputDescription,
    ParameterDescription,
    PropertyDescription,
    TypeDescription,
)
from pydantic import BaseModel
from web_api_support import RISK_TEMPLATE_ID, SERIES, registry_with_methods

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
    assert set(answer) == {"types", "data_types", "templates", "template_texts", "functions"}
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


def test_every_type_of_the_library_has_a_group_and_an_explanation_in_both_languages(
    client: TestClient,
) -> None:
    """Acceptance criterion 3: all types with group and explanation in both languages."""
    types = fetch(client)["types"]
    assert isinstance(types, list)
    groups = {item["group"] for item in types}
    assert groups - {None} == {
        "flow",
        "calculation",
        "indicators",
        "trends",
        "market",
        "account",
        "actions",
        "rules",
    }
    for item in types:
        if item["group"] is not None:
            assert item["explanation"]["de"].strip(), item["id"]
            assert item["explanation"]["en"].strip(), item["id"]
        for part in item["parameters"] + item["properties"] + item["outputs"]:
            assert set(part["explanation"]) == {"de", "en"}


_PROGRAMMING = re.compile(r"[A-Za-z0-9]_[A-Za-z0-9]|[a-z][A-Z]|[a-z0-9]\.[a-z]")


def _texts(value: object) -> list[str]:
    """The names, labels and explanations of a type: every text under a key ``de`` or ``en``."""
    found: list[str] = []
    if isinstance(value, dict):
        for key, item in value.items():
            if key in ("de", "en") and isinstance(item, str):
                found.append(item)
            else:
                found.extend(_texts(item))
    elif isinstance(value, list):
        for item in value:
            found.extend(_texts(item))
    return found


def test_no_name_label_or_explanation_contains_an_identifier_in_programming_spelling(
    client: TestClient,
) -> None:
    """Acceptance criterion 3 (specification 5.2: the user sees the language of a trader)."""
    answer = fetch(client)
    texts = _texts(answer["types"]) + _texts(answer["functions"]) + _texts(answer["template_texts"])
    assert len(texts) > 500
    # the names of two products are written with a capital letter inside the word
    offending = [
        text
        for text in texts
        if _PROGRAMMING.search(text.replace("ZigZag", "Zickzack").replace("MetaTrader", "Meta"))
    ]
    assert offending == []


def test_no_text_of_the_answer_uses_the_short_form_management_or_a_crossing(
    client: TestClient,
) -> None:
    """Mangel E1: "Order- und Positionsverwaltung", English "order and position management",
    no short form, also within a sentence; Mangel E12: no crossing as a building block."""
    answer = fetch(client)
    texts = _texts(answer["types"]) + _texts(answer["functions"]) + _texts(answer["template_texts"])
    full = 0
    for text in texts:
        rest = text.replace("Order- und Positionsverwaltung", "").replace(
            "order and position management", ""
        )
        assert "erwaltung" not in rest and "anagement" not in rest, text
        assert "Kreuzung" not in text and "crossing" not in text.lower(), text
        full += rest != text
    assert full >= 4
    names = [item["label"]["de"] for item in answer["functions"]]  # type: ignore[attr-defined]
    assert "Kreuzung" not in names
    assert "vorheriger Wert von" in names


def test_the_types_are_the_descriptions_of_the_library_without_loss(client: TestClient) -> None:
    types = {item["id"]: item for item in fetch(client)["types"]}  # type: ignore[attr-defined]
    for description in default_registry().list():
        item = types[description.id]
        expected = dataclasses.asdict(description)
        # the answer is the description as JSON: tuples become lists, enumerations their value;
        # the word for the data type of each field is added to it (tested below)
        assert _without_words(item) == _as_json(expected), description.id


def _as_json(value: object) -> object:
    if isinstance(value, dict):
        return {key: _as_json(item) for key, item in value.items()}
    if isinstance(value, tuple | list):
        return [_as_json(item) for item in value]
    return value


def _without_words(value: object) -> object:
    """The answer without the ``datatype_label`` of the fields."""
    if isinstance(value, dict):
        return {key: _without_words(item) for key, item in value.items() if key != "datatype_label"}
    if isinstance(value, list):
        return [_without_words(item) for item in value]
    return value


def test_every_field_names_the_word_for_its_data_type_in_both_languages(
    client: TestClient,
) -> None:
    """Mangel E11: the words for the data types come from the library; for an object it is the
    name of the object type."""
    answer = fetch(client)
    registry = default_registry()
    types = {item["id"]: item for item in answer["types"]}  # type: ignore[attr-defined]
    for description in registry.list():
        item = types[description.id]
        for group in ("parameters", "properties"):
            for source, shown in zip(getattr(description, group), item[group], strict=True):
                expected = registry.datatype_label(source.datatype, source.object_type)
                assert shown["datatype_label"] == {"de": expected.de, "en": expected.en}, (
                    description.id,
                    source.id,
                )
    candle = types["trigger.candle_close"]["parameters"]
    assert {item["id"]: item["datatype_label"] for item in candle} == {
        "instrument": {"de": "Instrument", "en": "Instrument"},
        "zeiteinheit": {"de": "Zeiteinheit", "en": "time unit"},
    }
    ema = {item["id"]: item["datatype_label"] for item in types["EMA"]["parameters"]}
    assert ema["periode"] == {"de": "ganze Zahl", "en": "whole number"}
    assert ema["anwenden_auf"] == {"de": "Auswahl", "en": "choice"}
    order = {item["id"]: item["datatype_label"] for item in types["StopOrder"]["properties"]}
    assert order["konto"] == {"de": "Konto", "en": "Account"}
    assert order["instrument"] == {"de": "Instrument", "en": "Instrument"}
    assert order["ablaufzeit"] == {"de": "Zeitpunkt", "en": "point in time"}
    assert order["volumen"] == {"de": "Zahl", "en": "number"}


def test_the_answer_lists_the_word_of_every_data_type(client: TestClient) -> None:
    listed = fetch(client)["data_types"]
    assert isinstance(listed, list)
    assert [item["id"] for item in listed] == [item.value for item in DataType]
    for item in listed:
        expected = DATATYPE_LABELS[DataType(item["id"])]
        assert item["label"] == {"de": expected.de, "en": expected.en}
        assert item["label"]["de"] and item["label"]["en"]
    words = {item["id"]: item["label"] for item in listed}
    assert words["integer"] == {"de": "ganze Zahl", "en": "whole number"}
    assert words["expression"] == {"de": "Formel", "en": "formula"}


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
        "trigger.manual",
        "flow.condition",
        "flow.place_order",
        "MarketOrder",
        "CloseOrder",
        "Konto",
        "Instrument",
        "Kerze",
        "EMA",
        "ATR",
        "ZigZag",
        "Indikator",
        "Trend",
        "Regel",
        "Regelwerk",
    ):
        assert identifier in types, identifier
    assert types["trigger.candle_close"]["name"] == {"de": "Kerzenschluss", "en": "Candle close"}
    assert types["trigger.manual"]["name"] == {"de": "Manuell", "en": "Manual"}
    # withdrawn or renamed: not delivered any more (specification 3.2)
    for identifier in ("Markttechnik", "flow.set_parameter", "trigger.manual_start"):
        assert identifier not in types, identifier


def test_the_groups_methods_and_refresh_indication_of_every_type(client: TestClient) -> None:
    """Order 09 point 6: the answer carries the groups, ``methods`` and ``can_refresh``."""
    types = {item["id"]: item for item in fetch(client)["types"]}  # type: ignore[attr-defined]
    assert {
        identifier: item["group"] for identifier, item in types.items() if item["group"] is not None
    } == {
        "trigger.candle_close": "flow",
        "trigger.tick": "flow",
        "trigger.manual": "flow",
        "flow.condition": "flow",
        "flow.calculation": "calculation",
        "flow.place_order": "actions",
        "flow.modify_order": "actions",
        "flow.delete_order": "actions",
        "flow.modify_position": "actions",
        "flow.close_position": "actions",
        "Konto": "account",
        "Instrument": "market",
        "Kerze": "market",
        "Tick": "market",
        "EMA": "indicators",
        "ATR": "indicators",
        "ZigZag": "indicators",
        "Indikator": "indicators",
        "Trend": "trends",
        "Regel": "rules",
        "Regelwerk": "rules",
    }
    # "Tick" stands twice: the trigger and the object are two types
    assert (types["trigger.tick"]["kind"], types["Tick"]["kind"]) == (
        "trigger",
        "application_object",
    )
    assert all(item["methods"] == [] for item in types.values())
    refresh = {identifier for identifier, item in types.items() if item["can_refresh"]}
    assert refresh == {
        "EMA",
        "ATR",
        "ZigZag",
        "Indikator",
        "Trend",
        "Konto",
        "Instrument",
        "Kerze",
        "Tick",
    }
    zigzag = [item["id"] for item in types["ZigZag"]["properties"]]
    assert zigzag[:4] == ["letztes_hoch", "vorletztes_hoch", "letztes_tief", "vorletztes_tief"]


def test_a_type_with_methods_is_answered_with_all_fields_of_its_methods(tmp_path: Path) -> None:
    client = TestClient(
        create_app(f"sqlite:///{tmp_path / 'studio.db'}", registry=registry_with_methods())
    )
    types = {item["id"]: item for item in fetch(client)["types"]}  # type: ignore[attr-defined]
    series = types[SERIES]
    assert series["can_refresh"] is True
    assert [item["id"] for item in series["methods"]] == ["wert_vor", "tendenz"]
    method = series["methods"][0]
    assert set(method) == {
        "id",
        "datatype",
        "datatype_label",
        "label",
        "arguments",
        "choices",
        "object_type",
        "explanation",
    }
    assert (method["datatype"], method["label"]) == (
        "number",
        {"de": "Wert vor", "en": "Value before"},
    )
    assert method["explanation"] == {
        "de": "Der Wert vor einer Anzahl Werten.",
        "en": "The value before a number of values.",
    }
    first, second = method["arguments"]
    assert set(first) == {
        "id",
        "datatype",
        "datatype_label",
        "label",
        "required",
        "default",
        "choices",
        "object_type",
        "explanation",
    }
    assert (first["id"], first["datatype"], first["required"], first["default"]) == (
        "anzahl",
        "integer",
        True,
        None,
    )
    assert (second["required"], second["default"], second["datatype"]) == (
        False,
        "schluss",
        "choice",
    )
    assert [item["id"] for item in second["choices"]] == ["schluss", "eroeffnung"]
    assert second["choices"][1]["label"] == {"de": "Eröffnungskurs", "en": "open price"}
    tendency = series["methods"][1]
    assert tendency["datatype"] == "choice" and tendency["arguments"] == []
    assert [item["id"] for item in tendency["choices"]] == ["aufwaerts", "abwaerts"]
    # the delivered types are answered unchanged
    assert types["EMA"]["methods"] == [] and types["EMA"]["can_refresh"] is True


def test_the_delivered_template_risk_per_trade_has_the_expression_of_the_specification(
    client: TestClient,
) -> None:
    templates = fetch(client)["templates"]
    assert isinstance(templates, list)
    assert [item["id"] for item in templates] == [RISK_TEMPLATE_ID]
    template = templates[0]
    assert RISK_TEMPLATE_ID == RISK_PER_TRADE_RULE_ID
    assert template["format"] == "pipwerk.rule"
    assert template["name"] == "Risiko je Trade"
    assert template["format_version"] == "2.0"
    assert template["object_type"] == "Regel"
    assert template["expression"] == RISK_PER_TRADE_EXPRESSION
    assert template["determined_property"] == "volumen"
    assert template["comparison"] == "hoechstens"
    assert template["parameters"] == [
        {
            "key": "risikogrenze",
            "name": "Risikogrenze",
            "datatype": "percent",
            "object_type": None,
            "required": True,
            "default": 0.01,
            "choices": [],
        }
    ]
    assert "IF(ISNA(Position.volumen);" in template["expression"]
    assert "FLOOR(" in template["expression"]


def test_the_delivered_template_has_its_name_and_explanation_in_both_languages(
    client: TestClient,
) -> None:
    texts = fetch(client)["template_texts"]
    assert texts == [
        {
            "id": RISK_TEMPLATE_ID,
            "name": {"de": "Risiko je Trade", "en": "Risk per trade"},
            "explanation": {
                "de": RISK_PER_TRADE_EXPLANATION.de,
                "en": RISK_PER_TRADE_EXPLANATION.en,
            },
            "group": "rules",
        }
    ]


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
        assert item["label"] == {"de": signature.label.de, "en": signature.label.en}
        assert item["explanation"] == {
            "de": signature.explanation.de,
            "en": signature.explanation.en,
        }
        assert [part["name"] for part in item["parameters"]] == [
            part.name for part in signature.parameters
        ]
        for part, parameter in zip(item["parameters"], signature.parameters, strict=True):
            assert part["label"] == {"de": parameter.label.de, "en": parameter.label.en}
            assert part["explanation"] == {
                "de": parameter.explanation.de,
                "en": parameter.explanation.en,
            }
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
        (web_api.ArgumentModel, ArgumentDescription),
        (web_api.MethodModel, MethodDescription),
        (web_api.TypeDescriptionModel, TypeDescription),
    ]
    with_word = {
        web_api.ParameterModel,
        web_api.PropertyModel,
        web_api.ArgumentModel,
        web_api.MethodModel,
    }
    for model, source in pairs:
        fields = [item.name for item in dataclasses.fields(source)]
        if model in with_word:  # the word for the data type stands right after the data type
            fields.insert(fields.index("datatype") + 1, "datatype_label")
        assert list(model.model_fields) == fields, source.__name__
    assert list(web_api.FunctionModel.model_fields) == [
        "name",
        "parameters",
        "variadic",
        "result",
        "label",
        "explanation",
        "min_arguments",
        "max_arguments",
    ]
    assert list(web_api.FunctionParameterModel.model_fields) == [
        item.name for item in dataclasses.fields(FunctionParameter)
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
