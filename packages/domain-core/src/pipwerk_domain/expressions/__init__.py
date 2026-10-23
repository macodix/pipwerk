"""Expressions (specification 3.4): parser, type check, functions, normalization, stored and
display form, blocks, sentence, characters and visible names."""

from pipwerk_domain.expressions.blocks import (
    Block,
    BlockError,
    BlockKind,
    blocks_to_text,
    to_blocks,
)
from pipwerk_domain.expressions.checker import (
    Analysis,
    ExpressionIssue,
    IssueKind,
    RecognizedFunction,
    RecognizedName,
    RecognizedSegment,
    analyze,
    normalize_expression,
)
from pipwerk_domain.expressions.exprtypes import ExprType
from pipwerk_domain.expressions.forms import Rendering, display_part, is_simple_name, render
from pipwerk_domain.expressions.functions import (
    FunctionParameter,
    FunctionSignature,
    find_function,
    list_functions,
)
from pipwerk_domain.expressions.names import (
    ArgumentInfo,
    ChoiceInfo,
    MethodInfo,
    PropertyInfo,
    VisibleName,
    visible_names,
)
from pipwerk_domain.expressions.parser import ParseResult, SyntaxIssue, parse
from pipwerk_domain.expressions.sentence import sentence
from pipwerk_domain.expressions.symbols import Environment, Scope, Symbol, SymbolKind
from pipwerk_domain.expressions.tokens import Character, CharacterKind, characters


def nesting_depth(source: str) -> int:
    """The deepest nesting of parentheses (and with it of function calls) of an expression,
    counted on the text without parsing it. Texts in quotation marks are skipped."""
    depth = 0
    deepest = 0
    in_text = False
    position = 0
    while position < len(source):
        char = source[position]
        if in_text:
            if char == '"':
                if source.startswith('""', position):
                    position += 1
                else:
                    in_text = False
        elif char == '"':
            in_text = True
        elif char == "(":
            depth += 1
            deepest = max(deepest, depth)
        elif char == ")":
            depth = max(0, depth - 1)
        position += 1
    return deepest


__all__ = [
    "Analysis",
    "ArgumentInfo",
    "Block",
    "BlockError",
    "BlockKind",
    "Character",
    "CharacterKind",
    "ChoiceInfo",
    "Environment",
    "ExprType",
    "ExpressionIssue",
    "FunctionParameter",
    "FunctionSignature",
    "IssueKind",
    "MethodInfo",
    "ParseResult",
    "PropertyInfo",
    "RecognizedFunction",
    "RecognizedName",
    "RecognizedSegment",
    "Rendering",
    "Scope",
    "Symbol",
    "SymbolKind",
    "SyntaxIssue",
    "VisibleName",
    "analyze",
    "blocks_to_text",
    "characters",
    "display_part",
    "find_function",
    "is_simple_name",
    "list_functions",
    "nesting_depth",
    "normalize_expression",
    "parse",
    "render",
    "sentence",
    "to_blocks",
    "visible_names",
]
