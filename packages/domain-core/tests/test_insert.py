"""Inserting a template into a strategy (specification 3.3): the names the library suggests,
the keys it forms and the expressions inside the instance that follow the new keys; the instance
made from an object type; names that are taken in the strategy, in the application and by the
functions."""

import pytest

from pipwerk_domain import catalog
from pipwerk_domain.consistency import check_strategy
from pipwerk_domain.defaults import builtin_templates
from pipwerk_domain.model import (
    Binding,
    Instance,
    Origin,
    PropertyDefinition,
    Template,
)
from pipwerk_domain.operations import (
    InsertionError,
    insert_instance,
    namespace_keys,
    namespace_names,
)
from pipwerk_domain.typedesc import BindingKind, DataType
from tests.helpers import (
    calculation,
    connect,
    definition,
    element,
    ema,
    fixed,
    rule,
    ruleset,
    uid,
    use,
    valid_strategy,
)


def trend_template() -> Template:
    """A trend "Mein Trend" with an `EMA 20` and a rule inside, and expressions that use both."""
    return Template(
        id="11111111-2222-4333-8444-666666666666",
        name="Mein Trend",
        object_type=catalog.TYPE_TREND,
        parameter_values={
            "zeiteinheit": fixed("h1"),
            "berechnungsverfahren": fixed("trend_method.expression"),
        },
        parameters=[definition("Grenze", DataType.NUMBER, default=1)],
        instances=[
            Instance(
                name="EMA 20",
                key="ema20",
                object_type="EMA",
                origin=Origin("EMA"),
                parameter_values={
                    "zeiteinheit": fixed("h1"),
                    "periode": Binding(BindingKind.EXPRESSION, "grenze"),
                },
            )
        ],
        rules=[rule("aufwaerts", "ema20.wert > grenze")],
        properties=[
            PropertyDefinition("Richtung", DataType.TEXT, 'IF(aufwaerts.ergebnis; "a"; "b")'),
            PropertyDefinition("Preis", DataType.NUMBER, "ema20.wert + PREVIOUS(ema20.wert)"),
        ],
    )


def test_the_instance_has_the_name_of_the_template_unless_a_name_is_given() -> None:
    made = insert_instance(valid_strategy(), template=trend_template())
    assert (made.name, made.key) == ("Mein Trend", "mein_trend")
    named = insert_instance(valid_strategy(), template=trend_template(), name="Trend H1")
    assert (named.name, named.key) == ("Trend H1", "trend_h1")


def test_origin_names_the_template_of_the_user_and_only_the_identifier_of_a_delivered_one() -> None:
    made = insert_instance(valid_strategy(), template=trend_template())
    assert made.origin == Origin("Trend", "11111111-2222-4333-8444-666666666666", "Mein Trend")
    risk = builtin_templates()[0]
    delivered = insert_instance(valid_strategy(), template=risk)
    assert delivered.origin == Origin("Regel", risk.id, None)
    assert (delivered.name, delivered.key) == ("Risiko je Trade", "risiko_je_trade")
    assert delivered.expression == risk.expression  # nothing inside: unchanged
    assert delivered.first_use is None


def test_what_the_instance_contains_gets_the_name_of_the_instance_in_front() -> None:
    made = insert_instance(valid_strategy(), template=trend_template(), name="Trend H1")
    assert (made.instances[0].name, made.instances[0].key) == (
        "Trend H1 EMA 20",
        "trend_h1_ema_20",
    )
    assert (made.rules[0].name, made.rules[0].key) == ("Trend H1 aufwaerts", "trend_h1_aufwaerts")


def test_the_expressions_inside_the_instance_use_the_new_keys() -> None:
    made = insert_instance(valid_strategy(), template=trend_template(), name="Trend H1")
    assert made.rules[0].expression == "trend_h1_ema_20.wert > grenze"  # the parameter stays
    assert made.properties[0].expression == 'IF(trend_h1_aufwaerts.ergebnis; "a"; "b")'
    assert made.properties[1].expression == (
        "trend_h1_ema_20.wert + PREVIOUS(trend_h1_ema_20.wert)"
    )
    # what is evaluated outside of a contained instance (the value of its parameter) uses the
    # keys of the level that contains it
    assert made.instances[0].parameter_values["periode"].value == "grenze"


def test_an_expression_is_rewritten_only_where_it_names_a_contained_object() -> None:
    template = trend_template()
    template.properties[0].expression = '"ema20" & Konto.ema20 & ema2000.wert'
    made = insert_instance(valid_strategy(), template=template, name="T")
    # a text, a part behind a point and a longer name stay
    assert made.properties[0].expression == '"ema20" & Konto.ema20 & ema2000.wert'


def test_the_template_is_not_changed() -> None:
    template = trend_template()
    before = repr(template)
    made = insert_instance(valid_strategy(), template=template, name="X")
    made.instances[0].name = "geaendert"
    assert repr(template) == before


