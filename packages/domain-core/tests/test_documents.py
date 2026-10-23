"""Documents of the format 2.0 (specification 3.7): writing and reading, strict models, limits."""

import json
from typing import Any

import pytest

from pipwerk_domain import catalog, limits
from pipwerk_domain.documents import (
    DOCUMENT_MODELS,
    FORMAT_VERSION,
    DocumentError,
    IndicatorDocument,
    RuleDocument,
    RulesetDocument,
    StrategyDocument,
    TrendDocument,
    parse_document,
    read_document,
    write_document,
)
from pipwerk_domain.model import (
    Binding,
    Comparison,
    Connection,
    DataLink,
    Element,
    ElementInput,
    InputKind,
    Instance,
    Orientation,
    Origin,
    ParameterDefinition,
    Position,
    PropertyDefinition,
    Section,
    Strategy,
    StrategyParameter,
    Template,
)
from pipwerk_domain.risk_rule import risk_per_trade_instance, risk_per_trade_template
from pipwerk_domain.typedesc import BindingKind, DataType
from tests.helpers import (
    calculation,
    connect,
    ema,
    expr,
    fixed,
    param,
    place_order,
    rule,
    ruleset,
    template,
    trigger,
    uid,
)

UUID = uid(1)


def strategy_dict(**changes: Any) -> dict[str, Any]:
    data: dict[str, Any] = {
        "format": "pipwerk.strategy",
        "format_version": "2.0",
        "id": UUID,
        "name": "t",
    }
    data.update(changes)
    return data


def template_dict(format_name: str, object_type: Any, **changes: Any) -> dict[str, Any]:
    data: dict[str, Any] = {
        "format": format_name,
        "format_version": "2.0",
        "id": UUID,
        "name": "t",
        "object_type": object_type,
    }
    data.update(changes)
    return data


def instance_dict(name: str = "i", **changes: Any) -> dict[str, Any]:
    data: dict[str, Any] = {"name": name, "key": name, "object_type": "EMA"}
    data.update(changes)
    return data


def element_dict(number: int = 2, **changes: Any) -> dict[str, Any]:
    data: dict[str, Any] = {"id": uid(number), "type": "flow.delete_order"}
    data.update(changes)
    return data


def connection_dict(source: int = 1, target: int = 2, number: int = 50) -> dict[str, Any]:
    return {"id": uid(number), "source": uid(source), "output": "weiter", "target": uid(target)}


def rejects(data: dict[str, Any]) -> None:
    with pytest.raises(DocumentError):
        parse_document(data)
    with pytest.raises(DocumentError):
        parse_document(json.dumps(data))
    with pytest.raises(DocumentError):
        read_document(json.dumps(data).encode())


def accepts(data: dict[str, Any]) -> None:
    from_dict = parse_document(data)
    from_text = parse_document(json.dumps(data))
    from_bytes = parse_document(json.dumps(data).encode())
    assert from_dict == from_text == from_bytes


# writing and reading -----------------------------------------------------------------------


def full_strategy() -> Strategy:
    order = place_order(
        2,
        properties={
            "richtung": expr('IF(wert.ergebnis > 1; "buy"; "sell")'),
            "volumen": fixed(1.5),
            "instrument": fixed("EURUSD"),
        },
        name="Order",
        rules=[rule("mindestvolumen", "Order.volumen >= Order.instrument.mindestvolumen")],
        inputs=[
            ElementInput("ema21", "wert"),
            ElementInput("ema21", "wert", refresh=True),
            ElementInput("ema21", "vorheriger_wert", InputKind.METHOD, (3, "h1", True, 2.5)),
            ElementInput("ema20", "abstand", InputKind.METHOD, (), True),
        ],
    )
    return Strategy(
        id=uid(900),
        name="Strategie ü ä ß Anführung",
        description="Beschreibung\nmit Zeilenumbruch",
        parameters=[
            StrategyParameter("zeit", DataType.TIME_UNIT, "h1"),
            StrategyParameter("faktor", DataType.NUMBER, 2.5),
            StrategyParameter("modus", DataType.CHOICE, "a", choices=("a", "b")),
            StrategyParameter("offen", DataType.INTEGER, at_application=True),
            StrategyParameter("an", DataType.BOOLEAN, True),
            StrategyParameter(
                "Filter-Instrument", DataType.OBJECT, "GBPUSD", object_type="Instrument"
            ),
        ],
        rules=[
            risk_per_trade_instance("risiko"),
            ruleset(
                "werk",
                [rule("a", "Konto.kapital > 0"), rule("b", "a.ergebnis")],
                result_expression="AND(a.ergebnis; b.ergebnis)",
            ),
        ],
        elements=[
            trigger(1, position=Position(10.5, -3.0), name="Auslöser"),
            order,
            calculation(3, "wert", "1 + 1", position=Position(1, 2)),
            Element(
                id=uid(4),
                type="EMA",
                instance=ema("ema21", 21),
            ),
            Element(
                id=uid(5),
                type="Trend",
                instance=Instance(
                    name="Trend H1",
                    key="trend_h1",
                    object_type="Trend",
                    origin=Origin("Trend", uid(777), "Mein Trend"),
                    parameter_values={
                        "zeiteinheit": param("zeiteinheit"),
                        "berechnungsverfahren": fixed("trend_method.expression"),
                        "instrument": Binding(BindingKind.CONNECTION, DataLink("ema21", "wert")),
                    },
                    parameters=[
                        ParameterDefinition("Faktor", DataType.NUMBER, True, 2, ()),
                        ParameterDefinition("Modus", DataType.CHOICE, False, "a", ("a", "b")),
                    ],
                    properties=[
                        PropertyDefinition("Richtung", DataType.TEXT, '"aufwaerts"'),
                        PropertyDefinition("Wahl", DataType.CHOICE, '"a"', ("a", "b")),
                    ],
                    instances=[ema("ema20")],
                    rules=[rule("r", "TRUE()", comparison=Comparison.EQUAL)],
                ),
            ),
            Element(
                id=uid(6),
                type="flow.delete_order",
                management_of=uid(2),
                properties={"x": Binding(BindingKind.APPLICATION)},
            ),
        ],
        connections=[connect(1, "weiter", 2), connect(1, "weiter", 3)],
        sections=[
            Section("Abschnitt", None, [uid(3)], True),
            Section("Verwaltung", uid(2), [uid(6)], False),
        ],
        orientation=Orientation.HORIZONTAL,
        collapsed_managements=[uid(2)],
    )


