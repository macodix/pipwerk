"""The technical documentation agrees with the code (order 01 acceptance criterion 6)."""

import re
import tomllib
from collections.abc import Iterator

import pytest

from pipwerk_domain import limits
from pipwerk_domain.consistency import findings as findings_module
from pipwerk_domain.defaults import create_registry
from pipwerk_domain.expressions import IssueKind, list_functions
from pipwerk_domain.typedesc import BindingKind, DataType, ElementKind, ObjectCategory
from tests.paths import (
    GLOSSARY,
    LIBRARY_SOURCE,
    REPOSITORY,
    TECHNICAL_DOCUMENT,
)

TEXT = TECHNICAL_DOCUMENT.read_text(encoding="utf-8")
TICKS = set(re.findall(r"`([^`\n]+)`", TEXT))
REGISTRY = create_registry(entry_points=False)


def section(number: str, following: str) -> str:
    start = TEXT.index(f"\n## {number}. ")
    end = TEXT.index(f"\n## {following}. ")
    return TEXT[start:end]


def first_cells(block: str) -> Iterator[str]:
    for line in block.splitlines():
        match = re.match(r"\| `([^`]+)` \|", line)
        if match:
            yield match.group(1)


def test_every_identifier_of_the_delivered_types_is_listed() -> None:
    missing: list[str] = []
    for description in REGISTRY.list():
        names = {description.id}
        names.update(item.id for item in description.parameters)
        names.update(item.id for item in description.properties)
        names.update(item.id for item in description.outputs)
        for parameter in description.parameters:
            names.update(choice.id for choice in parameter.choices)
        for prop in description.properties:
            names.update(choice.id for choice in prop.choices)
        missing.extend(f"{description.id}: {name}" for name in sorted(names - TICKS))
    assert missing == []


def test_the_documentation_names_no_type_that_does_not_exist() -> None:
    known = {item.id for item in REGISTRY.list()}
    named = {
        cell
        for cell in first_cells(section("4", "5"))
        if re.match(r"^((trigger|flow|trend_method)\.[a-z_]+|[A-Z][A-Za-z]+)$", cell)
    }
    assert named
    assert named <= known


def test_the_finding_identifiers_of_the_documentation_are_those_of_the_code() -> None:
    codes = {
        value
        for name, value in vars(findings_module).items()
        if name.isupper() and isinstance(value, str) and re.match(r"^[a-z_]+\.[a-z_]+$", value)
    }
    assert len(codes) == 37
    documented = set(first_cells(section("9", "10")))
    assert documented == codes


def test_the_table_of_the_specification_is_complete() -> None:
    table = set(first_cells(section("9", "10").split("### 9.2")[0]))
    assert table == {
        "trigger.unconnected",
        "flow.not_reached",
        "flow.main_without_trigger",
        "instrument.invalid",
        "expression.invalid",
        "expression.empty",
        "data.unknown",
        "data.type_mismatch",
        "input.unused",
        "rule.result_mismatch",
        "flow.unending_loop",
        "parameter.missing",
        "order.property_missing",
        "ruleset.reference_order",
        "expression.order_outside_management",
        "rule.order_in_indicator",
        "candle.no_instance",
        "flow.management_only",
        "name.duplicate",
        "type.unknown",
        "flow.no_order_reachable",
        "input.refresh_not_allowed",
        "instance.not_usable",
        "trigger.manual_in_management",
        "instance.unconnected",
    }


def test_every_function_is_listed() -> None:
    cells = " ".join(first_cells(section("7", "8")))
    for signature in list_functions():
        assert f"`{signature.name}`" in section("7", "8"), signature.name
    assert cells


def test_the_kinds_of_findings_in_expressions_are_listed() -> None:
    block = section("7", "8")
    for kind in IssueKind:
        assert f"`{kind.value}`" in block
    for reason in (
        "unexpected_end",
        "unexpected_token",
        "invalid_character",
        "invalid_number",
        "unterminated_string",
        "too_long",
        "too_deep",
        "operand",
        "comparison",
        "ordering",
        "argument",
        "branches",
        "result",
        "object_not_value",
    ):
        assert f"`{reason}`" in block, reason


