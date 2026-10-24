"""Internal endpoints of pipwerk replay below ``/api/replay/``.

Like ``/api/studio/`` of pipwerk Studio they are connections within pipwerk replay (its own user
interface uses them). They are no part of the public web API and no versioned definition under
``contracts/``; they stay visible in ``/docs``, but are not in the file under ``contracts/api/``.

- ``GET``, ``PUT`` ``/api/replay/settings/language``: language of the user interface (``de``,
  ``en``)
- ``GET``, ``PUT`` ``/api/replay/settings/test-run-broker``: broker whose data a test run uses
- ``GET``, ``PUT`` ``/api/replay/settings/files``: "keep imported files" and the storage, import
  and export directory (specification 5.7)
- ``GET`` ``/api/replay/revision``: the commit pipwerk replay runs from

The rules for bodies, errors and texts are those of the public web API (``api_support.py``).
"""

from __future__ import annotations

import logging
from enum import Enum
from typing import Annotated

from fastapi import APIRouter
from fastapi.responses import JSONResponse, Response
from pipwerk_marketdata import MarketDataStoreError
from pydantic import ConfigDict, StringConstraints, model_validator

from pipwerk_replay.api_support import (
    INTERNAL_PREFIX,
    ApiModel,
    Handler,
    JsonBody,
    api_error,
    body_description,
    error_responses,
    guarded,
    invalid_place,
    parse_body,
)
from pipwerk_replay.directories import (
    MAX_DIRECTORY_LENGTH,
    DirectoryKind,
    DirectorySetting,
)
from pipwerk_replay.marketdata_models import Name
from pipwerk_replay.marketdata_service import (
    BrokerForTestRuns,
    BrokerNotInDataStockError,
    MarketDataService,
)
from pipwerk_replay.revision import REVISION_LENGTH, Revision
from pipwerk_replay.settings_service import (
    FileSettings,
    InvalidBrokerNameError,
    InvalidDirectoriesError,
    Language,
    SettingsService,
    StoredDirectoryInvalidError,
    StoredLanguageInvalidError,
    StoredTestRunBrokerInvalidError,
)

logger = logging.getLogger(__name__)

TAGS: list[str | Enum] = ["internal"]

STORED_LANGUAGE_INVALID_TEXT = "The stored pipwerk replay language is invalid."
STORED_TEST_RUN_BROKER_INVALID_TEXT = "The stored pipwerk replay broker for test runs is invalid."
STORED_DIRECTORY_INVALID_TEXT = "A stored pipwerk replay directory is invalid."
DIRECTORIES_REFUSED_TEXT = "A directory cannot be used. Nothing was saved."
BROKER_NOT_IN_DATA_STOCK_TEXT = "The broker has no data in the data stock."
DATA_STORE_TEXT = "The data stock could not be read or changed."


class ReplayLanguage(ApiModel):
    """The language of the user interface."""

    language: Language


class ReplayLanguageUpdate(ApiModel):
    """Write model of the language. Only the languages German and English are accepted;
    unknown fields are rejected rather than silently ignored."""

    model_config = ConfigDict(extra="forbid", strict=True)

    language: Language


class ReplayBrokerForTestRuns(ApiModel):
    """The broker for test runs: ``broker`` is the broker whose data a test run uses. It is the
    chosen broker if that still occurs in the data stock (``chosen`` is ``true``), otherwise the
    first broker of the data stock in alphabetical order (``chosen`` is ``false``); ``null`` only
    if the data stock has no broker at all."""

    broker: Name | None
    chosen: bool


class ReplayBrokerForTestRunsUpdate(ApiModel):
    """Write model of the broker for test runs: a broker that occurs in the data stock, or
    ``null`` to remove the choice (then the first broker of the data stock applies)."""

    model_config = ConfigDict(extra="forbid", strict=True)

    broker: Name | None


class ReplayDirectory(ApiModel):
    """A directory in force: ``path`` is the stored absolute path or, with ``is_default`` true,
    the default of the operating system (specification 5.7); ``null`` if nothing is stored and
    the default cannot be determined."""

    path: str | None
    is_default: bool


class ReplayFileSettings(ApiModel):
    """The settings for files (specification 5.7): ``keep_imported_files`` is the preset of the
    box "Dateien behalten" of the import (``false`` as long as nothing is stored), the three
    directories are those in force: where kept files are written, which directory the import reads
    files from directly, and the preset place of future exports."""

    keep_imported_files: bool
    storage_directory: ReplayDirectory
    import_directory: ReplayDirectory
    export_directory: ReplayDirectory


DirectoryText = Annotated[str, StringConstraints(max_length=MAX_DIRECTORY_LENGTH)]


class ReplayFileSettingsUpdate(ApiModel):
    """Write model of the settings for files: all four values. A directory is an absolute path
    or ``null``, which removes the stored value (the default applies). Every path is checked
    before anything is stored: it must be absolute, the directory exists or is created, and it
    is writable (storage and export directory) or readable (import directory)."""

    model_config = ConfigDict(extra="forbid", strict=True)

    keep_imported_files: bool
    storage_directory: DirectoryText | None
    import_directory: DirectoryText | None
    export_directory: DirectoryText | None


