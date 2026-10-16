import pytest

from pipwerk_domain import catalog
from pipwerk_domain.defaults import create_registry
from pipwerk_domain.expressions import list_functions
from pipwerk_domain.expressions.functions import find_function
from pipwerk_domain.identifiers import identifier_from_name
from pipwerk_domain.typedesc import (
    TIME_UNITS,
    BindingKind,
    DataType,
    ElementKind,
    Label,
    ObjectCategory,
    TypeDescription,
)

REGISTRY = create_registry(entry_points=False)


def get(type_id: str) -> TypeDescription:
    description = REGISTRY.get(type_id)
    assert description is not None, type_id
    return description


def all_labels(description: TypeDescription) -> list[Label]:
    labels = [description.name, description.description]
    for parameter in description.parameters:
        labels.append(parameter.label)
        labels.extend(choice.label for choice in parameter.choices)
    for prop in description.properties:
        labels.append(prop.label)
        labels.extend(choice.label for choice in prop.choices)
    labels.extend(output.label for output in description.outputs)
    return labels


def test_the_types_of_specification_3_2_are_delivered() -> None:
    triggers = {item.id for item in REGISTRY.list(ElementKind.TRIGGER)}
    assert triggers == {"trigger.candle_close", "trigger.tick"}
    flow = {item.id for item in REGISTRY.list(ElementKind.FLOW)}
    assert flow == {
        "flow.condition",
        "flow.calculation",
        "flow.set_parameter",
        "flow.place_order",
        "flow.modify_order",
        "flow.delete_order",
        "flow.modify_position",
        "flow.close_position",
    }
    orders = [item.id for item in REGISTRY.list(ElementKind.ORDER_TYPE)]
    assert orders == ["MarketOrder", "StopOrder", "LimitOrder", "StopLimitOrder", "CloseOrder"]
    objects = [item.id for item in REGISTRY.list(ElementKind.APPLICATION_OBJECT)]
    assert objects == ["Konto", "Instrument", "Kerze", "Tick", "Order", "Position", "Strategie"]
    types = [item.id for item in REGISTRY.list(ElementKind.OBJECT_TYPE)]
    assert types == ["Indikator", "EMA", "ATR", "Markttechnik", "Trend", "Regel", "Regelwerk"]
    assert [item.id for item in REGISTRY.list(ElementKind.TREND_METHOD)] == [
        catalog.TREND_METHOD_EXPRESSION
    ]


def test_every_type_has_labels_in_german_and_english() -> None:
    for description in REGISTRY.list():
        for label in all_labels(description):
            assert label.de.strip(), description.id
            assert label.en.strip(), description.id
        assert description.name.de
        assert description.description.de, description.id
        assert description.description.en, description.id


def test_identifiers_follow_the_formation_rule() -> None:
    """Identifiers of properties, parameters, outputs and fixed values come from the German
    name (specification 3.1)."""
    for description in REGISTRY.list():
        for parameter in description.parameters:
            assert identifier_from_name(parameter.label.de) == parameter.id, description.id
            # the values of these two come from other registrations and are type identifiers
            if parameter.id not in ("berechnungsverfahren", "ordertyp"):
                for choice in parameter.choices:
                    assert identifier_from_name(choice.label.de) == choice.id
        for prop in description.properties:
            assert identifier_from_name(prop.label.de) == prop.id, description.id
            for choice in prop.choices:
                assert identifier_from_name(choice.label.de) == choice.id
        for output in description.outputs:
            assert identifier_from_name(output.label.de) == output.id


@pytest.mark.parametrize(
    ("type_id", "kind", "outputs", "rules_allowed"),
    [
        ("flow.condition", ElementKind.FLOW, ["wahr", "falsch"], False),
        ("flow.calculation", ElementKind.FLOW, ["weiter"], False),
        ("flow.set_parameter", ElementKind.FLOW, ["weiter"], False),
        ("flow.place_order", ElementKind.FLOW, ["gestellt", "nicht_gestellt"], True),
        ("flow.modify_order", ElementKind.FLOW, ["geaendert", "nicht_geaendert"], True),
        ("flow.delete_order", ElementKind.FLOW, ["weiter"], False),
        ("flow.modify_position", ElementKind.FLOW, ["geaendert", "nicht_geaendert"], True),
        ("flow.close_position", ElementKind.FLOW, ["weiter"], True),
        ("trigger.candle_close", ElementKind.TRIGGER, ["weiter"], False),
        ("trigger.tick", ElementKind.TRIGGER, ["weiter"], False),
    ],
)
def test_elements_of_the_flow(
    type_id: str, kind: ElementKind, outputs: list[str], rules_allowed: bool
) -> None:
    description = get(type_id)
    assert description.kind is kind
    assert [item.id for item in description.outputs] == outputs
    assert description.rules_allowed is rules_allowed
    assert description.on_canvas


