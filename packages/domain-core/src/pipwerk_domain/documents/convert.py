"""Translation between documents and the object model, in both directions. Writing and
reading again gives the same object."""

from typing import TypedDict

from pipwerk_domain.catalog import TYPE_RULE, TYPE_RULESET, TYPE_TREND
from pipwerk_domain.documents.models import (
    FORMAT_VERSION,
    AnyDocument,
    BindingDocument,
    ComparisonName,
    ConnectionDocument,
    ElementDocument,
    IndicatorDocument,
    InstanceDocument,
    OriginDocument,
    ParameterDefinitionDocument,
    PropertyDefinitionDocument,
    RuleDocument,
    RulesetDocument,
    StrategyDocument,
    StrategyParameterDocument,
    TrendDocument,
)
from pipwerk_domain.model import (
    Binding,
    Comparison,
    Connection,
    Element,
    Instance,
    ObjectContent,
    Origin,
    ParameterDefinition,
    PropertyDefinition,
    Strategy,
    StrategyParameter,
    Template,
)
from pipwerk_domain.typedesc import BindingKind, DataType

type TemplateDocument = IndicatorDocument | TrendDocument | RuleDocument | RulesetDocument


class _DocumentFields(TypedDict):
    """The content fields of a document that templates and instances share."""

    parameter_values: dict[str, BindingDocument]
    parameters: list[ParameterDefinitionDocument]
    properties: list[PropertyDefinitionDocument]
    instances: list[InstanceDocument]
    rules: list[InstanceDocument]
    expression: str | None
    determined_property: str | None
    comparison: ComparisonName | None
    result_expression: str | None


class _ModelFields(TypedDict):
    """The content fields of the object model that templates and instances share."""

    object_type: str
    parameter_values: dict[str, Binding]
    parameters: list[ParameterDefinition]
    properties: list[PropertyDefinition]
    instances: list[Instance]
    rules: list[Instance]
    expression: str | None
    determined_property: str | None
    comparison: Comparison | None
    result_expression: str | None


class _TemplateHead(TypedDict):
    format_version: str
    id: str
    title: str
    description: str


# model -> document ------------------------------------------------------------------


def _bindings_to_document(values: dict[str, Binding]) -> dict[str, BindingDocument]:
    return {
        name: BindingDocument(kind=binding.kind.value, value=binding.value)
        for name, binding in values.items()
    }


def _content_to_fields(content: ObjectContent) -> _DocumentFields:
    comparison = content.comparison
    return {
        "parameter_values": _bindings_to_document(content.parameter_values),
        "parameters": [
            ParameterDefinitionDocument(
                name=item.name,
                datatype=item.datatype.value,
                required=item.required,
                default=item.default,
                choices=list(item.choices),
            )
            for item in content.parameters
        ],
        "properties": [
            PropertyDefinitionDocument(
                name=item.name,
                datatype=item.datatype.value,
                expression=item.expression,
                choices=list(item.choices),
            )
            for item in content.properties
        ],
        "instances": [_instance_to_document(item) for item in content.instances],
        "rules": [_instance_to_document(item) for item in content.rules],
        "expression": content.expression,
        "determined_property": content.determined_property,
        "comparison": None if comparison is None else comparison.value,
        "result_expression": content.result_expression,
    }


def _instance_to_document(instance: Instance) -> InstanceDocument:
    origin = instance.origin
    return InstanceDocument(
        name=instance.name,
        object_type=instance.object_type,
        origin=None
        if origin is None
        else OriginDocument(
            object_type=origin.object_type,
            template_id=origin.template_id,
            template_title=origin.template_title,
        ),
        **_content_to_fields(instance),
    )


def _element_to_document(element: Element) -> ElementDocument:
    return ElementDocument(
        id=element.id,
        type=element.type,
        title=element.title,
        name=element.name,
        x=element.x,
        y=element.y,
        parameters=_bindings_to_document(element.parameters),
        properties=_bindings_to_document(element.properties),
        rules=[_instance_to_document(item) for item in element.rules],
        management_of=element.management_of,
        instance=None if element.instance is None else _instance_to_document(element.instance),
    )


