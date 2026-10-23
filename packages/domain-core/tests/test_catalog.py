import re

import pytest

from pipwerk_domain import catalog
from pipwerk_domain.defaults import create_registry
from pipwerk_domain.expressions import list_functions
from pipwerk_domain.expressions.functions import find_function
from pipwerk_domain.identifiers import identifier_from_name
from pipwerk_domain.typedesc import (
    APPLICATION_INSTRUMENT,
    TIME_UNITS,
    BindingKind,
    DataType,
    ElementKind,
    Group,
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


def all_explanations(description: TypeDescription) -> list[tuple[str, Label]]:
    """The explanations of a type and of its parameters, properties and outputs."""
    found = [(description.id, description.explanation)]
    found += [(f"{description.id}.{item.id}", item.explanation) for item in description.parameters]
    found += [(f"{description.id}.{item.id}", item.explanation) for item in description.properties]
    found += [(f"{description.id}.{item.id}", item.explanation) for item in description.outputs]
    return found


def test_the_types_of_specification_3_2_are_delivered() -> None:
    triggers = {item.id for item in REGISTRY.list(ElementKind.TRIGGER)}
    assert triggers == {"trigger.candle_close", "trigger.tick", "trigger.manual"}
    flow = {item.id for item in REGISTRY.list(ElementKind.FLOW)}
    assert flow == {
        "flow.condition",
        "flow.calculation",
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
    assert types == [
        "Indikator",
        "EMA",
        "ATR",
        "ZigZag",
        "Trend",
        "Regel",
        "Regelwerk",
    ]
    assert [item.id for item in REGISTRY.list(ElementKind.TREND_METHOD)] == [
        catalog.TREND_METHOD_EXPRESSION
    ]


@pytest.mark.parametrize("type_id", ["Markttechnik", "flow.set_parameter", "trigger.manual_start"])
def test_withdrawn_and_renamed_types_are_not_registered(type_id: str) -> None:
    """ "Parameter setzen" and "Markttechnik" are not delivered (specification 3.2); "Start von
    Hand" is the trigger "Manuell" with a new identifier."""
    assert REGISTRY.get(type_id) is None
    assert type_id not in REGISTRY


def test_every_type_has_labels_in_german_and_english() -> None:
    for description in REGISTRY.list():
        for label in all_labels(description):
            assert label.de.strip(), description.id
            assert label.en.strip(), description.id
        assert description.name.de
        assert description.description.de, description.id
        assert description.description.en, description.id


def test_every_type_parameter_property_and_output_has_an_explanation_in_both_languages() -> None:
    """Specification 3.1: type, parameter, property and output have an explanation."""
    for description in REGISTRY.list():
        for where, explanation in all_explanations(description):
            if description.kind is ElementKind.ORDER_TYPE and "." in where:
                continue  # order types repeat the explanations of their properties
            assert explanation.de.strip(), where
            assert explanation.en.strip(), where
    for description in REGISTRY.list(ElementKind.ORDER_TYPE):
        for item in description.properties:
            assert item.explanation.de.strip(), (description.id, item.id)
            assert item.explanation.en.strip(), (description.id, item.id)


GROUPS = {
    "trigger.candle_close": Group.FLOW,
    "trigger.tick": Group.FLOW,
    "trigger.manual": Group.FLOW,
    "flow.condition": Group.FLOW,
    "flow.calculation": Group.CALCULATION,
    "flow.place_order": Group.ACTIONS,
    "flow.modify_order": Group.ACTIONS,
    "flow.delete_order": Group.ACTIONS,
    "flow.modify_position": Group.ACTIONS,
    "flow.close_position": Group.ACTIONS,
    "Konto": Group.ACCOUNT,
    "Instrument": Group.MARKET,
    "Kerze": Group.MARKET,
    "Tick": Group.MARKET,
    "EMA": Group.INDICATORS,
    "ATR": Group.INDICATORS,
    "ZigZag": Group.INDICATORS,
    "Indikator": Group.INDICATORS,
    "Trend": Group.TRENDS,
    "Regel": Group.RULES,
    "Regelwerk": Group.RULES,
}


def test_the_groups_of_the_element_library_follow_specification_5_2() -> None:
    for description in REGISTRY.list():
        assert description.group == GROUPS.get(description.id), description.id
    assert {item.group for item in REGISTRY.list()} - {None} == set(Group)
    assert [item.value for item in Group] == [
        "flow",
        "calculation",
        "indicators",
        "trends",
        "market",
        "account",
        "actions",
        "rules",
    ]


def test_tick_is_a_trigger_and_an_object_with_different_identifiers_and_kinds() -> None:
    """Specification 5.2: "Tick" stands twice in the element library, as two types."""
    trigger = get("trigger.tick")
    market = get("Tick")
    assert trigger.id != market.id
    assert trigger.kind is ElementKind.TRIGGER
    assert market.kind is ElementKind.APPLICATION_OBJECT
    assert (trigger.group, market.group) == (Group.FLOW, Group.MARKET)


def test_names_are_in_trader_language() -> None:
    names = {item.id: item.name for item in REGISTRY.list()}
    assert names["Indikator"].de == "eigener Indikator"
    assert names["Trend"].de == "eigener Trend"
    assert names["Regel"].de == "eigene Regel"
    assert names["Regelwerk"].de == "eigenes Regelwerk"
    assert names["trigger.manual"] == Label("Manuell", "Manual")


def test_no_text_contains_an_identifier_in_programming_spelling() -> None:
    """Criterion 3: names, labels and explanations are trader language."""
    for description in REGISTRY.list():
        texts = list(all_labels(description))
        texts += [label for _, label in all_explanations(description)]
        for label in texts:
            for text in (label.de, label.en):
                assert "_" not in text, (description.id, text)
                assert not re.search(r"[a-z]\.[a-z]", text), (description.id, text)


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
        ("flow.place_order", ElementKind.FLOW, ["gestellt", "nicht_gestellt"], True),
        ("flow.modify_order", ElementKind.FLOW, ["geaendert", "nicht_geaendert"], True),
        ("flow.delete_order", ElementKind.FLOW, ["weiter"], False),
        ("flow.modify_position", ElementKind.FLOW, ["geaendert", "nicht_geaendert"], True),
        ("flow.close_position", ElementKind.FLOW, ["weiter"], True),
        ("trigger.candle_close", ElementKind.TRIGGER, ["weiter"], False),
        ("trigger.tick", ElementKind.TRIGGER, ["weiter"], False),
        ("trigger.manual", ElementKind.TRIGGER, ["weiter"], False),
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
    assert [item.id for item in get("trigger.tick").parameters] == ["instrument"]
    assert [item.id for item in get("trigger.candle_close").parameters] == [
        "instrument",
        "zeiteinheit",
    ]
    assert get("trigger.manual").parameters == ()
    assert get("trigger.manual").name == Label("Manuell", "Manual")
    assert get("trigger.manual").description.de and get("trigger.manual").explanation.en


def test_the_parameter_instrument_is_preset_with_the_instrument_of_the_application() -> None:
    """Specification 3.1: object of the type Instrument, one fixed value, any binding kind."""
    for type_id in ("trigger.candle_close", "trigger.tick", "Instrument", "Kerze", "Tick", "EMA",
                    "ATR", "ZigZag", "Indikator", "Trend"):  # fmt: skip
        parameter = get(type_id).parameter("instrument")
        assert parameter is not None, type_id
        assert parameter.datatype is DataType.OBJECT
        assert parameter.object_type == "Instrument"
        assert parameter.default == APPLICATION_INSTRUMENT == "instrument_der_anwendung"
        assert [item.id for item in parameter.choices] == ["instrument_der_anwendung"]
        assert parameter.choices[0].label == Label(
            "Instrument der Anwendung", "Instrument of the application"
        )
        assert not parameter.required
        assert set(parameter.bindings) == set(BindingKind)
    for type_id in ("Konto", "Order", "Position", "Strategie", "Regel", "Regelwerk"):
        assert get(type_id).parameter("instrument") is None, type_id
    for type_id in ("MarketOrder", "StopOrder", "LimitOrder", "StopLimitOrder"):
        prop = get(type_id).property("instrument")
        assert prop is not None
        assert prop.set_by_user
        assert prop.default == "instrument_der_anwendung"
        assert prop.object_type == "Instrument"
    assert get("CloseOrder").property("instrument") is None


def test_the_binding_kind_connection_is_offered_except_where_the_specification_excludes_it() -> (
    None
):
    only_expression = {("flow.condition", "ausdruck"), ("flow.calculation", "ausdruck")}
    only_fixed = {("flow.place_order", "ordertyp"), ("Trend", "berechnungsverfahren")}
    for description in REGISTRY.list():
        for parameter in description.parameters:
            where = (description.id, parameter.id)
            if where in only_expression:
                assert parameter.bindings == (BindingKind.EXPRESSION,), where
            elif where in only_fixed:
                assert parameter.bindings == (BindingKind.FIXED,), where
            else:
                assert BindingKind.CONNECTION in parameter.bindings, where
                assert set(parameter.bindings) == set(BindingKind), where


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
    assert [item.id for item in candle.parameters] == ["instrument", "zeiteinheit"]
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
        "instrument",
        "zeiteinheit",
        "periode",
        "verschiebung",
        "anwenden_auf",
    ]
    assert ema.parameter("verschiebung") is not None
    assert ema.parameter("verschiebung").default == 0  # type: ignore[union-attr]
    assert ema.parameter("anwenden_auf").default == "schlusskurs"  # type: ignore[union-attr]
    assert ema.parameter("kursquelle") is None
    assert [item.id for item in ema.properties] == ["wert"]
    assert [item.id for item in get("ATR").parameters] == ["instrument", "zeiteinheit", "periode"]


def test_the_zigzag_has_its_parameters_the_last_highs_and_lows_and_three_turning_points() -> None:
    zigzag = get("ZigZag")
    assert zigzag.category is ObjectCategory.INDICATOR
    assert [(item.id, item.default) for item in zigzag.parameters] == [
        ("instrument", "instrument_der_anwendung"),
        ("zeiteinheit", None),
        ("depth", 12),
        ("deviation", 5),
        ("backstep", 3),
    ]
    assert [item.id for item in zigzag.properties] == [
        "letztes_hoch",
        "vorletztes_hoch",
        "letztes_tief",
        "vorletztes_tief",
        *(
            f"wendepunkt_{number}_{part}"
            for number in (1, 2, 3)
            for part in ("kurs", "art", "endgueltig")
        ),
    ]
    for identifier in ("letztes_hoch", "vorletztes_hoch", "letztes_tief", "vorletztes_tief"):
        prop = zigzag.property(identifier)
        assert prop is not None
        assert prop.datatype is DataType.NUMBER
        assert not prop.must  # empty as long as the ZigZag has not found one
        assert prop.explanation.de.strip()
        assert prop.explanation.en.strip()
    assert zigzag.property("letztes_hoch").label == Label("Letztes Hoch", "Last high")  # type: ignore[union-attr]
    assert zigzag.property("vorletztes_tief").label == Label(  # type: ignore[union-attr]
        "Vorletztes Tief", "Second to last low"
    )
    for number in (1, 2, 3):
        kind = zigzag.property(f"wendepunkt_{number}_art")
        assert kind is not None
        assert kind.datatype is DataType.CHOICE
        assert [item.id for item in kind.choices] == ["hoch", "tief"]
        assert zigzag.property(f"wendepunkt_{number}_kurs").datatype is DataType.NUMBER  # type: ignore[union-attr]
        assert zigzag.property(f"wendepunkt_{number}_endgueltig").datatype is DataType.BOOLEAN  # type: ignore[union-attr]
    assert zigzag.group is Group.INDICATORS


def test_general_object_types() -> None:
    assert get("Indikator").category is ObjectCategory.INDICATOR
    assert get("Trend").category is ObjectCategory.TREND
    assert get("Regel").category is ObjectCategory.RULE
    assert get("Regelwerk").category is ObjectCategory.RULESET
    trend = get("Trend")
    assert [item.id for item in trend.parameters][:3] == [
        "instrument",
        "zeiteinheit",
        "berechnungsverfahren",
    ]
    assert [item.id for item in get("Indikator").parameters] == ["instrument", "zeiteinheit"]
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
        "letztes_hoch": get("ZigZag").property("letztes_hoch"),
    }
    assert all(value is not None for value in texts.values())


