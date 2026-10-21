"""Reading the format 1.0 (specification 3.7, E9): the test cases and examples of 1.0 and the
strategy "EMA-Trendfolge" of the client are read and converted to the format 2.0."""

import copy
import json
from pathlib import Path
from typing import Any

import pytest

from pipwerk_domain import catalog
from pipwerk_domain.consistency import Level, check_strategy, check_template
from pipwerk_domain.documents import (
    DocumentError,
    IndicatorDocument,
    StrategyDocument,
    parse_document,
    read_document,
    write_document,
)
from pipwerk_domain.model import Binding, Strategy, Template
from pipwerk_domain.risk_rule import RISK_PER_TRADE_RULE_ID
from pipwerk_domain.typedesc import BindingKind
from tests.paths import (
    EMA_TRENDFOLGE,
    EXAMPLE_DIRECTORY_V1,
    SCHEMA_DIRECTORY_V1,
    TESTCASE_DIRECTORY,
    TESTCASE_DIRECTORY_V1,
)

V1_STRATEGIES = sorted(
    [
        *TESTCASE_DIRECTORY_V1.glob("*.strategy.json"),
        *EXAMPLE_DIRECTORY_V1.glob("*.strategy.json"),
        EMA_TRENDFOLGE,
    ]
)
V1_TEMPLATES = sorted(EXAMPLE_DIRECTORY_V1.glob("*.rule.json"))


def load_dict(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))  # type: ignore[no-any-return]


def v1_strategy(**changes: Any) -> dict[str, Any]:
    data: dict[str, Any] = {
        "format": "pipwerk.strategy",
        "format_version": "1.0",
        "id": "00000000-0000-4000-8000-000000000001",
        "title": "t",
    }
    data.update(changes)
    return data


def read(data: dict[str, Any]) -> Strategy:
    value = read_document(json.dumps(data))
    assert isinstance(value, Strategy)
    return value


def test_the_files_of_the_format_one_are_kept_as_test_data() -> None:
    assert len(V1_STRATEGIES) == 10
    assert len(V1_TEMPLATES) == 2
    for path in V1_STRATEGIES + V1_TEMPLATES:
        assert load_dict(path)["format_version"] == "1.0", path.name
    assert (SCHEMA_DIRECTORY_V1 / "strategy.schema.json").is_file()


@pytest.mark.parametrize("path", V1_STRATEGIES, ids=lambda path: path.name)
def test_every_strategy_of_the_format_one_is_read_and_written_as_two(path: Path) -> None:
    document = parse_document(path.read_bytes())
    assert isinstance(document, StrategyDocument)
    assert document.format_version == "2.0"
    value = read_document(path.read_bytes())
    assert isinstance(value, Strategy)
    text = write_document(value)
    assert json.loads(text)["format_version"] == "2.0"
    assert read_document(text) == value  # writing and reading again gives the same object
    assert write_document(read_document(text)) == text


@pytest.mark.parametrize("path", V1_TEMPLATES, ids=lambda path: path.name)
def test_a_template_of_the_format_one_is_converted(path: Path) -> None:
    value = read_document(path.read_bytes())
    assert isinstance(value, Template)
    assert json.loads(write_document(value))["format_version"] == "2.0"
    assert check_template(value) == []


@pytest.mark.parametrize("name", ["str-01", "str-03"])
def test_the_converted_testcases_have_no_error(name: str) -> None:
    value = read_document((TESTCASE_DIRECTORY_V1 / f"{name}.strategy.json").read_bytes())
    assert isinstance(value, Strategy)
    assert check_strategy(value) == []


def test_the_converted_testcases_mean_the_same_as_the_ones_of_the_format_two() -> None:
    """The expressions of the conversion are those of the testcases in 2.0, except where the
    specification changed them: the rules use the instrument of the order."""
    for name in ("str-01", "str-03"):
        old = read_document((TESTCASE_DIRECTORY_V1 / f"{name}.strategy.json").read_bytes())
        new = read_document((TESTCASE_DIRECTORY / f"{name}.strategy.json").read_bytes())
        assert isinstance(old, Strategy)
        assert isinstance(new, Strategy)
        assert old.id == new.id
        assert [item.id for item in old.elements] == [item.id for item in new.elements]
        assert [(item.source, item.output, item.target) for item in old.connections] == [
            (item.source, item.output, item.target) for item in new.connections
        ]
        for before, after in zip(old.elements, new.elements, strict=True):
            for key, binding in before.parameters.items():
                if binding.kind is BindingKind.EXPRESSION:
                    assert after.parameters[key].value == binding.value, key
            assert before.key == after.key


