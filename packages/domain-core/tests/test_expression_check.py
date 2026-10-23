"""Type check of the expressions: valid and faulty cases for each rule of specification 3.4."""

import pytest

from pipwerk_domain.defaults import create_registry
from pipwerk_domain.expressions import (
    Analysis,
    ExpressionIssue,
    IssueKind,
    Scope,
    analyze,
    normalize_expression,
)
from pipwerk_domain.expressions import exprtypes as et
from pipwerk_domain.expressions.exprtypes import ExprType
from pipwerk_domain.expressions.symbols import Symbol, SymbolKind
from pipwerk_domain.model import Instance, Origin
from pipwerk_domain.namespaces import application_scope, instance_symbol, parameter_symbol
from pipwerk_domain.typedesc import DataType
from tests.helpers import ema, fixed

REGISTRY = create_registry(entry_points=False)


def environment() -> Scope:
    scope = Scope(application_scope(REGISTRY, None))
    scope.add(parameter_symbol("x", DataType.NUMBER))
    scope.add(parameter_symbol("n", DataType.INTEGER))
    scope.add(parameter_symbol("p", DataType.PERCENT))
    scope.add(parameter_symbol("flag", DataType.BOOLEAN))
    scope.add(parameter_symbol("label", DataType.TEXT))
    scope.add(parameter_symbol("unit", DataType.TIME_UNIT))
    scope.add(parameter_symbol("mode", DataType.CHOICE, ("fast", "slow")))
    scope.add(parameter_symbol("when", DataType.TIMESTAMP))
    scope.add(parameter_symbol("day", DataType.DATE))
    scope.add(instance_symbol(REGISTRY, ema("EMA21")))
    scope.add(
        instance_symbol(
            REGISTRY,
            Instance(
                name="mt",
                object_type="ZigZag",
                origin=Origin("ZigZag"),
                parameter_values={"zeiteinheit": fixed("h1")},
            ),
        )
    )
    return scope


def run(source: str, expected: ExprType | None = None) -> Analysis:
    return analyze(source, environment(), expected)


def kinds(analysis: Analysis) -> list[IssueKind]:
    return [item.kind for item in analysis.issues]


def only_issue(analysis: Analysis) -> ExpressionIssue:
    assert len(analysis.issues) == 1, analysis.issues
    return analysis.issues[0]


# valid expressions -----------------------------------------------------------------


@pytest.mark.parametrize(
    ("source", "datatype"),
    [
        ("1 + 2", DataType.NUMBER),
        ("x * 2 - 1 / 4 ^ 2", DataType.NUMBER),
        ("-x", DataType.NUMBER),
        ("+x", DataType.NUMBER),
        ("n + n", DataType.NUMBER),
        ("p * x", DataType.NUMBER),
        ("5%", DataType.PERCENT),
        ("x * 5%", DataType.NUMBER),
        ("TRUE()", DataType.BOOLEAN),
        ("FALSE()", DataType.BOOLEAN),
        ('"a" & "b"', DataType.TEXT),
        ('"a" & 1', DataType.TEXT),
        ("label & unit", DataType.TEXT),
        ("x = 1", DataType.BOOLEAN),
        ("x <> 1", DataType.BOOLEAN),
        ("x < n", DataType.BOOLEAN),
        ("x <= p", DataType.BOOLEAN),
        ("x > 1", DataType.BOOLEAN),
        ("x >= 1", DataType.BOOLEAN),
        ('label = "a"', DataType.BOOLEAN),
        ('label < "b"', DataType.BOOLEAN),
        ("flag = TRUE()", DataType.BOOLEAN),
        ("when < when", DataType.BOOLEAN),
        ("day >= day", DataType.BOOLEAN),
        ('unit = "h1"', DataType.BOOLEAN),
        ('mode = "fast"', DataType.BOOLEAN),
        ("mode = label", DataType.BOOLEAN),
        ("(1 + 2) * 3", DataType.NUMBER),
        ("Konto.Kapital", DataType.NUMBER),
        ("konto.KAPITAL * 2", DataType.NUMBER),
        ("Kerze.Schluss - Kerze.Eroeffnung", DataType.NUMBER),
        ("Tick.Geld", DataType.NUMBER),
        ("Instrument.Tickgroesse", DataType.NUMBER),
        ("Strategie.wartende_orders", DataType.INTEGER),
        ("EMA21.Wert", DataType.NUMBER),
        ("mt.wendepunkt_1_endgueltig", DataType.BOOLEAN),
        ("mt.wendepunkt_2_endgueltig", DataType.BOOLEAN),
        ("mt.letztes_hoch", DataType.NUMBER),
        ("mt.vorletztes_tief - mt.letztes_tief", DataType.NUMBER),
        ("Order.Konto.Kapital", DataType.NUMBER),
        ("Order.Status", DataType.CHOICE),
    ],
)
def test_valid_expressions(source: str, datatype: DataType) -> None:
    analysis = run(source)
    assert analysis.issues == []
    assert analysis.result_type.datatype is datatype


