"""Tests of the document formats in the web API (specification 3.7, 4.1, 4.2; order 04 point 6, 7
and 12): the web API accepts the formats 2.0 and 1.0, answers and writes 2.0, and leaves a file of
the format 1.0 in the object directory as it is until it is saved.

The saved strategy "EMA-Trendfolge" (a file of the format 1.0 from the basis of the work package)
is read and saved through the web API.
"""

import copy
import json
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from web_api_support import (
    EMA_TRENDFOLGE_FILE,
    codes,
    load_case,
    load_case_v1,
    post,
    put,
)

EMA_IDENTIFIER = "7209de70-2fdc-49fc-a242-33251216ed22"


def place_saved_strategy(objects: Path) -> Path:
    objects.mkdir(parents=True, exist_ok=True)
    path = objects / f"{EMA_IDENTIFIER}.strategy.json"
    path.write_bytes(EMA_TRENDFOLGE_FILE.read_bytes())
    return path


def expressions(value: Any) -> list[str]:
    """Every expression of a document, in the order of the document (both formats)."""
    found: list[str] = []
    if isinstance(value, dict):
        if value.get("kind") == "expression" and isinstance(value.get("value"), str):
            found.append(value["value"])
        for key, item in value.items():
            if key in ("expression", "result_expression") and isinstance(item, str):
                found.append(item)
            else:
                found.extend(expressions(item))
    elif isinstance(value, list):
        for item in value:
            found.extend(expressions(item))
    return found


# --- accepting 1.0, answering 2.0 -----------------------------------------------------------------


@pytest.mark.parametrize("name", ["str-01", "str-03"])
def test_a_document_of_the_format_one_is_accepted_and_saved_as_two(
    client: TestClient, objects: Path, name: str
) -> None:
    old = load_case_v1(name)
    created = post(client, "strategies", old)
    assert created.status_code == 201, created.text
    answer = created.json()
    assert answer["findings"] == []
    document = answer["document"]
    assert document["format_version"] == "2.0"
    assert document["name"] == old["title"]
    assert "title" not in document
    stored = json.loads((objects / f"{answer['id']}.strategy.json").read_text(encoding="utf-8"))
    assert stored == document
    assert stored["format_version"] == "2.0"
    assert expressions(document) == expressions(old)


def test_put_of_a_document_of_the_format_one_writes_the_format_two(
    client: TestClient, objects: Path
) -> None:
    old = load_case_v1("str-03")
    response = put(client, "strategies", old["id"], old)
    assert response.status_code == 201
    stored = json.loads((objects / f"{old['id']}.strategy.json").read_text(encoding="utf-8"))
    assert stored["format_version"] == "2.0"
    assert stored["name"] == old["title"]


def test_check_accepts_the_format_one_and_gives_the_findings_of_the_converted_document(
    client: TestClient,
) -> None:
    old = load_case_v1("str-03")
    response = client.post(
        "/api/v1/check", content=json.dumps(old), headers={"content-type": "application/json"}
    )
    assert response.status_code == 200
    assert response.json()["findings"] == []
    old["elements"][3]["type"] = "x.unbekannt"
    changed = client.post(
        "/api/v1/check", content=json.dumps(old), headers={"content-type": "application/json"}
    )
    assert "type.unknown" in codes(changed.json()["findings"])


def test_a_document_of_the_format_one_must_fit_the_format_one(client: TestClient) -> None:
    old = load_case_v1("str-03")
    old["name"] = "format two field"
    response = post(client, "strategies", old)
    assert response.status_code == 422
    assert response.json()["code"] == "document.invalid"


@pytest.mark.parametrize("version", ["1.0", "1.7", "2.0", "2.9"])
def test_the_minor_versions_of_the_supported_major_versions_are_accepted(
    client: TestClient, version: str
) -> None:
    document = load_case("str-03") if version.startswith("2") else load_case_v1("str-03")
    document["format_version"] = version
    assert post(client, "strategies", document).status_code == 201


@pytest.mark.parametrize("version", ["3.0", "0.9", "10.0", "2", "x"])
def test_a_higher_or_unknown_major_version_is_422(client: TestClient, version: str) -> None:
    document = load_case("str-03")
    document["format_version"] = version
    response = post(client, "strategies", document)
    assert response.status_code == 422
    assert response.json()["code"] == "document.invalid"


