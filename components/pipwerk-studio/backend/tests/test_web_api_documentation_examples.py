"""Tests of the examples in the section "Web-API ausprobieren" of the technical documentation
(order 04 point 13; acceptance criteria 5 and 7 of ``wp01``).

The section was part of the user documentation until order 04; it is now section 5.4 of
``docs/technical/pipwerk-studio.md``, and the user documentation points to it. The examples are
files in ``contracts/strategies/v2/examples/`` (format 2.0). Every example is loaded, checked
against the document format and used through the web API exactly as the documentation says: the
rule template with its changed version and the flow with ``usages`` and deleting (criterion 7),
and the seven changed versions of the test case ``str-03`` with the findings of ``check`` and of
``PUT`` (criterion 5). The tests also read the documentation: it must name every file and the
findings of every change, and the instance that it shows is the one used here.
"""

import copy
import json
import re
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from pipwerk_domain.documents import read_document
from web_api_support import (
    EXAMPLE_DIRECTORY,
    REPOSITORY,
    check,
    codes,
    load_case,
    post,
    post_json,
    put,
    without_id,
)

DOCUMENTATION = REPOSITORY / "docs" / "technical" / "pipwerk-studio.md"
USER_DOCUMENTATION = REPOSITORY / "docs" / "user" / "pipwerk-studio.md"
EXAMPLES = EXAMPLE_DIRECTORY
TEMPLATE_FILE = "regel-vorlage.rule.json"
CHANGED_TEMPLATE_FILE = "regel-vorlage-geaendert.rule.json"
PLACEHOLDER = "<Kennung der Vorlage>"
SECTION = "### 5.4 Web-API ausprobieren"
END_OF_SECTION = "## 6. Prüfungen"

CONDITION = "7e1ab090-5a18-5414-9f00-5541c0e4b325"  # the element "Kreuzen" of str-03
DIRECTION = "81ddf1b2-15f1-54f0-8a7e-7387b4dd119f"  # the element "Richtung"
STOP_CALCULATION = "d68f936b-4e65-5d0c-a4eb-a1438baaa470"  # the element "Stop-Loss" of str-03
PLACE_ORDER = "7896d1ad-8c07-517d-b451-80fe53d46681"  # the element "Order aufgeben"
MAIN_TRIGGER = "fd3b87fb-a152-51fa-bd12-4579eba0a33d"
NEW_A = "00000000-0000-4000-8000-0000000000aa"
NEW_B = "00000000-0000-4000-8000-0000000000bb"
NEW_CONNECTION = "00000000-0000-4000-8000-0000000000cc"

Finding = tuple[str, str, str | None]


def example(name: str) -> dict[str, Any]:
    return json.loads((EXAMPLES / name).read_text(encoding="utf-8"))  # type: ignore[no-any-return]


def documentation_section(start: str, end: str | None = None) -> str:
    """The text of the documentation from the heading ``start`` up to the heading ``end`` (up to
    the end of the section if there is none), both inside section 5.4."""
    text = DOCUMENTATION.read_text(encoding="utf-8")
    section = text[text.index(SECTION) : text.index(END_OF_SECTION)]
    begin = section.index(start)
    return section[begin:] if end is None else section[begin : section.index(end, begin)]


def element(document: dict[str, Any], identifier: str) -> dict[str, Any]:
    return next(item for item in document["elements"] if item["id"] == identifier)


def new_element(identifier: str, type_id: str, **fields: Any) -> dict[str, Any]:
    """An element as the web API stores it (written out with all fields)."""
    return {
        "id": identifier,
        "type": type_id,
        "name": None,
        "key": None,
        "position": None,
        "parameters": {},
        "properties": {},
        "inputs": [],
        "rules": [],
        "management_of": None,
        "instance": None,
        **fields,
    }


