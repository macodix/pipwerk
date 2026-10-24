"""Findings of the consistency check about the flow, parameters and types (specification 3.6),
each with a counter sample."""

from pipwerk_domain import catalog
from pipwerk_domain.consistency import Finding, Level
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.model import (
    Binding,
    Connection,
    Element,
    Instance,
    Origin,
    Strategy,
    StrategyParameter,
)
from pipwerk_domain.typedesc import BindingKind, DataType
from tests.helpers import (
    application,
    calculation,
    check,
    codes,
    condition,
    connect,
    element,
    ema,
    expr,
    fixed,
    only,
    param,
    place_order,
    trigger,
    uid,
    use,
    valid_strategy,
)


def strategy_with(
    *elements: Element, connections: list[Connection] | None = None, **kwargs: object
) -> Strategy:
    return Strategy(
        id=uid(900),
        name="Test",
        elements=list(elements),
        connections=connections or [],
        **kwargs,  # type: ignore[arg-type]
    )


def managed(order_number: int = 2) -> list[Element]:
    """A management of the order: a trigger and a condition, not yet connected."""
    return [
        trigger(3, management_of=uid(order_number)),
        condition(4, 'Order.status = "wartend"', management_of=uid(order_number)),
    ]


def with_management(**kwargs: object) -> Strategy:
    base = valid_strategy()
    base.elements.extend(managed())
    base.connections.append(connect(3, "weiter", 4))
    for key, value in kwargs.items():
        setattr(base, key, value)
    return base


# the smallest valid strategy ---------------------------------------------------------


def test_the_smallest_strategy_has_no_findings() -> None:
    assert check(valid_strategy()) == []


def test_strategy_with_a_management_has_no_findings() -> None:
    assert check(with_management()) == []


def test_findings_have_level_code_element_subject_and_details() -> None:
    finding = Finding(Level.ERROR, "a.b", "e", "s", {"k": 1})
    assert finding.to_dict() == {
        "level": "error",
        "code": "a.b",
        "element": "e",
        "subject": "s",
        "details": {"k": 1},
    }


# Hauptablauf ohne Auslöser (Hinweis, Spezifikation 3.6, req-fach-015) ------------------------


def test_an_empty_strategy_has_the_hint_main_flow_without_trigger_only() -> None:
    found = check(strategy_with())
    assert [(item.code, item.level) for item in found] == [
        (fc.FLOW_MAIN_WITHOUT_TRIGGER, Level.HINT)
    ]
    assert found[0].element is None


def test_a_strategy_without_trigger_has_the_hint_and_the_elements_are_not_reached() -> None:
    strategy = strategy_with(place_order(2))
    found = codes(check(strategy))
    assert "strategy.no_trigger" not in found
    # no trigger reaches the order; the hint "no order reachable" is not said on top
    assert found == [fc.FLOW_NOT_REACHED, fc.FLOW_MAIN_WITHOUT_TRIGGER]


def test_the_finding_strategy_no_trigger_does_not_exist() -> None:
    assert not hasattr(fc, "STRATEGY_NO_TRIGGER")


def test_a_trigger_of_a_management_does_not_start_the_main_flow() -> None:
    strategy = with_management()
    strategy.elements.remove(strategy.elements[0])
    strategy.connections.pop(0)
    found = check(strategy)
    assert [item.code for item in found if item.level is Level.HINT] == [
        fc.FLOW_MAIN_WITHOUT_TRIGGER
    ]
    assert only(found, fc.FLOW_NO_ORDER_REACHABLE) == []  # said by the other hint already
    assert only(found, fc.FLOW_NOT_REACHED)[0].element == uid(2)


# Auslöser ohne Verbindung --------------------------------------------------------------


def test_trigger_without_connection() -> None:
    strategy = valid_strategy()
    strategy.connections.clear()
    found = only(check(strategy), fc.TRIGGER_UNCONNECTED)
    assert [item.element for item in found] == [uid(1)]


def test_trigger_of_a_management_without_connection() -> None:
    strategy = with_management()
    strategy.connections.pop()
    found = only(check(strategy), fc.TRIGGER_UNCONNECTED)
    assert [item.element for item in found] == [uid(3)]


def test_connected_trigger_has_no_finding() -> None:
    assert only(check(valid_strategy()), fc.TRIGGER_UNCONNECTED) == []


# Element, das kein Auslöser erreicht --------------------------------------------------


def test_element_without_incoming_connection() -> None:
    strategy = valid_strategy()
    strategy.elements.append(condition(5, "TRUE()"))
    found = only(check(strategy), fc.FLOW_NOT_REACHED)
    assert [item.element for item in found] == [uid(5)]
    assert found[0].level is Level.ERROR


def test_order_without_incoming_connection() -> None:
    strategy = valid_strategy()
    strategy.connections.clear()
    assert uid(2) in [item.element for item in only(check(strategy), fc.FLOW_NOT_REACHED)]


def test_management_elements_need_incoming_connections_too() -> None:
    strategy = with_management()
    strategy.connections.clear()
    strategy.connections.append(connect(1, "weiter", 2))
    found = only(check(strategy), fc.FLOW_NOT_REACHED)
    assert [item.element for item in found] == [uid(4)]


def test_objects_on_the_canvas_need_no_ablauf_connection() -> None:
    """An instance has no connection of the flow (specification 3.3): it is connected by being
    used, by an input or a name in an expression; an instance that nothing uses is an error."""
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("ema20")))
    assert codes(check(strategy)) == [fc.INSTANCE_UNCONNECTED]
    use(strategy, "ema20")
    assert check(strategy) == []


def test_all_elements_connected_have_no_finding() -> None:
    assert only(check(valid_strategy()), fc.FLOW_NOT_REACHED) == []


def test_elements_with_connections_only_among_themselves_are_not_reached() -> None:
    """A circle of elements that no trigger reaches runs never, like an element without an
    incoming connection (specification 3.6, section 10 point 17)."""
    strategy = valid_strategy()
    strategy.elements += [condition(5, "TRUE()"), condition(6, "TRUE()"), place_order(7)]
    strategy.connections += [
        connect(5, "wahr", 6),
        connect(6, "wahr", 5),
        connect(6, "falsch", 7),
        connect(5, "falsch", 7),
    ]
    found = only(check(strategy), fc.FLOW_NOT_REACHED)
    assert sorted(item.element or "" for item in found) == [uid(5), uid(6), uid(7)]


def test_an_element_behind_a_reached_element_is_reached_in_a_loop_too() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, condition(5, "TRUE()"))
    strategy.connections = [
        connect(1, "weiter", 5),
        connect(5, "wahr", 2),
        connect(5, "falsch", 5),
    ]
    assert only(check(strategy), fc.FLOW_NOT_REACHED) == []


