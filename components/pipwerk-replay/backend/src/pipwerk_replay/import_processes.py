"""The import processes of the data stock (specification 5.3 and 5.5).

An import process exists in the backend from its beginning to its end or abort, also between the
requests of its files. It ends by itself when no request of it arrives for the idle timeout of
the startup configuration (``import_idle_timeout_seconds``, default 5 minutes). While a process
exists, data cannot be deleted (specification 5.5). The processes live in the memory of the
backend: after a restart none exists, and the interface starts a new one.

The class knows no HTTP and no data stock; ``MarketDataService`` uses it. All methods are safe
to call from several threads.
"""

from __future__ import annotations

import threading
import time
import uuid
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass


class ImportProcessNotFoundError(Exception):
    """The import process does not exist: it never did, it has ended or its time has run out."""


class ImportGoingOnError(Exception):
    """An import process exists (or a file is being imported): the data stock is not deleted
    from (specification 5.5)."""


@dataclass(frozen=True, slots=True)
class ImportProcessSummary:
    """A process as it is or as it ended: its identifier, the files it took over and the files
    it refused so far."""

    id: str
    imported_count: int
    refused_count: int


@dataclass(slots=True)
class _Process:
    id: str
    last_request: float
    running: int = 0
    imported_count: int = 0
    refused_count: int = 0


class ImportProcesses:
    """The import processes that exist, with their idle timeout."""

    def __init__(
        self, idle_timeout_seconds: float, clock: Callable[[], float] = time.monotonic
    ) -> None:
        if idle_timeout_seconds <= 0:
            raise ValueError("the idle timeout must be positive")
        self._timeout = idle_timeout_seconds
        self._clock = clock
        self._lock = threading.Lock()
        self._processes: dict[str, _Process] = {}
        #: Files being imported now, also of a process that was ended meanwhile.
        self._files_running = 0

    @property
    def idle_timeout_seconds(self) -> float:
        return self._timeout

    def _expire(self) -> None:
        """Remove the processes without a request for the idle timeout (caller holds the lock).
        A process with a file being imported never runs out."""
        now = self._clock()
        for key in [
            key
            for key, process in self._processes.items()
            if process.running == 0 and now - process.last_request > self._timeout
        ]:
            del self._processes[key]

    def begin(self) -> ImportProcessSummary:
        """Begin a process."""
        with self._lock:
            self._expire()
            process = _Process(str(uuid.uuid4()), self._clock())
            self._processes[process.id] = process
            return ImportProcessSummary(process.id, 0, 0)

    def exists(self) -> bool:
        """Whether an import is going on: a process exists, or a file is being imported (also of
        a process that was ended while its file was taken over)."""
        with self._lock:
            self._expire()
            return bool(self._processes) or self._files_running > 0

    @contextmanager
    def exclusive(self) -> Iterator[None]:
        """Hold the processes still while the body runs, if none exists: no process can begin
        and no request of a file can start until the body is done. ``ImportGoingOnError`` if an
        import is going on. The body must not call other methods of this object."""
        with self._lock:
            self._expire()
            if self._processes or self._files_running > 0:
                raise ImportGoingOnError
            yield

    @contextmanager
    def request(self, process_id: str) -> Iterator[None]:
        """A request of a file of the process: the process counts as active until it ends and its
        idle time starts again after it. ``ImportProcessNotFoundError`` if it does not exist."""
        with self._lock:
            self._expire()
            process = self._processes.get(process_id)
            if process is None:
                raise ImportProcessNotFoundError
            process.running += 1
            self._files_running += 1
            process.last_request = self._clock()
        try:
            yield
        finally:
            with self._lock:
                process.running -= 1
                self._files_running -= 1
                process.last_request = self._clock()

    def counted(self, process_id: str, *, imported: bool) -> None:
        """Count a file of the process as taken over (``imported``) or refused. A process that
        has ended meanwhile (aborted by another request) is not an error."""
        with self._lock:
            process = self._processes.get(process_id)
            if process is None:
                return
            if imported:
                process.imported_count += 1
            else:
                process.refused_count += 1

    def end(self, process_id: str) -> ImportProcessSummary:
        """End (or abort) a process. A file that is being imported is finished first by its own
        request; the process is gone for the following ones. ``ImportProcessNotFoundError`` if it
        does not exist."""
        with self._lock:
            self._expire()
            process = self._processes.pop(process_id, None)
            if process is None:
                raise ImportProcessNotFoundError
            return ImportProcessSummary(process.id, process.imported_count, process.refused_count)
