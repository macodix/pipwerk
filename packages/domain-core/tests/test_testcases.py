"""The test case documents str-01 and str-03 (specification section 6)."""

import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

from pipwerk_domain import catalog
from pipwerk_domain.consistency import Level, check_strategy
from pipwerk_domain.consistency.engine import Checker
from pipwerk_domain.defaults import default_registry
from pipwerk_domain.documents import parse_document, read_document, write_document
from pipwerk_domain.documents.schemas import generate_schema
from pipwerk_domain.model import Element, Instance, Strategy
from pipwerk_domain.risk_rule import RISK_PER_TRADE_RULE_ID
from pipwerk_domain.typedesc import BindingKind, DataType
from tests.paths import TESTCASE_DIRECTORY

NAMES = ["str-01", "str-03"]


def path_of(name: str) -> Path:
    return TESTCASE_DIRECTORY / f"{name}.strategy.json"


def load(name: str) -> Strategy:
    value = read_document(path_of(name).read_text(encoding="utf-8"))
    assert isinstance(value, Strategy)
    return value


def follow(strategy: Strategy, source: Element, output: str) -> Element:
    targets = [
        item.target
        for item in strategy.connections
        if item.source == source.id and item.output == output
    ]
    assert len(targets) == 1, (source.title, output)
    found = strategy.element(targets[0])
    assert found is not None
    return found


@pytest.mark.parametrize("name", NAMES)
def test_the_document_is_valid_against_the_schema(name: str) -> None:
    data = json.loads(path_of(name).read_text(encoding="utf-8"))
    Draft202012Validator(generate_schema("strategy")).validate(data)
    parse_document(path_of(name).read_text(encoding="utf-8"))


@pytest.mark.parametrize("name", NAMES)
def test_no_finding_of_the_consistency_check(name: str) -> None:
    findings = check_strategy(load(name))
    assert [item for item in findings if item.level is Level.ERROR] == []
    assert findings == []  # not even a hint


@pytest.mark.parametrize("name", NAMES)
def test_writing_gives_the_text_of_the_file(name: str) -> None:
    text = path_of(name).read_text(encoding="utf-8")
    assert write_document(read_document(text)) == text
    assert read_document(write_document(load(name))) == load(name)


@pytest.mark.parametrize("name", NAMES)
def test_normalization_does_not_change_the_document(name: str) -> None:
    checker = Checker(default_registry())
    checker.check_strategy(load(name))
    analyses = checker.expression_analyses()
    assert len(analyses) > 10
    for analysis in analyses:
        assert analysis.parsed_ok
        assert analysis.normalized == analysis.source


@pytest.mark.parametrize("name", NAMES)
def test_ids_and_references_are_consistent(name: str) -> None:
    strategy = load(name)
    ids = [item.id for item in strategy.elements]
    assert len(ids) == len(set(ids))
    for connection in strategy.connections:
        assert connection.source in ids
        assert connection.target in ids
    owners = {item.management_of for item in strategy.elements if item.management_of}
    assert len(owners) == 1
    owner = strategy.element(next(iter(owners)))
    assert owner is not None
    assert owner.type == catalog.FLOW_PLACE_ORDER


def risk_rule_of(strategy: Strategy) -> Instance:
    rules = [item for item in strategy.rules if item.name == "risiko"]
    assert len(rules) == 1
    return rules[0]


@pytest.mark.parametrize("name", NAMES)
def test_rule_of_the_strategy_risiko_from_risk_per_trade(name: str) -> None:
    strategy = load(name)
    assert [item.name for item in strategy.rules] == ["risiko"]
    risk = risk_rule_of(strategy)
    assert risk.origin is not None
    assert risk.origin.template_id == RISK_PER_TRADE_RULE_ID
    assert risk.origin.template_title == "Risiko je Trade"
    assert risk.parameter_values["risikogrenze"].value == 0.01
    assert risk.determined_property == "volumen"
    assert risk.comparison is not None
    assert risk.comparison.value == "hoechstens"


@pytest.mark.parametrize("name", NAMES)
def test_rule_of_the_element_mindestvolumen(name: str) -> None:
    strategy = load(name)
    orders = [item for item in strategy.elements if item.type == catalog.FLOW_PLACE_ORDER]
    assert len(orders) == 1
    assert [item.name for item in orders[0].rules] == ["mindestvolumen"]
    minimum = orders[0].rules[0]
    assert minimum.object_type == "Regel"
    assert minimum.determined_property is None  # checking
    assert minimum.expression == "Order.volumen >= Instrument.mindestvolumen"
    assert all(item.name != "mindestvolumen" for item in strategy.rules)