def test_a_strategy_without_trigger_reports_every_element_of_the_flow() -> None:
    """Also with a management that has triggers of its own: the main flow starts nowhere."""
    strategy = with_management()
    strategy.elements.remove(strategy.elements[0])
    strategy.connections.pop(0)
    strategy.elements.insert(1, condition(5, "TRUE()"))
    found = only(check(strategy), fc.FLOW_NOT_REACHED)
    assert sorted(item.element or "" for item in found) == [uid(2), uid(5)]


def test_the_elements_of_a_management_without_triggers_are_reached_from_the_output_placed() -> None:
    strategy = valid_strategy()
    strategy.elements += [condition(5, 'Order.status = "wartend"', management_of=uid(2))]
    unreached = only(check(strategy), fc.FLOW_NOT_REACHED)
    assert [item.element for item in unreached] == [uid(5)]
    strategy.connections.append(connect(2, "gestellt", 5))
    assert check(strategy) == []


def test_the_elements_of_a_management_with_triggers_of_its_own_are_reached_from_them() -> None:
    strategy = with_management()
    assert only(check(strategy), fc.FLOW_NOT_REACHED) == []


def test_an_element_of_an_unknown_type_is_no_element_of_the_flow_for_this_finding() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "x.unbekannt"))
    assert only(check(strategy), fc.FLOW_NOT_REACHED) == []
    assert [item.element for item in only(check(strategy), fc.TYPE_UNKNOWN)] == [uid(5)]


def test_a_path_through_an_element_of_an_unknown_type_reaches_the_next() -> None:
    """Specification 3.3: an element of an unknown type has an input and the outputs from
    which connections go out."""
    strategy = valid_strategy()
    strategy.elements.insert(1, element(5, "x.unbekannt"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "ergebnis", 2)]
    found = check(strategy)
    assert only(found, fc.FLOW_NOT_REACHED) == []
    assert only(found, fc.CONNECTION_INVALID) == []


# fehlerhafter Ausdruck -------------------------------------------------------------------


def condition_strategy(text: str) -> Strategy:
    strategy = valid_strategy()
    strategy.elements.insert(1, condition(5, text))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 2)]
    return strategy


def test_valid_expression_has_no_finding() -> None:
    assert check(condition_strategy("1 < 2")) == []


def test_faulty_expression_is_reported_with_its_position() -> None:
    cases = {
        "1 <": ("syntax", 3, 3),
        "FOO(1)": ("unknown_function", 0, 3),
        "1 < gibtsnicht": ("unknown_name", 4, 14),
        "Konto.Gewinn > 1": ("unknown_property", 6, 12),
        "1 < 2 + TRUE()": ("type_mismatch", 8, 14),
        "Konto = 1": ("type_mismatch", 0, 5),
    }
    for text, (issue, start, end) in cases.items():
        found = only(check(condition_strategy(text)), fc.EXPRESSION_INVALID)
        assert len(found) >= 1, text
        details = found[0].details
        assert details["issue"] == issue, text
        assert (details["start"], details["end"]) == (start, end), text
        assert details["field"] == "parameter:ausdruck"
        assert found[0].element == uid(5)
        assert found[0].level is Level.ERROR


def test_unknown_value_of_a_choice_is_an_error() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(
        1,
        element(
            5,
            "ZigZag",
            instance=Instance(
                name="mt",
                object_type="ZigZag",
                origin=Origin("ZigZag"),
                parameter_values={"zeiteinheit": fixed("h1")},
            ),
        ),
    )
    strategy.elements.insert(2, condition(6, 'mt.wendepunkt_1_art = "Seitwaerts"'))
    strategy.connections = [connect(1, "weiter", 6), connect(6, "wahr", 2)]
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert found[0].details["issue"] == "unknown_choice_value"
    assert found[0].details["values"] == ["Seitwaerts"]


def test_condition_needs_a_truth_value() -> None:
    found = only(check(condition_strategy("1 + 2")), fc.EXPRESSION_INVALID)
    assert found[0].details["issue"] == "type_mismatch"
    assert found[0].details["reason"] == "result"


def test_calculation_may_have_any_result() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, calculation(5, "wert", '"text" & 1'))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 2)]
    assert check(strategy) == []


def test_expression_in_the_binding_of_an_order_property_is_checked_against_the_type() -> None:
    strategy = valid_strategy()
    strategy.elements[1].properties["volumen"] = expr('"viel"')
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert found[0].details["field"] == "property:volumen"
    assert found[0].details["issue"] == "type_mismatch"


def test_the_expression_of_a_parameter_binding_is_checked() -> None:
    strategy = valid_strategy()
    strategy.elements[0].parameters["zeiteinheit"] = expr('"x9"')
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert found[0].details["issue"] == "unknown_choice_value"


# Rückführung ohne Ende --------------------------------------------------------------------


def loop_strategy(*, second_is_condition: bool, free_output: bool) -> Strategy:
    strategy = valid_strategy()
    strategy.elements = [
        trigger(1),
        calculation(5, "a", "1"),
        condition(6, "TRUE()") if second_is_condition else calculation(6, "b", "2"),
        place_order(2),
    ]
    strategy.connections = [connect(1, "weiter", 5)]
    if second_is_condition:
        strategy.connections += [connect(5, "weiter", 6), connect(6, "wahr", 5)]
        if not free_output:
            strategy.connections.append(connect(6, "falsch", 5))
        else:
            strategy.connections.append(connect(6, "falsch", 2))
    else:
        strategy.connections += [connect(5, "weiter", 6), connect(6, "weiter", 5)]
    return strategy


def test_loop_without_a_condition_never_ends() -> None:
    found = only(
        check(loop_strategy(second_is_condition=False, free_output=False)), fc.FLOW_UNENDING_LOOP
    )
    assert len(found) == 1
    assert found[0].element == uid(5)
    assert found[0].details["elements"] == [uid(5), uid(6)]


def test_loop_whose_condition_has_both_outputs_in_the_loop_never_ends() -> None:
    found = only(
        check(loop_strategy(second_is_condition=True, free_output=False)), fc.FLOW_UNENDING_LOOP
    )
    assert len(found) == 1


def test_loop_with_a_condition_that_leads_out_ends() -> None:
    assert (
        only(
            check(loop_strategy(second_is_condition=True, free_output=True)), fc.FLOW_UNENDING_LOOP
        )
        == []
    )


def test_loop_with_a_condition_that_ends_without_continuation() -> None:
    strategy = loop_strategy(second_is_condition=True, free_output=False)
    strategy.connections.pop()  # the output falsch is not connected: the flow ends there
    strategy.elements.append(element(7, catalog.FLOW_DELETE_ORDER))  # not part of the check
    assert only(check(strategy), fc.FLOW_UNENDING_LOOP) == []


