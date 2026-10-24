"""Two real relays for the tests of ``serve`` and ``request`` (order 6, specification relay 8).

``relay_support.Network`` imitates the relays with two steps; here the steps are the real relays
of the component pipwerk relay (``pipwerk_relay.relay.Relay``, with a database, a queue, the
attachments directory and the operating configuration), on the same directories::

    ask --(ask_out)--> relay1 --(between_12)--> relay2 --(fetch_in)--> fetch
    ask <--(ask_in)--- relay1 <--(between_21)-- relay2 <--(fetch_out)-- fetch

``RealNetwork.relay_step`` lets both relays work one round. ``CrashPlan`` ends a relay hard at one
of its steps that change something outside of the process (the arrangement of the tests of the
relay: before or after each call of ``FilesWay.send``, ``FilesWay.acknowledge``,
``RelayStore.accept``, ``RelayStore.replace``, ``RelayStore.reschedule``, ``AttachmentStore.write``
and ``AttachmentStore.remove``); a new ``Relay`` on the same files is the restart.
"""

import json
import os
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
import sqlalchemy as sa
from pipwerk_relay.attachments import AttachmentStore
from pipwerk_relay.configuration import load_configuration
from pipwerk_relay.database import create_engine, migrate
from pipwerk_relay.relay import Relay
from pipwerk_relay.store import RelayStore
from pipwerk_relaycore import ConnectionKey, SecretsDirectory
from pipwerk_relaycore.ways.files import FilesWay
from relay_support import Network

from pipwerk_fetch_mt5.relay.commands import RelayHooks

NETWORK = "net1"
RELAY_1 = "relay1"
RELAY_2 = "relay2"


class Clock:
    """The clock of the relays: real at the start, moved by what the test waits."""

    def __init__(self) -> None:
        self.moment = datetime.now(UTC)

    def __call__(self) -> datetime:
        return self.moment

    def advance(self, seconds: float) -> None:
        self.moment += timedelta(seconds=seconds)


class SimulatedCrash(BaseException):
    """A hard end: a ``BaseException``, which the relay does not catch."""


class CrashPlan:
    """Counts the steps of the relay and ends it at one of them (``crash_at``, 1 based)."""

    def __init__(self, crash_at: int | None = None, *, after: bool = False) -> None:
        self.crash_at = crash_at
        self.after = after
        self.count = 0
        self.armed = False

    def wrap(self, name: str, original: Callable[..., Any]) -> Callable[..., Any]:
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            if not self.armed:
                return original(*args, **kwargs)
            self.count += 1
            number = self.count
            if self.crash_at == number and not self.after:
                raise SimulatedCrash(name)
            value = original(*args, **kwargs)
            if self.crash_at == number and self.after:
                raise SimulatedCrash(name)
            return value

        return wrapper

    def install(self, monkeypatch: pytest.MonkeyPatch) -> None:
        targets: list[tuple[Any, str]] = [
            (FilesWay, "send"),
            (FilesWay, "acknowledge"),
            (RelayStore, "accept"),
            (RelayStore, "replace"),
            (RelayStore, "reschedule"),
            (AttachmentStore, "write"),
            (AttachmentStore, "remove"),
        ]
        for owner, name in targets:
            monkeypatch.setattr(
                owner, name, self.wrap(f"{owner.__name__}.{name}", getattr(owner, name))
            )


def write_key_copy(secrets: Path, name: str, key: ConnectionKey) -> None:
    """A copy of a key for another side: a file with the rights of a key file."""
    descriptor = os.open(secrets / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "wb") as file:
        file.write(key.to_file_text().encode("ascii"))


class Site:
    """One relay with its database, queue, attachments, secrets and operating configuration."""

    def __init__(self, root: Path, name: str, clock: Clock, document: dict[str, Any]) -> None:
        self.name = name
        self.clock = clock
        self.root = root
        self.secrets_directory = root / "secrets"
        self.secrets_directory.mkdir(parents=True)
        self.secrets_directory.chmod(0o700)
        self.secrets = SecretsDirectory(self.secrets_directory)
        self.engine = create_engine(sa.URL.create("sqlite", database=str(root / "relay.db")))
        migrate(self.engine)
        self.store = RelayStore(self.engine)
        self.attachments = AttachmentStore(root / "attachments")
        self.attachments.ensure_directory()
        self.document = document
        self.relay = self.new_relay()

    def keys(self, files: dict[str, ConnectionKey]) -> None:
        for name, key in files.items():
            write_key_copy(self.secrets_directory, name, key)

    def configure(self) -> None:
        load_configuration(self.store, self.secrets, json.dumps(self.document), self.clock())

    def new_relay(self) -> Relay:
        return Relay(self.store, self.attachments, self.secrets, clock=self.clock)

    def queue_size(self) -> int:
        return self.store.totals().messages

    def close(self) -> None:
        self.engine.dispose()


