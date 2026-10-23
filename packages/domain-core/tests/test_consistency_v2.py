"""Findings of the consistency check that came with the format 2.0 (specification 3.1, 3.3, 3.6),
each with a counter sample: instruments, data connections, inputs, empty places, arguments of
``PREVIOUS``, unlawful connections, sections and names against the objects of the application."""

from typing import Any

import pytest

from pipwerk_domain import catalog
from pipwerk_domain.consistency import Finding, Level, check_with_contexts
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.model import (
    Binding,
    Connection,
    DataLink,
    ElementInput,
    Instance,
    Section,
    Strategy,
    StrategyParameter,
)
from pipwerk_domain.pointers import below, pointer
from pipwerk_domain.typedesc import BindingKind, DataType
from tests.helpers import (
    calculation,
    check,
    codes,
    condition,
    connect,
    element,
    ema,
    expr,
    fixed,
    only,
    place_order,
    rule,
    trigger,
    uid,
    valid_strategy,
)


def with_ema(**changes: Any) -> Strategy:
    """The smallest strategy plus an instance ``ema20`` on the drawing area."""
    strategy = valid_strategy()
    strategy.elements.append(element(10, "EMA", instance=ema("ema20")))
    for key, value in changes.items():
        setattr(strategy, key, value)
    return strategy


def with_condition(text: str, inputs: list[ElementInput] | None = None) -> Strategy:
    strategy = with_ema()
    strategy.elements.insert(1, condition(5, text, inputs=inputs or []))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 2)]
    return strategy


# --- fixed instruments ---


def trigger_with_instrument(value: object) -> Strategy:
    strategy = valid_strategy()
    strategy.elements[0].parameters["instrument"] = fixed(value)  # type: ignore[arg-type]
    return strategy


@pytest.mark.parametrize("text", ["instrument_der_anwendung", "EURUSD", "eurusd", "US0378331005"])
def test_a_valid_fixed_instrument_has_no_finding(text: str) -> None:
    assert check(trigger_with_instrument(text)) == []


@pytest.mark.parametrize("text", ["EUR/USD", "EURABC", "US0378331006", "", "Apple", "EUR USD"])
def test_an_invalid_fixed_instrument_is_an_error(text: str) -> None:
    found = only(check(trigger_with_instrument(text)), fc.INSTRUMENT_INVALID)
    assert [item.element for item in found] == [uid(1)]
    assert found[0].level is Level.ERROR
    assert found[0].details["parameter"] == "instrument"
    assert found[0].details["value"] == text


def test_a_number_as_instrument_is_a_type_error() -> None:
    found = only(check(trigger_with_instrument(5)), fc.PARAMETER_BINDING_INVALID)
    assert found[0].details["reason"] == "type"


def test_the_instrument_of_the_order_is_checked_too() -> None:
    strategy = valid_strategy()
    strategy.elements[1].properties["instrument"] = fixed("QQQ")
    found = only(check(strategy), fc.INSTRUMENT_INVALID)
    assert found[0].details["property"] == "instrument"
    strategy.elements[1].properties["instrument"] = fixed("GBPJPY")
    assert check(strategy) == []


def test_the_instrument_of_an_instance_is_checked() -> None:
    strategy = with_ema()
    strategy.elements[-1].instance.parameter_values["instrument"] = fixed("nope")  # type: ignore[union-attr]
    found = only(check(strategy), fc.INSTRUMENT_INVALID)
    assert found[0].element == uid(10)
    assert found[0].subject == "ema20"


def test_a_strategy_parameter_of_the_kind_instrument() -> None:
    def strategy_with_value(value: str | None, *, at_application: bool = False) -> Strategy:
        strategy = valid_strategy()
        strategy.parameters = [
            StrategyParameter(
                "Filter",
                DataType.OBJECT,
                value,
                at_application=at_application,
                object_type="Instrument",
            )
        ]
        return strategy

    assert check(strategy_with_value("EURUSD")) == []
    assert check(strategy_with_value(None, at_application=True)) == []
    found = only(check(strategy_with_value("EUR")), fc.INSTRUMENT_INVALID)
    assert found[0].details["scope"] == "strategy"
    assert found[0].subject == "filter"


