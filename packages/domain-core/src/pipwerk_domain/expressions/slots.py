"""Removing an object from the expressions that use it (specification 3.4): every use becomes an
empty place (``[]``). An expression with a syntax problem stays as it is; the check then reports
the key as an unknown name."""

from collections.abc import Sequence

from pipwerk_domain.expressions.checker import Analysis, analyze
from pipwerk_domain.expressions.symbols import Environment


def _matches(analysis: Analysis, prefixes: Sequence[tuple[str, ...]]) -> list[tuple[int, int]]:
    """The places of the names that begin with one of the prefixes."""
    if analysis.tree is None or not prefixes:
        return []
    wanted = [tuple(item.lower() for item in prefix) for prefix in prefixes if prefix]
    edits: list[tuple[int, int]] = []
    for name in analysis.names:
        parts = [segment.identifier.lower() for segment in name.segments]
        parts += [segment.text.lower() for segment in name.written[len(parts) :]]
        if any(tuple(parts[: len(prefix)]) == prefix for prefix in wanted):
            edits.append((name.start, name.end))
    return edits


def replace_prefixes_with_slot(
    source: str, environment: Environment, prefixes: Sequence[tuple[str, ...]]
) -> str:
    """The expression with every name that begins with the keys of one of the ``prefixes``
    replaced by an empty place. ``environment`` is the namespace of the expression *before* the
    object is removed, so that the names are recognized; upper and lower case are not
    distinguished. The expression is analyzed once, however many prefixes there are."""
    edits = _matches(analyze(source, environment), prefixes)
    text = source
    for start, end in sorted(edits, reverse=True):
        text = text[:start] + "[]" + text[end:]
    return text


def replace_names_with_slot(source: str, environment: Environment, prefix: tuple[str, ...]) -> str:
    """The expression with every name that begins with the keys in ``prefix`` replaced by an
    empty place (see :func:`replace_prefixes_with_slot`)."""
    return replace_prefixes_with_slot(source, environment, [prefix])


def uses_prefix(source: str, environment: Environment, prefixes: Sequence[tuple[str, ...]]) -> bool:
    """Whether a name of the expression begins with the keys of one of the ``prefixes``."""
    return bool(_matches(analyze(source, environment), prefixes))
