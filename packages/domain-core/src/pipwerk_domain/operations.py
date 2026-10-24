"""Operations on strategies and templates that the library owns (specification 3.3, 3.4):
keys for new objects and the removal of an object with its uses.

Keys are formed here and nowhere else (E2): the user interface asks the web API, which asks this
module. A removal turns every use in an expression into an empty place, ends the bindings that
point to the object, and takes its inputs, connections and section places with it.
"""

from collections.abc import Callable
from dataclasses import dataclass

from pipwerk_domain import catalog
from pipwerk_domain.consistency import check_with_contexts
from pipwerk_domain.defaults import default_registry
from pipwerk_domain.expressions.functions import list_functions
from pipwerk_domain.expressions.slots import replace_names_with_slot
from pipwerk_domain.identifiers import form_key, identifier_from_name
from pipwerk_domain.model import (
    Binding,
    DataLink,
    Element,
    Instance,
    ObjectContent,
    Strategy,
    Template,
)
from pipwerk_domain.pointers import PointerError, split_pointer
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import BindingKind, ElementKind

KEY_KINDS = ("parameter", "property", "instance", "rule", "condition", "calculation")
"""What a new key is for; it decides the key when the name gives none (specification 3.3)."""

_FALLBACKS = {
    "parameter": "parameter",
    "property": "eigenschaft",
    "condition": "bedingung",
    "calculation": "berechnung",
    "rule": "regel",
}
_STRATEGY_OBJECT = "Strategie"


class ScopeError(ValueError):
    """The pointer names no list of the document that takes new objects."""


def _reserved(registry: ElementRegistry) -> set[str]:
    names = {item.id for item in registry.list(ElementKind.APPLICATION_OBJECT)}
    names.update(item.name for item in list_functions())
    return names


def _resolve(root: object, parts: list[str]) -> object:
    """The object at the pointer parts below a strategy, template, element or instance."""
    current = root
    for part in parts:
        if isinstance(current, list):
            try:
                current = current[int(part)]
            except (ValueError, IndexError) as error:
                raise ScopeError(part) from error
        elif isinstance(current, dict):
            if part not in current:
                raise ScopeError(part)
            current = current[part]
        elif hasattr(current, part) and not part.startswith("_"):
            current = getattr(current, part)
        else:
            raise ScopeError(part)
    return current


def _keys_of(items: list[object]) -> list[str]:
    return [str(getattr(item, "key", "")) for item in items if getattr(item, "key", None)]


def keys_taken(value: Strategy | Template, scope: str, registry: ElementRegistry) -> list[str]:
    """The keys that a new object in the list at the JSON Pointer ``scope`` must not take: the
    other keys of its namespace, the identifiers of the objects of the application and the names
    of the functions (specification 3.3). Raises :class:`ScopeError` if the pointer names no list
    that takes new objects."""
    try:
        parts = split_pointer(scope)
    except PointerError as error:
        raise ScopeError(str(error)) from error
    if not parts:
        raise ScopeError("the document itself takes no object")
    owner_parts, list_name = parts[:-1], parts[-1]
    owner = _resolve(value, owner_parts)
    taken: list[str] = list(_reserved(registry))
    if isinstance(owner, Strategy):
        if list_name == "parameters":
            taken = [_STRATEGY_OBJECT, *owner_keys_of_strategy_object(registry)]
            taken += _keys_of(list(owner.parameters))
        elif list_name in ("elements", "rules"):
            taken += _strategy_namespace(owner)
        else:
            raise ScopeError(list_name)
    elif isinstance(owner, Element):
        if list_name != "rules":
            raise ScopeError(list_name)
        taken += _keys_of(list(owner.rules))
    elif isinstance(owner, ObjectContent):
        description = registry.get(owner.object_type)
        if description is not None:
            taken += [item.id for item in description.parameters]
        if list_name in ("parameters", "instances", "rules"):
            taken += _keys_of(list(owner.parameters))
            taken += _keys_of(list(owner.instances))
            taken += _keys_of(list(owner.rules))
        elif list_name == "properties":
            taken = _keys_of(list(owner.properties)) + _keys_of(list(owner.instances))
            if description is not None:
                taken += [item.id for item in description.properties]
        else:
            raise ScopeError(list_name)
    else:
        raise ScopeError(list_name)
    return taken