def test_a_condition_that_returns_to_itself_needs_an_exit() -> None:
    strategy = valid_strategy()
    strategy.elements = [trigger(1), condition(5, "TRUE()"), place_order(2)]
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 5), connect(5, "falsch", 5)]
    assert only(check(strategy), fc.FLOW_UNENDING_LOOP)
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 5), connect(5, "falsch", 2)]
    assert only(check(strategy), fc.FLOW_UNENDING_LOOP) == []


def test_a_calculation_pointing_to_itself_never_ends() -> None:
    strategy = valid_strategy()
    strategy.elements = [trigger(1), calculation(5, "a", "1"), place_order(2)]
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 5)]
    assert only(check(strategy), fc.FLOW_UNENDING_LOOP)


def test_return_to_an_earlier_condition_with_an_exit_is_valid() -> None:
    """The return to an earlier condition (req-fach-047): the condition leads out."""
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("zeit", DataType.TIME_UNIT, "h1")]
    strategy.elements = [
        trigger(1),
        condition(5, 'Strategie.zeit = "h1"'),
        calculation(6, "zaehler", "1"),
        place_order(2),
    ]
    strategy.connections = [
        connect(1, "weiter", 5),
        connect(5, "wahr", 6),
        connect(6, "weiter", 5),
        connect(5, "falsch", 2),
    ]
    assert check(strategy) == []


def test_a_loop_inside_a_management_is_found() -> None:
    strategy = with_management()
    strategy.elements.append(calculation(7, "x", "1", management_of=uid(2)))
    strategy.connections += [connect(4, "wahr", 7), connect(7, "weiter", 7)]
    assert only(check(strategy), fc.FLOW_UNENDING_LOOP)


def test_two_loops_are_reported_separately() -> None:
    strategy = valid_strategy()
    strategy.elements = [
        trigger(1),
        calculation(5, "a", "1"),
        calculation(6, "b", "1"),
        place_order(2),
    ]
    strategy.connections = [
        connect(1, "weiter", 5),
        connect(5, "weiter", 5),
        connect(1, "weiter", 6),
        connect(6, "weiter", 6),
    ]
    assert len(only(check(strategy), fc.FLOW_UNENDING_LOOP)) == 2


# Pflichtparameter --------------------------------------------------------------------------


def test_trigger_without_time_unit() -> None:
    strategy = valid_strategy()
    strategy.elements[0].parameters.clear()
    found = only(check(strategy), fc.PARAMETER_MISSING)
    assert found[0].element == uid(1)
    assert found[0].details["parameter"] == "zeiteinheit"


def test_time_unit_bound_at_the_application_is_not_missing() -> None:
    strategy = valid_strategy()
    strategy.elements[0].parameters["zeiteinheit"] = application()
    assert only(check(strategy), fc.PARAMETER_MISSING) == []


def test_time_unit_from_a_strategy_parameter() -> None:
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("zeit", DataType.TIME_UNIT, "h1")]
    strategy.elements[0].parameters["zeiteinheit"] = param("zeit")
    assert check(strategy) == []


def test_mandatory_parameter_of_an_instance_without_value() -> None:
    strategy = valid_strategy()
    instance = ema("ema20")
    del instance.parameter_values["periode"]
    strategy.elements.append(element(5, "EMA", instance=instance))
    found = only(check(strategy), fc.PARAMETER_MISSING)
    assert found[0].element == uid(5)
    assert found[0].subject == "ema20"
    assert found[0].details["parameter"] == "periode"


def test_parameter_with_a_default_needs_no_value() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "EMA", instance=ema("ema20")))  # verschiebung is absent
    use(strategy, "ema20")
    assert check(strategy) == []


def test_strategy_parameter_without_value() -> None:
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("zeit", DataType.TIME_UNIT)]
    found = only(check(strategy), fc.PARAMETER_MISSING)
    assert found[0].subject == "zeit"
    assert found[0].element is None
    strategy.parameters = [StrategyParameter("zeit", DataType.TIME_UNIT, at_application=True)]
    assert check(strategy) == []


def test_conditional_parameter_is_mandatory_only_when_it_applies() -> None:
    strategy = valid_strategy()
    strategy.elements.append(
        element(
            5,
            catalog.FLOW_MODIFY_ORDER,
            management_of=uid(2),
            parameters={"gueltigkeit": fixed("bis_zeitpunkt")},
        )
    )
    # ablaufzeit is only applicable but optional in "Order ändern": no finding for it
    assert only(check(strategy), fc.PARAMETER_MISSING) == []


# Bindungen -----------------------------------------------------------------------------------


def test_invalid_bindings() -> None:
    strategy = valid_strategy()
    strategy.parameters = [
        StrategyParameter("zeit", DataType.TIME_UNIT, "h1"),
        StrategyParameter("zahl", DataType.NUMBER, 1),
    ]
    trigger_element = strategy.elements[0]
    cases = [
        (Binding(BindingKind.FIXED, "x9"), "choice_value"),
        (Binding(BindingKind.FIXED, 5), "type"),
        (Binding(BindingKind.PARAMETER, "nope"), "unknown_parameter"),
        (Binding(BindingKind.PARAMETER, "zahl"), "type"),
        (Binding(BindingKind.EXPRESSION, 5), "value"),
        (Binding(BindingKind.PARAMETER, 5), "value"),
    ]
    for binding, reason in cases:
        trigger_element.parameters["zeiteinheit"] = binding
        found = only(check(strategy), fc.PARAMETER_BINDING_INVALID)
        assert len(found) == 1, (binding, reason)
        assert found[0].details["reason"] == reason, binding
        assert found[0].element == uid(1)


def test_binding_kind_that_the_parameter_does_not_allow() -> None:
    strategy = valid_strategy()
    strategy.elements[1].parameters["ordertyp"] = param("zeit")
    strategy.parameters = [StrategyParameter("zeit", DataType.TEXT, "MarketOrder")]
    found = only(check(strategy), fc.PARAMETER_BINDING_INVALID)
    assert found[0].details["reason"] == "binding_kind"


def test_unknown_parameter_and_property_ids() -> None:
    strategy = valid_strategy()
    strategy.elements[0].parameters["gibtsnicht"] = fixed(1)
    strategy.elements[1].properties["gibtsnicht"] = fixed(1)
    strategy.elements[1].properties["konto"] = fixed("x")  # filled by the application
    reasons = sorted(
        str(item.details["reason"]) for item in only(check(strategy), fc.PARAMETER_BINDING_INVALID)
    )
    assert reasons == ["set_by_application", "unknown_parameter", "unknown_property"]


