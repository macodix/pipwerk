import pytest

from pipwerk_domain.expressions import nesting_depth, parse
from pipwerk_domain.expressions.nodes import (
    Binary,
    Call,
    Group,
    Name,
    Node,
    Number,
    String,
    Unary,
    postorder,
)
from pipwerk_domain.limits import MAX_EXPRESSION_LENGTH, MAX_EXPRESSION_NESTING


def shape(node: Node) -> str:
    """The tree as a text with explicit grouping."""
    match node:
        case Number(value=value, percent=percent):
            return f"{value}%" if percent else str(value)
        case String(value=value):
            return repr(value)
        case Name(segments=segments):
            return ".".join(item.text for item in segments)
        case Group(inner=inner):
            return f"[{shape(inner)}]"
        case Unary(op=op, operand=operand):
            return f"({op}u {shape(operand)})"
        case Binary(op=op, left=left, right=right):
            return f"({shape(left)} {op} {shape(right)})"
        case Call(name=name, args=args):
            return f"{name}({', '.join(shape(item) for item in args)})"
    raise AssertionError(node)


def tree(source: str) -> str:
    result = parse(source)
    assert result.issue is None, result.issue
    assert result.tree is not None
    return shape(result.tree)


def problem(source: str) -> tuple[str, int, int]:
    result = parse(source)
    assert result.tree is None
    assert result.issue is not None
    return result.issue.reason, result.issue.start, result.issue.end


# values ------------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("42", "42"),
        ("3.14", "3.14"),
        ("0.5", "0.5"),
        ('"text"', "'text'"),
        ('"with ""quotes"""', "'with \"quotes\"'"),
        ('""', "''"),
        ("TRUE()", "TRUE()"),
        ("FALSE()", "FALSE()"),
        ("1%", "1%"),
        ("2.5%", "2.5%"),
        ("  7  ", "7"),
        ("1\n+\n2", "(1 + 2)"),
    ],
)
def test_values(source: str, expected: str) -> None:
    assert tree(source) == expected


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("a", "a"),
        ("Order.Volumen", "Order.Volumen"),
        ("trend_h1.ema20.Wert", "trend_h1.ema20.Wert"),
        ("Äpfel.größe", "Äpfel.größe"),
        ("punkt_13", "punkt_13"),
    ],
)
def test_names(source: str, expected: str) -> None:
    assert tree(source) == expected


def test_name_segments_have_positions() -> None:
    result = parse("1 + ab.cd.ef")
    assert isinstance(result.tree, Binary)
    name = result.tree.right
    assert isinstance(name, Name)
    assert [(s.text, s.start, s.end) for s in name.segments] == [
        ("ab", 4, 6),
        ("cd", 7, 9),
        ("ef", 10, 12),
    ]
    assert (name.start, name.end) == (4, 12)


# operators and precedence ----------------------------------------------------------


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("1+2+3", "((1 + 2) + 3)"),
        ("1-2-3", "((1 - 2) - 3)"),
        ("8/4/2", "((8 / 4) / 2)"),
        ("2^3^2", "((2 ^ 3) ^ 2)"),
        ("1+2*3", "(1 + (2 * 3))"),
        ("1*2+3", "((1 * 2) + 3)"),
        ("2*3^2", "(2 * (3 ^ 2))"),
        ("1+2&3", "((1 + 2) & 3)"),
        ('"a"&"b"&"c"', "(('a' & 'b') & 'c')"),
        ("1+2=3", "((1 + 2) = 3)"),
        ("1<2", "(1 < 2)"),
        ("1<=2", "(1 <= 2)"),
        ("1>2", "(1 > 2)"),
        ("1>=2", "(1 >= 2)"),
        ("1<>2", "(1 <> 2)"),
        ("a=b=c", "((a = b) = c)"),
        ("(1+2)*3", "([(1 + 2)] * 3)"),
        ("-a", "(-u a)"),
        ("+a", "(+u a)"),
        ("--a", "(-u (-u a))"),
        ("2--3", "(2 - (-u 3))"),
        ("-2^2", "((-u 2) ^ 2)"),  # as in OpenFormula the sign binds tighter than ^
        ("2^-3", "(2 ^ (-u 3))"),
        ("-a*b", "((-u a) * b)"),
        ("1+-2", "(1 + (-u 2))"),
        ("-1%", "(-u 1%)"),
        ("a&b=c", "((a & b) = c)"),
    ],
)
def test_operators_and_precedence(source: str, expected: str) -> None:
    assert tree(source) == expected


# functions -------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("IF(a;b;c)", "IF(a, b, c)"),
        ("if(a;b;c)", "if(a, b, c)"),
        ("MIN(1;2;3)", "MIN(1, 2, 3)"),
        ("ABS(-1)", "ABS((-u 1))"),
        ("F(G(1;2);H())", "F(G(1, 2), H())"),
        ("IF( a ; b ; c )", "IF(a, b, c)"),
        ("IF(a;\n  b;\n  c)", "IF(a, b, c)"),
        ("PREVIOUS(ema20.Wert;2)", "PREVIOUS(ema20.Wert, 2)"),
        ("f((1;2)", None),
    ],
)
def test_functions(source: str, expected: str | None) -> None:
    if expected is None:
        assert parse(source).issue is not None
    else:
        assert tree(source) == expected


