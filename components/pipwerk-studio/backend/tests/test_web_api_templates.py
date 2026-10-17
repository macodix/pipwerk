"""Tests of the template flow of the public web API (acceptance criterion 7 of ``wp01``) and of
``GET /api/v1/<art>/{id}/usages`` (req-ablauf-006).

A template of the object type ``Regel`` is created, changed and deleted. A saved strategy that
contains an instance made from it is named by ``usages``, also when the instance is inside a
contained instance, a ruleset or an indicator; after deleting the template the strategy is
unchanged. Files that are not readable are skipped and counted.
"""

import copy
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from web_api_support import (
    RISK_TEMPLATE_ID,
    indicator_document,
    instance,
    instance_of,
    load_case,
    post,
    put,
    rule_document,
    ruleset_document,
)


def strategy_with_rule(template_id: str, title: str, name: str = "mindest") -> dict[str, Any]:
    document = load_case("str-03")
    document["title"] = f"Strategie mit {title}"
    document["rules"].append(instance_of(template_id, title, name))
    return document


def usage_ids(client: TestClient, art: str, object_id: str) -> list[str]:
    response = client.get(f"/api/v1/{art}/{object_id}/usages")
    assert response.status_code == 200, response.text
    return [item["id"] for item in response.json()["usages"]]


def test_a_rule_template_is_created_changed_and_deleted_and_the_strategy_stays_unchanged(
    client: TestClient, objects: Path
) -> None:
    template = post(client, "rules", rule_document("Mindestvolumen")).json()
    template_id = template["id"]
    assert template["findings"] == []

    strategy = post(client, "strategies", strategy_with_rule(template_id, "Mindestvolumen")).json()
    strategy_id = strategy["id"]
    assert usage_ids(client, "rules", template_id) == [strategy_id]
    answer = client.get(f"/api/v1/rules/{template_id}/usages").json()
    assert answer == {
        "usages": [
            {"art": "strategies", "id": strategy_id, "title": "Strategie mit Mindestvolumen"}
        ],
        "skipped_unreadable": 0,
    }
    before = client.get(f"/api/v1/strategies/{strategy_id}").text

    changed = copy.deepcopy(template["document"])
    changed["title"] = "Mindestvolumen 2"
    changed["expression"] = "Order.volumen >= 2 * Instrument.mindestvolumen"
    assert put(client, "rules", template_id, changed).status_code == 200
    assert client.get(f"/api/v1/strategies/{strategy_id}").text == before  # E4: no effect
    assert usage_ids(client, "rules", template_id) == [strategy_id]

    deleted = client.delete(f"/api/v1/rules/{template_id}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/rules/{template_id}").status_code == 404
    assert client.get(f"/api/v1/strategies/{strategy_id}").text == before
    assert [item["id"] for item in client.get("/api/v1/strategies").json()["items"]] == [
        strategy_id
    ]
    assert client.get(f"/api/v1/rules/{template_id}/usages").status_code == 404
    assert sorted(item.name for item in objects.iterdir()) == [f"{strategy_id}.strategy.json"]


def test_a_template_without_usages_has_none(client: TestClient) -> None:
    template_id = post(client, "rules", rule_document()).json()["id"]
    post(client, "strategies", load_case("str-03"))
    assert client.get(f"/api/v1/rules/{template_id}/usages").json() == {
        "usages": [],
        "skipped_unreadable": 0,
    }


def test_usages_are_found_in_every_place_an_instance_can_be(client: TestClient) -> None:
    rule_id = post(client, "rules", rule_document("Mindestvolumen")).json()["id"]

    # a ruleset template that contains an instance of the rule
    ruleset = ruleset_document("Regelwerk A", [instance_of(rule_id, "Mindestvolumen", "regel")])
    ruleset_id = post(client, "rulesets", ruleset).json()["id"]
    # an indicator template that contains an instance of the rule
    indicator = indicator_document("Indikator A")
    indicator["rules"] = [instance_of(rule_id, "Mindestvolumen", "regel")]
    indicator_id = post(client, "indicators", indicator).json()["id"]

    # a strategy with an instance of the rule in a rule of an element, inside a ruleset
    nested = load_case("str-03")
    nested["title"] = "Strategie verschachtelt"
    order = next(item for item in nested["elements"] if item["type"] == "flow.place_order")
    order["rules"].append(
        instance(
            "werk",
            "Regelwerk",
            origin={"object_type": "Regelwerk", "template_id": ruleset_id},
            rules=[instance_of(rule_id, "Mindestvolumen", "regel")],
        )
    )
    nested_id = post(client, "strategies", nested).json()["id"]

    # a strategy with an instance of the rule in the instance of an element
    inside = load_case("str-03")
    inside["title"] = "Strategie Element"
    inside["elements"][0]["instance"]["rules"] = [instance_of(rule_id, "Mindestvolumen", "regel")]
    inside_id = post(client, "strategies", inside).json()["id"]

    # a strategy that does not use the rule
    post(client, "strategies", load_case("str-01"))

    answer = client.get(f"/api/v1/rules/{rule_id}/usages").json()
    found = {(item["art"], item["id"]) for item in answer["usages"]}
    assert found == {
        ("rulesets", ruleset_id),
        ("indicators", indicator_id),
        ("strategies", nested_id),
        ("strategies", inside_id),
    }
    assert answer["skipped_unreadable"] == 0
    titles = [item["title"] for item in answer["usages"]]
    assert titles == sorted(titles, key=str.casefold)

    # the ruleset is used by the strategy that contains an instance made from it
    assert usage_ids(client, "rulesets", ruleset_id) == [nested_id]


def test_a_strategy_with_an_instance_made_from_an_indicator_template_is_a_usage(
    client: TestClient,
) -> None:
    indicator_id = post(client, "indicators", indicator_document("Mein Indikator")).json()["id"]
    document = load_case("str-03")
    document["elements"][0]["instance"]["origin"] = {
        "object_type": "Indikator",
        "template_id": indicator_id,
        "template_title": "Mein Indikator",
    }
    strategy_id = post(client, "strategies", document).json()["id"]
    assert usage_ids(client, "indicators", indicator_id) == [strategy_id]


def test_the_delivered_template_has_usages_too(client: TestClient) -> None:
    strategy_id = post(client, "strategies", load_case("str-03")).json()["id"]
    post(client, "strategies", {**load_case("str-03"), "rules": []})
    assert usage_ids(client, "rules", RISK_TEMPLATE_ID) == [strategy_id]


def test_usages_of_a_template_of_another_kind_are_404(client: TestClient) -> None:
    rule_id = post(client, "rules", rule_document()).json()["id"]
    assert client.get(f"/api/v1/indicators/{rule_id}/usages").status_code == 404
    assert client.get(f"/api/v1/strategies/{rule_id}/usages").status_code == 404


def test_the_template_itself_is_not_one_of_its_usages(client: TestClient) -> None:
    template = post(client, "rulesets", ruleset_document("A", [])).json()
    document = template["document"]
    document["rules"] = [instance_of(template["id"], "A", "selbst")]
    put(client, "rulesets", template["id"], document)
    assert usage_ids(client, "rulesets", template["id"]) == []
