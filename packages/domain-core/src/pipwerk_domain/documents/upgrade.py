"""Reading the format 1.0: conversion of a document of the format 1.0 to the format 2.0
(specification 3.7, E9).

* Key in an expression: the former name, so expressions stay valid. If it equals the
  identifier of an object of the application or the name of a function (without regard to
  upper and lower case), the conversion forms a unique key by the rule of the specification
  3.3 and replaces the name in the expressions of its namespace; in 1.0 the name hid the
  object of the application there, so the meaning stays the same. A condition or calculation
  without a former name gets a key formed from its former designation.
* Name: the former designation where there is one, else the former name; for an element that
  shows an object the designation of the element is the name of the instance. A name in
  programming spelling (with ``_`` and no space) is written with spaces and a capital at the
  start: "Stop abstand". Umlauts are not restored.
* Origin from a delivered template or an object type: only the identifier; the stored name
  is dropped. The position on the drawing area is dropped. The parameter ``Kursquelle`` of the
  EMA becomes ``Anwenden auf``. The parameter and the order property ``Instrument`` get the
  preset "Instrument der Anwendung". Inputs and sections are empty, the orientation is vertical.
* A management without triggers of its own gets the connection from the output ``gestellt`` to
  its one element without an incoming connection, if there is exactly one.
"""

import uuid
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from typing import Any

from pipwerk_domain import catalog
from pipwerk_domain.defaults import builtin_templates, default_registry
from pipwerk_domain.documents import models as v2
from pipwerk_domain.documents import v1
from pipwerk_domain.expressions.functions import list_functions
from pipwerk_domain.expressions.lexer import SyntaxProblem, TokenKind, tokenize
from pipwerk_domain.identifiers import (
    form_key,
    identifier_from_name,
    is_valid_key,
    name_from_programming_name,
)
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import (
    APPLICATION_INSTRUMENT,
    INSTRUMENT_PARAMETER,
    ElementKind,
)

type Rewrite = Callable[[str], str]

_CONNECTION_NAMESPACE = uuid.UUID("0b5d4c1e-7a39-4f58-9d2c-3e8a61b7f4c2")
_KURSQUELLE = "kursquelle"
_ANWENDEN_AUF = "anwenden_auf"


def _identity(text: str) -> str:
    return text


def _compose(first: Rewrite, second: Rewrite) -> Rewrite:
    if first is _identity:
        return second
    if second is _identity:
        return first
    return lambda text: second(first(text))


def _renamer(mapping: dict[str, str]) -> Rewrite:
    """A function that replaces the first part of a name in an expression that equals a
    former name (without regard to upper and lower case) by the new key."""
    if not mapping:
        return _identity

    def rewrite(text: str) -> str:
        try:
            tokens = tokenize(text)
        except SyntaxProblem:
            return text
        edits: list[tuple[int, int, str]] = []
        for index, token in enumerate(tokens):
            if token.kind is not TokenKind.NAME or not token.parts or token.parts[0].bracketed:
                continue
            following = tokens[index + 1] if index + 1 < len(tokens) else None
            if (
                len(token.parts) == 1
                and following is not None
                and following.kind is TokenKind.LEFT_PAREN
            ):
                continue  # a function
            replacement = mapping.get(token.parts[0].text.lower())
            if replacement is not None:
                edits.append((token.parts[0].start, token.parts[0].end, replacement))
        for start, end, replacement in sorted(edits, reverse=True):
            text = text[:start] + replacement + text[end:]
        return text

    return rewrite


@dataclass(slots=True)
class _Keys:
    """The keys of the objects of one namespace and the replacements of former names."""

    keys: list[str]
    renames: dict[str, str]


def _display(text: str) -> str:
    return name_from_programming_name(text)


