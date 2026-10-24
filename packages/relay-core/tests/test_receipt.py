"""The receipt of a message (specification 3.7, req-relay-013)."""

import logging
from collections.abc import Iterator
from datetime import timedelta
from pathlib import Path
from uuid import uuid4

import pytest

from pipwerk_relaycore import (
    ConnectionKey,
    Message,
    ReceiptArrived,
    ReceiptMissing,
    ReceivedEnvelope,
    UndeliverableContent,
    UndeliverableReason,
)
from tests.helpers import make_message
from tests.network import (
    ADDRESS_A,
    ADDRESS_B,
    RELAY_1,
    Network,
    RecordingHandler,
    count_files,
    files_way,
    place,
)


@pytest.fixture
def network(tmp_path: Path) -> Iterator[Network]:
    network = Network(tmp_path)
    yield network
    network.close()


def ask(network: Network, timeout: timedelta | None = None) -> Message:
    return network.a.connector.send(
        ADDRESS_B,
        "example.request",
        {"text": "please"},
        attachments=[("f.csv", b"data")],
        receipt=True,
        receipt_timeout=timeout,
    )


def deliver_and_confirm(network: Network) -> None:
    """The message goes to B, B stores it, the receipt goes back to A."""
    network.relay_step()
    network.b.poll()
    network.relay_step()


def messages_in(directory: Path, key: ConnectionKey, sender: str, recipient: str) -> list[Message]:
    """The messages that lie in a directory, read without taking them away."""
    found: list[Message] = []
    for item in files_way(directory).read():
        assert isinstance(item, ReceivedEnvelope)
        found.append(item.envelope.open({sender: key}, recipient=recipient).message)
    return found


# The receipt comes after storing ---------------------------------------------------------


def test_the_receipt_comes_back_after_the_component_has_stored(network: Network) -> None:
    sent = ask(network)
    assert network.a.connector.waiting_count == 1
    deliver_and_confirm(network)
    result = network.a.poll()
    assert result.receipts == 1
    assert network.a.handler.arrived == [ReceiptArrived(sent.id, "example.request", ADDRESS_B)]
    assert network.a.handler.stored == []  # the receipt is not a message for the component
    assert network.a.connector.waiting_count == 0
    assert len(network.b.handler.stored) == 1
    assert count_files(network.a.inbox) == 0


def test_the_receipt_is_a_message_to_the_sender_with_the_id_as_reference(
    network: Network,
) -> None:
    sent = network.a.connector.send(
        ADDRESS_B, "example.request", {}, priority="urgent", receipt=True
    )
    network.relay_step()
    network.b.poll()
    network.relay_step()
    (receipt,) = messages_in(network.a.inbox, network.key_a, RELAY_1, "app-a")
    assert receipt.kind == "relay.receipt"
    assert receipt.sender == ADDRESS_B
    assert receipt.recipient == ADDRESS_A
    assert receipt.reference_id == sent.id
    assert receipt.content == {}
    assert receipt.priority == "urgent"
    assert receipt.receipt is False
    assert receipt.attachments == ()
    assert receipt.id != sent.id


def test_there_is_no_receipt_unless_the_sender_asks_for_one(network: Network) -> None:
    network.a.connector.send(ADDRESS_B, "example.request", {})
    network.relay_step()
    network.b.poll()
    assert count_files(network.b.outbox) == 0
    assert network.relay_step() == 0
    assert network.a.connector.waiting_count == 0


def test_there_is_no_receipt_before_the_component_has_stored_the_message(
    network: Network, caplog: pytest.LogCaptureFixture
) -> None:
    ask(network)
    network.relay_step()
    network.b.handler.failure = RuntimeError("cannot store")
    with caplog.at_level(logging.DEBUG, logger="pipwerk_relaycore"):
        assert network.b.poll().failed == 1
    assert count_files(network.b.outbox) == 0  # no receipt
    assert count_files(network.b.inbox) == 2  # not acknowledged: envelope and attachment
    network.b.handler.failure = None
    assert network.b.poll().delivered == 1
    network.relay_step()
    assert network.a.poll().receipts == 1
    assert len(network.b.handler.stored) == 1


