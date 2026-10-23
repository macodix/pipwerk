"""Normalization of all expressions of a strategy or a template."""

import copy
import re
from collections.abc import Callable, Iterator

import pytest

from pipwerk_domain import catalog
from pipwerk_domain.documents import read_document
from pipwerk_domain.model import (
    Binding,
    ObjectContent,
    PropertyDefinition,
    Strategy,
)
from pipwerk_domain.normalize import normalize_strategy, normalize_template
from pipwerk_domain.risk_rule import risk_per_trade_template
from pipwerk_domain.typedesc import BindingKind, DataType
from tests.helpers import (
    calculation,
    ema,
    expr,
    rule,
    template,
    valid_strategy,
)
from tests.paths import CHECKED_TESTCASES, TESTCASE_DIRECTORY

Rewrite = Callable[[str], str]


def contents(value: ObjectContent) -> Iterator[ObjectContent]:
    yield value
    for child in [*value.instances, *value.rules]:
        yield from contents(child)


def mutate(strategy: Strategy, rewrite: Rewrite) -> None:
    """Rewrite every expression of the strategy."""

    def bindings(values: dict[str, Binding]) -> None:
        for binding in values.values():
            if binding.kind is BindingKind.EXPRESSION and isinstance(binding.value, str):
                binding.value = rewrite(binding.value)

    def instance(value: ObjectContent) -> None:
        for item in contents(value):
            bindings(item.parameter_values)
            if item.expression is not None:
                item.expression = rewrite(item.expression)
            if item.result_expression is not None:
                item.result_expression = rewrite(item.result_expression)
            for definition in item.properties:
                definition.expression = rewrite(definition.expression)

    for rule_instance in strategy.rules:
        instance(rule_instance)
    for element in strategy.elements:
        bindings(element.parameters)
        bindings(element.properties)
        for rule_instance in element.rules:
            instance(rule_instance)
        if element.instance is not None:
            instance(element.instance)


def spoil(text: str) -> str:
    """Another spelling of names and functions, not of anything else."""
    text = re.sub(
        r"\b(Order|Position|Instrument|Konto|Strategie|Tick|Kerze)\.",
        lambda m: m.group(1).upper() + ".",
        text,
    )
    text = re.sub(r"\.([a-z])([a-z_0-9]*)", lambda m: "." + m.group(1).upper() + m.group(2), text)
    text = re.sub(
        r"\b(IF|AND|OR|NOT|FLOOR|IFNA|ISNA|PREVIOUS|TRUE)\(",
        lambda m: m.group(1).capitalize() + "(",
        text,
    )
    return re.sub(r"\brisikogrenze\b", "RISIKOGRENZE", text)


def load(name: str) -> Strategy:
    value = read_document(
        (TESTCASE_DIRECTORY / f"{name}.strategy.json").read_text(encoding="utf-8")
    )
    assert isinstance(value, Strategy)
    return value


@pytest.mark.parametrize("name", CHECKED_TESTCASES)
def test_a_differently_spelled_test_case_is_normalized_to_the_stored_one(name: str) -> None:
    original = load(name)
    spoiled = copy.deepcopy(original)
    mutate(spoiled, spoil)
    assert spoiled != original
    before = copy.deepcopy(spoiled)
    result = normalize_strategy(spoiled)
    assert result == original
    assert spoiled == before  # the argument is not changed
    assert normalize_strategy(result) == result  # idempotent


@pytest.mark.parametrize("name", CHECKED_TESTCASES)
def test_a_normalized_test_case_stays_as_it_is(name: str) -> None:
    original = load(name)
    assert normalize_strategy(original) == original


def test_only_recognized_names_and_functions_change() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(
        1, calculation(5, "wert", 'if(true();  ORDER.Volumen;"ORDER.Volumen")')
    )
    strategy.elements[1].properties.update({"x": expr("1")})
    changed = normalize_strategy(strategy)
    assert changed.elements[1].parameters["ausdruck"].value == (
        'IF(TRUE();  Order.volumen;"ORDER.Volumen")'
    )
    broken = valid_strategy()
    broken.elements.insert(1, calculation(5, "wert", "order.volumen +"))
    assert normalize_strategy(broken).elements[1].parameters["ausdruck"].value == "order.volumen +"
    unknown = valid_strategy()
    unknown.elements.insert(1, calculation(5, "wert", "Foo(ORDER.Bar) + KONTO.Kapital"))
    assert normalize_strategy(unknown).elements[1].parameters["ausdruck"].value == (
        "Foo(Order.Bar) + Konto.kapital"  # the recognized part `Order` is written, `Bar` stays
    )


def test_expressions_of_rules_properties_and_rulesets_are_normalized() -> None:
    strategy = valid_strategy()
    strategy.rules.append(rule("r", "ORDER.Volumen > 0"))
    strategy.elements[1].rules.append(rule("e", "KONTO.kapital > 0"))
    inner = ema("ema20")
    inner_rule = rule("a", "KONTO.Kapital > 0")
    template_value = template(
        catalog.TYPE_INDICATOR,
        instances=[inner],
        rules=[inner_rule],
        properties=[PropertyDefinition("w", DataType.NUMBER, "EMA20.WERT * 2")],
    )
    result = normalize_template(template_value)
    assert result.rules[0].expression == "Konto.kapital > 0"
    assert result.properties[0].expression == "ema20.wert * 2"
    assert template_value.rules[0].expression == "KONTO.Kapital > 0"
    changed = normalize_strategy(strategy)
    assert changed.rules[0].expression == "Order.volumen > 0"
    assert changed.elements[1].rules[0].expression == "Konto.kapital > 0"


def test_the_risk_rule_template_is_normalized_already() -> None:
    value = risk_per_trade_template()
    assert normalize_template(value) == value


def test_result_expression_of_a_ruleset_is_normalized() -> None:
    value = template(
        catalog.TYPE_RULESET,
        rules=[rule("a", "KONTO.kapital > 0")],
        result_expression="AND(A.Ergebnis; true())",
    )
    result = normalize_template(value)
    assert result.result_expression == "AND(a.ergebnis; TRUE())"
    assert result.rules[0].expression == "Konto.kapital > 0"
