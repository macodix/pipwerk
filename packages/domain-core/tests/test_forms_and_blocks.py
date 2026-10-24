"""Stored form and display form, blocks, sentence, characters and visible names of expressions
(specification 3.4), on the test cases of the specification."""

import json
from typing import Any

import pytest

from pipwerk_domain import catalog
from pipwerk_domain.consistency import check_with_contexts
from pipwerk_domain.consistency.engine import ExpressionContext
from pipwerk_domain.documents import read_document
from pipwerk_domain.expressions import (
    Block,
    BlockError,
    BlockKind,
    CharacterKind,
    blocks_to_text,
    characters,
    render,
    sentence,
    to_blocks,
    visible_names,
)
from pipwerk_domain.expressions.checker import analyze
from pipwerk_domain.expressions.symbols import Scope
from pipwerk_domain.model import Instance, Origin, Strategy
from pipwerk_domain.pointers import below, pointer
from tests.helpers import condition, connect, element, fixed, place_order, trigger, uid
from tests.paths import TESTCASE_DIRECTORY


def load(name: str) -> Strategy:
    value = read_document((TESTCASE_DIRECTORY / f"{name}.strategy.json").read_text("utf-8"))
    assert isinstance(value, Strategy)
    return value


def context_of(strategy: Strategy, key: str, field: str = "ausdruck") -> ExpressionContext:
    index = next(position for position, item in enumerate(strategy.elements) if item.key == key)
    checker = check_with_contexts(strategy)
    return checker.contexts[below(pointer("elements", index), "parameters", field, "value")]


def env_of(strategy: Strategy, key: str) -> Any:
    return context_of(strategy, key).env


STR03 = load("str-03")


def zigzag_strategy() -> Strategy:
    """A strategy with a ZigZag ("ZZ Signal") and a condition ("Prüfen"): the delivered type
    with choices and numbers that are empty at times."""
    signal = Instance(
        name="ZZ Signal",
        key="zz_signal",
        object_type="ZigZag",
        origin=Origin("ZigZag"),
        parameter_values={"zeiteinheit": fixed("h1")},
    )
    return Strategy(
        id=uid(901),
        name="ZigZag",
        elements=[
            trigger(1),
            element(3, "ZigZag", instance=signal),
            condition(5, "TRUE()", name="Prüfen"),
            place_order(2),
        ],
        connections=[connect(1, "weiter", 5), connect(5, "wahr", 2)],
    )


ZIGZAG = zigzag_strategy()
CHECK = "pruefen"


def blocks(source: str, strategy: Strategy = STR03, key: str = "kreuzen") -> Block:
    env = env_of(strategy, key)
    analysis = analyze(source, env)
    assert analysis.issues == [], analysis.issues
    result = to_blocks(analysis)
    assert result is not None
    return result


def text_of(block: Block, strategy: Strategy = STR03, key: str = "kreuzen") -> str:
    return blocks_to_text(block, env_of(strategy, key))


CROSSING_BOTH = (
    "OR(AND(PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert > ema50.wert); "
    "AND(PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert))"
)
CROSSING_UP = "AND(PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert > ema50.wert)"
CROSSING_DOWN = "AND(PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert)"


# --- stored form and display form ----------------------------------------------------------------


def test_the_stored_form_becomes_the_display_form_with_names_of_the_user() -> None:
    env = env_of(STR03, "stop")
    result = render(
        'IF(richtung.ergebnis = "buy"; Kerze.schluss - Strategie.stop_abstand * atr14.wert; 0)',
        env,
        "de",
        display_input=False,
    )
    assert result.display == (
        'IF(Richtung.Ergebnis = "buy"; Kerze.Schluss - Strategie.[Stop-Abstand] * [ATR 14].Wert; 0)'
    )
    assert result.stored.startswith("IF(richtung.ergebnis")


def test_the_display_form_is_in_the_chosen_language() -> None:
    env = env_of(STR03, "stop")
    source = "Kerze.schluss + Konto.kapital + Instrument.tickgroesse"
    german = render(source, env, "de", display_input=False)
    english = render(source, env, "en", display_input=False)
    assert german.display == "Kerze.Schluss + Konto.Kapital + Instrument.Tickgröße"  # a simple name
    assert english.display == "Candle.Close + Account.Equity + Instrument.[Tick size]"