# the strategy of the client ---------------------------------------------------------------------


@pytest.fixture(scope="module")
def ema_trendfolge() -> Strategy:
    value = read_document(EMA_TRENDFOLGE.read_bytes())
    assert isinstance(value, Strategy)
    return value


def test_the_strategy_of_the_client_has_no_error_after_the_conversion(
    ema_trendfolge: Strategy,
) -> None:
    findings = check_strategy(ema_trendfolge)
    assert [item for item in findings if item.level is Level.ERROR] == []


def test_the_names_of_the_strategy_of_the_client(ema_trendfolge: Strategy) -> None:
    """Specification 3.7 and 10 point 18: names in programming spelling get spaces and a capital,
    names such as "EMA20" stay."""
    strategy = ema_trendfolge
    assert strategy.name == "EMA-Trendfolge"
    assert [(item.key, item.name) for item in strategy.parameters] == [
        ("zeiteinheit", "zeiteinheit"),
        ("stop_abstand", "Stop abstand"),
    ]
    instances = {
        item.instance.key: item.instance.name for item in strategy.elements if item.instance
    }
    assert instances == {"ema20": "EMA20", "ema50": "EMA50", "atr14": "ATR14"}
    named = {item.key: item.name for item in strategy.elements if item.key}
    assert named == {
        "kreuzen": "Kreuzen",
        "richtung": "Richtung",
        "stop": "StopLoss",
        "order_ausgefuehrt": "Order ausgefuehrt",
        "kreuzen_gegen_die_position": "Kreuzen gegen die position",
        "stop_neu": "Neuer Stop-Loss",
        "stop_loss_verbessert": "StopLossVerbessert",
    }
    assert [(item.key, item.name) for item in strategy.rules] == [
        ("risiko_je_trade", "Risiko je trade")
    ]
    assert [item.name for item in strategy.elements[7].rules] == ["mindestvolumen"]
    assert [item.key for item in strategy.elements[7].rules] == ["mindestvolumen"]


def test_the_strategy_of_the_client_means_the_same(ema_trendfolge: Strategy) -> None:
    """Every expression is unchanged, so its meaning is the same (no key was changed)."""
    original = load_dict(EMA_TRENDFOLGE)
    for before, after in zip(original["elements"], ema_trendfolge.elements, strict=True):
        assert before["id"] == after.id
        assert before["management_of"] == after.management_of
        for key, binding in before["parameters"].items():
            assert after.parameters[key].value == binding.get("value"), key
            assert after.parameters[key].kind.value == binding["kind"], key
        for key, binding in before["properties"].items():
            assert after.properties[key].value == binding.get("value"), key
    assert [
        (item["source"], item["output"], item["target"]) for item in original["connections"]
    ] == [(item.source, item.output, item.target) for item in ema_trendfolge.connections]
    old_rule = original["rules"][0]
    assert ema_trendfolge.rules[0].expression == old_rule["expression"]


