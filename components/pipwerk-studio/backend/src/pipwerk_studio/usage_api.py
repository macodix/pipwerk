"""The endpoints ``/api/v1/usage``, ``/api/v1/insert`` and ``/api/v1/removals`` (specification 4.2,
3.3, 3.4).

``/usage`` answers, for a strategy, the element of the first use of each instance on the drawing
area, the elements at which it is usable and, for each element, the instances it uses. ``/insert``
makes the instance for a template or an object type with the names the namespace of the document
allows. ``/removals`` names the elements that use an object and, on request, removes it. All three
only connect HTTP with the shared library (specification E2): the rules are in ``pipwerk_domain``.

Limits (specification 8): the document is at most 2 MiB and the library limits its elements, inputs
and names; a name of the request is at most ``MAX_NAME_LENGTH`` characters. The places at which an
instance is usable are listed for at most ``MAX_USAGE_ENTRIES`` entries together; where the limit
is reached the answer leaves the list out and says so.
"""

from __future__ import annotations

from typing import Any, Literal

from pipwerk_domain.consistency import ElementUse, UsageReport, analyze_usage
from pipwerk_domain.documents import (
    InstanceDocument,
    StrategyDocument,
    instance_to_document,
    strategy_to_document,
)
from pipwerk_domain.limits import MAX_KEY_LENGTH, MAX_NAME_LENGTH
from pipwerk_domain.model import Instance, Strategy, Template
from pipwerk_domain.operations import (
    InsertionError,
    Uses,
    insert_instance,
    remove_element,
    remove_rule,
    remove_strategy_parameter,
    uses_of_element,
    uses_of_rule,
    uses_of_strategy_parameter,
)
from pipwerk_domain.registry import ElementRegistry
from pydantic import Field, model_validator

from pipwerk_studio.api_models import ApiModel
from pipwerk_studio.errors import ApiException

LanguageName = Literal["de", "en"]
UseKindName = Literal["input", "expression", "rule", "data_link"]
FirstUseSourceName = Literal["stored", "flow", "instance", "rule"]
MemberKindName = Literal["property", "method"]
RemovalKindName = Literal["element", "strategy_parameter", "rule"]


# --- usage -------------------------------------------------------------------------------


class UsageRequest(ApiModel):
    """The request of ``/api/v1/usage``: the document (a strategy, format 2.0 or 1.0)."""

    document: dict[str, Any]


class MemberUseModel(ApiModel):
    """A property or method of an instance that an element uses. ``name`` is its identifier (for
    something inside a contained instance the identifiers joined with points); ``arguments`` are
    the fixed values of the arguments of an input that names a method; ``refresh`` is the
    indication "Aktualisieren" of an input."""

    name: str
    kind: MemberKindName
    arguments: list[bool | int | float | str]
    refresh: bool


class ElementUseModel(ApiModel):
    """How an element uses an instance. ``kind`` is ``input`` (an input of the element),
    ``expression`` (a name in an expression of the element), ``rule`` (a name in a rule of the
    element or of the strategy) or ``data_link`` (a data connection: a binding of the element or
    of another instance). ``by_instance`` is the key of that other instance: the use then
    takes place at the element of its first use. ``members`` are the properties and methods that
    are used."""

    instance: str
    kind: UseKindName
    by_instance: str | None
    members: list[MemberUseModel]


class ElementUsageModel(ApiModel):
    """The instances an element uses, in the order of the flow of the strategy."""

    element: str
    uses: list[ElementUseModel]