def test_trigger_candle_close_has_a_mandatory_time_unit() -> None:
    parameter = get("trigger.candle_close").parameter("zeiteinheit")
    assert parameter is not None
    assert parameter.datatype is DataType.TIME_UNIT
    assert parameter.required
    assert get("trigger.candle_close").name == Label("Kerzenschluss", "Candle close")
    assert get("trigger.tick").name.de == "Tick"
    assert get("trigger.tick").parameters == ()


def test_condition_and_calculation_take_an_expression_only() -> None:
    for type_id in ("flow.condition", "flow.calculation"):
        parameter = get(type_id).parameter("ausdruck")
        assert parameter is not None
        assert parameter.datatype is DataType.EXPRESSION
        assert parameter.required
        assert parameter.bindings == (BindingKind.EXPRESSION,)


def test_modify_order_properties_are_all_optional() -> None:
    description = get("flow.modify_order")
    assert [item.id for item in description.parameters] == [
        "preis",
        "limitpreis",
        "stop_loss",
        "take_profit",
        "gueltigkeit",
        "ablaufzeit",
        "datum",
    ]
    assert not any(item.required for item in description.parameters)
    expiry = description.parameter("ablaufzeit")
    assert expiry is not None
    assert expiry.applies_when is not None
    assert (expiry.applies_when.name, expiry.applies_when.value) == (
        "gueltigkeit",
        "bis_zeitpunkt",
    )
    assert [item.id for item in get("flow.modify_position").parameters] == [
        "stop_loss",
        "take_profit",
    ]
    volume = get("flow.close_position").parameter("volumen")
    assert volume is not None
    assert not volume.required


def test_order_types_and_the_properties_the_application_fills() -> None:
    """Hint S16: each order type says per property whether the user fills it."""
    for type_id in ("MarketOrder", "StopOrder", "LimitOrder", "StopLimitOrder", "CloseOrder"):
        description = get(type_id)
        by_application = {item.id for item in description.properties if not item.set_by_user}
        expected = {"order_id", "status", "konto", "strategie_id"}
        if type_id != "CloseOrder":
            expected.add("instrument")
        if type_id in ("MarketOrder", "CloseOrder"):
            expected.add("preis")
        if type_id == "CloseOrder":
            expected.add("position")
        assert by_application == expected, type_id


def test_properties_of_the_order_types() -> None:
    market = {item.id: item for item in get("MarketOrder").properties}
    assert {"richtung", "volumen", "stop_loss", "take_profit", "instrument"} <= set(market)
    assert market["richtung"].must
    assert not market["stop_loss"].must
    assert [c.id for c in market["richtung"].choices] == ["buy", "sell"]
    assert [c.id for c in market["status"].choices] == [
        "wartend",
        "teilausgefuehrt",
        "ausgefuehrt",
        "geloescht",
        "abgelaufen",
        "abgelehnt",
    ]
    pending = {item.id: item for item in get("StopOrder").properties}
    assert pending["gueltigkeit"].default == "bis_auf_widerruf"
    assert pending["ablaufzeit"].applies_when is not None
    assert "limitpreis" not in pending
    assert get("StopLimitOrder").property("limitpreis") is not None
    assert get("LimitOrder").property("limitpreis") is None
    close = {item.id for item in get("CloseOrder").properties}
    assert "richtung" not in close
    assert "stop_loss" not in close
    assert {"position", "volumen"} <= close
    volume = get("CloseOrder").property("volumen")
    assert volume is not None
    assert not volume.must
    assert not get("CloseOrder").by_user
    assert get("MarketOrder").by_user


def test_objects_of_the_application() -> None:
    assert [item.id for item in get("Konto").properties] == ["kapital", "freie_margin", "waehrung"]
    assert [item.id for item in get("Instrument").properties] == [
        "bezeichnung",
        "tickgroesse",
        "tickwert",
        "punkt",
        "pip",
        "spread",
        "mindestvolumen",
        "volumenschritt",
    ]
    candle = get("Kerze")
    assert [item.id for item in candle.parameters] == ["zeiteinheit"]
    assert [item.id for item in candle.properties] == [
        "eroeffnung",
        "hoch",
        "tief",
        "schluss",
        "volumen",
        "zeitpunkt",
    ]
    assert [item.id for item in get("Tick").properties] == ["geld", "brief", "zeitpunkt"]
    assert [item.id for item in get("Position").properties] == [
        "instrument",
        "richtung",
        "volumen",
        "einstiegspreis",
        "stop_loss",
        "take_profit",
        "offener_gewinn_oder_verlust",
    ]
    for type_id in ("Konto", "Instrument", "Kerze", "Tick"):
        assert get(type_id).on_canvas
    for type_id in ("Order", "Position", "Strategie"):
        assert not get(type_id).on_canvas
    assert get("Strategie").property("wartende_orders") is not None
    assert get("Strategie").property("offene_positionen") is not None