def test_the_instrument_can_be_a_strategy_parameter_of_the_same_kind() -> None:
    strategy = valid_strategy()
    strategy.parameters = [
        StrategyParameter("Filter", DataType.OBJECT, "GBPUSD", object_type="Instrument"),
        StrategyParameter("Zahl", DataType.NUMBER, 1),
    ]
    strategy.elements[0].parameters["instrument"] = Binding(BindingKind.PARAMETER, "filter")
    assert check(strategy) == []
    strategy.elements[0].parameters["instrument"] = Binding(BindingKind.PARAMETER, "zahl")
    assert only(check(strategy), fc.PARAMETER_BINDING_INVALID)[0].details["reason"] == "type"


def test_a_fixed_text_in_an_expression_in_the_place_of_an_instrument() -> None:
    strategy = valid_strategy()
    strategy.elements[0].parameters["instrument"] = expr('"EURUSD"')
    assert check(strategy) == []
    strategy.elements[0].parameters["instrument"] = expr('"EUR-USD"')
    found = only(check(strategy), fc.INSTRUMENT_INVALID)
    assert found[0].details["values"] == ["EUR-USD"]
    assert (found[0].details["start"], found[0].details["end"]) == (0, 9)
    strategy.elements[0].parameters["instrument"] = expr('IF(TRUE(); "EURUSD"; "XXXX")')
    found = only(check(strategy), fc.INSTRUMENT_INVALID)
    assert (found[0].details["start"], found[0].details["end"]) == (21, 27)
    strategy.elements[0].parameters["instrument"] = expr("1 + 1")
    assert only(check(strategy), fc.EXPRESSION_INVALID)[0].details["issue"] == "type_mismatch"


def test_a_text_that_arises_only_at_the_execution_is_checked_there() -> None:
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("Text", DataType.TEXT, "abc")]
    strategy.elements[0].parameters["instrument"] = expr("Strategie.text")
    assert check(strategy) == []


def test_instrument_kerze_and_tick_without_instance_need_no_instrument() -> None:
    """The instrument is the one of the context: no finding about it (specification 3.1)."""
    strategy = with_condition("Instrument.pip + Tick.geld + Kerze.schluss > 1")
    assert check(strategy) == []


def test_the_instrument_of_the_order_in_a_rule_is_known() -> None:
    strategy = valid_strategy()
    strategy.rules.append(rule("r", "Order.instrument.pip > 0"))
    assert check(strategy) == []
    strategy.rules.append(rule("s", "Order.instrument.gibtsnicht > 0"))
    assert only(check(strategy), fc.EXPRESSION_INVALID)[0].details["issue"] == "unknown_property"


# --- data connections ---


def with_binding(binding: Binding, name: str = "zeiteinheit") -> Strategy:
    strategy = with_ema()
    strategy.elements[0].parameters[name] = binding
    return strategy


def test_a_data_connection_to_an_existing_property_of_a_fitting_type() -> None:
    link = Binding(BindingKind.CONNECTION, DataLink("ema20", "wert"))
    strategy = with_ema()
    strategy.elements.append(
        element(
            11,
            "EMA",
            instance=ema("ema50", 50).__class__(
                name="ema50",
                key="ema50",
                object_type="EMA",
                parameter_values={
                    "zeiteinheit": fixed("h1"),
                    "periode": Binding(BindingKind.CONNECTION, DataLink("ema20", "wert")),
                },
            ),
        )
    )
    del link
    # a number property to an integer parameter: both are numbers
    assert check(strategy) == []


def test_a_data_connection_to_a_missing_instance_or_property() -> None:
    cases = {
        "unknown_instance": DataLink("nope", "wert"),
        "unknown_property": DataLink("ema20", "nope"),
    }
    for reason, link in cases.items():
        strategy = with_ema()
        strategy.elements[-1].instance.parameter_values["periode"] = Binding(  # type: ignore[union-attr]
            BindingKind.CONNECTION, link
        )
        found = only(check(strategy), fc.DATA_UNKNOWN)
        assert [item.details["reason"] for item in found] == [reason]
        assert found[0].details["where"] == "binding"
        assert (found[0].details["target"], found[0].details["target_kind"]) == (
            "periode",
            "parameter",
        )
        assert found[0].subject == "ema20"