CAN_REFRESH = {"EMA", "ATR", "ZigZag", "Indikator", "Trend", "Konto", "Instrument", "Kerze", "Tick"}


def test_refresh_is_offered_for_the_types_of_specification_3_2_and_for_no_other() -> None:
    for description in REGISTRY.list():
        assert description.can_refresh == (description.id in CAN_REFRESH), description.id
    # the object "Tick" and not the trigger "Tick"
    assert get("Tick").can_refresh
    assert not get("trigger.tick").can_refresh


def test_a_template_of_the_user_takes_the_refresh_indication_from_its_object_type() -> None:
    """Specification 3.2: "Indikator" and "Trend" are the object types of templates of the
    user; the template and its instances have the object type and with it the indication."""
    from pipwerk_domain.model import Template

    own_indicator = Template(
        id="00000000-0000-4000-8000-000000000800", name="v", object_type="Indikator"
    )
    own_trend = Template(id="00000000-0000-4000-8000-000000000801", name="t", object_type="Trend")
    rule = Template(id="00000000-0000-4000-8000-000000000802", name="r", object_type="Regel")
    assert REGISTRY.can_refresh(own_indicator.object_type) is True
    assert REGISTRY.can_refresh(own_trend.object_type) is True
    assert REGISTRY.can_refresh(rule.object_type) is False
    assert REGISTRY.can_refresh("EMA") and not REGISTRY.can_refresh("flow.condition")
    assert REGISTRY.can_refresh("Unbekannt") is False
    assert REGISTRY.can_refresh("trigger.tick") is False
    assert REGISTRY.can_refresh("Tick") is True


def test_the_delivered_types_have_no_methods() -> None:
    for description in REGISTRY.list():
        assert description.methods == (), description.id


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
        assert signature.label.de
        assert signature.label.en
        assert signature.explanation.de
        assert signature.explanation.en
        for argument in signature.parameters:
            assert argument.label.de
            assert argument.label.en
            assert argument.explanation.de
            assert argument.explanation.en
        for text in (signature.label, signature.explanation):
            assert "_" not in text.de
            assert "_" not in text.en
    previous = find_function("previous")
    assert previous is not None
    assert previous.label.de == "vorheriger Wert von"
