"""Removing an object with its uses (specification 3.4, 5.4) and JSON Pointers."""

import copy

import pytest

from pipwerk_domain import catalog
from pipwerk_domain.consistency import check_strategy
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.defaults import default_registry
from pipwerk_domain.documents import read_document
from pipwerk_domain.expressions import Scope, analyze
from pipwerk_domain.expressions.slots import replace_names_with_slot
from pipwerk_domain.model import (
    Binding,
    DataLink,
    Element,
    ElementInput,
    Instance,
    Origin,
    Strategy,
)
from pipwerk_domain.namespaces import application_scope, instance_symbol
from pipwerk_domain.operations import (
    Uses,
    remove_element,
    remove_rule,
    remove_strategy_parameter,
    uses_of_element,
    uses_of_rule,
    uses_of_strategy_parameter,
)
from pipwerk_domain.pointers import PointerError, below, pointer, split_pointer
from pipwerk_domain.typedesc import BindingKind
from tests.helpers import ema, only
from tests.paths import TESTCASE_DIRECTORY


def load(name: str) -> Strategy:
    value = read_document((TESTCASE_DIRECTORY / f"{name}.strategy.json").read_text("utf-8"))
    assert isinstance(value, Strategy)
    return value


def element_of(strategy: Strategy, key: str) -> str:
    return next(
        item.id
        for item in strategy.elements
        if item.key == key or (item.instance is not None and item.instance.key == key)
    )


def expressions(strategy: Strategy) -> list[str]:
    found: list[str] = []
    for item in strategy.elements:
        for binding in (*item.parameters.values(), *item.properties.values()):
            if binding.kind is BindingKind.EXPRESSION and isinstance(binding.value, str):
                found.append(binding.value)
    return found


# pointers --------------------------------------------------------------------------------------


def test_a_pointer_is_built_and_split() -> None:
    assert pointer() == ""
    assert pointer("elements", 3, "parameters", "ausdruck", "value") == (
        "/elements/3/parameters/ausdruck/value"
    )
    assert below("/elements/3", "rules", 0) == "/elements/3/rules/0"
    assert pointer("a/b", "c~d") == "/a~1b/c~0d"
    assert split_pointer("/a~1b/c~0d") == ["a/b", "c~d"]
    assert split_pointer("") == []
    assert split_pointer("/") == [""]
    assert split_pointer("/elements/3/rules") == ["elements", "3", "rules"]


@pytest.mark.parametrize("text", ["a", "elements/1", "/a~", "/a~2", "/~"])
def test_a_text_that_is_no_pointer(text: str) -> None:
    with pytest.raises(PointerError):
        split_pointer(text)


# empty places -----------------------------------------------------------------------------------


def test_every_use_of_a_removed_name_becomes_an_empty_place() -> None:
    scope = Scope(application_scope(default_registry(), None))
    scope.add(instance_symbol(default_registry(), ema("ema20")))
    scope.add(instance_symbol(default_registry(), ema("ema50")))
    text = "PREVIOUS(ema20.wert) <= ema50.wert AND ema20.wert > 1"
    del text
    source = "IF(PREVIOUS(EMA20.wert) <= ema50.wert; ema20.wert * 2; Kerze.schluss)"
    changed = replace_names_with_slot(source, scope, ("ema20",))
    assert changed == "IF(PREVIOUS([]) <= ema50.wert; [] * 2; Kerze.schluss)"
    assert analyze(changed, scope).slots != []
    assert replace_names_with_slot(source, scope, ("nope",)) == source
    assert replace_names_with_slot("1 +", scope, ("ema20",)) == "1 +"  # a syntax problem stays
    assert replace_names_with_slot(source, scope, ()) == source
    sub = replace_names_with_slot("ema20.wert + ema20.gibtsnicht", scope, ("ema20", "wert"))
    assert sub == "[] + ema20.gibtsnicht"


# removing a strategy parameter ---


