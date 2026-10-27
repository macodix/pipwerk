"""Methods of a type (specification 3.1, 3.3, 3.4, req-fach-055): the description of the methods in
the element register, the expression ``Objekt.Methode(Argumente)`` with its break-down, type check,
display form, blocks, characters, sentence and visible names, ``PREVIOUS`` around the result of a
method and the inputs that name a method.

The delivered types have no methods (``test_catalog.py``). These tests register the types of
``methods_support.py``, as a package would that registers types (E7).
"""

import dataclasses
from typing import Any

import pytest

from pipwerk_domain.consistency import Level, check_strategy
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.defaults import create_registry
from pipwerk_domain.expressions import (
    Block,
    BlockError,
    BlockKind,
    CharacterKind,
    IssueKind,
    analyze,
    blocks_to_text,
    characters,
    normalize_expression,
    render,
    sentence,
    to_blocks,
    visible_names,
)
from pipwerk_domain.expressions.nodes import MethodCall, Name
from pipwerk_domain.expressions.parser import parse
from pipwerk_domain.model import ElementInput, InputKind, Strategy
from pipwerk_domain.namespaces import application_scope
from pipwerk_domain.registry import RegistryError
from pipwerk_domain.typedesc import (
    ArgumentDescription,
    Choice,
    DataType,
    ElementKind,
    Label,
    MethodDescription,
    TypeDescription,
)
from tests.helpers import condition, connect, element, only, place_order, trigger, uid
from tests.methods_support import (
    POINT,
    REGISTRY,
    SERIES,
    method_scope,
    series_description,
    series_instance,
)

SCOPE = method_scope()


def issues(source: str, **kwargs: Any) -> list[tuple[str, str]]:
    analysis = analyze(source, SCOPE, **kwargs)
    return [(item.kind.value, item.reason) for item in analysis.issues]


def only_issue(source: str) -> Any:
    analysis = analyze(source, SCOPE)
    assert len(analysis.issues) == 1, analysis.issues
    return analysis.issues[0]


# --- description of the methods in the type description ---------------------------------------


def test_a_type_description_has_methods_and_a_can_refresh_indication() -> None:
    series = REGISTRY.get(SERIES)
    assert series is not None
    assert [item.id for item in series.methods] == [
        "wert_vor",
        "mittel",
        "tendenz",
        "anzahl_wechsel",
        "bereit",
    ]
    assert series.can_refresh is True
    method = series.method("wert_vor")
    assert method is not None
    assert (method.datatype, method.label) == (DataType.NUMBER, Label("Wert vor", "Value before"))
    assert method.explanation.de.strip() and method.explanation.en.strip()
    assert [(item.id, item.datatype, item.required) for item in method.arguments] == [
        ("anzahl", DataType.INTEGER, True),
        ("kurs", DataType.CHOICE, False),
    ]
    assert method.arguments[1].default == "schluss"
    assert [item.id for item in method.arguments[1].choices] == ["schluss", "eroeffnung"]
    assert (method.min_arguments, method.max_arguments) == (1, 2)
    assert method.argument("anzahl") is method.arguments[0]
    assert method.argument("nope") is None
    assert series.method("nope") is None


def test_the_methods_of_the_register_are_listed_with_the_type() -> None:
    listed = {item.id: item for item in REGISTRY.list()}
    assert listed[POINT].methods and listed[POINT].kind is ElementKind.APPLICATION_OBJECT
    assert listed["EMA"].methods == ()  # the delivered types have none


def test_the_time_unit_of_a_method_has_all_time_units_as_values() -> None:
    series = REGISTRY.get(SERIES)
    assert series is not None
    method = series.method("mittel")
    assert method is not None
    unit = method.argument("zeiteinheit")
    assert unit is not None
    assert [item.id for item in unit.choices][:3] == ["m1", "m2", "m3"]
    assert "mn1" in [item.id for item in unit.choices]


def with_methods(*methods: MethodDescription) -> TypeDescription:
    base = series_description(create_registry(entry_points=False))
    return dataclasses.replace(base, id="Pruefling", methods=methods)


def method(
    identifier: str = "m", *arguments: ArgumentDescription, **changes: Any
) -> MethodDescription:
    return MethodDescription(
        identifier, changes.pop("datatype", DataType.NUMBER), Label("M", "M"), arguments, **changes
    )


def argument(identifier: str = "a", **changes: Any) -> ArgumentDescription:
    return ArgumentDescription(
        identifier, changes.pop("datatype", DataType.NUMBER), Label("A", "A"), **changes
    )


def registered(description: TypeDescription) -> None:
    create_registry(entry_points=False).register(description)


def test_the_register_accepts_a_type_with_methods() -> None:
    registry = create_registry(entry_points=False)
    registry.register(series_description(registry))
    assert registry.get(SERIES) is not None