def empty_content() -> dict[str, Any]:
    return {
        "parameter_values": {},
        "parameters": [],
        "properties": [],
        "instances": [],
        "rules": [],
        "expression": None,
        "determined_property": None,
        "comparison": None,
        "result_expression": None,
    }


# --- the seven changes, written out as the documentation describes them -------------------------


def remove_the_trigger(document: dict[str, Any]) -> None:
    document["elements"] = [item for item in document["elements"] if item["id"] != MAIN_TRIGGER]
    document["connections"] = [
        item for item in document["connections"] if item["source"] != MAIN_TRIGGER
    ]


def set_expression(text: str) -> Callable[[dict[str, Any]], None]:
    def change(document: dict[str, Any]) -> None:
        condition = element(document, CONDITION)
        condition["parameters"]["ausdruck"]["value"] = text
        condition["inputs"] = []  # the new expression uses no property of an instance

    return change


def add_an_indicator_with_an_order_rule(document: dict[str, Any]) -> None:
    rule = {
        **empty_content(),
        "name": "Regel",
        "key": "regel",
        "object_type": "Regel",
        "origin": {"object_type": "Regel", "template_id": None, "template_name": None},
        "expression": "Order.volumen > 0",
    }
    indicator = {
        **empty_content(),
        "name": "Eigener Indikator",
        "key": "eigener_indikator",
        "object_type": "Indikator",
        "origin": {"object_type": "Indikator", "template_id": None, "template_name": None},
        "parameter_values": {
            "zeiteinheit": {"kind": "fixed", "value": "h1"},
            "instrument": {"kind": "fixed", "value": "instrument_der_anwendung"},
        },
        "rules": [rule],
    }
    document["elements"].append(new_element(NEW_A, "Indikator", instance=indicator))


def add_modify_order_outside_a_management(document: dict[str, Any]) -> None:
    document["elements"].append(new_element(NEW_A, "flow.modify_order", name="Order ändern"))
    document["connections"].append(
        {"id": NEW_CONNECTION, "source": MAIN_TRIGGER, "output": "weiter", "target": NEW_A}
    )


def add_an_unknown_element_type(document: dict[str, Any]) -> None:
    document["elements"].append(new_element(NEW_B, "x.unbekannt", name="?"))


CASES: list[tuple[str, Callable[[dict[str, Any]], None], list[Finding]]] = [
    (
        "str-03-ohne-ausloeser.strategy.json",
        remove_the_trigger,
        [
            ("error", "flow.not_reached", CONDITION),
            ("error", "flow.not_reached", DIRECTION),
            ("error", "flow.not_reached", STOP_CALCULATION),
            ("error", "flow.not_reached", PLACE_ORDER),
            ("hint", "flow.main_without_trigger", None),
        ],
    ),
    (
        "str-03-schreibfehler.strategy.json",
        set_expression("ema20.wert > > 1"),
        [("error", "expression.invalid", CONDITION)],
    ),
    (
        "str-03-unbekannter-name.strategy.json",
        set_expression("gibtesnicht.wert > 1"),
        [("error", "expression.invalid", CONDITION)],
    ),
    (
        "str-03-order-im-hauptablauf.strategy.json",
        set_expression("Order.volumen > 0"),
        [("error", "expression.order_outside_management", CONDITION)],
    ),
    (
        "str-03-order-im-indikator.strategy.json",
        add_an_indicator_with_an_order_rule,
        [("error", "rule.order_in_indicator", NEW_A)],
    ),
    (
        "str-03-order-aendern-ausserhalb.strategy.json",
        add_modify_order_outside_a_management,
        [("error", "flow.management_only", NEW_A)],
    ),
    (
        "str-03-unbekannter-elementtyp.strategy.json",
        add_an_unknown_element_type,
        [("error", "type.unknown", NEW_B)],
    ),
]
IDS = [item[0].removeprefix("str-03-").removesuffix(".strategy.json") for item in CASES]


