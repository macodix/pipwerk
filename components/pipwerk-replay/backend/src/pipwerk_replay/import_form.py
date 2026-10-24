"""The form of the request of one import file: one file and what the caller says about it
(multipart).

``POST /api/v1/market-data/import-processes/{id}/files`` and ``POST
/api/v1/market-data/import-preview`` take a ``multipart/form-data`` body with one file. The
fields:

| Field | Count | Content |
| --- | --- | --- |
| ``broker`` | one (import) | the broker of all files of the import process |
| ``timezone`` | at most one (import) | IANA name of the time zone of the times in all CSV files |
| ``keep`` | none or one (import) | ``true``: keep the file in the storage directory (5.6) |
| ``file`` | exactly one | the file; the file name of the part names the file |
| ``instrument`` | none or one | the instrument of the file |
| ``data`` | none or one | the data of the file |

An empty value says "not given". A field that is not in the table is refused. A request has one
file only (specification 11): an import process sends its files one after the other.

A file name is only read: it is reported back (without a directory and without control
characters, at most 255 characters, never ``.`` or ``..``) and used to recognize instrument and
data. It is never used as a path, except as the name of a kept file directly in the storage
directory (``file_keeping.py``); the content of the file is held in memory and handed to the data
stock as bytes. The parts of the form that the parser spools to the disk are files without a name
(``tempfile.TemporaryFile``), closed when the form is closed, also after an error.

The size of the request follows the file: the largest file (``max_upload_bytes``) plus the
envelope of the form (``request_limit``). A file that is larger is answered with HTTP 413 and
the limit per file (``file_too_large``).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlsplit

from fastapi import Request
from fastapi.responses import JSONResponse
from pipwerk_marketdata import format_size
from starlette.datastructures import UploadFile
from starlette.exceptions import HTTPException

from pipwerk_replay.api_support import BODY_INVALID_TEXT, ErrorPlace, InvalidRequest
from pipwerk_replay.marketdata_models import MAX_TIMEZONE_LENGTH, FileTooLarge
from pipwerk_replay.names import is_valid_name

FIELD_BROKER = "broker"
FIELD_TIMEZONE = "timezone"
FIELD_FILE = "file"
FIELD_INSTRUMENT = "instrument"
FIELD_DATA = "data"
FIELD_KEEP = "keep"
#: The two values of the field ``keep``.
KEEP_VALUES = ("true", "false")

UNSUPPORTED_FORM_TEXT = (
    "The request body must be a form with a file (Content-Type: multipart/form-data)."
)
FORM_INVALID_TEXT = "The form of the request is invalid."
OTHER_ORIGIN_TEXT = "The request comes from a web page of another origin."

#: Largest size of a text field of the form (names are at most 128 characters).
MAX_FIELD_BYTES = 4096
#: Largest length of the name of a file that is reported back.
MAX_FILE_NAME_LENGTH = 255

#: Room of the envelope of a form (boundary, headers of the parts, the fields ``broker``,
#: ``timezone``, ``instrument`` and ``data``, a file name of up to 255 characters).
ENVELOPE_BYTES = 64 * 1024

_CONTROL = re.compile(r"[\x00-\x1f\x7f]")


def request_limit(max_upload_bytes: int) -> int:
    """The largest request body of one import file: the file plus the envelope of the form."""
    return max_upload_bytes + ENVELOPE_BYTES


def file_too_large(max_upload_bytes: int) -> JSONResponse:
    """The answer to a request whose body is larger than ``request_limit``: HTTP 413 with the
    limit per file in the unit of the user."""
    body = FileTooLarge(
        detail=f"The file is larger than the limit of {format_size(max_upload_bytes)} per file.",
        code="too_large",
        max_bytes=max_upload_bytes,
    )
    return JSONResponse(status_code=413, content=body.model_dump(mode="json"))


@dataclass(frozen=True, slots=True)
class FormFile:
    """The file of the form: its name (only for the report), its content and the optional
    instrument and data the caller gives."""

    name: str
    content: bytes
    instrument: str | None
    data: str | None


@dataclass(frozen=True, slots=True)
class ImportForm:
    """The checked form of one import file."""

    broker: str | None
    timezone: str | None
    file: FormFile
    #: Whether the uploaded file is kept in the storage directory (specification 5.6).
    keep: bool = False


def file_name(raw: str | None, position: int = 1) -> str:
    """The cleaned name of a file (specification 11): the last part of the name (after ``/`` or
    ``\\``), without control characters and at most 255 characters. ``file-<n>`` if nothing is
    left or if what is left is ``.`` or ``..`` (a file is never kept under such a name). It is
    the name that is reported back and the name of a kept file."""
    last = re.split(r"[/\\]", raw or "")[-1]
    cleaned = _CONTROL.sub("", last).strip()[:MAX_FILE_NAME_LENGTH]
    if cleaned in (".", ".."):
        cleaned = ""
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


class TooManyFilesInFormError(Exception):
    """The form holds more than one file."""


async def _read_parts(
    request: Request,
) -> tuple[list[tuple[str, str]], list[tuple[str | None, bytes]]]:
    """The text fields and the files of the form, in order. Raises ``HTTPException`` (415) for
    another media type, ``TooManyFilesInFormError`` for more than one file and ``ValueError``
    for a form that is wrong."""
    if _media_type(request) != "multipart/form-data":
        raise HTTPException(status_code=415, detail=UNSUPPORTED_FORM_TEXT)
    try:
        form = await request.form(max_files=1, max_fields=16, max_part_size=MAX_FIELD_BYTES)
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


async def read_form(request: Request, *, fields: frozenset[str]) -> ImportForm | JSONResponse:
    """Read and check the form of one import file.

    ``fields`` are the text fields the endpoint accepts (``broker`` and ``timezone`` for the
    import, none for the preview). The answer is the form or the response to a form that is
    wrong: HTTP 422 with the places of the errors (never the values). A wrong media type raises
    ``HTTPException`` (415), a request from another origin ``HTTPException`` (403); both before
    the body is read."""
    if _other_origin(request):
        raise HTTPException(status_code=403, detail=OTHER_ORIGIN_TEXT)
    try:
        texts, uploaded = await _read_parts(request)
    except TooManyFilesInFormError:
        return _refused(([FIELD_FILE], "too_long"))
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
    for key in (FIELD_BROKER, FIELD_TIMEZONE, FIELD_INSTRUMENT, FIELD_DATA, FIELD_KEEP):
        if len(values.get(key, [])) > 1:
            errors.append(([key], "too_long"))
    keep_values = values.get(FIELD_KEEP, [])
    if keep_values and keep_values[0] not in KEEP_VALUES:
        errors.append(([FIELD_KEEP], "value_error"))
    if not uploaded:
        errors.append(([FIELD_FILE], "missing"))
    brokers = values.get(FIELD_BROKER, [])
    broker = brokers[0] if brokers else None
    if FIELD_BROKER in fields and (broker is None or not is_valid_name(broker)):
        errors.append(([FIELD_BROKER], "missing" if broker is None else "value_error"))
    timezone = values.get(FIELD_TIMEZONE, [""])[0].strip() or None
    if timezone is not None and len(timezone) > MAX_TIMEZONE_LENGTH:
        errors.append(([FIELD_TIMEZONE], "string_too_long"))
    instrument = values.get(FIELD_INSTRUMENT, [""])[0] or None
    data = values.get(FIELD_DATA, [""])[0] or None
    if errors:
        return _refused(*errors)

    raw_name, content = uploaded[0]
    return ImportForm(
        broker=broker,
        timezone=timezone,
        file=FormFile(file_name(raw_name), content, instrument, data),
        keep=bool(keep_values) and keep_values[0] == "true",
    )