def test_fixed_values_of_every_data_type() -> None:
    strategy = valid_strategy()
    strategy.elements[1] = place_order(
        2,
        "StopOrder",
        properties={"richtung": fixed("buy"), "volumen": fixed(1), "preis": fixed(1.5)},
    )
    order = strategy.elements[1]
    order.properties["gueltigkeit"] = fixed("bis_zeitpunkt")
    order.properties["ablaufzeit"] = fixed("2026-10-16T12:00:00")
    assert check(strategy) == []
    order.properties["ablaufzeit"] = fixed("morgen")
    assert only(check(strategy), fc.PARAMETER_BINDING_INVALID)
    order.properties["gueltigkeit"] = fixed("bis_ende_eines_tages")
    del order.properties["ablaufzeit"]
    order.properties["datum"] = fixed("2026-10-16")
    assert check(strategy) == []
    order.properties["datum"] = fixed("2026-13-40")
    assert only(check(strategy), fc.PARAMETER_BINDING_INVALID)
    order.properties["datum"] = fixed(True)
    assert only(check(strategy), fc.PARAMETER_BINDING_INVALID)


def test_strategy_parameter_with_a_wrong_value() -> None:
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("zahl", DataType.NUMBER, "viel")]
    found = only(check(strategy), fc.PARAMETER_BINDING_INVALID)
    assert found[0].details["scope"] == "strategy"


def test_parameter_setzen_is_an_unknown_type() -> None:
    """The element "Parameter setzen" is no longer delivered (req-fach-047): a document that
    has it keeps it and the check reports the unknown type."""
    strategy = valid_strategy()
    strategy.parameters = [StrategyParameter("zahl", DataType.NUMBER, 1)]
    unknown = element(
        5,
        "flow.set_parameter",
        parameters={"strategieparameter": fixed("zahl"), "ausdruck": expr("Strategie.zahl + 1")},
    )
    strategy.elements.insert(1, unknown)
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 2)]
    found = only(check(strategy), fc.TYPE_UNKNOWN)
    assert [item.element for item in found] == [uid(5)]
    assert found[0].details["type"] == "flow.set_parameter"
    assert unknown.parameters["ausdruck"].value == "Strategie.zahl + 1"  # the values stay


# MUSS-Eigenschaft der Order ----------------------------------------------------------------------


def test_must_property_without_binding() -> None:
    strategy = valid_strategy()
    del strategy.elements[1].properties["richtung"]
    found = only(check(strategy), fc.ORDER_PROPERTY_MISSING)
    assert len(found) == 1
    assert found[0].element == uid(2)
    assert found[0].details["property"] == "richtung"
    assert found[0].details["order_type"] == "MarketOrder"


def test_all_must_properties_of_each_order_type() -> None:
    needed = {
        "MarketOrder": {"richtung", "volumen"},
        "StopOrder": {"richtung", "volumen", "preis"},
        "LimitOrder": {"richtung", "volumen", "preis"},
        "StopLimitOrder": {"richtung", "volumen", "preis", "limitpreis"},
        "CloseOrder": set(),
    }
    for order_type, properties in needed.items():
        if order_type == "CloseOrder":
            continue
        strategy = valid_strategy()
        strategy.elements[1] = place_order(2, order_type, properties={})
        found = {
            str(item.details["property"])
            for item in only(check(strategy), fc.ORDER_PROPERTY_MISSING)
        }
        assert found == properties, order_type


def test_only_properties_the_user_fills_count() -> None:
    """Hint S16: instrument, konto, order_id, status, strategie_id and (for the market order)
    preis are filled by the application and are never reported."""
    strategy = valid_strategy()
    found = check(strategy)
    assert only(found, fc.ORDER_PROPERTY_MISSING) == []
    strategy.elements[1].properties.clear()
    missing = {
        str(item.details["property"]) for item in only(check(strategy), fc.ORDER_PROPERTY_MISSING)
    }
    assert missing == {"richtung", "volumen"}


def test_a_determining_rule_of_the_strategy_supplies_the_property() -> None:
    from tests.helpers import rule

    strategy = valid_strategy()
    del strategy.elements[1].properties["volumen"]
    assert only(check(strategy), fc.ORDER_PROPERTY_MISSING)
    strategy.rules.append(rule("r", "1", determined_property="volumen"))
    assert only(check(strategy), fc.ORDER_PROPERTY_MISSING) == []


def test_a_determining_rule_of_the_element_supplies_the_property() -> None:
    from tests.helpers import rule

    strategy = valid_strategy()
    del strategy.elements[1].properties["volumen"]
    strategy.elements[1].rules.append(rule("r", "1", determined_property="volumen"))
    assert only(check(strategy), fc.ORDER_PROPERTY_MISSING) == []


def test_a_checking_rule_does_not_supply_the_property() -> None:
    from tests.helpers import rule

    strategy = valid_strategy()
    del strategy.elements[1].properties["volumen"]
    strategy.rules.append(rule("r", "Order.volumen > 0"))
    assert only(check(strategy), fc.ORDER_PROPERTY_MISSING)


def test_a_rule_in_a_ruleset_supplies_the_property_too() -> None:
    from tests.helpers import rule, ruleset

    strategy = valid_strategy()
    del strategy.elements[1].properties["volumen"]
    strategy.rules.append(ruleset("werk", [rule("r", "1", determined_property="volumen")]))
    assert only(check(strategy), fc.ORDER_PROPERTY_MISSING) == []


def test_a_property_filled_at_the_application_is_present() -> None:
    strategy = valid_strategy()
    strategy.elements[1].properties["volumen"] = application()
    assert only(check(strategy), fc.ORDER_PROPERTY_MISSING) == []


def test_validity_has_a_default_and_its_additions_depend_on_it() -> None:
    strategy = valid_strategy()
    strategy.elements[1] = place_order(
        2,
        "StopOrder",
        properties={"richtung": fixed("buy"), "volumen": fixed(1), "preis": fixed(1.0)},
    )
    assert check(strategy) == []  # gueltigkeit has the default "bis auf Widerruf"
    strategy.elements[1].properties["gueltigkeit"] = fixed("bis_zeitpunkt")
    found = only(check(strategy), fc.ORDER_PROPERTY_MISSING)
    assert [item.details["property"] for item in found] == ["ablaufzeit"]
    strategy.elements[1].properties["gueltigkeit"] = fixed("bis_ende_eines_tages")
    found = only(check(strategy), fc.ORDER_PROPERTY_MISSING)
    assert [item.details["property"] for item in found] == ["datum"]


def test_order_without_a_valid_order_type() -> None:
    strategy = valid_strategy()
    strategy.elements[1].parameters["ordertyp"] = fixed("CloseOrder")
    found = check(strategy)
    assert only(found, fc.PARAMETER_BINDING_INVALID)  # not a choice of the user
    strategy.elements[1].parameters.pop("ordertyp")
    found = check(strategy)
    assert [item.details["parameter"] for item in only(found, fc.PARAMETER_MISSING)] == ["ordertyp"]
    assert only(found, fc.ORDER_PROPERTY_MISSING) == []


