"""Tests of the endpoints for strategies and templates of the public web API
(specification 4.2, order 03 point 2 and acceptance criteria 4 to 6 of ``wp01``).

Covered: create, list, read, replace and delete for all five kinds with success and error
cases; both test case documents (create, list, read: equal except identifier; one file each in
the object directory); the changed versions of a test case with the findings that belong to
them, checked without saving and saved by ``PUT``; the identifier of the path is authoritative;
kind and format must fit; normalization when saving; the delivered template cannot be changed
or deleted.
"""

import copy
import json
from collections.abc import Callable
from pathlib import Path
from typing import Any
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from web_api_support import (
    CHECKED_CASES,
    JSON,
    RISK_TEMPLATE_ID,
    check,
    codes,
    indicator_document,
    load_case,
    post,
    put,
    rule_document,
    ruleset_document,
    trend_document,
    without_id,
)

ARTS = {
    "strategies": "strategy",
    "indicators": "indicator",
    "trends": "trend",
    "rules": "rule",
    "rulesets": "ruleset",
}


def sample(art: str) -> dict[str, Any]:
    if art == "strategies":
        return load_case("str-03")
    return {
        "indicators": indicator_document,
        "trends": trend_document,
        "rules": rule_document,
        "rulesets": lambda: ruleset_document("Regelwerk", []),
    }[art]()


def files(directory: Path) -> list[str]:
    return sorted(item.name for item in directory.iterdir()) if directory.exists() else []


# --- the two test case documents ----------------------------------------------------------


@pytest.mark.parametrize("name", ["str-01", "str-03"])
def test_a_test_case_is_created_listed_and_read_back_equal_except_identifier(
    client: TestClient, objects: Path, name: str
) -> None:
    document = load_case(name)
    created = post(client, "strategies", document)
    assert created.status_code == 201
    answer = created.json()
    assert set(answer) == {"id", "document", "findings"}
    if name in CHECKED_CASES:
        assert answer["findings"] == []  # no finding at all, not even a hint
    object_id = answer["id"]
    assert object_id != document["id"]  # a new identifier replaces the one of the document
    assert answer["document"]["id"] == object_id
    assert without_id(answer["document"]) == without_id(document)

    listing = client.get("/api/v1/strategies").json()["items"]
    assert [item["id"] for item in listing] == [object_id]
    assert listing[0]["name"] == document["name"]
    assert "title" not in listing[0]
    assert listing[0]["description"] == document["description"]
    assert listing[0]["unreadable"] is False

    read = client.get(f"/api/v1/strategies/{object_id}")
    assert read.status_code == 200
    assert without_id(read.json()) == without_id(document)
    assert read.json() == answer["document"]
    assert files(objects) == [f"{object_id}.strategy.json"]


def test_both_test_cases_are_listed_with_one_file_each(client: TestClient, objects: Path) -> None:
    first = post(client, "strategies", load_case("str-01")).json()["id"]
    second = post(client, "strategies", load_case("str-03")).json()["id"]
    listing = client.get("/api/v1/strategies").json()["items"]
    assert {item["id"] for item in listing} == {first, second}
    assert files(objects) == sorted([f"{first}.strategy.json", f"{second}.strategy.json"])
    for item in listing:
        assert item["modified"].endswith("Z")
    names = [item["name"] for item in listing]
    assert names == sorted(names, key=str.casefold)


def test_the_stored_file_is_the_document_as_the_library_writes_it(
    client: TestClient, objects: Path
) -> None:
    object_id = post(client, "strategies", load_case("str-03")).json()["id"]
    text = (objects / f"{object_id}.strategy.json").read_text(encoding="utf-8")
    assert text.endswith("\n")
    assert json.loads(text)["id"] == object_id
    assert client.get(f"/api/v1/strategies/{object_id}").text == text


# --- all kinds ------------------------------------------------------------------------------


