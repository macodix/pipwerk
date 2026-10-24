"""Running the relay until it is stopped, and the log of the process."""

import logging
import signal
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from types import FrameType

from pipwerk_relay.errors import ConfigRejected, NotConfigured
from pipwerk_relay.relay import Relay

LOGGER = logging.getLogger("pipwerk_relay.service")
LOG_FORMAT = "%(asctime)sZ %(levelname)s %(name)s %(message)s"


def _stop_signals() -> list[signal.Signals]:
    names = ("SIGINT", "SIGTERM", "SIGBREAK")
    return [getattr(signal, name) for name in names if hasattr(signal, name)]


@contextmanager
def stop_on_signals(stop: threading.Event) -> Iterator[None]:
    """Set ``stop`` when the process is asked to end (Ctrl+C, ``SIGTERM``, on Windows
    ``SIGBREAK``); the earlier handlers are back afterwards.

    Handlers can only be installed in the main thread; in another thread nothing is changed.
    """

    def request_stop(_number: int, _frame: FrameType | None) -> None:
        stop.set()

    if threading.current_thread() is not threading.main_thread():
        yield
        return
    previous = {number: signal.signal(number, request_stop) for number in _stop_signals()}
    try:
        yield
    finally:
        for number, old in previous.items():
            signal.signal(number, old)


def run_until_stopped(relay: Relay, stop: threading.Event) -> None:
    """Do rounds of work with pauses until ``stop`` is set.

    A round that fails (a database that is locked for long, a full disk) is noted in the log
    with the name of the error and the next round tries again. An operating configuration that
    cannot be used ends the loop with the error.
    """
    while not stop.is_set():
        try:
            relay.cycle()
        except NotConfigured, ConfigRejected:
            raise
        except Exception as error:
            LOGGER.error("a round failed (%s); the next round tries again", type(error).__name__)
        stop.wait(relay.pause_seconds)


def configure_logging(level: str, log_file: Path | None) -> logging.Handler:
    """Send the log of the relay and its library to a file or to the standard error output.

    The time is UTC. Returns the handler, so the caller can remove it again.
    """
    handler: logging.Handler
    handler = (
        logging.FileHandler(log_file, encoding="utf-8") if log_file else logging.StreamHandler()
    )
    formatter = logging.Formatter(LOG_FORMAT, "%Y-%m-%dT%H:%M:%S")
    formatter.converter = time.gmtime
    handler.setFormatter(formatter)
    for name in ("pipwerk_relay", "pipwerk_relaycore"):
        logger = logging.getLogger(name)
        logger.setLevel(level)
        logger.addHandler(handler)
    return handler


def remove_logging(handler: logging.Handler) -> None:
    for name in ("pipwerk_relay", "pipwerk_relaycore"):
        logging.getLogger(name).removeHandler(handler)
    handler.close()
