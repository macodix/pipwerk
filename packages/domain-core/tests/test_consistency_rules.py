"""Rules, rulesets, indicators and trends in the consistency check: result types, order of
rulesets, Order and Position in indicators, names and namespaces (specification 3.3 to 3.6)."""

from pipwerk_domain import catalog
from pipwerk_domain.consistency import Level, check_template
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.model import (
    Binding,
    Comparison,
    Instance,
    Origin,
    PropertyDefinition,
    StrategyParameter,
)
from pipwerk_domain.typedesc import BindingKind, DataType
from tests.helpers import (
    calculation,
    check,
    codes,
    condition,
    connect,
    definition,
    element,
    ema,
    expr,
    fixed,
    indicator_instance,
    only,
    param,
    place_order,
    rule,
    ruleset,
    template,
    trigger,
    uid,
    use,
    valid_strategy,
)

# Ergebnis einer bestimmenden Regel -------------------------------------------------------


def test_result_of_a_determining_rule_fits_the_property() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        rule("r", "1 + 1", determined_property="volumen", comparison=Comparison.AT_MOST)
    )
    assert check(strategy) == []


def test_result_of_a_determining_rule_does_not_fit_the_property() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        rule("r", "1 > 0", determined_property="volumen", comparison=Comparison.AT_MOST)
    )
    found = only(check(strategy), fc.RULE_RESULT_MISMATCH)
    assert len(found) == 1
    assert found[0].subject == "r"
    assert found[0].element is None
    assert found[0].details["property"] == "volumen"
    assert found[0].details["expected"] == "number"
    assert found[0].details["found"] == "boolean"


def test_result_of_a_determining_rule_with_a_choice() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        rule(
            "r",
            'IF(Konto.kapital > 1; "buy"; "sell")',
            determined_property="richtung",
            comparison=Comparison.EQUAL,
        )
    )
    assert check(strategy) == []
    strategy.rules[0].expression = 'IF(Konto.kapital > 1; "buy"; "hold")'
    found = only(check(strategy), fc.RULE_RESULT_MISMATCH)
    assert found[0].details["reason"] == "choice_value"
    assert found[0].details["values"] == ["hold"]
    strategy.rules[0].expression = "Konto.kapital"
    assert only(check(strategy), fc.RULE_RESULT_MISMATCH)


def test_a_checking_rule_must_give_a_truth_value() -> None:
    strategy = valid_strategy()
    strategy.rules.append(rule("r", "Order.volumen >= 1"))
    assert check(strategy) == []
    strategy.rules[0].expression = "Order.volumen"
    found = only(check(strategy), fc.RULE_RESULT_MISMATCH)
    assert found[0].details["expected"] == "boolean"


def test_determined_property_that_no_order_type_has() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        rule("r", "1", determined_property="gibtsnicht", comparison=Comparison.AT_MOST)
    )
    found = only(check(strategy), fc.RULE_RESULT_MISMATCH)
    assert found[0].details["reason"] == "unknown_property"


def test_a_determining_rule_needs_a_comparison() -> None:
    strategy = valid_strategy()
    strategy.rules.append(rule("r", "1", determined_property="volumen"))
    assert only(check(strategy), fc.RULE_COMPARISON_MISSING)
    strategy.rules[0].comparison = Comparison.AT_LEAST
    assert only(check(strategy), fc.RULE_COMPARISON_MISSING) == []


def test_the_result_type_of_a_rule_is_the_type_of_its_property() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        rule("a", "1", determined_property="volumen", comparison=Comparison.AT_MOST)
    )
    strategy.rules.append(rule("b", "a.ergebnis + 1"))  # a number, not a truth value
    found = check(strategy)
    assert only(found, fc.RULE_RESULT_MISMATCH)  # b must give a truth value
    assert only(found, fc.EXPRESSION_INVALID) == []
    strategy.rules[1].expression = "a.ergebnis > 1"
    assert check(strategy) == []
    strategy.rules[1].expression = "NOT(a.ergebnis)"
    assert only(check(strategy), fc.EXPRESSION_INVALID)


def test_a_faulty_expression_of_a_rule_is_found_with_the_rule() -> None:
    strategy = valid_strategy()
    strategy.rules.append(rule("r", "Order.volumen >"))
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert found[0].subject == "r"
    assert found[0].details["field"] == "expression"
    assert found[0].details["issue"] == "syntax"


