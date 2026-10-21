"""Parser of the expressions: a selection of OpenFormula (specification 3.4).

The parser does not evaluate anything and uses no ``eval``. It works without recursion,
so nested expressions cannot exhaust the stack of Python.

Precedence from low to high: comparison ``= <> < <= > >=``, ``&``, ``+ -``, ``* /``,
``^``, then the prefix signs ``+`` and ``-`` (as in OpenFormula, ``-2^2`` is 4). All
binary operators group from the left. A percent sign follows a number.
"""

from dataclasses import dataclass

from pipwerk_domain.expressions.lexer import SyntaxProblem, Token, TokenKind, tokenize
from pipwerk_domain.expressions.nodes import (
    Binary,
    Call,
    Group,
    Name,
    NameSegment,
    Node,
    Number,
    Slot,
    String,
    Unary,
)
from pipwerk_domain.limits import MAX_EXPRESSION_LENGTH, MAX_EXPRESSION_NESTING

_BINARY_PRECEDENCE = {
    "=": 1,
    "<>": 1,
    "<": 1,
    "<=": 1,
    ">": 1,
    ">=": 1,
    "&": 2,
    "+": 3,
    "-": 3,
    "*": 4,
    "/": 4,
    "^": 5,
}
_UNARY_PRECEDENCE = 6


@dataclass(frozen=True, slots=True)
class SyntaxIssue:
    """A syntax problem of an expression with its position."""

    reason: str
    start: int
    end: int
    details: dict[str, str | int]


@dataclass(frozen=True, slots=True)
class ParseResult:
    """Result of parsing: the tree or the problem, never both."""

    tree: Node | None
    issue: SyntaxIssue | None


@dataclass(slots=True)
class _Pending:
    """A prefix sign or a binary operator waiting for its operands."""

    op: str
    start: int
    end: int
    unary: bool
    precedence: int


@dataclass(slots=True)
class _Frame:
    """An open group or function call."""

    kind: str  # "root", "group" or "call"
    start: int
    operands: list[Node]
    operators: list[_Pending]
    name: str = ""
    name_start: int = 0
    name_end: int = 0
    arguments: list[Node] | None = None
    separators: list[int] | None = None


def parse(source: str) -> ParseResult:
    """Parse an expression into a syntax tree or report the first problem."""
    if len(source) > MAX_EXPRESSION_LENGTH:
        return ParseResult(
            None,
            SyntaxIssue(
                "too_long",
                0,
                len(source),
                {"length": len(source), "maximum": MAX_EXPRESSION_LENGTH},
            ),
        )
    try:
        return ParseResult(_parse_tokens(tokenize(source)), None)
    except SyntaxProblem as problem:
        return ParseResult(
            None, SyntaxIssue(problem.reason, problem.start, problem.end, dict(problem.details))
        )


def _reduce_one(frame: _Frame) -> None:
    pending = frame.operators.pop()
    if pending.unary:
        operand = frame.operands.pop()
        frame.operands.append(Unary(pending.start, operand.end, pending.op, operand))
    else:
        right = frame.operands.pop()
        left = frame.operands.pop()
        frame.operands.append(Binary(left.start, right.end, pending.op, left, right))


def _reduce_all(frame: _Frame) -> None:
    while frame.operators:
        _reduce_one(frame)


def _unexpected(token: Token) -> SyntaxProblem:
    if token.kind is TokenKind.END:
        return SyntaxProblem("unexpected_end", token.start, token.end)
    shown = token.text if token.kind is not TokenKind.STRING else '"' + token.text + '"'
    return SyntaxProblem("unexpected_token", token.start, token.end, found=shown)


_NUMBER = TokenKind.NUMBER
_STRING = TokenKind.STRING
_NAME = TokenKind.NAME
_OPERATOR = TokenKind.OPERATOR
_LEFT = TokenKind.LEFT_PAREN
_RIGHT = TokenKind.RIGHT_PAREN
_PERCENT = TokenKind.PERCENT


