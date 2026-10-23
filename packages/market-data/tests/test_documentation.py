"""The technical documentation names what the library does: reasons, limits, tables, thresholds."""

import re

import pytest

from pipwerk_marketdata import BatchErrorCode, FileErrorCode, ImportLimits, RejectReason
from pipwerk_marketdata.limits import DEFAULT_MAX_PAGE_SIZE, MAX_INTEGER_VALUE
from pipwerk_marketdata.records import CompletenessRules
from pipwerk_marketdata.tables import metadata
from tests.helpers import LIBRARY_SOURCE, REPOSITORY, TECHNICAL_DOCUMENT

DOCUMENT = TECHNICAL_DOCUMENT.read_text(encoding="utf-8")


@pytest.mark.parametrize("reason", list(RejectReason))
def test_every_reason_for_a_rejected_row_is_described(reason: RejectReason) -> None:
    assert f"`{reason.value}`" in DOCUMENT


@pytest.mark.parametrize("code", list(FileErrorCode))
def test_every_reason_for_a_rejected_file_is_described(code: FileErrorCode) -> None:
    assert f"`{code.value}`" in DOCUMENT


@pytest.mark.parametrize("code", list(BatchErrorCode))
def test_every_reason_for_a_refused_process_is_described(code: BatchErrorCode) -> None:
    assert f"`{code.value}`" in DOCUMENT


def test_the_interface_of_the_process_and_the_list_is_described() -> None:
    for name in (
        "import_files",
        "list_series",
        "series_details",
        "brokers",
        "recognize_filename",
        "inspect_json",
        "ImportBatchError",
        "NameHints",
        "FileHints",
    ):
        assert f"`{name}" in DOCUMENT


def test_the_patterns_of_file_names_are_documented() -> None:
    assert "`EURUSD_H1_202301020000_202312292300.csv`" in DOCUMENT
    assert "`EURUSD,H1.csv`" in DOCUMENT
    assert "`<Instrument>_<Daten>_<von>_<bis>`" in DOCUMENT
    assert "`<Instrument>,<Daten>`" in DOCUMENT


def test_the_readme_names_the_new_interface() -> None:
    readme = (LIBRARY_SOURCE.parents[1] / "README.md").read_text(encoding="utf-8")
    for name in ("import_files", "list_series", "series_details", "brokers", "recognize_filename"):
        assert f"`{name}" in readme


@pytest.mark.parametrize("table", sorted(metadata.tables))
def test_every_table_is_described(table: str) -> None:
    assert f"`{table}`" in DOCUMENT


def test_default_limits_are_documented() -> None:
    limits = ImportLimits()
    assert f"{limits.max_bytes:,}".replace(",", " ") in DOCUMENT
    assert f"{limits.max_rows:,}".replace(",", " ") in DOCUMENT
    assert str(limits.max_reported_rejections) in DOCUMENT
    assert str(limits.max_files) in DOCUMENT
    assert f"{limits.max_batch_bytes:,}".replace(",", " ") in DOCUMENT
    assert f"{DEFAULT_MAX_PAGE_SIZE:,}".replace(",", " ") in DOCUMENT
    assert f"{MAX_INTEGER_VALUE:,}".replace(",", " ") in DOCUMENT


def test_default_thresholds_are_documented() -> None:
    rules = CompletenessRules()
    assert str(rules.weekend_start_minute) in DOCUMENT
    assert str(rules.weekend_end_minute) in DOCUMENT
    assert f"| {rules.tolerated_missing_candles} |" in DOCUMENT
    assert str(rules.tick_max_silence_seconds) in DOCUMENT


def test_every_module_is_listed() -> None:
    modules = {path.stem for path in LIBRARY_SOURCE.glob("*.py") if path.stem != "__init__"}
    listed = set(re.findall(r"`([a-z_]+)`", DOCUMENT))
    assert modules <= listed | {"migrate"}
    assert "`migrate`" in DOCUMENT


def test_documentation_is_linked() -> None:
    index = (REPOSITORY / "docs" / "technical" / "README.md").read_text(encoding="utf-8")
    assert "pipwerk-marketdata.md" in index
    contracts = (REPOSITORY / "contracts" / "market-data" / "README.md").read_text(encoding="utf-8")
    assert "pipwerk-marketdata.md" in contracts
    for name in ("candles", "ticks", "instrument"):
        assert f"{name}.schema.json" in contracts


def test_no_data_of_the_development_machine_in_the_documentation() -> None:
    assert "/srv/" not in DOCUMENT
    assert "claude" not in DOCUMENT.lower()