@pytest.mark.parametrize(
    "description",
    [
        with_methods(method("m"), method("m")),
        with_methods(method("m"), method("M")),
        with_methods(method("wert")),  # equals the property `wert`
        with_methods(method("mit leer")),
        with_methods(method("1m")),
        with_methods(method("")),
        with_methods(method("m", datatype=DataType.EXPRESSION)),
        with_methods(method("m", datatype=DataType.CHOICE)),  # a choice without values
        with_methods(
            method("m", datatype=DataType.CHOICE, choices=(Choice("a", Label("a", "a")),) * 2)
        ),
        with_methods(method("m", argument("a"), argument("a"))),
        with_methods(method("m", argument("a"), argument("A"))),
        with_methods(method("m", argument("a b"))),
        with_methods(method("m", argument("a", datatype=DataType.EXPRESSION))),
        with_methods(method("m", argument("a", datatype=DataType.CHOICE, required=True))),
        with_methods(method("m", argument("a", required=True, default=1))),
        with_methods(method("m", argument("a"))),  # optional without a default
        with_methods(method("m", argument("a", default="x"))),  # a text for a number
        with_methods(method("m", argument("a", default=True))),  # a truth value for a number
        with_methods(method("m", argument("a", datatype=DataType.INTEGER, default=1.5))),
        with_methods(method("m", argument("a", datatype=DataType.BOOLEAN, default=1))),
        with_methods(method("m", argument("a", datatype=DataType.TIME_UNIT, default="x9"))),
        with_methods(
            method(
                "m",
                argument(
                    "a",
                    datatype=DataType.CHOICE,
                    default="z",
                    choices=(Choice("a", Label("a", "a")),),
                ),
            )
        ),
        with_methods(method("m", argument("a", default=1), argument("b", required=True))),
    ],
)
def test_the_register_rejects_a_type_with_faulty_methods(description: TypeDescription) -> None:
    with pytest.raises(RegistryError):
        registered(description)
    registry = create_registry(entry_points=False)
    with pytest.raises(RegistryError):
        registry.register(description)
    assert description.id not in registry


def test_the_register_rejects_a_faulty_method_of_an_entry_point_and_keeps_the_others() -> None:
    class EntryPoint:
        def __init__(self, name: str, value: Any) -> None:
            self.name = name
            self.value = value

        def load(self) -> Any:
            return self.value

    registry = create_registry(entry_points=False)
    good = series_description(registry)
    bad = with_methods(method("m"), method("m"))
    report = registry.load_entry_points(
        [EntryPoint("good", good), EntryPoint("bad", [dataclasses.replace(good, id="X"), bad])]
    )
    assert (report.loaded, report.failed) == (("good",), ("bad",))
    assert SERIES in registry
    assert "X" not in registry  # a faulty entry point registers nothing


def test_the_register_accepts_optional_arguments_with_every_kind_of_default() -> None:
    description = with_methods(
        method(
            "m",
            argument("zahl", default=1),
            argument("bruch", default=0.5),
            argument("ganz", datatype=DataType.INTEGER, default=3),
            argument("anteil", datatype=DataType.PERCENT, default=0.1),
            argument("wahr", datatype=DataType.BOOLEAN, default=False),
            argument("text", datatype=DataType.TEXT, default=""),
            argument("einheit", datatype=DataType.TIME_UNIT, default="m15"),
            argument(
                "wahl",
                datatype=DataType.CHOICE,
                default="a",
                choices=(Choice("a", Label("a", "a")),),
            ),
        )
    )
    registered(description)


# --- break-down -------------------------------------------------------------------------------


def only_method_call(source: str) -> MethodCall:
    tree = parse(source).tree
    assert isinstance(tree, MethodCall), tree
    return tree


def test_a_method_is_broken_down_into_the_object_the_method_and_the_arguments() -> None:
    call = only_method_call("reihe_a.wert_vor(3; 4)")
    assert [item.text for item in call.owner] == ["reihe_a"]
    assert call.method.text == "wert_vor"
    assert (call.start, call.end) == (0, 22)
    assert (call.method.start, call.method.end) == (8, 16)
    assert len(call.args) == 2
    assert call.arg_separators == (18,)
    assert [item.text for item in call.segments] == ["reihe_a", "wert_vor"]


def test_a_method_without_arguments_and_a_method_of_a_contained_object() -> None:
    call = only_method_call("reihe_a.bereit()")
    assert call.args == () and call.arg_separators == ()
    nested = only_method_call("trend_h1.reihe_a.wert_vor(1)")
    assert [item.text for item in nested.owner] == ["trend_h1", "reihe_a"]
    assert nested.method.text == "wert_vor"


def test_a_method_with_names_in_square_brackets() -> None:
    call = only_method_call("[Reihe A].[Wert vor](3)")
    assert [(item.text, item.bracketed) for item in call.segments] == [
        ("Reihe A", True),
        ("Wert vor", True),
    ]
    assert call.method.start == 10


def test_the_arguments_of_a_method_are_expressions_and_may_be_methods() -> None:
    call = only_method_call("reihe_a.mittel(reihe_a.wert * 2; Messpunkt.abstand(reihe_a.wert))")
    assert len(call.args) == 2
    assert isinstance(call.args[1], MethodCall)
    assert isinstance(call.args[1].args[0], Name)


def test_a_function_is_no_method_and_a_name_with_a_point_before_a_parenthesis_is_a_method() -> None:
    tree = parse("MIN(1; 2)").tree
    assert tree is not None and not isinstance(tree, MethodCall)
    assert isinstance(parse("a.min(1)").tree, MethodCall)  # a method, not the function MIN
    assert isinstance(parse("[Min](1)").tree, type(parse("MIN(1)").tree))  # no point: a function


def test_a_method_call_with_a_syntax_problem_is_reported_with_its_position() -> None:
    for source, reason in [
        ("reihe_a.wert_vor(3", "unexpected_end"),
        ("reihe_a.wert_vor(3;)", "unexpected_token"),
        ("reihe_a.wert_vor(;3)", "unexpected_token"),
        ("reihe_a.[](3)", "empty_part"),
        ("reihe_a.wert_vor(3))", "unexpected_token"),
    ]:
        result = parse(source)
        assert result.tree is None, source
        assert result.issue is not None and result.issue.reason == reason, source


