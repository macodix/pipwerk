"""The element of the first use of an instance, the ways to a use, where an instance is usable and
the findings that follow (specification 3.3 "Element der ersten Verwendung" and "Stand einer
Instanz", 3.4 visible names, 3.6): a use at an element where the instance is not usable, an instance
that no element uses, "Aktualisieren" at a type that does not offer it, `Manuell` in a management.

Each case has a counter sample.
"""

import dataclasses
import time

from pipwerk_domain import catalog
from pipwerk_domain.consistency import (
    Checker,
    InstanceUsage,
    Level,
    UsageReport,
    analyze_usage,
    check_strategy,
)
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.defaults import create_registry
from pipwerk_domain.expressions import visible_names
from pipwerk_domain.model import (
    Binding,
    Connection,
    DataLink,
    Element,
    ElementInput,
    InputKind,
    Instance,
    Origin,
    Strategy,
)
from pipwerk_domain.typedesc import BindingKind
from tests.helpers import (
    calculation,
    condition,
    connect,
    element,
    ema,
    expr,
    fixed,
    only,
    place_order,
    rule,
    trigger,
    uid,
    valid_strategy,
)
from tests.methods_support import SERIES, series_description, series_instance

I = "ema20"  # the key of the instance in the tests  # noqa: E741
E = 20  # its element


def strategy_with(*elements: Element, connections: list[Connection] | None = None) -> Strategy:
    """A strategy of the given elements and connections, the instance ``ema20`` among them."""
    return Strategy(
        id=uid(900),
        name="Test",
        elements=[*elements, element(E, "EMA", instance=ema(I))],
        connections=connections or [],
    )


def uses(number: int, prop: str = "wert") -> str:
    """An expression that uses the instance."""
    return f"{I}.{prop} > 1"


def usage_of(strategy: Strategy, key: str = I) -> InstanceUsage:
    return next(item for item in analyze_usage(strategy).instances if item.instance == key)


def not_usable(strategy: Strategy) -> list[tuple[str | None, str | None]]:
    return [
        (item.element, item.subject)
        for item in check_strategy(strategy)
        if item.code == fc.INSTANCE_NOT_USABLE
    ]


# --- the order of the flow and the first use ----------------------------------------------------


def straight() -> Strategy:
    """trigger 1 → calculation 3 → calculation 4 → order 2; the instance is used at 3 and 4."""
    strategy = strategy_with(
        trigger(1),
        calculation(3, "erste", uses(3)),
        calculation(4, "zweite", uses(4)),
        place_order(2),
        connections=[connect(1, "weiter", 3), connect(3, "weiter", 4), connect(4, "weiter", 2)],
    )
    return strategy


def test_the_first_use_is_the_first_element_in_the_order_of_the_flow() -> None:
    usage = usage_of(straight())
    assert (usage.first_use, usage.first_use_source) == (uid(3), "flow")
    assert (usage.connected, usage.usable_everywhere) == (True, False)
    assert usage.element == uid(E)
    assert usage.name == "ema20"
    assert usage.can_refresh is True
    assert usage.object_type == "EMA"
    assert check_strategy(straight()) == []


def test_the_document_order_does_not_decide_but_the_flow() -> None:
    strategy = straight()
    strategy.elements[1], strategy.elements[2] = strategy.elements[2], strategy.elements[1]
    assert usage_of(strategy).first_use == uid(3)  # 3 comes first in the flow, 4 first in the list


def test_the_instance_is_usable_at_the_first_use_and_behind_not_in_front() -> None:
    usage = usage_of(straight())
    assert usage.usable_at == (uid(3), uid(4), uid(2))
    assert usage.usable_at_omitted is False
    assert uid(1) not in usage.usable_at  # the trigger comes before the first use


