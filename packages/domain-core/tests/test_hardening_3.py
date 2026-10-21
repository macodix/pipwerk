"""Tests for the findings of the third test run: one place that counts the findings of an
expression, time limits measured without tracemalloc, a normalization that has to rewrite every
expression, and a check for single surrogates that ends for every input."""

import time
import tracemalloc

import pytest

from pipwerk_domain import catalog, limits
from pipwerk_domain.consistency import Finding, check_template
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.documents import DocumentError, parse_document, read_document, write_document
from pipwerk_domain.model import Connection, Element, PropertyDefinition, Strategy
from pipwerk_domain.normalize import normalize_strategy
from pipwerk_domain.typedesc import DataType
from tests.helpers import (
    calculation,
    check,
    connect,
    only,
    rule,
    ruleset,
    template,
    trigger,
    uid,
    valid_strategy,
)

LIMIT = limits.MAX_FINDINGS_PER_EXPRESSION
TIME_LIMIT_SECONDS = (
    15.0  # measured 0.95 s for the normalization of 2 MiB on the development machine
)


def names(count: int, name: str = "q") -> str:
    return "+".join([name] * count)


def of_expression(found: list[Finding], field: str) -> list[Finding]:
    """The findings of one expression: those that name its field, and the truncation."""
    return [
        item
        for item in found
        if item.details.get("field") == field or item.code == fc.RULE_RESULT_MISMATCH
    ]  # a result mismatch names no field: it belongs to the expression of its rule


def assert_limited(found: list[Finding], field: str, *, truncated: bool) -> None:
    own = of_expression(found, field)
    marks = only(own, fc.FINDINGS_TRUNCATED)
    if truncated:
        assert len(own) == LIMIT + 1
        assert len(marks) == 1
        assert own[-1] is marks[0]
        assert marks[0].details["scope"] == "expression"
        assert marks[0].details["limit"] == LIMIT
        # nothing of this expression comes after the truncation, also not in the whole list
        assert found.index(marks[0]) == max(found.index(item) for item in own)
    else:
        assert len(own) == LIMIT
        assert marks == []


def order_strategy(expression: str) -> Strategy:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "wert", expression))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 2)]
    return strategy


# Point 1 and 2: one place counts the findings of an expression ------------------------------


def test_50_findings_of_the_parser_and_the_order_outside_the_management_are_cut() -> None:
    found = check(order_strategy(names(60) + "+Order.volumen"))
    assert len(only(found, fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT)) == 0  # cut off
    assert_limited(found, "parameter:ausdruck", truncated=True)


def test_49_findings_and_the_order_outside_the_management_are_not_cut() -> None:
    found = check(order_strategy(names(49) + "+Order.volumen"))
    assert len(only(found, fc.EXPRESSION_INVALID)) == LIMIT - 1
    assert len(only(found, fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT)) == 1
    assert_limited(found, "parameter:ausdruck", truncated=False)


def test_the_order_outside_the_management_is_the_last_finding_within_the_limit() -> None:
    found = check(order_strategy(names(10) + "+Order.volumen"))
    assert found[-1].code == fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT
    assert only(found, fc.FINDINGS_TRUNCATED) == []


def rule_strategy(count: int, suffix: str) -> Strategy:
    strategy = valid_strategy()
    strategy.rules.append(rule("r", names(count) + suffix))
    return strategy


def test_50_findings_and_a_result_mismatch_are_cut() -> None:
    found = check(rule_strategy(60, "+1"))
    assert only(found, fc.RULE_RESULT_MISMATCH) == []
    assert_limited(found, "expression", truncated=True)
    assert found[-1].code == fc.FINDINGS_TRUNCATED


def test_49_findings_and_a_result_mismatch_are_not_cut() -> None:
    found = check(rule_strategy(49, "+1"))
    assert len(only(found, fc.EXPRESSION_INVALID)) == LIMIT - 1
    assert len(only(found, fc.RULE_RESULT_MISMATCH)) == 1
    assert_limited(found, "expression", truncated=False)