def test_the_fields_of_the_type_description_are_listed() -> None:
    import dataclasses

    from pipwerk_domain.typedesc import (
        ArgumentDescription,
        Group,
        MethodDescription,
        TypeDescription,
    )

    block = section("3", "4")
    for field in dataclasses.fields(TypeDescription):
        assert f"`{field.name}`" in block, field.name
    for field in dataclasses.fields(MethodDescription):
        assert f"`{field.name}`" in block, field.name
    for field in dataclasses.fields(ArgumentDescription):
        assert f"`{field.name}`" in block, field.name
    for group in Group:
        assert f"`{group.value}`" in block, group


def test_the_fields_of_an_input_and_of_an_instance_are_listed() -> None:
    block = section("10", "11")
    for name in ("kind", "arguments", "refresh", "first_use"):
        assert f"`{name}`" in block, name
    assert "`trigger.manual_start`" in block  # the former identifier, read as `trigger.manual`


def test_the_issues_of_methods_and_the_visible_names_are_documented() -> None:
    block = section("7", "8")
    for needle in ("MethodCall", "call_missing", "method_argument", "not_a_method", "MethodInfo"):
        assert needle in block, needle


def test_enumerations_are_listed() -> None:
    for enum in (DataType, BindingKind, ElementKind, ObjectCategory):
        for member in enum:
            assert f"`{member.value}`" in TEXT, member


def test_every_limit_is_listed_with_its_value() -> None:
    block = section("11", "12")
    rows = {
        "MAX_DOCUMENT_BYTES": "2 MiB",
        "MAX_EXPRESSION_LENGTH": str(limits.MAX_EXPRESSION_LENGTH),
        "MAX_EXPRESSION_NESTING": str(limits.MAX_EXPRESSION_NESTING),
        "MAX_ELEMENTS": str(limits.MAX_ELEMENTS),
        "MAX_CONNECTIONS": str(limits.MAX_CONNECTIONS),
        "MAX_RULES_PER_LIST": str(limits.MAX_RULES_PER_LIST),
        "MAX_STRATEGY_PARAMETERS": str(limits.MAX_STRATEGY_PARAMETERS),
        "MAX_INSTANCE_NESTING": str(limits.MAX_INSTANCE_NESTING),
        "MAX_BLOCK_DEPTH": str(limits.MAX_BLOCK_DEPTH),
        "MAX_NAME_LENGTH": str(limits.MAX_NAME_LENGTH),
        "MAX_KEY_LENGTH": str(limits.MAX_KEY_LENGTH),
        "MAX_INPUTS_PER_ELEMENT": str(limits.MAX_INPUTS_PER_ELEMENT),
        "MAX_INPUT_ARGUMENTS": str(limits.MAX_INPUT_ARGUMENTS),
        "MAX_ITEMS_PER_REQUEST": str(limits.MAX_ITEMS_PER_REQUEST),
        "MAX_NAMES_PER_ITEM": str(limits.MAX_NAMES_PER_ITEM),
        "MAX_PROPERTIES_PER_NAME": str(limits.MAX_PROPERTIES_PER_NAME),
        "MAX_FINDINGS_PER_EXPRESSION": str(limits.MAX_FINDINGS_PER_EXPRESSION),
        "MAX_FINDINGS_PER_CHECK": str(limits.MAX_FINDINGS_PER_CHECK),
        "MAX_NAMES_PER_CHECK": str(limits.MAX_NAMES_PER_CHECK),
        "MAX_USAGE_ENTRIES": str(limits.MAX_USAGE_ENTRIES),
    }
    constants = {name for name in vars(limits) if name.startswith("MAX_")}
    assert constants == set(rows)
    for name, value in rows.items():
        line = next(line for line in block.splitlines() if line.startswith(f"| `{name}` |"))
        assert f"| {value} |" in line, name


def test_the_modules_and_tests_are_listed() -> None:
    for path in LIBRARY_SOURCE.rglob("*.py"):
        if path.name != "__init__.py":
            assert f"`{path.name}`" in TEXT, path.name
    for directory in ("expressions/", "consistency/", "documents/"):
        assert directory in TEXT
    for path in (LIBRARY_SOURCE.parent.parent / "tests").glob("test_*.py"):
        assert f"`{path.name}`" in TEXT, path.name


