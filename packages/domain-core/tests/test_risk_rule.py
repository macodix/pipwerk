"""The delivered rule template "Risiko je Trade" (specification 3.5)."""

import copy
import re
import uuid

from pipwerk_domain import catalog
from pipwerk_domain.consistency import Level, check_strategy, check_template
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.defaults import builtin_template_texts, default_registry
from pipwerk_domain.expressions import Scope, analyze, parse
from pipwerk_domain.model import Comparison, Instance
from pipwerk_domain.namespaces import application_scope, parameter_symbol
from pipwerk_domain.risk_rule import (
    RISK_PER_TRADE_EXPRESSION,
    RISK_PER_TRADE_LABEL,
    RISK_PER_TRADE_RULE_ID,
    risk_per_trade_instance,
    risk_per_trade_template,
)
from pipwerk_domain.typedesc import DataType, Label
from tests.helpers import fixed, only, place_order, template, valid_strategy


def test_the_template_has_the_parts_of_the_specification() -> None:
    value = risk_per_trade_template()
    assert value.object_type == catalog.TYPE_RULE
    assert value.name == "Risiko je Trade"
    assert value.id == RISK_PER_TRADE_RULE_ID
    assert value.determined_property == "volumen"
    assert value.comparison is Comparison.AT_MOST
    assert len(value.parameters) == 1
    limit = value.parameters[0]
    assert (limit.key, limit.name, limit.datatype, limit.required, limit.default) == (
        "risikogrenze",
        "Risikogrenze",
        DataType.PERCENT,
        True,
        0.01,
    )
    assert value.expression == RISK_PER_TRADE_EXPRESSION


def test_the_name_exists_in_german_and_english() -> None:
    """Mangel M4: the delivered template has its name in both languages."""
    assert Label("Risiko je Trade", "Risk per trade") == RISK_PER_TRADE_LABEL
    (texts,) = builtin_template_texts()
    assert texts.template_id == RISK_PER_TRADE_RULE_ID
    assert texts.name == Label("Risiko je Trade", "Risk per trade")
    assert texts.explanation.de
    assert texts.explanation.en
    assert texts.group.value == "rules"


def test_the_fixed_identifier_is_a_uuid() -> None:
    assert str(uuid.UUID(RISK_PER_TRADE_RULE_ID)) == RISK_PER_TRADE_RULE_ID
    assert uuid.UUID(RISK_PER_TRADE_RULE_ID).version == 4


def test_the_expression_is_parsed_and_in_the_normalized_spelling() -> None:
    assert parse(RISK_PER_TRADE_EXPRESSION).issue is None
    scope = application_scope(default_registry(), None, open_strategy=True)
    env = Scope(scope)
    env.add(parameter_symbol("risikogrenze", DataType.PERCENT))
    analysis = analyze(RISK_PER_TRADE_EXPRESSION, env)
    assert analysis.issues == []
    assert analysis.normalized == RISK_PER_TRADE_EXPRESSION
    assert analysis.result_type.datatype is DataType.NUMBER


def test_the_distance_to_the_stop_loss_is_written_out_at_both_places() -> None:
    text = RISK_PER_TRADE_EXPRESSION
    order_distance = (
        'IF(Order.richtung = "buy"; IFNA(Order.limitpreis; Order.preis) - Order.stop_loss;'
        " Order.stop_loss - IFNA(Order.limitpreis; Order.preis))"
    )
    position_distance = (
        'IF(Position.richtung = "buy"; Position.einstiegspreis - Position.stop_loss;'
        " Position.stop_loss - Position.einstiegspreis)"
    )
    assert text.count(order_distance) == 2
    assert text.count(position_distance) == 2
    assert text.startswith("IF(ISNA(Position.volumen);")
    assert "A_Order" not in text
    assert "A_Position" not in text
    for part in (
        "Konto.kapital",
        "Order.instrument.tickgroesse",
        "Order.instrument.tickwert",
        "Order.instrument.volumenschritt",
    ):
        assert part in text
    # the instrument is the one of the order (specification 3.5), never `Instrument` alone
    assert not re.search(r"(?<!\.)\bInstrument\.", text)
    assert len(re.findall(r"\bFLOOR\(", text)) == 2
    assert "\n" in text  # with line breaks, as in the specification


