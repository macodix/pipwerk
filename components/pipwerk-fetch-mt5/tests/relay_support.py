"""A network for the tests of ``serve`` and ``request``.

The relay is not part of this order. The tests imitate what a relay does with an envelope
(specification relay 4.1) as far as the two components need it: read, check the check value, put
the own relay into ``hops``, pack for the next connection. Between the two components lie two such
steps and a directory between the relays, as in the tests of the library::

    ask --(ask_out)--> relay1 --(between_12)--> relay2 --(fetch_in)--> fetch
    ask <--(ask_in)--- relay1 <--(between_21)-- relay2 <--(fetch_out)-- fetch

``Network.relay_step`` moves everything one step. ``ServeSide`` is ``serve`` without its loop
(one ``poll`` at a time), so that a test decides when what happens.
"""

import io
import threading
import time
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from pipwerk_relaycore import (
    ConnectionKey,
    ConnectionSettings,
    Connector,
    Envelope,
    Message,
    ReceivedEnvelope,
    SecretsDirectory,
    load_way,
)
from support import ArchiveMt5Module, make_config

from pipwerk_fetch_mt5.config import StartupConfig, load_relay_settings
from pipwerk_fetch_mt5.mt5_gateway import Mt5Gateway
from pipwerk_fetch_mt5.relay.commands import RelayHooks
from pipwerk_fetch_mt5.relay.connection import open_connector
from pipwerk_fetch_mt5.relay.serve import RequestHandler

ASKER = "ask.net1.relay1"
RETRIEVAL = "fetch.net1.relay2"
RELAY_1 = "net1.relay1"
RELAY_2 = "net1.relay2"
CLOCK = datetime(2026, 1, 9, 8, 0, tzinfo=UTC)


def files_way(directory: Path) -> Any:
    return load_way("files", {"directory": str(directory)})


def forward(
    source: Path,
    source_keys: Mapping[str, ConnectionKey],
    me: str,
    target: Path,
    sender: str,
    recipient: str,
    key: ConnectionKey,
) -> int:
    """Take everything from ``source`` and put it, as the relay ``me``, into ``target``."""
    reading, writing = files_way(source), files_way(target)
    moved = 0
    for item in reading.read():
        if not isinstance(item, ReceivedEnvelope):
            continue  # not complete yet
        opened = item.envelope.open(source_keys, recipient=me)
        envelope = Envelope.create(
            opened.message, hops=(*opened.hops, me), sender=sender, recipient=recipient, key=key
        )
        writing.send(envelope, item.load())
        reading.acknowledge(item.token)
        moved += 1
    return moved


def private_directory(path: Path) -> Path:
    path.mkdir(parents=True)
    path.chmod(0o700)
    return path


