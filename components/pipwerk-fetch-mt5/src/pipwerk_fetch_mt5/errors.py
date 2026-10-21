"""The errors of the interface: a stable code and a fixed readable reason (German).

Every error answer of the program has the form ``{"error": {"code": ..., "reason": ...}}``.
The reasons are fixed texts. They name neither a value of the request nor an exception text
nor anything of the startup configuration (the key, the details of the connection).
pipwerk replay shows the reason to the user.
"""

from __future__ import annotations

from typing import Literal

from fastapi.responses import JSONResponse

ErrorCode = Literal[
    "unauthorized",
    "host_not_allowed",
    "body_too_large",
    "invalid_request",
    "not_found",
    "symbol_unknown",
    "no_data",
    "range_too_large",
    "terminal_unavailable",
    "broker_error",
    "broker_unknown",
    "invalid_broker_data",
    "internal_error",
]

#: The reason (fixed text) and the HTTP status of every error code.
ERRORS: dict[ErrorCode, tuple[int, str]] = {
    "unauthorized": (401, "Schlüssel fehlt oder ist falsch"),
    "host_not_allowed": (400, "Der Kopf Host der Anfrage ist nicht erlaubt"),
    "body_too_large": (413, "Die Anfrage ist größer als die erlaubten 8 KiB"),
    "invalid_request": (422, "Die Anfrage ist ungültig"),
    "not_found": (404, "Pfad oder Methode unbekannt"),
    "symbol_unknown": (404, "Symbol beim Broker unbekannt"),
    "no_data": (404, "Daten beim Broker nicht vorhanden"),
    "range_too_large": (
        422,
        "Zeitraum zu groß: mehr Zeilen als je Anfrage erlaubt, bitte einen kleineren "
        "Zeitraum anfragen",
    ),
    "terminal_unavailable": (503, "MetaTrader 5 nicht erreichbar"),
    "broker_error": (502, "MetaTrader 5 hat die Abfrage mit einem Fehler beendet"),
    "broker_unknown": (502, "Der Name des Brokers ist nicht bestimmbar"),
    "invalid_broker_data": (502, "Der Broker liefert ungültige Angaben zum Instrument"),
    "internal_error": (500, "Interner Fehler im Programm"),
}


class FetchError(Exception):
    """A failed acquisition; ``code`` selects status and reason from ``ERRORS``."""

    def __init__(self, code: ErrorCode) -> None:
        super().__init__(code)
        self.code: ErrorCode = code


def error_body(code: ErrorCode, fields: list[str] | None = None) -> dict[str, object]:
    """The body of the error answer; ``fields`` names the invalid fields of a request."""
    error: dict[str, object] = {"code": code, "reason": ERRORS[code][1]}
    if fields is not None:
        error["fields"] = fields
    return {"error": error}


def error_response(
    code: ErrorCode,
    fields: list[str] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=ERRORS[code][0], content=error_body(code, fields), headers=headers
    )