def test_an_element_of_an_unknown_type_is_kept_as_it_is(client: TestClient) -> None:
    old = load_case_v1("str-03")
    old["elements"].append(
        {
            "id": "00000000-0000-4000-8000-0000000000bb",
            "type": "x.unbekannt",
            "title": "Unbekannt",
            "parameters": {"p": {"kind": "fixed", "value": 5}},
        }
    )
    old["connections"].append(
        {
            "source": "00000000-0000-4000-8000-0000000000bb",
            "output": "wahr",
            "target": old["elements"][3]["id"],
        }
    )
    created = post(client, "strategies", old).json()
    unknown = next(
        item for item in created["document"]["elements"] if item["type"] == "x.unbekannt"
    )
    assert unknown["parameters"] == {"p": {"kind": "fixed", "value": 5}}
    assert unknown["name"] == "Unbekannt"
    assert "type.unknown" in codes(created["findings"])
    assert any(
        item["output"] == "wahr" and item["source"] == unknown["id"]
        for item in created["document"]["connections"]
    )


# --- a file of the format 1.0 in the object directory ---------------------------------------------


def test_a_file_of_the_format_one_is_read_as_two_and_stays_as_it_is(
    client: TestClient, objects: Path
) -> None:
    old = load_case_v1("str-03")
    objects.mkdir(parents=True)
    path = objects / f"{old['id']}.strategy.json"
    path.write_text(json.dumps(old, indent=2), encoding="utf-8")
    before = path.read_bytes()
    modified = path.stat().st_mtime_ns

    listing = client.get("/api/v1/strategies").json()["items"]
    assert [(item["id"], item["name"], item["unreadable"]) for item in listing] == [
        (old["id"], old["title"], False)
    ]
    read = client.get(f"/api/v1/strategies/{old['id']}")
    assert read.status_code == 200
    document = read.json()
    assert document["format_version"] == "2.0"
    assert document["name"] == old["title"]
    assert (
        client.post(
            "/api/v1/check", content=read.content, headers={"content-type": "application/json"}
        ).json()["findings"]
        == []
    )
    assert client.get(f"/api/v1/rules/{old['rules'][0]['origin']['template_id']}/usages").json()[
        "usages"
    ] == [{"art": "strategies", "id": old["id"], "name": old["title"]}]

    assert path.read_bytes() == before  # nothing of this changed the file
    assert path.stat().st_mtime_ns == modified

    document["name"] = "Gespeichert"
    saved = put(client, "strategies", old["id"], document)
    assert saved.status_code == 200
    assert saved.json()["findings"] == []
    now = json.loads(path.read_text(encoding="utf-8"))
    assert now["format_version"] == "2.0"
    assert now["name"] == "Gespeichert"
    assert "title" not in now


def test_a_file_of_the_format_one_can_be_deleted_without_being_changed_first(
    client: TestClient, objects: Path
) -> None:
    old = load_case_v1("str-01")
    objects.mkdir(parents=True)
    path = objects / f"{old['id']}.strategy.json"
    path.write_text(json.dumps(old), encoding="utf-8")
    assert client.delete(f"/api/v1/strategies/{old['id']}").status_code == 204
    assert not path.exists()


def test_a_file_of_a_higher_major_version_is_not_readable_and_stays(
    client: TestClient, objects: Path
) -> None:
    objects.mkdir(parents=True)
    document = load_case("str-03")
    document["format_version"] = "3.0"
    path = objects / f"{document['id']}.strategy.json"
    path.write_text(json.dumps(document), encoding="utf-8")
    before = path.read_bytes()
    assert client.get("/api/v1/strategies").json()["items"][0]["unreadable"] is True
    assert client.get(f"/api/v1/strategies/{document['id']}").status_code == 409
    assert path.read_bytes() == before


# --- the saved strategy "EMA-Trendfolge" ----------------------------------------------------------


def test_the_saved_strategy_is_read_through_the_web_api_without_a_finding(
    client: TestClient, objects: Path
) -> None:
    path = place_saved_strategy(objects)
    before = path.read_bytes()
    old = json.loads(before)
    assert old["format_version"] == "1.0"

    listing = client.get("/api/v1/strategies").json()["items"]
    assert [(item["id"], item["name"], item["unreadable"]) for item in listing] == [
        (EMA_IDENTIFIER, "EMA-Trendfolge", False)
    ]
    read = client.get(f"/api/v1/strategies/{EMA_IDENTIFIER}")
    assert read.status_code == 200
    document = read.json()
    assert document["format_version"] == "2.0"
    checked = client.post(
        "/api/v1/check", content=read.content, headers={"content-type": "application/json"}
    )
    assert checked.status_code == 200
    assert checked.json()["findings"] == []  # no error of the conversion, no hint
    assert path.read_bytes() == before


