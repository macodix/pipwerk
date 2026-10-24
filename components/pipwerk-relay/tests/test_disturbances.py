"""The disturbances 1 to 7 of the specification (section 8), with two relays, a directory in
common (the stand-in for the network drive) and the probe.

Every test names the disturbance, brings it about, lets the probe send and checks the expected
result. The relays are worked in steps by ``Bench``; the clock is the one of the test. The
disturbance 3 also runs with real processes (section "A relay that is ended hard").

1. The relay of the recipient is ended.
2. The directory in common cannot be reached.
3. A relay is ended hard while it works.
4. An envelope or a file is changed, or an envelope has the wrong key.
5. The same envelope comes once more.
6. Recipient or relay unknown, a loop over two relays, a message that is too large.
7. The receiving component does not run.

The disturbance 3 during a delivery of the retrieval is tested with ``pipwerk-fetch-mt5``
(order 5).
"""

import json
import logging
import shutil
import signal
import subprocess
import sys
import time
from collections.abc import Callable
from datetime import timedelta
from pathlib import Path

import pytest
from pipwerk_relaycore import (
    Address,
    ConnectionKey,
    Connector,
    ConnectorConfig,
    SecretsDirectory,
    WayConfig,
)

from tests.crash import CrashPlan, install
from tests.installation import Install, make_install
from tests.probe_bench import ADDRESS_FIRST, ADDRESS_SECOND, Bench, Outcome
from tests.support import RecordingHandler, names, write_key_copy

TEXT = "text-of-the-message-7d3f1c"
DATA = bytes(range(256)) * 80  # 20 KB


@pytest.fixture(autouse=True)
def log_everything(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger="pipwerk_relay")
    caplog.set_level(logging.INFO, logger="pipwerk_relaycore")


def sent_id(outcome: Outcome) -> str:
    """The id of the message from the line ``Sent message <id> to ...``."""
    return outcome.out.split()[2]


def assert_arrived_once(bench: Bench) -> Path:
    """One message with the file unchanged at the listening probe of the second relay."""
    (directory,) = bench.received(bench.second)
    assert (directory / "files" / "data.bin").read_bytes() == DATA
    assert len(bench.second.components["listen"].handler.stored) == 1
    return directory


# --- without a disturbance ----------------------------------------------------------------------


def test_without_a_disturbance_the_message_and_the_file_arrive_and_the_receipt_comes_back(
    tmp_path: Path,
) -> None:
    bench = Bench(tmp_path)
    try:
        outcome = bench.send(bench.first, ADDRESS_SECOND, text=TEXT, files=[("data.bin", DATA)])
        assert outcome.code == 0
        assert "Receipt: message " in outcome.out
        assert_arrived_once(bench)
        back = bench.send(bench.second, ADDRESS_FIRST, files=[("data.bin", DATA)])
        assert back.code == 0  # and the other way round
        assert bench.first.queue_size() == bench.second.queue_size() == 0
        assert names(bench.world.shared_directory / "in-r1") == set()
        assert names(bench.world.shared_directory / "in-r2") == set()
    finally:
        bench.close()


# --- 1. the relay of the recipient is ended -----------------------------------------------------


def test_1_the_message_waits_in_the_common_directory_and_is_delivered_after_the_start(
    tmp_path: Path,
) -> None:
    bench = Bench(tmp_path)
    try:
        bench.stopped.add("r2")
        waiting: list[int] = []

        def start_the_relay() -> None:
            waiting.append(len(list((bench.world.shared_directory / "in-r2").glob("*.json"))))
            bench.stopped.discard("r2")

        bench.at(200, start_the_relay)
        outcome = bench.send(
            bench.first, ADDRESS_SECOND, text=TEXT, files=[("data.bin", DATA)], wait=900
        )
        assert waiting == [1]  # it waited in the directory of the relay that was ended
        assert outcome.code == 0
        assert "Receipt: message " in outcome.out
        assert_arrived_once(bench)
        assert bench.first.queue_size() == 0  # the first relay handed it over at once
    finally:
        bench.close()