def test_the_sender_may_name_a_deadline_for_one_message(network: Network) -> None:
    ask(network, timeout=timedelta(minutes=5))
    network.clock.advance(minutes=4)
    assert network.a.poll().missing_receipts == 0
    network.clock.advance(minutes=2)
    assert network.a.poll().missing_receipts == 1


# A repetition ------------------------------------------------------------------------------


def test_a_repetition_makes_a_second_receipt_without_a_second_hand_over(
    network: Network, caplog: pytest.LogCaptureFixture
) -> None:
    sent = ask(network)
    deliver_and_confirm(network)
    network.a.poll()
    place(network.b.inbox, sent, network.key_b, [b"data"], hops=(RELAY_1,))
    repeated = network.b.poll()
    assert (repeated.repeated, repeated.delivered) == (1, 0)
    assert len(network.b.handler.stored) == 1
    assert count_files(network.b.outbox) == 1  # a second receipt
    with caplog.at_level(logging.DEBUG, logger="pipwerk_relaycore"):
        network.relay_step()
        late = network.a.poll()
    assert (late.receipts, late.dropped) == (0, 1)  # the sender discards the second one
    assert len(network.a.handler.arrived) == 1
    assert "receipt dropped" in caplog.text


def test_a_repetition_without_the_wish_for_a_receipt_makes_none(network: Network) -> None:
    message = make_message()
    place(network.b.inbox, message, network.key_b)
    network.b.poll()
    place(network.b.inbox, message, network.key_b)
    network.b.poll()
    assert count_files(network.b.outbox) == 0


def test_a_receipt_that_cannot_be_sent_comes_with_the_repetition(network: Network) -> None:
    ask(network)
    network.relay_step()
    away = network.b.outbox.with_name("outbox_b_away")
    network.b.outbox.rename(away)
    failed = network.b.poll()
    assert (failed.failed, failed.delivered) == (1, 0)
    assert len(network.b.handler.stored) == 1  # stored, but not acknowledged and no receipt yet
    assert count_files(network.b.inbox) == 2
    away.rename(network.b.outbox)
    again = network.b.poll()
    assert (again.repeated, again.delivered) == (1, 0)
    assert len(network.b.handler.stored) == 1  # not handed over a second time
    network.relay_step()
    assert network.a.poll().receipts == 1


# Waiting, deadline and restart -----------------------------------------------------------


def test_a_missing_receipt_is_reported_once_after_the_deadline(
    network: Network, caplog: pytest.LogCaptureFixture
) -> None:
    sent = ask(network)
    network.clock.advance(minutes=59)
    assert network.a.poll().missing_receipts == 0
    network.clock.advance(minutes=2)
    with caplog.at_level(logging.DEBUG, logger="pipwerk_relaycore"):
        assert network.a.poll().missing_receipts == 1
    (missing,) = network.a.handler.missing
    assert (missing.message_id, missing.kind, missing.recipient) == (
        sent.id,
        "example.request",
        ADDRESS_B,
    )
    assert missing.deadline - missing.sent_at == timedelta(hours=1)
    assert "receipt missing" in caplog.text
    assert "please" not in caplog.text
    network.clock.advance(days=1)
    assert network.a.poll().missing_receipts == 0
    assert len(network.a.handler.missing) == 1
    assert network.a.connector.waiting_count == 0


def test_the_default_deadline_is_adjustable(network: Network) -> None:
    network.a.restart(receipt_timeout=timedelta(minutes=2))
    ask(network)
    network.clock.advance(minutes=3)
    assert network.a.poll().missing_receipts == 1


def test_waiting_survives_a_restart_of_the_sender(network: Network) -> None:
    sent = ask(network)
    network.a.restart()
    assert network.a.connector.waiting_count == 1
    deliver_and_confirm(network)
    assert network.a.poll().receipts == 1
    assert network.a.handler.arrived[0].message_id == sent.id