def test_the_rest_of_the_conversion(ema_trendfolge: Strategy) -> None:
    strategy = ema_trendfolge
    assert all(item.position is None for item in strategy.elements)  # the position is dropped
    assert all(item.inputs == [] for item in strategy.elements)
    assert strategy.sections == []
    assert strategy.orientation.value == "vertical"
    assert strategy.collapsed_managements == []
    assert len(strategy.connections) == 10  # the management has a trigger of its own
    assert len({item.id for item in strategy.connections}) == 10
    # the origin of a delivered template is its identifier only
    risk = strategy.rules[0]
    assert risk.origin is not None
    assert (risk.origin.template_id, risk.origin.template_name) == (RISK_PER_TRADE_RULE_ID, None)
    ema = strategy.elements[0].instance
    assert ema is not None
    # `Kursquelle` of the EMA is `Anwenden auf`
    assert "kursquelle" not in ema.parameter_values
    assert ema.parameter_values["anwenden_auf"] == Binding(BindingKind.FIXED, "schlusskurs")
    # the instrument has the preset "Instrument der Anwendung"
    assert ema.parameter_values["instrument"] == Binding(
        BindingKind.FIXED, "instrument_der_anwendung"
    )
    trigger = strategy.elements[3]
    assert trigger.parameters["instrument"] == Binding(
        BindingKind.FIXED, "instrument_der_anwendung"
    )
    order = strategy.elements[7]
    assert order.properties["instrument"] == Binding(BindingKind.FIXED, "instrument_der_anwendung")
    # an element with an instance has no preset at the element
    assert strategy.elements[0].parameters == {}


def test_an_unchanged_file_is_not_touched_by_reading() -> None:
    """A file of the format 1.0 stays as it is until it is saved (specification 4.1)."""
    before = EMA_TRENDFOLGE.read_bytes()
    read_document(before)
    assert EMA_TRENDFOLGE.read_bytes() == before


# keys that collide with objects of the application or functions -----------------------------------


def test_a_name_that_equals_an_object_of_the_application_gets_a_new_key_and_the_same_meaning() -> (
    None
):
    element: dict[str, Any] = {
        "id": "00000000-0000-4000-8000-000000000002",
        "type": "EMA",
        "title": "Meine Kerze",
        "name": None,
        "x": 0,
        "y": 0,
        "parameters": {},
        "properties": {},
        "rules": [],
        "management_of": None,
        "instance": {
            "name": "kerze",
            "object_type": "EMA",
            "parameter_values": {
                "zeiteinheit": {"kind": "fixed", "value": "h1"},
                "periode": {"kind": "expression", "value": "kerze.wert + Kerze.schluss"},
            },
        },
    }
    other = {
        "id": "00000000-0000-4000-8000-000000000003",
        "type": "flow.calculation",
        "title": "Rechnung",
        "name": "rechnung",
        "parameters": {"ausdruck": {"kind": "expression", "value": "kerze.wert * 2 + IF(1;2;3)"}},
    }
    value = read(v1_strategy(elements=[element, other]))
    instance = value.elements[0].instance
    assert instance is not None
    assert (instance.name, instance.key) == ("Meine Kerze", "kerze_2")
    # in 1.0 the name hid the object of the application: `kerze.wert` was the instance
    assert value.elements[1].parameters["ausdruck"].value == "kerze_2.wert * 2 + IF(1;2;3)"
    # also `Kerze.schluss`: upper and lower case were not distinguished, so it was the instance
    assert instance.parameter_values["periode"].value == "kerze_2.wert + kerze_2.schluss"


def test_a_name_that_equals_a_function_gets_a_new_key() -> None:
    rule = {"name": "if", "object_type": "Regel", "expression": "TRUE()"}
    value = read(v1_strategy(rules=[rule]))
    assert (value.rules[0].name, value.rules[0].key) == ("if", "if_2")


def test_a_name_that_is_no_key_gets_a_formed_key() -> None:
    parameter = {"name": "Größe", "datatype": "number", "value": 1}
    rule = {"name": "mit Blank", "object_type": "Regel", "expression": "TRUE()"}
    value = read(v1_strategy(parameters=[parameter], rules=[rule]))
    assert (value.parameters[0].key, value.parameters[0].name) == ("groesse", "Größe")
    assert (value.rules[0].key, value.rules[0].name) == ("mit_blank", "mit Blank")


def test_a_condition_without_a_name_gets_a_key_from_its_designation() -> None:
    def condition(number: int, title: str) -> dict[str, Any]:
        return {
            "id": f"00000000-0000-4000-8000-00000000010{number}",
            "type": "flow.condition",
            "title": title,
            "name": None,
            "parameters": {"ausdruck": {"kind": "expression", "value": "TRUE()"}},
        }

    value = read(
        v1_strategy(elements=[condition(1, "Kreuzen"), condition(2, "kreuzen"), condition(3, "")])
    )
    assert [(item.key, item.name) for item in value.elements] == [
        ("kreuzen", "Kreuzen"),
        ("kreuzen_2", "kreuzen"),
        ("bedingung", None),
    ]


