"""Documents (specification 3.7): writing and reading, strict models, limits."""

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
    Element,
    Instance,
    Origin,
    ParameterDefinition,
    PropertyDefinition,
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
        "format_version": "1.0",
        "id": UUID,
        "title": "t",
    }
    data.update(changes)
    return data


def template_dict(format_name: str, object_type: Any, **changes: Any) -> dict[str, Any]:
    data: dict[str, Any] = {
        "format": format_name,
        "format_version": "1.0",
        "id": UUID,
        "title": "t",
        "object_type": object_type,
    }
    data.update(changes)
    return data


def instance_dict(name: str = "i", **changes: Any) -> dict[str, Any]:
    data: dict[str, Any] = {"name": name, "object_type": "EMA"}
    data.update(changes)
    return data


def element_dict(number: int = 2, **changes: Any) -> dict[str, Any]:
    data: dict[str, Any] = {"id": uid(number), "type": "flow.delete_order"}
    data.update(changes)
    return data


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
        },
        title="Order",
        rules=[rule("mindestvolumen", "Order.volumen >= Instrument.mindestvolumen")],
    )
    return Strategy(
        id=uid(900),
        title="Strategie ü ä ß Anführung",
        description="Beschreibung\nmit Zeilenumbruch",
        parameters=[
            StrategyParameter("zeit", DataType.TIME_UNIT, "h1"),
            StrategyParameter("faktor", DataType.NUMBER, 2.5),
            StrategyParameter("modus", DataType.CHOICE, "a", choices=("a", "b")),
            StrategyParameter("offen", DataType.INTEGER, at_application=True),
            StrategyParameter("an", DataType.BOOLEAN, True),
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
            trigger(1, x=10.5, y=-3.0, title="Auslöser"),
            order,
            calculation(3, "wert", "1 + 1", x=1, y=2),
            Element(
                id=uid(4),
                type="EMA",
                title="EMA 21",
                x=5.0,
                y=6.0,
                instance=ema("ema21", 21),
            ),
            Element(
                id=uid(5),
                type="Trend",
                instance=Instance(
                    name="trend_h1",
                    object_type="Trend",
                    origin=Origin("Trend", uid(777), "Mein Trend"),
                    parameter_values={
                        "zeiteinheit": param("zeiteinheit"),
                        "berechnungsverfahren": fixed("trend_method.expression"),
                    },
                    parameters=[
                        ParameterDefinition("faktor", DataType.NUMBER, True, 2, ()),
                        ParameterDefinition("modus", DataType.CHOICE, False, "a", ("a", "b")),
                    ],
                    properties=[
                        PropertyDefinition("richtung", DataType.TEXT, '"aufwaerts"'),
                        PropertyDefinition("wahl", DataType.CHOICE, '"a"', ("a", "b")),
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
    )


def test_strategy_round_trip() -> None:
    original = full_strategy()
    text = write_document(original)
    assert read_document(text) == original
    assert read_document(text.encode()) == original
    assert write_document(read_document(text)) == text  # writing is stable


def test_strategy_with_the_risk_rule_round_trip() -> None:
    original = Strategy(id=uid(900), title="t", rules=[risk_per_trade_instance("risiko", 0.02)])
    assert read_document(write_document(original)) == original


@pytest.mark.parametrize(
    "value",
    [
        template(catalog.TYPE_INDICATOR, parameter_values={"x": fixed(1)}),
        template(
            catalog.TYPE_INDICATOR,
            description="Beschreibung",
            parameters=[ParameterDefinition("p", DataType.PERCENT, True, 0.01, ())],
            properties=[PropertyDefinition("e", DataType.NUMBER, "p * 2")],
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
            properties=[PropertyDefinition("richtung", DataType.TEXT, '"aufwaerts"')],
        ),
        template(
            catalog.TYPE_RULE,
            parameters=[ParameterDefinition("g", DataType.NUMBER, True, 5, ())],
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
        assert data["format_version"] == FORMAT_VERSION == "1.0"
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
    assert list(data)[:5] == ["format", "format_version", "id", "title", "description"]
    assert "ü ä ß" in text  # no escaping of non-ASCII characters
    template_data = json.loads(write_document(risk_per_trade_template()))
    assert list(template_data)[:6] == [
        "format",
        "format_version",
        "id",
        "title",
        "description",
        "object_type",
    ]
    instance = data["rules"][0]
    assert list(instance)[:3] == ["name", "object_type", "origin"]


def test_numbers_keep_their_kind() -> None:
    original = Strategy(
        id=uid(900),
        title="t",
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


@pytest.mark.parametrize(
    "data",
    [
        strategy_dict(extra=1),
        strategy_dict(parameters=[{"name": "a", "datatype": "number", "extra": 1}]),
        strategy_dict(rules=[instance_dict(extra=1)]),
        strategy_dict(rules=[instance_dict(origin={"object_type": "EMA", "extra": 1})]),
        strategy_dict(
            rules=[instance_dict(parameter_values={"a": {"kind": "fixed", "value": 1, "extra": 1}})]
        ),
        strategy_dict(
            rules=[instance_dict(parameters=[{"name": "a", "datatype": "number", "extra": 1}])]
        ),
        strategy_dict(
            rules=[
                instance_dict(
                    properties=[{"name": "a", "datatype": "number", "expression": "1", "extra": 1}]
                )
            ]
        ),
        strategy_dict(elements=[element_dict(extra=1)]),
        strategy_dict(elements=[element_dict(instance=instance_dict(extra=1))]),
        strategy_dict(elements=[element_dict(rules=[instance_dict(extra=1)])]),
        strategy_dict(
            connections=[{"source": uid(1), "output": "a", "target": uid(2), "extra": 1}]
        ),
        template_dict("pipwerk.indicator", "Indikator", extra=1),
        template_dict("pipwerk.trend", "Trend", extra=1),
        template_dict("pipwerk.rule", "Regel", extra=1),
        template_dict("pipwerk.ruleset", "Regelwerk", extra=1),
    ],
)
def test_an_additional_field_is_rejected(data: dict[str, Any]) -> None:
    rejects(data)


def test_a_missing_required_field_is_rejected() -> None:
    for key in ("id", "title"):
        data = strategy_dict()
        del data[key]
        rejects(data)
    rejects(strategy_dict(elements=[{"id": uid(2)}]))
    rejects(strategy_dict(connections=[{"source": uid(1)}]))
    rejects(strategy_dict(rules=[{"name": "a"}]))
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


def test_coordinates_may_be_whole_numbers() -> None:
    accepts(strategy_dict(elements=[element_dict(x=5, y=-3)]))
    accepts(strategy_dict(elements=[element_dict(x=5.5, y=-3.25)]))


def test_a_minimal_document_with_defaults_is_accepted() -> None:
    accepts(strategy_dict())
    accepts(template_dict("pipwerk.indicator", "Indikator"))
    document = parse_document(strategy_dict())
    assert isinstance(document, StrategyDocument)
    assert document.elements == []
    assert document.description == ""


@pytest.mark.parametrize(
    "data",
    [
        strategy_dict(title=5),
        strategy_dict(id="nicht-uuid"),
        strategy_dict(id="ABCDEF00-0000-4000-8000-000000000001"),
        strategy_dict(elements=[element_dict(x="1")]),
        strategy_dict(elements=[element_dict(id=5)]),
        strategy_dict(elements=[element_dict(management_of="x")]),
        strategy_dict(elements=[element_dict(parameters={"a": 1})]),
        strategy_dict(elements=[element_dict(parameters={"a": {"kind": "other"}})]),
        strategy_dict(parameters=[{"name": "a", "datatype": "color"}]),
        strategy_dict(parameters=[{"name": "a", "datatype": "number", "at_application": "yes"}]),
        strategy_dict(rules=[instance_dict(comparison="groesser")]),
        strategy_dict(rules=[instance_dict(expression=5)]),
        strategy_dict(rules=[instance_dict(origin={"object_type": "Regel", "template_id": "x"})]),
        strategy_dict(connections=[{"source": "x", "output": "a", "target": uid(2)}]),
        strategy_dict(format="pipwerk.other"),
        strategy_dict(format="pipwerk.rule", elements=[]),  # the fields of another format
        template_dict("pipwerk.trend", "Regel"),
        template_dict("pipwerk.rule", "Trend"),
        template_dict("pipwerk.ruleset", "Regel"),
        template_dict("pipwerk.indicator", 5),
        {"format_version": "1.0"},
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
    rejects(strategy_dict(elements=[element_dict(x="1.5")]))
    rejects(
        strategy_dict(
            parameters=[{"name": "a", "datatype": "boolean", "value": 1, "at_application": 0}]
        )
    )
    rejects(strategy_dict(title=None))


@pytest.mark.parametrize(
    "binding",
    [
        {"kind": "fixed"},
        {"kind": "fixed", "value": None},
        {"kind": "parameter"},
        {"kind": "parameter", "value": 5},
        {"kind": "expression"},
        {"kind": "expression", "value": 5},
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
        {"kind": "fixed", "value": False},
        {"kind": "parameter", "value": "p"},
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


# format version --------------------------------------------------------------------------------


def test_a_higher_major_version_is_rejected() -> None:
    for version in ("2.0", "2.1", "10.0", "3.7"):
        rejects(strategy_dict(format_version=version))
        rejects(template_dict("pipwerk.rule", "Regel", format_version=version))


def test_other_versions_that_are_not_supported() -> None:
    for version in ("0.9", "1", "1.", "1.0.0", "abc", "", "-1.0"):
        rejects(strategy_dict(format_version=version))
    rejects(strategy_dict(format_version=1.0))


def test_the_same_major_version_is_accepted() -> None:
    accepts(strategy_dict(format_version="1.0"))
    accepts(strategy_dict(format_version="1.7"))
    document = parse_document(strategy_dict())
    assert document.format_version == "1.0"


# unknown types stay valid and are kept ----------------------------------------------------------


def test_an_unknown_element_type_is_valid_and_keeps_all_bindings() -> None:
    original = Strategy(
        id=uid(900),
        title="t",
        elements=[
            Element(
                id=uid(2),
                type="ext.unbekannt",
                title="Fremd",
                name="x",
                x=3.0,
                y=4.0,
                parameters={
                    "a": Binding(BindingKind.FIXED, "text"),
                    "b": Binding(BindingKind.EXPRESSION, "Order.volumen + 1"),
                    "c": Binding(BindingKind.PARAMETER, "p"),
                    "d": Binding(BindingKind.APPLICATION),
                },
                properties={"e": Binding(BindingKind.FIXED, 5)},
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
        title="t",
        elements=[
            Element(
                id=uid(2),
                type="Fremd",
                instance=Instance(
                    name="f",
                    object_type="Fremd",
                    origin=Origin("Fremd", uid(5), "Fremder"),
                    parameter_values={"a": fixed(1), "b": expr("x + 1")},
                    parameters=[ParameterDefinition("p", DataType.TEXT, False, "v", ())],
                    properties=[PropertyDefinition("q", DataType.NUMBER, "1", ())],
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
        strategy_dict(
            rules=[
                instance_dict(properties=[{"name": "a", "datatype": "number", "expression": text}])
            ]
        ),
        strategy_dict(elements=[element_dict(rules=[instance_dict(expression=text)])]),
        strategy_dict(elements=[element_dict(instance=instance_dict(expression=text))]),
        template_dict("pipwerk.rule", "Regel", expression=text),
        template_dict("pipwerk.ruleset", "Regelwerk", result_expression=text),
        template_dict(
            "pipwerk.indicator",
            "Indikator",
            properties=[{"name": "a", "datatype": "number", "expression": text}],
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
    connection = {"source": uid(1), "output": "weiter", "target": uid(2)}
    accepts(strategy_dict(connections=[connection] * limits.MAX_CONNECTIONS))
    rejects(strategy_dict(connections=[connection] * (limits.MAX_CONNECTIONS + 1)))


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
        return [{"name": f"p{number}", "datatype": "number", "value": 1} for number in range(count)]

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