def test_a_stored_first_use_wins_when_an_element_uses_the_instance() -> None:
    strategy = straight()
    strategy.elements[-1].instance.first_use = uid(4)  # type: ignore[union-attr]
    usage = usage_of(strategy)
    assert (usage.first_use, usage.first_use_source) == (uid(4), "stored")
    # now the use at 3 comes before the stored first use: it is no use there
    assert not_usable(strategy) == [(uid(3), I)]
    assert usage.usable_at == (uid(4), uid(2))


def test_a_stored_first_use_that_the_element_does_not_use_is_ignored() -> None:
    strategy = straight()
    strategy.elements[-1].instance.first_use = uid(2)  # type: ignore[union-attr]
    assert (usage_of(strategy).first_use, usage_of(strategy).first_use_source) == (uid(3), "flow")
    strategy.elements[-1].instance.first_use = uid(777)  # type: ignore[union-attr]
    assert usage_of(strategy).first_use == uid(3)


def test_an_instance_that_nothing_uses_is_unconnected_and_usable_everywhere() -> None:
    strategy = valid_strategy()
    strategy.elements.append(element(E, "EMA", instance=ema(I)))
    usage = usage_of(strategy)
    assert (usage.connected, usage.first_use, usage.first_use_source) == (False, None, None)
    assert usage.usable_everywhere is True and usage.usable_at == ()
    found = only(check_strategy(strategy), fc.INSTANCE_UNCONNECTED)
    assert [(item.level, item.element, item.subject) for item in found] == [
        (Level.ERROR, uid(E), I)
    ]
    assert found[0].details == {"instance": I}
    # connected by a use: no finding
    assert only(check_strategy(straight()), fc.INSTANCE_UNCONNECTED) == []


def test_an_input_connects_an_instance_even_when_no_expression_names_it() -> None:
    strategy = strategy_with(
        trigger(1),
        place_order(2, inputs=[ElementInput(I, "wert")]),
        connections=[connect(1, "weiter", 2)],
    )
    usage = usage_of(strategy)
    assert (usage.first_use, usage.connected) == (uid(2), True)
    findings = check_strategy(strategy)
    assert only(findings, fc.INSTANCE_UNCONNECTED) == []
    assert [item.code for item in findings] == [fc.INPUT_UNUSED]  # the hint stays


def test_a_data_connection_of_an_element_is_a_use() -> None:
    strategy = strategy_with(
        trigger(1),
        place_order(
            2,
            properties={
                "richtung": fixed("buy"),
                "volumen": Binding(BindingKind.CONNECTION, DataLink(I, "wert")),
            },
        ),
        connections=[connect(1, "weiter", 2)],
    )
    usage = usage_of(strategy)
    assert (usage.first_use, usage.first_use_source) == (uid(2), "flow")
    assert check_strategy(strategy) == []
    member = analyze_usage(strategy).elements[0].uses[0]
    assert (member.kind, member.instance, member.by_instance) == ("data_link", "ema20", None)


# --- branches, joins, loops ------------------------------------------------------------------


def branching(first_connection: str = "wahr") -> Strategy:
    """trigger 1 → condition 5 → wahr: 6, falsch: 7; 6 and 7 → order 2. The instance is used at 6
    and 7; the order of the two connections in the document is given."""
    connections = [connect(1, "weiter", 5), connect(6, "weiter", 2), connect(7, "weiter", 2)]
    branches = [connect(5, "wahr", 6), connect(5, "falsch", 7)]
    if first_connection == "falsch":
        branches.reverse()
    return strategy_with(
        trigger(1),
        condition(5, "TRUE()"),
        calculation(6, "ja", uses(6)),
        calculation(7, "nein", uses(7)),
        place_order(2),
        connections=[*branches, *connections],
    )


def test_the_branch_wahr_comes_before_the_branch_falsch_in_the_flow() -> None:
    for order in ("wahr", "falsch"):  # whatever the order of the connections in the document
        strategy = branching(order)
        assert usage_of(strategy).first_use == uid(6)
        assert not_usable(strategy) == [(uid(7), I)]