def test_a_rule_without_an_expression_is_a_statement_without_a_value() -> None:
    strategy = valid_strategy()
    strategy.rules.append(Instance(name="r", object_type="Regel", origin=Origin("Regel")))
    found = only(check(strategy), fc.EXPRESSION_EMPTY)
    assert (found[0].subject, found[0].details["reason"]) == ("r", "missing")
    assert only(check(strategy), fc.EXPRESSION_INVALID) == []


def test_rule_parameters_are_values_in_the_expression() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        rule(
            "r",
            "Order.volumen <= grenze",
            parameters=[definition("grenze", DataType.NUMBER, required=True)],
            parameter_values={"grenze": fixed(5)},
        )
    )
    assert check(strategy) == []
    del strategy.rules[0].parameter_values["grenze"]
    found = only(check(strategy), fc.PARAMETER_MISSING)
    assert found[0].subject == "r"
    assert found[0].details["parameter"] == "grenze"


def test_rule_parameter_with_a_default_needs_no_value() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        rule(
            "r",
            "Order.volumen <= grenze",
            parameters=[definition("grenze", DataType.NUMBER, required=True, default=5)],
        )
    )
    assert check(strategy) == []


def test_the_value_of_a_rule_parameter_can_come_from_a_strategy_parameter() -> None:
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("limit", DataType.NUMBER, 5)]
    strategy.rules.append(
        rule(
            "r",
            "Order.volumen <= grenze",
            parameters=[definition("grenze", DataType.NUMBER, required=True)],
            parameter_values={"grenze": param("limit")},
        )
    )
    assert check(strategy) == []
    strategy.parameters[0].datatype = DataType.TEXT
    strategy.parameters[0].value = "x"
    assert only(check(strategy), fc.PARAMETER_BINDING_INVALID)


# Regelwerk: Vorwärts- und Zirkelbezug ----------------------------------------------------------


def test_ruleset_with_a_reference_to_an_earlier_rule_is_valid() -> None:
    strategy = valid_strategy()
    strategy.rules.append(ruleset("werk", [rule("a", "1 > 0"), rule("b", "a.ergebnis")]))
    assert check(strategy) == []


def test_ruleset_with_a_forward_reference() -> None:
    strategy = valid_strategy()
    strategy.rules.append(ruleset("werk", [rule("a", "b.ergebnis"), rule("b", "1 > 0")]))
    found = only(check(strategy), fc.RULESET_REFERENCE_ORDER)
    assert len(found) == 1
    assert found[0].details["kind"] == "forward"
    assert found[0].details["rule"] == "a"
    assert found[0].details["refers_to"] == "b"
    assert found[0].subject == "werk.a"


def test_ruleset_with_a_circular_reference() -> None:
    strategy = valid_strategy()
    strategy.rules.append(ruleset("werk", [rule("a", "b.ergebnis"), rule("b", "a.ergebnis")]))
    found = only(check(strategy), fc.RULESET_REFERENCE_ORDER)
    assert len(found) == 1
    assert found[0].details["kind"] == "cycle"
    assert found[0].details["rules"] == ["a", "b"]


def test_ruleset_with_a_circular_reference_over_several_rules() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        ruleset(
            "werk",
            [rule("a", "c.ergebnis"), rule("b", "a.ergebnis"), rule("c", "b.ergebnis")],
        )
    )
    found = only(check(strategy), fc.RULESET_REFERENCE_ORDER)
    assert [item.details["kind"] for item in found] == ["cycle"]
    assert found[0].details["rules"] == ["a", "b", "c"]


def test_ruleset_with_a_rule_that_uses_itself() -> None:
    strategy = valid_strategy()
    strategy.rules.append(ruleset("werk", [rule("a", "a.ergebnis")]))
    found = only(check(strategy), fc.RULESET_REFERENCE_ORDER)
    assert found[0].details["kind"] == "cycle"


def test_forward_reference_in_a_template_of_a_ruleset() -> None:
    value = template(
        catalog.TYPE_RULESET, rules=[rule("a", "b.ergebnis"), rule("b", "Konto.kapital > 0")]
    )
    found = only(check_template(value), fc.RULESET_REFERENCE_ORDER)
    assert found[0].details["kind"] == "forward"
    value.rules.reverse()
    assert check_template(value) == []


def test_circular_reference_between_rules_of_the_strategy() -> None:
    strategy = valid_strategy()
    strategy.rules += [rule("a", "b.ergebnis"), rule("b", "a.ergebnis")]
    found = only(check(strategy), fc.RULESET_REFERENCE_ORDER)
    assert [item.details["kind"] for item in found] == ["cycle"]


