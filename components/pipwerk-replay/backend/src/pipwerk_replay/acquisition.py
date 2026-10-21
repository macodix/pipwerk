"""Acquisition of historical price data from a source (specification 5.4, E5).

pipwerk replay asks a source (``pipwerk-fetch-mt5`` or one with the same interface,
``contracts/api/pipwerk-fetch/v1/``) for the parts it lacks and imports what the source
delivers with ``pipwerk_marketdata``. Two parts:

- ``HttpSourceClient`` talks to the source over HTTP. The address and the shared key come from
  the startup configuration. The key goes only into the header ``Authorization`` of a request;
  it appears in no answer, no log and no error text. No redirect is followed, so the key is
  never sent to another address. An answer is read up to a limit.
- ``AcquisitionManager`` works off a list of parts in the background and keeps the state of
  each part, so the user interface can show the progress (``GET`` on the acquisition).

Every failure of a part becomes a ``PartFailure`` with a code and a fixed, readable reason; for
an error of the source the code and the reason are those the source gave.
"""

from __future__ import annotations

import json
import logging
import threading
import uuid
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Literal, Protocol

import httpx2
from pipwerk_marketdata import ImportFileError, ImportLimits, MarketDataStore, MarketDataStoreError
from pipwerk_marketdata import ImportResult as LibraryImportResult

from pipwerk_replay import marketdata_models as models
from pipwerk_replay.marketdata_service import TooManyRunningError

logger = logging.getLogger(__name__)

#: The codes of error of a source (``contracts/api/pipwerk-fetch/v1/``). A test compares the list
#: with the program ``pipwerk-fetch-mt5``.
SOURCE_ERROR_CODES = frozenset(
    {
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
    }
)

#: The own codes of pipwerk replay with their reasons (fixed texts, German like those of the
#: source).
NO_SOURCE = "no_source"
SOURCE_UNREACHABLE = "source_unreachable"
SOURCE_RESPONSE_INVALID = "source_response_invalid"
SOURCE_RESPONSE_TOO_LARGE = "source_response_too_large"
IMPORT_REFUSED = "import_refused"
DATA_STORE_ERROR = "data_store_error"
ACQUISITION_FAILED = "acquisition_failed"

REASONS = {
    NO_SOURCE: "Keine Quelle eingerichtet",
    SOURCE_UNREACHABLE: "Quelle nicht erreichbar",
    SOURCE_RESPONSE_INVALID: "Antwort der Quelle ungültig",
    SOURCE_RESPONSE_TOO_LARGE: "Antwort der Quelle zu groß",
    IMPORT_REFUSED: "Der Import hat die Datei der Quelle abgelehnt",
    DATA_STORE_ERROR: "Der Datenbestand konnte nicht geändert werden",
    ACQUISITION_FAILED: "Die Beschaffung ist fehlgeschlagen",
}

MAX_REASON_LENGTH = 300
#: Room in an answer of the source for what is not the file: the envelope and the omitted rows.
ENVELOPE_ALLOWANCE = 1024 * 1024
FETCH_PATH = "/api/v1/fetch"


class NoSourceError(Exception):
    """Raised when an acquisition is asked for and no source is set up."""


class AcquisitionNotFoundError(Exception):
    """Raised for an identifier of an acquisition that is unknown (or no longer kept)."""


class PartFailedError(Exception):
    """A part could not be acquired. ``code`` and ``reason`` are shown to the user."""

    def __init__(self, code: str, reason: str | None = None, file_error: str | None = None) -> None:
        super().__init__(code)
        self.code = code
        self.reason = REASONS[code] if reason is None else reason
        self.file_error = file_error


@dataclass(frozen=True, slots=True)
class SourceFile:
    """What a source delivered: the file in the JSON format of the import, and how many rows
    the source left out."""

    data: bytes
    omitted_count: int


class SourceClient(Protocol):
    """The connection to a source. ``fetch`` raises ``PartFailedError``."""

    def fetch(self, part: models.Part) -> SourceFile: ...


def _moment_text(moment: datetime) -> str:
    return moment.astimezone(UTC).isoformat().replace("+00:00", "Z")


def request_of(part: models.Part) -> dict[str, str]:
    """The request to the source (``POST /api/v1/fetch``) for a part."""
    if isinstance(part, models.InstrumentPart):
        return {"kind": "instrument", "instrument": part.instrument}
    request = {"kind": part.kind, "instrument": part.instrument}
    if isinstance(part, models.CandlesPart):
        request["time_unit"] = part.time_unit
    request["start"] = _moment_text(part.start)
    request["end"] = _moment_text(part.end)
    return request


def _readable(text: object) -> str | None:
    """A reason of the source as one line of text of reasonable length, else ``None``."""
    if not isinstance(text, str) or not text.strip():
        return None
    cleaned = "".join(char if char.isprintable() else " " for char in text).strip()
    return cleaned[:MAX_REASON_LENGTH]


def _reject_constant(_name: str) -> Any:
    raise ValueError("NaN and Infinity are no JSON")