def test_a_use_in_the_other_branch_is_an_error_with_the_places() -> None:
    strategy = branching()
    found = only(check_strategy(strategy), fc.INSTANCE_NOT_USABLE)
    assert len(found) == 1
    assert (found[0].level, found[0].element, found[0].subject) == (Level.ERROR, uid(7), I)
    assert found[0].details == {
        "instance": I,
        "first_use": uid(6),
        "use": "expression",
        "by_instance": None,
        "property": "wert",
    }
    usage = usage_of(strategy)
    # usable at the first use only: the condition 5 comes before it, 7 is the other branch, and the
    # order 2 behind the join is reached over 6 and over 7
    assert usage.usable_at == (uid(6),)


def test_an_element_behind_a_join_is_no_place_for_a_use_in_one_branch_only() -> None:
    """Order 2 is reached over 6 and over 7: the first use at 6 does not dominate it, so a use at
    the order is an error too."""
    strategy = branching()
    strategy.elements[3] = calculation(7, "nein", "TRUE()")
    strategy.elements[4].properties["bemerkung"] = expr('"" & ema20.wert')
    assert not_usable(strategy) == [(uid(2), I)]


def test_a_use_at_the_condition_in_front_of_the_branches_serves_both() -> None:
    strategy = branching()
    strategy.elements[1] = condition(5, uses(5))  # the condition uses the instance
    usage = usage_of(strategy)
    assert usage.first_use == uid(5)
    assert not_usable(strategy) == []
    assert set(usage.usable_at) == {uid(5), uid(6), uid(7), uid(2)}


def test_hidden_at_names_the_instances_that_are_not_usable_at_an_element() -> None:
    checker = Checker(create_registry(entry_points=False))
    checker.check_strategy(branching())
    assert checker.hidden_instances(uid(7)) == {I}
    assert checker.hidden_instances(uid(6)) == frozenset()  # the first use
    assert checker.hidden_instances(uid(2)) == {I}  # the join
    assert checker.hidden_instances(None) == frozenset()  # a rule of the strategy
    assert checker.hidden_instances(uid(999)) == frozenset()  # not an element of the flow


def test_the_visible_names_leave_out_the_hidden_instance() -> None:
    strategy = branching()
    checker = Checker(create_registry(entry_points=False), record_contexts=True)
    checker.check_strategy(strategy)
    pointer = "/elements/3/parameters/ausdruck/value"  # the calculation 7
    context = checker.contexts[pointer]
    assert context.element_id == uid(7)
    scope = context.env
    everything = {item.display for item in visible_names(scope, "de")[0]}  # type: ignore[arg-type]
    offered = {
        item.display
        for item in visible_names(scope, "de", checker.hidden_instances(uid(7)))[0]  # type: ignore[arg-type]
    }
    assert "ema20" in everything
    assert "ema20" not in offered
    assert {"Konto", "Order"} <= offered


def test_the_branch_falsch_is_no_use_for_an_instance_found_on_wahr_the_other_way_round() -> None:
    """Counter sample: the instance used on the branch `falsch` only is usable there."""
    strategy = branching()
    strategy.elements[2] = calculation(6, "ja", "TRUE()")
    usage = usage_of(strategy)
    assert (usage.first_use, usage.usable_at) == (uid(7), (uid(7),))
    assert not_usable(strategy) == []


def test_a_loop_back_to_an_element_in_front_of_the_first_use() -> None:
    """trigger 1 → 3 → condition 4 → wahr: 5, falsch: back to 3. The instance is used at 4 and 5."""
    strategy = strategy_with(
        trigger(1),
        calculation(3, "vorn", "1"),
        condition(4, uses(4)),
        calculation(5, "hinten", uses(5)),
        connections=[
            connect(1, "weiter", 3),
            connect(3, "weiter", 4),
            connect(4, "wahr", 5),
            connect(4, "falsch", 3),
        ],
    )
    usage = usage_of(strategy)
    assert (usage.first_use, usage.usable_at) == (uid(4), (uid(4), uid(5)))
    assert not_usable(strategy) == []
    # stored at 5: every way to 4 goes over 3 and 4, but not over 5
    strategy.elements[-1].instance.first_use = uid(5)  # type: ignore[union-attr]
    assert not_usable(strategy) == [(uid(4), I)]