def test_a_missing_receipt_is_reported_after_a_restart_of_the_sender(network: Network) -> None:
    sent = ask(network)
    network.clock.advance(hours=2)
    network.a.restart()
    assert network.a.poll().missing_receipts == 1
    assert network.a.handler.missing[0].message_id == sent.id


def test_a_receipt_in_the_inbox_counts_even_if_the_deadline_has_passed_meanwhile(
    network: Network,
) -> None:
    ask(network)
    deliver_and_confirm(network)
    network.clock.advance(hours=3)  # the sender polls late
    result = network.a.poll()
    assert (result.receipts, result.missing_receipts) == (1, 0)


def test_when_the_component_runs_late_the_message_arrives_and_the_late_receipt_is_only_logged(
    network: Network, caplog: pytest.LogCaptureFixture
) -> None:
    sent = ask(network)
    network.relay_step()  # the receiving component does not run
    network.clock.advance(hours=2)
    assert network.a.poll().missing_receipts == 1
    network.b.poll()  # now it starts
    assert [received.message.id for received in network.b.handler.stored] == [sent.id]
    network.relay_step()
    with caplog.at_level(logging.DEBUG, logger="pipwerk_relaycore"):
        late = network.a.poll()
    assert (late.receipts, late.dropped) == (0, 1)
    assert network.a.handler.arrived == []
    assert len(network.a.handler.missing) == 1
    assert "receipt dropped" in caplog.text


# Notice of a relay and receipts that do not belong ----------------------------------------------


def notice_for(sent: Message, reason: UndeliverableReason) -> Message:
    return Message(
        id=uuid4(),
        sender="relay.net1.relay1",
        recipient=ADDRESS_A,
        priority=sent.priority,
        kind="relay.undeliverable",
        content=UndeliverableContent.of(reason, sent.recipient, sent.kind).to_content(),
        reference_id=sent.id,
        created_at=sent.created_at,
    )


def test_a_notice_of_the_relay_ends_the_waiting_and_goes_to_the_component(
    network: Network,
) -> None:
    sent = ask(network)
    notice = notice_for(sent, UndeliverableReason.UNKNOWN_RECIPIENT)
    place(network.a.inbox, notice, network.key_a, sender=RELAY_1, recipient="app-a", hops=())
    result = network.a.poll()
    assert result.delivered == 1
    (received,) = network.a.handler.stored
    assert received.message == notice
    assert received.message.content["reason"] == "unknown_recipient"
    assert network.a.connector.waiting_count == 0
    network.clock.advance(hours=5)
    assert network.a.poll().missing_receipts == 0  # no second message about the same one
    assert network.a.handler.missing == []


def test_a_notice_of_a_component_does_not_end_the_waiting(network: Network) -> None:
    sent = ask(network)
    notice = notice_for(sent, UndeliverableReason.UNKNOWN_RECIPIENT).model_copy(
        update={"sender": ADDRESS_B}
    )
    place(network.a.inbox, notice, network.key_a, sender=RELAY_1, recipient="app-a", hops=())
    assert network.a.poll().delivered == 1  # it comes to the component like any message
    assert network.a.connector.waiting_count == 1  # but the waiting for the receipt goes on


def test_a_notice_about_a_message_without_receipt_goes_to_the_component_too(
    network: Network,
) -> None:
    sent = network.a.connector.send(ADDRESS_B, "example.request", {})
    notice = notice_for(sent, UndeliverableReason.LOOP)
    place(network.a.inbox, notice, network.key_a, sender=RELAY_1, recipient="app-a", hops=())
    assert network.a.poll().delivered == 1


def receipt_from(sender: str, reference: Message | None) -> Message:
    return Message(
        id=uuid4(),
        sender=sender,
        recipient=ADDRESS_A,
        priority="normal",
        kind="relay.receipt",
        content={},
        reference_id=None if reference is None else reference.id,
        created_at=make_message().created_at,
    )


