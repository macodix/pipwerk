"""Symbols: the names an expression can address, and the environment that resolves them."""

from collections.abc import Callable
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Protocol

from pipwerk_domain.expressions.exprtypes import UNKNOWN, ExprType


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
    UNRESOLVED = "unresolved"  # a property of an object that cannot be checked yet


@dataclass(eq=False, slots=True)
class Symbol:
    """A named thing with an optional value type and optional members.

    ``name`` is the canonical spelling (the identifier). The value type and the members
    can be computed on first use (``type_factory``, ``members_factory``); a cycle in
    the computation of a type ends in the unknown type.
    """

    name: str
    kind: SymbolKind
    object_type: str | None = None
    type: ExprType | None = None
    type_factory: Callable[[], ExprType] | None = None
    members_factory: Callable[[], dict[str, Symbol]] | None = None
    open_members: bool = False
    payload: object = None
    _members: dict[str, Symbol] | None = field(default=None, repr=False)
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

    def member(self, name: str) -> Symbol | None:
        """The member with this name (upper and lower case are not distinguished)."""
        if self._members is None:
            self._members = {} if self.members_factory is None else self.members_factory()
        found = self._members.get(name.lower())
        if found is None and self.open_members:
            return Symbol(name, SymbolKind.UNRESOLVED, type=ExprType(None))
        return found


class Environment(Protocol):
    """Resolves the first part of a name."""

    def resolve(self, name: str) -> Symbol | None: ...


class Scope:
    """A namespace: names of one level and the enclosing namespace. An inner name hides an
    outer one without a finding (specification 3.3)."""

    def __init__(self, parent: Scope | None = None) -> None:
        self.parent = parent
        self._symbols: dict[str, Symbol] = {}

    def add(self, symbol: Symbol) -> bool:
        """Add a name; ``False`` if the level already has the name."""
        key = symbol.name.lower()
        if key in self._symbols:
            return False
        self._symbols[key] = symbol
        return True

    def resolve(self, name: str) -> Symbol | None:
        scope: Scope | None = self
        key = name.lower()
        while scope is not None:
            found = scope._symbols.get(key)
            if found is not None:
                return found
            scope = scope.parent
        return None

    def names(self) -> list[str]:
        """The names of this level (not of the enclosing namespaces)."""
        return [symbol.name for symbol in self._symbols.values()]
