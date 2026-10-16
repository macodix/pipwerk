"""The consistency check (specification 3.6) for strategies and templates."""

import re
from collections import Counter
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, replace
from datetime import date, datetime
from math import isfinite

from pipwerk_domain import catalog
from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.consistency.findings import (
    ExpressionNames,
    Finding,
    Level,
    NameOccurrence,
    NameSegment,
)
from pipwerk_domain.consistency.graph import (
    reachable,
    strongly_connected_components,
    unending_loops,
)
from pipwerk_domain.expressions import Analysis, analyze
from pipwerk_domain.expressions import exprtypes as et
from pipwerk_domain.expressions.checker import IssueKind, analyze_spelling
from pipwerk_domain.expressions.exprtypes import ExprType, type_of
from pipwerk_domain.expressions.symbols import Environment, Scope, Symbol, SymbolKind
from pipwerk_domain.limits import (
    MAX_FINDINGS_PER_CHECK,
    MAX_FINDINGS_PER_EXPRESSION,
    MAX_NAMES_PER_CHECK,
)
from pipwerk_domain.model import (
    Binding,
    Connection,
    Element,
    Instance,
    ObjectContent,
    ParameterDefinition,
    PropertyDefinition,
    Strategy,
    StrategyParameter,
    Template,
)
from pipwerk_domain.namespaces import (
    RESULT_PROPERTY,
    application_scope,
    instance_symbol,
    is_valid_name,
    order_symbol,
    parameter_symbol,
    property_type,
)
from pipwerk_domain.registry import ORDER_TYPE_PARAMETER, TREND_TYPE_ID, ElementRegistry
from pipwerk_domain.typedesc import (
    ALL_BINDINGS,
    BindingKind,
    Condition,
    DataType,
    ElementKind,
    ObjectCategory,
    ParameterDescription,
    PropertyDescription,
    Scalar,
    TypeDescription,
    choice_ids,
)

_TEXTS = re.compile(r'"(?:[^"]|"")*"')
_PREVIOUS_NAME = re.compile(r"(?<![A-Za-z0-9_.])PREVIOUS\s*\(\s*[A-Za-z_][A-Za-z0-9_.]*", re.I)
_NAME_BEFORE_POINT = re.compile(r"(?<![A-Za-z0-9_.])([A-Za-z_][A-Za-z0-9_]*)\.")
_MAIN_FLOW = "main_flow"
_INDICATOR = "indicator"
_ORDER_OBJECTS = (catalog.OBJECT_ORDER, catalog.OBJECT_POSITION)


@dataclass(frozen=True, slots=True)
class _Param:
    """A parameter in the form the check uses, from a description or a definition."""

    id: str
    datatype: DataType
    choices: tuple[str, ...]
    required: bool
    default: Scalar | None
    bindings: tuple[BindingKind, ...]
    when: Condition | None = None
    object_type: str | None = None

    @property
    def expected(self) -> ExprType:
        return type_of(self.datatype, self.choices, self.object_type)


def _param_of_description(item: ParameterDescription) -> _Param:
    return _Param(
        item.id,
        item.datatype,
        choice_ids(item.datatype, item.choices) or (),
        item.required,
        item.default,
        item.bindings,
        item.applies_when,
        item.object_type,
    )


def _param_of_definition(item: ParameterDefinition) -> _Param:
    return _Param(
        item.name,
        item.datatype,
        choice_ids(item.datatype, ()) or item.choices,
        item.required,
        item.default,
        ALL_BINDINGS,
    )


def _param_of_property(item: PropertyDescription) -> _Param:
    return _Param(
        item.id,
        item.datatype,
        choice_ids(item.datatype, item.choices) or (),
        False,
        item.default,
        ALL_BINDINGS,
        None,
        item.object_type,
    )


def _param_of_strategy_parameter(item: StrategyParameter) -> _Param:
    return _Param(
        item.name,
        item.datatype,
        choice_ids(item.datatype, ()) or item.choices,
        True,
        None,
        (BindingKind.FIXED,),
    )


class _FindingLimit(Exception):  # noqa: N818 - ends the check, is no error condition
    """The limit of findings of a check is reached."""


@dataclass(slots=True)
class _Ctx:
    """Where an instance or expression stands: its names, parameters, and whether
    ``Order`` and ``Position`` are available."""

    element_id: str | None
    subject: str
    env: Environment
    params: dict[str, _Param]
    order_error: bool
    order_context: str
    rule_order_error: bool
    rule_template: bool = False
    in_template: bool = False

    def below(self, name: str) -> str:
        return f"{self.subject}.{name}" if self.subject else name


class _RuleItem:
    """A rule or ruleset with the namespace its expressions are checked in."""

    def __init__(self, checker: Checker, content: ObjectContent, parent: Scope | None) -> None:
        self.checker = checker
        self.content = content
        self.parent = parent
        self.inner: Scope | None = None
        self.contained: list[_RuleItem] = []
        self._env: Scope | None = None
        self._uses_order: bool | None = None

    def env(self) -> Scope:
        """Namespace of the expression: own parameters, then the surrounding level."""
        if self._env is None:
            scope = Scope(self.parent)
            for definition in self.content.parameters:
                scope.add(
                    parameter_symbol(definition.name, definition.datatype, definition.choices)
                )
            self._env = scope
        return self._env

    def expression_analysis(self) -> Analysis:
        text = self.content.expression or ""
        return self.checker.analyze_cached(self.content, "expression", text, self.env(), None)

    def result_analysis(self) -> Analysis | None:
        text = self.content.result_expression
        if text is None or self.inner is None:
            return None
        return self.checker.analyze_cached(
            self.content, "result_expression", text, self.inner, None
        )

    def uses_order(self, guard: set[int] | None = None) -> bool:
        """Whether the rule addresses ``Order`` or ``Position``, itself or through the
        result of another rule."""
        if self._uses_order is not None:
            return self._uses_order
        top = guard is None
        guard = set() if guard is None else guard
        if id(self) in guard:
            return False
        guard.add(id(self))
        result = False
        if self.content.object_type == catalog.TYPE_RULESET:
            result = any(item.uses_order(guard) for item in self.contained)
            analysis = self.result_analysis()
            if not result and analysis is not None:
                result = self.checker.analysis_uses_order(analysis, guard)
        elif self.content.object_type == catalog.TYPE_RULE:
            result = self.checker.analysis_uses_order(self.expression_analysis(), guard)
        if top:
            self._uses_order = result
        return result


