"""Limits against overload (specification 4.5), the grace period for envelopes with a wrong
attachment, faulty envelopes that must not block newer ones, and cleaning up of leftovers."""

import os
import shutil
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from pipwerk_relaycore import ConnectionKey

from tests.support import Site, World, make_message, names, place


def envelopes(directory: Path) -> int:
    return len(list(directory.glob("*.json")))


def blocked_pair(
    world: World,
    *,
    max_queue_messages: int | None = None,
    max_attachment_storage_bytes: int | None = None,
) -> tuple[Site, Site]:
    """r1 with app-a, r2 with app-b, and the inbox of r2 gone: r1 cannot hand over."""
    first = world.site(
        "r1",
        components=["app-a"],
        max_queue_messages=max_queue_messages,
        max_attachment_storage_bytes=max_attachment_storage_bytes,
    )
    second = world.site("r2", components=["app-b"])
    world.link(first, second)
    world.start()
    shutil.rmtree(second.inbox)
    return first, second


# Number of messages --------------------------------------------------------------------------


def test_at_the_largest_number_of_messages_nothing_more_is_accepted(world: World) -> None:
    first, second = blocked_pair(world, max_queue_messages=2)
    sender = first.components["app-a"]
    for _ in range(5):
        sender.send("app-b.net1.r2")
    result = first.relay.cycle()
    assert result.accepted == 2
    assert first.queue_size() == 2
    assert envelopes(first.inbox) == 3  # the envelopes stay where they are
    result = first.relay.cycle()
    assert result.accepted == 0
    assert result.full
    assert envelopes(first.inbox) == 3
    # room again: the queue drains and the rest is taken over, nothing is lost
    second.inbox.mkdir()
    world.clock.advance(seconds=1000)
    world.pump(10)
    assert len(second.components["app-b"].handler.others) == 5
    assert first.queue_size() == 0
    assert envelopes(first.inbox) == 0


def test_a_full_queue_means_the_inbox_is_not_read_at_all(world: World) -> None:
    first, _ = blocked_pair(world, max_queue_messages=1)
    key = first.secrets.load_key("comp-app-a")
    message = make_message("app-a.net1.r1", "app-b.net1.r2")
    place(first.inbox, message, key, sender="app-a", recipient=first.own)
    first.relay.cycle()
    place(first.inbox, message, key, sender="app-a", recipient=first.own)  # again
    result = first.relay.cycle()
    assert result.full
    assert result.repeated == 0
    assert envelopes(first.inbox) == 1


# Space for attachments -------------------------------------------------------------------------


def test_when_the_space_for_attachments_is_used_up_nothing_more_is_accepted(world: World) -> None:
    first, second = blocked_pair(world, max_attachment_storage_bytes=100)
    sender = first.components["app-a"]
    for _ in range(3):
        sender.send("app-b.net1.r2", attachments=[("f", b"x" * 60)])
    result = first.relay.cycle()
    assert result.accepted == 1
    assert first.store.totals().attachment_bytes == 60
    assert envelopes(first.inbox) == 2
    second.inbox.mkdir()
    world.clock.advance(seconds=1000)
    world.pump(10)
    assert len(second.components["app-b"].handler.others) == 3
    assert first.store.totals().attachment_bytes == 0


def test_an_attachment_that_can_never_fit_is_dropped(world: World) -> None:
    first, _ = blocked_pair(world, max_attachment_storage_bytes=100)
    first.components["app-a"].send("app-b.net1.r2", attachments=[("f", b"x" * 101)])
    result = first.relay.cycle()
    assert result.dropped == 1
    assert envelopes(first.inbox) == 0
    assert first.queue_size() == 0