def test_strategy_round_trip() -> None:
    original = full_strategy()
    text = write_document(original)
    assert read_document(text) == original
    assert read_document(text.encode()) == original
    assert write_document(read_document(text)) == text  # writing is stable


def test_strategy_with_the_risk_rule_round_trip() -> None:
    original = Strategy(id=uid(900), name="t", rules=[risk_per_trade_instance("risiko", 0.02)])
    assert read_document(write_document(original)) == original


@pytest.mark.parametrize(
    "value",
    [
        template(catalog.TYPE_INDICATOR, parameter_values={"x": fixed(1)}),
        template(
            catalog.TYPE_INDICATOR,
            description="Beschreibung",
            parameters=[ParameterDefinition("P", DataType.PERCENT, True, 0.01, ())],
            properties=[PropertyDefinition("E", DataType.NUMBER, "p * 2")],
            instances=[ema("ema20")],
            rules=[rule("r", "TRUE()")],
        ),
        template(
            "EMA",
            parameter_values={"zeiteinheit": fixed("h1"), "periode": fixed(20)},
        ),
        template(
            catalog.TYPE_TREND,
            parameter_values={
                "zeiteinheit": fixed("h1"),
                "berechnungsverfahren": fixed("trend_method.expression"),
            },
            instances=[ema("ema20")],
            properties=[PropertyDefinition("Richtung", DataType.TEXT, '"aufwaerts"')],
        ),
        template(
            catalog.TYPE_RULE,
            parameters=[ParameterDefinition("G", DataType.NUMBER, True, 5, ())],
            expression="Order.volumen <= g",
            determined_property="volumen",
            comparison=Comparison.AT_LEAST,
        ),
        template(
            catalog.TYPE_RULESET,
            rules=[rule("a", "TRUE()"), rule("b", "a.ergebnis")],
            result_expression="b.ergebnis",
        ),
        risk_per_trade_template(),
    ],
    ids=[
        "indicator-empty",
        "indicator-full",
        "delivered-indicator",
        "trend",
        "rule",
        "ruleset",
        "risk",
    ],
)
def test_template_round_trip(value: Template) -> None:
    text = write_document(value)
    assert read_document(text) == value


def test_the_format_follows_the_object_type() -> None:
    formats = {
        catalog.TYPE_INDICATOR: ("pipwerk.indicator", IndicatorDocument),
        "EMA": ("pipwerk.indicator", IndicatorDocument),
        "Unbekannt": ("pipwerk.indicator", IndicatorDocument),
        catalog.TYPE_TREND: ("pipwerk.trend", TrendDocument),
        catalog.TYPE_RULE: ("pipwerk.rule", RuleDocument),
        catalog.TYPE_RULESET: ("pipwerk.ruleset", RulesetDocument),
    }
    for object_type, (format_name, model) in formats.items():
        text = write_document(template(object_type))
        data = json.loads(text)
        assert data["format"] == format_name
        assert data["format_version"] == FORMAT_VERSION == "2.0"
        assert isinstance(parse_document(text), model)
    assert set(DOCUMENT_MODELS) == {
        "pipwerk.strategy",
        "pipwerk.indicator",
        "pipwerk.trend",
        "pipwerk.rule",
        "pipwerk.ruleset",
    }


def test_the_written_text_is_json_with_the_head_first_and_a_final_line_feed() -> None:
    text = write_document(full_strategy())
    assert text.endswith("}\n")
    data = json.loads(text)
    assert list(data)[:5] == ["format", "format_version", "id", "name", "description"]
    assert "ü ä ß" in text  # no escaping of non-ASCII characters
    template_data = json.loads(write_document(risk_per_trade_template()))
    assert list(template_data)[:6] == [
        "format",
        "format_version",
        "id",
        "name",
        "description",
        "object_type",
    ]
    instance = data["rules"][0]
    assert list(instance)[:4] == ["name", "key", "object_type", "origin"]
    assert "title" not in data
    assert data["orientation"] == "horizontal"
    assert data["sections"][0]["collapsed"] is True
    assert data["collapsed_managements"] == [uid(2)]