def test_a_later_rule_of_a_plain_list_may_be_used() -> None:
    """Only a ruleset has to be in the order of its evaluation (req-fach-045)."""
    strategy = valid_strategy()
    strategy.rules += [rule("a", "b.ergebnis"), rule("b", "Konto.kapital > 0")]
    assert only(check(strategy), fc.RULESET_REFERENCE_ORDER) == []


def test_the_result_of_a_ruleset_and_its_rules_can_be_addressed() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        ruleset(
            "werk",
            [rule("a", "Konto.kapital > 0"), rule("b", "Konto.kapital > 1")],
            result_expression="AND(a.ergebnis; b.ergebnis)",
        )
    )
    strategy.rules.append(rule("aussen", "werk.ergebnis"))
    strategy.rules.append(rule("tief", "werk.a.ergebnis"))
    assert check(strategy) == []
    # the rule inside a ruleset is addressable everywhere in the strategy by its own name
    strategy.rules.append(rule("von_aussen", "a.ergebnis"))
    assert check(strategy) == []
    # which is why its name may be taken once only
    strategy.rules.append(rule("a", "TRUE()"))
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert [(item.subject, item.details["namespace"]) for item in found] == [("a", "strategy")]


def test_result_expression_of_a_ruleset_is_checked_in_the_namespace_of_its_rules() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        ruleset("werk", [rule("a", "Konto.kapital > 0")], result_expression="AND(a.ergebnis; x)")
    )
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert found[0].details["field"] == "result_expression"
    assert found[0].details["issue"] == "unknown_name"


# Order und Position in Indikator oder Trend -----------------------------------------------------


def indicator_with(rules: list[Instance], **kwargs: object) -> object:
    return template(catalog.TYPE_INDICATOR, rules=rules, **kwargs)


def test_rule_with_order_in_an_indicator_is_an_error() -> None:
    value = template(catalog.TYPE_INDICATOR, rules=[rule("r", "Order.volumen > 0")])
    found = only(check_template(value), fc.RULE_ORDER_IN_INDICATOR)
    assert len(found) == 1
    assert found[0].subject == "r"
    assert found[0].level is Level.ERROR


def test_rule_with_position_in_a_trend_is_an_error() -> None:
    value = template(catalog.TYPE_TREND, rules=[rule("r", "Position.volumen > 0")])
    assert only(check_template(value), fc.RULE_ORDER_IN_INDICATOR)


def test_the_rule_in_an_indicator_is_an_error_even_if_no_expression_uses_it() -> None:
    value = template(
        catalog.TYPE_INDICATOR,
        rules=[rule("r", "Order.volumen > 0")],
        properties=[PropertyDefinition("x", DataType.NUMBER, "1")],
    )
    assert only(check_template(value), fc.RULE_ORDER_IN_INDICATOR)


def test_rule_with_order_through_the_result_of_another_rule() -> None:
    value = template(
        catalog.TYPE_INDICATOR,
        rules=[rule("a", "Order.volumen > 0"), rule("b", "NOT(a.ergebnis)")],
    )
    found = only(check_template(value), fc.RULE_ORDER_IN_INDICATOR)
    assert sorted(item.subject or "" for item in found) == ["a", "b"]


def test_rule_with_order_in_a_ruleset_in_an_indicator() -> None:
    value = template(
        catalog.TYPE_INDICATOR,
        rules=[ruleset("werk", [rule("r", "Order.volumen > 0")])],
    )
    found = only(check_template(value), fc.RULE_ORDER_IN_INDICATOR)
    assert [item.subject for item in found] == ["werk.r"]


def test_rule_with_order_in_an_indicator_inside_an_indicator() -> None:
    inner = indicator_instance("innen", rules=[rule("r", "Order.volumen > 0")])
    value = template(catalog.TYPE_INDICATOR, instances=[inner])
    found = only(check_template(value), fc.RULE_ORDER_IN_INDICATOR)
    assert [item.subject for item in found] == ["innen.r"]


def test_rule_without_order_in_an_indicator_is_valid() -> None:
    value = template(catalog.TYPE_INDICATOR, rules=[rule("r", "Konto.kapital > 0")])
    assert check_template(value) == []


def test_the_same_rule_in_the_strategy_is_valid() -> None:
    strategy = valid_strategy()
    strategy.rules.append(rule("r", "Order.volumen > 0"))
    assert check(strategy) == []


