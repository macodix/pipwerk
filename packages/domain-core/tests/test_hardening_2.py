"""Tests for the findings of the second test run: entry points per package, one limit for all
findings of an expression, single surrogates, the encoding of bytes, PREVIOUS and a cheap
normalization."""

import logging
import sys
import textwrap
import time
import tracemalloc
from pathlib import Path

import pytest

from pipwerk_domain import catalog, limits
from pipwerk_domain.consistency import check_strategy, check_template
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.consistency.engine import Checker
from pipwerk_domain.defaults import create_registry, default_registry
from pipwerk_domain.documents import DocumentError, parse_document, read_document, write_document
from pipwerk_domain.model import Connection, Element, PropertyDefinition, Strategy
from pipwerk_domain.normalize import normalize_strategy, normalize_template
from pipwerk_domain.registry import ENTRY_POINT_GROUP
from pipwerk_domain.typedesc import DataType
from tests.helpers import (
    calculation,
    check,
    connect,
    expr,
    only,
    rule,
    ruleset,
    template,
    trigger,
    uid,
    valid_strategy,
)

HEAD = f'"format": "pipwerk.strategy", "format_version": "1.0", "id": "{uid(1)}"'


def make_package(root: Path, name: str, entry_points_text: str, module: str | None = None) -> None:
    info = root / f"{name}-1.0.dist-info"
    info.mkdir()
    (info / "METADATA").write_text(
        f"Metadata-Version: 2.1\nName: {name}\nVersion: 1.0\n", encoding="utf-8"
    )
    (info / "entry_points.txt").write_text(entry_points_text, encoding="utf-8")
    if module is not None:
        (root / f"{name}_mod.py").write_text(module, encoding="utf-8")


GOOD_MODULE = textwrap.dedent(
    """
    from pipwerk_domain.typedesc import ElementKind, Label, TypeDescription

    TYPE = TypeDescription(
        "plugin.good", ElementKind.ORDER_TYPE, Label("Gut", "Good"), Label("", "")
    )
    """
)


# N1: entry points are read for each package on its own ---------------------------------------


@pytest.mark.parametrize(
    "bad_text",
    [
        f"[{ENTRY_POINT_GROUP}]\nnoeq\n",
        "[other.group]\nnoeq\n",
        "[console_scripts]\nnoeq\n",
    ],
)
def test_faulty_metadata_of_one_package_exclude_only_this_package(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
    bad_text: str,
) -> None:
    good = f"[{ENTRY_POINT_GROUP}]\ngood = goodpkg_mod:TYPE\n"
    make_package(tmp_path, "goodpkg", good, GOOD_MODULE)
    make_package(tmp_path, "badpkg", bad_text)
    monkeypatch.syspath_prepend(str(tmp_path))
    with caplog.at_level(logging.WARNING, logger="pipwerk_domain.registry"):
        registry = create_registry(entry_points=False)
        report = registry.load_entry_points()
    assert "good" in report.loaded  # the valid entry point of the other package is loaded
    assert registry.get("plugin.good") is not None
    assert registry.get("EMA") is not None
    assert "badpkg" in caplog.text  # the excluded package: its name and the class of the error
    assert "Error" in caplog.text
    assert str(tmp_path) not in caplog.text
    assert "noeq" not in caplog.text  # nothing of the content of the metadata
    assert all(record.exc_info is None for record in caplog.records)
    sys.modules.pop("goodpkg_mod", None)