# --- type check -------------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("source", "datatype", "choices"),
    [
        ("reihe_a.wert_vor(3)", DataType.NUMBER, None),
        ('reihe_a.wert_vor(3; "eroeffnung")', DataType.NUMBER, None),
        ('reihe_a.wert_vor(3; "schluss")', DataType.NUMBER, None),
        ("REIHE_A.WERT_VOR(3)", DataType.NUMBER, None),
        ("reihe_a.wert_vor(1 + 2)", DataType.NUMBER, None),
        ("reihe_a.wert_vor(Strategie.wartende_orders)", DataType.NUMBER, None),
        ("reihe_a.mittel(1; 2)", DataType.NUMBER, None),
        ("reihe_a.mittel(1.5; Konto.kapital)", DataType.NUMBER, None),
        ("reihe_a.mittel(1; 2; TRUE())", DataType.NUMBER, None),
        ('reihe_a.mittel(1; 2; FALSE(); "m15")', DataType.NUMBER, None),
        ('reihe_a.mittel(1; 2; FALSE(); "m15"; "t")', DataType.NUMBER, None),
        ('reihe_a.mittel(1; 2; FALSE(); "m15"; "t"; 5%)', DataType.NUMBER, None),
        ("reihe_a.tendenz()", DataType.CHOICE, ("aufwaerts", "abwaerts")),
        ("reihe_a.anzahl_wechsel()", DataType.INTEGER, None),
        ("reihe_a.bereit()", DataType.BOOLEAN, None),
        ("Messpunkt.abstand(2)", DataType.NUMBER, None),
        ("Messpunkt.abstand(reihe_a.wert_vor(1))", DataType.NUMBER, None),
        ("reihe_a.wert_vor(reihe_a.anzahl_wechsel())", DataType.NUMBER, None),
        ("reihe_a.wert_vor([])", DataType.NUMBER, None),
    ],
)
def test_a_method_with_fitting_arguments_has_the_type_of_its_result(
    source: str, datatype: DataType, choices: tuple[str, ...] | None
) -> None:
    analysis = analyze(source, SCOPE)
    assert analysis.issues == [], source
    assert analysis.result_type.datatype is datatype
    assert analysis.result_type.choices == choices


def test_a_method_in_a_larger_expression() -> None:
    assert issues("reihe_a.wert_vor(3) > reihe_a.wert") == []
    assert issues("reihe_a.wert_vor(3) + 1 > 2") == []
    assert issues('AND(reihe_a.bereit(); reihe_a.tendenz() = "aufwaerts")') == []
    assert issues("IF(reihe_a.bereit(); reihe_a.wert_vor(1); 0)") == []
    assert issues("reihe_a.bereit() + 1") == [("type_mismatch", "operand")]
    assert issues("reihe_a.wert_vor(3) = reihe_a.bereit()") == [("type_mismatch", "comparison")]


def test_the_number_of_arguments_is_checked() -> None:
    few = only_issue("reihe_a.wert_vor()")
    assert few.kind is IssueKind.ARGUMENT_COUNT
    assert (few.start, few.end) == (0, 18)
    assert few.details == {
        "found": 0,
        "object": "reihe_a",
        "method": "wert_vor",
        "minimum": 1,
        "maximum": 2,
    }
    many = only_issue('reihe_a.wert_vor(1; "schluss"; 3)')
    assert many.kind is IssueKind.ARGUMENT_COUNT
    assert many.details["found"] == 3
    assert (many.details["minimum"], many.details["maximum"]) == (1, 2)
    assert only_issue("reihe_a.bereit(1)").kind is IssueKind.ARGUMENT_COUNT
    assert only_issue("Messpunkt.abstand()").kind is IssueKind.ARGUMENT_COUNT
    assert only_issue("reihe_a.mittel(1)").kind is IssueKind.ARGUMENT_COUNT


def test_a_method_without_parentheses_is_reported() -> None:
    found = only_issue("reihe_a.wert_vor")
    assert found.kind is IssueKind.ARGUMENT_COUNT
    assert found.reason == "call_missing"
    assert (found.start, found.end) == (0, 16)
    assert found.details["method"] == "wert_vor"
    assert issues("reihe_a.bereit") == [("argument_count", "call_missing")]
    assert issues("1 + reihe_a.bereit") == [("argument_count", "call_missing")]


@pytest.mark.parametrize(
    ("source", "expected", "found"),
    [
        ("reihe_a.wert_vor(1.5)", "integer", "number"),
        ("reihe_a.wert_vor(5%)", "integer", "percent"),
        ('reihe_a.wert_vor("drei")', "integer", "text"),
        ("reihe_a.wert_vor(TRUE())", "integer", "boolean"),
        ("reihe_a.mittel(TRUE(); 2)", "number", "boolean"),
        ('reihe_a.mittel(1; "zwei")', "number", "text"),
        ("reihe_a.mittel(1; 2; 3)", "boolean", "integer"),
        ('reihe_a.mittel(1; 2; "ja")', "boolean", "text"),
        ("reihe_a.mittel(1; 2; TRUE(); 15)", "time_unit", "integer"),
        ("reihe_a.mittel(1; 2; TRUE(); TRUE())", "time_unit", "boolean"),
        ('reihe_a.mittel(1; 2; TRUE(); "m15"; 5)', "text", "integer"),
        ('reihe_a.mittel(1; 2; TRUE(); "m15"; "t"; "viel")', "percent", "text"),
        ("reihe_a.wert_vor(1; 2)", "choice", "integer"),
        ("reihe_a.wert_vor(1; TRUE())", "choice", "boolean"),
        ("Messpunkt.abstand(TRUE())", "number", "boolean"),
    ],
)
def test_the_data_type_of_every_argument_is_checked(source: str, expected: str, found: str) -> None:
    result = only_issue(source)
    assert result.kind is IssueKind.TYPE_MISMATCH, source
    assert result.reason == "method_argument"
    assert result.details["expected"] == expected
    assert result.details["found"] == found
    assert result.details["method"] in ("wert_vor", "mittel", "abstand")


def test_the_position_and_the_name_of_the_faulty_argument_are_reported() -> None:
    source = "reihe_a.mittel(1; 2; 3)"
    result = only_issue(source)
    assert source[result.start : result.end] == "3"
    assert (result.details["argument"], result.details["index"]) == ("gewichtet", 2)
    assert (result.details["object"], result.details["method"]) == ("reihe_a", "mittel")