def test_a_loop_that_returns_to_the_first_use_keeps_the_way_over_it() -> None:
    strategy = strategy_with(
        trigger(1),
        calculation(3, "erst", uses(3)),
        condition(4, "TRUE()"),
        calculation(5, "spaeter", uses(5)),
        connections=[
            connect(1, "weiter", 3),
            connect(3, "weiter", 4),
            connect(4, "wahr", 5),
            connect(4, "falsch", 3),
        ],
    )
    assert usage_of(strategy).usable_at == (uid(3), uid(4), uid(5))
    assert not_usable(strategy) == []


def test_two_triggers_reach_the_same_element_over_different_ways() -> None:
    """The second trigger reaches the element 4 without passing 3: a use at 4 is not usable if
    the first use is 3."""
    strategy = strategy_with(
        trigger(1),
        trigger(6),
        calculation(3, "erst", uses(3)),
        calculation(4, "zweit", uses(4)),
        connections=[connect(1, "weiter", 3), connect(3, "weiter", 4), connect(6, "weiter", 4)],
    )
    assert not_usable(strategy) == [(uid(4), I)]


def test_elements_that_no_trigger_reaches_give_no_finding_about_the_way() -> None:
    strategy = strategy_with(
        calculation(3, "frei", uses(3)),
        calculation(4, "auch", uses(4)),
        connections=[connect(3, "weiter", 4)],
    )
    assert only(check_strategy(strategy), fc.INSTANCE_NOT_USABLE) == []
    usage = usage_of(strategy)
    assert usage.first_use == uid(3)
    assert usage.usable_everywhere is True  # the flow does not reach the first use


# --- managements -----------------------------------------------------------------------------


def with_management(*, own_triggers: bool, start: str = "gestellt") -> Strategy:
    """trigger 1 → calculation 3 → order 2; a management of the order 2 with a condition 10 and
    a calculation 11. Without triggers of its own the output `gestellt` leads to 10; with one
    (12) it starts the management. The instance is used at 3 and at 11."""
    elements: list[Element] = [
        trigger(1),
        calculation(3, "haupt", uses(3)),
        place_order(2),
        condition(10, "TRUE()", management_of=uid(2)),
        calculation(11, "verwalten", uses(11), management_of=uid(2)),
    ]
    connections = [connect(1, "weiter", 3), connect(3, "weiter", 2), connect(10, "wahr", 11)]
    if own_triggers:
        elements.append(trigger(12, management_of=uid(2)))
        connections.append(connect(12, "weiter", 10))
    else:
        connections.append(connect(2, start, 10))
    return strategy_with(*elements, connections=connections)


def test_a_management_without_triggers_of_its_own_is_reached_over_its_order() -> None:
    strategy = with_management(own_triggers=False)
    assert not_usable(strategy) == []
    assert usage_of(strategy).usable_at == (uid(3), uid(2), uid(10), uid(11))


def test_a_management_with_triggers_of_its_own_is_reached_over_its_order_as_well() -> None:
    """The management starts at its own trigger, but only after the order has been placed."""
    strategy = with_management(own_triggers=True)
    assert not_usable(strategy) == []
    usage = usage_of(strategy)
    assert set(usage.usable_at) >= {uid(3), uid(2), uid(12), uid(10), uid(11)}
    assert uid(1) not in usage.usable_at


def test_the_main_flow_comes_before_the_managements_for_the_first_use() -> None:
    strategy = with_management(own_triggers=True)
    assert usage_of(strategy).first_use == uid(3)  # not 11
    strategy.elements[1] = calculation(3, "haupt", "1")  # the main flow no longer uses it
    usage = usage_of(strategy)
    assert (usage.first_use, usage.first_use_source) == (uid(11), "flow")
    assert not_usable(strategy) == []