def test_the_fields_of_the_format_two_are_written() -> None:
    data = json.loads(write_document(full_strategy()))
    order = data["elements"][1]
    assert order["inputs"] == [
        {
            "instance": "ema21",
            "property": "wert",
            "kind": "property",
            "arguments": [],
            "refresh": False,
        },
        {
            "instance": "ema21",
            "property": "wert",
            "kind": "property",
            "arguments": [],
            "refresh": True,
        },
        {
            "instance": "ema21",
            "property": "vorheriger_wert",
            "kind": "method",
            "arguments": [3, "h1", True, 2.5],
            "refresh": False,
        },
        {
            "instance": "ema20",
            "property": "abstand",
            "kind": "method",
            "arguments": [],
            "refresh": True,
        },
    ]
    assert order["name"] == "Order"
    assert data["elements"][0]["position"] == {"x": 10.5, "y": -3.0}
    assert data["elements"][1]["position"] is None
    assert data["elements"][3]["name"] is None  # an element with an instance has no name
    assert data["elements"][2]["key"] == "wert"
    binding = data["elements"][4]["instance"]["parameter_values"]["instrument"]
    assert binding == {"kind": "connection", "value": {"instance": "ema21", "property": "wert"}}
    assert data["elements"][4]["instance"]["origin"] == {
        "object_type": "Trend",
        "template_id": uid(777),
        "template_name": "Mein Trend",
    }
    assert all(set(item) == {"id", "source", "output", "target"} for item in data["connections"])
    assert data["parameters"][5]["object_type"] == "Instrument"


def test_the_input_of_every_kind_is_written_and_read_again() -> None:
    original = full_strategy()
    result = read_document(write_document(original))
    assert isinstance(result, Strategy)
    assert result == original
    inputs = result.elements[1].inputs
    assert [(item.kind, item.arguments, item.refresh) for item in inputs] == [
        (InputKind.PROPERTY, (), False),
        (InputKind.PROPERTY, (), True),
        (InputKind.METHOD, (3, "h1", True, 2.5), False),
        (InputKind.METHOD, (), True),
    ]
    assert [type(value) for value in inputs[2].arguments] == [int, str, bool, float]


def test_a_document_without_the_indications_of_an_input_is_read_as_a_property() -> None:
    """Specification 3.7: ``kind`` is ``property``, ``arguments`` empty and ``refresh`` false in a
    document of the format 2.0 that has none of these indications."""
    data = strategy_dict(
        elements=[element_dict(inputs=[{"instance": "ema21", "property": "wert"}])]
    )
    value = read_document(json.dumps(data))
    assert isinstance(value, Strategy)
    assert value.elements[0].inputs == [ElementInput("ema21", "wert")]
    assert (value.elements[0].inputs[0].kind, value.elements[0].inputs[0].arguments) == (
        InputKind.PROPERTY,
        (),
    )
    assert value.elements[0].inputs[0].refresh is False


def test_an_input_of_a_method_names_the_values_of_its_arguments() -> None:
    entry = {
        "instance": "ema21",
        "property": "vorheriger_wert",
        "kind": "method",
        "arguments": [3, "h1"],
        "refresh": True,
    }
    value = read_document(json.dumps(strategy_dict(elements=[element_dict(inputs=[entry])])))
    assert isinstance(value, Strategy)
    assert value.elements[0].inputs == [
        ElementInput("ema21", "vorheriger_wert", InputKind.METHOD, (3, "h1"), True)
    ]


@pytest.mark.parametrize(
    "entry",
    [
        {"instance": "a", "property": "b", "kind": "other"},
        {"instance": "a", "property": "b", "kind": "property", "arguments": [1]},
        {"instance": "a", "property": "b", "kind": "method", "arguments": [None]},
        {"instance": "a", "property": "b", "kind": "method", "arguments": [[1]]},
        {"instance": "a", "property": "b", "kind": "method", "arguments": {"x": 1}},
        {"instance": "a", "property": "b", "refresh": "ja"},
        {"instance": "a", "property": "b", "refresh": 1},
        {"instance": "a", "property": "b", "kind": "method", "arguments": [float("inf")]},
        {"instance": "a", "property": "b", "kind": "method", "arguments": [0] * 21},
    ],
)
def test_an_input_that_does_not_fit_the_format_is_rejected(entry: dict[str, Any]) -> None:
    rejects(strategy_dict(elements=[element_dict(inputs=[entry])]))