def test_str_01_parameters_and_instances() -> None:
    strategy = load("str-01")
    assert strategy.title.startswith("Scalping Punkt 2 Ausbruch")
    assert [(item.name, item.datatype) for item in strategy.parameters] == [
        ("signalzeiteinheit", DataType.TIME_UNIT),
        ("handelszeiteinheit", DataType.TIME_UNIT),
        ("entry_puffer", DataType.NUMBER),
        ("stop_puffer", DataType.NUMBER),
    ]
    instances = {item.instance.name: item.instance for item in strategy.elements if item.instance}
    assert set(instances) == {"mt_signal", "mt_handel"}
    for instance in instances.values():
        assert instance.object_type == "Markttechnik"
    signal = instances["mt_signal"].parameter_values["zeiteinheit"]
    trade = instances["mt_handel"].parameter_values["zeiteinheit"]
    assert (signal.kind, signal.value) == (BindingKind.PARAMETER, "signalzeiteinheit")
    assert (trade.kind, trade.value) == (BindingKind.PARAMETER, "handelszeiteinheit")


def test_str_01_main_flow() -> None:
    strategy = load("str-01")
    triggers = [
        item for item in strategy.main_elements() if item.type == catalog.TRIGGER_CANDLE_CLOSE
    ]
    assert len(triggers) == 1
    trigger = triggers[0]
    assert trigger.parameters["zeiteinheit"].value == "handelszeiteinheit"
    assert trigger.parameters["zeiteinheit"].kind is BindingKind.PARAMETER
    condition_1 = follow(strategy, trigger, "weiter")
    assert condition_1.parameters["ausdruck"].value == (
        'AND(mt_signal.trend_intakt; mt_signal.phase = "bewegung")'
    )
    condition_2 = follow(strategy, condition_1, "wahr")
    assert condition_2.parameters["ausdruck"].value == (
        "mt_handel.trendrichtung = mt_signal.trendrichtung"
    )
    condition_3 = follow(strategy, condition_2, "wahr")
    assert condition_3.parameters["ausdruck"].value == (
        "Strategie.wartende_orders + Strategie.offene_positionen = 0"
    )
    calculation_1 = follow(strategy, condition_3, "wahr")
    calculation_2 = follow(strategy, calculation_1, "weiter")
    calculation_3 = follow(strategy, calculation_2, "weiter")
    assert [item.name for item in (calculation_1, calculation_2, calculation_3)] == [
        "einstieg",
        "stop",
        "ziel",
    ]
    for item in (calculation_1, calculation_2, calculation_3):
        text = str(item.parameters["ausdruck"].value)
        assert text.startswith('IF(mt_signal.trendrichtung = "aufwaerts";')
    assert "Strategie.entry_puffer * Instrument.pip" in str(
        calculation_1.parameters["ausdruck"].value
    )
    assert "Strategie.stop_puffer * Instrument.pip" in str(
        calculation_2.parameters["ausdruck"].value
    )
    order = follow(strategy, calculation_3, "weiter")
    assert order.type == catalog.FLOW_PLACE_ORDER
    assert order.parameters["ordertyp"].value == "StopOrder"
    properties = order.properties
    assert (
        properties["richtung"].value == 'IF(mt_signal.trendrichtung = "aufwaerts"; "buy"; "sell")'
    )
    assert properties["preis"].value == "einstieg.ergebnis"
    assert properties["stop_loss"].value == "stop.ergebnis"
    assert properties["take_profit"].value == "ziel.ergebnis"
    assert (properties["gueltigkeit"].kind, properties["gueltigkeit"].value) == (
        BindingKind.FIXED,
        "bis_auf_widerruf",
    )
    assert "volumen" not in properties  # the rule risiko determines it


def test_str_01_management() -> None:
    strategy = load("str-01")
    order = next(item for item in strategy.elements if item.type == catalog.FLOW_PLACE_ORDER)
    management = strategy.management(order.id)
    assert management is not None
    triggers = [item for item in management.elements if item.type.startswith("trigger.")]
    assert sorted(item.type for item in triggers) == [
        catalog.TRIGGER_CANDLE_CLOSE,
        catalog.TRIGGER_TICK,
    ]
    tick = next(item for item in triggers if item.type == catalog.TRIGGER_TICK)
    candle = next(item for item in triggers if item.type == catalog.TRIGGER_CANDLE_CLOSE)
    assert candle.parameters["zeiteinheit"].value == "handelszeiteinheit"
    breakthrough = follow(strategy, tick, "weiter")
    assert breakthrough.parameters["ausdruck"].value == (
        'AND(Order.status = "wartend"; IF(Order.richtung = "buy"; '
        "Tick.geld < mt_handel.punkt_13; Tick.brief > mt_handel.punkt_13))"
    )
    assert follow(strategy, breakthrough, "wahr").type == catalog.FLOW_DELETE_ORDER
    waiting = follow(strategy, candle, "weiter")
    assert waiting.parameters["ausdruck"].value == 'Order.status = "wartend"'
    new_stop = follow(strategy, waiting, "wahr")
    assert new_stop.name == "stop_neu"
    differs = follow(strategy, new_stop, "weiter")
    assert differs.parameters["ausdruck"].value == "stop_neu.ergebnis <> Order.stop_loss"
    new_target = follow(strategy, differs, "wahr")
    assert new_target.name == "ziel_neu"
    modify = follow(strategy, new_target, "weiter")
    assert modify.type == catalog.FLOW_MODIFY_ORDER
    assert modify.parameters["stop_loss"].value == "stop_neu.ergebnis"
    assert modify.parameters["take_profit"].value == "ziel_neu.ergebnis"
    assert follow(strategy, modify, "nicht_geaendert").type == catalog.FLOW_DELETE_ORDER
    assert len(management.elements) == 10