def test_a_name_that_is_taken_gets_a_number() -> None:
    strategy = valid_strategy()
    first = insert_instance(strategy, template=trend_template(), name="Trend H1")
    strategy.elements.append(element(5, catalog.TYPE_TREND, instance=first))
    second = insert_instance(strategy, template=trend_template(), name="Trend H1")
    assert (second.name, second.key) == ("Trend H1 2", "trend_h1_2")
    assert (second.instances[0].name, second.instances[0].key) == (
        "Trend H1 2 EMA 20",
        "trend_h1_2_ema_20",
    )
    # the number goes behind the proposal when the proposal is taken
    strategy.elements.append(element(6, "EMA", instance=ema("Trend H1 2 EMA 20")))
    third = insert_instance(strategy, template=trend_template(), name="Trend H1 2")
    assert third.instances[0].name == "Trend H1 2 EMA 20 2"
    assert third.instances[0].key == "trend_h1_2_ema_20_2"


def test_a_name_counts_as_taken_without_regard_to_case_and_blanks() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("Mein  Wert")))
    made = insert_instance(strategy, object_type="EMA", name=" mein wert")
    assert made.name == " mein wert 2"


def test_the_names_of_the_application_and_the_functions_are_taken() -> None:
    strategy = valid_strategy()
    for wanted, expected in (
        ("Konto", "Konto 2"),
        ("account", "account 2"),
        ("Kerze", "Kerze 2"),
        ("Strategy", "Strategy 2"),
    ):
        assert insert_instance(strategy, object_type="EMA", name=wanted).name == expected
    key = insert_instance(strategy, object_type="EMA", name="IF")
    assert (key.name, key.key) == ("IF", "if_2")  # the key is no name of a function


def test_an_instance_of_an_object_type_has_the_name_of_the_type_in_the_language() -> None:
    german = insert_instance(valid_strategy(), object_type="ZigZag")
    assert (german.name, german.key, german.origin) == ("ZigZag", "zigzag", Origin("ZigZag"))
    candle_de = insert_instance(valid_strategy(), object_type="Kerze")
    assert candle_de.name == "Kerze 2"  # the name of an object of the application
    candle_en = insert_instance(valid_strategy(), object_type="Kerze", language="en")
    assert candle_en.name == "Candle 2"
    indicator = insert_instance(valid_strategy(), object_type=catalog.TYPE_INDICATOR)
    assert indicator.name == "eigener Indikator"
    assert indicator.key == "eigener_indikator"


def test_an_unknown_object_type_or_nothing_is_an_error() -> None:
    with pytest.raises(InsertionError):
        insert_instance(valid_strategy(), object_type="Gibtesnicht")
    with pytest.raises(InsertionError):
        insert_instance(valid_strategy())


def test_insertion_into_a_template_looks_at_the_names_of_that_template() -> None:
    target = Template(
        id=uid(800),
        name="Ziel",
        object_type=catalog.TYPE_INDICATOR,
        parameter_values={"zeiteinheit": fixed("h1")},
        instances=[ema("EMA")],
    )
    made = insert_instance(target, object_type="EMA")
    assert (made.name, made.key) == ("EMA 2", "ema_2")
    target.parameters.append(definition("Fest", DataType.NUMBER))
    taken = insert_instance(target, object_type="EMA", name="Fest")
    assert taken.name == "Fest 2"  # a parameter is a name of the namespace


def test_the_namespace_lists_every_name_and_key() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(6, "Rechnen", "1"))
    strategy.connections = [connect(1, "weiter", 6), connect(6, "weiter", 2)]
    inserted = insert_instance(strategy, template=trend_template(), name="T")
    strategy.elements.append(element(7, catalog.TYPE_TREND, instance=inserted))
    strategy.rules.append(ruleset("werk", [rule("innen", "TRUE()")]))
    strategy.elements[2].rules.append(rule("am_element", "TRUE()"))
    keys = set(namespace_keys(strategy))
    assert {"Rechnen", "t", "t_ema_20", "t_aufwaerts", "werk", "innen", "am_element"} <= keys
    assert "grenze" in keys  # the own parameter of the trend stands without a point
    names = set(namespace_names(strategy))
    assert {"Rechnen", "T", "T EMA 20", "T aufwaerts", "werk", "innen", "am_element"} <= names


def test_two_insertions_of_the_same_template_give_a_strategy_without_a_double_name() -> None:
    strategy = valid_strategy()
    for number, name in ((5, "Trend H1"), (6, "Trend H1")):
        made = insert_instance(strategy, template=trend_template(), name=name)
        made.parameter_values["zeiteinheit"] = fixed("h1")
        strategy.elements.append(element(number, catalog.TYPE_TREND, instance=made))
    use(strategy, "trend_h1", "richtung")
    use(strategy, "trend_h1_2", "richtung")
    codes = [item.code for item in check_strategy(strategy)]
    assert "name.duplicate" not in codes
    assert "expression.invalid" not in codes
