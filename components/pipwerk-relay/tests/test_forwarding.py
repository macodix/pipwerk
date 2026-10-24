"""The way of a message (specification 4.1): forwarding in the own relay, by the address book and
over a chain of standard relays; repetition and the order of the checks."""

import logging
from datetime import timedelta
from pathlib import Path

import pytest
from pipwerk_relaycore.ways.files import FilesWay

from tests.support import World, make_message, names, place


def two_relays(world: World) -> tuple[str, str]:
    first = world.site("r1", components=["app-a"])
    second = world.site("r2", components=["app-b"])
    world.link(first, second)
    world.start()
    return "app-a.net1.r1", "app-b.net1.r2"


def test_a_message_goes_to_another_component_of_the_same_relay(world: World) -> None:
    site = world.site("r1", components=["app-a", "app-b"])
    world.start()
    sent = site.components["app-a"].send(
        "app-b.net1.r1", attachments=[("data.csv", b"1,2,3")], receipt=True
    )
    world.pump(2)
    (received,) = site.components["app-b"].handler.others
    assert received.message == sent
    assert received.files == {"data.csv": b"1,2,3"}
    assert received.hops == ("net1.r1",)
    assert site.queue_size() == 0
    assert names(site.inbox) == set()
    assert names(site.attachments_directory) == set()
    assert site.components["app-a"].connector.waiting_count == 0  # the receipt came back


def test_a_message_goes_over_the_address_book_to_a_component_of_another_relay(
    world: World,
) -> None:
    sender, recipient = two_relays(world)
    first, second = world.sites["r1"], world.sites["r2"]
    sent = first.components["app-a"].send(recipient, attachments=[("a.bin", b"\x00\x01")])
    world.pump(3)
    (received,) = second.components["app-b"].handler.others
    assert received.message == sent
    assert received.files == {"a.bin": b"\x00\x01"}
    assert received.hops == ("net1.r1", "net1.r2")
    assert first.queue_size() == 0
    assert second.queue_size() == 0
    assert sender == str(received.message.sender)


def test_the_answer_comes_back_the_same_way(world: World) -> None:
    sender, recipient = two_relays(world)
    first, second = world.sites["r1"], world.sites["r2"]
    request = first.components["app-a"].send(recipient)
    world.pump(3)
    second.components["app-b"].send(sender, reference_id=request.id)
    world.pump(3)
    (answer,) = first.components["app-a"].handler.others
    assert answer.message.reference_id == request.id


def test_a_message_goes_over_a_chain_of_standard_relays(world: World) -> None:
    first = world.site("r1", components=["app-a"])
    middle = world.site("r2")
    last = world.site("r3", network="net2", components=["app-c"])
    world.link(first, middle, first_standard=True)
    world.link(middle, last, first_standard=True)
    world.start()
    sent = first.components["app-a"].send("app-c.net2.r3", attachments=[("x.txt", b"x")])
    world.pump(5)
    (received,) = last.components["app-c"].handler.others
    assert received.message == sent
    assert received.hops == ("net1.r1", "net1.r2", "net2.r3")
    assert (first.queue_size(), middle.queue_size(), last.queue_size()) == (0, 0, 0)


def test_the_address_book_is_used_before_the_standard_relay(world: World) -> None:
    first = world.site("r1", components=["app-a"])
    standard = world.site("r2")
    direct = world.site("r3", components=["app-c"])
    world.link(first, standard, first_standard=True)
    world.link(first, direct)
    world.start()
    sent = first.components["app-a"].send("app-c.net1.r3")
    world.pump(4)
    assert len(direct.components["app-c"].handler.others) == 1
    long_ago = world.clock() - timedelta(days=1)
    assert not standard.store.is_seen(sent.id, 1, long_ago)  # the standard relay never saw it


def test_the_log_names_ids_and_addresses_but_no_content(
    world: World, caplog: pytest.LogCaptureFixture
) -> None:
    sender, recipient = two_relays(world)
    caplog.set_level(logging.INFO, logger="pipwerk_relay")
    sent = (
        world.sites["r1"]
        .components["app-a"]
        .send(
            recipient, content={"text": "SECRET-CONTENT"}, attachments=[("f.txt", b"SECRET-FILE")]
        )
    )
    world.pump(3)
    text = caplog.text
    assert f"accepted message={sent.id}" in text
    assert f"forwarded message={sent.id}" in text
    assert recipient in text
    assert sender in text
    assert "SECRET-CONTENT" not in text
    assert "SECRET-FILE" not in text
    assert "f.txt" not in text


def test_a_message_passes_the_checks_in_the_order_repetition_first(world: World) -> None:
    """A handover that was seen is dropped before sender and loop are looked at (4.1 step 4)."""
    site = world.site("r1", components=["app-a"])
    world.start()
    key = site.secrets.load_key("comp-app-a")
    forged = make_message("app-x.net1.r1", "app-a.net1.r1")
    place(site.inbox, forged, key, sender="app-a", recipient=site.own)
    site.relay.cycle()
    # the same envelope again, after the notice was delivered
    world.pump(2)
    place(site.inbox, forged, key, sender="app-a", recipient=site.own)
    site.relay.cycle()
    world.pump(2)
    assert site.components["app-a"].handler.reasons() == ["sender_invalid"]


def test_a_way_that_fails_in_an_unexpected_way_does_not_stop_the_round(
    world: World, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """A way from another package may raise anything; the relay notes the name of the error."""
    two_relays(world)
    site = world.sites["r1"]
    sent = site.components["app-a"].send("app-b.net1.r2")

    def failing(*_args: object, **_kwargs: object) -> None:
        raise RuntimeError("SECRET-DETAIL")

    with monkeypatch.context() as patch:
        patch.setattr(FilesWay, "read", failing)
        patch.setattr(FilesWay, "clean_up", failing)
        result = site.relay.cycle()
    assert result.unavailable_inboxes == ["main"]
    assert "RuntimeError" in caplog.text
    assert "SECRET-DETAIL" not in caplog.text
    with monkeypatch.context() as patch:
        patch.setattr(FilesWay, "send", failing)
        patch.setattr(FilesWay, "acknowledge", failing)
        site.relay.cycle()
    (entry,) = site.store.all_entries()
    assert (entry.message_id, entry.attempts, entry.last_error) == (sent.id, 1, "RuntimeError")
    world.clock.advance(seconds=20)
    world.pump(4)
    assert len(world.sites["r2"].components["app-b"].handler.others) == 1


def test_an_empty_inbox_and_an_unusable_inbox_do_not_stop_the_round(
    world: World, tmp_path: Path
) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    assert site.relay.cycle().accepted == 0
    site.inbox.rmdir()
    result = site.relay.cycle()
    assert result.unavailable_inboxes == ["main"]
    site.inbox.mkdir()
    assert site.relay.cycle().unavailable_inboxes == []