def test_the_instance_of_an_indicator_with_such_a_rule_is_an_error_in_the_strategy() -> None:
    strategy = valid_strategy()
    strategy.elements.append(
        element(
            5,
            "Indikator",
            instance=indicator_instance("ind", rules=[rule("r", "Position.volumen > 0")]),
        )
    )
    found = only(check(strategy), fc.RULE_ORDER_IN_INDICATOR)
    assert [(item.element, item.subject) for item in found] == [(uid(5), "ind.r")]


def test_a_trend_instance_with_such_a_rule_in_a_management_is_an_error_too() -> None:
    strategy = valid_strategy()
    strategy.elements.append(trigger(3, management_of=uid(2)))
    strategy.elements.append(
        element(
            5,
            "Trend",
            management_of=uid(2),
            instance=Instance(
                name="tr",
                object_type="Trend",
                origin=Origin("Trend"),
                parameter_values={
                    "zeiteinheit": fixed("h1"),
                    "berechnungsverfahren": fixed("trend_method.expression"),
                },
                rules=[rule("r", "Order.volumen > 0")],
            ),
        )
    )
    strategy.connections.append(connect(3, "weiter", 2))
    assert only(check(strategy), fc.RULE_ORDER_IN_INDICATOR)


def test_expression_in_an_indicator_with_order_is_an_error() -> None:
    value = template(
        catalog.TYPE_INDICATOR,
        properties=[PropertyDefinition("x", DataType.NUMBER, "Order.volumen")],
    )
    found = only(check_template(value), fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT)
    assert found[0].details["context"] == "indicator"


# Hinweise S18, S27: Regeln im eigenen Zusammenhang --------------------------------------------


def test_s27_templates_of_a_rule_and_a_ruleset_may_address_order_and_position() -> None:
    value = template(
        catalog.TYPE_RULE,
        expression="Order.volumen > 0",
    )
    assert check_template(value) == []
    value = template(catalog.TYPE_RULE, expression="NOT(ISNA(Position.volumen))")
    assert check_template(value) == []
    value = template(
        catalog.TYPE_RULESET,
        rules=[rule("r", "Order.volumen > 0"), rule("s", "Position.volumen > 0")],
    )
    assert check_template(value) == []


def test_s27_a_rule_template_sees_the_properties_of_all_order_types() -> None:
    assert check_template(template(catalog.TYPE_RULE, expression="Order.limitpreis > 0")) == []
    found = check_template(template(catalog.TYPE_RULE, expression="Order.gibtsnicht > 0"))
    assert only(found, fc.EXPRESSION_INVALID)


def test_s18_a_rule_is_checked_in_its_own_context_not_in_that_of_the_management() -> None:
    """The rule uses ``Order.limitpreis``, which the market order of the management does
    not have: no finding, the value is "not available" at the execution."""
    strategy = valid_strategy()
    strategy.rules.append(rule("r", "IFNA(Order.limitpreis; 0) >= 0"))
    strategy.elements += [
        trigger(3, management_of=uid(2)),
        condition(4, "r.ergebnis", management_of=uid(2)),
    ]
    strategy.connections.append(connect(3, "weiter", 4))
    assert check(strategy) == []


def test_s18_a_rule_is_not_checked_again_against_the_order_type_of_the_management() -> None:
    strategy = valid_strategy()
    strategy.rules.append(rule("r", "Order.limitpreis > 0"))
    strategy.elements += [
        trigger(3, management_of=uid(2)),
        condition(4, "NOT(r.ergebnis)", management_of=uid(2)),
    ]
    strategy.connections.append(connect(3, "weiter", 4))
    assert check(strategy) == []
    # the expression of the management itself is checked against the order type
    strategy.elements[3].parameters["ausdruck"] = expr("Order.limitpreis > 0")
    assert only(check(strategy), fc.EXPRESSION_INVALID)


def test_s18_a_rule_of_the_element_is_checked_against_all_order_types_too() -> None:
    strategy = valid_strategy()
    strategy.elements[1].rules.append(rule("r", "Order.limitpreis > 0"))
    assert check(strategy) == []


# Namensräume (Hinweis S17) --------------------------------------------------------------------