def owner_keys_of_strategy_object(registry: ElementRegistry) -> list[str]:
    """The identifiers of the properties of ``Strategie``; a strategy parameter must not take
    them."""
    description = registry.get(_STRATEGY_OBJECT)
    return [] if description is None else [item.id for item in description.properties]


def _strategy_namespace(strategy: Strategy) -> list[str]:
    taken: list[str] = []
    for element in strategy.elements:
        if element.instance is not None:
            taken.append(element.instance.key)
        elif element.key:
            taken.append(element.key)
    taken += _keys_of(list(strategy.rules))
    return taken


def new_key(
    value: Strategy | Template,
    scope: str,
    name: str,
    *,
    kind: str | None = None,
    object_type: str | None = None,
    registry: ElementRegistry | None = None,
) -> str:
    """The key for a new object named ``name`` in the list at the JSON Pointer ``scope``.

    ``kind`` (one of :data:`KEY_KINDS`) and ``object_type`` decide the key when the name gives
    none: an instance takes the identifier of its object type, a condition or calculation
    ``bedingung`` or ``berechnung`` (specification 3.3)."""
    used = default_registry() if registry is None else registry
    taken = keys_taken(value, scope, used)
    if kind is None:  # the list decides what a new object in it is
        kind = {"parameters": "parameter", "properties": "property", "rules": "rule"}.get(
            split_pointer(scope)[-1]
        )
    if kind == "instance" and object_type:
        fallback = identifier_from_name(object_type) or "objekt"
    else:
        fallback = _FALLBACKS.get(kind or "", "objekt")
    return form_key(name, taken, fallback)


# --- removal --------------------------------------------------------------------------------


@dataclass(slots=True)
class _Place:
    """An expression of a document: its text and how to write it."""

    text: str
    write: Callable[[str], None]


def _places(root: Strategy | Template, pointer_text: str) -> _Place | None:
    """The expression at a pointer that the library recorded for a check, or ``None`` if there
    is no text there."""
    parts = split_pointer(pointer_text)
    if not parts:
        return None
    try:
        owner = _resolve(root, parts[:-1])
    except ScopeError:
        return None
    last = parts[-1]
    if last == "value" and len(parts) >= 3:
        try:
            binding = _resolve(root, parts[:-1])
        except ScopeError:
            return None
        if (
            isinstance(binding, Binding)
            and binding.kind is BindingKind.EXPRESSION
            and isinstance(binding.value, str)
        ):
            return _Place(binding.value, _writer(binding, "value"))
        return None
    if last in ("expression", "result_expression"):
        current = getattr(owner, last, None)
        if isinstance(current, str):
            return _Place(current, _writer(owner, last))
    return None


def _writer(owner: object, field: str) -> Callable[[str], None]:
    """A function that writes a text into the field of an object."""

    def write(text: str) -> None:
        setattr(owner, field, text)

    return write


def _rewrite_expressions(root: Strategy | Template, prefix: tuple[str, ...]) -> None:
    """Replace every use of the object with the keys ``prefix`` in the expressions of the
    document by an empty place."""
    checker = check_with_contexts(root)
    for pointer_text, context in checker.contexts.items():
        place = _places(root, pointer_text)
        if place is None:
            continue
        changed = replace_names_with_slot(place.text, context.env, prefix)
        if changed != place.text:
            place.write(changed)


def _clear_bindings(bindings: dict[str, Binding], matches: Callable[[Binding], bool]) -> None:
    for name in [name for name, item in bindings.items() if matches(item)]:
        del bindings[name]


