"""Stored form and display form of an expression (specification 3.4).

The stored form has the keys of the objects and the values of a choice by their identifiers.
The display form has the names of the user and the labels of the objects of the application,
of their properties and of the values of a choice in the chosen language; a name that is not
a simple name stands in square brackets: ``[EMA 20].Wert``, ``Strategie.[Stop-Abstand]``.
Both forms keep the spacing and the line feeds of the text. The conversion goes in both
directions; on input both forms and both languages are accepted.
"""

from dataclasses import dataclass

from pipwerk_domain.expressions.checker import Analysis, analyze, result_texts
from pipwerk_domain.expressions.exprtypes import ExprType
from pipwerk_domain.expressions.nodes import Binary, MethodCall, Node, String, postorder
from pipwerk_domain.expressions.symbols import Environment, normalized_name


@dataclass(frozen=True, slots=True)
class Rendering:
    """An expression in both forms and the analysis of the input."""

    stored: str
    display: str
    analysis: Analysis


def is_simple_name(text: str) -> bool:
    """Whether a name needs no square brackets: letters of any script, digits and ``_``, not
    starting with a digit."""
    return bool(text) and not text[0].isdigit() and text.replace("_", "a").isalnum()


def display_part(text: str) -> str:
    """A part of a name in the display form: in square brackets if it is no simple name."""
    return text if is_simple_name(text) else f"[{text}]"


def _quoted(text: str) -> str:
    return '"' + text.replace('"', '""') + '"'


def choice_contexts(analysis: Analysis, expected: ExprType | None) -> dict[int, ExprType]:
    """The fixed texts of an expression that stand for a value of a choice, by ``id`` of the
    node, with the type of the choice: the texts compared with a choice (``=`` and ``<>``) and
    the texts that make up the result where a choice is expected."""
    tree = analysis.tree
    found: dict[int, ExprType] = {}
    if tree is None:
        return found

    def mark(node: Node, choice: ExprType) -> None:
        for item in result_texts(node):
            found.setdefault(id(item), choice)

    for node in postorder(tree):
        if isinstance(node, Binary) and node.op in ("=", "<>"):
            left = analysis.types.get(id(node.left))
            right = analysis.types.get(id(node.right))
            if left is not None and left.choices and left.labels:
                mark(node.right, left)
            if right is not None and right.choices and right.labels:
                mark(node.left, right)
        elif isinstance(node, MethodCall):  # the argument of a method that is a choice
            for argument in node.args:
                wanted = analysis.argument_types.get(id(argument))
                if wanted is not None and wanted.choices and wanted.labels:
                    mark(argument, wanted)
    if expected is not None and expected.choices and expected.labels:
        mark(tree, expected)
    return found


def _to_stored_value(value: str, choice: ExprType) -> str:
    """The identifier of the value of a choice that a text names: by identifier, or by the label
    in either language."""
    assert choice.choices is not None and choice.labels is not None  # noqa: S101
    for identifier in choice.choices:
        if identifier == value:
            return identifier
    key = normalized_name(value)
    for identifier, label in zip(choice.choices, choice.labels, strict=False):
        if key in (normalized_name(label.de), normalized_name(label.en)):
            return identifier
    return value


def _to_display_value(value: str, choice: ExprType, language: str) -> str:
    assert choice.choices is not None and choice.labels is not None  # noqa: S101
    identifier = _to_stored_value(value, choice)
    for item, label in zip(choice.choices, choice.labels, strict=False):
        if item == identifier:
            return label.en if language == "en" else label.de
    return value


def render(
    source: str,
    environment: Environment,
    language: str,
    *,
    display_input: bool,
    expected: ExprType | None = None,
) -> Rendering:
    """Both forms of an expression. ``display_input`` says in which form ``source`` is
    written. An expression with a syntax problem stays as it is in both forms; names that are
    not recognized stay as written."""
    analysis = analyze(source, environment, expected, display=display_input)
    if analysis.tree is None:
        return Rendering(source, source, analysis)
    stored_edits: list[tuple[int, int, str]] = []
    display_edits: list[tuple[int, int, str]] = []
    for name in analysis.names:
        if not name.segments:
            continue
        start, end = name.segments[0].start, name.segments[-1].end
        stored_edits.append((start, end, ".".join(item.identifier for item in name.segments)))
        shown = [
            display_part(symbol.display_name(language))
            for symbol in name.symbols[: len(name.segments)]
        ]
        display_edits.append((start, end, ".".join(shown)))
    for function in analysis.functions:
        stored_edits.append((function.start, function.end, function.name))
        display_edits.append((function.start, function.end, function.name))
    contexts = choice_contexts(analysis, expected)
    if contexts:
        for node in postorder(analysis.tree):
            choice = contexts.get(id(node))
            if choice is not None and isinstance(node, String):
                stored_edits.append(
                    (node.start, node.end, _quoted(_to_stored_value(node.value, choice)))
                )
                display_edits.append(
                    (node.start, node.end, _quoted(_to_display_value(node.value, choice, language)))
                )
    return Rendering(_apply(source, stored_edits), _apply(source, display_edits), analysis)


def _apply(source: str, edits: list[tuple[int, int, str]]) -> str:
    text = source
    for start, end, replacement in sorted(edits, reverse=True):
        text = text[:start] + replacement + text[end:]
    return text