def test_the_fixed_identifier_of_the_rule_template_is_in_the_documentation() -> None:
    from pipwerk_domain.risk_rule import RISK_PER_TRADE_RULE_ID

    assert RISK_PER_TRADE_RULE_ID in TEXT


def test_the_commands_of_the_checks_are_in_the_documentation() -> None:
    for command in (
        "uv sync --frozen",
        "uv run --frozen pytest",
        "uv run --frozen ruff check",
        "uv run --frozen ruff format --check",
        "uv run --frozen mypy",
        "python -m pipwerk_domain.documents.schemas",
    ):
        assert command in TEXT, command


def test_every_package_of_the_lock_file_is_named_in_the_dependencies() -> None:
    lock = tomllib.loads((LIBRARY_SOURCE.parents[1] / "uv.lock").read_text(encoding="utf-8"))
    dependencies = section("13", "14")
    for package in lock["package"]:
        name = package["name"]
        if name == "pipwerk-domain":
            continue
        assert f"`{name}`" in dependencies, name


def test_the_main_topics_are_described() -> None:
    for heading in (
        "## 3. Typbeschreibungen und Elementregister",
        "## 4. Mitgelieferte Typen und Kennungen",
        "## 5. Objektmodell",
        "## 6. Namensräume",
        "## 7. Ausdrücke",
        "## 8. Bedeutung bei der Ausführung",
        "## 9. Konsistenzprüfung",
        "## 10. Dokumente und Schemata",
        "## 11. Begrenzungen gegen Überlast",
        "## 12. Prüfungen",
        "## 13. Abhängigkeiten",
    ):
        assert heading in TEXT, heading
    meaning = section("8", "9")
    for needle in (
        "„nicht verfügbar“",
        "„leer“",
        "Wirkung bei der Ausführung",
        "Hinweis S24",
        "Hinweis S25",
        "Hinweis S21",
    ):
        assert needle in meaning, needle
    assert "pipwerk.element_types" in TEXT


@pytest.mark.parametrize(
    "term",
    [
        "nicht verfügbar",
        "leer",
        "Elementregister",
        "Instanz",
        "Herkunft",
        "Namensraum",
        "Konsistenzprüfung",
        "Befund",
        "Typbeschreibung",
        "Pydantic",
    ],
)
def test_the_glossary_has_the_terms_of_the_library(term: str) -> None:
    text = GLOSSARY.read_text(encoding="utf-8")
    assert re.search(rf"^\| {re.escape(term)} \|", text, re.MULTILINE), term


def test_the_glossary_corrections() -> None:
    text = GLOSSARY.read_text(encoding="utf-8")
    pydantic = next(line for line in text.splitlines() if line.startswith("| Pydantic |"))
    assert "pipwerk_domain.documents" in pydantic
    assert "wird sie nicht verwendet" not in pydantic
    description = next(line for line in text.splitlines() if line.startswith("| Typbeschreibung |"))
    for field in (
        "Kennung",
        "Art",
        "Beschriftung",
        "Parameter",
        "Eigenschaften",
        "Ausgänge",
        "Regeln zulässig",
        "auf Zeichenfläche",
    ):
        assert field in description, field


def test_the_readmes_point_to_the_documentation() -> None:
    for path in (
        LIBRARY_SOURCE.parents[1] / "README.md",
        REPOSITORY / "contracts" / "strategies" / "README.md",
        REPOSITORY / "docs" / "technical" / "README.md",
    ):
        assert "pipwerk-domain.md" in path.read_text(encoding="utf-8"), path.name


def test_the_readmes_of_the_library_and_the_contracts_have_no_commands_and_no_rules() -> None:
    """A README gives the purpose and points to the document (development procedure)."""
    for path in (
        LIBRARY_SOURCE.parents[1] / "README.md",
        REPOSITORY / "contracts" / "strategies" / "README.md",
    ):
        text = path.read_text(encoding="utf-8")
        assert "```" not in text, path.name
        assert "uv " not in text, path.name
        assert "must not" not in text, path.name
        assert len(text.splitlines()) <= 8, path.name


def test_the_glossary_names_the_kind_of_the_calculation_methods() -> None:
    text = GLOSSARY.read_text(encoding="utf-8")
    description = next(line for line in text.splitlines() if line.startswith("| Typbeschreibung |"))
    assert "Berechnungsverfahren des Trends" in description