@dataclass
class Network:
    """The directories, the keys and the startup configurations of the two components."""

    root: Path
    broker_lines: str = ""
    ask_out: Path = field(init=False)
    ask_in: Path = field(init=False)
    fetch_out: Path = field(init=False)
    fetch_in: Path = field(init=False)
    between_12: Path = field(init=False)
    between_21: Path = field(init=False)
    key_ask: ConnectionKey = field(init=False)
    key_fetch: ConnectionKey = field(init=False)
    key_relays: ConnectionKey = field(init=False)
    ask_ini: Path = field(init=False)
    fetch_ini: Path = field(init=False)

    def __post_init__(self) -> None:
        for name in ("ask_out", "ask_in", "fetch_out", "fetch_in", "between_12", "between_21"):
            directory = self.root / name
            directory.mkdir()
            setattr(self, name, directory)
        self.key_relays = ConnectionKey.generate()
        secrets_ask = private_directory(self.root / "secrets-ask")
        secrets_fetch = private_directory(self.root / "secrets-fetch")
        self.key_ask = SecretsDirectory(secrets_ask).new_key("link.key")
        self.key_fetch = SecretsDirectory(secrets_fetch).new_key("link.key")
        self.ask_ini = self.root / "ask.ini"
        self.ask_ini.write_text(
            self._relay_text(ASKER, secrets_ask, "ask", self.ask_out, self.ask_in),
            encoding="utf-8",
        )
        self.fetch_ini = self.root / "fetch.ini"
        self.fetch_ini.write_text(
            f"[broker]\nserver_time_zone = UTC\n{self.broker_lines}\n"
            + self._relay_text(RETRIEVAL, secrets_fetch, "fetch", self.fetch_out, self.fetch_in),
            encoding="utf-8",
        )

    def _relay_text(self, address: str, secrets: Path, name: str, target: Path, inbox: Path) -> str:
        return (
            f"[relay]\naddress = {address}\nway = files\nsecrets_directory = {secrets}\n"
            f"key_file = link.key\ndatabase = {self.root / 'state' / (name + '.db')}\n"
            f"poll_interval_seconds = 1\n\n[relay.way]\ntarget.directory = {target}\n"
            f"inbox.directory = {inbox}\n"
        )

    def relay_step(self) -> int:
        """Move everything one step; the number of envelopes moved."""
        moved = forward(
            self.ask_out, {"ask": self.key_ask}, RELAY_1, self.between_12, RELAY_1, RELAY_2,
            self.key_relays,
        )  # fmt: skip
        moved += forward(
            self.between_12, {RELAY_1: self.key_relays}, RELAY_2, self.fetch_in, RELAY_2, "fetch",
            self.key_fetch,
        )  # fmt: skip
        moved += forward(
            self.fetch_out, {"fetch": self.key_fetch}, RELAY_2, self.between_21, RELAY_2, RELAY_1,
            self.key_relays,
        )  # fmt: skip
        moved += forward(
            self.between_21, {RELAY_2: self.key_relays}, RELAY_1, self.ask_in, RELAY_1, "ask",
            self.key_ask,
        )  # fmt: skip
        return moved

    def ask_settings(self) -> ConnectionSettings:
        return load_relay_settings(self.ask_ini)

    def fetch_settings(self) -> ConnectionSettings:
        return load_relay_settings(self.fetch_ini)

    def put_into_inbox_of_ask(self, message: Message) -> None:
        """Put a message into the inbox of the asking component as its relay would."""
        envelope = Envelope.create(
            message, hops=(RELAY_2,), sender=RELAY_1, recipient="ask", key=self.key_ask
        )
        files_way(self.ask_in).send(envelope, ())


@dataclass
class ServeSide:
    """``serve`` without its loop: the connection, the handler and the replica of MetaTrader 5."""

    network: Network
    module: ArchiveMt5Module
    config: StartupConfig = field(default_factory=lambda: make_config())
    out: io.StringIO = field(default_factory=io.StringIO)
    connector: Connector = field(init=False)
    handler: RequestHandler = field(init=False)

    def __post_init__(self) -> None:
        self.open()

    def open(self) -> None:
        """Open the connection and the handler (again, after a restart)."""
        self.connector = open_connector(self.network.fetch_settings(), clock=lambda: CLOCK)
        self.handler = RequestHandler(
            self.connector,
            Mt5Gateway(self.config.metatrader, self.module),
            self.config,
            clock=lambda: CLOCK,
            out=self.out,
        )

    def poll(self) -> Any:
        return self.connector.poll(self.handler)

    def restart(self) -> None:
        self.connector.close()
        self.open()

    def close(self) -> None:
        self.connector.close()


def pump_hooks(
    network: Network, serve: ServeSide, *, interval: float = 1.0, steps: int = 3
) -> tuple[RelayHooks, Callable[[], float]]:
    """Hooks for ``main(["request", ...])`` without threads: every pause of the request is one
    round of the relay, the retrieval and the relay again. The clock is simulated: it advances by
    what the request sleeps."""
    now = [0.0]

    def monotonic() -> float:
        return now[0]

    def sleep(seconds: float) -> None:
        now[0] += seconds
        for _ in range(steps):
            network.relay_step()
            serve.poll()
        network.relay_step()

    return RelayHooks(sleep=sleep, monotonic=monotonic, poll_interval=interval), monotonic


class Pump(threading.Thread):
    """A thread that moves the envelopes of the network until it is stopped."""

    def __init__(self, network: Network) -> None:
        super().__init__(daemon=True)
        self._network = network
        self._stop_event = threading.Event()
        self.errors: list[BaseException] = []

    def run(self) -> None:
        while not self._stop_event.is_set():
            try:
                self._network.relay_step()
            except Exception as error:  # reported by the test
                self.errors.append(error)
            time.sleep(0.01)

    def stop(self) -> None:
        self._stop_event.set()
        self.join(timeout=10)
