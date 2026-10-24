"""Tests of ``POST /api/v1/usage``, ``/api/v1/insert`` and ``/api/v1/removals`` and of the
findings and visible names that depend on the first use of an instance (specification 3.3, 3.4,
3.6, 4.2; order 10 points 2, 3, 7).

Covered: the answer of ``usage`` for the test cases, for a document of the format 1.0 and for the
document of the client; the places at which an instance is usable; the limit of entries; the
instance for an object type and for templates, with names, keys and rewritten expressions; the
uses and the removal of an element, a strategy parameter and a rule; the errors of each endpoint
and the limits (size, number of elements and inputs, length of names).
"""

import json
from typing import Any

import pytest
from fastapi.testclient import TestClient
from pipwerk_domain import limits
from web_api_support import (
    EMA_TRENDFOLGE_FILE,
    EXAMPLE_DIRECTORY,
    JSON,
    RISK_TEMPLATE_ID,
    codes,
    load_case,
    load_case_v1,
    post,
    post_json,
    trend_document,
)

CROSSING = "7e1ab090-5a18-5414-9f00-5541c0e4b325"  # "Kreuzen", the first use of EMA 20 and EMA 50
DIRECTION = "81ddf1b2-15f1-54f0-8a7e-7387b4dd119f"  # "Richtung"
STOP = "d68f936b-4e65-5d0c-a4eb-a1438baaa470"  # "Stop-Loss", the first use of ATR 14
TRIGGER = "fd3b87fb-a152-51fa-bd12-4579eba0a33d"
PLACE_ORDER = "7896d1ad-8c07-517d-b451-80fe53d46681"
AGAINST = "79519848-4389-5b9a-a576-784ab363fce3"  # "Kreuzen gegen die Position"
NEW_STOP = "8c541e77-1e34-5548-8f18-7124951deee6"  # "Neuer Stop-Loss"
EMA_20 = "d1f1e433-ae5d-535e-9ccd-3d161adeff73"
ATR_14 = "bf0ee57e-a6d5-5085-a67c-6eaa9b46d979"
MANAGEMENT_TRIGGER = "5789f3a0-a3ba-57ff-b961-58884dc593d4"


def usage(client: TestClient, document: object) -> Any:
    return post_json(client, "/api/v1/usage", {"document": document})


def insert(client: TestClient, document: object, **fields: Any) -> Any:
    return post_json(client, "/api/v1/insert", {"document": document, **fields})


def removal(client: TestClient, document: object, kind: str, target: str, **fields: Any) -> Any:
    return post_json(
        client,
        "/api/v1/removals",
        {"document": document, "kind": kind, "target": target, **fields},
    )