def test_remove_a_strategy_parameter() -> None:
    strategy = load("str-03")
    remove_strategy_parameter(strategy, "stop_abstand")
    assert [item.key for item in strategy.parameters] == ["zeiteinheit"]
    stop = strategy.element(element_of(strategy, "stop"))
    assert stop is not None
    assert stop.parameters["ausdruck"].value == (
        'IF(richtung.ergebnis = "buy"; Kerze.schluss - [] * atr14.wert; '
        "Kerze.schluss + [] * atr14.wert)"
    )
    found = check_strategy(strategy)
    assert {item.code for item in found if item.level.value == "error"} == {fc.EXPRESSION_EMPTY}
    assert len(only(found, fc.EXPRESSION_EMPTY)) == 4  # two in "stop", two in "stop neu"


def test_a_binding_to_a_removed_strategy_parameter_is_not_set() -> None:
    strategy = load("str-03")
    remove_strategy_parameter(strategy, "zeiteinheit")
    trigger = strategy.element(
        next(i.id for i in strategy.elements if i.type == catalog.TRIGGER_CANDLE_CLOSE)
    )
    assert trigger is not None
    assert "zeiteinheit" not in trigger.parameters
    for item in strategy.elements:
        if item.instance is not None:
            assert "zeiteinheit" not in item.instance.parameter_values
    missing = only(check_strategy(strategy), fc.PARAMETER_MISSING)
    assert len(missing) >= 4  # the triggers and the instances need a time unit again


# removing elements ---


def test_remove_an_instance_with_its_uses() -> None:
    strategy = load("str-03")
    before = len(strategy.elements)
    removed = remove_element(strategy, element_of(strategy, "ema20"))
    assert removed == [element_of(load("str-03"), "ema20")]
    assert len(strategy.elements) == before - 1
    crossing = strategy.element(element_of(strategy, "kreuzen"))
    assert crossing is not None
    assert crossing.parameters["ausdruck"].value == (
        "OR(AND(PREVIOUS([]) <= PREVIOUS(ema50.wert); [] > ema50.wert); "
        "AND(PREVIOUS([]) >= PREVIOUS(ema50.wert); [] < ema50.wert))"
    )
    assert [entry.instance for entry in crossing.inputs] == ["ema50"]
    assert all(entry.instance != "ema20" for item in strategy.elements for entry in item.inputs)
    assert len(only(check_strategy(strategy), fc.EXPRESSION_EMPTY)) >= 4


def test_remove_an_instance_that_a_data_connection_uses() -> None:
    strategy = load("str-03")
    order = strategy.element(element_of(strategy, "richtung"))
    assert order is not None
    place = next(item for item in strategy.elements if item.type == catalog.FLOW_PLACE_ORDER)
    place.properties["stop_loss"] = Binding(BindingKind.CONNECTION, DataLink("atr14", "wert"))
    atr = next(item for item in strategy.elements if item.instance and item.instance.key == "atr14")
    atr.instance.parameter_values["periode"] = Binding(  # type: ignore[union-attr]
        BindingKind.CONNECTION, DataLink("ema20", "wert")
    )
    remove_element(strategy, element_of(strategy, "atr14"))
    assert "stop_loss" not in place.properties
    ema20 = next(
        item for item in strategy.elements if item.instance and item.instance.key == "ema20"
    )
    ema20.instance.parameter_values["periode"] = Binding(  # type: ignore[union-attr]
        BindingKind.CONNECTION, DataLink("ema50", "wert")
    )
    remove_element(strategy, element_of(strategy, "ema50"))
    assert "periode" not in ema20.instance.parameter_values  # type: ignore[union-attr]


def test_remove_a_calculation() -> None:
    strategy = load("str-03")
    removed = remove_element(strategy, element_of(strategy, "richtung"))
    assert len(removed) == 1
    place = next(item for item in strategy.elements if item.type == catalog.FLOW_PLACE_ORDER)
    assert place.properties["richtung"].value == "[]"
    stop = strategy.element(element_of(strategy, "stop"))
    assert stop is not None
    assert str(stop.parameters["ausdruck"].value).startswith('IF([] = "buy";')
    assert all(
        item.source != removed[0] and item.target != removed[0] for item in strategy.connections
    )