class InstanceUsageModel(ApiModel):
    """The use of one instance on the drawing area (specification 3.3).

    ``instance`` is its key and ``element`` the identifier of the element that shows it.
    ``first_use`` is the identifier of the element of its first use, ``null`` if no element uses
    it (the check then reports ``instance.unconnected``); ``first_use_source`` tells where that
    comes from: ``stored`` (the instance stores it), ``flow`` (the first element in the order of the
    flow that uses it), ``instance`` (only another instance uses it: the element of that instance)
    or ``rule`` (only a rule of the strategy uses it: the first element that takes rules).
    ``usable_everywhere`` is true if the instance is usable at every element (no first use, or no
    way of the flow leads to it); otherwise ``usable_at`` lists the elements of the flow at which
    it is usable. ``usable_at_omitted`` is true where the list was left out because the limit of
    entries of the answer was reached. A rule of the strategy can use every instance."""

    instance: str
    name: str
    element: str
    object_type: str
    can_refresh: bool
    connected: bool
    first_use: str | None
    first_use_source: FirstUseSourceName | None
    usable_everywhere: bool
    usable_at: list[str]
    usable_at_omitted: bool


class UsageResponse(ApiModel):
    """The use of the instances of a strategy: ``instances`` in the order of the strategy,
    ``elements`` the elements that use instances in the order of the flow, ``strategy_rules`` the
    uses by rules of the strategy. ``truncated`` is true if the limit of entries was reached."""

    instances: list[InstanceUsageModel]
    elements: list[ElementUsageModel]
    strategy_rules: list[ElementUseModel]
    truncated: bool


def _use_model(use: ElementUse) -> ElementUseModel:
    return ElementUseModel(
        instance=use.instance,
        kind=use.kind,  # type: ignore[arg-type]
        by_instance=use.by_instance,
        members=[
            MemberUseModel(
                name=item.name,
                kind=item.kind,  # type: ignore[arg-type]
                arguments=list(item.arguments),
                refresh=item.refresh,
            )
            for item in use.members
        ],
    )


def usage_response(report: UsageReport) -> UsageResponse:
    return UsageResponse(
        instances=[
            InstanceUsageModel(
                instance=item.instance,
                name=item.name,
                element=item.element,
                object_type=item.object_type,
                can_refresh=item.can_refresh,
                connected=item.connected,
                first_use=item.first_use,
                first_use_source=item.first_use_source,  # type: ignore[arg-type]
                usable_everywhere=item.usable_everywhere,
                usable_at=list(item.usable_at),
                usable_at_omitted=item.usable_at_omitted,
            )
            for item in report.instances
        ],
        elements=[
            ElementUsageModel(element=item.element, uses=[_use_model(use) for use in item.uses])
            for item in report.elements
        ],
        strategy_rules=[_use_model(use) for use in report.strategy_rules],
        truncated=report.truncated,
    )


def answer_usage(value: Strategy | Template, registry: ElementRegistry) -> UsageResponse:
    """The use of the instances of a strategy. Raises :class:`ApiException`
    ``usage.strategy_required`` for a template, which has no drawing area."""
    if not isinstance(value, Strategy):
        raise ApiException("usage.strategy_required")
    return usage_response(analyze_usage(value, registry))


# --- insert ------------------------------------------------------------------------------


class InsertRequest(ApiModel):
    """The request of ``/api/v1/insert``: the document the instance is for (strategy or template,
    format 2.0 or 1.0) and exactly one of ``template`` (the document of a template: indicator,
    trend, rule or ruleset) and ``object_type`` (the identifier of a registered object type).
    ``name`` is the wanted name of the instance, else the name of the template or of the type in
    ``language`` (``de`` if left out)."""

    document: dict[str, Any]
    template: dict[str, Any] | None = None
    object_type: str | None = Field(default=None, max_length=MAX_NAME_LENGTH)
    name: str | None = Field(default=None, max_length=MAX_NAME_LENGTH)
    language: LanguageName = "de"

    @model_validator(mode="after")
    def _one_source(self) -> InsertRequest:
        if (self.template is None) == (self.object_type is None):
            raise ValueError("exactly one of template and object_type is given")
        return self


