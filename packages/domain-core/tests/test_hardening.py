"""Tests for the findings of the first test run: strategy parameters everywhere, numbers that
are no JSON, names and numbers in ASCII, long chains, faulty metadata of entry points and the
limit of findings."""

import json
import logging
import math
import sys
import time
import tracemalloc
from pathlib import Path
from typing import Any

import pytest

from pipwerk_domain import catalog, limits
from pipwerk_domain.consistency import Level, check_strategy, check_template
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.defaults import create_registry
from pipwerk_domain.documents import DocumentError, parse_document, read_document, write_document
from pipwerk_domain.expressions import Scope, analyze
from pipwerk_domain.model import (
    Binding,
    Connection,
    Element,
    Instance,
    Origin,
    PropertyDefinition,
    Strategy,
    StrategyParameter,
)
from pipwerk_domain.namespaces import is_valid_name, parameter_symbol
from pipwerk_domain.normalize import normalize_strategy
from pipwerk_domain.registry import ENTRY_POINT_GROUP
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
    indicator_instance,
    only,
    place_order,
    rule,
    ruleset,
    template,
    trigger,
    uid,
    valid_strategy,
)
from tests.paths import TESTCASE_DIRECTORY

HEAD = f'"format": "pipwerk.strategy", "format_version": "1.0", "id": "{uid(1)}", "title": "t"'


def text_with(extra: str) -> str:
    return "{" + HEAD + ", " + extra + "}"


# B1 of the function test: strategy parameters are known everywhere in the strategy ----------


def with_parameter() -> Strategy:
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("p", DataType.NUMBER, 1)]
    return strategy


def test_strategy_parameters_in_a_ruleset_of_the_strategy() -> None:
    strategy = with_parameter()
    strategy.rules.append(ruleset("werk", [rule("r", "Strategie.p > 0")]))
    assert check(strategy) == []
    strategy.rules[0].rules[0].expression = "Strategie.q > 0"
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert found[0].details["issue"] == "unknown_property"
    assert found[0].subject == "werk.r"


def test_strategy_parameters_in_an_indicator_instance() -> None:
    strategy = with_parameter()
    strategy.elements.append(
        element(
            5,
            "Indikator",
            instance=indicator_instance(
                "ind",
                properties=[PropertyDefinition("x", DataType.NUMBER, "Strategie.p * 2")],
                rules=[rule("r", "Strategie.p > 0")],
            ),
        )
    )
    assert check(strategy) == []
    strategy.elements[2].instance.properties[0].expression = "Strategie.q * 2"  # type: ignore[union-attr]
    assert only(check(strategy), fc.EXPRESSION_INVALID)


def test_strategy_parameters_in_a_trend_instance() -> None:
    strategy = with_parameter()
    strategy.elements.append(
        element(
            5,
            "Trend",
            instance=Instance(
                name="tr",
                object_type="Trend",
                origin=Origin("Trend"),
                parameter_values={
                    "zeiteinheit": fixed("h1"),
                    "berechnungsverfahren": fixed("trend_method.expression"),
                },
                properties=[PropertyDefinition("richtung", DataType.TEXT, '"a" & Strategie.p')],
            ),
        )
    )
    assert check(strategy) == []


def test_the_other_names_of_the_strategy_stay_invisible_there() -> None:
    strategy = with_parameter()
    strategy.elements.append(element(5, "EMA", instance=ema("ema20")))
    strategy.rules.append(ruleset("werk", [rule("r", "ema20.wert > 0")]))
    assert only(check(strategy), fc.EXPRESSION_INVALID)


@pytest.mark.parametrize(
    "object_type",
    [catalog.TYPE_RULE, catalog.TYPE_RULESET, catalog.TYPE_INDICATOR, catalog.TYPE_TREND],
)
def test_an_unknown_strategy_parameter_is_a_hint_in_every_template(object_type: str) -> None:
    contents: dict[str, Any] = {
        catalog.TYPE_RULE: {"expression": "Strategie.x > 1"},
        catalog.TYPE_RULESET: {"rules": [rule("r", "Strategie.x > 1")]},
        catalog.TYPE_INDICATOR: {
            "properties": [PropertyDefinition("e", DataType.NUMBER, "Strategie.x")]
        },
        catalog.TYPE_TREND: {
            "properties": [PropertyDefinition("richtung", DataType.TEXT, "Strategie.x")],
            "parameter_values": {
                "zeiteinheit": fixed("h1"),
                "berechnungsverfahren": fixed("trend_method.expression"),
            },
        },
    }
    found = check_template(template(object_type, **contents[object_type]))
    assert codes(found) == [fc.RULE_UNRESOLVED_NAME]
    assert found[0].level is Level.HINT
    assert found[0].details["name"] == "Strategie.x"


