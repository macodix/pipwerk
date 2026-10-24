"""Restart after a hard stop (specification 4.1, E4): no message is lost, and a handover that
happens twice is recognised.

The relay is stopped at every one of its steps that changes something outside of the process:
before and after each call of ``FilesWay.send``, ``FilesWay.acknowledge``, ``RelayStore.accept``,
``RelayStore.replace``, ``RelayStore.reschedule``, ``AttachmentStore.write`` and
``AttachmentStore.remove``. ``SimulatedCrash`` is a ``BaseException``: the relay does not catch
it, as it would not catch a hard stop. A new ``Relay`` on the same files is the restart.
"""

import logging
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest
from pipwerk_relaycore.ways.files import FilesWay

from pipwerk_relay.attachments import AttachmentStore
from pipwerk_relay.store import RelayStore
from tests.support import World, names

ATTACHMENT = b"the contents of the file"


class SimulatedCrash(BaseException):
    pass


class CrashPlan:
    """Counts the calls of the relay and stops it at one of them (``crash_at``, 1 based)."""

    def __init__(self, crash_at: int | None = None, *, after: bool = False) -> None:
        self.crash_at = crash_at
        self.after = after
        self.count = 0
        self.armed = False
        self.names: list[str] = []

    def wrap(self, name: str, original: Callable[..., Any]) -> Callable[..., Any]:
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            if not self.armed:
                return original(*args, **kwargs)
            self.count += 1
            number = self.count
            self.names.append(name)
            if self.crash_at == number and not self.after:
                raise SimulatedCrash(name)
            value = original(*args, **kwargs)
            if self.crash_at == number and self.after:
                raise SimulatedCrash(name)
            return value

        return wrapper


def install(monkeypatch: pytest.MonkeyPatch, plan: CrashPlan) -> None:
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
            owner, name, plan.wrap(f"{owner.__name__}.{name}", getattr(owner, name))
        )


def work(world: World, plan: CrashPlan, rounds: int) -> None:
    """Rounds of work; a crash of a relay is followed by a restart of that relay."""
    for _ in range(rounds):
        for site in world.sites.values():
            plan.armed = True
            try:
                site.relay.cycle()
            except SimulatedCrash:
                plan.crash_at = None
                site.restart()
            finally:
                plan.armed = False
            for component in site.components.values():
                component.poll()


def build(root: Path) -> World:
    world = World(root)
    first = world.site("r1", components=["app-a"])
    second = world.site("r2", components=["app-b"])
    world.link(first, second)
    world.start()
    return world


def scenario(world: World, plan: CrashPlan) -> None:
    """A message with an attachment and a wish for a receipt goes from app-a to app-b."""
    world.sites["r1"].components["app-a"].send(
        "app-b.net1.r2", attachments=[("data.bin", ATTACHMENT)], receipt=True
    )
    work(world, plan, 6)


def assert_complete(world: World) -> None:
    first, second = world.sites["r1"], world.sites["r2"]
    (received,) = second.components["app-b"].handler.others
    assert received.files == {"data.bin": ATTACHMENT}
    assert first.components["app-a"].connector.waiting_count == 0  # the receipt arrived
    assert first.components["app-a"].handler.notices == []
    for site in (first, second):
        assert site.queue_size() == 0
        assert names(site.inbox) == set()
    for name in ("app-a", "app-b"):
        for site in (first, second):
            if name in site.components:
                assert names(site.out_directory(name)) == set()


def test_without_a_stop_the_scenario_counts_the_steps(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    plan = CrashPlan()
    install(monkeypatch, plan)
    world = build(tmp_path)
    try:
        scenario(world, plan)
        assert_complete(world)
    finally:
        world.close()
    # the sweep below has something to stop at
    assert plan.count >= 20
    assert {"FilesWay.send", "RelayStore.accept", "AttachmentStore.write"} <= set(plan.names)


def steps_of_the_scenario(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> int:
    plan = CrashPlan()
    with monkeypatch.context() as patch:
        install(patch, plan)
        world = build(tmp_path / "count")
        try:
            scenario(world, plan)
        finally:
            world.close()
    return plan.count


@pytest.mark.parametrize("after", [False, True], ids=["before-the-step", "after-the-step"])
def test_a_stop_at_any_step_loses_nothing_and_delivers_once(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, after: bool
) -> None:
    total = steps_of_the_scenario(tmp_path, monkeypatch)
    for number in range(1, total + 1):
        plan = CrashPlan(number, after=after)
        with monkeypatch.context() as patch:
            install(patch, plan)
            world = build(tmp_path / f"run-{number}-{after}")
            try:
                scenario(world, plan)
                assert plan.crash_at is None, f"step {number} was never reached"
                # later the leftovers are cleaned up, and the message has arrived once
                world.clock.advance(hours=3)
                work(world, plan, 3)
                assert_complete(world)
                for site in world.sites.values():
                    assert names(site.attachments_directory) == set(), (number, after)
            finally:
                world.close()


def test_a_stop_before_the_envelope_is_acknowledged_is_recognised_as_a_repetition(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    plan = CrashPlan()
    world = build(tmp_path)
    try:
        world.sites["r1"].components["app-a"].send("app-b.net1.r2")
        original = FilesWay.acknowledge
        stopped = {"done": False}

        def stop_once(self: FilesWay, token: str) -> None:
            if plan.armed and not stopped["done"]:
                stopped["done"] = True
                raise SimulatedCrash("acknowledge")
            original(self, token)

        monkeypatch.setattr(FilesWay, "acknowledge", stop_once)
        caplog.set_level(logging.INFO, logger="pipwerk_relay")
        work(world, plan, 6)
        assert stopped["done"]
        (received,) = world.sites["r2"].components["app-b"].handler.others
        assert received.message.recipient == "app-b.net1.r2"
        assert "repetition message=" in caplog.text
        assert world.sites["r1"].queue_size() == 0
    finally:
        world.close()


def test_a_stop_after_the_handover_gives_the_next_relay_a_repetition(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """The handover happened, the queue entry is still there: r1 hands over again (E4)."""
    plan = CrashPlan()
    world = build(tmp_path)
    try:
        world.sites["r1"].components["app-a"].send("app-b.net1.r2")
        caplog.set_level(logging.INFO, logger="pipwerk_relay")
        original = FilesWay.send
        sent = {"count": 0}

        target = str(world.sites["r2"].inbox)

        def send_and_stop(self: FilesWay, *args: Any, **kwargs: Any) -> None:
            original(self, *args, **kwargs)
            if plan.armed and self.settings.directory == target and not sent["count"]:
                sent["count"] += 1
                raise SimulatedCrash("send")

        monkeypatch.setattr(FilesWay, "send", send_and_stop)
        work(world, plan, 6)
        assert sent["count"] == 1
        assert len(world.sites["r2"].components["app-b"].handler.others) == 1
        assert "repetition message=" in caplog.text  # r2 saw the handover a second time
        assert world.sites["r1"].queue_size() == 0
    finally:
        world.close()
