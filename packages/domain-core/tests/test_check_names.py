"""The recognized names of a check (web API ``/api/v1/check``) and the delivered templates."""

import pytest

from pipwerk_domain import limits
from pipwerk_domain.consistency import (
    check_strategy,
    check_strategy_with_names,
    check_template,
    check_template_with_names,
)
from pipwerk_domain.consistency import engine as engine_module
from pipwerk_domain.defaults import builtin_templates
from pipwerk_domain.documents import read_document
from pipwerk_domain.model import Strategy
from pipwerk_domain.risk_rule import RISK_PER_TRADE_RULE_ID, risk_per_trade_template
from tests.helpers import calculation, condition, connect, place_order, trigger, uid
from tests.paths import TESTCASE_DIRECTORY


def load(name: str) -> Strategy:
    value = read_document((TESTCASE_DIRECTORY / f"{name}.strategy.json").read_text("utf-8"))
    assert isinstance(value, Strategy)
    return value


def small_strategy(text: str) -> Strategy:
    return Strategy(
        id=uid(900),
        name="Test",
        elements=[trigger(1), condition(2, text), place_order(3)],
        connections=[connect(1, "weiter", 2), connect(2, "wahr", 3)],
    )


@pytest.mark.parametrize("name", ["str-01", "str-03"])
def test_the_findings_are_those_of_the_plain_check(name: str) -> None:
    strategy = load(name)
    result = check_strategy_with_names(strategy)
    assert result.findings == check_strategy(strategy)
    assert result.names_truncated is False
    assert result.expressions


@pytest.mark.parametrize("name", ["str-01", "str-03"])
def test_every_name_stands_at_its_position_in_the_expression(name: str) -> None:
    strategy = load(name)
    texts = {
        element.id: binding.value
        for element in strategy.elements
        for binding in element.parameters.values()
        if isinstance(binding.value, str)
    }
    checked = 0
    for expression in check_strategy_with_names(strategy).expressions:
        if expression.element is None or expression.field != "parameter:ausdruck":
            continue
        text = texts[expression.element]
        assert isinstance(text, str)
        for found in expression.names:
            assert found.resolved
            assert (
                text[found.start : found.end].lower().replace(" ", "") == found.identifier.lower()
            )
            assert [part.identifier for part in found.segments] == found.identifier.split(".")
            checked += 1
    assert checked > 0


def test_a_name_with_a_misspelling_is_recognized_in_its_spelling_of_the_identifier() -> None:
    result = check_strategy_with_names(small_strategy("ORDER.Volumen > 0"))
    names = [found for item in result.expressions for found in item.names]
    assert [(item.start, item.end, item.identifier) for item in names] == [(0, 13, "Order.volumen")]


def test_an_unknown_name_is_not_resolved_and_keeps_the_recognized_first_parts() -> None:
    result = check_strategy_with_names(small_strategy("Kerze.schlus > 1"))
    names = [found for item in result.expressions for found in item.names]
    assert len(names) == 1
    assert names[0].resolved is False
    assert [part.identifier for part in names[0].segments] == ["Kerze"]
    assert [item.code for item in result.findings if item.code == "expression.invalid"]


def test_a_name_without_any_known_part_has_no_segment() -> None:
    result = check_strategy_with_names(small_strategy("gibtesnicht.x > 1"))
    names = [found for item in result.expressions for found in item.names]
    assert len(names) == 1
    assert names[0].resolved is False
    assert names[0].segments == ()


def test_the_name_in_previous_is_marked() -> None:
    strategy = small_strategy("PREVIOUS(Kerze.schluss) > Kerze.schluss")
    result = check_strategy_with_names(strategy)
    names = [found for item in result.expressions for found in item.names]
    assert sorted(item.previous for item in names) == [False, True]


def test_the_expression_says_where_it_stands() -> None:
    result = check_strategy_with_names(small_strategy("Kerze.schluss > 1"))
    assert [(item.element, item.subject, item.field) for item in result.expressions] == [
        (uid(2), None, "parameter:ausdruck")
    ]


def test_an_expression_without_names_is_left_out() -> None:
    result = check_strategy_with_names(small_strategy("1 < 2"))
    assert result.expressions == []


def test_the_names_of_a_template_are_returned() -> None:
    template = risk_per_trade_template()
    result = check_template_with_names(template)
    assert result.findings == check_template(template)
    assert [item.field for item in result.expressions] == ["expression"]
    identifiers = {found.identifier for found in result.expressions[0].names}
    assert {
        "Order.volumen",
        "Konto.kapital",
        "risikogrenze",
        "Order.instrument.tickwert",
    } <= identifiers
    assert all(item.element is None for item in result.expressions)


def test_a_rule_of_a_strategy_names_its_subject() -> None:
    strategy = load("str-01")
    result = check_strategy_with_names(strategy)
    assert "risiko" in {item.subject for item in result.expressions}


def test_the_names_of_a_check_are_limited(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(engine_module, "MAX_NAMES_PER_CHECK", 3)
    result = check_strategy_with_names(
        small_strategy("Kerze.schluss + Kerze.hoch + Kerze.tief + Kerze.volumen > 1")
    )
    names = [found for item in result.expressions for found in item.names]
    assert len(names) == 3
    assert result.names_truncated is True


def test_exactly_the_limit_is_not_truncated(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(engine_module, "MAX_NAMES_PER_CHECK", 2)
    result = check_strategy_with_names(small_strategy("Kerze.schluss + Kerze.hoch > 1"))
    names = [found for item in result.expressions for found in item.names]
    assert len(names) == 2
    assert result.names_truncated is False


def test_the_limit_is_a_documented_constant() -> None:
    assert limits.MAX_NAMES_PER_CHECK == 20000


def test_the_calculation_names_are_collected_before_their_trees_are_released() -> None:
    strategy = Strategy(
        id=uid(900),
        name="Test",
        elements=[
            trigger(1),
            calculation(2, "a", "Kerze.schluss * 2"),
            place_order(3),
        ],
        connections=[connect(1, "weiter", 2), connect(2, "weiter", 3)],
    )
    result = check_strategy_with_names(strategy)
    assert [found.identifier for item in result.expressions for found in item.names] == [
        "Kerze.schluss"
    ]


def test_the_delivered_templates() -> None:
    first = builtin_templates()
    assert [item.id for item in first] == [RISK_PER_TRADE_RULE_ID]
    assert first == (risk_per_trade_template(),)
    assert builtin_templates()[0] is not first[0]  # new objects: a change does not stick
