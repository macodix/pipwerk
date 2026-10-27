"""Blocks (specification 3.4, req-ui-015): an expression without a syntax problem as a tree of
blocks, and the expression of a tree of blocks.

Blocks are: a value (a name of a property, result, strategy parameter or parameter, a fixed
value or an empty place), comparison, arithmetic, logic (and, or, not), case distinction and
every other function of the list. Every block is exactly one operator or one function; the
library does not join a sequence of blocks into a block of its own. A crossing of two lines
is no block: ``AND(PREVIOUS(A) <= PREVIOUS(B); A > B)`` is broken down into "previous value
of", comparisons and "and", also inside ``AND`` and ``OR``, and the tree gives back the same
expression.

Everything here works without recursion: the depth of an expression is not limited by the
recursion limit of Python.
"""

from dataclasses import dataclass, field
from decimal import Decimal
from enum import StrEnum

from pipwerk_domain.expressions.checker import Analysis, RecognizedName
from pipwerk_domain.expressions.exprtypes import ExprType
from pipwerk_domain.expressions.functions import find_function
from pipwerk_domain.expressions.nodes import (
    Binary,
    Call,
    Group,
    MethodCall,
    Name,
    Node,
    Number,
    Slot,
    String,
    Unary,
    postorder,
)
from pipwerk_domain.expressions.symbols import Symbol


class BlockKind(StrEnum):
    EMPTY = "empty"
    NAME = "name"
    LITERAL = "literal"
    COMPARISON = "comparison"
    ARITHMETIC = "arithmetic"
    LOGIC = "logic"
    IF = "if"
    FUNCTION = "function"


COMPARISON_OPERATORS = ("=", "<>", "<", "<=", ">", ">=")
ARITHMETIC_OPERATORS = ("+", "-", "*", "/", "^", "&")
LOGIC_OPERATORS = ("and", "or", "not")
LITERAL_TYPES = ("number", "integer", "percent", "text", "boolean")