def test_the_largest_size_of_an_inbox_way_drops_a_larger_envelope(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    site.input_settings = {"max_attachment_bytes": 10}
    world.start()
    site.components["app-a"].send("app-a.net1.r1", attachments=[("f", b"x" * 11)])
    assert site.relay.cycle().dropped == 1
    assert names(site.inbox) == set()


# Faulty envelopes ------------------------------------------------------------------------------


def faulty(site: Site, key: ConnectionKey, age_seconds: float) -> None:
    """An envelope whose attachment is missing, that arrived ``age_seconds`` ago."""
    message = make_message("app-a.net1.r1", "app-a.net1.r1", attachments=[("a", b"1")])
    place(site.inbox, message, key, sender="app-a", recipient="net1.r1", attachments=[b"1"])
    (site.inbox / f"{message.id}.0.att").unlink()
    moment = datetime.now(UTC).timestamp() - age_seconds
    os.utime(site.inbox / f"{message.id}.json", (moment, moment))


def test_old_faulty_envelopes_do_not_block_newer_ones(world: World) -> None:
    site = world.site("r1", components=["app-a", "app-b"], read_batch=2)
    world.start()
    key = site.secrets.load_key("comp-app-a")
    for number in range(5):
        faulty(site, key, 100 + number)  # within the grace period: they wait
    site.components["app-a"].send("app-b.net1.r1")
    world.pump(2)
    assert len(site.components["app-b"].handler.others) == 1
    assert envelopes(site.inbox) == 5  # the five wait for their attachments


def test_a_waiting_envelope_is_dropped_after_the_grace_period(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    key = site.secrets.load_key("comp-app-a")
    faulty(site, key, 100)
    assert site.relay.cycle().postponed == 1
    world.clock.advance(seconds=100)  # 200 s in all: still within the 300 s
    assert site.relay.cycle().postponed == 1
    world.clock.advance(seconds=200)
    assert site.relay.cycle().dropped == 1
    assert names(site.inbox) == set()


def test_an_attachment_that_arrives_late_is_accepted(world: World) -> None:
    site = world.site("r1", components=["app-a", "app-b"])
    world.start()
    key = site.secrets.load_key("comp-app-a")
    message = make_message("app-a.net1.r1", "app-b.net1.r1", attachments=[("a", b"late")])
    place(site.inbox, message, key, sender="app-a", recipient=site.own, attachments=[b"late"])
    attachment = site.inbox / f"{message.id}.0.att"
    content = attachment.read_bytes()
    attachment.unlink()
    assert site.relay.cycle().postponed == 1
    attachment.write_bytes(content)  # the file system shows it now
    world.pump(2)
    (received,) = site.components["app-b"].handler.others
    assert received.files == {"a": b"late"}


# Cleaning up ---------------------------------------------------------------------------------


def old(path: Path, seconds: float = 7200) -> None:
    moment = datetime.now(UTC).timestamp() - seconds
    os.utime(path, (moment, moment))


def test_leftovers_of_an_interrupted_sender_are_removed_after_the_period(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    lonely = uuid4()
    leftovers = [
        site.inbox / f"{lonely}.0.att",
        site.inbox / f"{lonely}.json.0123456789abcdef.part",
    ]
    for path in leftovers:
        path.write_bytes(b"x")
    site.relay.cycle()
    assert all(path.exists() for path in leftovers)  # too young
    world.clock.advance(hours=2)
    site.relay.cycle()
    assert not any(path.exists() for path in leftovers)


def test_leftovers_in_the_directory_of_a_target_are_removed_too(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    leftover = site.out_directory("app-a") / f"{uuid4()}.0.att"
    leftover.write_bytes(b"x")
    site.relay.cycle()
    world.clock.advance(hours=2)
    site.relay.cycle()
    assert not leftover.exists()


def test_files_in_the_directory_for_attachments_that_belong_to_no_entry_are_removed(
    world: World,
) -> None:
    first, _ = blocked_pair(world)
    first.periods["delivery_deadline_seconds"] = 10**6  # the entry waits longer than the test
    first.apply()
    first.components["app-a"].send("app-b.net1.r2", attachments=[("f", b"keep")])
    first.relay.cycle()
    assert first.queue_size() == 1
    (kept,) = first.attachments_directory.glob("*.att")
    orphan = first.attachments_directory / f"{uuid4()}.0.att"
    unfinished = first.attachments_directory / f"{uuid4()}.0.att.0123456789abcdef.part"
    for path in (orphan, unfinished):
        path.write_bytes(b"x")
        old(path)
    world.clock.advance(hours=2)
    first.relay.cycle()
    assert not orphan.exists()
    assert not unfinished.exists()
    assert kept.exists()  # an attachment of an entry in the queue stays


def test_seen_handovers_are_forgotten_after_their_period(world: World) -> None:
    site = world.site("r1", components=["app-a", "app-b"])
    world.start()
    sent = site.components["app-a"].send("app-b.net1.r1")
    world.pump(2)
    assert site.store.is_seen(sent.id, 0, world.clock() - timedelta(days=1))
    world.clock.advance(days=8)
    site.relay.cycle()
    assert not site.store.is_seen(sent.id, 0, world.clock() - timedelta(days=30))
