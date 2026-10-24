"""Use of the instances on the drawing area (specification 3.3, "Element der ersten Verwendung",
"Stand einer Instanz"): the element of the first use of each instance, the elements at which the
instance is usable, and for each element the instances it uses.

The check collects the raw uses while it analyzes the expressions, inputs and data connections
(:class:`RawUse`); :func:`build_report` turns them into the report and the problems the check
reports: a use at an element where the instance is not usable, an instance that no element uses.
"""

from collections import defaultdict
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field

from pipwerk_domain.consistency.graph import Dominance
from pipwerk_domain.limits import MAX_USAGE_ENTRIES
from pipwerk_domain.typedesc import Scalar

USE_INPUT = "input"
USE_EXPRESSION = "expression"
USE_RULE = "rule"
USE_DATA_LINK = "data_link"
"""The kinds of a use: an input of the element, a name in an expression of the element, a name in
a rule of the element or of the strategy, a data connection (a binding of the element, or of
another instance whose element is the one of this use)."""
_KIND_ORDER = (USE_INPUT, USE_EXPRESSION, USE_RULE, USE_DATA_LINK)

SOURCE_STORED = "stored"
SOURCE_FLOW = "flow"
SOURCE_INSTANCE = "instance"
SOURCE_RULE = "rule"
"""Where the element of the first use comes from: stored in the instance; the first element in
the order of the flow that uses it; the element of the one other instance that uses it; the first
element with rules, because only a rule of the strategy uses it."""


@dataclass(frozen=True, slots=True)
class RawUse:
    """One use of an instance, as the check found it. ``instance`` is the key in lower case of
    the instance on the drawing area that is used, ``element`` the identifier of the element that
    uses it (``None``: a rule of the strategy). ``via`` is the key in lower case of the instance
    on the drawing area whose binding makes the use (the use is then at the element of that
    instance); ``rule`` the key of the rule for the kind ``rule``."""

    instance: str
    element: str | None
    kind: str
    member: str | None = None
    member_kind: str = "property"
    arguments: tuple[Scalar, ...] = ()
    refresh: bool = False
    via: str | None = None
    rule: str | None = None


@dataclass(frozen=True, slots=True)
class MemberUse:
    """A property or method of an instance that an element uses. ``name`` is its identifier,
    for a name that goes into a contained instance the identifiers joined with points;
    ``arguments`` are the fixed values of the arguments of an input that names a method."""

    name: str
    kind: str
    arguments: tuple[Scalar, ...]
    refresh: bool


@dataclass(frozen=True, slots=True)
class ElementUse:
    """How an element uses an instance: the ``kind`` (see :data:`USE_INPUT` and the others), the
    properties and methods in ``members`` and, for a use that another instance makes, the key of
    that instance in ``by_instance``."""

    instance: str
    kind: str
    by_instance: str | None
    members: tuple[MemberUse, ...]


@dataclass(frozen=True, slots=True)
class ElementUsage:
    """The instances an element uses."""

    element: str
    uses: tuple[ElementUse, ...]


@dataclass(frozen=True, slots=True)
class InstanceUsage:
    """The use of one instance on the drawing area.

    ``element`` is the element that shows it. ``first_use`` is the identifier of the element of its
    first use, ``None`` if no element uses it; ``first_use_source`` says where that comes from
    (:data:`SOURCE_STORED` and the others). ``connected`` is true if there is a first use.
    ``usable_everywhere`` is true if the instance is usable at every element (it has no first use,
    or the flow does not reach its first use); otherwise ``usable_at`` lists the elements of the
    flow at which it is usable (the way rule of specification 3.3). It is empty and
    ``usable_at_omitted`` true where the limit of entries of the report was reached. A rule of
    the strategy can use every instance."""

    instance: str
    name: str
    element: str
    object_type: str
    can_refresh: bool
    connected: bool
    first_use: str | None
    first_use_source: str | None
    usable_everywhere: bool
    usable_at: tuple[str, ...]
    usable_at_omitted: bool