def test_a_result_mismatch_alone_is_reported() -> None:
    found = check(rule_strategy(0, "1+1"))
    assert len(only(found, fc.RULE_RESULT_MISMATCH)) == 1


def test_a_template_with_hints_and_an_error_is_limited_to_50() -> None:
    expression = "+".join(["Strategie.x"] * 40 + ["Foo(1)"] * 40) + " > 0"  # hints and errors
    found = check_template(template(catalog.TYPE_RULE, expression=expression))
    own = [item for item in found if item.code != fc.FINDINGS_TRUNCATED]
    assert len(own) == LIMIT
    assert {item.code for item in own} == {fc.RULE_UNRESOLVED_NAME, fc.EXPRESSION_INVALID}
    assert len(found) == LIMIT + 1
    assert found[-1].code == fc.FINDINGS_TRUNCATED
    assert found[-1].details["scope"] == "expression"


def test_a_template_with_49_findings_and_a_hint_is_not_cut() -> None:
    expression = "+".join(["Strategie.x"] * 49 + ["Foo(1)"]) + " > 0"  # 49 hints, 1 error
    found = check_template(template(catalog.TYPE_RULE, expression=expression))
    assert len(found) == LIMIT
    assert only(found, fc.FINDINGS_TRUNCATED) == []


# Durchlauf 4: `rule.order_in_indicator` counts like the other four findings of an expression


def indicator_rule_findings(count: int) -> list[Finding]:
    expression = names(count, "Strategie.x") + "+Order.volumen > 0"
    return check_template(template(catalog.TYPE_INDICATOR, rules=[rule("r", expression)]))


def indicator_ruleset_findings(count: int) -> list[Finding]:
    result = names(count, "Strategie.x") + "+Order.volumen > 0"
    inner = rule("a", "Konto.kapital > 0")
    value = template(
        catalog.TYPE_INDICATOR, rules=[ruleset("werk", [inner], result_expression=result)]
    )
    return check_template(value)


def assert_order_cut(found: list[Finding], field: str) -> None:
    own = [item for item in found if item.details.get("field") in (field, None)]
    assert len(own) == LIMIT + 1
    assert own[-1].code == fc.FINDINGS_TRUNCATED
    assert own[-1].details["scope"] == "expression"
    assert own[-1].details["field"] == field
    assert len(only(found, fc.FINDINGS_TRUNCATED)) == 1
    assert found[-1] is own[-1]


def test_50_findings_and_the_order_of_a_rule_in_an_indicator_are_cut() -> None:
    found = indicator_rule_findings(60)
    assert_order_cut(found, "expression")


def test_49_findings_and_the_order_of_a_rule_in_an_indicator_are_not_cut() -> None:
    found = indicator_rule_findings(49)
    assert len(only(found, fc.RULE_ORDER_IN_INDICATOR)) == 1
    assert only(found, fc.FINDINGS_TRUNCATED) == []
    assert len(found) == LIMIT


def test_50_findings_and_the_order_of_a_ruleset_in_an_indicator_are_cut() -> None:
    found = indicator_ruleset_findings(60)
    assert_order_cut(found, "result_expression")


def test_49_findings_and_the_order_of_a_ruleset_in_an_indicator_are_not_cut() -> None:
    found = indicator_ruleset_findings(49)
    assert len(only(found, fc.RULE_ORDER_IN_INDICATOR)) == 1
    assert only(found, fc.FINDINGS_TRUNCATED) == []
    assert len(found) == LIMIT


def test_the_limit_counts_each_expression_on_its_own() -> None:
    strategy = order_strategy(names(60))
    strategy.elements.insert(2, calculation(6, "zwei", names(60)))
    strategy.connections = [
        connect(1, "weiter", 5),
        connect(5, "weiter", 6),
        connect(6, "weiter", 2),
    ]
    found = check(strategy)
    assert len(only(found, fc.FINDINGS_TRUNCATED)) == 2


