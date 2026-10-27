"""Findings name their element and field as the user sees them (specification 3.6, Mangel E3 of
the third acceptance): the name of the element, the name of an instance or rule, and the label of
the field in German and English, so that findings with the same text can be told apart."""

from pipwerk_domain import catalog
from pipwerk_domain.consistency import Finding, Level, check_strategy, check_template
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.consistency.describe import (
    CONNECTED_VALUES,
    RULE_EXPRESSION,
    describe_findings,
)
from pipwerk_domain.defaults import default_registry
from pipwerk_domain.model import (
    Binding,
    ElementInput,
    InputKind,
    Strategy,
    StrategyParameter,
)
from pipwerk_domain.typedesc import BindingKind, DataType, Label
from tests.helpers import (
    calculation,
    check,
    codes,
    condition,
    connect,
    element,
    ema,
    only,
    place_order,
    rule,
    template,
    trigger,
    uid,
    valid_strategy,
)

EXPRESSION_LABEL = Label("Ausdruck", "Expression")


def nine_empty_conditions() -> Strategy:
    """The case of the acceptance: several steps whose expression lost its object, so that the
    nine findings have the same text."""
    steps = [
        condition(10 + number, "", name=f"Prüfung {number}", key=f"pruefung_{number}")
        for number in range(1, 10)
    ]
    connections = [connect(1, "weiter", 10)] + [
        connect(10 + number, "wahr", 11 + number) for number in range(0, 8)
    ]
    return Strategy(
        id=uid(900),
        name="Test",
        elements=[trigger(1), *steps, place_order(2)],
        connections=connections,
    )


def test_findings_with_the_same_text_name_their_element() -> None:
    found = only(check(nine_empty_conditions()), fc.EXPRESSION_EMPTY)
    assert len(found) == 9
    assert {item.details["field"] for item in found} == {"parameter:ausdruck"}
    names = [item.element_name for item in found]
    assert len(set(names)) == 9  # the nine findings can be told apart
    assert names[0] == Label("Prüfung 1", "Prüfung 1")  # a name of the user is not translated
    assert all(item.field_label == EXPRESSION_LABEL for item in found)


def test_the_label_of_the_field_is_the_one_of_the_type_in_both_languages() -> None:
    strategy = valid_strategy()
    strategy.elements[1].properties.pop("volumen")  # a MUSS property without a value
    found = only(check(strategy), fc.ORDER_PROPERTY_MISSING)
    assert [item.field_label for item in found] == [Label("Volumen", "Volume")]
    assert found[0].element_name == Label("Order aufgeben", "Place order")


def test_the_label_of_a_parameter_of_an_element() -> None:
    strategy = Strategy(
        id=uid(900),
        name="Test",
        elements=[trigger(1, unit="m99"), place_order(2)],
        connections=[connect(1, "weiter", 2)],
    )
    found = check(strategy)
    assert found, "the time unit m99 does not exist"
    labelled = [item for item in found if item.field_label is not None]
    assert labelled
    assert all(item.field_label == Label("Zeiteinheit", "Time unit") for item in labelled)
    assert all(item.element_name == Label("Kerzenschluss", "Candle close") for item in labelled)


def test_a_finding_about_an_instance_names_the_instance_and_the_field() -> None:
    strategy = valid_strategy()
    broken = ema("EMA 20")
    broken.key = "ema20"
    broken.parameter_values["periode"] = Binding(BindingKind.FIXED, "viele")
    strategy.elements.append(element(3, "EMA", instance=broken))
    found = [item for item in check(strategy) if item.subject == "ema20"]
    assert found
    named = [item for item in found if item.subject_name == "EMA 20"]
    assert named == found
    labelled = [item for item in found if item.field_label is not None]
    assert labelled
    assert all(item.field_label == Label("Periode", "Period") for item in labelled)
    assert all(item.element_name == Label("EMA 20", "EMA 20") for item in labelled)


def test_a_finding_about_a_rule_of_the_strategy_names_the_rule() -> None:
    strategy = valid_strategy()
    own = rule("meine_regel", "gibtesnicht.wert > 1")
    own.name = "Meine Regel"
    strategy.rules.append(own)
    found = [item for item in check(strategy) if item.subject == "meine_regel"]
    assert found
    assert all(item.subject_name == "Meine Regel" for item in found)
    assert all(item.element_name is None for item in found)  # a rule of the strategy
    assert RULE_EXPRESSION in [item.field_label for item in found]