def _parse_tokens(tokens: list[Token]) -> Node:
    frames: list[_Frame] = [_Frame("root", 0, [], [])]
    index = 0
    expecting_operand = True
    frame = frames[0]
    while True:
        token = tokens[index]
        kind = token.kind
        if expecting_operand:
            if kind is _NAME:
                index += 1
                if tokens[index].kind is _LEFT:
                    index = _open_call(frames, token, tokens, index)
                    # a call without arguments is complete at once, else arguments follow
                    frame_before = frame
                    frame = frames[-1]
                    expecting_operand = frame is not frame_before
                    continue
                frame.operands.append(_name_node(token))
                expecting_operand = False
            elif kind is _NUMBER:
                index += 1
                text = token.text
                value: int | float = float(text) if "." in text else int(text)
                end = token.end
                percent = tokens[index].kind is _PERCENT
                if percent:
                    end = tokens[index].end
                    index += 1
                frame.operands.append(Number(token.start, end, value, percent))
                expecting_operand = False
            elif kind is _STRING:
                index += 1
                frame.operands.append(String(token.start, token.end, token.text))
                expecting_operand = False
            elif kind is _LEFT:
                if len(frames) > MAX_EXPRESSION_NESTING:
                    raise SyntaxProblem(
                        "too_deep", token.start, token.end, maximum=MAX_EXPRESSION_NESTING
                    )
                index += 1
                frame = _Frame("group", token.start, [], [])
                frames.append(frame)
            elif kind is _OPERATOR and token.text in ("+", "-"):
                index += 1
                frame.operators.append(
                    _Pending(token.text, token.start, token.end, True, _UNARY_PRECEDENCE)
                )
            else:
                raise _unexpected(token)
            continue
        # an operand is complete; an operator, a separator or a closing parenthesis follows
        if kind is _OPERATOR:
            index += 1
            precedence = _BINARY_PRECEDENCE[token.text]
            operators = frame.operators
            while operators and operators[-1].precedence >= precedence:
                _reduce_one(frame)
            operators.append(_Pending(token.text, token.start, token.end, False, precedence))
            expecting_operand = True
        elif token.kind is TokenKind.SEMICOLON and frame.kind == "call":
            index += 1
            _reduce_all(frame)
            assert frame.arguments is not None  # noqa: S101 - set when the call was opened
            assert frame.separators is not None  # noqa: S101 - set when the call was opened
            frame.arguments.append(frame.operands.pop())
            frame.separators.append(token.start)
            expecting_operand = True
        elif token.kind is TokenKind.RIGHT_PAREN and frame.kind in ("group", "call"):
            index += 1
            _reduce_all(frame)
            frames.pop()
            result = frame.operands.pop()
            parent = frames[-1]
            closed, frame = frame, parent
            if closed.kind == "group":
                parent.operands.append(Group(closed.start, token.end, result))
            else:
                assert closed.arguments is not None  # noqa: S101 - set when the call was opened
                closed.arguments.append(result)
                parent.operands.append(
                    Call(
                        closed.start,
                        token.end,
                        closed.name,
                        closed.name_start,
                        closed.name_end,
                        tuple(closed.arguments),
                        tuple(closed.separators or ()),
                    )
                )
        elif token.kind is TokenKind.END and frame.kind == "root":
            _reduce_all(frame)
            return frame.operands.pop()
        else:
            raise _unexpected(token)


def _name_node(token: Token) -> Name | Slot:
    """The node of a name; ``[]`` alone is the empty place, in a longer name it is a syntax
    problem."""
    parts = token.parts
    if len(parts) == 1 and parts[0].bracketed and parts[0].text == "":
        return Slot(token.start, token.end)
    for part in parts:
        if part.bracketed and part.text == "":
            raise SyntaxProblem("empty_part", part.start, part.end)
    return Name(
        token.start,
        token.end,
        tuple(NameSegment(part.text, part.start, part.end, part.bracketed) for part in parts),
    )


def _open_call(frames: list[_Frame], name: Token, tokens: list[Token], index: int) -> int:
    """Open a function call; ``index`` points to the opening parenthesis. A call without
    arguments is closed at once. Returns the index of the next token."""
    left = tokens[index]
    if len(frames) > MAX_EXPRESSION_NESTING:
        raise SyntaxProblem("too_deep", left.start, left.end, maximum=MAX_EXPRESSION_NESTING)
    index += 1
    parent = frames[-1]
    if tokens[index].kind is TokenKind.RIGHT_PAREN:
        closing = tokens[index]
        parent.operands.append(Call(name.start, closing.end, name.text, name.start, name.end, ()))
        return index + 1
    frames.append(
        _Frame(
            "call",
            name.start,
            [],
            [],
            name=name.text,
            name_start=name.start,
            name_end=name.end,
            arguments=[],
            separators=[],
        )
    )
    return index