def test_an_indicator_template_with_many_hints_is_cut_per_property() -> None:
    expression = names(120, "Strategie.x")
    found = check_template(
        template(
            catalog.TYPE_INDICATOR,
            properties=[
                PropertyDefinition("a", DataType.NUMBER, expression),
                PropertyDefinition("b", DataType.NUMBER, expression),
            ],
        )
    )
    assert len(only(found, fc.FINDINGS_TRUNCATED)) == 2
    assert len(only(found, fc.RULE_UNRESOLVED_NAME)) == 2 * LIMIT


# Point 3: time limits are measured without tracemalloc (the tests of the check, of the
# normalization and of the hints in test_hardening.py and test_hardening_2.py do the same).
# The limits protect against an outlier of the run time (a factor of at least 10 above the
# measured time on the development machine); they are no response times.


def hostile_strategy(count: int, expression: str) -> Strategy:
    elements: list[Element] = [trigger(1)]
    connections: list[Connection] = []
    for number in range(2, count + 2):
        elements.append(calculation(number, f"c{number}", expression))
        connections.append(connect(number - 1, "weiter", number))
    return Strategy(id=uid(900), name="gross", elements=elements, connections=connections)


# Point 4: the normalization of 2 MiB has to parse and rewrite every expression ----------------


def rewriting_expression(length: int = 4000) -> str:
    """An expression of nearly ``length`` characters in which every name is written wrongly."""
    unit = "KONTO.Kapital+"
    return (unit * (length // len(unit)))[:-1]


def test_the_normalization_of_2_mib_rewrites_every_expression() -> None:
    expression = rewriting_expression()
    count = 450
    strategy = hostile_strategy(count, expression)
    text = write_document(strategy)
    assert limits.MAX_DOCUMENT_BYTES * 0.9 < len(text.encode()) <= limits.MAX_DOCUMENT_BYTES
    loaded = read_document(text)
    assert isinstance(loaded, Strategy)
    assert not tracemalloc.is_tracing()
    started = time.perf_counter()
    result = normalize_strategy(loaded)
    seconds = time.perf_counter() - started
    assert seconds < TIME_LIMIT_SECONDS
    rewritten = expression.replace("KONTO.Kapital", "Konto.kapital")
    assert rewritten != expression
    for item in result.elements[1:]:
        assert item.parameters["ausdruck"].value == rewritten  # every expression was rewritten
    assert result != loaded


# Point 6: the check for single surrogates ends for every input --------------------------------


def test_an_object_with_a_cycle_is_a_document_error() -> None:
    elements: list[object] = []
    elements.append(elements)
    data: dict[str, object] = {
        "format": "pipwerk.strategy",
        "format_version": "2.0",
        "id": uid(1),
        "name": "t",
        "elements": elements,
    }
    with pytest.raises(DocumentError):
        parse_document(data)
    cyclic: dict[str, object] = {}
    cyclic["self"] = cyclic
    with pytest.raises(DocumentError):
        parse_document(cyclic)


def test_a_part_that_is_attached_many_times_is_walked_once() -> None:
    shared: list[object] = ["a"]
    for _ in range(40):  # without a record of visited parts this is 2**40 steps
        shared = [shared, shared]
    data: dict[str, object] = {
        "format": "pipwerk.strategy",
        "format_version": "2.0",
        "id": uid(1),
        "name": "t",
        "elements": shared,
    }
    started = time.perf_counter()
    with pytest.raises(DocumentError):  # the shared part is no element
        parse_document(data)
    assert time.perf_counter() - started < TIME_LIMIT_SECONDS


def test_a_part_attached_many_times_with_a_surrogate_is_rejected() -> None:
    shared: list[object] = ["a\ud800"]
    data: dict[str, object] = {
        "format": "pipwerk.strategy",
        "format_version": "2.0",
        "id": uid(1),
        "name": "t",
        "elements": [shared, shared],
    }
    with pytest.raises(DocumentError):
        parse_document(data)