def test_both_forms_and_both_languages_are_accepted_as_input() -> None:
    env = env_of(STR03, "stop")
    expected = "Kerze.schluss + Konto.kapital + Instrument.tickgroesse + atr14.wert"
    for source in (
        expected,
        "Kerze.Schluss + Konto.Kapital + Instrument.Tickgröße + [ATR 14].Wert",
        "Candle.Close + Account.Equity + Instrument.[Tick size] + [atr 14].value".replace(
            "value", "Wert"
        ),
        "KERZE.schluss + konto.KAPITAL + instrument.tickgroesse + ATR14.wert",
    ):
        result = render(source, env, "de", display_input=True)
        assert result.stored == expected, source
        assert result.analysis.issues == [], source


def test_the_conversion_keeps_spacing_and_line_feeds() -> None:
    env = env_of(STR03, "stop")
    source = "IF(  [ATR 14].Wert > 1 ;\n   Kerze.Schluss ;\n 2 )"
    result = render(source, env, "de", display_input=True)
    assert result.stored == "IF(  atr14.wert > 1 ;\n   Kerze.schluss ;\n 2 )"
    assert result.display == source


def test_umlauts_and_spaces_in_names_of_the_user() -> None:
    env = env_of(STR03, "stop")
    result = render("[EMA 20].Wert > [ema 50].wert", env, "de", display_input=True)
    assert result.stored == "ema20.wert > ema50.wert"
    assert result.display == "[EMA 20].Wert > [EMA 50].Wert"


def test_a_name_that_is_not_found_stays_as_written() -> None:
    env = env_of(STR03, "stop")
    result = render("[Unbekannt].Wert + Kerze.Hoch", env, "de", display_input=True)
    assert result.stored == "[Unbekannt].Wert + Kerze.hoch"
    assert [item.kind.value for item in result.analysis.issues] == ["unknown_name"]


def test_values_of_a_choice_are_shown_by_their_label() -> None:
    env = env_of(ZIGZAG, CHECK)
    source = 'zz_signal.wendepunkt_1_art = "hoch"'
    result = render(source, env, "de", display_input=False)
    assert result.display == '[ZZ Signal].[Wendepunkt 1 Art] = "hoch"'
    english = render(source, env, "en", display_input=False)
    assert english.display == '[ZZ Signal].[Turning point 1 kind] = "high"'
    for text in ('[ZZ Signal].[Wendepunkt 1 Art] = "Hoch"',
                 '[ZZ Signal].[Turning point 1 kind] = "high"',
                 '[ZZ Signal].[Wendepunkt 1 Art] = "hoch"'):  # fmt: skip
        assert render(text, env, "de", display_input=True).stored == source


def test_a_text_that_is_not_a_value_of_the_choice_stays_as_written() -> None:
    env = env_of(ZIGZAG, CHECK)
    result = render('zz_signal.wendepunkt_1_art = "Seitwaerts"', env, "de", display_input=False)
    assert result.display == '[ZZ Signal].[Wendepunkt 1 Art] = "Seitwaerts"'
    assert [item.kind.value for item in result.analysis.issues] == ["unknown_choice_value"]


def test_the_result_of_a_choice_is_shown_by_label_where_a_choice_is_expected() -> None:
    env = env_of(STR03, "order_ausgefuehrt")
    result = render('IF(Order.status = "ausgefuehrt"; 1; 2)', env, "de", display_input=False)
    assert result.display == 'IF(Order.Status = "ausgeführt"; 1; 2)'
    assert render(result.display, env, "de", display_input=True).stored == (
        'IF(Order.status = "ausgefuehrt"; 1; 2)'
    )


def test_an_expression_with_a_syntax_problem_stays_as_it_is_in_both_forms() -> None:
    env = env_of(STR03, "stop")
    result = render("Kerze.Schluss >", env, "en", display_input=True)
    assert result.stored == result.display == "Kerze.Schluss >"


def test_functions_are_written_in_the_spelling_of_the_norm() -> None:
    env = env_of(STR03, "stop")
    result = render("if(true(); 1; 2)", env, "de", display_input=True)
    assert result.stored == "IF(TRUE(); 1; 2)"


