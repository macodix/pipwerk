"""The probe: a running component that proves the basic mechanism without the retrieval
(specification 8, "Prüfkomponente").

::

    pipwerk-relay probe listen -c <PATH> -o <DIRECTORY>
    pipwerk-relay probe send   -c <PATH> --address <ADDRESS> --text <TEXT>
                               [--file <FILE> ...] [--receipt] [--wait <SECONDS>]

Both are a component of their own with an address, a key and a connection to a relay, stated in
a startup configuration of their own (``pipwerk-relay-probe.ini``) with the sections ``[relay]``
and ``[relay.way]``, in the form every component uses (``pipwerk_relaycore.connection``).

``listen`` runs until it is ended. It writes every message it receives, with its attachments,
into the target directory and prints one line for each. ``send`` sends one message
``probe.message`` (a short text, files as attachments, on request with the wish for a receipt
and its deadline) and shows what comes back: the receipt, a notice ``relay.undeliverable`` with
its reason (req-relay-008), or that no receipt came within the deadline (specification 3.7).

Exit codes: 0 done (``send``: the receipt arrived, or no receipt was asked for and no notice came
within the wait time); 1 the message was not delivered or not confirmed, or could not be handed
to the relay; 2 an invalid call or startup configuration, nothing was sent. Text for the user goes
to the standard output, errors to the standard error output; neither shows a key or a value of a
configuration.
"""

import argparse
import logging
import os
import secrets
import shutil
import sys
import threading
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import TextIO
from uuid import UUID

from pipwerk_relaycore import (
    KIND_PROBE,
    KIND_UNDELIVERABLE,
    Address,
    AddressError,
    Attachment,
    ConnectionSettings,
    ConnectionSettingsError,
    Connector,
    Handler,
    ProbeContent,
    ReceiptArrived,
    ReceiptMissing,
    ReceivedMessage,
    WayError,
    open_connector,
    read_connection_settings,
)
from pydantic import ValidationError

from pipwerk_relay.errors import StartupConfigError
from pipwerk_relay.service import stop_on_signals
from pipwerk_relay.startup import parse_ini_file, resolve_config_path

PROG = "pipwerk-relay probe"
PROBE_CONFIG_FILE_NAME = "pipwerk-relay-probe.ini"
"""File name of the startup configuration of the probe at every searched location."""

EXIT_OK = 0
EXIT_FAILED = 1
EXIT_USAGE = 2

DEFAULT_WAIT_SECONDS = 30
MAX_WAIT_SECONDS = 7 * 24 * 3600
"""The longest wait time of ``send``: one week."""
MESSAGE_FILE = "message.json"
FILES_DIRECTORY = "files"

LOGGER = logging.getLogger("pipwerk_relay.probe")

_SECTIONS = ("relay", "relay.way")


# --- the startup configuration of the probe -----------------------------------------------------


def load_probe_config(explicit_path: str | Path | None = None) -> ConnectionSettings:
    """Load and check the startup configuration of the probe (``-c <PATH>`` or the search
    locations). Only the sections ``[relay]`` and ``[relay.way]`` exist; every other section is
    rejected. Raises ``StartupConfigError``."""
    path = resolve_config_path(explicit_path, PROBE_CONFIG_FILE_NAME, "The probe")
    parser = parse_ini_file(path, keep_case=True)
    for section in parser.sections():
        if section not in _SECTIONS:
            raise StartupConfigError(f"Startup configuration {path} has an unknown section.")
    try:
        settings = read_connection_settings(parser, f"Startup configuration {path}")
    except ConnectionSettingsError as error:
        raise StartupConfigError(str(error)) from None
    if settings is None:
        raise StartupConfigError(f"Startup configuration {path} has no section [relay].")
    return settings


# --- listen -------------------------------------------------------------------------------------