def test_the_former_identifier_of_the_manual_trigger_is_read_as_manuell() -> None:
    """Specification 3.7: a trigger with the identifier of "Start von Hand" is read as ``Manuell``;
    a document of the format 2.0 that was written earlier is changed this way too."""
    data = strategy_dict(
        elements=[
            element_dict(id=uid(1), type="trigger.manual_start"),
            element_dict(id=uid(2), type="trigger.manual"),
            element_dict(id=uid(3), type="trigger.manual_starts"),
        ]
    )
    document = parse_document(data)
    assert isinstance(document, StrategyDocument)
    assert [item.type for item in document.elements] == [
        "trigger.manual",
        "trigger.manual",
        "trigger.manual_starts",  # no other identifier is changed
    ]
    value = read_document(json.dumps(data))
    assert isinstance(value, Strategy)
    assert [item.type for item in value.elements][:2] == ["trigger.manual", "trigger.manual"]
    assert "manual_start" not in write_document(value).replace("manual_starts", "")


def test_the_instance_has_the_element_of_its_first_use() -> None:
    """The field ``first_use`` is the identifier of an element or ``null`` (specification 3.3)."""
    instance = ema("ema21", 21)
    instance.first_use = uid(2)
    original = Strategy(
        id=uid(900),
        name="t",
        elements=[Element(id=uid(4), type="EMA", instance=instance), place_order(2)],
    )
    text = write_document(original)
    data = json.loads(text)
    assert data["elements"][0]["instance"]["first_use"] == uid(2)
    result = read_document(text)
    assert isinstance(result, Strategy)
    assert result.elements[0].instance is not None
    assert result.elements[0].instance.first_use == uid(2)
    assert result == original
    plain = read_document(write_document(full_strategy()))
    assert isinstance(plain, Strategy)
    assert plain.elements[3].instance is not None
    assert plain.elements[3].instance.first_use is None
    assert json.loads(write_document(plain))["elements"][3]["instance"]["first_use"] is None


@pytest.mark.parametrize("value", ["kein-uuid", 5, True, ""])
def test_a_first_use_that_is_no_identifier_is_rejected(value: object) -> None:
    rejects(
        strategy_dict(
            elements=[element_dict(instance=instance_dict(first_use=value))],
        )
    )


def test_numbers_keep_their_kind() -> None:
    original = Strategy(
        id=uid(900),
        name="t",
        parameters=[
            StrategyParameter("a", DataType.NUMBER, 1),
            StrategyParameter("b", DataType.NUMBER, 1.0),
            StrategyParameter("c", DataType.NUMBER, 0.01),
        ],
    )
    result = read_document(write_document(original))
    assert isinstance(result, Strategy)
    assert [type(item.value) for item in result.parameters] == [int, float, float]
    assert result == original


# strict models -------------------------------------------------------------------------------


def parameter_dict(**changes: Any) -> dict[str, Any]:
    data: dict[str, Any] = {"key": "a", "name": "A", "datatype": "number"}
    data.update(changes)
    return data


@pytest.mark.parametrize(
    "data",
    [
        strategy_dict(extra=1),
        strategy_dict(parameters=[parameter_dict(extra=1)]),
        strategy_dict(rules=[instance_dict(extra=1)]),
        strategy_dict(rules=[instance_dict(origin={"object_type": "EMA", "extra": 1})]),
        strategy_dict(
            rules=[instance_dict(parameter_values={"a": {"kind": "fixed", "value": 1, "extra": 1}})]
        ),
        strategy_dict(rules=[instance_dict(parameters=[parameter_dict(extra=1)])]),
        strategy_dict(
            rules=[
                instance_dict(
                    properties=[parameter_dict(expression="1", extra=1)],
                )
            ]
        ),
        strategy_dict(elements=[element_dict(extra=1)]),
        strategy_dict(elements=[element_dict(instance=instance_dict(extra=1))]),
        strategy_dict(elements=[element_dict(rules=[instance_dict(extra=1)])]),
        strategy_dict(elements=[element_dict(position={"x": 1, "y": 2, "z": 3})]),
        strategy_dict(elements=[element_dict(inputs=[{"instance": "a", "property": "b", "x": 1}])]),
        strategy_dict(
            parameters=[{"key": "a", "name": "A", "datatype": "number", "title": "x"}],
        ),
        strategy_dict(
            elements=[
                element_dict(
                    parameters={
                        "a": {
                            "kind": "connection",
                            "value": {"instance": "a", "property": "b", "x": 1},
                        }
                    }
                )
            ]
        ),
        strategy_dict(connections=[{**connection_dict(), "extra": 1}]),
        strategy_dict(sections=[{"id": uid(60), "name": "s", "extra": 1}]),
        strategy_dict(title="alt"),  # the field of the format 1.0
        template_dict("pipwerk.indicator", "Indikator", extra=1),
        template_dict("pipwerk.trend", "Trend", extra=1),
        template_dict("pipwerk.rule", "Regel", extra=1),
        template_dict("pipwerk.ruleset", "Regelwerk", extra=1),
    ],
)
def test_an_additional_field_is_rejected(data: dict[str, Any]) -> None:
    rejects(data)