def test_1_without_the_start_the_receipt_does_not_come(tmp_path: Path) -> None:
    bench = Bench(tmp_path)
    try:
        bench.stopped.add("r2")
        outcome = bench.send(bench.first, ADDRESS_SECOND, wait=100)
        assert outcome.code == 1
        assert "No receipt: message" in outcome.err
        assert bench.received(bench.second) == []
        assert len(list((bench.world.shared_directory / "in-r2").glob("*.json"))) == 1
    finally:
        bench.close()


# --- 2. the directory in common cannot be reached -----------------------------------------------


def disconnect(bench: Bench) -> Callable[[], None]:
    gone = bench.world.root / "shared-disconnected"

    def action() -> None:
        bench.world.shared_directory.rename(gone)

    return action


def connect(bench: Bench) -> Callable[[], None]:
    gone = bench.world.root / "shared-disconnected"

    def action() -> None:
        gone.rename(bench.world.shared_directory)

    return action


def test_2_the_queue_shows_the_message_waiting_and_it_is_delivered_after_the_reconnection(
    tmp_path: Path, caplog: pytest.LogCaptureFixture, capsys: pytest.CaptureFixture[str]
) -> None:
    bench = Bench(tmp_path, deadline=3600)
    try:
        disconnect(bench)()
        shown: list[str] = []
        bench.at(
            100, lambda: shown.append(bench.queue(bench.first, lambda: capsys.readouterr().out))
        )
        bench.at(300, connect(bench))
        outcome = bench.send(
            bench.first, ADDRESS_SECOND, text=TEXT, files=[("data.bin", DATA)], wait=900
        )
        assert outcome.code == 0
        assert "Receipt: message " in outcome.out
        assert_arrived_once(bench)
        # the queue showed the message waiting, with the failed attempts
        (queue,) = shown
        row = next(line for line in queue.splitlines() if sent_id(outcome) in line)
        assert " retrying " in row
        assert "WayUnavailableError" in row
        assert "1 messages in the queue" in queue
        assert bench.first.queue_size() == 0
    finally:
        bench.close()
    # the relays kept working: they noted the error in the log and tried again later
    assert "inbox shared is not available" in caplog.text
    assert "not handed over (WayUnavailableError); attempt" in caplog.text
    attempts = [line for line in caplog.text.splitlines() if "not handed over" in line]
    pauses = [float(line.rsplit("next in ", 1)[1].split(" ")[0]) for line in attempts]
    assert len(pauses) >= 3
    assert pauses == sorted(pauses)  # the pauses grow
    assert TEXT not in caplog.text


def test_2_with_a_short_period_the_sender_gets_relay_unreachable(tmp_path: Path) -> None:
    bench = Bench(tmp_path, deadline=120)
    try:
        disconnect(bench)()
        outcome = bench.send(bench.first, ADDRESS_SECOND, files=[("data.bin", DATA)], wait=1000)
        assert outcome.code == 1
        assert "is undeliverable (relay_unreachable): " in outcome.err
        assert "No receipt" not in outcome.err  # the notice ends the waiting
        assert bench.first.queue_size() == 0
        connect(bench)()
        bench.settle()
        assert bench.received(bench.second) == []  # it was not delivered later
    finally:
        bench.close()


def test_2_the_components_go_on_reading_while_the_directory_is_gone(tmp_path: Path) -> None:
    bench = Bench(tmp_path)
    try:
        disconnect(bench)()
        # a message inside one relay does not need the directory in common
        outcome = bench.send(bench.first, ADDRESS_FIRST, files=[("data.bin", DATA)], wait=120)
        assert outcome.code == 0
        (directory,) = bench.received(bench.first)
        assert (directory / "files" / "data.bin").read_bytes() == DATA
    finally:
        bench.close()


# --- 3. a relay is ended hard while it works ----------------------------------------------------