def test_a_template_may_not_use_other_unknown_names() -> None:
    found = check_template(template(catalog.TYPE_RULESET, rules=[rule("r", "gibtsnicht > 1")]))
    assert codes(found) == [fc.EXPRESSION_INVALID]
    found = check_template(
        template(
            catalog.TYPE_INDICATOR,
            properties=[PropertyDefinition("e", DataType.NUMBER, "gibtsnicht")],
        )
    )
    assert codes(found) == [fc.EXPRESSION_INVALID]


# B2, B3: numbers that are no JSON values ---------------------------------------------------------

PLACES = {
    "strategy parameter": '"parameters": [{"name": "a", "datatype": "number", "value": %s}]',
    "coordinate": '"elements": [{"id": "' + uid(2) + '", "type": "t", "x": %s}]',
    "coordinate y": '"elements": [{"id": "' + uid(2) + '", "type": "t", "y": %s}]',
    "fixed value": '"elements": [{"id": "'
    + uid(2)
    + '", "type": "t", "parameters": {"a": {"kind": "fixed", "value": %s}}}]',
    "default": '"rules": [{"name": "r", "object_type": "Regel", "parameters": '
    '[{"name": "a", "datatype": "number", "default": %s}]}]',
}


@pytest.mark.parametrize("literal", ["NaN", "Infinity", "-Infinity", "1e999", "-1e999"])
@pytest.mark.parametrize("place", sorted(PLACES))
def test_numbers_that_are_no_json_values_are_rejected(place: str, literal: str) -> None:
    text = text_with(PLACES[place] % literal)
    with pytest.raises(DocumentError):
        parse_document(text)
    with pytest.raises(DocumentError):
        read_document(text.encode())


def test_finite_numbers_are_still_accepted() -> None:
    for literal in ("0", "-1.5", "1e300", "1E-5"):
        parse_document(text_with(PLACES["strategy parameter"] % literal))


@pytest.mark.parametrize("value", [math.nan, math.inf, -math.inf])
def test_python_objects_with_non_finite_numbers_are_rejected(value: float) -> None:
    with pytest.raises(DocumentError):
        parse_document(
            {
                "format": "pipwerk.strategy",
                "format_version": "1.0",
                "id": uid(1),
                "title": "t",
                "elements": [{"id": uid(2), "type": "t", "x": value}],
            }
        )
    strategy = valid_strategy()
    strategy.elements[0].x = value
    with pytest.raises(DocumentError):
        write_document(strategy)
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("a", DataType.NUMBER, value)]
    with pytest.raises(DocumentError):
        write_document(strategy)
    strategy = valid_strategy()
    strategy.elements[1].properties["volumen"] = Binding(BindingKind.FIXED, value)
    with pytest.raises(DocumentError):
        write_document(strategy)


def test_the_consistency_check_rejects_a_non_finite_fixed_value() -> None:
    strategy = valid_strategy()
    strategy.elements[1].properties["volumen"] = Binding(BindingKind.FIXED, math.nan)
    found = only(check(strategy), fc.PARAMETER_BINDING_INVALID)
    assert found[0].details["reason"] == "type"
    strategy.parameters = [StrategyParameter("a", DataType.NUMBER, math.inf)]
    assert len(only(check(strategy), fc.PARAMETER_BINDING_INVALID)) == 2


@pytest.mark.parametrize("name", ["str-01", "str-03"])
def test_written_documents_are_valid_json_for_strict_readers(name: str) -> None:
    def refuse(constant: str) -> None:
        raise AssertionError(constant)

    strategy = read_document((TESTCASE_DIRECTORY / f"{name}.strategy.json").read_text("utf-8"))
    assert isinstance(strategy, Strategy)
    json.loads(write_document(strategy), parse_constant=refuse)


