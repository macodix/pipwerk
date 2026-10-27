"""The names an expression can address at a place, with their properties (specification 3.4,
req-ui-013, req-ui-015, Mangel M15): what the user interface offers after a name and a point
and in the lists of the blocks."""

from collections.abc import Collection
from dataclasses import dataclass, field

from pipwerk_domain.expressions.symbols import Scope, Symbol, SymbolKind
from pipwerk_domain.limits import MAX_NAMES_PER_ITEM, MAX_PROPERTIES_PER_NAME
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import DataType, Label, datatype_label

_STRATEGY_OBJECT = "Strategie"


@dataclass(frozen=True, slots=True)
class ChoiceInfo:
    key: str
    label: Label


@dataclass(frozen=True, slots=True)
class PropertyInfo:
    """A property of a visible name: key, label, data type with its word in trader language
    (``datatype_label``, for an object the name of the object type), explanation and the
    possible values of a choice. ``previous_value`` tells that ``PREVIOUS`` may stand around
    it: the fachmodell defines an earlier value for it (specification 3.4)."""

    key: str
    label: Label
    datatype: str | None
    explanation: Label | None
    choices: tuple[ChoiceInfo, ...]
    previous_value: bool
    datatype_label: Label | None = None


@dataclass(frozen=True, slots=True)
class ArgumentInfo:
    """An argument of a method: key, label, data type with its word in trader language,
    mandatory or optional, default value, explanation and the possible values of a choice."""

    key: str
    label: Label
    datatype: str
    required: bool
    default: bool | int | float | str | None
    explanation: Label
    choices: tuple[ChoiceInfo, ...]
    datatype_label: Label | None = None


@dataclass(frozen=True, slots=True)
class MethodInfo:
    """A method of a visible name: key, label, data type of the result with its word in trader
    language, explanation, the possible values of a result that is a choice and the arguments.
    ``previous_value`` tells that ``PREVIOUS`` may stand around the result."""

    key: str
    label: Label
    datatype: str | None
    explanation: Label | None
    choices: tuple[ChoiceInfo, ...]
    arguments: tuple[ArgumentInfo, ...]
    previous_value: bool
    datatype_label: Label | None = None


@dataclass(slots=True)
class VisibleName:
    """A name visible at a place of an expression. ``path`` lists the keys; ``kind`` is
    ``instance``, ``result``, ``strategy_parameter``, ``parameter``, ``application_object``
    or ``rule``. ``contents`` are the contained instances and rules of an instance or
    ruleset. ``properties_truncated`` is true if the list of properties or the list of
    methods was cut off."""

    display: str
    path: tuple[str, ...]
    kind: str
    properties: list[PropertyInfo] = field(default_factory=list)
    properties_truncated: bool = False
    contents: list[VisibleName] = field(default_factory=list)
    datatype: str | None = None
    """The data type of the value of a strategy parameter or parameter."""
    methods: list[MethodInfo] = field(default_factory=list)
    datatype_label: Label | None = None
    """The word for the data type in trader language (``None`` without a data type)."""


class _Words:
    """The words for data types: an object is called by the name of its object type, which
    the register knows. Without a register an object is called "Objekt" / "object"."""

    def __init__(self, registry: ElementRegistry | None) -> None:
        self.registry = registry

    def of(self, datatype: DataType | None, object_type: str | None = None) -> Label | None:
        if datatype is None:
            return None
        if self.registry is None:
            return datatype_label(datatype)
        return self.registry.datatype_label(datatype, object_type)


def _label_of(symbol: Symbol) -> Label:
    if symbol.label is not None:
        return symbol.label
    text = symbol.shown if symbol.shown is not None else symbol.name
    return Label(text, text)


def _property_info(symbol: Symbol, words: _Words) -> PropertyInfo:
    return PropertyInfo(
        symbol.name,
        _label_of(symbol),
        symbol.datatype.value if symbol.datatype is not None else None,
        symbol.explanation,
        tuple(ChoiceInfo(item.id, item.label) for item in symbol.choices),
        symbol.previous_value,
        words.of(symbol.datatype, symbol.object_type),
    )


