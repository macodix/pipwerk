"""Methods and "Aktualisieren" in the public web API (specification 3.1, 3.3, 3.4, 3.7, 4.2;
order 09 points 3 to 6).

The delivered types have no methods. The tests register an object type with methods in the
element register that the application gets (E7) and check the endpoints with it: the type
descriptions (``test_web_api_element_types.py``), the expressions with methods (stored form,
display form, blocks, sentence, tokens, findings, visible names), the consistency check and the
documents with inputs of every kind.
"""

import json
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from web_api_support import (
    JSON,
    body,
    check,
    codes,
    post,
    post_json,
    put,
    registry_with_methods,
    series_document,
)

from pipwerk_studio.app import create_app

CONDITION = "/elements/2/parameters/ausdruck/value"  # the condition "Prüfen"


@pytest.fixture
def methods_client(tmp_path: Path, home: Path) -> TestClient:
    return TestClient(
        create_app(f"sqlite:///{tmp_path / 'studio.db'}", registry=registry_with_methods())
    )


def ask(
    client: TestClient,
    *,
    stored: str | None = None,
    display: str | None = None,
    blocks: dict[str, Any] | None = None,
    language: str = "de",
    document: dict[str, Any] | None = None,
) -> dict[str, Any]:
    item: dict[str, Any] = {"pointer": CONDITION}
    for key, value in (("stored", stored), ("display", display), ("blocks", blocks)):
        if value is not None:
            item[key] = value
    response = post_json(
        client,
        "/api/v1/expressions",
        {"document": document or series_document(), "language": language, "items": [item]},
    )
    assert response.status_code == 200, response.text
    return response.json()["items"][0]  # type: ignore[no-any-return]


# --- the expression with a method -------------------------------------------------------------


def test_a_method_has_a_stored_form_and_a_display_form_in_both_languages(
    methods_client: TestClient,
) -> None:
    stored = 'reihe_a.wert_vor(3; "eroeffnung") > 1'
    german = ask(methods_client, stored=stored)
    assert german["stored"] == stored
    assert german["display"] == '[Reihe A].[Wert vor](3; "Eröffnungskurs") > 1'
    english = ask(methods_client, stored=stored, language="en")
    assert english["display"] == '[Reihe A].[Value before](3; "open price") > 1'
    assert english["stored"] == stored
    assert german["findings"] == [] and english["findings"] == []


@pytest.mark.parametrize(
    "text",
    [
        '[Reihe A].[Wert vor](3; "Eröffnungskurs") > 1',
        '[Reihe A].[Value before](3; "open price") > 1',
        'reihe_a.wert_vor(3; "eroeffnung") > 1',
    ],
)
def test_the_display_form_is_read_in_both_languages(methods_client: TestClient, text: str) -> None:
    answer = ask(methods_client, display=text)
    assert answer["stored"] == 'reihe_a.wert_vor(3; "eroeffnung") > 1'
    assert answer["findings"] == []


def test_the_blocks_of_a_method_have_the_blocks_of_its_arguments(
    methods_client: TestClient,
) -> None:
    answer = ask(methods_client, stored='reihe_a.wert_vor(3; "eroeffnung") > 1')
    comparison = answer["blocks"]
    assert comparison["kind"] == "comparison"
    value, constant = comparison["children"]
    assert (value["kind"], value["call"], value["path"]) == (
        "name",
        True,
        ["reihe_a", "wert_vor"],
    )
    # the blocks show the text of the choice as the display form does: by its label
    assert [(child["kind"], child["value"]) for child in value["children"]] == [
        ("literal", 3),
        ("literal", "Eröffnungskurs"),
    ]
    assert constant["call"] is False and constant["children"] == []
    assert answer["sentence"] == ("Wert vor (3; „Eröffnungskurs“) von Reihe A ist größer als 1")
    # and back: the blocks give the expression
    assert ask(methods_client, blocks=comparison)["stored"] == answer["stored"]


def test_blocks_of_a_method_that_are_built_by_the_caller(methods_client: TestClient) -> None:
    value = {
        "kind": "name",
        "path": ["reihe_a", "wert_vor"],
        "call": True,
        "children": [{"kind": "literal", "value": 5, "datatype": "integer"}],
    }
    answer = ask(
        methods_client,
        blocks={
            "kind": "comparison",
            "operator": "<",
            "children": [value, {"kind": "literal", "value": 2, "datatype": "integer"}],
        },
    )
    assert answer["stored"] == "reihe_a.wert_vor(5) < 2"
    assert answer["findings"] == []