def reported(findings: list[dict[str, Any]]) -> list[Finding]:
    return [(item["level"], item["code"], item["element"]) for item in findings]


# --- the documents ------------------------------------------------------------------------------


def test_every_example_is_a_valid_document_and_named_in_the_documentation() -> None:
    names = sorted(item.name for item in EXAMPLES.iterdir())
    assert names == sorted([TEMPLATE_FILE, CHANGED_TEMPLATE_FILE, *(item[0] for item in CASES)])
    documentation = DOCUMENTATION.read_text(encoding="utf-8")
    for name in names:
        read_document((EXAMPLES / name).read_bytes())  # strict: unknown fields are rejected
        assert example(name)["format_version"] == "2.0", name
        assert f"`{name}`" in documentation, name


def test_the_user_documentation_points_to_the_section_and_no_longer_holds_it() -> None:
    text = USER_DOCUMENTATION.read_text(encoding="utf-8")
    assert "docs/technical/pipwerk-studio.md" in text
    assert "Abschnitt 5.4" in text
    for gone in (
        "#### Beispieldokumente",
        "#### Vorlage anlegen",
        "str-03-ohne-ausloeser",
        "regel-vorlage",
    ):
        assert gone not in text, gone
    assert "contracts/strategies/v1/examples" not in text
    assert "Web-API ausprobieren" in text


def test_the_documentation_names_the_findings_of_every_change() -> None:
    rows = {
        match.group(2): match.group(0)
        for match in re.finditer(
            r"^\| (\d) \| `(\S+)` \| .* \|$",
            documentation_section("#### Befunde der Konsistenzprüfung", "#### Ausdrücke"),
            re.MULTILINE,
        )
    }
    assert sorted(rows) == sorted(item[0] for item in CASES)
    for name, _, findings in CASES:
        for _, code, _ in findings:
            assert f"`{code}`" in rows[name], (name, code)


@pytest.mark.parametrize(("name", "change", "findings"), CASES, ids=IDS)
def test_a_changed_version_is_the_test_case_with_the_described_change(
    client: TestClient,
    name: str,
    change: Callable[[dict[str, Any]], None],
    findings: list[Finding],
) -> None:
    """The file is the test case with the change, in the form in which the web API stores
    it (elements written out with all fields), so that saving it changes nothing else."""
    expected = load_case("str-03")
    change(expected)
    stored = post(client, "strategies", expected).json()["document"]
    assert without_id(example(name)) == without_id(stored)
    assert example(name)["id"] == load_case("str-03")["id"]
    assert example(name) != load_case("str-03")


# --- criterion 5 --------------------------------------------------------------------------------


@pytest.mark.parametrize(("name", "change", "findings"), CASES, ids=IDS)
def test_check_reports_exactly_the_findings_of_the_documentation(
    client: TestClient, name: str, change: Callable[[dict[str, Any]], None], findings: list[Finding]
) -> None:
    response = check(client, example(name))
    assert response.status_code == 200
    assert reported(response.json()["findings"]) == findings
    assert client.get("/api/v1/strategies").json() == {"items": []}  # nothing was saved


def test_the_documentation_names_the_fields_and_counting_of_the_position() -> None:
    row = next(
        line
        for line in documentation_section(
            "#### Befunde der Konsistenzprüfung", "#### Ausdrücke"
        ).splitlines()
        if "`str-03-schreibfehler.strategy.json`" in line
    )
    for text in ("`details.start`", "`details.end`", "13 und 14", "ab 0", "hinter ihrem letzten"):
        assert text in row, text