def instances(answer: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {item["instance"]: item for item in answer["instances"]}


def uses(answer: dict[str, Any], element: str) -> list[dict[str, Any]]:
    found = [item["uses"] for item in answer["elements"] if item["element"] == element]
    return found[0] if found else []


def example(name: str) -> dict[str, Any]:
    return json.loads((EXAMPLE_DIRECTORY / name).read_text(encoding="utf-8"))  # type: ignore[no-any-return]


# --- usage -------------------------------------------------------------------------------------


def test_usage_of_str_03_names_the_first_use_and_where_the_instances_are_usable(
    client: TestClient,
) -> None:
    response = usage(client, load_case("str-03"))
    assert response.status_code == 200, response.text
    answer = response.json()
    found = instances(answer)
    assert list(found) == ["ema20", "ema50", "atr14"]
    ema = found["ema20"]
    assert (ema["first_use"], ema["first_use_source"]) == (CROSSING, "stored")
    assert ema["name"] == "EMA 20"
    assert ema["element"] == EMA_20
    assert ema["object_type"] == "EMA"
    assert ema["can_refresh"] is True
    assert ema["connected"] is True
    assert ema["usable_everywhere"] is False
    assert ema["usable_at_omitted"] is False
    # usable at the first use and behind it, also in the management of the order; not at the
    # trigger that comes before
    assert CROSSING in ema["usable_at"]
    assert {DIRECTION, STOP, PLACE_ORDER, AGAINST, NEW_STOP} <= set(ema["usable_at"])
    assert TRIGGER not in ema["usable_at"]
    assert found["atr14"]["first_use"] == STOP
    assert CROSSING not in found["atr14"]["usable_at"]
    assert answer["strategy_rules"] == []
    assert answer["truncated"] is False


def test_usage_names_what_each_element_uses(client: TestClient) -> None:
    answer = usage(client, load_case("str-03")).json()
    crossing = {(item["instance"], item["kind"]) for item in uses(answer, CROSSING)}
    assert crossing == {
        ("ema20", "input"),
        ("ema20", "expression"),
        ("ema50", "input"),
        ("ema50", "expression"),
    }
    for item in uses(answer, CROSSING):
        assert item["by_instance"] is None
        assert [member["name"] for member in item["members"]] == ["wert"]
        assert [member["kind"] for member in item["members"]] == ["property"]
    refreshed = [item for item in uses(answer, AGAINST) if item["kind"] == "input"]
    assert {item["instance"] for item in refreshed} == {"ema20", "ema50"}
    assert all(member["refresh"] is True for item in refreshed for member in item["members"])
    assert all(
        member["refresh"] is False for item in uses(answer, CROSSING) for member in item["members"]
    )
    assert [
        item["instance"] for item in uses(answer, NEW_STOP) if item["kind"] == "expression"
    ] == ["atr14"]
    elements = [item["element"] for item in answer["elements"]]
    assert (
        elements.index(CROSSING) < elements.index(STOP) < elements.index(AGAINST)
    )  # the order of the flow
    assert uses(answer, TRIGGER) == []


def test_usage_of_str_01_has_the_first_uses_of_the_test_case(client: TestClient) -> None:
    answer = usage(client, load_case("str-01")).json()
    found = instances(answer)
    assert list(found) == ["zz_signal", "zz_handel"]
    names = {item["element"]: item["name"] for item in found.values()}
    assert len(names) == 2
    assert all(item["first_use_source"] == "stored" for item in found.values())
    assert all(item["connected"] and not item["usable_everywhere"] for item in found.values())
    # zz_handel is used with "Aktualisieren" in the management
    refreshing = [
        item
        for entry in answer["elements"]
        for item in entry["uses"]
        if item["instance"] == "zz_handel"
        and item["kind"] == "input"
        and any(member["refresh"] for member in item["members"])
    ]
    assert len(refreshing) == 2


def test_the_first_use_is_the_first_element_of_the_flow_that_uses_the_instance(
    client: TestClient,
) -> None:
    document = load_case("str-03")
    for element in document["elements"]:
        if element.get("instance"):
            element["instance"]["first_use"] = None
    answer = usage(client, document).json()
    found = instances(answer)
    assert (found["ema20"]["first_use"], found["ema20"]["first_use_source"]) == (CROSSING, "flow")
    assert (found["atr14"]["first_use"], found["atr14"]["first_use_source"]) == (STOP, "flow")


def test_a_stored_first_use_that_no_element_uses_is_ignored(client: TestClient) -> None:
    document = load_case("str-03")
    for element in document["elements"]:
        if element.get("instance", {}) and element["instance"]["key"] == "atr14":
            element["instance"]["first_use"] = TRIGGER  # the trigger does not use it
    found = instances(usage(client, document).json())
    assert (found["atr14"]["first_use"], found["atr14"]["first_use_source"]) == (STOP, "flow")


def test_an_instance_that_nothing_uses_is_usable_everywhere(client: TestClient) -> None:
    answer = usage(client, example("str-03-instanz-ohne-verbindung.strategy.json")).json()
    unused = instances(answer)["ema100"]
    assert unused["connected"] is False
    assert unused["first_use"] is None
    assert unused["first_use_source"] is None
    assert unused["usable_everywhere"] is True
    assert unused["usable_at"] == []


def test_an_instance_that_only_another_instance_uses_has_the_element_of_that_instance(
    client: TestClient,
) -> None:
    """`EMA 50` takes its period from the `Wert` of `EMA 20`, and nothing else uses `EMA 20`: its
    element of the first use is the one of `EMA 50`, "Kreuzen"."""
    document = load_case("str-03")
    for element in document["elements"]:
        instance = element.get("instance")
        if instance and instance["key"] in ("ema20", "ema50"):
            instance["first_use"] = None
        if instance and instance["key"] == "ema50":
            instance["parameter_values"]["periode"] = {
                "kind": "connection",
                "value": {"instance": "ema20", "property": "wert"},
            }
        if element["id"] in (CROSSING, DIRECTION):
            element["parameters"]["ausdruck"]["value"] = 'IF(ema50.wert > 1; "buy"; "sell")'
            element["inputs"] = [
                {
                    "instance": "ema50",
                    "property": "wert",
                    "kind": "property",
                    "arguments": [],
                    "refresh": False,
                }
            ]
        if element["id"] == AGAINST:
            element["parameters"]["ausdruck"]["value"] = 'Position.richtung = "buy"'
            element["inputs"] = []
    answer = usage(client, document).json()
    found = instances(answer)
    assert (found["ema50"]["first_use"], found["ema50"]["first_use_source"]) == (CROSSING, "flow")
    assert (found["ema20"]["first_use"], found["ema20"]["first_use_source"]) == (
        CROSSING,
        "instance",
    )
    assert found["ema20"]["connected"] is True
    linked = [item for item in uses(answer, CROSSING) if item["kind"] == "data_link"]
    assert [(item["instance"], item["by_instance"]) for item in linked] == [("ema20", "ema50")]
    findings = post_json(client, "/api/v1/check", document).json()["findings"]
    assert [item for item in findings if item["code"].startswith("instance.")] == []


def test_a_data_connection_of_an_instance_is_a_use_at_the_element_of_the_other_instance(
    client: TestClient,
) -> None:
    document = load_case("str-03")
    for element in document["elements"]:
        instance = element.get("instance")
        if instance and instance["key"] == "ema50":
            instance["parameter_values"]["periode"] = {
                "kind": "connection",
                "value": {"instance": "atr14", "property": "wert"},
            }
    answer = usage(client, document).json()
    found = instances(answer)
    # `ema50` is first used at "Kreuzen", before "Stop-Loss", the first use of `atr14`: the use
    # of `atr14` at "Kreuzen" (through `ema50`) is not usable there
    assert found["atr14"]["first_use"] == STOP
    linked = [item for item in uses(answer, CROSSING) if item["kind"] == "data_link"]
    assert [(item["instance"], item["by_instance"]) for item in linked] == [("atr14", "ema50")]
    assert linked[0]["members"][0]["name"] == "wert"
    check = post_json(client, "/api/v1/check", document).json()
    not_usable = [item for item in check["findings"] if item["code"] == "instance.not_usable"]
    assert [(item["element"], item["subject"]) for item in not_usable] == [(CROSSING, "atr14")]
    assert not_usable[0]["details"]["by_instance"] == "ema50"
    assert not_usable[0]["details"]["first_use"] == STOP
    assert not_usable[0]["details"]["use"] == "data_link"


def test_a_rule_of_the_strategy_that_uses_an_instance_leads_to_the_first_element_with_rules(
    client: TestClient,
) -> None:
    document = load_case("str-03")
    document["rules"].append(
        {
            "name": "Nur ATR",
            "key": "nur_atr",
            "object_type": "Regel",
            "origin": {"object_type": "Regel"},
            "expression": "atr14.wert > 0",
        }
    )
    for element in document["elements"]:
        if element["id"] in (STOP, NEW_STOP):
            element["parameters"]["ausdruck"]["value"] = "Kerze.schluss"
            element["inputs"] = []
        instance = element.get("instance")
        if instance and instance["key"] == "atr14":
            instance["first_use"] = None
    answer = usage(client, document).json()
    atr = instances(answer)["atr14"]
    assert (atr["first_use"], atr["first_use_source"]) == (PLACE_ORDER, "rule")
    assert atr["connected"] is True
    assert [(item["instance"], item["kind"]) for item in answer["strategy_rules"]] == [
        ("atr14", "rule")
    ]
    assert answer["strategy_rules"][0]["members"][0]["name"] == "wert"


def test_usage_reads_a_document_of_the_format_one(client: TestClient) -> None:
    answer = usage(client, load_case_v1("str-03")).json()
    found = instances(answer)
    assert list(found) == ["ema20", "ema50", "atr14"]
    assert all(item["first_use_source"] == "flow" for item in found.values())


def test_usage_of_the_strategy_of_the_client(client: TestClient) -> None:
    document = json.loads(EMA_TRENDFOLGE_FILE.read_text(encoding="utf-8"))
    answer = usage(client, document).json()
    assert [item["instance"] for item in answer["instances"]] == ["ema20", "ema50", "atr14"]
    assert all(
        item["connected"] and item["first_use_source"] == "flow" for item in answer["instances"]
    )
    # the conversion laid inputs with "Aktualisieren" at the elements of the management
    refreshed = [
        (entry["element"], item["instance"])
        for entry in answer["elements"]
        for item in entry["uses"]
        if item["kind"] == "input" and all(member["refresh"] for member in item["members"])
    ]
    assert sorted(item[1] for item in refreshed) == ["atr14", "ema20", "ema50"]


def test_usage_leaves_the_list_of_places_out_at_the_limit(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    # EMA 20 is usable at 11 elements, the next instance at as many: 15 entries fit the first only
    monkeypatch.setattr("pipwerk_domain.consistency.usage.MAX_USAGE_ENTRIES", 15)
    answer = usage(client, load_case("str-03")).json()
    found = list(instances(answer).values())
    assert answer["truncated"] is True
    assert found[0]["usable_at"] and not found[0]["usable_at_omitted"]
    assert any(item["usable_at_omitted"] and item["usable_at"] == [] for item in found)
    assert all(item["usable_everywhere"] is False for item in found)


def test_usage_of_a_template_is_an_error(client: TestClient) -> None:
    response = usage(client, trend_document())
    assert response.status_code == 422
    assert response.json()["code"] == "usage.strategy_required"


def test_usage_errors(client: TestClient) -> None:
    broken = usage(client, {"format": "pipwerk.strategy", "format_version": "2.0"})
    assert broken.status_code == 422
    assert broken.json()["code"] == "document.invalid"
    assert broken.json()["errors"][0]["location"][0] == "document"
    extra = post_json(client, "/api/v1/usage", {"document": load_case("str-03"), "more": 1})
    assert extra.status_code == 422
    assert extra.json()["code"] == "request.invalid"
    missing = post_json(client, "/api/v1/usage", {})
    assert missing.json()["code"] == "request.invalid"
    not_json = client.post("/api/v1/usage", content=b"{}", headers={"content-type": "text/plain"})
    assert (not_json.status_code, not_json.json()["code"]) == (415, "request.not_json")
    garbage = client.post("/api/v1/usage", content=b"{", headers=JSON)
    assert (garbage.status_code, garbage.json()["code"]) == (422, "request.invalid")


@pytest.mark.parametrize("path", ["usage", "insert", "removals"])
def test_the_size_of_the_body_is_limited_for_the_new_endpoints(
    client: TestClient, path: str
) -> None:
    large = client.post(
        f"/api/v1/{path}", content=b" " * (limits.MAX_DOCUMENT_BYTES + 1), headers=JSON
    )
    assert (large.status_code, large.json()["code"]) == (413, "request.too_large")


def calculations(count: int) -> dict[str, Any]:
    """A strategy: a trigger and ``count`` calculations in a chain (the elements of a document)."""
    elements: list[dict[str, Any]] = [
        {
            "id": f"00000000-0000-4000-8000-{1:012d}",
            "type": "trigger.candle_close",
            "parameters": {"zeiteinheit": {"kind": "fixed", "value": "h1"}},
        }
    ]
    connections: list[dict[str, Any]] = []
    for number in range(2, count + 1):
        elements.append(
            {
                "id": f"00000000-0000-4000-8000-{number:012d}",
                "type": "flow.calculation",
                "name": f"R{number}",
                "key": f"r{number}",
                "parameters": {"ausdruck": {"kind": "expression", "value": "1"}},
            }
        )
        connections.append(
            {
                "id": f"00000000-0000-4000-9000-{number:012d}",
                "source": f"00000000-0000-4000-8000-{number - 1:012d}",
                "output": "weiter",
                "target": f"00000000-0000-4000-8000-{number:012d}",
            }
        )
    return {
        "format": "pipwerk.strategy",
        "format_version": "2.0",
        "id": "00000000-0000-4000-8000-000000000900",
        "name": "Viele",
        "elements": elements,
        "connections": connections,
    }


def test_usage_at_the_limit_of_elements_and_above(client: TestClient) -> None:
    at_limit = usage(client, calculations(limits.MAX_ELEMENTS))
    assert at_limit.status_code == 200
    assert at_limit.json()["instances"] == []
    above = usage(client, calculations(limits.MAX_ELEMENTS + 1))
    assert (above.status_code, above.json()["code"]) == (422, "document.invalid")


def test_usage_at_the_limit_of_inputs_of_an_element_and_above(client: TestClient) -> None:
    document = load_case("str-03")
    crossing = next(item for item in document["elements"] if item["id"] == CROSSING)
    entry = {
        "instance": "ema20",
        "property": "wert",
        "kind": "property",
        "arguments": [],
        "refresh": False,
    }
    crossing["inputs"] = [dict(entry) for _ in range(limits.MAX_INPUTS_PER_ELEMENT)]
    assert usage(client, document).status_code == 200
    crossing["inputs"].append(dict(entry))
    assert usage(client, document).json()["code"] == "document.invalid"


# --- visible names and findings in the expressions endpoint ---------------------------------------


def ask(client: TestClient, document: dict[str, Any], pointer: str, **form: Any) -> dict[str, Any]:
    response = post_json(
        client,
        "/api/v1/expressions",
        {"document": document, "language": "de", "items": [{"pointer": pointer, **form}]},
    )
    assert response.status_code == 200, response.text
    return response.json()["items"][0]  # type: ignore[no-any-return]


def test_an_instance_that_is_not_usable_at_the_place_is_not_offered(client: TestClient) -> None:
    """On the branch "falsch" of "Kreuzen", `ATR 14` (first used on "wahr") is no use; `EMA 20`
    (first used at "Kreuzen" itself) is."""
    document = example("str-03-instanz-nicht-verwendbar.strategy.json")
    index = next(i for i, item in enumerate(document["elements"]) if item["key"] == "pruefung")
    pointer = f"/elements/{index}/parameters/ausdruck/value"
    answer = ask(client, document, pointer, stored="atr14.wert > 0")
    offered = {item["path"][0] for item in answer["names"]}
    assert "ema20" in offered
    assert "atr14" not in offered
    assert {"Konto", "Strategie"} <= offered
    # a name that was typed all the same is reported at its place
    found = [item for item in answer["findings"] if item["code"] == "instance.not_usable"]
    # the positions refer to the display form: `[ATR 14].Wert`
    assert answer["display"].startswith("[ATR 14].Wert")
    assert [
        (item["subject"], item["details"]["start"], item["details"]["end"]) for item in found
    ] == [("atr14", 0, 13)]
    assert found[0]["details"]["first_use"] == STOP
    assert found[0]["element"] == document["elements"][index]["id"]
    clean = ask(client, document, pointer, stored="ema20.wert > 0")
    assert [item for item in clean["findings"] if item["code"] == "instance.not_usable"] == []


def test_every_instance_is_offered_at_the_element_of_its_first_use_and_behind(
    client: TestClient,
) -> None:
    document = load_case("str-03")
    index = next(i for i, item in enumerate(document["elements"]) if item["id"] == STOP)
    answer = ask(
        client, document, f"/elements/{index}/parameters/ausdruck/value", stored="atr14.wert"
    )
    offered = {item["path"][0] for item in answer["names"]}
    assert {"ema20", "ema50", "atr14", "richtung"} <= offered
    # in front of the first use of `ema20`, at the trigger, it is not offered
    trigger_index = next(i for i, item in enumerate(document["elements"]) if item["id"] == TRIGGER)
    at_trigger = ask(
        client, document, f"/elements/{trigger_index}/parameters/zeiteinheit/value", stored=""
    )
    assert not ({"ema20", "ema50", "atr14"} & {item["path"][0] for item in at_trigger["names"]})


def test_contained_instances_are_not_listed_twice(client: TestClient) -> None:
    """A contained instance is addressable everywhere in the strategy, but the list of the visible
    names shows it with the instance that contains it only."""
    document = load_case("str-03")
    made = insert(client, document, template=template_with_contents(), name="Trend H1").json()[
        "instance"
    ]
    document["elements"].append(
        {"id": "00000000-0000-4000-8000-0000000000e1", "type": "Trend", "instance": made}
    )
    answer = ask(client, document, "/rules/0/expression", stored="TRUE()")
    top = [item for item in answer["names"] if item["kind"] == "instance"]
    names = {item["display"] for item in top}
    assert "Trend H1" in names
    assert "Trend H1 EMA 20" not in names
    trend_entry = next(item for item in top if item["display"] == "Trend H1")
    assert [item["display"] for item in trend_entry["contents"]] == [
        "Trend H1 EMA 20",
        "Trend H1 Aufwärts",
    ]
    # the contained instance can be addressed by its own name from anywhere in the strategy
    stored = ask(client, document, "/rules/0/expression", display="[Trend H1 EMA 20].Wert * 2")
    assert stored["stored"] == "trend_h1_ema_20.wert * 2"
    assert [item for item in stored["findings"] if item["code"] == "expression.invalid"] == []


# --- insert ------------------------------------------------------------------------------------


def test_insert_an_object_type_gives_its_name_in_the_language(client: TestClient) -> None:
    # the name of the type is the name of an object of the application, so a number is appended
    german = insert(client, load_case("str-03"), object_type="Kerze").json()["instance"]
    assert (german["name"], german["key"]) == ("Kerze 2", "kerze_2")
    english = insert(client, load_case("str-03"), object_type="Kerze", language="en").json()[
        "instance"
    ]
    assert (english["name"], english["key"]) == ("Candle 2", "candle_2")
    # a type whose name the strategy does not have gets it as it is
    plain = insert(client, load_case("str-03"), object_type="ZigZag").json()["instance"]
    assert (plain["name"], plain["key"]) == ("ZigZag", "zigzag")
    assert german["origin"] == {"object_type": "Kerze", "template_id": None, "template_name": None}
    assert german["first_use"] is None
    assert german["object_type"] == "Kerze"


def test_a_name_that_is_taken_gets_a_number(client: TestClient) -> None:
    document = load_case("str-03")
    first = insert(client, document, object_type="EMA", name="EMA 20").json()["instance"]
    assert (first["name"], first["key"]) == ("EMA 20 2", "ema_20_2")
    # a name that differs from a taken one in case and blanks only is taken as well
    second = insert(client, document, object_type="EMA", name="  ema   20 ").json()["instance"]
    assert second["name"] != "  ema   20 "
    assert second["name"].endswith(" 2")
    free = insert(client, document, object_type="EMA", name="EMA 21").json()["instance"]
    assert (free["name"], free["key"]) == ("EMA 21", "ema_21")


def test_insert_gives_a_name_not_taken_in_either_language_and_not_a_function(
    client: TestClient,
) -> None:
    for name, expected in (("Account", "Account 2"), ("Konto", "Konto 2"), ("konto", "konto 2")):
        found = insert(client, load_case("str-03"), object_type="Konto", name=name).json()[
            "instance"
        ]
        assert found["name"] == expected
    function = insert(client, load_case("str-03"), object_type="Konto", name="IF").json()[
        "instance"
    ]
    assert function["name"] == "IF"
    assert function["key"] == "if_2"  # a key is no name of a function


def template_with_contents() -> dict[str, Any]:
    ema = {
        "name": "EMA 20",
        "key": "ema20",
        "object_type": "EMA",
        "origin": {"object_type": "EMA"},
        "parameter_values": {
            "zeiteinheit": {"kind": "parameter", "value": "zeiteinheit"},
            "periode": {"kind": "fixed", "value": 20},
        },
    }
    check_rule = {
        "name": "Aufwärts",
        "key": "aufwaerts",
        "object_type": "Regel",
        "origin": {"object_type": "Regel"},
        "expression": "ema20.wert > 1",
    }
    return {
        **trend_document("Mein Trend"),
        "id": "11111111-2222-4333-8444-666666666666",
        "parameters": [
            {"key": "zeiteinheit_2", "name": "Zeit", "datatype": "time_unit", "required": False}
        ],
        "instances": [ema],
        "rules": [check_rule],
        "properties": [
            {
                "key": "richtung",
                "name": "Richtung",
                "datatype": "text",
                "expression": 'IF(aufwaerts.ergebnis; "aufwaerts"; "abwaerts")',
            },
            {
                "key": "preis",
                "name": "Preis",
                "datatype": "number",
                "expression": "ema20.wert + PREVIOUS(ema20.wert)",
            },
        ],
    }


def test_insert_a_template_names_what_it_contains_after_the_new_instance(
    client: TestClient,
) -> None:
    answer = insert(client, load_case("str-03"), template=template_with_contents(), name="Trend H1")
    assert answer.status_code == 200, answer.text
    made = answer.json()["instance"]
    assert (made["name"], made["key"], made["object_type"]) == ("Trend H1", "trend_h1", "Trend")
    assert made["origin"] == {
        "object_type": "Trend",
        "template_id": "11111111-2222-4333-8444-666666666666",
        "template_name": "Mein Trend",  # a template of the user: its name at the time
    }
    contained = made["instances"][0]
    assert (contained["name"], contained["key"]) == ("Trend H1 EMA 20", "trend_h1_ema_20")
    rule = made["rules"][0]
    assert (rule["name"], rule["key"]) == ("Trend H1 Aufwärts", "trend_h1_aufwaerts")
    # the expressions inside the instance use the new keys; the keys of the properties and
    # the parameters stay
    assert made["rules"][0]["expression"] == "trend_h1_ema_20.wert > 1"
    assert made["properties"][0]["expression"] == (
        'IF(trend_h1_aufwaerts.ergebnis; "aufwaerts"; "abwaerts")'
    )
    assert made["properties"][1]["expression"] == (
        "trend_h1_ema_20.wert + PREVIOUS(trend_h1_ema_20.wert)"
    )
    assert made["parameters"][0]["key"] == "zeiteinheit_2"
    assert made["first_use"] is None


def test_insert_the_same_template_twice_gives_two_sets_of_names(client: TestClient) -> None:
    document = load_case("str-03")
    first = insert(client, document, template=template_with_contents(), name="Trend H1").json()[
        "instance"
    ]
    document["elements"].append(
        {"id": "00000000-0000-4000-8000-0000000000e1", "type": "Trend", "instance": first}
    )
    second = insert(client, document, template=template_with_contents(), name="Trend H1").json()[
        "instance"
    ]
    assert (second["name"], second["key"]) == ("Trend H1 2", "trend_h1_2")
    assert second["instances"][0]["name"] == "Trend H1 2 EMA 20"
    assert second["instances"][0]["key"] == "trend_h1_2_ema_20"
    assert second["rules"][0]["expression"] == "trend_h1_2_ema_20.wert > 1"
    # a name that the strategy has already leads to a number appended to the proposal
    document["elements"].append(
        {
            "id": "00000000-0000-4000-8000-0000000000e2",
            "type": "Trend",
            "instance": {**second, "name": "Trend H1 2", "key": "trend_h1_2"},
        }
    )
    third = insert(client, document, template=template_with_contents(), name="Trend H1 2").json()[
        "instance"
    ]
    assert third["name"] == "Trend H1 2 2"
    assert third["instances"][0]["name"] == "Trend H1 2 2 EMA 20"


def test_the_instance_of_a_template_in_the_document_is_a_document_without_findings(
    client: TestClient,
) -> None:
    document = load_case("str-03")
    made = insert(client, document, template=template_with_contents(), name="Trend H1").json()[
        "instance"
    ]
    made["parameter_values"] = {"zeiteinheit": {"kind": "fixed", "value": "h1"}}
    document["elements"].append(
        {"id": "00000000-0000-4000-8000-0000000000e1", "type": "Trend", "instance": made}
    )
    for element in document["elements"]:
        if element["id"] == PLACE_ORDER:
            element["properties"]["bemerkung"] = {
                "kind": "expression",
                "value": '"" & trend_h1.richtung',
            }
    findings = post_json(client, "/api/v1/check", document).json()["findings"]
    assert findings == []


def test_insert_the_delivered_rule_template(client: TestClient) -> None:
    templates = client.get("/api/v1/element-types").json()["templates"]
    risk = next(item for item in templates if item["id"] == RISK_TEMPLATE_ID)
    made = insert(client, load_case("str-03"), template=risk).json()["instance"]
    assert (made["name"], made["key"]) == ("Risiko je Trade", "risiko_je_trade")
    # a delivered template stores its identifier only
    assert made["origin"] == {
        "object_type": "Regel",
        "template_id": RISK_TEMPLATE_ID,
        "template_name": None,
    }
    assert made["determined_property"] == "volumen"
    assert made["expression"] == risk["expression"]  # no instance inside: unchanged


def test_insert_for_a_template_document(client: TestClient) -> None:
    template = template_with_contents()
    target = trend_document("Ziel")
    made = insert(client, target, object_type="EMA").json()["instance"]
    assert (made["name"], made["key"]) == ("EMA", "ema")
    target["instances"] = [made]
    again = insert(client, target, object_type="EMA").json()["instance"]
    assert (again["name"], again["key"]) == ("EMA 2", "ema_2")
    assert template["instances"][0]["key"] == "ema20"


def test_insert_reads_a_document_of_the_format_one(client: TestClient) -> None:
    made = insert(client, load_case_v1("str-03"), object_type="ATR", name="ATR 14").json()[
        "instance"
    ]
    assert (made["name"], made["key"]) == ("ATR 14 2", "atr_14_2")


def test_insert_errors(client: TestClient) -> None:
    document = load_case("str-03")
    neither = insert(client, document)
    assert (neither.status_code, neither.json()["code"]) == (422, "request.invalid")
    both = insert(client, document, object_type="EMA", template=template_with_contents())
    assert both.json()["code"] == "request.invalid"
    unknown = insert(client, document, object_type="Gibtesnicht")
    assert unknown.status_code == 422
    assert unknown.json()["code"] == "insert.type_unknown"
    wrong = insert(client, document, template=load_case("str-03"))
    assert wrong.status_code == 422
    assert wrong.json()["code"] == "insert.template_invalid"
    broken = insert(client, document, template={"format": "pipwerk.rule"})
    assert broken.json()["code"] == "document.invalid"
    assert broken.json()["errors"][0]["location"][0] == "template"
    bad_document = insert(client, {"format": "pipwerk.rule"}, object_type="EMA")
    assert bad_document.json()["errors"][0]["location"][0] == "document"
    language = insert(client, document, object_type="EMA", language="fr")
    assert language.json()["code"] == "request.invalid"


def test_insert_limits_the_length_of_a_name(client: TestClient) -> None:
    at_limit = insert(
        client, load_case("str-03"), object_type="EMA", name="x" * limits.MAX_NAME_LENGTH
    )
    assert at_limit.status_code == 200
    assert at_limit.json()["instance"]["name"] == "x" * limits.MAX_NAME_LENGTH
    above = insert(
        client, load_case("str-03"), object_type="EMA", name="x" * (limits.MAX_NAME_LENGTH + 1)
    )
    assert (above.status_code, above.json()["code"]) == (422, "request.invalid")
    long_type = insert(client, load_case("str-03"), object_type="x" * (limits.MAX_NAME_LENGTH + 1))
    assert long_type.json()["code"] == "request.invalid"


def test_the_names_of_a_deep_template_stay_within_the_limit_of_names(client: TestClient) -> None:
    template = template_with_contents()
    template["instances"][0]["name"] = "y" * limits.MAX_NAME_LENGTH
    made = insert(client, load_case("str-03"), template=template, name="z" * limits.MAX_NAME_LENGTH)
    assert made.status_code == 200
    contained = made.json()["instance"]["instances"][0]
    assert len(contained["name"]) <= limits.MAX_NAME_LENGTH


# --- removals ----------------------------------------------------------------------------------


def test_the_uses_of_an_element_before_its_removal(client: TestClient) -> None:
    document = load_case("str-03")
    answer = removal(client, document, "element", EMA_20)
    assert answer.status_code == 200, answer.text
    result = answer.json()
    assert result["used_by"] == [CROSSING, DIRECTION, AGAINST]  # in the order of the strategy
    assert result["used_by_rules"] == []
    assert result["removed"] == []
    assert result["document"] is None


def test_removing_an_instance_leaves_empty_places_and_no_input(client: TestClient) -> None:
    document = load_case("str-03")
    answer = removal(client, document, "element", EMA_20, apply=True).json()
    assert answer["removed"] == [EMA_20]
    changed = answer["document"]
    assert EMA_20 not in {item["id"] for item in changed["elements"]}
    crossing = next(item for item in changed["elements"] if item["id"] == CROSSING)
    assert "[]" in crossing["parameters"]["ausdruck"]["value"]
    assert "ema20" not in crossing["parameters"]["ausdruck"]["value"].lower()
    assert [item["instance"] for item in crossing["inputs"]] == ["ema50"]
    check = post_json(client, "/api/v1/check", changed).json()
    assert "expression.empty" in codes(check["findings"])
    saved = post(client, "strategies", changed)
    assert saved.status_code == 201


def test_removing_the_order_takes_its_management_with_it(client: TestClient) -> None:
    document = load_case("str-03")
    answer = removal(client, document, "element", PLACE_ORDER, apply=True).json()
    management = [
        item["id"] for item in document["elements"] if item.get("management_of") == PLACE_ORDER
    ]
    assert sorted(answer["removed"]) == sorted([PLACE_ORDER, *management])
    assert len(answer["removed"]) == 8
    assert answer["used_by"] == []
    remaining = {item["id"] for item in answer["document"]["elements"]}
    assert remaining.isdisjoint(answer["removed"])
    assert all(
        item["source"] in remaining and item["target"] in remaining
        for item in answer["document"]["connections"]
    )


def test_the_uses_of_a_strategy_parameter_and_its_removal(client: TestClient) -> None:
    document = load_case("str-03")
    answer = removal(client, document, "strategy_parameter", "Stop_Abstand").json()
    assert answer["used_by"] == [STOP, NEW_STOP]
    assert answer["document"] is None
    applied = removal(client, document, "strategy_parameter", "stop_abstand", apply=True).json()
    assert [item["key"] for item in applied["document"]["parameters"]] == ["zeiteinheit"]
    stop = next(item for item in applied["document"]["elements"] if item["id"] == STOP)
    assert "[]" in stop["parameters"]["ausdruck"]["value"]
    assert applied["removed"] == []
    unit = removal(client, document, "strategy_parameter", "zeiteinheit").json()
    # the time unit is used by bindings of the kind strategy parameter
    assert {EMA_20, ATR_14, TRIGGER, MANAGEMENT_TRIGGER} <= set(unit["used_by"])


def test_the_uses_of_a_rule_and_its_removal(client: TestClient) -> None:
    document = load_case("str-03")
    document["rules"].append(
        {
            "name": "Auswertung",
            "key": "auswertung",
            "object_type": "Regel",
            "origin": {"object_type": "Regel"},
            "expression": "Konto.kapital > 0",
        }
    )
    document["rules"].append(
        {
            "name": "Zweite",
            "key": "zweite",
            "object_type": "Regel",
            "origin": {"object_type": "Regel"},
            "expression": "auswertung.ergebnis",
        }
    )
    for element in document["elements"]:
        if element["id"] == CROSSING:
            element["parameters"]["ausdruck"]["value"] = "Konto.kapital > 0 & TRUE()"
        if element["id"] == STOP:
            element["parameters"]["ausdruck"]["value"] = "IF(auswertung.ergebnis; 1; 2)"
            element["inputs"] = []
    answer = removal(client, document, "rule", "Auswertung").json()
    assert answer["used_by"] == [STOP]
    assert answer["used_by_rules"] == ["zweite"]
    applied = removal(client, document, "rule", "auswertung", apply=True).json()
    assert "auswertung" not in [item["key"] for item in applied["document"]["rules"]]
    second = next(item for item in applied["document"]["rules"] if item["key"] == "zweite")
    assert second["expression"] == "[]"
    # a rule of an element
    element_rule = removal(client, document, "rule", "mindestvolumen").json()
    assert element_rule["used_by"] == [] and element_rule["used_by_rules"] == []
    removed = removal(client, document, "rule", "mindestvolumen", apply=True).json()
    order = next(item for item in removed["document"]["elements"] if item["id"] == PLACE_ORDER)
    assert order["rules"] == []


def test_removal_errors(client: TestClient) -> None:
    document = load_case("str-03")
    for kind, target in (
        ("element", "00000000-0000-4000-8000-0000000000ff"),
        ("strategy_parameter", "gibtesnicht"),
        ("rule", "gibtesnicht"),
    ):
        unknown = removal(client, document, kind, target)
        assert (unknown.status_code, unknown.json()["code"]) == (422, "removal.target_unknown")
    template = removal(client, trend_document(), "element", EMA_20)
    assert template.status_code == 422
    assert template.json()["code"] == "removal.strategy_required"
    kind = removal(client, document, "section", "x")
    assert kind.json()["code"] == "request.invalid"
    long = removal(client, document, "rule", "x" * (limits.MAX_KEY_LENGTH + 1))
    assert long.json()["code"] == "request.invalid"
    at_limit = removal(client, document, "rule", "x" * limits.MAX_KEY_LENGTH)
    assert at_limit.json()["code"] == "removal.target_unknown"
    broken = removal(client, {"format": "pipwerk.strategy"}, "rule", "x")
    assert broken.json()["code"] == "document.invalid"
    flag = post_json(
        client,
        "/api/v1/removals",
        {"document": document, "kind": "rule", "target": "r", "apply": "yes"},
    )
    assert flag.json()["code"] == "request.invalid"


def test_removal_does_not_change_what_is_stored(client: TestClient) -> None:
    created = post(client, "strategies", load_case("str-03")).json()
    removal(client, created["document"], "element", EMA_20, apply=True)
    assert client.get(f"/api/v1/strategies/{created['id']}").json() == created["document"]


# --- the new findings in the endpoints that save ------------------------------------------------


def test_creating_a_strategy_with_an_instance_nobody_uses_answers_the_finding(
    client: TestClient,
) -> None:
    created = post(client, "strategies", example("str-03-instanz-ohne-verbindung.strategy.json"))
    assert created.status_code == 201
    found = [item for item in created.json()["findings"] if item["code"] == "instance.unconnected"]
    assert [(item["level"], item["subject"]) for item in found] == [("error", "ema100")]


def test_the_findings_of_an_instance_that_is_not_usable_name_the_places(client: TestClient) -> None:
    checked = post_json(
        client, "/api/v1/check", example("str-03-instanz-nicht-verwendbar.strategy.json")
    ).json()
    found = [item for item in checked["findings"] if item["code"] == "instance.not_usable"]
    assert len(found) == 1
    details = found[0]["details"]
    assert (found[0]["subject"], details["instance"], details["first_use"], details["use"]) == (
        "atr14",
        "atr14",
        STOP,
        "expression",
    )
    assert details["property"] == "wert"
    assert details["by_instance"] is None
