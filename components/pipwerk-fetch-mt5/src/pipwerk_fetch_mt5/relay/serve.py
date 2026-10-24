"""``serve``: the retrieval as a running component of pipwerk relay (specification relay 6.1, 6.2).

``serve`` reads the inbox of its connection to the relay at fixed intervals. A message of the
kind ``fetch.request`` is answered like this:

1. The content is checked (``FetchRequestContent``). If it is not valid, the answer is one
   ``fetch.result`` with the reason ``request_invalid``.
2. The broker of the request must be the trade server MetaTrader 5 is logged in to; otherwise
   the answer is one ``fetch.result`` with the reason ``broker_mismatch``. (If the name of the
   trade server cannot be determined, the reason is the one of the program: for example
   ``terminal_unavailable``.)
3. Otherwise the parts are fetched like the call on the command line does (``fetch_documents``),
   and every file is sent at once as a message ``fetch.file`` with the file as its attachment.
   The designation of the instrument that the files carry is ``instrument`` of the request,
   without it the symbol; the symbol goes to MetaTrader 5 as it stands (the table ``[symbols]``
   is not used here).
4. At the end, one ``fetch.result`` names all files that were delivered and every part that
   could not be fetched, with the reason.

All answers go to the sender of the request and name its id as reference. No message asks for a
receipt: the answer is the confirmation (specification relay 3.7).

Requests are answered one after the other: ``connector.poll`` calls ``store`` for one message at
a time, and MetaTrader 5 is read over one connection.

**Interruption** (specification relay E4, 8 disturbance 3). The connector marks a request as seen
only after ``store`` has returned, so ``store`` returns only after the last answer was handed
over. If the program ends or the hand-over fails (``WayUnavailableError``: for example the
directory of the relay is not reachable), the request stays in the inbox and is answered again
from the beginning at the next reading. A file that was sent already arrives a second time then,
as a new message with the same name and the same content; ``request`` writes a file with a name
it has written for this request only once.

A part that is too large for the way to the relay (``WayTooLargeError``) is reported as
``range_too_large`` (the requester splits the period); a part that the way refuses for another
reason as ``internal_error``. Neither is repeated.
"""

from __future__ import annotations

import logging
import threading
from collections.abc import Callable
from dataclasses import replace
from datetime import datetime
from pathlib import Path
from types import MappingProxyType
from typing import TextIO

from pipwerk_relaycore import (
    KIND_UNDELIVERABLE,
    Connector,
    Handler,
    Message,
    ReceivedMessage,
    WayRefusedError,
    WayTooLargeError,
)
from pipwerk_relaycore.address import is_from_relay
from pydantic import ValidationError

from pipwerk_fetch_mt5.config import StartupConfig
from pipwerk_fetch_mt5.errors import REASONS, ErrorCode, FetchError
from pipwerk_fetch_mt5.fetch import PartDocument, PartFailure, Request, fetch_documents
from pipwerk_fetch_mt5.gateway import TerminalGateway
from pipwerk_fetch_mt5.relay.contents import (
    KIND_FILE,
    KIND_REQUEST,
    KIND_RESULT,
    FailedPart,
    FetchFileContent,
    FetchRequestContent,
    FetchResultContent,
    RequestError,
    dump_content,
    load_content,
    plain_text,
)
from pipwerk_fetch_mt5.service import FetchService

LOGGER = logging.getLogger("pipwerk_fetch_mt5.relay.serve")

_REFUSALS: frozenset[ErrorCode] = frozenset(
    {"request_invalid", "broker_mismatch", "terminal_unavailable", "broker_unknown"}
)
"""The reasons that may stand for a refused request; any other becomes ``internal_error``."""


