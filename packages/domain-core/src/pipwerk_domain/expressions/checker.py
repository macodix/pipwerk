"""Type check of expressions and recognition of names (specification 3.4).

:func:`analyze` parses an expression and checks names, functions and types against an
environment. It returns the findings with position, the recognized names with position and
identifier (what the check endpoint of the web API needs) and the normalized spelling.
Nothing is evaluated.
"""

from dataclasses import dataclass, field
from enum import StrEnum

from pipwerk_domain.expressions import exprtypes as et
from pipwerk_domain.expressions.exprtypes import ExprType
from pipwerk_domain.expressions.functions import ArgumentKind, ResultKind, find_function
from pipwerk_domain.expressions.nodes import (
    Binary,
    Call,
    Group,
    Name,
    Node,
    Number,
    String,
    Unary,
    postorder,
)
from pipwerk_domain.expressions.parser import ParseResult, parse
from pipwerk_domain.expressions.symbols import Environment, Symbol, SymbolKind
from pipwerk_domain.limits import MAX_FINDINGS_PER_EXPRESSION
from pipwerk_domain.typedesc import DataType

_ORDERING = ("<", "<=", ">", ">=")
_ARITHMETIC = ("+", "-", "*", "/", "^")


def _result_texts(node: Node) -> list[String]:
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
    TYPE_MISMATCH = "type_mismatch"
    UNKNOWN_CHOICE_VALUE = "unknown_choice_value"
    ARGUMENT_COUNT = "argument_count"


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
    otherwise ``segments`` are the recognized first parts."""

    start: int
    end: int
    identifier: str
    segments: tuple[RecognizedSegment, ...]
    resolved: bool
    symbols: tuple[Symbol, ...]


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

    def __post_init__(self) -> None:
        self.parsed_ok = self.tree is not None

    @property
    def ok(self) -> bool:
        return not self.issues

    def release(self) -> None:
        """Drop the syntax tree and the recognized names and functions, which take most of
        the memory, once the findings of the expression have been used."""
        self.tree = None
        self.names = []
        self.functions = []


def analyze(
    source: str,
    environment: Environment,
    expected: ExprType | None = None,
    parsed: ParseResult | None = None,
) -> Analysis:
    """Parse and check an expression.

    ``expected`` is the type the result must have (for example the data type of the
    property that a rule determines); fixed texts are checked against the values of a
    choice. ``parsed`` is the result of ``parse(source)`` if the caller has it already.
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
        )
    checker = _Checker(source, environment)
    return checker.run(parsed.tree, expected)


def normalize_expression(source: str, environment: Environment) -> str:
    """Write an expression with names in the spelling of their identifiers and functions
    in the spelling of the norm. Only recognized names and function names change; every
    other character stays as it is. An expression with a syntax problem stays unchanged."""
    return analyze(source, environment).normalized


class _Checker:
    def __init__(self, source: str, environment: Environment) -> None:
        self.source = source
        self.environment = environment
        self.issues: list[ExpressionIssue] = []
        self.names: list[RecognizedName] = []
        self.functions: list[RecognizedFunction] = []
        self.replacements: list[tuple[int, int, str]] = []
        self.types: dict[int, ExprType] = {}
        self.truncated = False

    def run(self, tree: Node, expected: ExprType | None) -> Analysis:
        for node in postorder(tree):
            self.types[id(node)] = self._type_of(node)
        result = self.types[id(tree)]
        if expected is not None:
            self._check_expected(tree, result, expected)
        self.issues.sort(key=lambda item: (item.start, item.end))
        self.names.sort(key=lambda item: item.start)
        self.functions.sort(key=lambda item: item.start)
        return Analysis(
            self.source,
            tree,
            self.issues,
            self.names,
            self.functions,
            result,
            self._normalized(),
            self.truncated,
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
        mismatch = et.mismatch_with(expected, result)
        if mismatch is None:
            return
        if mismatch.reason == "choice_value":
            self._report_choice_value(tree, mismatch, "result")
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
        return et.UNKNOWN  # pragma: no cover - all node types are handled above

    # names --------------------------------------------------------------------------

    def _name(self, node: Name) -> ExprType:
        segments = node.segments
        first = segments[0]
        symbol = self.environment.resolve(first.text)
        if symbol is None:
            self._issue(IssueKind.UNKNOWN_NAME, first.start, first.end, name=first.text)
            self.names.append(RecognizedName(node.start, node.end, "", (), False, ()))
            return et.UNKNOWN
        path = [symbol]
        recognized = [RecognizedSegment(first.start, first.end, symbol.name)]
        self.replacements.append((first.start, first.end, symbol.name))
        current = symbol
        for segment in segments[1:]:
            member = current.member(segment.text)
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
        node: Name,
        path: list[Symbol],
        recognized: list[RecognizedSegment],
        *,
        resolved: bool,
    ) -> None:
        self.names.append(
            RecognizedName(
                node.start,
                node.end,
                ".".join(item.identifier for item in recognized),
                tuple(recognized),
                resolved,
                tuple(path),
            )
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
            mismatch = et.literal_mismatch(choice_side, other)
            if mismatch is not None:
                self._report_choice_value(other_node, mismatch, "comparison")

    def _report_choice_value(self, node: Node, mismatch: et.Mismatch, reason: str) -> None:
        """Report a text that is no value of the choice, at the text itself: a text that
        stands for the result of ``node`` (also in the branches of ``IF``)."""
        bad = set(mismatch.values)
        targets: list[Node] = [item for item in _result_texts(node) if item.value in bad]
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
            if not isinstance(node, Name):
                self._mismatch(node, "argument", "name", found, function=function, index=index)
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