@pytest.mark.parametrize(
    ("source", "datatype"),
    [
        ("IF(flag; 1; 2)", DataType.INTEGER),
        ('IF(flag; "a"; "b")', DataType.TEXT),
        ("IF(flag; TRUE(); FALSE())", DataType.BOOLEAN),
        ("IF(flag; 1)", DataType.INTEGER),
        ("IF(flag; 1; 2.5)", DataType.NUMBER),
        ("IF(x > 1; x; n)", DataType.NUMBER),
        ("AND(flag; flag)", DataType.BOOLEAN),
        ("AND(flag)", DataType.BOOLEAN),
        ("AND(flag; x > 1; mt.wendepunkt_1_endgueltig)", DataType.BOOLEAN),
        ("OR(flag; flag)", DataType.BOOLEAN),
        ("NOT(flag)", DataType.BOOLEAN),
        ("MIN(1; 2; 3)", DataType.NUMBER),
        ("MAX(x)", DataType.NUMBER),
        ("MAX(x; n; p)", DataType.NUMBER),
        ("ABS(-x)", DataType.NUMBER),
        ("FLOOR(x; 0.01)", DataType.NUMBER),
        ("CEILING(x; Instrument.Volumenschritt)", DataType.NUMBER),
        ("ISNA(Position.Volumen)", DataType.BOOLEAN),
        ("ISBLANK(mt.vorletztes_hoch)", DataType.BOOLEAN),
        ("IFNA(Order.Limitpreis; Order.Preis)", DataType.NUMBER),
        ("PREVIOUS(EMA21.Wert)", DataType.NUMBER),
        ("PREVIOUS(EMA21.Wert; 2)", DataType.NUMBER),
        ("TRUE()", DataType.BOOLEAN),
        ("if(flag; 1; 2)", DataType.INTEGER),
        ("floor(x; 1)", DataType.NUMBER),
    ],
)
def test_valid_functions(source: str, datatype: DataType) -> None:
    analysis = run(source)
    assert analysis.issues == []
    assert analysis.result_type.datatype is datatype


# unknown function ----------------------------------------------------------------


def test_unknown_function_has_the_position_of_its_name() -> None:
    analysis = run("1 + FOO(2)")
    issue = only_issue(analysis)
    assert issue.kind is IssueKind.UNKNOWN_FUNCTION
    assert (issue.start, issue.end) == (4, 7)
    assert issue.details == {"name": "FOO"}


def test_a_name_with_a_point_before_a_parenthesis_is_a_method_and_no_function() -> None:
    """``Objekt.Name(Argumente)`` is a method (specification 3.4); a property is no method."""
    analysis = run("Konto.Kapital(1)")
    issue = only_issue(analysis)
    assert issue.kind is IssueKind.UNKNOWN_METHOD
    assert issue.reason == "not_a_method"


