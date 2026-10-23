"""The reasons why a part cannot be fetched: a stable code and a fixed readable reason (German).

The program prints the reason to the user next to the instrument, the kind and the period of the
part. The reasons are fixed texts. They name neither a value of the call nor an exception text
nor anything of the startup configuration (the details of the connection).
"""

from __future__ import annotations

from typing import Literal

ErrorCode = Literal[
    "symbol_unknown",
    "no_data",
    "range_too_large",
    "terminal_unavailable",
    "broker_error",
    "broker_unknown",
    "invalid_broker_data",
    "write_failed",
    "internal_error",
]

#: The reason (fixed text) of every error code.
REASONS: dict[ErrorCode, str] = {
    "symbol_unknown": "Symbol beim Broker unbekannt",
    "no_data": "Daten beim Broker nicht vorhanden",
    "range_too_large": (
        "Zeitraum zu groß: mehr Zeilen oder Abrufe als erlaubt, bitte einen kleineren "
        "Zeitraum wählen"
    ),
    "terminal_unavailable": "MetaTrader 5 nicht erreichbar",
    "broker_error": "MetaTrader 5 hat die Abfrage mit einem Fehler beendet",
    "broker_unknown": "Der Name des Brokers ist nicht bestimmbar",
    "invalid_broker_data": "Der Broker liefert ungültige Angaben zum Instrument",
    "write_failed": "Die Datei konnte nicht geschrieben werden",
    "internal_error": "Interner Fehler im Programm",
}


class FetchError(Exception):
    """A part that cannot be fetched; ``code`` selects the reason from ``REASONS``."""

    def __init__(self, code: ErrorCode) -> None:
        super().__init__(code)
        self.code: ErrorCode = code

    @property
    def reason(self) -> str:
        return REASONS[self.code]
