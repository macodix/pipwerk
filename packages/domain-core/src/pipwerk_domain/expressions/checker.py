"""Type check of expressions and recognition of names (specification 3.4).

:func:`analyze` parses an expression and checks names, functions and types against an
environment. It returns the findings with position, the recognized names with position and
identifier (what the check endpoint of the web API needs) and the normalized spelling.
Nothing is evaluated.

An expression is read either in the stored form (names are keys) or in the display form
(names are the names of the user and the labels in either language, in square brackets if
they are no simple names).
"""

import re
from dataclasses import dataclass, field
from enum import StrEnum

from pipwerk_domain.expressions import exprtypes as et
from pipwerk_domain.expressions.exprtypes import ExprType
from pipwerk_domain.expressions.functions import ArgumentKind, ResultKind, find_function
from pipwerk_domain.expressions.nodes import (
    Binary,
    Call,
    Group,
    MethodCall,
    Name,
    NameSegment,
    Node,
    Number,
    Slot,
    String,
    Unary,
    names_and_calls,
    postorder,
)
from pipwerk_domain.expressions.parser import ParseResult, parse
from pipwerk_domain.expressions.symbols import Environment, Symbol, SymbolKind
from pipwerk_domain.limits import MAX_FINDINGS_PER_EXPRESSION
from pipwerk_domain.typedesc import ArgumentDescription, DataType

_ORDERING = ("<", "<=", ">", ">=")
_ARITHMETIC = ("+", "-", "*", "/", "^")


def _integer_fits(datatype: DataType, node: Node) -> bool:
    """A fixed number where a whole number is expected must be one (and no percentage)."""
    if datatype is not DataType.INTEGER:
        return True
    while isinstance(node, Group):
        node = node.inner
    return not isinstance(node, Number) or (isinstance(node.value, int) and not node.percent)


def result_texts(node: Node) -> list[String]:
    """The fixed texts that can be the result of ``node``: the node itself if it is a text,
    inside parentheses and in the value branches of ``IF`` and ``IFNA``."""
    found: list[String] = []
    stack: list[Node] = [node]
    while stack:
        current = stack.pop()
        if isinstance(current, String):
            found.append(current)
        elif isinstance(current, Group):
            stack.append(current.inner)
        elif isinstance(current, Call):
            name = current.name.upper()
            if name == "IF":
                stack.extend(current.args[1:])
            elif name == "IFNA":
                stack.extend(current.args)
    found.sort(key=lambda item: item.start)
    return found


class IssueKind(StrEnum):
    """The kinds of faulty expressions (specification 3.6)."""

    SYNTAX = "syntax"
    UNKNOWN_FUNCTION = "unknown_function"
    UNKNOWN_NAME = "unknown_name"
    UNKNOWN_PROPERTY = "unknown_property"
    UNKNOWN_METHOD = "unknown_method"
    TYPE_MISMATCH = "type_mismatch"
    UNKNOWN_CHOICE_VALUE = "unknown_choice_value"
    ARGUMENT_COUNT = "argument_count"
    PREVIOUS_ARGUMENT = "previous_argument"
    INVALID_INSTRUMENT = "invalid_instrument"


@dataclass(frozen=True, slots=True)
class ExpressionIssue:
    """A finding in an expression. ``start`` is the first character, ``end`` the position
    after the last character. ``reason`` refines the kind, ``details`` are the data for the
    text of the finding."""

    kind: IssueKind
    start: int
    end: int
    reason: str = ""
    details: dict[str, object] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class RecognizedSegment:
    """One part of a name with position and identifier."""

    start: int
    end: int
    identifier: str


@dataclass(frozen=True, slots=True)
class RecognizedName:
    """A name in an expression. ``identifier`` is the spelling of the identifiers, joined
    with points. ``resolved`` is true if the whole name was recognized;
    otherwise ``segments`` are the recognized first parts. ``written`` are all parts of the
    name as the node holds them."""

    start: int
    end: int
    identifier: str
    segments: tuple[RecognizedSegment, ...]
    resolved: bool
    symbols: tuple[Symbol, ...]
    previous: bool = False
    """True for the name in ``PREVIOUS(name)``: it stands for the value of an earlier
    evaluation and is no dependency on the result of the current one."""
    written: tuple[NameSegment, ...] = ()