def test_a_missing_required_field_is_rejected() -> None:
    for key in ("id", "name"):
        data = strategy_dict()
        del data[key]
        rejects(data)
    rejects(strategy_dict(elements=[{"id": uid(2)}]))
    rejects(strategy_dict(connections=[{"source": uid(1)}]))
    rejects(strategy_dict(connections=[{"source": uid(1), "output": "a", "target": uid(2)}]))
    rejects(strategy_dict(rules=[{"name": "a"}]))
    rejects(strategy_dict(parameters=[{"name": "a", "datatype": "number"}]))  # no key
    rejects(strategy_dict(sections=[{"name": "s"}]))
    rejects(template_dict("pipwerk.rule", "Regel", id=None))


def test_the_head_fields_are_required() -> None:
    for key in ("format", "format_version"):
        data = strategy_dict()
        del data[key]
        rejects(data)
    data = template_dict("pipwerk.rule", "Regel")
    del data["format_version"]
    rejects(data)
    data = template_dict("pipwerk.rule", "Regel")
    del data["object_type"]
    rejects(data)
    data = template_dict("pipwerk.indicator", "Indikator")
    del data["object_type"]
    rejects(data)


def test_a_position_may_be_whole_numbers_or_missing() -> None:
    accepts(strategy_dict(elements=[element_dict(position={"x": 5, "y": -3})]))
    accepts(strategy_dict(elements=[element_dict(position={"x": 5.5, "y": -3.25})]))
    accepts(strategy_dict(elements=[element_dict(position=None)]))
    accepts(strategy_dict(elements=[element_dict()]))


def test_a_minimal_document_with_defaults_is_accepted() -> None:
    accepts(strategy_dict())
    accepts(template_dict("pipwerk.indicator", "Indikator"))
    document = parse_document(strategy_dict())
    assert isinstance(document, StrategyDocument)
    assert document.elements == []
    assert document.description == ""
    assert document.sections == []
    assert document.orientation == "vertical"
    assert document.collapsed_managements == []


@pytest.mark.parametrize(
    "data",
    [
        strategy_dict(name=5),
        strategy_dict(id="nicht-uuid"),
        strategy_dict(id="ABCDEF00-0000-4000-8000-000000000001"),
        strategy_dict(elements=[element_dict(position={"x": "1", "y": 2})]),
        strategy_dict(elements=[element_dict(id=5)]),
        strategy_dict(elements=[element_dict(management_of="x")]),
        strategy_dict(elements=[element_dict(parameters={"a": 1})]),
        strategy_dict(elements=[element_dict(parameters={"a": {"kind": "other"}})]),
        strategy_dict(parameters=[parameter_dict(datatype="color")]),
        strategy_dict(parameters=[parameter_dict(at_application="yes")]),
        strategy_dict(parameters=[parameter_dict(key="mit Blank")]),
        strategy_dict(parameters=[parameter_dict(key="1a")]),
        strategy_dict(parameters=[parameter_dict(key="größe")]),
        strategy_dict(parameters=[parameter_dict(key="")]),
        strategy_dict(rules=[instance_dict(key="a b")]),
        strategy_dict(rules=[instance_dict(comparison="groesser")]),
        strategy_dict(rules=[instance_dict(expression=5)]),
        strategy_dict(rules=[instance_dict(origin={"object_type": "Regel", "template_id": "x"})]),
        strategy_dict(connections=[{**connection_dict(), "source": "x"}]),
        strategy_dict(connections=[{**connection_dict(), "id": "x"}]),
        strategy_dict(orientation="diagonal"),
        strategy_dict(collapsed_managements=["x"]),
        strategy_dict(sections=[{"id": uid(60), "name": "s", "flow": "x"}]),
        strategy_dict(sections=[{"id": uid(60), "name": "s", "elements": ["x"]}]),
        strategy_dict(sections=[{"id": uid(60), "name": "s", "collapsed": 1}]),
        strategy_dict(format="pipwerk.other"),
        strategy_dict(format="pipwerk.rule", elements=[]),  # the fields of another format
        template_dict("pipwerk.trend", "Regel"),
        template_dict("pipwerk.rule", "Trend"),
        template_dict("pipwerk.ruleset", "Regel"),
        template_dict("pipwerk.indicator", 5),
        {"format_version": "2.0"},
        [],
    ],
)
def test_wrong_values_are_not_converted(data: Any) -> None:
    if isinstance(data, dict):
        rejects(data)
    else:
        with pytest.raises(DocumentError):
            parse_document(data)


def test_values_are_not_converted_from_text() -> None:
    rejects(strategy_dict(elements=[element_dict(position={"x": "1.5", "y": 1})]))
    rejects(
        strategy_dict(parameters=[parameter_dict(datatype="boolean", value=1, at_application=0)])
    )
    rejects(strategy_dict(name=None))


def test_an_element_with_an_instance_has_no_name_and_no_key_of_its_own() -> None:
    rejects(strategy_dict(elements=[element_dict(name="x", instance=instance_dict())]))
    rejects(strategy_dict(elements=[element_dict(key="x", instance=instance_dict())]))
    accepts(strategy_dict(elements=[element_dict(instance=instance_dict())]))
    accepts(strategy_dict(elements=[element_dict(name="x", key="x")]))


