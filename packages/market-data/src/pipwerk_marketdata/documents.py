"""The JSON file formats of the import, as Pydantic models, and their JSON schemas.

The files under ``contracts/market-data/v1/`` are generated from these models with::

    pipwerk-marketdata-schemas <directory>

``--check`` writes nothing and ends with exit code 1 if a file differs from the models.

All models refuse additional fields and do not convert values (a string is no number).
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

SCHEMA_DIALECT = "https://json-schema.org/draft/2020-12/schema"
VERSION = 1

TIME_PATTERN = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$"
NAME_PATTERN = r"^\S(?:[^\x00-\x1f\x7f]*\S)?$"
CLOCK_PATTERN = r"^([01]\d|2[0-3]):[0-5]\d$"
CLOCK_END_PATTERN = r"^(([01]\d|2[0-3]):[0-5]\d|24:00)$"

Time = Annotated[
    str,
    Field(
        pattern=TIME_PATTERN,
        description="Moment in UTC, ISO 8601 with Z, for example 2024-01-02T10:15:00Z; "
        "up to 6 fractional digits.",
    ),
]
Name = Annotated[str, Field(min_length=1, max_length=128, pattern=NAME_PATTERN)]
Price = Annotated[float, Field(gt=0, allow_inf_nan=False)]
PositiveNumber = Annotated[float, Field(gt=0, allow_inf_nan=False)]
Number = Annotated[float, Field(allow_inf_nan=False)]

TimeUnitName = Literal[
    "m1",
    "m2",
    "m3",
    "m4",
    "m5",
    "m6",
    "m10",
    "m12",
    "m15",
    "m20",
    "m30",
    "h1",
    "h2",
    "h3",
    "h4",
    "h6",
    "h8",
    "h12",
    "d1",
    "w1",
    "mn1",
]
WeekdayName = Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)


class PeriodDocument(_Strict):
    """Period the source was asked for and covers, even where it delivers no candle or tick."""

    start: Time
    end: Time = Field(description="End of the period, not included.")


class TradingSessionDocument(_Strict):
    """A weekly trading session in UTC. Sessions across midnight are split at midnight."""

    weekday: WeekdayName
    from_: Annotated[str, Field(pattern=CLOCK_PATTERN)] = Field(alias="from")
    to: Annotated[str, Field(pattern=CLOCK_END_PATTERN)] = Field(
        description="End of the session, 24:00 for the end of the day."
    )

    model_config = ConfigDict(
        extra="forbid", strict=True, allow_inf_nan=False, populate_by_name=False
    )


class CandleEntry(_Strict):
    """A candle with bid prices; ``time`` is the opening moment."""

    time: Time
    open: Price
    high: Price
    low: Price
    close: Price
    volume: Annotated[int, Field(ge=0)] | None = Field(default=None, description="Tick volume.")
    spread: Annotated[int, Field(ge=0)] | None = Field(
        default=None, description="Spread in points, if the source delivers it."
    )


class TickEntry(_Strict):
    """A tick."""

    time: Time = Field(description="Moment in UTC with milliseconds.")
    bid: Price
    ask: Price


class _CandleSeriesHeader(_Strict):
    version: Literal[1]
    kind: Literal["candles"]
    broker: Name
    instrument: Name
    time_unit: TimeUnitName
    period: PeriodDocument | None = None
    trading_hours: list[TradingSessionDocument] | None = Field(
        default=None, max_length=70, description="Replaces the trading hours of the series."
    )


class CandleSeriesDocument(_CandleSeriesHeader):
    """A series of candles of one broker, one instrument and one time unit."""

    candles: list[CandleEntry]


class CandleSeriesEnvelope(_CandleSeriesHeader):
    """Header of a series of candles; the entries are checked one by one by the import."""

    candles: list[object]


class _TickSeriesHeader(_Strict):
    version: Literal[1]
    kind: Literal["ticks"]
    broker: Name
    instrument: Name
    period: PeriodDocument | None = None
    trading_hours: list[TradingSessionDocument] | None = Field(
        default=None, max_length=70, description="Replaces the trading hours of the series."
    )


class TickSeriesDocument(_TickSeriesHeader):
    """A series of ticks of one broker and one instrument."""

    ticks: list[TickEntry]


class TickSeriesEnvelope(_TickSeriesHeader):
    """Header of a series of ticks; the entries are checked one by one by the import."""

    ticks: list[object]


class InstrumentDocument(_Strict):
    """Data of one instrument at one broker."""

    version: Literal[1]
    kind: Literal["instrument"]
    broker: Name
    instrument: Name
    acquired_at: Time = Field(description="Moment the data was obtained from the broker.")
    tick_size: PositiveNumber
    tick_value: PositiveNumber = Field(description="Value of one tick per lot.")
    tick_value_currency: Annotated[str, Field(pattern=r"^[A-Za-z0-9]{2,10}$")]
    point: PositiveNumber
    pip: PositiveNumber
    spread: Annotated[float, Field(ge=0, allow_inf_nan=False)] = Field(
        description="Usual spread as price difference."
    )
    min_volume: PositiveNumber
    volume_step: PositiveNumber
    contract_size: PositiveNumber
    swap_long: Number = Field(description="Swap per lot and day for long positions.")
    swap_short: Number = Field(description="Swap per lot and day for short positions.")
    swap_triple_weekday: WeekdayName = Field(description="Weekday with the triple swap.")
    margin_per_lot: Annotated[float, Field(ge=0, allow_inf_nan=False)] | None = Field(
        default=None, description="Margin requirement per lot, if the source delivers it."
    )


SCHEMA_MODELS: dict[str, type[BaseModel]] = {
    "candles": CandleSeriesDocument,
    "ticks": TickSeriesDocument,
    "instrument": InstrumentDocument,
}
"""The models by name of the schema; the file is ``<name>.schema.json``."""


def schema_file_name(name: str) -> str:
    return f"{name}.schema.json"


def generate_schema(name: str) -> dict[str, object]:
    """The JSON schema of a file format."""
    schema = SCHEMA_MODELS[name].model_json_schema()
    return {"$schema": SCHEMA_DIALECT, **schema}


def render_schema(name: str) -> str:
    """The text of the schema file: JSON, indented, with a final line feed."""
    return json.dumps(generate_schema(name), indent=2, ensure_ascii=False) + "\n"


def write_schemas(directory: Path) -> list[Path]:
    """Write all schema files into a directory (created if needed)."""
    directory.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for name in SCHEMA_MODELS:
        path = directory / schema_file_name(name)
        path.write_text(render_schema(name), encoding="utf-8")
        written.append(path)
    return written


def differing_schemas(directory: Path) -> list[str]:
    """Names of the schemas whose file is missing or differs from the generated text."""
    result: list[str] = []
    for name in SCHEMA_MODELS:
        path = directory / schema_file_name(name)
        if not path.is_file() or path.read_text(encoding="utf-8") != render_schema(name):
            result.append(name)
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="pipwerk-marketdata-schemas",
        description="Generate the JSON schemas of the market data files.",
    )
    parser.add_argument("directory", type=Path, help="directory of the schema files")
    parser.add_argument("--check", action="store_true", help="only compare, write nothing")
    arguments = parser.parse_args(argv)
    if arguments.check:
        differing = differing_schemas(arguments.directory)
        for name in differing:
            print(f"schema differs from the models: {name}", file=sys.stderr)
        return 1 if differing else 0
    for path in write_schemas(arguments.directory):
        print(f"written: {path.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