# Sicherheit H5: a key twice in a JSON object ----------------------------------------------------


def test_a_key_twice_in_an_object_is_rejected() -> None:
    twice = "{" + HEAD + ', "title": "y"}'
    with pytest.raises(DocumentError):
        parse_document(twice)
    with pytest.raises(DocumentError):
        read_document(twice.encode())
    nested = text_with('"elements": [{"id": "' + uid(2) + '", "type": "a", "type": "b"}]')
    with pytest.raises(DocumentError):
        parse_document(nested)
    inner = text_with(
        '"rules": [{"name": "r", "object_type": "Regel", "parameter_values": '
        '{"a": {"kind": "fixed", "value": 1}, "a": {"kind": "fixed", "value": 2}}}]'
    )
    with pytest.raises(DocumentError):
        parse_document(inner)


def test_a_document_without_a_repeated_key_is_still_read() -> None:
    document = parse_document(text_with('"description": "d"'))
    assert document.title == "t"


def test_problems_of_the_json_text_are_validation_errors() -> None:
    for text in ("{", "", "1" * 5000, "[" * 10000, '{"a": 1}{'):
        with pytest.raises(DocumentError):
            parse_document(text)
    with pytest.raises(DocumentError):
        parse_document(b"\xff\xfe\x00")


# B4: names and numbers only in ASCII ------------------------------------------------------


@pytest.mark.parametrize("name", ["a", "_a", "A1", "ema_20", "a_", "_", "Z9_z"])
def test_valid_names(name: str) -> None:
    assert is_valid_name(name)


@pytest.mark.parametrize(
    "name",
    [
        "",
        "1a",
        "a b",
        "ema20\n",
        "\nema20",
        "ema\n20",
        "ema20 ",
        "a.b",
        "еma20",  # Cyrillic e
        "ema2а",
        "ä",
        "aßb",
        "٣",  # Arabic-indic digit
        "a٣",
        "a１",  # full-width digit
        "Ａ",  # full-width letter
        "a b",
        "a\x00",
    ],
)
def test_invalid_names(name: str) -> None:
    assert not is_valid_name(name)


def test_names_with_a_line_feed_or_another_script_are_a_finding() -> None:
    for bad in ("ema20\n", "еma20", "ema٣"):
        strategy = valid_strategy()
        strategy.elements.append(element(5, "EMA", instance=ema(bad)))
        found = only(check(strategy), fc.NAME_INVALID)
        assert [item.details["name"] for item in found] == [bad]
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "c\n", "1"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 2)]
    assert only(check(strategy), fc.NAME_INVALID)
    strategy = valid_strategy()
    strategy.rules.append(rule("r\n", "TRUE()"))
    assert only(check(strategy), fc.NAME_INVALID)
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("p\n", DataType.NUMBER, 1)]
    assert only(check(strategy), fc.NAME_INVALID)


def test_an_instance_with_a_look_alike_name_is_not_the_instance_of_the_ascii_name() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("ema20")))
    strategy.elements.append(element(6, "EMA", instance=ema("еma20")))
    found = check(strategy)
    assert [item.element for item in only(found, fc.NAME_INVALID)] == [uid(6)]
    assert only(found, fc.NAME_DUPLICATE) == []


@pytest.mark.parametrize(
    "text",
    ["٣ + 1", "１ + 1", "1 + ١٢", "12٣", "1.٥", "еma20 + 1"],
)
def test_expressions_take_only_ascii_numbers_and_names(text: str) -> None:
    result = analyze(text, Scope())
    assert [item.kind.value for item in result.issues] == ["syntax"]
    assert result.issues[0].reason in ("invalid_character", "invalid_number")


# Sicherheit B1: long chains of calculations


def chain_strategy(length: int, *, closing: str = "1") -> Strategy:
    """A trigger, `length` calculations that use the result of the next one, and an order:
    1000 elements at the limit."""
    elements: list[Element] = [trigger(1)]
    connections: list[Connection] = []
    for index in range(length):
        number = index + 2
        text = f"c{index + 1}.ergebnis + 1" if index < length - 1 else closing
        elements.append(calculation(number, f"c{index}", text))
        connections.append(connect(number - 1, "weiter", number))
    elements.append(place_order(length + 2))
    connections.append(connect(length + 1, "weiter", length + 2))
    return Strategy(id=uid(900), title="kette", elements=elements, connections=connections)