_PRECEDENCE = {
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


class BlockError(ValueError):
    """A tree of blocks that is no expression: a reason code and the data for it."""

    def __init__(self, reason: str, **details: object) -> None:
        super().__init__(reason)
        self.reason = reason
        self.details = details


@dataclass(eq=True, slots=True)
class Block:
    """A block. ``children`` are the operands in the order of the expression. For a value
    that is a name ``path`` lists the keys; for a fixed value ``value`` and ``datatype`` are
    set (a percentage is the number as written, 5 for 5 %). ``symbols`` and ``type`` are
    what the library knew when it broke the expression down; they take no part in the
    comparison of blocks."""

    kind: BlockKind
    path: tuple[str, ...] = ()
    value: bool | int | float | str | None = None
    datatype: str | None = None
    operator: str | None = None
    function: str | None = None
    children: tuple[Block, ...] = ()
    symbols: tuple[Symbol, ...] = field(default=(), compare=False, repr=False)
    type: ExprType | None = field(default=None, compare=False, repr=False)
    previous_value: bool = field(default=False, compare=False, repr=False)
    call: bool = False
    """For a value that is a name: it is a method; ``path`` ends with the method and
    ``children`` are the blocks of the arguments (none for a method without arguments)."""


EMPTY = Block(BlockKind.EMPTY)


# --- expression -> blocks -------------------------------------------------------------------


def to_blocks(analysis: Analysis) -> Block | None:
    """The blocks of an analyzed expression (with its tree), ``None`` if the expression has a
    syntax problem."""
    tree = analysis.tree
    if tree is None:
        return None
    names = {item.start: item for item in analysis.names}
    built: dict[int, Block] = {}
    for node in postorder(tree):
        built[id(node)] = _block_of(node, built, names, analysis)
    return built[id(tree)]


def _block_of(
    node: Node, built: dict[int, Block], names: dict[int, RecognizedName], analysis: Analysis
) -> Block:
    node_type = analysis.types.get(id(node))
    match node:
        case Slot():
            return Block(BlockKind.EMPTY)
        case Number(value=value, percent=percent):
            datatype = "percent" if percent else ("integer" if isinstance(value, int) else "number")
            return Block(BlockKind.LITERAL, value=value, datatype=datatype, type=node_type)
        case String(value=value):
            return Block(BlockKind.LITERAL, value=value, datatype="text", type=node_type)
        case Name():
            return _name_block(node, names.get(node.start), node_type)
        case MethodCall(args=args):
            return _name_block(
                node,
                names.get(node.start),
                node_type,
                tuple(built[id(item)] for item in args),
                call=True,
            )
        case Group(inner=inner):
            return built[id(inner)]
        case Unary(op=op, operand=operand):
            return Block(BlockKind.ARITHMETIC, operator=op, children=(built[id(operand)],))
        case Binary(op=op, left=left, right=right):
            children = (built[id(left)], built[id(right)])
            if op in COMPARISON_OPERATORS:
                return Block(BlockKind.COMPARISON, operator=op, children=children)
            return Block(BlockKind.ARITHMETIC, operator=op, children=children)
        case Call(name=name, args=args):
            return _call_block(name, tuple(built[id(item)] for item in args))
    raise AssertionError("unknown node")  # pragma: no cover


def _name_block(
    node: Name | MethodCall,
    recognized: RecognizedName | None,
    node_type: ExprType | None,
    children: tuple[Block, ...] = (),
    *,
    call: bool = False,
) -> Block:
    path: list[str] = []
    symbols: tuple[Symbol, ...] = ()
    previous = False
    if recognized is not None:
        path = [segment.identifier for segment in recognized.segments]
        symbols = recognized.symbols
        path.extend(segment.text for segment in recognized.written[len(path) :])
        previous = recognized.resolved and bool(symbols) and symbols[-1].previous_value
    else:  # pragma: no cover - every name is recognized or reported
        path = [segment.text for segment in node.segments]
    return Block(
        BlockKind.NAME,
        path=tuple(path),
        children=children,
        symbols=symbols,
        type=node_type,
        previous_value=previous,
        call=call,
    )


def _call_block(name: str, children: tuple[Block, ...]) -> Block:
    signature = find_function(name)
    function = signature.name if signature is not None else name
    if function in ("TRUE", "FALSE") and not children:
        return Block(BlockKind.LITERAL, value=function == "TRUE", datatype="boolean")
    if function in ("AND", "OR", "NOT"):
        return Block(BlockKind.LOGIC, operator=function.lower(), children=children)
    if function == "IF":
        return Block(BlockKind.IF, children=children)
    return Block(BlockKind.FUNCTION, function=function, children=children)


# --- blocks -> expression -------------------------------------------------------------------


def _simple_name(text: str) -> bool:
    return bool(text) and (text[0].isalpha() or text[0] == "_") and text.replace("_", "a").isalnum()


def number_text(value: int | float, *, percent: bool = False) -> str:
    """The text of a number in an expression: a decimal number without an exponent."""
    if isinstance(value, bool):  # pragma: no cover - guarded by the callers
        raise BlockError("literal_value")
    text = str(value) if isinstance(value, int) else format(Decimal(repr(value)), "f")
    return f"{text}%" if percent else text


def _quote(text: str) -> str:
    return '"' + text.replace('"', '""') + '"'


def literal_text(block: Block) -> str:
    """The text of a fixed value."""
    value = block.value
    datatype = block.datatype
    if datatype == "boolean":
        if not isinstance(value, bool):
            raise BlockError("literal_value", datatype=datatype)
        return "TRUE()" if value else "FALSE()"
    if datatype == "text":
        if not isinstance(value, str):
            raise BlockError("literal_value", datatype=datatype)
        return _quote(value)
    if datatype in ("number", "integer", "percent"):
        if isinstance(value, bool) or not isinstance(value, int | float):
            raise BlockError("literal_value", datatype=datatype)
        if isinstance(value, float) and (value != value or value in (float("inf"), float("-inf"))):
            raise BlockError("literal_value", datatype=datatype)
        if datatype == "integer" and not isinstance(value, int):
            raise BlockError("literal_value", datatype=datatype)
        return number_text(value, percent=datatype == "percent")
    raise BlockError("literal_datatype", datatype=str(datatype))


def _name_text(path: tuple[str, ...]) -> str:
    if not path:
        raise BlockError("name_path")
    parts: list[str] = []
    for part in path:
        if _simple_name(part):
            parts.append(part)
        elif part and not any(char in part for char in "[]\n\r"):
            parts.append(f"[{part}]")
        else:
            raise BlockError("name_part", part=part)
    return ".".join(parts)


def _precedence_of(block: Block) -> int:
    if block.kind is BlockKind.COMPARISON:
        return _PRECEDENCE[block.operator or "="]
    if block.kind is BlockKind.ARITHMETIC:
        if len(block.children) == 1:
            return _UNARY_PRECEDENCE
        return _PRECEDENCE[block.operator or "+"]
    return 99


def blocks_to_text(root: Block) -> str:
    """The expression (stored form, names as keys) of a tree of blocks. Raises
    :class:`BlockError` for a tree that is no expression."""
    order: list[Block] = []
    stack = [root]
    while stack:
        block = stack.pop()
        order.append(block)
        stack.extend(block.children)
    order.reverse()
    texts: dict[int, str] = {}
    for block in order:
        texts[id(block)] = _text_of(block, texts)
    return texts[id(root)]


def _text_of(block: Block, texts: dict[int, str]) -> str:
    kind = block.kind
    children = [texts[id(item)] for item in block.children]
    if kind is BlockKind.EMPTY:
        return "[]"
    if kind is BlockKind.NAME:
        if block.call:
            if len(block.path) < 2:
                raise BlockError("name_path")  # a method belongs to an object
            return f"{_name_text(block.path)}({'; '.join(children)})"
        if children:
            raise BlockError("name_children")
        return _name_text(block.path)
    if kind is BlockKind.LITERAL:
        return literal_text(block)
    if kind is BlockKind.COMPARISON or kind is BlockKind.ARITHMETIC:
        return _operation_text(block, children)
    if kind is BlockKind.LOGIC:
        return _logic_text(block, texts)
    if kind is BlockKind.IF:
        if len(children) not in (2, 3):
            raise BlockError("if_children", count=len(children))
        return f"IF({'; '.join(children)})"
    if kind is BlockKind.FUNCTION:
        signature = find_function(block.function or "")
        if signature is None:
            raise BlockError("function", function=block.function or "")
        return f"{signature.name}({'; '.join(children)})"
    raise BlockError("kind")  # pragma: no cover


def _operation_text(block: Block, children: list[str]) -> str:
    operator = block.operator or ""
    allowed = COMPARISON_OPERATORS if block.kind is BlockKind.COMPARISON else ARITHMETIC_OPERATORS
    if operator not in allowed:
        raise BlockError("operator", operator=operator)
    if len(block.children) == 1:
        if block.kind is not BlockKind.ARITHMETIC or operator not in ("+", "-"):
            raise BlockError("operand_count", operator=operator)
        child = block.children[0]
        text = children[0]
        if _precedence_of(child) < _UNARY_PRECEDENCE:
            text = f"({text})"
        return f"{operator}{text}"
    if len(block.children) != 2:
        raise BlockError("operand_count", operator=operator)
    precedence = _PRECEDENCE[operator]
    left, right = block.children
    left_text, right_text = children
    if _precedence_of(left) < precedence:
        left_text = f"({left_text})"
    if _precedence_of(right) <= precedence:
        right_text = f"({right_text})"
    return f"{left_text} {operator} {right_text}"


def _logic_text(block: Block, texts: dict[int, str]) -> str:
    operator = block.operator
    if operator not in LOGIC_OPERATORS:
        raise BlockError("operator", operator=operator or "")
    parts = [texts[id(child)] for child in block.children]
    if operator == "not" and len(parts) != 1:
        raise BlockError("operand_count", operator="not")
    if not parts:
        raise BlockError("operand_count", operator=operator)
    return f"{(operator or '').upper()}({'; '.join(parts)})"
