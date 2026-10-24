"""Translation between documents of the format 2.0 and the object model, in both directions.
Writing and reading again gives the same object."""

from typing import TypedDict

from pipwerk_domain.catalog import TYPE_RULE, TYPE_RULESET, TYPE_TREND
from pipwerk_domain.documents.models import (
    FORMAT_VERSION,
    AnyDocument,
    BindingDocument,
    ComparisonName,
    ConnectionDocument,
    DataLinkDocument,
    ElementDocument,
    IndicatorDocument,
    InputDocument,
    InstanceDocument,
    OriginDocument,
    ParameterDefinitionDocument,
    PositionDocument,
    PropertyDefinitionDocument,
    RuleDocument,
    RulesetDocument,
    SectionDocument,
    StrategyDocument,
    StrategyParameterDocument,
    TrendDocument,
)
from pipwerk_domain.model import (
    Binding,
    Comparison,
    Connection,
    DataLink,
    Element,
    ElementInput,
    InputKind,
    Instance,
    ObjectContent,
    Orientation,
    Origin,
    ParameterDefinition,
    Position,
    PropertyDefinition,
    Section,
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
    name: str
    description: str


# model -> document ------------------------------------------------------------------


def _binding_to_document(binding: Binding) -> BindingDocument:
    value = binding.value
    if isinstance(value, DataLink):
        return BindingDocument(
            kind=binding.kind.value,
            value=DataLinkDocument(instance=value.instance, property=value.property),
        )
    return BindingDocument(kind=binding.kind.value, value=value)


def _bindings_to_document(values: dict[str, Binding]) -> dict[str, BindingDocument]:
    return {name: _binding_to_document(binding) for name, binding in values.items()}


def _content_to_fields(content: ObjectContent) -> _DocumentFields:
    comparison = content.comparison
    return {
        "parameter_values": _bindings_to_document(content.parameter_values),
        "parameters": [
            ParameterDefinitionDocument(
                key=item.key,
                name=item.name,
                datatype=item.datatype.value,
                object_type=item.object_type,
                required=item.required,
                default=item.default,
                choices=list(item.choices),
            )
            for item in content.parameters
        ],
        "properties": [
            PropertyDefinitionDocument(
                key=item.key,
                name=item.name,
                datatype=item.datatype.value,
                object_type=item.object_type,
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
        key=instance.key,
        object_type=instance.object_type,
        origin=None
        if origin is None
        else OriginDocument(
            object_type=origin.object_type,
            template_id=origin.template_id,
            template_name=origin.template_name,
        ),
        first_use=instance.first_use,
        **_content_to_fields(instance),
    )


def _element_to_document(element: Element) -> ElementDocument:
    position = element.position
    return ElementDocument(
        id=element.id,
        type=element.type,
        name=element.name,
        key=element.key,
        position=None if position is None else PositionDocument(x=position.x, y=position.y),
        parameters=_bindings_to_document(element.parameters),
        properties=_bindings_to_document(element.properties),
        inputs=[
            InputDocument(
                instance=item.instance,
                property=item.property,
                kind=item.kind.value,
                arguments=list(item.arguments),
                refresh=item.refresh,
            )
            for item in element.inputs
        ],
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
        name=strategy.name,
        description=strategy.description,
        parameters=[
            StrategyParameterDocument(
                key=item.key,
                name=item.name,
                datatype=item.datatype.value,
                object_type=item.object_type,
                value=item.value,
                at_application=item.at_application,
                choices=list(item.choices),
            )
            for item in strategy.parameters
        ],
        rules=[_instance_to_document(item) for item in strategy.rules],
        elements=[_element_to_document(item) for item in strategy.elements],
        connections=[
            ConnectionDocument(
                id=item.id, source=item.source, output=item.output, target=item.target
            )
            for item in strategy.connections
        ],
        sections=[
            SectionDocument(
                id=item.id,
                name=item.name,
                flow=item.flow,
                elements=list(item.elements),
                collapsed=item.collapsed,
            )
            for item in strategy.sections
        ],
        orientation=strategy.orientation.value,
        collapsed_managements=list(strategy.collapsed_managements),
    )


def template_to_document(template: Template) -> TemplateDocument:
    """The document of a template; its format follows the object type."""
    fields = _content_to_fields(template)
    head = _TemplateHead(
        format_version=FORMAT_VERSION,
        id=template.id,
        name=template.name,
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


def _binding_from_document(item: BindingDocument) -> Binding:
    value = item.value
    if isinstance(value, DataLinkDocument):
        return Binding(BindingKind(item.kind), DataLink(value.instance, value.property))
    return Binding(BindingKind(item.kind), value)


def _bindings_from_document(values: dict[str, BindingDocument]) -> dict[str, Binding]:
    return {name: _binding_from_document(item) for name, item in values.items()}


def _content_from_document(document: InstanceDocument | TemplateDocument) -> _ModelFields:
    comparison = document.comparison
    return {
        "object_type": document.object_type,
        "parameter_values": _bindings_from_document(document.parameter_values),
        "parameters": [
            ParameterDefinition(
                item.name,
                DataType(item.datatype),
                item.required,
                item.default,
                tuple(item.choices),
                item.key,
                item.object_type,
            )
            for item in document.parameters
        ],
        "properties": [
            PropertyDefinition(
                item.name,
                DataType(item.datatype),
                item.expression,
                tuple(item.choices),
                item.key,
                item.object_type,
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
        key=document.key,
        origin=None
        if origin is None
        else Origin(origin.object_type, origin.template_id, origin.template_name),
        first_use=document.first_use,
        **_content_from_document(document),
    )


def _element_from_document(document: ElementDocument) -> Element:
    position = document.position
    return Element(
        id=document.id,
        type=document.type,
        name=document.name,
        key=document.key,
        position=None if position is None else Position(position.x, position.y),
        parameters=_bindings_from_document(document.parameters),
        properties=_bindings_from_document(document.properties),
        inputs=[
            ElementInput(
                item.instance,
                item.property,
                InputKind(item.kind),
                tuple(item.arguments),
                item.refresh,
            )
            for item in document.inputs
        ],
        rules=[_instance_from_document(item) for item in document.rules],
        management_of=document.management_of,
        instance=None if document.instance is None else _instance_from_document(document.instance),
    )


def strategy_from_document(document: StrategyDocument) -> Strategy:
    """The strategy of a document."""
    return Strategy(
        id=document.id,
        name=document.name,
        description=document.description,
        parameters=[
            StrategyParameter(
                item.name,
                DataType(item.datatype),
                item.value,
                item.at_application,
                tuple(item.choices),
                item.key,
                item.object_type,
            )
            for item in document.parameters
        ],
        rules=[_instance_from_document(item) for item in document.rules],
        elements=[_element_from_document(item) for item in document.elements],
        connections=[
            Connection(item.source, item.output, item.target, item.id)
            for item in document.connections
        ],
        sections=[
            Section(item.name, item.flow, list(item.elements), item.collapsed, item.id)
            for item in document.sections
        ],
        orientation=Orientation(document.orientation),
        collapsed_managements=list(document.collapsed_managements),
    )


def template_from_document(document: TemplateDocument) -> Template:
    """The template of a document."""
    return Template(
        id=document.id,
        name=document.name,
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