def test_a_chain_of_calculations_up_to_the_limit_of_elements() -> None:
    strategy = chain_strategy(limits.MAX_ELEMENTS - 2)
    assert len(strategy.elements) == limits.MAX_ELEMENTS
    assert check(strategy) == []
    result = normalize_strategy(strategy)
    assert result == strategy


def test_the_types_pass_through_the_whole_chain() -> None:
    strategy = chain_strategy(limits.MAX_ELEMENTS - 2)
    # the result of the first calculation is a number: a condition needs a truth value
    strategy.elements.insert(1, condition(2000, "c0.ergebnis"))
    strategy.connections = [
        connect(1, "weiter", 2000),
        connect(2000, "wahr", 2),
        *strategy.connections[1:],
    ]
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert [item.element for item in found] == [uid(2000)]
    assert found[0].details["issue"] == "type_mismatch"
    # the closing calculation is a text, so the `+ 1` that uses it is a faulty operand; the
    # types of all other calculations in the chain stay numbers
    bad = chain_strategy(limits.MAX_ELEMENTS - 2, closing='"text"')
    found = only(check(bad), fc.EXPRESSION_INVALID)
    assert [item.element for item in found] == [bad.elements[-3].id]


def test_a_chain_with_a_faulty_end_is_found_at_the_place_of_the_fault() -> None:
    strategy = chain_strategy(500, closing="1 +")
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert [item.details["issue"] for item in found] == ["syntax"]


@pytest.mark.parametrize("size", [1, 2, 3, 500, limits.MAX_ELEMENTS - 2])
def test_a_cycle_between_results_is_a_finding_without_endless_recursion(size: int) -> None:
    strategy = chain_strategy(size)
    last = strategy.elements[size]  # the closing calculation uses the first one
    last.parameters["ausdruck"] = expr("c0.ergebnis + 1")
    found = check(strategy)
    circular = only(found, fc.CALCULATION_CIRCULAR)
    assert len(circular) == 1
    assert circular[0].level is Level.ERROR
    assert len(circular[0].details["elements"]) == size  # type: ignore[arg-type]
    assert circular[0].element == uid(2)


def test_a_calculation_that_uses_its_own_result() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "a", "a.ergebnis + 1"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 2)]
    assert len(only(check(strategy), fc.CALCULATION_CIRCULAR)) == 1
    strategy.elements[1].parameters["ausdruck"] = expr("1")
    assert only(check(strategy), fc.CALCULATION_CIRCULAR) == []


def test_calculations_that_use_each_other_without_a_cycle_are_valid() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "a", "b.ergebnis + c.ergebnis"))
    strategy.elements.insert(2, calculation(6, "b", "c.ergebnis * 2"))
    strategy.elements.insert(3, calculation(7, "c", "1"))
    strategy.connections = [
        connect(1, "weiter", 5),
        connect(5, "weiter", 6),
        connect(6, "weiter", 7),
        connect(7, "weiter", 2),
    ]
    assert check(strategy) == []


def test_rules_in_a_long_chain() -> None:
    strategy = valid_strategy()
    rules = [rule("r0", "Order.volumen > 0")]
    rules += [rule(f"r{n}", f"r{n - 1}.ergebnis") for n in range(1, limits.MAX_RULES_PER_LIST)]
    strategy.rules = rules
    assert check(strategy) == []


# Sicherheit B2, H4: faulty entry points