_DIRECTORY_FIELDS: dict[DirectoryKind, str] = {
    "storage": "storage_directory",
    "import": "import_directory",
    "export": "export_directory",
}


def _directory_model(setting: DirectorySetting) -> ReplayDirectory:
    path = None if setting.path is None else str(setting.path)
    return ReplayDirectory(path=path, is_default=setting.is_default)


def _file_settings_model(files: FileSettings) -> ReplayFileSettings:
    return ReplayFileSettings(
        keep_imported_files=files.keep_imported_files,
        storage_directory=_directory_model(files.storage),
        import_directory=_directory_model(files.import_),
        export_directory=_directory_model(files.export),
    )


def _applying(state: BrokerForTestRuns) -> ReplayBrokerForTestRuns:
    return ReplayBrokerForTestRuns(broker=state.broker, chosen=state.chosen)


class ReplayRevision(ApiModel):
    """Read model of the revision pipwerk replay runs from.

    ``revision`` is the 7-character short form of the Git commit, ``commit`` the full commit,
    ``committed_at`` the committer date as ISO 8601 string with offset. ``revision`` and
    ``commit`` are both ``null`` if the revision is not determinable; ``committed_at`` is
    ``null`` if the date is not determinable."""

    model_config = ConfigDict(extra="forbid", strict=True)

    revision: str | None
    commit: str | None
    committed_at: str | None

    @model_validator(mode="after")
    def _consistent(self) -> ReplayRevision:
        if (self.revision is None) != (self.commit is None):
            raise ValueError("revision and commit must both be null or both be set")
        if self.commit is not None and self.revision != self.commit[:REVISION_LENGTH]:
            raise ValueError("revision must be the first 7 characters of commit")
        if self.commit is None and self.committed_at is not None:
            raise ValueError("committed_at needs a commit")
        return self


def _stored_language_invalid(error: StoredLanguageInvalidError) -> Response:
    logger.error("%s", error)
    return api_error(503, STORED_LANGUAGE_INVALID_TEXT)


def _stored_test_run_broker_invalid(error: StoredTestRunBrokerInvalidError) -> Response:
    logger.error("%s", error)
    return api_error(503, STORED_TEST_RUN_BROKER_INVALID_TEXT)


def _invalid_broker_name(_error: InvalidBrokerNameError) -> Response:
    return invalid_place(["broker"], "value_error")


def _broker_not_in_data_stock(_error: BrokerNotInDataStockError) -> Response:
    place = {"location": ["broker"], "type": "broker_not_in_data_stock"}
    return JSONResponse(
        status_code=422, content={"detail": BROKER_NOT_IN_DATA_STOCK_TEXT, "errors": [place]}
    )


def _stored_directory_invalid(error: StoredDirectoryInvalidError) -> Response:
    logger.error("%s", error)
    return api_error(503, STORED_DIRECTORY_INVALID_TEXT)


def _directories_refused(error: InvalidDirectoriesError) -> Response:
    """HTTP 422: the place of every refused directory and why (``not_absolute``,
    ``not_a_directory``, ``cannot_be_created``, ``not_writable``, ``not_readable``). The paths
    are not repeated (the caller knows what it sent)."""
    places = [
        {"location": [_DIRECTORY_FIELDS[kind]], "type": problem}
        for kind, problem in error.problems.items()
    ]
    return JSONResponse(
        status_code=422, content={"detail": DIRECTORIES_REFUSED_TEXT, "errors": places}
    )


def _data_store_failed(error: MarketDataStoreError) -> Response:
    cause = error.__cause__
    logger.error("The data stock failed (%s).", type(cause).__name__ if cause else "unknown")
    return api_error(503, DATA_STORE_TEXT)


_HANDLERS: dict[type[Exception], Handler] = {
    BrokerNotInDataStockError: _broker_not_in_data_stock,
    InvalidBrokerNameError: _invalid_broker_name,
    InvalidDirectoriesError: _directories_refused,
    MarketDataStoreError: _data_store_failed,
    StoredDirectoryInvalidError: _stored_directory_invalid,
    StoredLanguageInvalidError: _stored_language_invalid,
    StoredTestRunBrokerInvalidError: _stored_test_run_broker_invalid,
}