def test_the_arguments_of_an_unknown_function_are_still_checked() -> None:
    analysis = run("FOO(unknown_name)")
    assert kinds(analysis) == [IssueKind.UNKNOWN_FUNCTION, IssueKind.UNKNOWN_NAME]


# unknown name and property ------------------------------------------------------------


def test_unknown_name_has_the_position_of_the_name() -> None:
    analysis = run("x + gibtsnicht")
    issue = only_issue(analysis)
    assert issue.kind is IssueKind.UNKNOWN_NAME
    assert (issue.start, issue.end) == (4, 14)
    assert issue.details == {"name": "gibtsnicht"}


def test_unknown_object_with_a_point() -> None:
    issue = only_issue(run("foo.bar"))
    assert issue.kind is IssueKind.UNKNOWN_NAME
    assert (issue.start, issue.end) == (0, 3)


def test_unknown_property_has_the_position_of_the_property() -> None:
    issue = only_issue(run("1 + Konto.Gewinn"))
    assert issue.kind is IssueKind.UNKNOWN_PROPERTY
    assert (issue.start, issue.end) == (10, 16)
    assert issue.details == {"object": "Konto", "property": "Gewinn"}


def test_unknown_property_of_an_instance_and_of_a_nested_name() -> None:
    assert only_issue(run("EMA21.Gewicht")).kind is IssueKind.UNKNOWN_PROPERTY
    issue = only_issue(run("Order.Konto.Gewinn"))
    assert issue.kind is IssueKind.UNKNOWN_PROPERTY
    assert issue.details["object"] == "Order.konto"


def test_an_object_cannot_be_used_as_a_value() -> None:
    issue = only_issue(run("1 + Konto"))
    assert issue.kind is IssueKind.TYPE_MISMATCH
    assert issue.reason == "object_not_value"
    assert (issue.start, issue.end) == (4, 9)
    assert only_issue(run("EMA21")).reason == "object_not_value"


def test_names_are_not_case_sensitive() -> None:
    assert run("KONTO.kapital + ema21.WERT").issues == []


# type mismatch --------------------------------------------------------------------


@pytest.mark.parametrize(
    "source",
    ['"a" + 1', "1 + flag", "-label", "x * unit", "when - 1", "label ^ 2", 'x / "a"'],
)
def test_arithmetic_needs_numbers(source: str) -> None:
    analysis = run(source)
    assert analysis.issues
    assert all(item.kind is IssueKind.TYPE_MISMATCH for item in analysis.issues)
    assert all(item.reason == "operand" for item in analysis.issues)


def test_operand_mismatch_marks_the_operand() -> None:
    issue = only_issue(run('1 + "a"'))
    assert (issue.start, issue.end) == (4, 7)
    assert issue.details["expected"] == "number"
    assert issue.details["found"] == "text"


def test_concatenation_does_not_take_truth_values() -> None:
    issue = only_issue(run('"a" & flag'))
    assert issue.reason == "operand"
    assert issue.details["expected"] == "text"


@pytest.mark.parametrize(
    "source",
    [
        'x = "a"',
        "label = 1",
        "flag = 1",
        "when = day",
        "x = flag",
        'mt.wendepunkt_1_endgueltig = "ja"',
        "Order.Konto = Order.Konto",
    ],
)
def test_comparison_needs_values_of_one_family(source: str) -> None:
    issue = only_issue(run(source))
    assert issue.kind is IssueKind.TYPE_MISMATCH
    assert issue.reason == "comparison"


@pytest.mark.parametrize("source", ["flag < flag", "mode < mode", "unit > unit"])
def test_ordering_needs_orderable_values(source: str) -> None:
    issue = only_issue(run(source))
    assert issue.kind is IssueKind.TYPE_MISMATCH
    assert issue.reason == "ordering"