@pytest.mark.parametrize("art", list(ARTS))
def test_create_list_read_replace_and_delete_for_every_kind(
    client: TestClient, objects: Path, art: str
) -> None:
    kind = ARTS[art]
    assert client.get(f"/api/v1/{art}").json() == {"items": []}

    created = post(client, art, sample(art))
    assert created.status_code == 201, created.text
    object_id = created.json()["id"]
    assert files(objects) == [f"{object_id}.{kind}.json"]

    items = client.get(f"/api/v1/{art}").json()["items"]
    assert [item["id"] for item in items] == [object_id]
    assert items[0]["unreadable"] is False
    if art == "strategies":
        assert items[0]["object_type"] is None
    else:
        assert items[0]["object_type"] == sample(art)["object_type"]

    stored = client.get(f"/api/v1/{art}/{object_id}").json()
    assert stored["id"] == object_id

    changed = copy.deepcopy(stored)
    changed["name"] = "Geändert"
    changed["description"] = "Neue Beschreibung"
    replaced = put(client, art, object_id, changed)
    assert replaced.status_code == 200, replaced.text
    assert replaced.json()["id"] == object_id
    assert replaced.json()["document"]["name"] == "Geändert"
    assert client.get(f"/api/v1/{art}/{object_id}").json()["name"] == "Geändert"
    assert client.get(f"/api/v1/{art}").json()["items"][0]["description"] == "Neue Beschreibung"
    assert files(objects) == [f"{object_id}.{kind}.json"]

    deleted = client.delete(f"/api/v1/{art}/{object_id}")
    assert deleted.status_code == 204
    assert deleted.content == b""
    assert files(objects) == []
    assert client.get(f"/api/v1/{art}/{object_id}").status_code == 404
    assert client.get(f"/api/v1/{art}").json() == {"items": []}


@pytest.mark.parametrize("art", list(ARTS))
def test_an_unknown_identifier_is_404_for_read_delete_and_usages(
    client: TestClient, art: str
) -> None:
    unknown = str(uuid4())
    assert client.get(f"/api/v1/{art}/{unknown}").status_code == 404
    assert client.delete(f"/api/v1/{art}/{unknown}").status_code == 404
    assert client.get(f"/api/v1/{art}/{unknown}/usages").status_code == 404
    answer = client.get(f"/api/v1/{art}/{unknown}")
    assert answer.json() == {
        "detail": "The object does not exist.",
        "code": "object.not_found",
        "params": {},
    }


@pytest.mark.parametrize("art", list(ARTS))
@pytest.mark.parametrize("method", ["get", "delete"])
def test_the_identifier_must_be_a_uuid_otherwise_422(
    client: TestClient, art: str, method: str
) -> None:
    for text in ("not-a-uuid", "1234", "../../etc/passwd", "%2e%2e"):
        response = getattr(client, method)(f"/api/v1/{art}/{text}")
        assert response.status_code in (404, 422), text
        if response.status_code == 422:
            assert response.json()["errors"][0]["location"] == ["path", "id"]
    response = getattr(client, method)(f"/api/v1/{art}/not-a-uuid")
    assert response.status_code == 422
    assert response.json() == {
        "detail": "The request is invalid.",
        "code": "request.invalid",
        "params": {},
        "errors": [{"location": ["path", "id"], "type": "uuid_parsing"}],
    }
    assert "not-a-uuid" not in response.text  # the input is not repeated
    put_response = client.put(f"/api/v1/{art}/not-a-uuid", content=b"{}", headers=JSON)
    assert put_response.status_code == 422
    assert client.get(f"/api/v1/{art}/not-a-uuid/usages").status_code == 422


def test_an_identifier_in_capitals_names_the_same_object(client: TestClient) -> None:
    object_id = post(client, "strategies", load_case("str-03")).json()["id"]
    assert client.get(f"/api/v1/strategies/{object_id.upper()}").status_code == 200
    assert client.delete(f"/api/v1/strategies/{object_id.upper()}").status_code == 204


