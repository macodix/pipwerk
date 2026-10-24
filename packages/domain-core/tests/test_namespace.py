"""The namespace of a strategy (specification 3.3, 3.6 "Name doppelt vergeben"): one namespace for
all instances (the contained ones too), rules, rulesets, conditions and calculations; a name once,
no name hides another; strategy parameters stand apart; the parameters of a rule and the own
parameters of a template are none of the names of the namespace; inside an instance only the
content, the parameters and the objects of the application are visible.

Each case has a counter sample.
"""

from pipwerk_domain import catalog
from pipwerk_domain.consistency import check_strategy, check_template
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.model import (
    Instance,
    Origin,
    PropertyDefinition,
    Strategy,
    StrategyParameter,
)
from pipwerk_domain.typedesc import DataType
from tests.helpers import (
    calculation,
    check,
    connect,
    definition,
    element,
    ema,
    fixed,
    indicator_instance,
    only,
    rule,
    ruleset,
    template,
    trigger,
    uid,
    use,
    valid_strategy,
)


def trend(
    name: str, key: str, inside: list[Instance], rules: list[Instance] | None = None
) -> Instance:
    return Instance(
        name=name,
        key=key,
        object_type="Trend",
        origin=Origin("Trend"),
        parameter_values={
            "zeiteinheit": fixed("h1"),
            "berechnungsverfahren": fixed("trend_method.expression"),
        },
        properties=[PropertyDefinition("richtung", DataType.TEXT, '"aufwaerts"')],
        instances=inside,
        rules=rules or [],
    )


def with_trend(inside_name: str = "EMA 20", inside_key: str = "ema20") -> Strategy:
    strategy = valid_strategy()
    strategy.elements.append(
        element(5, "Trend", instance=trend("Trend H1", "trend_h1", [ema(inside_name)]))
    )
    strategy.elements[-1].instance.instances[0].key = inside_key  # type: ignore[union-attr]
    use(strategy, "trend_h1", "richtung")
    return strategy


# --- every name is addressable everywhere ----------------------------------------------------


def test_a_contained_instance_is_addressable_everywhere_by_its_own_name() -> None:
    strategy = with_trend()
    strategy.rules.append(rule("aussen", "ema20.wert > 1"))
    strategy.elements.insert(1, calculation(6, "rechnen", "ema20.wert + trend_h1.ema20.wert"))
    strategy.connections = [connect(1, "weiter", 6), connect(6, "weiter", 2)]
    assert check(strategy) == []  # `ema20.wert` and `trend_h1.ema20.wert` are the same value


def test_a_contained_instance_is_found_by_its_name_in_the_display_form() -> None:
    from pipwerk_domain.consistency import check_with_contexts
    from pipwerk_domain.expressions import render

    strategy = with_trend("EMA zwanzig", "ema20")
    checker = check_with_contexts(strategy)
    pointer = "/elements/1/properties/bemerkung/value"
    assert pointer in checker.contexts
    rendering = render(
        "[EMA zwanzig].Wert", checker.contexts[pointer].env, "de", display_input=True
    )
    assert rendering.stored == "ema20.wert"


def test_a_rule_inside_a_ruleset_is_addressable_by_its_own_name() -> None:
    strategy = valid_strategy()
    strategy.rules.append(ruleset("werk", [rule("a", "Konto.kapital > 0")]))
    strategy.rules.append(rule("aussen", "a.ergebnis"))
    assert check(strategy) == []


def test_a_rule_inside_an_instance_is_addressable_by_its_own_name() -> None:
    strategy = valid_strategy()
    strategy.elements.append(
        element(
            5,
            catalog.TYPE_INDICATOR,
            instance=indicator_instance(
                "ind",
                rules=[rule("pruefung", "Konto.kapital > 0")],
                properties=[PropertyDefinition("x", DataType.NUMBER, "1")],
            ),
        )
    )
    use(strategy, "ind", "x")
    strategy.rules.append(rule("aussen", "pruefung.ergebnis"))
    assert check(strategy) == []


def test_the_rules_of_the_elements_are_addressable_from_a_rule_of_the_strategy() -> None:
    strategy = valid_strategy()
    strategy.elements[1].rules.append(rule("nur_hier", "Konto.kapital > 0"))
    strategy.rules.append(rule("aussen", "nur_hier.ergebnis"))
    assert check(strategy) == []