def test_keys_and_names_have_a_length_limit() -> None:
    assert limits.MAX_NAME_LENGTH == limits.MAX_KEY_LENGTH == 200
    accepts(strategy_dict(name="n" * 200))
    rejects(strategy_dict(name="n" * 201))
    accepts(strategy_dict(parameters=[parameter_dict(key="k" * 200, name="n" * 200)]))
    rejects(strategy_dict(parameters=[parameter_dict(key="k" * 201)]))
    rejects(strategy_dict(parameters=[parameter_dict(name="n" * 201)]))
    rejects(strategy_dict(elements=[element_dict(name="n" * 201)]))
    rejects(strategy_dict(sections=[{"id": uid(60), "name": "n" * 201}]))
    rejects(template_dict("pipwerk.rule", "Regel", name="n" * 201))
    accepts(template_dict("pipwerk.rule", "Regel", name="Ä ü-ß [x] ö" * 10))


def test_names_are_free_text() -> None:
    document = parse_document(
        strategy_dict(
            name="Mein Trend – H1 (neu)",
            parameters=[parameter_dict(name="Stop-Abstand [Pips]")],
        )
    )
    assert isinstance(document, StrategyDocument)
    assert document.parameters[0].name == "Stop-Abstand [Pips]"


@pytest.mark.parametrize(
    "binding",
    [
        {"kind": "fixed"},
        {"kind": "fixed", "value": None},
        {"kind": "fixed", "value": {"instance": "a", "property": "b"}},
        {"kind": "parameter"},
        {"kind": "parameter", "value": 5},
        {"kind": "expression"},
        {"kind": "expression", "value": 5},
        {"kind": "connection"},
        {"kind": "connection", "value": "a.b"},
        {"kind": "connection", "value": {"instance": "a"}},
        {"kind": "connection", "value": {"instance": "mit Blank", "property": "b"}},
        {"kind": "application", "value": "x"},
        {"value": 1},
    ],
)
def test_a_binding_needs_the_value_its_kind_requires(binding: dict[str, Any]) -> None:
    rejects(strategy_dict(elements=[element_dict(parameters={"a": binding})]))


@pytest.mark.parametrize(
    "binding",
    [
        {"kind": "fixed", "value": 1},
        {"kind": "fixed", "value": 1.5},
        {"kind": "fixed", "value": "h1"},
        {"kind": "fixed", "value": "instrument_der_anwendung"},
        {"kind": "fixed", "value": False},
        {"kind": "parameter", "value": "p"},
        {"kind": "connection", "value": {"instance": "ema20", "property": "wert"}},
        {
            "kind": "expression",
            "value": "1 +",
        },  # a faulty expression is a finding, not a format error
        {"kind": "application"},
        {"kind": "application", "value": None},
    ],
)
def test_valid_bindings(binding: dict[str, Any]) -> None:
    accepts(strategy_dict(elements=[element_dict(parameters={"a": binding})]))


def test_a_data_connection_is_read_as_a_link() -> None:
    value = read_document(
        json.dumps(
            strategy_dict(
                elements=[
                    element_dict(
                        parameters={
                            "a": {
                                "kind": "connection",
                                "value": {"instance": "ema20", "property": "wert"},
                            }
                        }
                    )
                ]
            )
        )
    )
    assert isinstance(value, Strategy)
    assert value.elements[0].parameters["a"] == Binding(
        BindingKind.CONNECTION, DataLink("ema20", "wert")
    )


# sections ---------------------------------------------------------------------------------------


def test_a_strategy_has_at_most_as_many_sections_as_elements() -> None:
    section = {"id": uid(60), "name": "s"}
    rejects(strategy_dict(sections=[section]))
    accepts(strategy_dict(elements=[element_dict()], sections=[section]))
    rejects(
        strategy_dict(elements=[element_dict()], sections=[section, {**section, "id": uid(61)}])
    )


# format version --------------------------------------------------------------------------------


def test_a_higher_major_version_is_rejected() -> None:
    for version in ("3.0", "3.1", "10.0", "9.7"):
        rejects(strategy_dict(format_version=version))
        rejects(template_dict("pipwerk.rule", "Regel", format_version=version))


def test_other_versions_that_are_not_supported() -> None:
    for version in ("0.9", "2", "2.", "2.0.0", "abc", "", "-2.0"):
        rejects(strategy_dict(format_version=version))
    rejects(strategy_dict(format_version=2.0))


def test_the_same_major_version_is_accepted() -> None:
    accepts(strategy_dict(format_version="2.0"))
    accepts(strategy_dict(format_version="2.7"))
    document = parse_document(strategy_dict())
    assert document.format_version == "2.0"


# unknown types stay valid and are kept ----------------------------------------------------------


def test_an_unknown_element_type_is_valid_and_keeps_all_bindings() -> None:
    original = Strategy(
        id=uid(900),
        name="t",
        elements=[
            Element(
                id=uid(2),
                type="ext.unbekannt",
                name="Fremd",
                key="x",
                position=Position(3.0, 4.0),
                parameters={
                    "a": Binding(BindingKind.FIXED, "text"),
                    "b": Binding(BindingKind.EXPRESSION, "Order.volumen + 1"),
                    "c": Binding(BindingKind.PARAMETER, "p"),
                    "d": Binding(BindingKind.APPLICATION),
                    "f": Binding(BindingKind.CONNECTION, DataLink("a", "b")),
                },
                properties={"e": Binding(BindingKind.FIXED, 5)},
                inputs=[ElementInput("a", "b")],
                rules=[rule("r", "TRUE()")],
            )
        ],
    )
    result = read_document(write_document(original))
    assert result == original
    assert isinstance(result, Strategy)
    assert result.elements[0].type == "ext.unbekannt"
    assert result.elements[0].parameters["b"].value == "Order.volumen + 1"


