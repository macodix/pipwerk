"""Removing an object from the expressions that use it (specification 3.4): every use becomes an
empty place (``[]``). An expression with a syntax problem stays as it is; the check then reports
the key as an unknown name."""

from pipwerk_domain.expressions.checker import analyze
from pipwerk_domain.expressions.symbols import Environment


def replace_names_with_slot(source: str, environment: Environment, prefix: tuple[str, ...]) -> str:
    """The expression with every name that begins with the keys in ``prefix`` replaced by an
    empty place. ``environment`` is the namespace of the expression *before* the object is
    removed, so that the names are recognized; upper and lower case are not distinguished."""
    analysis = analyze(source, environment)
    if analysis.tree is None or not prefix:
        return source
    wanted = tuple(item.lower() for item in prefix)
    edits: list[tuple[int, int]] = []
    for name in analysis.names:
        parts = [segment.identifier.lower() for segment in name.segments]
        parts += [segment.text.lower() for segment in name.written[len(parts) :]]
        if tuple(parts[: len(wanted)]) == wanted:
            edits.append((name.start, name.end))
    text = source
    for start, end in sorted(edits, reverse=True):
        text = text[:start] + "[]" + text[end:]
    return text