def test_a_receipt_from_another_address_is_discarded_and_the_waiting_goes_on(
    network: Network, caplog: pytest.LogCaptureFixture
) -> None:
    sent = ask(network)
    forged = receipt_from("app-c.net2.relay2", sent)
    place(network.a.inbox, forged, network.key_a, sender=RELAY_1, recipient="app-a", hops=())
    with caplog.at_level(logging.DEBUG, logger="pipwerk_relaycore"):
        result = network.a.poll()
    assert (result.receipts, result.dropped) == (0, 1)
    assert network.a.connector.waiting_count == 1
    assert "receipt dropped" in caplog.text
    deliver_and_confirm(network)
    assert network.a.poll().receipts == 1  # the real one


def test_a_receipt_without_a_waiting_message_is_discarded(
    network: Network, caplog: pytest.LogCaptureFixture
) -> None:
    unknown = make_message()
    place(
        network.a.inbox,
        receipt_from(ADDRESS_B, unknown),
        network.key_a,
        sender=RELAY_1,
        recipient="app-a",
        hops=(),
    )
    place(
        network.a.inbox,
        receipt_from(ADDRESS_B, None),
        network.key_a,
        sender=RELAY_1,
        recipient="app-a",
        hops=(),
    )
    with caplog.at_level(logging.DEBUG, logger="pipwerk_relaycore"):
        result = network.a.poll()
    assert (result.receipts, result.dropped) == (0, 2)
    assert network.a.handler.arrived == []
    assert caplog.text.count("receipt dropped") == 2


def test_a_receipt_repeated_by_the_way_counts_once(network: Network) -> None:
    sent = ask(network)
    receipt = receipt_from(ADDRESS_B, sent)
    place(network.a.inbox, receipt, network.key_a, sender=RELAY_1, recipient="app-a", hops=())
    first = network.a.poll()
    assert first.receipts == 1
    place(network.a.inbox, receipt, network.key_a, sender=RELAY_1, recipient="app-a", hops=())
    assert network.a.poll().repeated == 1
    assert len(network.a.handler.arrived) == 1


def test_receipts_and_notices_cannot_ask_for_a_receipt() -> None:
    for kind in ("relay.receipt", "relay.undeliverable"):
        with pytest.raises(ValueError, match="asks for no receipt"):
            Message.from_json(
                make_message(kind=kind).model_copy(update={"receipt": True}).to_json()
            )


# Errors of the component while it is told about a receipt ----------------------------------


class RefusingHandler(RecordingHandler):
    def __init__(self) -> None:
        super().__init__()
        self.refuse = True

    def receipt_arrived(self, arrived: ReceiptArrived) -> None:
        if self.refuse:
            raise RuntimeError("cannot show the receipt")
        super().receipt_arrived(arrived)

    def receipt_missing(self, missing: ReceiptMissing) -> None:
        if self.refuse:
            raise RuntimeError("cannot show the message")
        super().receipt_missing(missing)


def test_a_receipt_is_kept_until_the_component_has_accepted_it(network: Network) -> None:
    ask(network)
    deliver_and_confirm(network)
    handler = RefusingHandler()
    failed = network.a.connector.poll(handler)
    assert (failed.failed, failed.receipts) == (1, 0)
    assert network.a.connector.waiting_count == 1
    assert count_files(network.a.inbox) == 1
    handler.refuse = False
    assert network.a.connector.poll(handler).receipts == 1
    assert network.a.connector.waiting_count == 0


def test_a_missing_receipt_is_reported_again_until_the_component_has_accepted_it(
    network: Network,
) -> None:
    ask(network)
    network.clock.advance(hours=2)
    handler = RefusingHandler()
    assert network.a.connector.poll(handler).failed == 1
    assert network.a.connector.waiting_count == 1
    handler.refuse = False
    assert network.a.connector.poll(handler).missing_receipts == 1
    assert network.a.connector.waiting_count == 0
