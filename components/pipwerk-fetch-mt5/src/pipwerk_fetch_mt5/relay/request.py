"""``request``: ask a retrieval for files through pipwerk relay and receive them
(specification relay 6.3).

``run_request`` sends one message ``fetch.request`` to the address of the retrieval and then reads
the inbox of its connection at fixed intervals until the answer is complete:

- Every ``fetch.file`` that answers the request is written into the target directory
  (``Geschrieben: ...``, one line per file, like the call on the command line). A file whose name
  was written already for this request is not written again: after an interruption of ``serve``
  the retrieval answers from the beginning (see ``serve.py``), and the connector cannot know that
  the new message carries a file it has seen.
- ``fetch.result`` ends the answer: it names all files and every part that could not be fetched.
  It can arrive before the last file (the messages take their own ways), so the command waits for
  every file the result names.
- ``relay.undeliverable`` for the request ends the command with the reason (req-relay-008).
- If the wait time (default 30 minutes) passes first, the command ends with a message.

Messages that do not answer this request (another reference, or a sender other than the
retrieval) are consumed and ignored: the inbox of an address may hold the late answers of a
request of an earlier run. One request at a time per address: a second ``request`` with the same
address and the same database would consume the answers of the first.

Exit codes like the call on the command line: 0 all files written; 1 a part could not be fetched,
the request was refused, the request could not be delivered, the time ran out or a message was
invalid; 2 (by the caller) an invalid call or startup configuration.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import timedelta
from pathlib import Path
from typing import TextIO
from uuid import UUID

from pipwerk_relaycore import (
    KIND_UNDELIVERABLE,
    Connector,
    Handler,
    ReceivedMessage,
    WayError,
)
from pydantic import ValidationError

from pipwerk_fetch_mt5.cli import OMISSION_TEXTS, kind_text, moment_text
from pipwerk_fetch_mt5.files import write_file
from pipwerk_fetch_mt5.relay.contents import (
    KIND_FILE,
    KIND_REQUEST,
    KIND_RESULT,
    FetchFileContent,
    FetchRequestContent,
    FetchResultContent,
    dump_content,
    load_content,
    parse_moment,
)

LOGGER = logging.getLogger("pipwerk_fetch_mt5.relay.request")

EXIT_OK = 0
EXIT_FAILED = 1
DEFAULT_WAIT = timedelta(minutes=30)


class Delivery(Handler):
    """What the retrieval has sent so far for one request."""

    def __init__(
        self,
        *,
        directory: Path,
        retrieval: str,
        designation: str,
        out: TextIO,
    ) -> None:
        self._directory = directory
        self._retrieval = retrieval
        self._out = out
        self.designation = designation
        self.request_id: UUID | None = None
        self.written: dict[str, FetchFileContent] = {}
        self.result: FetchResultContent | None = None
        self.notice: tuple[str, str] | None = None
        self.problems: list[str] = []

    def store(self, received: ReceivedMessage) -> None:
        message = received.message
        if self.request_id is None or message.reference_id != self.request_id:
            LOGGER.info(
                "ignored message=%s kind=%s (not an answer to this request)",
                message.id,
                message.kind,
            )
            return
        if message.kind == KIND_UNDELIVERABLE:
            # The notice comes from a relay ("relay.<network>.<relay>", the name "relay" is
            # reserved for relays, specification relay 3.1), not from the retrieval.
            if message.sender.split(".")[0] == "relay":
                reason, text = message.content.get("reason"), message.content.get("text")
                self.notice = (str(reason), str(text))
            return
        if message.sender != self._retrieval:
            LOGGER.warning(
                "ignored message=%s kind=%s sender=%s (not from the retrieval)",
                message.id,
                message.kind,
                message.sender,
            )
        elif message.kind == KIND_FILE:
            self._store_file(received)
        elif message.kind == KIND_RESULT:
            self._store_result(received)
        else:
            LOGGER.warning("ignored message=%s kind=%s", message.id, message.kind)

    def _store_file(self, received: ReceivedMessage) -> None:
        message = received.message
        try:
            content = load_content(FetchFileContent, message.content)
        except ValidationError:
            self.problems.append(
                "Eine Nachricht mit einer Datei ist ungültig; sie wurde nicht geschrieben."
            )
            return
        if len(received.attachments) != 1 or message.attachments[0].name != content.name:
            self.problems.append(
                f"Die Nachricht zur Datei {content.name} enthält nicht genau diese Datei; "
                "sie wurde nicht geschrieben."
            )
            return
        if content.name in self.written:
            LOGGER.info("file %s arrived again and is not written again", content.name)
            return
        # A failure to write raises: the message stays in the inbox and is read again.
        write_file(self._directory, content.name, received.attachments[0])
        self.written[content.name] = content
        for line in file_lines(content, self._directory / content.name):
            print(line, file=self._out)

    def _store_result(self, received: ReceivedMessage) -> None:
        try:
            result = load_content(FetchResultContent, received.message.content)
        except ValidationError:
            self.problems.append("Das Ergebnis der Anfrage ist ungültig.")
            self.result = FetchResultContent(files=[], failed=[])
            return
        self.result = result

    @property
    def missing(self) -> list[str]:
        """The files that the result names and that have not arrived."""
        if self.result is None:
            return []
        return [name for name in self.result.files if name not in self.written]

    @property
    def complete(self) -> bool:
        if self.notice is not None:
            return True
        if self.result is None:
            return False
        return self.result.error is not None or not self.missing


def file_lines(content: FetchFileContent, path: Path) -> list[str]:
    """The lines for a file that was written (the form of the call on the command line)."""
    detail = kind_text(content.data)
    if content.rows is not None:
        detail += f", {content.rows} Zeilen"
    total = sum(content.omitted.values())
    if total:
        detail += f", {total} Zeilen ausgelassen"
    lines = [f"Geschrieben: {path.name} ({detail})"]
    for reason, count in content.omitted.items():
        shown = f"{count}x" if count < total else "alle"
        lines.append(f"  ausgelassen ({shown}): {OMISSION_TEXTS[reason]}")
    return lines


def report(
    delivery: Delivery, directory: Path, *, out: TextIO, err: TextIO, summary: bool = True
) -> int:
    """Print the failed parts and, with ``summary``, the summary; return the exit code."""
    result = delivery.result
    failed_lines: list[str] = []
    exit_code = EXIT_OK
    written = len(delivery.written)
    if result is not None and result.error is not None:
        failed_lines.append(f"Fehler: Die Anfrage wurde nicht ausgeführt: {result.error.text}")
        exit_code = EXIT_FAILED
    if result is not None:
        for part in result.failed:
            period = (
                f"{moment_text(parse_moment(part.start))} bis {moment_text(parse_moment(part.end))}"
            )
            failed_lines.append(
                f"Fehler: {delivery.designation}, {kind_text(part.data)}, {period}: {part.text}"
            )
            exit_code = EXIT_FAILED
    failed_lines.extend(delivery.problems)
    if delivery.problems or delivery.missing:
        exit_code = EXIT_FAILED
    for line in failed_lines:
        print(line, file=err)
    if not summary:
        return exit_code
    if result is not None and result.error is not None:
        print(
            f"{written} Dateien geschrieben, die Anfrage wurde nicht ausgeführt (Exitcode 1).",
            file=err,
        )
    elif exit_code == EXIT_OK:
        print(f"{written} Dateien geschrieben nach {directory}.", file=out)
    else:
        total = written + len(delivery.missing) + (len(result.failed) if result else 0)
        print(
            f"{written} von {total} Dateien geschrieben, "
            f"{len(result.failed) if result else 0} Teile nicht geholt (Exitcode {EXIT_FAILED}).",
            file=err,
        )
    return exit_code


def run_request(
    connector: Connector,
    content: FetchRequestContent,
    *,
    retrieval: str,
    directory: Path,
    wait: timedelta,
    interval: float,
    monotonic: Callable[[], float],
    sleep: Callable[[float], None],
    out: TextIO,
    err: TextIO,
) -> int:
    """Send the request, wait for the answer and write the files; return the exit code."""
    delivery = Delivery(
        directory=directory,
        retrieval=retrieval,
        designation=content.designation,
        out=out,
    )
    try:
        sent = connector.send(retrieval, KIND_REQUEST, dump_content(content))
    except WayError as error:
        print(f"Fehler: Die Anfrage ließ sich nicht an das Relay übergeben: {error}.", file=err)
        return EXIT_FAILED
    delivery.request_id = sent.id
    LOGGER.info("request sent message=%s recipient=%s", sent.id, retrieval)
    deadline = monotonic() + wait.total_seconds()
    timed_out = False
    while True:
        connector.poll(delivery)
        if delivery.complete:
            break
        remaining = deadline - monotonic()
        if remaining <= 0:
            timed_out = True
            break
        sleep(min(interval, remaining))
    if delivery.notice is not None:
        reason, text = delivery.notice
        print(f"Fehler: Die Anfrage ließ sich nicht zustellen: {text} ({reason}).", file=err)
        return EXIT_FAILED
    code = report(delivery, directory, out=out, err=err, summary=not timed_out)
    if timed_out:
        minutes = max(1, round(wait.total_seconds() / 60))
        if delivery.result is None:
            print(
                f"Fehler: Nach {minutes} Minuten ist kein Ergebnis der Anfrage eingetroffen.",
                file=err,
            )
        else:
            names = ", ".join(delivery.missing)
            print(
                f"Fehler: Nach {minutes} Minuten fehlen noch Dateien des Ergebnisses: {names}.",
                file=err,
            )
        return EXIT_FAILED
    return code
