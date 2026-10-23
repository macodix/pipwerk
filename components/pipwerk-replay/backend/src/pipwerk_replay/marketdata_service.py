"""The data stock of pipwerk replay: the service in front of ``pipwerk_marketdata``.

The service connects the library with the settings of pipwerk replay and applies the limits of
specification 5.3 and 11 (a file is limited in size and in rows, an import in the number and the
total size of its files, the number of imports that run at the same time is limited, lists in
answers are cut). It knows no HTTP; ``marketdata_api.py`` connects it with the web API.
"""

from __future__ import annotations

import threading
from collections.abc import Iterator, Sequence
from contextlib import contextmanager
from dataclasses import dataclass

from pipwerk_marketdata import (
    TICKS,
    Completeness,
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
from pipwerk_replay.settings_service import SettingsService


class TooManyRunningError(Exception):
    """Raised when the number of imports that may run at once is reached."""


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
    """The limits of one uploaded file and of one import from the settings."""
    return ImportLimits(
        max_bytes=settings.max_upload_bytes,
        max_rows=settings.max_rows,
        max_reported_rejections=settings.max_reported_rejections,
        max_files=settings.max_files_per_import,
        max_batch_bytes=settings.max_import_bytes,
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
    """Import, list of series, details, brokers, instrument data and completeness."""

    def __init__(
        self,
        store: MarketDataStore,
        settings: MarketDataSettings,
        stored: SettingsService,
    ) -> None:
        self._store = store
        self._settings = settings
        self._stored = stored
        self._limits = import_limits(settings)
        self._imports = ConcurrencyLimit(settings.max_concurrent_imports)

    @property
    def settings(self) -> MarketDataSettings:
        return self._settings

    # ----- import -----------------------------------------------------------------------

    def import_files(self, form: ImportForm) -> models.ImportOutcome:
        """Import the files of one process, each in a transaction of its own.

        ``ImportBatchError`` if the process has no file, too many or is too large together
        (nothing is read then); a refused file is a result in the outcome and does not stop the
        others. ``TooManyRunningError`` if the imports that may run at once are running."""
        files = [
            ImportFile(
                name=item.name,
                content=item.content,
                format=detect_format(item.name, item.content),
                instrument=item.instrument,
                data=item.data,
            )
            for item in form.files
        ]
        with self._imports.hold():
            batch = self._store.import_files(
                files, broker=form.broker, timezone=form.timezone, limits=self._limits
            )
        outcomes = [models.FileOutcome.model_validate(item) for item in batch.files]
        refused = sum(1 for item in outcomes if item.refused)
        return models.ImportOutcome(
            files=outcomes, imported_count=len(outcomes) - refused, refused_count=refused
        )

    def preview(self, files: Sequence[FormFile]) -> models.ImportPreview:
        """What the files say about themselves, without importing anything.

        A JSON file names broker, instrument and data in its content (the instrument from its
        name if the content has none); a CSV file only in its name, as far as it does (the
        content of a CSV file is not read). Nothing is written."""
        with self._imports.hold():
            hints = [self._hint(item) for item in files]
        brokers = {item.broker for item in hints if item.format == "json"}
        json_found = any(item.format == "json" for item in hints)
        common = next(iter(brokers)) if json_found and len(brokers) == 1 else None
        return models.ImportPreview(files=hints, broker=common)

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

    def test_run_broker(self) -> BrokerForTestRuns:
        """The broker a test run uses (specification 5.1): the chosen one if it still occurs in
        the data stock, otherwise the first broker of the data stock in alphabetical order.

        ``StoredTestRunBrokerInvalidError`` if the stored choice is no valid name."""
        brokers = self._store.brokers()
        chosen = self._stored.get_test_run_broker()
        if chosen is not None and chosen in brokers:
            return BrokerForTestRuns(chosen, True)
        return BrokerForTestRuns(brokers[0] if brokers else None, False)

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