@pytest.mark.parametrize("after", [False, True], ids=["before-the-step", "after-the-step"])
def test_3_a_relay_ended_hard_at_any_step_loses_nothing_and_the_file_arrives_once(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, after: bool
) -> None:
    def run(plan: CrashPlan, root: Path) -> None:
        with monkeypatch.context() as patch:
            install(patch, plan)
            bench = Bench(root, plan=plan)
            try:
                outcome = bench.send(
                    bench.first, ADDRESS_SECOND, text=TEXT, files=[("data.bin", DATA)], wait=900
                )
                assert plan.crash_at is None, "the planned step was never reached"
                assert outcome.code == 0, (plan.names, outcome)
                assert_arrived_once(bench)
                bench.settle()
                for site in bench.world.sites.values():
                    assert site.queue_size() == 0
                    assert names(site.attachments_directory) == set()
                assert names(bench.world.shared_directory / "in-r2") == set()
                assert names(bench.world.shared_directory / "in-r1") == set()
            finally:
                bench.close()

    counting = CrashPlan()
    run(counting, tmp_path / "count")
    assert counting.count >= 20
    for number in range(1, counting.count + 1):
        run(CrashPlan(number, after=after), tmp_path / f"run-{number}-{after}")


def prepare_pair(root: Path) -> tuple[Install, Install]:
    """Two relays as an operator sets them up, with a directory in common, a sending component
    on the first and a listening component on the second."""
    shared = root / "shared"
    shared.mkdir(parents=True)
    installs: list[Install] = []
    for name in ("r1", "r2"):
        folder = root / name
        folder.mkdir()
        install_ = make_install(folder)
        assert install_.run("migrate") == 0
        for component in ("send", "listen"):
            assert install_.run("key", "new", f"comp-{component}") == 0
            (folder / f"out-{component}").mkdir()
        (folder / "in").mkdir()
        (shared / f"in-{name}").mkdir()
        installs.append(install_)
    first, second = installs
    key = SecretsDirectory(first.secrets).new_key("relay-r2")
    write_key_copy(second.secrets, "relay-r1", key)
    for install_, name, other in ((first, "r1", "r2"), (second, "r2", "r1")):
        document = {
            "network": "net1",
            "name": name,
            "inputs": [
                {
                    "name": "main",
                    "way": "files",
                    "settings": {"directory": str(install_.root / "in")},
                },
                {
                    "name": "shared",
                    "way": "files",
                    "settings": {"directory": str(shared / f"in-{name}")},
                },
            ],
            "components": [
                {
                    "name": component,
                    "way": "files",
                    "settings": {"directory": str(install_.root / f"out-{component}")},
                    "key_file": f"comp-{component}",
                }
                for component in ("send", "listen")
            ],
            "address_book": [
                {
                    "network": "net1",
                    "relay": other,
                    "way": "files",
                    "settings": {"directory": str(shared / f"in-{other}")},
                    "key_file": f"relay-{other}",
                    "standard": False,
                }
            ],
            "periods": {"read_interval_seconds": 0.05, "retry_first_seconds": 1},
        }
        assert install_.run("config", "load", str(install_.write_config(document))) == 0
    return first, second