def test_removing_an_order_takes_its_management_with_it() -> None:
    strategy = load("str-03")
    place = next(item for item in strategy.elements if item.type == catalog.FLOW_PLACE_ORDER)
    members = [item.id for item in strategy.elements if item.management_of == place.id]
    assert len(members) == 7
    removed = remove_element(strategy, place.id)
    assert removed == [place.id, *members]
    assert all(item.management_of is None for item in strategy.elements)
    ids = {item.id for item in strategy.elements}
    assert all(item.source in ids and item.target in ids for item in strategy.connections)
    # the calculations of the management are gone: nothing refers to them any more
    assert not any("stop_neu" in text for text in expressions(strategy))


def test_removing_an_element_takes_it_out_of_its_section_and_collapsed_managements() -> None:
    from pipwerk_domain.model import Section

    strategy = load("str-03")
    place = next(item for item in strategy.elements if item.type == catalog.FLOW_PLACE_ORDER)
    inside = next(item.id for item in strategy.elements if item.management_of == place.id)
    other = element_of(strategy, "kreuzen")
    strategy.sections = [Section("a", None, [other], False), Section("b", place.id, [inside], True)]
    strategy.collapsed_managements = [place.id]
    remove_element(strategy, other)
    assert strategy.sections[0].elements == []
    remove_element(strategy, place.id)
    assert [item.name for item in strategy.sections] == ["a"]
    assert strategy.collapsed_managements == []


def test_remove_an_element_that_does_not_exist() -> None:
    strategy = load("str-03")
    before = copy.deepcopy(strategy)
    assert remove_element(strategy, "00000000-0000-4000-8000-0000000000ff") == []
    assert strategy == before


def test_remove_a_rule() -> None:
    strategy = load("str-03")
    place = next(item for item in strategy.elements if item.type == catalog.FLOW_PLACE_ORDER)
    rule = place.rules[0]
    remove_rule(strategy, rule)
    assert place.rules == []
    risk = strategy.rules[0]
    remove_rule(strategy, risk)
    assert strategy.rules == []
    assert check_strategy(strategy) != []  # the volume is no longer determined


# the uses before a removal ------------------------------------------------------------------------


def shown(strategy: Strategy, uses: Uses) -> list[str | None]:
    """The names of the elements in a list of uses."""
    names: list[str | None] = []
    for item in uses.elements:
        found = strategy.element(item)
        assert found is not None
        names.append(found.shown_name)
    return names


def test_the_uses_of_an_instance_are_the_elements_that_name_it() -> None:
    strategy = load("str-03")
    uses = uses_of_element(strategy, element_of(strategy, "ema20"))
    assert shown(strategy, uses) == ["Kreuzen", "Richtung", "Kreuzen gegen die Position"]
    assert uses.rules == []
    atr = uses_of_element(strategy, element_of(strategy, "atr14"))
    assert shown(strategy, atr) == ["Stop-Loss", "Neuer Stop-Loss"]


def test_the_uses_count_an_input_and_a_data_connection() -> None:
    strategy = load("str-03")
    ema50 = element_of(strategy, "ema50")
    other = next(item for item in strategy.elements if item.shown_name == "Stop-Loss")
    other.inputs.append(ElementInput("ema50", "wert"))
    order = next(item for item in strategy.elements if item.type == catalog.FLOW_PLACE_ORDER)
    order.properties["take_profit"] = Binding(BindingKind.CONNECTION, DataLink("ema50", "wert"))
    uses = uses_of_element(strategy, ema50)
    assert order.id in uses.elements and other.id in uses.elements
    # in the order of the strategy
    assert uses.elements == [item.id for item in strategy.elements if item.id in uses.elements]


def test_the_uses_of_an_instance_include_the_instance_that_binds_to_it() -> None:
    strategy = load("str-03")
    second = next(
        item for item in strategy.elements if item.instance and item.instance.key == "ema50"
    )
    assert second.instance is not None
    second.instance.parameter_values["periode"] = Binding(
        BindingKind.CONNECTION, DataLink("atr14", "wert")
    )
    uses = uses_of_element(strategy, element_of(strategy, "atr14"))
    assert second.id in uses.elements


def test_the_uses_of_a_strategy_parameter() -> None:
    strategy = load("str-03")
    uses = uses_of_strategy_parameter(strategy, "stop_abstand")
    assert shown(strategy, uses) == ["Stop-Loss", "Neuer Stop-Loss"]
    unit = uses_of_strategy_parameter(strategy, "ZEITEINHEIT")  # bindings of the kind parameter
    assert len(unit.elements) == 5  # three instances and the two triggers
    assert uses_of_strategy_parameter(strategy, "gibtesnicht") == Uses()