def test_the_steps_replace_the_identifier_in_the_request_body_not_in_the_file() -> None:
    documentation = documentation_section("### 5.4", "#### Ausdrücke")
    assert "Ersetzen Sie vorher im Feld `id` der Datei" not in documentation
    assert documentation.count("Die Datei im Arbeitsverzeichnis bleibt unverändert.") == 2
    top_level = "im Feld `id` auf der obersten Ebene des Dokuments"
    assert documentation.count(f"Dann wird im eingefügten Text die Kennung {top_level}") == 2
    step = documentation.split("4. `PUT /api/v1/strategies/{id}`")[1].split("\n")[0]
    assert "Das Feld `id` auf der obersten Ebene des Dokuments" in step
    assert documentation.count("Die Felder `id` der Elemente bleiben unverändert.") == 2
    assert "nicht als neue Datei im Arbeitsverzeichnis" in documentation
    assert "weder in einer vorhandenen noch in einer neuen Datei" in documentation
    assert "ohne sie im Arbeitsverzeichnis zu speichern" in documentation


def test_the_unchanged_test_case_has_no_finding(client: TestClient) -> None:
    assert check(client, load_case("str-03")).json()["findings"] == []


@pytest.mark.parametrize(
    ("name", "details"),
    [
        (
            "str-03-schreibfehler.strategy.json",
            {"issue": "syntax", "start": 13, "end": 14, "found": ">"},
        ),
        (
            "str-03-unbekannter-name.strategy.json",
            {"issue": "unknown_name", "name": "gibtesnicht"},
        ),
        ("str-03-order-im-indikator.strategy.json", {}),
        ("str-03-unbekannter-elementtyp.strategy.json", {"type": "x.unbekannt"}),
    ],
)
def test_the_details_named_in_the_documentation(
    client: TestClient, name: str, details: dict[str, Any]
) -> None:
    finding = check(client, example(name)).json()["findings"][0]
    for key, value in details.items():
        assert finding["details"][key] == value
    if name.endswith("order-im-indikator.strategy.json"):
        assert finding["subject"] == "eigener_indikator.regel"


@pytest.mark.parametrize(("name", "change", "findings"), CASES, ids=IDS)
def test_put_saves_a_changed_version_with_its_findings(
    client: TestClient, name: str, change: Callable[[dict[str, Any]], None], findings: list[Finding]
) -> None:
    created = post(client, "strategies", load_case("str-03")).json()
    assert created["findings"] == []
    document = example(name)
    document["id"] = created["id"]  # the step of the documentation
    response = put(client, "strategies", created["id"], document)
    assert response.status_code == 200
    assert reported(response.json()["findings"]) == findings
    assert codes(response.json()["findings"]) == [item[1] for item in findings]
    stored = client.get(f"/api/v1/strategies/{created['id']}").json()
    assert stored == document
    assert stored != created["document"]


# --- criterion 7 --------------------------------------------------------------------------------


def instance_of_the_documentation(template_id: str) -> dict[str, Any]:
    section = documentation_section(
        "#### Vorlage anlegen, ändern und löschen", "#### Befunde der Konsistenzprüfung"
    )
    blocks = re.findall(r"```json\n(.*?)\n\s*```", section, re.DOTALL)
    assert len(blocks) == 1
    assert PLACEHOLDER in blocks[0]
    return json.loads(blocks[0].replace(PLACEHOLDER, template_id))  # type: ignore[no-any-return]


