"""The way ``files`` (specification 3.4): a directory in the file system."""

import errno
import json
import os
import re
import sys
import threading
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from uuid import uuid4

import pytest

from pipwerk_relaycore import (
    Envelope,
    EnvelopeRejected,
    FaultyEnvelope,
    Link,
    Message,
    ReceivedEnvelope,
    RejectionReason,
    WayError,
    WayTooLargeError,
    WayUnavailableError,
    compute_mac,
    load_way,
)
from pipwerk_relaycore.ways import files as files_module
from pipwerk_relaycore.ways.files import FilesWay
from tests.helpers import (
    EXAMPLE_KEY,
    RECIPIENT_LINK,
    SENDER_LINK,
    make_envelope,
    make_message,
)

posix_only = pytest.mark.skipif(sys.platform == "win32", reason="rights of POSIX systems")


@pytest.fixture
def inbox(tmp_path: Path) -> Path:
    path = tmp_path / "inbox"
    path.mkdir()
    return path


def make_way(directory: Path, **settings: Any) -> FilesWay:
    way = load_way("files", {"directory": str(directory), **settings})
    assert isinstance(way, FilesWay)
    return way


def names(directory: Path) -> set[str]:
    return {path.name for path in directory.iterdir()}


def send(way: FilesWay, files: list[tuple[str, bytes]] | None = None) -> Message:
    message = make_message(files or [])
    way.send(make_envelope(message), [content for _, content in files or []])
    return message


# Sending and reading -----------------------------------------------------------------------


def test_an_envelope_with_attachments_is_handed_over_read_and_acknowledged(inbox: Path) -> None:
    way = make_way(inbox)
    files = [("a.csv", b"one"), ("b.csv", b"")]
    message = send(way, files)
    assert names(inbox) == {f"{message.id}.json", f"{message.id}.0.att", f"{message.id}.1.att"}
    (item,) = make_way(inbox).read()
    assert isinstance(item, ReceivedEnvelope)
    assert item.token == str(message.id)
    assert item.attachments == (b"one", b"")
    assert item.envelope.open({SENDER_LINK: EXAMPLE_KEY}).message == message
    way.acknowledge(item.token)
    assert names(inbox) == set()
    way.acknowledge(item.token)  # repeatable


def test_an_envelope_without_attachments(inbox: Path) -> None:
    way = make_way(inbox)
    message = send(way)
    assert names(inbox) == {f"{message.id}.json"}
    (item,) = way.read()
    assert isinstance(item, ReceivedEnvelope)
    assert item.attachments == ()


def test_the_names_of_files_come_from_the_id_only(inbox: Path) -> None:
    way = make_way(inbox)
    message = send(way, [("secret-report.csv", b"x")])
    assert all(re.fullmatch(rf"{message.id}(\.0\.att|\.json)", name) for name in names(inbox))


def test_reading_does_not_remove_anything(inbox: Path) -> None:
    way = make_way(inbox)
    send(way)
    assert len(way.read()) == 1
    assert len(way.read()) == 1


def test_the_oldest_envelope_comes_first_and_the_number_is_limited(inbox: Path) -> None:
    way = make_way(inbox)
    messages = [send(way) for _ in range(5)]
    for age, message in enumerate(messages):
        path = inbox / f"{message.id}.json"
        os.utime(path, (1_700_000_000 + 100 * (4 - age), 1_700_000_000 + 100 * (4 - age)))
    tokens = [item.token for item in way.read()]
    assert tokens == [str(message.id) for message in reversed(messages)]
    assert [item.token for item in way.read(limit=2)] == tokens[:2]
    assert way.read(limit=0) == []


def test_the_time_of_arrival_is_given_in_utc(inbox: Path) -> None:
    way = make_way(inbox)
    message = send(way)
    os.utime(inbox / f"{message.id}.json", (1_700_000_000, 1_700_000_000))
    (item,) = way.read()
    assert item.modified_at.isoformat() == "2023-11-14T22:13:20+00:00"


