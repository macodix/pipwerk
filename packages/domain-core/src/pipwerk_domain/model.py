"""Object model (specification 3.3, E4): plain Python classes without frameworks."""

from dataclasses import dataclass, field
from enum import StrEnum
from uuid import uuid4

from pipwerk_domain.catalog import FLOW_CALCULATION, FLOW_CONDITION
from pipwerk_domain.identifiers import identifier_from_name
from pipwerk_domain.typedesc import BindingKind, DataType, Scalar


class Comparison(StrEnum):
    """Comparison of a determining rule when it checks (specification 3.5)."""

    AT_MOST = "hoechstens"
    AT_LEAST = "mindestens"
    EQUAL = "gleich"


class Orientation(StrEnum):
    """Direction of the flow on the drawing area (specification 3.3, 5.3)."""

    VERTICAL = "vertical"
    HORIZONTAL = "horizontal"


@dataclass(frozen=True, slots=True)
class DataLink:
    """The value of a data connection: a property of an instance on the drawing area, by the
    keys of the instance and of the property (specification 3.1, 3.3)."""

    instance: str
    property: str


@dataclass(slots=True)
class Binding:
    """The value of a parameter or property with its kind of binding.

    ``fixed``: ``value`` is the fixed value; ``parameter``: ``value`` is the key of a
    strategy parameter or, within a template, of a parameter of the template;
    ``connection``: ``value`` is a :class:`DataLink`; ``expression``: ``value`` is the
    expression; ``application``: no value, the application passes it.
    """

    kind: BindingKind
    value: Scalar | DataLink | None = None


@dataclass(slots=True)
class Origin:
    """Origin of an instance: object type and, if it was made from a template, its identifier
    and, for a template of the user, its name at the time of insertion (specification 3.7)."""

    object_type: str
    template_id: str | None = None
    template_name: str | None = None


@dataclass(slots=True)
class ParameterDefinition:
    """Own parameter of a template or instance (key, name, data type, mandatory, default)."""

    name: str
    datatype: DataType
    required: bool = False
    default: Scalar | None = None
    choices: tuple[str, ...] = ()
    key: str = ""
    object_type: str | None = None

    def __post_init__(self) -> None:
        if not self.key:
            self.key = identifier_from_name(self.name)


@dataclass(slots=True)
class PropertyDefinition:
    """Own property of an indicator or trend with the expression that determines it."""

    name: str
    datatype: DataType
    expression: str
    choices: tuple[str, ...] = ()
    key: str = ""
    object_type: str | None = None

    def __post_init__(self) -> None:
        if not self.key:
            self.key = identifier_from_name(self.name)


@dataclass(slots=True)
class StrategyParameter:
    """Parameter of a strategy: a value, or "at the application"."""

    name: str
    datatype: DataType
    value: Scalar | None = None
    at_application: bool = False
    choices: tuple[str, ...] = ()
    key: str = ""
    object_type: str | None = None

    def __post_init__(self) -> None:
        if not self.key:
            self.key = identifier_from_name(self.name)


@dataclass(kw_only=True, slots=True)
class ObjectContent:
    """Content shared by a template and an instance made from it (E4)."""

    object_type: str
    parameter_values: dict[str, Binding] = field(default_factory=dict)
    parameters: list[ParameterDefinition] = field(default_factory=list)
    properties: list[PropertyDefinition] = field(default_factory=list)
    instances: list[Instance] = field(default_factory=list)
    rules: list[Instance] = field(default_factory=list)
    expression: str | None = None
    determined_property: str | None = None
    comparison: Comparison | None = None
    result_expression: str | None = None


@dataclass(kw_only=True, slots=True)
class Instance(ObjectContent):
    """A complete copy of a template or object type inside a strategy or template.

    ``key`` is the key in an expression; if it is not given it is formed from the name
    (without a check against other keys: the factory functions of
    :mod:`pipwerk_domain.operations` make it unique)."""

    name: str
    key: str = ""
    origin: Origin | None = None
    first_use: str | None = None
    """The identifier (UUID) of the element with which the user first connected the instance,
    ``None`` if there is none (specification 3.3)."""

    def __post_init__(self) -> None:
        if not self.key:
            self.key = identifier_from_name(self.name)


@dataclass(kw_only=True, slots=True)
class Template(ObjectContent):
    """A stored indicator, trend, rule or ruleset (glossary "Vorlage")."""

    id: str
    name: str
    description: str = ""