def test_the_parameter_of_a_rule_must_not_take_a_name_of_the_namespace() -> None:
    """Parameters of a rule stand without a point, so their name must be no name of the
    namespace of the strategy (specification 3.3)."""
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("grenze")))  # strategy level
    use(strategy, "grenze")
    strategy.rules += [
        rule("andere", "TRUE()"),
        rule(
            "r",
            "schwelle > 1",
            parameters=[definition("schwelle", DataType.NUMBER, required=True, default=1)],
        ),
    ]
    assert check(strategy) == []
    # a parameter named like an instance of the strategy
    strategy.rules[1].parameters[0] = definition("grenze", DataType.NUMBER, default=1)
    strategy.rules[1].expression = "grenze > 1"
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert [(item.subject, item.details["with_parameter"]) for item in found] == [("r", True)]
    assert found[0].details["what"] == "name"
    # and named like a rule of the same list
    strategy.rules[1].parameters[0] = definition("andere", DataType.NUMBER, default=1)
    strategy.rules[1].expression = "andere > 1"
    assert [item.subject for item in only(check(strategy), fc.NAME_DUPLICATE)] == ["r"]


def test_the_parameter_of_an_own_indicator_must_not_take_a_name_of_the_namespace() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("grenze")))
    use(strategy, "grenze")
    strategy.elements.append(
        element(
            6,
            catalog.TYPE_INDICATOR,
            instance=indicator_instance(
                "eigener", parameters=[definition("Grenze", required=True)]
            ),
        )
    )
    use(strategy, "eigener", "x")
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert [(item.subject, item.details["with_parameter"]) for item in found] == [("eigener", True)]


def test_a_name_that_a_rule_of_an_element_takes_twice_with_an_instance_is_a_duplicate() -> None:
    """Instances and rules of the strategy and of its elements are one namespace: an instance
    "a" and a rule "a" of an element are the same name twice, no rule hides an instance."""
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("a")))
    use(strategy, "a")
    strategy.elements[1].rules += [
        rule("a", "Konto.kapital > 0"),
        rule("b", "NOT(a.ergebnis)"),
    ]
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert [(item.element, item.subject) for item in found] == [(uid(2), "a")]
    strategy.elements[1].rules[0].name = "c"
    strategy.elements[1].rules[0].key = "c"
    strategy.elements[1].rules[1].expression = "NOT(c.ergebnis)"
    assert check(strategy) == []


def test_a_rule_of_the_element_and_a_rule_of_the_strategy_with_one_name_are_a_duplicate() -> None:
    strategy = valid_strategy()
    strategy.rules.append(
        rule("risiko", "1", determined_property="volumen", comparison=Comparison.AT_MOST)
    )
    strategy.elements[1].rules += [
        rule("risiko", "Konto.kapital > 0"),
        rule("pruefung", "NOT(risiko.ergebnis)"),
    ]
    found = check(strategy)
    assert [(item.element, item.subject) for item in only(found, fc.NAME_DUPLICATE)] == [
        (uid(2), "risiko")
    ]


def test_a_rule_of_the_strategy_sees_the_rules_of_an_element() -> None:
    strategy = valid_strategy()
    strategy.elements[1].rules.append(rule("nur_element", "Konto.kapital > 0"))
    strategy.rules.append(rule("aussen", "nur_element.ergebnis"))
    assert check(strategy) == []


def test_a_rule_of_an_element_sees_the_names_of_the_strategy() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("ema20")))
    strategy.rules.append(rule("r", "Konto.kapital > 0"))
    strategy.elements[1].rules.append(rule("e", "AND(r.ergebnis; ema20.wert > 1)"))
    assert check(strategy) == []


def test_the_rules_of_a_rule_template_see_only_their_parameters_and_the_application() -> None:
    value = template(
        catalog.TYPE_RULE,
        expression="Konto.kapital > grenze",
        parameters=[definition("grenze", DataType.NUMBER, required=True, default=1)],
    )
    assert check_template(value) == []


def test_a_rule_template_with_an_unknown_name_gets_a_hint_not_an_error() -> None:
    value = template(catalog.TYPE_RULE, expression="ema20.wert > 1")
    found = check_template(value)
    assert codes(found) == [fc.RULE_UNRESOLVED_NAME]
    assert found[0].level is Level.HINT
    assert found[0].details["name"] == "ema20"
    assert (found[0].details["start"], found[0].details["end"]) == (0, 5)


def test_a_rule_template_with_an_unknown_strategy_parameter_gets_a_hint() -> None:
    value = template(catalog.TYPE_RULE, expression="Strategie.stop_puffer > 1")
    found = check_template(value)
    assert codes(found) == [fc.RULE_UNRESOLVED_NAME]
    assert found[0].level is Level.HINT
    assert found[0].details["name"] == "Strategie.stop_puffer"