# Verwendung von Order und Position im Ablauf ----------------------------------------------------


def test_order_in_the_main_flow_is_an_error() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, condition(5, 'Order.status = "wartend"'))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 2)]
    found = only(check(strategy), fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT)
    assert [item.element for item in found] == [uid(5)]
    assert found[0].details["field"] == "parameter:ausdruck"
    assert found[0].details["context"] == "main_flow"


def test_position_in_the_main_flow_is_an_error() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, condition(5, "Position.volumen > 0"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 2)]
    assert only(check(strategy), fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT)


def test_order_in_a_management_is_valid() -> None:
    assert check(with_management()) == []


def test_order_in_the_binding_of_the_order_element_itself_is_an_error() -> None:
    strategy = valid_strategy()
    strategy.elements[1].properties["volumen"] = expr("Order.volumen")
    assert only(check(strategy), fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT)


def test_the_result_of_a_rule_with_order_in_the_main_flow_is_an_error() -> None:
    from tests.helpers import rule

    strategy = valid_strategy()
    strategy.rules.append(rule("r", "Order.volumen > 0"))
    strategy.elements.insert(1, condition(5, "r.ergebnis"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 2)]
    found = only(check(strategy), fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT)
    assert [item.element for item in found] == [uid(5)]


def test_the_result_of_a_rule_with_order_through_another_rule_is_an_error() -> None:
    from tests.helpers import rule

    strategy = valid_strategy()
    strategy.rules += [rule("a", "Order.volumen > 0"), rule("b", "a.ergebnis")]
    strategy.elements.insert(1, condition(5, "b.ergebnis"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 2)]
    assert only(check(strategy), fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT)


def test_the_result_of_a_rule_without_order_in_the_main_flow_is_valid() -> None:
    from tests.helpers import rule

    strategy = valid_strategy()
    strategy.rules.append(rule("r", "Konto.kapital > 0"))
    strategy.elements.insert(1, condition(5, "r.ergebnis"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 2)]
    assert check(strategy) == []


def test_the_result_of_a_rule_with_order_in_a_management_is_valid() -> None:
    from tests.helpers import rule

    strategy = with_management()
    strategy.rules.append(rule("r", "Order.volumen > 0"))
    strategy.elements[3].parameters["ausdruck"] = expr("r.ergebnis")
    assert check(strategy) == []


def test_a_rule_that_uses_order_stands_at_the_order_element() -> None:
    from tests.helpers import rule

    strategy = valid_strategy()
    strategy.elements[1].rules.append(rule("r", "Order.volumen > 0"))
    strategy.rules.append(rule("s", "Order.volumen > 0"))
    assert check(strategy) == []


def test_in_a_management_order_has_the_properties_of_its_order_type() -> None:
    strategy = with_management()
    strategy.elements[3].parameters["ausdruck"] = expr("Order.limitpreis > 0")  # market order
    found = only(check(strategy), fc.EXPRESSION_INVALID)
    assert found[0].details["issue"] == "unknown_property"
    assert found[0].element == uid(4)
    strategy.elements[1] = place_order(
        2,
        "StopLimitOrder",
        properties={
            "richtung": fixed("buy"),
            "volumen": fixed(1),
            "preis": fixed(1.0),
            "limitpreis": fixed(1.0),
        },
    )
    assert check(strategy) == []


def test_in_the_main_flow_a_property_of_no_order_type_is_unknown_not_an_order_error() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, condition(5, "Order.gibtsnicht > 0"))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 2)]
    found = check(strategy)
    assert only(found, fc.EXPRESSION_INVALID)
    assert only(found, fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT)


# Order ändern usw. außerhalb einer Verwaltung ----------------------------------------------------


def test_elements_for_existing_orders_and_positions_need_a_management() -> None:
    for type_id in (
        catalog.FLOW_MODIFY_ORDER,
        catalog.FLOW_DELETE_ORDER,
        catalog.FLOW_MODIFY_POSITION,
        catalog.FLOW_CLOSE_POSITION,
    ):
        strategy = valid_strategy()
        strategy.elements.insert(1, element(5, type_id))
        strategy.connections = [connect(1, "weiter", 5), connect(5, _first_output(type_id), 2)]
        found = only(check(strategy), fc.FLOW_MANAGEMENT_ONLY)
        assert [item.element for item in found] == [uid(5)], type_id
        assert found[0].details["type"] == type_id


def _first_output(type_id: str) -> str:
    from pipwerk_domain.defaults import default_registry

    description = default_registry().get(type_id)
    assert description is not None
    return description.outputs[0].id


def test_the_same_elements_in_a_management_are_valid() -> None:
    for type_id in (
        catalog.FLOW_MODIFY_ORDER,
        catalog.FLOW_DELETE_ORDER,
        catalog.FLOW_MODIFY_POSITION,
        catalog.FLOW_CLOSE_POSITION,
    ):
        strategy = with_management()
        strategy.elements.append(element(5, type_id, management_of=uid(2)))
        strategy.connections.append(connect(4, "wahr", 5))
        assert check(strategy) == [], type_id


def test_place_order_in_the_main_flow_is_valid_and_may_have_its_own_management() -> None:
    strategy = with_management()
    strategy.elements.append(place_order(5, management_of=uid(2)))
    strategy.connections.append(connect(4, "wahr", 5))
    strategy.elements.append(trigger(6, management_of=uid(5)))
    strategy.elements.append(element(7, catalog.FLOW_DELETE_ORDER, management_of=uid(5)))
    strategy.connections.append(connect(6, "weiter", 7))
    assert check(strategy) == []


# unbekannter Typ ------------------------------------------------------------------------------


def test_unknown_element_type() -> None:
    strategy = valid_strategy()
    strategy.elements.insert(1, element(5, "ext.neu", parameters={"x": fixed(1)}))
    strategy.connections = [connect(1, "weiter", 5), connect(5, "irgendwas", 2)]
    found = check(strategy)
    unknown = only(found, fc.TYPE_UNKNOWN)
    assert len(unknown) == 1
    assert unknown[0].element == uid(5)
    assert unknown[0].details == {"kind": "element", "type": "ext.neu"}
    assert [item.code for item in found] == [fc.TYPE_UNKNOWN]  # nothing else is reported


def test_unknown_object_type_of_an_instance() -> None:
    strategy = valid_strategy()
    strategy.elements.append(
        element(5, "EMA", instance=Instance(name="x", object_type="Fremd", origin=Origin("Fremd")))
    )
    found = only(check(strategy), fc.TYPE_UNKNOWN)
    assert found[0].details == {"kind": "object", "type": "Fremd"}
    assert found[0].element == uid(5)
    assert found[0].subject == "x"