def test_a_finding_about_a_strategy_parameter_names_it() -> None:
    strategy = valid_strategy()
    strategy.parameters.append(StrategyParameter("Mein Wert", DataType.NUMBER, key="mein_wert"))
    found = only(check(strategy), fc.PARAMETER_MISSING)
    assert len(found) == 1
    assert found[0].subject_name == "Mein Wert"
    assert found[0].field_label == Label("Mein Wert", "Mein Wert")
    assert found[0].element_name is None


def test_a_finding_about_an_input_names_the_connected_values() -> None:
    strategy = valid_strategy()
    broken = ema("EMA 20")
    broken.key = "ema20"
    strategy.elements.append(element(3, "EMA", instance=broken))
    strategy.elements[1].inputs.append(ElementInput("ema20", "wert", InputKind.PROPERTY))
    found = only(check(strategy), fc.INPUT_UNUSED)
    assert len(found) == 1
    assert found[0].field_label == CONNECTED_VALUES
    assert found[0].element_name == Label("Order aufgeben", "Place order")


def test_the_name_of_an_element_without_a_name_is_the_name_of_its_type() -> None:
    strategy = Strategy(
        id=uid(900),
        name="Test",
        elements=[trigger(1), element(3, catalog.FLOW_CALCULATION), place_order(2)],
        connections=[connect(1, "weiter", 2)],
    )
    found = [item for item in check(strategy) if item.element == uid(3)]
    assert found
    assert all(item.element_name == Label("Berechnung", "Calculation") for item in found)


def test_an_unknown_type_is_named_by_its_identifier() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(3, "gibt.es.nicht", name=None))
    found = only(check(strategy), fc.TYPE_UNKNOWN)
    assert [item.element_name for item in found] == [Label("gibt.es.nicht", "gibt.es.nicht")]


def test_a_finding_without_an_element_names_nothing() -> None:
    found = check(Strategy(id=uid(900), name="Test"))
    assert codes(found) == [fc.FLOW_MAIN_WITHOUT_TRIGGER]
    assert (found[0].element_name, found[0].subject_name, found[0].field_label) == (None,) * 3


def test_the_names_of_a_template_finding() -> None:
    own = rule("regel_a", "gibtesnicht.wert > 1")
    own.name = "Regel A"
    broken = template(catalog.TYPE_INDICATOR, rules=[own])
    found = [item for item in check_template(broken) if item.subject == "regel_a"]
    assert found
    assert all(item.subject_name == "Regel A" for item in found)
    assert all(item.element_name is None for item in found)
    assert RULE_EXPRESSION in [item.field_label for item in found]


def test_the_names_do_not_take_part_in_the_comparison_of_findings() -> None:
    plain = Finding(Level.ERROR, "a.b", "e", "s", {"k": 1})
    named = Finding(Level.ERROR, "a.b", "e", "s", {"k": 1}, Label("x", "x"), "y", Label("z", "z"))
    assert plain == named


def test_the_dictionary_of_a_finding_has_the_names() -> None:
    finding = Finding(
        Level.ERROR,
        "a.b",
        "e",
        "s",
        {},
        element_name=Label("Schritt", "Step"),
        subject_name="EMA 20",
        field_label=Label("Periode", "Period"),
    )
    data = finding.to_dict()
    assert data["element_name"] == {"de": "Schritt", "en": "Step"}
    assert data["subject_name"] == "EMA 20"
    assert data["field_label"] == {"de": "Periode", "en": "Period"}


def test_describing_findings_keeps_level_code_and_details() -> None:
    strategy = nine_empty_conditions()
    plain = Finding(
        Level.ERROR, fc.EXPRESSION_EMPTY, uid(11), None, {"field": "parameter:ausdruck"}
    )
    (described,) = describe_findings([plain], strategy, default_registry())
    assert (described.level, described.code, described.element) == (
        plain.level,
        plain.code,
        plain.element,
    )
    assert described.details == plain.details
    assert described.element_name == Label("Prüfung 1", "Prüfung 1")


def test_a_calculation_and_a_condition_with_the_same_text_are_told_apart() -> None:
    strategy = Strategy(
        id=uid(900),
        name="Test",
        elements=[
            trigger(1),
            calculation(3, "Stop", ""),
            condition(4, "", name="Einstieg", key="einstieg"),
            place_order(2),
        ],
        connections=[connect(1, "weiter", 3), connect(3, "weiter", 4), connect(4, "wahr", 2)],
    )
    found = only(check_strategy(strategy), fc.EXPRESSION_EMPTY)
    assert [item.element_name for item in found] == [
        Label("Stop", "Stop"),
        Label("Einstieg", "Einstieg"),
    ]
