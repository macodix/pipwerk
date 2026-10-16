"""Expressions (specification 3.4): parser, type check, functions and normalization."""

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
from pipwerk_domain.expressions.functions import (
    FunctionSignature,
    find_function,
    list_functions,
)
from pipwerk_domain.expressions.parser import ParseResult, SyntaxIssue, parse
from pipwerk_domain.expressions.symbols import Environment, Scope, Symbol, SymbolKind


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
    "Environment",
    "ExprType",
    "ExpressionIssue",
    "FunctionSignature",
    "IssueKind",
    "ParseResult",
    "RecognizedFunction",
    "RecognizedName",
    "RecognizedSegment",
    "Scope",
    "Symbol",
    "SymbolKind",
    "SyntaxIssue",
    "analyze",
    "find_function",
    "list_functions",
    "nesting_depth",
    "normalize_expression",
    "parse",
]