def test_faulty_metadata_of_the_entry_points_leave_the_delivered_types(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    leak = "/hidden/dist-info/entry_points.txt"

    def broken(**_: object) -> list[object]:
        raise TypeError(leak)

    monkeypatch.setattr("pipwerk_domain.registry.entry_points", broken)
    with caplog.at_level(logging.WARNING, logger="pipwerk_domain.registry"):
        registry = create_registry()
    assert registry.get(catalog.TRIGGER_TICK) is not None
    assert len(registry) > 20
    assert "TypeError" in caplog.text
    assert leak not in caplog.text
    assert all(record.exc_info is None for record in caplog.records)


def test_a_line_without_equals_sign_in_a_package_of_any_group(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    for group in (ENTRY_POINT_GROUP, "other.group"):
        info = tmp_path / f"badpkg_{group.replace('.', '_')}-1.0.dist-info"
        info.mkdir()
        (info / "METADATA").write_text(
            f"Metadata-Version: 2.1\nName: badpkg-{group.replace('.', '-')}\nVersion: 1.0\n",
            encoding="utf-8",
        )
        (info / "entry_points.txt").write_text(f"[{group}]\nnoeq\n", encoding="utf-8")
    monkeypatch.syspath_prepend(str(tmp_path))
    with caplog.at_level(logging.WARNING, logger="pipwerk_domain.registry"):
        registry = create_registry()
    assert registry.get("EMA") is not None
    assert len(registry) > 20
    assert str(tmp_path) not in caplog.text


class _Exiting:
    name = "exits"

    def load(self) -> object:
        raise SystemExit(3)


class _Fine:
    name = "fine"

    def load(self) -> object:
        return create_registry(entry_points=False).get("EMA")


def test_an_entry_point_that_exits_does_not_end_the_process(
    caplog: pytest.LogCaptureFixture,
) -> None:
    registry = create_registry(entry_points=False)
    with caplog.at_level(logging.WARNING, logger="pipwerk_domain.registry"):
        report = registry.load_entry_points([_Exiting(), _Fine()])
    assert report.failed == ("exits", "fine")  # `fine` repeats EMA: a duplicate
    assert "SystemExit" in caplog.text
    assert registry.get("EMA") is not None


def test_a_package_whose_import_exits(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    package = tmp_path / "exitingplugin"
    package.mkdir()
    (package / "__init__.py").write_text("raise SystemExit(5)\n", encoding="utf-8")
    info = tmp_path / "exitingplugin-1.0.dist-info"
    info.mkdir()
    (info / "METADATA").write_text(
        "Metadata-Version: 2.1\nName: exitingplugin\nVersion: 1.0\n", encoding="utf-8"
    )
    (info / "entry_points.txt").write_text(
        f"[{ENTRY_POINT_GROUP}]\nexits = exitingplugin:register\n", encoding="utf-8"
    )
    monkeypatch.syspath_prepend(str(tmp_path))
    registry = create_registry(entry_points=False)
    report = registry.load_entry_points()
    assert "exits" in report.failed
    sys.modules.pop("exitingplugin", None)


# Sicherheit B4: the number of findings is limited


def many_names(count: int) -> str:
    return "+".join(["q"] * count)


def test_the_limits_of_findings() -> None:
    assert limits.MAX_FINDINGS_PER_EXPRESSION == 50
    assert limits.MAX_FINDINGS_PER_CHECK == 1000


def test_an_expression_reports_at_most_50_findings() -> None:
    result = analyze(many_names(200), Scope())
    assert len(result.issues) == limits.MAX_FINDINGS_PER_EXPRESSION
    assert result.truncated
    assert len(analyze(many_names(50), Scope()).issues) == 50
    assert not analyze(many_names(50), Scope()).truncated
    assert analyze(many_names(51), Scope()).truncated


def test_the_check_adds_the_finding_findings_truncated_for_an_expression() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "a", many_names(200)))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 2)]
    found = check(strategy)
    assert len(only(found, fc.EXPRESSION_INVALID)) == 50
    truncated = only(found, fc.FINDINGS_TRUNCATED)
    assert len(truncated) == 1
    assert truncated[0].level is Level.ERROR
    assert truncated[0].element is None
    assert truncated[0].details["limit"] == 50
    assert truncated[0].details["scope"] == "expression"
    assert truncated[0].details["element_id"] == uid(5)
    strategy.elements[1].parameters["ausdruck"] = expr(many_names(50))
    assert only(check(strategy), fc.FINDINGS_TRUNCATED) == []