@dataclass(frozen=True, slots=True)
class RecognizedFunction:
    name: str
    start: int
    end: int


@dataclass(slots=True)
class Analysis:
    """Result of :func:`analyze`."""

    source: str
    tree: Node | None
    issues: list[ExpressionIssue]
    names: list[RecognizedName]
    functions: list[RecognizedFunction]
    result_type: ExprType
    normalized: str
    truncated: bool = False
    """True if the expression had more findings than ``MAX_FINDINGS_PER_EXPRESSION``."""
    parsed_ok: bool = False
    """True if the expression has no syntax problem (also after :meth:`release`)."""
    types: dict[int, ExprType] = field(default_factory=dict)
    """The type of every node of the tree, by ``id`` of the node."""
    slots: list[tuple[int, int]] = field(default_factory=list)
    """Start and end of every empty place."""
    argument_types: dict[int, ExprType] = field(default_factory=dict)
    """The type that a method expects for an argument, by ``id`` of the node of the argument."""
    display: bool = False
    """Whether the source was read in the display form."""

    def __post_init__(self) -> None:
        self.parsed_ok = self.tree is not None

    @property
    def ok(self) -> bool:
        return not self.issues

    def release(self) -> None:
        """Drop the syntax tree, the types and the recognized names and functions, which take
        most of the memory, once the findings of the expression have been used."""
        self.tree = None
        self.names = []
        self.functions = []
        self.types = {}
        self.argument_types = {}


def analyze(
    source: str,
    environment: Environment,
    expected: ExprType | None = None,
    parsed: ParseResult | None = None,
    *,
    display: bool = False,
) -> Analysis:
    """Parse and check an expression.

    ``expected`` is the type the result must have (for example the data type of the
    property that a rule determines); fixed texts are checked against the values of a
    choice. ``parsed`` is the result of ``parse(source)`` if the caller has it already.
    ``display`` reads the names in the display form.
    """
    parsed = parse(source) if parsed is None else parsed
    if parsed.tree is None or parsed.issue is not None:
        issue = parsed.issue
        assert issue is not None  # noqa: S101 - parse returns either a tree or an issue
        return Analysis(
            source,
            None,
            [
                ExpressionIssue(
                    IssueKind.SYNTAX, issue.start, issue.end, issue.reason, dict(issue.details)
                )
            ],
            [],
            [],
            et.UNKNOWN,
            source,
            display=display,
        )
    checker = _Checker(source, environment, display)
    return checker.run(parsed.tree, expected)


def analyze_spelling(source: str, environment: Environment) -> Analysis:
    """Parse an expression and find the spelling of its names and functions, without the type
    check and without findings (only a syntax problem is reported). It is much cheaper than
    :func:`analyze`; the result has no names and no functions, only ``normalized``, and
    ``parsed_ok`` tells whether the expression has no syntax problem."""
    spelled: dict[str, list[str]] = {}  # the same name is resolved once for an expression
    if not _would_change(source, environment, spelled):
        # nothing to rewrite: the syntax does not matter, the text stays as it is
        unchanged = Analysis(source, None, [], [], [], et.UNKNOWN, source)
        unchanged.parsed_ok = True
        return unchanged
    parsed = parse(source)
    if parsed.tree is None or parsed.issue is not None:
        issue = parsed.issue
        assert issue is not None  # noqa: S101 - parse returns either a tree or an issue
        return Analysis(
            source,
            None,
            [ExpressionIssue(IssueKind.SYNTAX, issue.start, issue.end, issue.reason)],
            [],
            [],
            et.UNKNOWN,
            source,
        )
    replacements: list[tuple[int, int, str]] = []
    names, calls = names_and_calls(parsed.tree)
    for node in names:
        texts = tuple(segment.text for segment in node.segments)
        for segment, name in zip(
            node.segments, _canonical_spelling(texts, environment, spelled), strict=False
        ):
            if segment.text != name or segment.bracketed:
                replacements.append((segment.start, segment.end, name))
    for call in calls:
        signature = find_function(call.name)
        if signature is not None and call.name != signature.name:
            replacements.append((call.name_start, call.name_end, signature.name))
    text = source
    for start, end, replacement in sorted(replacements, reverse=True):
        text = text[:start] + replacement + text[end:]
    result = Analysis(source, parsed.tree, [], [], [], et.UNKNOWN, text)
    result.release()
    return result


