"""The connector of a component (specification 3.5, E4, req-relay-010)."""

import logging
from collections.abc import Iterator
from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest

from pipwerk_relaycore import (
    FORMAT,
    Address,
    ConnectionKey,
    Connector,
    ConnectorConfig,
    Envelope,
    Link,
    Message,
    UndeliverableContent,
    UndeliverableReason,
    WayConfig,
    WayLoadError,
    WaySettingsError,
    WayTooLargeError,
    WayUnavailableError,
    compute_mac,
)
from tests.helpers import make_message
from tests.network import ADDRESS_A, ADDRESS_B, RELAY_1, RELAY_2, Network, count_files, place

CONTENT_WORD = "hello"  # the content of make_message: it must never reach the log


@pytest.fixture
def network(tmp_path: Path) -> Iterator[Network]:
    network = Network(tmp_path)
    yield network
    network.close()


def sent_to_b(network: Network, files: list[tuple[str, bytes]] | None = None) -> Message:
    return network.a.connector.send(
        ADDRESS_B, "example.request", {"text": CONTENT_WORD}, attachments=files or ()
    )


# Sending and receiving -----------------------------------------------------------------------


def test_a_message_with_attachments_travels_over_two_relays_and_arrives_checked(
    network: Network,
) -> None:
    files = [("a.csv", b"one,two\n"), ("empty.bin", b"")]
    sent = sent_to_b(network, files)
    assert network.relay_step() == 2
    result = network.b.poll()
    assert (result.delivered, result.dropped, result.repeated) == (1, 0, 0)
    (received,) = network.b.handler.stored
    assert received.message == sent
    assert received.files == dict(files)
    assert received.hops == (RELAY_1, RELAY_2)
    assert count_files(network.b.inbox) == 0  # acknowledged after storing


def test_nothing_is_handed_over_before_the_message_is_checked(network: Network) -> None:
    sent_to_b(network)
    network.relay_step()
    assert count_files(network.b.inbox) == 1  # the envelope is there, nothing else happened
    assert network.b.handler.stored == []


def test_the_answer_comes_back_over_the_same_way(network: Network) -> None:
    request = sent_to_b(network)
    network.relay_step()
    network.b.poll()
    answer = network.b.connector.send(
        ADDRESS_A,
        "example.answer",
        {"ok": True},
        reference_id=request.id,
        attachments=[("result.txt", b"done")],
    )
    network.relay_step()
    network.a.poll()
    (received,) = network.a.handler.stored
    assert received.message == answer
    assert received.message.reference_id == request.id
    assert received.files == {"result.txt": b"done"}


def test_the_priority_is_passed_on_unchanged(network: Network) -> None:
    network.a.connector.send(ADDRESS_B, "example.request", {}, priority="urgent_1")
    network.relay_step()
    network.b.poll()
    assert network.b.handler.stored[0].message.priority == "urgent_1"


# Repetition (E4) -----------------------------------------------------------------------------


def test_a_repetition_is_not_handed_over_again_but_acknowledged(network: Network) -> None:
    message = make_message([("f.csv", b"data")])
    place(network.b.inbox, message, network.key_b, [b"data"])
    assert network.b.poll().delivered == 1
    place(network.b.inbox, message, network.key_b, [b"data"])
    again = network.b.poll()
    assert (again.delivered, again.repeated) == (0, 1)
    assert len(network.b.handler.stored) == 1
    assert count_files(network.b.inbox) == 0


def test_a_repetition_after_a_restart_is_recognised(network: Network) -> None:
    message = make_message()
    place(network.b.inbox, message, network.key_b)
    network.b.poll()
    network.b.restart()
    place(network.b.inbox, message, network.key_b)
    assert network.b.poll().repeated == 1
    assert len(network.b.handler.stored) == 1


def test_a_repetition_with_another_number_of_hops_counts_as_repetition(network: Network) -> None:
    message = make_message()
    place(network.b.inbox, message, network.key_b, hops=("net1.relay1",))
    network.b.poll()
    place(network.b.inbox, message, network.key_b, hops=("net1.relay1", "net9.relay9"))
    assert network.b.poll().repeated == 1
    assert len(network.b.handler.stored) == 1