def build_router(
    settings: SettingsService, marketdata: MarketDataService, revision: Revision | None
) -> APIRouter:
    """The router of the internal endpoints with the prefix ``/api/replay``."""
    router = APIRouter(prefix=INTERNAL_PREFIX, tags=TAGS)

    @router.get(
        "/settings/language",
        operation_id="read_language",
        summary="Read the language of pipwerk replay",
        description=(
            "Returns the language of the user interface, German ('de') as long as none is "
            "stored. Responds with HTTP 503 if the stored value is not a supported language; "
            "a valid write repairs it."
        ),
        responses={
            200: {"description": "The language.", "model": ReplayLanguage},
            **error_responses(503),
        },
    )
    def read_language() -> Response:
        def run() -> Response:
            body = ReplayLanguage(language=settings.get_language())
            return JSONResponse(content=body.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.put(
        "/settings/language",
        operation_id="write_language",
        summary="Change the language of pipwerk replay",
        description=(
            "Stores the language of the user interface. Only 'de' and 'en' are accepted; "
            "unknown fields are rejected."
        ),
        responses={
            200: {"description": "The language as stored.", "model": ReplayLanguage},
            **error_responses(413, 415, 422),
        },
        openapi_extra=body_description(ReplayLanguageUpdate, "The new language."),
    )
    def write_language(body: JsonBody) -> Response:
        def run() -> Response:
            update = parse_body(body, ReplayLanguageUpdate)
            stored = ReplayLanguage(language=settings.set_language(update.language))
            return JSONResponse(content=stored.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.get(
        "/settings/test-run-broker",
        operation_id="read_test_run_broker",
        summary="Read the broker for test runs",
        description=(
            "Returns the broker whose data a test run uses: the chosen broker if it still "
            "occurs in the data stock, otherwise the first broker of the data stock in "
            "alphabetical order (``chosen`` tells which); ``null`` only if the data stock has "
            "no broker. Responds with HTTP 503 if the stored choice is no valid name; a valid "
            "write repairs it."
        ),
        responses={
            200: {"description": "The broker for test runs.", "model": ReplayBrokerForTestRuns},
            **error_responses(503),
        },
    )
    def read_test_run_broker() -> Response:
        def run() -> Response:
            body = _applying(marketdata.test_run_broker())
            return JSONResponse(content=body.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.put(
        "/settings/test-run-broker",
        operation_id="write_test_run_broker",
        summary="Choose the broker for test runs",
        description=(
            "Stores the broker whose data a test run uses. Only a broker that occurs in the "
            "data stock is accepted (HTTP 422 otherwise); ``null`` removes the choice. The "
            "answer is the broker that applies afterwards."
        ),
        responses={
            200: {
                "description": "The broker for test runs that applies.",
                "model": ReplayBrokerForTestRuns,
            },
            **error_responses(413, 415, 422, 503),
        },
        openapi_extra=body_description(
            ReplayBrokerForTestRunsUpdate, "The broker chosen for test runs."
        ),
    )
    def write_test_run_broker(body: JsonBody) -> Response:
        def run() -> Response:
            update = parse_body(body, ReplayBrokerForTestRunsUpdate)
            stored = _applying(marketdata.set_test_run_broker(update.broker))
            return JSONResponse(content=stored.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.get(
        "/settings/files",
        operation_id="read_file_settings",
        summary="Read the settings for files",
        description=(
            'Returns "keep imported files" (the preset of the box of the import, false as '
            "long as nothing is stored) and the storage, import and export directory in force: "
            "the stored one or, with ``is_default`` true, the default of the operating system "
            "(``path`` is null if that cannot be determined). Responds with HTTP 503 if a "
            "stored directory is not an absolute path; a valid write repairs it."
        ),
        responses={
            200: {"description": "The settings for files.", "model": ReplayFileSettings},
            **error_responses(503),
        },
    )
    def read_file_settings() -> Response:
        def run() -> Response:
            body = _file_settings_model(settings.get_files())
            return JSONResponse(content=body.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.put(
        "/settings/files",
        operation_id="write_file_settings",
        summary="Change the settings for files",
        description=(
            "Stores all four settings for files at once. A directory is an absolute path or null "
            "(the default applies). Before anything is stored every path is checked: absolute; "
            "the directory exists or is created; writable (storage and export directory) or "
            "readable (import directory). HTTP 422 names the place of every refused directory "
            "in ``errors`` with the reason as ``type`` (``not_absolute``, ``not_a_directory``, "
            "``cannot_be_created``, ``not_writable``, ``not_readable``); nothing is stored then. "
            "A change does not move files: kept files in the old storage directory stay there. "
            "The answer is the settings in force afterwards."
        ),
        responses={
            200: {"description": "The settings as stored.", "model": ReplayFileSettings},
            **error_responses(413, 415, 422, 503),
        },
        openapi_extra=body_description(ReplayFileSettingsUpdate, "The new settings for files."),
    )
    def write_file_settings(body: JsonBody) -> Response:
        def run() -> Response:
            update = parse_body(body, ReplayFileSettingsUpdate)
            stored = settings.set_files(
                keep_imported_files=update.keep_imported_files,
                storage_directory=update.storage_directory,
                import_directory=update.import_directory,
                export_directory=update.export_directory,
            )
            return JSONResponse(content=_file_settings_model(stored).model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.get(
        "/revision",
        operation_id="read_revision",
        summary="Read the revision pipwerk replay runs from",
        description=(
            "Returns the Git commit of the working tree pipwerk replay runs from, determined "
            "once at startup. The revision and the commit are null if the revision is not "
            "determinable; the date is null if it is not determinable."
        ),
        responses={200: {"description": "The revision.", "model": ReplayRevision}},
    )
    def read_revision() -> ReplayRevision:
        if revision is None:
            return ReplayRevision(revision=None, commit=None, committed_at=None)
        return ReplayRevision(
            revision=revision.short, commit=revision.commit, committed_at=revision.committed_at
        )

    return router