def test_the_display_form_of_the_testcases_is_read_back_unchanged() -> None:
    """Writing the display form and reading it again gives the stored expression."""
    for strategy in (ZIGZAG, STR03):
        checker = check_with_contexts(strategy)
        for pointer_text, context in checker.contexts.items():
            index = pointer_text.split("/")[2] if pointer_text.startswith("/elements") else None
            if index is None or not pointer_text.endswith("/parameters/ausdruck/value"):
                continue
            element = strategy.elements[int(index)]
            binding = element.parameters.get("ausdruck")
            if binding is None or not isinstance(binding.value, str):
                continue
            for language in ("de", "en"):
                shown = render(binding.value, context.env, language, display_input=False)
                back = render(shown.display, context.env, language, display_input=True)
                assert back.stored == binding.value, (pointer_text, language)


# --- blocks ------------------------------------------------------------------------------------


def test_the_crossing_in_either_direction_is_one_block() -> None:
    block = blocks(CROSSING_BOTH)
    assert block.kind is BlockKind.CROSSING
    assert block.direction == "any"
    assert [item.path for item in block.children] == [("ema20", "wert"), ("ema50", "wert")]
    assert text_of(block) == CROSSING_BOTH


@pytest.mark.parametrize(("source", "direction"), [(CROSSING_UP, "up"), (CROSSING_DOWN, "down")])
def test_the_crossing_upwards_and_downwards(source: str, direction: str) -> None:
    block = blocks(source)
    assert (block.kind, block.direction) == (BlockKind.CROSSING, direction)
    assert text_of(block) == source


def test_the_crossing_inside_and() -> None:
    source = (
        'AND(Order.status = "wartend"; PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); '
        "ema20.wert < ema50.wert; Kerze.schluss > 1)"
    )
    env = env_of(STR03, "order_ausgefuehrt")
    analysis = analyze(source, env)
    assert analysis.issues == []
    block = to_blocks(analysis)
    assert block is not None
    assert block.kind is BlockKind.LOGIC
    assert [item.kind for item in block.children] == [
        BlockKind.COMPARISON,
        BlockKind.CROSSING,
        BlockKind.COMPARISON,
    ]
    assert block.children[1].direction == "down"
    assert blocks_to_text(block, env) == source


def test_the_crossing_inside_or() -> None:
    source = f"OR(Kerze.schluss > 1; {CROSSING_UP}; {CROSSING_DOWN}; Kerze.hoch > 2)"
    block = blocks(source)
    assert block.kind is BlockKind.LOGIC
    assert [item.kind for item in block.children] == [
        BlockKind.COMPARISON,
        BlockKind.CROSSING,
        BlockKind.COMPARISON,
    ]
    assert block.children[1].direction == "any"
    assert text_of(block) == source


def test_a_crossing_with_a_fixed_value_has_no_previous_around_it() -> None:
    source = "AND(PREVIOUS(ema20.wert) <= 50; ema20.wert > 50)"
    block = blocks(source)
    assert block.kind is BlockKind.CROSSING
    assert [item.kind for item in block.children] == [BlockKind.NAME, BlockKind.LITERAL]
    assert text_of(block) == source
    both_ways = blocks("OR(AND(PREVIOUS(ema20.wert) <= 50; ema20.wert > 50); "
                       "AND(PREVIOUS(ema20.wert) >= 50; ema20.wert < 50))")  # fmt: skip
    assert (both_ways.kind, both_ways.direction) == (BlockKind.CROSSING, "any")


def test_a_crossing_of_a_fixed_value_with_a_value_with_previous_value_on_the_left() -> None:
    source = "AND(50 <= PREVIOUS(ema20.wert); 50 > ema20.wert)"
    block = blocks(source)
    assert block.kind is BlockKind.CROSSING
    assert text_of(block) == source


def test_two_values_without_an_earlier_value_do_not_cross() -> None:
    """Nothing can cross: the pair of comparisons stays two comparisons."""
    plain = "AND(Strategie.stop_abstand <= 5; Strategie.stop_abstand > 5)"
    block = blocks(plain)
    assert block.kind is BlockKind.LOGIC
    assert [item.kind for item in block.children] == [BlockKind.COMPARISON] * 2
    assert text_of(block) == plain