def test_a_fixed_text_for_a_choice_or_a_time_unit_is_checked_against_the_values() -> None:
    result = only_issue('reihe_a.wert_vor(1; "mittelkurs")')
    assert result.kind is IssueKind.UNKNOWN_CHOICE_VALUE
    assert result.details["values"] == ["mittelkurs"]
    assert result.details["allowed"] == ["schluss", "eroeffnung"]
    unit = only_issue('reihe_a.mittel(1; 2; TRUE(); "x9")')
    assert unit.kind is IssueKind.UNKNOWN_CHOICE_VALUE
    assert unit.details["values"] == ["x9"]
    # a text that arises only at the execution is checked there
    assert issues("reihe_a.wert_vor(1; Strategie.name)") == []


def test_the_value_of_a_choice_may_be_named_by_its_label_in_the_display_form() -> None:
    labelled = analyze('reihe_a.wert_vor(1; "Eröffnungskurs")', SCOPE, display=True)
    assert labelled.issues == []
    english = analyze('reihe_a.wert_vor(1; "open price")', SCOPE, display=True)
    assert english.issues == []
    assert analyze('reihe_a.wert_vor(1; "Eröffnungskurs")', SCOPE).issues != []  # stored form


def test_a_method_that_does_not_exist_is_an_unknown_method() -> None:
    found = only_issue("reihe_a.gibtsnicht(1)")
    assert found.kind is IssueKind.UNKNOWN_METHOD
    assert found.reason == "unknown"
    assert found.details == {"object": "reihe_a", "method": "gibtsnicht"}
    assert (found.start, found.end) == (8, 18)


def test_a_property_is_no_method() -> None:
    found = only_issue("reihe_a.wert(1)")
    assert found.kind is IssueKind.UNKNOWN_METHOD
    assert found.reason == "not_a_method"
    assert issues("Konto.kapital(1)") == [("unknown_method", "not_a_method")]
    assert issues("Order.volumen()") == [("unknown_method", "not_a_method")]


def test_a_method_of_an_unknown_object_is_an_unknown_name() -> None:
    found = only_issue("gibtsnicht.wert_vor(1)")
    assert found.kind is IssueKind.UNKNOWN_NAME
    assert (found.start, found.end) == (0, 10)
    assert issues("Strategie.nichts.wert_vor(1)") == [("unknown_property", "")]


def test_the_arguments_of_a_method_of_an_unknown_object_are_still_checked() -> None:
    result = analyze("gibtsnicht.wert_vor(auch_nicht)", SCOPE)
    assert [item.kind for item in result.issues] == [IssueKind.UNKNOWN_NAME, IssueKind.UNKNOWN_NAME]


def test_a_method_of_an_object_that_cannot_be_checked_is_not_reported() -> None:
    """In the template of a rule `Strategie` accepts any name (specification 3.4)."""
    open_strategy = application_scope(REGISTRY, None, open_strategy=True)
    assert analyze("Strategie.irgendwas(1)", open_strategy).issues == []


def test_the_expected_type_is_checked_against_the_result_of_a_method() -> None:
    from pipwerk_domain.expressions import ExprType

    assert analyze("reihe_a.wert_vor(1)", SCOPE, ExprType(DataType.NUMBER)).issues == []
    wrong = analyze("reihe_a.bereit()", SCOPE, ExprType(DataType.NUMBER))
    assert [(item.kind, item.reason) for item in wrong.issues] == [
        (IssueKind.TYPE_MISMATCH, "result")
    ]
    choice = analyze("reihe_a.tendenz()", SCOPE, ExprType(DataType.CHOICE, choices=("a", "b")))
    assert choice.issues == []  # the check of the values is done for fixed texts


def test_the_names_of_a_method_call_are_recognized_up_to_the_method() -> None:
    analysis = analyze("1 + reihe_a.wert_vor(3)", SCOPE)
    (name,) = analysis.names
    assert name.resolved and name.identifier == "reihe_a.wert_vor"
    assert (name.start, name.end) == (4, 20)  # without the arguments
    assert [(item.start, item.end, item.identifier) for item in name.segments] == [
        (4, 11, "reihe_a"),
        (12, 20, "wert_vor"),
    ]
    assert [item.name for item in name.symbols] == ["reihe_a", "wert_vor"]
    unknown = analyze("reihe_a.nix(3)", SCOPE).names[0]
    assert not unknown.resolved
    assert [item.identifier for item in unknown.segments] == ["reihe_a"]


# --- PREVIOUS ---------------------------------------------------------------------------------


@pytest.mark.parametrize(
    "source",
    [
        "PREVIOUS(reihe_a.wert_vor(3))",
        'PREVIOUS(reihe_a.wert_vor(3; "eroeffnung"); 2)',
        "PREVIOUS(reihe_a.tendenz())",
        "PREVIOUS(reihe_a.bereit())",
        "PREVIOUS(reihe_a.wert_vor(3)) + reihe_a.wert_vor(3)",
    ],
)
def test_previous_takes_the_result_of_a_method_of_an_object_with_a_time_unit(source: str) -> None:
    assert issues(source) == []


def test_previous_of_the_result_of_a_method_has_the_type_of_the_result() -> None:
    assert analyze("PREVIOUS(reihe_a.wert_vor(3))", SCOPE).result_type.datatype is DataType.NUMBER
    assert analyze("PREVIOUS(reihe_a.bereit())", SCOPE).result_type.datatype is DataType.BOOLEAN


def test_previous_of_the_result_of_a_method_of_an_object_without_a_time_unit_is_an_error() -> None:
    found = only_issue("PREVIOUS(Messpunkt.abstand(3))")
    assert found.kind is IssueKind.PREVIOUS_ARGUMENT
    assert found.reason == "no_earlier_value"
    assert found.details["name"] == "Messpunkt.abstand"


