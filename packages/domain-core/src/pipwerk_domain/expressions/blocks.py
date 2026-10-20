"""Blocks (specification 3.4, req-ui-015): an expression without a syntax problem as a tree of
blocks, and the expression of a tree of blocks.

Blocks are: a value (a name of a property, result, strategy parameter or parameter, a fixed
value or an empty place), comparison, arithmetic, logic (and, or, not), case distinction,
every other function of the list and the crossing. The crossing "A crosses B upwards" stands
for ``AND(PREVIOUS(A) <= PREVIOUS(B); A > B)``, "downwards" for ``AND(PREVIOUS(A) >= PREVIOUS(B);
A < B)``, "in either direction" for the ``OR`` of both. ``PREVIOUS`` stands only around a value
for which the fachmodell defines an earlier value; every other value stands at both places
itself. The library recognizes this form when it breaks an expression down, also inside
``AND`` and ``OR``.

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
    Name,
    Node,
    Number,
    Slot,
    String,
    Unary,
    postorder,
)
from pipwerk_domain.expressions.symbols import Environment, Symbol


class BlockKind(StrEnum):
    EMPTY = "empty"
    NAME = "name"
    LITERAL = "literal"
    COMPARISON = "comparison"
    ARITHMETIC = "arithmetic"
    LOGIC = "logic"
    IF = "if"
    FUNCTION = "function"
    CROSSING = "crossing"


COMPARISON_OPERATORS = ("=", "<>", "<", "<=", ">", ">=")
ARITHMETIC_OPERATORS = ("+", "-", "*", "/", "^", "&")
LOGIC_OPERATORS = ("and", "or", "not")
CROSSING_DIRECTIONS = ("up", "down", "any")
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
    direction: str | None = None
    children: tuple[Block, ...] = ()
    symbols: tuple[Symbol, ...] = field(default=(), compare=False, repr=False)
    type: ExprType | None = field(default=None, compare=False, repr=False)
    previous_value: bool = field(default=False, compare=False, repr=False)


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
    return _recognize(built[id(tree)])


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


def _name_block(node: Name, recognized: RecognizedName | None, node_type: ExprType | None) -> Block:
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
        symbols=symbols,
        type=node_type,
        previous_value=previous,
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


def _is_atomic(block: Block) -> bool:
    return block.kind in (BlockKind.NAME, BlockKind.LITERAL, BlockKind.EMPTY)


def _previous_of(block: Block) -> Block:
    """The block ``PREVIOUS(value)`` around a value that has an earlier value."""
    return Block(BlockKind.FUNCTION, function="PREVIOUS", children=(block,))


def _crossing_pair(first: Block, second: Block) -> Block | None:
    """The crossing that the two comparisons make up, or ``None``."""
    if first.kind is not BlockKind.COMPARISON or second.kind is not BlockKind.COMPARISON:
        return None
    if (first.operator, second.operator) == ("<=", ">"):
        direction = "up"
    elif (first.operator, second.operator) == (">=", "<"):
        direction = "down"
    else:
        return None
    left, right = second.children
    if not (_is_atomic(left) and _is_atomic(right)):
        return None
    if not (left.previous_value or right.previous_value):
        return None  # nothing can cross
    expected_left = _previous_of(left) if left.previous_value else left
    expected_right = _previous_of(right) if right.previous_value else right
    if first.children != (expected_left, expected_right):
        return None
    return Block(BlockKind.CROSSING, direction=direction, children=(left, right))


def _recognize(root: Block) -> Block:
    """Recognize the crossings in the whole tree, from the leaves up."""
    order: list[Block] = []
    stack = [root]
    while stack:
        block = stack.pop()
        order.append(block)
        stack.extend(block.children)
    order.reverse()
    result: dict[int, Block] = {}
    for original in order:
        children = tuple(result[id(item)] for item in original.children)
        block = original
        if original.kind is BlockKind.LOGIC and original.operator == "and":
            block = _merge_and(original, children)
        elif original.kind is BlockKind.LOGIC and original.operator == "or":
            block = _merge_or(original, children)
        elif any(new is not old for new, old in zip(children, original.children, strict=True)):
            block = _with_children(original, children)
        result[id(original)] = block
    return result[id(root)]


def _with_children(block: Block, children: tuple[Block, ...]) -> Block:
    return Block(
        block.kind,
        block.path,
        block.value,
        block.datatype,
        block.operator,
        block.function,
        block.direction,
        children,
        block.symbols,
        block.type,
        block.previous_value,
    )


def _merge_and(block: Block, children: tuple[Block, ...]) -> Block:
    merged: list[Block] = []
    index = 0
    while index < len(children):
        crossing = (
            _crossing_pair(children[index], children[index + 1])
            if index + 1 < len(children)
            else None
        )
        if crossing is not None:
            merged.append(crossing)
            index += 2
        else:
            merged.append(children[index])
            index += 1
    if len(merged) == 1 and merged[0].kind is BlockKind.CROSSING and len(children) == 2:
        return merged[0]
    return _with_children(block, tuple(merged))


def _merge_or(block: Block, children: tuple[Block, ...]) -> Block:
    merged: list[Block] = []
    index = 0
    while index < len(children):
        first = children[index]
        second = children[index + 1] if index + 1 < len(children) else None
        if (
            second is not None
            and first.kind is BlockKind.CROSSING
            and second.kind is BlockKind.CROSSING
            and first.direction == "up"
            and second.direction == "down"
            and first.children == second.children
        ):
            merged.append(Block(BlockKind.CROSSING, direction="any", children=first.children))
            index += 2
        else:
            merged.append(first)
            index += 1
    if len(merged) == 1 and merged[0].direction == "any" and len(children) == 2:
        return merged[0]
    return _with_children(block, tuple(merged))


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


def blocks_to_text(root: Block, environment: Environment | None = None) -> str:
    """The expression (stored form, names as keys) of a tree of blocks.

    ``environment`` tells which names have an earlier value, for the text of a crossing;
    without it no name has one. Raises :class:`BlockError` for a tree that is no expression.
    """
    order: list[Block] = []
    stack = [root]
    while stack:
        block = stack.pop()
        order.append(block)
        stack.extend(block.children)
    order.reverse()
    texts: dict[int, str] = {}
    for block in order:
        texts[id(block)] = _text_of(block, texts, environment)
    return texts[id(root)]


def _has_previous(block: Block, environment: Environment | None) -> bool:
    """Whether the fachmodell defines an earlier value for the value ``block``."""
    if block.kind is not BlockKind.NAME or environment is None or not block.path:
        return False
    symbol = environment.resolve(block.path[0])
    for part in block.path[1:]:
        if symbol is None:
            return False
        symbol = symbol.member(part)
    return symbol is not None and symbol.previous_value


def _wrapped(block: Block, text: str, environment: Environment | None) -> str:
    return f"PREVIOUS({text})" if _has_previous(block, environment) else text


def _crossing_parts(
    block: Block, texts: dict[int, str], environment: Environment | None
) -> list[str]:
    """The texts of the two comparisons that make up an upward or downward crossing."""
    if len(block.children) != 2:
        raise BlockError("crossing_children")
    left, right = block.children
    if not (_is_atomic(left) and _is_atomic(right)):
        raise BlockError("crossing_operand")
    a, b = texts[id(left)], texts[id(right)]
    pa, pb = _wrapped(left, a, environment), _wrapped(right, b, environment)
    if block.direction == "up":
        return [f"{pa} <= {pb}", f"{a} > {b}"]
    return [f"{pa} >= {pb}", f"{a} < {b}"]


def _text_of(block: Block, texts: dict[int, str], environment: Environment | None) -> str:
    kind = block.kind
    children = [texts[id(item)] for item in block.children]
    if kind is BlockKind.EMPTY:
        return "[]"
    if kind is BlockKind.NAME:
        return _name_text(block.path)
    if kind is BlockKind.LITERAL:
        return literal_text(block)
    if kind is BlockKind.COMPARISON or kind is BlockKind.ARITHMETIC:
        return _operation_text(block, children)
    if kind is BlockKind.LOGIC:
        return _logic_text(block, texts, environment)
    if kind is BlockKind.IF:
        if len(children) not in (2, 3):
            raise BlockError("if_children", count=len(children))
        return f"IF({'; '.join(children)})"
    if kind is BlockKind.FUNCTION:
        signature = find_function(block.function or "")
        if signature is None:
            raise BlockError("function", function=block.function or "")
        return f"{signature.name}({'; '.join(children)})"
    if kind is BlockKind.CROSSING:
        return _crossing_text(block, texts, environment)
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


def _logic_text(block: Block, texts: dict[int, str], environment: Environment | None) -> str:
    operator = block.operator
    if operator not in LOGIC_OPERATORS:
        raise BlockError("operator", operator=operator or "")
    parts: list[str] = []
    for child in block.children:
        if child.kind is BlockKind.CROSSING and operator == "and" and child.direction != "any":
            parts.extend(_crossing_parts(child, texts, environment))
        elif child.kind is BlockKind.CROSSING and operator == "or" and child.direction == "any":
            parts.extend(_crossing_texts(child, texts, environment))
        else:
            parts.append(texts[id(child)])
    if operator == "not" and len(parts) != 1:
        raise BlockError("operand_count", operator="not")
    if not parts:
        raise BlockError("operand_count", operator=operator)
    return f"{(operator or '').upper()}({'; '.join(parts)})"


def _crossing_texts(
    block: Block, texts: dict[int, str], environment: Environment | None
) -> list[str]:
    """The texts of the two crossings that make up a crossing in either direction."""
    up = Block(BlockKind.CROSSING, direction="up", children=block.children)
    down = Block(BlockKind.CROSSING, direction="down", children=block.children)
    return [f"AND({'; '.join(_crossing_parts(item, texts, environment))})" for item in (up, down)]


def _crossing_text(block: Block, texts: dict[int, str], environment: Environment | None) -> str:
    if block.direction not in CROSSING_DIRECTIONS:
        raise BlockError("direction", direction=block.direction or "")
    if block.direction == "any":
        return f"OR({'; '.join(_crossing_texts(block, texts, environment))})"
    return f"AND({'; '.join(_crossing_parts(block, texts, environment))})"
