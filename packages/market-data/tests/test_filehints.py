"""Instrument and data from a file name, and hints from the content of a JSON file."""

import json

import pytest

from pipwerk_marketdata import (
    FileErrorCode,
    ImportLimits,
    NameHints,
    inspect_json,
    recognize_filename,
)
from pipwerk_marketdata.timeunits import TIME_UNITS
from tests.helpers import (
    EXAMPLE_DIRECTORY,
    candle_document,
    candle_entry,
    tick_document,
    to_bytes,
    utc,
)

NOTHING = NameHints(None, None)


@pytest.mark.parametrize(
    ("name", "instrument", "data"),
    [
        # names of pipwerk-fetch-mt5
        ("EURUSD_M1_20240101_20240131.json", "EURUSD", "m1"),
        ("EURUSD_H1_2024-01-01_2024-01-31.json", "EURUSD", "h1"),
        ("GBPUSD_TICKS_20240101T0000_20240102T0000.json", "GBPUSD", "ticks"),
        ("XAUUSD_CONTRACT_20240101_20240131.json", "XAUUSD", "contract"),
        ("US500.cash_D1_20230101_20231231.json", "US500.cash", "d1"),
        ("EUR_USD_MN1_2020_2024.json", "EUR_USD", "mn1"),
        # export of MetaTrader 5
        ("EURUSD_H1_202301020000_202312292300.csv", "EURUSD", "h1"),
        ("EURUSD_M15_202301020000_202312292300.CSV", "EURUSD", "m15"),
        ("EURUSD,H1.csv", "EURUSD", "h1"),
        ("EURUSD,M10.csv", "EURUSD", "m10"),
        ("EURUSD,Weekly.csv", None, None),
        ("EURUSD,W1.csv", "EURUSD", "w1"),
        ("EURUSD,Ticks.csv", "EURUSD", "ticks"),
        ("EURUSD_H4.csv", "EURUSD", "h4"),
        ("EURUSD H12.csv", "EURUSD", "h12"),
        ("US500.cash,H1.csv", "US500.cash", "h1"),
        ("EURUSD,H1", "EURUSD", "h1"),
        ("eurusd_h1_202301020000_202312292300.csv", "eurusd", "h1"),
    ],
)
def test_names_are_recognised(name: str, instrument: str | None, data: str | None) -> None:
    expected = NameHints(instrument, data) if instrument else NOTHING
    assert recognize_filename(name) == expected


def test_every_time_unit_is_recognised_in_both_patterns() -> None:
    for unit in TIME_UNITS:
        assert recognize_filename(f"EURUSD_{unit.upper()}_20240101_20240131.json") == NameHints(
            "EURUSD", unit
        )
        assert recognize_filename(f"EURUSD,{unit.upper()}.csv") == NameHints("EURUSD", unit)


@pytest.mark.parametrize(
    "name",
    [
        "",
        "data.csv",
        "EURUSD.csv",
        "EURUSD_H5_20240101_20240131.json",
        "EURUSD_H1_x_y.json",
        "EURUSD_H1_20240101.json_",
        ",H1.csv",
        " ,H1.csv",
        "_H1_20240101_20240131.json",
        "Bericht 2024.csv",
        "EURUSD,H1.csv\n",
        "EURUSD_H1_20240101_20240131.json\n.csv",
        "A" * 300 + ",H1.csv",
        "EURUSD\x00,H1.csv",
    ],
)
def test_other_names_give_nothing(name: str) -> None:
    assert recognize_filename(name) == NOTHING


def test_only_the_last_part_of_a_path_counts() -> None:
    assert recognize_filename("folder/sub\\EURUSD,H1.csv") == NameHints("EURUSD", "h1")
    assert recognize_filename("EURUSD,H1.csv/") == NOTHING
    assert recognize_filename("../../EURUSD,H1.csv") == NameHints("EURUSD", "h1")
    assert recognize_filename("EURUSD,H1/other.csv") == NOTHING


def test_a_name_is_never_read_as_a_path(tmp_path_factory: pytest.TempPathFactory) -> None:
    directory = tmp_path_factory.mktemp("names")
    recognize_filename(str(directory / "EURUSD,H1.csv"))
    assert list(directory.iterdir()) == []


def test_hints_from_candles() -> None:
    hints = inspect_json(to_bytes(candle_document([candle_entry(utc(2024, 1, 2))], time_unit="h4")))
    assert (hints.broker, hints.instrument, hints.data, hints.error) == (
        "TestBroker",
        "EURUSD",
        "h4",
        None,
    )


def test_hints_from_ticks_and_instrument_data() -> None:
    ticks = inspect_json(to_bytes(tick_document([])))
    assert (ticks.broker, ticks.instrument, ticks.data) == ("TestBroker", "EURUSD", "ticks")
    document = json.loads((EXAMPLE_DIRECTORY / "instrument.json").read_text())
    contract = inspect_json(to_bytes(document))
    assert (contract.broker, contract.instrument, contract.data) == (
        document["broker"],
        "EURUSD",
        "contract",
    )


def test_hints_do_not_check_the_entries() -> None:
    hints = inspect_json(to_bytes(candle_document([{"nonsense": True}, 5, None])))
    assert (hints.broker, hints.instrument, hints.data, hints.error) == (
        "TestBroker",
        "EURUSD",
        "m1",
        None,
    )


def test_unusable_values_are_left_out() -> None:
    document = candle_document([], broker=" padded ", instrument=7, time_unit="h5")
    hints = inspect_json(to_bytes(document))
    assert (hints.broker, hints.instrument, hints.data, hints.error) == (None, None, None, None)
    assert inspect_json(to_bytes({"kind": "other", "broker": "B"})).broker == "B"
    assert inspect_json(to_bytes({"kind": "other", "broker": "B"})).data is None
    assert inspect_json(to_bytes({})).broker is None


@pytest.mark.parametrize(
    ("data", "code"),
    [
        (b"{broken", FileErrorCode.JSON_INVALID),
        (b'{"kind": NaN}', FileErrorCode.JSON_INVALID),
        (b"[1, 2]", FileErrorCode.DOCUMENT_INVALID),
        (b"\xff\xfe\x00", FileErrorCode.NOT_DECODABLE),
        (b"[" * 100_000, FileErrorCode.JSON_INVALID),
    ],
)
def test_a_file_that_cannot_be_read_gives_the_error(data: bytes, code: FileErrorCode) -> None:
    hints = inspect_json(data)
    assert hints.error == code
    assert (hints.broker, hints.instrument, hints.data) == (None, None, None)


def test_hints_respect_the_size_limit() -> None:
    data = to_bytes(candle_document([]))
    assert inspect_json(data, ImportLimits(max_bytes=len(data))).error is None
    assert (
        inspect_json(data, ImportLimits(max_bytes=len(data) - 1)).error == FileErrorCode.TOO_LARGE
    )