def test_inside_an_instance_only_its_content_its_parameters_and_the_application_are_visible() -> (
    None
):
    strategy = valid_strategy()
    strategy.elements.append(element(6, "EMA", instance=ema("ausserhalb")))
    use(strategy, "ausserhalb")
    inner = Instance(
        name="Pruefung",
        key="pruefung",
        object_type="Regel",
        expression="ausserhalb.wert > 1",  # a name of the strategy: unknown inside
    )
    strategy.elements.append(
        element(
            5,
            catalog.TYPE_INDICATOR,
            instance=indicator_instance(
                "ind", rules=[inner], properties=[PropertyDefinition("x", DataType.NUMBER, "1")]
            ),
        )
    )
    use(strategy, "ind", "x")
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert [item.details["issue"] for item in found] == ["unknown_name"]
    assert [item.subject for item in found] == ["ind.pruefung"]
    # the objects of the application are visible, `Strategie` with the parameters too
    inner.expression = "Konto.kapital > Strategie.p"
    strategy.parameters.append(StrategyParameter("p", DataType.NUMBER, 1))
    assert check(strategy) == []


# --- a name once ----------------------------------------------------------------------------


def duplicates(strategy: Strategy) -> list[tuple[str | None, str | None, str]]:
    return [
        (item.element, item.subject, str(item.details["what"]))
        for item in check_strategy(strategy)
        if item.code == fc.NAME_DUPLICATE
    ]


def test_two_trends_that_contain_an_indicator_of_the_same_name_are_a_duplicate() -> None:
    """In format 1.0 every trend had its own `ema20`; in one namespace the second is a duplicate."""
    strategy = with_trend()
    strategy.elements.append(
        element(6, "Trend", instance=trend("Trend H4", "trend_h4", [ema("EMA 20")]))
    )
    strategy.elements[-1].instance.instances[0].key = "ema20"  # type: ignore[union-attr]
    use(strategy, "trend_h4", "richtung")
    found = duplicates(strategy)
    assert found == [(uid(6), "trend_h4.ema20", "name")]


def test_a_contained_instance_and_an_instance_of_the_strategy_with_one_name_are_a_duplicate() -> (
    None
):
    strategy = with_trend()
    strategy.elements.append(element(7, "EMA", instance=ema("EMA 20")))
    use(strategy, "EMA 20")
    # name EMA 20 twice (the one in the trend first)
    found = duplicates(strategy)
    assert found == [(uid(7), "EMA 20", "name")]


def test_a_rule_in_a_ruleset_and_a_rule_of_the_strategy_with_one_name_are_a_duplicate() -> None:
    strategy = valid_strategy()
    strategy.rules.append(ruleset("werk", [rule("a", "TRUE()")]))
    strategy.rules.append(rule("a", "TRUE()"))
    assert duplicates(strategy) == [(None, "a", "name")]


def test_the_comparison_ignores_upper_and_lower_case_and_blanks_in_names() -> None:
    strategy = valid_strategy()
    strategy.rules += [rule("r", "TRUE()"), rule("R", "TRUE()")]
    assert [item[2] for item in duplicates(strategy)] == ["name"]
    strategy = valid_strategy()
    strategy.rules += [
        Instance(name="Mein  Wert", key="a", object_type="Regel", expression="TRUE()"),
        Instance(name="mein wert", key="b", object_type="Regel", expression="TRUE()"),
    ]
    assert duplicates(strategy) == [(None, "b", "name")]


def test_the_same_key_with_other_names_is_a_duplicate_of_the_key() -> None:
    strategy = valid_strategy()
    strategy.rules += [
        Instance(name="Erste", key="gleich", object_type="Regel", expression="TRUE()"),
        Instance(name="Zweite", key="GLEICH", object_type="Regel", expression="TRUE()"),
    ]
    assert duplicates(strategy) == [(None, "GLEICH", "key")]


def test_a_name_may_not_be_a_name_of_an_object_of_the_application_in_either_language() -> None:
    for name in ("Konto", "account", "KERZE", "Candle"):
        strategy = valid_strategy()
        strategy.rules.append(
            Instance(name=name, key="x" + name.lower(), object_type="Regel", expression="TRUE()")
        )
        found = only(check_strategy(strategy), fc.NAME_DUPLICATE)
        assert found and found[0].details["with_application_object"] is True, name


def test_no_name_hides_another() -> None:
    """The first of two equal names is the one an expression finds; the second is reported."""
    strategy = valid_strategy()
    strategy.rules += [
        rule("r", "Konto.kapital > 0"),
        rule("r2", "r.ergebnis"),
        rule("R", "Konto.kapital > 1"),
    ]
    assert duplicates(strategy) == [(None, "R", "name")]


def test_strategy_parameters_stand_apart() -> None:
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("ema20", DataType.NUMBER, 1)]
    strategy.elements.append(element(5, "EMA", instance=ema("ema20")))
    use(strategy, "ema20")
    assert duplicates(strategy) == []
    strategy.parameters.append(StrategyParameter("EMA20", DataType.NUMBER, 1))
    found = only(check_strategy(strategy), fc.NAME_DUPLICATE)
    assert [item.details["namespace"] for item in found] == ["strategy_parameters"]