def _method_info(symbol: Symbol, words: _Words) -> MethodInfo:
    return MethodInfo(
        symbol.name,
        _label_of(symbol),
        symbol.datatype.value if symbol.datatype is not None else None,
        symbol.explanation,
        tuple(ChoiceInfo(item.id, item.label) for item in symbol.choices),
        tuple(
            ArgumentInfo(
                item.id,
                item.label,
                item.datatype.value,
                item.required,
                item.default,
                item.explanation,
                tuple(ChoiceInfo(choice.id, choice.label) for choice in item.choices),
                words.of(item.datatype, item.object_type),
            )
            for item in symbol.arguments
        ),
        symbol.previous_value,
        words.of(symbol.datatype, symbol.object_type),
    )


def _kind_of(symbol: Symbol) -> str:
    match symbol.kind:
        case SymbolKind.INSTANCE:
            return "instance"
        case SymbolKind.CONDITION | SymbolKind.CALCULATION:
            return "result"
        case SymbolKind.PARAMETER:
            return "parameter"
        case SymbolKind.APPLICATION_OBJECT:
            return "application_object"
        case SymbolKind.RULE | SymbolKind.RULESET:
            return "rule"
        case _:
            return "instance"


class _Budget:
    def __init__(self) -> None:
        self.count = 0

    def take(self) -> bool:
        if self.count >= MAX_NAMES_PER_ITEM:
            return False
        self.count += 1
        return True


def _entry(
    symbol: Symbol,
    path: tuple[str, ...],
    language: str,
    budget: _Budget,
    depth: int,
    words: _Words,
    kind: str | None = None,
) -> VisibleName | None:
    if not budget.take():
        return None
    entry = VisibleName(
        symbol.display_name(language),
        path,
        kind or _kind_of(symbol),
        datatype=symbol.datatype.value if symbol.datatype is not None else None,
        datatype_label=words.of(symbol.datatype, symbol.object_type),
    )
    for key, member in symbol.members().items():
        if member.kind is SymbolKind.PROPERTY:
            if len(entry.properties) >= MAX_PROPERTIES_PER_NAME:
                entry.properties_truncated = True
                continue
            entry.properties.append(_property_info(member, words))
        elif member.kind is SymbolKind.METHOD:
            if len(entry.methods) >= MAX_PROPERTIES_PER_NAME:
                entry.properties_truncated = True
                continue
            entry.methods.append(_method_info(member, words))
        elif member.kind in (SymbolKind.INSTANCE, SymbolKind.RULE, SymbolKind.RULESET):
            if depth < 4:
                child = _entry(
                    member, (*path, member.name or key), language, budget, depth + 1, words
                )
                if child is not None:
                    entry.contents.append(child)
    return entry


def visible_names(
    scope: Scope,
    language: str,
    hidden: Collection[str] = (),
    registry: ElementRegistry | None = None,
) -> tuple[list[VisibleName], bool]:
    """The names visible from ``scope`` (the inner ones first) and whether the list was cut
    off at the limit. Strategy parameters are names of their own, under ``Strategie``.

    ``hidden`` are the keys, in lower case, of instances that are no use at the place of the
    expression (specification 3.3, 3.4): the list leaves them out, although an expression can
    still name them (the consistency check reports that). With the ``registry`` the word for
    the data type of an object is the name of its object type."""
    words = _Words(registry)
    budget = _Budget()
    result: list[VisibleName] = []
    truncated = False
    for symbol in scope.visible():
        if symbol.kind is SymbolKind.INSTANCE and symbol.name.lower() in hidden:
            continue
        entry = _entry(symbol, (symbol.name,), language, budget, 0, words)
        if entry is None:
            truncated = True
            break
        result.append(entry)
        if symbol.name == _STRATEGY_OBJECT and symbol.kind is SymbolKind.APPLICATION_OBJECT:
            for key, member in symbol.members().items():
                if member.kind is SymbolKind.PARAMETER:
                    parameter = _entry(
                        member,
                        (symbol.name, member.name or key),
                        language,
                        budget,
                        1,
                        words,
                        "strategy_parameter",
                    )
                    if parameter is None:
                        truncated = True
                        break
                    result.append(parameter)
    return result, truncated