def test_a_check_ends_at_1000_findings() -> None:
    strategy = valid_strategy()
    elements = [trigger(1)]
    connections = []
    for number in range(2, 102):
        elements.append(calculation(number, f"c{number}", many_names(30)))
        connections.append(connect(number - 1, "weiter", number))
    elements.append(place_order(200))
    connections.append(connect(101, "weiter", 200))
    strategy.elements = elements
    strategy.connections = connections
    found = check(strategy)
    assert len(found) == limits.MAX_FINDINGS_PER_CHECK + 1
    last = found[-1]
    assert last.code == fc.FINDINGS_TRUNCATED
    assert last.level is Level.ERROR
    assert last.element is None
    assert last.details == {"limit": 1000, "scope": "check"}
    assert [item.code for item in found[:-1]] == [fc.EXPRESSION_INVALID] * 1000


def test_exactly_1000_findings_are_all_reported_without_the_extra_finding() -> None:
    strategy = valid_strategy()
    elements = [trigger(1)]
    connections = []
    for number in range(2, 22):
        elements.append(calculation(number, f"c{number}", many_names(50)))
        connections.append(connect(number - 1, "weiter", number))
    elements.append(place_order(200))
    connections.append(connect(21, "weiter", 200))
    strategy.elements = elements
    strategy.connections = connections
    found = check(strategy)
    # 20 expressions of exactly 50 findings: the limit of the check is reached at the end
    assert len(only(found, fc.EXPRESSION_INVALID)) == 1000
    assert [item.code for item in found if item.code == fc.FINDINGS_TRUNCATED] == []


def test_a_template_check_is_limited_too() -> None:
    rules = [rule(f"r{n}", many_names(60)) for n in range(40)]
    found = check_template(template(catalog.TYPE_RULESET, rules=rules))
    assert len(found) <= limits.MAX_FINDINGS_PER_CHECK + 1
    assert found[-1].code == fc.FINDINGS_TRUNCATED


def test_a_document_of_2_mib_is_checked_within_time_and_memory() -> None:
    elements: list[Element] = [trigger(1)]
    connections: list[Connection] = []
    expression = many_names(2048)
    for number in range(2, 442):
        elements.append(calculation(number, f"c{number}", expression))
        connections.append(connect(number - 1, "weiter", number))
    strategy = Strategy(id=uid(900), title="gross", elements=elements, connections=connections)
    text = write_document(strategy)
    size = len(text.encode())
    assert limits.MAX_DOCUMENT_BYTES * 0.9 < size <= limits.MAX_DOCUMENT_BYTES
    loaded = read_document(text)
    assert isinstance(loaded, Strategy)
    tracemalloc.start()
    started = time.perf_counter()
    found = check_strategy(loaded)
    seconds = time.perf_counter() - started
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    assert seconds < 5
    assert peak < 200 * 1024 * 1024
    assert len(found) == limits.MAX_FINDINGS_PER_CHECK + 1
    assert found[-1].code == fc.FINDINGS_TRUNCATED


def test_normalization_of_a_hostile_document_is_bounded() -> None:
    elements: list[Element] = [trigger(1)]
    connections: list[Connection] = []
    for number in range(2, 200):
        elements.append(calculation(number, f"c{number}", many_names(2048)))
        connections.append(connect(number - 1, "weiter", number))
    strategy = Strategy(id=uid(900), title="gross", elements=elements, connections=connections)
    started = time.perf_counter()
    result = normalize_strategy(strategy)
    assert time.perf_counter() - started < 10
    assert len(result.elements) == len(strategy.elements)


# H5, H7 of the function test


def test_a_text_that_is_no_value_is_marked_in_the_branches_of_if() -> None:
    source = 'IF(TRUE(); "buy"; "x")'
    from pipwerk_domain.expressions.exprtypes import ExprType

    result = analyze(source, Scope(), ExprType(DataType.CHOICE, choices=("buy", "sell")))
    assert len(result.issues) == 1
    issue = result.issues[0]
    assert issue.kind.value == "unknown_choice_value"
    assert source[issue.start : issue.end] == '"x"'
    assert issue.details["values"] == ["x"]
    both = analyze('IF(TRUE(); "a"; "b")', Scope(), ExprType(DataType.CHOICE, choices=("buy",)))
    assert [item.details["values"] for item in both.issues] == [["a"], ["b"]]
    nested = analyze(
        'IF(TRUE(); ("a"); IF(FALSE(); "buy"; "c"))',
        Scope(),
        ExprType(DataType.CHOICE, choices=("buy",)),
    )
    texts = [nested.source[item.start : item.end] for item in nested.issues]
    assert texts == ['"a"', '"c"']