def test_a_use_in_the_main_flow_off_the_way_of_the_order_is_no_use() -> None:
    """The main flow has a branch: the order over `wahr`, a calculation over `falsch` that uses the
    instance. The first use is that calculation (the main flow before the management, 6 after 2 in
    the flow ... the first in the order of the flow), the management is not reached over it."""
    strategy = strategy_with(
        trigger(1),
        condition(5, "TRUE()"),
        place_order(2),
        calculation(6, "daneben", uses(6)),
        condition(10, "TRUE()", management_of=uid(2)),
        calculation(11, "verwalten", uses(11), management_of=uid(2)),
        trigger(12, management_of=uid(2)),
        connections=[
            connect(1, "weiter", 5),
            connect(5, "wahr", 2),
            connect(5, "falsch", 6),
            connect(12, "weiter", 10),
            connect(10, "wahr", 11),
        ],
    )
    assert usage_of(strategy).first_use == uid(6)
    assert not_usable(strategy) == [(uid(11), I)]


def test_an_instance_first_used_in_a_management_is_not_usable_in_the_main_flow() -> None:
    strategy = with_management(own_triggers=True)
    strategy.elements[-1].instance.first_use = uid(11)  # type: ignore[union-attr]
    found = not_usable(strategy)
    assert found == [(uid(3), I)]  # the main flow does not pass the management


def test_an_instance_first_used_in_a_management_is_not_usable_in_another_management() -> None:
    strategy = with_management(own_triggers=False)
    strategy.elements[1] = calculation(3, "haupt", "1")
    strategy.elements += [
        place_order(20),
        trigger(21, management_of=uid(20)),
        calculation(22, "andere", uses(22), management_of=uid(20)),
    ]
    strategy.connections += [connect(11, "weiter", 20), connect(21, "weiter", 22)]
    # the second order hangs in the first management (a management in a management)
    strategy.elements[-3].management_of = uid(2)
    strategy.elements[-2].management_of = uid(20)
    strategy.elements[-1].management_of = uid(20)
    usage = usage_of(strategy)
    assert usage.first_use == uid(11)
    assert not_usable(strategy) == []  # the management of 20 hangs in the one of 2, over 11
    # but a management of the main flow does not
    strategy.elements[-3].management_of = None
    strategy.connections = [item for item in strategy.connections if item.source != uid(11)]
    strategy.connections += [connect(1, "weiter", 20)]
    assert uid(22) in {item[0] for item in not_usable(strategy)}


def test_the_management_of_a_second_order_in_a_management_is_reached_over_the_first_use() -> None:
    strategy = with_management(own_triggers=False)
    strategy.elements[1] = calculation(3, "haupt", "1")
    strategy.elements[-1].instance.first_use = uid(11)  # type: ignore[union-attr]
    strategy.elements.append(place_order(20, management_of=uid(2)))
    strategy.elements.append(trigger(21, management_of=uid(20)))
    strategy.elements.append(calculation(22, "tief", uses(22), management_of=uid(20)))
    strategy.connections += [connect(11, "weiter", 20), connect(21, "weiter", 22)]
    assert not_usable(strategy) == []
    assert usage_of(strategy).usable_at[-1] == uid(22)


# --- rules --------------------------------------------------------------------------------


def test_a_rule_of_an_element_uses_the_instance_at_the_element() -> None:
    strategy = strategy_with(
        trigger(1),
        place_order(2, rules=[rule("pruefung", "ema20.wert > 1")]),
        connections=[connect(1, "weiter", 2)],
    )
    usage = usage_of(strategy)
    assert (usage.first_use, usage.first_use_source) == (uid(2), "flow")
    use = analyze_usage(strategy).elements[0].uses[0]
    assert (use.kind, use.instance) == ("rule", "ema20")