@dataclass(frozen=True, slots=True)
class Position:
    """The place of an element on the drawing area, set by the user (specification 3.3)."""

    x: float
    y: float


class InputKind(StrEnum):
    """What an input names of the instance: a property or a method (specification 3.3)."""

    PROPERTY = "property"
    METHOD = "method"


@dataclass(frozen=True, slots=True)
class ElementInput:
    """An input of an element: a value that the user has connected to the element, by the key
    of an instance on the drawing area and either its property or its method with the values of
    the arguments, with the indication "Aktualisieren" (specification 3.3).

    ``property`` is the identifier of the property or, for ``kind`` method, of the method.
    ``arguments`` are the fixed values of the arguments of the method, in the order of the
    method; an optional argument that is left out has its default value. Both are empty for a
    property."""

    instance: str
    property: str
    kind: InputKind = InputKind.PROPERTY
    arguments: tuple[Scalar, ...] = ()
    refresh: bool = False


@dataclass(kw_only=True, slots=True)
class Element:
    """An element on the drawing area.

    ``name`` is set for an element without an instance; an element with an instance has the
    name of the instance. ``key`` is the key of a condition or calculation in an expression.
    ``position`` is set only if the user moved the element."""

    id: str
    type: str
    name: str | None = None
    key: str | None = None
    position: Position | None = None
    parameters: dict[str, Binding] = field(default_factory=dict)
    properties: dict[str, Binding] = field(default_factory=dict)
    inputs: list[ElementInput] = field(default_factory=list)
    rules: list[Instance] = field(default_factory=list)
    management_of: str | None = None
    instance: Instance | None = None

    def __post_init__(self) -> None:
        named = self.type in (FLOW_CONDITION, FLOW_CALCULATION)
        if self.key is None and named and self.name and self.instance is None:
            self.key = identifier_from_name(self.name) or None

    @property
    def shown_name(self) -> str | None:
        """The name the user sees: the name of the instance or of the element."""
        return self.instance.name if self.instance is not None else self.name


def new_id() -> str:
    """A new identifier (UUID) of a strategy, element, connection or section."""
    return str(uuid4())


@dataclass(slots=True)
class Connection:
    """A connection from an output of an element to an element."""

    source: str
    output: str
    target: str
    id: str = field(default_factory=new_id)


@dataclass(slots=True)
class Section:
    """A section: a named group of elements of one flow that can be collapsed
    (specification 3.3). ``flow`` is the identifier of the element "Order aufgeben" whose
    management the section belongs to, or ``None`` for the main flow."""

    name: str
    flow: str | None = None
    elements: list[str] = field(default_factory=list)
    collapsed: bool = False
    id: str = field(default_factory=new_id)


@dataclass(slots=True)
class Management:
    """The management of a placed order: the elements that belong to the element
    "Order aufgeben" ``order_element`` (specification 3.3)."""

    order_element: Element
    elements: list[Element]


@dataclass(kw_only=True, slots=True)
class Strategy:
    """A strategy (specification 3.3)."""

    id: str
    name: str
    description: str = ""
    parameters: list[StrategyParameter] = field(default_factory=list)
    rules: list[Instance] = field(default_factory=list)
    elements: list[Element] = field(default_factory=list)
    connections: list[Connection] = field(default_factory=list)
    sections: list[Section] = field(default_factory=list)
    orientation: Orientation = Orientation.VERTICAL
    collapsed_managements: list[str] = field(default_factory=list)

    def element(self, element_id: str) -> Element | None:
        for item in self.elements:
            if item.id == element_id:
                return item
        return None

    def main_elements(self) -> list[Element]:
        """The elements of the main flow (not part of a management)."""
        return [item for item in self.elements if item.management_of is None]

    def management(self, order_element_id: str) -> Management | None:
        """The management of the element "Order aufgeben" with this identifier."""
        order_element = self.element(order_element_id)
        if order_element is None:
            return None
        return Management(
            order_element,
            [item for item in self.elements if item.management_of == order_element_id],
        )

    def managements(self) -> list[Management]:
        """All managements, one for each element that has elements in its management."""
        result: list[Management] = []
        seen: set[str] = set()
        for item in self.elements:
            owner = item.management_of
            if owner is None or owner in seen:
                continue
            seen.add(owner)
            management = self.management(owner)
            if management is not None:
                result.append(management)
        return result
