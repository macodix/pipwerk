"""Running the relay until it is stopped, and the log of the process."""

import logging
import threading
import time
from pathlib import Path

from pipwerk_relay.errors import ConfigRejected, NotConfigured
from pipwerk_relay.relay import Relay

LOGGER = logging.getLogger("pipwerk_relay.service")
LOG_FORMAT = "%(asctime)sZ %(levelname)s %(name)s %(message)s"


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