def test_str_01_has_all_elements_and_connections() -> None:
    strategy = load("str-01")
    assert len(strategy.elements) == 20
    assert len(strategy.connections) == 15
    assert len(strategy.main_elements()) == 10


def test_str_03_parameters_and_instances() -> None:
    strategy = load("str-03")
    assert strategy.title == "EMA-Trendfolge"
    assert [(item.name, item.datatype, item.value) for item in strategy.parameters] == [
        ("zeiteinheit", DataType.TIME_UNIT, "h1"),
        ("stop_abstand", DataType.NUMBER, 2),
    ]
    instances = {item.instance.name: item.instance for item in strategy.elements if item.instance}
    assert set(instances) == {"ema20", "ema50", "atr14"}
    assert instances["ema20"].object_type == "EMA"
    assert instances["ema20"].parameter_values["periode"].value == 20
    assert instances["ema50"].parameter_values["periode"].value == 50
    assert instances["atr14"].object_type == "ATR"
    assert instances["atr14"].parameter_values["periode"].value == 14
    for instance in instances.values():
        unit = instance.parameter_values["zeiteinheit"]
        assert (unit.kind, unit.value) == (BindingKind.PARAMETER, "zeiteinheit")


def test_str_03_main_flow_and_management() -> None:
    strategy = load("str-03")
    trigger = next(
        item for item in strategy.main_elements() if item.type == catalog.TRIGGER_CANDLE_CLOSE
    )
    assert trigger.parameters["zeiteinheit"].value == "zeiteinheit"
    crossing = follow(strategy, trigger, "weiter")
    assert crossing.parameters["ausdruck"].value == (
        "OR(AND(PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert > ema50.wert); "
        "AND(PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert))"
    )
    direction = follow(strategy, crossing, "wahr")
    assert direction.name == "richtung"
    assert direction.parameters["ausdruck"].value == 'IF(ema20.wert > ema50.wert; "buy"; "sell")'
    stop = follow(strategy, direction, "weiter")
    assert stop.name == "stop"
    assert "Kerze.schluss" in str(stop.parameters["ausdruck"].value)
    assert "Strategie.stop_abstand * atr14.wert" in str(stop.parameters["ausdruck"].value)
    order = follow(strategy, stop, "weiter")
    assert order.parameters["ordertyp"].value == "MarketOrder"
    assert order.properties["richtung"].value == "richtung.ergebnis"
    assert order.properties["stop_loss"].value == "stop.ergebnis"
    assert "take_profit" not in order.properties  # no take profit
    management = strategy.management(order.id)
    assert management is not None
    assert len(management.elements) == 7
    candle = next(item for item in management.elements if item.type == catalog.TRIGGER_CANDLE_CLOSE)
    executed = follow(strategy, candle, "weiter")
    assert executed.parameters["ausdruck"].value == 'Order.status = "ausgefuehrt"'
    against = follow(strategy, executed, "wahr")
    assert "Position.richtung" in str(against.parameters["ausdruck"].value)
    close = follow(strategy, against, "wahr")
    assert close.type == catalog.FLOW_CLOSE_POSITION
    assert close.parameters == {}  # without a volume
    new_stop = follow(strategy, against, "falsch")
    assert new_stop.name == "stop_neu"
    improved = follow(strategy, new_stop, "weiter")
    assert "Position.stop_loss" in str(improved.parameters["ausdruck"].value)
    assert "Position.richtung" in str(improved.parameters["ausdruck"].value)
    modify = follow(strategy, improved, "wahr")
    assert modify.type == catalog.FLOW_MODIFY_POSITION
    assert modify.parameters["stop_loss"].value == "stop_neu.ergebnis"


def test_str_03_has_all_elements_and_connections() -> None:
    strategy = load("str-03")
    assert len(strategy.elements) == 15
    assert len(strategy.connections) == 10
    assert len(strategy.main_elements()) == 8