def test_a_data_connection_between_unfitting_types() -> None:
    strategy = with_ema()
    strategy.elements.append(
        element(
            11,
            "ZigZag",
            instance=Instance(
                name="mt",
                key="mt",
                object_type="ZigZag",
                parameter_values={
                    "zeiteinheit": fixed("h1"),
                    "depth": Binding(BindingKind.CONNECTION, DataLink("ema20", "wert")),
                },
            ),
        )
    )
    assert check(strategy) == []  # a number into an integer
    strategy.elements[-1].instance.parameter_values["zeiteinheit"] = Binding(  # type: ignore[union-attr]
        BindingKind.CONNECTION, DataLink("ema20", "wert")
    )
    found = only(check(strategy), fc.DATA_TYPE_MISMATCH)
    assert found[0].details["target"] == "zeiteinheit"
    assert found[0].details["expected"] == "time_unit"
    assert found[0].details["found"] == "number"


def test_a_data_connection_of_an_element_to_the_instance() -> None:
    strategy = with_ema()
    strategy.elements[1].properties["stop_loss"] = Binding(
        BindingKind.CONNECTION, DataLink("ema20", "wert")
    )
    assert check(strategy) == []
    strategy.elements[1].properties["richtung"] = Binding(
        BindingKind.CONNECTION, DataLink("ema20", "wert")
    )
    found = only(check(strategy), fc.DATA_TYPE_MISMATCH)
    assert (found[0].element, found[0].details["target"]) == (uid(2), "richtung")
    assert found[0].details["target_kind"] == "property"


def test_a_data_connection_where_the_binding_kind_is_not_allowed() -> None:
    strategy = with_ema()
    strategy.elements.insert(1, condition(5, "TRUE()"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 2)]
    strategy.elements[1].parameters["ausdruck"] = Binding(
        BindingKind.CONNECTION, DataLink("ema20", "wert")
    )
    found = only(check(strategy), fc.PARAMETER_BINDING_INVALID)
    assert found[0].details["reason"] == "binding_kind"
    strategy.elements[0].parameters["zeiteinheit"] = fixed("h1")
    strategy.elements[2].parameters["ordertyp"] = Binding(
        BindingKind.CONNECTION, DataLink("ema20", "wert")
    )
    assert len(only(check(strategy), fc.PARAMETER_BINDING_INVALID)) == 2


def test_a_data_connection_to_a_contained_instance_of_a_template_is_found() -> None:
    from pipwerk_domain.consistency import check_template
    from tests.helpers import template

    inner = Instance(
        name="b",
        key="b",
        object_type="EMA",
        parameter_values={
            "zeiteinheit": fixed("h1"),
            "periode": Binding(BindingKind.CONNECTION, DataLink("a", "wert")),
        },
    )
    value = template(catalog.TYPE_INDICATOR, instances=[ema("a"), inner])
    assert check_template(value) == []
    inner.parameter_values["periode"] = Binding(BindingKind.CONNECTION, DataLink("c", "wert"))
    assert only(check_template(value), fc.DATA_UNKNOWN)


# --- inputs ---


def test_an_input_that_an_expression_uses_has_no_finding() -> None:
    strategy = with_condition("ema20.wert > 1", [ElementInput("ema20", "wert")])
    assert check(strategy) == []


def test_an_input_that_no_expression_uses_is_a_hint() -> None:
    strategy = with_condition("TRUE()", [ElementInput("ema20", "wert")])
    found = check(strategy)
    assert [(item.code, item.level, item.element) for item in found] == [
        (fc.INPUT_UNUSED, Level.HINT, uid(5))
    ]
    assert found[0].details == {"instance": "ema20", "property": "wert"}


def test_an_input_that_a_rule_of_the_element_uses() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(10, "EMA", instance=ema("ema20")))
    strategy.elements[1].inputs.append(ElementInput("ema20", "wert"))
    assert only(check(strategy), fc.INPUT_UNUSED)
    strategy.elements[1].rules.append(rule("r", "ema20.wert > 0"))
    assert only(check(strategy), fc.INPUT_UNUSED) == []


def test_an_input_that_a_data_connection_of_the_element_uses() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(10, "EMA", instance=ema("ema20")))
    strategy.elements[1].inputs.append(ElementInput("ema20", "wert"))
    strategy.elements[1].properties["stop_loss"] = Binding(
        BindingKind.CONNECTION, DataLink("ema20", "wert")
    )
    assert only(check(strategy), fc.INPUT_UNUSED) == []


def test_an_expression_of_another_element_does_not_use_the_input() -> None:
    strategy = with_condition("ema20.wert > 1", [])
    strategy.elements[2].inputs.append(ElementInput("ema20", "wert"))
    assert [item.element for item in only(check(strategy), fc.INPUT_UNUSED)] == [uid(2)]


