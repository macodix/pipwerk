"""The technical documentation names what the relay does: fields, values, commands, tables."""

from pathlib import Path

import pytest

from pipwerk_relay import errors
from pipwerk_relay.operating import (
    AddressBookEntry,
    ComponentConfig,
    InputConfig,
    Limits,
    Periods,
    RelayConfig,
)
from pipwerk_relay.startup import ALLOWED_OPTIONS
from pipwerk_relay.tables import metadata

REPOSITORY = Path(__file__).resolve().parents[3]
DOCUMENT = (REPOSITORY / "docs" / "technical" / "pipwerk-relay.md").read_text(encoding="utf-8")
GLOSSARY = (REPOSITORY / "docs" / "technical" / "glossar.md").read_text(encoding="utf-8")
CONTRACT_README = (REPOSITORY / "contracts" / "messages" / "README.md").read_text(encoding="utf-8")
README = (REPOSITORY / "components" / "pipwerk-relay" / "README.md").read_text(encoding="utf-8")
PART_B = DOCUMENT[DOCUMENT.index("# Teil B: Das Relay") :]


@pytest.mark.parametrize(
    "model", [RelayConfig, InputConfig, ComponentConfig, AddressBookEntry, Periods, Limits]
)
def test_every_field_of_the_operating_configuration_is_described(
    model: type[RelayConfig | InputConfig | ComponentConfig | AddressBookEntry | Periods | Limits],
) -> None:
    prefix = {Periods: "periods.", Limits: "limits."}.get(model, "")
    for field in model.model_fields:
        assert f"`{prefix}{field}`" in PART_B, field


@pytest.mark.parametrize("model", [Periods, Limits])
def test_every_default_of_periods_and_limits_is_documented_as_it_is(
    model: type[Periods | Limits],
) -> None:
    prefix = "periods" if model is Periods else "limits"
    for field, info in model.model_fields.items():
        row = next(line for line in PART_B.splitlines() if f"`{prefix}.{field}`" in line)
        assert f"| {info.default} " in row or f"| {int(info.default)} " in row, (field, row)


def test_the_defaults_named_in_words_are_the_defaults_in_the_code() -> None:
    periods = Periods()
    assert periods.delivery_deadline_seconds == 24 * 3600 and "24 Stunden" in PART_B
    assert periods.seen_for_seconds == 7 * 24 * 3600 and "7 Tage" in PART_B
    assert periods.attachment_grace_seconds == 5 * 60 and "5 Minuten" in PART_B
    assert periods.retry_max_seconds == 15 * 60 and "15 Minuten" in PART_B
    assert Limits().max_attachment_storage_bytes == 10 * 1024**3 and "10 GiB" in PART_B


@pytest.mark.parametrize(
    "command",
    ["migrate", "key new", "config load", "config show", "queue", "run"],
)
def test_every_command_is_described_in_the_document_and_the_readme(command: str) -> None:
    assert f"| `{command}" in PART_B
    assert command in README


def test_every_entry_of_the_startup_configuration_is_described() -> None:
    for section, entries in ALLOWED_OPTIONS.items():
        for entry in entries:
            row = f"| `[{section}]` | `{entry}`"
            assert row in PART_B


def test_every_table_and_every_module_is_described() -> None:
    for table in metadata.tables:
        assert f"`{table}`" in PART_B
    for module in (
        "cli",
        "startup",
        "operating",
        "configuration",
        "runtime",
        "relay",
        "store",
        "attachments",
        "service",
        "schemas",
        "errors",
    ):
        assert f"| `{module}`" in PART_B


def test_every_error_of_the_relay_is_described() -> None:
    for name in ("RelayError", "StartupConfigError", "ConfigRejected", "NotConfigured"):
        assert hasattr(errors, name)
        assert f"`{name}`" in PART_B
    for name in ("SchemaOutdated", "AttachmentLost"):
        assert hasattr(errors, name)
        assert f"`{name}`" in PART_B


def test_the_sections_of_part_b_are_there() -> None:
    for heading in (
        "## 18. Gegenstand und Aufbau des Relays",
        "## 19. Einrichtung des Relays",
        "## 20. Startkonfiguration",
        "## 21. Betriebskonfiguration",
        "## 22. Speicher",
        "## 23. Weg einer Nachricht im Relay",
        "## 24. Wiederanlauf nach hartem Beenden",
        "## 25. Begrenzungen gegen Überlast",
        "## 26. Schonfrist, Eingänge mit verzögerten Umschlägen und Aufräumen",
        "## 27. Befehle",
        "## 28. Sicherheit des Relays",
        "## 29. Abhängigkeiten des Relays",
        "## 30. Prüfskript des Relays und Tests",
    ):
        assert heading in DOCUMENT


def test_the_security_section_names_the_references() -> None:
    section = PART_B[PART_B.index("## 28.") : PART_B.index("## 29.")]
    for word in ("ASVS", "OWASP API", "BSI", "Regel 8.2", "Regel 8.3", "Windows"):
        assert word in section


def test_the_tests_are_listed() -> None:
    section = PART_B[PART_B.index("## 30.") : PART_B.index("## 31.")]
    for path in sorted((Path(__file__).parent).glob("test_*.py")):
        assert f"`{path.name}`" in section, path.name


def test_the_terms_are_in_the_glossary() -> None:
    assert "| Warteschlange |" in GLOSSARY
    assert "| Eingang (Nachrichtensystem) |" in GLOSSARY


def test_the_contracts_describe_the_operating_configuration() -> None:
    assert "relay-config.schema.json" in CONTRACT_README
    assert "pipwerk-relay-schemas" in CONTRACT_README
    for field in RelayConfig.model_fields:
        assert f"`{field}`" in CONTRACT_README
