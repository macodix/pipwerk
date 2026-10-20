"""Syntax tree of an expression. Positions are character offsets into the source text;
``start`` is the first character, ``end`` the position after the last character.

The nodes are not compared by value (``eq=False``): a comparison of two deep trees would
recurse. They are not changed after the parser has built them; they are plain classes
because creating them is much faster than creating frozen ones.
"""

from dataclasses import dataclass


@dataclass(slots=True, eq=False)
class Node:
    start: int
    end: int


@dataclass(slots=True, eq=False)
class Number(Node):
    value: int | float
    percent: bool = False


@dataclass(slots=True, eq=False)
class String(Node):
    value: str


@dataclass(slots=True, eq=False)
class Slot(Node):
    """An empty place (``[]``): a value that is missing and has to be chosen."""


@dataclass(slots=True, eq=False)
class NameSegment:
    text: str
    start: int
    end: int
    bracketed: bool = False


@dataclass(slots=True, eq=False)
class Name(Node):
    segments: tuple[NameSegment, ...]


@dataclass(slots=True, eq=False)
class Group(Node):
    inner: Node


@dataclass(slots=True, eq=False)
class Unary(Node):
    op: str
    operand: Node


@dataclass(slots=True, eq=False)
class Binary(Node):
    op: str
    left: Node
    right: Node


@dataclass(slots=True, eq=False)
class Call(Node):
    name: str
    name_start: int
    name_end: int
    args: tuple[Node, ...]
    arg_separators: tuple[int, ...] = ()
    """Positions of the separators ``;`` between the arguments."""


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


def names_and_calls(root: Node) -> tuple[list[Name], list[Call]]:
    """All names and function calls of a tree, without recursion and without building the
    list of all nodes."""
    names: list[Name] = []
    calls: list[Call] = []
    stack: list[Node] = [root]
    while stack:
        node = stack.pop()
        kind = type(node)
        if kind is Name:
            names.append(node)  # type: ignore[arg-type]
        elif kind is Binary:
            stack.append(node.left)  # type: ignore[attr-defined]
            stack.append(node.right)  # type: ignore[attr-defined]
        elif kind is Call:
            calls.append(node)  # type: ignore[arg-type]
            stack.extend(node.args)  # type: ignore[attr-defined]
        elif kind is Group:
            stack.append(node.inner)  # type: ignore[attr-defined]
        elif kind is Unary:
            stack.append(node.operand)  # type: ignore[attr-defined]
    return names, calls


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