def test_an_input_names_an_instance_and_property_that_exist() -> None:
    strategy = with_condition("TRUE()", [ElementInput("nope", "wert"), ElementInput("ema20", "x")])
    found = only(check(strategy), fc.DATA_UNKNOWN)
    assert [(item.details["where"], item.details["reason"]) for item in found] == [
        ("input", "unknown_instance"),
        ("input", "unknown_property"),
    ]
    assert only(check(strategy), fc.INPUT_UNUSED) == []  # nothing to use


def test_an_input_by_the_name_in_a_different_case() -> None:
    strategy = with_condition("EMA20.WERT > 1", [ElementInput("EMA20", "Wert")])
    assert check(strategy) == []


# --- empty places ---


def test_an_empty_place_in_an_expression_is_an_error() -> None:
    strategy = with_condition("[] > 1")
    found = only(check(strategy), fc.EXPRESSION_EMPTY)
    assert found[0].level is Level.ERROR
    assert found[0].details["reason"] == "slot"
    assert (found[0].details["start"], found[0].details["end"]) == (0, 2)
    assert only(check(strategy), fc.EXPRESSION_INVALID) == []
    two = with_condition("IF([]; 1; []) > 1")
    assert len(only(check(two), fc.EXPRESSION_EMPTY)) == 2


def test_an_empty_expression_is_an_error_of_its_own() -> None:
    for text in ("", "   ", "\n"):
        strategy = with_condition(text)
        found = only(check(strategy), fc.EXPRESSION_EMPTY)
        assert [item.details["reason"] for item in found] == ["missing"]
        assert only(check(strategy), fc.EXPRESSION_INVALID) == []


def test_empty_places_in_the_other_places_of_an_expression() -> None:
    strategy = valid_strategy()
    strategy.elements[1].properties["stop_loss"] = expr("[] - 1")
    strategy.rules.append(rule("r", "[] > 0"))
    strategy.elements[1].rules.append(rule("s", "TRUE() = []"))
    assert len(only(check(strategy), fc.EXPRESSION_EMPTY)) == 3


def test_a_calculation_with_an_empty_place_makes_no_other_finding() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "wert", "1 + []"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 2)]
    assert codes(check(strategy)) == [fc.EXPRESSION_EMPTY]


# --- PREVIOUS ---


@pytest.mark.parametrize(
    "text",
    [
        "PREVIOUS(ema20.wert) > 0",
        "PREVIOUS(ema20.wert; 3) > 0",
        "PREVIOUS(Kerze.schluss) > 0",
        "PREVIOUS(Tick.geld) > 0",
        "PREVIOUS(rechnung.ergebnis) > 0",
        "PREVIOUS(pruefung.ergebnis)",
    ],
)
def test_previous_of_a_value_with_an_earlier_value(text: str) -> None:
    strategy = with_ema()
    strategy.elements.insert(1, calculation(5, "rechnung", "1"))
    strategy.elements.insert(2, condition(6, "TRUE()", name="pruefung"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 6), connect(6, "wahr", 2)]
    strategy.elements[2].parameters["ausdruck"] = expr(text)
    assert [item for item in check(strategy) if item.level is Level.ERROR] == []


@pytest.mark.parametrize(
    "text",
    [
        "PREVIOUS(Strategie.stop_abstand) > 0",
        "PREVIOUS(Konto.kapital) > 0",
        "PREVIOUS(Instrument.pip) > 0",
        "PREVIOUS(1 + 2) > 0",
        "PREVIOUS(ema20.wert * 2) > 0",
        "PREVIOUS(5) > 0",
        "PREVIOUS(Strategie.stop_abstand; 2) > 0",
    ],
)
def test_previous_of_a_value_without_an_earlier_value_is_an_error(text: str) -> None:
    strategy = with_condition(text, [ElementInput("ema20", "wert")] if "ema20" in text else None)
    strategy.parameters = [StrategyParameter("stop_abstand", DataType.NUMBER, 1)]
    strategy.elements[1].inputs = []
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert [item.details["issue"] for item in found] == ["previous_argument"]
    assert found[0].details["reason"] in ("no_earlier_value", "not_a_name")