@dataclass(frozen=True, slots=True)
class UsageReport:
    """The use of the instances of a strategy: the instances in the order of the strategy, the
    elements that use instances in the order of the flow, and the uses by rules of the strategy.
    ``truncated`` is true if the limit of entries was reached."""

    instances: tuple[InstanceUsage, ...] = ()
    elements: tuple[ElementUsage, ...] = ()
    strategy_rules: tuple[ElementUse, ...] = ()
    truncated: bool = False


@dataclass(frozen=True, slots=True)
class TopInstance:
    """An instance on the drawing area, as the check hands it to the analysis."""

    key: str
    name: str
    element: str
    object_type: str
    stored_first_use: str | None
    can_refresh: bool


@dataclass(frozen=True, slots=True)
class Problem:
    """A finding of the analysis: the kind (``not_usable`` or ``unconnected``), the element and
    the instance it concerns and the data for the text."""

    kind: str
    element: str | None
    subject: str
    details: dict[str, object] = field(default_factory=dict)


@dataclass(slots=True)
class Analysis:
    """The result of :func:`build_report`: the report, its problems and what the check needs to
    tell the instances that are hidden at an element."""

    report: UsageReport
    problems: list[Problem]
    first_uses: dict[str, str | None]
    dominance: Dominance
    flow_nodes: frozenset[str]

    def hidden_at(self, element: str | None) -> frozenset[str]:
        """The keys in lower case of the instances that are not usable at the element: the
        instances whose first use is a flow element that does not dominate it."""
        if element is None or not self.dominance.contains(element):
            return frozenset()
        return frozenset(
            key
            for key, first in self.first_uses.items()
            if first is not None
            and self.dominance.contains(first)
            and not self.dominance.dominates(first, element)
        )