def test_a_package_with_unreadable_metadata_does_not_stop_the_others(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    good = f"[{ENTRY_POINT_GROUP}]\ngood = goodpkg_mod:TYPE\n"
    make_package(tmp_path, "goodpkg", good, GOOD_MODULE)
    info = tmp_path / "nometa-1.0.dist-info"
    info.mkdir()
    (info / "entry_points.txt").write_bytes(b"\xff\xfe[\x00")
    monkeypatch.syspath_prepend(str(tmp_path))
    registry = create_registry(entry_points=False)
    assert "good" in registry.load_entry_points().loaded
    sys.modules.pop("goodpkg_mod", None)


def test_a_listing_of_the_packages_that_fails_leaves_the_delivered_types(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    def broken() -> list[object]:
        raise OSError("/hidden/place")

    monkeypatch.setattr("pipwerk_domain.registry.distributions", broken)
    with caplog.at_level(logging.WARNING, logger="pipwerk_domain.registry"):
        registry = create_registry()
    assert registry.get("EMA") is not None
    assert "/hidden/place" not in caplog.text
    assert "OSError" in caplog.text


# N2: one limit for all findings of an expression ----------------------------------------------


def test_hints_stop_at_the_limit_of_an_expression() -> None:
    names = "+".join(["Strategie.x"] * 300)
    for value in (
        template(
            catalog.TYPE_INDICATOR, properties=[PropertyDefinition("e", DataType.NUMBER, names)]
        ),
        template(catalog.TYPE_RULE, expression=names + " > 0"),
    ):
        found = check_template(value)
        assert len(only(found, fc.RULE_UNRESOLVED_NAME)) == limits.MAX_FINDINGS_PER_EXPRESSION
        truncated = only(found, fc.FINDINGS_TRUNCATED)
        assert len(truncated) == 1
        assert truncated[0].details["scope"] == "expression"
        assert truncated[0].details["limit"] == 50


def test_hints_and_errors_of_one_expression_count_together() -> None:
    mixed = "+".join(["Strategie.x"] * 30 + ["q"] * 30)
    found = check_template(template(catalog.TYPE_RULE, expression=mixed + " > 0"))
    total = len(only(found, fc.RULE_UNRESOLVED_NAME)) + len(only(found, fc.EXPRESSION_INVALID))
    assert total == 50
    assert len(only(found, fc.FINDINGS_TRUNCATED)) == 1
    exactly = "+".join(["Strategie.x"] * 50)
    found = check_template(template(catalog.TYPE_RULE, expression=exactly + " > 0"))
    assert len(only(found, fc.RULE_UNRESOLVED_NAME)) == 50
    assert only(found, fc.FINDINGS_TRUNCATED) == []


# N3, N5: single surrogates and the encoding of bytes ----------------------------------------------


def document_with_title(title_json: str) -> str:
    return "{" + HEAD + ', "title": ' + title_json + "}"


@pytest.mark.parametrize("escape", ["\\ud800", "\\udbff", "\\udc00", "\\udfff", "a\\ud83db"])
def test_a_single_surrogate_as_an_escape_is_rejected(escape: str) -> None:
    text = document_with_title('"' + escape + '"')
    with pytest.raises(DocumentError):
        parse_document(text)
    with pytest.raises(DocumentError):
        read_document(text.encode())
    in_key = "{" + HEAD + ', "title": "t", "' + escape + '": 1}'
    with pytest.raises(DocumentError):
        parse_document(in_key)
    nested = "{" + HEAD + ', "title": "t", "elements": [{"id": "' + uid(2) + '", "type": "a'
    with pytest.raises(DocumentError):
        parse_document(nested + escape + '"}]}')


@pytest.mark.parametrize("char", ["\ud800", "\udbff", "\udc00", "\udfff"])
def test_a_single_surrogate_as_a_character_is_rejected(char: str) -> None:
    with pytest.raises(DocumentError):
        parse_document(document_with_title('"a' + char + '"'))
    with pytest.raises(DocumentError):
        parse_document(
            {"format": "pipwerk.strategy", "format_version": "1.0", "id": uid(1), "title": char}
        )


def test_a_valid_pair_is_read_and_written() -> None:
    text = document_with_title('"\\ud83d\\ude00 ä"')
    document = parse_document(text)
    assert document.title == "\U0001f600 ä"
    assert write_document(read_document(text)).encode("utf-8")


def test_writing_a_single_surrogate_is_a_validation_error() -> None:
    strategy = valid_strategy()
    strategy.title = "a\ud800"
    with pytest.raises(DocumentError):
        write_document(strategy)


def test_bytes_must_be_utf_8_without_a_byte_order_mark() -> None:
    text = document_with_title('"tä"')
    assert parse_document(text.encode("utf-8")).title == "tä"
    rejected = [
        b"\xef\xbb\xbf" + text.encode("utf-8"),
        text.encode("utf-16"),
        text.encode("utf-16-le"),
        text.encode("utf-16-be"),
        text.encode("utf-32"),
        text.encode("utf-32-le"),
        text.encode("latin-1"),
    ]
    for data in rejected:
        with pytest.raises(DocumentError):
            parse_document(data)
        with pytest.raises(DocumentError):
            read_document(data)
    with pytest.raises(DocumentError):
        parse_document("﻿" + text)


# N2 of the function test: PREVIOUS is no dependency


def test_previous_of_the_own_result_is_no_cycle_of_calculations() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "z", "PREVIOUS(z.ergebnis) + 1"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 2)]
    assert only(check(strategy), fc.CALCULATION_CIRCULAR) == []
    strategy.elements[1].parameters["ausdruck"] = expr("previous( Z.ergebnis ; 2) + 1")
    assert only(check(strategy), fc.CALCULATION_CIRCULAR) == []
    strategy.elements[1].parameters["ausdruck"] = expr("z.ergebnis + 1")
    assert len(only(check(strategy), fc.CALCULATION_CIRCULAR)) == 1
    strategy.elements[1].parameters["ausdruck"] = expr("PREVIOUS(Konto.kapital) + z.ergebnis")
    assert len(only(check(strategy), fc.CALCULATION_CIRCULAR)) == 1


def test_previous_between_two_calculations_is_no_cycle() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "a", "PREVIOUS(b.ergebnis) + 1"))
    strategy.elements.insert(2, calculation(6, "b", "a.ergebnis + 1"))
    strategy.connections = [
        connect(1, "weiter", 5),
        connect(5, "weiter", 6),
        connect(6, "weiter", 2),
    ]
    assert check(strategy) == []
    strategy.elements[1].parameters["ausdruck"] = expr("b.ergebnis + 1")
    assert len(only(check(strategy), fc.CALCULATION_CIRCULAR)) == 1