def test_the_identifier_in_the_document_is_replaced_when_creating(client: TestClient) -> None:
    document = load_case("str-03")
    first = post(client, "strategies", document).json()["id"]
    second = post(client, "strategies", document).json()["id"]
    assert len({first, second, document["id"]}) == 3
    assert len(client.get("/api/v1/strategies").json()["items"]) == 2


def test_a_document_without_an_identifier_is_not_a_document(client: TestClient) -> None:
    response = post(client, "strategies", without_id(load_case("str-03")))
    assert response.status_code == 422
    assert {"location": ["id"], "type": "missing"} in response.json()["errors"]


# --- kind and format, identifier of the path --------------------------------------------------


@pytest.mark.parametrize("art", list(ARTS))
def test_the_format_must_fit_the_kind_of_object(client: TestClient, art: str) -> None:
    for other in ARTS:
        if other == art:
            continue
        response = post(client, art, sample(other))
        assert response.status_code == 422, (art, other)
        assert response.json() == {
            "detail": "The format of the document does not fit the kind of object.",
            "code": "document.format_mismatch",
            "params": {},
            "errors": [{"location": ["format"], "type": "format_mismatch"}],
        }
    assert client.get(f"/api/v1/{art}").json() == {"items": []}


def test_replacing_with_another_format_is_422_and_changes_nothing(
    client: TestClient, objects: Path
) -> None:
    object_id = post(client, "rules", rule_document()).json()["id"]
    before = (objects / f"{object_id}.rule.json").read_bytes()
    other = indicator_document()
    other["id"] = object_id
    response = put(client, "rules", object_id, other)
    assert response.status_code == 422
    assert response.json()["errors"] == [{"location": ["format"], "type": "format_mismatch"}]
    assert (objects / f"{object_id}.rule.json").read_bytes() == before


def test_the_identifier_of_the_path_is_authoritative(client: TestClient, objects: Path) -> None:
    object_id = post(client, "strategies", load_case("str-03")).json()["id"]
    before = (objects / f"{object_id}.strategy.json").read_bytes()
    other = load_case("str-03")
    other["id"] = str(uuid4())
    response = put(client, "strategies", object_id, other)
    assert response.status_code == 422
    assert response.json() == {
        "detail": "The identifier of the document differs from the identifier in the path.",
        "code": "document.id_mismatch",
        "params": {},
        "errors": [{"location": ["id"], "type": "id_mismatch"}],
    }
    assert files(objects) == [f"{object_id}.strategy.json"]
    assert (objects / f"{object_id}.strategy.json").read_bytes() == before


# --- saving with PUT creates a missing file (specification 4.1, 5.2) ---------------------------


@pytest.mark.parametrize("art", list(ARTS))
def test_put_on_a_missing_file_creates_it_with_201_and_the_findings(
    client: TestClient, objects: Path, art: str
) -> None:
    unknown = str(uuid4())
    document = sample(art)
    document["id"] = unknown
    assert not objects.exists()  # the directory is created like at the first writing
    response = put(client, art, unknown, document)
    assert response.status_code == 201, response.text
    answer = response.json()
    assert set(answer) == {"id", "document", "findings"}
    assert answer["id"] == unknown
    assert answer["document"]["id"] == unknown
    assert isinstance(answer["findings"], list)
    assert files(objects) == [f"{unknown}.{ARTS[art]}.json"]
    assert client.get(f"/api/v1/{art}/{unknown}").json() == answer["document"]


def test_put_on_a_missing_file_answers_the_findings_of_the_check(
    client: TestClient, objects: Path
) -> None:
    document = load_case("str-03")
    _misspell(document)
    response = put(client, "strategies", document["id"], document)
    assert response.status_code == 201
    assert "expression.invalid" in codes(response.json()["findings"])
    assert files(objects) == [f"{document['id']}.strategy.json"]