class Listener(Handler):
    """The component that stores what it receives in a directory.

    A message goes into ``<directory>/<message id>/``: the message as ``message.json`` and its
    attachments, unchanged, as ``files/<name>``. The directory appears complete or not at all
    (written under a temporary name and renamed). A message that comes a second time (it was not
    marked as seen before the program ended) is already there and is not written again.
    """

    def __init__(self, directory: Path, out: TextIO) -> None:
        self._directory = directory
        self._out = out

    def store(self, received: ReceivedMessage) -> None:
        message = received.message
        final = self._directory / str(message.id)
        if not final.exists():
            self._write(final, received)
        names = ", ".join(attachment.name for attachment in message.attachments) or "none"
        what = "Notice" if message.kind == KIND_UNDELIVERABLE else "Message"
        print(
            f"{what} {message.id} ({message.kind}) from {message.sender}: "
            f"{len(message.attachments)} attachments ({names}), stored in {final}",
            file=self._out,
            flush=True,
        )

    def _write(self, final: Path, received: ReceivedMessage) -> None:
        part = self._directory / f"{received.message.id}.{secrets.token_hex(8)}.part"
        try:
            (part / FILES_DIRECTORY).mkdir(parents=True)
            _write_file(part / MESSAGE_FILE, received.message.to_json().encode("utf-8"))
            for attachment, content in zip(
                received.message.attachments, received.attachments, strict=True
            ):
                _write_file(part / FILES_DIRECTORY / attachment.name, content)
            _publish(part, final)
        except BaseException:
            shutil.rmtree(part, ignore_errors=True)
            raise


def _publish(part: Path, final: Path) -> None:
    """Make the directory of a message appear complete."""
    os.replace(part, final)


def remove_leftovers(directory: Path) -> int:
    """Remove the unfinished directories (``*.part``) that a program ended in the middle of
    writing has left behind; returns how many. Their messages are still in the inbox and come
    again."""
    removed = 0
    for leftover in directory.glob("*.part"):
        if leftover.is_dir() and not leftover.is_symlink():
            shutil.rmtree(leftover, ignore_errors=True)
            removed += 1
    return removed


def _write_file(path: Path, content: bytes) -> None:
    with path.open("xb") as stream:
        stream.write(content)
        stream.flush()
        os.fsync(stream.fileno())


def listen_until_stopped(
    connector: Connector, handler: Handler, *, interval: float, stop: threading.Event
) -> None:
    """Read the inbox every ``interval`` seconds until ``stop`` is set."""
    while not stop.is_set():
        connector.poll(handler)
        stop.wait(interval)


# --- send ---------------------------------------------------------------------------------------


class Answer(Handler):
    """What comes back for one message that was sent."""

    def __init__(self, out: TextIO) -> None:
        self._out = out
        self.message_id: UUID | None = None
        self.arrived: ReceiptArrived | None = None
        self.missing: ReceiptMissing | None = None
        self.notice: tuple[str, str, str] | None = None
        """Sender, reason and text of the notice."""

    @property
    def done(self) -> bool:
        return self.arrived is not None or self.missing is not None or self.notice is not None

    def store(self, received: ReceivedMessage) -> None:
        message = received.message
        if (
            message.kind == KIND_UNDELIVERABLE
            and message.reference_id == self.message_id
            and self.message_id is not None
        ):
            content = message.content
            self.notice = (message.sender, str(content.get("reason")), str(content.get("text")))
            return
        print(f"Received {message.kind} {message.id} from {message.sender}.", file=self._out)

    def receipt_arrived(self, arrived: ReceiptArrived) -> None:
        if arrived.message_id == self.message_id:
            self.arrived = arrived

    def receipt_missing(self, missing: ReceiptMissing) -> None:
        if missing.message_id == self.message_id:
            self.missing = missing


@dataclass(frozen=True)
class Timing:
    """The clocks of ``send``; a real call uses the system clocks, the tests their own."""

    monotonic: Callable[[], float] = time.monotonic
    sleep: Callable[[float], None] = time.sleep


def send_and_watch(
    connector: Connector,
    *,
    recipient: str,
    text: str,
    files: Sequence[tuple[str, bytes]] = (),
    receipt: bool = False,
    wait: timedelta = timedelta(seconds=DEFAULT_WAIT_SECONDS),
    interval: float,
    timing: Timing | None = None,
    out: TextIO,
    err: TextIO,
) -> int:
    """Send one message ``probe.message`` and show what comes back; return the exit code.

    Without ``receipt`` the program watches for a notice for ``wait``. With ``receipt`` the wait
    time is the deadline of the receipt (specification 3.7): the program waits for the receipt,
    for a notice or for the end of the deadline.
    """
    timing = timing or Timing()
    answer = Answer(out)
    try:
        sent = connector.send(
            recipient,
            KIND_PROBE,
            ProbeContent(text=text).model_dump(),
            attachments=files,
            receipt=receipt,
            receipt_timeout=wait if receipt else None,
        )
    except WayError as error:
        print(f"{PROG}: the message could not be handed to the relay: {error}.", file=err)
        return EXIT_FAILED
    answer.message_id = sent.id
    seconds = int(wait.total_seconds())
    print(
        f"Sent message {sent.id} to {recipient} with {len(files)} attachments"
        + (f", receipt wanted within {seconds} seconds." if receipt else "."),
        file=out,
        flush=True,
    )
    started = timing.monotonic()
    # The connector's deadline of a receipt began before this clock, so it has passed when this
    # one has; the margin only covers a clock that is slightly off.
    limit = wait.total_seconds() + (5.0 if receipt else 0.0)
    while True:
        connector.poll(answer)
        if answer.done:
            break
        remaining = started + limit - timing.monotonic()
        if remaining <= 0:
            break
        timing.sleep(min(interval, remaining))
    return _report(answer, sent_id=sent.id, recipient=recipient, seconds=seconds, out=out, err=err)