class _Upgrader:
    def __init__(self, registry: ElementRegistry) -> None:
        self.registry = registry
        self.reserved = {
            description.id.lower() for description in registry.list(ElementKind.APPLICATION_OBJECT)
        } | {item.name.lower() for item in list_functions()}
        self.builtin_ids = {template.id for template in builtin_templates()}

    # --- keys ------------------------------------------------------------------------------

    def assign_keys(
        self,
        candidates: list[tuple[str, str, str]],
        taken: Iterable[str] = (),
    ) -> _Keys:
        """Keys for the objects of a namespace. A candidate is (former name, designation to
        form a key from if the former name does not serve, fallback)."""
        used = {name.lower() for name, _, _ in candidates if self._serves(name)}
        used.update(item.lower() for item in taken)
        keys: list[str] = []
        renames: dict[str, str] = {}
        for name, designation, fallback in candidates:
            if self._serves(name):
                keys.append(name)
                continue
            key = form_key(name or designation, used | self.reserved, fallback)
            used.add(key.lower())
            keys.append(key)
            if is_valid_key(name):
                renames[name.lower()] = key
        return _Keys(keys, renames)

    def _serves(self, name: str) -> bool:
        return is_valid_key(name) and name.lower() not in self.reserved

    # --- content of an instance or template -------------------------------------------------

    def bindings(
        self,
        values: dict[str, v1.BindingDocument],
        rewrite: Rewrite,
        rename: dict[str, str] | None = None,
    ) -> dict[str, v2.BindingDocument]:
        result: dict[str, v2.BindingDocument] = {}
        for name, item in values.items():
            value = item.value
            if item.kind == "expression" and isinstance(value, str):
                value = rewrite(value)
            result[(rename or {}).get(name, name)] = v2.BindingDocument(kind=item.kind, value=value)
        return result

    def content(
        self,
        source: v1.InstanceDocument
        | v1.IndicatorDocument
        | v1.TrendDocument
        | v1.RuleDocument
        | v1.RulesetDocument,
        outer: Rewrite,
        list_rewrite: Rewrite,
    ) -> dict[str, Any]:
        """The fields of the content of an instance or template. ``outer`` rewrites what is
        evaluated outside (the values of the parameters), ``list_rewrite`` the expression of a
        rule in its list."""
        object_type = source.object_type
        description = self.registry.get(object_type)
        # the namespace inside: own parameters, contained instances and rules
        taken = [item.id for item in description.parameters] if description is not None else []
        own = self.assign_keys(
            [(item.name, item.name, "parameter") for item in source.parameters], taken
        )
        instances = self.assign_keys(
            [(item.name, item.name, _fallback_of(item.object_type)) for item in source.instances],
            [*taken, *own.keys],
        )
        rules = self.assign_keys(
            [(item.name, item.name, _fallback_of(item.object_type)) for item in source.rules],
            [*taken, *own.keys, *instances.keys],
        )
        inside = _renamer({**own.renames, **instances.renames, **rules.renames})
        is_rule = object_type == catalog.TYPE_RULE
        expression_rewrite = _compose(_renamer(own.renames), list_rewrite) if is_rule else inside
        bindings = self.bindings(source.parameter_values, outer)
        if object_type == "EMA":
            bindings = self._rename_binding(bindings, _KURSQUELLE, _ANWENDEN_AUF)
        bindings = self._preset_instrument(set(taken), bindings)
        result: dict[str, Any] = {
            "parameter_values": bindings,
            "parameters": [
                v2.ParameterDefinitionDocument(
                    key=key,
                    name=_display(item.name),
                    datatype=item.datatype,
                    required=item.required,
                    default=item.default,
                    choices=list(item.choices),
                )
                for key, item in zip(own.keys, source.parameters, strict=True)
            ],
            "properties": [
                v2.PropertyDefinitionDocument(
                    key=item.name
                    if is_valid_key(item.name)
                    else form_key(item.name, (), "eigenschaft"),
                    name=_display(item.name),
                    datatype=item.datatype,
                    expression=inside(item.expression),
                    choices=list(item.choices),
                )
                for item in source.properties
            ],
            "instances": [
                self.instance(item, key, inside, inside)
                for key, item in zip(instances.keys, source.instances, strict=True)
            ],
            "rules": [
                self.rule_instance(item, key, inside if not is_rule else list_rewrite)
                for key, item in zip(rules.keys, source.rules, strict=True)
            ],
            "expression": None
            if source.expression is None
            else expression_rewrite(source.expression),
            "determined_property": source.determined_property,
            "comparison": source.comparison,
            "result_expression": (
                None if source.result_expression is None else inside(source.result_expression)
            ),
        }
        return result

    @staticmethod
    def _rename_binding(
        values: dict[str, v2.BindingDocument], old: str, new: str
    ) -> dict[str, v2.BindingDocument]:
        if old not in values or new in values:
            return values
        return {(new if name == old else name): item for name, item in values.items()}

    @staticmethod
    def _preset_instrument(
        names: set[str], values: dict[str, v2.BindingDocument]
    ) -> dict[str, v2.BindingDocument]:
        if INSTRUMENT_PARAMETER in names and INSTRUMENT_PARAMETER not in values:
            values = {
                **values,
                INSTRUMENT_PARAMETER: v2.BindingDocument(
                    kind="fixed", value=APPLICATION_INSTRUMENT
                ),
            }
        return values

    def origin(self, source: v1.OriginDocument | None) -> v2.OriginDocument | None:
        if source is None:
            return None
        name = None
        if source.template_id is not None and source.template_id not in self.builtin_ids:
            name = source.template_title
        return v2.OriginDocument(
            object_type=source.object_type, template_id=source.template_id, template_name=name
        )

    def instance(
        self,
        source: v1.InstanceDocument,
        key: str,
        outer: Rewrite,
        list_rewrite: Rewrite,
        name: str | None = None,
    ) -> v2.InstanceDocument:
        return v2.InstanceDocument(
            name=_display(name if name else source.name),
            key=key,
            object_type=source.object_type,
            origin=self.origin(source.origin),
            **self.content(source, outer, list_rewrite),
        )

    def rule_instance(
        self, source: v1.InstanceDocument, key: str, list_rewrite: Rewrite
    ) -> v2.InstanceDocument:
        return self.instance(source, key, list_rewrite, list_rewrite)

    # --- strategy ----------------------------------------------------------------------------

    def strategy(self, source: v1.StrategyDocument) -> v2.StrategyDocument:
        # keys of the namespace of the strategy
        entries: list[tuple[str, str, str]] = []
        roles: list[tuple[str, int]] = []  # ("element", index) or ("rule", index)
        for index, element in enumerate(source.elements):
            if element.instance is not None:
                entries.append(
                    (
                        element.instance.name,
                        element.title or element.instance.name,
                        _fallback_of(element.instance.object_type),
                    )
                )
            elif element.type in (catalog.FLOW_CONDITION, catalog.FLOW_CALCULATION):
                fallback = "bedingung" if element.type == catalog.FLOW_CONDITION else "berechnung"
                entries.append((element.name or "", element.title or element.name or "", fallback))
            else:
                continue
            roles.append(("element", index))
        for index, rule in enumerate(source.rules):
            entries.append((rule.name, rule.name, _fallback_of(rule.object_type)))
            roles.append(("rule", index))
        parameter_keys = self._parameter_keys(source)
        keys = self.assign_keys(entries, [])
        strategy_rewrite = _renamer(keys.renames)
        element_keys = {
            index: key
            for (role, index), key in zip(roles, keys.keys, strict=True)
            if role == "element"
        }
        rule_keys = [key for (role, _), key in zip(roles, keys.keys, strict=True) if role == "rule"]
        elements = [
            self.element(item, element_keys.get(index), strategy_rewrite)
            for index, item in enumerate(source.elements)
        ]
        connections = [
            v2.ConnectionDocument(
                id=_connection_id(item.source, item.output, item.target),
                source=item.source,
                output=item.output,
                target=item.target,
            )
            for item in source.connections
        ]
        connections.extend(self._management_starts(source, connections))
        return v2.StrategyDocument(
            format="pipwerk.strategy",
            format_version=v2.FORMAT_VERSION,
            id=source.id,
            name=_display(source.title),
            description=source.description,
            parameters=[
                v2.StrategyParameterDocument(
                    key=key,
                    name=_display(item.name),
                    datatype=item.datatype,
                    value=item.value,
                    at_application=item.at_application,
                    choices=list(item.choices),
                )
                for key, item in zip(parameter_keys, source.parameters, strict=True)
            ],
            rules=[
                self.rule_instance(item, key, strategy_rewrite)
                for key, item in zip(rule_keys, source.rules, strict=True)
            ],
            elements=elements,
            connections=connections,
        )

    def _parameter_keys(self, source: v1.StrategyDocument) -> list[str]:
        """The keys of the strategy parameters: the former name; they stand behind
        ``Strategie.`` and cannot hide an object of the application."""
        used = {item.name.lower() for item in source.parameters if is_valid_key(item.name)}
        result: list[str] = []
        for item in source.parameters:
            if is_valid_key(item.name):
                result.append(item.name)
                continue
            key = form_key(item.name, used, "parameter")
            used.add(key.lower())
            result.append(key)
        return result

    def element(
        self, source: v1.ElementDocument, key: str | None, strategy_rewrite: Rewrite
    ) -> v2.ElementDocument:
        description = self.registry.get(source.type)
        parameters = self.bindings(source.parameters, strategy_rewrite)
        properties = self.bindings(source.properties, strategy_rewrite)
        if description is not None and source.instance is None:
            parameters = self._preset_instrument(
                {item.id for item in description.parameters}, parameters
            )
            if source.type == catalog.FLOW_PLACE_ORDER:
                properties = self._preset_order_instrument(source, properties)
        rule_keys = self.assign_keys(
            [(item.name, item.name, _fallback_of(item.object_type)) for item in source.rules]
        )
        rules_rewrite = _compose(_renamer(rule_keys.renames), strategy_rewrite)
        name: str | None
        if source.instance is not None:
            return v2.ElementDocument(
                id=source.id,
                type=source.type,
                parameters=parameters,
                properties=properties,
                rules=[
                    self.rule_instance(item, rule_key, rules_rewrite)
                    for rule_key, item in zip(rule_keys.keys, source.rules, strict=True)
                ],
                management_of=source.management_of,
                instance=self.instance(
                    source.instance,
                    key or source.instance.name,
                    strategy_rewrite,
                    strategy_rewrite,
                    name=source.title,
                ),
            )
        text = source.title or source.name
        name = _display(text) if text else None
        return v2.ElementDocument(
            id=source.id,
            type=source.type,
            name=name,
            key=key,
            parameters=parameters,
            properties=properties,
            rules=[
                self.rule_instance(item, rule_key, rules_rewrite)
                for rule_key, item in zip(rule_keys.keys, source.rules, strict=True)
            ],
            management_of=source.management_of,
        )

    def _preset_order_instrument(
        self, source: v1.ElementDocument, properties: dict[str, v2.BindingDocument]
    ) -> dict[str, v2.BindingDocument]:
        binding = source.parameters.get("ordertyp")
        order_type = (
            binding.value if binding is not None and isinstance(binding.value, str) else None
        )
        description = None if order_type is None else self.registry.get(order_type)
        if description is None or description.kind is not ElementKind.ORDER_TYPE:
            return properties
        prop = description.property(INSTRUMENT_PARAMETER)
        if prop is None or not prop.set_by_user or INSTRUMENT_PARAMETER in properties:
            return properties
        return {
            **properties,
            INSTRUMENT_PARAMETER: v2.BindingDocument(kind="fixed", value=APPLICATION_INSTRUMENT),
        }

    def _management_starts(
        self, source: v1.StrategyDocument, connections: list[v2.ConnectionDocument]
    ) -> list[v2.ConnectionDocument]:
        """The connection from ``gestellt`` to the one element of a management without
        triggers that has no incoming connection (specification 3.7)."""
        found: list[v2.ConnectionDocument] = []
        for element in source.elements:
            if element.type != catalog.FLOW_PLACE_ORDER:
                continue
            members = [item for item in source.elements if item.management_of == element.id]
            if not members:
                continue
            kinds = [self.registry.get(item.type) for item in members]
            if any(item is not None and item.kind is ElementKind.TRIGGER for item in kinds):
                continue
            member_ids = {item.id for item in members}
            targets = {item.target for item in connections if item.source in member_ids}
            without = [
                item
                for item in members
                if item.id not in targets
                and (description := self.registry.get(item.type)) is not None
                and description.kind is ElementKind.FLOW
            ]
            if len(without) == 1:
                found.append(
                    v2.ConnectionDocument(
                        id=_connection_id(element.id, "gestellt", without[0].id),
                        source=element.id,
                        output="gestellt",
                        target=without[0].id,
                    )
                )
        return found

    # --- templates ---------------------------------------------------------------------------

    def template(
        self,
        source: v1.IndicatorDocument | v1.TrendDocument | v1.RuleDocument | v1.RulesetDocument,
    ) -> v2.AnyDocument:
        fields = self.content(source, _identity, _identity)
        head: dict[str, Any] = {
            "format_version": v2.FORMAT_VERSION,
            "id": source.id,
            "name": _display(source.title),
            "description": source.description,
        }
        if isinstance(source, v1.TrendDocument):
            return v2.TrendDocument(format="pipwerk.trend", object_type="Trend", **head, **fields)
        if isinstance(source, v1.RuleDocument):
            return v2.RuleDocument(format="pipwerk.rule", object_type="Regel", **head, **fields)
        if isinstance(source, v1.RulesetDocument):
            return v2.RulesetDocument(
                format="pipwerk.ruleset", object_type="Regelwerk", **head, **fields
            )
        return v2.IndicatorDocument(
            format="pipwerk.indicator", object_type=source.object_type, **head, **fields
        )


def _fallback_of(object_type: str) -> str:
    return identifier_from_name(object_type) or "objekt"


def _connection_id(source: str, output: str, target: str) -> str:
    return str(uuid.uuid5(_CONNECTION_NAMESPACE, f"{source}|{output}|{target}"))


def upgrade_document(
    document: v1.AnyDocument, registry: ElementRegistry | None = None
) -> v2.AnyDocument:
    """The document of the format 2.0 for a document of the format 1.0."""
    upgrader = _Upgrader(default_registry() if registry is None else registry)
    if isinstance(document, v1.StrategyDocument):
        return upgrader.strategy(document)
    return upgrader.template(document)