def test_previous_marks_the_name_of_the_method() -> None:
    analysis = analyze("PREVIOUS(reihe_a.wert_vor(3))", SCOPE)
    assert [item.previous for item in analysis.names] == [True]
    assert [item.previous for item in analyze("reihe_a.wert_vor(3)", SCOPE).names] == [False]


def test_previous_of_a_method_with_a_faulty_argument_reports_the_argument_only() -> None:
    assert issues("PREVIOUS(reihe_a.wert_vor(1.5))") == [("type_mismatch", "method_argument")]


def test_previous_of_an_expression_around_a_method_is_still_an_error() -> None:
    found = only_issue("PREVIOUS(reihe_a.wert_vor(3) + 1)")
    assert found.kind is IssueKind.PREVIOUS_ARGUMENT and found.reason == "not_a_name"


# --- display form -----------------------------------------------------------------------------


def test_the_display_form_of_a_method_in_german_and_in_english() -> None:
    stored = 'reihe_a.wert_vor(3; "eroeffnung") > reihe_a.wert'
    german = render(stored, SCOPE, "de", display_input=False)
    assert german.display == '[Reihe A].[Wert vor](3; "Eröffnungskurs") > [Reihe A].Wert'
    english = render(stored, SCOPE, "en", display_input=False)
    assert english.display == '[Reihe A].[Value before](3; "open price") > [Reihe A].Value'
    assert german.stored == english.stored == stored


@pytest.mark.parametrize(
    "text",
    [
        '[Reihe A].[Wert vor](3; "Eröffnungskurs")',
        '[Reihe A].[Value before](3; "open price")',
        '[reihe a].[wert vor](3; "eroeffnung")',
        'reihe_a.wert_vor(3; "eroeffnung")',
        'REIHE_A.Wert_Vor(3; "Eröffnungskurs")',
    ],
)
def test_the_display_form_is_read_in_both_languages_and_in_the_stored_form(text: str) -> None:
    result = render(text, SCOPE, "de", display_input=True)
    assert result.analysis.issues == [], text
    assert result.stored == 'reihe_a.wert_vor(3; "eroeffnung")'
    assert result.display == '[Reihe A].[Wert vor](3; "Eröffnungskurs")'


def test_a_method_in_the_display_form_with_simple_names_needs_no_brackets() -> None:
    result = render("Messpunkt.Abstand(2)", SCOPE, "de", display_input=True)
    assert result.stored == "Messpunkt.abstand(2)"
    assert result.display == "Messpunkt.Abstand(2)"
    assert render("Messpunkt.abstand(2)", SCOPE, "en", display_input=False).display == (
        "Point.Distance(2)"
    )


def test_a_method_inside_the_arguments_of_a_method_is_converted() -> None:
    result = render("[Messpunkt].Abstand([Reihe A].[Wert vor](1))", SCOPE, "de", display_input=True)
    assert result.stored == "Messpunkt.abstand(reihe_a.wert_vor(1))"
    assert result.display == "Messpunkt.Abstand([Reihe A].[Wert vor](1))"


def test_a_method_that_is_not_found_stays_as_written() -> None:
    result = render("[Reihe A].[Gibt es nicht](3)", SCOPE, "de", display_input=True)
    assert result.stored == "reihe_a.[Gibt es nicht](3)"
    assert [item.kind for item in result.analysis.issues] == [IssueKind.UNKNOWN_METHOD]


def test_normalization_writes_the_method_in_the_spelling_of_its_identifier() -> None:
    assert normalize_expression("REIHE_A.WERT_VOR(3)", SCOPE) == "reihe_a.wert_vor(3)"
    assert normalize_expression("Messpunkt.ABSTAND(2)", SCOPE) == "Messpunkt.abstand(2)"
    assert normalize_expression("Reihe_A.Gibts_Nicht(3)", SCOPE) == "reihe_a.Gibts_Nicht(3)"


# --- blocks -----------------------------------------------------------------------------------


def blocks_of(source: str) -> Block:
    analysis = analyze(source, SCOPE)
    assert analysis.issues == [], analysis.issues
    result = to_blocks(analysis)
    assert result is not None
    return result


def test_a_method_is_a_value_block_with_the_blocks_of_its_arguments() -> None:
    block = blocks_of('reihe_a.wert_vor(1 + 2; "eroeffnung")')
    assert block.kind is BlockKind.NAME and block.call
    assert block.path == ("reihe_a", "wert_vor")
    assert [item.kind for item in block.children] == [BlockKind.ARITHMETIC, BlockKind.LITERAL]
    assert block.children[1].value == "eroeffnung"
    assert block.type is not None and block.type.datatype is DataType.NUMBER
    assert [item.name for item in block.symbols] == ["reihe_a", "wert_vor"]


def test_a_method_without_arguments_is_a_value_block_with_a_call() -> None:
    block = blocks_of("reihe_a.bereit()")
    assert block.kind is BlockKind.NAME and block.call and block.children == ()
    plain = blocks_of("reihe_a.wert")
    assert plain.kind is BlockKind.NAME and not plain.call
    assert plain != Block(BlockKind.NAME, path=("reihe_a", "wert"), call=True)


def test_an_empty_place_is_an_argument_block() -> None:
    block = blocks_of("reihe_a.wert_vor([])")
    assert [item.kind for item in block.children] == [BlockKind.EMPTY]