def test_a_pair_that_is_not_a_crossing_stays_a_pair() -> None:
    for source in (
        "AND(PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert >= ema50.wert)",
        "AND(PREVIOUS(ema20.wert) < PREVIOUS(ema50.wert); ema20.wert > ema50.wert)",
        "AND(PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema50.wert > ema20.wert)",
        "AND(PREVIOUS(ema20.wert) <= ema50.wert; ema20.wert > ema50.wert)",
        "AND(ema20.wert > ema50.wert; PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert))",
        "AND(PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert > ema50.wert * 2)",
    ):
        block = blocks(source)
        assert block.kind is BlockKind.LOGIC, source
        assert text_of(block) == source


def test_or_with_the_two_directions_in_the_other_order_stays() -> None:
    source = f"OR({CROSSING_DOWN}; {CROSSING_UP})"
    block = blocks(source)
    assert [item.direction for item in block.children] == ["down", "up"]
    assert text_of(block) == source


@pytest.mark.parametrize(
    "source",
    [
        "1 + 2 * 3",
        "(1 + 2) * 3",
        "1 - (2 - 3)",
        "1 - 2 - 3",
        "2 ^ 3 ^ 2",
        "2 ^ (3 ^ 2)",
        "-(1 + 2)",
        "-Kerze.schluss ^ 2",
        "Kerze.schluss > 1 = TRUE()",
        '"a" & "b" & 1',
        "NOT(Kerze.schluss > 1)",
        "IF(Kerze.schluss > 1; 2; 3)",
        "IF(Kerze.schluss > 1; 2)",
        "MIN(1; 2; 3) + MAX(4; 5)",
        "FLOOR(Kerze.schluss; 0.01) / ABS(-2)",
        "IFNA(Order.limitpreis; Order.preis)",
        "5% * 3",
        "0.05 + 12",
        "TRUE()",
        "FALSE()",
        '"mit ""Anführung"""',
        "ISNA(Position.volumen)",
        "PREVIOUS(Kerze.schluss; 2)",
        "[]",
        "IF([]; 1; [])",
        "[] + 1",
    ],
)
def test_every_expression_without_a_syntax_problem_has_blocks_and_comes_back(source: str) -> None:
    env = env_of(STR03, "order_ausgefuehrt")
    analysis = analyze(source, env)
    block = to_blocks(analysis)
    assert block is not None, source
    text = blocks_to_text(block, env)
    again = to_blocks(analyze(text, env))
    assert again == block, (source, text)
    assert blocks_to_text(again, env) == text


def test_an_expression_with_a_syntax_problem_has_no_blocks() -> None:
    env = env_of(STR03, "stop")
    assert to_blocks(analyze("1 +", env)) is None
    assert to_blocks(analyze("FOO(", env)) is None


def test_a_name_that_is_unknown_still_has_blocks() -> None:
    env = env_of(STR03, "stop")
    block = to_blocks(analyze("gibtsnicht.wert > 1", env))
    assert block is not None
    assert block.children[0].path == ("gibtsnicht", "wert")


def test_the_kinds_of_blocks() -> None:
    block = blocks("IF(Kerze.schluss > 1; 2 + 3; 4)")
    assert block.kind is BlockKind.IF
    comparison, arithmetic, literal = block.children
    assert (comparison.kind, comparison.operator) == (BlockKind.COMPARISON, ">")
    assert (arithmetic.kind, arithmetic.operator) == (BlockKind.ARITHMETIC, "+")
    assert (literal.kind, literal.value, literal.datatype) == (BlockKind.LITERAL, 4, "integer")
    text = blocks('"x"')
    assert (text.kind, text.value, text.datatype) == (BlockKind.LITERAL, "x", "text")
    assert blocks("NOT(TRUE())").operator == "not"
    assert blocks("MIN(1; 2)").function == "MIN"
    percent = blocks("5%")
    assert (percent.datatype, percent.value) == ("percent", 5)
    assert blocks("5").datatype == "integer"
    assert blocks("5.5").datatype == "number"
    assert blocks("TRUE()").datatype == "boolean"
    assert blocks("[]").kind is BlockKind.EMPTY
    name = blocks("Strategie.stop_abstand")
    assert name.path == ("Strategie", "stop_abstand")


