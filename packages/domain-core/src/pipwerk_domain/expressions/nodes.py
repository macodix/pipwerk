"""Syntax tree of an expression. Positions are character offsets into the source text;
``start`` is the first character, ``end`` the position after the last character."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Node:
    start: int
    end: int


@dataclass(frozen=True, slots=True)
class Number(Node):
    value: int | float
    percent: bool = False


@dataclass(frozen=True, slots=True)
class String(Node):
    value: str


@dataclass(frozen=True, slots=True)
class NameSegment:
    text: str
    start: int
    end: int


@dataclass(frozen=True, slots=True)
class Name(Node):
    segments: tuple[NameSegment, ...]


@dataclass(frozen=True, slots=True)
class Group(Node):
    inner: Node


@dataclass(frozen=True, slots=True)
class Unary(Node):
    op: str
    operand: Node


@dataclass(frozen=True, slots=True)
class Binary(Node):
    op: str
    left: Node
    right: Node


@dataclass(frozen=True, slots=True)
class Call(Node):
    name: str
    name_start: int
    name_end: int
    args: tuple[Node, ...]


def children(node: Node) -> tuple[Node, ...]:
    """The direct child nodes of a node."""
    match node:
        case Group(inner=inner):
            return (inner,)
        case Unary(operand=operand):
            return (operand,)
        case Binary(left=left, right=right):
            return (left, right)
        case Call(args=args):
            return args
        case _:
            return ()


def postorder(root: Node) -> list[Node]:
    """All nodes, every node after all of its descendants. Iterative, so the depth of the
    tree is not limited by the recursion limit of Python."""
    order: list[Node] = []
    stack: list[Node] = [root]
    while stack:
        node = stack.pop()
        order.append(node)
        stack.extend(children(node))
    order.reverse()
    return order