def test_the_name_of_the_rule_template_is_checked_in_each_strategy() -> None:
    strategy = valid_strategy()
    strategy.rules.append(rule("r", "ema20.wert > 1"))  # the same expression in a strategy
    assert only(check(strategy), fc.EXPRESSION_INVALID)
    strategy.elements.append(element(5, "EMA", instance=ema("ema20")))
    use(strategy, "ema20")
    assert check(strategy) == []
    strategy.rules[0].expression = "Strategie.stop_puffer > 1"
    assert only(check(strategy), fc.EXPRESSION_INVALID)
    strategy.parameters.append(StrategyParameter("stop_puffer", DataType.NUMBER, 3))
    assert check(strategy) == []


def test_other_errors_of_a_rule_template_stay_errors() -> None:
    found = check_template(template(catalog.TYPE_RULE, expression="1 +"))
    assert codes(found) == [fc.EXPRESSION_INVALID]
    found = check_template(template(catalog.TYPE_RULE, expression="Konto.gibtsnicht > 1"))
    assert codes(found) == [fc.EXPRESSION_INVALID]
    found = check_template(template(catalog.TYPE_RULE, expression="FOO(1) > 1"))
    assert codes(found) == [fc.EXPRESSION_INVALID]


def test_a_rule_in_an_indicator_sees_its_parameters_instances_and_rules_not_the_strategy() -> None:
    inner = ema("ema20")
    value = template(
        catalog.TYPE_INDICATOR,
        parameters=[definition("faktor", DataType.NUMBER, required=True, default=2)],
        instances=[inner],
        rules=[rule("a", "ema20.wert * faktor > 0"), rule("b", "NOT(a.ergebnis)")],
    )
    assert check_template(value) == []
    value.rules.append(rule("c", "Strategie.irgendwas > 0"))
    # checked by itself the template does not know the strategy parameters: a hint
    found = check_template(value)
    assert codes(found) == [fc.RULE_UNRESOLVED_NAME]
    assert found[0].level is Level.HINT


def test_the_names_of_the_strategy_are_not_visible_in_an_indicator_instance() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("ema20")))
    strategy.elements.append(
        element(
            6,
            "Indikator",
            instance=indicator_instance("ind", rules=[rule("r", "ema20.wert > 0")]),
        )
    )
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert [(item.element, item.subject) for item in found] == [(uid(6), "ind.r")]
    assert found[0].details["issue"] == "unknown_name"


def test_the_rules_of_a_ruleset_do_not_see_the_names_of_the_strategy() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("ema20")))
    strategy.rules.append(ruleset("werk", [rule("r", "ema20.wert > 0")]))
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert found[0].subject == "werk.r"
    value = template(catalog.TYPE_RULESET, rules=[rule("r", "ema20.wert > 0")])
    assert only(check_template(value), fc.EXPRESSION_INVALID)


def test_a_property_of_an_indicator_sees_its_own_names() -> None:
    value = template(
        catalog.TYPE_INDICATOR,
        parameters=[definition("faktor", DataType.NUMBER, required=True, default=2)],
        instances=[ema("ema20")],
        rules=[rule("a", "Konto.kapital > 0")],
        properties=[
            PropertyDefinition("skaliert", DataType.NUMBER, "ema20.wert * faktor"),
            PropertyDefinition("ok", DataType.BOOLEAN, "a.ergebnis"),
        ],
    )
    assert check_template(value) == []
    value.properties.append(PropertyDefinition("falsch", DataType.NUMBER, "a.ergebnis"))
    found = only(check_template(value), fc.EXPRESSION_INVALID)
    assert found[0].details["field"] == "property_definition:falsch"


def test_two_names_of_the_same_level_are_a_duplicate() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "wert", "1"))
    strategy.elements.insert(2, calculation(6, "WERT", "2"))
    strategy.connections = [
        connect(1, "weiter", 5),
        connect(5, "weiter", 6),
        connect(6, "weiter", 2),
    ]
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert [(item.element, item.details["name"]) for item in found] == [(uid(6), "WERT")]
    assert found[0].details["namespace"] == "strategy"


def test_instances_conditions_calculations_and_rules_share_the_namespace_of_the_strategy() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("name")))
    strategy.elements.insert(1, condition(6, "TRUE()", name="name"))
    strategy.connections = [connect(1, "weiter", 6), connect(6, "wahr", 2)]
    strategy.rules.append(rule("name", "TRUE()"))
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert len(found) == 2