_STRING_TEXT = re.compile(r'"(?:[^"]|"")*"')
_NAME_TEXT = re.compile(r"(?<![\w.])([^\W\d]\w*(?:\.[^\W\d]\w*)*)(\s*\()?")


def _canonical_spelling(
    texts: tuple[str, ...], environment: Environment, cache: dict[str, list[str]]
) -> list[str]:
    """The spelling of the recognized parts of a name; the parts after the first one that is
    not recognized are left out."""
    cache_key = "\x00".join(texts)
    found = cache.get(cache_key)
    if found is None:
        found = []
        current = environment.resolve(texts[0])
        if current is not None:
            found.append(current.name)
            for part in texts[1:]:
                member = current.member(part)
                if member is None:
                    break
                found.append(member.name)
                current = member
        cache[cache_key] = found
    return found


def _would_change(source: str, environment: Environment, cache: dict[str, list[str]]) -> bool:
    """Whether a name or function in the text, found without parsing it, is written
    differently from its spelling. A cheap scan; it may say yes for a text that cannot be
    parsed, never no for one that can."""
    if "[" in source:
        return True  # a name in brackets is written out as its key
    for found in _NAME_TEXT.finditer(_STRING_TEXT.sub('""', source)):
        written = found.group(1)
        if found.group(2) is not None and "." not in written:
            signature = find_function(written)
            if signature is not None and signature.name != written:
                return True
        parts = tuple(written.split("."))
        spelling = _canonical_spelling(parts, environment, cache)
        if any(part != name for part, name in zip(parts, spelling, strict=False)):
            return True
    return False


def normalize_expression(source: str, environment: Environment) -> str:
    """Write an expression with names in the spelling of their identifiers and functions
    in the spelling of the norm. Only recognized names and function names change; every
    other character stays as it is. An expression with a syntax problem stays unchanged."""
    return analyze(source, environment).normalized