def _every_content(strategy: Strategy) -> list[ObjectContent]:
    found: list[ObjectContent] = []
    stack: list[ObjectContent] = [*strategy.rules]
    for element in strategy.elements:
        stack.extend(element.rules)
        if element.instance is not None:
            stack.append(element.instance)
    while stack:
        item = stack.pop()
        found.append(item)
        stack.extend(item.instances)
        stack.extend(item.rules)
    return found


def remove_strategy_parameter(strategy: Strategy, key: str) -> None:
    """Remove the strategy parameter with this key. A use in an expression becomes an empty
    place; a binding to it (kind strategy parameter) becomes "not set" (specification 3.4)."""
    _rewrite_expressions(strategy, (_STRATEGY_OBJECT, key))
    lowered = key.lower()

    def uses_parameter(binding: Binding) -> bool:
        return (
            binding.kind is BindingKind.PARAMETER
            and isinstance(binding.value, str)
            and binding.value.lower() == lowered
        )

    for element in strategy.elements:
        _clear_bindings(element.parameters, uses_parameter)
        _clear_bindings(element.properties, uses_parameter)
    for part in _every_content(strategy):
        _clear_bindings(part.parameter_values, uses_parameter)
    strategy.parameters = [item for item in strategy.parameters if item.key.lower() != lowered]


def _references_instance(binding: Binding, key: str) -> bool:
    link = binding.value
    return (
        binding.kind is BindingKind.CONNECTION
        and isinstance(link, DataLink)
        and link.instance.lower() == key.lower()
    )


def remove_element(strategy: Strategy, element_id: str) -> list[str]:
    """Remove an element. Returns the identifiers of all removed elements: the one named and,
    for "Order aufgeben", the elements of its management at any depth.

    A use of an instance, condition or calculation in an expression becomes an empty place;
    a data connection to an instance becomes "not set"; inputs, connections and places in
    sections of the removed elements go with them (specification 3.4, 5.4)."""
    element = strategy.element(element_id)
    if element is None:
        return []
    removed = [element_id]
    if element.type == catalog.FLOW_PLACE_ORDER:
        index = 0
        while index < len(removed):
            removed += [
                item.id
                for item in strategy.elements
                if item.management_of == removed[index] and item.id not in removed
            ]
            index += 1
    key = element.instance.key if element.instance is not None else element.key
    if key:
        _rewrite_expressions(strategy, (key,))
        for other in strategy.elements:
            if other.id in removed:
                continue
            other.inputs = [item for item in other.inputs if item.instance.lower() != key.lower()]
            if element.instance is not None:
                _clear_bindings(other.parameters, lambda item: _references_instance(item, key))
                _clear_bindings(other.properties, lambda item: _references_instance(item, key))
                for content in (other.instance, *other.rules):
                    if content is not None:
                        _clear_bindings(
                            content.parameter_values, lambda item: _references_instance(item, key)
                        )
    for name in removed[1:]:
        child = strategy.element(name)
        if child is not None:
            child_key = child.instance.key if child.instance is not None else child.key
            if child_key:
                _rewrite_expressions(strategy, (child_key,))
    strategy.elements = [item for item in strategy.elements if item.id not in removed]
    strategy.connections = [
        item
        for item in strategy.connections
        if item.source not in removed and item.target not in removed
    ]
    for section in list(strategy.sections):
        section.elements = [item for item in section.elements if item not in removed]
        if section.flow in removed:
            strategy.sections.remove(section)
    strategy.collapsed_managements = [
        item for item in strategy.collapsed_managements if item not in removed
    ]
    return removed


def remove_rule(strategy: Strategy, rule: Instance) -> None:
    """Remove a rule of the strategy or of an element; a use of its result becomes an empty
    place."""
    _rewrite_expressions(strategy, (rule.key,))
    if rule in strategy.rules:
        strategy.rules.remove(rule)
        return
    for element in strategy.elements:
        if rule in element.rules:
            element.rules.remove(rule)
            return