class RequestHandler(Handler):
    """The component that answers requests; ``store`` returns after the last answer."""

    def __init__(
        self,
        connector: Connector,
        gateway: TerminalGateway,
        config: StartupConfig,
        *,
        clock: Callable[[], datetime] | None = None,
        out: TextIO,
    ) -> None:
        self._connector = connector
        self._gateway = gateway
        self._config = config
        self._clock = clock
        self._out = out

    def store(self, received: ReceivedMessage) -> None:
        message = received.message
        if message.kind == KIND_REQUEST:
            self._answer(message)
        elif message.kind == KIND_UNDELIVERABLE and is_from_relay(message.sender):
            LOGGER.warning(
                "an answer could not be delivered message=%s reason=%s",
                message.reference_id,
                plain_text(message.content.get("reason")),
            )
            print(
                f"Eine Antwort ließ sich nicht zustellen (Nachricht {message.reference_id}): "
                f"{plain_text(message.content.get('text'))}",
                file=self._out,
            )
        else:
            LOGGER.warning(
                "ignored message=%s kind=%s sender=%s", message.id, message.kind, message.sender
            )

    # --- one request ------------------------------------------------------------------------

    def _answer(self, message: Message) -> None:
        try:
            request = load_content(FetchRequestContent, message.content)
        except ValidationError:
            self._refuse(message, "request_invalid")
            return
        # The symbol is the one of the request; the table [symbols] is for the command line.
        config = replace(
            self._config, symbols=MappingProxyType({request.designation: request.symbol})
        )
        service = FetchService(self._gateway, config, self._clock)
        try:
            broker = service.broker_name()
        except FetchError as error:
            self._refuse(message, error.code)
            return
        except Exception as error:  # a defect must not stop the other requests
            LOGGER.error("the broker could not be determined (%s)", type(error).__name__)
            self._refuse(message, "internal_error")
            return
        if broker != request.broker:
            self._refuse(message, "broker_mismatch")
            return
        files: list[str] = []
        failed: list[FailedPart] = []
        fetch_request = Request(
            instruments=(request.designation,),
            time_units=request.units,
            ticks=request.ticks,
            start=request.start_time,
            end=request.end_time,
            directory=Path(),  # nothing is written here
        )
        for item in fetch_documents(service, fetch_request):
            if isinstance(item, PartFailure):
                failed.append(self._failed(request, item.part.data, item.error.code))
                continue
            try:
                self._send_file(message, item)
            except WayTooLargeError:
                failed.append(self._failed(request, item.part.data, "range_too_large"))
            except WayRefusedError:
                failed.append(self._failed(request, item.part.data, "internal_error"))
            else:
                files.append(item.name)
        self._send_result(message, FetchResultContent(files=files, failed=failed))
        LOGGER.info("answered message=%s files=%d failed=%d", message.id, len(files), len(failed))
        print(
            f"Anfrage von {message.sender} beantwortet: {len(files)} Dateien gesendet, "
            f"{len(failed)} Teile nicht geholt.",
            file=self._out,
        )

    def _refuse(self, message: Message, code: ErrorCode) -> None:
        reason: ErrorCode = code if code in _REFUSALS else "internal_error"
        LOGGER.warning("request refused message=%s reason=%s", message.id, reason)
        self._send_result(
            message, FetchResultContent(files=[], failed=[], error=RequestError.of(reason))
        )
        print(
            f"Anfrage von {message.sender} abgelehnt: {REASONS[reason]}.",
            file=self._out,
        )

    @staticmethod
    def _failed(request: FetchRequestContent, data: str, code: ErrorCode) -> FailedPart:
        return FailedPart.model_validate(
            {
                "data": data,
                "from": request.start,
                "to": request.end,
                "code": code,
                "text": REASONS[code],
            }
        )

    def _send_file(self, message: Message, document: PartDocument) -> None:
        content = FetchFileContent.model_validate(
            {
                "name": document.name,
                "data": document.part.data,
                **({} if document.rows is None else {"rows": document.rows}),
                "omitted": dict(document.omitted_by_reason),
            }
        )
        self._connector.send(
            message.sender,
            KIND_FILE,
            dump_content(content),
            attachments=[(document.name, document.content)],
            reference_id=message.id,
        )

    def _send_result(self, message: Message, result: FetchResultContent) -> None:
        self._connector.send(
            message.sender, KIND_RESULT, dump_content(result), reference_id=message.id
        )


def serve_forever(
    connector: Connector, handler: Handler, *, interval: float, stop: threading.Event
) -> None:
    """Read the inbox every ``interval`` seconds until ``stop`` is set."""
    while not stop.is_set():
        connector.poll(handler)
        stop.wait(interval)