@pytest.mark.parametrize(
    "source",
    [
        "reihe_a.wert_vor(3)",
        'reihe_a.wert_vor(3; "eroeffnung")',
        "reihe_a.bereit()",
        "reihe_a.wert_vor(reihe_a.anzahl_wechsel())",
        "Messpunkt.abstand(Messpunkt.abstand(1) * 2)",
        "reihe_a.wert_vor(3) > reihe_a.wert",
        "IF(reihe_a.bereit(); reihe_a.wert_vor(1); reihe_a.mittel(1; 2))",
        'reihe_a.tendenz() = "aufwaerts"',
        "PREVIOUS(reihe_a.wert_vor(3))",
        "reihe_a.wert_vor([])",
    ],
)
def test_blocks_and_expression_give_the_same_expression_in_both_directions(source: str) -> None:
    block = blocks_of(source)
    text = blocks_to_text(block)
    assert text == source
    assert blocks_of(text) == block


def test_blocks_to_text_builds_a_method_from_the_blocks_of_the_arguments() -> None:
    block = Block(
        BlockKind.NAME,
        path=("reihe_a", "wert_vor"),
        call=True,
        children=(
            Block(BlockKind.LITERAL, value=3, datatype="integer"),
            Block(BlockKind.LITERAL, value="eroeffnung", datatype="text"),
        ),
    )
    assert blocks_to_text(block) == 'reihe_a.wert_vor(3; "eroeffnung")'
    wrapped = Block(BlockKind.COMPARISON, operator=">", children=(block, Block(BlockKind.EMPTY)))
    assert blocks_to_text(wrapped) == 'reihe_a.wert_vor(3; "eroeffnung") > []'
    bracketed = Block(BlockKind.NAME, path=("Reihe A", "Wert vor"), call=True)
    assert blocks_to_text(bracketed) == "[Reihe A].[Wert vor]()"


@pytest.mark.parametrize(
    ("block", "reason"),
    [
        (Block(BlockKind.NAME, path=("wert_vor",), call=True), "name_path"),
        (Block(BlockKind.NAME, path=(), call=True), "name_path"),
        (
            Block(BlockKind.NAME, path=("a", "b"), children=(Block(BlockKind.EMPTY),)),
            "name_children",
        ),
    ],
)
def test_blocks_that_are_no_method_are_rejected(block: Block, reason: str) -> None:
    with pytest.raises(BlockError) as caught:
        blocks_to_text(block)
    assert caught.value.reason == reason


def test_a_crossing_of_methods_is_broken_down_into_previous_value_comparisons_and_and() -> None:
    source = (
        "AND(PREVIOUS(reihe_a.wert_vor(3)) <= PREVIOUS(reihe_a.wert); "
        "reihe_a.wert_vor(3) > reihe_a.wert)"
    )
    block = blocks_of(source)
    assert (block.kind, block.operator) == (BlockKind.LOGIC, "and")
    first, second = block.children
    assert [item.operator for item in (first, second)] == ["<=", ">"]
    previous_method, previous_property = first.children
    assert (previous_method.kind, previous_method.function) == (BlockKind.FUNCTION, "PREVIOUS")
    assert previous_method.children[0].call
    assert previous_method.children[0].path == ("reihe_a", "wert_vor")
    assert not previous_property.children[0].call
    assert blocks_to_text(block) == source


def test_a_crossing_of_a_method_with_a_fixed_value_is_broken_down_the_same_way() -> None:
    source = "AND(PREVIOUS(reihe_a.wert_vor(3)) <= 50; reihe_a.wert_vor(3) > 50)"
    block = blocks_of(source)
    assert (block.kind, block.operator) == (BlockKind.LOGIC, "and")
    assert blocks_to_text(block) == source
    both_ways = (
        "OR(AND(PREVIOUS(reihe_a.wert_vor(3)) <= 50; reihe_a.wert_vor(3) > 50); "
        "AND(PREVIOUS(reihe_a.wert_vor(3)) >= 50; reihe_a.wert_vor(3) < 50))"
    )
    block = blocks_of(both_ways)
    assert (block.kind, block.operator) == (BlockKind.LOGIC, "or")
    assert blocks_to_text(block) == both_ways


def test_two_comparisons_of_methods_without_a_previous_value_are_two_comparisons() -> None:
    source = "AND(Messpunkt.abstand(1) <= 2; Messpunkt.abstand(1) > 2)"
    plain = blocks_of(source)
    assert plain.kind is BlockKind.LOGIC
    assert blocks_to_text(plain) == source


# --- characters -------------------------------------------------------------------------------


def test_the_characters_of_a_method_call() -> None:
    source = 'reihe_a.wert_vor(3; "x")'
    result = characters(source)
    assert [(item.kind, source[item.start : item.end]) for item in result] == [
        (CharacterKind.NAME, "reihe_a.wert_vor"),
        (CharacterKind.BRACKET, "("),
        (CharacterKind.VALUE, "3"),
        (CharacterKind.SEPARATOR, ";"),
        (CharacterKind.VALUE, '"x"'),
        (CharacterKind.BRACKET, ")"),
    ]
    assert (result[1].partner, result[5].partner) == (5, 1)


def test_the_characters_of_a_method_with_names_in_brackets_and_a_function() -> None:
    source = "MIN([Reihe A].[Wert vor](1); 2)"
    result = characters(source)
    assert [(item.kind, source[item.start : item.end]) for item in result][:3] == [
        (CharacterKind.FUNCTION, "MIN"),
        (CharacterKind.BRACKET, "("),
        (CharacterKind.NAME, "[Reihe A].[Wert vor]"),
    ]


# --- findings ---------------------------------------------------------------------------------


def strategy_with(*elements: Any, connections: list[Any] | None = None) -> Strategy:
    return Strategy(
        id=uid(900),
        name="Methoden",
        elements=[
            trigger(1),
            element(3, SERIES, instance=series_instance()),
            *elements,
            place_order(2),
        ],
        connections=connections or [connect(1, "weiter", 5), connect(5, "wahr", 2)],
    )


def check(strategy: Strategy) -> list[Any]:
    return check_strategy(strategy, REGISTRY)


