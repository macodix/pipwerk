"""The description of the HTTP interface under ``contracts/api/pipwerk-fetch/v1/``.

The description (OpenAPI) is generated from the application. The application is created with
the replica of MetaTrader 5 (``fake_source.py``) and a test key, so the command needs no
startup configuration and no MetaTrader 5 and writes nothing else. The command writes the file
or, with ``--check``, compares it::

    python -m pipwerk_fetch_mt5.contract [--check] <file>

The same command writes (or checks) the examples of requests and answers next to the file::

    python -m pipwerk_fetch_mt5.contract [--check] <file> --examples <directory>

The examples are what the replica answers for fixed requests; a test compares them with the
answers of the application over HTTP.

The program has no ``/openapi.json`` of its own (it answers nothing without the key); this
file is where the interface is described.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from pipwerk_fetch_mt5.config import StartupConfig
from pipwerk_fetch_mt5.errors import error_body
from pipwerk_fetch_mt5.fake_source import FakeGateway, create_fake_source_app
from pipwerk_fetch_mt5.models import CandlesRequest, InstrumentRequest, TicksRequest
from pipwerk_fetch_mt5.service import FetchService

CONTRACT_VERSION = "1.0.0"

#: The moment of ``acquired_at`` in the example of the details of an instrument.
EXAMPLE_CLOCK = datetime(2026, 1, 5, 8, 0, tzinfo=UTC)

#: The requests of the examples (a Monday, so the replica has data).
EXAMPLE_REQUESTS: dict[str, dict[str, str]] = {
    "request-candles.json": {
        "kind": "candles",
        "instrument": "EURUSD",
        "time_unit": "m5",
        "start": "2026-01-05T08:00:00Z",
        "end": "2026-01-05T08:30:00Z",
    },
    "request-ticks.json": {
        "kind": "ticks",
        "instrument": "EURUSD",
        "start": "2026-01-05T08:00:00Z",
        "end": "2026-01-05T08:00:10Z",
    },
    "request-instrument.json": {"kind": "instrument", "instrument": "EURUSD"},
}


def public_description(description: dict[str, Any]) -> dict[str, Any]:
    """The generated description with the information about the shared key added."""
    result = dict(description)
    components = dict(result.get("components", {}))
    components["securitySchemes"] = {
        "sharedKey": {
            "type": "http",
            "scheme": "bearer",
            "description": (
                "The shared key of the source, given as `Authorization: Bearer <key>`. "
                "It stands in the startup configuration of the source and of the program "
                "that calls it."
            ),
        }
    }
    result["components"] = components
    result["security"] = [{"sharedKey": []}]
    result["info"] = {**result["info"], "version": CONTRACT_VERSION}
    return result


def _text(content: object) -> str:
    return json.dumps(content, indent=2, ensure_ascii=False) + "\n"


def generate() -> str:
    """The text of the description file generated from the application."""
    app = create_fake_source_app()
    return _text(public_description(app.openapi()))


def examples() -> dict[str, str]:
    """The texts of the example files: file name -> content."""
    service = FetchService(
        FakeGateway(),
        StartupConfig(server_time_zone="UTC", shared_key="unused-example-key-0000"),
        clock=lambda: EXAMPLE_CLOCK,
    )
    candles = CandlesRequest.model_validate(EXAMPLE_REQUESTS["request-candles.json"])
    ticks = TicksRequest.model_validate(EXAMPLE_REQUESTS["request-ticks.json"])
    info = InstrumentRequest.model_validate(EXAMPLE_REQUESTS["request-instrument.json"])
    files: dict[str, object] = dict(EXAMPLE_REQUESTS)
    files["response-candles.json"] = service.candles(
        candles.instrument, candles.time_unit, candles.start, candles.end
    ).model_dump(mode="json", by_alias=True)
    files["response-ticks.json"] = service.ticks(
        ticks.instrument, ticks.start, ticks.end
    ).model_dump(mode="json", by_alias=True)
    files["response-instrument.json"] = service.instrument_details(info.instrument).model_dump(
        mode="json", by_alias=True
    )
    files["error-symbol-unknown.json"] = error_body("symbol_unknown")
    files["error-unauthorized.json"] = error_body("unauthorized")
    return {name: _text(content) for name, content in files.items()}


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m pipwerk_fetch_mt5.contract",
        description="Write the description of the interface generated from the application.",
    )
    parser.add_argument("--check", action="store_true", help="only compare, write nothing")
    parser.add_argument("file", type=Path, help="the description file")
    parser.add_argument(
        "--examples", type=Path, default=None, help="directory of the example files"
    )
    arguments = parser.parse_args(argv)
    targets: dict[Path, str] = {arguments.file: generate()}
    if arguments.examples is not None:
        targets.update({arguments.examples / name: text for name, text in examples().items()})
    different = False
    for file, text in targets.items():
        if arguments.check:
            current = file.read_text(encoding="utf-8") if file.is_file() else None
            if current != text:
                print(f"{file.name} differs from the application", file=sys.stderr)
                different = True
        else:
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text(text, encoding="utf-8")
    return 1 if different else 0


if __name__ == "__main__":
    sys.exit(main())