def test_a_rule_of_the_strategy_leads_to_the_first_element_that_takes_rules() -> None:
    strategy = strategy_with(
        trigger(1),
        calculation(3, "rechnen", "1"),
        place_order(2),
        connections=[connect(1, "weiter", 3), connect(3, "weiter", 2)],
    )
    strategy.rules.append(rule("global", "ema20.wert > 1"))
    usage = usage_of(strategy)
    assert (usage.first_use, usage.first_use_source) == (uid(2), "rule")
    assert usage.connected is True
    report = analyze_usage(strategy)
    assert [(item.instance, item.kind) for item in report.strategy_rules] == [("ema20", "rule")]
    assert check_strategy(strategy) == []
    # a rule of the strategy can use every instance, wherever it is usable
    assert only(check_strategy(strategy), fc.INSTANCE_NOT_USABLE) == []


def test_a_rule_of_the_strategy_without_an_element_that_takes_rules_connects_nothing() -> None:
    strategy = strategy_with(
        trigger(1),
        calculation(3, "rechnen", "1"),
        connections=[connect(1, "weiter", 3)],
    )
    strategy.rules.append(rule("global", "ema20.wert > 1"))
    assert usage_of(strategy).first_use is None
    assert only(check_strategy(strategy), fc.INSTANCE_UNCONNECTED)


def test_a_use_in_the_flow_beats_a_rule_of_the_strategy() -> None:
    strategy = straight()
    strategy.rules.append(rule("global", "ema20.wert > 1"))
    assert usage_of(strategy).first_use == uid(3)


# --- instances that use each other -----------------------------------------------------------


def linked(owner_key: str = "ema50", target: str = I) -> Instance:
    return Instance(
        name=owner_key,
        key=owner_key,
        object_type="EMA",
        origin=Origin("EMA"),
        parameter_values={
            "zeiteinheit": fixed("h1"),
            "periode": Binding(BindingKind.CONNECTION, DataLink(target, "wert")),
        },
    )


def test_an_instance_that_only_another_instance_uses_has_the_element_of_that_one() -> None:
    strategy = strategy_with(
        trigger(1),
        calculation(3, "rechnen", "ema50.wert > 1"),
        connections=[connect(1, "weiter", 3)],
    )
    strategy.elements.append(element(21, "EMA", instance=linked()))
    usage = usage_of(strategy)
    assert (usage.first_use, usage.first_use_source) == (uid(3), "instance")
    assert usage_of(strategy, "ema50").first_use_source == "flow"
    assert [item for item in check_strategy(strategy) if item.level is Level.ERROR] == []
    use = next(item for item in analyze_usage(strategy).elements[0].uses if item.instance == I)
    assert (use.kind, use.by_instance) == ("data_link", "ema50")


def test_two_instances_that_use_each_other_are_connected_by_no_one() -> None:
    strategy = Strategy(
        id=uid(900),
        name="Test",
        elements=[
            trigger(1),
            element(E, "EMA", instance=linked(I, "ema50")),
            element(21, "EMA", instance=linked("ema50", I)),
        ],
    )
    found = only(check_strategy(strategy), fc.INSTANCE_UNCONNECTED)
    assert sorted(item.subject or "" for item in found) == ["ema20", "ema50"]


def test_a_use_through_another_instance_is_checked_at_the_element_of_that_one() -> None:
    strategy = strategy_with(
        trigger(1),
        calculation(3, "vorn", "ema50.wert > 1"),
        calculation(4, "hinten", uses(4)),
        connections=[connect(1, "weiter", 3), connect(3, "weiter", 4)],
    )
    strategy.elements.append(element(21, "EMA", instance=linked()))
    strategy.elements[-2].instance.first_use = uid(4)  # type: ignore[union-attr]
    found = only(check_strategy(strategy), fc.INSTANCE_NOT_USABLE)
    assert [(item.element, item.details["by_instance"], item.details["use"]) for item in found] == [
        (uid(3), "ema50", "data_link")
    ]


# --- "Aktualisieren" ---------------------------------------------------------------------------