def test_put_on_an_existing_file_is_200_and_a_second_put_too(
    client: TestClient, objects: Path
) -> None:
    document = load_case("str-03")
    assert put(client, "strategies", document["id"], document).status_code == 201
    document["name"] = "Zweite Fassung"
    response = put(client, "strategies", document["id"], document)
    assert response.status_code == 200
    assert response.json()["document"]["name"] == "Zweite Fassung"
    assert files(objects) == [f"{document['id']}.strategy.json"]


def test_put_creates_the_missing_directory_below_missing_parents(
    client: TestClient, objects: Path
) -> None:
    assert not objects.exists()
    document = load_case("str-01")
    assert put(client, "strategies", document["id"], document).status_code == 201
    assert objects.is_dir()


def test_save_after_changing_the_object_directory_without_moving_writes_to_the_new_one(
    client: TestClient, objects: Path, tmp_path: Path
) -> None:
    """Finding B1 of the function test: create, change the directory without moving, save."""
    created = post(client, "strategies", load_case("str-03")).json()
    object_id = created["id"]
    old_text = (objects / f"{object_id}.strategy.json").read_bytes()
    new = tmp_path / "new-objects"
    changed = client.put(
        "/api/studio/settings/object-directory", json={"path": str(new), "move": False}
    )
    assert changed.status_code == 200

    document = copy.deepcopy(created["document"])
    document["name"] = "Im neuen Verzeichnis"
    response = put(client, "strategies", object_id, document)

    assert response.status_code == 201
    assert response.json()["findings"] == []
    assert files(new) == [f"{object_id}.strategy.json"]
    assert json.loads((new / f"{object_id}.strategy.json").read_text("utf-8"))["name"] == (
        "Im neuen Verzeichnis"
    )
    assert (objects / f"{object_id}.strategy.json").read_bytes() == old_text  # left unchanged
    assert client.get(f"/api/v1/strategies/{object_id}").json()["name"] == "Im neuen Verzeichnis"
    again = put(client, "strategies", object_id, document)
    assert again.status_code == 200  # now it exists in the new directory


def test_put_on_a_missing_file_is_refused_if_a_file_of_another_kind_has_the_identifier(
    client: TestClient, objects: Path
) -> None:
    created = post(client, "rules", rule_document()).json()
    object_id = created["id"]
    other = indicator_document()
    other["id"] = object_id
    before = {name: (objects / name).read_bytes() for name in files(objects)}
    response = put(client, "indicators", object_id, other)
    assert response.status_code == 409
    assert response.json() == {
        "detail": (
            "An entry of another kind has this identifier in the object directory (any "
            "entry, for example a file, a symbolic link or a directory). Nothing was written."
        ),
        "code": "object.kind_conflict",
        "params": {},
    }
    assert {name: (objects / name).read_bytes() for name in files(objects)} == before
    assert files(objects) == [f"{object_id}.rule.json"]


def test_put_is_refused_if_an_unreadable_file_of_another_kind_has_the_identifier(
    client: TestClient, objects: Path
) -> None:
    object_id = str(uuid4())
    objects.mkdir(parents=True)
    (objects / f"{object_id}.ruleset.json").write_bytes(b"{")
    other = rule_document()
    other["id"] = object_id
    assert put(client, "rules", object_id, other).status_code == 409
    assert files(objects) == [f"{object_id}.ruleset.json"]
    assert (objects / f"{object_id}.ruleset.json").read_bytes() == b"{"


def test_put_on_an_unreadable_file_of_the_same_kind_is_still_409(
    client: TestClient, objects: Path
) -> None:
    object_id = str(uuid4())
    objects.mkdir(parents=True)
    (objects / f"{object_id}.rule.json").write_bytes(b"{")
    other = rule_document()
    other["id"] = object_id
    assert put(client, "rules", object_id, other).status_code == 409
    assert (objects / f"{object_id}.rule.json").read_bytes() == b"{"


# --- changed versions of a test case ------------------------------------------------------


def _find(document: dict[str, Any], element_type: str, **where: Any) -> dict[str, Any]:
    for element in document["elements"]:
        if element["type"] == element_type and all(element.get(k) == v for k, v in where.items()):
            return element  # type: ignore[no-any-return]
    raise AssertionError(element_type)