def operating(
    name: str,
    inbox: Path,
    shared_inbox: Path,
    component: tuple[str, Path],
    peer: tuple[str, Path],
) -> dict[str, Any]:
    """The operating configuration of a relay: two inboxes, one component, one other relay."""
    component_name, component_directory = component
    peer_name, peer_inbox = peer
    return {
        "network": NETWORK,
        "name": name,
        "inputs": [
            {"name": "components", "way": "files", "settings": {"directory": str(inbox)}},
            {"name": "shared", "way": "files", "settings": {"directory": str(shared_inbox)}},
        ],
        "components": [
            {
                "name": component_name,
                "way": "files",
                "settings": {"directory": str(component_directory)},
                "key_file": f"comp-{component_name}",
            }
        ],
        "address_book": [
            {
                "network": NETWORK,
                "relay": peer_name,
                "way": "files",
                "settings": {"directory": str(peer_inbox)},
                "key_file": f"relay-{peer_name}",
                "standard": False,
            }
        ],
        "periods": {
            "read_interval_seconds": 1,
            "retry_first_seconds": 2,
            "retry_max_seconds": 10,
            "delivery_deadline_seconds": 600,
            "attachment_grace_seconds": 10,
        },
    }


@dataclass
class RealNetwork(Network):
    """The directories, keys and startup configurations of ``Network``, worked by two real
    relays."""

    clock: Clock = field(init=False)
    relay_1: Site = field(init=False)
    relay_2: Site = field(init=False)
    plans: dict[str, CrashPlan] = field(init=False, default_factory=dict)
    stopped: set[str] = field(init=False, default_factory=set)
    """The relays that do no round."""

    def __post_init__(self) -> None:
        super().__post_init__()
        self.clock = Clock()
        self.relay_1 = Site(
            self.root / "relay1",
            RELAY_1,
            self.clock,
            operating(
                RELAY_1,
                self.ask_out,
                self.between_21,
                ("ask", self.ask_in),
                (RELAY_2, self.between_12),
            ),
        )
        self.relay_2 = Site(
            self.root / "relay2",
            RELAY_2,
            self.clock,
            operating(
                RELAY_2,
                self.fetch_out,
                self.between_12,
                ("fetch", self.fetch_in),
                (RELAY_1, self.between_21),
            ),
        )
        self.relay_1.keys({"comp-ask": self.key_ask, f"relay-{RELAY_2}": self.key_relays})
        self.relay_2.keys({"comp-fetch": self.key_fetch, f"relay-{RELAY_1}": self.key_relays})
        for site in (self.relay_1, self.relay_2):
            site.configure()

    def site(self, which: int) -> Site:
        return self.relay_1 if which == 1 else self.relay_2

    def relay_step(self) -> int:
        """Every running relay does one round; 0 (the callers do not need a count)."""
        for site in (self.relay_1, self.relay_2):
            if site.name in self.stopped:
                continue
            plan = self.plans.get(site.name)
            if plan is None:
                site.relay.cycle()
                continue
            plan.armed = True
            try:
                site.relay.cycle()
            except SimulatedCrash:
                plan.crash_at = None
                site.relay = site.new_relay()  # the restart: a new process on the same files
            finally:
                plan.armed = False
        return 0

    def hooks(self, serve_poll: Callable[[], Any], *, interval: float = 1.0) -> RelayHooks:
        """Hooks for ``main(["request", ...])`` without threads. Every pause of the request is
        some rounds of the relays and of the retrieval; the clock of the relays moves with it."""
        now = [0.0]

        def sleep(seconds: float) -> None:
            now[0] += seconds
            self.clock.advance(seconds)
            for _ in range(3):
                self.relay_step()
                serve_poll()
            self.relay_step()

        return RelayHooks(sleep=sleep, monotonic=lambda: now[0], poll_interval=interval)

    def close(self) -> None:
        self.relay_1.close()
        self.relay_2.close()

    def in_transit(self) -> list[str]:
        """The names of what still lies in the directories between the components and the relays
        (empty when everything is handed over)."""
        found: list[str] = []
        for directory in (
            self.ask_out,
            self.ask_in,
            self.fetch_out,
            self.fetch_in,
            self.between_12,
            self.between_21,
        ):
            found.extend(f"{directory.name}/{path.name}" for path in sorted(directory.iterdir()))
        return found
