"""The probe (specification 8): its startup configuration, ``listen``, ``send`` and the call on the
command line.

``send`` and ``listen`` are tested with the real connector of the library and real relays in
directories (``tests/probe_bench.py``); the call on the command line with a startup configuration
file and, for ``listen``, as a process that is ended by a signal.
"""

import json
import re
import signal
import subprocess
import sys
import time
from collections.abc import Iterator
from pathlib import Path

import pytest
from pipwerk_relaycore import (
    Address,
    Connector,
    ConnectorConfig,
    Message,
    ReceivedMessage,
    WayConfig,
)
from pipwerk_relaycore.connection import RELAY_OPTIONS

from pipwerk_relay import probe
from pipwerk_relay.cli import main
from pipwerk_relay.errors import StartupConfigError
from pipwerk_relay.probe import (
    PROBE_CONFIG_FILE_NAME,
    load_probe_config,
)
from tests.probe_bench import ADDRESS_FIRST, ADDRESS_SECOND, Bench
from tests.support import Site, World

EXAMPLE = Path(__file__).resolve().parents[1] / "pipwerk-relay-probe.example.ini"
SECRET = "never-print-this-value-0123456789"  # noqa: S105 - a value that must never be shown
DATA = bytes(range(256)) * 40


@pytest.fixture
def bench(tmp_path: Path) -> Iterator[Bench]:
    bench = Bench(tmp_path / "bench")
    yield bench
    bench.close()


# --- the startup configuration ------------------------------------------------------------------


def probe_ini(site: Site, name: str, root: Path, *, extra: str = "") -> Path:
    """A startup configuration of the probe for a component that is connected to the relay."""
    path = root / f"{name}.ini"
    path.write_text(
        f"[relay]\naddress = {name}.{site.network}.{site.name}\nway = files\n"
        f"secrets_directory = {site.secrets_directory}\nkey_file = comp-{name}\n"
        f"database = {root / (name + '-probe.db')}\npoll_interval_seconds = 1\n"
        f"{extra}\n[relay.way]\ntarget.directory = {site.inbox}\n"
        f"inbox.directory = {site.out_directory(name)}\n",
        encoding="utf-8",
    )
    return path


@pytest.fixture
def single(world: World) -> tuple[Site, Path]:
    """One relay with a component for the tests and one for the probe on the command line."""
    site = world.site("r1", components=["tester", "cli"])
    world.start()
    return site, probe_ini(site, "cli", world.root)


def test_the_startup_configuration_is_read_in_the_form_of_every_component(
    single: tuple[Site, Path],
) -> None:
    site, ini = single
    settings = load_probe_config(ini)
    assert settings.address == "cli.net1.r1"
    assert settings.way == "files"
    assert settings.poll_interval_seconds == 1
    assert dict(settings.target) == {"directory": str(site.inbox)}
    assert dict(settings.inbox) == {"directory": str(site.out_directory("cli"))}


def test_the_case_of_the_entries_of_the_way_is_kept(single: tuple[Site, Path]) -> None:
    _, ini = single
    ini.write_text(
        ini.read_text(encoding="utf-8").replace("target.directory", "Target.directory"),
        encoding="utf-8",
    )
    with pytest.raises(StartupConfigError, match="must begin with"):
        load_probe_config(ini)


@pytest.mark.parametrize(
    ("addition", "text"),
    [
        ("\n[database]\nurl = x\n", "unknown section"),
        (f"\n[relay.file_way]\ndirectory = {SECRET}\n", "unknown section"),
    ],
)
def test_a_section_the_probe_does_not_know_is_rejected(
    single: tuple[Site, Path], addition: str, text: str
) -> None:
    _, ini = single
    ini.write_text(ini.read_text(encoding="utf-8") + addition, encoding="utf-8")
    with pytest.raises(StartupConfigError, match=text) as raised:
        load_probe_config(ini)
    assert SECRET not in str(raised.value)


def test_an_entry_the_probe_does_not_know_is_rejected_without_its_value(
    single: tuple[Site, Path],
) -> None:
    _, ini = single
    ini.write_text(
        ini.read_text(encoding="utf-8").replace("way = files", f"adress = {SECRET}\nway = files"),
        encoding="utf-8",
    )
    with pytest.raises(StartupConfigError, match="adress") as raised:
        load_probe_config(ini)
    assert SECRET not in str(raised.value)