def _remove_trigger(document: dict[str, Any]) -> None:
    trigger = _find(document, "trigger.candle_close", management_of=None)
    document["elements"].remove(trigger)
    document["connections"] = [
        item for item in document["connections"] if item["source"] != trigger["id"]
    ]


def _misspell(document: dict[str, Any]) -> None:
    _find(document, "flow.condition", name="Kreuzen")["parameters"]["ausdruck"]["value"] = (
        "ema20.wert > > 1"
    )


def _unknown_name(document: dict[str, Any]) -> None:
    _find(document, "flow.condition", name="Kreuzen")["parameters"]["ausdruck"]["value"] = (
        "gibtesnicht.wert > 1"
    )


def _order_in_main_flow(document: dict[str, Any]) -> None:
    _find(document, "flow.condition", name="Kreuzen")["parameters"]["ausdruck"]["value"] = (
        "Order.volumen > 0"
    )


def _order_in_indicator(document: dict[str, Any]) -> None:
    document["elements"][0]["instance"].update(
        {
            "object_type": "Indikator",
            "origin": {"object_type": "Indikator"},
            "rules": [
                {
                    "name": "Regel",
                    "key": "regel",
                    "object_type": "Regel",
                    "origin": {"object_type": "Regel"},
                    "expression": "Order.volumen > 0",
                }
            ],
        }
    )


def _modify_order_outside_management(document: dict[str, Any]) -> None:
    trigger = _find(document, "trigger.candle_close", management_of=None)
    element_id = "00000000-0000-4000-8000-0000000000aa"
    document["elements"].append(
        {"id": element_id, "type": "flow.modify_order", "name": "Order ändern"}
    )
    document["connections"].append(
        {
            "id": "00000000-0000-4000-8000-0000000000ac",
            "source": trigger["id"],
            "output": "weiter",
            "target": element_id,
        }
    )


def _unknown_element_type(document: dict[str, Any]) -> None:
    document["elements"].append(
        {"id": "00000000-0000-4000-8000-0000000000bb", "type": "x.unbekannt", "name": "?"}
    )


CHANGES: list[tuple[str, Callable[[dict[str, Any]], None], str]] = [
    ("removed trigger", _remove_trigger, "flow.not_reached"),
    ("misspelling", _misspell, "expression.invalid"),
    ("unknown name", _unknown_name, "expression.invalid"),
    ("order in the main flow", _order_in_main_flow, "expression.order_outside_management"),
    ("rule with order in an indicator", _order_in_indicator, "rule.order_in_indicator"),
    (
        "modify order outside of a management",
        _modify_order_outside_management,
        "flow.management_only",
    ),
    ("unknown element type", _unknown_element_type, "type.unknown"),
]


@pytest.mark.parametrize(("label", "change", "code"), CHANGES, ids=[item[0] for item in CHANGES])
def test_check_reports_the_findings_of_a_changed_test_case(
    client: TestClient, label: str, change: Callable[[dict[str, Any]], None], code: str
) -> None:
    document = load_case("str-03")
    change(document)
    response = check(client, document)
    assert response.status_code == 200, label
    findings = response.json()["findings"]
    assert code in codes(findings), (label, codes(findings))
    assert all(item["level"] in ("error", "hint") for item in findings)
    assert client.get("/api/v1/strategies").json() == {"items": []}  # nothing was saved


@pytest.mark.parametrize(("label", "change", "code"), CHANGES, ids=[item[0] for item in CHANGES])
def test_put_saves_a_changed_test_case_with_its_findings(
    client: TestClient, label: str, change: Callable[[dict[str, Any]], None], code: str
) -> None:
    created = post(client, "strategies", load_case("str-03")).json()
    assert created["findings"] == []
    document = copy.deepcopy(created["document"])
    change(document)
    response = put(client, "strategies", created["id"], document)
    assert response.status_code == 200, label
    assert code in codes(response.json()["findings"]), label
    stored = client.get(f"/api/v1/strategies/{created['id']}").json()
    assert stored == response.json()["document"]
    assert stored != created["document"]