def test_call_has_positions() -> None:
    result = parse("  MAX(1;2)")
    assert isinstance(result.tree, Call)
    assert (result.tree.name_start, result.tree.name_end) == (2, 5)
    assert (result.tree.start, result.tree.end) == (2, 10)


def test_node_positions_include_parentheses() -> None:
    result = parse("(1+2)*3")
    assert isinstance(result.tree, Binary)
    assert isinstance(result.tree.left, Group)
    assert (result.tree.left.start, result.tree.left.end) == (0, 5)
    assert (result.tree.start, result.tree.end) == (0, 7)


def test_percent_number_covers_the_sign() -> None:
    result = parse("1+25%")
    assert isinstance(result.tree, Binary)
    assert isinstance(result.tree.right, Number)
    assert (result.tree.right.start, result.tree.right.end) == (2, 5)


# errors with position ---------------------------------------------------------------


@pytest.mark.parametrize(
    ("source", "reason", "start", "end"),
    [
        ("", "unexpected_end", 0, 0),
        ("   ", "unexpected_end", 3, 3),
        ("1 +", "unexpected_end", 3, 3),
        ("(1", "unexpected_end", 2, 2),
        ("f(1", "unexpected_end", 3, 3),
        ("1)", "unexpected_token", 1, 2),
        ("1 2", "unexpected_token", 2, 3),
        ("a b", "unexpected_token", 2, 3),
        ("1 + * 2", "unexpected_token", 4, 5),
        ("f(1;)", "unexpected_token", 4, 5),
        ("f(;1)", "unexpected_token", 2, 3),
        ("f(1,2)", "invalid_character", 3, 4),
        ("1;2", "unexpected_token", 1, 2),
        ("%", "unexpected_token", 0, 1),
        ("(1+2)%", "unexpected_token", 5, 6),
        ("a%", "unexpected_token", 1, 2),
        ('"abc', "unterminated_string", 0, 4),
        ("1 + $", "invalid_character", 4, 5),
        ("a.", "invalid_character", 1, 2),
        ("a..b", "invalid_character", 1, 2),
        ("a.1", "invalid_character", 1, 2),
        (".5", "invalid_character", 0, 1),
        ("1.", "invalid_number", 0, 2),
        ("1.5.2", "invalid_number", 0, 4),
        ("12abc", "invalid_number", 0, 3),
        ("1 !", "invalid_character", 2, 3),
        ("()", "unexpected_token", 1, 2),
        ("1 +", "unexpected_end", 3, 3),
        ("-", "unexpected_end", 1, 1),
        ("a == b", "unexpected_token", 3, 4),
    ],
)
def test_syntax_errors_have_a_position(source: str, reason: str, start: int, end: int) -> None:
    assert problem(source) == (reason, start, end)


# limits ----------------------------------------------------------------------------


def test_length_limit_at_the_limit_and_above() -> None:
    at_limit = "1" + "+1" * ((MAX_EXPRESSION_LENGTH - 1) // 2)
    assert len(at_limit) <= MAX_EXPRESSION_LENGTH
    assert parse(at_limit).issue is None
    exact = "1" * MAX_EXPRESSION_LENGTH
    assert parse(exact).issue is None
    above = "1" * (MAX_EXPRESSION_LENGTH + 1)
    assert problem(above) == ("too_long", 0, MAX_EXPRESSION_LENGTH + 1)


def test_nesting_limit_at_the_limit_and_above() -> None:
    inside = "(" * MAX_EXPRESSION_NESTING + "1" + ")" * MAX_EXPRESSION_NESTING
    assert parse(inside).issue is None
    above = "(" * (MAX_EXPRESSION_NESTING + 1) + "1" + ")" * (MAX_EXPRESSION_NESTING + 1)
    reason, start, _ = problem(above)
    assert reason == "too_deep"
    assert start == MAX_EXPRESSION_NESTING


def test_nesting_counts_function_calls() -> None:
    inside = "ABS(" * MAX_EXPRESSION_NESTING + "1" + ")" * MAX_EXPRESSION_NESTING
    assert parse(inside).issue is None
    assert problem("ABS(" * (MAX_EXPRESSION_NESTING + 1))[0] == "too_deep"
    assert problem("(" * MAX_EXPRESSION_NESTING + "F()")[0] == "too_deep"


def test_long_chains_do_not_exhaust_the_stack() -> None:
    chain = "1" + "+1" * 2000  # a left-deep tree of 2000 levels
    result = parse(chain)
    assert result.tree is not None
    assert len(postorder(result.tree)) == 4001
    signs = "-" * 4000 + "1"
    assert parse(signs).issue is None


def test_nesting_depth_by_text() -> None:
    assert nesting_depth("1") == 0
    assert nesting_depth("(1)") == 1
    assert nesting_depth("F((1);(2))") == 2
    assert nesting_depth('F("((((", 1)') == 1  # parentheses inside a text do not count
    assert nesting_depth('"a""(("') == 0
    assert nesting_depth(")(") == 1
    assert nesting_depth("(" * 70) == 70


def test_no_eval_of_the_input() -> None:
    # Python code in the input is only text of a syntax problem or a name
    assert problem("__import__('os')")[0] == "invalid_character"
    result = parse("__import__")
    assert isinstance(result.tree, Name)
