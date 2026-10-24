"""Operations on strategies and templates that the library owns (specification 3.3, 3.4):
keys for new objects, the insertion of a template with the names it suggests, and the removal of
an object with its uses.

Keys are formed here and nowhere else (E2): the user interface asks the web API, which asks this
module. A removal turns every use in an expression into an empty place, ends the bindings that
point to the object, and takes its inputs, connections and section places with it; before that,
:func:`uses_of_element`, :func:`uses_of_strategy_parameter` and :func:`uses_of_rule` name the
elements that use the object, for the question the user interface asks first.
"""

import copy
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field

from pipwerk_domain import catalog
from pipwerk_domain.consistency import check_with_contexts
from pipwerk_domain.defaults import builtin_templates, default_registry
from pipwerk_domain.expressions.functions import list_functions
from pipwerk_domain.expressions.rename import Rewrite, identity, renamer
from pipwerk_domain.expressions.slots import replace_prefixes_with_slot, uses_prefix
from pipwerk_domain.expressions.symbols import normalized_name
from pipwerk_domain.identifiers import form_key, identifier_from_name
from pipwerk_domain.limits import MAX_NAME_LENGTH
from pipwerk_domain.model import (
    Binding,
    DataLink,
    Element,
    Instance,
    ObjectContent,
    Origin,
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
            taken += namespace_keys(owner)
        else:
            raise ScopeError(list_name)
    elif isinstance(owner, Element):
        if list_name != "rules":
            raise ScopeError(list_name)
        taken += namespace_keys(value)
    elif isinstance(owner, ObjectContent):
        description = registry.get(owner.object_type)
        if description is not None:
            taken += [item.id for item in description.parameters]
        if list_name in ("parameters", "instances", "rules"):
            # every instance and rule of the strategy or template shares one namespace
            taken += namespace_keys(value)
            taken += _keys_of(list(owner.parameters))
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


def _nested(root: ObjectContent) -> list[Instance]:
    """The instances and rules inside ``root`` at any depth, ``root`` itself not included."""
    found: list[Instance] = []
    stack: list[ObjectContent] = [root]
    while stack:
        item = stack.pop()
        children = [*item.instances, *item.rules]
        found.extend(children)
        stack.extend(children)
    return found


def _namespace_contents(value: Strategy | Template) -> list[ObjectContent]:
    """Every instance and rule of the namespace of a strategy or template, at any depth; for a
    template also the template itself (its own parameters stand in the namespace)."""
    if isinstance(value, Template):
        return [value, *_nested(value)]
    found: list[ObjectContent] = []
    for rule in value.rules:
        found += [rule, *_nested(rule)]
    for element in value.elements:
        for rule in element.rules:
            found += [rule, *_nested(rule)]
        if element.instance is not None:
            found += [element.instance, *_nested(element.instance)]
    return found


def namespace_keys(value: Strategy | Template) -> list[str]:
    """The keys of the namespace of a strategy or template (specification 3.3): every instance,
    rule, condition and calculation, the ones inside instances and rulesets too, and the own
    parameters of rules and templates, which stand without a point."""
    taken: list[str] = []
    if isinstance(value, Strategy):
        taken += [item.key for item in value.elements if item.instance is None and item.key]
    for content in _namespace_contents(value):
        if isinstance(content, Instance):
            taken.append(content.key)
        taken += _keys_of(list(content.parameters))
    return taken


def namespace_names(value: Strategy | Template) -> list[str]:
    """The names of the namespace of a strategy or template, as :func:`namespace_keys` lists
    its keys."""
    taken: list[str] = []
    if isinstance(value, Strategy):
        taken += [item.name for item in value.elements if item.instance is None and item.name]
    for content in _namespace_contents(value):
        if isinstance(content, Instance):
            taken.append(content.name)
        taken += [item.name for item in content.parameters]
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


def _rewrite_expressions(root: Strategy | Template, prefixes: Sequence[tuple[str, ...]]) -> None:
    """Replace every use of the objects with the keys ``prefixes`` in the expressions of the
    document by an empty place. The document is checked once and each expression analyzed once,
    however many objects go."""
    checker = check_with_contexts(root)
    for pointer_text, context in checker.contexts.items():
        place = _places(root, pointer_text)
        if place is None:
            continue
        changed = replace_prefixes_with_slot(place.text, context.env, prefixes)
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
    _rewrite_expressions(strategy, [(_STRATEGY_OBJECT, key)])
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
    removed = _element_and_management(strategy, element_id)
    key = element.instance.key if element.instance is not None else element.key
    if key:
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
    # an expression addresses an instance inside another one and a rule inside a ruleset by its
    # own key too (specification 3.3), so those uses go as well
    prefixes: list[tuple[str, ...]] = []
    for name in removed:
        gone = strategy.element(name)
        if gone is not None:
            prefixes += _used_prefixes(gone)
    if prefixes:
        _rewrite_expressions(strategy, prefixes)
    for other in strategy.elements:
        if other.instance is not None and other.instance.first_use in removed:
            other.instance.first_use = None
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
    _rewrite_expressions(strategy, [(item.key,) for item in (rule, *_nested(rule))])
    if rule in strategy.rules:
        strategy.rules.remove(rule)
        return
    for element in strategy.elements:
        if rule in element.rules:
            element.rules.remove(rule)
            return


# --- insertion of a template ----------------------------------------------------------------


class InsertionError(ValueError):
    """The instance cannot be made: neither a template nor a known object type was named."""


def _taken(value: Strategy | Template, registry: ElementRegistry) -> tuple[set[str], set[str]]:
    """The names (normalized) and keys (lower case) that a new object must not take: the ones of
    the namespace, the names of the objects of the application in both languages and their
    identifiers, and the names of the functions (specification 3.3)."""
    names = {normalized_name(item) for item in namespace_names(value)}
    keys = {item.lower() for item in namespace_keys(value)}
    for description in registry.list(ElementKind.APPLICATION_OBJECT):
        names.update(
            (
                normalized_name(description.name.de),
                normalized_name(description.name.en),
                normalized_name(description.id),
            )
        )
        keys.add(description.id.lower())
    keys.update(item.name.lower() for item in list_functions())
    return names, keys


def _suggest(base: str, taken: set[str]) -> str:
    """The name ``base``, or with a number appended where it is taken: "Kerze 2". A name that
    is too long for a document is cut, so that the number still fits."""
    base = base[:MAX_NAME_LENGTH]
    if normalized_name(base) not in taken:
        return base
    stem = base[: MAX_NAME_LENGTH - 12]
    number = 2
    name = f"{stem} {number}"
    while normalized_name(name) in taken:
        number += 1
        name = f"{stem} {number}"
    return name


def _rewrite_bindings(values: dict[str, Binding], rewrite: Rewrite) -> None:
    if rewrite is identity:
        return
    for binding in values.values():
        if binding.kind is BindingKind.EXPRESSION and isinstance(binding.value, str):
            binding.value = rewrite(binding.value)


def insert_instance(
    target: Strategy | Template,
    *,
    template: Template | None = None,
    object_type: str | None = None,
    name: str | None = None,
    language: str = "de",
    registry: ElementRegistry | None = None,
) -> Instance:
    """A new instance for ``target``: a complete copy of a template or an instance of an object
    type, with names that the namespace of ``target`` does not have (specification 3.3).

    The instance gets ``name``, or the name of the template or of the object type in the
    language, made unique by a number: "Kerze 2". Each instance and rule inside it gets the name
    "<name of the instance that contains it> <former name>", a number appended where that is
    taken; the keys are formed from the new names, and the expressions inside the instance are
    written on the new keys, so that it means the same as the template. The user may change
    every name afterwards. Nothing in ``target`` changes; the caller puts the instance where it
    belongs. Raises :class:`InsertionError` for neither a template nor a known object type."""
    used = default_registry() if registry is None else registry
    if template is not None:
        source_type = template.object_type
        base = template.name
        builtin = any(item.id == template.id for item in builtin_templates())
        origin = Origin(source_type, template.id, None if builtin else template.name)
    else:
        description = None if object_type is None else used.get(object_type)
        if object_type is None or description is None:
            raise InsertionError(object_type or "")
        source_type = object_type
        base = description.name.en if language == "en" else description.name.de
        origin = Origin(source_type)
    names, keys = _taken(target, used)
    new_name = _suggest(name if name else base, names)
    names.add(normalized_name(new_name))
    new_key = form_key(new_name, keys, identifier_from_name(source_type) or "objekt")
    keys.add(new_key.lower())
    instance = Instance(name=new_name, key=new_key, object_type=source_type, origin=origin)
    if template is not None:
        for field_name in (
            "parameter_values",
            "parameters",
            "properties",
            "instances",
            "rules",
            "expression",
            "determined_property",
            "comparison",
            "result_expression",
        ):
            setattr(instance, field_name, copy.deepcopy(getattr(template, field_name)))
        _localize(instance, names, keys)
    return instance


def _localize(content: Instance, names: set[str], keys: set[str]) -> None:
    """Give the instances and rules inside ``content`` new names and keys and write the
    expressions that use them on the new keys. Works through the levels with a work list, not
    with recursion. What is evaluated outside of an instance (the values of its parameters) and
    the expression of a rule in its list are written with the keys of the level that contains
    them."""
    work: list[tuple[Instance, Rewrite, Rewrite]] = [(content, identity, identity)]
    while work:
        item, outer, list_rewrite = work.pop()
        mapping: dict[str, str] = {}
        children = [*item.instances, *item.rules]
        for child in children:
            new_name = _suggest(f"{item.name} {child.name}", names)
            names.add(normalized_name(new_name))
            new_key = form_key(new_name, keys, identifier_from_name(child.object_type) or "objekt")
            keys.add(new_key.lower())
            mapping[child.key.lower()] = new_key
            child.name = new_name
            child.key = new_key
            child.first_use = None
        inside = renamer(mapping)
        _rewrite_bindings(item.parameter_values, outer)
        if item.object_type == catalog.TYPE_RULE and item.expression is not None:
            item.expression = list_rewrite(item.expression)
        if item.result_expression is not None:
            item.result_expression = inside(item.result_expression)
        for own in item.properties:
            own.expression = inside(own.expression)
        work.extend((child, inside, inside) for child in children)


# --- uses of an object ----------------------------------------------------------------------


@dataclass(slots=True)
class Uses:
    """Who uses an object: the identifiers of the elements, in the order of the strategy (an
    element counts that has an expression, an input or a binding that names the object; an
    instance counts as the element that shows it), and the keys of the rules of the strategy that
    use it."""

    elements: list[str] = field(default_factory=list)
    rules: list[str] = field(default_factory=list)


def _used_prefixes(element: Element) -> list[tuple[str, ...]]:
    """The names an element answers to in expressions: its key and, for an instance, the keys of
    everything inside it."""
    if element.instance is not None:
        keys = [element.instance.key, *(item.key for item in _nested(element.instance))]
    elif element.key:
        keys = [element.key]
    else:
        keys = []
    return [(item,) for item in keys]


def _places_using(
    strategy: Strategy, prefixes: list[tuple[str, ...]], skip: frozenset[str]
) -> tuple[set[str], set[str]]:
    """The identifiers of the elements and the keys of the rules of the strategy whose
    expressions name one of the prefixes. Elements in ``skip`` do not count."""
    elements: set[str] = set()
    rules: set[str] = set()
    checker = check_with_contexts(strategy)
    for pointer_text, context in checker.contexts.items():
        place = _places(strategy, pointer_text)
        if place is None:
            continue
        if uses_prefix(place.text, context.env, prefixes):
            owner = context.element_id
            if owner is None:
                parts = split_pointer(pointer_text)
                if len(parts) >= 2 and parts[0] == "rules" and parts[1].isdigit():
                    index = int(parts[1])
                    if index < len(strategy.rules):
                        rules.add(strategy.rules[index].key)
            elif owner not in skip:
                elements.add(owner)
    return elements, rules


def _ordered(strategy: Strategy, found: set[str]) -> list[str]:
    return [item.id for item in strategy.elements if item.id in found]


def _bindings_of(element: Element) -> list[Binding]:
    """Every binding of an element, of its instance, of the instances and rules inside, and of
    its rules."""
    bindings = [*element.parameters.values(), *element.properties.values()]
    contents = [element.instance] if element.instance is not None else []
    for content in (*contents, *element.rules):
        for item in (content, *_nested(content)):
            bindings += item.parameter_values.values()
    return bindings


def uses_of_element(strategy: Strategy, element_id: str) -> Uses:
    """The elements and rules that use the element ``element_id`` or what it removes with it
    (for "Order aufgeben" its management): by a name in an expression, an input, or a data
    connection to an instance. This is the list for the question before a removal."""
    element = strategy.element(element_id)
    if element is None:
        return Uses()
    removed = set(_element_and_management(strategy, element_id))
    prefixes: list[tuple[str, ...]] = []
    instance_keys: list[str] = []
    for item_id in removed:
        item = strategy.element(item_id)
        if item is None:
            continue
        prefixes += _used_prefixes(item)
        if item.instance is not None:
            instance_keys.append(item.instance.key.lower())
    found, rules = _places_using(strategy, prefixes, frozenset(removed))
    for other in strategy.elements:
        if other.id in removed:
            continue
        if any(entry.instance.lower() in instance_keys for entry in other.inputs) or any(
            _references_any(binding, instance_keys) for binding in _bindings_of(other)
        ):
            found.add(other.id)
    return Uses(_ordered(strategy, found), sorted(rules))


def _is_parameter_binding(binding: Binding, lowered: str) -> bool:
    return (
        binding.kind is BindingKind.PARAMETER
        and isinstance(binding.value, str)
        and binding.value.lower() == lowered
    )


def uses_of_strategy_parameter(strategy: Strategy, key: str) -> Uses:
    """The elements and rules that use the strategy parameter ``key`` in an expression or in a
    binding of the kind strategy parameter."""
    lowered = key.lower()
    found, rules = _places_using(strategy, [(_STRATEGY_OBJECT, key)], frozenset())
    for element in strategy.elements:
        if any(_is_parameter_binding(binding, lowered) for binding in _bindings_of(element)):
            found.add(element.id)
    for rule in strategy.rules:
        if any(
            _is_parameter_binding(binding, lowered)
            for item in (rule, *_nested(rule))
            for binding in item.parameter_values.values()
        ):
            rules.add(rule.key)
    return Uses(_ordered(strategy, found), sorted(rules))


def uses_of_rule(strategy: Strategy, rule: Instance) -> Uses:
    """The elements and rules that use the result of the rule of the strategy or of an element
    (or of a rule inside it) in an expression."""
    prefixes: list[tuple[str, ...]] = [(item.key,) for item in (rule, *_nested(rule))]
    found, rules = _places_using(strategy, prefixes, frozenset())
    return Uses(_ordered(strategy, found), sorted(rules))


def _element_and_management(strategy: Strategy, element_id: str) -> list[str]:
    """The element and, for "Order aufgeben", the elements of its management at any depth."""
    removed = [element_id]
    element = strategy.element(element_id)
    if element is not None and element.type == catalog.FLOW_PLACE_ORDER:
        index = 0
        while index < len(removed):
            removed += [
                item.id
                for item in strategy.elements
                if item.management_of == removed[index] and item.id not in removed
            ]
            index += 1
    return removed


def _references_any(binding: Binding, keys: list[str]) -> bool:
    link = binding.value
    return (
        binding.kind is BindingKind.CONNECTION
        and isinstance(link, DataLink)
        and link.instance.lower() in keys
    )
