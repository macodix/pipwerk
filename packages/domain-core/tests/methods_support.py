"""Types with methods for the tests. The delivered types have no methods (specification 3.2); a
package that registers types can have them (E7). The tests register these types in the element
register and check how the library treats methods (specification 3.1, 3.3, 3.4)."""

from dataclasses import replace

from pipwerk_domain.defaults import create_registry
from pipwerk_domain.expressions.symbols import Scope
from pipwerk_domain.model import Instance, Origin
from pipwerk_domain.namespaces import application_scope, instance_symbol
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import (
    ArgumentDescription,
    Choice,
    DataType,
    ElementKind,
    Group,
    Label,
    MethodDescription,
    PropertyDescription,
    TypeDescription,
)
from tests.helpers import fixed

SERIES = "Messreihe"
"""An object type with a time unit and with methods; its instances stand on the canvas."""

POINT = "Messpunkt"
"""An object of the application without a time unit and with a method."""

PRICES = (
    Choice("schluss", Label("Schlusskurs", "close price")),
    Choice("eroeffnung", Label("Eröffnungskurs", "open price")),
)
TENDENCIES = (
    Choice("aufwaerts", Label("aufwärts", "up")),
    Choice("abwaerts", Label("abwärts", "down")),
)


def _text(de: str, en: str) -> Label:
    return Label(de, en)


def series_methods() -> tuple[MethodDescription, ...]:
    return (
        MethodDescription(
            "wert_vor",
            DataType.NUMBER,
            _text("Wert vor", "Value before"),
            (
                ArgumentDescription(
                    "anzahl",
                    DataType.INTEGER,
                    _text("Anzahl", "Count"),
                    required=True,
                    explanation=_text("Wie viele Werte zurück.", "How many values back."),
                ),
                ArgumentDescription(
                    "kurs",
                    DataType.CHOICE,
                    _text("Kurs", "Price"),
                    default="schluss",
                    choices=PRICES,
                    explanation=_text("Aus welchem Kurs gerechnet wird.", "Which price is used."),
                ),
            ),
            explanation=_text(
                "Der Wert der Messreihe vor einer Anzahl Werten.",
                "The value of the series before a number of values.",
            ),
        ),
        MethodDescription(
            "mittel",
            DataType.NUMBER,
            _text("Mittelwert", "Mean"),
            (
                ArgumentDescription("von", DataType.NUMBER, _text("Von", "From"), required=True),
                ArgumentDescription("bis", DataType.NUMBER, _text("Bis", "To"), required=True),
                ArgumentDescription(
                    "gewichtet", DataType.BOOLEAN, _text("Gewichtet", "Weighted"), default=False
                ),
                ArgumentDescription(
                    "zeiteinheit",
                    DataType.TIME_UNIT,
                    _text("Zeiteinheit", "Time unit"),
                    default="h1",
                ),
                ArgumentDescription(
                    "bezeichnung", DataType.TEXT, _text("Bezeichnung", "Designation"), default="x"
                ),
                ArgumentDescription(
                    "anteil", DataType.PERCENT, _text("Anteil", "Share"), default=0.5
                ),
            ),
            explanation=_text("Der Mittelwert zwischen zwei Werten.", "The mean of two values."),
        ),
        MethodDescription(
            "tendenz",
            DataType.CHOICE,
            _text("Tendenz", "Tendency"),
            choices=TENDENCIES,
            explanation=_text("Die Richtung der Messreihe.", "The direction of the series."),
        ),
        MethodDescription(
            "anzahl_wechsel",
            DataType.INTEGER,
            _text("Anzahl Wechsel", "Number of changes"),
            explanation=_text("Wie oft die Richtung wechselt.", "How often the direction changes."),
        ),
        MethodDescription(
            "bereit",
            DataType.BOOLEAN,
            _text("Bereit", "Ready"),
            explanation=_text("Ob genug Werte da sind.", "Whether there are enough values."),
        ),
    )


def series_description(registry: ElementRegistry) -> TypeDescription:
    """The object type ``Messreihe``: the parameters of an indicator, the property ``Wert``
    and the methods above."""
    base = registry.get("EMA")
    assert base is not None
    return replace(
        base,
        id=SERIES,
        name=_text("Messreihe", "Series"),
        description=_text("Eine Reihe von Werten.", "A series of values."),
        explanation=_text(
            "Eine Reihe von Werten mit Methoden.", "A series of values with methods."
        ),
        parameters=base.parameters[:2],
        properties=(
            PropertyDescription(
                "wert",
                DataType.NUMBER,
                _text("Wert", "Value"),
                must=True,
                explanation=_text("Der aktuelle Wert.", "The current value."),
            ),
        ),
        methods=series_methods(),
        group=Group.INDICATORS,
        can_refresh=True,
    )


def point_description() -> TypeDescription:
    """The object ``Messpunkt`` of the application: no time unit, one method."""
    return TypeDescription(
        POINT,
        ElementKind.APPLICATION_OBJECT,
        _text("Messpunkt", "Point"),
        _text("Ein Punkt.", "A point."),
        explanation=_text("Ein Punkt mit einer Methode.", "A point with a method."),
        methods=(
            MethodDescription(
                "abstand",
                DataType.NUMBER,
                _text("Abstand", "Distance"),
                (ArgumentDescription("zu", DataType.NUMBER, _text("Zu", "To"), required=True),),
                explanation=_text("Der Abstand zu einem Wert.", "The distance to a value."),
            ),
        ),
    )


def method_registry() -> ElementRegistry:
    """The register of the delivered types and the two types above."""
    registry = create_registry(entry_points=False)
    registry.register(series_description(registry))
    registry.register(point_description())
    return registry


REGISTRY = method_registry()


def series_instance(name: str = "Reihe A", key: str = "reihe_a") -> Instance:
    return Instance(
        name=name,
        key=key,
        object_type=SERIES,
        origin=Origin(SERIES),
        parameter_values={"zeiteinheit": fixed("h1")},
    )


def method_scope() -> Scope:
    """The names of the application objects and the instance ``Reihe A``."""
    scope = Scope(application_scope(REGISTRY, None))
    scope.add(instance_symbol(REGISTRY, series_instance()))
    return scope