def test_a_calculation_without_a_designation_gets_the_fallback_key() -> None:
    element = {
        "id": "00000000-0000-4000-8000-000000000101",
        "type": "flow.calculation",
        "parameters": {"ausdruck": {"kind": "expression", "value": "1"}},
    }
    value = read(v1_strategy(elements=[element]))
    assert (value.elements[0].key, value.elements[0].name) == ("berechnung", None)


def test_the_origin_of_a_template_of_the_user_keeps_its_name() -> None:
    rule = {
        "name": "eigene",
        "object_type": "Regel",
        "origin": {
            "object_type": "Regel",
            "template_id": "00000000-0000-4000-8000-0000000000aa",
            "template_title": "Meine Regel",
        },
        "expression": "TRUE()",
    }
    delivered = {
        "name": "risiko",
        "object_type": "Regel",
        "origin": {
            "object_type": "Regel",
            "template_id": RISK_PER_TRADE_RULE_ID,
            "template_title": "Risiko je Trade",
        },
        "expression": "TRUE()",
    }
    value = read(v1_strategy(rules=[rule, delivered]))
    assert value.rules[0].origin is not None
    assert value.rules[0].origin.template_name == "Meine Regel"
    assert value.rules[1].origin is not None
    assert value.rules[1].origin.template_name is None


# a management without triggers of its own ---------------------------------------------------------


def management_strategy(*members: dict[str, Any]) -> dict[str, Any]:
    order = {
        "id": "00000000-0000-4000-8000-000000000201",
        "type": "flow.place_order",
        "title": "Order",
        "parameters": {"ordertyp": {"kind": "fixed", "value": "MarketOrder"}},
        "properties": {
            "richtung": {"kind": "fixed", "value": "buy"},
            "volumen": {"kind": "fixed", "value": 1},
        },
    }
    trigger = {
        "id": "00000000-0000-4000-8000-000000000200",
        "type": "trigger.candle_close",
        "title": "Kerzenschluss",
        "parameters": {"zeiteinheit": {"kind": "fixed", "value": "h1"}},
    }
    return v1_strategy(
        elements=[trigger, order, *members],
        connections=[
            {
                "source": trigger["id"],
                "output": "weiter",
                "target": order["id"],
            }
        ],
    )


def member(number: int, type_id: str = "flow.delete_order", **fields: Any) -> dict[str, Any]:
    return {
        "id": f"00000000-0000-4000-8000-00000000030{number}",
        "type": type_id,
        "title": "Schritt",
        "management_of": "00000000-0000-4000-8000-000000000201",
        **fields,
    }


def test_the_one_element_without_an_incoming_connection_gets_the_start_connection() -> None:
    data = management_strategy(member(1), member(2))
    data["connections"].append(
        {
            "source": member(1)["id"],
            "output": "weiter",
            "target": member(2)["id"],
        }
    )
    value = read(data)
    started = [item for item in value.connections if item.output == "gestellt"]
    assert [(item.source, item.target) for item in started] == [
        ("00000000-0000-4000-8000-000000000201", member(1)["id"])
    ]
    assert check_strategy(value) == []


def test_without_a_unique_first_element_no_connection_is_made_and_the_check_reports() -> None:
    value = read(management_strategy(member(1), member(2)))
    assert [item for item in value.connections if item.output == "gestellt"] == []
    unreached = [item for item in check_strategy(value) if item.code == "flow.not_reached"]
    assert sorted(item.element or "" for item in unreached) == [member(1)["id"], member(2)["id"]]


def test_a_management_with_a_trigger_of_its_own_gets_no_start_connection() -> None:
    trigger = member(
        1,
        "trigger.candle_close",
        parameters={"zeiteinheit": {"kind": "fixed", "value": "h1"}},
    )
    data = management_strategy(trigger, member(2))
    data["connections"].append(
        {"source": trigger["id"], "output": "weiter", "target": member(2)["id"]}
    )
    value = read(data)
    assert [item for item in value.connections if item.output == "gestellt"] == []
    assert check_strategy(value) == []