class _Checker:
    def __init__(self, source: str, environment: Environment, display: bool) -> None:
        self.source = source
        self.environment = environment
        self.display = display
        self.issues: list[ExpressionIssue] = []
        self.names: list[RecognizedName] = []
        self.functions: list[RecognizedFunction] = []
        self.replacements: list[tuple[int, int, str]] = []
        self.types: dict[int, ExprType] = {}
        self.slots: list[tuple[int, int]] = []
        self.name_symbols: dict[int, Symbol] = {}
        self.name_identifiers: dict[int, str] = {}
        self.truncated = False
        self.previous_names: set[int] = set()
        self.argument_types: dict[int, ExprType] = {}

    def run(self, tree: Node, expected: ExprType | None) -> Analysis:
        nodes = postorder(tree)
        for node in nodes:
            if (
                isinstance(node, Call)
                and node.name.upper() == "PREVIOUS"
                and node.args
                and isinstance(node.args[0], Name | MethodCall)
            ):
                self.previous_names.add(id(node.args[0]))
        for node in nodes:
            self.types[id(node)] = self._type_of(node)
        result = self.types[id(tree)]
        if expected is not None:
            self._check_expected(tree, result, expected)
        self.issues.sort(key=lambda item: (item.start, item.end))
        self.names.sort(key=lambda item: item.start)
        self.functions.sort(key=lambda item: item.start)
        self.slots.sort()
        return Analysis(
            self.source,
            tree,
            self.issues,
            self.names,
            self.functions,
            result,
            self._normalized(),
            self.truncated,
            types=self.types,
            slots=self.slots,
            argument_types=self.argument_types,
            display=self.display,
        )

    def _normalized(self) -> str:
        text = self.source
        for start, end, replacement in sorted(self.replacements, reverse=True):
            text = text[:start] + replacement + text[end:]
        return text

    def _issue(
        self, kind: IssueKind, start: int, end: int, reason: str = "", **details: object
    ) -> None:
        if len(self.issues) >= MAX_FINDINGS_PER_EXPRESSION:
            self.truncated = True  # further findings of this expression are dropped
            return
        self.issues.append(ExpressionIssue(kind, start, end, reason, dict(details)))

    def _mismatch(
        self, node: Node, reason: str, expected: str, found: ExprType, **more: object
    ) -> None:
        self._issue(
            IssueKind.TYPE_MISMATCH,
            node.start,
            node.end,
            reason,
            expected=expected,
            found=found.describe(),
            **more,
        )

    def _check_expected(self, tree: Node, result: ExprType, expected: ExprType) -> None:
        mismatch = et.mismatch_with(expected, result, self.display)
        if mismatch is None:
            return
        if mismatch.reason == "choice_value":
            self._report_choice_value(tree, mismatch, "result")
        elif mismatch.reason == "instrument":
            self._report_instrument(tree, mismatch)
        else:
            self._mismatch(tree, "result", expected.describe(), result)

    def _type_of(self, node: Node) -> ExprType:
        match node:
            case Number(value=value, percent=percent):
                if percent:
                    return et.PERCENT
                return et.INTEGER if isinstance(value, int) else et.NUMBER
            case String(value=value):
                return ExprType(DataType.TEXT, literals=frozenset({value}))
            case Slot():
                self.slots.append((node.start, node.end))
                return et.UNKNOWN
            case Name():
                return self._name(node)
            case Group(inner=inner):
                return self.types[id(inner)]
            case Unary(operand=operand):
                found = self.types[id(operand)]
                if not (found.is_unknown or found.is_numeric):
                    self._mismatch(operand, "operand", "number", found, operator=node.op)
                return et.NUMBER
            case Binary():
                return self._binary(node)
            case Call():
                return self._call(node)
            case MethodCall():
                return self._method_call(node)
        return et.UNKNOWN  # pragma: no cover - all node types are handled above

    # names --------------------------------------------------------------------------

    def _name(self, node: Name) -> ExprType:
        segments = node.segments
        first = segments[0]
        symbol = self.environment.resolve(first.text, self.display)
        if symbol is None:
            self._issue(IssueKind.UNKNOWN_NAME, first.start, first.end, name=first.text)
            self.names.append(
                RecognizedName(node.start, node.end, "", (), False, (), written=segments)
            )
            return et.UNKNOWN
        path = [symbol]
        recognized = [RecognizedSegment(first.start, first.end, symbol.name)]
        self.replacements.append((first.start, first.end, symbol.name))
        current = symbol
        for segment in segments[1:]:
            member = current.member(segment.text, self.display)
            if member is None:
                self._issue(
                    IssueKind.UNKNOWN_PROPERTY,
                    segment.start,
                    segment.end,
                    object=".".join(item.identifier for item in recognized),
                    property=segment.text,
                )
                self._remember_name(node, path, recognized, resolved=False)
                return et.UNKNOWN
            path.append(member)
            recognized.append(RecognizedSegment(segment.start, segment.end, member.name))
            self.replacements.append((segment.start, segment.end, member.name))
            current = member
        self._remember_name(node, path, recognized, resolved=True)
        self.name_symbols[id(node)] = current
        self.name_identifiers[id(node)] = ".".join(item.identifier for item in recognized)
        if current.kind is SymbolKind.METHOD:
            # a method is addressed with its arguments in parentheses
            self._issue(
                IssueKind.ARGUMENT_COUNT,
                node.start,
                node.end,
                "call_missing",
                **self._method_details(path, current),
            )
            return et.UNKNOWN
        value_type = current.value_type
        if value_type is None:
            self._issue(
                IssueKind.TYPE_MISMATCH,
                node.start,
                node.end,
                "object_not_value",
                name=".".join(item.identifier for item in recognized),
            )
            return et.UNKNOWN
        if current.kind is SymbolKind.UNRESOLVED:
            return et.UNKNOWN
        return value_type

    def _remember_name(
        self,
        node: Name | MethodCall,
        path: list[Symbol],
        recognized: list[RecognizedSegment],
        *,
        resolved: bool,
    ) -> None:
        # the name of a method call ends with the method, not with the closing parenthesis
        end = node.method.end if isinstance(node, MethodCall) else node.end
        self.names.append(
            RecognizedName(
                node.start,
                end,
                ".".join(item.identifier for item in recognized),
                tuple(recognized),
                resolved,
                tuple(path),
                id(node) in self.previous_names,
                node.segments,
            )
        )

    # methods ------------------------------------------------------------------------

    @staticmethod
    def _method_details(path: list[Symbol], method: Symbol) -> dict[str, object]:
        """The data of a finding about a method: the object it belongs to, the method and the
        number of its arguments."""
        arguments = method.arguments
        return {
            "object": ".".join(item.name for item in path[:-1]),
            "method": method.name,
            "minimum": sum(1 for item in arguments if item.required),
            "maximum": len(arguments),
        }

    def _method_call(self, node: MethodCall) -> ExprType:
        """``Objekt.Methode(Argumente)``: the object and the method are looked up like a name,
        the number and the types of the arguments are checked against the description of the
        method, the type of the result is the one of the method (specification 3.4)."""
        segments = node.segments
        first = segments[0]
        symbol = self.environment.resolve(first.text, self.display)
        if symbol is None:
            self._issue(IssueKind.UNKNOWN_NAME, first.start, first.end, name=first.text)
            self.names.append(
                RecognizedName(node.start, node.method.end, "", (), False, (), written=segments)
            )
            return et.UNKNOWN
        path = [symbol]
        recognized = [RecognizedSegment(first.start, first.end, symbol.name)]
        self.replacements.append((first.start, first.end, symbol.name))
        current = symbol
        for index, segment in enumerate(segments[1:], start=1):
            last = index == len(segments) - 1
            member = current.member(segment.text, self.display)
            if member is None:
                owner = ".".join(item.identifier for item in recognized)
                if last:
                    self._issue(
                        IssueKind.UNKNOWN_METHOD,
                        segment.start,
                        segment.end,
                        "unknown",
                        object=owner,
                        method=segment.text,
                    )
                else:
                    self._issue(
                        IssueKind.UNKNOWN_PROPERTY,
                        segment.start,
                        segment.end,
                        object=owner,
                        property=segment.text,
                    )
                self._remember_name(node, path, recognized, resolved=False)
                return et.UNKNOWN
            path.append(member)
            recognized.append(RecognizedSegment(segment.start, segment.end, member.name))
            self.replacements.append((segment.start, segment.end, member.name))
            current = member
        self._remember_name(node, path, recognized, resolved=True)
        self.name_symbols[id(node)] = current
        self.name_identifiers[id(node)] = ".".join(item.identifier for item in recognized)
        if current.kind is SymbolKind.UNRESOLVED:
            return et.UNKNOWN  # a method of an object that cannot be checked yet
        if current.kind is not SymbolKind.METHOD:
            self._issue(
                IssueKind.UNKNOWN_METHOD,
                node.method.start,
                node.method.end,
                "not_a_method",
                object=".".join(item.identifier for item in recognized[:-1]),
                method=current.name,
            )
            return et.UNKNOWN
        details = self._method_details(path, current)
        arguments = current.arguments
        count = len(node.args)
        if count < details["minimum"] or count > details["maximum"]:  # type: ignore[operator]
            self._issue(IssueKind.ARGUMENT_COUNT, node.start, node.end, "", found=count, **details)
        for index, argument in enumerate(node.args):
            if index < len(arguments):
                self._check_method_argument(details, index, arguments[index], argument)
        return current.value_type or et.UNKNOWN

    def _check_method_argument(
        self,
        details: dict[str, object],
        index: int,
        spec: ArgumentDescription,
        node: Node,
    ) -> None:
        """The value of an argument of a method must have the data type of the argument; a
        fixed text is checked against the values of a choice (the empty place is reported as
        such)."""
        expected = et.type_of(
            spec.datatype,
            tuple(item.id for item in spec.choices),
            spec.object_type,
            et.labels_of(spec.choices),
        )
        self.argument_types[id(node)] = expected
        found = self.types[id(node)]
        if found.is_unknown or isinstance(node, Slot):
            return
        mismatch = et.mismatch_with(expected, found, self.display)
        if mismatch is not None and mismatch.reason == "choice_value":
            self._report_choice_value(node, mismatch, "method_argument")
        elif mismatch is not None and mismatch.reason == "instrument":
            self._report_instrument(node, mismatch)
        elif mismatch is not None or not _integer_fits(spec.datatype, node):
            self._issue(
                IssueKind.TYPE_MISMATCH,
                node.start,
                node.end,
                "method_argument",
                expected=spec.datatype.value,
                found=found.describe(),
                argument=spec.id,
                index=index,
                **{key: details[key] for key in ("object", "method")},
            )

    # operators ----------------------------------------------------------------------

    def _binary(self, node: Binary) -> ExprType:
        left_type = self.types[id(node.left)]
        right_type = self.types[id(node.right)]
        operator = node.op
        if operator in _ARITHMETIC:
            for side, found in ((node.left, left_type), (node.right, right_type)):
                if not (found.is_unknown or found.is_numeric):
                    self._mismatch(side, "operand", "number", found, operator=operator)
            return et.NUMBER
        if operator == "&":
            for side, found in ((node.left, left_type), (node.right, right_type)):
                if not (found.is_unknown or found.is_numeric or found.is_text_like):
                    self._mismatch(side, "operand", "text", found, operator=operator)
            return et.TEXT
        self._comparison(node, left_type, right_type)
        return et.BOOLEAN

    def _comparison(self, node: Binary, left: ExprType, right: ExprType) -> None:
        if not et.families_match(left, right):
            self._issue(
                IssueKind.TYPE_MISMATCH,
                node.start,
                node.end,
                "comparison",
                operator=node.op,
                left=left.describe(),
                right=right.describe(),
            )
            return
        if node.op in _ORDERING:
            for found in (left, right):
                orderable = (
                    found.is_unknown
                    or found.is_numeric
                    or found.datatype in (DataType.TEXT, DataType.TIMESTAMP, DataType.DATE)
                )
                if not orderable:
                    self._issue(
                        IssueKind.TYPE_MISMATCH,
                        node.start,
                        node.end,
                        "ordering",
                        operator=node.op,
                        found=found.describe(),
                    )
                    return
        for choice_side, other, other_node in (
            (left, right, node.right),
            (right, left, node.left),
        ):
            mismatch = et.literal_mismatch(choice_side, other, self.display)
            if mismatch is not None:
                self._report_choice_value(other_node, mismatch, "comparison")

    def _report_choice_value(self, node: Node, mismatch: et.Mismatch, reason: str) -> None:
        """Report a text that is no value of the choice, at the text itself: a text that
        stands for the result of ``node`` (also in the branches of ``IF``)."""
        bad = set(mismatch.values)
        targets: list[Node] = [item for item in result_texts(node) if item.value in bad]
        if not targets:
            targets = [node]
        for target in targets:
            values = [target.value] if isinstance(target, String) else list(mismatch.values)
            self._issue(
                IssueKind.UNKNOWN_CHOICE_VALUE,
                target.start,
                target.end,
                reason,
                values=values,
                allowed=list(mismatch.allowed),
            )

    def _report_instrument(self, node: Node, mismatch: et.Mismatch) -> None:
        """Report a fixed text in the place of an instrument that is no valid designation."""
        bad = set(mismatch.values)
        targets: list[Node] = [item for item in result_texts(node) if item.value in bad]
        if not targets:
            targets = [node]
        for target in targets:
            values = [target.value] if isinstance(target, String) else list(mismatch.values)
            self._issue(IssueKind.INVALID_INSTRUMENT, target.start, target.end, values=values)

    # functions ----------------------------------------------------------------------

    def _call(self, node: Call) -> ExprType:
        signature = find_function(node.name)
        if signature is None:
            self._issue(IssueKind.UNKNOWN_FUNCTION, node.name_start, node.name_end, name=node.name)
            return et.UNKNOWN
        self.functions.append(RecognizedFunction(signature.name, node.name_start, node.name_end))
        if node.name != signature.name:
            self.replacements.append((node.name_start, node.name_end, signature.name))
        count = len(node.args)
        maximum = signature.max_arguments
        if count < signature.min_arguments or (maximum is not None and count > maximum):
            self._issue(
                IssueKind.ARGUMENT_COUNT,
                node.start,
                node.end,
                function=signature.name,
                minimum=signature.min_arguments,
                maximum=maximum,
                found=count,
            )
        arg_types = [self.types[id(arg)] for arg in node.args]
        for index, argument in enumerate(node.args):
            if index < len(signature.parameters):
                kind: ArgumentKind | None = signature.parameters[index].kind
            else:
                kind = signature.variadic
            if kind is not None:
                self._check_argument(signature.name, index, kind, argument, arg_types[index])
        return self._call_result(node, signature.name, signature.result, arg_types)

    def _check_argument(
        self, function: str, index: int, kind: ArgumentKind, node: Node, found: ExprType
    ) -> None:
        if kind is ArgumentKind.ANY:
            return
        if kind is ArgumentKind.NAME:
            self._check_previous_argument(function, node)
            return
        if found.is_unknown:
            return
        if kind is ArgumentKind.BOOLEAN:
            ok = found.datatype is DataType.BOOLEAN
        else:
            ok = found.is_numeric
        if kind is ArgumentKind.INTEGER and isinstance(node, Number):
            ok = ok and isinstance(node.value, int) and node.value >= 1 and not node.percent
        if not ok:
            self._mismatch(node, "argument", kind.value, found, function=function, index=index)

    def _check_previous_argument(self, function: str, node: Node) -> None:
        """The first argument of ``PREVIOUS`` is a name or the result of a method for which the
        fachmodell defines an earlier value (specification 3.4); every other argument is an
        error."""
        if isinstance(node, Slot):
            return  # an empty place is reported as such
        if not isinstance(node, Name | MethodCall):
            self._issue(
                IssueKind.PREVIOUS_ARGUMENT, node.start, node.end, "not_a_name", function=function
            )
            return
        symbol = self.name_symbols.get(id(node))
        if symbol is None:
            return  # an unknown name is reported as such
        if not symbol.previous_value:
            self._issue(
                IssueKind.PREVIOUS_ARGUMENT,
                node.start,
                node.end,
                "no_earlier_value",
                function=function,
                name=self.name_identifiers.get(id(node), ""),
            )

    def _call_result(
        self, node: Call, function: str, result: ResultKind, arg_types: list[ExprType]
    ) -> ExprType:
        if result is ResultKind.NUMBER:
            return et.NUMBER
        if result is ResultKind.BOOLEAN:
            return et.BOOLEAN
        if result is ResultKind.FIRST_ARGUMENT:
            return arg_types[0] if arg_types else et.UNKNOWN
        # the common type of the value arguments: IF(condition; then; else), IFNA(a; b)
        values = arg_types[1:] if function == "IF" else arg_types
        if not values:
            return et.UNKNOWN
        combined = values[0]
        for other in values[1:]:
            merged = et.unify(combined, other)
            if merged is None:
                self._issue(
                    IssueKind.TYPE_MISMATCH,
                    node.start,
                    node.end,
                    "branches",
                    function=function,
                    left=combined.describe(),
                    right=other.describe(),
                )
                return et.UNKNOWN
            combined = merged
        return combined
