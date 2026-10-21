"""The data stock of pipwerk replay: the service in front of ``pipwerk_marketdata``.

The service connects the library with the settings of pipwerk replay and applies the limits of
specification 11 (a file is limited in size and in rows, the number of imports that run at the
same time is limited, lists in answers are cut). It knows no HTTP; ``marketdata_api.py``
connects it with the web API.
"""

from __future__ import annotations

import threading
from collections.abc import Iterator, Sequence
from contextlib import contextmanager

from pipwerk_marketdata import (
    TICKS,
    Completeness,
    ImportLimits,
    ImportResult,
    InstrumentInfo,
    Interval,
    MarketDataStore,
    MissingPart,
    SeriesOverview,
)

from pipwerk_replay import marketdata_models as models
from pipwerk_replay.config import MarketDataSettings
from pipwerk_replay.settings_service import SettingsService


class TooManyRunningError(Exception):
    """Raised when the number of imports (or acquisitions) that may run at once is reached."""


class NoBrokerError(Exception):
    """Raised when a check needs a broker and none is given and no default source is set."""


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


def _periods(items: Sequence[Interval], maximum: int) -> list[models.Period]:
    return [models.Period.model_validate(item) for item in items[:maximum]]


def _missing(items: Sequence[MissingPart], maximum: int) -> list[models.MissingPeriod]:
    return [models.MissingPeriod.model_validate(item) for item in items[:maximum]]


class MarketDataService:
    """Import, overview, instrument data and completeness of the data stock."""

    def __init__(
        self,
        store: MarketDataStore,
        settings: MarketDataSettings,
        defaults: SettingsService,
    ) -> None:
        self._store = store
        self._settings = settings
        self._defaults = defaults
        self._limits = import_limits(settings)
        self._imports = ConcurrencyLimit(settings.max_concurrent_imports)

    @property
    def settings(self) -> MarketDataSettings:
        return self._settings

    # ----- import -----------------------------------------------------------------------

    def import_json(self, data: bytes) -> models.ImportResult:
        """Import a JSON file. ``ImportFileError`` if the file is refused as a whole,
        ``TooManyRunningError`` if the imports that may run at once are running."""
        with self._imports.hold():
            return to_import_result(self._store.import_json(data, self._limits))

    def import_csv(self, data: bytes, query: models.CsvImportQuery) -> models.ImportResult:
        """Import a CSV file with the series that the caller names."""
        with self._imports.hold():
            return to_import_result(
                self._store.import_csv(
                    data,
                    kind=query.kind,
                    broker=query.broker,
                    instrument=query.instrument,
                    timezone=query.timezone,
                    time_unit=query.time_unit,
                    limits=self._limits,
                )
            )

    # ----- reading ----------------------------------------------------------------------

    def overview(self, query: models.OverviewQuery) -> models.Overview:
        """The series and instruments, cut to the section of the query.

        The computation of the library reads all times of every series (see its documentation);
        only the answer is limited."""
        maximum = self._settings.max_listed_items
        limit = maximum if query.limit is None else query.limit
        data = self._store.overview()
        first, last = query.offset, query.offset + limit
        return models.Overview(
            series=[self._series(item) for item in data.series[first:last]],
            series_total=len(data.series),
            instruments=[
                models.InstrumentEntry.model_validate(item) for item in data.instruments[first:last]
            ],
            instruments_total=len(data.instruments),
            offset=query.offset,
            limit=limit,
        )

    def _series(self, item: SeriesOverview) -> models.SeriesOverview:
        maximum = self._settings.max_listed_items
        return models.SeriesOverview(
            broker=item.broker,
            instrument=item.instrument,
            unit=item.unit,
            count=item.count,
            first=item.first,
            last=item.last,
            covered=_periods(item.covered, maximum),
            covered_count=len(item.covered),
            missing=_missing(item.missing, maximum),
            missing_count=len(item.missing),
            has_trading_hours=item.has_trading_hours,
        )

    def instrument(self, query: models.InstrumentQuery) -> models.InstrumentInfo | None:
        """The newest instrument data, ``None`` if there is none."""
        info: InstrumentInfo | None = self._store.instrument_info(
            query.broker, query.instrument, query.as_of
        )
        return None if info is None else models.InstrumentInfo.model_validate(info)

    # ----- completeness -----------------------------------------------------------------

    def broker_for(self, broker: str | None) -> str:
        """The broker a check is about: the given one, else the default source.

        ``NoBrokerError`` if there is neither; ``StoredDefaultSourceInvalidError`` if the stored
        default source is not a valid name."""
        if broker is not None:
            return broker
        default = self._defaults.get_default_source()
        if default is None:
            raise NoBrokerError
        return default

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


def to_import_result(result: ImportResult) -> models.ImportResult:
    """The answer model of the result of an import."""
    return models.ImportResult.model_validate(result)
