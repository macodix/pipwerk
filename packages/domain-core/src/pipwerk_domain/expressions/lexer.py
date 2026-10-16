"""Splitting an expression into tokens (hand written, no parser generator)."""

import re
from dataclasses import dataclass
from enum import StrEnum


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


@dataclass(frozen=True, slots=True)
class Token:
    kind: TokenKind
    text: str
    start: int
    end: int


class SyntaxProblem(Exception):  # noqa: N818 - carries data of a finding, not an error condition
    """A syntax problem with its position; ``reason`` is a stable code."""

    def __init__(self, reason: str, start: int, end: int, **details: str | int) -> None:
        super().__init__(reason)
        self.reason = reason
        self.start = start
        self.end = end
        self.details = details


_TOKEN = re.compile(
    r"""
      (?P<space>\s+)
    | (?P<number>[0-9]+(?:\.[0-9]+)?)
    | (?P<name>[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)
    | (?P<operator><>|<=|>=|[-+*/^&=<>])
    | (?P<single>[();%])
    | (?P<string>")
    """,
    re.VERBOSE,
)
_SINGLE = {
    "(": TokenKind.LEFT_PAREN,
    ")": TokenKind.RIGHT_PAREN,
    ";": TokenKind.SEMICOLON,
    "%": TokenKind.PERCENT,
}


def tokenize(source: str) -> list[Token]:
    """Split ``source`` into tokens; the last token is of the kind ``END``.

    Raises :class:`SyntaxProblem` for a character that belongs to no token, a number
    followed by letters and a string without closing quotation mark.
    """
    tokens: list[Token] = []
    position = 0
    length = len(source)
    match_at = _TOKEN.match
    while position < length:
        found = match_at(source, position)
        if found is None:
            raise SyntaxProblem("invalid_character", position, position + 1, found=source[position])
        group = found.lastgroup
        end = found.end()
        if group == "space":
            position = end
            continue
        if group == "string":
            position = _string(source, position, tokens)
            continue
        if group == "number":
            if end < length and (source[end].isalnum() or source[end] in "_."):
                raise SyntaxProblem("invalid_number", position, end + 1, found=source[end])
            tokens.append(Token(TokenKind.NUMBER, found.group(), position, end))
        elif group == "name":
            if end < length and source[end] == ".":
                raise SyntaxProblem("invalid_character", end, end + 1, found=".")
            tokens.append(Token(TokenKind.NAME, found.group(), position, end))
        elif group == "operator":
            tokens.append(Token(TokenKind.OPERATOR, found.group(), position, end))
        else:
            text = found.group()
            tokens.append(Token(_SINGLE[text], text, position, end))
        position = end
    tokens.append(Token(TokenKind.END, "", length, length))
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