def test_previous_of_the_position_and_the_order() -> None:
    strategy = valid_strategy()
    strategy.elements += [
        condition(5, "PREVIOUS(Order.volumen) > 0", management_of=uid(2)),
        trigger(6, management_of=uid(2)),
    ]
    strategy.connections.append(connect(6, "weiter", 5))
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert found[0].details["name"] == "Order.volumen"


# --- unlawful connections ---


def reasons(strategy: Strategy) -> list[str]:
    return [str(item.details["reason"]) for item in only(check(strategy), fc.CONNECTION_INVALID)]


def test_a_connection_from_or_to_an_instance() -> None:
    strategy = with_ema()
    strategy.connections.append(connect(1, "weiter", 10))
    assert reasons(strategy) == ["instance_connection"]
    strategy = with_ema()
    strategy.connections.append(connect(10, "weiter", 2))
    assert reasons(strategy) == ["instance_connection"]
    assert reasons(with_ema()) == []


def test_a_connection_to_a_trigger() -> None:
    strategy = valid_strategy()
    strategy.elements.append(trigger(5))
    strategy.connections.append(connect(2, "nicht_gestellt", 5))
    assert reasons(strategy) == ["target_is_trigger"]


def management_strategy() -> Strategy:
    strategy = valid_strategy()
    strategy.elements += [condition(5, 'Order.status = "wartend"', management_of=uid(2))]
    return strategy


def test_the_output_with_the_management_leads_into_the_management() -> None:
    strategy = management_strategy()
    strategy.connections.append(connect(2, "gestellt", 5))
    assert reasons(strategy) == []
    assert check(strategy) == []


def test_the_output_with_the_management_must_not_lead_out_of_it() -> None:
    strategy = management_strategy()
    strategy.elements.append(place_order(6))
    strategy.connections.append(connect(2, "gestellt", 6))
    assert reasons(strategy) == ["management_output_outside"]
    other = place_order(7)
    other.management_of = uid(2)
    strategy = management_strategy()
    strategy.elements.append(place_order(6))
    strategy.connections.append(connect(6, "gestellt", 5))  # the management of another order
    assert reasons(strategy) == ["management_output_outside"]
    assert other.management_of == uid(2)


def test_the_output_with_the_management_not_if_the_management_has_triggers() -> None:
    strategy = management_strategy()
    strategy.elements.append(trigger(6, management_of=uid(2)))
    strategy.connections += [connect(6, "weiter", 5), connect(2, "gestellt", 5)]
    assert reasons(strategy) == ["management_output_with_triggers"]
    strategy.connections.pop()
    assert reasons(strategy) == []


def test_the_other_output_of_the_order_does_not_lead_into_the_management() -> None:
    strategy = management_strategy()
    strategy.connections.append(connect(2, "nicht_gestellt", 5))
    assert reasons(strategy) == ["across_managements"]


def test_a_connection_between_two_managements_or_to_the_main_flow() -> None:
    strategy = management_strategy()
    strategy.connections.append(connect(5, "wahr", 2))
    assert reasons(strategy) == ["across_managements"]
    strategy = management_strategy()
    strategy.elements.append(place_order(6, management_of=uid(2)))
    strategy.elements.append(condition(7, "TRUE()", management_of=uid(6)))
    strategy.connections.append(connect(5, "wahr", 7))
    assert reasons(strategy) == ["across_managements"]


def test_a_management_inside_a_management() -> None:
    strategy = management_strategy()
    strategy.elements.append(place_order(6, management_of=uid(2)))
    strategy.elements.append(condition(7, "TRUE()", management_of=uid(6)))
    strategy.connections += [
        connect(2, "gestellt", 5),
        connect(5, "wahr", 6),
        connect(6, "gestellt", 7),
    ]
    assert reasons(strategy) == []
    assert only(check(strategy), fc.FLOW_NOT_REACHED) == []


# --- sections ---


def layout_reasons(strategy: Strategy) -> list[str]:
    return [str(item.details["reason"]) for item in only(check(strategy), fc.LAYOUT_INVALID)]


def test_sections_of_the_main_flow_and_of_a_management() -> None:
    strategy = management_strategy()
    strategy.connections.append(connect(2, "gestellt", 5))
    strategy.sections = [
        Section("Einstieg", None, [uid(1), uid(2)], False, uid(60)),
        Section("Verwaltung", uid(2), [uid(5)], True, uid(61)),
    ]
    strategy.collapsed_managements = [uid(2)]
    assert check(strategy) == []