def _loads(data: bytes) -> Any:
    try:
        return json.loads(data.decode("utf-8"), parse_constant=_reject_constant)
    except (ValueError, RecursionError) as error:
        raise PartFailedError(SOURCE_RESPONSE_INVALID) from error


def error_of_answer(data: bytes) -> PartFailedError:
    """The failure that an error answer of the source describes (``{"error": {...}}``); an
    answer in another form is an invalid answer."""
    body = _loads(data)
    error = body.get("error") if isinstance(body, dict) and len(body) == 1 else None
    if not isinstance(error, dict):
        return PartFailedError(SOURCE_RESPONSE_INVALID)
    code = error.get("code")
    reason = _readable(error.get("reason"))
    if not isinstance(code, str) or code not in SOURCE_ERROR_CODES or reason is None:
        return PartFailedError(SOURCE_RESPONSE_INVALID)
    return PartFailedError(code, reason)


def file_of_answer(data: bytes, part: models.Part) -> SourceFile:
    """The file of an answer of the source (``{"file": ..., "omitted_count": ...}``).

    The file must be the one asked for (kind, instrument and time unit); the import checks
    everything else."""
    body = _loads(data)
    if not isinstance(body, dict) or set(body) != {"file", "omitted_count", "omitted"}:
        raise PartFailedError(SOURCE_RESPONSE_INVALID)
    file, omitted_count = body["file"], body["omitted_count"]
    if (
        not isinstance(file, dict)
        or not isinstance(omitted_count, int)
        or isinstance(omitted_count, bool)
        or omitted_count < 0
        or not isinstance(body["omitted"], list)
    ):
        raise PartFailedError(SOURCE_RESPONSE_INVALID)
    is_asked_for = file.get("kind") == part.kind and file.get("instrument") == part.instrument
    if isinstance(part, models.CandlesPart):
        is_asked_for = is_asked_for and file.get("time_unit") == part.time_unit
    if not is_asked_for:
        raise PartFailedError(SOURCE_RESPONSE_INVALID)
    try:
        text = json.dumps(file, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
    except (ValueError, RecursionError) as error:
        raise PartFailedError(SOURCE_RESPONSE_INVALID) from error
    return SourceFile(text.encode("utf-8"), omitted_count)


class HttpSourceClient:
    """The connection to a source over HTTP.

    ``client`` is the HTTP client; without it one is created for ``url``. Tests pass the test
    client of FastAPI, which sends the requests to the replica of the source without a network.
    """

    def __init__(
        self,
        url: str,
        key: str,
        *,
        timeout_seconds: float,
        max_response_bytes: int,
        client: httpx2.Client | None = None,
    ) -> None:
        self._key = key
        self._timeout = httpx2.Timeout(timeout_seconds, connect=min(timeout_seconds, 10.0))
        self._max_response_bytes = max_response_bytes
        self._client = client if client is not None else httpx2.Client(base_url=url)

    def __repr__(self) -> str:
        return "HttpSourceClient()"

    def fetch(self, part: models.Part) -> SourceFile:
        try:
            with self._client.stream(
                "POST",
                FETCH_PATH,
                json=request_of(part),
                headers={"Authorization": f"Bearer {self._key}"},
                timeout=self._timeout,
                follow_redirects=False,
            ) as response:
                status = response.status_code
                data = self._read(response)
        except (httpx2.HTTPError, httpx2.InvalidURL) as error:
            # The text of the error is not used: it may name the address of the source.
            logger.warning("The source could not be reached (%s).", type(error).__name__)
            raise PartFailedError(SOURCE_UNREACHABLE) from None
        if status == 200:
            return file_of_answer(data, part)
        raise error_of_answer(data)

    def _read(self, response: httpx2.Response) -> bytes:
        chunks: list[bytes] = []
        size = 0
        for chunk in response.iter_bytes():
            size += len(chunk)
            if size > self._max_response_bytes:
                raise PartFailedError(SOURCE_RESPONSE_TOO_LARGE)
            chunks.append(chunk)
        return b"".join(chunks)


# --- the acquisitions -------------------------------------------------------------------------

PartState = Literal["queued", "running", "succeeded", "failed"]


@dataclass(slots=True)
class _PartRecord:
    part: models.Part
    state: PartState = "queued"
    result: models.ImportResult | None = None
    omitted_count: int | None = None
    failure: PartFailedError | None = None


@dataclass(slots=True)
class _Job:
    id: uuid.UUID
    created_at: datetime
    parts: list[_PartRecord]
    finished_at: datetime | None = None
    done: threading.Event = field(default_factory=threading.Event)


class AcquisitionManager:
    """Works off acquisitions in the background and keeps their state.

    One acquisition is one thread that asks the source for its parts one after the other. The
    number of acquisitions that run at once is limited (``max_running``); the next one is refused
    with ``TooManyRunningError``. The state of the last ``max_kept`` acquisitions is kept in memory
    (the oldest finished one goes first); it is gone after a restart of pipwerk replay.
    """

    def __init__(
        self,
        store: MarketDataStore,
        client: SourceClient | None,
        *,
        limits: ImportLimits,
        max_running: int,
        max_kept: int,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self._store = store
        self._client = client
        self._limits = limits
        self._max_running = max_running
        self._max_kept = max_kept
        self._clock = clock or (lambda: datetime.now(UTC))
        self._lock = threading.Lock()
        self._jobs: dict[uuid.UUID, _Job] = {}
        self._running = 0

    @property
    def configured(self) -> bool:
        """Whether a source is set up."""
        return self._client is not None

    def start(self, parts: Sequence[models.Part]) -> models.Acquisition:
        """Start an acquisition of ``parts`` and return its state.

        ``NoSourceError`` if no source is set up, ``TooManyRunningError`` if the acquisitions
        that may run at once are running."""
        client = self._client
        if client is None:
            raise NoSourceError
        with self._lock:
            if self._running >= self._max_running:
                raise TooManyRunningError
            job = _Job(
                id=uuid.uuid4(),
                created_at=self._clock(),
                parts=[_PartRecord(part) for part in parts],
            )
            self._jobs[job.id] = job
            self._running += 1
            self._evict()
            view = self._view(job)
        try:
            threading.Thread(
                target=self._run, args=(job, client), name=f"acquisition-{job.id}", daemon=True
            ).start()
        except BaseException:
            # No thread: the acquisition cannot run, so it must not count as running or be kept.
            with self._lock:
                self._running -= 1
                del self._jobs[job.id]
            raise
        return view

    def get(self, acquisition_id: uuid.UUID) -> models.Acquisition:
        """The state of an acquisition; ``AcquisitionNotFoundError`` if it is unknown."""
        with self._lock:
            job = self._jobs.get(acquisition_id)
            if job is None:
                raise AcquisitionNotFoundError
            return self._view(job)

    def wait(self, acquisition_id: uuid.UUID, timeout: float) -> bool:
        """Wait until an acquisition is finished (for tests); ``False`` after ``timeout``."""
        with self._lock:
            job = self._jobs.get(acquisition_id)
        if job is None:
            raise AcquisitionNotFoundError
        return job.done.wait(timeout)

    # ----- inside -----------------------------------------------------------------------

    def _evict(self) -> None:
        """Forget the oldest finished acquisitions beyond ``max_kept`` (the caller holds the
        lock). Acquisitions that run are never forgotten."""
        for identifier in list(self._jobs):
            if len(self._jobs) <= self._max_kept:
                return
            if self._jobs[identifier].done.is_set():
                del self._jobs[identifier]

    def _view(self, job: _Job) -> models.Acquisition:
        """The state as an answer (the caller holds the lock)."""
        return models.Acquisition(
            id=job.id,
            state="finished" if job.done.is_set() else "running",
            created_at=job.created_at,
            finished_at=job.finished_at,
            parts=[
                models.AcquisitionPart(
                    request=record.part,
                    state=record.state,
                    result=record.result,
                    omitted_count=record.omitted_count,
                    error=(
                        None
                        if record.failure is None
                        else models.PartFailure.model_validate(
                            {
                                "code": record.failure.code,
                                "reason": record.failure.reason,
                                "file_error": record.failure.file_error,
                            }
                        )
                    ),
                )
                for record in job.parts
            ],
        )

    def _run(self, job: _Job, client: SourceClient) -> None:
        try:
            for record in job.parts:
                self._work_off(record, client)
        finally:
            with self._lock:
                job.finished_at = self._clock()
                job.done.set()
                self._running -= 1
                self._evict()

    def _work_off(self, record: _PartRecord, client: SourceClient) -> None:
        with self._lock:
            record.state = "running"
        try:
            file = client.fetch(record.part)
            result = self._import(file)
        except PartFailedError as failure:
            self._finish(record, failure=failure)
        except Exception as error:  # a defect: the part fails, the others go on
            logger.error("An acquisition failed unexpectedly (%s).", type(error).__name__)
            self._finish(record, failure=PartFailedError(ACQUISITION_FAILED))
        else:
            self._finish(record, result=result, omitted_count=file.omitted_count)

    def _import(self, file: SourceFile) -> models.ImportResult:
        try:
            result: LibraryImportResult = self._store.import_json(file.data, self._limits)
        except ImportFileError as error:
            raise PartFailedError(IMPORT_REFUSED, file_error=error.code.value) from error
        except MarketDataStoreError as error:
            raise PartFailedError(DATA_STORE_ERROR) from error
        return models.ImportResult.model_validate(result)

    def _finish(
        self,
        record: _PartRecord,
        *,
        result: models.ImportResult | None = None,
        omitted_count: int | None = None,
        failure: PartFailedError | None = None,
    ) -> None:
        with self._lock:
            record.state = "failed" if failure is not None else "succeeded"
            record.result = result
            record.omitted_count = omitted_count
            record.failure = failure