def test_an_unknown_object_type_is_valid_and_keeps_its_content() -> None:
    original = Strategy(
        id=uid(900),
        name="t",
        elements=[
            Element(
                id=uid(2),
                type="Fremd",
                instance=Instance(
                    name="f",
                    object_type="Fremd",
                    origin=Origin("Fremd", uid(5), "Fremder"),
                    parameter_values={"a": fixed(1), "b": expr("x + 1")},
                    parameters=[ParameterDefinition("P", DataType.TEXT, False, "v", ())],
                    properties=[PropertyDefinition("Q", DataType.NUMBER, "1", ())],
                    instances=[ema("ema20")],
                    rules=[rule("r", "TRUE()")],
                    expression="1",
                    determined_property="x",
                    comparison=Comparison.EQUAL,
                    result_expression="2",
                ),
            )
        ],
    )
    assert read_document(write_document(original)) == original
    value = template("Fremd", parameter_values={"a": fixed(1)}, expression="1")
    assert read_document(write_document(value)) == value


# limits against overload (section 8) --------------------------------------------------------------


def expression_at(length: int, nesting: int = 0) -> str:
    """An expression of exactly this length and nesting."""
    core = "(" * nesting + "1" + ")" * nesting
    return core + " " * (length - len(core))


def expression_places(text: str) -> list[dict[str, Any]]:
    """Documents with this text as expression at every place that has one."""
    binding = {"kind": "expression", "value": text}
    return [
        strategy_dict(elements=[element_dict(parameters={"a": binding})]),
        strategy_dict(elements=[element_dict(properties={"a": binding})]),
        strategy_dict(rules=[instance_dict(expression=text)]),
        strategy_dict(rules=[instance_dict(result_expression=text)]),
        strategy_dict(rules=[instance_dict(parameter_values={"a": binding})]),
        strategy_dict(rules=[instance_dict(properties=[parameter_dict(expression=text)])]),
        strategy_dict(elements=[element_dict(rules=[instance_dict(expression=text)])]),
        strategy_dict(elements=[element_dict(instance=instance_dict(expression=text))]),
        template_dict("pipwerk.rule", "Regel", expression=text),
        template_dict("pipwerk.ruleset", "Regelwerk", result_expression=text),
        template_dict(
            "pipwerk.indicator",
            "Indikator",
            properties=[parameter_dict(expression=text)],
        ),
        template_dict("pipwerk.trend", "Trend", rules=[instance_dict(expression=text)]),
    ]


def test_expression_length_at_the_limit_and_above() -> None:
    assert limits.MAX_EXPRESSION_LENGTH == 4096
    for data in expression_places(expression_at(limits.MAX_EXPRESSION_LENGTH)):
        accepts(data)
    for data in expression_places(expression_at(limits.MAX_EXPRESSION_LENGTH + 1)):
        rejects(data)


def test_expression_nesting_at_the_limit_and_above() -> None:
    assert limits.MAX_EXPRESSION_NESTING == 64
    for data in expression_places(expression_at(200, limits.MAX_EXPRESSION_NESTING)):
        accepts(data)
    for data in expression_places(expression_at(200, limits.MAX_EXPRESSION_NESTING + 1)):
        rejects(data)


def test_the_nesting_of_an_expression_ignores_parentheses_in_texts() -> None:
    text = '"' + "(" * 100 + '"'
    for data in expression_places(text):
        accepts(data)


def test_number_of_elements() -> None:
    assert limits.MAX_ELEMENTS == 1000
    elements = [element_dict(number) for number in range(1, limits.MAX_ELEMENTS + 1)]
    accepts(strategy_dict(elements=elements))
    elements.append(element_dict(limits.MAX_ELEMENTS + 1))
    rejects(strategy_dict(elements=elements))


def test_number_of_connections() -> None:
    assert limits.MAX_CONNECTIONS == 4000
    connection = connection_dict()
    accepts(strategy_dict(connections=[connection] * limits.MAX_CONNECTIONS))
    rejects(strategy_dict(connections=[connection] * (limits.MAX_CONNECTIONS + 1)))


def test_number_of_inputs_of_an_element() -> None:
    assert limits.MAX_INPUTS_PER_ELEMENT == 50

    def inputs(count: int) -> list[dict[str, str]]:
        return [{"instance": f"i{number}", "property": "wert"} for number in range(count)]

    accepts(strategy_dict(elements=[element_dict(inputs=inputs(50))]))
    rejects(strategy_dict(elements=[element_dict(inputs=inputs(51))]))


