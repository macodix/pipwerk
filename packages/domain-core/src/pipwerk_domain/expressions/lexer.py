"""Splitting an expression into tokens (hand written, no parser generator)."""

import re
from enum import StrEnum
from typing import NamedTuple


class TokenKind(StrEnum):
    NUMBER = "number"
    STRING = "string"
    NAME = "name"
    OPERATOR = "operator"
    LEFT_PAREN = "("
    RIGHT_PAREN = ")"
    SEMICOLON = ";"
    PERCENT = "%"
    END = "end"


class Part(NamedTuple):
    """One part of a name: its text (without the square brackets of a name in brackets), its
    position (with the brackets) and whether it was written in square brackets."""

    text: str
    start: int
    end: int
    bracketed: bool


class Token(NamedTuple):
    kind: TokenKind
    text: str
    start: int
    end: int
    parts: tuple[Part, ...] = ()


class SyntaxProblem(Exception):  # noqa: N818 - carries data of a finding, not an error condition
    """A syntax problem with its position; ``reason`` is a stable code."""

    def __init__(self, reason: str, start: int, end: int, **details: str | int) -> None:
        super().__init__(reason)
        self.reason = reason
        self.start = start
        self.end = end
        self.details = details


# A part of a name is a simple name (letters of any script, digits and ``_``, not starting with
# a digit) or any text in square brackets (a name of the user with spaces or other characters,
# specification 3.4). An empty bracket pair is the empty place.
_PART = r"(?:[^\W\d]\w*|\[[^\[\]\n]*\])"
_TOKEN = re.compile(
    rf"""
      (?P<space>\s+)
    | (?P<number>[0-9]+(?:\.[0-9]+)?)
    | (?P<name>{_PART}(?:\.{_PART})*)
    | (?P<operator><>|<=|>=|[-+*/^&=<>])
    | (?P<single>[();%])
    | (?P<string>")
    """,
    re.VERBOSE,
)
_PART_AT = re.compile(_PART)
_SINGLE = {
    "(": TokenKind.LEFT_PAREN,
    ")": TokenKind.RIGHT_PAREN,
    ";": TokenKind.SEMICOLON,
    "%": TokenKind.PERCENT,
}


def split_name(source: str, start: int, end: int) -> tuple[Part, ...]:
    """The parts of the name in ``source[start:end]``, separated by points that are outside of
    square brackets."""
    parts: list[Part] = []
    position = start
    while position < end:
        found = _PART_AT.match(source, position)
        if found is None or found.end() > end:  # cannot happen for a name the lexer found
            break
        text = found.group()
        bracketed = text.startswith("[")
        parts.append(Part(text[1:-1] if bracketed else text, found.start(), found.end(), bracketed))
        position = found.end() + 1  # the point
    return tuple(parts)


def tokenize(source: str, *, lenient: bool = False) -> list[Token]:
    """Split ``source`` into tokens; the last token is of the kind ``END``.

    Raises :class:`SyntaxProblem` for a character that belongs to no token, a number
    followed by letters, a name in brackets that is not closed and a string without closing
    quotation mark. With ``lenient`` it does not raise: it leaves out what belongs to no
    token and goes on (for the highlighting of an expression with a syntax problem).
    """
    tokens: list[Token] = []
    append = tokens.append
    position = 0
    length = len(source)
    match_at = _TOKEN.match
    kind_number = TokenKind.NUMBER
    kind_name = TokenKind.NAME
    kind_operator = TokenKind.OPERATOR
    while position < length:
        found = match_at(source, position)
        try:
            if found is None:
                if source[position] == "[":
                    raise SyntaxProblem("unterminated_bracket", position, length)
                raise SyntaxProblem(
                    "invalid_character", position, position + 1, found=source[position]
                )
            group = found.lastgroup
            end = found.end()
            if group == "operator":
                append(Token(kind_operator, source[position:end], position, end))
            elif group == "name":
                if end < length and source[end] == ".":
                    raise SyntaxProblem("invalid_character", end, end + 1, found=".")
                append(
                    Token(
                        kind_name,
                        source[position:end],
                        position,
                        end,
                        split_name(source, position, end),
                    )
                )
            elif group == "single":
                text = source[position:end]
                append(Token(_SINGLE[text], text, position, end))
            elif group == "space":
                pass
            elif group == "number":
                if end < length and (source[end].isalnum() or source[end] in "_."):
                    raise SyntaxProblem("invalid_number", position, end + 1, found=source[end])
                append(Token(kind_number, source[position:end], position, end))
            else:  # "string"
                end = _string(source, position, tokens)
        except SyntaxProblem as problem:
            if not lenient:
                raise
            end = max(problem.end, position + 1) if problem.reason != "invalid_number" else end
            if problem.reason == "unterminated_bracket":
                end = length
        position = end
    append(Token(TokenKind.END, "", length, length))
    return tokens


def _string(source: str, start: int, tokens: list[Token]) -> int:
    """Read a text in double quotation marks; a doubled quotation mark is one in the text."""
    position = start + 1
    value: list[str] = []
    while position < len(source):
        char = source[position]
        if char == '"':
            if source.startswith('""', position):
                value.append('"')
                position += 2
                continue
            tokens.append(Token(TokenKind.STRING, "".join(value), start, position + 1))
            return position + 1
        value.append(char)
        position += 1
    raise SyntaxProblem("unterminated_string", start, len(source))
