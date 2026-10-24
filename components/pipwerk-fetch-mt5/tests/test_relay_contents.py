"""The contents of the messages of the retrieval and their schemas (order 5, specification relay 5
and 6.2).

The schemas under ``contracts/messages/v1/`` are generated from the models; the examples are
judged by schema and model alike; the names, units and reasons of the models are those of the
program on the command line.
"""

import json
from pathlib import Path
from typing import Any, get_args

import pytest
from jsonschema import Draft202012Validator
from pydantic import ValidationError

from pipwerk_fetch_mt5.errors import REASONS
from pipwerk_fetch_mt5.gateway import TIME_UNIT_MINUTES
from pipwerk_fetch_mt5.models import OmittedReason
from pipwerk_fetch_mt5.relay.contents import (
    CONTENT_MODELS,
    DataName,
    FetchRequestContent,
    FetchResultContent,
    PartErrorCode,
    RequestError,
    RequestErrorCode,
    TimeUnitName,
    dump_content,
    load_content,
)
from pipwerk_fetch_mt5.relay.schemas import (
    differing_schemas,
    generate_schema,
    main,
    schema_file_name,
    write_schemas,
)

CONTRACTS = Path(__file__).resolve().parents[3] / "contracts" / "messages" / "v1"
EXAMPLES = CONTRACTS / "examples"

EXAMPLE_NAMES = {
    "fetch.request": "fetch-request",
    "fetch.file": "fetch-file",
    "fetch.result": "fetch-result",
}

REQUEST: dict[str, Any] = {
    "broker": "Broker-Live-1",
    "symbol": "EURUSD",
    "time_units": ["H1"],
    "ticks": False,
    "from": "2026-01-05T00:00:00Z",
    "to": "2026-01-06T00:00:00Z",
}
FILE: dict[str, Any] = {"name": "EURUSD_H1_20260105_20260106.json", "data": "H1"}


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def validator(kind: str) -> Draft202012Validator:
    schema = load(CONTRACTS / schema_file_name(kind))
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


def model_accepts(kind: str, content: Any) -> bool:
    try:
        load_content(CONTENT_MODELS[kind], content)
    except ValidationError:
        return False
    return True


# --- the names are those of the program --------------------------------------------------------


def test_the_time_units_are_the_21_units_of_metatrader_in_upper_case() -> None:
    units = {unit.upper() for unit in TIME_UNIT_MINUTES}
    assert set(get_args(TimeUnitName)) == units
    assert len(units) == 21
    assert set(get_args(DataName)) == units | {"TICKS", "CONTRACT"}


def test_the_reasons_are_those_of_the_program_and_their_texts_fit_the_message() -> None:
    assert set(get_args(PartErrorCode)) | set(get_args(RequestErrorCode)) <= set(REASONS)
    assert {"request_invalid", "broker_mismatch"} <= set(get_args(RequestErrorCode))
    assert not {"request_invalid", "broker_mismatch"} & set(get_args(PartErrorCode))
    assert all(1 <= len(text) <= 200 for text in REASONS.values())
    for code in get_args(RequestErrorCode):
        assert RequestError.of(code).text == REASONS[code]


def test_the_omitted_reasons_are_those_of_the_models_of_the_files() -> None:
    schema = generate_schema("fetch.file")
    names = schema["properties"]["omitted"]["propertyNames"]["enum"]
    assert set(names) == set(get_args(OmittedReason))


# --- schemas and examples ----------------------------------------------------------------------


def test_the_schema_files_are_exactly_what_the_models_generate() -> None:
    assert differing_schemas(CONTRACTS) == []


def test_the_schema_files_are_valid_json_schemas_of_the_kinds() -> None:
    for kind in CONTENT_MODELS:
        schema = load(CONTRACTS / schema_file_name(kind))
        Draft202012Validator.check_schema(schema)
        assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
        assert schema["additionalProperties"] is False


def test_the_schemas_can_be_written_and_checked(tmp_path: Path) -> None:
    written = write_schemas(tmp_path / "out")
    assert sorted(path.name for path in written) == [
        "fetch.file.schema.json",
        "fetch.request.schema.json",
        "fetch.result.schema.json",
    ]
    assert differing_schemas(tmp_path / "out") == []
    written[0].write_text("{}\n", encoding="utf-8")
    assert differing_schemas(tmp_path / "out") == ["fetch.request"]
    assert main(["--check", str(tmp_path / "out")]) == 1
    assert main([str(tmp_path / "out")]) == 0
    assert main(["--check", str(tmp_path / "out")]) == 0


@pytest.mark.parametrize("kind", sorted(EXAMPLE_NAMES))
def test_the_valid_example_is_valid_for_schema_and_model(kind: str) -> None:
    content = load(EXAMPLES / f"content-{EXAMPLE_NAMES[kind]}.json")
    assert list(validator(kind).iter_errors(content)) == []
    parsed = load_content(CONTENT_MODELS[kind], content)
    assert dump_content(parsed) == content  # the model writes back what it read


def test_the_refused_result_is_valid_for_schema_and_model() -> None:
    content = load(EXAMPLES / "content-fetch-result-refused.json")
    assert list(validator("fetch.result").iter_errors(content)) == []
    result = load_content(FetchResultContent, content)
    assert result.error is not None
    assert result.error.code == "broker_mismatch"


INVALID = sorted((EXAMPLES / "invalid").glob("content-fetch-*.json"))


def test_there_are_invalid_examples_for_every_kind() -> None:
    kinds = {kind for kind, name in EXAMPLE_NAMES.items() for p in INVALID if name in p.name}
    assert kinds == set(EXAMPLE_NAMES)


