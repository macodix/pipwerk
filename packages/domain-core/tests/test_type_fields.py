"""Fields of the type description for the user interface (specification 3.1): the output with
the management, "benannt", "Strategieparameter" and the time units as ``choices``."""

import logging

import pytest

from pipwerk_domain import catalog
from pipwerk_domain.defaults import create_registry
from pipwerk_domain.registry import ElementRegistry, RegistryError
from pipwerk_domain.typedesc import (
    TIME_UNITS,
    DataType,
    ElementKind,
    Label,
    OutputDescription,
    ParameterDescription,
    PropertyDescription,
    TypeDescription,
)

REGISTRY = create_registry(entry_points=False)
ALL_TYPES = REGISTRY.list()


def label(text: str = "x") -> Label:
    return Label(text, text)


def with_outputs(type_id: str, *outputs: OutputDescription) -> TypeDescription:
    return TypeDescription(type_id, ElementKind.FLOW, label(), label(), outputs=outputs)


class FakeEntryPoint:
    def __init__(self, name: str, loaded: object) -> None:
        self.name = name
        self._loaded = loaded

    def load(self) -> object:
        return self._loaded


# the output with the management ------------------------------------------------------------


def test_only_the_output_placed_of_place_order_holds_the_management() -> None:
    holders = {
        (item.id, output.id)
        for item in ALL_TYPES
        for output in item.outputs
        if output.holds_management
    }
    assert holders == {(catalog.FLOW_PLACE_ORDER, "gestellt")}


def test_place_order_names_its_management_output() -> None:
    place = REGISTRY.get(catalog.FLOW_PLACE_ORDER)
    assert place is not None
    output = place.management_output()
    assert output is not None
    assert output.id == "gestellt"
    assert place.output("nicht_gestellt") is not None
    assert not place.output("nicht_gestellt").holds_management  # type: ignore[union-attr]


def test_other_flow_types_have_no_management_output() -> None:
    for item in ALL_TYPES:
        if item.id != catalog.FLOW_PLACE_ORDER:
            assert item.management_output() is None, item.id


def test_a_type_with_one_management_output_is_registered() -> None:
    registry = ElementRegistry()
    registry.register(
        with_outputs(
            "x.one", OutputDescription("a", label(), True), OutputDescription("b", label())
        )
    )
    found = registry.get("x.one")
    assert found is not None
    assert found.management_output() == OutputDescription("a", label(), True)


def test_a_type_with_two_management_outputs_is_invalid() -> None:
    registry = ElementRegistry()
    invalid = with_outputs(
        "x.two", OutputDescription("a", label(), True), OutputDescription("b", label(), True)
    )
    with pytest.raises(RegistryError):
        registry.register(invalid)
    assert registry.get("x.two") is None


def test_an_entry_point_with_two_management_outputs_is_not_registered(
    caplog: pytest.LogCaptureFixture,
) -> None:
    registry = ElementRegistry()
    invalid = with_outputs(
        "x.two", OutputDescription("a", label(), True), OutputDescription("b", label(), True)
    )
    valid = with_outputs("x.good", OutputDescription("a", label(), True))
    with caplog.at_level(logging.WARNING, logger="pipwerk_domain.registry"):
        report = registry.load_entry_points(
            [FakeEntryPoint("invalid", [valid, invalid]), FakeEntryPoint("good", valid)]
        )
    assert report.failed == ("invalid",)
    assert report.loaded == ("good",)
    assert registry.get("x.two") is None
    assert registry.get("x.good") is not None  # the failing entry point registers nothing else
    assert len(caplog.records) == 1
    assert "RegistryError" in caplog.text
    assert "more than one output" not in caplog.text  # no text of the exception
    assert all(record.exc_info is None for record in caplog.records)


# "benannt" -------------------------------------------------------------------------------------


def test_condition_and_calculation_are_named() -> None:
    named = {item.id for item in ALL_TYPES if item.named}
    assert named == {catalog.FLOW_CONDITION, catalog.FLOW_CALCULATION}


def test_other_flow_elements_are_not_named() -> None:
    for item in ALL_TYPES:
        if item.id not in (catalog.FLOW_CONDITION, catalog.FLOW_CALCULATION):
            assert not item.named, item.id


# "Strategieparameter" -----------------------------------------------------------------------------


def test_only_the_object_strategie_addresses_the_strategy_parameters() -> None:
    found = {item.id for item in ALL_TYPES if item.strategy_parameters}
    assert found == {catalog.OBJECT_STRATEGY}
    strategy = REGISTRY.get(catalog.OBJECT_STRATEGY)
    assert strategy is not None
    assert strategy.kind is ElementKind.APPLICATION_OBJECT


def test_other_objects_of_the_application_have_no_strategy_parameters() -> None:
    others = [
        item
        for item in ALL_TYPES
        if item.kind is ElementKind.APPLICATION_OBJECT and item.id != catalog.OBJECT_STRATEGY
    ]
    assert others
    assert not any(item.strategy_parameters for item in others)


# the defaults ----------------------------------------------------------------------------------


def test_the_new_fields_default_to_not_set() -> None:
    plain = TypeDescription("x.plain", ElementKind.FLOW, label(), label())
    assert plain.named is False
    assert plain.strategy_parameters is False
    assert OutputDescription("a", label()).holds_management is False
    assert plain.management_output() is None


def test_a_type_of_an_entry_point_without_the_fields_is_valid() -> None:
    registry = ElementRegistry()
    plain = with_outputs("x.plain", OutputDescription("weiter", label()))
    report = registry.load_entry_points([FakeEntryPoint("plain", plain)])
    assert report.loaded == ("plain",)
    found = registry.get("x.plain")
    assert found is not None
    assert not found.named
    assert not found.strategy_parameters
    assert found.management_output() is None


# time units as choices ---------------------------------------------------------------------------


def time_unit_fields() -> list[ParameterDescription | PropertyDescription]:
    fields: list[ParameterDescription | PropertyDescription] = []
    for item in ALL_TYPES:
        candidates: list[ParameterDescription | PropertyDescription] = [
            *item.parameters,
            *item.properties,
        ]
        fields += [field for field in candidates if field.datatype is DataType.TIME_UNIT]
    return fields


def test_time_unit_fields_exist_and_name_all_time_units() -> None:
    fields = time_unit_fields()
    assert len(fields) >= 4  # trigger, Kerze, indicators, Trend
    for item in fields:
        assert item.choices == TIME_UNITS, item.id
    ids = [choice.id for choice in TIME_UNITS]
    assert ids[0] == "m1"
    assert ids[-1] == "mn1"
    assert len(ids) == 21
    assert all(choice.label.de == choice.id.upper() for choice in TIME_UNITS)


def test_other_choices_are_not_replaced() -> None:
    place = REGISTRY.get(catalog.FLOW_PLACE_ORDER)
    assert place is not None
    order_type = place.parameter("ordertyp")
    assert order_type is not None
    assert order_type.choices
    assert order_type.choices != TIME_UNITS


def test_a_time_unit_of_an_entry_point_type_names_the_time_units() -> None:
    registry = ElementRegistry()
    registry.register(
        TypeDescription(
            "x.unit",
            ElementKind.TRIGGER,
            label(),
            label(),
            parameters=(ParameterDescription("einheit", DataType.TIME_UNIT, label()),),
            properties=(PropertyDescription("wert", DataType.TIME_UNIT, label()),),
        )
    )
    found = registry.get("x.unit")
    assert found is not None
    assert found.parameters[0].choices == TIME_UNITS
    assert found.properties[0].choices == TIME_UNITS
    assert registry.list()[0].parameters[0].choices == TIME_UNITS