def rule_list_places(count: int) -> list[dict[str, Any]]:
    rules = [instance_dict(f"r{number}", object_type="Regel") for number in range(count)]
    return [
        strategy_dict(rules=rules),
        strategy_dict(elements=[element_dict(rules=rules)]),
        strategy_dict(rules=[instance_dict(rules=rules)]),
        strategy_dict(elements=[element_dict(instance=instance_dict(rules=rules))]),
        template_dict("pipwerk.indicator", "Indikator", rules=rules),
        template_dict("pipwerk.trend", "Trend", rules=rules),
        template_dict("pipwerk.ruleset", "Regelwerk", rules=rules),
    ]


def test_number_of_rules_per_list() -> None:
    assert limits.MAX_RULES_PER_LIST == 200
    for data in rule_list_places(limits.MAX_RULES_PER_LIST):
        accepts(data)
    for data in rule_list_places(limits.MAX_RULES_PER_LIST + 1):
        rejects(data)


def test_number_of_strategy_parameters() -> None:
    assert limits.MAX_STRATEGY_PARAMETERS == 200

    def parameters(count: int) -> list[dict[str, Any]]:
        return [
            parameter_dict(key=f"p{number}", name=f"P {number}", value=1) for number in range(count)
        ]

    accepts(strategy_dict(parameters=parameters(limits.MAX_STRATEGY_PARAMETERS)))
    rejects(strategy_dict(parameters=parameters(limits.MAX_STRATEGY_PARAMETERS + 1)))


def chain(depth: int, key: str) -> dict[str, Any]:
    """An instance with ``depth`` levels of instances in instances through ``key``."""
    innermost = instance_dict("level_" + str(depth))
    current = innermost
    for level in range(depth - 1, 0, -1):
        current = instance_dict(f"level_{level}", **{key: [current]})
    return current


def nesting_places(depth: int, key: str) -> list[dict[str, Any]]:
    top = chain(depth, key)
    inside = chain(max(depth - 1, 1), key)
    return [
        strategy_dict(elements=[element_dict(instance=top)]),
        strategy_dict(elements=[element_dict(rules=[top])]),
        strategy_dict(rules=[top]),
        template_dict("pipwerk.indicator", "Indikator", **{key: [inside]}) if depth > 1 else {},
    ]


@pytest.mark.parametrize("key", ["instances", "rules"])
def test_nesting_of_instances_at_the_limit_and_above(key: str) -> None:
    assert limits.MAX_INSTANCE_NESTING == 16
    for data in nesting_places(limits.MAX_INSTANCE_NESTING, key)[:3]:
        accepts(data)
    for data in nesting_places(limits.MAX_INSTANCE_NESTING + 1, key)[:3]:
        rejects(data)


def test_the_instances_of_a_template_count_from_level_one() -> None:
    inside_ok = chain(limits.MAX_INSTANCE_NESTING, "instances")
    accepts(template_dict("pipwerk.indicator", "Indikator", instances=[inside_ok]))
    too_deep = chain(limits.MAX_INSTANCE_NESTING + 1, "instances")
    rejects(template_dict("pipwerk.indicator", "Indikator", instances=[too_deep]))
    rejects(template_dict("pipwerk.trend", "Trend", rules=[too_deep]))


def test_nesting_across_instances_and_rules_counts_together() -> None:
    current = instance_dict("innen")
    for level in range(limits.MAX_INSTANCE_NESTING - 1):
        key = "rules" if level % 2 else "instances"
        current = instance_dict(f"l{level}", **{key: [current]})
    accepts(strategy_dict(elements=[element_dict(instance=current)]))
    rejects(
        strategy_dict(elements=[element_dict(instance=instance_dict("aussen", rules=[current]))])
    )


def test_very_deep_nesting_is_rejected_without_exhausting_the_stack() -> None:
    deep = instance_dict("x")
    for _ in range(5000):
        deep = instance_dict("x", instances=[deep])
    data = strategy_dict(elements=[element_dict(instance=deep)])
    with pytest.raises(DocumentError):
        parse_document(data)
    text = '{"a":' * 3000 + "1" + "}" * 3000
    with pytest.raises(DocumentError):
        parse_document(text)


def test_the_size_of_a_document_is_a_constant_for_the_backend() -> None:
    assert limits.MAX_DOCUMENT_BYTES == 2 * 1024 * 1024


def test_the_limits_apply_when_a_document_is_read() -> None:
    data = strategy_dict(
        elements=[element_dict(parameters={"a": {"kind": "expression", "value": "1" * 4097}})]
    )
    with pytest.raises(DocumentError):
        read_document(json.dumps(data))


def test_an_invalid_json_text_is_a_validation_error() -> None:
    with pytest.raises(DocumentError):
        parse_document("{not json")
    with pytest.raises(DocumentError):
        parse_document(b"")
    with pytest.raises(DocumentError):
        parse_document("[1, 2]")


def test_connections_are_shared_in_the_model() -> None:
    value = read_document(write_document(full_strategy()))
    assert isinstance(value, Strategy)
    assert value.connections[0] == Connection(uid(1), "weiter", uid(2), value.connections[0].id)
    assert value.sections[0].collapsed is True
    assert value.orientation is Orientation.HORIZONTAL