def test_the_same_name_at_different_elements_is_a_duplicate() -> None:
    """The names of the rules of the strategy and of all its elements are one namespace."""
    strategy = valid_strategy()
    strategy.rules.append(rule("r", "TRUE()"))
    strategy.elements[1].rules.append(rule("r", "TRUE()"))
    strategy.elements.append(trigger(5))
    strategy.connections.append(connect(5, "weiter", 2))
    other = place_order(6)
    other.rules.append(rule("r", "TRUE()"))
    strategy.elements.append(other)
    strategy.connections.append(connect(1, "weiter", 6))
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert [item.element for item in found] == [uid(2), uid(6)]


def test_the_same_template_at_the_strategy_and_at_an_element_gives_two_instances() -> None:
    """Two instances, two names (specification 3.3): no finding."""
    from pipwerk_domain.risk_rule import risk_per_trade_instance

    strategy = valid_strategy()
    strategy.rules.append(risk_per_trade_instance("risiko"))
    strategy.elements[1].rules.append(risk_per_trade_instance("risiko_element"))
    del strategy.elements[1].properties["volumen"]
    assert check(strategy) == []


def test_duplicates_in_a_list_of_rules_of_an_element() -> None:
    strategy = valid_strategy()
    strategy.elements[1].rules += [rule("r", "TRUE()"), rule("R", "TRUE()")]
    found = only(check(strategy), fc.NAME_DUPLICATE)
    assert [(item.element, item.details["namespace"]) for item in found] == [(uid(2), "strategy")]


def test_a_strategy_parameter_does_not_collide_with_an_instance_of_the_same_name() -> None:
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("ema20", DataType.NUMBER, 1)]
    strategy.elements.append(element(5, "EMA", instance=ema("ema20")))
    use(strategy, "ema20")
    assert check(strategy) == []  # `Strategie.ema20` and `ema20` are different names
    strategy.parameters.append(StrategyParameter("EMA20", DataType.NUMBER, 1))
    assert only(check(strategy), fc.NAME_DUPLICATE)


def test_duplicates_in_a_template() -> None:
    value = template(
        catalog.TYPE_INDICATOR,
        parameters=[definition("a"), definition("A")],
        instances=[ema("b"), ema("B")],
        rules=[rule("b", "TRUE()")],
    )
    found = only(check_template(value), fc.NAME_DUPLICATE)
    assert len(found) == 3


def test_duplicate_rule_parameters_and_names_in_a_ruleset() -> None:
    value = template(catalog.TYPE_RULESET, rules=[rule("a", "TRUE()"), rule("A", "TRUE()")])
    assert only(check_template(value), fc.NAME_DUPLICATE)
    single = template(
        catalog.TYPE_RULE,
        expression="TRUE()",
        parameters=[definition("p"), definition("P")],
    )
    assert only(check_template(single), fc.NAME_DUPLICATE)


# Instanzen in Vorlagen: Parameterbindungen ----------------------------------------------------


def test_the_time_unit_of_a_trend_goes_to_its_indicators() -> None:
    """A parameter of the template for the instances in it (req-fach-011)."""
    inner = Instance(
        name="ema20",
        object_type="EMA",
        origin=Origin("EMA"),
        parameter_values={"zeiteinheit": param("zeiteinheit"), "periode": fixed(20)},
    )
    value = template(
        catalog.TYPE_TREND,
        parameter_values={
            "zeiteinheit": fixed("h1"),
            "berechnungsverfahren": fixed("trend_method.expression"),
        },
        instances=[inner],
        properties=[PropertyDefinition("richtung", DataType.TEXT, '"aufwaerts"')],
    )
    assert check_template(value) == []
    inner.parameter_values["zeiteinheit"] = param("gibtsnicht")
    assert only(check_template(value), fc.PARAMETER_BINDING_INVALID)