def test_the_id_counts_as_seen_for_the_period_only(network: Network) -> None:
    message = make_message()
    place(network.b.inbox, message, network.key_b)
    network.b.poll()
    network.clock.advance(days=6, hours=23)
    place(network.b.inbox, message, network.key_b)
    assert network.b.poll().repeated == 1
    network.clock.advance(days=7, hours=1)
    place(network.b.inbox, message, network.key_b)
    assert network.b.poll().delivered == 1
    assert len(network.b.handler.stored) == 2


def test_the_period_is_adjustable(network: Network) -> None:
    network.b.restart(seen_for=timedelta(minutes=10))
    message = make_message()
    place(network.b.inbox, message, network.key_b)
    network.b.poll()
    network.clock.advance(minutes=11)
    place(network.b.inbox, message, network.key_b)
    assert network.b.poll().delivered == 1


# What is not accepted (req-relay-010) -------------------------------------------------------


def forged_with_wrong_key(network: Network) -> None:
    place(network.b.inbox, make_message(), ConnectionKey.generate())


def forged_from_unknown_side(network: Network) -> None:
    place(network.b.inbox, make_message(), network.key_b, sender="net7.relay7")


def meant_for_another_component(network: Network) -> None:
    place(network.b.inbox, make_message(), network.key_b, recipient="app-x")


def addressed_to_another_component(network: Network) -> None:
    message = make_message().model_copy(update={"recipient": "app-x.net2.relay2"})
    place(network.b.inbox, message, network.key_b)


def receipt_asking_for_a_receipt(network: Network) -> None:
    # The model refuses such a message, so the text of the body is changed by hand and the check
    # value is formed anew: a sender that does not use this library could do the same.
    valid = make_message(kind="relay.receipt").model_copy(update={"content": {}})
    body = place_body(valid, '"receipt":false', '"receipt":true')
    link = Link.model_validate(
        {
            "from": RELAY_2,
            "to": "app-b",
            "mac": compute_mac(network.key_b, RELAY_2, "app-b", body),
        }
    )
    forged = Envelope(format=FORMAT, body=body, link=link)
    (network.b.inbox / f"{valid.id}.json").write_text(forged.to_json(), encoding="utf-8")


def place_body(message: Message, old: str, new: str) -> str:
    body = Envelope.create(
        message, hops=(), sender="app-a", recipient=RELAY_1, key=ConnectionKey.generate()
    ).body
    assert old in body
    return body.replace(old, new)


def content_that_does_not_fit_the_kind(network: Network) -> None:
    place(network.b.inbox, make_message(kind="relay.receipt"), network.key_b)


@pytest.mark.parametrize(
    ("forge", "reason"),
    [
        (forged_with_wrong_key, "bad_mac"),
        (forged_from_unknown_side, "unknown_link"),
        (meant_for_another_component, "wrong_recipient"),
        (addressed_to_another_component, "wrong_recipient"),
        (receipt_asking_for_a_receipt, "bad_body"),
        (content_that_does_not_fit_the_kind, "bad_content"),
    ],
)
def test_what_does_not_pass_is_dropped_noted_without_content_and_not_answered(
    network: Network, caplog: pytest.LogCaptureFixture, forge: object, reason: str
) -> None:
    with caplog.at_level(logging.DEBUG, logger="pipwerk_relaycore"):
        forge(network)  # type: ignore[operator]
        result = network.b.poll()
    assert (result.delivered, result.dropped) == (0, 1)
    assert network.b.handler.stored == []
    assert count_files(network.b.inbox) == 0
    assert count_files(network.b.outbox) == 0  # no notice to anybody (specification 4.1)
    assert f"reason={reason}" in caplog.text
    assert CONTENT_WORD not in caplog.text


def test_a_broken_file_is_dropped(network: Network, caplog: pytest.LogCaptureFixture) -> None:
    (network.b.inbox / "0b0a6f3e-2f1d-4a58-9a52-6a6a1f1c2d11.json").write_text("{not json}")
    with caplog.at_level(logging.DEBUG, logger="pipwerk_relaycore"):
        assert network.b.poll().dropped == 1
    assert "reason=malformed" in caplog.text
    assert count_files(network.b.inbox) == 0


