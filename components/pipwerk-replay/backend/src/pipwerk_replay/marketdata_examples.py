"""Examples of the requests and answers of the data stock for the description of the web API
(``contracts/api/pipwerk-replay/v1/openapi.json``).

Each example is a plain value. A test checks every answer against its model, so an example
cannot drift away from the code. The examples show what a user of the web API gets: a list of
series with a gap, the details of a row, an import of three files of which one is refused.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI

from pipwerk_replay.import_form import (
    FIELD_BROKER,
    FIELD_DATA,
    FIELD_FILE,
    FIELD_INSTRUMENT,
    FIELD_KEEP,
    FIELD_TIMEZONE,
)

ROW_M1 = {
    "broker": "ExampleBroker-Live",
    "instrument": "EURUSD",
    "data": "m1",
    "first": "2024-01-02T10:00:00Z",
    "last": "2024-01-02T16:00:00Z",
    "gap_count": 3,
}
ROW_TICKS = {
    "broker": "ExampleBroker-Live",
    "instrument": "EURUSD",
    "data": "ticks",
    "first": "2024-01-02T10:00:00Z",
    "last": "2024-01-02T10:00:42.500000Z",
    "gap_count": 0,
}
ROW_CONTRACT = {
    "broker": "ExampleBroker-Live",
    "instrument": "GBPUSD",
    "data": "contract",
    "first": None,
    "last": None,
    "gap_count": 0,
}

SERIES_PAGE = {
    "items": [ROW_M1, ROW_TICKS, ROW_CONTRACT],
    "total": 3,
    "offset": 0,
    "limit": 1000,
}

CONTRACT_DATA = {
    "broker": "ExampleBroker-Live",
    "instrument": "EURUSD",
    "acquired_at": "2024-01-02T09:30:00Z",
    "tick_size": 0.00001,
    "tick_value": 0.92,
    "tick_value_currency": "EUR",
    "point": 0.00001,
    "pip": 0.0001,
    "spread": 0.00008,
    "min_volume": 0.01,
    "volume_step": 0.01,
    "contract_size": 100000.0,
    "swap_long": -4.5,
    "swap_short": 1.2,
    "swap_triple_weekday": "wednesday",
    "margin_per_lot": 3650.0,
}

SERIES_DETAILS = {
    "row": ROW_M1,
    "gaps": [
        {"start": "2024-01-02T10:01:00Z", "end": "2024-01-02T12:00:00Z", "reason": "gap"},
        {"start": "2024-01-02T12:01:00Z", "end": "2024-01-02T14:00:00Z", "reason": "gap"},
        {"start": "2024-01-02T14:01:00Z", "end": "2024-01-02T16:00:00Z", "reason": "gap"},
    ],
    "contract": CONTRACT_DATA,
}
SERIES_DETAILS_WITHOUT_CONTRACT = {**SERIES_DETAILS, "gaps": [], "contract": None}

BROKERS = {"items": ["ExampleBroker-Live", "Other-Server 2"]}

IMPORT_PROCESS = {"id": "8b0b7a9e-5f0e-4c43-9a46-5d3f2e1c7a10", "idle_timeout_seconds": 300}

FILE_IMPORTED = {
    "name": "EURUSD_M1_202401021000_202401021004.json",
    "refused": False,
    "result": {
        "kind": "candles",
        "broker": "ExampleBroker-Live",
        "instrument": "EURUSD",
        "unit": "m1",
        "accepted": 4,
        "replaced": 0,
        "period_start": "2024-01-02T10:00:00Z",
        "period_end": "2024-01-02T10:04:00Z",
        "rejected": [{"row": 3, "reason": "high_below_open"}],
        "rejected_count": 1,
    },
    "error": None,
    "message": None,
    "kept": True,
}
FILE_REFUSED = {
    "name": "broken.json",
    "refused": True,
    "result": None,
    "error": "json_invalid",
    "message": "The file is not valid JSON.",
    "kept": False,
}

IMPORT_DIRECTORY_PAGE = {
    "items": [
        {"name": "2023", "kind": "directory", "size": None, "modified_at": "2024-01-03T08:15:00Z"},
        {
            "name": "EURUSD_M1_202401021000_202401021004.json",
            "kind": "file",
            "size": 1284,
            "modified_at": "2024-01-02T17:30:12.250000Z",
        },
    ],
    "total": 2,
    "offset": 0,
    "limit": 1000,
}
#: The same file, taken over from the import directory: never kept.
FILE_IMPORTED_FROM_DIRECTORY = {**FILE_IMPORTED, "kept": False}
FILE_TOO_LARGE = {
    "detail": "The file is larger than the limit of 32 MiB per file.",
    "code": "too_large",
    "max_bytes": 33554432,
}

IMPORT_END = {
    "id": "8b0b7a9e-5f0e-4c43-9a46-5d3f2e1c7a10",
    "state": "finished",
    "imported_count": 11,
    "refused_count": 1,
}
IMPORT_ABORT = {**IMPORT_END, "state": "aborted", "imported_count": 4, "refused_count": 0}

HINT_JSON = {
    "name": "candles.json",
    "format": "json",
    "broker": "ExampleBroker-Live",
    "instrument": "EURUSD",
    "data": "m1",
    "error": None,
}
HINT_CSV = {
    "name": "GBPUSD_H1_202301020000_202312292300.csv",
    "format": "csv",
    "broker": None,
    "instrument": "GBPUSD",
    "data": "h1",
    "error": None,
}
HINT_UNKNOWN = {
    "name": "notes.csv",
    "format": "csv",
    "broker": None,
    "instrument": None,
    "data": None,
    "error": None,
}

#: The form of the request of one file as the client sends it (the file is shown by its name).
IMPORT_FORM = {
    FIELD_BROKER: "ExampleBroker-Live",
    FIELD_TIMEZONE: "Europe/Athens",
    FIELD_FILE: "GBPUSD_H1_202301020000_202312292300.csv",
    FIELD_INSTRUMENT: "GBPUSD",
    FIELD_DATA: "h1",
    FIELD_KEEP: "true",
}
PREVIEW_FORM = {FIELD_FILE: "GBPUSD_H1_202301020000_202312292300.csv"}

_TEST_RUN_BROKER = {"broker": "ExampleBroker-Live", "chosen": True}
_NO_TEST_RUN_BROKER = {"broker": "Other-Server 2", "chosen": False}

DELETION_SERIES_PREVIEW = {
    "kind": "series",
    "deleted": False,
    "broker": "ExampleBroker-Live",
    "instrument": "EURUSD",
    "data": "m1",
    "start": None,
    "end": None,
    "candle_count": 360,
    "tick_count": 0,
    "series_count": 1,
    "instrument_count": 0,
    "broker_removed": False,
    "test_run_broker_reset": False,
    "test_run_broker": _TEST_RUN_BROKER,
}
DELETION_SERIES = {**DELETION_SERIES_PREVIEW, "deleted": True}
DELETION_PERIOD = {
    **DELETION_SERIES_PREVIEW,
    "kind": "period",
    "deleted": True,
    "start": "2024-01-02T11:00:00Z",
    "end": "2024-01-02T12:00:00Z",
    "candle_count": 60,
    "series_count": 0,
}
DELETION_CONTRACT = {
    **DELETION_SERIES_PREVIEW,
    "kind": "contract",
    "deleted": True,
    "data": None,
    "candle_count": 0,
    "series_count": 0,
    "instrument_count": 1,
}
DELETION_BROKER_PREVIEW = {
    **DELETION_SERIES_PREVIEW,
    "kind": "broker",
    "instrument": None,
    "data": None,
    "candle_count": 1440,
    "tick_count": 52000,
    "series_count": 4,
    "instrument_count": 2,
    "broker_removed": True,
    "test_run_broker_reset": True,
    "test_run_broker": _TEST_RUN_BROKER,  # the current one: the preview changes nothing
}
DELETION_BROKER = {
    **DELETION_BROKER_PREVIEW,
    "deleted": True,
    "test_run_broker": _NO_TEST_RUN_BROKER,  # none is chosen, the first broker applies
}

DELETION_REFUSED = {
    "detail": "The data cannot be deleted: the broker, the data or the period is unknown.",
    "code": "broker_unknown",
    "message": "The broker does not occur in the data store.",
}
DELETION_BLOCKED = {
    "detail": "Data cannot be deleted while an import process exists. End it first.",
    "reason": "import_running",
}


#: FastAPI leaves every ``None`` out of the description (``exclude_none``), also in an example.
#: A ``null`` in an example is therefore written as this text and put back by ``restore_nulls``.
NULL_MARKER = "<<null>>"


def _marked(value: Any) -> Any:
    """The value with every ``None`` replaced by ``NULL_MARKER``."""
    if value is None:
        return NULL_MARKER
    if isinstance(value, dict):
        return {key: _marked(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_marked(item) for item in value]
    return value


def restore_nulls(node: Any) -> None:
    """Put ``null`` in place of ``NULL_MARKER`` in the description (in place)."""
    if isinstance(node, dict):
        for key, item in node.items():
            if item == NULL_MARKER:
                node[key] = None
            else:
                restore_nulls(item)
    elif isinstance(node, list):
        for position, item in enumerate(node):
            if item == NULL_MARKER:
                node[position] = None
            else:
                restore_nulls(item)


def keep_nulls_in_examples(app: FastAPI) -> None:
    """Let the description of the application (``app.openapi()``) hold the ``null`` of the
    examples: the first call builds it, puts the nulls back and keeps the result."""
    original = app.openapi

    def openapi() -> dict[str, Any]:
        built = app.openapi_schema is not None
        schema = original()
        if not built:
            restore_nulls(schema)
        return schema

    app.openapi = openapi  # type: ignore[method-assign]


def json_examples(**examples: tuple[str, Any]) -> dict[str, Any]:
    """The ``content`` of a response or request body with the examples ``name=(summary, value)``
    (OpenAPI ``examples`` of the media type ``application/json``)."""
    return {
        "application/json": {
            "examples": {
                name: {"summary": summary, "value": _marked(value)}
                for name, (summary, value) in examples.items()
            }
        }
    }


def form_examples(**examples: tuple[str, Any]) -> dict[str, Any]:
    """The ``examples`` of the media type ``multipart/form-data`` of a request body."""
    return {
        "examples": {
            name: {"summary": summary, "value": value}
            for name, (summary, value) in examples.items()
        }
    }
