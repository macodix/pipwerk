"""The data stock of pipwerk replay: the service in front of ``pipwerk_marketdata``.

The service connects the library with the settings of pipwerk replay and applies the limits of
specification 5.3 and 11 (a file is limited in size and in rows, an import has no limit for the
number or the total size of its files, the number of files that are imported at the same time is
limited, lists in answers are cut). It keeps the import processes (``import_processes.py``) and
refuses to delete while one exists (specification 5.5). It knows no HTTP; ``marketdata_api.py``
connects it with the web API.
"""

from __future__ import annotations

import threading
from collections.abc import Callable, Iterator, Sequence
from contextlib import contextmanager
from dataclasses import dataclass

from pipwerk_marketdata import (
    TICKS,
    Completeness,
    Deletion,
    FileFormat,
    ImportFile,
    ImportLimits,
    InstrumentInfo,
    Interval,
    MarketDataStore,
    MissingPart,
    inspect_json,
    recognize_filename,
)

from pipwerk_replay import marketdata_models as models
from pipwerk_replay.config import MarketDataSettings
from pipwerk_replay.import_form import FormFile, ImportForm
from pipwerk_replay.import_processes import (
    ImportGoingOnError,
    ImportProcesses,
    ImportProcessNotFoundError,
)
from pipwerk_replay.settings_service import SettingsService, StoredTestRunBrokerInvalidError

__all__ = [
    "BrokerForTestRuns",
    "BrokerNotInDataStockError",
    "ConcurrencyLimit",
    "ImportGoingOnError",
    "ImportProcessNotFoundError",
    "MarketDataService",
    "NoBrokerError",
    "TooManyRunningError",
    "detect_format",
    "import_limits",
]


class TooManyRunningError(Exception):
    """Raised when the number of files that may be imported at once is reached."""


class NoBrokerError(Exception):
    """Raised when a check needs a broker and none is given and the data stock has none."""


class BrokerNotInDataStockError(Exception):
    """Raised when a broker is to be chosen for test runs that does not occur in the data stock."""


class ConcurrencyLimit:
    """At most ``maximum`` holders at the same time; a further one is refused, not queued."""

    def __init__(self, maximum: int) -> None:
        self._semaphore = threading.BoundedSemaphore(maximum)

    @contextmanager
    def hold(self) -> Iterator[None]:
        if not self._semaphore.acquire(blocking=False):
            raise TooManyRunningError
        try:
            yield
        finally:
            self._semaphore.release()


def import_limits(settings: MarketDataSettings) -> ImportLimits:
    """The limits of one uploaded file from the settings."""
    return ImportLimits(
        max_bytes=settings.max_upload_bytes,
        max_rows=settings.max_rows,
        max_reported_rejections=settings.max_reported_rejections,
    )


def detect_format(name: str, content: bytes) -> FileFormat:
    """The format of a file of an import: from the extension of its name (``.json``; ``.csv`` and
    ``.txt`` for CSV), otherwise from its content (JSON if the first character that is no
    blank is ``{``, else CSV). The name is only read."""
    extension = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if extension == "json":
        return FileFormat.JSON
    if extension in ("csv", "txt"):
        return FileFormat.CSV
    start = content[:1024].lstrip(b"\xef\xbb\xbf \t\r\n")
    return FileFormat.JSON if start.startswith(b"{") else FileFormat.CSV


def _periods(items: Sequence[Interval], maximum: int) -> list[models.Period]:
    return [models.Period.model_validate(item) for item in items[:maximum]]


def _missing(items: Sequence[MissingPart], maximum: int) -> list[models.MissingPeriod]:
    return [models.MissingPeriod.model_validate(item) for item in items[:maximum]]


@dataclass(frozen=True, slots=True)
class BrokerForTestRuns:
    """The broker for test runs: ``broker`` is the one that applies (``None`` only if the data
    stock has no broker at all), ``chosen`` tells whether it is the one that was chosen (otherwise
    it is the first broker of the data stock in alphabetical order)."""

    broker: str | None
    chosen: bool