def test_a_changed_attachment_is_dropped_after_the_grace_period(
    network: Network, caplog: pytest.LogCaptureFixture
) -> None:
    message = make_message([("f.csv", b"data")])
    place(network.b.inbox, message, network.key_b, [b"data"])
    (network.b.inbox / f"{message.id}.0.att").write_bytes(b"DATA")
    with caplog.at_level(logging.DEBUG, logger="pipwerk_relaycore"):
        first = network.b.poll()
        assert (first.postponed, first.dropped) == (1, 0)  # may be a delay of the file system
        assert count_files(network.b.inbox) == 2
        network.clock.advance(minutes=6)
        later = network.b.poll()
    assert (later.postponed, later.dropped) == (0, 1)
    assert "reason=attachment_size" in caplog.text or "reason=attachment_hash" in caplog.text
    assert network.b.handler.stored == []
    assert count_files(network.b.inbox) == 0


def test_an_attachment_that_arrives_late_is_still_delivered(network: Network) -> None:
    message = make_message([("f.csv", b"data")])
    place(network.b.inbox, message, network.key_b, [b"data"])
    attachment = network.b.inbox / f"{message.id}.0.att"
    content = attachment.read_bytes()
    attachment.unlink()
    assert network.b.poll().postponed == 1
    attachment.write_bytes(content)
    assert network.b.poll().delivered == 1


def test_the_grace_period_is_adjustable(network: Network) -> None:
    network.b.restart(attachment_grace=timedelta(seconds=1))
    message = make_message([("f.csv", b"data")])
    place(network.b.inbox, message, network.key_b, [b"data"])
    (network.b.inbox / f"{message.id}.0.att").unlink()
    network.clock.advance(seconds=2)
    assert network.b.poll().dropped == 1


# Errors of the component and of the ways ---------------------------------------------------


def test_a_component_that_fails_gets_the_message_again(
    network: Network, caplog: pytest.LogCaptureFixture
) -> None:
    sent_to_b(network)
    network.relay_step()
    network.b.handler.failure = RuntimeError(f"disk full while saving {CONTENT_WORD}")
    with caplog.at_level(logging.DEBUG, logger="pipwerk_relaycore"):
        failed = network.b.poll()
    assert (failed.failed, failed.delivered) == (1, 0)
    assert count_files(network.b.inbox) == 1  # not acknowledged
    assert "RuntimeError" in caplog.text
    assert CONTENT_WORD not in caplog.text  # the text of the error stays out of the log
    network.b.handler.failure = None
    assert network.b.poll().delivered == 1
    assert len(network.b.handler.stored) == 1
    assert count_files(network.b.inbox) == 0


def test_a_component_that_ends_before_it_has_stored_gets_the_message_again(
    network: Network,
) -> None:
    sent_to_b(network)
    network.relay_step()
    network.b.handler.failure = KeyboardInterrupt()  # the component ends: not an error
    with pytest.raises(KeyboardInterrupt):
        network.b.poll()
    network.b.handler.failure = None
    network.b.restart()
    assert network.b.poll().delivered == 1


def test_an_unreachable_inbox_does_not_stop_the_component(
    network: Network, caplog: pytest.LogCaptureFixture
) -> None:
    sent_to_b(network)
    network.relay_step()
    away = network.b.inbox.with_name("inbox_b_away")
    network.b.inbox.rename(away)
    with caplog.at_level(logging.DEBUG, logger="pipwerk_relaycore"):
        result = network.b.poll()
    assert result.available is False
    assert "not available" in caplog.text
    away.rename(network.b.inbox)
    assert network.b.poll().delivered == 1


def test_sending_to_an_unreachable_target_raises_and_leaves_nothing_waiting(
    network: Network,
) -> None:
    away = network.a.outbox.with_name("outbox_a_away")
    network.a.outbox.rename(away)
    with pytest.raises(WayUnavailableError):
        network.a.connector.send(ADDRESS_B, "example.request", {}, receipt=True)
    assert network.a.connector.waiting_count == 0
    away.rename(network.a.outbox)