def test_a_section_with_a_problem() -> None:
    cases = {
        "unknown_element": Section("s", None, [uid(77)]),
        "other_flow": Section("s", uid(2), [uid(1)]),
        "unknown_flow": Section("s", uid(77), []),
    }
    for reason, section in cases.items():
        strategy = valid_strategy()
        strategy.sections = [section]
        assert layout_reasons(strategy) == [reason]
    strategy = valid_strategy()
    strategy.sections = [Section("a", None, [uid(1)]), Section("b", None, [uid(1)])]
    assert layout_reasons(strategy) == ["element_twice"]
    strategy = valid_strategy()
    strategy.sections = [Section("a", uid(1), [])]  # the flow is no "Order aufgeben"
    assert layout_reasons(strategy) == ["unknown_flow"]


def test_a_collapsed_management_that_does_not_exist() -> None:
    strategy = valid_strategy()
    strategy.collapsed_managements = [uid(77), uid(1)]
    found = only(check(strategy), fc.LAYOUT_INVALID)
    assert [item.details["part"] for item in found] == ["collapsed_management"] * 2


# --- names against the objects of the application and keys ---


def test_the_name_of_an_instance_must_not_be_the_name_of_an_object_of_the_application() -> None:
    for name in ("Kerze", "kerze", "Candle", "ACCOUNT", "  konto "):
        strategy = valid_strategy()
        strategy.elements.append(
            element(
                10,
                "EMA",
                instance=Instance(
                    name=name,
                    key="k_" + str(abs(hash(name)) % 1000),
                    object_type="EMA",
                    parameter_values={"zeiteinheit": fixed("h1")},
                ),
            )
        )
        found = only(check(strategy), fc.NAME_DUPLICATE)
        assert [item.details.get("with_application_object") for item in found] == [True], name


def test_the_key_must_not_be_the_name_of_an_object_of_the_application_or_a_function() -> None:
    for key in ("Kerze", "order", "if", "Max"):
        strategy = valid_strategy()
        strategy.elements.append(
            element(
                10,
                "EMA",
                instance=Instance(
                    name="Mein Name " + key,
                    key=key,
                    object_type="EMA",
                    parameter_values={"zeiteinheit": fixed("h1")},
                ),
            )
        )
        found = only(check(strategy), fc.NAME_DUPLICATE)
        assert [
            (item.details["what"], item.details.get("with_application_object")) for item in found
        ] == [("key", True)], key


def test_a_rule_and_a_condition_with_the_name_of_an_object_of_the_application() -> None:
    strategy = valid_strategy()
    strategy.rules.append(rule("order", "TRUE()"))
    assert only(check(strategy), fc.NAME_DUPLICATE)
    strategy = valid_strategy()
    named = calculation(5, "Position", "1")
    named.key = "pos"
    strategy.elements.insert(1, named)
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 2)]
    assert only(check(strategy), fc.NAME_DUPLICATE)


def test_a_strategy_parameter_may_have_the_name_of_an_object_of_the_application() -> None:
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("Kerze", DataType.NUMBER, 1)]
    assert check(strategy) == []


def test_two_names_that_differ_in_spaces_and_case_only_are_one_name() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(10, "EMA", instance=ema("a")))
    other = ema("b")
    other.name = " A  "
    strategy.elements.append(element(11, "EMA", instance=other))
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert [item.details["what"] for item in found] == ["name"]


def test_two_names_with_different_keys_are_a_double_name_once() -> None:
    strategy = valid_strategy()
    first, second = ema("e1"), ema("e2")
    first.name = second.name = "Gleich"
    strategy.elements += [element(10, "EMA", instance=first), element(11, "EMA", instance=second)]
    assert len(only(check(strategy), fc.NAME_DUPLICATE)) == 1


def test_a_key_twice_with_different_names() -> None:
    strategy = valid_strategy()
    first, second = ema("e1"), ema("e2")
    second.key = "E1"
    strategy.elements += [element(10, "EMA", instance=first), element(11, "EMA", instance=second)]
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert [item.details["what"] for item in found] == ["key"]


def test_names_of_triggers_and_orders_need_not_be_unique() -> None:
    strategy = valid_strategy()
    strategy.elements[0].name = strategy.elements[1].name = "Gleich"
    assert check(strategy) == []


# --- the instrument as a parameter of the types ---