@pytest.mark.parametrize("name", NAMES)
def test_the_files_end_with_a_line_feed_and_have_no_trailing_blanks(name: str) -> None:
    text = path_of(name).read_text(encoding="utf-8")
    assert text.endswith("}\n")
    assert not text.endswith("\n\n")


# modified versions of the test cases give the findings of specification 3.6 -------------------


def main_condition(strategy: Strategy) -> Element:
    return next(item for item in strategy.main_elements() if item.type == catalog.FLOW_CONDITION)


@pytest.mark.parametrize("name", NAMES)
def test_removed_trigger(name: str) -> None:
    strategy = load(name)
    trigger = next(item for item in strategy.main_elements() if item.type.startswith("trigger."))
    strategy.elements.remove(trigger)
    strategy.connections = [item for item in strategy.connections if item.source != trigger.id]
    codes = {item.code for item in check_strategy(strategy)}
    assert "strategy.no_trigger" not in codes  # a strategy without trigger is no finding
    assert "flow.no_incoming" in codes


@pytest.mark.parametrize("name", NAMES)
def test_trigger_that_is_not_connected(name: str) -> None:
    strategy = load(name)
    trigger = next(item for item in strategy.main_elements() if item.type.startswith("trigger."))
    strategy.connections = [item for item in strategy.connections if item.source != trigger.id]
    found = [item for item in check_strategy(strategy) if item.code == "trigger.unconnected"]
    assert [item.element for item in found] == [trigger.id]


@pytest.mark.parametrize("name", NAMES)
def test_expression_with_a_typing_error(name: str) -> None:
    strategy = load(name)
    element = main_condition(strategy)
    text = str(element.parameters["ausdruck"].value)
    element.parameters["ausdruck"].value = text[:-1]  # the last parenthesis or character is missing
    found = [item for item in check_strategy(strategy) if item.code == "expression.invalid"]
    assert found
    assert found[0].element == element.id
    assert found[0].details["issue"] in ("syntax", "type_mismatch")
    assert int(str(found[0].details["end"])) <= len(text)


@pytest.mark.parametrize("name", NAMES)
def test_unknown_name_with_its_position(name: str) -> None:
    strategy = load(name)
    element = main_condition(strategy)
    text = str(element.parameters["ausdruck"].value)
    element.parameters["ausdruck"].value = f"AND(gibtsnicht.wert > 1; {text})"
    found = [item for item in check_strategy(strategy) if item.code == "expression.invalid"]
    assert found[0].element == element.id
    assert found[0].details["issue"] == "unknown_name"
    assert (found[0].details["start"], found[0].details["end"]) == (4, 14)


@pytest.mark.parametrize("name", NAMES)
def test_order_in_the_main_flow(name: str) -> None:
    strategy = load(name)
    element = main_condition(strategy)
    element.parameters["ausdruck"].value = 'Order.status = "wartend"'
    found = [
        item
        for item in check_strategy(strategy)
        if item.code == "expression.order_outside_management"
    ]
    assert [item.element for item in found] == [element.id]


@pytest.mark.parametrize("name", NAMES)
def test_rule_with_order_in_an_indicator(name: str) -> None:
    strategy = load(name)
    strategy.elements.append(
        Element(
            id="00000000-0000-4000-8000-0000000000aa",
            type="Indikator",
            instance=Instance(
                name="eigener_indikator",
                object_type="Indikator",
                rules=[
                    Instance(
                        name="regel",
                        object_type="Regel",
                        expression="Order.volumen > 0",
                    )
                ],
            ),
        )
    )
    found = [item for item in check_strategy(strategy) if item.code == "rule.order_in_indicator"]
    assert [(item.element, item.subject) for item in found] == [
        ("00000000-0000-4000-8000-0000000000aa", "eigener_indikator.regel")
    ]


@pytest.mark.parametrize("name", NAMES)
def test_order_modification_outside_a_management(name: str) -> None:
    strategy = load(name)
    stray = Element(id="00000000-0000-4000-8000-0000000000bb", type=catalog.FLOW_MODIFY_ORDER)
    strategy.elements.append(stray)
    found = [item for item in check_strategy(strategy) if item.code == "flow.management_only"]
    assert [item.element for item in found] == [stray.id]


@pytest.mark.parametrize("name", NAMES)
def test_unknown_element_type(name: str) -> None:
    strategy = load(name)
    element = main_condition(strategy)
    element.type = "flow.unbekannt"
    found = [item for item in check_strategy(strategy) if item.code == "type.unknown"]
    assert [(item.element, item.details["type"]) for item in found] == [
        (element.id, "flow.unbekannt")
    ]
    assert read_document(write_document(strategy)) == strategy  # the document stays valid
