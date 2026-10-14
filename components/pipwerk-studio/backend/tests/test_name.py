"""Tests for the spelling of the name "pipwerk Studio" in the outputs of the backend.

Every mention of the name in a text that the backend outputs must read exactly
"pipwerk Studio" or be the identifier ``pipwerk-studio``, and the whole word
"Studio" must directly follow "pipwerk ". Checked are the error message of the
start without startup configuration, the help text of the command line, the
detail text of the HTTP response for an invalid stored language, the log
entries and the description of the interface (``/openapi.json``).
"""

import argparse
import logging
import re
from collections.abc import Callable
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from pipwerk_studio import cli
from pipwerk_studio.app import create_app
from pipwerk_studio.storage import (
    SETTINGS_SINGLETON_ID,
    StudioSettingsRecord,
    create_studio_engine,
)

NAME = "pipwerk Studio"
IDENTIFIER = "pipwerk-studio"
FULL_HASH = "0123456789abcdef0123456789abcdef01234567"
DATE = "2026-10-09T14:52:03+02:00"

_NAME_LIKE = re.compile(r"pipwerk[ -]studio", re.IGNORECASE)
_WORD_STUDIO = re.compile(r"\bStudio\b")


def assert_spelled_correctly(text: str) -> None:
    """Fail unless every mention of the name in ``text`` is spelled as required."""
    for match in _NAME_LIKE.finditer(text):
        assert match.group() in (NAME, IDENTIFIER), f"wrong spelling {match.group()!r} in {text!r}"
    for match in _WORD_STUDIO.finditer(text):
        preceding = text[max(0, match.start() - len("pipwerk ")) : match.start()]
        assert preceding == "pipwerk ", f"'Studio' without 'pipwerk ' in {text!r}"


def collapse_whitespace(text: str) -> str:
    """Every run of spaces, tabs and line breaks becomes one space."""
    return re.sub(r"[ \t\r\n]+", " ", text)


def test_checker_accepts_and_rejects_spellings() -> None:
    assert_spelled_correctly(f"{NAME} starts as {IDENTIFIER}: the {NAME} backend")
    for wrong in (
        "Pipwerk Studio",
        "pipwerk studio",
        "Pipwerk-Studio",
        "PIPWERK STUDIO",
        "pipwerk-Studio",
        "the Studio",
        "Studio backend",
    ):
        with pytest.raises(AssertionError):
            assert_spelled_correctly(wrong)