def test_a_text_in_a_comparison_with_if_is_marked() -> None:
    scope = Scope()
    scope.add(parameter_symbol("mode", DataType.CHOICE, ("fast", "slow")))
    source = 'mode = IF(TRUE(); "fast"; "other")'
    result = analyze(source, scope)
    assert [source[item.start : item.end] for item in result.issues] == ['"other"']


def trend(**kwargs: Any) -> Instance:
    return Instance(
        name="tr",
        object_type="Trend",
        origin=Origin("Trend"),
        parameter_values={
            "zeiteinheit": fixed("h1"),
            "berechnungsverfahren": fixed("trend_method.expression"),
        },
        **kwargs,
    )


def test_a_trend_with_the_method_expression_needs_a_direction() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "Trend", instance=trend()))
    found = only(check(strategy), fc.TREND_DIRECTION_MISSING)
    assert [(item.element, item.subject) for item in found] == [(uid(5), "tr")]
    assert found[0].level is Level.ERROR
    assert found[0].details == {"property": "richtung"}
    strategy.elements[2].instance = trend(
        properties=[PropertyDefinition("Richtung", DataType.TEXT, '"aufwaerts"')]
    )
    assert check(strategy) == []


def test_a_trend_without_a_method_value_uses_the_default_method() -> None:
    strategy = valid_strategy()
    instance = trend()
    del instance.parameter_values["berechnungsverfahren"]
    strategy.elements.append(element(5, "Trend", instance=instance))
    assert only(check(strategy), fc.TREND_DIRECTION_MISSING)


def test_a_trend_template_needs_a_direction_and_another_method_does_not() -> None:
    value = template(
        catalog.TYPE_TREND,
        parameter_values={
            "zeiteinheit": fixed("h1"),
            "berechnungsverfahren": fixed("trend_method.expression"),
        },
    )
    found = check_template(value)
    assert codes(found) == [fc.TREND_DIRECTION_MISSING]
    assert found[0].element is None
    value.properties.append(PropertyDefinition("richtung", DataType.TEXT, '"a"'))
    assert check_template(value) == []
    other = template(
        catalog.TYPE_TREND,
        parameter_values={
            "zeiteinheit": fixed("h1"),
            "berechnungsverfahren": fixed("trend_method.other"),
        },
    )
    assert fc.TREND_DIRECTION_MISSING not in codes(check_template(other))


def test_an_indicator_needs_no_direction() -> None:
    assert check_template(template(catalog.TYPE_INDICATOR)) == []


# str-01: the new stop loss follows the direction of the order


def test_str_01_management_calculations_use_the_direction_of_the_order() -> None:
    strategy = read_document((TESTCASE_DIRECTORY / "str-01.strategy.json").read_text("utf-8"))
    assert isinstance(strategy, Strategy)
    order = next(item for item in strategy.elements if item.type == catalog.FLOW_PLACE_ORDER)
    management = strategy.management(order.id)
    assert management is not None
    calculations = {item.name: item for item in management.elements if item.name}
    assert set(calculations) == {"stop_neu", "ziel_neu"}
    for name, item in calculations.items():
        text = str(item.parameters["ausdruck"].value)
        assert text.startswith('IF(Order.richtung = "buy"; '), name
        assert "mt_signal" not in text, name
    # the long side takes the stop below point 1/3, the short side above it plus the spread
    stop = str(calculations["stop_neu"].parameters["ausdruck"].value)
    assert stop == (
        'IF(Order.richtung = "buy"; mt_handel.punkt_13 - Strategie.stop_puffer * Instrument.pip; '
        "mt_handel.punkt_13 + Strategie.stop_puffer * Instrument.pip + Instrument.spread)"
    )
    # in the main flow the direction of the signal time unit decides, there is no order yet
    main = [item for item in strategy.main_elements() if item.name in ("einstieg", "stop", "ziel")]
    assert len(main) == 3
    for item in main:
        assert 'mt_signal.trendrichtung = "aufwaerts"' in str(item.parameters["ausdruck"].value)
