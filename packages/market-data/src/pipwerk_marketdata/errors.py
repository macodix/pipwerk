"""Errors of the library.

Messages are fixed or built from names of fields, never from file content.
"""

from pipwerk_marketdata.records import BatchErrorCode, DeletionErrorCode, FileErrorCode


class ImportBatchError(Exception):
    """The whole import process is refused before any file is read. Nothing was changed."""

    def __init__(self, code: BatchErrorCode, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class ImportFileError(Exception):
    """The whole file is refused. Nothing was changed in the data store."""

    def __init__(self, code: FileErrorCode, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class DeletionError(Exception):
    """A deletion is refused (unknown broker, instrument, series or period). Nothing was changed."""

    def __init__(self, code: DeletionErrorCode, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class MarketDataStoreError(Exception):
    """A database operation failed. The transaction was rolled back; the message names no detail."""


class DatabaseMigrationError(Exception):
    """The database cannot be brought to the current schema."""
