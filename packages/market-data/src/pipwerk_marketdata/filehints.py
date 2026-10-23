"""What a file says about its content before it is imported: from its name and from its JSON.

Both functions only read. A file name is never used as a path; it is only matched against fixed
patterns. The JSON content is parsed with the standard library and never executed.
"""

import json
import re
from typing import Any, NoReturn

from pipwerk_marketdata.errors import ImportFileError
from pipwerk_marketdata.filetext import decode_text
from pipwerk_marketdata.limits import ImportLimits
from pipwerk_marketdata.parsed import (
    KIND_CANDLES,
    KIND_INSTRUMENT,
    KIND_TICKS,
    check_series_names,
)
from pipwerk_marketdata.records import FileErrorCode, FileHints, NameHints
from pipwerk_marketdata.timeunits import CONTRACT, TICKS, TIME_UNITS

_MAX_NAME_LENGTH = 255

_EXTENSION = re.compile(r"\.(json|csv|txt)$", re.IGNORECASE)
_DATA = "|".join([*sorted(TIME_UNITS, key=len, reverse=True), TICKS, CONTRACT])

# <Instrument>_<Data>_<from>_<to>: names of pipwerk-fetch-mt5 and the export of MetaTrader 5
# ("EURUSD_H1_202301020000_202312292300.csv"); <from> and <to> are read, not interpreted.
_WITH_PERIOD = re.compile(
    rf"(?P<instrument>.+)_(?P<data>{_DATA})_[0-9][0-9A-Za-z\-]*_[0-9][0-9A-Za-z\-]*",
    re.IGNORECASE,
)
# <Instrument>,<Data> ("EURUSD,H1.csv"), also with underscore or space as separator.
_WITHOUT_PERIOD = re.compile(rf"(?P<instrument>.+?)[,_ ](?P<data>{_DATA})", re.IGNORECASE)


def _usable_name(value: object) -> str | None:
    """``value`` if the import would accept it as a name of a broker or instrument."""
    if not isinstance(value, str):
        return None
    try:
        check_series_names(value, "x", None, candles=False)
    except ImportFileError:
        return None
    return value


def recognize_filename(name: str) -> NameHints:
    """Instrument and data a file name contains, as far as it contains them.

    Patterns, matched without regard to case after the last ``/`` or ``\\`` and without the
    extension ``.json``, ``.csv`` or ``.txt``:

    1. ``<Instrument>_<Data>_<from>_<to>``, for example ``EURUSD_H1_202301020000_202312292300.csv``
       or ``EURUSD_TICKS_20240101_20240131.json``;
    2. ``<Instrument>,<Data>``, also with ``_`` or a space as separator, for example
       ``EURUSD,H1.csv``.

    ``<Data>`` is a time unit (``M1`` to ``MN1``), ``TICKS`` or ``CONTRACT``. The result names
    the data as identifier (``m1``, ``ticks``, ``contract``) and the instrument as written. A
    name that matches no pattern, or whose instrument the import would not accept, gives
    ``NameHints(None, None)``.
    """
    base = re.split(r"[/\\]", name)[-1]
    if not base or len(base) > _MAX_NAME_LENGTH:
        return NameHints(None, None)
    stem = _EXTENSION.sub("", base)
    match = _WITH_PERIOD.fullmatch(stem) or _WITHOUT_PERIOD.fullmatch(stem)
    if match is None:
        return NameHints(None, None)
    instrument = _usable_name(match.group("instrument"))
    if instrument is None:
        return NameHints(None, None)
    return NameHints(instrument, match.group("data").lower())


def _reject_constant(_name: str) -> NoReturn:
    raise ValueError("NaN and infinity are no JSON values")


def inspect_json(data: bytes, limits: ImportLimits | None = None) -> FileHints:
    """Broker, instrument and data a JSON file names, without importing it.

    Only the header fields are looked at; entries are not checked. A value the import would not
    accept is ``None``. A file that cannot be read as JSON gives ``error`` (the code the import
    would give) and no values.
    """
    limits = limits or ImportLimits()
    try:
        text = decode_text(data, limits)
        raw: Any = json.loads(text, parse_constant=_reject_constant)
    except ImportFileError as error:
        return FileHints(None, None, None, error.code)
    except ValueError, RecursionError:
        return FileHints(None, None, None, FileErrorCode.JSON_INVALID)
    if not isinstance(raw, dict):
        return FileHints(None, None, None, FileErrorCode.DOCUMENT_INVALID)
    kind = raw.get("kind")
    unit = raw.get("time_unit")
    if kind == KIND_CANDLES:
        content = unit if isinstance(unit, str) and unit in TIME_UNITS else None
    elif kind == KIND_TICKS:
        content = TICKS
    elif kind == KIND_INSTRUMENT:
        content = CONTRACT
    else:
        content = None
    return FileHints(_usable_name(raw.get("broker")), _usable_name(raw.get("instrument")), content)
