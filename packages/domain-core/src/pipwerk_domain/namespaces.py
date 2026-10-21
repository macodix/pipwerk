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
element and template from them. Symbols are named by their key (the spelling of the stored
form) and carry the name or labels that the display form shows.
"""

from collections.abc import Callable, Sequence
from functools import partial

from pipwerk_domain.catalog import (
    OBJECT_ORDER,
    OBJECT_STRATEGY,
    OBJECT_TICK,
    RESULT_PROPERTY,
)
from pipwerk_domain.expressions.exprtypes import ExprType, labels_of, type_of
from pipwerk_domain.expressions.symbols import Scope, Symbol, SymbolKind
from pipwerk_domain.identifiers import is_valid_key
from pipwerk_domain.model import Instance, PropertyDefinition, StrategyParameter
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import (
    DataType,
    ElementKind,
    PropertyDescription,
    TypeDescription,
)

__all__ = [
    "RESULT_PROPERTY",
    "application_scope",
    "description_members",
    "has_earlier_values",
    "instance_symbol",
    "is_valid_name",
    "order_properties",
    "order_symbol",
    "parameter_symbol",
    "property_definition_symbol",
    "property_symbol",
    "property_type",
]

_TIME_UNIT_PARAMETER = "zeiteinheit"


def is_valid_name(text: str) -> bool:
    """Whether a key can be addressed in an expression: only the ASCII letters A-Z and a-z, the
    ASCII digits 0-9 and ``_``, starting with a letter or ``_``, nothing else (no space, no line
    feed, no other script)."""
    return is_valid_key(text)


def has_earlier_values(description: TypeDescription | None) -> bool:
    """Whether the fachmodell defines earlier values for the properties of a type: objects with
    a time unit (indicator, trend, candle) and the tick (specification 3.4)."""
    if description is None:
        return False
    return description.id == OBJECT_TICK or description.parameter(_TIME_UNIT_PARAMETER) is not None


def property_type(prop: PropertyDescription) -> ExprType:
    return type_of(
        prop.datatype,
        tuple(item.id for item in prop.choices),
        prop.object_type,
        labels_of(prop.choices),
    )


def parameter_symbol(
    key: str,
    datatype: DataType,
    choices: tuple[str, ...] = (),
    *,
    shown: str | None = None,
    object_type: str | None = None,
    registry: ElementRegistry | None = None,
) -> Symbol:
    """The symbol of a parameter (of a rule, a template or a strategy). An object-valued
    parameter has the properties of its object type as members."""
    members_factory = None
    if datatype is DataType.OBJECT and object_type is not None and registry is not None:
        members_factory = partial(description_members, registry, object_type)
    return Symbol(
        key,
        SymbolKind.PARAMETER,
        object_type=object_type,
        type=type_of(datatype, choices, object_type),
        members_factory=members_factory,
        shown=shown,
        datatype=datatype,
    )


def property_symbol(
    registry: ElementRegistry, prop: PropertyDescription, *, previous_value: bool = False
) -> Symbol:
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
        label=prop.label,
        datatype=prop.datatype,
        explanation=prop.explanation,
        choices=prop.choices,
        previous_value=previous_value,
    )


def description_members(
    registry: ElementRegistry, type_id: str, *, previous_value: bool | None = None
) -> dict[str, Symbol]:
    """The properties of a type as members, by lower case identifier. ``previous_value``
    says whether the properties have earlier values; by default the type decides."""
    description = registry.get(type_id)
    if description is None:
        return {}
    earlier = has_earlier_values(description) if previous_value is None else previous_value
    return {
        item.id: property_symbol(registry, item, previous_value=earlier)
        for item in description.properties
    }


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


def _application_symbol(
    registry: ElementRegistry,
    description: TypeDescription,
    members: Callable[[], dict[str, Symbol]],
) -> Symbol:
    return Symbol(
        description.id,
        SymbolKind.APPLICATION_OBJECT,
        object_type=description.id,
        members_factory=members,
        label=description.name,
        explanation=description.explanation,
    )


def order_symbol(registry: ElementRegistry, order_type: str | None) -> Symbol:
    """The symbol ``Order`` as it is in a management of an order of this type (or in a
    rule, without a type)."""
    properties = order_properties(registry, order_type)
    description = registry.get(OBJECT_ORDER)
    return Symbol(
        OBJECT_ORDER,
        SymbolKind.APPLICATION_OBJECT,
        object_type=OBJECT_ORDER,
        members_factory=lambda: {item.id: property_symbol(registry, item) for item in properties},
        label=None if description is None else description.name,
        explanation=None if description is None else description.explanation,
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
            scope.add(_strategy_symbol(registry, description, strategy_parameters, open_strategy))
        else:
            scope.add(
                _application_symbol(
                    registry, description, partial(description_members, registry, description.id)
                )
            )
    return scope


def _strategy_symbol(
    registry: ElementRegistry,
    description: TypeDescription,
    parameters: Sequence[StrategyParameter] | None,
    open_members: bool,
) -> Symbol:
    def members() -> dict[str, Symbol]:
        result = description_members(registry, OBJECT_STRATEGY)
        for item in parameters or ():
            symbol = parameter_symbol(
                item.key,
                item.datatype,
                item.choices,
                shown=item.name,
                object_type=item.object_type,
                registry=registry,
            )
            result[item.key.lower()] = symbol
        return result

    return Symbol(
        OBJECT_STRATEGY,
        SymbolKind.APPLICATION_OBJECT,
        object_type=OBJECT_STRATEGY,
        members_factory=members,
        open_members=open_members,
        label=description.name,
        explanation=description.explanation,
    )


def property_definition_symbol(definition: PropertyDefinition, *, previous_value: bool) -> Symbol:
    """The symbol of an own property of an indicator or trend. Indicators and trends have a
    time unit, so their properties have earlier values."""
    return Symbol(
        definition.key,
        SymbolKind.PROPERTY,
        type=type_of(definition.datatype, definition.choices, definition.object_type),
        shown=definition.name,
        datatype=definition.datatype,
        previous_value=previous_value,
    )


def instance_symbol(
    registry: ElementRegistry,
    instance: Instance,
    rule_symbol: Callable[[Instance], Symbol] | None = None,
) -> Symbol:
    """The symbol of an instance. Its members are the properties of its object type, its own
    properties and the contained instances and rules, so ``trend_h1.ema20.wert`` can be
    addressed (specification 3.3, section 10 point 7)."""

    def members() -> dict[str, Symbol]:
        description = registry.get(instance.object_type)
        earlier = has_earlier_values(description)
        result = description_members(registry, instance.object_type, previous_value=earlier)
        for definition in instance.properties:
            result[definition.key.lower()] = property_definition_symbol(
                definition, previous_value=earlier
            )
        for child in instance.instances:
            result[child.key.lower()] = instance_symbol(registry, child, rule_symbol)
        if rule_symbol is not None:
            for rule in instance.rules:
                result[rule.key.lower()] = rule_symbol(rule)
        return result

    description = registry.get(instance.object_type)
    return Symbol(
        instance.key,
        SymbolKind.INSTANCE,
        object_type=instance.object_type,
        members_factory=members,
        shown=instance.name,
        explanation=None if description is None else description.explanation,
    )