class MarketDataService:
    """Import, deleting, list of series, details, brokers, instrument data and completeness."""

    def __init__(
        self,
        store: MarketDataStore,
        settings: MarketDataSettings,
        stored: SettingsService,
        processes: ImportProcesses | None = None,
    ) -> None:
        self._store = store
        self._settings = settings
        self._stored = stored
        self._limits = import_limits(settings)
        self._imports = ConcurrencyLimit(settings.max_concurrent_imports)
        self._processes = processes or ImportProcesses(settings.import_idle_timeout_seconds)

    @property
    def settings(self) -> MarketDataSettings:
        return self._settings

    # ----- import -----------------------------------------------------------------------

    def begin_import(self) -> models.ImportProcess:
        """Begin an import process. It exists until it is ended or aborted, or until no request
        of it has arrived for the idle timeout (specification 5.5)."""
        started = self._processes.begin()
        return models.ImportProcess(
            id=started.id, idle_timeout_seconds=int(self._processes.idle_timeout_seconds)
        )

    def import_file(self, process_id: str, form: ImportForm) -> models.FileOutcome:
        """Import one file of an import process in a transaction of its own.

        A file that is refused as a whole is a result (``refused``) and does not end the
        process. ``ImportProcessNotFoundError`` if the process does not exist (any more),
        ``TooManyRunningError`` if the files that may be imported at once are being imported."""
        file = form.file
        with self._processes.request(process_id), self._imports.hold():
            # A broker that left the data stock without the knowledge of this service is not
            # chosen again by importing it (specification 5.5).
            self._forget_missing_broker()
            batch = self._store.import_files(
                [
                    ImportFile(
                        name=file.name,
                        content=file.content,
                        format=detect_format(file.name, file.content),
                        instrument=file.instrument,
                        data=file.data,
                    )
                ],
                broker=form.broker,
                timezone=form.timezone,
                limits=self._limits,
            )
        outcome = models.FileOutcome.model_validate(batch.files[0])
        self._processes.counted(process_id, imported=not outcome.refused)
        return outcome

    def end_import(self, process_id: str, *, aborted: bool) -> models.ImportProcessEnd:
        """End an import process (``aborted`` for an abort). Files that were taken over stay
        taken over. ``ImportProcessNotFoundError`` if the process does not exist (any more)."""
        summary = self._processes.end(process_id)
        return models.ImportProcessEnd(
            id=summary.id,
            state="aborted" if aborted else "finished",
            imported_count=summary.imported_count,
            refused_count=summary.refused_count,
        )

    def preview(self, item: FormFile) -> models.FileHint:
        """What a file says about itself, without importing anything.

        A JSON file names broker, instrument and data in its content (the instrument from its
        name if the content has none); a CSV file only in its name, as far as it does (the
        content of a CSV file is not read). Nothing is written."""
        with self._imports.hold():
            return self._hint(item)

    def _hint(self, item: FormFile) -> models.FileHint:
        named = recognize_filename(item.name)
        if detect_format(item.name, item.content) is FileFormat.CSV:
            return models.FileHint(
                name=item.name,
                format="csv",
                broker=None,
                instrument=named.instrument,
                data=named.data,
                error=None,
            )
        found = inspect_json(item.content, self._limits)
        return models.FileHint(
            name=item.name,
            format="json",
            broker=found.broker,
            instrument=found.instrument or named.instrument,
            data=found.data,
            error=found.error,
        )

    # ----- deleting -------------------------------------------------------------------------

    def delete_series(self, request: models.SeriesDeletionRequest) -> models.DeletionResult:
        """What deleting a whole series would remove or, with ``confirm``, delete it.

        ``DeletionError`` for an unknown broker, instrument or series; ``ImportGoingOnError``
        while an import process exists. The same holds for the other deletions."""
        return self._delete(
            request.confirm,
            lambda: self._store.plan_delete_series(
                request.broker, request.instrument, request.data
            ),
            lambda: self._store.delete_series(request.broker, request.instrument, request.data),
        )

    def delete_period(self, request: models.PeriodDeletionRequest) -> models.DeletionResult:
        """What deleting a period of a series would remove or, with ``confirm``, delete it."""
        return self._delete(
            request.confirm,
            lambda: self._store.plan_delete_period(
                request.broker, request.instrument, request.data, request.start, request.end
            ),
            lambda: self._store.delete_period(
                request.broker, request.instrument, request.data, request.start, request.end
            ),
        )

    def delete_contract(self, request: models.ContractDeletionRequest) -> models.DeletionResult:
        """What deleting the instrument data of an instrument would remove or, with ``confirm``,
        delete them."""
        return self._delete(
            request.confirm,
            lambda: self._store.plan_delete_contract(request.broker, request.instrument),
            lambda: self._store.delete_contract(request.broker, request.instrument),
        )

    def delete_broker(self, request: models.BrokerDeletionRequest) -> models.DeletionResult:
        """What deleting all data of a broker would remove or, with ``confirm``, delete it."""
        return self._delete(
            request.confirm,
            lambda: self._store.plan_delete_broker(request.broker),
            lambda: self._store.delete_broker(request.broker),
        )

    def _delete(
        self, confirm: bool, plan: Callable[[], Deletion], execute: Callable[[], Deletion]
    ) -> models.DeletionResult:
        """Plan or delete while no import process exists and none can begin; after a deletion
        that removes the chosen broker from the data stock, no broker is chosen for test runs."""
        with self._processes.exclusive():
            chosen = self._chosen_broker()
            done = execute() if confirm else plan()
            reset = done.broker_removed and chosen == done.broker
            if confirm and reset:
                self._stored.set_test_run_broker(None)
            applying = self._applying_broker(chosen=None if confirm and reset else chosen)
        return models.DeletionResult(
            kind=done.kind.value,
            deleted=confirm,
            broker=done.broker,
            instrument=done.instrument,
            data=done.data,
            start=done.start,
            end=done.end,
            candle_count=done.candle_count,
            tick_count=done.tick_count,
            series_count=done.series_count,
            instrument_count=done.instrument_count,
            broker_removed=done.broker_removed,
            test_run_broker_reset=reset,
            test_run_broker=models.BrokerForTestRuns(
                broker=applying.broker, chosen=applying.chosen
            ),
        )

    # ----- list of series, details, brokers -----------------------------------------------

    def brokers(self) -> models.Brokers:
        """The brokers that occur in the data stock, sorted."""
        return models.Brokers(items=list(self._store.brokers()))

    def series(self, query: models.SeriesQuery) -> models.SeriesPage:
        """The rows of the list of series that match the filters, cut to the page of the query.

        ``limit`` of the query is at most ``max_listed_items`` (the caller checks that)."""
        limit = self._settings.max_listed_items if query.limit is None else query.limit
        page = self._store.list_series(
            broker=query.broker,
            instrument=query.instrument,
            data=query.data,
            offset=query.offset,
            limit=limit,
        )
        return models.SeriesPage(
            items=[models.SeriesRow.model_validate(item) for item in page.items],
            total=page.total,
            offset=query.offset,
            limit=limit,
        )

    def series_details(self, query: models.SeriesDetailsQuery) -> models.SeriesDetails | None:
        """The gaps of a row of the list and the instrument data at its broker; ``None`` if the
        list has no such row (also for an identifier of data that does not exist)."""
        if query.data not in models.DATA_IDENTIFIERS:
            return None
        found = self._store.series_details(query.broker, query.instrument, query.data)
        if found is None:
            return None
        contract = found.contract
        return models.SeriesDetails(
            row=models.SeriesRow.model_validate(found.row),
            gaps=_missing(found.gaps, self._settings.max_listed_items),
            contract=None if contract is None else models.InstrumentInfo.model_validate(contract),
        )

    def instrument(self, query: models.InstrumentQuery) -> models.InstrumentInfo | None:
        """The newest instrument data, ``None`` if there is none."""
        info: InstrumentInfo | None = self._store.instrument_info(
            query.broker, query.instrument, query.as_of
        )
        return None if info is None else models.InstrumentInfo.model_validate(info)

    # ----- broker for test runs -------------------------------------------------------------

    def _chosen_broker(self) -> str | None:
        """The broker chosen for test runs as stored; ``None`` if none is chosen or the stored
        value is no valid name (the choice is repaired by the next valid write)."""
        try:
            return self._stored.get_test_run_broker()
        except StoredTestRunBrokerInvalidError:
            return None

    def _applying_broker(self, chosen: str | None) -> BrokerForTestRuns:
        brokers = self._store.brokers()
        if chosen is not None and chosen in brokers:
            return BrokerForTestRuns(chosen, True)
        return BrokerForTestRuns(brokers[0] if brokers else None, False)

    def _forget_missing_broker(self) -> bool:
        """Remove the choice of the broker for test runs if that broker no longer occurs in the
        data stock (it left it by any way: deleting its data, or deleting its last period).
        Returns whether the choice was removed. Specification 5.1 and 5.5: a later import of the
        same broker does not choose it again."""
        chosen = self._chosen_broker()
        if chosen is not None and chosen not in self._store.brokers():
            self._stored.set_test_run_broker(None)
            return True
        return False

    def test_run_broker(self) -> BrokerForTestRuns:
        """The broker a test run uses (specification 5.1): the chosen one if it still occurs in
        the data stock, otherwise the first broker of the data stock in alphabetical order. A
        chosen broker that no longer occurs is no longer chosen.

        ``StoredTestRunBrokerInvalidError`` if the stored choice is no valid name."""
        self._stored.get_test_run_broker()  # raises if the stored value is invalid
        self._forget_missing_broker()
        return self._applying_broker(self._chosen_broker())

    def set_test_run_broker(self, broker: str | None) -> BrokerForTestRuns:
        """Choose the broker for test runs; ``None`` removes the choice.

        ``BrokerNotInDataStockError`` if the broker does not occur in the data stock,
        ``InvalidBrokerNameError`` if the name breaks the rule for names."""
        if broker is not None and broker not in self._store.brokers():
            raise BrokerNotInDataStockError
        self._stored.set_test_run_broker(broker)
        return self.test_run_broker()

    # ----- completeness -----------------------------------------------------------------

    def broker_for(self, broker: str | None) -> str:
        """The broker a check is about: the given one, else the broker for test runs.

        ``NoBrokerError`` if there is neither (the data stock has no broker)."""
        if broker is not None:
            return broker
        applying = self.test_run_broker().broker
        if applying is None:
            raise NoBrokerError
        return applying

    def completeness(self, request: models.CompletenessRequest) -> models.Completeness:
        """For every part: needed, present and missing, in the order of the request."""
        broker = self.broker_for(request.broker)
        return models.Completeness(
            broker=broker, results=[self._part(broker, part) for part in request.parts]
        )

    def _part(self, broker: str, part: models.Part) -> models.PartCompleteness:
        maximum = self._settings.max_listed_items
        if isinstance(part, models.InstrumentPart):
            exists = self._store.instrument_info(broker, part.instrument) is not None
            return models.PartCompleteness(
                needed=part,
                complete=exists,
                present=[],
                present_count=0,
                missing=[],
                missing_count=0,
            )
        unit = part.time_unit if isinstance(part, models.CandlesPart) else TICKS
        found: Completeness = self._store.completeness(
            broker, part.instrument, unit, part.start, part.end
        )
        return models.PartCompleteness(
            needed=part,
            complete=found.complete,
            present=_periods(found.present, maximum),
            present_count=len(found.present),
            missing=_missing(found.missing, maximum),
            missing_count=len(found.missing),
        )
