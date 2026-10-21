"""The characters of an expression with kind and position (specification 3.4): what the user
interface needs for the colors of names, functions and values, for the matching brackets and
for the places of the findings."""

from dataclasses import dataclass
from enum import StrEnum

from pipwerk_domain.expressions.lexer import Token, TokenKind, tokenize


class CharacterKind(StrEnum):
    NAME = "name"
    FUNCTION = "function"
    VALUE = "value"
    OPERATOR = "operator"
    BRACKET = "bracket"
    SEPARATOR = "separator"


@dataclass(frozen=True, slots=True)
class Character:
    """A token: the kind, ``start`` (first character) and ``end`` (position after the last
    character). For a bracket ``partner`` is the index of the bracket that belongs to it in
    the list, ``None`` if there is none."""

    kind: CharacterKind
    start: int
    end: int
    partner: int | None = None


def characters(source: str) -> list[Character]:
    """The tokens of an expression, also of one with a syntax problem (what cannot be read is
    left out). Spaces are no tokens. A percent sign belongs to the number before it."""
    raw = [item for item in tokenize(source, lenient=True) if item.kind is not TokenKind.END]
    result: list[Character] = []
    open_brackets: list[int] = []
    partners: dict[int, int] = {}
    index = 0
    while index < len(raw):
        token = raw[index]
        following = raw[index + 1] if index + 1 < len(raw) else None
        if token.kind is TokenKind.NUMBER:
            end = token.end
            if following is not None and following.kind is TokenKind.PERCENT:
                end = following.end
                index += 1
            result.append(Character(CharacterKind.VALUE, token.start, end))
        elif token.kind is TokenKind.STRING:
            result.append(Character(CharacterKind.VALUE, token.start, token.end))
        elif token.kind is TokenKind.NAME:
            result.append(Character(_name_kind(token, following), token.start, token.end))
        elif token.kind is TokenKind.OPERATOR or token.kind is TokenKind.PERCENT:
            result.append(Character(CharacterKind.OPERATOR, token.start, token.end))
        elif token.kind is TokenKind.SEMICOLON:
            result.append(Character(CharacterKind.SEPARATOR, token.start, token.end))
        elif token.kind is TokenKind.LEFT_PAREN:
            open_brackets.append(len(result))
            result.append(Character(CharacterKind.BRACKET, token.start, token.end))
        else:  # right parenthesis
            if open_brackets:
                partner = open_brackets.pop()
                partners[partner] = len(result)
                partners[len(result)] = partner
            result.append(Character(CharacterKind.BRACKET, token.start, token.end))
        index += 1
    return [
        Character(item.kind, item.start, item.end, partners.get(position))
        if item.kind is CharacterKind.BRACKET
        else item
        for position, item in enumerate(result)
    ]


def _name_kind(token: Token, following: Token | None) -> CharacterKind:
    """A simple name directly before an opening parenthesis is a function."""
    simple = len(token.parts) == 1 and not token.parts[0].bracketed
    if simple and following is not None and following.kind is TokenKind.LEFT_PAREN:
        return CharacterKind.FUNCTION
    return CharacterKind.NAME
