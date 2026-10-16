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


_NUMBER = re.compile(r"\d+(?:\.\d+)?")
_NAME = re.compile(r"[^\W\d]\w*(?:\.[^\W\d]\w*)*")
_OPERATORS = ("<>", "<=", ">=", "+", "-", "*", "/", "^", "&", "=", "<", ">")
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
    while position < length:
        char = source[position]
        if char.isspace():
            position += 1
            continue
        if char == '"':
            position = _string(source, position, tokens)
            continue
        if char in _SINGLE:
            tokens.append(Token(_SINGLE[char], char, position, position + 1))
            position += 1
            continue
        number = _NUMBER.match(source, position)
        if number is not None:
            end = number.end()
            if end < length and (source[end].isalnum() or source[end] in "_."):
                raise SyntaxProblem("invalid_number", position, end + 1, found=source[end])
            tokens.append(Token(TokenKind.NUMBER, number.group(), position, end))
            position = end
            continue
        name = _NAME.match(source, position)
        if name is not None:
            end = name.end()
            if end < length and source[end] == ".":
                raise SyntaxProblem("invalid_character", end, end + 1, found=".")
            tokens.append(Token(TokenKind.NAME, name.group(), position, end))
            position = end
            continue
        operator = next((item for item in _OPERATORS if source.startswith(item, position)), None)
        if operator is not None:
            end = position + len(operator)
            tokens.append(Token(TokenKind.OPERATOR, operator, position, end))
            position = end
            continue
        raise SyntaxProblem("invalid_character", position, position + 1, found=char)
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
