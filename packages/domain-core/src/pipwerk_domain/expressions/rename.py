"""Renaming the keys in an expression of the stored form.

Used where the library gives objects new keys and the expressions that address them must follow:
the conversion from the format 1.0 and the insertion of a template (specification 3.3, 3.7).
Only the first part of a name is replaced, and only an exact key; texts, numbers, functions and
the parts behind a point stay as written.
"""

from collections.abc import Callable, Mapping

from pipwerk_domain.expressions.lexer import SyntaxProblem, TokenKind, tokenize

type Rewrite = Callable[[str], str]


def identity(text: str) -> str:
    return text


def compose(first: Rewrite, second: Rewrite) -> Rewrite:
    """The rewrite that applies ``first``, then ``second``."""
    if first is identity:
        return second
    if second is identity:
        return first
    return lambda text: second(first(text))


def renamer(mapping: Mapping[str, str]) -> Rewrite:
    """A function that replaces the first part of a name in an expression that equals a
    key of ``mapping`` (in lower case; upper and lower case are not distinguished) by the new key.
    An expression with a spelling error stays as it is."""
    if not mapping:
        return identity

    def rewrite(text: str) -> str:
        try:
            tokens = tokenize(text)
        except SyntaxProblem:
            return text
        edits: list[tuple[int, int, str]] = []
        for index, token in enumerate(tokens):
            if token.kind is not TokenKind.NAME or not token.parts or token.parts[0].bracketed:
                continue
            following = tokens[index + 1] if index + 1 < len(tokens) else None
            if (
                len(token.parts) == 1
                and following is not None
                and following.kind is TokenKind.LEFT_PAREN
            ):
                continue  # a function
            replacement = mapping.get(token.parts[0].text.lower())
            if replacement is not None:
                edits.append((token.parts[0].start, token.parts[0].end, replacement))
        for start, end, replacement in sorted(edits, reverse=True):
            text = text[:start] + replacement + text[end:]
        return text

    return rewrite
