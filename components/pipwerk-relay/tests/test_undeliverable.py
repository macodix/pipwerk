"""Messages that cannot be delivered (specification 4.1 steps 2, 3, 6, 7 and 4.4), forged
envelopes and repetitions."""

import logging
import shutil

import pytest
from pipwerk_relaycore import Attachment, ConnectionKey

from tests.support import (
    Site,
    World,
    make_message,
    names,
    place,
    undeliverable_content,
)

EARLIER = 10_000  # seconds: longer than every period of the tests


def settle(world: World, rounds: int = 6) -> None:
    """Move the clock in steps and let everything work: attempts and periods run out."""
    for _ in range(rounds):
        world.clock.advance(seconds=EARLIER)
        world.pump(2)


# Reasons with a notice --------------------------------------------------------------------


def test_a_wrong_sender_of_a_component_ends_with_sender_invalid(world: World) -> None:
    site = world.site("r1", components=["app-a", "app-b"])
    world.start()
    key = site.secrets.load_key("comp-app-a")
    forged = make_message("app-b.net1.r1", "app-b.net1.r1")
    place(site.inbox, forged, key, sender="app-a", recipient=site.own)
    world.pump(3)
    assert site.components["app-b"].handler.stored == []  # not delivered
    (notice,) = site.components["app-a"].handler.notices  # to the right address of the sender
    assert notice.message.reference_id == forged.id
    assert notice.message.sender == "relay.net1.r1"
    assert notice.message.content["reason"] == "sender_invalid"
    assert notice.message.content["recipient"] == "app-b.net1.r1"
    assert notice.message.content["kind"] == "probe.message"
    assert site.queue_size() == 0


def test_a_loop_over_two_standard_relays_ends_with_loop(world: World) -> None:
    first = world.site("r1", components=["app-a"])
    second = world.site("r2")
    world.link(first, second, first_standard=True, second_standard=True)
    world.start()
    sent = first.components["app-a"].send("nobody.net9.r9")
    world.pump(6)
    (notice,) = first.components["app-a"].handler.notices
    assert notice.message.reference_id == sent.id
    assert notice.message.content["reason"] == "loop"
    assert (first.queue_size(), second.queue_size()) == (0, 0)


def test_a_message_that_has_gone_around_too_many_relays_is_a_loop(world: World) -> None:
    site = world.site("r2", components=["app-a"], max_hops=2)
    other = world.site("r1")
    world.link(other, site)
    world.start()
    key = site.secrets.load_key("relay-r1")
    message = make_message("app-a.net1.r2", "app-a.net1.r2")
    place(site.inbox, message, key, sender="net1.r1", recipient=site.own, hops=["net7.a", "net7.b"])
    world.pump(3)
    assert site.components["app-a"].handler.reasons() == ["loop"]
    assert site.components["app-a"].handler.others == []