def start_relay(install_: Install) -> subprocess.Popen[bytes]:
    return subprocess.Popen(  # noqa: S603 - the program is this interpreter with this package
        [sys.executable, "-m", "pipwerk_relay", "-c", str(install_.ini), "run"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def wait_for(condition: Callable[[], bool], what: str, seconds: float = 120.0) -> None:
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        if condition():
            return
        time.sleep(0.05)
    raise AssertionError(f"timeout while waiting for {what}")


@pytest.mark.skipif(sys.platform == "win32", reason="signals of POSIX systems")
def test_3_relays_as_processes_ended_hard_in_turn_lose_nothing(tmp_path: Path) -> None:
    count = 100
    first, second = prepare_pair(tmp_path)
    secrets = SecretsDirectory(first.secrets)
    sender = Connector(
        ConnectorConfig(
            address=Address("send", "net1", "r1"),
            key=secrets.load_key("comp-send"),
            target=WayConfig("files", {"directory": str(first.root / "in")}),
            inbox=WayConfig("files", {"directory": str(first.root / "out-send")}),
            database=tmp_path / "send.db",
        )
    )
    ini = tmp_path / "listen.ini"
    ini.write_text(
        f"[relay]\naddress = listen.net1.r2\nway = files\nsecrets_directory = {second.secrets}\n"
        f"key_file = comp-listen\ndatabase = {tmp_path / 'listen.db'}\npoll_interval_seconds = 1\n"
        f"[relay.way]\ntarget.directory = {second.root / 'in'}\n"
        f"inbox.directory = {second.root / 'out-listen'}\n",
        encoding="utf-8",
    )
    received = tmp_path / "received"
    sent = [
        sender.send(
            "listen.net1.r2",
            "probe.message",
            {"text": f"number {number}"},
            attachments=[("data.bin", DATA)],
            receipt=True,
            receipt_timeout=timedelta(hours=1),
        ).id
        for number in range(count)
    ]
    relays = {"r1": start_relay(first), "r2": start_relay(second)}
    listener = subprocess.Popen(  # noqa: S603 - the program is this interpreter with this package
        [
            sys.executable,
            "-m",
            "pipwerk_relay",
            "probe",
            "listen",
            "-c",
            str(ini),
            "-o",
            str(received),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    def arrived() -> int:
        return (
            len([path for path in received.iterdir() if not path.name.endswith(".part")])
            if received.exists()
            else 0
        )

    try:
        for name, install_, at_least in (("r2", second, 1), ("r1", first, 30)):
            wait_for(lambda: arrived() >= at_least, f"{at_least} messages")  # noqa: B023
            relays[name].kill()  # no chance to finish anything
            relays[name].wait(timeout=30)
            assert relays[name].returncode == -signal.SIGKILL
            assert arrived() < count  # it was in the middle of its work
            relays[name] = start_relay(install_)

        handler = RecordingHandler()

        def everything_is_there() -> bool:
            sender.poll(handler)
            return arrived() >= count and sender.waiting_count == 0

        wait_for(everything_is_there, "all messages and all receipts")
        time.sleep(1.5)  # a message that would come twice has the time to come
        sender.poll(handler)
    finally:
        for process in (*relays.values(), listener):
            if process.poll() is None:
                process.send_signal(signal.SIGTERM)
                process.wait(timeout=30)
        sender.close()
    assert listener.returncode == 0
    assert sorted(path.name for path in received.iterdir()) == sorted(str(item) for item in sent)
    for identifier in sent:
        assert (received / str(identifier) / "files" / "data.bin").read_bytes() == DATA
    assert handler.notices == []  # no message ended as undeliverable
    for install_ in (first, second):
        assert install_.run("queue") == 0
        assert names(install_.root / "in") == set()


# --- 4. an envelope or a file is changed, or the key is wrong -----------------------------------


def waiting_files(bench: Bench) -> list[Path]:
    return sorted((bench.world.shared_directory / "in-r2").iterdir())


def change_the_envelope(bench: Bench) -> None:
    (path,) = [file for file in waiting_files(bench) if file.name.endswith(".json")]
    document = json.loads(path.read_text(encoding="utf-8"))
    document["body"] = document["body"].replace("text-of", "Text-of", 1)
    path.write_text(json.dumps(document), encoding="utf-8")


def change_the_file(bench: Bench) -> None:
    (path,) = [file for file in waiting_files(bench) if file.name.endswith(".att")]
    content = bytearray(path.read_bytes())
    content[100] ^= 0xFF
    path.write_bytes(bytes(content))


@pytest.mark.parametrize(
    ("change", "reason"),
    [(change_the_envelope, "bad_mac"), (change_the_file, "attachment_hash")],
    ids=["envelope", "file"],
)
def test_4_a_changed_envelope_or_file_is_dropped_without_content_and_without_a_notice(
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
    change: Callable[[Bench], None],
    reason: str,
) -> None:
    bench = Bench(tmp_path)
    try:
        bench.stopped.add("r2")

        def change_and_start() -> None:
            change(bench)
            bench.stopped.discard("r2")

        bench.at(30, change_and_start)
        outcome = bench.send(
            bench.first, ADDRESS_SECOND, text=TEXT, files=[("data.bin", DATA)], wait=900
        )
        assert outcome.code == 1
        assert "No receipt: message " in outcome.err  # the wish for a receipt is reported late
        assert "Notice" not in outcome.err  # and the sender gets no notice
        assert bench.received(bench.second) == []
        assert bench.second.queue_size() == 0
        assert names(bench.world.shared_directory / "in-r2") == set()  # dropped, not kept
        assert bench.first.components["send"].handler.notices == []
    finally:
        bench.close()
    assert "envelope dropped inbox=shared" in caplog.text
    assert f"reason={reason}" in caplog.text
    assert TEXT not in caplog.text
    assert DATA[:16].hex() not in caplog.text


def test_4_an_envelope_with_the_wrong_key_is_dropped_without_content_and_without_a_notice(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    bench = Bench(tmp_path)
    forger = Connector(
        ConnectorConfig(
            address=Address("send", "net1", "r1"),
            key=ConnectionKey.generate(),  # not the key of the connection
            target=WayConfig("files", {"directory": str(bench.first.inbox)}),
            inbox=WayConfig("files", {"directory": str(tmp_path / "forger-inbox")}),
            database=tmp_path / "forger.db",
        ),
        clock=bench.world.clock,
    )
    (tmp_path / "forger-inbox").mkdir()
    try:
        outcome = bench.send(
            bench.first, ADDRESS_SECOND, text=TEXT, files=[("data.bin", DATA)], wait=100,
            connector=forger,
        )  # fmt: skip
        assert outcome.code == 1
        assert "No receipt: message " in outcome.err
        assert "Notice" not in outcome.err
        assert bench.received(bench.second) == []
        assert bench.first.queue_size() == bench.second.queue_size() == 0
        assert names(bench.first.inbox) == set()
        assert list((tmp_path / "forger-inbox").iterdir()) == []
    finally:
        forger.close()
        bench.close()
    assert "envelope dropped inbox=main" in caplog.text
    assert "reason=bad_mac" in caplog.text
    assert TEXT not in caplog.text


# --- 5. the same envelope comes once more -------------------------------------------------------


def copy_files(source: Path, target: Path) -> list[Path]:
    """Copy the files of a directory, the attachments before the envelope."""
    files = sorted(source.iterdir(), key=lambda path: path.name.endswith(".json"))
    copies = []
    for path in files:
        copies.append(Path(shutil.copy2(path, target / path.name)))
    return copies


def test_5_the_relay_drops_an_envelope_it_has_seen_without_a_second_delivery(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    bench = Bench(tmp_path)
    saved = tmp_path / "saved"
    saved.mkdir()
    try:
        bench.stopped.add("r2")

        def save_and_start() -> None:
            copy_files(bench.world.shared_directory / "in-r2", saved)
            bench.stopped.discard("r2")

        bench.at(20, save_and_start)
        outcome = bench.send(bench.first, ADDRESS_SECOND, files=[("data.bin", DATA)], wait=300)
        assert outcome.code == 0
        assert len(list(saved.iterdir())) == 2  # the file and the envelope
        copy_files(saved, bench.world.shared_directory / "in-r2")  # once more
        bench.pump(4)
        assert_arrived_once(bench)
        assert names(bench.world.shared_directory / "in-r2") == set()
        assert bench.second.queue_size() == 0
    finally:
        bench.close()
    assert "repetition message=" in caplog.text


def test_5_the_component_gets_the_message_once_and_the_receipt_is_sent_again(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    bench = Bench(tmp_path)
    saved = tmp_path / "saved"
    saved.mkdir()
    inbox = bench.second.out_directory("listen")
    try:
        bench.silent.add(("r2", "listen"))

        def save_and_start() -> None:
            copy_files(inbox, saved)
            bench.silent.discard(("r2", "listen"))

        bench.at(30, save_and_start)
        outcome = bench.send(bench.first, ADDRESS_SECOND, files=[("data.bin", DATA)], wait=300)
        assert outcome.code == 0
        assert len(list(saved.iterdir())) == 2
        caplog.clear()
        copy_files(saved, inbox)  # the envelope of the component once more
        bench.pump(4)
        assert_arrived_once(bench)  # the component did not get it a second time
        assert names(inbox) == set()
        assert "repetition message=" in caplog.text
        # the second receipt reached the sender, which was not waiting any more
        result = bench.first.components["send"].connector.poll(RecordingHandler())
        assert result.dropped == 1
        assert "receipt dropped" in caplog.text
    finally:
        bench.close()


# --- 6. recipient or relay unknown, a loop, a message that is too large -------------------------


@pytest.mark.parametrize(
    ("address", "reason", "text"),
    [
        ("nobody.net1.r2", "unknown_recipient", "No component with the name of the recipient"),
        ("anybody.net1.r9", "unknown_relay", "The responsible relay of the recipient is unknown"),
    ],
)
def test_6_an_unknown_recipient_or_relay_ends_with_a_notice(
    tmp_path: Path, address: str, reason: str, text: str
) -> None:
    bench = Bench(tmp_path)
    try:
        outcome = bench.send(bench.first, address, files=[("data.bin", DATA)])
        assert outcome.code == 1
        assert f"is undeliverable ({reason}): " in outcome.err
        assert text in outcome.err
        assert bench.received(bench.second) == []
    finally:
        bench.close()


def test_6_a_loop_over_two_relays_that_are_each_others_standard_relay_ends_with_a_notice(
    tmp_path: Path,
) -> None:
    bench = Bench(tmp_path, standard=True)
    try:
        outcome = bench.send(bench.first, "anybody.net1.r9", files=[("data.bin", DATA)])
        assert outcome.code == 1
        assert "is undeliverable (loop): " in outcome.err
        assert "went around in a circle" in outcome.err
        assert bench.first.queue_size() == bench.second.queue_size() == 0
    finally:
        bench.close()


def test_6_a_message_that_is_too_large_for_a_way_ends_with_a_notice(tmp_path: Path) -> None:
    bench = Bench(tmp_path, entry_settings={"max_attachment_bytes": 1000})
    try:
        outcome = bench.send(bench.first, ADDRESS_SECOND, files=[("data.bin", DATA)])
        assert outcome.code == 1
        assert "is undeliverable (too_large): " in outcome.err
        assert "too large for a way" in outcome.err
        assert bench.received(bench.second) == []
        small = bench.send(bench.first, ADDRESS_SECOND, files=[("small.bin", b"x" * 500)])
        assert small.code == 0  # a file under the limit goes through
    finally:
        bench.close()


# --- 7. the receiving component does not run ----------------------------------------------------


def test_7_the_sender_reports_the_missing_receipt_and_the_late_receipt_is_noted_only_in_the_log(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    bench = Bench(tmp_path)
    try:
        bench.silent.add(("r2", "listen"))
        outcome = bench.send(
            bench.first, ADDRESS_SECOND, text=TEXT, files=[("data.bin", DATA)], wait=60
        )
        assert outcome.code == 1
        assert (
            f"No receipt: message {sent_id(outcome)} to {ADDRESS_SECOND} was not confirmed"
            in outcome.err
        )
        assert bench.received(bench.second) == []
        assert len(list(bench.second.out_directory("listen").glob("*.json"))) == 1  # it waits there
        # the component starts: the message is delivered, the late receipt is only noted
        bench.silent.discard(("r2", "listen"))
        bench.pump(4)
        assert_arrived_once(bench)
        result = bench.first.components["send"].connector.poll(RecordingHandler())
        assert result.dropped == 1
        assert result.receipts == 0
        assert "receipt dropped" in caplog.text
        assert bench.first.components["send"].connector.waiting_count == 0
    finally:
        bench.close()