@pytest.mark.parametrize(
    ("blocks", "reason"),
    [
        ({"kind": "name", "path": ["wert_vor"], "call": True}, "name_path"),
        (
            {
                "kind": "name",
                "path": ["reihe_a", "wert"],
                "children": [{"kind": "empty"}],
            },
            "name_children",
        ),
    ],
)
def test_blocks_that_are_no_method_are_answered_with_the_reason(
    methods_client: TestClient, blocks: dict[str, Any], reason: str
) -> None:
    response = post_json(
        methods_client,
        "/api/v1/expressions",
        {
            "document": series_document(),
            "language": "de",
            "items": [{"pointer": CONDITION, "blocks": blocks}],
        },
    )
    assert response.status_code == 422
    assert response.json()["code"] == "expressions.blocks_invalid"
    assert response.json()["params"]["reason"] == reason


def test_the_tokens_of_a_method_call(methods_client: TestClient) -> None:
    answer = ask(methods_client, stored="reihe_a.wert_vor(3; 4) > 1")
    display = answer["display"]
    shown = [(item["kind"], display[item["start"] : item["end"]]) for item in answer["tokens"]]
    assert shown == [
        ("name", "[Reihe A].[Wert vor]"),
        ("bracket", "("),
        ("value", "3"),
        ("separator", ";"),
        ("value", "4"),
        ("bracket", ")"),
        ("operator", ">"),
        ("value", "1"),
    ]
    assert (answer["tokens"][1]["partner"], answer["tokens"][5]["partner"]) == (5, 1)


@pytest.mark.parametrize(
    ("stored", "issue", "reason"),
    [
        ("reihe_a.wert_vor() > 1", "argument_count", ""),
        ("reihe_a.wert_vor > 1", "argument_count", "call_missing"),
        ("reihe_a.wert_vor(1.5) > 1", "type_mismatch", "method_argument"),
        ('reihe_a.wert_vor(1; "x") > 1', "unknown_choice_value", "method_argument"),
        ("reihe_a.nix(1) > 1", "unknown_method", "unknown"),
        ("reihe_a.wert(1) > 1", "unknown_method", "not_a_method"),
    ],
)
def test_the_findings_name_the_method_the_place_and_the_reason(
    methods_client: TestClient, stored: str, issue: str, reason: str
) -> None:
    answer = ask(methods_client, stored=stored)
    (finding,) = answer["findings"]
    assert finding["code"] == "expression.invalid"
    assert (finding["details"]["issue"], finding["details"]["reason"]) == (issue, reason)
    assert finding["element"] == "00000000-0000-4000-8000-000000000005"
    assert answer["blocks"] is not None  # an expression with a fault in a method still has blocks


def test_the_visible_names_list_the_methods_with_arguments_data_type_and_explanation(
    methods_client: TestClient,
) -> None:
    names = {tuple(item["path"]): item for item in ask(methods_client, stored="TRUE()")["names"]}
    series = names[("reihe_a",)]
    assert series["kind"] == "instance"
    assert [item["key"] for item in series["properties"]] == ["wert"]
    assert [item["key"] for item in series["methods"]] == ["wert_vor", "tendenz"]
    method = series["methods"][0]
    assert set(method) == {
        "key",
        "label",
        "datatype",
        "datatype_label",
        "explanation",
        "choices",
        "arguments",
        "previous_value",
    }
    assert method["label"] == {"de": "Wert vor", "en": "Value before"}
    assert method["datatype"] == "number"
    assert method["datatype_label"] == {"de": "Zahl", "en": "number"}
    assert method["explanation"]["de"] == "Der Wert vor einer Anzahl Werten."
    assert method["previous_value"] is True
    first, second = method["arguments"]
    assert set(first) == {
        "key",
        "label",
        "datatype",
        "datatype_label",
        "required",
        "default",
        "explanation",
        "choices",
    }
    assert (first["key"], first["datatype"], first["required"], first["default"]) == (
        "anzahl",
        "integer",
        True,
        None,
    )
    assert first["datatype_label"] == {"de": "ganze Zahl", "en": "whole number"}
    assert second["datatype_label"] == {"de": "Auswahl", "en": "choice"}
    assert first["explanation"] == {"de": "Wie viele Werte zurück.", "en": "How many values back."}
    assert (second["required"], second["default"], second["datatype"]) == (
        False,
        "schluss",
        "choice",
    )
    assert [(item["id"], item["label"]["en"]) for item in second["choices"]] == [
        ("schluss", "close price"),
        ("eroeffnung", "open price"),
    ]
    tendency = series["methods"][1]
    assert tendency["datatype"] == "choice" and tendency["arguments"] == []
    assert [item["id"] for item in tendency["choices"]] == ["aufwaerts", "abwaerts"]
    # a name without methods has an empty list
    assert names[("Konto",)]["methods"] == []


