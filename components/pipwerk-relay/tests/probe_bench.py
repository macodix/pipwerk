"""Two relays with a directory in common, and a probe on each: the arrangement of the
disturbance tests (specification 8)::

    send.net1.r1 --> r1 --(shared/in-r2)--> r2 --> listen.net1.r2
    listen.net1.r1 <-- r1 <--(shared/in-r1)-- r2 <-- send.net1.r2

``Bench`` lets the relays and the listening probes work in steps while ``send_and_watch`` of
the probe waits: every pause of the probe moves the clock of the test and works one round. A
relay that is "not running" does no round; a listening probe that is "not running" does not read
its inbox. ``at`` plans an action for a moment of the wait (a relay that is started again, a
directory that is back).
"""

import io
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path

from pipwerk_relaycore import Connector, ReceivedMessage

from pipwerk_relay.cli import main
from pipwerk_relay.probe import Listener, Timing, send_and_watch
from tests.crash import CrashPlan, SimulatedCrash
from tests.support import RecordingHandler, Site, World, write_key_copy

LISTEN = "listen"
SEND = "send"
FIRST = "r1"
SECOND = "r2"
NETWORK = "net1"
ADDRESS_FIRST = f"{LISTEN}.{NETWORK}.{FIRST}"
ADDRESS_SECOND = f"{LISTEN}.{NETWORK}.{SECOND}"


@dataclass(frozen=True)
class Outcome:
    """What ``send_and_watch`` did: the exit code and the two outputs."""

    code: int
    out: str
    err: str


class ListeningHandler(RecordingHandler):
    """The handler of a listening probe: it writes what it receives like ``probe listen`` and
    remembers it like every handler of the tests."""

    def __init__(self, listener: Listener) -> None:
        super().__init__()
        self.listener = listener

    def store(self, received: ReceivedMessage) -> None:
        self.listener.store(received)
        super().store(received)


class Bench:
    """The arrangement. ``deadline`` is the delivery period of the relays in seconds."""

    def __init__(
        self,
        root: Path,
        *,
        deadline: int = 600,
        plan: CrashPlan | None = None,
        entry_settings: dict[str, int] | None = None,
        standard: bool = False,
    ) -> None:
        self.world = World(root)
        self.first = self.world.site(FIRST, components=[LISTEN, SEND], shared=True)
        self.second = self.world.site(SECOND, components=[LISTEN, SEND], shared=True)
        for site in (self.first, self.second):
            site.periods["delivery_deadline_seconds"] = deadline
        key = self.first.secrets.new_key(f"relay-{SECOND}")
        write_key_copy(self.second.secrets_directory, f"relay-{FIRST}", key)
        self.first.add_relay_entry(
            self.second, f"relay-{SECOND}", standard=standard, **(entry_settings or {})
        )
        self.second.add_relay_entry(self.first, f"relay-{FIRST}", standard=standard)
        self.world.start()
        self.plan = plan
        self.elapsed = 0.0
        self.stopped: set[str] = set()
        """The relays that do no round."""
        self.silent: set[tuple[str, str]] = set()
        """The components (relay, name) that do not read their inbox."""
        self.outputs: dict[str, io.StringIO] = {}
        self.listeners: dict[str, Listener] = {}
        self._planned: list[tuple[float, Callable[[], None]]] = []
        for site in (self.first, self.second):
            output = io.StringIO()
            self.outputs[site.name] = output
            self.received_directory(site).mkdir()
            self.listeners[site.name] = Listener(self.received_directory(site), output)
            site.components[LISTEN].handler = ListeningHandler(self.listeners[site.name])

    # --- working ------------------------------------------------------------------------------

    def received_directory(self, site: Site) -> Path:
        return site.root / "received"

    def received(self, site: Site) -> list[Path]:
        """The messages the listening probe of the relay has written."""
        directory = self.received_directory(site)
        return sorted(path for path in directory.iterdir() if not path.name.endswith(".part"))

    def cycle(self, site: Site) -> None:
        plan = self.plan
        if plan is None:
            site.relay.cycle()
            return
        plan.armed = True
        try:
            site.relay.cycle()
        except SimulatedCrash:
            plan.crash_at = None
            site.restart()
        finally:
            plan.armed = False

    def pump(self, rounds: int = 3) -> None:
        """Rounds of work: every running relay, then every running listening probe."""
        for _ in range(rounds):
            for site in self.world.sites.values():
                if site.name not in self.stopped:
                    self.cycle(site)
                if (site.name, LISTEN) not in self.silent:
                    site.components[LISTEN].poll()

    def at(self, seconds: float, action: Callable[[], None]) -> None:
        """Do ``action`` when ``seconds`` of the wait of the probe have passed."""
        self._planned.append((self.elapsed + seconds, action))

    def _sleep(self, seconds: float) -> None:
        self.elapsed += seconds
        self.world.clock.advance(seconds=seconds)
        due = [item for item in self._planned if item[0] <= self.elapsed]
        self._planned = [item for item in self._planned if item not in due]
        for _, action in due:
            action()
        self.pump()

    def timing(self) -> Timing:
        return Timing(monotonic=lambda: self.elapsed, sleep=self._sleep)

    # --- the probe ----------------------------------------------------------------------------

    def send(
        self,
        site: Site,
        recipient: str,
        *,
        text: str = "hello",
        files: Sequence[tuple[str, bytes]] = (),
        receipt: bool = True,
        wait: int = 120,
        interval: float = 5.0,
        connector: Connector | None = None,
    ) -> Outcome:
        """``probe send`` of the sending probe of ``site`` (or with ``connector``)."""
        out, err = io.StringIO(), io.StringIO()
        code = send_and_watch(
            connector or site.components[SEND].connector,
            recipient=recipient,
            text=text,
            files=files,
            receipt=receipt,
            wait=timedelta(seconds=wait),
            interval=interval,
            timing=self.timing(),
            out=out,
            err=err,
        )
        return Outcome(code, out.getvalue(), err.getvalue())

    def settle(self, seconds: float = 20_000, rounds: int = 4) -> None:
        """Move the clock far ahead and let everything work: periods run out, leftovers go."""
        for _ in range(rounds):
            self.world.clock.advance(seconds=seconds / rounds)
            self.pump(2)

    def queue(self, site: Site, capsys_read: Callable[[], str]) -> str:
        """The output of ``pipwerk-relay queue`` of the relay."""
        ini = site.root / "pipwerk-relay.ini"
        ini.write_text(
            f"[database]\nurl = sqlite:///{site.root / 'relay.db'}\n"
            f"[storage]\nattachments_directory = {site.attachments_directory}\n"
            f"[secrets]\ndirectory = {site.secrets_directory}\n",
            encoding="utf-8",
        )
        assert main(["-c", str(ini), "queue"]) == 0
        return capsys_read()

    def close(self) -> None:
        self.world.close()