def test_a_connection_to_an_unknown_element_type_is_accepted() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(5, "ext.neu"))
    strategy.connections.append(connect(2, "nicht_gestellt", 5))
    assert codes(check(strategy)) == [fc.TYPE_UNKNOWN]


# kein Element „Order aufgeben“ erreichbar ----------------------------------------------------


def test_no_order_element_reachable_is_a_hint() -> None:
    strategy = strategy_with(
        trigger(1),
        condition(5, "TRUE()"),
        connections=[connect(1, "weiter", 5)],
    )
    found = only(check(strategy), fc.FLOW_NO_ORDER_REACHABLE)
    assert len(found) == 1
    assert found[0].level is Level.HINT


def test_no_order_hint_for_an_empty_strategy() -> None:
    assert only(check(strategy_with()), fc.FLOW_NO_ORDER_REACHABLE) == []


def test_no_order_hint_for_a_main_flow_without_trigger() -> None:
    """The main flow without a trigger has the hint of its own and no further one."""
    strategy = strategy_with(condition(5, "TRUE()"))
    found = check(strategy)
    assert only(found, fc.FLOW_NO_ORDER_REACHABLE) == []
    assert len(only(found, fc.FLOW_MAIN_WITHOUT_TRIGGER)) == 1


def test_no_order_hint_for_a_strategy_with_a_trigger_only() -> None:
    assert only(check(strategy_with(trigger(1))), fc.FLOW_NO_ORDER_REACHABLE)


def test_an_order_element_that_is_not_connected_is_not_reachable() -> None:
    strategy = valid_strategy()
    strategy.connections.clear()
    assert only(check(strategy), fc.FLOW_NO_ORDER_REACHABLE)


def test_order_reachable_over_a_condition() -> None:
    strategy = condition_strategy("TRUE()")
    assert only(check(strategy), fc.FLOW_NO_ORDER_REACHABLE) == []


def test_order_reachable_over_the_output_not_placed() -> None:
    strategy = valid_strategy()
    strategy.elements.append(place_order(5))
    strategy.connections.append(connect(2, "nicht_gestellt", 5))
    assert only(check(strategy), fc.FLOW_NO_ORDER_REACHABLE) == []


def test_an_order_element_in_a_management_does_not_count() -> None:
    strategy = valid_strategy()
    strategy.elements.remove(strategy.elements[1])
    strategy.connections.clear()
    strategy.elements += [
        trigger(3),
        place_order(5),
        trigger(6, management_of=uid(5)),
        place_order(7, management_of=uid(5)),
    ]
    strategy.connections = [connect(3, "weiter", 5), connect(6, "weiter", 7)]
    assert only(check(strategy), fc.FLOW_NO_ORDER_REACHABLE) == []
    strategy.elements.remove(strategy.elements[2])
    strategy.connections = [connect(6, "weiter", 7)]
    assert only(check(strategy), fc.FLOW_NO_ORDER_REACHABLE)


# Kerze ohne Instanz -----------------------------------------------------------------------


def candle_strategy(first_trigger: str, with_candle_expression: bool = True) -> Strategy:
    strategy = valid_strategy()
    strategy.elements[0] = element(1, first_trigger)
    if first_trigger == catalog.TRIGGER_CANDLE_CLOSE:
        strategy.elements[0].parameters["zeiteinheit"] = fixed("h1")
    strategy.elements.insert(
        1, condition(5, "Kerze.schluss > 1" if with_candle_expression else "TRUE()")
    )
    strategy.connections = [connect(1, "weiter", 5), connect(5, "wahr", 2)]
    return strategy


def test_candle_without_instance_when_another_trigger_starts() -> None:
    found = only(check(candle_strategy(catalog.TRIGGER_TICK)), fc.CANDLE_NO_INSTANCE)
    assert [item.element for item in found] == [uid(5)]


def test_candle_is_fine_when_the_candle_close_trigger_starts() -> None:
    assert check(candle_strategy(catalog.TRIGGER_CANDLE_CLOSE)) == []


def test_candle_is_fine_with_a_candle_instance_with_a_time_unit() -> None:
    strategy = candle_strategy(catalog.TRIGGER_TICK)
    strategy.elements.append(
        element(
            6,
            "Kerze",
            instance=Instance(
                name="kerze_h1",
                object_type="Kerze",
                origin=Origin("Kerze"),
                parameter_values={"zeiteinheit": fixed("h1")},
            ),
        )
    )
    use(strategy, "kerze_h1", "schluss")
    assert check(strategy) == []


def test_a_candle_instance_without_a_time_unit_does_not_help() -> None:
    strategy = candle_strategy(catalog.TRIGGER_TICK)
    strategy.elements.append(
        element(
            6,
            "Kerze",
            instance=Instance(name="kerze_h1", object_type="Kerze", origin=Origin("Kerze")),
        )
    )
    assert only(check(strategy), fc.CANDLE_NO_INSTANCE)


def test_a_tick_trigger_without_candle_use_is_fine() -> None:
    assert check(candle_strategy(catalog.TRIGGER_TICK, with_candle_expression=False)) == []


def test_candle_in_the_flow_of_the_candle_close_trigger_is_fine_next_to_a_tick_flow() -> None:
    strategy = candle_strategy(catalog.TRIGGER_CANDLE_CLOSE)
    strategy.elements.append(trigger(6))  # a second trigger, candle close, unconnected
    strategy.elements.append(element(7, catalog.TRIGGER_TICK))
    strategy.elements.append(condition(8, "TRUE()"))
    strategy.connections += [connect(6, "weiter", 8), connect(7, "weiter", 8)]
    found = check(strategy)
    assert only(found, fc.CANDLE_NO_INSTANCE) == []


def test_candle_in_a_flow_reached_by_the_tick_trigger() -> None:
    strategy = candle_strategy(catalog.TRIGGER_CANDLE_CLOSE)
    strategy.elements.append(element(7, catalog.TRIGGER_TICK))
    strategy.connections.append(connect(7, "weiter", 5))
    assert [item.element for item in only(check(strategy), fc.CANDLE_NO_INSTANCE)] == [uid(5)]


def test_candle_in_a_rule_of_the_strategy_with_a_tick_trigger() -> None:
    from tests.helpers import rule

    strategy = valid_strategy()
    strategy.elements[0] = element(1, catalog.TRIGGER_TICK)
    strategy.rules.append(rule("r", "Kerze.schluss > 0"))
    found = only(check(strategy), fc.CANDLE_NO_INSTANCE)
    assert [(item.element, item.subject) for item in found] == [(None, "r")]


def candle_found(strategy: Strategy) -> list[tuple[str | None, str | None]]:
    return [(item.element, item.subject) for item in only(check(strategy), fc.CANDLE_NO_INSTANCE)]