def test_refresh_at_a_type_that_does_not_offer_it_is_an_error() -> None:
    registry = create_registry(entry_points=False)
    base = series_description(registry)
    registry.register(dataclasses.replace(base, id="Rohreihe", can_refresh=False, methods=()))
    registry.register(base)
    strategy = strategy_with(
        trigger(1),
        place_order(
            2,
            inputs=[
                ElementInput("roh", "wert", refresh=True),
                ElementInput("mit", "wert", refresh=True),
                ElementInput("roh", "wert", refresh=False),
            ],
        ),
        connections=[connect(1, "weiter", 2)],
    )
    strategy.elements.append(
        element(
            30,
            "Rohreihe",
            instance=Instance(
                name="roh",
                key="roh",
                object_type="Rohreihe",
                parameter_values={"zeiteinheit": fixed("h1")},
            ),
        )
    )
    strategy.elements.append(element(31, SERIES, instance=series_instance("mit", "mit")))
    strategy.elements[1].properties["bemerkung"] = expr('"" & roh.wert & mit.wert')
    found = only(Checker(registry).check_strategy(strategy), fc.INPUT_REFRESH_NOT_ALLOWED)
    assert [(item.level, item.element, item.subject) for item in found] == [
        (Level.ERROR, uid(2), "roh")
    ]
    assert found[0].details == {"instance": "roh", "property": "wert", "object_type": "Rohreihe"}


def test_refresh_at_the_delivered_types_is_fine() -> None:
    for object_type, instance_key in (("EMA", "e"), ("ATR", "a"), ("ZigZag", "z")):
        strategy = valid_strategy()
        strategy.elements.append(
            element(
                30,
                object_type,
                instance=Instance(
                    name=instance_key,
                    key=instance_key,
                    object_type=object_type,
                    parameter_values={"zeiteinheit": fixed("h1"), "periode": fixed(5)},
                ),
            )
        )
        prop = "letztes_hoch" if object_type == "ZigZag" else "wert"
        strategy.elements[1].inputs.append(ElementInput(instance_key, prop, refresh=True))
        strategy.elements[1].properties["bemerkung"] = expr(f'"" & {instance_key}.{prop}')
        assert only(check_strategy(strategy), fc.INPUT_REFRESH_NOT_ALLOWED) == [], object_type


def test_an_input_with_a_method_and_refresh_names_the_method() -> None:
    from tests.methods_support import REGISTRY

    strategy = Strategy(
        id=uid(900),
        name="Test",
        elements=[
            trigger(1),
            place_order(
                2,
                inputs=[ElementInput("reihe_a", "wert_vor", InputKind.METHOD, (3,), True)],
                properties={
                    "richtung": fixed("buy"),
                    "volumen": fixed(1.0),
                    "bemerkung": expr('"" & reihe_a.wert_vor(3)'),
                },
            ),
            element(30, SERIES, instance=series_instance()),
        ],
        connections=[connect(1, "weiter", 2)],
    )
    assert Checker(REGISTRY).check_strategy(strategy) == []
    report = analyze_usage(strategy, REGISTRY)
    assert report.instances[0].first_use == uid(2)
    uses_at_order = report.elements[0].uses
    assert [(item.kind, item.members[0].name, item.members[0].kind) for item in uses_at_order] == [
        ("input", "wert_vor", "method"),
        ("expression", "wert_vor", "method"),
    ]
    assert uses_at_order[0].members[0].arguments == (3,)
    assert uses_at_order[0].members[0].refresh is True


# --- `Manuell` ---------------------------------------------------------------------------------


def test_the_trigger_manual_in_a_management_is_an_error() -> None:
    strategy = with_management(own_triggers=True)
    strategy.elements.append(element(40, catalog.TRIGGER_MANUAL, management_of=uid(2)))
    strategy.connections.append(connect(40, "weiter", 10))
    found = only(check_strategy(strategy), fc.TRIGGER_MANUAL_IN_MANAGEMENT)
    assert [(item.level, item.element, item.subject) for item in found] == [
        (Level.ERROR, uid(40), None)
    ]