def test_the_names_of_the_saved_strategy_follow_the_rules_of_the_conversion(
    client: TestClient, objects: Path
) -> None:
    place_saved_strategy(objects)
    old = json.loads(EMA_TRENDFOLGE_FILE.read_text(encoding="utf-8"))
    document = client.get(f"/api/v1/strategies/{EMA_IDENTIFIER}").json()

    parameters = {item["key"]: item["name"] for item in document["parameters"]}
    assert parameters == {"zeiteinheit": "zeiteinheit", "stop_abstand": "Stop abstand"}
    instances = {
        item["instance"]["key"]: item["instance"]["name"]
        for item in document["elements"]
        if item["instance"] is not None
    }
    assert instances["ema20"] == "EMA20"  # a name without an underscore stays as it is
    assert instances["ema50"] == "EMA50"
    named = {item["key"]: item["name"] for item in document["elements"] if item["key"]}
    assert named["order_ausgefuehrt"] == "Order ausgefuehrt"
    assert named["kreuzen_gegen_die_position"] == "Kreuzen gegen die position"
    assert document["rules"][0]["key"] == "risiko_je_trade"
    assert document["rules"][0]["name"] == "Risiko je trade"
    assert document["name"] == old["title"]
    assert len(document["elements"]) == len(old["elements"])
    assert len(document["connections"]) == len(old["connections"])
    assert {item["id"] for item in document["elements"]} == {item["id"] for item in old["elements"]}
    for element in document["elements"]:
        assert element["position"] is None  # the position is set by the user only


def test_every_expression_of_the_saved_strategy_keeps_its_meaning(
    client: TestClient, objects: Path
) -> None:
    """The keys are the names of the format 1.0, so no expression changes."""
    place_saved_strategy(objects)
    old = json.loads(EMA_TRENDFOLGE_FILE.read_text(encoding="utf-8"))
    document = client.get(f"/api/v1/strategies/{EMA_IDENTIFIER}").json()
    assert expressions(document) == expressions(old)
    assert len(expressions(old)) >= 8


def test_the_saved_strategy_is_saved_through_the_web_api_as_the_format_two(
    client: TestClient, objects: Path
) -> None:
    path = place_saved_strategy(objects)
    document = client.get(f"/api/v1/strategies/{EMA_IDENTIFIER}").json()
    saved = put(client, "strategies", EMA_IDENTIFIER, copy.deepcopy(document))
    assert saved.status_code == 200, saved.text
    assert saved.json()["findings"] == []
    now = json.loads(path.read_text(encoding="utf-8"))
    assert now["format_version"] == "2.0"
    assert now == saved.json()["document"]
    assert now["name"] == document["name"] == "EMA-Trendfolge"
    assert expressions(now) == expressions(document)
    again = client.get(f"/api/v1/strategies/{EMA_IDENTIFIER}")
    assert again.json() == now  # reading the saved file is reading the document as it is
    assert put(client, "strategies", EMA_IDENTIFIER, now).json()["document"] == now


def test_the_expressions_of_the_saved_strategy_are_answered_by_the_expressions_endpoint(
    client: TestClient, objects: Path
) -> None:
    place_saved_strategy(objects)
    document = client.get(f"/api/v1/strategies/{EMA_IDENTIFIER}").json()
    index = next(i for i, item in enumerate(document["elements"]) if item["key"] == "kreuzen")
    pointer = f"/elements/{index}/parameters/ausdruck/value"
    stored = document["elements"][index]["parameters"]["ausdruck"]["value"]
    response = client.post(
        "/api/v1/expressions",
        content=json.dumps(
            {
                "document": document,
                "language": "de",
                "items": [{"pointer": pointer, "stored": stored}],
            }
        ),
        headers={"content-type": "application/json"},
    )
    assert response.status_code == 200
    answer = response.json()["items"][0]
    assert answer["stored"] == stored
    assert answer["findings"] == []
    assert answer["blocks"] is not None