@pytest.mark.parametrize(
    "source",
    [
        "IF(1; 2; 3)",
        'IF("a"; 2; 3)',
        "AND(1; flag)",
        "OR(flag; x)",
        "NOT(x)",
        'MIN("a")',
        "MAX(1; flag)",
        "ABS(flag)",
        'FLOOR("a"; 1)',
        "CEILING(1; flag)",
    ],
)
def test_arguments_must_have_the_type_of_the_signature(source: str) -> None:
    issue = only_issue(run(source))
    assert issue.kind is IssueKind.TYPE_MISMATCH
    assert issue.reason == "argument"


def test_argument_mismatch_marks_the_argument_and_names_the_function() -> None:
    issue = only_issue(run("AND(flag; 5)"))
    assert (issue.start, issue.end) == (10, 11)
    assert issue.details["function"] == "AND"
    assert issue.details["index"] == 1
    assert issue.details["expected"] == "boolean"


def test_the_branches_of_if_need_a_common_type() -> None:
    issue = only_issue(run('IF(flag; 1; "a")'))
    assert issue.kind is IssueKind.TYPE_MISMATCH
    assert issue.reason == "branches"
    assert only_issue(run("IFNA(x; flag)")).reason == "branches"


def test_previous_needs_a_name_and_a_positive_integer() -> None:
    issue = only_issue(run("PREVIOUS(1 + 2)"))
    assert (issue.kind, issue.reason) == (IssueKind.PREVIOUS_ARGUMENT, "not_a_name")
    assert only_issue(run("PREVIOUS(EMA21.Wert; 0)")).reason == "argument"
    assert only_issue(run("PREVIOUS(EMA21.Wert; 1.5)")).reason == "argument"
    assert only_issue(run('PREVIOUS(EMA21.Wert; "a")')).reason == "argument"
    assert run("PREVIOUS(EMA21.Wert; n)").issues == []


@pytest.mark.parametrize(
    ("source", "minimum", "maximum"),
    [
        ("IF()", 2, 3),
        ("IF(flag)", 2, 3),
        ("IF(flag; 1; 2; 3)", 2, 3),
        ("NOT()", 1, 1),
        ("NOT(flag; flag)", 1, 1),
        ("AND()", 1, None),
        ("MIN()", 1, None),
        ("ABS(1; 2)", 1, 1),
        ("FLOOR(1)", 2, 2),
        ("ISNA()", 1, 1),
        ("IFNA(1)", 2, 2),
        ("PREVIOUS()", 1, 2),
        ("TRUE(1)", 0, 0),
    ],
)
def test_argument_count(source: str, minimum: int, maximum: int | None) -> None:
    issue = only_issue(run(source))
    assert issue.kind is IssueKind.ARGUMENT_COUNT
    assert issue.details["minimum"] == minimum
    assert issue.details["maximum"] == maximum


# choices ---------------------------------------------------------------------------


def test_a_text_that_is_a_value_of_the_choice_is_valid() -> None:
    assert run('mt.wendepunkt_1_art = "hoch"').issues == []
    assert run('"hoch" = mt.wendepunkt_1_art').issues == []
    assert run('mt.wendepunkt_3_art = "tief"').issues == []
    assert run('Order.Richtung = "buy"').issues == []
    assert run('Order.Status = "ausgefuehrt"').issues == []
    assert run('mode <> "slow"').issues == []


def test_a_text_that_is_not_a_value_of_the_choice_is_an_error() -> None:
    issue = only_issue(run('mt.wendepunkt_1_art = "Hoch"'))
    assert issue.kind is IssueKind.UNKNOWN_CHOICE_VALUE
    assert (issue.start, issue.end) == (22, 28)
    assert issue.details["values"] == ["Hoch"]
    assert issue.details["allowed"] == ["hoch", "tief"]


def test_the_check_of_the_value_works_from_the_right_side_too() -> None:
    assert only_issue(run('"flat" = mt.wendepunkt_1_art')).kind is IssueKind.UNKNOWN_CHOICE_VALUE