def test_instances_in_an_indicator_can_be_addressed_in_several_steps() -> None:
    strategy = valid_strategy()
    strategy.elements.append(
        element(
            5,
            "Trend",
            instance=Instance(
                name="trend_h1",
                object_type="Trend",
                origin=Origin("Trend"),
                parameter_values={
                    "zeiteinheit": fixed("h1"),
                    "berechnungsverfahren": fixed("trend_method.expression"),
                },
                instances=[
                    Instance(
                        name="ema20",
                        object_type="EMA",
                        origin=Origin("EMA"),
                        parameter_values={
                            "zeiteinheit": param("zeiteinheit"),
                            "periode": fixed(20),
                        },
                    )
                ],
                properties=[PropertyDefinition("richtung", DataType.TEXT, '"aufwaerts"')],
            ),
        )
    )
    strategy.elements.insert(1, condition(6, "trend_h1.ema20.wert > 1"))
    strategy.connections = [connect(1, "weiter", 6), connect(6, "wahr", 2)]
    assert check(strategy) == []
    strategy.elements[1].parameters["ausdruck"] = expr("trend_h1.ema20.gibtsnicht > 1")
    assert only(check(strategy), fc.EXPRESSION_INVALID)
    strategy.elements[1].parameters["ausdruck"] = expr('trend_h1.richtung = "aufwaerts"')
    assert check(strategy) == []


def test_calculation_name_gives_the_result_with_the_type_of_the_expression() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "wert", "1 + 1"))
    strategy.elements.insert(2, condition(6, "wert.ergebnis > 1"))
    strategy.elements.insert(3, condition(7, "NOT(wert.ergebnis)"))
    strategy.connections = [
        connect(1, "weiter", 5),
        connect(5, "weiter", 6),
        connect(6, "wahr", 7),
        connect(7, "wahr", 2),
    ]
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert [item.element for item in found] == [uid(7)]
    assert found[0].details["issue"] == "type_mismatch"


def test_condition_name_gives_a_truth_value() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, condition(5, "TRUE()", name="gut"))
    strategy.elements.insert(2, condition(6, "gut.ergebnis"))
    strategy.connections = [
        connect(1, "weiter", 5),
        connect(5, "wahr", 6),
        connect(6, "wahr", 2),
    ]
    assert check(strategy) == []


# Typen von Regeln und Vorlagen --------------------------------------------------------------------


def test_unknown_types_in_templates_and_rule_lists() -> None:
    found = check_template(template("Fremd"))
    assert codes(found) == [fc.TYPE_UNKNOWN]
    assert found[0].details == {"kind": "object", "type": "Fremd"}
    strategy = valid_strategy()
    strategy.rules.append(Instance(name="x", object_type="Fremd", origin=Origin("Fremd")))
    assert only(check(strategy), fc.TYPE_UNKNOWN)


def test_a_rule_list_takes_only_rules_and_an_instance_list_no_rules() -> None:
    strategy = valid_strategy()
    strategy.rules.append(ema("kein_regel"))
    found = only(check(strategy), fc.RULE_INVALID_TYPE)
    assert found[0].details["reason"] == "in_rules"
    value = template(
        catalog.TYPE_INDICATOR,
        instances=[
            Instance(name="r", object_type="Regel", origin=Origin("Regel"), expression="TRUE()")
        ],
    )
    found = only(check_template(value), fc.RULE_INVALID_TYPE)
    assert found[0].details["reason"] == "in_instances"


def test_unknown_object_type_of_a_contained_instance() -> None:
    value = template(
        catalog.TYPE_INDICATOR,
        instances=[Instance(name="x", object_type="Fremd", origin=Origin("Fremd"))],
    )
    found = only(check_template(value), fc.TYPE_UNKNOWN)
    assert found[0].subject == "x"


def test_template_of_a_delivered_indicator_checks_the_default_values() -> None:
    value = template(
        "EMA",
        parameter_values={
            "zeiteinheit": fixed("h1"),
            "periode": fixed(20),
        },
    )
    assert check_template(value) == []
    value.parameter_values["periode"] = Binding(BindingKind.FIXED, "zwanzig")
    assert only(check_template(value), fc.PARAMETER_BINDING_INVALID)
    del value.parameter_values["periode"]
    assert only(check_template(value), fc.PARAMETER_MISSING)


def test_template_of_a_custom_indicator_with_a_property() -> None:
    value = template(
        catalog.TYPE_INDICATOR,
        parameters=[definition("faktor", DataType.NUMBER, required=True)],
        properties=[PropertyDefinition("x", DataType.NUMBER, "faktor * 2")],
    )
    found = only(check_template(value), fc.PARAMETER_MISSING)
    assert found[0].details["parameter"] == "faktor"
    value.parameter_values["faktor"] = fixed(3)
    assert check_template(value) == []
    value.properties[0].expression = "faktor +"
    assert only(check_template(value), fc.EXPRESSION_INVALID)