def test_the_template_has_no_finding() -> None:
    assert check_template(risk_per_trade_template()) == []


def test_as_a_rule_of_the_strategy_without_finding() -> None:
    strategy = valid_strategy()
    del strategy.elements[1].properties["volumen"]  # the rule determines the volume
    strategy.rules.append(risk_per_trade_instance("risiko"))
    assert check_strategy(strategy) == []


def test_as_a_rule_of_an_element_without_finding() -> None:
    strategy = valid_strategy()
    del strategy.elements[1].properties["volumen"]
    strategy.elements[1].rules.append(risk_per_trade_instance("risiko"))
    assert check_strategy(strategy) == []


def test_as_a_rule_of_the_strategy_and_of_an_element_at_once() -> None:
    strategy = valid_strategy()
    del strategy.elements[1].properties["volumen"]
    strategy.rules.append(risk_per_trade_instance("risiko", 0.01))
    strategy.elements[1].rules.append(risk_per_trade_instance("risiko", 0.02))
    assert check_strategy(strategy) == []


def test_with_each_order_type_of_the_application() -> None:
    for order_type in ("MarketOrder", "StopOrder", "LimitOrder", "StopLimitOrder"):
        strategy = valid_strategy()
        properties = {"richtung": fixed("buy")}
        if order_type != "MarketOrder":
            properties["preis"] = fixed(1.5)
        if order_type == "StopLimitOrder":
            properties["limitpreis"] = fixed(1.4)
        strategy.elements[1] = place_order(2, order_type, properties=properties)
        strategy.rules.append(risk_per_trade_instance("risiko"))
        assert check_strategy(strategy) == [], order_type


def test_the_rule_is_an_error_in_an_indicator_because_it_addresses_order_and_position() -> None:
    value = template(catalog.TYPE_INDICATOR, rules=[risk_per_trade_instance("risiko")])
    found = only(check_template(value), fc.RULE_ORDER_IN_INDICATOR)
    assert [item.subject for item in found] == ["risiko"]
    assert found[0].level is Level.ERROR


def test_a_missing_risk_limit_is_reported() -> None:
    strategy = valid_strategy()
    instance = risk_per_trade_instance("risiko")
    instance.parameter_values.clear()
    instance.parameters[0].default = None
    strategy.rules.append(instance)
    del strategy.elements[1].properties["volumen"]
    found = only(check_strategy(strategy), fc.PARAMETER_MISSING)
    assert found[0].details["parameter"] == "risikogrenze"


def test_the_instance_is_a_complete_copy_with_its_origin() -> None:
    instance = risk_per_trade_instance("risiko", 0.03)
    value = risk_per_trade_template()
    assert instance.origin is not None
    assert instance.origin.object_type == catalog.TYPE_RULE
    assert instance.origin.template_id == RISK_PER_TRADE_RULE_ID
    assert instance.origin.template_name is None  # a delivered template: only its identifier
    assert (instance.name, instance.key) == ("risiko", "risiko")
    assert instance.parameter_values["risikogrenze"].value == 0.03
    assert instance.expression == value.expression
    assert instance.determined_property == value.determined_property
    assert instance.comparison is value.comparison
    # a change of the instance does not touch the template and the other way round (E4)
    before = copy.deepcopy(value)
    instance.expression = "TRUE()"
    instance.parameters[0].default = 0.5
    assert risk_per_trade_template() == before
    other = risk_per_trade_instance("andere")
    assert other.parameters[0].default == 0.01
    assert isinstance(other, Instance)


def test_a_new_template_object_is_made_each_time() -> None:
    first = risk_per_trade_template()
    first.parameters[0].default = 0.5
    assert risk_per_trade_template().parameters[0].default == 0.01