def test_an_expression_with_a_method_of_a_registered_type_has_no_finding() -> None:
    strategy = strategy_with(condition(5, 'reihe_a.wert_vor(3; "eroeffnung") > reihe_a.wert'))
    assert check(strategy) == []


def test_the_findings_of_an_expression_name_the_method_and_the_place() -> None:
    cases = {
        "reihe_a.wert_vor() > 1": ("argument_count", "", (0, 18)),
        "reihe_a.wert_vor > 1": ("argument_count", "call_missing", (0, 16)),
        "reihe_a.wert_vor(1.5) > 1": ("type_mismatch", "method_argument", (17, 20)),
        'reihe_a.wert_vor(1; "x") > 1': ("unknown_choice_value", "method_argument", (20, 23)),
        "reihe_a.nix(1) > 1": ("unknown_method", "unknown", (8, 11)),
        "reihe_a.wert(1) > 1": ("unknown_method", "not_a_method", (8, 12)),
    }
    for text, (issue, reason, (start, end)) in cases.items():
        found = only(check(strategy_with(condition(5, text))), fc.EXPRESSION_INVALID)
        assert len(found) == 1, text
        details = found[0].details
        assert (details["issue"], details["reason"]) == (issue, reason), text
        assert (details["start"], details["end"]) == (start, end), text
        assert found[0].level is Level.ERROR


def test_previous_of_the_result_of_a_method_without_a_time_unit_is_a_finding() -> None:
    found = only(
        check(strategy_with(condition(5, "PREVIOUS(Messpunkt.abstand(1)) > 1"))),
        fc.EXPRESSION_INVALID,
    )
    assert found[0].details["issue"] == "previous_argument"
    assert not only(check(strategy_with(condition(5, "PREVIOUS(reihe_a.bereit())"))), "x")


def test_the_recognized_names_of_a_check_include_the_methods() -> None:
    from pipwerk_domain.consistency import check_strategy_with_names

    result = check_strategy_with_names(
        strategy_with(condition(5, "reihe_a.wert_vor(3) > 1")), REGISTRY
    )
    names = [found for item in result.expressions for found in item.names]
    assert [(item.identifier, item.resolved, item.start, item.end) for item in names] == [
        ("reihe_a.wert_vor", True, 0, 16)
    ]


# --- inputs that name a method ---------------------------------------------------------------


def with_input(entry: ElementInput, text: str = "TRUE()") -> Strategy:
    return strategy_with(condition(5, text, inputs=[entry]))


def input_findings(entry: ElementInput, text: str = "TRUE()") -> list[Any]:
    return [item for item in check(with_input(entry, text)) if item.code != fc.INPUT_UNUSED]


def test_an_input_that_names_a_method_with_fitting_arguments_is_valid() -> None:
    for entry in [
        ElementInput("reihe_a", "wert_vor", InputKind.METHOD, (3,)),
        ElementInput("reihe_a", "wert_vor", InputKind.METHOD, (3, "eroeffnung")),
        ElementInput("reihe_a", "mittel", InputKind.METHOD, (1, 2.5, True, "m15", "t", 0.2)),
        ElementInput("reihe_a", "tendenz", InputKind.METHOD),
        ElementInput("reihe_a", "bereit", InputKind.METHOD, (), True),
    ]:
        assert input_findings(entry) == [], entry


@pytest.mark.parametrize(
    ("entry", "reason"),
    [
        (ElementInput("reihe_a", "gibtsnicht", InputKind.METHOD), "unknown_method"),
        (ElementInput("reihe_a", "wert", InputKind.METHOD), "unknown_method"),  # a property
        (ElementInput("reihe_a", "wert_vor"), "unknown_property"),  # a method as a property
        (ElementInput("reihe_a", "gibtsnicht"), "unknown_property"),
        (ElementInput("gibtsnicht", "wert_vor", InputKind.METHOD, (1,)), "unknown_instance"),
        (ElementInput("reihe_a", "wert_vor", InputKind.METHOD), "arguments"),  # too few
        (ElementInput("reihe_a", "wert_vor", InputKind.METHOD, (1, "schluss", 1)), "arguments"),
        (ElementInput("reihe_a", "bereit", InputKind.METHOD, (1,)), "arguments"),  # too many
        (ElementInput("reihe_a", "wert_vor", InputKind.METHOD, (1.5,)), "arguments"),
        (ElementInput("reihe_a", "wert_vor", InputKind.METHOD, ("1",)), "arguments"),
        (ElementInput("reihe_a", "wert_vor", InputKind.METHOD, (True,)), "arguments"),
        (ElementInput("reihe_a", "wert_vor", InputKind.METHOD, (1, "mittelkurs")), "arguments"),
        (ElementInput("reihe_a", "mittel", InputKind.METHOD, (1, 2, 3)), "arguments"),
        (ElementInput("reihe_a", "mittel", InputKind.METHOD, (1, 2, True, "x9")), "arguments"),
        (ElementInput("reihe_a", "mittel", InputKind.METHOD, (1, "2")), "arguments"),
    ],
)
def test_an_input_with_a_method_that_does_not_exist_or_arguments_that_do_not_fit(
    entry: ElementInput, reason: str
) -> None:
    found = only(input_findings(entry), fc.DATA_UNKNOWN)
    assert len(found) == 1, entry
    assert found[0].level is Level.ERROR
    assert found[0].element == uid(5)
    assert found[0].details["where"] == "input"
    assert found[0].details["reason"] == reason
    assert found[0].details["instance"] == entry.instance


def test_the_finding_about_the_arguments_names_the_numbers() -> None:
    entry = ElementInput("reihe_a", "wert_vor", InputKind.METHOD, (1, "schluss", 3))
    (found,) = only(check(with_input(entry)), fc.DATA_UNKNOWN)
    assert (found.details["minimum"], found.details["maximum"], found.details["found"]) == (1, 2, 3)