# --- parameters --------------------------------------------------------------------------------


def test_the_parameter_of_a_rule_in_a_ruleset_must_be_no_name_of_the_namespace() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("grenze")))
    use(strategy, "grenze")
    inner = rule(
        "eins",
        "schwelle > 1",
        parameters=[definition("schwelle", DataType.NUMBER, required=True, default=1)],
    )
    strategy.rules.append(ruleset("werk", [inner]))
    assert check(strategy) == []
    inner.parameters[0] = definition("grenze", DataType.NUMBER, required=True, default=1)
    inner.expression = "grenze > 1"
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert [(item.subject, item.details["with_parameter"]) for item in found] == [
        ("werk.eins", True)
    ]


def test_the_key_of_a_parameter_counts_as_well() -> None:
    strategy = valid_strategy()
    strategy.rules.append(rule("kurz", "TRUE()"))
    strategy.rules.append(
        rule(
            "r",
            "TRUE()",
            parameters=[definition("Ganz anders", DataType.NUMBER, key="kurz", default=1)],
        )
    )
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert [(item.subject, item.details["what"]) for item in found] == [("r", "key")]


def test_a_parameter_of_a_rule_does_not_collide_with_a_parameter_of_another_rule() -> None:
    strategy = valid_strategy()
    parameters = [definition("grenze", DataType.NUMBER, default=1)]
    strategy.rules += [
        rule("eins", "grenze > 1", parameters=list(parameters)),
        rule("zwei", "grenze > 2", parameters=list(parameters)),
    ]
    assert check(strategy) == []


# --- templates ---------------------------------------------------------------------------------


def test_a_template_has_a_namespace_of_its_own_with_everything_inside_once() -> None:
    value = template(
        catalog.TYPE_INDICATOR,
        instances=[ema("a"), ema("b")],
        rules=[rule("c", "TRUE()")],
    )
    assert check_template(value) == []
    value.rules.append(rule("A", "TRUE()"))  # the name of an instance
    found = only(check_template(value), fc.NAME_DUPLICATE)
    assert [item.subject for item in found] == ["A"]


def test_a_template_reports_a_double_name_deep_inside() -> None:
    inner = indicator_instance("innen", instances=[ema("tief")])
    value = template(catalog.TYPE_INDICATOR, instances=[inner, ema("tief")])
    found = only(check_template(value), fc.NAME_DUPLICATE)
    # the second one in the order of the template is the one deep inside
    assert [item.subject for item in found] == ["innen.tief"]


def test_the_rules_of_a_ruleset_template_are_a_namespace() -> None:
    value = template(
        catalog.TYPE_RULESET,
        rules=[rule("a", "TRUE()"), rule("b", "TRUE()"), rule("A", "TRUE()")],
    )
    found = only(check_template(value), fc.NAME_DUPLICATE)
    assert [item.subject for item in found] == ["A"]
    assert found[0].details["namespace"] == "template"


def test_the_own_parameter_of_a_template_is_no_name_inside_it() -> None:
    value = template(
        catalog.TYPE_INDICATOR,
        parameters=[definition("Periode eigene", DataType.INTEGER, key="meine")],
        instances=[ema("meine")],
    )
    found = only(check_template(value), fc.NAME_DUPLICATE)
    assert [(item.details["with_parameter"], item.details["what"]) for item in found] == [
        (True, "key")
    ]
    value.instances[0].key = "andere"
    value.instances[0].name = "andere"
    assert only(check_template(value), fc.NAME_DUPLICATE) == []


def test_a_calculation_and_a_contained_instance_with_one_name_are_a_duplicate() -> None:
    """A condition and a calculation are in the namespace too."""
    strategy = with_trend()
    strategy.elements.insert(1, calculation(6, "EMA 20", "1"))
    strategy.connections = [connect(1, "weiter", 6), connect(6, "weiter", 2)]
    found = only(check_strategy(strategy), fc.NAME_DUPLICATE)
    # the calculation stands in front of the trend in the list, the instance inside the trend is
    # the second one
    assert [(item.element, item.subject) for item in found] == [(uid(5), "trend_h1.ema20")]


def test_a_trigger_has_no_name_in_the_namespace() -> None:
    strategy = valid_strategy()
    strategy.elements.append(trigger(5, name="ema20"))
    strategy.elements.append(element(6, "EMA", instance=ema("ema20")))
    use(strategy, "ema20")
    strategy.connections.append(connect(5, "weiter", 2))
    assert duplicates(strategy) == []
