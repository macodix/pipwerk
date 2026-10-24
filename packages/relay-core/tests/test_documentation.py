"""The technical documentation names what the library does: reasons, errors, interfaces."""

import pytest

import pipwerk_relaycore
from pipwerk_relaycore import RejectionReason, WaySettings
from pipwerk_relaycore.ways.files import FilesSettings
from tests.helpers import CONTRACT_DIRECTORY, REPOSITORY, TECHNICAL_DOCUMENT

DOCUMENT = TECHNICAL_DOCUMENT.read_text(encoding="utf-8")
GLOSSARY = (REPOSITORY / "docs" / "technical" / "glossar.md").read_text(encoding="utf-8")
CONTRACT_README = (CONTRACT_DIRECTORY.parent / "README.md").read_text(encoding="utf-8")


@pytest.mark.parametrize("reason", list(RejectionReason))
def test_every_reason_of_a_rejection_is_described(reason: RejectionReason) -> None:
    assert f"`{reason.value}`" in DOCUMENT


@pytest.mark.parametrize(
    "name",
    [
        name
        for name in pipwerk_relaycore.__all__
        if name.endswith("Error") or name.endswith("Rejected")
    ],
)
def test_every_error_is_described(name: str) -> None:
    assert f"`{name}`" in DOCUMENT


@pytest.mark.parametrize(
    "name",
    [
        "Address.parse",
        "Message.from_json",
        "Attachment.of",
        "Envelope.create",
        "Envelope.from_json",
        "envelope.open",
        "unverified_body",
        "verify_attachments",
        "SecretsDirectory",
        "new_key",
        "load_key",
        "check()",
        "ConnectionKey",
        "send",
        "read",
        "acknowledge",
        "load_way",
        "available_ways",
        "ReceivedEnvelope",
        "FaultyEnvelope",
        "WAY_API_VERSION",
        "pipwerk_relay.ways",
        "pipwerk-relaycore-schemas",
        "scripts/check",
        "FilesWay",
    ],
)
def test_the_interface_is_described(name: str) -> None:
    assert name in DOCUMENT


def test_the_settings_of_the_ways_are_described() -> None:
    for model in (WaySettings, FilesSettings):
        for field in model.model_fields:
            assert f"`{field}`" in DOCUMENT


def test_the_annotations_and_limits_of_renaming_are_documented() -> None:
    assert "## 9. Annahmen und Grenzen des Umbenennens auf einem Netzlaufwerk" in DOCUMENT
    for word in ("SMB", "fsync", "Zwischenspeicher", "Schonfrist", "Sperren"):
        assert word in DOCUMENT


def test_the_windows_rights_are_documented() -> None:
    assert "Rechte unter Windows" in DOCUMENT
    assert "Rechte unter Linux" in DOCUMENT


def test_the_test_vector_of_the_check_value_is_documented_in_both_places() -> None:
    vector = "e0e7f9f8af085df155f63c5ae69761d8dee65e349c2d9cf044ff44e107ee90a2"
    assert vector in DOCUMENT
    assert vector in CONTRACT_README


@pytest.mark.parametrize("term", ["Anlage", "Umschlag", "Eingang (Nachrichtensystem)"])
def test_the_new_terms_are_in_the_glossary(term: str) -> None:
    assert f"| {term} |" in GLOSSARY


def test_the_key_of_the_connection_is_in_the_glossary() -> None:
    assert "| Schlüssel der Verbindung |" in GLOSSARY
