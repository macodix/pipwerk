"""Findings in the web API name their element and field (specification 3.6, 4.2; Mangel E3 of
the third acceptance).

After the removal of an object that several expressions used, the findings have the same text.
Each finding carries the name of its element and the label of its field in German and English, so
that the user interface can tell them apart and say where to look.
"""

from typing import Any

from fastapi.testclient import TestClient
from web_api_support import check, load_case, post, post_json, put

from pipwerk_studio import api_models, web_api

LABEL_KEYS = {"de", "en"}
FINDING_KEYS = {
    "level",
    "code",
    "element",
    "subject",
    "details",
    "element_name",
    "subject_name",
    "field_label",
}


def blank_expressions(document: dict[str, Any]) -> list[str]:
    """Blank the expression of every condition and calculation: the names of the elements."""
    names: list[str] = []
    for item in document["elements"]:
        binding = item["parameters"].get("ausdruck")
        if binding is not None and item["type"] in ("flow.condition", "flow.calculation"):
            binding["value"] = ""
            names.append(item["name"])
    return names


def empty_findings(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [item for item in findings if item["code"] == "expression.empty"]


def test_findings_with_the_same_text_are_told_apart_by_their_element(client: TestClient) -> None:
    document = load_case("str-03")
    names = blank_expressions(document)
    assert len(names) == 7
    answer = check(client, document).json()
    found = empty_findings(answer["findings"])
    assert len(found) == 7
    assert {item["details"]["field"] for item in found} == {"parameter:ausdruck"}  # the same text
    assert {item["details"]["reason"] for item in found} == {"missing"}
    assert sorted(item["element_name"]["de"] for item in found) == sorted(names)
    assert len({item["element"] for item in found}) == 7
    for item in found:
        assert item["field_label"] == {"de": "Ausdruck", "en": "Expression"}
        assert item["subject_name"] is None
        assert set(item) == FINDING_KEYS


def test_the_findings_after_the_removal_of_an_object_name_their_elements(
    client: TestClient,
) -> None:
    """The case of the acceptance: remove a strategy parameter that several expressions use."""
    removed = post_json(
        client,
        "/api/v1/removals",
        {
            "document": load_case("str-03"),
            "kind": "strategy_parameter",
            "target": "stop_abstand",
            "apply": True,
        },
    )
    assert removed.status_code == 200, removed.text
    document = removed.json()["document"]
    answer = check(client, document).json()
    found = empty_findings(answer["findings"])
    assert found, "the removal leaves empty places"
    # an empty place is one finding; two in one expression differ by their place
    assert len({(item["element"], item["details"]["start"]) for item in found}) == len(found)
    assert {item["element_name"]["de"] for item in found} == {"Stop-Loss", "Neuer Stop-Loss"}
    assert all(item["field_label"] == {"de": "Ausdruck", "en": "Expression"} for item in found)
    assert all(item["element_name"]["de"] == item["element_name"]["en"] for item in found)


def test_every_answer_with_findings_names_element_and_field(client: TestClient) -> None:
    """The check, the creation and the saving answer with the same names."""
    document = load_case("str-03")
    blank_expressions(document)
    checked = empty_findings(check(client, document).json()["findings"])
    created = post(client, "strategies", document)
    assert created.status_code == 201, created.text
    saved = empty_findings(created.json()["findings"])
    assert [item["element_name"] for item in saved] == [item["element_name"] for item in checked]
    assert all(item["field_label"] == {"de": "Ausdruck", "en": "Expression"} for item in saved)
    stored = created.json()["document"]
    again = put(client, "strategies", created.json()["id"], stored)
    assert again.status_code == 200, again.text
    assert empty_findings(again.json()["findings"]) == saved


def test_the_findings_of_the_expressions_endpoint_name_their_element_and_field(
    client: TestClient,
) -> None:
    document = load_case("str-03")
    response = post_json(
        client,
        "/api/v1/expressions",
        {
            "document": document,
            "language": "en",
            "items": [{"pointer": "/elements/5/parameters/ausdruck/value", "stored": ""}],
        },
    )
    assert response.status_code == 200, response.text
    (answer,) = response.json()["items"]
    (finding,) = answer["findings"]
    assert finding["code"] == "expression.empty"
    assert finding["element_name"] == {"de": "Richtung", "en": "Richtung"}
    assert finding["field_label"] == {"de": "Ausdruck", "en": "Expression"}
    assert finding["subject_name"] is None


def test_a_finding_about_a_field_of_an_element_with_a_type_label(client: TestClient) -> None:
    """A mandatory property without a value: the label comes from the type, in both languages."""
    document = load_case("str-03")
    order = next(item for item in document["elements"] if item["type"] == "flow.place_order")
    order["rules"] = []
    document["rules"] = []  # no rule determines the volume any more
    found = [
        item
        for item in check(client, document).json()["findings"]
        if item["code"] == "order.property_missing"
    ]
    (finding,) = found
    assert finding["element_name"] == {"de": "Order aufgeben", "en": "Order aufgeben"}
    assert finding["field_label"] == {"de": "Volumen", "en": "Volume"}


def test_a_finding_about_an_instance_names_the_instance(client: TestClient) -> None:
    document = load_case("str-03")
    element = next(
        item
        for item in document["elements"]
        if item.get("instance") and item["instance"]["name"] == "EMA 20"
    )
    element["instance"]["parameter_values"]["periode"] = {"kind": "fixed", "value": "viele"}
    found = [
        item
        for item in check(client, document).json()["findings"]
        if item["subject"] == element["instance"]["key"]
    ]
    assert found
    assert all(item["subject_name"] == "EMA 20" for item in found)
    labelled = [item for item in found if item["field_label"] is not None]
    assert labelled
    assert all(item["field_label"] == {"de": "Periode", "en": "Period"} for item in labelled)


def test_a_finding_without_an_element_has_no_names(client: TestClient) -> None:
    document = load_case("str-03")
    document["elements"] = []
    document["connections"] = []
    document["sections"] = []
    document["collapsed_managements"] = []
    findings = check(client, document).json()["findings"]
    assert findings
    for item in findings:
        if item["element"] is None:
            assert item["element_name"] is None
            assert item["field_label"] is None


def test_the_model_of_a_finding_names_the_new_fields() -> None:
    assert set(api_models.FindingModel.model_fields) == FINDING_KEYS
    schema = web_api.CheckResponse.model_json_schema()
    assert set(schema["$defs"]["FindingModel"]["properties"]) == FINDING_KEYS
    assert set(schema["$defs"]["LabelModel"]["properties"]) == LABEL_KEYS
