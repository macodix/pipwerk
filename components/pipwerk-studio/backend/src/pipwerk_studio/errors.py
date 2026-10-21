"""Error answers of the web API (specification 4.2): every error answer has the English
``detail`` for users of the interface, the ``code`` of the cause and the ``params`` for the text.

The user interface writes the text in the chosen language from ``code`` and ``params``
(req-ui-007, Mangel M4); it does not show ``detail``. The table :data:`ERROR_CODES` is the
one list of the codes with their HTTP status, their English text and the names of their
params. The texts name no path, no exception text and no input.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi.responses import JSONResponse


@dataclass(frozen=True, slots=True)
class ErrorCodeInfo:
    """What a code stands for: the HTTP status, the English text and the names of the params
    (the fields of ``params`` that the code can carry)."""

    status: int
    text: str
    params: tuple[str, ...] = ()


ERROR_CODES: dict[str, ErrorCodeInfo] = {
    "object.not_found": ErrorCodeInfo(404, "The object does not exist."),
    "object.unreadable": ErrorCodeInfo(
        409,
        "The object file cannot be read or does not fit the document schema. It is left unchanged.",
    ),
    "object.kind_conflict": ErrorCodeInfo(
        409,
        "An entry of another kind has this identifier in the object directory (any entry, for "
        "example a file, a symbolic link or a directory). Nothing was written.",
    ),
    "object.name_taken": ErrorCodeInfo(
        409,
        "The file name of the object in the object directory is taken by an entry that is no "
        "readable regular file (for example a symbolic link or a directory). Nothing was "
        "written.",
    ),
    "object.builtin": ErrorCodeInfo(403, "A delivered template cannot be changed or deleted."),
    "object.write_failed": ErrorCodeInfo(500, "The object file could not be written or deleted."),
    "document.invalid": ErrorCodeInfo(422, "The document does not fit the document schema."),
    "document.format_mismatch": ErrorCodeInfo(
        422, "The format of the document does not fit the kind of object."
    ),
    "document.id_mismatch": ErrorCodeInfo(
        422, "The identifier of the document differs from the identifier in the path."
    ),
    "document.too_large": ErrorCodeInfo(
        413, "The document is too large to be stored.", ("limit_bytes",)
    ),
    "request.invalid": ErrorCodeInfo(422, "The request is invalid."),
    "request.not_json": ErrorCodeInfo(
        415, "The request body must be JSON (Content-Type: application/json)."
    ),
    "request.too_large": ErrorCodeInfo(
        413, "The request body is larger than the limit of 2 MiB.", ("limit_bytes",)
    ),
    "request.not_found": ErrorCodeInfo(404, "There is no such path."),
    "request.method_not_allowed": ErrorCodeInfo(405, "The method is not allowed for this path."),
    "request.failed": ErrorCodeInfo(400, "The request cannot be processed."),
    "host.not_allowed": ErrorCodeInfo(400, "The Host header of the request is not allowed."),
    "expressions.pointer_invalid": ErrorCodeInfo(
        422,
        "The pointer of an item does not name a place of an expression in the document.",
        ("index",),
    ),
    "expressions.blocks_invalid": ErrorCodeInfo(
        422,
        "The blocks of an item are no expression.",
        ("index", "reason", "details"),
    ),
    "keys.scope_invalid": ErrorCodeInfo(
        422, "The pointer names no list of the document that takes a new object."
    ),
    "object_directory.not_set": ErrorCodeInfo(
        503, "The object directory of pipwerk Studio is not set."
    ),
    "object_directory.stored_invalid": ErrorCodeInfo(
        503, "The stored pipwerk Studio object directory is invalid."
    ),
    "object_directory.unreadable": ErrorCodeInfo(
        500, "The object directory of pipwerk Studio cannot be read."
    ),
    "object_directory.not_absolute": ErrorCodeInfo(
        422, "The object directory must be an absolute path."
    ),
    "object_directory.invalid_body": ErrorCodeInfo(
        422,
        "The request body must be a JSON object with the fields path (text) and move "
        "(true or false).",
    ),
    "object_directory.conflict": ErrorCodeInfo(
        409,
        "The new object directory already contains files with the same names. Nothing was moved.",
    ),
    "object_directory.stored_invalid_no_move": ErrorCodeInfo(
        409,
        "The stored pipwerk Studio object directory is invalid, so no files can be moved. "
        "Save the object directory without moving files to repair it.",
    ),
    "object_directory.target_not_creatable": ErrorCodeInfo(
        500,
        "The new object directory could not be created. Nothing was moved and the object "
        "directory is unchanged.",
    ),
    "object_directory.move_failed": ErrorCodeInfo(
        500,
        "Moving the object files failed. The files were brought back and the object directory "
        "is unchanged.",
    ),
    "object_directory.move_not_restored": ErrorCodeInfo(
        500,
        "Moving the object files failed and some files could not be brought back. "
        "The object directory is unchanged.",
        ("source_directory", "target_directory", "files"),
    ),
    "language.stored_invalid": ErrorCodeInfo(503, "The stored pipwerk Studio language is invalid."),
}


class ApiException(Exception):  # noqa: N818 - named after the answer it stands for
    """An error with a code of :data:`ERROR_CODES`; the application answers it with the table
    status, the English text, the code and the params."""

    def __init__(self, code: str, params: dict[str, Any] | None = None, **extra: Any) -> None:
        super().__init__(code)
        self.code = code
        self.params = params or {}
        self.extra = extra


def error_body(code: str, params: dict[str, Any] | None = None, **extra: Any) -> dict[str, Any]:
    """The body of an error answer: ``detail``, ``code`` and ``params``, plus further fields."""
    return {"detail": ERROR_CODES[code].text, "code": code, "params": params or {}, **extra}


def error_response(
    code: str, params: dict[str, Any] | None = None, *, status: int | None = None, **extra: Any
) -> JSONResponse:
    """The answer to an error: the status of the code (or ``status``) and :func:`error_body`."""
    return JSONResponse(
        status_code=ERROR_CODES[code].status if status is None else status,
        content=error_body(code, params, **extra),
    )


def error_codes_markdown() -> str:
    """The list of the codes with status, text and params, for the description of the
    interface."""
    lines: list[str] = []
    for code, info in ERROR_CODES.items():
        params = f" Params: {', '.join(info.params)}." if info.params else ""
        lines.append(f"- `{code}` (HTTP {info.status}): {info.text}{params}")
    return "\n".join(lines)