class Checker:
    """Runs the consistency check. One object checks one strategy or one template."""

    def __init__(
        self,
        registry: ElementRegistry,
        max_findings: int | None = MAX_FINDINGS_PER_CHECK,
        *,
        spelling_only: bool = False,
        collect_names: bool = False,
    ) -> None:
        """``spelling_only`` is for the normalization: the expressions are only parsed and
        their names and functions spelled, nothing is checked and no finding is kept.
        ``collect_names`` keeps the recognized names of every expression (``expression_names``,
        at most ``MAX_NAMES_PER_CHECK`` of them) for the check endpoint of the web API."""
        self.registry = registry
        self.max_findings = max_findings
        self.spelling_only = spelling_only
        self.collect_names = collect_names
        self.findings: list[Finding] = []
        self.expression_names: list[ExpressionNames] = []
        self.names_truncated = False
        self._name_count = 0
        self._analyses: dict[tuple[int, str], Analysis] = {}
        self._owners: dict[tuple[int, str], object] = {}
        self._reported: set[tuple[int, str]] = set()
        # per expression: [findings reported, 1 once `findings.truncated` was reported]
        self._budgets: dict[tuple[int, str], list[int]] = {}
        self._items: dict[int, _RuleItem] = {}
        self._rule_symbols: dict[int, Symbol] = {}
        self._closed = application_scope(registry)
        self._candle_uses: dict[tuple[str | None, str | None], None] = {}
        self._management_scopes: dict[str | None, Scope] = {}
        self._non_candle_reach: set[str] = set()
        self._strategy = Strategy(id="", title="")
        self._strategy_scope = Scope()
        self._strategy_params: dict[str, _Param] = {}

    # ------------------------------------------------------------------------------
    # entry points

    def check_strategy(self, strategy: Strategy) -> list[Finding]:
        """Check a strategy. At the limit of findings the check ends with the finding
        ``findings.truncated``."""
        try:
            self._check_strategy(strategy)
        except _FindingLimit:
            self._truncated_at_limit()
        return self.findings

    def check_template(self, template: Template) -> list[Finding]:
        """Check a template. At the limit of findings the check ends with the finding
        ``findings.truncated``."""
        try:
            self._check_template(template)
        except _FindingLimit:
            self._truncated_at_limit()
        return self.findings

    def _truncated_at_limit(self) -> None:
        self.findings.append(
            Finding(
                Level.ERROR,
                fc.FINDINGS_TRUNCATED,
                None,
                None,
                {"limit": self.max_findings, "scope": "check"},
            )
        )

    def _check_strategy(self, strategy: Strategy) -> None:
        self._strategy = strategy
        # `Strategie` knows the parameters of this strategy everywhere in it, also in
        # indicators, trends and rulesets (these see no other names of the strategy)
        self._closed = application_scope(self.registry, strategy.parameters)
        scope = Scope(application_scope(self.registry, strategy.parameters))
        self._strategy_scope = scope
        self._strategy_params = {
            item.name.lower(): _param_of_strategy_parameter(item) for item in strategy.parameters
        }
        entries: list[tuple[str, str | None, str | None]] = []
        for element in strategy.elements:
            symbol = self._element_symbol(element)
            if symbol is not None:
                scope.add(symbol)
                entries.append((symbol.name, element.id, symbol.name))
        for rule in strategy.rules:
            scope.add(self._rule_symbol(rule, scope))
            entries.append((rule.name, None, rule.name))
        self._duplicates(entries, "strategy")
        self._check_strategy_parameters(strategy)
        self._analyze_calculations(strategy)
        for element in strategy.elements:
            self._check_element(element)
        self._check_rule_list(
            strategy.rules,
            self._strategy_ctx(None, order_error=False),
            list_scope=scope,
            ordered=False,
            list_name="strategy",
        )
        self._check_flow(strategy)
        self._check_candle_uses(strategy)

    def _check_template(self, template: Template) -> None:
        description = self.registry.get(template.object_type)
        if description is None:
            self._add(Level.ERROR, fc.TYPE_UNKNOWN, kind="object", type=template.object_type)
            return
        # checked by itself, a template does not know the strategy parameters: any property
        # of `Strategie` is accepted and reported as a hint
        self._closed = application_scope(self.registry, None, open_strategy=True)
        ctx = _Ctx(None, "", self._closed, {}, False, _INDICATOR, False, in_template=True)
        category = description.category
        if category is ObjectCategory.RULE:
            item = self._item(template, self._closed)
            ctx.rule_template = True
            self._check_rule(template, item, ctx, None)
        elif category is ObjectCategory.RULESET:
            self._check_rule(template, self._item(template, self._closed), ctx, None)
        else:
            self._check_object(template, description, ctx)

    def _analyze_calculations(self, strategy: Strategy) -> None:
        """Analyze the calculations so that a calculation is analyzed after the ones whose
        result it uses. That keeps long chains of calculations out of the recursion; a cycle
        between results is a finding."""
        calculations = {
            item.name.lower(): item
            for item in strategy.elements
            if item.type == catalog.FLOW_CALCULATION
            and item.name
            and item.instance is None
            and item.id
        }
        edges: dict[str, list[str]] = {}
        for key, element in calculations.items():
            edges[key] = self._used_calculations(element, calculations)
        for component in strongly_connected_components(list(calculations), edges):
            members = [calculations[key] for key in component]
            if len(component) > 1 or component[0] in edges[component[0]]:
                self._add(
                    Level.ERROR,
                    fc.CALCULATION_CIRCULAR,
                    members[0].id,
                    members[0].name,
                    elements=[item.id for item in members],
                    names=[str(item.name) for item in members],
                )
            for element in members:
                binding = element.parameters.get("ausdruck")
                if binding is None or not isinstance(binding.value, str):
                    continue
                if binding.kind is not BindingKind.EXPRESSION:
                    continue
                # report the findings at once, so that a document full of faulty
                # expressions ends at the limit of findings before all are analyzed
                analysis = self.analyze_cached(
                    binding,
                    "parameter:ausdruck",
                    binding.value,
                    self._element_env(element),
                    None,
                )
                ctx = self._strategy_ctx(element, order_error=element.management_of is None)
                self._report(binding, "parameter:ausdruck", analysis, ctx)
                analysis.release()

    @staticmethod
    def _used_calculations(element: Element, calculations: dict[str, Element]) -> list[str]:
        """The calculations whose result an expression may use: the names in front of a
        point, outside of texts. A cheap scan of the text, so that all expressions need not be
        parsed before the first finding is reported."""
        binding = element.parameters.get("ausdruck")
        if binding is None or not isinstance(binding.value, str):
            return []
        used: list[str] = []
        # the name in `PREVIOUS(name)` is the value of an earlier evaluation: no dependency
        text = _PREVIOUS_NAME.sub("", _TEXTS.sub('""', binding.value))
        for match in _NAME_BEFORE_POINT.finditer(text):
            key = match.group(1).lower()
            if key in calculations and key not in used:
                used.append(key)
        return used

    # ------------------------------------------------------------------------------
    # helpers

    def _add(
        self,
        level: Level,
        code: str,
        element: str | None = None,
        subject: str | None = None,
        **details: object,
    ) -> None:
        if self.spelling_only:
            return  # the normalization needs no findings and collects none
        if self.max_findings is not None and len(self.findings) >= self.max_findings:
            raise _FindingLimit
        self.findings.append(Finding(level, code, element, subject, dict(details)))

    def _duplicates(
        self, entries: Iterable[tuple[str, str | None, str | None]], space: str
    ) -> None:
        """Report names that occur twice on the same level (the second and further ones)."""
        seen: Counter[str] = Counter()
        for name, element, subject in entries:
            key = name.lower()
            seen[key] += 1
            if seen[key] > 1:
                self._add(
                    Level.ERROR, fc.NAME_DUPLICATE, element, subject, name=name, namespace=space
                )

    def _check_name(self, name: str, element: str | None, subject: str | None, what: str) -> None:
        if not is_valid_name(name):
            self._add(Level.ERROR, fc.NAME_INVALID, element, subject, name=name, what=what)

    def analyze_cached(
        self,
        owner: object,
        field: str,
        text: str,
        env: Environment,
        expected: ExprType | None,
    ) -> Analysis:
        key = (id(owner), field)
        found = self._analyses.get(key)
        if found is None:
            found = (
                analyze_spelling(text, env) if self.spelling_only else analyze(text, env, expected)
            )
            self._analyses[key] = found
            self._owners[key] = owner
        return found

    def normalizations(self) -> list[tuple[object, str, str]]:
        """The expressions this checker has analyzed whose spelling is not yet the
        normalized one: owner of the expression (a ``Binding``, an ``Instance`` or ``Template``
        or a ``PropertyDefinition``), the field and the normalized text."""
        return [
            (self._owners[key], key[1], analysis.normalized)
            for key, analysis in self._analyses.items()
            if analysis.parsed_ok and analysis.normalized != analysis.source
        ]

    def expression_analyses(self) -> list[Analysis]:
        """The analyses of all expressions this checker has analyzed so far."""
        return list(self._analyses.values())

    def analysis_uses_order(self, analysis: Analysis, guard: set[int] | None = None) -> bool:
        """Whether an analyzed expression addresses ``Order`` or ``Position``, directly or
        through the result of a rule that does."""
        for name in analysis.names:
            if name.symbols and _is_order_object(name.symbols[0]):
                return True
            for symbol in name.symbols:
                payload = symbol.payload
                if isinstance(payload, _RuleItem) and payload.uses_order(guard):
                    return True
        return False

    @staticmethod
    def _names_order_directly(analysis: Analysis) -> bool:
        return any(name.symbols and _is_order_object(name.symbols[0]) for name in analysis.names)

    def _report(self, owner: object, field: str, analysis: Analysis, ctx: _Ctx) -> None:
        """Turn the findings of an analyzed expression into findings of the check, once."""
        key = (id(owner), field)
        if key in self._reported:
            return
        self._reported.add(key)
        subject = ctx.subject or None
        if self.collect_names:
            self._collect_names(field, analysis, ctx.element_id, subject)
        for issue in analysis.issues:
            data: dict[str, object] = {
                "field": field,
                "start": issue.start,
                "end": issue.end,
                "issue": issue.kind.value,
                "reason": issue.reason,
                **issue.details,
            }
            if ctx.rule_template and issue.kind is IssueKind.UNKNOWN_NAME:
                self._expression_finding(
                    key, Level.HINT, fc.RULE_UNRESOLVED_NAME, ctx.element_id, subject, **data
                )
            else:
                self._expression_finding(
                    key, Level.ERROR, fc.EXPRESSION_INVALID, ctx.element_id, subject, **data
                )
        if analysis.truncated:  # the analysis dropped findings of its own
            self._expression_overflow(key, ctx.element_id, subject)
        for name in analysis.names:
            if ctx.in_template and any(
                symbol.kind is SymbolKind.UNRESOLVED for symbol in name.symbols
            ):
                self._expression_finding(
                    key,
                    Level.HINT,
                    fc.RULE_UNRESOLVED_NAME,
                    ctx.element_id,
                    subject,
                    field=field,
                    start=name.start,
                    end=name.end,
                    issue=IssueKind.UNKNOWN_PROPERTY.value,
                    name=name.identifier,
                )
            if (
                name.symbols
                and name.symbols[0].kind is SymbolKind.APPLICATION_OBJECT
                and name.symbols[0].object_type == catalog.OBJECT_CANDLE
            ):
                self._candle_uses[(ctx.element_id, subject)] = None
        if ctx.order_error and self.analysis_uses_order(analysis):
            self._expression_finding(
                key,
                Level.ERROR,
                fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT,
                ctx.element_id,
                subject,
                field=field,
                context=ctx.order_context,
            )

    def _collect_names(
        self, field: str, analysis: Analysis, element: str | None, subject: str | None
    ) -> None:
        """Keep the recognized names of an expression in a light form (without the symbols,
        which hold on to the rules), up to the limit of names of the check."""
        if not analysis.names:
            return
        room = MAX_NAMES_PER_CHECK - self._name_count
        names = analysis.names[: max(room, 0)]
        if len(names) < len(analysis.names):
            self.names_truncated = True
        if not names:
            return
        self._name_count += len(names)
        self.expression_names.append(
            ExpressionNames(
                element,
                subject,
                field,
                tuple(
                    NameOccurrence(
                        name.start,
                        name.end,
                        name.identifier,
                        name.resolved,
                        name.previous,
                        tuple(
                            NameSegment(part.identifier, part.start, part.end)
                            for part in name.segments
                        ),
                    )
                    for name in names
                ),
            )
        )

    def _expression_finding(
        self,
        key: tuple[int, str],
        level: Level,
        code: str,
        element: str | None,
        subject: str | None,
        **details: object,
    ) -> None:
        """The one place that counts the findings of an expression (the owner and the field
        of ``key``): at most ``MAX_FINDINGS_PER_EXPRESSION`` of them, then exactly one
        ``findings.truncated`` and no further finding of this expression."""
        state = self._budgets.setdefault(key, [0, 0])
        if state[1]:
            return
        if state[0] >= MAX_FINDINGS_PER_EXPRESSION:
            self._expression_overflow(key, element, subject)
            return
        state[0] += 1
        self._add(level, code, element, subject, **details)

    def _expression_overflow(
        self, key: tuple[int, str], element: str | None, subject: str | None
    ) -> None:
        """Report that findings of the expression were dropped, once, as its last finding."""
        state = self._budgets.setdefault(key, [0, 0])
        if state[1]:
            return
        state[1] = 1
        self._add(
            Level.ERROR,
            fc.FINDINGS_TRUNCATED,
            None,
            None,
            limit=MAX_FINDINGS_PER_EXPRESSION,
            scope="expression",
            field=key[1],
            element_id=element,
            instance=subject,
        )

    # ------------------------------------------------------------------------------
    # symbols of rules

    def _order_property(self, identifier: str) -> PropertyDescription | None:
        for description in self.registry.list(ElementKind.ORDER_TYPE):
            found = description.property(identifier)
            if found is not None:
                return found
        general = self.registry.get(catalog.OBJECT_ORDER)
        return None if general is None else general.property(identifier)

    def _rule_result_type(self, content: ObjectContent) -> ExprType:
        if content.determined_property:
            found = self._order_property(content.determined_property)
            return et.UNKNOWN if found is None else property_type(found)
        return et.BOOLEAN

    def _item(self, content: ObjectContent, parent: Scope | None) -> _RuleItem:
        """The rule item of an instance or template, created on first use. A ruleset gets
        its inner namespace with its rules at once."""
        item = self._items.get(id(content))
        if item is not None:
            if item.parent is None and parent is not None:
                item.parent = parent  # the namespace must be known before the first analysis
            return item
        item = _RuleItem(self, content, parent)
        self._items[id(content)] = item
        if content.object_type == catalog.TYPE_RULESET:
            inner = Scope(self._closed)
            item.inner = inner
            for rule in content.rules:
                item.contained.append(self._item(rule, inner))
                inner.add(self._rule_symbol(rule, inner))
        return item

    def _rule_symbol(self, rule: Instance, parent: Scope | None = None) -> Symbol:
        """The symbol of a rule or ruleset in a list of the namespace ``parent``:
        ``name.ergebnis`` is its result; the rules of a ruleset are addressed as
        ``regelwerk.regel``."""
        item = self._item(rule, parent)
        cached = self._rule_symbols.get(id(rule))
        if cached is not None:
            return cached
        symbol: Symbol
        if rule.object_type == catalog.TYPE_RULESET:

            def ruleset_members() -> dict[str, Symbol]:
                result = {
                    child.content.name.lower(): self._rule_symbol(child.content)
                    for child in item.contained
                    if isinstance(child.content, Instance)
                }
                if rule.result_expression:
                    result[RESULT_PROPERTY] = Symbol(
                        RESULT_PROPERTY,
                        SymbolKind.PROPERTY,
                        type_factory=lambda: self._ruleset_result_type(item),
                        payload=item,
                    )
                return result

            symbol = Symbol(
                rule.name,
                SymbolKind.RULESET,
                object_type=rule.object_type,
                members_factory=ruleset_members,
                payload=item,
            )
        elif rule.object_type == catalog.TYPE_RULE:
            symbol = Symbol(
                rule.name,
                SymbolKind.RULE,
                object_type=rule.object_type,
                members_factory=lambda: {
                    RESULT_PROPERTY: Symbol(
                        RESULT_PROPERTY,
                        SymbolKind.PROPERTY,
                        type=self._rule_result_type(rule),
                        payload=item,
                    )
                },
                payload=item,
            )
        else:
            symbol = instance_symbol(self.registry, rule)
        self._rule_symbols[id(rule)] = symbol
        return symbol

    @staticmethod
    def _ruleset_result_type(item: _RuleItem) -> ExprType:
        analysis = item.result_analysis()
        return et.UNKNOWN if analysis is None else analysis.result_type

    # ------------------------------------------------------------------------------
    # strategy: elements

    def _element_symbol(self, element: Element) -> Symbol | None:
        if element.instance is not None:
            return instance_symbol(self.registry, element.instance)
        name = element.name
        if not name:
            return None
        if element.type == catalog.FLOW_CONDITION:
            return Symbol(
                name,
                SymbolKind.CONDITION,
                members_factory=lambda: {
                    RESULT_PROPERTY: Symbol(RESULT_PROPERTY, SymbolKind.PROPERTY, type=et.BOOLEAN)
                },
            )
        if element.type == catalog.FLOW_CALCULATION:
            return Symbol(
                name,
                SymbolKind.CALCULATION,
                members_factory=lambda: {
                    RESULT_PROPERTY: Symbol(
                        RESULT_PROPERTY,
                        SymbolKind.PROPERTY,
                        type_factory=lambda: self._calculation_type(element),
                    )
                },
            )
        return None

    def _calculation_type(self, element: Element) -> ExprType:
        binding = element.parameters.get("ausdruck")
        if binding is None or binding.kind is not BindingKind.EXPRESSION:
            return et.UNKNOWN
        if not isinstance(binding.value, str):
            return et.UNKNOWN
        # Only an expression that has been analyzed already gives its type. The order of
        # `_analyze_calculations` makes that the case except in a cycle; so no chain of
        # calculations ends up in nested calls.
        analysis = self._analyses.get((id(binding), "parameter:ausdruck"))
        return et.UNKNOWN if analysis is None else analysis.result_type

    def _element_env(self, element: Element) -> Environment:
        """Namespace for the expressions of an element: in a management the order type of
        its "Order aufgeben" decides which properties ``Order`` has."""
        if element.management_of is None:
            return self._strategy_scope
        order_type = self._order_type_of(self._strategy.element(element.management_of))
        scope = self._management_scopes.get(order_type)
        if scope is None:
            scope = Scope(self._strategy_scope)
            scope.add(order_symbol(self.registry, order_type))
            self._management_scopes[order_type] = scope
        return scope

    @staticmethod
    def _order_type_of(element: Element | None) -> str | None:
        if element is None:
            return None
        binding = element.parameters.get(ORDER_TYPE_PARAMETER)
        if binding is not None and isinstance(binding.value, str):
            return binding.value
        return None

    def _strategy_ctx(self, element: Element | None, *, order_error: bool) -> _Ctx:
        env: Environment = self._strategy_scope if element is None else self._element_env(element)
        return _Ctx(
            None if element is None else element.id,
            "",
            env,
            self._strategy_params,
            order_error,
            _MAIN_FLOW,
            False,
        )

    def _check_strategy_parameters(self, strategy: Strategy) -> None:
        self._duplicates(
            [(item.name, None, item.name) for item in strategy.parameters], "strategy_parameters"
        )
        for item in strategy.parameters:
            self._check_name(item.name, None, item.name, "strategy_parameter")
            if item.value is None:
                if not item.at_application:
                    self._add(
                        Level.ERROR,
                        fc.PARAMETER_MISSING,
                        None,
                        item.name,
                        parameter=item.name,
                        scope="strategy",
                    )
                continue
            problem = _fixed_problem(_param_of_strategy_parameter(item), item.value)
            if problem is not None:
                self._add(
                    Level.ERROR,
                    fc.PARAMETER_BINDING_INVALID,
                    None,
                    item.name,
                    parameter=item.name,
                    scope="strategy",
                    reason=problem[0],
                    **problem[1],
                )

    def _check_element(self, element: Element) -> None:
        description = self.registry.get(element.type)
        if description is None:
            self._add(
                Level.ERROR, fc.TYPE_UNKNOWN, element.id, None, kind="element", type=element.type
            )
            return
        in_main_flow = element.management_of is None
        if not in_main_flow:
            owner = self._strategy.element(element.management_of or "")
            if owner is None or owner.type != catalog.FLOW_PLACE_ORDER:
                self._add(
                    Level.ERROR,
                    fc.ELEMENT_MANAGEMENT_INVALID,
                    element.id,
                    None,
                    owner=element.management_of,
                )
        ctx = self._strategy_ctx(element, order_error=in_main_flow)
        if element.name is not None:
            self._check_name(element.name, element.id, None, "element")
        if not description.rules_allowed and element.rules:
            self._add(
                Level.ERROR, fc.ELEMENT_RULES_NOT_ALLOWED, element.id, None, type=element.type
            )
        if in_main_flow and element.type in catalog.MANAGEMENT_ONLY_FLOW_TYPES:
            self._add(Level.ERROR, fc.FLOW_MANAGEMENT_ONLY, element.id, None, type=element.type)
        if element.instance is not None:
            self._check_instance_element(element, ctx)
        elif description.kind in (ElementKind.TRIGGER, ElementKind.FLOW):
            self._check_flow_element(element, description, ctx)
        if element.rules:
            list_scope = Scope(self._strategy_scope)
            for rule in element.rules:
                list_scope.add(self._rule_symbol(rule, list_scope))
            self._duplicates(
                [(rule.name, element.id, rule.name) for rule in element.rules], "element_rules"
            )
            self._check_rule_list(
                element.rules,
                self._strategy_ctx(element, order_error=False),
                list_scope=list_scope,
                ordered=False,
                list_name="element",
            )

    def _check_instance_element(self, element: Element, ctx: _Ctx) -> None:
        instance = element.instance
        assert instance is not None  # noqa: S101 - checked by the caller
        description = self.registry.get(instance.object_type)
        if description is None:
            self._add(
                Level.ERROR,
                fc.TYPE_UNKNOWN,
                element.id,
                instance.name,
                kind="object",
                type=instance.object_type,
            )
            return
        self._check_name(instance.name, element.id, instance.name, "instance")
        self._check_object(instance, description, replace(ctx, subject=instance.name))

    def _check_flow_element(
        self, element: Element, description: TypeDescription, ctx: _Ctx
    ) -> None:
        params = [_param_of_description(item) for item in description.parameters]
        expected_for: dict[str, ExprType] = {}
        if element.type == catalog.FLOW_CONDITION:
            expected_for["ausdruck"] = et.BOOLEAN
        elif element.type == catalog.FLOW_SET_PARAMETER:
            target = element.parameters.get("strategieparameter")
            if target is not None and isinstance(target.value, str):
                found = self._strategy_params.get(target.value.lower())
                if found is None:
                    self._invalid(
                        ctx,
                        "parameter",
                        "strategieparameter",
                        "unknown_parameter",
                        name=target.value,
                    )
                else:
                    expected_for["ausdruck"] = found.expected
        self._check_parameters(params, element.parameters, ctx, expected_for)
        if element.type == catalog.FLOW_PLACE_ORDER:
            self._check_order_properties(element, ctx)
        else:
            for name in element.properties:
                self._invalid(ctx, "property", name, "unknown_property")

    def _determined_properties(self, element: Element) -> set[str]:
        """Properties of the order that a determining rule of the strategy or the element
        determines, also inside rulesets."""
        found: set[str] = set()

        def collect(rules: Sequence[Instance]) -> None:
            for rule in rules:
                if rule.object_type == catalog.TYPE_RULESET:
                    collect(rule.rules)
                elif rule.determined_property:
                    found.add(rule.determined_property)

        collect(self._strategy.rules)
        collect(element.rules)
        return found

    def _check_order_properties(self, element: Element, ctx: _Ctx) -> None:
        order_type = self._order_type_of(element)
        description = None if order_type is None else self.registry.get(order_type)
        if description is None or description.kind is not ElementKind.ORDER_TYPE:
            return  # missing or unknown order type: reported with the parameter
        determined = self._determined_properties(element)
        values = element.properties
        known = {item.id for item in description.properties}
        for name in values:
            if name not in known:
                self._invalid(ctx, "property", name, "unknown_property")
        params: list[_Param] = []
        for item in description.properties:
            if not item.set_by_user:
                if item.id in values:
                    self._invalid(ctx, "property", item.id, "set_by_application")
                continue
            if item.applies_when is not None and not _condition_holds(
                item.applies_when, values, [_param_of_property(p) for p in description.properties]
            ):
                continue
            params.append(_param_of_property(item))
            if (
                item.id not in values
                and item.must
                and item.default is None
                and item.id not in determined
            ):
                self._add(
                    Level.ERROR,
                    fc.ORDER_PROPERTY_MISSING,
                    element.id,
                    None,
                    property=item.id,
                    order_type=description.id,
                )
        self._check_bindings(params, values, ctx, {}, "property")

    # ------------------------------------------------------------------------------
    # parameters and bindings

    def _check_parameters(
        self,
        params: Sequence[_Param],
        values: dict[str, Binding],
        ctx: _Ctx,
        expected_for: dict[str, ExprType] | None = None,
    ) -> None:
        known = {item.id for item in params}
        for name in values:
            if name not in known:
                self._invalid(ctx, "parameter", name, "unknown_parameter")
        applicable: list[_Param] = []
        for item in params:
            if item.when is not None and not _condition_holds(item.when, values, params):
                continue
            applicable.append(item)
            if item.id not in values and item.default is None and item.required:
                self._add(
                    Level.ERROR,
                    fc.PARAMETER_MISSING,
                    ctx.element_id,
                    ctx.subject or None,
                    parameter=item.id,
                )
        self._check_bindings(applicable, values, ctx, expected_for or {}, "parameter")

    def _check_bindings(
        self,
        params: Sequence[_Param],
        values: dict[str, Binding],
        ctx: _Ctx,
        expected_for: dict[str, ExprType],
        label: str,
    ) -> None:
        for item in params:
            binding = values.get(item.id)
            if binding is not None:
                self._check_binding(item, binding, ctx, expected_for, label)

    def _invalid(
        self, ctx: _Ctx, label: str, identifier: str, reason: str, **details: object
    ) -> None:
        """A binding that does not fit; ``label`` is ``parameter`` or ``property`` and
        ``identifier`` the identifier of the one affected."""
        self._add(
            Level.ERROR,
            fc.PARAMETER_BINDING_INVALID,
            ctx.element_id,
            ctx.subject or None,
            reason=reason,
            **{label: identifier},
            **details,
        )

    def _check_binding(
        self,
        item: _Param,
        binding: Binding,
        ctx: _Ctx,
        expected_for: dict[str, ExprType],
        label: str,
    ) -> None:
        if binding.kind not in item.bindings:
            self._invalid(ctx, label, item.id, "binding_kind", binding=binding.kind.value)
            return
        if binding.kind is BindingKind.APPLICATION:
            return
        if binding.kind is BindingKind.FIXED:
            problem = _fixed_problem(item, binding.value)
            if problem is not None:
                self._invalid(ctx, label, item.id, problem[0], **problem[1])
            return
        if binding.kind is BindingKind.PARAMETER:
            self._check_parameter_binding(item, binding, ctx, label)
            return
        text = binding.value
        if not isinstance(text, str):
            self._invalid(ctx, label, item.id, "value")
            return
        expected = expected_for.get(item.id, item.expected)
        field = f"{label}:{item.id}"
        analysis = self.analyze_cached(binding, field, text, ctx.env, expected)
        self._report(binding, field, analysis, ctx)
        analysis.release()

    def _check_parameter_binding(
        self, item: _Param, binding: Binding, ctx: _Ctx, label: str
    ) -> None:
        name = binding.value
        if not isinstance(name, str):
            self._invalid(ctx, label, item.id, "value")
            return
        target = ctx.params.get(name.lower())
        if target is None:
            self._invalid(ctx, label, item.id, "unknown_parameter", name=name)
        elif et.mismatch_with(item.expected, target.expected) is not None:
            self._invalid(
                ctx,
                label,
                item.id,
                "type",
                name=name,
                expected=item.datatype.value,
                found=target.datatype.value,
            )

    # ------------------------------------------------------------------------------
    # objects: instances and templates

    def _check_object(
        self,
        content: ObjectContent,
        description: TypeDescription,
        ctx: _Ctx,
    ) -> None:
        """Check an instance or a template of an indicator, a trend or a delivered object
        type."""
        subject = ctx.subject or None
        if description.category in (ObjectCategory.RULE, ObjectCategory.RULESET):
            self._add(
                Level.ERROR,
                fc.RULE_INVALID_TYPE,
                ctx.element_id,
                subject,
                reason="in_instances",
                type=description.id,
            )
            return
        params = [_param_of_description(item) for item in description.parameters]
        if description.id not in (catalog.TYPE_INDICATOR, TREND_TYPE_ID):
            self._check_parameters(params, content.parameter_values, ctx)
            return
        own = [_param_of_definition(item) for item in content.parameters]
        all_params = [*params, *own]
        if description.id == TREND_TYPE_ID:
            self._check_trend_direction(content, ctx)
        scope = Scope(self._closed)
        entries: list[tuple[str, str | None, str | None]] = []
        for item in all_params:
            scope.add(parameter_symbol(item.id, item.datatype, item.choices))
            entries.append((item.id, ctx.element_id, subject))
        for definition in content.parameters:
            self._check_name(definition.name, ctx.element_id, subject, "parameter")
        for child in content.instances:
            scope.add(instance_symbol(self.registry, child))
            entries.append((child.name, ctx.element_id, ctx.below(child.name)))
            self._check_name(child.name, ctx.element_id, ctx.below(child.name), "instance")
        for rule in content.rules:
            scope.add(self._rule_symbol(rule, scope))
            entries.append((rule.name, ctx.element_id, ctx.below(rule.name)))
        self._duplicates(entries, "template")
        self._check_parameters(all_params, content.parameter_values, ctx)
        inner = replace(
            ctx,
            env=scope,
            params={item.id.lower(): item for item in all_params},
            order_error=True,
            order_context=_INDICATOR,
            rule_order_error=True,
        )
        for child in content.instances:
            self._check_nested_instance(child, inner)
        self._check_rule_list(
            content.rules, inner, list_scope=scope, ordered=False, list_name="template"
        )
        for own_property in content.properties:
            self._check_property_definition(own_property, inner)

    def _check_trend_direction(self, content: ObjectContent, ctx: _Ctx) -> None:
        """A trend with the calculation method "Ausdruck" needs an expression for the
        property ``richtung`` (specification 3.3)."""
        binding = content.parameter_values.get("berechnungsverfahren")
        method = catalog.TREND_METHOD_EXPRESSION
        if binding is not None and binding.kind is BindingKind.FIXED:
            method = str(binding.value)
        has_direction = any(item.name.lower() == "richtung" for item in content.properties)
        if method == catalog.TREND_METHOD_EXPRESSION and not has_direction:
            self._add(
                Level.ERROR,
                fc.TREND_DIRECTION_MISSING,
                ctx.element_id,
                ctx.subject or None,
                property="richtung",
            )

    def _check_nested_instance(self, instance: Instance, ctx: _Ctx) -> None:
        subject = ctx.below(instance.name)
        description = self.registry.get(instance.object_type)
        if description is None:
            self._add(
                Level.ERROR,
                fc.TYPE_UNKNOWN,
                ctx.element_id,
                subject,
                kind="object",
                type=instance.object_type,
            )
            return
        self._check_object(instance, description, replace(ctx, subject=subject))

    def _check_property_definition(self, definition: PropertyDefinition, ctx: _Ctx) -> None:
        field = f"property_definition:{definition.name}"
        analysis = self.analyze_cached(
            definition,
            field,
            definition.expression,
            ctx.env,
            type_of(definition.datatype, definition.choices),
        )
        self._report(definition, field, analysis, ctx)
        analysis.release()

    # ------------------------------------------------------------------------------
    # rules

    def _check_rule_list(
        self,
        rules: Sequence[Instance],
        ctx: _Ctx,
        *,
        list_scope: Scope,
        ordered: bool,
        list_name: str,
    ) -> None:
        items: list[_RuleItem] = []
        for rule in rules:
            item = self._item(rule, list_scope)
            item.parent = list_scope
            items.append(item)
        for rule, item in zip(rules, items, strict=True):
            self._check_rule(rule, item, ctx, rule.name)
        self._check_cycles(rules, items, ordered=ordered, list_name=list_name, ctx=ctx)

    def _check_rule(
        self, rule: ObjectContent, item: _RuleItem, ctx: _Ctx, name: str | None
    ) -> None:
        subject = ctx.below(name) if name is not None else (ctx.subject or None)
        rule_ctx = replace(ctx, subject=subject or "")
        description = self.registry.get(rule.object_type)
        if description is None:
            self._add(
                Level.ERROR,
                fc.TYPE_UNKNOWN,
                ctx.element_id,
                subject,
                kind="object",
                type=rule.object_type,
            )
            return
        if description.category not in (ObjectCategory.RULE, ObjectCategory.RULESET):
            self._add(
                Level.ERROR,
                fc.RULE_INVALID_TYPE,
                ctx.element_id,
                subject,
                reason="in_rules",
                type=description.id,
            )
            return
        if name is not None:
            self._check_name(name, ctx.element_id, subject, "rule")
        if description.category is ObjectCategory.RULE:
            if ctx.rule_order_error and item.uses_order():
                self._expression_finding(
                    (id(rule), "expression"),
                    Level.ERROR,
                    fc.RULE_ORDER_IN_INDICATOR,
                    ctx.element_id,
                    subject,
                )
            self._check_regel(rule, item, rule_ctx)
        else:
            self._check_regelwerk(rule, item, rule_ctx)

    def _check_regel(self, rule: ObjectContent, item: _RuleItem, ctx: _Ctx) -> None:
        for entry in rule.parameters:
            self._check_name(entry.name, ctx.element_id, ctx.subject or None, "parameter")
        self._duplicates(
            [(entry.name, ctx.element_id, ctx.subject or None) for entry in rule.parameters],
            "rule_parameters",
        )
        definitions = [_param_of_definition(entry) for entry in rule.parameters]
        outer = replace(ctx, env=item.parent if item.parent is not None else ctx.env)
        self._check_parameters(definitions, rule.parameter_values, outer)
        rule_ctx = replace(ctx, env=item.env(), order_error=False)
        analysis = item.expression_analysis()
        self._report(rule, "expression", analysis, rule_ctx)
        self._check_result(rule, analysis, ctx)

    def _check_result(self, rule: ObjectContent, analysis: Analysis, ctx: _Ctx) -> None:
        subject = ctx.subject or None
        expected = et.BOOLEAN
        if rule.determined_property:
            found = self._order_property(rule.determined_property)
            if found is None:
                self._expression_finding(
                    (id(rule), "expression"),
                    Level.ERROR,
                    fc.RULE_RESULT_MISMATCH,
                    ctx.element_id,
                    subject,
                    reason="unknown_property",
                    property=rule.determined_property,
                )
                return
            expected = property_type(found)
            if rule.comparison is None:
                self._add(Level.ERROR, fc.RULE_COMPARISON_MISSING, ctx.element_id, subject)
        if analysis.tree is None:
            return
        mismatch = et.mismatch_with(expected, analysis.result_type)
        if mismatch is not None:
            self._expression_finding(
                (id(rule), "expression"),
                Level.ERROR,
                fc.RULE_RESULT_MISMATCH,
                ctx.element_id,
                subject,
                reason=mismatch.reason,
                property=rule.determined_property,
                expected=expected.describe(),
                found=analysis.result_type.describe(),
                values=list(mismatch.values),
                allowed=list(mismatch.allowed),
            )

    def _check_regelwerk(self, rule: ObjectContent, item: _RuleItem, ctx: _Ctx) -> None:
        inner_scope = item.inner
        assert inner_scope is not None  # noqa: S101 - created with the item of a ruleset
        inner_ctx = replace(ctx, env=inner_scope, params={}, order_error=False)
        self._duplicates(
            [(child.name, ctx.element_id, ctx.below(child.name)) for child in rule.rules],
            "ruleset",
        )
        self._check_rule_list(
            rule.rules, inner_ctx, list_scope=inner_scope, ordered=True, list_name="ruleset"
        )
        if rule.result_expression is not None:
            analysis = item.result_analysis()
            assert analysis is not None  # noqa: S101 - the inner namespace exists
            self._report(rule, "result_expression", analysis, inner_ctx)
            if ctx.rule_order_error and self._names_order_directly(analysis):
                self._expression_finding(
                    (id(rule), "result_expression"),
                    Level.ERROR,
                    fc.RULE_ORDER_IN_INDICATOR,
                    ctx.element_id,
                    ctx.subject or None,
                )

    def _check_cycles(
        self,
        rules: Sequence[Instance],
        items: list[_RuleItem],
        *,
        ordered: bool,
        list_name: str,
        ctx: _Ctx,
    ) -> None:
        """Circular references and, in a ruleset, forward references (specification 3.6)."""
        position_of = {id(item): position for position, item in enumerate(items)}
        edges: dict[str, list[str]] = {str(position): [] for position in range(len(items))}
        for position, item in enumerate(items):
            analysis = (
                item.expression_analysis()
                if item.content.object_type == catalog.TYPE_RULE
                else item.result_analysis()
            )
            if analysis is None:
                continue
            for name in analysis.names:
                if name.previous:
                    continue  # `PREVIOUS(r.ergebnis)` is the value of an earlier evaluation
                payload = name.symbols[0].payload if name.symbols else None
                if isinstance(payload, _RuleItem) and id(payload) in position_of:
                    target_key = str(position_of[id(payload)])
                    if target_key not in edges[str(position)]:
                        edges[str(position)].append(target_key)
        in_cycle: set[int] = set()
        for component in strongly_connected_components(list(edges), edges):
            first = int(component[0])
            if len(component) > 1 or component[0] in edges[component[0]]:
                in_cycle.update(int(node) for node in component)
                self._add(
                    Level.ERROR,
                    fc.RULESET_REFERENCE_ORDER,
                    ctx.element_id,
                    ctx.below(rules[first].name),
                    kind="cycle",
                    list=list_name,
                    rules=[rules[int(node)].name for node in component],
                )
        if not ordered:
            return
        for position in range(len(items)):
            for target_text in edges[str(position)]:
                target = int(target_text)
                if target > position and position not in in_cycle:
                    self._add(
                        Level.ERROR,
                        fc.RULESET_REFERENCE_ORDER,
                        ctx.element_id,
                        ctx.below(rules[position].name),
                        kind="forward",
                        list=list_name,
                        rule=rules[position].name,
                        refers_to=rules[target].name,
                    )

    # ------------------------------------------------------------------------------
    # flow of the strategy

    def _check_flow(self, strategy: Strategy) -> None:
        elements = {item.id: item for item in strategy.elements}
        kinds: dict[str, ElementKind | None] = {}
        for item in strategy.elements:
            description = self.registry.get(item.type)
            kinds[item.id] = None if description is None else description.kind
        incoming: set[str] = set()
        edges: dict[str, list[tuple[str, str]]] = {item.id: [] for item in strategy.elements}
        for connection in strategy.connections:
            problem = self._connection_problem(connection, elements, kinds)
            if problem is not None:
                self._add(
                    Level.ERROR,
                    fc.CONNECTION_INVALID,
                    connection.source if connection.source in elements else None,
                    None,
                    reason=problem,
                    source=connection.source,
                    output=connection.output,
                    target=connection.target,
                )
                continue
            incoming.add(connection.target)
            edges[connection.source].append((connection.output, connection.target))
        main_triggers = [
            item.id for item in strategy.main_elements() if kinds[item.id] is ElementKind.TRIGGER
        ]
        if not main_triggers:
            self._add(Level.ERROR, fc.STRATEGY_NO_TRIGGER)
        for item in strategy.elements:
            if kinds[item.id] is ElementKind.TRIGGER and not edges[item.id]:
                self._add(Level.ERROR, fc.TRIGGER_UNCONNECTED, item.id)
            if kinds[item.id] is ElementKind.FLOW and item.id not in incoming:
                self._add(Level.ERROR, fc.FLOW_NO_INCOMING, item.id)
        self._check_loops(strategy, kinds, edges)
        successors = {node: [target for _, target in pairs] for node, pairs in edges.items()}
        reached = reachable(main_triggers, successors)
        if not any(elements[node].type == catalog.FLOW_PLACE_ORDER for node in reached):
            self._add(Level.HINT, fc.FLOW_NO_ORDER_REACHABLE)
        self._non_candle_reach = reachable(
            [
                item.id
                for item in strategy.elements
                if kinds[item.id] is ElementKind.TRIGGER
                and item.type != catalog.TRIGGER_CANDLE_CLOSE
            ],
            successors,
        )

    def _connection_problem(
        self,
        connection: Connection,
        elements: dict[str, Element],
        kinds: dict[str, ElementKind | None],
    ) -> str | None:
        source = elements.get(connection.source)
        target = elements.get(connection.target)
        if source is None:
            return "unknown_source"
        if target is None:
            return "unknown_target"
        if source.management_of != target.management_of:
            return "across_managements"
        if kinds[target.id] is ElementKind.TRIGGER:
            return "target_is_trigger"
        description = self.registry.get(source.type)
        if description is not None and description.output(connection.output) is None:
            return "unknown_output"
        return None

    def _check_loops(
        self,
        strategy: Strategy,
        kinds: dict[str, ElementKind | None],
        edges: dict[str, list[tuple[str, str]]],
    ) -> None:
        groups: dict[str | None, list[str]] = {}
        for item in strategy.elements:
            if kinds[item.id] in (ElementKind.TRIGGER, ElementKind.FLOW):
                groups.setdefault(item.management_of, []).append(item.id)
        types = {item.id: item.type for item in strategy.elements}
        for members in groups.values():
            conditions = {node for node in members if types[node] == catalog.FLOW_CONDITION}
            free = {
                node
                for node in conditions
                if not {"wahr", "falsch"} <= {output for output, _ in edges[node]}
            }
            allowed = set(members)
            local_edges = {
                node: [(output, target) for output, target in edges[node] if target in allowed]
                for node in members
            }
            for group in unending_loops(members, local_edges, conditions, free):
                self._add(Level.ERROR, fc.FLOW_UNENDING_LOOP, group[0], None, elements=list(group))

    def _check_candle_uses(self, strategy: Strategy) -> None:
        if not self._candle_uses:
            return
        has_instance = any(
            item.instance is not None
            and item.instance.object_type == catalog.OBJECT_CANDLE
            and "zeiteinheit" in item.instance.parameter_values
            for item in strategy.elements
        )
        if has_instance:
            return
        other_trigger = any(
            item.type != catalog.TRIGGER_CANDLE_CLOSE and self._is_trigger(item.type)
            for item in strategy.elements
        )
        reported: set[tuple[str | None, str | None]] = set()
        for element_id, subject in self._candle_uses:
            if (element_id, subject) in reported:
                continue
            affected = element_id in self._non_candle_reach if element_id else other_trigger
            if affected:
                reported.add((element_id, subject))
                self._add(Level.ERROR, fc.CANDLE_NO_INSTANCE, element_id, subject)

    def _is_trigger(self, type_id: str) -> bool:
        description = self.registry.get(type_id)
        return description is not None and description.kind is ElementKind.TRIGGER