def test_the_misspelling_is_reported_with_its_place(client: TestClient) -> None:
    document = load_case("str-03")
    _misspell(document)
    element = _find(document, "flow.condition", name="Kreuzen")
    findings = check(client, document).json()["findings"]
    invalid = [item for item in findings if item["code"] == "expression.invalid"]
    assert len(invalid) == 1
    finding = invalid[0]
    assert finding["level"] == "error"
    assert finding["element"] == element["id"]
    assert finding["details"]["field"] == "parameter:ausdruck"
    assert finding["details"]["issue"] == "syntax"
    text = element["parameters"]["ausdruck"]["value"]
    assert text[finding["details"]["start"] : finding["details"]["end"]] == ">"


def test_the_unknown_name_is_reported_with_its_place(client: TestClient) -> None:
    document = load_case("str-03")
    _unknown_name(document)
    findings = check(client, document).json()["findings"]
    finding = next(item for item in findings if item["code"] == "expression.invalid")
    assert finding["details"]["issue"] == "unknown_name"
    assert (finding["details"]["start"], finding["details"]["end"]) == (0, 11)
    assert finding["details"]["name"] == "gibtesnicht"


def test_put_with_findings_still_answers_200_and_post_with_findings_201(
    client: TestClient,
) -> None:
    document = load_case("str-03")
    _remove_trigger(document)
    created = post(client, "strategies", document)
    assert created.status_code == 201
    assert "flow.not_reached" in codes(created.json()["findings"])
    assert "strategy.no_trigger" not in codes(created.json()["findings"])
    assert client.get(f"/api/v1/strategies/{created.json()['id']}").status_code == 200


def test_a_document_with_an_unknown_element_type_is_kept_as_it_is(client: TestClient) -> None:
    document = load_case("str-03")
    document["elements"].append(
        {
            "id": "00000000-0000-4000-8000-0000000000bb",
            "type": "x.unbekannt",
            "name": "?",
            "parameters": {"p": {"kind": "fixed", "value": 5}},
        }
    )
    created = post(client, "strategies", document).json()
    stored = client.get(f"/api/v1/strategies/{created['id']}").json()
    unknown = _find(stored, "x.unbekannt")
    assert unknown["parameters"] == {"p": {"kind": "fixed", "value": 5}}


# --- normalization --------------------------------------------------------------------------


def test_the_expressions_are_saved_in_the_normalized_spelling(client: TestClient) -> None:
    document = load_case("str-03")
    expected = _find(document, "flow.calculation", key="richtung")["parameters"]["ausdruck"][
        "value"
    ]
    assert expected == 'IF(ema20.wert > ema50.wert; "buy"; "sell")'
    written = 'if( EMA20.WERT > Ema50.Wert; "buy"; "sell")'
    _find(document, "flow.calculation", key="richtung")["parameters"]["ausdruck"]["value"] = written
    created = post(client, "strategies", document).json()
    assert created["findings"] == []
    saved = _find(created["document"], "flow.calculation", key="richtung")
    assert saved["parameters"]["ausdruck"]["value"] == 'IF( ema20.wert > ema50.wert; "buy"; "sell")'
    stored = client.get(f"/api/v1/strategies/{created['id']}").json()
    assert stored == created["document"]


def test_a_replaced_document_is_normalized_too(client: TestClient) -> None:
    created = post(client, "rules", rule_document()).json()
    document = created["document"]
    document["expression"] = "order.VOLUMEN >= instrument.Mindestvolumen"
    replaced = put(client, "rules", created["id"], document).json()
    assert replaced["document"]["expression"] == "Order.volumen >= Instrument.mindestvolumen"
    assert replaced["findings"] == []