def test_other_files_in_the_directory_are_ignored(inbox: Path) -> None:
    way = make_way(inbox)
    for name in (
        "readme.txt",
        "x.json",
        "..json",
        ".json",
        f"{uuid4()}.json.part",
        f"{uuid4()}.json.abcd.part",
        f"{str(uuid4()).upper()}.json",
        f"{uuid4()}.json~",
        f" {uuid4()}.json",
    ):
        (inbox / name).write_text("{}", encoding="utf-8")
    (inbox / f"{uuid4()}.json").mkdir()  # a directory with the name of an envelope
    assert way.read() == []


# Half written envelopes and the order ------------------------------------------------------


def test_a_half_written_envelope_is_never_seen(inbox: Path) -> None:
    way = make_way(inbox)
    message = make_message([("a.csv", b"one")])
    text = make_envelope(message).to_json()
    (inbox / f"{message.id}.0.att").write_bytes(b"one")
    # What a writer leaves behind when it stops in the middle: a part under a temporary name.
    (inbox / f"{message.id}.json.0123456789abcdef.part").write_text(text[:40], encoding="utf-8")
    assert way.read() == []


def test_the_envelope_appears_whole_or_not_at_all(
    inbox: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    way = make_way(inbox)
    message = make_message([("a.csv", b"one")])

    def fail(*_: Any, **__: Any) -> None:
        raise OSError(errno.EIO, "disk")

    real_replace = os.replace
    state = {"calls": 0}

    def replace_then_fail(source: Any, target: Any) -> None:
        state["calls"] += 1
        if state["calls"] == 2:  # the rename of the envelope
            fail()
        real_replace(source, target)

    monkeypatch.setattr(os, "replace", replace_then_fail)
    with pytest.raises(WayUnavailableError):
        way.send(make_envelope(message), [b"one"])
    assert way.read() == []
    assert names(inbox) == {f"{message.id}.0.att"}  # no part is left behind, no envelope


def test_the_attachments_are_written_before_the_envelope(
    inbox: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    order: list[str] = []
    real = files_module._write_atomic

    def record(directory: Path, name: str, content: bytes) -> None:
        order.append(name)
        real(directory, name, content)

    monkeypatch.setattr(files_module, "_write_atomic", record)
    message = send(make_way(inbox), [("a.csv", b"1"), ("b.csv", b"2"), ("c.csv", b"3")])
    assert order == [
        f"{message.id}.0.att",
        f"{message.id}.1.att",
        f"{message.id}.2.att",
        f"{message.id}.json",
    ]


def test_the_files_are_written_under_a_temporary_name_first(
    inbox: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: list[set[str]] = []
    real = os.replace

    def watch(source: Any, target: Any) -> None:
        seen.append(names(inbox))
        real(source, target)

    monkeypatch.setattr(os, "replace", watch)
    message = send(make_way(inbox), [("a.csv", b"1")])
    assert all(not name.endswith(".att") or name.endswith(".part") for name in seen[0])
    assert any(name.endswith(".part") for name in seen[0])
    assert f"{message.id}.json" not in seen[1]  # the envelope is not there before its rename


def test_a_reader_never_sees_a_broken_envelope_while_a_writer_works(inbox: Path) -> None:
    writer = make_way(inbox)
    reader = make_way(inbox)
    count = 25
    payload = os.urandom(300_000)
    finished = threading.Event()

    def write() -> None:
        try:
            for _ in range(count):
                send(writer, [("a.bin", payload)])
        finally:
            finished.set()

    thread = threading.Thread(target=write)
    thread.start()
    received = 0
    problems: list[FaultyEnvelope] = []
    while received < count:
        for item in reader.read():
            if isinstance(item, FaultyEnvelope):
                problems.append(item)
            else:
                assert item.attachments == (payload,)
                received += 1
            reader.acknowledge(item.token)
        if finished.is_set() and not names(inbox):
            break
    thread.join()
    assert problems == []
    assert received == count


# Envelopes that cannot be delivered ---------------------------------------------------------


def only_item(way: FilesWay) -> FaultyEnvelope:
    (item,) = way.read()
    assert isinstance(item, FaultyEnvelope)
    return item


def test_a_missing_attachment_is_reported_as_faulty(inbox: Path) -> None:
    way = make_way(inbox)
    message = send(way, [("a.csv", b"one"), ("b.csv", b"two")])
    (inbox / f"{message.id}.1.att").unlink()
    item = only_item(way)
    assert item.reason is RejectionReason.ATTACHMENT_MISSING
    assert item.token == str(message.id)
    way.acknowledge(item.token)  # the drop is the step of the connection; this removes the files
    assert names(inbox) == set()


def test_a_changed_attachment_is_reported_as_faulty(inbox: Path) -> None:
    way = make_way(inbox)
    message = send(way, [("a.csv", b"one")])
    (inbox / f"{message.id}.0.att").write_bytes(b"oNe")
    assert only_item(way).reason is RejectionReason.ATTACHMENT_HASH


def test_an_attachment_of_another_size_is_reported_as_faulty(inbox: Path) -> None:
    way = make_way(inbox)
    message = send(way, [("a.csv", b"one")])
    (inbox / f"{message.id}.0.att").write_bytes(b"one and more")
    assert only_item(way).reason is RejectionReason.ATTACHMENT_SIZE


def test_a_link_in_place_of_an_attachment_is_reported_as_missing(
    inbox: Path, tmp_path: Path
) -> None:
    way = make_way(inbox)
    message = send(way, [("a.csv", b"one")])
    target = tmp_path / "other.bin"
    target.write_bytes(b"one")
    (inbox / f"{message.id}.0.att").unlink()
    try:
        (inbox / f"{message.id}.0.att").symlink_to(target)
    except OSError:
        pytest.skip("links are not available")
    assert only_item(way).reason is RejectionReason.ATTACHMENT_MISSING


def test_an_attachment_larger_than_the_way_allows_is_reported_as_faulty(inbox: Path) -> None:
    message = make_message([("a.csv", b"x" * 100)])
    make_way(inbox).send(make_envelope(message), [b"x" * 100])
    assert only_item(make_way(inbox, max_attachment_bytes=50)).reason is RejectionReason.TOO_LARGE


def test_an_unreadable_envelope_is_reported_as_faulty(inbox: Path) -> None:
    way = make_way(inbox)
    token = uuid4()
    for content, reason in (
        (b"not json", RejectionReason.MALFORMED),
        (b"\xff\xfe", RejectionReason.MALFORMED),
        (b"", RejectionReason.MALFORMED),
        (b"[]", RejectionReason.MALFORMED),
    ):
        (inbox / f"{token}.json").write_bytes(content)
        item = only_item(way)
        assert (item.token, item.reason) == (str(token), reason)


def test_an_envelope_of_another_format_is_reported_as_faulty(inbox: Path) -> None:
    data = json.loads(make_envelope().to_json())
    data["format"] = "pipwerk-relay/9"
    token = uuid4()
    (inbox / f"{token}.json").write_text(json.dumps(data), encoding="utf-8")
    assert only_item(make_way(inbox)).reason is RejectionReason.UNSUPPORTED_FORMAT


def test_an_envelope_larger_than_the_way_allows_is_reported_as_faulty(inbox: Path) -> None:
    send(make_way(inbox))
    assert only_item(make_way(inbox, max_envelope_bytes=100)).reason is RejectionReason.TOO_LARGE


def test_an_envelope_under_the_name_of_another_message_is_reported_as_faulty(inbox: Path) -> None:
    message = make_message()
    (inbox / f"{uuid4()}.json").write_text(make_envelope(message).to_json(), encoding="utf-8")
    assert only_item(make_way(inbox)).reason is RejectionReason.BAD_BODY


def test_an_envelope_with_stored_set_is_reported_as_faulty(inbox: Path) -> None:
    message = make_message()
    stored = [{"name": "a.csv", "way": "filestore", "location": "x"}]
    body = json.dumps({"message": json.loads(message.to_json()), "hops": [], "stored": stored})
    link = Link.model_validate(
        {
            "from": SENDER_LINK,
            "to": RECIPIENT_LINK,
            "mac": compute_mac(EXAMPLE_KEY, SENDER_LINK, RECIPIENT_LINK, body),
        }
    )
    envelope = Envelope(format="pipwerk-relay/1", body=body, link=link)
    (inbox / f"{message.id}.json").write_text(envelope.to_json(), encoding="utf-8")
    assert only_item(make_way(inbox)).reason is RejectionReason.STORED_NOT_SUPPORTED


@posix_only
def test_a_link_in_place_of_an_envelope_is_ignored(inbox: Path, tmp_path: Path) -> None:
    message = make_message()
    target = tmp_path / "outside.json"
    target.write_text(make_envelope(message).to_json(), encoding="utf-8")
    (inbox / f"{message.id}.json").symlink_to(target)
    assert make_way(inbox).read() == []


# Sending: checks ----------------------------------------------------------------------------


def test_an_envelope_larger_than_the_way_allows_is_not_sent(inbox: Path) -> None:
    way = make_way(inbox, max_envelope_bytes=100)
    with pytest.raises(WayTooLargeError):
        way.send(make_envelope(), [])
    assert names(inbox) == set()


def test_an_attachment_larger_than_the_way_allows_is_not_sent(inbox: Path) -> None:
    way = make_way(inbox, max_attachment_bytes=3)
    message = make_message([("a.csv", b"ok!"), ("b.csv", b"too long")])
    with pytest.raises(WayTooLargeError):
        way.send(make_envelope(message), [b"ok!", b"too long"])
    assert names(inbox) == set()


def test_attachments_that_do_not_belong_to_the_message_are_not_sent(inbox: Path) -> None:
    way = make_way(inbox)
    message = make_message([("a.csv", b"one")])
    with pytest.raises(EnvelopeRejected):
        way.send(make_envelope(message), [b"two"])
    with pytest.raises(EnvelopeRejected):
        way.send(make_envelope(message), [])
    assert names(inbox) == set()


def test_an_envelope_with_a_body_that_is_no_body_is_not_sent(inbox: Path) -> None:
    link = Link.model_validate({"from": "a", "to": "b", "mac": "0" * 64})
    with pytest.raises(EnvelopeRejected):
        make_way(inbox).send(Envelope(format="pipwerk-relay/1", body="x", link=link), [])


def test_sending_the_same_message_again_replaces_the_files_whole(inbox: Path) -> None:
    way = make_way(inbox)
    message = make_message([("a.csv", b"one")])
    envelope = make_envelope(message)
    way.send(envelope, [b"one"])
    way.send(envelope, [b"one"])
    assert len(way.read()) == 1
    assert names(inbox) == {f"{message.id}.json", f"{message.id}.0.att"}


# Names with path characters ----------------------------------------------------------------


@pytest.mark.parametrize(
    "token",
    [
        "../x",
        "a/b",
        "..",
        "",
        "x" * 36,
        str(uuid4()).upper(),
        f"{uuid4()}/../..",
        f"{uuid4()}\n",
        "\x00",
        f"{uuid4()}.json",
        "C:\\x",
        "*",
    ],
)
def test_a_token_that_is_no_message_id_is_refused(inbox: Path, token: str) -> None:
    (inbox / "keep.txt").write_text("x", encoding="utf-8")
    (inbox.parent / "outside.txt").write_text("x", encoding="utf-8")
    with pytest.raises(WayError):
        make_way(inbox).acknowledge(token)
    assert (inbox / "keep.txt").exists()
    assert (inbox.parent / "outside.txt").exists()


def test_acknowledging_removes_only_the_files_of_that_message(inbox: Path) -> None:
    way = make_way(inbox)
    first = send(way, [("a.csv", b"1")])
    second = send(way, [("a.csv", b"2")])
    (inbox / "unrelated.att").write_text("x", encoding="utf-8")
    way.acknowledge(str(first.id))
    assert names(inbox) == {f"{second.id}.json", f"{second.id}.0.att", "unrelated.att"}


# A directory that cannot be reached ----------------------------------------------------------


def test_a_directory_that_is_not_reachable_is_a_repeatable_error(tmp_path: Path) -> None:
    way = make_way(tmp_path / "gone")
    for call in (
        lambda: way.send(make_envelope(), []),
        way.read,
        lambda: way.acknowledge(str(uuid4())),
    ):
        with pytest.raises(WayUnavailableError) as raised:
            call()
        assert "gone" not in str(raised.value)
        assert str(tmp_path) not in str(raised.value)


def test_a_directory_that_disappears_while_the_way_runs(inbox: Path) -> None:
    way = make_way(inbox)
    send(way)
    for path in inbox.iterdir():
        path.unlink()
    inbox.rmdir()
    with pytest.raises(WayUnavailableError):
        way.read()
    inbox.mkdir()
    assert way.read() == []  # the way works again when the directory is back


def test_a_file_in_place_of_the_directory(tmp_path: Path) -> None:
    path = tmp_path / "file"
    path.write_text("x", encoding="utf-8")
    with pytest.raises(WayUnavailableError):
        make_way(path).read()


@posix_only
@pytest.mark.skipif(sys.platform != "win32" and os.geteuid() == 0, reason="root ignores rights")
def test_a_directory_without_rights_is_a_repeatable_error(inbox: Path) -> None:
    way = make_way(inbox)
    inbox.chmod(0o000)
    try:
        for call in (lambda: way.send(make_envelope(), []), way.read):
            with pytest.raises(WayUnavailableError) as raised:
                call()
            assert "EACCES" in str(raised.value)
    finally:
        inbox.chmod(0o700)


def test_the_error_of_an_unreachable_directory_is_not_a_refusal(tmp_path: Path) -> None:
    assert issubclass(WayUnavailableError, WayError)
    assert not issubclass(WayUnavailableError, WayTooLargeError)


# Cleaning up leftovers -------------------------------------------------------------------------


def age(path: Path, seconds: float) -> None:
    """Make a file look as if it was changed ``seconds`` ago."""
    moment = datetime.now(UTC).timestamp() - seconds
    os.utime(path, (moment, moment))


def test_clean_up_removes_old_unfinished_files_and_attachments_without_an_envelope(
    inbox: Path,
) -> None:
    way = make_way(inbox)
    complete = send(way, [("a.csv", b"one")])
    lonely_id = uuid4()
    unfinished = [
        inbox / f"{lonely_id}.json.0123456789abcdef.part",
        inbox / f"{lonely_id}.0.att.0123456789abcdef.part",
    ]
    lonely_attachment = inbox / f"{lonely_id}.0.att"
    for path in (*unfinished, lonely_attachment):
        path.write_bytes(b"x")
        age(path, 7200)
    removed = way.clean_up(timedelta(hours=1), datetime.now(UTC))
    assert removed == 3
    assert names(inbox) == {f"{complete.id}.json", f"{complete.id}.0.att"}


def test_clean_up_keeps_what_is_not_old_enough_and_what_belongs_to_an_envelope(
    inbox: Path,
) -> None:
    way = make_way(inbox)
    message = send(way, [("a.csv", b"one")])
    for path in inbox.iterdir():
        age(path, 7200)  # an old attachment with its envelope stays
    young = inbox / f"{uuid4()}.0.att"
    young.write_bytes(b"x")
    unfinished = inbox / f"{uuid4()}.json.0123456789abcdef.part"
    unfinished.write_bytes(b"x")
    assert way.clean_up(timedelta(hours=1), datetime.now(UTC)) == 0
    assert names(inbox) == {
        f"{message.id}.json",
        f"{message.id}.0.att",
        young.name,
        unfinished.name,
    }


def test_clean_up_touches_only_files_of_the_way(inbox: Path) -> None:
    way = make_way(inbox)
    foreign = [
        inbox / "notes.txt",
        inbox / "x.part",
        inbox / f"{uuid4()}.json.part",
        inbox / f"{str(uuid4()).upper()}.0.att",
    ]
    for path in foreign:
        path.write_bytes(b"x")
        age(path, 7200)
    (inbox / "folder.0.att").mkdir()
    assert way.clean_up(timedelta(hours=1), datetime.now(UTC)) == 0
    assert len(names(inbox)) == len(foreign) + 1


def test_clean_up_of_an_unreachable_directory_is_a_repeatable_error(tmp_path: Path) -> None:
    way = make_way(tmp_path / "gone")
    with pytest.raises(WayUnavailableError):
        way.clean_up(timedelta(hours=1), datetime.now(UTC))
