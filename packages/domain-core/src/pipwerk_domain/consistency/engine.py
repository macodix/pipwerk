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
from pipwerk_domain.expressions.functions import list_functions
from pipwerk_domain.expressions.symbols import (
    Environment,
    Scope,
    Symbol,
    SymbolKind,
    normalized_name,
)
from pipwerk_domain.identifiers import is_valid_key
from pipwerk_domain.instruments import is_valid_designation
from pipwerk_domain.limits import (
    MAX_FINDINGS_PER_CHECK,
    MAX_FINDINGS_PER_EXPRESSION,
    MAX_NAMES_PER_CHECK,
)
from pipwerk_domain.model import (
    Binding,
    Connection,
    DataLink,
    Element,
    InputKind,
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
    order_symbol,
    parameter_symbol,
    property_type,
)
from pipwerk_domain.pointers import below, pointer
from pipwerk_domain.registry import ORDER_TYPE_PARAMETER, TREND_TYPE_ID, ElementRegistry
from pipwerk_domain.typedesc import (
    ALL_BINDINGS,
    INSTRUMENT_TYPE,
    ArgumentDescription,
    BindingKind,
    Choice,
    Condition,
    DataType,
    ElementKind,
    Label,
    ObjectCategory,
    ParameterDescription,
    PropertyDescription,
    Scalar,
    TypeDescription,
    choice_ids,
)

_TEXTS = re.compile(r'"(?:[^"]|"")*"')
_PREVIOUS_NAME = re.compile(r"(?<![\w.])PREVIOUS\s*\(\s*[^\W\d]\w*(?:\.[^\W\d]\w*)*", re.I)
_NAME_BEFORE_POINT = re.compile(r"(?<![\w.])([^\W\d]\w*)\.")
_MAIN_FLOW = "main_flow"
_INDICATOR = "indicator"
_ORDER_OBJECTS = (catalog.OBJECT_ORDER, catalog.OBJECT_POSITION)
_RESULT_LABEL = Label("Ergebnis", "Result")
_RESULT_EXPLANATION = Label(
    "Das Ergebnis dieses Schritts. Spätere Schritte können es verwenden.",
    "The result of this step. Later steps can use it.",
)


def _choices_of(datatype: DataType, choices: tuple[Choice, ...]) -> tuple[str, ...]:
    """The identifiers of the allowed values of a parameter or property."""
    known = choice_ids(datatype, choices)
    return known if known is not None else tuple(item.id for item in choices)


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
    labels: tuple[Label, ...] | None = None

    @property
    def expected(self) -> ExprType:
        return type_of(self.datatype, self.choices, self.object_type, self.labels)


def _param_of_description(item: ParameterDescription) -> _Param:
    return _Param(
        item.id,
        item.datatype,
        _choices_of(item.datatype, item.choices),
        item.required,
        item.default,
        item.bindings,
        item.applies_when,
        item.object_type,
        tuple(choice.label for choice in item.choices) or None,
    )


def _param_of_definition(item: ParameterDefinition) -> _Param:
    return _Param(
        item.key,
        item.datatype,
        choice_ids(item.datatype, ()) or item.choices,
        item.required,
        item.default,
        ALL_BINDINGS,
        None,
        item.object_type,
    )


def _param_of_property(item: PropertyDescription) -> _Param:
    return _Param(
        item.id,
        item.datatype,
        _choices_of(item.datatype, item.choices),
        False,
        item.default,
        ALL_BINDINGS,
        None,
        item.object_type,
        tuple(choice.label for choice in item.choices) or None,
    )


def _param_of_strategy_parameter(item: StrategyParameter) -> _Param:
    return _Param(
        item.key,
        item.datatype,
        choice_ids(item.datatype, ()) or item.choices,
        True,
        None,
        (BindingKind.FIXED,),
        None,
        item.object_type,
    )


class _FindingLimit(Exception):  # noqa: N818 - ends the check, is no error condition
    """The limit of findings of a check is reached."""


@dataclass(slots=True)
class _Ctx:
    """Where an instance or expression stands: its names, parameters, and whether
    ``Order`` and ``Position`` are available. ``path`` is the JSON pointer of the owner in
    the document (an empty text for the strategy or the template itself)."""

    element_id: str | None
    subject: str
    env: Environment
    params: dict[str, _Param]
    order_error: bool
    order_context: str
    rule_order_error: bool
    rule_template: bool = False
    in_template: bool = False
    path: str = ""

    def below(self, name: str) -> str:
        return f"{self.subject}.{name}" if self.subject else name