def test_findings_refer_to_the_text_that_is_saved(client: TestClient) -> None:
    document = rule_document(expression="order.volumen > > 1")
    created = post(client, "rules", document).json()
    finding = next(item for item in created["findings"] if item["code"] == "expression.invalid")
    text = created["document"]["expression"]
    assert text == "order.volumen > > 1"  # a faulty expression is left as it is
    assert text[finding["details"]["start"] : finding["details"]["end"]] == ">"


# --- delivered template ---------------------------------------------------------------------


def test_the_delivered_template_cannot_be_changed_or_deleted(
    client: TestClient, objects: Path
) -> None:
    read = client.get(f"/api/v1/rules/{RISK_TEMPLATE_ID}")
    assert read.status_code == 200
    document = read.json()
    assert document["name"] == "Risiko je Trade"
    document["name"] = "Geändert"
    changed = put(client, "rules", RISK_TEMPLATE_ID, document)
    assert changed.status_code == 403
    assert changed.json() == {
        "detail": "A delivered template cannot be changed or deleted.",
        "code": "object.builtin",
        "params": {},
    }
    deleted = client.delete(f"/api/v1/rules/{RISK_TEMPLATE_ID}")
    assert deleted.status_code == 403
    assert deleted.json()["code"] == "object.builtin"
    assert client.get(f"/api/v1/rules/{RISK_TEMPLATE_ID}").json()["name"] == "Risiko je Trade"
    assert client.get("/api/v1/rules").json() == {"items": []}  # not in the object directory
    assert not objects.exists()


def test_the_delivered_template_is_not_an_object_of_another_kind(client: TestClient) -> None:
    assert client.get(f"/api/v1/indicators/{RISK_TEMPLATE_ID}").status_code == 404
    assert client.get(f"/api/v1/strategies/{RISK_TEMPLATE_ID}").status_code == 404


def test_a_document_with_the_identifier_of_the_delivered_template_gets_a_new_one(
    client: TestClient, objects: Path
) -> None:
    document = rule_document()
    document["id"] = RISK_TEMPLATE_ID
    created = post(client, "rules", document).json()
    assert created["id"] != RISK_TEMPLATE_ID
    assert files(objects) == [f"{created['id']}.rule.json"]


# --- the object directory ----------------------------------------------------------------------


def test_the_object_directory_is_created_at_the_first_write(
    client: TestClient, objects: Path
) -> None:
    assert client.get("/api/v1/strategies").json() == {"items": []}
    assert not objects.exists()
    post(client, "strategies", load_case("str-03"))
    assert objects.is_dir()


def test_a_changed_object_directory_is_used_at_once(
    client: TestClient, objects: Path, tmp_path: Path
) -> None:
    first = post(client, "rules", rule_document()).json()["id"]
    target = tmp_path / "elsewhere"
    answer = client.put(
        "/api/studio/settings/object-directory", json={"path": str(target), "move": False}
    )
    assert answer.status_code == 200
    assert client.get("/api/v1/rules").json() == {"items": []}
    second = post(client, "rules", rule_document()).json()["id"]
    assert files(target) == [f"{second}.rule.json"]
    assert files(objects) == [f"{first}.rule.json"]


def test_another_method_is_405(client: TestClient) -> None:
    answer = client.patch("/api/v1/strategies")
    assert answer.status_code == 405
    assert answer.json() == {
        "detail": "The method is not allowed for this path.",
        "code": "request.method_not_allowed",
        "params": {},
    }
    assert client.put("/api/v1/strategies", content=b"{}", headers=JSON).status_code == 405
    assert client.delete("/api/v1/strategies").status_code == 405
    assert (
        client.post(f"/api/v1/strategies/{uuid4()}", content=b"{}", headers=JSON).status_code == 405
    )
    assert client.post("/api/v1/element-types", content=b"{}", headers=JSON).status_code == 405
    assert client.get("/api/v1/check").status_code == 405
    unknown = client.get("/api/v1/unknown")
    assert unknown.status_code == 404
    assert unknown.json()["code"] == "request.not_found"
