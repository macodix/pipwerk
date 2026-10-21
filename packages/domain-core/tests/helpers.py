"""Builders for the tests of the library."""

from collections.abc import Iterable

from pipwerk_domain import catalog
from pipwerk_domain.consistency import Finding, Level, check_strategy
from pipwerk_domain.model import (
    Binding,
    Connection,
    Element,
    Instance,
    Origin,
    ParameterDefinition,
    Strategy,
    Template,
)
from pipwerk_domain.typedesc import BindingKind, DataType


def uid(number: int) -> str:
    """A well-formed identifier for the elements of the tests."""
    return f"00000000-0000-4000-8000-{number:012d}"


def fixed(value: bool | int | float | str) -> Binding:
    return Binding(BindingKind.FIXED, value)


def param(name: str) -> Binding:
    return Binding(BindingKind.PARAMETER, name)


def expr(text: str) -> Binding:
    return Binding(BindingKind.EXPRESSION, text)


def application() -> Binding:
    return Binding(BindingKind.APPLICATION)


def element(number: int, type_id: str, **kwargs: object) -> Element:
    return Element(id=uid(number), type=type_id, **kwargs)  # type: ignore[arg-type]


def connect(source: int, output: str, target: int) -> Connection:
    return Connection(uid(source), output, uid(target))


def trigger(number: int = 1, unit: str = "h1", **kwargs: object) -> Element:
    return element(
        number,
        catalog.TRIGGER_CANDLE_CLOSE,
        parameters={"zeiteinheit": fixed(unit)},
        **kwargs,
    )


def place_order(number: int = 2, order_type: str = "MarketOrder", **kwargs: object) -> Element:
    properties = kwargs.pop("properties", None)
    if properties is None:
        properties = {"richtung": fixed("buy"), "volumen": fixed(1.0)}
    return element(
        number,
        catalog.FLOW_PLACE_ORDER,
        parameters={"ordertyp": fixed(order_type)},
        properties=properties,
        **kwargs,
    )


def condition(number: int, text: str, **kwargs: object) -> Element:
    return element(number, catalog.FLOW_CONDITION, parameters={"ausdruck": expr(text)}, **kwargs)


def calculation(number: int, name: str, text: str, **kwargs: object) -> Element:
    return element(
        number,
        catalog.FLOW_CALCULATION,
        name=name,
        key=name,
        parameters={"ausdruck": expr(text)},
        **kwargs,
    )


def valid_strategy() -> Strategy:
    """The smallest strategy without findings: a trigger and an order."""
    return Strategy(
        id=uid(900),
        name="Test",
        elements=[trigger(1), place_order(2)],
        connections=[connect(1, "weiter", 2)],
    )


def rule(name: str, text: str, **kwargs: object) -> Instance:
    return Instance(
        name=name,
        key=name,
        object_type=catalog.TYPE_RULE,
        origin=Origin(catalog.TYPE_RULE),
        expression=text,
        **kwargs,  # type: ignore[arg-type]
    )


def ruleset(name: str, rules: list[Instance], **kwargs: object) -> Instance:
    return Instance(
        name=name,
        key=name,
        object_type=catalog.TYPE_RULESET,
        origin=Origin(catalog.TYPE_RULESET),
        rules=rules,
        **kwargs,  # type: ignore[arg-type]
    )


def indicator_instance(name: str, **kwargs: object) -> Instance:
    kwargs.setdefault("parameter_values", {"zeiteinheit": fixed("h1")})
    return Instance(
        name=name,
        key=name,
        object_type=catalog.TYPE_INDICATOR,
        origin=Origin(catalog.TYPE_INDICATOR),
        **kwargs,  # type: ignore[arg-type]
    )


def ema(name: str, period: int = 20, unit: str = "h1") -> Instance:
    return Instance(
        name=name,
        key=name,
        object_type="EMA",
        origin=Origin("EMA"),
        parameter_values={"zeiteinheit": fixed(unit), "periode": fixed(period)},
    )


def template(object_type: str, **kwargs: object) -> Template:
    if object_type == catalog.TYPE_INDICATOR:
        kwargs.setdefault("parameter_values", {"zeiteinheit": fixed("h1")})
    return Template(
        id=uid(800),
        name="Vorlage",
        object_type=object_type,
        **kwargs,  # type: ignore[arg-type]
    )


def definition(
    name: str, datatype: DataType = DataType.NUMBER, **kwargs: object
) -> ParameterDefinition:
    return ParameterDefinition(name, datatype, **kwargs)  # type: ignore[arg-type]


def codes(findings: Iterable[Finding]) -> list[str]:
    return [item.code for item in findings]


def only(findings: Iterable[Finding], code: str) -> list[Finding]:
    return [item for item in findings if item.code == code]


def errors(findings: Iterable[Finding]) -> list[Finding]:
    return [item for item in findings if item.level is Level.ERROR]


def check(strategy: Strategy) -> list[Finding]:
    return check_strategy(strategy)