def test_previous_around_the_result_of_a_method(methods_client: TestClient) -> None:
    answer = ask(methods_client, stored="PREVIOUS(reihe_a.wert_vor(3)) < reihe_a.wert_vor(1)")
    assert answer["findings"] == []
    assert answer["display"] == "PREVIOUS([Reihe A].[Wert vor](3)) < [Reihe A].[Wert vor](1)"
    assert answer["sentence"] == (
        "vorheriger Wert von Wert vor (3) von Reihe A ist kleiner als Wert vor (1) von Reihe A"
    )
    other = ask(methods_client, stored="PREVIOUS(reihe_a.wert_vor(3) + 1) < 1")
    assert other["findings"][0]["details"]["issue"] == "previous_argument"


def test_a_crossing_of_methods_is_written_out(methods_client: TestClient) -> None:
    stored = (
        "AND(PREVIOUS(reihe_a.wert_vor(3)) <= PREVIOUS(reihe_a.wert); "
        "reihe_a.wert_vor(3) > reihe_a.wert)"
    )
    answer = ask(methods_client, stored=stored)
    assert answer["findings"] == []
    assert (answer["blocks"]["kind"], answer["blocks"]["operator"]) == ("logic", "and")
    assert [child["operator"] for child in answer["blocks"]["children"]] == ["<=", ">"]
    assert answer["sentence"] == (
        "vorheriger Wert von Wert vor (3) von Reihe A ist kleiner oder gleich "
        "vorheriger Wert von Reihe A und Wert vor (3) von Reihe A ist größer als Reihe A"
    )
    assert ask(methods_client, blocks=answer["blocks"])["stored"] == stored


# --- the check --------------------------------------------------------------------------------


def input_entry(**fields: Any) -> dict[str, Any]:
    return {"instance": "reihe_a", "property": "wert_vor", **fields}


def test_the_check_of_an_input_that_names_a_method(methods_client: TestClient) -> None:
    ok = series_document(
        inputs=[input_entry(kind="method", arguments=[3, "schluss"], refresh=True)]
    )
    answer = check(methods_client, ok).json()
    assert answer["findings"] == []
    names = [
        found
        for expression in answer["expressions"]
        for found in expression["names"]
        if found["identifier"] == "reihe_a.wert_vor"
    ]
    text = "reihe_a.wert_vor(3) > 1"
    assert [(item["start"], item["end"], item["resolved"]) for item in names] == [(0, 16, True)]
    assert text[names[0]["start"] : names[0]["end"]] == "reihe_a.wert_vor"
    assert [part["identifier"] for part in names[0]["segments"]] == ["reihe_a", "wert_vor"]


@pytest.mark.parametrize(
    ("entry", "reason"),
    [
        (input_entry(property="nix", kind="method"), "unknown_method"),
        (input_entry(property="wert", kind="method"), "unknown_method"),
        (input_entry(kind="method", arguments=[]), "arguments"),
        (input_entry(kind="method", arguments=[1.5]), "arguments"),
        (input_entry(kind="method", arguments=[1, "mittelkurs"]), "arguments"),
        (input_entry(kind="method", arguments=[1, "schluss", 3]), "arguments"),
        (input_entry(property="wert_vor"), "unknown_property"),  # a method as a property
    ],
)
def test_the_check_reports_an_input_with_a_method_or_arguments_that_do_not_fit(
    methods_client: TestClient, entry: dict[str, Any], reason: str
) -> None:
    answer = check(methods_client, series_document(inputs=[entry])).json()
    found = [item for item in answer["findings"] if item["code"] == "data.unknown"]
    assert len(found) == 1, answer["findings"]
    assert found[0]["details"]["where"] == "input"
    assert found[0]["details"]["reason"] == reason
    assert found[0]["element"] == "00000000-0000-4000-8000-000000000005"


def test_an_input_that_no_expression_uses_is_a_hint(methods_client: TestClient) -> None:
    document = series_document(inputs=[input_entry(kind="method", arguments=[3])])
    document["elements"][2]["parameters"]["ausdruck"]["value"] = "TRUE()"
    findings = check(methods_client, document).json()["findings"]
    assert codes(findings) == ["input.unused"]
    assert findings[0]["level"] == "hint"


# --- documents with inputs of every kind ------------------------------------------------------


EVERY_KIND: list[dict[str, Any]] = [
    {"instance": "reihe_a", "property": "wert"},
    {
        "instance": "reihe_a",
        "property": "wert",
        "kind": "property",
        "arguments": [],
        "refresh": True,
    },
    {
        "instance": "reihe_a",
        "property": "wert_vor",
        "kind": "method",
        "arguments": [3, "eroeffnung"],
        "refresh": False,
    },
    {
        "instance": "reihe_a",
        "property": "tendenz",
        "kind": "method",
        "arguments": [],
        "refresh": True,
    },
]
WRITTEN = [
    {
        "instance": "reihe_a",
        "property": "wert",
        "kind": "property",
        "arguments": [],
        "refresh": False,
    },
    *EVERY_KIND[1:],
]