def test_time_unit_texts_are_checked() -> None:
    assert run('unit = "m15"').issues == []
    assert only_issue(run('unit = "x9"')).kind is IssueKind.UNKNOWN_CHOICE_VALUE
    assert run("Strategie.wartende_orders = 1").issues == []


def test_all_fixed_texts_of_a_branching_are_checked() -> None:
    assert run('mode = IF(flag; "fast"; "slow")').issues == []
    issue = only_issue(run('mode = IF(flag; "fast"; "other")'))
    assert issue.kind is IssueKind.UNKNOWN_CHOICE_VALUE
    assert issue.details["values"] == ["other"]


def test_a_text_that_arises_at_the_execution_is_not_checked() -> None:
    assert run("mt.wendepunkt_1_art = label").issues == []
    assert run('mt.wendepunkt_1_art = (label & "x")').issues == []


def test_expected_type_with_a_choice() -> None:
    direction = ExprType(DataType.CHOICE, choices=("buy", "sell"))
    assert run('IF(flag; "buy"; "sell")', direction).issues == []
    assert run("Order.Richtung", direction).issues == []
    issue = only_issue(run('IF(flag; "buy"; "hold")', direction))
    assert issue.kind is IssueKind.UNKNOWN_CHOICE_VALUE
    assert issue.reason == "result"
    assert issue.details["values"] == ["hold"]
    issue = only_issue(run('"hold"', direction))
    assert (issue.start, issue.end) == (0, 6)  # marks the text itself
    assert run("label", direction).issues == []  # arises at the execution


def test_expected_type_mismatch() -> None:
    issue = only_issue(run("1 + 1", et.BOOLEAN))
    assert issue.kind is IssueKind.TYPE_MISMATCH
    assert issue.reason == "result"
    assert run("x > 1", et.BOOLEAN).issues == []
    assert run("x", ExprType(DataType.INTEGER)).issues == []  # numbers are interchangeable
    assert run("flag", ExprType(DataType.NUMBER)).issues
    assert run("label", ExprType(DataType.NUMBER)).issues
    assert run("when", ExprType(DataType.DATE)).issues
    assert run("day", ExprType(DataType.DATE)).issues == []
    assert run("when", ExprType(DataType.TIMESTAMP)).issues == []


# unresolved names and unknown results do not cause follow-up errors ------------------


def test_an_unknown_name_does_not_cause_follow_up_errors() -> None:
    analysis = run("IF(unknown; 1; 2) + MIN(unknown2; 3)")
    assert kinds(analysis) == [IssueKind.UNKNOWN_NAME, IssueKind.UNKNOWN_NAME]


def test_syntax_error_is_reported_with_position() -> None:
    analysis = run("1 +")
    issue = only_issue(analysis)
    assert issue.kind is IssueKind.SYNTAX
    assert issue.reason == "unexpected_end"
    assert (issue.start, issue.end) == (3, 3)
    assert analysis.tree is None
    assert analysis.names == []


def test_issues_are_sorted_by_position() -> None:
    analysis = run('FOO(1) + gibtsnicht + (1 + "a")')
    starts = [item.start for item in analysis.issues]
    assert starts == sorted(starts)
    assert len(starts) == 3


# recognized names ------------------------------------------------------------------


def test_recognized_names_have_position_and_identifier() -> None:
    analysis = run("Konto.KAPITAL + ema21.wert * x")
    assert [(n.start, n.end, n.identifier, n.resolved) for n in analysis.names] == [
        (0, 13, "Konto.kapital", True),
        (16, 26, "EMA21.wert", True),
        (29, 30, "x", True),
    ]
    first = analysis.names[0]
    assert [(s.start, s.end, s.identifier) for s in first.segments] == [
        (0, 5, "Konto"),
        (6, 13, "kapital"),
    ]
    assert first.symbols[0].kind is SymbolKind.APPLICATION_OBJECT


