"""Locations of the repository relative to the tests."""

from pathlib import Path

REPOSITORY = Path(__file__).resolve().parents[3]
CONTRACTS = REPOSITORY / "contracts" / "strategies"
SCHEMA_DIRECTORY = CONTRACTS / "v2"
TESTCASE_DIRECTORY = SCHEMA_DIRECTORY / "testcases"
EXAMPLE_DIRECTORY = SCHEMA_DIRECTORY / "examples"
TESTCASES = ("str-01", "str-03")
"""The test case documents in the format 2.0 (specification 6)."""
CHECKED_TESTCASES = ("str-01", "str-03")
"""The test cases whose content the tests check: no finding of the consistency check, expressions
that are recognized and normalized. Both test cases are in this tuple; ``str-01`` uses the
``ZigZag`` (specification 3.2, 6)."""
SCHEMA_DIRECTORY_V1 = CONTRACTS / "v1"
TESTCASE_DIRECTORY_V1 = SCHEMA_DIRECTORY_V1 / "testcases"
EXAMPLE_DIRECTORY_V1 = SCHEMA_DIRECTORY_V1 / "examples"
EMA_TRENDFOLGE = (
    REPOSITORY
    / "development"
    / "strategiedesign"
    / "wp02"
    / "acceptance"
    / "ema-trendfolge-auftraggeber.strategy.json"
)
TECHNICAL_DOCUMENT = REPOSITORY / "docs" / "technical" / "pipwerk-domain.md"
GLOSSARY = REPOSITORY / "docs" / "technical" / "glossar.md"
LIBRARY_SOURCE = Path(__file__).resolve().parents[1] / "src" / "pipwerk_domain"