def _is_order_object(symbol: Symbol) -> bool:
    return symbol.kind is SymbolKind.APPLICATION_OBJECT and symbol.object_type in _ORDER_OBJECTS


def _condition_holds(
    condition: Condition,
    values: dict[str, Binding],
    params: Sequence[_Param],
) -> bool:
    """Whether the parameter or property named in the condition has the value that makes
    the element apply: its fixed value, else its default."""
    binding = values.get(condition.name)
    if binding is not None and binding.kind is BindingKind.FIXED:
        return binding.value == condition.value
    for item in params:
        if item.id == condition.name and item.default is not None:
            return item.default == condition.value
    return False


def _fixed_problem(item: _Param, value: Scalar | None) -> tuple[str, dict[str, object]] | None:
    """Why a fixed value does not fit the data type, or ``None``."""
    datatype = item.datatype
    if datatype in (DataType.NUMBER, DataType.PERCENT):
        ok = (
            isinstance(value, int | float)
            and not isinstance(value, bool)
            and (not isinstance(value, float) or isfinite(value))
        )
    elif datatype is DataType.INTEGER:
        ok = isinstance(value, int) and not isinstance(value, bool)
    elif datatype is DataType.BOOLEAN:
        ok = isinstance(value, bool)
    elif datatype in (DataType.TEXT, DataType.CHOICE, DataType.TIME_UNIT):
        ok = isinstance(value, str)
    elif datatype in (DataType.TIMESTAMP, DataType.DATE):
        ok = isinstance(value, str) and _is_iso(datatype, value)
    else:
        ok = False
    if not ok:
        return "type", {"expected": datatype.value}
    if datatype in (DataType.CHOICE, DataType.TIME_UNIT) and value not in item.choices:
        return "choice_value", {"values": [value], "allowed": list(item.choices)}
    return None


def _is_iso(datatype: DataType, text: str) -> bool:
    try:
        if datatype is DataType.DATE:
            date.fromisoformat(text)
        else:
            datetime.fromisoformat(text)
    except ValueError:
        return False
    return True