def test_a_trend_with_the_instrument_a_time_unit_and_a_method() -> None:
    strategy = valid_strategy()
    strategy.elements.append(
        element(
            10,
            "Trend",
            instance=Instance(
                name="Trend",
                key="trend_h1",
                object_type="Trend",
                parameter_values={
                    "zeiteinheit": fixed("h1"),
                    "instrument": fixed("USDJPY"),
                    "berechnungsverfahren": fixed("trend_method.expression"),
                },
            ),
        )
    )
    assert codes(check(strategy)) == [fc.TREND_DIRECTION_MISSING]


def test_the_time_unit_of_an_indicator_template_is_a_parameter_of_every_indicator() -> None:
    from pipwerk_domain.consistency import check_template
    from tests.helpers import template

    value = template(catalog.TYPE_INDICATOR, parameter_values={})
    found = only(check_template(value), fc.PARAMETER_MISSING)
    assert [item.details["parameter"] for item in found] == ["zeiteinheit"]


def test_the_trigger_manual_has_no_parameter() -> None:
    strategy = valid_strategy()
    strategy.elements[0] = element(1, catalog.TRIGGER_MANUAL)
    assert check(strategy) == []
    strategy.elements[0].parameters["zeiteinheit"] = fixed("h1")
    found = only(check(strategy), fc.PARAMETER_BINDING_INVALID)
    assert found[0].details["reason"] == "unknown_parameter"


# --- the contexts of the places of expressions ---


def test_every_place_of_an_expression_has_a_context_by_its_pointer() -> None:
    strategy = with_condition("ema20.wert > 1")
    strategy.elements[2].rules.append(rule("r", "Order.volumen > 0"))
    strategy.rules.append(rule("t", "Konto.kapital > 0"))
    checker = check_with_contexts(strategy)
    place = below(pointer("elements", 1), "parameters", "ausdruck", "value")
    assert place in checker.contexts
    context = checker.contexts[place]
    assert context.expected is not None and context.expected.datatype is DataType.BOOLEAN
    assert context.element_id == uid(5)
    assert context.order_error is True
    assert pointer("elements", 2, "rules", 0, "expression") in checker.contexts
    assert pointer("rules", 0, "expression") in checker.contexts
    order_property = below(pointer("elements", 2), "properties", "volumen", "value")
    assert order_property in checker.contexts  # also where the binding is not set


def test_places_where_the_binding_is_not_set_have_a_context_too() -> None:
    strategy = with_ema()
    checker = check_with_contexts(strategy)
    assert below(pointer("elements", 1), "properties", "stop_loss", "value") in checker.contexts
    assert below(pointer("elements", 0), "parameters", "zeiteinheit", "value") in checker.contexts
    ordertype = below(pointer("elements", 1), "parameters", "ordertyp", "value")
    assert ordertype not in checker.contexts  # the order type allows no expression


def test_a_management_has_the_order_type_of_its_order_in_its_context() -> None:
    strategy = management_strategy()
    strategy.connections.append(connect(2, "gestellt", 5))
    checker = check_with_contexts(strategy)
    context = checker.contexts[below(pointer("elements", 2), "parameters", "ausdruck", "value")]
    assert context.order_error is False
    symbol = context.env.resolve("Order")
    assert symbol is not None
    assert symbol.member("richtung") is not None


def test_a_template_has_contexts_by_its_pointers() -> None:
    from pipwerk_domain.model import PropertyDefinition
    from tests.helpers import template

    value = template(
        catalog.TYPE_INDICATOR,
        rules=[rule("r", "TRUE()")],
        properties=[PropertyDefinition("Wert", DataType.NUMBER, "1")],
        instances=[ema("e")],
    )
    checker = check_with_contexts(value)
    assert pointer("rules", 0, "expression") in checker.contexts
    assert pointer("properties", 0, "expression") in checker.contexts
    context = checker.contexts[pointer("properties", 0, "expression")]
    assert context.in_template is True
    assert context.order_error is True
    assert context.expected is not None and context.expected.datatype is DataType.NUMBER


def finding_list(findings: list[Finding]) -> list[str]:
    return [item.code for item in findings]


def test_the_connections_of_the_model_know_their_identifiers() -> None:
    strategy = valid_strategy()
    assert isinstance(strategy.connections[0], Connection)
    assert strategy.connections[0].id
    assert finding_list(check(strategy)) == []