def test_blocks_are_the_input_of_the_expression() -> None:
    block = Block(
        BlockKind.COMPARISON,
        operator=">",
        children=(
            Block(BlockKind.NAME, path=("ema20", "wert")),
            Block(BlockKind.LITERAL, value=0.5, datatype="number"),
        ),
    )
    assert text_of(block) == "ema20.wert > 0.5"
    small = Block(BlockKind.LITERAL, value=0.00001, datatype="number")
    assert text_of(small) == "0.00001"  # no exponent: the lexer does not read one
    assert (
        text_of(Block(BlockKind.LITERAL, value=1e20, datatype="number")) == "100000000000000000000"
    )
    assert text_of(Block(BlockKind.LITERAL, value=7, datatype="percent")) == "7%"
    assert text_of(Block(BlockKind.NAME, path=("Mein Name", "Wert"))) == "[Mein Name].Wert"


@pytest.mark.parametrize(
    "block",
    [
        Block(BlockKind.NAME, path=()),
        Block(BlockKind.NAME, path=("a]b",)),
        Block(BlockKind.NAME, path=("a\nb",)),
        Block(BlockKind.LITERAL, value="x", datatype="number"),
        Block(BlockKind.LITERAL, value=True, datatype="number"),
        Block(BlockKind.LITERAL, value=1, datatype="color"),
        Block(BlockKind.LITERAL, value=float("nan"), datatype="number"),
        Block(BlockKind.LITERAL, value=1.5, datatype="integer"),
        Block(BlockKind.LITERAL, value=1, datatype="boolean"),
        Block(BlockKind.COMPARISON, operator="==", children=(Block(BlockKind.EMPTY),) * 2),
        Block(BlockKind.COMPARISON, operator="=", children=(Block(BlockKind.EMPTY),)),
        Block(BlockKind.ARITHMETIC, operator="*", children=(Block(BlockKind.EMPTY),)),
        Block(BlockKind.ARITHMETIC, operator="%", children=(Block(BlockKind.EMPTY),)),
        Block(BlockKind.LOGIC, operator="xor", children=(Block(BlockKind.EMPTY),)),
        Block(BlockKind.LOGIC, operator="not", children=(Block(BlockKind.EMPTY),) * 2),
        Block(BlockKind.LOGIC, operator="and", children=()),
        Block(BlockKind.IF, children=(Block(BlockKind.EMPTY),)),
        Block(BlockKind.FUNCTION, function="EVAL", children=(Block(BlockKind.EMPTY),)),
        Block(BlockKind.CROSSING, direction="sideways", children=(Block(BlockKind.EMPTY),) * 2),
        Block(BlockKind.CROSSING, direction="up", children=(Block(BlockKind.EMPTY),)),
        Block(
            BlockKind.CROSSING,
            direction="up",
            children=(
                Block(BlockKind.ARITHMETIC, operator="+", children=(Block(BlockKind.EMPTY),) * 2),
                Block(BlockKind.EMPTY),
            ),
        ),
    ],
)
def test_blocks_that_are_no_expression_are_refused(block: Block) -> None:
    with pytest.raises(BlockError):
        blocks_to_text(block)


def test_a_deep_expression_does_not_exhaust_the_stack() -> None:
    env = env_of(STR03, "stop")
    source = " + ".join(["1"] * 1000)
    analysis = analyze(source, env)
    block = to_blocks(analysis)
    assert block is not None
    assert blocks_to_text(block, env).count("+") == source.count("+")
    assert sentence(block, "de")


# --- sentence ----------------------------------------------------------------------------------


def sentence_of(
    source: str, language: str, strategy: Strategy = STR03, key: str = "kreuzen"
) -> str:
    env = env_of(strategy, key)
    rendered = render(source, env, language, display_input=False)
    block = to_blocks(rendered.analysis)
    assert block is not None
    return sentence(block, language, None)


def test_the_sentence_of_the_crossing() -> None:
    assert sentence_of(CROSSING_BOTH, "de") == "EMA 20 kreuzt EMA 50 in beide Richtungen"
    assert sentence_of(CROSSING_BOTH, "en") == "EMA 20 crosses EMA 50 in either direction"
    assert sentence_of(CROSSING_UP, "de") == "EMA 20 kreuzt EMA 50 nach oben"
    assert sentence_of(CROSSING_DOWN, "en") == "EMA 20 crosses EMA 50 downwards"


