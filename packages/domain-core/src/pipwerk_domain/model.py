"""Object model (specification 3.3, E4): plain Python classes without frameworks."""

from dataclasses import dataclass, field
from enum import StrEnum

from pipwerk_domain.typedesc import BindingKind, DataType, Scalar


class Comparison(StrEnum):
    """Comparison of a determining rule when it checks (specification 3.5)."""

    AT_MOST = "hoechstens"
    AT_LEAST = "mindestens"
    EQUAL = "gleich"


@dataclass(slots=True)
class Binding:
    """The value of a parameter or property with its kind of binding.

    ``fixed``: ``value`` is the fixed value; ``parameter``: ``value`` is the name of a
    strategy parameter or, within a template, of a parameter of the template;
    ``expression``: ``value`` is the expression; ``application``: no value, the
    application passes it.
    """

    kind: BindingKind
    value: Scalar | None = None


@dataclass(slots=True)
class Origin:
    """Origin of an instance: object type and, if it was made from a template,
    its identifier and title at the time of insertion."""

    object_type: str
    template_id: str | None = None
    template_title: str | None = None


@dataclass(slots=True)
class ParameterDefinition:
    """Own parameter of a template or instance (name, data type, mandatory, default)."""

    name: str
    datatype: DataType
    required: bool = False
    default: Scalar | None = None
    choices: tuple[str, ...] = ()


@dataclass(slots=True)
class PropertyDefinition:
    """Own property of an indicator or trend with the expression that determines it."""

    name: str
    datatype: DataType
    expression: str
    choices: tuple[str, ...] = ()


@dataclass(slots=True)
class StrategyParameter:
    """Parameter of a strategy: a value, or "at the application"."""

    name: str
    datatype: DataType
    value: Scalar | None = None
    at_application: bool = False
    choices: tuple[str, ...] = ()


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
    """A complete copy of a template or object type inside a strategy or template."""

    name: str
    origin: Origin | None = None


@dataclass(kw_only=True, slots=True)
class Template(ObjectContent):
    """A stored indicator, trend, rule or ruleset (glossary "Vorlage")."""

    id: str
    title: str
    description: str = ""


@dataclass(kw_only=True, slots=True)
class Element:
    """An element on the drawing area."""

    id: str
    type: str
    title: str = ""
    name: str | None = None
    x: float = 0.0
    y: float = 0.0
    parameters: dict[str, Binding] = field(default_factory=dict)
    properties: dict[str, Binding] = field(default_factory=dict)
    rules: list[Instance] = field(default_factory=list)
    management_of: str | None = None
    instance: Instance | None = None


@dataclass(slots=True)
class Connection:
    """A connection from an output of an element to an element."""

    source: str
    output: str
    target: str


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
    title: str
    description: str = ""
    parameters: list[StrategyParameter] = field(default_factory=list)
    rules: list[Instance] = field(default_factory=list)
    elements: list[Element] = field(default_factory=list)
    connections: list[Connection] = field(default_factory=list)

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