def test_the_trigger_manual_in_the_main_flow_is_fine() -> None:
    strategy = valid_strategy()
    strategy.elements[0] = element(1, catalog.TRIGGER_MANUAL)
    assert check_strategy(strategy) == []


# --- the report ---------------------------------------------------------------------------------


def test_the_report_lists_what_each_element_uses_in_the_order_of_the_flow() -> None:
    strategy = straight()
    strategy.elements[2].inputs.append(ElementInput(I, "wert", refresh=True))
    report = analyze_usage(strategy)
    assert [item.element for item in report.elements] == [uid(3), uid(4)]
    second = report.elements[1].uses
    assert [(item.kind, item.instance) for item in second] == [
        ("input", I),
        ("expression", I),
    ]
    assert second[0].members[0].refresh is True
    assert second[1].members[0].refresh is False
    assert [(member.name, member.kind) for member in second[1].members] == [("wert", "property")]
    assert report.strategy_rules == ()
    assert report.truncated is False


def test_a_method_in_an_expression_is_listed_as_a_method() -> None:
    from tests.methods_support import REGISTRY

    strategy = Strategy(
        id=uid(900),
        name="T",
        elements=[
            trigger(1),
            calculation(3, "r", "reihe_a.wert_vor(3)"),
            element(30, SERIES, instance=series_instance()),
        ],
        connections=[connect(1, "weiter", 3)],
    )
    report = analyze_usage(strategy, REGISTRY)
    member = report.elements[0].uses[0].members[0]
    assert (member.name, member.kind) == ("wert_vor", "method")


def test_an_instance_inside_another_is_a_use_of_the_other() -> None:
    inner = ema("inner")
    outer = Instance(
        name="Outer",
        key="outer",
        object_type=catalog.TYPE_INDICATOR,
        origin=Origin(catalog.TYPE_INDICATOR),
        parameter_values={"zeiteinheit": fixed("h1")},
        instances=[inner],
    )
    strategy = Strategy(
        id=uid(900),
        name="T",
        elements=[
            trigger(1),
            calculation(3, "r", "outer.inner.wert > 1"),
            calculation(4, "s", "inner.wert > 1"),
            element(30, catalog.TYPE_INDICATOR, instance=outer),
        ],
        connections=[connect(1, "weiter", 3), connect(3, "weiter", 4)],
    )
    report = analyze_usage(strategy)
    assert [item.instance for item in report.instances] == ["outer"]
    assert report.instances[0].first_use == uid(3)
    assert [item.element for item in report.elements] == [uid(3), uid(4)]
    assert [item for item in check_strategy(strategy) if item.level is Level.ERROR] == []


def test_the_report_of_a_strategy_without_instances_is_empty() -> None:
    report = analyze_usage(valid_strategy())
    assert report == UsageReport()


def test_a_strategy_at_the_limit_of_elements_is_analyzed_in_reasonable_time() -> None:
    """A trigger, 499 calculations in a chain, each using one of 500 instances: the dominance
    is computed once, not for each question (a guard against a slow run, no claim about speed)."""
    count = 499
    elements: list[Element] = [trigger(1)]
    connections: list[Connection] = []
    for number in range(count):
        elements.append(calculation(100 + number, f"c{number}", f"i{number}.wert > 1"))
        connections.append(connect(1 if number == 0 else 99 + number, "weiter", 100 + number))
    for number in range(count + 1):
        elements.append(element(1000 + number, "EMA", instance=ema(f"i{number}")))
    strategy = Strategy(id=uid(900), name="Gross", elements=elements, connections=connections)
    assert len(strategy.elements) == 1000
    started = time.perf_counter()
    report = analyze_usage(strategy)
    elapsed = time.perf_counter() - started
    assert len(report.instances) == 500
    assert report.instances[0].first_use == uid(100)
    assert report.instances[count].connected is False  # nobody uses the last one
    assert elapsed < 60