def test_the_uses_of_a_rule_of_the_strategy_and_the_rules_that_use_it() -> None:
    strategy = load("str-03")
    first = Instance(name="Eins", key="eins", object_type="Regel", expression="Konto.kapital > 0")
    second = Instance(name="Zwei", key="zwei", object_type="Regel", expression="eins.ergebnis")
    strategy.rules += [first, second]
    stop = next(item for item in strategy.elements if item.shown_name == "Stop-Loss")
    stop.parameters["ausdruck"] = Binding(BindingKind.EXPRESSION, "IF(eins.ergebnis; 1; 2)")
    uses = uses_of_rule(strategy, first)
    assert uses == Uses([stop.id], ["zwei"])
    assert uses_of_rule(strategy, second) == Uses()


def test_the_uses_of_an_order_with_its_management_leave_out_the_management() -> None:
    strategy = load("str-03")
    order = next(item for item in strategy.elements if item.type == catalog.FLOW_PLACE_ORDER)
    # the elements of the management use `Stop abstand`, the order uses `stop.ergebnis` etc.; the
    # uses of the calculations in the management come from inside: none counts
    assert uses_of_element(strategy, order.id) == Uses()
    stop_neu = element_of(strategy, "stop_neu")
    assert shown(strategy, uses_of_element(strategy, stop_neu)) == [
        "Stop-Loss verbessert",
        "Position ändern",
    ]


def test_uses_of_something_that_is_not_there_are_empty() -> None:
    strategy = load("str-03")
    assert uses_of_element(strategy, "00000000-0000-4000-8000-0000000000ff") == Uses()


# removing what is inside an instance --------------------------------------------------------------


def test_removing_an_instance_removes_the_uses_of_what_it_contains_too() -> None:
    strategy = load("str-03")
    inner = ema("inner")
    outer = Instance(
        name="Aussen",
        key="aussen",
        object_type=catalog.TYPE_INDICATOR,
        origin=Origin(catalog.TYPE_INDICATOR),
        parameter_values={"zeiteinheit": Binding(BindingKind.FIXED, "h1")},
        instances=[inner],
        rules=[Instance(name="Pr", key="pr", object_type="Regel", expression="TRUE()")],
    )
    holder = Element(
        id="00000000-0000-4000-8000-0000000000aa", type=catalog.TYPE_INDICATOR, instance=outer
    )
    strategy.elements.append(holder)
    strategy.rules.append(
        Instance(
            name="Ausserhalb",
            key="ausserhalb",
            object_type="Regel",
            expression="inner.wert > 1 and pr.ergebnis",
        )
    )
    strategy.rules[-1].expression = "AND(inner.wert > 1; pr.ergebnis)"
    assert uses_of_element(strategy, holder.id) == Uses([], ["ausserhalb"])
    remove_element(strategy, holder.id)
    assert strategy.rules[-1].expression == "AND([] > 1; [])"


def test_removing_an_element_clears_the_first_use_that_names_it() -> None:
    strategy = load("str-03")
    crossing = element_of(strategy, "kreuzen")
    instance = next(
        item for item in strategy.elements if item.instance and item.instance.key == "ema20"
    )
    assert instance.instance is not None and instance.instance.first_use == crossing
    remove_element(strategy, crossing)
    assert instance.instance.first_use is None


def test_removing_a_rule_removes_the_uses_of_the_rules_inside_it() -> None:
    strategy = load("str-03")
    inner = Instance(name="Innen", key="innen", object_type="Regel", expression="TRUE()")
    werk = Instance(
        name="Werk",
        key="werk",
        object_type=catalog.TYPE_RULESET,
        origin=Origin(catalog.TYPE_RULESET),
        rules=[inner],
    )
    outside = Instance(
        name="Aussen", key="aussen", object_type="Regel", expression="innen.ergebnis"
    )
    strategy.rules += [werk, outside]
    remove_rule(strategy, werk)
    assert strategy.rules[-1].expression == "[]"