def candle_instance(number: int) -> Element:
    return element(
        number,
        "Kerze",
        instance=Instance(
            name="kerze_h1",
            object_type="Kerze",
            origin=Origin("Kerze"),
            parameter_values={"zeiteinheit": fixed("h1")},
        ),
    )


def test_candle_at_an_element_that_another_trigger_than_candle_close_reaches() -> None:
    strategy = strategy_with(
        element(1, catalog.TRIGGER_TICK),
        condition(5, "Kerze.schluss > 1"),
        connections=[connect(1, "weiter", 5)],
    )
    assert candle_found(strategy) == [(uid(5), None)]
    # the trigger "manual start" is another trigger than candle close too
    manual = strategy_with(
        element(1, catalog.TRIGGER_MANUAL),
        condition(5, "Kerze.schluss > 1"),
        connections=[connect(1, "weiter", 5)],
    )
    assert candle_found(manual) == [(uid(5), None)]
    # counter sample: a candle close trigger reaches the element
    strategy = strategy_with(
        trigger(1), condition(5, "Kerze.schluss > 1"), connections=[connect(1, "weiter", 5)]
    )
    assert candle_found(strategy) == []
    # counter sample: no trigger reaches the element, so no trigger can start it
    assert candle_found(strategy_with(condition(5, "Kerze.schluss > 1"))) == []
    # counter sample: a candle instance with a time unit
    with_instance = strategy_with(
        element(1, catalog.TRIGGER_TICK),
        condition(5, "Kerze.schluss > 1"),
        candle_instance(6),
        connections=[connect(1, "weiter", 5)],
    )
    assert candle_found(with_instance) == []


def test_candle_in_a_rule_of_an_element_that_another_trigger_reaches() -> None:
    from tests.helpers import rule

    order = place_order(2, rules=[rule("r", "Kerze.schluss > 0")])
    strategy = strategy_with(
        element(1, catalog.TRIGGER_TICK), order, connections=[connect(1, "weiter", 2)]
    )
    assert candle_found(strategy) == [(uid(2), "r")]
    reached = place_order(2, rules=[rule("r", "Kerze.schluss > 0")])
    strategy = strategy_with(trigger(1), reached, connections=[connect(1, "weiter", 2)])
    assert candle_found(strategy) == []
    # counter sample: no trigger reaches the element
    assert candle_found(strategy_with(place_order(2, rules=[rule("r", "Kerze.schluss > 0")]))) == []


def management_with(management_elements: list[Element]) -> Strategy:
    """Main flow with a candle close trigger and an order, plus elements of its management."""
    strategy = valid_strategy()
    strategy.elements.extend(management_elements)
    return strategy


def test_candle_in_a_management_without_own_trigger_follows_the_triggers_of_the_order() -> None:
    """The elements of a management without triggers are reached by the triggers that reach
    the element "Order aufgeben" (specification 3.3)."""
    strategy = management_with([condition(4, "Kerze.schluss > 0", management_of=uid(2))])
    strategy.connections.append(connect(2, "gestellt", 4))
    # the main flow has the candle close trigger only
    assert candle_found(strategy) == []
    # a tick trigger reaches the order and with it the management
    strategy.elements.append(element(7, catalog.TRIGGER_TICK))
    strategy.connections.append(connect(7, "weiter", 2))
    assert candle_found(strategy) == [(uid(4), None)]


def test_candle_in_a_management_with_a_candle_close_trigger_of_its_own() -> None:
    strategy = management_with(
        [trigger(3, management_of=uid(2)), condition(4, "Kerze.schluss > 0", management_of=uid(2))]
    )
    strategy.connections.append(connect(3, "weiter", 4))
    assert candle_found(strategy) == []


def test_candle_in_a_rule_of_an_element_of_a_management_without_trigger() -> None:
    from tests.helpers import rule

    strategy = management_with(
        [place_order(4, management_of=uid(2), rules=[rule("r", "Kerze.schluss > 0")])]
    )
    strategy.connections.append(connect(2, "gestellt", 4))
    assert candle_found(strategy) == []
    strategy.elements.append(element(7, catalog.TRIGGER_MANUAL))
    strategy.connections.append(connect(7, "weiter", 2))
    assert candle_found(strategy) == [(uid(4), "r")]


def test_candle_in_a_management_with_a_tick_trigger_next_to_a_candle_close_main_flow() -> None:
    strategy = management_with(
        [
            element(3, catalog.TRIGGER_TICK, management_of=uid(2)),
            condition(4, "Kerze.schluss > 0", management_of=uid(2)),
        ]
    )
    strategy.connections.append(connect(3, "weiter", 4))
    assert candle_found(strategy) == [(uid(4), None)]


def test_candle_at_an_element_reached_by_two_kinds_of_trigger() -> None:
    strategy = candle_strategy(catalog.TRIGGER_CANDLE_CLOSE)
    strategy.elements.append(element(7, catalog.TRIGGER_TICK))
    strategy.connections.append(connect(7, "weiter", 5))
    assert candle_found(strategy) == [(uid(5), None)]


def strategy_rule_case(*triggers: Element, instance_on_canvas: bool = False) -> Strategy:
    from tests.helpers import rule

    strategy = strategy_with(*triggers)
    strategy.rules.append(rule("r", "Kerze.schluss > 0"))
    if instance_on_canvas:
        strategy.elements.append(candle_instance(60))
    return strategy


def test_candle_in_a_rule_of_the_strategy_follows_the_elements_it_is_applied_to() -> None:
    # no trigger, no element with rules: nothing can start it
    assert candle_found(strategy_rule_case()) == []
    # a tick trigger reaches the order the rule is applied to
    strategy = strategy_rule_case(element(1, catalog.TRIGGER_TICK), place_order(2))
    strategy.connections.append(connect(1, "weiter", 2))
    assert candle_found(strategy) == [(None, "r")]
    # counter sample: only candle close triggers
    only_candle = strategy_rule_case(trigger(1), place_order(2))
    only_candle.connections.append(connect(1, "weiter", 2))
    assert candle_found(only_candle) == []
    # counter sample: the tick trigger reaches no element that has rules
    away = strategy_rule_case(element(1, catalog.TRIGGER_TICK), condition(3, "TRUE()"), trigger(4))
    away.elements.append(place_order(2))
    away.connections += [connect(1, "weiter", 3), connect(4, "weiter", 2)]
    assert candle_found(away) == []
    # counter sample: a candle instance with a time unit
    assert candle_found(strategy_rule_case(instance_on_canvas=True)) == []