def _report(
    answer: Answer, *, sent_id: UUID, recipient: str, seconds: int, out: TextIO, err: TextIO
) -> int:
    if answer.arrived is not None:
        print(f"Receipt: message {sent_id} was stored by {recipient}.", file=out)
        return EXIT_OK
    if answer.notice is not None:
        sender, reason, text = answer.notice
        print(
            f"Notice from {sender}: message {sent_id} is undeliverable ({reason}): {text}",
            file=err,
        )
        return EXIT_FAILED
    if answer.missing is not None:
        print(
            f"No receipt: message {sent_id} to {recipient} was not confirmed within "
            f"{seconds} seconds.",
            file=err,
        )
        return EXIT_FAILED
    print(f"No notice came back within {seconds} seconds for message {sent_id}.", file=out)
    return EXIT_OK


# --- the command line ---------------------------------------------------------------------------


def add_probe_parser(commands: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    """Add the command ``probe`` with ``listen`` and ``send`` to the parser of the relay."""
    probe = commands.add_parser(
        "probe",
        help="test component: listen and send",
        description=(
            "The probe is a component of its own with an address, a key and a connection to a "
            f"relay, stated in its startup configuration {PROBE_CONFIG_FILE_NAME} "
            "(sections [relay] and [relay.way])."
        ),
    )
    actions = probe.add_subparsers(dest="probe_action", required=True, metavar="ACTION")
    listen = actions.add_parser(
        "listen", help="receive messages and write them into a directory, until stopped"
    )
    _add_config(listen)
    listen.add_argument(
        "-o",
        "--output-dir",
        dest="directory",
        required=True,
        metavar="DIRECTORY",
        type=Path,
        help="the directory the messages are written to (created if missing)",
    )
    send = actions.add_parser("send", help="send one message and show what comes back")
    _add_config(send)
    send.add_argument(
        "--address",
        required=True,
        metavar="ADDRESS",
        help="the address of the recipient: <component>.<network>.<relay>",
    )
    send.add_argument("--text", required=True, metavar="TEXT", help="the text of the message")
    send.add_argument(
        "--file",
        dest="files",
        action="append",
        default=[],
        metavar="FILE",
        type=Path,
        help="a file to send as an attachment (may be repeated)",
    )
    send.add_argument(
        "--receipt", action="store_true", help="ask the recipient to confirm that it stored it"
    )
    send.add_argument(
        "--wait",
        type=int,
        default=DEFAULT_WAIT_SECONDS,
        metavar="SECONDS",
        help="with --receipt the deadline of the receipt, otherwise how long to watch for a "
        "notice (default: %(default)s seconds)",
    )


def _add_config(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "-c",
        "--config",
        dest="probe_config",
        default=None,
        metavar="PATH",
        help=f"the startup configuration of the probe ({PROBE_CONFIG_FILE_NAME}); without it "
        "the standard locations are searched",
    )


def run_probe(
    arguments: argparse.Namespace,
    *,
    out: TextIO | None = None,
    err: TextIO | None = None,
    timing: Timing | None = None,
    clock: Callable[[], datetime] | None = None,
    stop: threading.Event | None = None,
) -> int:
    """Run ``probe listen`` or ``probe send``; returns the exit code.

    ``out``, ``err``, ``timing``, ``clock`` and ``stop`` are for the tests.
    """
    out = out or sys.stdout
    err = err or sys.stderr
    if arguments.config is not None:
        print(
            f"{PROG}: give -c after the action (probe {arguments.probe_action} -c PATH): the "
            "probe has a startup configuration of its own.",
            file=err,
        )
        return EXIT_USAGE
    if arguments.probe_action == "listen":
        return _listen(arguments, out=out, err=err, clock=clock, stop=stop)
    return _send(arguments, out=out, err=err, timing=timing, clock=clock)


def _open(
    arguments: argparse.Namespace, err: TextIO, clock: Callable[[], datetime] | None
) -> tuple[Connector, ConnectionSettings] | None:
    try:
        settings = load_probe_config(arguments.probe_config)
        return open_connector(settings, clock=clock), settings
    except (StartupConfigError, ConnectionSettingsError) as error:
        print(f"{PROG}: {error}", file=err)
        return None


def _listen(
    arguments: argparse.Namespace,
    *,
    out: TextIO,
    err: TextIO,
    clock: Callable[[], datetime] | None,
    stop: threading.Event | None,
) -> int:
    directory: Path = arguments.directory
    opened = _open(arguments, err, clock)
    if opened is None:
        return EXIT_USAGE
    connector, settings = opened
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except OSError:
        connector.close()
        print(f"{PROG}: the output directory cannot be created.", file=err)
        return EXIT_USAGE
    remove_leftovers(directory)
    logging.basicConfig(
        level=logging.WARNING, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
    )
    event = stop or threading.Event()
    print(
        f"{PROG} listen: address {settings.address}, writing to {directory} (stop with Ctrl+C).",
        file=out,
        flush=True,
    )
    try:
        with stop_on_signals(event):
            listen_until_stopped(
                connector,
                Listener(directory, out),
                interval=float(settings.poll_interval_seconds),
                stop=event,
            )
    except KeyboardInterrupt:
        pass
    finally:
        connector.close()
    print(f"{PROG} listen: stopped.", file=out, flush=True)
    return EXIT_OK


def _read_files(paths: Sequence[Path]) -> list[tuple[str, bytes]]:
    """The attachments for the files; raises ``ValueError`` with a text for the user."""
    files: list[tuple[str, bytes]] = []
    names: set[str] = set()
    for path in paths:
        name = path.name
        try:
            Attachment.of(name, b"")
        except ValidationError:
            raise ValueError(
                f"the file name {name!r} cannot be the name of an attachment (1 to 128 letters, "
                "digits and . _ # + - , not starting with a dot)."
            ) from None
        if name in names:
            raise ValueError(f"two files are named {name!r}.")
        names.add(name)
        try:
            files.append((name, path.read_bytes()))
        except OSError:
            raise ValueError(f"the file {name!r} cannot be read.") from None
    return files


def _check_call(arguments: argparse.Namespace) -> list[tuple[str, bytes]]:
    """Check the call; raises ``ValueError`` with a text for the user. Returns the files."""
    try:
        Address.parse(arguments.address)
    except AddressError:
        raise ValueError("--address is not an address <component>.<network>.<relay>.") from None
    try:
        ProbeContent(text=arguments.text)
    except ValidationError:
        raise ValueError("--text must have 1 to 1000 characters.") from None
    if not 1 <= arguments.wait <= MAX_WAIT_SECONDS:
        raise ValueError(f"--wait must be between 1 and {MAX_WAIT_SECONDS} seconds.")
    return _read_files(arguments.files)


def _send(
    arguments: argparse.Namespace,
    *,
    out: TextIO,
    err: TextIO,
    timing: Timing | None,
    clock: Callable[[], datetime] | None,
) -> int:
    try:
        files = _check_call(arguments)
    except ValueError as error:
        print(f"{PROG}: {error}", file=err)
        return EXIT_USAGE
    opened = _open(arguments, err, clock)
    if opened is None:
        return EXIT_USAGE
    connector, settings = opened
    # What `send` has to say it says itself; the warnings of the library would repeat it.
    logging.basicConfig(level=logging.ERROR, format="%(levelname)s %(name)s: %(message)s")
    try:
        return send_and_watch(
            connector,
            recipient=arguments.address,
            text=arguments.text,
            files=files,
            receipt=bool(arguments.receipt),
            wait=timedelta(seconds=arguments.wait),
            interval=float(settings.poll_interval_seconds),
            timing=timing,
            out=out,
            err=err,
        )
    except KeyboardInterrupt:
        print("Interrupted.", file=err)
        return EXIT_FAILED
    finally:
        connector.close()
