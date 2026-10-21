"""Pydantic models of the documents of the format 2.0 (specification 3.7). Only this package
uses Pydantic.

The models are strict (no conversion of values) and reject additional fields. The JSON
schemas under ``contracts/strategies/v2/`` are generated from them. Documents of the format
1.0 are read by the models in :mod:`pipwerk_domain.documents.v1` and converted.
"""

from typing import Annotated, Literal

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)

from pipwerk_domain.expressions import nesting_depth
from pipwerk_domain.identifiers import KEY_PATTERN
from pipwerk_domain.limits import (
    MAX_CONNECTIONS,
    MAX_ELEMENTS,
    MAX_EXPRESSION_LENGTH,
    MAX_EXPRESSION_NESTING,
    MAX_INPUTS_PER_ELEMENT,
    MAX_INSTANCE_NESTING,
    MAX_KEY_LENGTH,
    MAX_NAME_LENGTH,
    MAX_RULES_PER_LIST,
    MAX_STRATEGY_PARAMETERS,
)

FORMAT_VERSION = "2.0"
"""Version of the document format written by this library."""

SUPPORTED_MAJOR_VERSION = 2
"""A document with another major version is rejected; a document of the major version 1 is
read by converting it (specification 3.7)."""

UUID_PATTERN = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"

DataTypeName = Literal[
    "number",
    "integer",
    "percent",
    "boolean",
    "text",
    "choice",
    "time_unit",
    "timestamp",
    "date",
    "expression",
    "object",
]
BindingKindName = Literal["fixed", "parameter", "connection", "expression", "application"]
ComparisonName = Literal["hoechstens", "mindestens", "gleich"]
OrientationName = Literal["vertical", "horizontal"]


def _check_depth(text: str) -> str:
    if nesting_depth(text) > MAX_EXPRESSION_NESTING:
        raise ValueError(f"expression nested deeper than {MAX_EXPRESSION_NESTING} levels")
    return text


Expression = Annotated[
    str,
    Field(max_length=MAX_EXPRESSION_LENGTH, description="Expression in OpenFormula notation"),
    AfterValidator(_check_depth),
]
FiniteFloat = Annotated[float, Field(allow_inf_nan=False)]
"""A decimal number; ``NaN``, ``Infinity`` and numbers that become infinite are no values."""
ScalarValue = bool | int | FiniteFloat | str
"""The value of a fixed binding, a default or a strategy parameter."""
UuidString = Annotated[str, Field(pattern=UUID_PATTERN)]
Key = Annotated[
    str,
    Field(
        pattern=KEY_PATTERN,
        max_length=MAX_KEY_LENGTH,
        description="Key of an object in an expression: a simple name",
    ),
]
Name = Annotated[str, Field(max_length=MAX_NAME_LENGTH, description="Name of the user, free text")]
RuleList = Annotated[list["InstanceDocument"], Field(max_length=MAX_RULES_PER_LIST)]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class DataLinkDocument(_Strict):
    """The value of a data connection: a property of an instance on the drawing area, by the
    keys of the instance and of the property."""

    instance: Key
    property: Key


class BindingDocument(_Strict):
    """Value of a parameter or property with its kind of binding."""

    kind: BindingKindName
    value: ScalarValue | DataLinkDocument | None = None

    @model_validator(mode="after")
    def _check_value(self) -> BindingDocument:
        if self.kind == "fixed" and (
            self.value is None or isinstance(self.value, DataLinkDocument)
        ):
            raise ValueError("a fixed binding needs a value")
        if self.kind in ("parameter", "expression") and not isinstance(self.value, str):
            raise ValueError(f"a binding of the kind {self.kind} needs a text as value")
        if self.kind == "connection" and not isinstance(self.value, DataLinkDocument):
            raise ValueError("a binding of the kind connection needs an instance and a property")
        if self.kind == "application" and self.value is not None:
            raise ValueError("a binding of the kind application has no value")
        if self.kind == "expression" and isinstance(self.value, str):
            if len(self.value) > MAX_EXPRESSION_LENGTH:
                raise ValueError(f"expression longer than {MAX_EXPRESSION_LENGTH} characters")
            _check_depth(self.value)
        return self