class InsertResponse(ApiModel):
    """The new instance, complete (E4): its name is made unique in the namespace of the document;
    each instance and rule inside it has the name "<name of the instance that contains it> <former
    name>" (a number appended where that is taken), its own key, and the expressions inside the
    instance use the new keys. ``origin`` names the object type and the template. The document
    itself is not changed; the caller puts the instance where it belongs (an element, the rules of
    the strategy or of an element, or the instances or rules of another instance)."""

    instance: InstanceDocument


def answer_insert(
    target: Strategy | Template,
    template: Template | None,
    request: InsertRequest,
    registry: ElementRegistry,
) -> InsertResponse:
    """The instance for a template or an object type. Raises :class:`ApiException`
    ``insert.type_unknown`` for an object type that is not registered."""
    try:
        instance: Instance = insert_instance(
            target,
            template=template,
            object_type=request.object_type,
            name=request.name,
            language=request.language,
            registry=registry,
        )
    except InsertionError as error:
        raise ApiException("insert.type_unknown") from error
    return InsertResponse(instance=instance_to_document(instance))


# --- removals ----------------------------------------------------------------------------


class RemovalRequest(ApiModel):
    """The request of ``/api/v1/removals``: the document (a strategy, format 2.0 or 1.0), what
    to remove and whether to do it. ``kind`` is ``element`` (``target`` is the identifier of the
    element; an element that places an order takes its management with it),
    ``strategy_parameter`` (``target`` is its key) or ``rule`` (``target`` is the key of a rule
    of the strategy or of an element). Without ``apply`` the answer only names the uses, for
    the question before the removal."""

    document: dict[str, Any]
    kind: RemovalKindName
    target: str = Field(max_length=MAX_KEY_LENGTH)
    apply: bool = False


class RemovalResponse(ApiModel):
    """Who uses the object: ``used_by`` the identifiers of the elements, in the order of the
    strategy (an instance counts as the element that shows it), and ``used_by_rules`` the keys of
    the rules of the strategy. With ``apply`` the object is removed: ``removed`` lists the
    identifiers of the removed elements and ``document`` is the strategy after the removal, in the
    format 2.0 (every use in an expression is an empty place, a binding to it is "not set", inputs,
    connections and places in sections of removed elements are gone); else both are empty."""

    used_by: list[str]
    used_by_rules: list[str]
    removed: list[str]
    document: StrategyDocument | None


def _rule_of(strategy: Strategy, key: str) -> Instance | None:
    lowered = key.lower()
    candidates = [*strategy.rules]
    for element in strategy.elements:
        candidates.extend(element.rules)
    return next((item for item in candidates if item.key.lower() == lowered), None)


def answer_removal(value: Strategy | Template, request: RemovalRequest) -> RemovalResponse:
    """Who uses the object and, with ``apply``, the strategy without it. Raises
    :class:`ApiException` ``removal.strategy_required`` for a template and
    ``removal.target_unknown`` for an object the strategy does not have."""
    if not isinstance(value, Strategy):
        raise ApiException("removal.strategy_required")
    uses: Uses
    removed: list[str] = []
    if request.kind == "element":
        if value.element(request.target) is None:
            raise ApiException("removal.target_unknown")
        uses = uses_of_element(value, request.target)
        if request.apply:
            removed = remove_element(value, request.target)
    elif request.kind == "strategy_parameter":
        lowered = request.target.lower()
        if not any(item.key.lower() == lowered for item in value.parameters):
            raise ApiException("removal.target_unknown")
        uses = uses_of_strategy_parameter(value, request.target)
        if request.apply:
            remove_strategy_parameter(value, request.target)
    else:
        rule = _rule_of(value, request.target)
        if rule is None:
            raise ApiException("removal.target_unknown")
        uses = uses_of_rule(value, rule)
        if request.apply:
            remove_rule(value, rule)
    return RemovalResponse(
        used_by=uses.elements,
        used_by_rules=uses.rules,
        removed=removed,
        document=strategy_to_document(value) if request.apply else None,
    )