def test_the_example_is_valid_and_names_every_entry() -> None:
    settings = load_probe_config(EXAMPLE)
    assert settings.address == "send.net1.relay1"
    assert settings.way == "files"
    assert set(settings.target) == {"directory"}
    assert set(settings.inbox) == {"directory"}
    text = EXAMPLE.read_text(encoding="utf-8")
    for option in RELAY_OPTIONS:
        assert re.search(rf"^(# )?{option} =", text, re.MULTILINE), option
    assert "[relay.way]" in text


def test_a_file_without_the_section_is_rejected(tmp_path: Path) -> None:
    path = tmp_path / PROBE_CONFIG_FILE_NAME
    path.write_text("", encoding="utf-8")
    with pytest.raises(StartupConfigError, match=r"no section \[relay\]"):
        load_probe_config(path)


def test_a_file_that_is_missing_is_named(tmp_path: Path) -> None:
    with pytest.raises(StartupConfigError, match="not found"):
        load_probe_config(tmp_path / "missing.ini")


def test_without_a_file_the_probe_searches_its_own_file_name_in_the_standard_locations(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.delenv("USERPROFILE", raising=False)
    with pytest.raises(StartupConfigError) as raised:
        load_probe_config(None)
    text = str(raised.value)
    assert "The probe does not start without one" in text
    assert str(tmp_path / "pipwerk" / "etc" / PROBE_CONFIG_FILE_NAME) in text
    assert "pipwerk-relay.ini" not in text


# --- listen -------------------------------------------------------------------------------------


def test_listen_writes_the_message_and_its_files_unchanged_and_prints_one_line(
    bench: Bench,
) -> None:
    outcome = bench.send(
        bench.first, ADDRESS_SECOND, text="to listen", files=[("data.bin", DATA), ("b.txt", b"b")]
    )
    assert outcome.code == 0
    (directory,) = bench.received(bench.second)
    assert (directory / "files" / "data.bin").read_bytes() == DATA
    assert (directory / "files" / "b.txt").read_bytes() == b"b"
    message = Message.from_json((directory / "message.json").read_bytes())
    assert message.kind == "probe.message"
    assert message.content == {"text": "to listen"}
    assert message.sender == "send.net1.r1"
    assert [attachment.name for attachment in message.attachments] == ["data.bin", "b.txt"]
    lines = bench.outputs["r2"].getvalue().splitlines()
    assert len(lines) == 1
    assert str(message.id) in lines[0]
    assert "send.net1.r1" in lines[0]
    assert "2 attachments (data.bin, b.txt)" in lines[0]


def test_listen_writes_a_message_without_files_and_a_notice(bench: Bench) -> None:
    assert bench.send(bench.first, ADDRESS_SECOND, receipt=False, wait=30).code == 0
    (directory,) = bench.received(bench.second)
    assert not list((directory / "files").iterdir())
    # a notice for a message that was sent to an unknown component of the relay reaches the sender
    outcome = bench.send(bench.first, "nobody.net1.r2", receipt=False, wait=60)
    assert outcome.code == 1
    assert "unknown_recipient" in outcome.err


def test_a_message_that_comes_a_second_time_is_not_written_again(bench: Bench) -> None:
    bench.send(bench.first, ADDRESS_SECOND, files=[("a.bin", b"1")])
    (directory,) = bench.received(bench.second)
    before = (directory / "message.json").stat().st_mtime_ns
    message = Message.from_json((directory / "message.json").read_bytes())
    # the same id with other contents
    bench.listeners["r2"].store(ReceivedMessage(message, (), (b"2",)))
    assert (directory / "files" / "a.bin").read_bytes() == b"1"
    assert (directory / "message.json").stat().st_mtime_ns == before
    assert len(bench.received(bench.second)) == 1


@pytest.mark.parametrize(
    ("name", "stored"),
    [
        ("data.bin", "data.bin"),
        ("NUL", "NUL~"),
        ("nul.txt", "nul.txt~"),
        ("Com1", "Com1~"),
        ("LPT9.tar.gz", "LPT9.tar.gz~"),
        ("aux", "aux~"),
        ("report.", "report.~"),
        ("console.txt", "console.txt"),
        ("COM10", "COM10"),
    ],
)
def test_the_name_of_a_file_is_usable_on_windows(name: str, stored: str) -> None:
    assert probe.safe_file_name(name) == stored


def test_listen_stores_a_file_with_a_reserved_name_under_a_safe_name(bench: Bench) -> None:
    outcome = bench.send(
        bench.first, ADDRESS_SECOND, text="reserved", files=[("NUL", b"a"), ("end.", b"b")]
    )
    assert outcome.code == 0
    (directory,) = bench.received(bench.second)
    assert sorted(path.name for path in (directory / "files").iterdir()) == ["NUL~", "end.~"]
    assert (directory / "files" / "NUL~").read_bytes() == b"a"


def test_a_message_that_cannot_be_written_leaves_nothing_behind_and_stays_in_the_inbox(
    bench: Bench, monkeypatch: pytest.MonkeyPatch
) -> None:
    def failing(_part: Path, _final: Path) -> None:
        raise OSError("disk full")

    with monkeypatch.context() as patch:
        patch.setattr(probe, "_publish", failing)
        bench.send(bench.first, ADDRESS_SECOND, receipt=False, wait=10)
        assert list(bench.received_directory(bench.second).iterdir()) == []  # not even a .part
        assert any(bench.second.out_directory("listen").iterdir())  # still in the inbox
    bench.pump()
    assert len(bench.received(bench.second)) == 1
    assert not any(bench.second.out_directory("listen").iterdir())


def test_unfinished_directories_of_an_earlier_run_are_removed(tmp_path: Path) -> None:
    (tmp_path / "one.part" / "files").mkdir(parents=True)
    (tmp_path / "one.part" / "files" / "data.bin").write_bytes(b"half")
    (tmp_path / "complete").mkdir()
    (tmp_path / "other.part").write_bytes(b"a file is not one of ours")
    assert probe.remove_leftovers(tmp_path) == 1
    assert sorted(path.name for path in tmp_path.iterdir()) == ["complete", "other.part"]


# --- send ---------------------------------------------------------------------------------------


def test_send_shows_the_receipt_and_ends_with_exit_code_0(bench: Bench) -> None:
    outcome = bench.send(bench.first, ADDRESS_SECOND, files=[("data.bin", DATA)])
    assert outcome.code == 0
    lines = outcome.out.splitlines()
    assert lines[0].startswith("Sent message ")
    assert f"to {ADDRESS_SECOND} with 1 attachments, receipt wanted within 120 seconds." in lines[0]
    assert lines[1].startswith("Receipt: message ")
    assert f"was stored by {ADDRESS_SECOND}." in lines[1]
    assert outcome.err == ""
    assert bench.first.components["send"].connector.waiting_count == 0


def test_send_over_one_relay_to_a_component_of_the_same_relay(bench: Bench) -> None:
    outcome = bench.send(bench.first, ADDRESS_FIRST, files=[("data.bin", DATA)])
    assert outcome.code == 0
    (directory,) = bench.received(bench.first)
    assert (directory / "files" / "data.bin").read_bytes() == DATA


def test_send_without_the_wish_for_a_receipt_asks_for_none_and_waits_for_a_notice(
    bench: Bench,
) -> None:
    outcome = bench.send(bench.first, ADDRESS_SECOND, receipt=False, wait=30)
    assert outcome.code == 0
    assert "Sent message" in outcome.out
    assert "receipt wanted" not in outcome.out
    assert "No notice came back within 30 seconds" in outcome.out
    assert bench.first.components["send"].connector.waiting_count == 0
    (directory,) = bench.received(bench.second)
    message = Message.from_json((directory / "message.json").read_bytes())
    assert message.receipt is False


def test_send_shows_a_notice_with_its_reason_and_ends_with_exit_code_1(bench: Bench) -> None:
    outcome = bench.send(bench.first, "nobody.net1.r2")
    assert outcome.code == 1
    assert outcome.out.count("\n") == 1  # only the line "Sent message"
    assert outcome.err.startswith("Notice from relay.net1.r2: message ")
    assert "is undeliverable (unknown_recipient): " in outcome.err
    assert "No component with the name of the recipient" in outcome.err


def test_send_shows_that_the_receipt_did_not_come_within_the_deadline(bench: Bench) -> None:
    bench.silent.add(("r2", "listen"))  # the component does not read its inbox
    outcome = bench.send(bench.first, ADDRESS_SECOND, wait=60)
    assert outcome.code == 1
    assert outcome.err.startswith("No receipt: message ")
    assert f"to {ADDRESS_SECOND} was not confirmed within 60 seconds." in outcome.err
    assert bench.first.components["send"].connector.waiting_count == 0


def test_send_says_when_the_message_cannot_be_handed_to_the_relay(bench: Bench) -> None:
    bench.first.inbox.rename(bench.first.inbox.with_name("gone"))
    outcome = bench.send(bench.first, ADDRESS_SECOND)
    assert outcome.code == 1
    assert "the message could not be handed to the relay" in outcome.err
    assert str(bench.first.root) not in outcome.err
    assert bench.first.components["send"].connector.waiting_count == 0  # nothing waits


def test_send_says_when_a_file_is_too_large_for_the_way_to_the_relay(tmp_path: Path) -> None:
    bench = Bench(tmp_path / "bench")
    small = Connector(
        ConnectorConfig(
            address=Address("send", "net1", "r1"),
            key=bench.first.secrets.load_key("comp-send"),
            target=WayConfig(
                "files", {"directory": str(bench.first.inbox), "max_attachment_bytes": 100}
            ),
            inbox=WayConfig("files", {"directory": str(bench.first.out_directory("send"))}),
            database=tmp_path / "small.db",
        ),
        clock=bench.world.clock,
    )
    try:
        outcome = bench.send(
            bench.first, ADDRESS_SECOND, files=[("big.bin", b"x" * 101)], connector=small
        )
    finally:
        small.close()
        bench.close()
    assert outcome.code == 1
    assert "the message could not be handed to the relay" in outcome.err


# --- the call on the command line ---------------------------------------------------------------


def test_the_command_line_sends_a_message_with_a_file(
    single: tuple[Site, Path], tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    site, ini = single
    file = tmp_path / "report.csv"
    file.write_bytes(DATA)
    code = main(
        [
            *("probe", "send", "-c", str(ini), "--address", "tester.net1.r1"),
            *("--text", "hello", "--file", str(file), "--wait", "1"),
        ]
    )
    captured = capsys.readouterr()
    assert code == 0, captured.err
    assert "Sent message" in captured.out
    assert "with 1 attachments." in captured.out
    (envelope,) = site.inbox.glob("*.json")
    assert (site.inbox / f"{envelope.stem}.0.att").read_bytes() == DATA
    assert SECRET not in captured.out + captured.err
    assert "hello" not in captured.out  # the text of the message is not shown again


@pytest.mark.parametrize(
    ("arguments", "text"),
    [
        (["--address", "tester.net1", "--text", "x"], "--address is not an address"),
        (["--address", "tester.net1.r1", "--text", ""], "--text must have 1 to 1000 characters"),
        (["--address", "tester.net1.r1", "--text", "x" * 1001], "--text must have 1 to 1000"),
        (["--address", "tester.net1.r1", "--text", "x", "--wait", "0"], "--wait must be between"),
        (["--address", "tester.net1.r1", "--text", "x", "--wait", "99999999"], "--wait must be"),
        (["--address", "tester.net1.r1", "--text", "x", "--file", "NOFILE"], "cannot be read"),
        (["--address", "tester.net1.r1", "--text", "x", "--file", ".hidden"], "cannot be the name"),
    ],
)
def test_an_invalid_call_ends_with_exit_code_2_and_sends_nothing(
    single: tuple[Site, Path],
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
    arguments: list[str],
    text: str,
) -> None:
    site, ini = single
    (tmp_path / ".hidden").write_bytes(b"x")
    arguments = [
        str(tmp_path / ".hidden")
        if item == ".hidden"
        else str(tmp_path / "none")
        if item == "NOFILE"
        else item
        for item in arguments
    ]
    code = main(["probe", "send", "-c", str(ini), *arguments])
    captured = capsys.readouterr()
    assert code == 2
    assert text in captured.err
    assert captured.out == ""
    assert list(site.inbox.iterdir()) == []


def test_two_files_with_the_same_name_are_refused(
    single: tuple[Site, Path], tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    site, ini = single
    for directory in ("one", "two"):
        (tmp_path / directory).mkdir()
        (tmp_path / directory / "same.txt").write_bytes(b"x")
    code = main(
        [
            *("probe", "send", "-c", str(ini), "--address", "tester.net1.r1", "--text", "x"),
            *("--file", str(tmp_path / "one" / "same.txt")),
            *("--file", str(tmp_path / "two" / "same.txt")),
        ]
    )
    assert code == 2
    assert "two files are named" in capsys.readouterr().err
    assert list(site.inbox.iterdir()) == []


def test_a_startup_configuration_that_is_invalid_ends_with_exit_code_2_and_names_the_entry(
    single: tuple[Site, Path], capsys: pytest.CaptureFixture[str]
) -> None:
    _, ini = single
    ini.write_text(f"[relay]\naddress = a.b.c\nkey_file = {SECRET}\n", encoding="utf-8")
    code = main(["probe", "send", "-c", str(ini), "--address", "a.b.c", "--text", "x"])
    err = capsys.readouterr().err
    assert code == 2
    assert "missing the entry" in err
    assert SECRET not in err


def test_a_key_that_others_can_read_stops_the_probe_before_anything_is_sent(
    single: tuple[Site, Path], capsys: pytest.CaptureFixture[str]
) -> None:
    site, ini = single
    (site.secrets_directory / "comp-cli").chmod(0o644)
    code = main(["probe", "send", "-c", str(ini), "--address", "tester.net1.r1", "--text", "x"])
    assert code == 2
    assert "accessible for others" in capsys.readouterr().err
    assert list(site.inbox.iterdir()) == []


def test_the_startup_configuration_of_the_relay_cannot_be_given_before_the_probe(
    single: tuple[Site, Path], capsys: pytest.CaptureFixture[str]
) -> None:
    _, ini = single
    code = main(["-c", str(ini), "probe", "send", "--address", "a.b.c", "--text", "x"])
    assert code == 2
    assert "give -c after the action" in capsys.readouterr().err


def test_an_action_is_needed_and_the_help_names_them(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as raised:
        main(["probe"])
    assert raised.value.code == 2
    with pytest.raises(SystemExit) as helped:
        main(["probe", "--help"])
    assert helped.value.code == 0
    assert "listen" in capsys.readouterr().out


def test_listen_as_a_process_receives_until_it_is_ended(
    single: tuple[Site, Path], tmp_path: Path
) -> None:
    site, ini = single
    out = tmp_path / "received"
    process = subprocess.Popen(  # noqa: S603 - the program is this interpreter with this package
        [sys.executable, "-m", "pipwerk_relay", "probe", "listen", "-c", str(ini), "-o", str(out)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    tester = site.components["tester"]
    try:
        sent = tester.send("cli.net1.r1", attachments=[("data.bin", DATA)], receipt=True)
        deadline = time.monotonic() + 60
        while tester.connector.waiting_count and time.monotonic() < deadline:
            site.relay.cycle()
            tester.poll()
            time.sleep(0.1)
        assert tester.connector.waiting_count == 0, "the receipt did not come"
    finally:
        process.send_signal(signal.SIGTERM)
        stdout, stderr = process.communicate(timeout=30)
    assert process.returncode == 0, stderr
    assert (out / str(sent.id) / "files" / "data.bin").read_bytes() == DATA
    message = json.loads((out / str(sent.id) / "message.json").read_text(encoding="utf-8"))
    assert message["id"] == str(sent.id)
    lines = stdout.splitlines()
    assert lines[0].startswith("pipwerk-relay probe listen: address cli.net1.r1")
    assert any(f"Message {sent.id} (probe.message) from tester.net1.r1" in line for line in lines)
    assert lines[-1] == "pipwerk-relay probe listen: stopped."
