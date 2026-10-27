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


@dataclass(frozen=True, slots=True)
class Label:
    """A text in German and English."""

    de: str
    en: str


DATATYPE_LABELS: dict[DataType, Label] = {
    DataType.NUMBER: Label("Zahl", "number"),
    DataType.INTEGER: Label("ganze Zahl", "whole number"),
    DataType.PERCENT: Label("Prozentwert", "percentage"),
    DataType.BOOLEAN: Label("Wahrheitswert", "true/false value"),
    DataType.TEXT: Label("Text", "text"),
    DataType.CHOICE: Label("Auswahl", "choice"),
    DataType.TIME_UNIT: Label("Zeiteinheit", "time unit"),
    DataType.TIMESTAMP: Label("Zeitpunkt", "point in time"),
    DataType.DATE: Label("Datum", "date"),
    DataType.EXPRESSION: Label("Formel", "formula"),
    DataType.OBJECT: Label("Objekt", "object"),
}
"""The words for the data types in trader language, in German and English (specification 3.1,
5.4). They stand in the explanation of a field, not next to its label. The data type object
is called by the name of its object type (:func:`datatype_label`); the word here is for an
object whose type is not known."""


def datatype_label(datatype: DataType, object_name: Label | None = None) -> Label:
    """The word for a data type. For the data type object ``object_name`` is the name of its
    object type (for example "Instrument"); without it the general word for an object."""
    if datatype is DataType.OBJECT and object_name is not None:
        return object_name
    return DATATYPE_LABELS[datatype]


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
    CONNECTION = "connection"
    EXPRESSION = "expression"
    APPLICATION = "application"


ALL_BINDINGS = (
    BindingKind.FIXED,
    BindingKind.PARAMETER,
    BindingKind.CONNECTION,
    BindingKind.EXPRESSION,
    BindingKind.APPLICATION,
)


class Group(StrEnum):
    """Group of the element library (specification 3.1, 5.2). The names of the groups in
    German and English are not part of the type description; the user interface has them."""

    FLOW = "flow"
    CALCULATION = "calculation"
    INDICATORS = "indicators"
    TRENDS = "trends"
    MARKET = "market"
    ACCOUNT = "account"
    ACTIONS = "actions"
    RULES = "rules"


INSTRUMENT_TYPE = "Instrument"
"""Object type of the parameter ``instrument`` (data type object)."""

INSTRUMENT_PARAMETER = "instrument"
"""Identifier of the parameter and of the order property ``Instrument`` (specification 3.1)."""

APPLICATION_INSTRUMENT = "instrument_der_anwendung"
"""Identifier of the fixed value "Instrument der Anwendung": the only choice and the default
of the parameter ``instrument``."""


NO_TEXT = Label("", "")
"""The empty text: the explanation of a registration that does not give one."""


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
    allowed values, allowed binding kinds, label with explanation and optionally the
    condition under which it applies."""

    id: str
    datatype: DataType
    label: Label
    required: bool = False
    default: Scalar | None = None
    choices: tuple[Choice, ...] = ()
    bindings: tuple[BindingKind, ...] = ALL_BINDINGS
    applies_when: Condition | None = None
    object_type: str | None = None
    explanation: Label = NO_TEXT


@dataclass(frozen=True, slots=True)
class PropertyDescription:
    """A property of a type: identifier, data type, MUSS (``must``) or KANN, label with
    explanation.

    For order types ``set_by_user`` states whether the user fills the property; the
    application fills the others (``Konto``, ``Order-ID``, ``Status``, ``Strategie-ID``,
    ``Preis`` of ``MarketOrder`` and ``CloseOrder``, ``Position`` of ``CloseOrder``).
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
    explanation: Label = NO_TEXT


@dataclass(frozen=True, slots=True)
class ArgumentDescription:
    """An argument of a method: identifier, data type, mandatory or optional, default value,
    allowed values and label with explanation (specification 3.1).

    An optional argument has a default value: an expression that leaves it out gets this
    value. A mandatory argument has none.
    """

    id: str
    datatype: DataType
    label: Label
    required: bool = False
    default: Scalar | None = None
    choices: tuple[Choice, ...] = ()
    object_type: str | None = None
    explanation: Label = NO_TEXT


@dataclass(frozen=True, slots=True)
class MethodDescription:
    """A method of a type (specification 3.1, req-fach-055): identifier, data type of the
    result, arguments and label with explanation. ``choices`` and ``object_type`` describe a
    result that is a choice or an object, like those of a property."""

    id: str
    datatype: DataType
    label: Label
    arguments: tuple[ArgumentDescription, ...] = ()
    choices: tuple[Choice, ...] = ()
    object_type: str | None = None
    explanation: Label = NO_TEXT

    def argument(self, argument_id: str) -> ArgumentDescription | None:
        for item in self.arguments:
            if item.id == argument_id:
                return item
        return None

    @property
    def min_arguments(self) -> int:
        """The number of mandatory arguments."""
        return sum(1 for item in self.arguments if item.required)

    @property
    def max_arguments(self) -> int:
        return len(self.arguments)


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
    explanation: Label = NO_TEXT


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
    explanation: Label = NO_TEXT
    """The short text the user interface shows on pointing at the type, in trader language."""
    group: Group | None = None
    """Group of the element library (specification 5.2), ``None`` for a type that is not in it."""
    methods: tuple[MethodDescription, ...] = ()
    """The methods of the type (specification 3.1); the delivered types have none."""
    can_refresh: bool = False
    """Whether a use of an instance of this type can choose "Aktualisieren" (specification 3.1,
    3.2). A template of the user takes it from its object type."""

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

    def method(self, method_id: str) -> MethodDescription | None:
        for item in self.methods:
            if item.id == method_id:
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

INSTRUMENT_CHOICES: tuple[Choice, ...] = (
    Choice(
        APPLICATION_INSTRUMENT, Label("Instrument der Anwendung", "Instrument of the application")
    ),
)
"""The fixed value of the parameter ``instrument``: the instrument of the application."""


def choice_ids(datatype: DataType, choices: tuple[Choice, ...]) -> tuple[str, ...] | None:
    """Allowed values of a choice or a time unit, ``None`` for other data types."""
    if datatype is DataType.TIME_UNIT:
        return _TIME_UNIT_IDS
    if datatype is DataType.CHOICE:
        return tuple(item.id for item in choices)
    return None