@pytest.mark.parametrize("path", INVALID, ids=lambda path: path.name)
def test_an_invalid_example_is_rejected_by_schema_and_model(path: Path) -> None:
    kind = next(kind for kind, name in EXAMPLE_NAMES.items() if f"content-{name}-" in path.name)
    content = load(path)
    assert list(validator(kind).iter_errors(content)) != []
    assert not model_accepts(kind, content)


# --- the rules of the models ---------------------------------------------------------------------


def test_a_request_is_read_and_gives_its_values() -> None:
    request = load_content(FetchRequestContent, {**REQUEST, "instrument": "EUR.USD"})
    assert request.designation == "EUR.USD"
    assert request.units == ("h1",)
    assert request.start_time.isoformat() == "2026-01-05T00:00:00+00:00"
    assert load_content(FetchRequestContent, REQUEST).designation == "EURUSD"


@pytest.mark.parametrize(
    "change",
    [
        {"time_units": ["H1", "H1"]},
        {"time_units": ["H1", "h1"]},
        {"time_units": [f"H{n}" for n in range(30)]},
        {"from": "2026-01-06T00:00:00Z"},  # not before "to"
        {"to": "2026-01-05T00:00:00Z"},
        {"from": "2026-01-05T00:00:00.5Z"},
        {"from": "2026-01-05 00:00:00Z"},
        {"from": "2026-13-05T00:00:00Z"},
        {"from": "1969-12-31T23:59:59Z"},
        {"to": "2101-01-01T00:00:00Z"},
        {"symbol": "A" * 65},
        {"symbol": "EUR\nUSD"},
        {"symbol": "EUR USD"},  # a designation needs an instrument
        {"instrument": "A" * 65},
        {"instrument": "EUR USD"},
        {"instrument": "_x"},
        {"broker": "B" * 129},
        {"broker": "Broker\n"},
        {"ticks": 1},
        {"ticks": None},
        {"instrument": 5},
    ],
)
def test_an_invalid_request_is_rejected(change: dict[str, Any]) -> None:
    assert not model_accepts("fetch.request", {**REQUEST, **change})


def test_a_symbol_with_a_blank_is_valid_with_an_instrument() -> None:
    assert model_accepts("fetch.request", {**REQUEST, "symbol": "EUR USD", "instrument": "EURUSD"})


def test_the_request_is_built_from_values_and_validated() -> None:
    from datetime import UTC, datetime

    content = FetchRequestContent.of(
        broker="B",
        symbol="S",
        instrument=None,
        time_units=["M1", "MN1"],
        ticks=True,
        start=datetime(2026, 1, 5, tzinfo=UTC),
        end=datetime(2026, 1, 6, 12, 30, 15, tzinfo=UTC),
    )
    assert dump_content(content) == {
        "broker": "B",
        "symbol": "S",
        "time_units": ["M1", "MN1"],
        "ticks": True,
        "from": "2026-01-05T00:00:00Z",
        "to": "2026-01-06T12:30:15Z",
    }
    with pytest.raises(ValidationError):
        FetchRequestContent.of(
            broker="B",
            symbol="a b",
            instrument=None,
            time_units=[],
            ticks=False,
            start=datetime(2026, 1, 5, tzinfo=UTC),
            end=datetime(2026, 1, 6, tzinfo=UTC),
        )


@pytest.mark.parametrize(
    "change",
    [
        {"name": "EURUSD_H1_20260105_20260106.txt"},
        {"name": "EURUSD_H1_20260105.json"},
        {"name": "a/EURUSD_H1_20260105_20260106.json"},
        {"name": "EURUSD_h1_20260105_20260106.json"},
        {"data": "TICKS"},  # the name says H1
        {"data": "H7"},
        {"rows": -1},
        {"rows": "3"},
        {"omitted": {"unknown": 1}},
        {"omitted": {"duplicate_time": 0}},
        {"omitted": {"duplicate_time": "1"}},
        {"extra": 1},
    ],
)
def test_an_invalid_file_content_is_rejected(change: dict[str, Any]) -> None:
    assert not model_accepts("fetch.file", {**FILE, **change})


@pytest.mark.parametrize(
    "content",
    [
        {**FILE},
        {**FILE, "rows": 0, "omitted": {"duplicate_time": 2, "invalid_price": 1}},
        {"name": "GER40.cash_CONTRACT_20260105T083000_20260106.json", "data": "CONTRACT"},
        {"name": "a_b_c_M30_20260105_20260106.json", "data": "M30"},
    ],
)
def test_a_valid_file_content_is_accepted(content: dict[str, Any]) -> None:
    assert model_accepts("fetch.file", content)


def test_a_result_with_an_error_has_no_files_and_no_failed_parts() -> None:
    error = {"code": "request_invalid", "text": "Die Anfrage ist ungültig"}
    assert model_accepts("fetch.result", {"files": [], "failed": [], "error": error})
    assert not model_accepts(
        "fetch.result", {"files": [FILE["name"]], "failed": [], "error": error}
    )
    part = {
        "data": "H1",
        "from": "2026-01-05T00:00:00Z",
        "to": "2026-01-06T00:00:00Z",
        "code": "no_data",
        "text": "x",
    }
    assert not model_accepts("fetch.result", {"files": [], "failed": [part], "error": error})
    assert model_accepts("fetch.result", {"files": [], "failed": [part]})
    assert not model_accepts("fetch.result", {"files": [], "failed": [{**part, "code": "x"}]})
    assert not model_accepts(
        "fetch.result", {"files": [], "failed": [{**part, "to": part["from"]}]}
    )
    assert not model_accepts("fetch.result", {"files": []})
    assert not model_accepts("fetch.result", {"failed": []})
    assert not model_accepts(
        "fetch.result", {"files": [], "failed": [], "error": {**error, "code": "no_data"}}
    )