def test_previous_of_a_result_is_no_forward_reference_and_no_cycle_of_rules() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        ruleset("werk", [rule("a", "PREVIOUS(b.ergebnis)"), rule("b", "a.ergebnis")])
    )
    assert only(check(strategy), fc.RULESET_REFERENCE_ORDER) == []
    strategy.rules.append(rule("r", "PREVIOUS(r.ergebnis)"))
    assert only(check(strategy), fc.RULESET_REFERENCE_ORDER) == []
    strategy.rules[0].rules[0].expression = "b.ergebnis"  # a real forward reference
    assert only(check(strategy), fc.RULESET_REFERENCE_ORDER)
    strategy.rules[0].rules[0].expression = "PREVIOUS(b.ergebnis)"
    strategy.rules[1].expression = "r.ergebnis"  # a real cycle
    found = only(check(strategy), fc.RULESET_REFERENCE_ORDER)
    assert [item.details["kind"] for item in found] == ["cycle"]


def test_previous_in_a_ruleset_template() -> None:
    value = template(
        catalog.TYPE_RULESET,
        rules=[rule("a", "PREVIOUS(b.ergebnis)"), rule("b", "a.ergebnis")],
    )
    assert check_template(value) == []


# N3 of the function test, N2 of the security test: the normalization is cheap


def many_names(count: int) -> str:
    return "+".join(["q"] * count)


def hostile_strategy(count: int) -> Strategy:
    elements: list[Element] = [trigger(1)]
    connections: list[Connection] = []
    for number in range(2, count + 2):
        elements.append(calculation(number, f"c{number}", many_names(2048)))
        connections.append(connect(number - 1, "weiter", number))
    return Strategy(id=uid(900), title="gross", elements=elements, connections=connections)


def test_the_normalization_collects_no_findings() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "wert", "q+" * 300 + "ORDER.Volumen"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 2)]
    result = normalize_strategy(strategy)
    assert result.elements[1].parameters["ausdruck"].value == "q+" * 300 + "Order.volumen"
    checker = Checker(default_registry(), None, spelling_only=True)
    checker.check_strategy(strategy)
    assert checker.findings == []


def test_the_normalization_keeps_a_syntax_problem_and_unknown_names_as_they_are() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "a", "order.volumen +"))
    strategy.elements.insert(2, calculation(6, "b", "Foo(Bar.Baz) + KONTO.Kapital + if(a;1;2)"))
    strategy.connections = [
        connect(1, "weiter", 5),
        connect(5, "weiter", 6),
        connect(6, "weiter", 2),
    ]
    result = normalize_strategy(strategy)
    assert result.elements[1].parameters["ausdruck"].value == "order.volumen +"
    assert result.elements[2].parameters["ausdruck"].value == (
        "Foo(Bar.Baz) + Konto.kapital + IF(a;1;2)"
    )


def test_the_normalization_of_a_document_of_2_mib_is_within_time_and_memory() -> None:
    text = write_document(hostile_strategy(440))
    assert limits.MAX_DOCUMENT_BYTES * 0.9 < len(text.encode()) <= limits.MAX_DOCUMENT_BYTES
    loaded = read_document(text)
    assert isinstance(loaded, Strategy)
    started = time.perf_counter()
    result = normalize_strategy(loaded)
    assert time.perf_counter() - started < 5
    assert result == loaded  # all names unknown: nothing changes
    # memory: measured on a part, tracing every allocation is slow; the syntax trees are
    # released after use, so the peak does not grow with the number of expressions
    peaks = []
    for count in (20, 60):
        part = hostile_strategy(count)
        tracemalloc.start()
        normalize_strategy(part)
        peaks.append(tracemalloc.get_traced_memory()[1])
        tracemalloc.stop()
    assert peaks[1] < 200 * 1024 * 1024
    # only the copy of the strategy grows with the number of expressions, not the trees
    assert peaks[1] < 20 * 1024 * 1024


def test_the_normalization_of_a_template_with_many_hints_is_within_time_and_memory() -> None:
    names = "+".join(["Strategie.x"] * 300)
    value = template(
        catalog.TYPE_INDICATOR,
        properties=[PropertyDefinition(f"e{n}", DataType.NUMBER, names) for n in range(500)],
    )
    started = time.perf_counter()
    normalize_template(value)
    assert time.perf_counter() - started < 5
    small = template(
        catalog.TYPE_INDICATOR,
        properties=[PropertyDefinition(f"e{n}", DataType.NUMBER, names) for n in range(60)],
    )
    tracemalloc.start()
    normalize_template(small)
    peak = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()
    assert peak < 200 * 1024 * 1024


def test_the_check_of_the_same_document_stays_within_its_limits() -> None:
    found = check_strategy(hostile_strategy(440))
    assert len(found) == limits.MAX_FINDINGS_PER_CHECK + 1
