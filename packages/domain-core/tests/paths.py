"""Locations of the repository relative to the tests."""

from pathlib import Path

REPOSITORY = Path(__file__).resolve().parents[3]
SCHEMA_DIRECTORY = REPOSITORY / "contracts" / "strategies" / "v1"
TESTCASE_DIRECTORY = SCHEMA_DIRECTORY / "testcases"
TECHNICAL_DOCUMENT = REPOSITORY / "docs" / "technical" / "pipwerk-domain.md"
GLOSSARY = REPOSITORY / "docs" / "technical" / "glossar.md"
LIBRARY_SOURCE = Path(__file__).resolve().parents[1] / "src" / "pipwerk_domain"
