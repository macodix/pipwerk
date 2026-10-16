"""Namespaces (specification 3.3, order S17): the symbols that expressions can address.

The order of resolution is from the inside to the outside; an inner name hides an outer
one without a finding:

* Expression of a rule: first the parameters of the rule (without a point), then the other
  rules of the same list (strategy, element or template), then the enclosing namespace.
* Rule of an element: the enclosing namespace is the one of the strategy. A rule of the
  element hides a rule of the strategy of the same name.
* Rule in a template ``Indikator``, ``Trend`` or ``Regelwerk``: the enclosing namespace is
  the one of the template, that is its own parameters and its contained instances and
  rules, then the objects of the application. It does not see the names of the strategy.
* "Name doubly assigned" applies to two names of the same level.

This module builds the outermost namespace (objects of the application) and the symbols of
parameters, properties and instances. The consistency check builds the levels of strategy,
element and template from them.
"""

import re
from collections.abc import Sequence
from functools import partial

from pipwerk_domain.catalog import OBJECT_ORDER, OBJECT_STRATEGY
from pipwerk_domain.expressions.exprtypes import ExprType, type_of
from pipwerk_domain.expressions.symbols import Scope, Symbol, SymbolKind
from pipwerk_domain.model import Instance, PropertyDefinition, StrategyParameter
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import DataType, ElementKind, PropertyDescription

_NAME = re.compile(r"^[^\W\d]\w*$")

RESULT_PROPERTY = "ergebnis"
"""Identifier of the result of a rule, condition or calculation (``regel.ergebnis``)."""


def is_valid_name(text: str) -> bool:
    """Whether a name of an instance, element, rule or parameter can be addressed in an
    expression: letters, digits and ``_``, starting with a letter or ``_``, no space."""
    return _NAME.match(text) is not None


def property_type(prop: PropertyDescription) -> ExprType:
    return type_of(prop.datatype, tuple(item.id for item in prop.choices), prop.object_type)


def parameter_symbol(name: str, datatype: DataType, choices: tuple[str, ...] = ()) -> Symbol:
    """The symbol of a parameter (of a rule, a template or a strategy)."""
    return Symbol(name, SymbolKind.PARAMETER, type=type_of(datatype, choices))


def property_symbol(registry: ElementRegistry, prop: PropertyDescription) -> Symbol:
    """The symbol of a property; a property that is an object has its own members."""
    object_type = prop.object_type if prop.datatype is DataType.OBJECT else None
    return Symbol(
        prop.id,
        SymbolKind.PROPERTY,
        object_type=object_type,
        type=property_type(prop),
        members_factory=(
            None if object_type is None else (lambda: description_members(registry, object_type))
        ),
    )


def description_members(registry: ElementRegistry, type_id: str) -> dict[str, Symbol]:
    """The properties of a type as members, by lower case identifier."""
    description = registry.get(type_id)
    if description is None:
        return {}
    return {item.id: property_symbol(registry, item) for item in description.properties}


def order_properties(
    registry: ElementRegistry, order_type: str | None
) -> list[PropertyDescription]:
    """The properties of ``Order``: those of the order type, or without an order type the
    union of the properties of all order types (the first definition counts)."""
    if order_type is not None:
        description = registry.get(order_type)
        if description is not None and description.kind is ElementKind.ORDER_TYPE:
            return list(description.properties)
    result: dict[str, PropertyDescription] = {}
    general = registry.get(OBJECT_ORDER)
    if general is not None:
        result.update({item.id: item for item in general.properties})
    for description in registry.list(ElementKind.ORDER_TYPE):
        for item in description.properties:
            result.setdefault(item.id, item)
    return list(result.values())


def order_symbol(registry: ElementRegistry, order_type: str | None) -> Symbol:
    """The symbol ``Order`` as it is in a management of an order of this type (or in a
    rule, without a type)."""
    properties = order_properties(registry, order_type)
    return Symbol(
        OBJECT_ORDER,
        SymbolKind.APPLICATION_OBJECT,
        object_type=OBJECT_ORDER,
        members_factory=lambda: {item.id: property_symbol(registry, item) for item in properties},
    )


def application_scope(
    registry: ElementRegistry,
    strategy_parameters: Sequence[StrategyParameter] | None = None,
    *,
    open_strategy: bool = False,
) -> Scope:
    """The outermost namespace: the objects of the application (``Konto``, ``Instrument``,
    ``Kerze``, ``Tick``, ``Order``, ``Position``, ``Strategie``).

    ``strategy_parameters`` are the parameters of the strategy, addressed as
    ``Strategie.parameter``. With ``open_strategy`` any property of ``Strategie`` is
    accepted but not checked (rule template, specification 3.4).
    """
    scope = Scope()
    for description in registry.list(ElementKind.APPLICATION_OBJECT):
        if description.id == OBJECT_ORDER:
            scope.add(order_symbol(registry, None))
        elif description.id == OBJECT_STRATEGY:
            scope.add(_strategy_symbol(registry, strategy_parameters, open_strategy))
        else:
            scope.add(
                Symbol(
                    description.id,
                    SymbolKind.APPLICATION_OBJECT,
                    object_type=description.id,
                    members_factory=partial(description_members, registry, description.id),
                )
            )
    return scope


def _strategy_symbol(
    registry: ElementRegistry,
    parameters: Sequence[StrategyParameter] | None,
    open_members: bool,
) -> Symbol:
    def members() -> dict[str, Symbol]:
        result = description_members(registry, OBJECT_STRATEGY)
        for item in parameters or ():
            symbol = parameter_symbol(item.name, item.datatype, item.choices)
            result[item.name.lower()] = symbol
        return result

    return Symbol(
        OBJECT_STRATEGY,
        SymbolKind.APPLICATION_OBJECT,
        object_type=OBJECT_STRATEGY,
        members_factory=members,
        open_members=open_members,
    )


def property_definition_symbol(definition: PropertyDefinition) -> Symbol:
    """The symbol of an own property of an indicator or trend."""
    return Symbol(
        definition.name,
        SymbolKind.PROPERTY,
        type=type_of(definition.datatype, definition.choices),
    )


def instance_symbol(registry: ElementRegistry, instance: Instance) -> Symbol:
    """The symbol of an instance. Its members are the properties of its object type, its own
    properties and the contained instances, so ``trend_h1.ema20.wert`` can be addressed
    (specification 3.3, section 10 point 7)."""

    def members() -> dict[str, Symbol]:
        result = description_members(registry, instance.object_type)
        for definition in instance.properties:
            result[definition.name.lower()] = property_definition_symbol(definition)
        for child in instance.instances:
            result[child.name.lower()] = instance_symbol(registry, child)
        return result

    return Symbol(
        instance.name,
        SymbolKind.INSTANCE,
        object_type=instance.object_type,
        members_factory=members,
    )