def test_an_unknown_component_ends_with_unknown_recipient(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    site.components["app-a"].send("nobody.net1.r1", attachments=[("a.txt", b"a")])
    world.pump(3)
    assert site.components["app-a"].handler.reasons() == ["unknown_recipient"]
    assert names(site.attachments_directory) == set()
    assert site.queue_size() == 0


def test_the_name_relay_is_no_component(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    site.components["app-a"].send("relay.net1.r1")
    world.pump(3)
    assert site.components["app-a"].handler.reasons() == ["unknown_recipient"]


def test_an_unknown_relay_without_standard_relay_ends_with_unknown_relay(world: World) -> None:
    first = world.site("r1", components=["app-a"])
    second = world.site("r2", components=["app-b"])
    world.link(first, second)
    world.start()
    first.components["app-a"].send("app-b.net1.r9")
    world.pump(3)
    assert first.components["app-a"].handler.reasons() == ["unknown_relay"]


def test_an_unreachable_relay_ends_with_relay_unreachable_after_the_period(world: World) -> None:
    first = world.site("r1", components=["app-a"])
    second = world.site("r2", components=["app-b"])
    world.link(first, second)
    world.start()
    shutil.rmtree(second.inbox)  # a network drive that is gone
    first.components["app-a"].send("app-b.net1.r2")
    world.pump(2)
    (entry,) = first.store.all_entries()
    assert (entry.state, entry.attempts, entry.last_error) == (
        "retrying",
        1,
        "WayUnavailableError",
    )
    assert first.components["app-a"].handler.notices == []
    world.clock.advance(seconds=9)
    world.pump(1)
    assert first.store.all_entries()[0].attempts == 1  # the pause has not ended
    settle(world)
    assert first.components["app-a"].handler.reasons() == ["relay_unreachable"]
    assert first.queue_size() == 0


def test_the_pauses_between_attempts_grow_up_to_the_largest(world: World) -> None:
    first = world.site("r1", components=["app-a"])
    second = world.site("r2")
    world.link(first, second)
    world.start()
    shutil.rmtree(second.inbox)
    first.components["app-a"].send("x.net1.r2")
    pauses = []
    for _ in range(5):
        first.relay.cycle()
        (entry,) = first.store.all_entries()
        pauses.append((entry.next_attempt_at - world.clock()).total_seconds())
        world.clock.advance(seconds=pauses[-1])
    assert pauses == [10, 20, 40, 60, 60]  # doubles, up to retry_max_seconds


def test_an_unreachable_component_ends_with_recipient_unreachable(world: World) -> None:
    site = world.site("r1", components=["app-a", "app-b"])
    world.start()
    shutil.rmtree(site.out_directory("app-b"))
    site.components["app-a"].send("app-b.net1.r1")
    world.pump(2)
    assert site.queue_size() == 1
    settle(world)
    assert site.components["app-a"].handler.reasons() == ["recipient_unreachable"]
    assert site.queue_size() == 0


def test_a_message_that_comes_back_up_in_time_is_delivered(world: World) -> None:
    site = world.site("r1", components=["app-a", "app-b"])
    world.start()
    out = site.out_directory("app-b")
    out.rename(out.with_name("away"))
    sent = site.components["app-a"].send("app-b.net1.r1")
    world.pump(2)
    out.with_name("away").rename(out)  # the drive is connected again
    world.clock.advance(seconds=30)
    world.pump(2)
    assert [item.message.id for item in site.components["app-b"].handler.others] == [sent.id]
    assert site.components["app-a"].handler.notices == []


def test_an_attachment_over_the_largest_size_of_a_way_ends_with_too_large(world: World) -> None:
    first = world.site("r1", components=["app-a"])
    second = world.site("r2", components=["app-b"])
    world.link(first, second)
    first.address_book[0]["settings"]["max_attachment_bytes"] = 10
    world.start()
    first.components["app-a"].send("app-b.net1.r2", attachments=[("big", b"x" * 11)])
    world.pump(3)
    assert first.components["app-a"].handler.reasons() == ["too_large"]
    assert first.queue_size() == 0
    assert names(first.attachments_directory) == set()
    assert second.components["app-b"].handler.stored == []


def test_an_envelope_over_the_largest_size_of_a_way_ends_with_too_large(world: World) -> None:
    first = world.site("r1", components=["app-a"])
    second = world.site("r2", components=["app-b"])
    world.link(first, second)
    first.address_book[0]["settings"]["max_envelope_bytes"] = 500
    world.start()
    first.components["app-a"].send("app-b.net1.r2", content={"text": "y" * 600})
    world.pump(3)
    assert first.components["app-a"].handler.reasons() == ["too_large"]


def test_the_notice_names_the_message_it_is_about(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    sent = site.components["app-a"].send("nobody.net1.r1", kind="fetch.request", content={"a": 1})
    world.pump(3)
    (notice,) = site.components["app-a"].handler.notices
    assert notice.message.content == undeliverable_content(
        "unknown_recipient", "nobody.net1.r1", "fetch.request"
    )
    assert notice.message.reference_id == sent.id
    assert notice.message.priority == sent.priority
    assert notice.message.receipt is False


def test_a_notice_reaches_a_sender_in_another_relay(world: World) -> None:
    first = world.site("r1", components=["app-a"])
    second = world.site("r2", components=["app-b"])
    world.link(first, second)
    world.start()
    sent = first.components["app-a"].send("nobody.net1.r2")
    world.pump(5)
    (notice,) = first.components["app-a"].handler.notices
    assert notice.message.reference_id == sent.id
    assert notice.message.content["reason"] == "unknown_recipient"
    assert notice.hops == ("net1.r2", "net1.r1")


def test_a_message_with_a_receipt_wish_ends_the_waiting_with_a_notice(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    connector = site.components["app-a"].connector
    connector.send("nobody.net1.r1", "probe.message", {"text": "x"}, receipt=True)
    assert connector.waiting_count == 1
    world.pump(3)
    assert connector.waiting_count == 0  # the notice ended the waiting (3.7)


# Notices about notices ------------------------------------------------------------------------


def test_an_undeliverable_notice_is_dropped_without_a_new_notice(
    world: World, caplog: pytest.LogCaptureFixture
) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    caplog.set_level(logging.INFO, logger="pipwerk_relay")
    shutil.rmtree(site.out_directory("app-a"))  # the notice cannot be handed over
    site.components["app-a"].send("nobody.net1.r1")
    site.relay.cycle()
    assert site.queue_size() == 1  # the notice waits
    settle(world)
    assert site.queue_size() == 0
    assert "dropped, no new notice" in caplog.text
    site.out_directory("app-a").mkdir()
    world.pump(3)
    assert site.components["app-a"].handler.stored == []  # no notice arrived, no notice of it


def test_a_notice_with_a_wrong_sender_is_dropped_without_a_notice(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    key = site.secrets.load_key("comp-app-a")
    content = undeliverable_content("loop", "app-a.net1.r1", "probe.message")
    notice = make_message(
        "app-x.net1.r1", "app-a.net1.r1", kind="relay.undeliverable", content=content
    )
    place(site.inbox, notice, key, sender="app-a", recipient=site.own)
    world.pump(3)
    assert site.components["app-a"].handler.stored == []
    assert site.queue_size() == 0
    assert names(site.inbox) == set()


# Repetition and loop ------------------------------------------------------------------------


def two_relays_by_hand(world: World) -> tuple[Site, Site, ConnectionKey]:
    first = world.site("r1", components=["app-a"])
    second = world.site("r2", components=["app-b"])
    world.link(first, second)
    world.start()
    return first, second, second.secrets.load_key("relay-r1")


def test_the_same_handover_twice_reaches_the_component_once(world: World) -> None:
    _, second, key = two_relays_by_hand(world)
    message = make_message("app-a.net1.r1", "app-b.net1.r2", attachments=[("a", b"1")])
    for _ in range(2):
        place(
            second.inbox,
            message,
            key,
            sender="net1.r1",
            recipient="net1.r2",
            hops=["net1.r1"],
            attachments=[b"1"],
        )
        world.pump(2)
    assert len(second.components["app-b"].handler.others) == 1
    assert names(second.inbox) == set()


def test_a_loop_is_not_a_repetition_and_a_repeated_loop_gives_one_notice(world: World) -> None:
    first, second, key = two_relays_by_hand(world)
    message = make_message("app-a.net1.r1", "app-b.net1.r2")
    # first the handover as it is, then the message that has been around and comes back
    place(second.inbox, message, key, sender="net1.r1", recipient="net1.r2", hops=["net1.r1"])
    world.pump(2)
    for _ in range(2):
        place(
            second.inbox,
            message,
            key,
            sender="net1.r1",
            recipient="net1.r2",
            hops=["net1.r1", "net1.r2", "net1.r1"],
        )
        world.pump(4)
    assert len(second.components["app-b"].handler.others) == 1
    assert first.components["app-a"].handler.reasons() == ["loop"]  # one notice, not two


def test_a_message_with_a_wrong_sender_twice_gives_one_notice(world: World) -> None:
    site = world.site("r1", components=["app-a", "app-b"])
    world.start()
    key = site.secrets.load_key("comp-app-a")
    forged = make_message("app-b.net1.r1", "app-b.net1.r1")
    for _ in range(2):
        place(site.inbox, forged, key, sender="app-a", recipient=site.own)
        world.pump(3)
    assert site.components["app-a"].handler.reasons() == ["sender_invalid"]


# Forgeries -----------------------------------------------------------------------------------


def test_an_envelope_with_a_wrong_key_is_dropped_without_a_notice_and_without_content(
    world: World, caplog: pytest.LogCaptureFixture
) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    caplog.set_level(logging.INFO, logger="pipwerk_relay")
    message = make_message("app-a.net1.r1", "app-a.net1.r1", content={"text": "SECRET-CONTENT"})
    place(site.inbox, message, ConnectionKey.generate(), sender="app-a", recipient=site.own)
    result = site.relay.cycle()
    world.pump(3)
    assert result.dropped == 1
    assert site.components["app-a"].handler.stored == []  # no message, no notice
    assert site.queue_size() == 0
    assert names(site.inbox) == set()
    assert "envelope dropped" in caplog.text
    assert "bad_mac" in caplog.text
    assert "SECRET-CONTENT" not in caplog.text
    # sender and recipient are not trusted before the check value is right: not in the log
    assert "app-a.net1.r1" not in caplog.text


def test_an_envelope_from_an_unknown_connection_is_dropped(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    message = make_message("app-z.net1.r1", "app-a.net1.r1")
    place(site.inbox, message, ConnectionKey.generate(), sender="app-z", recipient=site.own)
    assert site.relay.cycle().dropped == 1
    assert names(site.inbox) == set()


def test_an_envelope_for_another_receiving_side_is_dropped(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    key = site.secrets.load_key("comp-app-a")
    message = make_message("app-a.net1.r1", "app-a.net1.r1")
    place(site.inbox, message, key, sender="app-a", recipient="net1.r9")
    assert site.relay.cycle().dropped == 1


def test_a_changed_attachment_is_dropped_after_the_grace_period_without_a_notice(
    world: World,
) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    key = site.secrets.load_key("comp-app-a")
    message = make_message("app-a.net1.r1", "app-a.net1.r1", attachments=[("a", b"right")])
    place(site.inbox, message, key, sender="app-a", recipient=site.own, attachments=[b"right"])
    (attachment,) = site.inbox.glob("*.att")
    attachment.write_bytes(b"wrong")  # changed in the directory: the size is the same
    assert site.relay.cycle().postponed == 1  # may be a delay of the file system
    assert names(site.inbox) != set()
    world.clock.advance(seconds=301)
    result = site.relay.cycle()
    assert result.dropped == 1
    world.pump(3)
    assert names(site.inbox) == set()
    assert site.components["app-a"].handler.stored == []


def test_the_attachment_of_a_message_must_match_what_the_message_says(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    key = site.secrets.load_key("comp-app-a")
    message = make_message("app-a.net1.r1", "app-a.net1.r1")
    message_with_wrong_list = message.model_copy(
        update={"attachments": (Attachment.of("a", b"declared"),)}
    )
    place(
        site.inbox,
        message_with_wrong_list,
        key,
        sender="app-a",
        recipient=site.own,
        attachments=[b"declared"],
    )
    assert site.relay.cycle().accepted == 1  # consistent: accepted
    # an envelope that says "one attachment" but whose file is missing waits, then is dropped
    other = make_message("app-a.net1.r1", "app-a.net1.r1", attachments=[("a", b"x")])
    place(site.inbox, other, key, sender="app-a", recipient=site.own, attachments=[b"x"])
    next(site.inbox.glob(f"{other.id}.0.att")).unlink()
    assert site.relay.cycle().postponed == 1
    world.clock.advance(seconds=400)
    assert site.relay.cycle().dropped == 1


def test_the_content_of_a_known_kind_must_fit_its_kind(world: World) -> None:
    site = world.site("r1", components=["app-a"])
    world.start()
    key = site.secrets.load_key("comp-app-a")
    bad = make_message("app-a.net1.r1", "app-a.net1.r1", kind="probe.message", content={"x": 1})
    place(site.inbox, bad, key, sender="app-a", recipient=site.own)
    result = site.relay.cycle()
    assert result.dropped == 1
    assert site.queue_size() == 0