@pytest.fixture
def isolated_environment(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """No real startup configuration of the machine may be found."""
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    monkeypatch.setattr("pipwerk_studio.config._POSIX_SYSTEM_DIR", tmp_path / "system")
    monkeypatch.chdir(tmp_path)


@pytest.fixture
def plain_output(monkeypatch: pytest.MonkeyPatch) -> None:
    """No coloured output of argparse, independent of the environment of the caller."""
    monkeypatch.setenv("PYTHON_COLORS", "0")
    monkeypatch.setenv("NO_COLOR", "1")
    monkeypatch.delenv("FORCE_COLOR", raising=False)


@pytest.mark.usefixtures("isolated_environment")
def test_error_message_of_start_without_configuration(
    capsys: pytest.CaptureFixture[str],
) -> None:
    exit_code = cli.main([])

    error_output = capsys.readouterr().err
    assert exit_code == 1
    assert NAME in error_output
    assert error_output.startswith(f"{IDENTIFIER}: ")
    assert_spelled_correctly(error_output)


@pytest.mark.usefixtures("plain_output")
@pytest.mark.parametrize("width", [40, 80, 200])
def test_help_text_of_the_command_line(
    width: int, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("COLUMNS", str(width))

    with pytest.raises(SystemExit) as exit_info:
        cli.main(["--help"])

    help_text = collapse_whitespace(capsys.readouterr().out)
    assert exit_info.value.code == 0
    assert help_text.startswith(f"usage: {IDENTIFIER} ")
    assert NAME in help_text
    assert_spelled_correctly(help_text)


def test_description_and_help_texts_contain_no_identifier_and_no_line_break() -> None:
    parser = cli.build_parser()

    assert parser.formatter_class is argparse.HelpFormatter
    assert parser.prog == IDENTIFIER
    assert parser.description is not None
    assert NAME in parser.description
    texts = [parser.description, parser.epilog or ""]
    for action in parser._actions:
        assert action.help is not None
        texts.append(action.help)
    assert any(NAME in text for text in texts[2:])
    for text in texts:
        assert IDENTIFIER not in text
        assert "\n" not in text
        assert_spelled_correctly(text)


def test_detail_text_of_the_http_response_for_an_invalid_stored_language(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'studio.db'}"
    engine = create_studio_engine(database_url)
    with Session(engine) as session:
        session.add(StudioSettingsRecord(id=SETTINGS_SINGLETON_ID, language="fr"))
        session.commit()
    engine.dispose()

    response = TestClient(create_app(database_url)).get("/api/studio/settings/language")

    detail = response.json()["detail"]
    assert response.status_code == 503
    assert NAME in detail
    assert_spelled_correctly(detail)


def _app_with_lookups(
    revision_lookup: Callable[[], str | None],
    date_lookup: Callable[[str], str | None],
) -> TestClient:
    return TestClient(
        create_app(
            "sqlite:///:memory:", revision_lookup=revision_lookup, commit_date_lookup=date_lookup
        )
    )


def _failing_lookup() -> str | None:
    raise RuntimeError("lookup failed")


@pytest.mark.parametrize(
    "lookup", [_failing_lookup, lambda: "not a hash"], ids=["error", "invalid"]
)
def test_log_entries_if_the_revision_is_not_determinable(
    lookup: Callable[[], str | None], caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.DEBUG):
        _app_with_lookups(lookup, lambda commit: DATE)

    messages = [record.getMessage() for record in caplog.records]
    assert any("revision is not determinable" in message for message in messages)
    for message in messages:
        assert NAME in message
        assert_spelled_correctly(message)


def test_log_entries_if_the_commit_date_is_not_determinable(
    caplog: pytest.LogCaptureFixture,
) -> None:
    with caplog.at_level(logging.DEBUG):
        _app_with_lookups(lambda: FULL_HASH, lambda commit: None)

    messages = [record.getMessage() for record in caplog.records]
    assert any("commit date is not determinable" in message for message in messages)
    for message in messages:
        assert NAME in message
        assert_spelled_correctly(message)


def test_log_entries_when_reading_an_invalid_stored_language(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    database_url = f"sqlite:///{tmp_path / 'studio.db'}"
    engine = create_studio_engine(database_url)
    with Session(engine) as session:
        session.add(StudioSettingsRecord(id=SETTINGS_SINGLETON_ID, language="fr"))
        session.commit()
    engine.dispose()
    client = TestClient(create_app(database_url))

    with caplog.at_level(logging.DEBUG):
        client.get("/api/studio/settings/language")

    messages = [record.getMessage() for record in caplog.records if record.levelno >= logging.ERROR]
    assert messages
    for message in messages:
        assert NAME in message
        assert_spelled_correctly(message)


def _collect(node: object, keys: tuple[str, ...]) -> list[str]:
    """All text values below ``node`` that are stored under one of ``keys``."""
    found: list[str] = []
    if isinstance(node, dict):
        for key, value in node.items():
            if key in keys and isinstance(value, str):
                found.append(value)
            found.extend(_collect(value, keys))
    elif isinstance(node, list):
        for item in node:
            found.extend(_collect(item, keys))
    return found


def test_interface_description() -> None:
    client = TestClient(create_app("sqlite:///:memory:"))

    description = client.get("/openapi.json").json()

    info = description["info"]
    assert info["title"] == NAME
    texts = [info["description"]] if "description" in info else []
    texts += _collect(description["paths"], ("summary", "description"))
    texts += _collect(description["components"]["schemas"], ("description",))
    assert len(texts) >= 6
    for text in texts:
        assert_spelled_correctly(text)
    assert any(NAME in text for text in texts)