def test_the_connections_get_the_same_identifiers_each_time() -> None:
    first = read(management_strategy(member(1)))
    second = read(management_strategy(member(1)))
    assert [item.id for item in first.connections] == [item.id for item in second.connections]
    assert len({item.id for item in first.connections}) == len(first.connections)


# unknown types and what stays --------------------------------------------------------------------


def test_an_element_of_an_unknown_type_keeps_all_its_values() -> None:
    element = {
        "id": "00000000-0000-4000-8000-000000000401",
        "type": "ext.neu",
        "title": "fremder_schritt",
        "name": "x",
        "x": 3,
        "y": 4,
        "parameters": {
            "a": {"kind": "fixed", "value": "text"},
            "b": {"kind": "expression", "value": "Order.volumen + 1"},
            "c": {"kind": "parameter", "value": "p"},
            "d": {"kind": "application"},
        },
        "properties": {"e": {"kind": "fixed", "value": 5}},
        "rules": [],
    }
    value = read(v1_strategy(elements=[element]))
    converted = value.elements[0]
    assert converted.type == "ext.neu"
    assert converted.name == "Fremder schritt"
    assert converted.parameters == {
        "a": Binding(BindingKind.FIXED, "text"),
        "b": Binding(BindingKind.EXPRESSION, "Order.volumen + 1"),
        "c": Binding(BindingKind.PARAMETER, "p"),
        "d": Binding(BindingKind.APPLICATION),
    }
    assert converted.properties == {"e": Binding(BindingKind.FIXED, 5)}
    assert "instrument" not in converted.parameters
    assert read_document(write_document(value)) == value


def test_an_instance_of_an_unknown_object_type_keeps_all_its_values() -> None:
    element = {
        "id": "00000000-0000-4000-8000-000000000402",
        "type": "Fremd",
        "title": "Fremder Indikator",
        "instance": {
            "name": "fremd",
            "object_type": "Fremd",
            "parameter_values": {"a": {"kind": "fixed", "value": 1}},
        },
    }
    value = read(v1_strategy(elements=[element]))
    instance = value.elements[0].instance
    assert instance is not None
    assert instance.parameter_values == {"a": Binding(BindingKind.FIXED, 1)}
    assert any(item.code == "type.unknown" for item in check_strategy(value))


# invalid documents of the format 1.0 --------------------------------------------------------------


@pytest.mark.parametrize(
    "change",
    [
        {"extra": 1},
        {"elements": [{"id": "x", "type": "a"}]},
        {"parameters": [{"name": "a"}]},
        {"title": 5},
        {"format_version": "1.0.1"},
    ],
)
def test_a_document_of_the_format_one_that_does_not_fit_is_rejected(change: dict[str, Any]) -> None:
    with pytest.raises(DocumentError):
        parse_document(v1_strategy(**change))


def test_the_format_two_fields_are_not_accepted_in_a_document_of_the_format_one() -> None:
    with pytest.raises(DocumentError):
        parse_document(v1_strategy(sections=[]))
    with pytest.raises(DocumentError):
        parse_document(v1_strategy(name="x"))


def test_a_document_of_the_format_one_with_a_name_that_is_too_long_is_rejected() -> None:
    with pytest.raises(DocumentError):
        parse_document(v1_strategy(title="n" * 201))


def test_the_template_of_the_format_one_becomes_a_document_of_the_format_two() -> None:
    document = parse_document((EXAMPLE_DIRECTORY_V1 / "regel-vorlage.rule.json").read_bytes())
    assert document.format_version == "2.0"
    assert not isinstance(document, IndicatorDocument)
    assert document.name == "Mindestvolumen"


def test_a_converted_copy_does_not_change_the_input() -> None:
    data = load_dict(EMA_TRENDFOLGE)
    before = copy.deepcopy(data)
    parse_document(data)
    assert data == before
    assert catalog.FLOW_CONDITION == "flow.condition"
