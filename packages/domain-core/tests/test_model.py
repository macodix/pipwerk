import copy
import uuid

from pipwerk_domain.model import (
    Binding,
    Connection,
    Element,
    Instance,
    Origin,
    ParameterDefinition,
    Section,
    Strategy,
    StrategyParameter,
    Template,
)
from pipwerk_domain.typedesc import BindingKind, DataType
from tests.helpers import ema, fixed, place_order, rule, trigger, uid, valid_strategy


def test_the_model_classes_are_plain_python_classes() -> None:
    for cls in (Strategy, Element, Instance, Template, Binding, Origin):
        assert not hasattr(cls, "model_validate")  # no Pydantic
        assert "pydantic" not in cls.__module__


def test_main_elements_and_managements() -> None:
    strategy = valid_strategy()
    strategy.elements += [
        trigger(3, management_of=uid(2)),
        place_order(4, management_of=uid(2)),
        trigger(5, management_of=uid(4)),
    ]
    assert [item.id for item in strategy.main_elements()] == [uid(1), uid(2)]
    management = strategy.management(uid(2))
    assert management is not None
    assert management.order_element.id == uid(2)
    assert [item.id for item in management.elements] == [uid(3), uid(4)]
    inner = strategy.management(uid(4))
    assert inner is not None
    assert [item.id for item in inner.elements] == [uid(5)]
    assert [item.order_element.id for item in strategy.managements()] == [uid(2), uid(4)]
    assert strategy.management("fehlt") is None
    assert strategy.element("fehlt") is None
    assert strategy.element(uid(1)) is not None


def test_an_order_without_elements_has_an_empty_management() -> None:
    strategy = valid_strategy()
    management = strategy.management(uid(2))
    assert management is not None
    assert management.elements == []
    assert strategy.managements() == []


def test_instances_are_complete_copies_with_their_own_content() -> None:
    original = Instance(
        name="x",
        object_type="Indikator",
        origin=Origin("Indikator", uid(7), "Vorlage"),
        parameter_values={"a": fixed(1)},
        parameters=[ParameterDefinition("p", DataType.NUMBER)],
        instances=[ema("ema20")],
        rules=[rule("r", "TRUE()")],
    )
    copied = copy.deepcopy(original)
    assert copied == original
    copied.instances[0].parameter_values["periode"] = Binding(BindingKind.FIXED, 50)
    copied.origin = None
    assert original.instances[0].parameter_values["periode"].value == 20
    assert original.origin is not None


def test_defaults_are_not_shared() -> None:
    first = Strategy(id="a", name="a")
    second = Strategy(id="b", name="b")
    first.elements.append(Element(id="e", type="t"))
    first.parameters.append(ParameterDefinition("x", DataType.NUMBER))  # type: ignore[arg-type]
    first.sections.append(Section("s"))
    first.collapsed_managements.append("m")
    assert second.elements == []
    assert second.parameters == []
    assert second.sections == []
    assert second.collapsed_managements == []
    one = Instance(name="a", object_type="t")
    two = Instance(name="b", object_type="t")
    one.parameter_values["x"] = fixed(1)
    assert two.parameter_values == {}


def test_a_key_is_formed_from_the_name_when_it_is_not_given() -> None:
    assert Instance(name="EMA 20", object_type="t").key == "ema_20"
    assert Instance(name="EMA 20", key="ema20", object_type="t").key == "ema20"
    assert ParameterDefinition("Stop-Abstand", DataType.NUMBER).key == "stop_abstand"
    assert StrategyParameter("Größe", DataType.NUMBER).key == "groesse"
    assert Element(id="e", type="flow.calculation", name="Neuer Stop").key == "neuer_stop"
    assert Element(id="e", type="flow.condition", name="Ist gut").key == "ist_gut"
    assert Element(id="e", type="trigger.tick", name="Tick").key is None  # no key for a trigger
    assert Element(id="e", type="flow.calculation").key is None


def test_the_name_of_an_element_is_the_name_of_its_instance() -> None:
    plain = Element(id="e", type="flow.calculation", name="Rechnung")
    shown = Element(id="f", type="EMA", instance=Instance(name="EMA 20", object_type="EMA"))
    assert plain.shown_name == "Rechnung"
    assert shown.shown_name == "EMA 20"
    assert Element(id="g", type="x").shown_name is None


def test_a_connection_and_a_section_get_an_identifier() -> None:
    first = Connection("a", "weiter", "b")
    second = Connection("a", "weiter", "b")
    assert first.id != second.id
    assert Section("s").id != Section("s").id
    assert uuid.UUID(first.id).version == 4
    assert Connection("a", "weiter", "b", "x").id == "x"