@dataclass(slots=True)
class ExpressionContext:
    """The context of an expression at a place of a document (what ``/api/v1/expressions``
    needs): the namespace, the expected type and where the expression stands."""

    pointer: str
    env: Environment
    expected: ExprType | None
    element_id: str | None
    subject: str | None
    order_error: bool
    rule_template: bool
    in_template: bool
    order_context: str
    field: str


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
                    parameter_symbol(
                        definition.key,
                        definition.datatype,
                        definition.choices,
                        shown=definition.name,
                        object_type=definition.object_type,
                        registry=self.checker.registry,
                    )
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
        record_contexts: bool = False,
    ) -> None:
        """``spelling_only`` is for the normalization: the expressions are only parsed and
        their names and functions spelled, nothing is checked and no finding is kept.
        ``collect_names`` keeps the recognized names of every expression (``expression_names``,
        at most ``MAX_NAMES_PER_CHECK`` of them) for the check endpoint of the web API.
        ``record_contexts`` keeps the context of every place of an expression by its JSON
        pointer (``contexts``) for the endpoint of the expressions."""
        self.registry = registry
        self.max_findings = max_findings
        self.spelling_only = spelling_only
        self.collect_names = collect_names
        self.record_contexts = record_contexts
        self.findings: list[Finding] = []
        self.expression_names: list[ExpressionNames] = []
        self.contexts: dict[str, ExpressionContext] = {}
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
        self._other_trigger_reach: set[str] = set()
        self._has_other_trigger = False
        self._strategy = Strategy(id="", name="")
        self._strategy_scope = Scope()
        self._strategy_params: dict[str, _Param] = {}
        self._used_inputs: dict[str, set[tuple[str, str]]] = {}
        self._reserved_names = _reserved_names(registry)
        self._reserved_keys = _reserved_keys(registry)

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
            item.key.lower(): _param_of_strategy_parameter(item) for item in strategy.parameters
        }
        entries: list[_Entry] = []
        for element in strategy.elements:
            symbol = self._element_symbol(element)
            if symbol is not None:
                scope.add(symbol)
                entries.append(
                    _Entry(symbol.shown or symbol.name, symbol.name, element.id, symbol.name)
                )
        for rule in strategy.rules:
            scope.add(self._rule_symbol(rule, scope))
            entries.append(_Entry(rule.name, rule.key, None, rule.key))
        self._duplicates(entries, "strategy", against_application=True)
        self._check_strategy_parameters(strategy)
        self._analyze_calculations(strategy)
        for index, element in enumerate(strategy.elements):
            self._check_element(element, index)
        self._check_rule_list(
            strategy.rules,
            self._strategy_ctx(None, order_error=False),
            list_scope=scope,
            ordered=False,
            list_name="strategy",
            list_path=pointer("rules"),
        )
        self._check_flow(strategy)
        self._check_layout(strategy)
        self._check_candle_uses(strategy)
        self._check_inputs_used(strategy)

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
            self._check_rule(template, item, ctx, None, "")
        elif category is ObjectCategory.RULESET:
            self._check_rule(template, self._item(template, self._closed), ctx, None, "")
        else:
            self._check_object(template, description, ctx)

    def _analyze_calculations(self, strategy: Strategy) -> None:
        """Analyze the calculations so that a calculation is analyzed after the ones whose
        result it uses. That keeps long chains of calculations out of the recursion; a cycle
        between results is a finding."""
        calculations = {
            item.key.lower(): item
            for item in strategy.elements
            if item.type == catalog.FLOW_CALCULATION
            and item.key
            and item.instance is None
            and item.id
        }
        indexes = {item.id: position for position, item in enumerate(strategy.elements)}
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
                    members[0].key,
                    elements=[item.id for item in members],
                    names=[str(item.key) for item in members],
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
                ctx.path = pointer("elements", indexes[element.id])
                self._record(
                    below(ctx.path, "parameters", "ausdruck", "value"),
                    ctx,
                    None,
                    "parameter:ausdruck",
                )
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

    def _record(self, pointer: str, ctx: _Ctx, expected: ExprType | None, field: str) -> None:
        """Keep the context of the place ``pointer`` of an expression."""
        if self.record_contexts:
            self.contexts[pointer] = ExpressionContext(
                pointer,
                ctx.env,
                expected,
                ctx.element_id,
                ctx.subject or None,
                ctx.order_error,
                ctx.rule_template,
                ctx.in_template,
                ctx.order_context,
                field,
            )

    def _duplicates(
        self,
        entries: Iterable[_Entry],
        space: str,
        *,
        against_application: bool = False,
        existing: Iterable[_Entry] = (),
    ) -> None:
        """Report names and keys that occur twice on the same level (the second and further
        ones). With ``against_application`` a name that is also the name of an object of the
        application in either language, and a key that is the identifier of one or the name of
        a function, is reported too: the display form could not tell them apart. ``existing``
        are entries of the level that are counted but not reported (the parameters that a type
        brings along)."""
        names: Counter[str] = Counter()
        keys: Counter[str] = Counter()
        for entry in existing:
            names[normalized_name(entry.name)] += 1
            keys[entry.key.lower()] += 1
        for entry in entries:
            name_key = normalized_name(entry.name)
            key_key = entry.key.lower()
            names[name_key] += 1
            keys[key_key] += 1
            # one finding for an entry: a double name first, then a double key
            if names[name_key] > 1:
                what, application = "name", False
            elif against_application and name_key in self._reserved_names:
                what, application = "name", True
            elif keys[key_key] > 1:
                what, application = "key", False
            elif against_application and key_key in self._reserved_keys:
                what, application = "key", True
            else:
                continue
            details: dict[str, object] = {
                "name": entry.name,
                "key": entry.key,
                "namespace": space,
                "what": what,
            }
            if application:
                details["with_application_object"] = True
            self._add(Level.ERROR, fc.NAME_DUPLICATE, entry.element, entry.subject, **details)

    def _check_key(self, key: str, element: str | None, subject: str | None, what: str) -> None:
        if not is_valid_key(key):
            self._add(Level.ERROR, fc.KEY_INVALID, element, subject, key=key, what=what)

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
        source = analysis.source
        if not source.strip():
            self._expression_finding(
                key,
                Level.ERROR,
                fc.EXPRESSION_EMPTY,
                ctx.element_id,
                subject,
                field=field,
                reason="missing",
            )
            return
        for issue in analysis.issues:
            data: dict[str, object] = {
                "field": field,
                "start": issue.start,
                "end": issue.end,
                "issue": issue.kind.value,
                "reason": issue.reason,
                **issue.details,
            }
            if issue.kind is IssueKind.INVALID_INSTRUMENT:
                self._expression_finding(
                    key, Level.ERROR, fc.INSTRUMENT_INVALID, ctx.element_id, subject, **data
                )
            elif ctx.rule_template and issue.kind is IssueKind.UNKNOWN_NAME:
                self._expression_finding(
                    key, Level.HINT, fc.RULE_UNRESOLVED_NAME, ctx.element_id, subject, **data
                )
            else:
                self._expression_finding(
                    key, Level.ERROR, fc.EXPRESSION_INVALID, ctx.element_id, subject, **data
                )
        if analysis.truncated:  # the analysis dropped findings of its own
            self._expression_overflow(key, ctx.element_id, subject)
        for start, end in analysis.slots:
            self._expression_finding(
                key,
                Level.ERROR,
                fc.EXPRESSION_EMPTY,
                ctx.element_id,
                subject,
                field=field,
                reason="slot",
                start=start,
                end=end,
            )
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
            if (
                ctx.element_id is not None
                and len(name.symbols) >= 2
                and name.symbols[0].kind is SymbolKind.INSTANCE
            ):
                self._used_inputs.setdefault(ctx.element_id, set()).add(
                    (name.symbols[0].name.lower(), name.symbols[1].name.lower())
                )
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

    def context_findings(self, context: ExpressionContext, analysis: Analysis) -> list[Finding]:
        """The findings of one analyzed expression at a place, as the check reports them:
        what ``/api/v1/expressions`` answers. Positions refer to the analyzed text."""
        found: list[Finding] = []
        subject = context.subject
        element = context.element_id
        field = context.field
        if not analysis.source.strip():
            found.append(
                Finding(
                    Level.ERROR,
                    fc.EXPRESSION_EMPTY,
                    element,
                    subject,
                    {"field": field, "reason": "missing"},
                )
            )
            return found
        for issue in analysis.issues[:MAX_FINDINGS_PER_EXPRESSION]:
            data: dict[str, object] = {
                "field": field,
                "start": issue.start,
                "end": issue.end,
                "issue": issue.kind.value,
                "reason": issue.reason,
                **issue.details,
            }
            if issue.kind is IssueKind.INVALID_INSTRUMENT:
                found.append(Finding(Level.ERROR, fc.INSTRUMENT_INVALID, element, subject, data))
            elif context.rule_template and issue.kind is IssueKind.UNKNOWN_NAME:
                found.append(Finding(Level.HINT, fc.RULE_UNRESOLVED_NAME, element, subject, data))
            else:
                found.append(Finding(Level.ERROR, fc.EXPRESSION_INVALID, element, subject, data))
        for start, end in analysis.slots:
            found.append(
                Finding(
                    Level.ERROR,
                    fc.EXPRESSION_EMPTY,
                    element,
                    subject,
                    {"field": field, "reason": "slot", "start": start, "end": end},
                )
            )
        if context.order_error and self.analysis_uses_order(analysis):
            found.append(
                Finding(
                    Level.ERROR,
                    fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT,
                    element,
                    subject,
                    {"field": field, "context": context.order_context},
                )
            )
        return found

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
        ``key.ergebnis`` is its result; the rules of a ruleset are addressed as
        ``regelwerk.regel``."""
        item = self._item(rule, parent)
        cached = self._rule_symbols.get(id(rule))
        if cached is not None:
            return cached
        symbol: Symbol
        if rule.object_type == catalog.TYPE_RULESET:

            def ruleset_members() -> dict[str, Symbol]:
                result = {
                    child.content.key.lower(): self._rule_symbol(child.content)
                    for child in item.contained
                    if isinstance(child.content, Instance)
                }
                if rule.result_expression:
                    result[RESULT_PROPERTY] = Symbol(
                        RESULT_PROPERTY,
                        SymbolKind.PROPERTY,
                        type_factory=lambda: self._ruleset_result_type(item),
                        payload=item,
                        label=_RESULT_LABEL,
                        explanation=_RESULT_EXPLANATION,
                    )
                return result

            symbol = Symbol(
                rule.key,
                SymbolKind.RULESET,
                object_type=rule.object_type,
                members_factory=ruleset_members,
                payload=item,
                shown=rule.name,
            )
        elif rule.object_type == catalog.TYPE_RULE:
            symbol = Symbol(
                rule.key,
                SymbolKind.RULE,
                object_type=rule.object_type,
                members_factory=lambda: {
                    RESULT_PROPERTY: Symbol(
                        RESULT_PROPERTY,
                        SymbolKind.PROPERTY,
                        type=self._rule_result_type(rule),
                        payload=item,
                        label=_RESULT_LABEL,
                        explanation=_RESULT_EXPLANATION,
                        datatype=self._rule_result_type(rule).datatype,
                    )
                },
                payload=item,
                shown=rule.name,
            )
        else:
            symbol = instance_symbol(self.registry, rule, self._rule_symbol)
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
            return instance_symbol(self.registry, element.instance, self._rule_symbol)
        key = element.key
        if not key:
            return None
        if element.type == catalog.FLOW_CONDITION:
            return Symbol(
                key,
                SymbolKind.CONDITION,
                members_factory=lambda: {
                    RESULT_PROPERTY: Symbol(
                        RESULT_PROPERTY,
                        SymbolKind.PROPERTY,
                        type=et.BOOLEAN,
                        label=_RESULT_LABEL,
                        explanation=_RESULT_EXPLANATION,
                        datatype=DataType.BOOLEAN,
                        previous_value=True,
                    )
                },
                shown=element.name,
            )
        if element.type == catalog.FLOW_CALCULATION:
            return Symbol(
                key,
                SymbolKind.CALCULATION,
                members_factory=lambda: {
                    RESULT_PROPERTY: Symbol(
                        RESULT_PROPERTY,
                        SymbolKind.PROPERTY,
                        type_factory=lambda: self._calculation_type(element),
                        label=_RESULT_LABEL,
                        explanation=_RESULT_EXPLANATION,
                        previous_value=True,
                    )
                },
                shown=element.name,
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
            [_Entry(item.name, item.key, None, item.key) for item in strategy.parameters],
            "strategy_parameters",
        )
        for item in strategy.parameters:
            self._check_key(item.key, None, item.key, "strategy_parameter")
            if item.value is None:
                if not item.at_application:
                    self._add(
                        Level.ERROR,
                        fc.PARAMETER_MISSING,
                        None,
                        item.key,
                        parameter=item.key,
                        scope="strategy",
                    )
                continue
            problem = _fixed_problem(_param_of_strategy_parameter(item), item.value)
            if problem is not None:
                if problem[0] == "instrument":
                    self._add(
                        Level.ERROR,
                        fc.INSTRUMENT_INVALID,
                        None,
                        item.key,
                        parameter=item.key,
                        scope="strategy",
                        value=item.value,
                    )
                else:
                    self._add(
                        Level.ERROR,
                        fc.PARAMETER_BINDING_INVALID,
                        None,
                        item.key,
                        parameter=item.key,
                        scope="strategy",
                        reason=problem[0],
                        **problem[1],
                    )

    def _check_element(self, element: Element, index: int) -> None:
        description = self.registry.get(element.type)
        if description is None:
            self._add(
                Level.ERROR, fc.TYPE_UNKNOWN, element.id, None, kind="element", type=element.type
            )
            return
        path = pointer("elements", index)
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
        ctx.path = path
        if element.key is not None:
            self._check_key(element.key, element.id, element.key, "element")
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
        self._check_element_inputs(element, ctx)
        if element.rules:
            list_scope = Scope(self._strategy_scope)
            for rule in element.rules:
                list_scope.add(self._rule_symbol(rule, list_scope))
            self._duplicates(
                [_Entry(rule.name, rule.key, element.id, rule.key) for rule in element.rules],
                "element_rules",
            )
            self._check_rule_list(
                element.rules,
                replace(self._strategy_ctx(element, order_error=False), path=path),
                list_scope=list_scope,
                ordered=False,
                list_name="element",
                list_path=below(path, "rules"),
            )

    def _check_element_inputs(self, element: Element, ctx: _Ctx) -> None:
        """An input names an instance on the drawing area and a property of it that exist
        (specification 3.3, 3.6)."""
        for entry in element.inputs:
            symbol = self._strategy_scope.resolve(entry.instance)
            if symbol is None or symbol.kind is not SymbolKind.INSTANCE:
                self._add(
                    Level.ERROR,
                    fc.DATA_UNKNOWN,
                    element.id,
                    None,
                    where="input",
                    reason="unknown_instance",
                    instance=entry.instance,
                    property=entry.property,
                )
                continue
            member = symbol.member(entry.property)
            wanted = SymbolKind.METHOD if entry.kind is InputKind.METHOD else SymbolKind.PROPERTY
            if member is None or member.kind is not wanted:
                self._add(
                    Level.ERROR,
                    fc.DATA_UNKNOWN,
                    element.id,
                    None,
                    where="input",
                    reason="unknown_method"
                    if entry.kind is InputKind.METHOD
                    else "unknown_property",
                    instance=entry.instance,
                    property=entry.property,
                )
            elif entry.kind is InputKind.METHOD and not _arguments_fit(member, entry.arguments):
                self._add(
                    Level.ERROR,
                    fc.DATA_UNKNOWN,
                    element.id,
                    None,
                    where="input",
                    reason="arguments",
                    instance=entry.instance,
                    property=entry.property,
                    minimum=sum(1 for item in member.arguments if item.required),
                    maximum=len(member.arguments),
                    found=len(entry.arguments),
                )

    def _check_inputs_used(self, strategy: Strategy) -> None:
        """An input that no expression of the element or of its rules uses is a hint."""
        for element in strategy.elements:
            used = self._used_inputs.get(element.id, set())
            for entry in element.inputs:
                symbol = self._strategy_scope.resolve(entry.instance)
                if symbol is None or symbol.kind is not SymbolKind.INSTANCE:
                    continue  # reported as an input that does not exist
                member = symbol.member(entry.property)
                wanted = (
                    SymbolKind.METHOD if entry.kind is InputKind.METHOD else SymbolKind.PROPERTY
                )
                if member is None or member.kind is not wanted:
                    continue  # reported as an input that does not exist
                if (symbol.name.lower(), entry.property.lower()) in used:
                    continue
                if entry.kind is InputKind.PROPERTY and self._connection_binding_uses(
                    element, symbol.name, entry.property
                ):
                    continue
                self._add(
                    Level.HINT,
                    fc.INPUT_UNUSED,
                    element.id,
                    None,
                    instance=entry.instance,
                    property=entry.property,
                )

    @staticmethod
    def _connection_binding_uses(element: Element, instance: str, prop: str) -> bool:
        for binding in (*element.parameters.values(), *element.properties.values()):
            link = binding.value
            if (
                binding.kind is BindingKind.CONNECTION
                and isinstance(link, DataLink)
                and link.instance.lower() == instance.lower()
                and link.property.lower() == prop.lower()
            ):
                return True
        return False

    def _check_instance_element(self, element: Element, ctx: _Ctx) -> None:
        instance = element.instance
        assert instance is not None  # noqa: S101 - checked by the caller
        description = self.registry.get(instance.object_type)
        if description is None:
            self._add(
                Level.ERROR,
                fc.TYPE_UNKNOWN,
                element.id,
                instance.key,
                kind="object",
                type=instance.object_type,
            )
            return
        self._check_key(instance.key, element.id, instance.key, "instance")
        self._check_object(
            instance,
            description,
            replace(ctx, subject=instance.key, path=below(ctx.path, "instance")),
        )

    def _check_flow_element(
        self, element: Element, description: TypeDescription, ctx: _Ctx
    ) -> None:
        params = [_param_of_description(item) for item in description.parameters]
        expected_for: dict[str, ExprType] = {}
        if element.type == catalog.FLOW_CONDITION:
            expected_for["ausdruck"] = et.BOOLEAN
        self._check_parameters(params, element.parameters, ctx, expected_for, "parameters")
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
        self._check_bindings(params, values, ctx, {}, "property", "properties")

    # ------------------------------------------------------------------------------
    # parameters and bindings

    def _check_parameters(
        self,
        params: Sequence[_Param],
        values: dict[str, Binding],
        ctx: _Ctx,
        expected_for: dict[str, ExprType] | None = None,
        section: str = "parameter_values",
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
        self._check_bindings(applicable, values, ctx, expected_for or {}, "parameter", section)

    def _check_bindings(
        self,
        params: Sequence[_Param],
        values: dict[str, Binding],
        ctx: _Ctx,
        expected_for: dict[str, ExprType],
        label: str,
        section: str,
    ) -> None:
        for item in params:
            if self.record_contexts and BindingKind.EXPRESSION in item.bindings:
                self._record(
                    below(ctx.path, section, item.id, "value"),
                    ctx,
                    expected_for.get(item.id, item.expected),
                    f"{label}:{item.id}",
                )
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
                if problem[0] == "instrument":
                    self._add(
                        Level.ERROR,
                        fc.INSTRUMENT_INVALID,
                        ctx.element_id,
                        ctx.subject or None,
                        **{label: item.id},
                        value=binding.value,
                    )
                else:
                    self._invalid(ctx, label, item.id, problem[0], **problem[1])
            return
        if binding.kind is BindingKind.PARAMETER:
            self._check_parameter_binding(item, binding, ctx, label)
            return
        if binding.kind is BindingKind.CONNECTION:
            self._check_connection_binding(item, binding, ctx, label)
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

    def _check_connection_binding(
        self, item: _Param, binding: Binding, ctx: _Ctx, label: str
    ) -> None:
        """A data connection names an instance and a property of it that exist, and the
        property fits the data type of the parameter or property (specification 3.6)."""
        link = binding.value
        if not isinstance(link, DataLink):
            self._invalid(ctx, label, item.id, "value")
            return
        symbol = ctx.env.resolve(link.instance)
        if symbol is None or symbol.kind is not SymbolKind.INSTANCE:
            self._add(
                Level.ERROR,
                fc.DATA_UNKNOWN,
                ctx.element_id,
                ctx.subject or None,
                where="binding",
                reason="unknown_instance",
                instance=link.instance,
                property=link.property,
                target=item.id,
                target_kind=label,
            )
            return
        member = symbol.member(link.property)
        if member is None or member.kind is not SymbolKind.PROPERTY:
            self._add(
                Level.ERROR,
                fc.DATA_UNKNOWN,
                ctx.element_id,
                ctx.subject or None,
                where="binding",
                reason="unknown_property",
                instance=link.instance,
                property=link.property,
                target=item.id,
                target_kind=label,
            )
            return
        found = member.value_type
        if found is not None and et.mismatch_with(item.expected, found) is not None:
            self._add(
                Level.ERROR,
                fc.DATA_TYPE_MISMATCH,
                ctx.element_id,
                ctx.subject or None,
                instance=link.instance,
                property=link.property,
                expected=item.datatype.value,
                found=found.describe(),
                target=item.id,
                target_kind=label,
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
        entries: list[_Entry] = []
        for item in params:
            symbol = parameter_symbol(
                item.id,
                item.datatype,
                item.choices,
                object_type=item.object_type,
                registry=self.registry,
            )
            description_item = description.parameter(item.id)
            if description_item is not None:
                symbol.label = description_item.label
                symbol.explanation = description_item.explanation
            scope.add(symbol)
            entries.append(_Entry(item.id, item.id, ctx.element_id, subject))
        fixed_entries = list(entries)
        for definition in content.parameters:
            scope.add(
                parameter_symbol(
                    definition.key,
                    definition.datatype,
                    definition.choices,
                    shown=definition.name,
                    object_type=definition.object_type,
                    registry=self.registry,
                )
            )
            entries.append(_Entry(definition.name, definition.key, ctx.element_id, subject))
            self._check_key(definition.key, ctx.element_id, subject, "parameter")
        for child in content.instances:
            scope.add(instance_symbol(self.registry, child, self._rule_symbol))
            entries.append(_Entry(child.name, child.key, ctx.element_id, ctx.below(child.key)))
            self._check_key(child.key, ctx.element_id, ctx.below(child.key), "instance")
        for rule in content.rules:
            scope.add(self._rule_symbol(rule, scope))
            entries.append(_Entry(rule.name, rule.key, ctx.element_id, ctx.below(rule.key)))
        self._duplicates(
            entries[len(fixed_entries) :],
            "template",
            against_application=True,
            existing=fixed_entries,
        )
        self._check_parameters(all_params, content.parameter_values, ctx)
        inner = replace(
            ctx,
            env=scope,
            params={item.id.lower(): item for item in all_params},
            order_error=True,
            order_context=_INDICATOR,
            rule_order_error=True,
        )
        for index, child in enumerate(content.instances):
            self._check_nested_instance(
                child, replace(inner, path=below(ctx.path, "instances", index))
            )
        self._check_rule_list(
            content.rules,
            inner,
            list_scope=scope,
            ordered=False,
            list_name="template",
            list_path=below(ctx.path, "rules"),
        )
        for index, own_property in enumerate(content.properties):
            self._check_property_definition(
                own_property, inner, below(ctx.path, "properties", index, "expression")
            )
        self._duplicates(
            [_Entry(item.name, item.key, ctx.element_id, subject) for item in content.properties],
            "template_properties",
        )

    def _check_trend_direction(self, content: ObjectContent, ctx: _Ctx) -> None:
        """A trend with the calculation method "Ausdruck" needs an expression for the
        property ``richtung`` (specification 3.3)."""
        binding = content.parameter_values.get("berechnungsverfahren")
        method = catalog.TREND_METHOD_EXPRESSION
        if binding is not None and binding.kind is BindingKind.FIXED:
            method = str(binding.value)
        has_direction = any(item.key.lower() == "richtung" for item in content.properties)
        if method == catalog.TREND_METHOD_EXPRESSION and not has_direction:
            self._add(
                Level.ERROR,
                fc.TREND_DIRECTION_MISSING,
                ctx.element_id,
                ctx.subject or None,
                property="richtung",
            )

    def _check_nested_instance(self, instance: Instance, ctx: _Ctx) -> None:
        subject = ctx.below(instance.key)
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

    def _check_property_definition(
        self, definition: PropertyDefinition, ctx: _Ctx, pointer: str
    ) -> None:
        field = f"property_definition:{definition.key}"
        expected = type_of(definition.datatype, definition.choices, definition.object_type)
        self._record(pointer, ctx, expected, field)
        self._check_key(definition.key, ctx.element_id, ctx.subject or None, "property")
        analysis = self.analyze_cached(definition, field, definition.expression, ctx.env, expected)
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
        list_path: str,
    ) -> None:
        items: list[_RuleItem] = []
        for rule in rules:
            item = self._item(rule, list_scope)
            item.parent = list_scope
            items.append(item)
        for index, (rule, item) in enumerate(zip(rules, items, strict=True)):
            self._check_rule(rule, item, ctx, rule.key, below(list_path, index))
        self._check_cycles(rules, items, ordered=ordered, list_name=list_name, ctx=ctx)

    def _check_rule(
        self, rule: ObjectContent, item: _RuleItem, ctx: _Ctx, name: str | None, path: str
    ) -> None:
        subject = ctx.below(name) if name is not None else (ctx.subject or None)
        rule_ctx = replace(ctx, subject=subject or "", path=path)
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
            self._check_key(name, ctx.element_id, subject, "rule")
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
            self._check_key(entry.key, ctx.element_id, ctx.subject or None, "parameter")
        self._duplicates(
            [
                _Entry(entry.name, entry.key, ctx.element_id, ctx.subject or None)
                for entry in rule.parameters
            ],
            "rule_parameters",
        )
        definitions = [_param_of_definition(entry) for entry in rule.parameters]
        outer = replace(ctx, env=item.parent if item.parent is not None else ctx.env)
        self._check_parameters(definitions, rule.parameter_values, outer)
        rule_ctx = replace(ctx, env=item.env(), order_error=False)
        analysis = item.expression_analysis()
        self._record(
            below(ctx.path, "expression"), rule_ctx, self._rule_expected(rule), "expression"
        )
        self._report(rule, "expression", analysis, rule_ctx)
        self._check_result(rule, analysis, ctx)

    def _rule_expected(self, rule: ObjectContent) -> ExprType:
        """The type the expression of a rule must have."""
        return self._rule_result_type(rule)

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
            [
                _Entry(child.name, child.key, ctx.element_id, ctx.below(child.key))
                for child in rule.rules
            ],
            "ruleset",
        )
        self._check_rule_list(
            rule.rules,
            inner_ctx,
            list_scope=inner_scope,
            ordered=True,
            list_name="ruleset",
            list_path=below(ctx.path, "rules"),
        )
        if rule.result_expression is not None:
            analysis = item.result_analysis()
            assert analysis is not None  # noqa: S101 - the inner namespace exists
            self._record(below(ctx.path, "result_expression"), inner_ctx, None, "result_expression")
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
                    ctx.below(rules[first].key),
                    kind="cycle",
                    list=list_name,
                    rules=[rules[int(node)].key for node in component],
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
                        ctx.below(rules[position].key),
                        kind="forward",
                        list=list_name,
                        rule=rules[position].key,
                        refers_to=rules[target].key,
                    )

    # ------------------------------------------------------------------------------
    # flow of the strategy

    def _check_flow(self, strategy: Strategy) -> None:
        elements = {item.id: item for item in strategy.elements}
        kinds: dict[str, ElementKind | None] = {}
        for item in strategy.elements:
            description = self.registry.get(item.type)
            kinds[item.id] = None if description is None else description.kind
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
            edges[connection.source].append((connection.output, connection.target))
        triggers = [item.id for item in strategy.elements if kinds[item.id] is ElementKind.TRIGGER]
        successors = {node: [target for _, target in pairs] for node, pairs in edges.items()}
        reached = reachable(triggers, successors)
        for item in strategy.elements:
            if kinds[item.id] is ElementKind.TRIGGER and not edges[item.id]:
                self._add(Level.ERROR, fc.TRIGGER_UNCONNECTED, item.id)
            # an element of an unknown type is no element of the flow for this finding
            if kinds[item.id] is ElementKind.FLOW and item.id not in reached:
                self._add(Level.ERROR, fc.FLOW_NOT_REACHED, item.id)
        self._check_loops(strategy, kinds, edges)
        main_triggers = [item for item in triggers if elements[item].management_of is None]
        if not main_triggers:
            self._add(Level.HINT, fc.FLOW_MAIN_WITHOUT_TRIGGER)
        else:
            main_reached = reachable(main_triggers, successors)
            if not any(
                elements[node].type == catalog.FLOW_PLACE_ORDER
                and elements[node].management_of is None
                for node in main_reached
            ):
                self._add(Level.HINT, fc.FLOW_NO_ORDER_REACHABLE)
        # Only `trigger.candle_close` evaluates at the close of a candle: any other trigger that
        # reaches an element makes `Kerze` without an instance ambiguous there.
        other_triggers = [
            item.id
            for item in strategy.elements
            if kinds[item.id] is ElementKind.TRIGGER and item.type != catalog.TRIGGER_CANDLE_CLOSE
        ]
        self._other_trigger_reach = reachable(other_triggers, successors)
        self._has_other_trigger = bool(other_triggers)

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
        if _is_instance(source, kinds) or _is_instance(target, kinds):
            return "instance_connection"
        description = self.registry.get(source.type)
        if description is not None and description.output(connection.output) is None:
            return "unknown_output"
        if kinds[target.id] is ElementKind.TRIGGER:
            return "target_is_trigger"
        managing = description.management_output() if description is not None else None
        if managing is not None and managing.id == connection.output:
            # the connection that begins the management of an order without triggers of its own
            if target.management_of != source.id:
                return "management_output_outside"
            has_triggers = any(
                item.management_of == source.id and kinds[item.id] is ElementKind.TRIGGER
                for item in elements.values()
            )
            return "management_output_with_triggers" if has_triggers else None
        if source.management_of != target.management_of:
            return "across_managements"
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

    def _check_layout(self, strategy: Strategy) -> None:
        """Sections and collapsed managements name elements that exist, and a section holds only
        elements of its own flow, each element in at most one section (specification 3.3)."""
        elements = {item.id: item for item in strategy.elements}
        placed: set[str] = set()
        for section in strategy.sections:
            flow = section.flow
            if flow is not None and (
                flow not in elements or elements[flow].type != catalog.FLOW_PLACE_ORDER
            ):
                self._add(
                    Level.ERROR,
                    fc.LAYOUT_INVALID,
                    None,
                    None,
                    part="section",
                    reason="unknown_flow",
                    section=section.id,
                    flow=flow,
                )
            for element_id in section.elements:
                item = elements.get(element_id)
                if item is None:
                    reason = "unknown_element"
                elif element_id in placed:
                    reason = "element_twice"
                elif item.management_of != flow:
                    reason = "other_flow"
                else:
                    reason = ""
                if reason:
                    self._add(
                        Level.ERROR,
                        fc.LAYOUT_INVALID,
                        element_id if item is not None else None,
                        None,
                        part="section",
                        reason=reason,
                        section=section.id,
                        element_id=element_id,
                    )
                placed.add(element_id)
        for flow in strategy.collapsed_managements:
            if flow not in elements or elements[flow].type != catalog.FLOW_PLACE_ORDER:
                self._add(
                    Level.ERROR,
                    fc.LAYOUT_INVALID,
                    None,
                    None,
                    part="collapsed_management",
                    reason="unknown_flow",
                    flow=flow,
                )

    def _check_candle_uses(self, strategy: Strategy) -> None:
        if not self._candle_uses or not self._has_other_trigger:
            return
        has_instance = any(
            item.instance is not None
            and item.instance.object_type == catalog.OBJECT_CANDLE
            and "zeiteinheit" in item.instance.parameter_values
            for item in strategy.elements
        )
        if has_instance:
            return
        flow_ids = {item.id for item in strategy.elements if item.id and item.instance is None}
        with_rules = {
            item.id
            for item in strategy.elements
            if (description := self.registry.get(item.type)) is not None
            and description.rules_allowed
        }
        for element_id, subject in self._candle_uses:
            if element_id in flow_ids:
                # an element of the flow and its rules: judged by the triggers that reach it
                affected = element_id in self._other_trigger_reach
            elif element_id is None:
                # a rule of the strategy: judged by the elements it is applied to
                affected = any(node in self._other_trigger_reach for node in with_rules)
            else:
                # an instance on the canvas: judged by all triggers of the strategy
                affected = True
            if affected:
                self._add(Level.ERROR, fc.CANDLE_NO_INSTANCE, element_id, subject)


@dataclass(frozen=True, slots=True)
class _Entry:
    """A name and key of a level for the check of doubles, with where to report it."""

    name: str
    key: str
    element: str | None
    subject: str | None


def _reserved_names(registry: ElementRegistry) -> set[str]:
    """The names of the objects of the application in both languages, normalized."""
    result: set[str] = set()
    for description in registry.list(ElementKind.APPLICATION_OBJECT):
        result.add(normalized_name(description.name.de))
        result.add(normalized_name(description.name.en))
        result.add(normalized_name(description.id))
    return result


def _reserved_keys(registry: ElementRegistry) -> set[str]:
    """The identifiers of the objects of the application and the names of the functions, in
    lower case."""
    result = {
        description.id.lower() for description in registry.list(ElementKind.APPLICATION_OBJECT)
    }
    result.update(item.name.lower() for item in list_functions())
    return result


def _is_instance(element: Element, kinds: dict[str, ElementKind | None]) -> bool:
    """Whether the element shows an object (an instance) and has no connection of the flow."""
    kind = kinds.get(element.id)
    return element.instance is not None or kind in (
        ElementKind.OBJECT_TYPE,
        ElementKind.APPLICATION_OBJECT,
        ElementKind.ORDER_TYPE,
        ElementKind.TREND_METHOD,
    )


def _value_fits(spec: ArgumentDescription, value: Scalar) -> bool:
    """Whether a fixed value is a value of the data type of an argument."""
    match spec.datatype:
        case DataType.BOOLEAN:
            return isinstance(value, bool)
        case DataType.INTEGER:
            return isinstance(value, int) and not isinstance(value, bool)
        case DataType.NUMBER | DataType.PERCENT:
            return isinstance(value, int | float) and not isinstance(value, bool)
        case DataType.CHOICE | DataType.TIME_UNIT:
            return isinstance(value, str) and value in _choices_of(spec.datatype, spec.choices)
        case _:
            return isinstance(value, str)


def _arguments_fit(method: Symbol, arguments: Sequence[Scalar]) -> bool:
    """Whether the values of the arguments of an input fit the method: the number is between
    the number of mandatory arguments and the number of all arguments, every value has the
    data type of its argument (specification 3.1, 3.3)."""
    specs = method.arguments
    if not sum(1 for item in specs if item.required) <= len(arguments) <= len(specs):
        return False
    return all(_value_fits(spec, value) for spec, value in zip(specs, arguments, strict=False))


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


def _fixed_problem(
    item: _Param, value: Scalar | DataLink | None
) -> tuple[str, dict[str, object]] | None:
    """Why a fixed value does not fit the data type, or ``None``. The reason ``instrument``
    stands for a text that is no designation of an instrument (specification 3.1)."""
    datatype = item.datatype
    if isinstance(value, DataLink):
        return "type", {"expected": datatype.value}
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
    elif datatype is DataType.OBJECT and item.object_type == INSTRUMENT_TYPE:
        if not isinstance(value, str):
            return "type", {"expected": datatype.value}
        if value in item.choices or is_valid_designation(value):
            return None
        return "instrument", {"value": value}
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
