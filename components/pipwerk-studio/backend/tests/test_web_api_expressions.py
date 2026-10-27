"""Tests of ``POST /api/v1/expressions`` (specification 4.2, 3.4; order 04 point 7 and 12).

The endpoint answers for places of expressions in a document: both forms, the sentence, the
blocks, the tokens, the findings and the names visible at the place. Covered: every form of the
input (stored, display, blocks), both languages, a syntax error, the empty place, the blank text,
the suggestions after the name of a calculation, after a trend with a contained instance and after
a ruleset, a document of the format 1.0, the invalid pointer, the limits and the errors.
"""

import copy
import json
from typing import Any

import pytest
from fastapi.testclient import TestClient
from pipwerk_domain import limits
from web_api_support import (
    EMA_TRENDFOLGE_FILE,
    JSON,
    body,
    instance,
    load_case,
    load_case_v1,
    post_json,
    rule_document,
)

from pipwerk_studio import expressions_api

CROSSING = "/elements/4/parameters/ausdruck/value"  # the condition "Kreuzen"
RICHTUNG = "/elements/5/parameters/ausdruck/value"  # the calculation "Richtung"
STOP = "/elements/6/parameters/ausdruck/value"  # the calculation "Stop-Loss"
STATUS = "/elements/9/parameters/ausdruck/value"  # the condition "Order ausgeführt"
RULE = "/rules/0/expression"  # the rule "Risiko", it determines the volume

CROSSING_STORED = (
    "OR(AND(PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert > ema50.wert); "
    "AND(PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert))"
)
CROSSING_DISPLAY = (
    "OR(AND(PREVIOUS([EMA 20].Wert) <= PREVIOUS([EMA 50].Wert); [EMA 20].Wert > [EMA 50].Wert); "
    "AND(PREVIOUS([EMA 20].Wert) >= PREVIOUS([EMA 50].Wert); [EMA 20].Wert < [EMA 50].Wert))"
)


def ask(
    client: TestClient,
    *items: dict[str, Any],
    language: str = "de",
    document: dict[str, Any] | None = None,
) -> Any:
    return post_json(
        client,
        "/api/v1/expressions",
        {"document": document or load_case("str-03"), "language": language, "items": list(items)},
    )


def one(
    client: TestClient,
    pointer: str,
    language: str = "de",
    document: dict[str, Any] | None = None,
    **form: Any,
) -> dict[str, Any]:
    response = ask(client, {"pointer": pointer, **form}, language=language, document=document)
    assert response.status_code == 200, response.text
    answers = response.json()["items"]
    assert len(answers) == 1
    return answers[0]  # type: ignore[no-any-return]


