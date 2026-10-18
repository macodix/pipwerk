"""Type descriptions (specification 3.1): the data the user interface is built from."""

from dataclasses import dataclass
from enum import StrEnum

type Scalar = bool | int | float | str


class DataType(StrEnum):
    """Data types of parameters, properties and expression values."""

    NUMBER = "number"
    INTEGER = "integer"
    PERCENT = "percent"
    BOOLEAN = "boolean"
    TEXT = "text"
    CHOICE = "choice"
    TIME_UNIT = "time_unit"
    TIMESTAMP = "timestamp"
    DATE = "date"
    EXPRESSION = "expression"
    OBJECT = "object"


NUMERIC_TYPES = frozenset({DataType.NUMBER, DataType.INTEGER, DataType.PERCENT})


class ElementKind(StrEnum):
    """The kind ("Art") of a type description."""

    TRIGGER = "trigger"
    FLOW = "flow"
    OBJECT_TYPE = "object_type"
    APPLICATION_OBJECT = "application_object"
    ORDER_TYPE = "order_type"
    TREND_METHOD = "trend_method"


class ObjectCategory(StrEnum):
    """Subdivision of the kind ``object_type``."""

    INDICATOR = "indicator"
    TREND = "trend"
    RULE = "rule"
    RULESET = "ruleset"


class BindingKind(StrEnum):
    """How a parameter or property receives its value (glossary "Bindungsart")."""

    FIXED = "fixed"
    PARAMETER = "parameter"
    EXPRESSION = "expression"
    APPLICATION = "application"


ALL_BINDINGS = (
    BindingKind.FIXED,
    BindingKind.PARAMETER,
    BindingKind.EXPRESSION,
    BindingKind.APPLICATION,
)


@dataclass(frozen=True, slots=True)
class Label:
    """A text in German and English."""

    de: str
    en: str


@dataclass(frozen=True, slots=True)
class Choice:
    """A fixed value of a choice."""

    id: str
    label: Label


@dataclass(frozen=True, slots=True)
class Condition:
    """The element applies only if the parameter or property ``name`` has ``value``."""

    name: str
    value: str


@dataclass(frozen=True, slots=True)
class ParameterDescription:
    """A parameter of a type: identifier, data type, mandatory or optional, default value,
    allowed values, allowed binding kinds, label and optionally the condition under which
    it applies."""

    id: str
    datatype: DataType
    label: Label
    required: bool = False
    default: Scalar | None = None
    choices: tuple[Choice, ...] = ()
    bindings: tuple[BindingKind, ...] = ALL_BINDINGS
    applies_when: Condition | None = None
    object_type: str | None = None


@dataclass(frozen=True, slots=True)
class PropertyDescription:
    """A property of a type: identifier, data type, MUSS (``must``) or KANN, label.

    For order types ``set_by_user`` states whether the user fills the property; the
    application fills the others (``Instrument``, ``Konto``, ``Order-ID``, ``Status``,
    ``Strategie-ID``, ``Preis`` of ``MarketOrder`` and ``CloseOrder``, ``Position`` of
    ``CloseOrder``).
    """

    id: str
    datatype: DataType
    label: Label
    must: bool = False
    set_by_user: bool = True
    default: Scalar | None = None
    choices: tuple[Choice, ...] = ()
    applies_when: Condition | None = None
    object_type: str | None = None


@dataclass(frozen=True, slots=True)
class OutputDescription:
    """An output of a flow element, for example ``wahr`` and ``falsch``.

    ``holds_management`` states that the management of the element hangs at this output
    (specification 3.1, 3.3: the output ``gestellt`` of "Order aufgeben"). At most one output
    of a type has it.
    """

    id: str
    label: Label
    holds_management: bool = False


@dataclass(frozen=True, slots=True)
class TypeDescription:
    """Description of an element type or object type."""

    id: str
    kind: ElementKind
    name: Label
    description: Label
    category: ObjectCategory | None = None
    parameters: tuple[ParameterDescription, ...] = ()
    properties: tuple[PropertyDescription, ...] = ()
    outputs: tuple[OutputDescription, ...] = ()
    rules_allowed: bool = False
    on_canvas: bool = False
    builtin: bool = True
    by_user: bool = True
    """Whether the user can choose the type, for example as order type of "Order aufgeben"."""
    named: bool = False
    """Whether an element of the flow carries a name under which expressions address its
    result (condition, calculation)."""
    strategy_parameters: bool = False
    """For objects of the application: whether expressions over this object address the
    strategy parameters (``Strategie``)."""

    def parameter(self, parameter_id: str) -> ParameterDescription | None:
        for item in self.parameters:
            if item.id == parameter_id:
                return item
        return None

    def property(self, property_id: str) -> PropertyDescription | None:
        for item in self.properties:
            if item.id == property_id:
                return item
        return None

    def output(self, output_id: str) -> OutputDescription | None:
        for item in self.outputs:
            if item.id == output_id:
                return item
        return None

    def management_output(self) -> OutputDescription | None:
        """The output at which the management of the element hangs, if any."""
        for item in self.outputs:
            if item.holds_management:
                return item
        return None


_TIME_UNIT_IDS = (
    "m1",
    "m2",
    "m3",
    "m4",
    "m5",
    "m6",
    "m10",
    "m12",
    "m15",
    "m20",
    "m30",
    "h1",
    "h2",
    "h3",
    "h4",
    "h6",
    "h8",
    "h12",
    "d1",
    "w1",
    "mn1",
)

TIME_UNITS: tuple[Choice, ...] = tuple(
    Choice(unit, Label(unit.upper(), unit.upper())) for unit in _TIME_UNIT_IDS
)
"""All time units of MetaTrader 5 from M1 to MN1, with identifiers formed by the rule."""

TIME_UNIT_IDS = frozenset(_TIME_UNIT_IDS)


def choice_ids(datatype: DataType, choices: tuple[Choice, ...]) -> tuple[str, ...] | None:
    """Allowed values of a choice or a time unit, ``None`` for other data types."""
    if datatype is DataType.TIME_UNIT:
        return _TIME_UNIT_IDS
    if datatype is DataType.CHOICE:
        return tuple(item.id for item in choices)
    return None