def test_the_sentence_of_other_blocks() -> None:
    assert sentence_of("Kerze.schluss > 1.5", "de") == "Schluss von Kerze ist größer als 1,5"
    assert sentence_of("Kerze.schluss > 1.5", "en") == "Close of Candle is greater than 1.5"
    assert sentence_of("Strategie.stop_abstand * atr14.wert", "de", key="stop") == (
        "Strategieparameter Stop-Abstand mal ATR 14"
    )
    assert sentence_of("IF(ema20.wert > ema50.wert; 1; 2)", "en") == (
        "if EMA 20 is greater than EMA 50, then 1, otherwise 2"
    )
    assert sentence_of("(1 + 2) * 3", "de") == "(1 plus 2) mal 3"
    assert (
        sentence_of("NOT(Kerze.schluss > 1)", "de") == "nicht (Schluss von Kerze ist größer als 1)"
    )
    assert sentence_of("PREVIOUS(ema20.wert)", "de") == "vorheriger Wert von EMA 20"
    assert sentence_of("5% + 1", "de") == "5 % plus 1"
    assert sentence_of("[] + 1", "de") == "… plus 1"
    assert sentence_of("-1", "de") == "−1"


def test_the_sentence_names_the_values_of_a_choice_by_label() -> None:
    env = env_of(STR03, "order_ausgefuehrt")
    rendered = render('Order.status = "ausgefuehrt"', env, "de", display_input=False)
    block = to_blocks(rendered.analysis)
    assert block is not None
    assert sentence(block, "de") == "Status von Order ist gleich „ausgeführt“"
    assert sentence(block, "en") == "Status of Order equals “filled”"


def test_the_sentence_puts_mixed_logic_in_parentheses() -> None:
    text = sentence_of("OR(AND(Kerze.schluss > 1; Kerze.hoch > 2); Kerze.tief < 3)", "de")
    assert text == (
        "(Schluss von Kerze ist größer als 1 und Hoch von Kerze ist größer als 2) "
        "oder Tief von Kerze ist kleiner als 3"
    )


# --- characters ----------------------------------------------------------------------------------


def test_the_characters_have_kind_and_position() -> None:
    found = characters('IF([EMA 20].Wert > 5%; "a"; ABS(-1.5))')
    assert [(item.kind.value, item.start, item.end) for item in found] == [
        ("function", 0, 2),
        ("bracket", 2, 3),
        ("name", 3, 16),
        ("operator", 17, 18),
        ("value", 19, 21),
        ("separator", 21, 22),
        ("value", 23, 26),
        ("separator", 26, 27),
        ("function", 28, 31),
        ("bracket", 31, 32),
        ("operator", 32, 33),
        ("value", 33, 36),
        ("bracket", 36, 37),
        ("bracket", 37, 38),
    ]


def test_brackets_know_their_partner() -> None:
    found = characters("IF((1 + 2); MAX(3))")
    brackets = [
        (index, item.partner)
        for index, item in enumerate(found)
        if item.kind is CharacterKind.BRACKET
    ]
    pairs = {(index, partner) for index, partner in brackets}
    assert all((partner, index) in pairs for index, partner in pairs)
    assert len(pairs) == 6
    assert characters("(1")[0].partner is None
    assert characters("1)")[1].partner is None


def test_a_text_with_a_syntax_problem_still_has_characters() -> None:
    found = characters("1 + § 2 [abc")
    assert [item.kind.value for item in found] == ["value", "operator", "value"]
    assert characters("")[:] == []
    assert [item.kind for item in characters("a;b")] == [
        CharacterKind.NAME,
        CharacterKind.SEPARATOR,
        CharacterKind.NAME,
    ]


# --- visible names -------------------------------------------------------------------------------


def test_the_visible_names_with_their_properties_and_kinds() -> None:
    env = env_of(STR03, "stop")
    names, truncated = visible_names(env, "de")
    assert truncated is False
    by_path = {item.path: item for item in names}
    ema = by_path[("ema20",)]
    assert (ema.display, ema.kind) == ("EMA 20", "instance")
    assert [item.key for item in ema.properties] == ["wert"]
    value = ema.properties[0]
    assert (value.datatype, value.previous_value) == ("number", True)
    assert value.explanation is not None and value.explanation.de
    assert by_path[("Strategie", "stop_abstand")].kind == "strategy_parameter"
    assert by_path[("Strategie", "stop_abstand")].display == "Stop-Abstand"
    assert by_path[("richtung",)].kind == "result"
    assert [item.key for item in by_path[("richtung",)].properties] == ["ergebnis"]
    assert by_path[("Konto",)].kind == "application_object"
    assert by_path[("Konto",)].display == "Konto"
    assert "risiko" in {item.path[0] for item in names}
    order_status = by_path[("Kerze",)].properties
    assert {item.key for item in order_status} >= {"schluss", "hoch", "tief"}
    english, _ = visible_names(env, "en")
    assert {item.display for item in english if item.kind == "application_object"} >= {
        "Account",
        "Candle",
    }


