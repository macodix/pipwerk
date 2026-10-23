"""The form of an import: several files and what the caller says about them (multipart).

``POST /api/v1/market-data/imports`` and ``.../imports/preview`` take a ``multipart/form-data``
body. The fields:

| Field | Count | Content |
| --- | --- | --- |
| ``broker`` | one (import) | the broker of all files of the import |
| ``timezone`` | at most one (import) | IANA name of the time zone of the times in all CSV files |
| ``file`` | any number | one file of the import; the file name of the part names the file |
| ``instrument`` | none, or one per file | the instrument of the file at the same position |
| ``data`` | none, or one per file | the data of the file at the same position |

``instrument`` and ``data`` belong to the file at the same position in the form (the order of
the parts is kept). An empty value says "not given". A field that is not in the table is refused.

A file name is only read: it is reported back (without a directory and without control
characters, at most 255 characters) and used to recognize instrument and data. It is never used
as a path; the content of a file is held in memory and handed to the data stock as bytes.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlsplit

from fastapi import Request
from fastapi.responses import JSONResponse
from pipwerk_marketdata import BatchErrorCode
from starlette.datastructures import UploadFile
from starlette.exceptions import HTTPException

from pipwerk_replay.api_support import BODY_INVALID_TEXT, ErrorPlace, InvalidRequest
from pipwerk_replay.marketdata_models import MAX_TIMEZONE_LENGTH, ImportRefused
from pipwerk_replay.names import is_valid_name

FIELD_BROKER = "broker"
FIELD_TIMEZONE = "timezone"
FIELD_FILE = "file"
FIELD_INSTRUMENT = "instrument"
FIELD_DATA = "data"

UNSUPPORTED_FORM_TEXT = (
    "The request body must be a form with files (Content-Type: multipart/form-data)."
)
FORM_INVALID_TEXT = "The form of the request is invalid."
OTHER_ORIGIN_TEXT = "The request comes from a web page of another origin."
IMPORT_REFUSED_TEXT = "The import is refused as a whole."

#: Largest size of a text field of the form (names are at most 128 characters).
MAX_FIELD_BYTES = 4096
#: Largest length of the name of a file that is reported back.
MAX_FILE_NAME_LENGTH = 255

#: Room of the envelope of a form per file (boundary, headers of the part, the fields
#: ``instrument`` and ``data``, a file name of up to 255 characters).
ENVELOPE_PER_FILE_BYTES = 4096
#: Room of the envelope of a form that does not depend on the files.
ENVELOPE_FIXED_BYTES = 64 * 1024

_CONTROL = re.compile(r"[\x00-\x1f\x7f]")


def body_limit(max_files: int, max_total_bytes: int) -> int:
    """The largest request body of an import: the files together plus the envelope of the form.
    A request with more files than allowed is refused by name, so the room of one file more
    is given."""
    return max_total_bytes + ENVELOPE_FIXED_BYTES + (max_files + 1) * ENVELOPE_PER_FILE_BYTES


@dataclass(frozen=True, slots=True)
class FormFile:
    """One file of the form: its name (only for the report), its content and the optional
    instrument and data the caller gives."""

    name: str
    content: bytes
    instrument: str | None
    data: str | None


@dataclass(frozen=True, slots=True)
class ImportForm:
    """The checked form of an import."""

    broker: str | None
    timezone: str | None
    files: tuple[FormFile, ...]


class TooManyFilesInFormError(Exception):
    """The form holds more files than the parser of the form allows."""


def file_name(raw: str | None, position: int) -> str:
    """The name that is reported back: the last part of the name (after ``/`` or ``\\``), without
    control characters and at most 255 characters. ``file-<n>`` if nothing is left."""
    last = re.split(r"[/\\]", raw or "")[-1]
    cleaned = _CONTROL.sub("", last).strip()[:MAX_FILE_NAME_LENGTH]
    return cleaned or f"file-{position}"


def _refused(*places: tuple[list[str | int], str], detail: str = BODY_INVALID_TEXT) -> JSONResponse:
    body = InvalidRequest(
        detail=detail, errors=[ErrorPlace(location=place, type=kind) for place, kind in places]
    )
    return JSONResponse(status_code=422, content=body.model_dump(mode="json"))


def _media_type(request: Request) -> str:
    return request.headers.get("content-type", "").split(";")[0].strip().lower()


def _other_origin(request: Request) -> bool:
    """Whether the request comes from a web page of another origin.

    A form with files (``multipart/form-data``) is one of the three media types that a web page
    of another origin may send without a preflight request, unlike a JSON body. A browser
    names the page in the header ``Origin`` of such a request, so the request is only served if
    the origin is that of the backend itself (the same name and port as in ``Host``; the scheme
    is not compared, a page on the same name and port is served by the same operator). The value
    ``null`` (a page without an origin) is another origin. A request without ``Origin`` (a program
    such as ``curl``) is not from a web page."""
    origin = request.headers.get("origin")
    if origin is None:
        return False
    return urlsplit(origin).netloc.lower() != request.headers.get("host", "").lower()


async def _read_parts(
    request: Request, max_files: int
) -> tuple[list[tuple[str, str]], list[tuple[str | None, bytes]]]:
    """The text fields and the files of the form, in order. Raises ``HTTPException`` (415) for
    another media type, ``TooManyFilesInFormError`` and ``ValueError`` for a form that is wrong."""
    if _media_type(request) != "multipart/form-data":
        raise HTTPException(status_code=415, detail=UNSUPPORTED_FORM_TEXT)
    try:
        form = await request.form(
            max_files=max_files + 1,
            max_fields=4 * (max_files + 1) + 16,
            max_part_size=MAX_FIELD_BYTES,
        )
    except HTTPException as error:
        # Starlette answers a form that it cannot read with HTTP 400 and its own text.
        if error.status_code == 400 and "Too many files" in str(error.detail):
            raise TooManyFilesInFormError from None
        raise ValueError("the form cannot be read") from None
    texts: list[tuple[str, str]] = []
    files: list[tuple[str | None, bytes]] = []
    try:
        for key, value in form.multi_items():
            if not isinstance(value, UploadFile):
                texts.append((key, value))
            elif key == FIELD_FILE:
                files.append((value.filename, await value.read()))
            else:
                raise ValueError("a file in another field")
    finally:
        await form.close()
    return texts, files


def import_refused(code: BatchErrorCode, message: str) -> JSONResponse:
    """The answer to an import that is refused as a whole: HTTP 422 for no file, HTTP 413 for
    too many files or files that are too large together."""
    status = 422 if code is BatchErrorCode.NO_FILES else 413
    body = ImportRefused(detail=IMPORT_REFUSED_TEXT, code=code, message=message)
    return JSONResponse(status_code=status, content=body.model_dump(mode="json"))


async def read_form(
    request: Request, *, max_files: int, fields: frozenset[str]
) -> ImportForm | JSONResponse:
    """Read and check the form of an import.

    ``fields`` are the text fields the endpoint accepts (``broker`` and ``timezone`` for the
    import, none for the preview). The answer is the form or the response to a form that is
    wrong: HTTP 422 with the places of the errors (never the values), HTTP 413 for more files
    than ``max_files``. A wrong media type raises ``HTTPException`` (415), a request from another
    origin ``HTTPException`` (403); both before the body is read."""
    if _other_origin(request):
        raise HTTPException(status_code=403, detail=OTHER_ORIGIN_TEXT)
    try:
        texts, uploaded = await _read_parts(request, max_files)
    except TooManyFilesInFormError:
        return import_refused(
            BatchErrorCode.TOO_MANY_FILES, f"The process has more than {max_files} files."
        )
    except ValueError:
        return _refused(([], "form_invalid"), detail=FORM_INVALID_TEXT)

    known = fields | {FIELD_INSTRUMENT, FIELD_DATA}
    errors: list[tuple[list[str | int], str]] = []
    values: dict[str, list[str]] = {}
    for key, value in texts:
        if key not in known:
            errors.append(([key[:100]], "extra_forbidden"))
        else:
            values.setdefault(key, []).append(value)
    for key in (FIELD_BROKER, FIELD_TIMEZONE):
        if key in fields and len(values.get(key, [])) > 1:
            errors.append(([key], "too_long"))
    brokers = values.get(FIELD_BROKER, [])
    broker = brokers[0] if brokers else None
    if FIELD_BROKER in fields and (broker is None or not is_valid_name(broker)):
        errors.append(([FIELD_BROKER], "missing" if broker is None else "value_error"))
    timezone = values.get(FIELD_TIMEZONE, [""])[0].strip() or None
    if timezone is not None and len(timezone) > MAX_TIMEZONE_LENGTH:
        errors.append(([FIELD_TIMEZONE], "string_too_long"))
    instruments = _per_file(values, FIELD_INSTRUMENT, len(uploaded), errors)
    datas = _per_file(values, FIELD_DATA, len(uploaded), errors)
    if errors:
        return _refused(*errors)

    files = tuple(
        FormFile(file_name(raw_name, position), content, instrument, data)
        for position, ((raw_name, content), instrument, data) in enumerate(
            zip(uploaded, instruments, datas, strict=True), start=1
        )
    )
    return ImportForm(broker=broker, timezone=timezone, files=files)


def _per_file(
    values: dict[str, list[str]],
    key: str,
    count: int,
    errors: list[tuple[list[str | int], str]],
) -> list[str | None]:
    """The values of a field that belongs to the files: none, or one per file; empty is None."""
    given: list[Any] = values.get(key, [])
    if given and len(given) != count:
        errors.append(([key], "length_mismatch"))
        return [None] * count
    if not given:
        return [None] * count
    return [item if item else None for item in given]