def build_report(
    instances: Sequence[TopInstance],
    raw_uses: Sequence[RawUse],
    *,
    flow_order: Sequence[str],
    successors: Mapping[str, Sequence[str]],
    main_triggers: Sequence[str],
    rule_elements: frozenset[str],
) -> Analysis:
    """Work out the element of the first use of each instance, where it is usable and the
    problems (specification 3.3, 3.6).

    ``flow_order`` lists the elements of the flow in the order of the flow (the main flow before
    the managements); ``successors`` are the connections of the flow including the step from a
    "Order aufgeben" to the own triggers of its management; ``main_triggers`` are the triggers of
    the main flow, from which every way starts; ``rule_elements`` the elements that take rules.
    """
    dominance = Dominance(list(main_triggers), successors)
    position = {node: index for index, node in enumerate(flow_order)}
    flow_nodes = frozenset(flow_order)
    by_instance: dict[str, list[RawUse]] = defaultdict(list)
    for use in raw_uses:
        by_instance[use.instance].append(use)
    known = {item.key.lower(): item for item in instances}
    first_uses: dict[str, str | None] = {}
    sources: dict[str, str | None] = {}
    effective: dict[str, list[tuple[RawUse, str | None]]] = {}
    working: set[str] = set()
    first_rule_element = next((node for node in flow_order if node in rule_elements), None)

    def element_of(use: RawUse) -> str | None:
        """The element at which a use takes place."""
        if use.via is None:
            return use.element
        if use.via == use.instance or use.via not in known:
            return None
        return resolve(use.via)[0]

    def resolve(key: str) -> tuple[str | None, str | None]:
        """The element of the first use of an instance and where it comes from."""
        if key in first_uses:
            return first_uses[key], sources[key]
        if key in working:
            return None, None  # a cycle of instances that use each other
        working.add(key)
        try:
            pairs = [(use, element_of(use)) for use in by_instance.get(key, ())]
            effective[key] = pairs
            at_elements = [(use, node) for use, node in pairs if node in position]
            first: str | None = None
            source: str | None = None
            stored = known[key].stored_first_use
            if stored is not None and any(node == stored for _, node in at_elements):
                first, source = stored, SOURCE_STORED
            elif at_elements:
                candidates = [node for _, node in at_elements if node is not None]
                first = min(candidates, key=position.__getitem__)
                direct = any(use.via is None for use, node in at_elements if node == first)
                source = SOURCE_FLOW if direct else SOURCE_INSTANCE
            elif any(node is None and use.via is None for use, node in pairs):
                first = first_rule_element
                source = SOURCE_RULE if first is not None else None
        finally:
            working.discard(key)
        first_uses[key] = first
        sources[key] = source
        return first, source

    for item in instances:
        resolve(item.key.lower())

    problems: list[Problem] = []
    per_element: dict[str, dict[tuple[str, str, str | None], list[MemberUse]]] = {}
    strategy_rules: dict[tuple[str, str, str | None], list[MemberUse]] = {}
    reported: set[tuple[str, str]] = set()
    for item in instances:
        key = item.key.lower()
        first = first_uses[key]
        if first is None:
            problems.append(Problem("unconnected", item.element, item.key, {"instance": item.key}))
        for use, node in effective.get(key, ()):
            bucket = (use.instance, use.kind, use.via)
            member = MemberUse(use.member or "", use.member_kind, use.arguments, use.refresh)
            if node is None:
                if use.via is None:
                    strategy_rules.setdefault(bucket, []).append(member)
                continue
            if node not in position:
                continue  # an element that is no element of the flow
            per_element.setdefault(node, {}).setdefault(bucket, []).append(member)
            if (
                first is not None
                and node != first
                and dominance.contains(first)
                and dominance.contains(node)
                and not dominance.dominates(first, node)
                and (node, key) not in reported
            ):
                reported.add((node, key))
                problems.append(
                    Problem(
                        "not_usable",
                        node,
                        item.key,
                        {
                            "instance": item.key,
                            "first_use": first,
                            "use": use.kind,
                            "by_instance": None if use.via is None else known[use.via].key,
                            "property": use.member,
                        },
                    )
                )

    rank = {key: index for index, key in enumerate(known)}
    elements = tuple(
        ElementUsage(node, _element_uses(per_element[node], rank, known))
        for node in sorted(per_element, key=position.__getitem__)
    )
    rules = _element_uses(strategy_rules, rank, known)
    usable_elements = _usable_elements(dominance, flow_order)
    budget = MAX_USAGE_ENTRIES
    truncated = False
    usage: list[InstanceUsage] = []
    for item in instances:
        key = item.key.lower()
        first = first_uses[key]
        everywhere = first is None or not dominance.contains(first)
        usable: tuple[str, ...] = ()
        omitted = False
        if not everywhere:
            assert first is not None  # noqa: S101 - `everywhere` is true without a first use
            listed = usable_elements(first) if budget > 0 else None
            if listed is None or len(listed) > budget:
                omitted = True
                truncated = True
            else:
                usable = listed
                budget -= len(listed)
        usage.append(
            InstanceUsage(
                item.key,
                item.name,
                item.element,
                item.object_type,
                item.can_refresh,
                first is not None,
                first,
                sources[key],
                everywhere,
                usable,
                omitted,
            )
        )
    report = UsageReport(tuple(usage), elements, rules, truncated)
    return Analysis(report, problems, first_uses, dominance, flow_nodes)


def _element_uses(
    buckets: Mapping[tuple[str, str, str | None], list[MemberUse]],
    rank: Mapping[str, int],
    known: Mapping[str, TopInstance],
) -> tuple[ElementUse, ...]:
    order = {name: index for index, name in enumerate(_KIND_ORDER)}
    result: list[ElementUse] = []
    for (instance, kind, via), members in sorted(
        buckets.items(), key=lambda entry: (order[entry[0][1]], rank[entry[0][0]])
    ):
        unique: list[MemberUse] = []
        for member in members:
            if member.name and member not in unique:
                unique.append(member)
        result.append(
            ElementUse(
                known[instance].key,
                kind,
                None if via is None else known[via].key,
                tuple(unique),
            )
        )
    return tuple(result)


def _usable_elements(
    dominance: Dominance, flow_order: Sequence[str]
) -> Callable[[str], tuple[str, ...]]:
    """A function that lists the elements of the flow at which an instance is usable whose first
    use is a given element: the elements it dominates, in the order of the flow, and the elements
    that no way reaches (nothing contradicts a use there; the check reports them otherwise)."""
    cache: dict[str, tuple[str, ...]] = {}

    def usable(first: str) -> tuple[str, ...]:
        if first not in cache:
            cache[first] = tuple(
                node
                for node in flow_order
                if not dominance.contains(node) or dominance.dominates(first, node)
            )
        return cache[first]

    return usable