class OriginDocument(_Strict):
    """Origin of an instance: object type and, if known, the identifier of the template and,
    for a template of the user only, its name at the time of insertion."""

    object_type: str
    template_id: UuidString | None = None
    template_name: Name | None = None


class ParameterDefinitionDocument(_Strict):
    """Own parameter of a template or instance."""

    key: Key
    name: Name
    datatype: DataTypeName
    object_type: str | None = None
    required: bool = False
    default: ScalarValue | None = None
    choices: list[str] = Field(default_factory=list)


class PropertyDefinitionDocument(_Strict):
    """Own property of an indicator or trend with its expression."""

    key: Key
    name: Name
    datatype: DataTypeName
    object_type: str | None = None
    expression: Expression
    choices: list[str] = Field(default_factory=list)


class StrategyParameterDocument(_Strict):
    """Parameter of a strategy: a value or "at the application"."""

    key: Key
    name: Name
    datatype: DataTypeName
    object_type: str | None = None
    value: ScalarValue | None = None
    at_application: bool = False
    choices: list[str] = Field(default_factory=list)


class _Content(_Strict):
    """Content that templates and instances share."""

    parameter_values: dict[str, BindingDocument] = Field(default_factory=dict)
    parameters: list[ParameterDefinitionDocument] = Field(default_factory=list)
    properties: list[PropertyDefinitionDocument] = Field(default_factory=list)
    instances: list[InstanceDocument] = Field(default_factory=list)
    rules: RuleList = Field(default_factory=list)
    expression: Expression | None = None
    determined_property: str | None = None
    comparison: ComparisonName | None = None
    result_expression: Expression | None = None


class _InstanceHead(_Strict):
    name: Name
    key: Key
    object_type: str
    origin: OriginDocument | None = None


class InstanceDocument(_Content, _InstanceHead):
    """A complete copy of a template or object type (E4). The base classes are in this
    order so that name, key, object type and origin come before the content."""


class PositionDocument(_Strict):
    """The place of an element on the drawing area, set by the user."""

    x: FiniteFloat
    y: FiniteFloat


class InputDocument(_Strict):
    """An input of an element: a property of an instance on the drawing area."""

    instance: Key
    property: Key


class ElementDocument(_Strict):
    """An element on the drawing area. The type is a text; an unknown type is valid and
    its values are kept. An element with an instance has no name and no key of its own."""

    id: UuidString
    type: str
    name: Name | None = None
    key: Key | None = None
    position: PositionDocument | None = None
    parameters: dict[str, BindingDocument] = Field(default_factory=dict)
    properties: dict[str, BindingDocument] = Field(default_factory=dict)
    inputs: list[InputDocument] = Field(default_factory=list, max_length=MAX_INPUTS_PER_ELEMENT)
    rules: RuleList = Field(default_factory=list)
    management_of: UuidString | None = None
    instance: InstanceDocument | None = None

    @model_validator(mode="after")
    def _check_instance(self) -> ElementDocument:
        if self.instance is not None and (self.name is not None or self.key is not None):
            raise ValueError("an element with an instance has neither a name nor a key")
        return self


class ConnectionDocument(_Strict):
    """A connection from an output of an element to an element."""

    id: UuidString
    source: UuidString
    output: str
    target: UuidString


class SectionDocument(_Strict):
    """A section: a named group of elements of one flow that can be collapsed. ``flow`` is the
    identifier of the element "Order aufgeben" whose management the section belongs to, or
    ``null`` for the main flow."""

    id: UuidString
    name: Name
    flow: UuidString | None = None
    elements: list[UuidString] = Field(default_factory=list, max_length=MAX_ELEMENTS)
    collapsed: bool = False


class _Document(_Strict):
    format_version: str = Field(
        pattern=rf"^{SUPPORTED_MAJOR_VERSION}\.[0-9]+$",
        description=(
            "Version of the format; a document of a higher major version is rejected, one of "
            "the major version 1 is read by converting it"
        ),
    )