def test_partly_recognized_names_report_the_recognized_part() -> None:
    analysis = run("Konto.Gewinn + nothing")
    first, second = analysis.names
    assert (first.resolved, first.identifier) == (False, "Konto")
    assert [s.identifier for s in first.segments] == ["Konto"]
    assert (second.resolved, second.identifier, second.segments) == (False, "", ())


def test_recognized_functions_have_position() -> None:
    analysis = run("if(flag; 1; max(1; 2))")
    assert [(f.name, f.start, f.end) for f in analysis.functions] == [
        ("IF", 0, 2),
        ("MAX", 12, 15),
    ]


# normalization -----------------------------------------------------------------------


def norm(source: str) -> str:
    return normalize_expression(source, environment())


def test_normalization_writes_names_in_the_spelling_of_the_identifier() -> None:
    assert norm("order.VOLUMEN") == "Order.volumen"
    assert norm("KONTO.Kapital") == "Konto.kapital"
    assert norm("ema21.WERT + EMA21.wert") == "EMA21.wert + EMA21.wert"
    assert norm("MT.Wendepunkt_1_Endgueltig") == "mt.wendepunkt_1_endgueltig"
    assert norm("Instrument.Tickgroesse") == "Instrument.tickgroesse"


def test_normalization_writes_functions_in_the_spelling_of_the_norm() -> None:
    assert norm("if(flag;1;2)") == "IF(flag;1;2)"
    assert norm("Floor(x; 0.5)") == "FLOOR(x; 0.5)"
    assert norm("true()") == "TRUE()"


def test_normalization_keeps_everything_else_character_by_character() -> None:
    source = 'IF( flag ;\n\t"Text  mit   Blanks" ;  1.50 )   '
    assert norm(source) == source
    spaced = "if (\n  Order.Volumen   >=\tInstrument.Mindestvolumen\n)"
    # `if` is a function name only before the parenthesis; here a space separates them
    assert norm("Order.Volumen   >=\tInstrument.Mindestvolumen\n") == (
        "Order.volumen   >=\tInstrument.mindestvolumen\n"
    )
    assert spaced.replace("if", "if")  # the text itself is untouched by the helper above


def test_normalization_leaves_unknown_names_and_functions_alone() -> None:
    assert norm("Foo(Bar.Baz; order.volumen)") == "Foo(Bar.Baz; Order.volumen)"
    assert norm("Konto.Gewinn") == "Konto.Gewinn"  # the known part is written, the rest stays
    assert norm("KONTO.Gewinn") == "Konto.Gewinn"


def test_normalization_does_not_touch_texts_and_numbers() -> None:
    assert norm('"ORDER.VOLUMEN" & "if(1)"') == '"ORDER.VOLUMEN" & "if(1)"'
    assert norm("1.50 + 2%") == "1.50 + 2%"


def test_normalization_leaves_an_expression_with_a_syntax_error_unchanged() -> None:
    assert norm("order.volumen +") == "order.volumen +"


def test_normalization_is_idempotent() -> None:
    once = norm("if(KONTO.kapital>1;order.Volumen;0)")
    assert norm(once) == once


# symbols ---------------------------------------------------------------------------


def test_a_cycle_in_the_computation_of_a_type_ends_in_the_unknown_type() -> None:
    scope = Scope()
    symbol = Symbol("a", SymbolKind.PROPERTY)
    symbol.type_factory = lambda: symbol.value_type or et.UNKNOWN
    scope.add(symbol)
    assert analyze("a", scope).result_type.is_unknown


def test_an_inner_name_hides_an_outer_name_without_a_finding() -> None:
    outer = Scope()
    outer.add(parameter_symbol("v", DataType.NUMBER))
    inner = Scope(outer)
    inner.add(parameter_symbol("v", DataType.TEXT))
    assert analyze("v", inner).result_type.datatype is DataType.TEXT
    assert analyze("v", outer).result_type.datatype is DataType.NUMBER
    assert not inner.add(parameter_symbol("V", DataType.TEXT))  # same level: a duplicate
