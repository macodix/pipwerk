"""Normalization of all expressions of a strategy or a template.

The expressions are stored in the normalized spelling (specification 3.4): names in the
spelling of their key, functions in the spelling of the norm. These functions apply
:func:`pipwerk_domain.expressions.normalize_expression` to every expression of a document,
each in the namespace where it stands. A fixed instrument is stored in upper case
(specification 3.1).
"""

from collections.abc import Iterator
from copy import deepcopy

from pipwerk_domain import catalog
from pipwerk_domain.consistency.engine import Checker
from pipwerk_domain.defaults import default_registry
from pipwerk_domain.instruments import is_valid_designation, normalize_designation
from pipwerk_domain.model import (
    Binding,
    Element,
    Instance,
    ObjectContent,
    PropertyDefinition,
    Strategy,
    Template,
)
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import (
    APPLICATION_INSTRUMENT,
    INSTRUMENT_PARAMETER,
    INSTRUMENT_TYPE,
    BindingKind,
    DataType,
    ElementKind,
)


def _apply(owner: object, field: str, text: str) -> None:
    if isinstance(owner, Binding):
        owner.value = text
    elif isinstance(owner, PropertyDefinition):
        owner.expression = text
    elif isinstance(owner, ObjectContent):
        if field == "result_expression":
            owner.result_expression = text
        else:
            owner.expression = text


def _contained(content: ObjectContent) -> Iterator[Instance]:
    stack: list[Instance] = [*content.instances, *content.rules]
    while stack:
        instance = stack.pop()
        yield instance
        stack.extend(instance.instances)
        stack.extend(instance.rules)


def _upper_designation(binding: Binding) -> None:
    """Write a fixed instrument in upper case if it is a valid designation (another text stays
    as it is and is reported by the check)."""
    value = binding.value
    if (
        binding.kind is BindingKind.FIXED
        and isinstance(value, str)
        and value != APPLICATION_INSTRUMENT
        and is_valid_designation(value)
    ):
        binding.value = normalize_designation(value)


def _normalize_instruments(value: Strategy | Template, registry: ElementRegistry) -> None:
    """Fixed instruments of parameters, order properties and strategy parameters."""
    contents: list[ObjectContent] = []
    elements: list[Element] = []
    if isinstance(value, Strategy):
        for parameter in value.parameters:
            if (
                parameter.datatype is DataType.OBJECT
                and parameter.object_type == INSTRUMENT_TYPE
                and isinstance(parameter.value, str)
                and is_valid_designation(parameter.value)
            ):
                parameter.value = normalize_designation(parameter.value)
        elements = list(value.elements)
        contents.extend(value.rules)
        for element in elements:
            contents.extend(element.rules)
            if element.instance is not None:
                contents.append(element.instance)
            description = registry.get(element.type)
            if description is None:
                continue
            if description.parameter(INSTRUMENT_PARAMETER) is not None:
                binding = element.parameters.get(INSTRUMENT_PARAMETER)
                if binding is not None:
                    _upper_designation(binding)
            if description.kind is ElementKind.FLOW and element.type == catalog.FLOW_PLACE_ORDER:
                binding = element.properties.get(INSTRUMENT_PARAMETER)
                if binding is not None:
                    _upper_designation(binding)
    else:
        contents.append(value)
    for content in contents:
        for inner in (content, *_contained(content)):
            description = registry.get(inner.object_type)
            if description is None or description.parameter(INSTRUMENT_PARAMETER) is None:
                continue
            binding = inner.parameter_values.get(INSTRUMENT_PARAMETER)
            if binding is not None:
                _upper_designation(binding)


def normalize_strategy(strategy: Strategy, registry: ElementRegistry | None = None) -> Strategy:
    """A copy of the strategy with all expressions in the normalized spelling. An expression
    with a syntax problem and names that are not recognized stay as they are."""
    result = deepcopy(strategy)
    used = default_registry() if registry is None else registry
    checker = Checker(used, None, spelling_only=True)
    checker.check_strategy(result)
    for owner, field, text in checker.normalizations():
        _apply(owner, field, text)
    _normalize_instruments(result, used)
    return result


def normalize_template(template: Template, registry: ElementRegistry | None = None) -> Template:
    """A copy of the template with all expressions in the normalized spelling."""
    result = deepcopy(template)
    used = default_registry() if registry is None else registry
    checker = Checker(used, None, spelling_only=True)
    checker.check_template(result)
    for owner, field, text in checker.normalizations():
        _apply(owner, field, text)
    _normalize_instruments(result, used)
    return result
