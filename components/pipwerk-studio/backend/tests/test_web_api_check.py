"""Tests of ``POST /api/v1/check`` (specification 4.2 and 5.3).

The check runs on a document of any kind without saving it. The answer names the findings and,
for each expression, the recognized names with position and identifier. Positions refer to the
expression as it was sent.
"""

from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from web_api_support import (
    check,
    codes,
    indicator_document,
    load_case,
    post,
    rule_document,
    ruleset_document,
    trend_document,
)

from pipwerk_studio import web_api


@pytest.mark.parametrize("name", ["str-01", "str-03"])
def test_a_test_case_has_no_finding(client: TestClient, name: str) -> None:
    response = check(client, load_case(name))
    assert response.status_code == 200
    answer = response.json()
    assert answer["findings"] == []
    assert answer["names_truncated"] is False
    assert answer["expressions"]
    web_api.CheckResponse.model_validate(answer)


@pytest.mark.parametrize(
    "document",
    [
        indicator_document(),
        trend_document(),
        rule_document(),
        ruleset_document("Regelwerk", []),
    ],
    ids=["indicator", "trend", "rule", "ruleset"],
)
def test_a_template_of_every_kind_can_be_checked(
    client: TestClient, document: dict[str, Any]
) -> None:
    response = check(client, document)
    assert response.status_code == 200, response.text
    web_api.CheckResponse.model_validate(response.json())


def test_every_recognized_name_stands_where_the_answer_says(client: TestClient) -> None:
    document = load_case("str-01")
    elements = {item["id"]: item for item in document["elements"]}
    answer = check(client, document).json()
    seen = 0
    for expression in answer["expressions"]:
        element = elements.get(expression["element"])
        if element is None or expression["field"] != "parameter:ausdruck":
            continue
        text = element["parameters"]["ausdruck"]["value"]
        for found in expression["names"]:
            assert found["resolved"] is True
            written = text[found["start"] : found["end"]]
            assert written.replace(" ", "").lower() == found["identifier"].lower()
            assert [part["identifier"] for part in found["segments"]] == found["identifier"].split(
                "."
            )
            for part in found["segments"]:
                assert part["identifier"].lower() in text[part["start"] : part["end"]].lower()
            seen += 1
    assert seen >= 10


def test_the_names_of_a_rule_of_the_strategy_name_their_instance(client: TestClient) -> None:
    answer = check(client, load_case("str-01")).json()
    rule_expressions = [item for item in answer["expressions"] if item["subject"] == "risiko"]
    assert [item["field"] for item in rule_expressions] == ["expression"]
    assert rule_expressions[0]["element"] is None
    identifiers = {item["identifier"] for item in rule_expressions[0]["names"]}
    assert {"Order.volumen", "Konto.kapital", "risikogrenze"} <= identifiers


def test_names_that_are_not_known_are_not_resolved(client: TestClient) -> None:
    document = rule_document(expression="Kerze.schlus > gibtesnicht.x")
    answer = check(client, document).json()
    text = "Kerze.schlus > gibtesnicht.x"
    first, second = answer["expressions"][0]["names"]
    # the whole written name is the place, the identifier and the segments are the known parts
    assert text[first["start"] : first["end"]] == "Kerze.schlus"
    assert first["resolved"] is False
    assert first["identifier"] == "Kerze"
    assert [part["identifier"] for part in first["segments"]] == ["Kerze"]
    assert text[second["start"] : second["end"]] == "gibtesnicht.x"
    assert second["resolved"] is False
    assert second["identifier"] == ""
    assert second["segments"] == []
    assert codes(answer["findings"]) == ["expression.invalid", "rule.unresolved_name"]


def test_a_name_in_previous_is_marked(client: TestClient) -> None:
    document = rule_document(expression="PREVIOUS(Kerze.schluss) < Kerze.schluss")
    answer = check(client, document).json()
    marks = sorted(item["previous"] for item in answer["expressions"][0]["names"])
    assert marks == [False, True]


def test_check_does_not_normalize_so_positions_refer_to_the_text_that_was_sent(
    client: TestClient,
) -> None:
    text = "  order.VOLUMEN   >   0"
    answer = check(client, rule_document(expression=text)).json()
    name = answer["expressions"][0]["names"][0]
    assert name["identifier"] == "Order.volumen"
    assert text[name["start"] : name["end"]] == "order.VOLUMEN"


def test_check_names_the_findings_like_saving_does(client: TestClient) -> None:
    document = load_case("str-03")
    document["elements"].append(
        {"id": "00000000-0000-4000-8000-0000000000bb", "type": "x.unbekannt", "title": "?"}
    )
    checked = check(client, document).json()["findings"]
    saved = post(client, "strategies", document).json()["findings"]
    assert codes(checked) == codes(saved)
    assert "type.unknown" in codes(checked)


def test_check_needs_no_object_directory(
    client: TestClient, objects: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("HOME")
    assert check(client, load_case("str-03")).status_code == 200
    assert not objects.exists()


def test_the_names_of_a_big_check_are_limited(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from pipwerk_domain.consistency import engine

    monkeypatch.setattr(engine, "MAX_NAMES_PER_CHECK", 5)
    answer = check(client, load_case("str-01")).json()
    assert answer["names_truncated"] is True
    assert sum(len(item["names"]) for item in answer["expressions"]) == 5
