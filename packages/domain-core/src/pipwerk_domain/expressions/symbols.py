"""Symbols: the names an expression can address, and the environment that resolves them.

A name has a key (the spelling in the stored form of an expression) and, in the display
form, the name the user sees: a name of the user (``shown``) or a label in German and English
(application objects and the properties of delivered types). The stored form resolves keys,
the display form resolves names and labels in both languages and keys too (specification 3.4);
a name that does not point to exactly one symbol is unknown.
"""

import re
from collections.abc import Callable, Iterable
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Protocol

from pipwerk_domain.expressions.exprtypes import UNKNOWN, ExprType
from pipwerk_domain.typedesc import ArgumentDescription, Choice, DataType, Label

_SPACES = re.compile(r"\s+")


def normalized_name(text: str) -> str:
    """A name for the comparison of names: spaces at the edges cut off, runs of spaces
    shortened to one, upper and lower case not distinguished."""
    return _SPACES.sub(" ", text.strip()).casefold()


class SymbolKind(StrEnum):
    """What a name stands for."""

    PARAMETER = "parameter"  # parameter of a rule or template, strategy parameter
    APPLICATION_OBJECT = "application_object"  # Konto, Instrument, Kerze, Tick, Order, ...
    INSTANCE = "instance"
    CONDITION = "condition"
    CALCULATION = "calculation"
    RULE = "rule"
    RULESET = "ruleset"
    PROPERTY = "property"  # property of an object, ``Ergebnis`` of a rule and so on
    METHOD = "method"  # method of an object, addressed as ``Objekt.Methode(Argumente)``
    UNRESOLVED = "unresolved"  # a property of an object that cannot be checked yet


@dataclass(eq=False, slots=True)
class Symbol:
    """A named thing with an optional value type and optional members.

    ``name`` is the key (the spelling of the stored form). The value type and the members
    can be computed on first use (``type_factory``, ``members_factory``); a cycle in
    the computation of a type ends in the unknown type. ``label`` (both languages) or ``shown``
    (the name of the user) is what the display form shows; ``datatype``, ``explanation`` and
    ``choices`` describe a property for the list of the names at a place of an expression.
    ``previous_value`` tells that the fachmodell defines an earlier value for it, so that
    ``PREVIOUS`` may stand around it (specification 3.4).
    """

    name: str
    kind: SymbolKind
    object_type: str | None = None
    type: ExprType | None = None
    type_factory: Callable[[], ExprType] | None = None
    members_factory: Callable[[], dict[str, Symbol]] | None = None
    open_members: bool = False
    payload: object = None
    label: Label | None = None
    shown: str | None = None
    datatype: DataType | None = None
    explanation: Label | None = None
    choices: tuple[Choice, ...] = ()
    previous_value: bool = False
    arguments: tuple[ArgumentDescription, ...] = ()
    """The arguments of a method (symbol of the kind ``METHOD``); its ``type`` is the type of
    the result, its ``choices`` the values of a result that is a choice."""
    _members: dict[str, Symbol] | None = field(default=None, repr=False)
    _by_label: dict[str, list[Symbol]] | None = field(default=None, repr=False)
    _resolving: bool = field(default=False, repr=False)

    @property
    def value_type(self) -> ExprType | None:
        """The type of the value, ``None`` if the symbol is an object without a value."""
        if self.type is None and self.type_factory is not None:
            if self._resolving:
                return UNKNOWN
            self._resolving = True
            try:
                self.type = self.type_factory()
            finally:
                self._resolving = False
        return self.type

    def display_name(self, language: str) -> str:
        """The name the display form shows in the language (``de`` or ``en``)."""
        if self.label is not None:
            return self.label.en if language == "en" else self.label.de
        return self.shown if self.shown is not None else self.name

    def members(self) -> dict[str, Symbol]:
        """The members by key in lower case."""
        if self._members is None:
            self._members = {} if self.members_factory is None else self.members_factory()
        return self._members

    def member(self, name: str, display: bool = False) -> Symbol | None:
        """The member with this name; upper and lower case are not distinguished. With
        ``display`` the name may also be a name or label in either language."""
        members = self.members()
        found = _pick(members, self._labels(), name) if display else members.get(name.lower())
        if found is None and self.open_members:
            return Symbol(name, SymbolKind.UNRESOLVED, type=ExprType(None))
        return found

    def _labels(self) -> dict[str, list[Symbol]]:
        if self._by_label is None:
            self._by_label = _label_index(self.members().values())
        return self._by_label


def _label_index(symbols: Iterable[Symbol]) -> dict[str, list[Symbol]]:
    index: dict[str, list[Symbol]] = {}
    for symbol in symbols:
        texts = {symbol.name}
        if symbol.label is not None:
            texts.update((symbol.label.de, symbol.label.en))
        if symbol.shown is not None:
            texts.add(symbol.shown)
        for text in texts:
            bucket = index.setdefault(normalized_name(text), [])
            if symbol not in bucket:
                bucket.append(symbol)
    return index


def _pick(by_key: dict[str, Symbol], by_label: dict[str, list[Symbol]], text: str) -> Symbol | None:
    """The one symbol that the text names by key, name or label; none if there is no such
    symbol or more than one."""
    candidates: list[Symbol] = list(by_label.get(normalized_name(text), ()))
    by_key_found = by_key.get(text.lower())
    if by_key_found is not None and by_key_found not in candidates:
        candidates.append(by_key_found)
    return candidates[0] if len(candidates) == 1 else None


class Environment(Protocol):
    """Resolves the first part of a name."""

    def resolve(self, name: str, display: bool = False) -> Symbol | None: ...


class Scope:
    """A namespace: names of one level and the enclosing namespace. An inner name hides an
    outer one without a finding (specification 3.3)."""

    def __init__(self, parent: Scope | None = None) -> None:
        self.parent = parent
        self._symbols: dict[str, Symbol] = {}
        self._labels: dict[str, list[Symbol]] | None = None

    def add(self, symbol: Symbol) -> bool:
        """Add a name; ``False`` if the level already has the name."""
        key = symbol.name.lower()
        if key in self._symbols:
            return False
        self._symbols[key] = symbol
        self._labels = None
        return True

    def resolve(self, name: str, display: bool = False) -> Symbol | None:
        scope: Scope | None = self
        key = name.lower()
        while scope is not None:
            if display:
                if scope._labels is None:
                    scope._labels = _label_index(scope._symbols.values())
                level_candidates = list(scope._labels.get(normalized_name(name), ()))
                by_key = scope._symbols.get(key)
                if by_key is not None and by_key not in level_candidates:
                    level_candidates.append(by_key)
                if level_candidates:
                    return level_candidates[0] if len(level_candidates) == 1 else None
            else:
                found = scope._symbols.get(key)
                if found is not None:
                    return found
            scope = scope.parent
        return None

    def names(self) -> list[str]:
        """The keys of this level (not of the enclosing namespaces)."""
        return [symbol.name for symbol in self._symbols.values()]

    def symbols(self) -> list[Symbol]:
        """The symbols of this level (not of the enclosing namespaces)."""
        return list(self._symbols.values())

    def visible(self) -> list[Symbol]:
        """The symbols visible from this level, the inner ones first; an inner symbol hides an
        outer one of the same key."""
        result: list[Symbol] = []
        seen: set[str] = set()
        scope: Scope | None = self
        while scope is not None:
            for key, symbol in scope._symbols.items():
                if key not in seen:
                    seen.add(key)
                    result.append(symbol)
            scope = scope.parent
        return result