def test_an_attachment_over_the_limit_of_the_way_is_refused(tmp_path: Path) -> None:
    (tmp_path / "out").mkdir()
    (tmp_path / "in").mkdir()
    config = ConnectorConfig(
        address=Address.parse(ADDRESS_A),
        key=ConnectionKey.generate(),
        target=WayConfig("files", {"directory": str(tmp_path / "out"), "max_attachment_bytes": 4}),
        inbox=WayConfig("files", {"directory": str(tmp_path / "in")}),
        database=tmp_path / "a.db",
    )
    with Connector(config) as connector:
        with pytest.raises(WayTooLargeError):
            connector.send(ADDRESS_B, "example.request", {}, attachments=[("f.bin", b"12345")])
        connector.send(ADDRESS_B, "example.request", {}, attachments=[("f.bin", b"1234")])


# Checks when sending and of the configuration ------------------------------------------------


def test_sending_checks_the_message(network: Network) -> None:
    connector = network.a.connector
    with pytest.raises(ValueError, match="asks for no receipt"):
        connector.send(ADDRESS_B, "relay.receipt", {}, receipt=True)
    with pytest.raises(ValueError, match="asks for no receipt"):
        connector.send(
            ADDRESS_B,
            "relay.undeliverable",
            UndeliverableContent.of(UndeliverableReason.LOOP, ADDRESS_A, "k").to_content(),
            receipt=True,
        )
    with pytest.raises(ValueError, match="does not fit"):
        connector.send(ADDRESS_B, "probe.message", {"text": ""})
    with pytest.raises(ValueError, match="deadline"):
        connector.send(ADDRESS_B, "example.request", {}, receipt_timeout=timedelta(minutes=1))
    with pytest.raises(ValueError, match="deadline"):
        connector.send(ADDRESS_B, "example.request", {}, receipt=True, receipt_timeout=timedelta(0))
    with pytest.raises(ValueError):
        connector.send("not-an-address", "example.request", {})
    with pytest.raises(ValueError):
        connector.send(ADDRESS_B, "example.request", {}, attachments=[("../x", b"")])
    with pytest.raises(ValueError):
        connector.send(ADDRESS_B, "example.request", {}, attachments=[("a", b""), ("a", b"")])
    assert count_files(network.a.outbox) == 0


def make_config(tmp_path: Path, **changes: Any) -> ConnectorConfig:
    values: dict[str, Any] = {
        "address": Address.parse(ADDRESS_A),
        "key": ConnectionKey.generate(),
        "target": WayConfig("files", {"directory": str(tmp_path)}),
        "inbox": WayConfig("files", {"directory": str(tmp_path)}),
        "database": tmp_path / "a.db",
    }
    return ConnectorConfig(**{**values, **changes})


def test_the_configuration_is_checked(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="seen_for"):
        make_config(tmp_path, seen_for=timedelta(0))
    with pytest.raises(ValueError, match="receipt_timeout"):
        make_config(tmp_path, receipt_timeout=timedelta(seconds=-1))
    with pytest.raises(ValueError, match="attachment_grace"):
        make_config(tmp_path, attachment_grace=timedelta(0))
    with pytest.raises(ValueError):
        make_config(tmp_path, relay_link="no-network-part")
    config = make_config(tmp_path)
    assert (config.component, config.relay) == ("app-a", "net1.relay1")
    assert make_config(tmp_path, relay_link="net5.relay5").relay == "net5.relay5"


def test_a_way_that_is_unknown_or_has_wrong_settings_stops_the_connector(tmp_path: Path) -> None:
    with pytest.raises(WayLoadError):
        Connector(make_config(tmp_path, target=WayConfig("nowhere")))
    with pytest.raises(WaySettingsError):
        Connector(make_config(tmp_path, inbox=WayConfig("files", {"folder": "x"})))
    assert not (tmp_path / "a.db").exists()  # nothing is opened before the ways are loaded


def test_the_name_of_the_relay_side_can_differ_from_the_address(tmp_path: Path) -> None:
    key = ConnectionKey.generate()
    (tmp_path / "out").mkdir()
    (tmp_path / "in").mkdir()
    config = ConnectorConfig(
        address=Address.parse(ADDRESS_B),
        key=key,
        target=WayConfig("files", {"directory": str(tmp_path / "out")}),
        inbox=WayConfig("files", {"directory": str(tmp_path / "in")}),
        database=tmp_path / "b.db",
        relay_link="net8.relay8",
    )
    with Connector(config) as connector:
        connector.send(ADDRESS_A, "example.request", {})
    (item,) = (tmp_path / "out").glob("*.json")
    assert '"to":"net8.relay8"' in item.read_text()