def test_delivered_indicators() -> None:
    ema = get("EMA")
    assert ema.category is ObjectCategory.INDICATOR
    assert [item.id for item in ema.parameters] == [
        "zeiteinheit",
        "periode",
        "verschiebung",
        "kursquelle",
    ]
    assert ema.parameter("verschiebung") is not None
    assert ema.parameter("verschiebung").default == 0  # type: ignore[union-attr]
    assert ema.parameter("kursquelle").default == "schlusskurs"  # type: ignore[union-attr]
    assert [item.id for item in ema.properties] == ["wert"]
    assert [item.id for item in get("ATR").parameters] == ["zeiteinheit", "periode"]
    markttechnik = get("Markttechnik")
    assert [item.id for item in markttechnik.parameters] == [
        "zeiteinheit",
        "depth",
        "deviation",
        "backstep",
    ]
    assert [item.default for item in markttechnik.parameters] == [None, 12, 5, 3]
    assert [item.id for item in markttechnik.properties] == [
        "trendrichtung",
        "trend_intakt",
        "phase",
        "punkt_2",
        "punkt_13",
        "punkt_13_endgueltig",
    ]
    direction = markttechnik.property("trendrichtung")
    assert direction is not None
    assert [c.id for c in direction.choices] == ["aufwaerts", "abwaerts", "kein_trend"]
    phase = markttechnik.property("phase")
    assert phase is not None
    assert [c.id for c in phase.choices] == ["bewegung", "korrektur"]
    assert not phase.must


def test_general_object_types() -> None:
    assert get("Indikator").category is ObjectCategory.INDICATOR
    assert get("Trend").category is ObjectCategory.TREND
    assert get("Regel").category is ObjectCategory.RULE
    assert get("Regelwerk").category is ObjectCategory.RULESET
    trend = get("Trend")
    assert [item.id for item in trend.parameters][:2] == ["zeiteinheit", "berechnungsverfahren"]
    assert trend.property("richtung") is not None
    for type_id in ("Regel", "Regelwerk"):
        assert not get(type_id).on_canvas


def test_time_units_are_all_of_metatrader_5() -> None:
    assert [item.id for item in TIME_UNITS] == [
        "m1", "m2", "m3", "m4", "m5", "m6", "m10", "m12", "m15", "m20", "m30",
        "h1", "h2", "h3", "h4", "h6", "h8", "h12", "d1", "w1", "mn1",
    ]  # fmt: skip
    assert TIME_UNITS[0].label == Label("M1", "M1")


def test_the_named_identifiers_exist() -> None:
    texts = {
        "wahr": get("flow.condition").output("wahr"),
        "nicht_gestellt": get("flow.place_order").output("nicht_gestellt"),
        "geaendert": get("flow.modify_order").output("geaendert"),
        "stop_loss": get("MarketOrder").property("stop_loss"),
        "tickgroesse": get("Instrument").property("tickgroesse"),
        "trend_intakt": get("Markttechnik").property("trend_intakt"),
    }
    assert all(value is not None for value in texts.values())


def test_place_order_offers_the_order_types_a_user_can_choose() -> None:
    place = get("flow.place_order")
    parameter = place.parameter("ordertyp")
    assert parameter is not None
    assert [item.id for item in parameter.choices] == [
        "MarketOrder",
        "StopOrder",
        "LimitOrder",
        "StopLimitOrder",
    ]
    assert parameter.bindings == (BindingKind.FIXED,)


def test_function_list_is_queryable_data() -> None:
    names = [item.name for item in list_functions()]
    assert names == [
        "IF", "AND", "OR", "NOT", "MIN", "MAX", "ABS", "FLOOR", "CEILING",
        "ISNA", "IFNA", "ISBLANK", "PREVIOUS", "TRUE", "FALSE",
    ]  # fmt: skip
    if_signature = find_function("if")
    assert if_signature is not None
    assert if_signature.min_arguments == 2
    assert if_signature.max_arguments == 3
    assert [item.name for item in if_signature.parameters] == ["condition", "then", "else"]
    assert if_signature.result.value == "branches"
    floor = find_function("FLOOR")
    assert floor is not None
    assert (floor.min_arguments, floor.max_arguments) == (2, 2)
    assert floor.result.value == "number"
    variadic = find_function("MAX")
    assert variadic is not None
    assert variadic.max_arguments is None
    assert find_function("NOPE") is None
    for signature in list_functions():
        assert signature.description.de
        assert signature.description.en