def test_the_names_after_a_calculation_show_its_result() -> None:
    """Mangel M15: a suggestion after the name of a calculation."""
    env = env_of(STR03, "stop")
    names, _ = visible_names(env, "de")
    result = next(item for item in names if item.path == ("richtung",))
    assert result.properties[0].label.de == "Ergebnis"
    assert result.properties[0].label.en == "Result"


def test_the_choices_of_a_property_are_listed_with_their_labels() -> None:
    env = env_of(ZIGZAG, CHECK)
    names, _ = visible_names(env, "de")
    signal = next(item for item in names if item.path == ("zz_signal",))
    kind = next(item for item in signal.properties if item.key == "wendepunkt_1_art")
    assert [(item.key, item.label.de, item.label.en) for item in kind.choices] == [
        ("hoch", "hoch", "high"),
        ("tief", "tief", "low"),
    ]


def test_the_names_in_a_management_include_the_order() -> None:
    strategy = STR03
    env = env_of(strategy, "order_ausgefuehrt")
    names, _ = visible_names(env, "de")
    order = next(item for item in names if item.path == ("Order",))
    assert "stop_loss" in {item.key for item in order.properties}
    outside = env_of(strategy, "kreuzen")
    names, _ = visible_names(outside, "de")
    inside_main = next(item for item in names if item.path == ("Order",))
    assert inside_main.properties  # the namespace has `Order`; its use outside is a finding


def test_the_names_are_limited(monkeypatch: pytest.MonkeyPatch) -> None:
    from pipwerk_domain.expressions import names as names_module

    monkeypatch.setattr(names_module, "MAX_NAMES_PER_ITEM", 3)
    env = env_of(STR03, "stop")
    found, truncated = visible_names(env, "de")
    assert truncated is True
    assert len(found) == 3
    monkeypatch.setattr(names_module, "MAX_PROPERTIES_PER_NAME", 2)
    monkeypatch.setattr(names_module, "MAX_NAMES_PER_ITEM", 500)
    found, _ = visible_names(env, "de")
    kerze = next(item for item in found if item.path == ("Kerze",))
    assert len(kerze.properties) == 2
    assert kerze.properties_truncated is True
    assert next(item for item in found if item.path == ("ema20",)).properties_truncated is False


def test_instances_with_content_list_it() -> None:
    from pipwerk_domain.model import Element
    from tests.helpers import indicator_instance, rule

    strategy = load("str-03")
    inner = indicator_instance("Mein Indikator", instances=[], rules=[rule("pruefung", "TRUE()")])
    strategy.elements.append(
        Element(id="00000000-0000-4000-8000-0000000000aa", type="Indikator", instance=inner)
    )
    inner.key = "mein_indikator"
    inner.instances.append(indicator_instance("inneren"))
    env = env_of(strategy, "kreuzen")
    names, _ = visible_names(env, "de")
    mine = next(item for item in names if item.path == ("mein_indikator",))
    assert {item.path[-1] for item in mine.contents} == {"pruefung", "inneren"}


def test_a_value_of_a_choice_by_its_name_is_valid_in_the_display_form_only() -> None:
    env = env_of(load("str-03"), "kreuzen")
    for text in ('Order.Status = "ausgeführt"', 'Order.Status = "filled"'):
        assert analyze(text, env, display=True).issues == [], text
    unknown = analyze('Order.Status = "executed"', env, display=True)
    assert [item.kind.value for item in unknown.issues] == ["unknown_choice_value"]
    stored = analyze('Order.status = "ausgeführt"', env)
    assert [item.kind.value for item in stored.issues] == ["unknown_choice_value"]
    assert analyze('Order.status = "ausgefuehrt"', env).issues == []


def test_json_shape_of_blocks_is_stable() -> None:
    block = blocks("ema20.wert > 1")
    assert (
        json.dumps({"kind": block.kind.value, "operator": block.operator, "n": len(block.children)})
        == '{"kind": "comparison", "operator": ">", "n": 2}'
    )
    assert Scope().names() == []
    assert catalog.RESULT_PROPERTY == "ergebnis"