def strategy_to_document(strategy: Strategy) -> StrategyDocument:
    """The document of a strategy."""
    return StrategyDocument(
        format="pipwerk.strategy",
        format_version=FORMAT_VERSION,
        id=strategy.id,
        title=strategy.title,
        description=strategy.description,
        parameters=[
            StrategyParameterDocument(
                name=item.name,
                datatype=item.datatype.value,
                value=item.value,
                at_application=item.at_application,
                choices=list(item.choices),
            )
            for item in strategy.parameters
        ],
        rules=[_instance_to_document(item) for item in strategy.rules],
        elements=[_element_to_document(item) for item in strategy.elements],
        connections=[
            ConnectionDocument(source=item.source, output=item.output, target=item.target)
            for item in strategy.connections
        ],
    )


def template_to_document(template: Template) -> TemplateDocument:
    """The document of a template; its format follows the object type."""
    fields = _content_to_fields(template)
    head = _TemplateHead(
        format_version=FORMAT_VERSION,
        id=template.id,
        title=template.title,
        description=template.description,
    )
    if template.object_type == TYPE_TREND:
        return TrendDocument(format="pipwerk.trend", object_type="Trend", **head, **fields)
    if template.object_type == TYPE_RULE:
        return RuleDocument(format="pipwerk.rule", object_type="Regel", **head, **fields)
    if template.object_type == TYPE_RULESET:
        return RulesetDocument(format="pipwerk.ruleset", object_type="Regelwerk", **head, **fields)
    return IndicatorDocument(
        format="pipwerk.indicator", object_type=template.object_type, **head, **fields
    )


# document -> model ------------------------------------------------------------------


def _bindings_from_document(values: dict[str, BindingDocument]) -> dict[str, Binding]:
    return {name: Binding(BindingKind(item.kind), item.value) for name, item in values.items()}


def _content_from_document(document: InstanceDocument | TemplateDocument) -> _ModelFields:
    comparison = document.comparison
    return {
        "object_type": document.object_type,
        "parameter_values": _bindings_from_document(document.parameter_values),
        "parameters": [
            ParameterDefinition(
                item.name, DataType(item.datatype), item.required, item.default, tuple(item.choices)
            )
            for item in document.parameters
        ],
        "properties": [
            PropertyDefinition(
                item.name, DataType(item.datatype), item.expression, tuple(item.choices)
            )
            for item in document.properties
        ],
        "instances": [_instance_from_document(item) for item in document.instances],
        "rules": [_instance_from_document(item) for item in document.rules],
        "expression": document.expression,
        "determined_property": document.determined_property,
        "comparison": None if comparison is None else Comparison(comparison),
        "result_expression": document.result_expression,
    }


def _instance_from_document(document: InstanceDocument) -> Instance:
    origin = document.origin
    return Instance(
        name=document.name,
        origin=None
        if origin is None
        else Origin(origin.object_type, origin.template_id, origin.template_title),
        **_content_from_document(document),
    )


def _element_from_document(document: ElementDocument) -> Element:
    return Element(
        id=document.id,
        type=document.type,
        title=document.title,
        name=document.name,
        x=document.x,
        y=document.y,
        parameters=_bindings_from_document(document.parameters),
        properties=_bindings_from_document(document.properties),
        rules=[_instance_from_document(item) for item in document.rules],
        management_of=document.management_of,
        instance=None if document.instance is None else _instance_from_document(document.instance),
    )


def strategy_from_document(document: StrategyDocument) -> Strategy:
    """The strategy of a document."""
    return Strategy(
        id=document.id,
        title=document.title,
        description=document.description,
        parameters=[
            StrategyParameter(
                item.name,
                DataType(item.datatype),
                item.value,
                item.at_application,
                tuple(item.choices),
            )
            for item in document.parameters
        ],
        rules=[_instance_from_document(item) for item in document.rules],
        elements=[_element_from_document(item) for item in document.elements],
        connections=[
            Connection(item.source, item.output, item.target) for item in document.connections
        ],
    )


def template_from_document(document: TemplateDocument) -> Template:
    """The template of a document."""
    return Template(
        id=document.id,
        title=document.title,
        description=document.description,
        **_content_from_document(document),
    )


def from_document(document: AnyDocument) -> Strategy | Template:
    """The strategy or template of any document."""
    if isinstance(document, StrategyDocument):
        return strategy_from_document(document)
    return template_from_document(document)


def to_document(value: Strategy | Template) -> AnyDocument:
    """The document of a strategy or template."""
    if isinstance(value, Strategy):
        return strategy_to_document(value)
    return template_to_document(value)