def test_a_document_with_inputs_of_every_kind_is_saved_read_and_written_the_same(
    methods_client: TestClient, objects: Path
) -> None:
    created = post(methods_client, "strategies", series_document(inputs=EVERY_KIND))
    assert created.status_code == 201, created.text
    answer = created.json()
    assert answer["document"]["elements"][2]["inputs"] == WRITTEN
    object_id = answer["id"]
    read = methods_client.get(f"/api/v1/strategies/{object_id}").json()
    assert read == answer["document"]
    assert read["elements"][2]["inputs"] == WRITTEN
    stored = json.loads((objects / f"{object_id}.strategy.json").read_text(encoding="utf-8"))
    assert stored["elements"][2]["inputs"] == WRITTEN
    again = put(methods_client, "strategies", object_id, read)
    assert again.status_code in (200, 201), again.text
    assert again.json()["document"] == read


def test_the_instance_has_the_field_first_use(methods_client: TestClient) -> None:
    document = series_document()
    created = post(methods_client, "strategies", document).json()["document"]
    assert created["elements"][1]["instance"]["first_use"] is None
    document["elements"][1]["instance"]["first_use"] = "00000000-0000-4000-8000-000000000005"
    kept = post(methods_client, "strategies", document).json()["document"]
    assert kept["elements"][1]["instance"]["first_use"] == "00000000-0000-4000-8000-000000000005"
    document["elements"][1]["instance"]["first_use"] = "kein-bezeichner"
    assert post(methods_client, "strategies", document).status_code == 422


@pytest.mark.parametrize(
    "entry",
    [
        {"instance": "reihe_a", "property": "wert", "kind": "andere"},
        {"instance": "reihe_a", "property": "wert", "kind": "property", "arguments": [1]},
        {"instance": "reihe_a", "property": "wert_vor", "kind": "method", "arguments": [None]},
        {"instance": "reihe_a", "property": "wert_vor", "kind": "method", "arguments": [[1]]},
        {"instance": "reihe_a", "property": "wert_vor", "kind": "method", "arguments": [0] * 21},
        {"instance": "reihe_a", "property": "wert", "refresh": "ja"},
        {"instance": "reihe_a", "property": "wert", "unbekannt": 1},
    ],
)
def test_an_input_that_does_not_fit_the_format_is_answered_with_422(
    methods_client: TestClient, entry: dict[str, Any]
) -> None:
    response = methods_client.post(
        "/api/v1/strategies", content=body(series_document(inputs=[entry])), headers=JSON
    )
    assert response.status_code == 422
    assert response.json()["code"] == "document.invalid"


def test_the_trigger_start_von_hand_is_saved_as_manuell(
    methods_client: TestClient, objects: Path
) -> None:
    document = series_document()
    document["elements"][0] = {"id": document["elements"][0]["id"], "type": "trigger.manual_start"}
    created = post(methods_client, "strategies", document)
    assert created.status_code == 201, created.text
    assert created.json()["document"]["elements"][0]["type"] == "trigger.manual"
    stored = (objects / f"{created.json()['id']}.strategy.json").read_text(encoding="utf-8")
    assert "trigger.manual_start" not in stored
    assert '"type": "trigger.manual"' in stored
    assert codes(created.json()["findings"]) == []
    checked = check(methods_client, document).json()
    assert codes(checked["findings"]) == []


def test_parameter_setzen_and_markttechnik_stay_in_the_document_as_unknown_types(
    methods_client: TestClient,
) -> None:
    document = series_document()
    document["elements"].insert(
        1,
        {
            "id": "00000000-0000-4000-8000-000000000060",
            "type": "flow.set_parameter",
            "parameters": {"strategieparameter": {"kind": "fixed", "value": "zahl"}},
        },
    )
    document["elements"].insert(
        1,
        {
            "id": "00000000-0000-4000-8000-000000000061",
            "type": "Markttechnik",
            "instance": {"name": "MT", "key": "mt", "object_type": "Markttechnik"},
        },
    )
    created = post(methods_client, "strategies", document)
    assert created.status_code == 201, created.text
    unknown = [item for item in created.json()["findings"] if item["code"] == "type.unknown"]
    assert sorted(item["details"]["type"] for item in unknown) == [
        "Markttechnik",
        "flow.set_parameter",
    ]
    saved = created.json()["document"]["elements"]
    assert saved[1]["type"] == "Markttechnik" and saved[2]["type"] == "flow.set_parameter"
    assert saved[2]["parameters"] == document["elements"][2]["parameters"]  # values stay
