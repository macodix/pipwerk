"""Pydantic models of the documents (specification 3.7). Only this package uses Pydantic.

The models are strict (no conversion of values) and reject additional fields. The JSON
schemas under ``contracts/strategies/v1/`` are generated from them.
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
from pipwerk_domain.limits import (
    MAX_CONNECTIONS,
    MAX_ELEMENTS,
    MAX_EXPRESSION_LENGTH,
    MAX_EXPRESSION_NESTING,
    MAX_INSTANCE_NESTING,
    MAX_RULES_PER_LIST,
    MAX_STRATEGY_PARAMETERS,
)

FORMAT_VERSION = "1.0"
"""Version of the document format written by this library."""

SUPPORTED_MAJOR_VERSION = 1
"""A document with another major version is rejected."""

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
BindingKindName = Literal["fixed", "parameter", "expression", "application"]
ComparisonName = Literal["hoechstens", "mindestens", "gleich"]


def _check_depth(text: str) -> str:
    if nesting_depth(text) > MAX_EXPRESSION_NESTING:
        raise ValueError(f"expression nested deeper than {MAX_EXPRESSION_NESTING} levels")
    return text


Expression = Annotated[
    str,
    Field(max_length=MAX_EXPRESSION_LENGTH, description="Expression in OpenFormula notation"),
    AfterValidator(_check_depth),
]
UuidString = Annotated[str, Field(pattern=UUID_PATTERN)]
RuleList = Annotated[list["InstanceDocument"], Field(max_length=MAX_RULES_PER_LIST)]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class BindingDocument(_Strict):
    """Value of a parameter or property with its kind of binding."""

    kind: BindingKindName
    value: bool | int | float | str | None = None

    @model_validator(mode="after")
    def _check_value(self) -> BindingDocument:
        if self.kind == "fixed" and self.value is None:
            raise ValueError("a fixed binding needs a value")
        if self.kind in ("parameter", "expression") and not isinstance(self.value, str):
            raise ValueError(f"a binding of the kind {self.kind} needs a text as value")
        if self.kind == "application" and self.value is not None:
            raise ValueError("a binding of the kind application has no value")
        if self.kind == "expression" and isinstance(self.value, str):
            if len(self.value) > MAX_EXPRESSION_LENGTH:
                raise ValueError(f"expression longer than {MAX_EXPRESSION_LENGTH} characters")
            _check_depth(self.value)
        return self


class OriginDocument(_Strict):
    """Origin of an instance: object type and, if known, identifier and title of the template."""

    object_type: str
    template_id: UuidString | None = None
    template_title: str | None = None


class ParameterDefinitionDocument(_Strict):
    """Own parameter of a template or instance."""

    name: str
    datatype: DataTypeName
    required: bool = False
    default: bool | int | float | str | None = None
    choices: list[str] = Field(default_factory=list)


class PropertyDefinitionDocument(_Strict):
    """Own property of an indicator or trend with its expression."""

    name: str
    datatype: DataTypeName
    expression: Expression
    choices: list[str] = Field(default_factory=list)


class StrategyParameterDocument(_Strict):
    """Parameter of a strategy: a value or "at the application"."""

    name: str
    datatype: DataTypeName
    value: bool | int | float | str | None = None
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
    name: str
    object_type: str
    origin: OriginDocument | None = None


class InstanceDocument(_Content, _InstanceHead):
    """A complete copy of a template or object type (E4). The base classes are in this
    order so that name, object type and origin come before the content."""


class ElementDocument(_Strict):
    """An element on the drawing area. The type is a text; an unknown type is valid and
    its values are kept."""

    id: UuidString
    type: str
    title: str = ""
    name: str | None = None
    x: float = 0.0
    y: float = 0.0
    parameters: dict[str, BindingDocument] = Field(default_factory=dict)
    properties: dict[str, BindingDocument] = Field(default_factory=dict)
    rules: RuleList = Field(default_factory=list)
    management_of: UuidString | None = None
    instance: InstanceDocument | None = None


class ConnectionDocument(_Strict):
    """A connection from an output of an element to an element."""

    source: UuidString
    output: str
    target: UuidString


class _Document(_Strict):
    format_version: str = Field(
        pattern=rf"^{SUPPORTED_MAJOR_VERSION}\.[0-9]+$",
        description="Version of the format; a document of a higher major version is rejected",
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
    title: str
    description: str = ""
    parameters: list[StrategyParameterDocument] = Field(
        default_factory=list, max_length=MAX_STRATEGY_PARAMETERS
    )
    rules: RuleList = Field(default_factory=list)
    elements: list[ElementDocument] = Field(default_factory=list, max_length=MAX_ELEMENTS)
    connections: list[ConnectionDocument] = Field(default_factory=list, max_length=MAX_CONNECTIONS)

    @model_validator(mode="before")
    @classmethod
    def _nesting(cls, data: object) -> object:
        return _check_nesting(data)


class _TemplateDocument(_Document, _Content):
    id: UuidString
    title: str
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