_NESTING_KEYS = ("instance", "instances", "rules", "elements")


def _check_nesting(data: object) -> object:
    """Reject instances nested deeper than the limit before the models are built, so that
    deep nesting cannot exhaust the stack."""
    if not isinstance(data, dict):
        return data
    stack: list[tuple[object, int]] = [(data, 0)]
    while stack:
        node, level = stack.pop()
        if not isinstance(node, dict):
            continue
        for key in _NESTING_KEYS:
            child = node.get(key)
            if key == "elements" and isinstance(child, list):
                stack.extend((item, 0) for item in child)
            elif key == "instance" and isinstance(child, dict):
                _push(stack, child, level + 1)
            elif key in ("instances", "rules") and isinstance(child, list):
                for item in child:
                    _push(stack, item, level + 1)
    return data


def _push(stack: list[tuple[object, int]], item: object, level: int) -> None:
    if level > MAX_INSTANCE_NESTING:
        raise ValueError(f"instances nested deeper than {MAX_INSTANCE_NESTING} levels")
    stack.append((item, level))


class StrategyDocument(_Document):
    """Document of a strategy (format ``pipwerk.strategy``)."""

    format: Literal["pipwerk.strategy"]
    id: UuidString
    name: Name
    description: str = ""
    parameters: list[StrategyParameterDocument] = Field(
        default_factory=list, max_length=MAX_STRATEGY_PARAMETERS
    )
    rules: RuleList = Field(default_factory=list)
    elements: list[ElementDocument] = Field(default_factory=list, max_length=MAX_ELEMENTS)
    connections: list[ConnectionDocument] = Field(default_factory=list, max_length=MAX_CONNECTIONS)
    sections: list[SectionDocument] = Field(default_factory=list, max_length=MAX_ELEMENTS)
    orientation: OrientationName = "vertical"
    collapsed_managements: list[UuidString] = Field(default_factory=list, max_length=MAX_ELEMENTS)

    @model_validator(mode="before")
    @classmethod
    def _nesting(cls, data: object) -> object:
        return _check_nesting(data)

    @model_validator(mode="after")
    def _check_sections(self) -> StrategyDocument:
        if len(self.sections) > len(self.elements):
            raise ValueError("a strategy has at most as many sections as elements")
        return self


class _TemplateDocument(_Document, _Content):
    id: UuidString
    name: Name
    description: str = ""

    @model_validator(mode="before")
    @classmethod
    def _nesting(cls, data: object) -> object:
        return _check_nesting(data)


class IndicatorDocument(_TemplateDocument):
    """Document of an indicator: ``Indikator`` or a delivered indicator type."""

    format: Literal["pipwerk.indicator"]
    object_type: str


class TrendDocument(_TemplateDocument):
    """Document of a trend."""

    format: Literal["pipwerk.trend"]
    object_type: Literal["Trend"]


class RuleDocument(_TemplateDocument):
    """Document of a rule."""

    format: Literal["pipwerk.rule"]
    object_type: Literal["Regel"]


class RulesetDocument(_TemplateDocument):
    """Document of a ruleset."""

    format: Literal["pipwerk.ruleset"]
    object_type: Literal["Regelwerk"]


type AnyDocument = (
    StrategyDocument | IndicatorDocument | TrendDocument | RuleDocument | RulesetDocument
)

DOCUMENT_MODELS: dict[str, type[AnyDocument]] = {
    "pipwerk.strategy": StrategyDocument,
    "pipwerk.indicator": IndicatorDocument,
    "pipwerk.trend": TrendDocument,
    "pipwerk.rule": RuleDocument,
    "pipwerk.ruleset": RulesetDocument,
}
"""The document models by value of the field ``format``."""

_RECURSIVE_MODELS: tuple[type[BaseModel], ...] = (
    _Content,
    InstanceDocument,
    ElementDocument,
    StrategyDocument,
    IndicatorDocument,
    TrendDocument,
    RuleDocument,
    RulesetDocument,
)
for _model in _RECURSIVE_MODELS:  # resolve the forward references of the recursive models
    _model.model_rebuild()