def test_the_flow_with_a_template_of_the_documentation(client: TestClient, objects: Path) -> None:
    # step 1: create the template
    created = post(client, "rules", example(TEMPLATE_FILE))
    assert created.status_code == 201
    assert created.json()["findings"] == []
    template_id = created.json()["id"]

    # step 2: create the strategy
    strategy = post(client, "strategies", load_case("str-03"))
    assert strategy.status_code == 201
    assert strategy.json()["findings"] == []
    strategy_id = strategy.json()["id"]

    # steps 3 and 4: take the document and insert the instance after the entry "risiko"
    document = client.get(f"/api/v1/strategies/{strategy_id}").json()
    position = [item["key"] for item in document["rules"]].index("risiko")
    document["rules"].insert(position + 1, instance_of_the_documentation(template_id))

    # step 5: save it
    saved = put(client, "strategies", strategy_id, document)
    assert saved.status_code == 200
    assert saved.json()["findings"] == []

    # step 6: the strategy uses the template
    usages = client.get(f"/api/v1/rules/{template_id}/usages")
    assert usages.status_code == 200
    assert usages.json() == {
        "usages": [{"art": "strategies", "id": strategy_id, "name": "EMA-Trendfolge"}],
        "skipped_unreadable": 0,
    }

    # step 7: keep the strategy
    before = client.get(f"/api/v1/strategies/{strategy_id}").text

    # step 8: change the template
    changed = example(CHANGED_TEMPLATE_FILE)
    assert changed["id"] != template_id
    changed["id"] = template_id
    replaced = put(client, "rules", template_id, changed)
    assert replaced.status_code == 200
    assert replaced.json()["document"]["name"] == "Mindestvolumen doppelt"
    assert replaced.json()["findings"] == []
    assert client.get(f"/api/v1/strategies/{strategy_id}").text == before

    # step 9: delete the template
    assert client.delete(f"/api/v1/rules/{template_id}").status_code == 204
    assert client.get(f"/api/v1/rules/{template_id}").status_code == 404

    # step 10: the strategy is unchanged and keeps the instance
    after = client.get(f"/api/v1/strategies/{strategy_id}")
    assert after.text == before
    keys = [item["key"] for item in after.json()["rules"]]
    assert keys == ["risiko", "mindest"]
    assert after.json()["rules"][1]["origin"]["template_id"] == template_id
    assert sorted(item.name for item in objects.iterdir()) == [f"{strategy_id}.strategy.json"]


def test_the_changed_template_differs_in_name_description_and_expression_only() -> None:
    first = example(TEMPLATE_FILE)
    second = copy.deepcopy(example(CHANGED_TEMPLATE_FILE))
    differing = {key for key in first if first[key] != second[key]}
    assert differing == {"name", "description", "expression"}
    assert first["object_type"] == "Regel"


# --- expressions, keys and the saved strategy -----------------------------------------------------


def test_the_example_of_the_expressions_endpoint_is_what_the_documentation_says(
    client: TestClient,
) -> None:
    section = documentation_section("#### Ausdrücke und Kennungen", "#### Gesicherte Strategie")
    for text in (
        "/elements/4/parameters/ausdruck/value",
        "ema20.wert > ema50.wert",
        "[EMA 20].Wert > [EMA 50].Wert",
        "EMA 20 ist größer als EMA 50",
        "stop_abstand_2",
    ):
        assert text in section, text
    answer = post_json(
        client,
        "/api/v1/expressions",
        {
            "document": load_case("str-03"),
            "language": "de",
            "items": [
                {
                    "pointer": "/elements/4/parameters/ausdruck/value",
                    "stored": "ema20.wert > ema50.wert",
                }
            ],
        },
    ).json()["items"][0]
    assert answer["display"] == "[EMA 20].Wert > [EMA 50].Wert"
    assert answer["sentence"] == "EMA 20 ist größer als EMA 50"
    assert answer["blocks"]["kind"] == "comparison"
    assert [child["kind"] for child in answer["blocks"]["children"]] == ["name", "name"]
    assert answer["findings"] == []
    key = post_json(
        client,
        "/api/v1/keys",
        {"document": load_case("str-03"), "scope": "/parameters", "name": "Stop-Abstand"},
    )
    assert key.json() == {"key": "stop_abstand_2"}


def test_the_documentation_of_the_saved_strategy_names_what_the_test_environment_holds() -> None:
    section = documentation_section("#### Gesicherte Strategie")
    for text in (
        "7209de70-2fdc-49fc-a242-33251216ed22",
        "EMA-Trendfolge",
        "Stop abstand",
        "stop_abstand",
        "EMA20",
        "ema20",
    ):
        assert text in section, text