def test_candle_in_a_rule_of_the_strategy_with_a_tick_trigger_in_a_management() -> None:
    def with_management_trigger(management_trigger: Element) -> Strategy:
        # str-01: the main flow has candle close, a management has its own trigger
        strategy = strategy_rule_case()
        strategy.elements.extend(
            [trigger(1), place_order(2), management_trigger, place_order(4, management_of=uid(2))]
        )
        strategy.connections += [connect(1, "weiter", 2), connect(3, "weiter", 4)]
        return strategy

    tick = element(3, catalog.TRIGGER_TICK, management_of=uid(2))
    assert candle_found(with_management_trigger(tick)) == [(None, "r")]
    # counter sample: candle close triggers in main flow and management
    assert candle_found(with_management_trigger(trigger(3, management_of=uid(2)))) == []


def test_candle_at_an_instance_on_the_canvas() -> None:
    def instance_element() -> Element:
        return element(
            50,
            "EMA",
            instance=Instance(
                name="ema_kerze",
                object_type="EMA",
                origin=Origin("EMA"),
                parameter_values={
                    "zeiteinheit": fixed("h1"),
                    "periode": expr("Kerze.schluss"),
                },
            ),
        )

    # no trigger: no other trigger than candle close can start the strategy
    assert candle_found(strategy_with(instance_element())) == []
    # the trigger "manual start"
    manual = strategy_with(element(1, catalog.TRIGGER_MANUAL), instance_element())
    assert candle_found(manual) == [(uid(50), "ema_kerze")]
    # a tick trigger
    tick = strategy_with(element(1, catalog.TRIGGER_TICK), instance_element())
    assert candle_found(tick) == [(uid(50), "ema_kerze")]
    # counter sample: only candle close
    assert candle_found(strategy_with(trigger(1), instance_element())) == []
    # counter sample: a candle instance with a time unit
    assert (
        candle_found(
            strategy_with(element(1, catalog.TRIGGER_TICK), instance_element(), candle_instance(51))
        )
        == []
    )


# Verbindungen und Verwaltungen (weitere Befunde) --------------------------------------------------


def test_invalid_connections() -> None:
    cases = {
        "unknown_source": Connection(uid(77), "weiter", uid(2)),
        "unknown_target": Connection(uid(1), "weiter", uid(77)),
        "unknown_output": Connection(uid(1), "falsch", uid(2)),
        "target_is_trigger": Connection(uid(2), "gestellt", uid(1)),
    }
    for reason, connection in cases.items():
        strategy = valid_strategy()
        strategy.connections.append(connection)
        found = only(check(strategy), fc.CONNECTION_INVALID)
        assert [item.details["reason"] for item in found] == [reason]


def test_connection_across_managements() -> None:
    strategy = with_management()
    strategy.connections.append(connect(1, "weiter", 4))
    found = only(check(strategy), fc.CONNECTION_INVALID)
    assert found[0].details["reason"] == "across_managements"


def test_management_of_something_that_is_no_order_element() -> None:
    strategy = valid_strategy()
    strategy.elements.append(trigger(5, management_of=uid(1)))
    strategy.elements.append(trigger(6, management_of=uid(77)))
    found = only(check(strategy), fc.ELEMENT_MANAGEMENT_INVALID)
    assert sorted(item.element or "" for item in found) == [uid(5), uid(6)]


def test_rules_at_an_element_that_does_not_allow_them() -> None:
    from tests.helpers import rule

    strategy = valid_strategy()
    strategy.elements[0].rules.append(rule("r", "TRUE()"))
    found = only(check(strategy), fc.ELEMENT_RULES_NOT_ALLOWED)
    assert [item.element for item in found] == [uid(1)]
    assert only(check(valid_strategy()), fc.ELEMENT_RULES_NOT_ALLOWED) == []


def test_invalid_keys_and_free_names() -> None:
    """A name is free text; the key in an expression is a simple name."""
    strategy = valid_strategy()
    free = calculation(5, "Mit Blank und Ümlaut-Strich", "1")
    free.key = "mit Blank"
    strategy.elements.insert(1, free)
    strategy.connections = [connect(1, "weiter", 5), connect(5, "weiter", 2)]
    found = only(check(strategy), fc.KEY_INVALID)
    assert found[0].details == {"key": "mit Blank", "what": "element"}
    strategy.elements[1].key = "gut"
    assert only(check(strategy), fc.KEY_INVALID) == []
    assert check(strategy) == []  # the free name is no finding


def test_level_of_each_finding_code() -> None:
    hints = {
        fc.FLOW_NO_ORDER_REACHABLE,
        fc.RULE_UNRESOLVED_NAME,
        fc.FLOW_MAIN_WITHOUT_TRIGGER,
        fc.INPUT_UNUSED,
    }
    assert Level.HINT.value == "hint"
    assert all(code not in hints for code in (fc.FLOW_NOT_REACHED, fc.NAME_DUPLICATE))


# Strategien der größten zulässigen Größe ---------------------------------------------------------


def test_a_strategy_at_the_limits_can_be_checked() -> None:
    from pipwerk_domain import limits
    from tests.helpers import rule

    elements: list[Element] = [trigger(1)]
    connections: list[Connection] = []
    for number in range(2, limits.MAX_ELEMENTS):
        elements.append(calculation(number, f"c{number}", f"{number} + 1"))
        connections.append(connect(number - 1, "weiter", number))
    elements.append(place_order(limits.MAX_ELEMENTS))
    connections.append(connect(limits.MAX_ELEMENTS - 1, "weiter", limits.MAX_ELEMENTS))
    connections += [connect(1, "weiter", 500)] * (limits.MAX_CONNECTIONS - len(connections))
    rules = [rule("r0", "Order.volumen > 0")]
    rules += [rule(f"r{n}", f"r{n - 1}.ergebnis") for n in range(1, limits.MAX_RULES_PER_LIST)]
    strategy = Strategy(
        id=uid(900), name="gross", elements=elements, connections=connections, rules=rules
    )
    strategy.elements[1].parameters["ausdruck"] = expr(f"r{limits.MAX_RULES_PER_LIST - 1}.ergebnis")
    found = check(strategy)
    assert len(only(found, fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT)) == 1  # through 200 rules
    assert len(only(found, fc.EXPRESSION_INVALID)) == 0


def test_a_long_loop_of_conditions_is_found() -> None:
    elements: list[Element] = [trigger(1)]
    connections = [connect(1, "weiter", 2)]
    count = 900
    for number in range(2, 2 + count):
        elements.append(calculation(number, f"c{number}", "1"))
        connections.append(connect(number, "weiter", 2 + (number - 1) % count))
    strategy = Strategy(id=uid(900), name="schleife", elements=elements, connections=connections)
    found = only(check(strategy), fc.FLOW_UNENDING_LOOP)
    assert len(found) == 1
    assert len(found[0].details["elements"]) == count  # type: ignore[arg-type]