def names(answer: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {item["display"]: item for item in answer["names"]}


# --- the forms of the input ----------------------------------------------------------------------


def test_the_stored_form_is_answered_with_both_forms_the_sentence_and_the_blocks(
    client: TestClient,
) -> None:
    answer = one(client, CROSSING, stored=CROSSING_STORED)
    assert set(answer) == {
        "stored",
        "display",
        "sentence",
        "blocks",
        "blocks_omitted",
        "tokens",
        "findings",
        "findings_truncated",
        "names",
        "names_truncated",
    }
    assert answer["stored"] == CROSSING_STORED
    assert answer["display"] == CROSSING_DISPLAY
    assert answer["sentence"] == (
        "(vorheriger Wert von EMA 20 ist kleiner oder gleich vorheriger Wert von EMA 50 "
        "und EMA 20 ist größer als EMA 50) oder "
        "(vorheriger Wert von EMA 20 ist größer oder gleich vorheriger Wert von EMA 50 "
        "und EMA 20 ist kleiner als EMA 50)"
    )
    assert answer["findings"] == []
    assert answer["blocks_omitted"] is False
    # a crossing is no block: the saved expression is broken down into its operators and
    # functions (specification 3.4, Mangel E12)
    assert _kinds(answer["blocks"]) == CROSSING_KINDS
    assert answer["blocks"]["kind"] == "logic"
    assert answer["blocks"]["operator"] == "or"
    assert "direction" not in answer["blocks"]


def _block_kinds(block: dict[str, Any]) -> set[str]:
    kinds = {block["kind"]}
    for child in block["children"]:
        kinds |= _block_kinds(child)
    return kinds


def test_the_saved_strategy_of_the_client_shows_its_crossings_written_out(
    client: TestClient,
) -> None:
    """The "EMA-Trendfolge" saved before the change (format 1.0) is read without a change:
    its conditions with a crossing are broken down into "previous value of", comparisons and
    "and"/"or", the blocks give the saved expression back, and nothing is a crossing block."""
    document = json.loads(EMA_TRENDFOLGE_FILE.read_text(encoding="utf-8"))
    checked = post_json(client, "/api/v1/check", document)
    assert checked.status_code == 200
    assert [item for item in checked.json()["findings"] if item["level"] == "error"] == []
    seen = 0
    for index in (4, 10):  # "Kreuzen" and "Kreuzen gegen die position"
        place = f"/elements/{index}/parameters/ausdruck/value"
        saved = document["elements"][index]["parameters"]["ausdruck"]["value"]
        answer = one(client, place, document=document, stored=saved)
        assert answer["findings"] == []
        assert answer["blocks"] is not None
        kinds = _block_kinds(answer["blocks"])
        assert "crossing" not in kinds
        assert {"logic", "comparison", "function"} <= kinds
        assert "vorheriger Wert von" in answer["sentence"]
        assert "kreuzt" not in answer["sentence"]
        again = one(client, place, document=document, blocks=answer["blocks"])
        reread = one(client, place, document=document, stored=again["stored"])
        assert reread["blocks"] == answer["blocks"]
        assert answer["stored"] == saved  # the saved expression is shown as it was saved
        seen += 1
    assert seen == 2


def test_the_display_form_is_answered_with_the_stored_form(client: TestClient) -> None:
    answer = one(client, CROSSING, display=CROSSING_DISPLAY)
    assert answer["stored"] == CROSSING_STORED
    assert answer["display"] == CROSSING_DISPLAY
    assert answer["findings"] == []


CROSSING_KINDS = (
    "logic or",
    (
        "logic and",
        (
            "comparison <=",
            ("function PREVIOUS", ("name",)),
            ("function PREVIOUS", ("name",)),
        ),
        ("comparison >", ("name",), ("name",)),
    ),
    (
        "logic and",
        (
            "comparison >=",
            ("function PREVIOUS", ("name",)),
            ("function PREVIOUS", ("name",)),
        ),
        ("comparison <", ("name",), ("name",)),
    ),
)


def _kinds(block: dict[str, Any]) -> Any:
    """A block as the nested tuple of its kind and operator or function and its children."""
    label = block["kind"]
    detail = block["operator"] or block["function"]
    if detail:
        label = f"{label} {detail}"
    children = tuple(_kinds(child) for child in block["children"])
    if label == "name":
        return ("name",)
    return (label, *children)


def name(*path: str) -> dict[str, Any]:
    return {"kind": "name", "path": list(path)}


def previous(inner: dict[str, Any]) -> dict[str, Any]:
    return {"kind": "function", "function": "PREVIOUS", "children": [inner]}


def comparison(operator: str, left: dict[str, Any], right: dict[str, Any]) -> dict[str, Any]:
    return {"kind": "comparison", "operator": operator, "children": [left, right]}


def crossing_blocks(first: str, second: str) -> dict[str, Any]:
    """The blocks of a crossing of the two EMA, upwards (``<=``, ``>``) or downwards."""
    ema20, ema50 = name("ema20", "wert"), name("ema50", "wert")
    return {
        "kind": "logic",
        "operator": "and",
        "children": [
            comparison(first, previous(ema20), previous(ema50)),
            comparison(second, ema20, ema50),
        ],
    }


def test_blocks_are_answered_with_the_expression_they_stand_for(client: TestClient) -> None:
    blocks = {
        "kind": "logic",
        "operator": "or",
        "children": [crossing_blocks("<=", ">"), crossing_blocks(">=", "<")],
    }
    answer = one(client, CROSSING, blocks=blocks)
    assert answer["stored"] == CROSSING_STORED
    assert answer["display"] == CROSSING_DISPLAY
    assert _kinds(answer["blocks"]) == CROSSING_KINDS


@pytest.mark.parametrize(
    ("first", "second", "stored"),
    [
        ("<=", ">", "AND(PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert > ema50.wert)"),
        (">=", "<", "AND(PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert)"),
    ],
)
def test_a_crossing_in_one_direction(
    client: TestClient, first: str, second: str, stored: str
) -> None:
    answer = one(client, CROSSING, blocks=crossing_blocks(first, second))
    assert answer["stored"] == stored
    assert answer["blocks"]["kind"] == "logic" and answer["blocks"]["operator"] == "and"
    assert [child["operator"] for child in answer["blocks"]["children"]] == [first, second]
    assert one(client, CROSSING, stored=stored)["blocks"] == answer["blocks"]
    assert answer["findings"] == []


def test_the_blocks_of_a_crossing_nested_in_and_and_or_give_the_same_expression(
    client: TestClient,
) -> None:
    """The crossing inside ``AND`` and ``OR`` without a block "Kreuzung" in all three
    directions."""
    waiting = {"kind": "literal", "value": "wartend", "datatype": "text"}
    inner = {
        "kind": "logic",
        "operator": "and",
        "children": [comparison("=", name("Order", "status"), waiting), crossing_blocks(">=", "<")],
    }
    answer = one(client, CROSSING, blocks=inner)
    again = one(client, CROSSING, stored=answer["stored"])
    assert again["blocks"] == answer["blocks"]
    assert again["stored"] == answer["stored"]


def test_a_block_of_the_kind_crossing_is_refused(client: TestClient) -> None:
    """The kind "crossing" does not exist any more (specification 3.4, Mangel E12)."""
    blocks = {
        "kind": "crossing",
        "direction": "up",
        "children": [name("ema20", "wert"), name("ema50", "wert")],
    }
    response = ask(client, {"pointer": CROSSING, "blocks": blocks})
    assert response.status_code == 422
    assert response.json()["code"] == "request.invalid"
    assert response.json()["errors"][0] == {
        "location": ["items", 0, "blocks", "kind"],
        "type": "literal_error",
    }
    extra = ask(
        client,
        {"pointer": CROSSING, "blocks": {**crossing_blocks("<=", ">"), "direction": "up"}},
    )
    assert extra.status_code == 422
    assert extra.json()["errors"] == [
        {"location": ["items", 0, "blocks", "direction"], "type": "extra_forbidden"}
    ]


def test_all_three_forms_of_the_same_expression_give_the_same_answer(client: TestClient) -> None:
    stored = one(client, STOP, stored="Kerze.schluss - Strategie.stop_abstand * atr14.wert")
    display = one(client, STOP, display=stored["display"])
    blocks = one(client, STOP, blocks=stored["blocks"])
    assert stored == display == blocks


def test_the_kinds_of_blocks(client: TestClient) -> None:
    text = 'IF(AND(ema20.wert > 5%; NOT(TRUE())); MAX(1; 2.5); -3) & "x"'
    answer = one(client, STOP, stored=text)
    root = answer["blocks"]
    assert root["kind"] == "arithmetic"
    assert root["operator"] == "&"
    condition, text_value = root["children"]
    assert text_value == {
        "kind": "literal",
        "path": None,
        "value": "x",
        "datatype": "text",
        "operator": None,
        "function": None,
        "call": False,
        "children": [],
    }
    assert condition["kind"] == "if"
    logic, maximum, sign = condition["children"]
    assert (logic["kind"], logic["operator"]) == ("logic", "and")
    comparison, negation = logic["children"]
    assert (comparison["kind"], comparison["operator"]) == ("comparison", ">")
    assert comparison["children"][1]["datatype"] == "percent"
    assert comparison["children"][1]["value"] == 5
    assert (negation["kind"], negation["operator"]) == ("logic", "not")
    assert negation["children"][0] == {
        "kind": "literal",
        "path": None,
        "value": True,
        "datatype": "boolean",
        "operator": None,
        "function": None,
        "call": False,
        "children": [],
    }
    assert (maximum["kind"], maximum["function"]) == ("function", "MAX")
    assert [child["value"] for child in maximum["children"]] == [1, 2.5]
    assert (sign["kind"], sign["operator"], len(sign["children"])) == ("arithmetic", "-", 1)
    assert one(client, STOP, blocks=root)["stored"] == answer["stored"]


# --- the languages --------------------------------------------------------------------------------


def test_the_display_form_is_written_in_the_language_of_the_request(client: TestClient) -> None:
    stored = 'IF(richtung.ergebnis = "buy"; Kerze.schluss - Strategie.stop_abstand; 0)'
    german = one(client, STOP, "de", stored=stored)
    english = one(client, STOP, "en", stored=stored)
    assert german["display"] == (
        'IF(Richtung.Ergebnis = "buy"; Kerze.Schluss - Strategie.[Stop-Abstand]; 0)'
    )
    assert english["display"] == (
        'IF(Richtung.Result = "buy"; Candle.Close - Strategy.[Stop-Abstand]; 0)'
    )
    assert german["stored"] == english["stored"] == stored
    assert german["sentence"].startswith("wenn Richtung ist gleich")
    assert english["sentence"].startswith("if Richtung equals")


def test_both_languages_are_accepted_on_input_in_either_request_language(
    client: TestClient,
) -> None:
    german = one(client, STOP, "en", display="Kerze.Schluss - Strategie.[Stop-Abstand]")
    english = one(client, STOP, "de", display="Candle.Close - Strategy.[Stop-Abstand]")
    assert german["stored"] == english["stored"] == "Kerze.schluss - Strategie.stop_abstand"
    assert german["display"] == "Candle.Close - Strategy.[Stop-Abstand]"
    assert english["display"] == "Kerze.Schluss - Strategie.[Stop-Abstand]"


def test_a_value_of_a_choice_is_written_with_its_name_and_stored_with_its_identifier(
    client: TestClient,
) -> None:
    german = one(client, STATUS, "de", stored='Order.status = "ausgefuehrt"')
    english = one(client, STATUS, "en", stored='Order.status = "ausgefuehrt"')
    assert german["display"] == 'Order.Status = "ausgeführt"'
    assert english["display"] == 'Order.Status = "filled"'
    assert german["findings"] == english["findings"] == []
    for display, language in (
        ('Order.Status = "ausgeführt"', "de"),
        ('Order.Status = "filled"', "en"),
    ):
        answer = one(client, STATUS, language, display=display)
        assert answer["stored"] == 'Order.status = "ausgefuehrt"'
        assert answer["findings"] == []
    wrong = one(client, STATUS, "de", display='Order.Status = "gibtesnicht"')
    assert wrong["stored"] == 'Order.status = "gibtesnicht"'
    assert [item["details"]["issue"] for item in wrong["findings"]] == ["unknown_choice_value"]


def test_a_name_with_a_space_stands_in_square_brackets(client: TestClient) -> None:
    answer = one(client, STOP, "de", stored="atr14.wert * Strategie.stop_abstand")
    assert answer["display"] == "[ATR 14].Wert * Strategie.[Stop-Abstand]"
    assert [item["kind"] for item in answer["tokens"]] == ["name", "operator", "name"]


# --- tokens ---------------------------------------------------------------------------------------


def test_tokens_have_kinds_and_positions_in_the_display_form(client: TestClient) -> None:
    answer = one(client, CROSSING, display="IF(1 > 2; 3; 4)")
    display = answer["display"]
    assert [(item["kind"], display[item["start"] : item["end"]]) for item in answer["tokens"]] == [
        ("function", "IF"),
        ("bracket", "("),
        ("value", "1"),
        ("operator", ">"),
        ("value", "2"),
        ("separator", ";"),
        ("value", "3"),
        ("separator", ";"),
        ("value", "4"),
        ("bracket", ")"),
    ]
    brackets = [item for item in answer["tokens"] if item["kind"] == "bracket"]
    assert [item["partner"] for item in brackets] == [9, 1]
    assert all(item["partner"] is None for item in answer["tokens"] if item["kind"] != "bracket")


def test_tokens_of_an_expression_with_a_syntax_problem_are_given_too(client: TestClient) -> None:
    answer = one(client, CROSSING, display="[EMA 20].Wert > > 1")
    assert [item["kind"] for item in answer["tokens"]] == ["name", "operator", "operator", "value"]


# --- errors in the expression --------------------------------------------------------------------


def test_a_syntax_error_has_no_blocks_and_no_sentence_but_a_finding_with_its_place(
    client: TestClient,
) -> None:
    answer = one(client, CROSSING, display="[EMA 20].Wert > > 1")
    assert answer["blocks"] is None
    assert answer["sentence"] is None
    assert answer["blocks_omitted"] is False
    assert answer["stored"] == answer["display"] == "[EMA 20].Wert > > 1"  # left as it is
    [finding] = answer["findings"]
    assert (finding["level"], finding["code"]) == ("error", "expression.invalid")
    assert finding["details"]["issue"] == "syntax"
    display = answer["display"]
    assert display[finding["details"]["start"] : finding["details"]["end"]] == ">"
    assert finding["details"]["start"] == 16
    assert finding["element"] == "7e1ab090-5a18-5414-9f00-5541c0e4b325"


def test_findings_refer_to_the_display_form(client: TestClient) -> None:
    answer = one(client, STOP, stored="ema20.wert + gibtesnicht")
    [finding] = answer["findings"]
    assert finding["details"]["issue"] == "unknown_name"
    assert answer["display"] == "[EMA 20].Wert + gibtesnicht"
    start, end = finding["details"]["start"], finding["details"]["end"]
    assert answer["display"][start:end] == "gibtesnicht"
    assert (start, end) == (16, 27)


def test_an_empty_place_is_a_block_and_a_finding(client: TestClient) -> None:
    answer = one(client, STOP, stored="ema20.wert + []")
    assert answer["display"] == "[EMA 20].Wert + []"
    assert answer["blocks"]["children"][1]["kind"] == "empty"
    assert answer["sentence"] == "EMA 20 plus …"
    [finding] = answer["findings"]
    assert (finding["code"], finding["details"]["reason"]) == ("expression.empty", "slot")
    assert answer["display"][finding["details"]["start"] : finding["details"]["end"]] == "[]"
    blocks = {
        "kind": "arithmetic",
        "operator": "+",
        "children": [{"kind": "name", "path": ["ema20", "wert"]}, {"kind": "empty"}],
    }
    assert one(client, STOP, blocks=blocks)["stored"] == "ema20.wert + []"


def test_a_blank_text_is_an_empty_expression(client: TestClient) -> None:
    forms: tuple[dict[str, Any], ...] = ({"stored": ""}, {"display": "   "})
    for form in forms:
        answer = one(client, STOP, **form)
        assert answer["blocks"]["kind"] == "empty"
        assert answer["tokens"] == []
        [finding] = answer["findings"]
        assert (finding["code"], finding["details"]["reason"]) == ("expression.empty", "missing")


def test_the_findings_are_those_of_the_place(client: TestClient) -> None:
    """An order outside of a management and a result that does not fit the property."""
    outside = one(client, CROSSING, stored="Order.volumen > 0")
    assert [item["code"] for item in outside["findings"]] == ["expression.order_outside_management"]
    mismatch = one(client, RULE, stored="Order.volumen > 0")
    [finding] = mismatch["findings"]
    assert finding["subject"] == "risiko"
    assert finding["details"]["issue"] == "type_mismatch"
    assert finding["details"]["reason"] == "result"


def test_the_findings_of_an_expression_are_cut_at_the_limit(client: TestClient) -> None:
    text = " + ".join(["gibtesnicht"] * (limits.MAX_FINDINGS_PER_EXPRESSION + 20))
    answer = one(client, STOP, stored=text)
    assert answer["findings_truncated"] is True
    assert len(answer["findings"]) == limits.MAX_FINDINGS_PER_EXPRESSION


# --- the names visible at the place ---------------------------------------------------------------


def test_names_have_their_kind_and_properties_with_explanation_and_values(
    client: TestClient,
) -> None:
    answer = one(client, STATUS, stored="TRUE()")
    visible = names(answer)
    assert visible["EMA 20"]["kind"] == "instance"
    assert visible["EMA 20"]["path"] == ["ema20"]
    [wert] = visible["EMA 20"]["properties"]
    assert wert["key"] == "wert"
    assert wert["label"] == {"de": "Wert", "en": "Value"}
    assert wert["datatype"] == "number"
    assert wert["previous_value"] is True
    assert set(wert["explanation"]) == {"de", "en"}
    assert visible["Stop-Abstand"]["kind"] == "strategy_parameter"
    assert visible["Stop-Abstand"]["path"] == ["Strategie", "stop_abstand"]
    assert visible["Stop-Abstand"]["datatype"] == "number"
    assert visible["Kerze"]["kind"] == "application_object"
    assert visible["Risiko"]["kind"] == "rule"
    status = next(item for item in visible["Order"]["properties"] if item["key"] == "status")
    assert [item["id"] for item in status["choices"]] == [
        "wartend",
        "teilausgefuehrt",
        "ausgefuehrt",
        "geloescht",
        "abgelaufen",
        "abgelehnt",
    ]
    assert status["choices"][2]["label"] == {"de": "ausgeführt", "en": "filled"}


def test_the_names_depend_on_the_language(client: TestClient) -> None:
    german = names(one(client, STATUS, "de", stored="TRUE()"))
    english = names(one(client, STATUS, "en", stored="TRUE()"))
    assert "Kerze" in german and "Candle" in english and "Candle" not in german
    assert "Strategie" in german and "Strategy" in english


def test_after_the_name_of_a_calculation_its_result_is_offered(client: TestClient) -> None:
    answer = one(client, STOP, stored="TRUE()")  # "Stop-Loss" sees "Richtung"
    richtung = names(answer)["Richtung"]
    assert richtung["kind"] == "result"
    assert richtung["path"] == ["richtung"]
    [ergebnis] = richtung["properties"]
    assert ergebnis["key"] == "ergebnis"
    assert ergebnis["label"] == {"de": "Ergebnis", "en": "Result"}
    assert set(ergebnis["explanation"]) == {"de", "en"}
    # the name space of the strategy holds every calculation; a use of its own result is
    # reported as a circular reference by the check, not hidden here
    assert names(answer)["Stop-Loss"]["kind"] == "result"
    assert "Kreuzen" in names(answer)  # a condition before it is a result too
    assert names(answer)["Kreuzen"]["kind"] == "result"


def trend_document() -> dict[str, Any]:
    """The test case with an element of the type Trend whose instance holds an indicator."""
    document = load_case("str-03")
    ema = copy.deepcopy(document["elements"][0])
    ema["id"] = "00000000-0000-4000-8000-0000000000e1"
    inner = copy.deepcopy(ema["instance"])
    inner.update(name="Schneller EMA", key="schnell")
    outer = instance(
        "Mein Trend",
        "Trend",
        "mein_trend",
        parameter_values={
            "zeiteinheit": {"kind": "fixed", "value": "h1"},
            "berechnungsverfahren": {"kind": "fixed", "value": "trend_method.expression"},
        },
        properties=[
            {"key": "richtung", "name": "Richtung", "datatype": "text", "expression": '"auf"'}
        ],
        instances=[inner],
    )
    document["elements"].append(
        {
            "id": "00000000-0000-4000-8000-0000000000e2",
            "type": "Trend",
            "name": None,
            "key": None,
            "instance": outer,
        }
    )
    return document


def test_after_a_trend_with_a_contained_instance_the_instance_is_offered(
    client: TestClient,
) -> None:
    document = trend_document()
    pointer = "/elements/4/parameters/ausdruck/value"
    answer = one(client, pointer, document=document, stored="TRUE()")
    trend = names(answer)["Mein Trend"]
    assert trend["kind"] == "instance"
    assert trend["path"] == ["mein_trend"]
    assert {item["key"] for item in trend["properties"]} >= {"richtung"}
    [contained] = trend["contents"]
    assert contained["display"] == "Schneller EMA"
    assert contained["path"] == ["mein_trend", "schnell"]
    assert contained["kind"] == "instance"
    assert [item["key"] for item in contained["properties"]] == ["wert"]
    # the contained instance is addressed with the name of the trend in front of it
    reached = one(client, pointer, document=document, stored="mein_trend.schnell.wert > 1")
    assert reached["findings"] == []
    assert reached["display"] == "[Mein Trend].[Schneller EMA].Wert > 1"


def test_after_a_ruleset_its_rules_are_offered(client: TestClient) -> None:
    document = load_case("str-03")
    ruleset = instance(
        "Meine Regeln",
        "Regelwerk",
        "regeln",
        rules=[
            instance("Erste Regel", "Regel", "erste", expression="TRUE()"),
            instance("Zweite Regel", "Regel", "zweite", expression="TRUE()"),
        ],
    )
    document["rules"].append(ruleset)
    answer = one(client, STATUS, document=document, stored="TRUE()")
    werk = names(answer)["Meine Regeln"]
    assert werk["kind"] == "rule"
    assert werk["path"] == ["regeln"]
    assert [(item["display"], item["kind"]) for item in werk["contents"]] == [
        ("Erste Regel", "rule"),
        ("Zweite Regel", "rule"),
    ]
    assert [item["path"] for item in werk["contents"]] == [
        ["regeln", "erste"],
        ["regeln", "zweite"],
    ]


def test_a_rule_template_sees_its_parameters_and_the_application(client: TestClient) -> None:
    document = rule_document("Meine Regel")
    document["parameters"] = [
        {"key": "grenze", "name": "Grenze", "datatype": "number", "default": 1.0}
    ]
    answer = one(client, "/expression", document=document, stored="grenze > Order.volumen")
    visible = names(answer)
    assert visible["Grenze"]["kind"] == "parameter"
    assert visible["Grenze"]["datatype"] == "number"
    assert "Order" in visible
    assert answer["display"] == "Grenze > Order.Volumen"


def test_the_names_are_cut_at_the_limit_and_the_answer_says_so(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from pipwerk_domain.expressions import names as library_names

    monkeypatch.setattr(library_names, "MAX_NAMES_PER_ITEM", 5)
    answer = one(client, STATUS, stored="TRUE()")
    assert answer["names_truncated"] is True
    assert len(answer["names"]) == 5


def test_the_properties_of_a_name_are_cut_at_the_limit_and_the_answer_says_so(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from pipwerk_domain.expressions import names as library_names

    monkeypatch.setattr(library_names, "MAX_PROPERTIES_PER_NAME", 3)
    answer = one(client, STATUS, stored="TRUE()")
    order = names(answer)["Order"]
    assert len(order["properties"]) == 3
    assert order["properties_truncated"] is True
    assert names(answer)["EMA 20"]["properties_truncated"] is False


def test_the_limits_of_the_names_are_those_of_the_specification() -> None:
    assert limits.MAX_NAMES_PER_ITEM == 500
    assert limits.MAX_PROPERTIES_PER_NAME == 200
    assert limits.MAX_ITEMS_PER_REQUEST == 50


# --- several items, the document of the format 1.0 ------------------------------------------------


def test_the_items_are_answered_in_their_order(client: TestClient) -> None:
    response = ask(
        client,
        {"pointer": STOP, "stored": "1"},
        {"pointer": CROSSING, "stored": "2"},
        {"pointer": STATUS, "display": "3"},
    )
    assert response.status_code == 200
    assert [item["stored"] for item in response.json()["items"]] == ["1", "2", "3"]


def test_a_document_of_the_format_one_is_accepted(client: TestClient) -> None:
    """The pointer names the place in the document as the format 2.0 writes it."""
    document = load_case_v1("str-03")
    assert document["format_version"] == "1.0"
    answer = one(client, CROSSING, document=document, display="[EMA 20].Wert > 1")
    assert answer["stored"] == "ema20.wert > 1"
    assert answer["findings"] == []


def test_a_rule_template_is_a_document_too(client: TestClient) -> None:
    answer = one(client, "/expression", document=rule_document(), stored="Order.volumen > 1")
    assert answer["display"] == "Order.Volumen > 1"
    assert answer["findings"] == []


# --- the pointer ----------------------------------------------------------------------------------


@pytest.mark.parametrize(
    "pointer",
    [
        "",
        "elements",
        "/",
        "/elements/99/parameters/ausdruck/value",
        "/elements/4/parameters/unbekannt/value",
        "/elements/4/parameters/ausdruck",
        "/elements/4/name",
        "/elements/4",
        "/elements/-1/parameters/ausdruck/value",
        "/elements/04/parameters/ausdruck/value",
        "/elements/4/parameters/ausdruck/value/",
        "/elements/4/parameters/ausdruck~2/value",
        "/name",
        "/rules/5/expression",
        "/" + "a" * 900,
    ],
)
def test_a_pointer_that_names_no_place_of_an_expression_is_422_with_the_index_of_the_item(
    client: TestClient, pointer: str
) -> None:
    response = ask(client, {"pointer": STOP, "stored": "1"}, {"pointer": pointer, "stored": "1"})
    assert response.status_code == 422
    assert response.json() == {
        "detail": "The pointer of an item does not name a place of an expression in the document.",
        "code": "expressions.pointer_invalid",
        "params": {"index": 1},
    }


def test_the_place_may_be_missing_if_the_object_it_belongs_to_is_there(
    client: TestClient,
) -> None:
    """The element "Kreuzen" takes the expression in `parameters.ausdruck.value`; a document in
    which the binding is missing still names the place."""
    document = load_case("str-03")
    del document["elements"][4]["parameters"]["ausdruck"]
    answer = one(client, CROSSING, document=document, stored="TRUE()")
    assert answer["stored"] == "TRUE()"


def test_the_pointer_is_checked_for_every_item(client: TestClient) -> None:
    response = ask(
        client, {"pointer": STOP, "stored": "1"}, {"pointer": "/nowhere", "display": "1"}
    )
    assert response.json()["params"] == {"index": 1}


# --- blocks that are no expression ----------------------------------------------------------------


@pytest.mark.parametrize(
    ("blocks", "reason"),
    [
        ({"kind": "name", "path": []}, "name_path"),
        ({"kind": "literal", "value": "x", "datatype": "number"}, "literal_value"),
        ({"kind": "literal", "value": 1, "datatype": "text"}, "literal_value"),
        ({"kind": "literal", "value": 1}, "literal_datatype"),
        ({"kind": "comparison", "operator": "~", "children": [{"kind": "empty"}] * 2}, "operator"),
        ({"kind": "comparison", "operator": ">", "children": [{"kind": "empty"}]}, "operand_count"),
        ({"kind": "function", "function": "GIBTESNICHT", "children": []}, "function"),
        ({"kind": "if", "children": [{"kind": "empty"}]}, "if_children"),
        ({"kind": "logic", "operator": "xor", "children": []}, "operator"),
        ({"kind": "logic", "operator": "not", "children": []}, "operand_count"),
    ],
)
def test_blocks_that_are_no_expression_are_422(
    client: TestClient, blocks: dict[str, Any], reason: str
) -> None:
    response = ask(client, {"pointer": STOP, "stored": "1"}, {"pointer": STOP, "blocks": blocks})
    assert response.status_code == 422
    answer = response.json()
    assert answer["code"] == "expressions.blocks_invalid"
    assert answer["params"]["index"] == 1
    assert answer["params"]["reason"] == reason
    assert answer["detail"] == "The blocks of an item are no expression."


def test_blocks_of_an_unknown_kind_are_422_with_the_place(client: TestClient) -> None:
    response = ask(client, {"pointer": STOP, "blocks": {"kind": "bogus"}})
    assert response.status_code == 422
    assert response.json()["code"] == "request.invalid"
    assert response.json()["errors"] == [
        {"location": ["items", 0, "blocks", "kind"], "type": "literal_error"}
    ]


def test_blocks_nested_deeper_than_the_limit_are_422_and_never_exhaust_the_stack(
    client: TestClient,
) -> None:
    def nested(levels: int) -> dict[str, Any]:
        root: dict[str, Any] = {"kind": "empty"}
        for _ in range(levels):
            root = {"kind": "arithmetic", "operator": "-", "children": [root]}
        return root

    at_the_limit = one(client, STOP, blocks=nested(limits.MAX_BLOCK_DEPTH - 1))
    assert at_the_limit["blocks_omitted"] is False
    assert at_the_limit["stored"].startswith("-")
    response = ask(client, {"pointer": STOP, "blocks": nested(limits.MAX_BLOCK_DEPTH)})
    assert response.status_code == 422
    assert response.json()["code"] == "expressions.blocks_invalid"
    assert response.json()["params"]["reason"] == "too_deep"
    raw = (
        f'{{"document": {json.dumps(load_case("str-03"))}, "language": "de", '
        f'"items": [{{"pointer": "{STOP}", "blocks": '
        + '{"kind":"arithmetic","operator":"-","children":[' * 5000
        + '{"kind":"empty"}'
        + "]}" * 5000
        + "}]}"
    )
    deep = client.post("/api/v1/expressions", content=raw, headers=JSON)
    assert deep.status_code == 422
    assert deep.json()["params"]["reason"] == "too_deep"


def test_blocks_that_make_a_text_longer_than_an_expression_may_be_are_422(
    client: TestClient,
) -> None:
    blocks = {
        "kind": "function",
        "function": "MAX",
        "children": [{"kind": "literal", "value": 1, "datatype": "integer"}] * 1500,
    }
    response = ask(client, {"pointer": STOP, "blocks": blocks})
    assert response.status_code == 422
    assert response.json()["params"]["reason"] == "too_long"


def test_blocks_that_make_a_text_nested_deeper_than_an_expression_may_be_are_422(
    client: TestClient,
) -> None:
    blocks: dict[str, Any] = {"kind": "empty"}
    for _ in range(limits.MAX_EXPRESSION_NESTING + 1):
        blocks = {"kind": "function", "function": "ABS", "children": [blocks]}
    response = ask(client, {"pointer": STOP, "blocks": blocks})
    assert response.status_code == 422
    assert response.json()["params"]["reason"] == "too_deep"


def test_a_tree_deeper_than_the_limit_of_the_answer_is_answered_without_blocks(
    client: TestClient,
) -> None:
    text = "+".join(["1"] * 400)  # a sum of 400 terms is a tree of 400 levels
    answer = one(client, STOP, stored=text)
    assert answer["blocks_omitted"] is True
    assert answer["blocks"] is None
    assert answer["sentence"].startswith("1 plus 1")
    assert answer["findings"] == []
    short = one(client, STOP, stored="+".join(["1"] * 100))
    assert short["blocks_omitted"] is False
    assert short["blocks"] is not None


# --- the request ----------------------------------------------------------------------------------


def test_one_to_fifty_items_are_accepted_and_zero_or_more_are_422(client: TestClient) -> None:
    items = [{"pointer": STOP, "stored": str(number)} for number in range(51)]
    assert ask(client, *items[:1]).status_code == 200
    fifty = ask(client, *items[:50])
    assert fifty.status_code == 200
    assert len(fifty.json()["items"]) == 50
    for count in (0, 51):
        response = ask(client, *items[:count])
        assert response.status_code == 422, count
        assert response.json()["code"] == "request.invalid"
        assert response.json()["errors"][0]["location"] == ["items"]


@pytest.mark.parametrize(
    "item",
    [
        {"pointer": STOP},
        {"pointer": STOP, "stored": "1", "display": "1"},
        {"pointer": STOP, "stored": "1", "blocks": {"kind": "empty"}},
        {"pointer": STOP, "display": "1", "blocks": {"kind": "empty"}},
        {"stored": "1"},
        {"pointer": STOP, "stored": 1},
        {"pointer": STOP, "stored": "1", "extra": 1},
        {"pointer": STOP, "stored": None},
        {"pointer": 5, "stored": "1"},
        {"pointer": STOP, "stored": "x" * (limits.MAX_EXPRESSION_LENGTH + 1)},
        {
            "pointer": STOP,
            "display": "(" * (limits.MAX_EXPRESSION_NESTING + 1)
            + ")" * (limits.MAX_EXPRESSION_NESTING + 1),
        },
    ],
)
def test_an_item_needs_a_pointer_and_exactly_one_form(
    client: TestClient, item: dict[str, Any]
) -> None:
    response = ask(client, item)
    assert response.status_code == 422
    assert response.json()["code"] == "request.invalid"
    assert response.json()["errors"]


def test_the_longest_expression_is_accepted(client: TestClient) -> None:
    text = "1" + "+1" * ((limits.MAX_EXPRESSION_LENGTH - 1) // 2)
    assert len(text) <= limits.MAX_EXPRESSION_LENGTH
    answer = one(client, STOP, stored=text)
    assert answer["stored"] == text
    assert answer["blocks_omitted"] is True


@pytest.mark.parametrize(
    "request_body",
    [
        {},
        {"language": "de", "items": [{"pointer": STOP, "stored": "1"}]},
        {"document": {}, "items": [{"pointer": STOP, "stored": "1"}]},
        {"document": {}, "language": "fr", "items": [{"pointer": STOP, "stored": "1"}]},
        {"document": [], "language": "de", "items": [{"pointer": STOP, "stored": "1"}]},
        {"language": "de", "items": [], "extra": 1},
        [],
        None,
    ],
)
def test_the_request_needs_the_document_the_language_and_the_items(
    client: TestClient, request_body: Any
) -> None:
    response = post_json(client, "/api/v1/expressions", request_body)
    assert response.status_code == 422
    assert response.json()["code"] == "request.invalid"


@pytest.mark.parametrize("raw", [b"", b"not json", b"{", b"\xff", b"[" * 100000])
def test_a_body_that_is_no_json_is_422(client: TestClient, raw: bytes) -> None:
    response = client.post("/api/v1/expressions", content=raw, headers=JSON)
    assert response.status_code == 422
    assert response.json() == {
        "detail": "The request is invalid.",
        "code": "request.invalid",
        "params": {},
        "errors": [{"location": [], "type": "json_invalid"}],
    }


def test_a_document_that_does_not_fit_is_422_with_the_place_below_the_document(
    client: TestClient,
) -> None:
    document = load_case("str-03")
    document["zusaetzlich"] = "MARKER"
    document["elements"][0]["position"] = "MARKER"
    response = ask(client, {"pointer": STOP, "stored": "1"}, document=document)
    assert response.status_code == 422
    answer = response.json()
    assert answer["code"] == "document.invalid"
    locations = [item["location"] for item in answer["errors"]]
    assert ["document", "zusaetzlich"] in locations
    assert ["document", "elements", 0, "position"] in locations
    assert "MARKER" not in response.text


def test_the_media_type_must_be_json(client: TestClient) -> None:
    response = client.post(
        "/api/v1/expressions", content=body({}), headers={"content-type": "text/plain"}
    )
    assert response.status_code == 415
    assert response.json()["code"] == "request.not_json"


def test_the_endpoint_changes_nothing_and_needs_no_object_directory(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("HOME")
    assert one(client, STOP, stored="1")["stored"] == "1"
    assert client.get("/api/v1/strategies").json() == {"items": []}


def test_a_big_document_is_answered_with_all_items(client: TestClient) -> None:
    document = load_case("str-03")
    for number in range(limits.MAX_STRATEGY_PARAMETERS - 2):
        document["parameters"].append(
            {"key": f"p{number}", "name": f"P {number}", "datatype": "number", "value": 1}
        )
    items = [{"pointer": STOP, "display": f"Strategie.[P {number}] + 1"} for number in range(50)]
    response = ask(client, *items, document=document)
    assert response.status_code == 200
    answers = response.json()["items"]
    assert [item["stored"] for item in answers] == [f"Strategie.p{n} + 1" for n in range(50)]
    assert all(item["findings"] == [] for item in answers)


def test_the_models_of_the_answer_reject_additional_fields() -> None:
    for model in (
        expressions_api.ExpressionsRequest,
        expressions_api.ExpressionItem,
        expressions_api.ExpressionAnswer,
        expressions_api.ExpressionsResponse,
        expressions_api.BlockModel,
        expressions_api.TokenModel,
        expressions_api.VisibleNameModel,
        expressions_api.VisiblePropertyModel,
        expressions_api.KeyRequest,
        expressions_api.KeyResponse,
    ):
        assert model.model_config.get("extra") == "forbid", model.__name__