def test_an_input_that_no_expression_uses_is_a_hint_also_for_a_method() -> None:
    entry = ElementInput("reihe_a", "wert_vor", InputKind.METHOD, (3,))
    unused = only(check(with_input(entry)), fc.INPUT_UNUSED)
    assert len(unused) == 1 and unused[0].level is Level.HINT
    assert unused[0].details["property"] == "wert_vor"
    used = only(check(with_input(entry, "reihe_a.wert_vor(3) > 1")), fc.INPUT_UNUSED)
    assert used == []
    other = only(check(with_input(entry, "reihe_a.mittel(1; 2) > 1")), fc.INPUT_UNUSED)
    assert len(other) == 1


def test_an_input_that_names_a_property_is_used_by_the_property_and_not_by_a_method() -> None:
    entry = ElementInput("reihe_a", "wert")
    assert only(check(with_input(entry, "reihe_a.wert > 1")), fc.INPUT_UNUSED) == []
    assert len(only(check(with_input(entry, "reihe_a.bereit()")), fc.INPUT_UNUSED)) == 1


def test_the_indication_refresh_is_kept_by_the_check_and_does_not_change_the_findings() -> None:
    strategy = with_input(ElementInput("reihe_a", "wert", refresh=True), "reihe_a.wert > 1")
    assert check(strategy) == []


def test_the_documents_of_the_inputs_are_checked_by_the_check_of_the_web_api_too() -> None:
    from pipwerk_domain.documents import read_document, write_document

    strategy = with_input(
        ElementInput("reihe_a", "wert_vor", InputKind.METHOD, (3, "schluss"), True),
        "reihe_a.wert_vor(3) > 1",
    )
    again = read_document(write_document(strategy))
    assert again == strategy
    assert isinstance(again, Strategy)
    assert check(again) == []


# --- visible names ----------------------------------------------------------------------------


def test_the_visible_names_list_the_methods_with_arguments_data_type_and_explanation() -> None:
    names, truncated = visible_names(SCOPE, "de")
    assert not truncated
    series = next(item for item in names if item.path == ("reihe_a",))
    assert [item.key for item in series.properties] == ["wert"]
    assert [item.key for item in series.methods] == [
        "wert_vor",
        "mittel",
        "tendenz",
        "anzahl_wechsel",
        "bereit",
    ]
    method = series.methods[0]
    assert (method.label.de, method.label.en, method.datatype) == (
        "Wert vor",
        "Value before",
        "number",
    )
    assert method.explanation is not None and method.explanation.de.startswith("Der Wert")
    assert method.previous_value is True  # an object with a time unit
    assert [
        (item.key, item.datatype, item.required, item.default) for item in method.arguments
    ] == [
        ("anzahl", "integer", True, None),
        ("kurs", "choice", False, "schluss"),
    ]
    kurs = method.arguments[1]
    assert kurs.label.en == "Price"
    assert kurs.explanation.de == "Aus welchem Kurs gerechnet wird."
    assert [(item.key, item.label.de, item.label.en) for item in kurs.choices] == [
        ("schluss", "Schlusskurs", "close price"),
        ("eroeffnung", "Eröffnungskurs", "open price"),
    ]
    assert method.arguments[0].explanation.en == "How many values back."


def test_the_visible_names_list_the_values_of_a_result_that_is_a_choice() -> None:
    names, _ = visible_names(SCOPE, "en")
    series = next(item for item in names if item.path == ("reihe_a",))
    tendency = next(item for item in series.methods if item.key == "tendenz")
    assert tendency.datatype == "choice"
    assert [(item.key, item.label.en) for item in tendency.choices] == [
        ("aufwaerts", "up"),
        ("abwaerts", "down"),
    ]
    assert tendency.arguments == ()


def test_the_visible_names_of_an_object_without_a_time_unit_have_no_previous_value() -> None:
    names, _ = visible_names(SCOPE, "de")
    point = next(item for item in names if item.path == ("Messpunkt",))
    assert [item.key for item in point.methods] == ["abstand"]
    assert point.methods[0].previous_value is False
    assert point.methods[0].arguments[0].required is True
    konto = next(item for item in names if item.path == ("Konto",))
    assert konto.methods == []


def test_the_methods_of_a_name_are_cut_at_the_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    from pipwerk_domain.expressions import names as names_module

    monkeypatch.setattr(names_module, "MAX_PROPERTIES_PER_NAME", 2)
    names, _ = visible_names(SCOPE, "de")
    series = next(item for item in names if item.path == ("reihe_a",))
    assert len(series.methods) == 2
    assert series.properties_truncated is True


# --- sentence ---------------------------------------------------------------------------------


def test_the_sentence_names_the_method_its_arguments_and_the_object() -> None:
    block = blocks_of('reihe_a.wert_vor(3; "eroeffnung")')
    assert sentence(block, "de") == "Wert vor (3; „Eröffnungskurs“) von Reihe A"
    assert sentence(block, "en") == "Value before (3; “open price”) of Reihe A"
    assert sentence(blocks_of("reihe_a.bereit()"), "de") == "Bereit von Reihe A"
    assert sentence(blocks_of("reihe_a.bereit()"), "en") == "Ready of Reihe A"


def test_the_sentence_of_a_comparison_and_a_previous_value_of_a_method() -> None:
    block = blocks_of("PREVIOUS(reihe_a.wert_vor(3)) < reihe_a.wert_vor(1) * 2")
    assert sentence(block, "de") == (
        "vorheriger Wert von Wert vor (3) von Reihe A ist kleiner als "
        "Wert vor (1) von Reihe A mal 2"
    )
    assert sentence(blocks_of("Messpunkt.abstand(2) > 1"), "de") == (
        "Abstand (2) von Messpunkt ist größer als 1"
    )
