"""The retrieval through pipwerk relay: ``serve`` and ``request`` (order 5, specification relay 6
and 8, "Abruf").

The relay is imitated by the steps of ``relay_support.Network`` (the real relay comes with order
3; the tests across two real relays follow in order 6). ``MetaTrader5`` is the replica of the
tests of the component (``support.ArchiveMt5Module``). No socket may be opened while a test runs
(``no_sockets``): the connection to the relay is a directory.
"""

import io
import json
import threading
import time
from collections.abc import Iterator
from pathlib import Path
from typing import Any, cast
from uuid import uuid4

import pytest
from pipwerk_marketdata import MarketDataStore, migrate_database
from pipwerk_relaycore import (
    Attachment,
    Connector,
    Message,
    ReceivedMessage,
    UndeliverableContent,
    UndeliverableReason,
)
from pydantic import JsonValue
from relay_support import (
    ASKER,
    CLOCK,
    RETRIEVAL,
    Network,
    Pump,
    ServeSide,
    files_way,
    pump_hooks,
)
from sqlalchemy import create_engine
from support import ArchiveMt5Module, make_config, symbol_record
from test_cli import archive, config_file, names, no_sockets  # noqa: F401 - fixture

from pipwerk_fetch_mt5.cli import main
from pipwerk_fetch_mt5.mt5_gateway import Mt5Gateway
from pipwerk_fetch_mt5.relay.commands import RelayHooks
from pipwerk_fetch_mt5.relay.connection import open_connector
from pipwerk_fetch_mt5.relay.contents import (
    KIND_FILE,
    KIND_REQUEST,
    KIND_RESULT,
    FetchFileContent,
    FetchResultContent,
    load_content,
)
from pipwerk_fetch_mt5.relay.request import Delivery
from pipwerk_fetch_mt5.relay.serve import RequestHandler

REQUEST: dict[str, JsonValue] = {
    "broker": "Broker-Live-1",
    "symbol": "EURUSD",
    "time_units": ["H1"],
    "ticks": True,
    "from": "2026-01-05T00:00:00Z",
    "to": "2026-01-06T00:00:00Z",
}


@pytest.fixture
def network(tmp_path: Path) -> Network:
    root = tmp_path / "net"
    root.mkdir()
    return Network(root)


@pytest.fixture
def serve(network: Network) -> Iterator[ServeSide]:
    side = ServeSide(network, archive())
    yield side
    side.close()


class Outcome:
    def __init__(self, code: int, out: str, err: str) -> None:
        self.code, self.out, self.err = code, out, err


def ask(
    network: Network,
    serve: ServeSide,
    target: Path,
    *arguments: str,
    wait: str = "30",
    broker: str = "Broker-Live-1",
) -> Outcome:
    """``pipwerk-fetch-mt5 request`` with the relay and the retrieval imitated between the
    pauses of the request."""
    hooks, _ = pump_hooks(network, serve)
    out, err = io.StringIO(), io.StringIO()
    code = main(
        [
            "request", "-c", str(network.ask_ini), "--address", RETRIEVAL, "--broker", broker,
            "--from", "2026-01-05", "--to", "2026-01-06", "-o", str(target), "--wait", wait,
            *arguments,
        ],
        relay_hooks=hooks,
        out=out,
        err=err,
    )  # fmt: skip
    return Outcome(code, out.getvalue(), err.getvalue())


# --- the whole way ---------------------------------------------------------------------------


def test_the_files_arrive_and_are_those_of_the_call_on_the_command_line(
    tmp_path: Path, network: Network, serve: ServeSide
) -> None:
    target = tmp_path / "received"
    result = ask(network, serve, target, "-u", "H1,M1", "--ticks", "EURUSD")
    assert result.code == 0, result.err
    expected = [
        "EURUSD_CONTRACT_20260105_20260106.json",
        "EURUSD_H1_20260105_20260106.json",
        "EURUSD_M1_20260105_20260106.json",
        "EURUSD_TICKS_20260105_20260106.json",
    ]
    assert names(target) == expected
    assert "4 Dateien geschrieben" in result.out
    assert "Geschrieben: EURUSD_H1_20260105_20260106.json (Kerzen H1, 24 Zeilen)" in result.out
    assert result.err == ""
    # The same call on the command line writes the same bytes.
    local = tmp_path / "local"
    code = main(
        [
            *("-c", str(config_file(tmp_path)), "--from", "2026-01-05", "--to", "2026-01-06"),
            *("-u", "H1,M1", "--ticks", "-o", str(local), "EURUSD"),
        ],
        module=archive(),
        clock=lambda: CLOCK,
        out=io.StringIO(),
        err=io.StringIO(),
    )
    assert code == 0
    for name in expected:
        assert (target / name).read_bytes() == (local / name).read_bytes(), name


def test_the_delivered_files_can_be_imported_with_the_library_of_the_data_store(
    tmp_path: Path, network: Network, serve: ServeSide
) -> None:
    target = tmp_path / "received"
    result = ask(network, serve, target, "-u", "H1", "--ticks", "EURUSD")
    assert result.code == 0, result.err
    engine = create_engine(f"sqlite:///{tmp_path / 'data.db'}")
    migrate_database(engine)
    store = MarketDataStore(engine)
    imported = {name: store.import_json((target / name).read_bytes()) for name in names(target)}
    assert all(item.rejected_count == 0 for item in imported.values())
    assert all(item.broker == "Broker-Live-1" for item in imported.values())
    assert imported["EURUSD_H1_20260105_20260106.json"].accepted == 24
    assert imported["EURUSD_TICKS_20260105_20260106.json"].accepted == 144
    assert imported["EURUSD_CONTRACT_20260105_20260106.json"].kind == "instrument"
    info = store.instrument_info("Broker-Live-1", "EURUSD")
    assert info is not None
    assert info.contract_size == 100000.0


def test_the_designation_of_the_files_is_the_instrument_and_the_symbol_goes_to_metatrader(
    tmp_path: Path, network: Network
) -> None:
    module = ArchiveMt5Module()
    module.symbols = {"EURUSD.r": symbol_record()}
    base = 1_767_571_200  # 2026-01-05 00:00:00
    module.candle_seconds["EURUSD.r"] = [base, base + 3600, base + 7200]
    side = ServeSide(network, module, make_config())
    target = tmp_path / "received"
    result = ask(network, side, target, "--instrument", "EURUSD", "-u", "H1", "EURUSD.r")
    assert result.code == 0, result.err
    assert names(target) == [
        "EURUSD_CONTRACT_20260105_20260106.json",
        "EURUSD_H1_20260105_20260106.json",
    ]
    document = json.loads((target / "EURUSD_H1_20260105_20260106.json").read_text("utf-8"))
    assert document["instrument"] == "EURUSD"
    asked = {args[0] for name, args, _ in module.calls if name == "symbol_info"}
    assert asked == {"EURUSD.r"}


def test_the_table_of_symbols_of_the_command_line_is_not_used_for_a_request(
    tmp_path: Path, network: Network
) -> None:
    side = ServeSide(network, archive(), make_config(symbols={"EURUSD": "NOT-THE-SYMBOL"}))
    result = ask(network, side, tmp_path / "received", "EURUSD")
    assert result.code == 0, result.err
    assert "NOT-THE-SYMBOL" not in {
        args[0] for name, args, _ in side.module.calls if name == "symbol_info"
    }


def test_a_symbol_that_is_no_designation_needs_an_instrument(
    tmp_path: Path, network: Network, serve: ServeSide
) -> None:
    target = tmp_path / "received"
    result = ask(network, serve, target, "EUR USD")
    assert result.code == 2
    assert "--instrument" in result.err
    assert not target.exists() or names(target) == []
    assert files_way(network.ask_out).read() == []  # nothing was sent


def test_omitted_rows_of_a_delivered_file_are_named(tmp_path: Path, network: Network) -> None:
    module = ArchiveMt5Module()
    base = 1_767_571_200  # 2026-01-05 00:00:00
    module.candle_seconds["EURUSD"] = [base, base, base + 3600]  # the first candle twice
    side = ServeSide(network, module)
    try:
        result = ask(network, side, tmp_path / "received", "-u", "H1", "EURUSD")
    finally:
        side.close()
    assert result.code == 0, result.err
    assert "(Kerzen H1, 2 Zeilen, 1 Zeilen ausgelassen)" in result.out
    assert "ausgelassen (alle): Kerze mit der Zeit der vorigen" in result.out


# --- refusals and parts that fail -----------------------------------------------------------


def test_a_request_for_another_broker_is_refused_without_reading_metatrader(
    tmp_path: Path, network: Network, serve: ServeSide
) -> None:
    target = tmp_path / "received"
    result = ask(network, serve, target, "EURUSD", broker="Other-Broker")
    assert result.code == 1
    assert "anderen Broker" in result.err
    assert names(target) == []
    called = serve.module.names()
    assert "copy_rates_range" not in called
    assert "copy_ticks_range" not in called
    assert "symbol_info" not in called
    assert "Anfrage von " + ASKER + " abgelehnt" in serve.out.getvalue()


def stepwise(network: Network, serve: ServeSide, content: dict[str, Any]) -> Delivery:
    """Send a request with any content and let the answer arrive."""
    connector = open_connector(network.ask_settings(), clock=lambda: CLOCK)
    directory = network.root / "stepwise"
    directory.mkdir(exist_ok=True)
    delivery = Delivery(
        directory=directory, retrieval=RETRIEVAL, designation="X", out=io.StringIO()
    )
    try:
        delivery.request_id = connector.send(RETRIEVAL, KIND_REQUEST, content).id
        for _ in range(3):
            network.relay_step()
            serve.poll()
            network.relay_step()
            connector.poll(delivery)
    finally:
        connector.close()
    return delivery


@pytest.mark.parametrize(
    "change",
    [
        {"broker": 5},
        {"extra": "field"},
        {"time_units": ["H7"]},
        {"time_units": ["H1", "H1"]},
        {"time_units": "H1"},
        {"ticks": "yes"},
        {"from": "2026-01-06T00:00:00Z", "to": "2026-01-05T00:00:00Z"},
        {"from": "2026-01-05"},
        {"from": "2026-01-05T00:00:00+02:00"},
        {"from": "1969-12-31T23:59:59Z"},
        {"symbol": "EUR USD"},
        {"symbol": ""},
        {"instrument": "a/b"},
        {"instrument": ".hidden"},
        {"broker": " Broker"},
        {"broker": ""},
    ],
)
def test_an_invalid_request_is_answered_with_request_invalid_and_nothing_is_read(
    network: Network, serve: ServeSide, change: dict[str, Any]
) -> None:
    delivery = stepwise(network, serve, {**REQUEST, **change})
    assert delivery.result is not None
    assert delivery.result.error is not None
    assert delivery.result.error.code == "request_invalid"
    assert delivery.result.files == []
    assert "copy_rates_range" not in serve.module.names()


@pytest.mark.parametrize("missing", sorted(REQUEST))
def test_a_request_without_one_of_its_entries_is_invalid(
    network: Network, serve: ServeSide, missing: str
) -> None:
    content = {key: value for key, value in REQUEST.items() if key != missing}
    delivery = stepwise(network, serve, content)
    assert delivery.result is not None
    assert delivery.result.error is not None
    assert delivery.result.error.code == "request_invalid"


def test_an_empty_list_of_time_units_asks_for_the_instrument_and_the_ticks_only(
    network: Network, serve: ServeSide
) -> None:
    delivery = stepwise(network, serve, {**REQUEST, "time_units": []})
    assert delivery.result is not None
    assert delivery.result.error is None
    assert delivery.result.files == [
        "EURUSD_CONTRACT_20260105_20260106.json",
        "EURUSD_TICKS_20260105_20260106.json",
    ]


def test_parts_that_cannot_be_fetched_are_named_with_their_reason_and_the_exit_code_is_1(
    tmp_path: Path, network: Network
) -> None:
    side = ServeSide(network, archive(), make_config(max_rows=10))
    target = tmp_path / "received"
    result = ask(network, side, target, "-u", "H1", "--ticks", "EURUSD")
    assert result.code == 1
    assert names(target) == ["EURUSD_CONTRACT_20260105_20260106.json"]
    period = "2026-01-05 00:00:00 UTC bis 2026-01-06 00:00:00 UTC"
    assert f"Fehler: EURUSD, Kerzen H1, {period}: Zeitraum zu groß" in result.err
    assert f"Fehler: EURUSD, Ticks, {period}: Zeitraum zu groß" in result.err
    assert "1 von 3 Dateien geschrieben, 2 Teile nicht geholt (Exitcode 1)." in result.err
    # the command line says the same about the same call
    local_err = io.StringIO()
    config = config_file(tmp_path, extra="max_rows_per_file = 10\n")
    code = main(
        [
            *("-c", str(config), "--from", "2026-01-05", "--to", "2026-01-06"),
            *("-u", "H1", "--ticks", "-o", str(tmp_path / "local"), "EURUSD"),
        ],
        module=archive(),
        clock=lambda: CLOCK,
        out=io.StringIO(),
        err=local_err,
    )
    assert code == 1
    assert local_err.getvalue() == result.err


def test_a_symbol_the_broker_does_not_know_fails_every_part(
    tmp_path: Path, network: Network, serve: ServeSide
) -> None:
    target = tmp_path / "received"
    result = ask(network, serve, target, "-u", "H1", "--instrument", "NOSUCH", "NOSUCH.x")
    assert result.code == 1
    assert names(target) == []
    assert result.err.count("Symbol beim Broker unbekannt") == 2
    assert "0 von 2 Dateien geschrieben, 2 Teile nicht geholt" in result.err


def test_a_terminal_that_is_not_reachable_is_the_reason_of_the_request(
    tmp_path: Path, network: Network, serve: ServeSide
) -> None:
    serve.module.initialize_result = False
    result = ask(network, serve, tmp_path / "received", "EURUSD")
    assert result.code == 1
    assert "MetaTrader 5 nicht erreichbar" in result.err


def test_the_retrieval_answers_requests_one_after_the_other(
    tmp_path: Path, network: Network, serve: ServeSide
) -> None:
    connector = open_connector(network.ask_settings(), clock=lambda: CLOCK)
    try:
        first = connector.send(RETRIEVAL, KIND_REQUEST, {**REQUEST, "ticks": False})
        second = connector.send(
            RETRIEVAL, KIND_REQUEST, {**REQUEST, "ticks": False, "symbol": "GBPUSD"}
        )
        network.relay_step()
        serve.poll()
        network.relay_step()
    finally:
        connector.close()
    answers = _answers(network)
    kinds = [(m.kind, m.reference_id) for m in answers]
    assert [kind for kind, _ in kinds if kind == KIND_RESULT] == [KIND_RESULT, KIND_RESULT]
    assert {reference for _, reference in kinds} == {first.id, second.id}
    # the answers to the first request come before those to the second
    order = [m.reference_id for m in sorted(answers, key=lambda m: m.created_at)]
    assert order.index(second.id) > max(i for i, ref in enumerate(order) if ref == first.id)
    assert serve.module.names().count("initialize") == 1  # one connection to MetaTrader 5


def _answers(network: Network) -> list[Message]:
    """The messages in the inbox of the asking component (opened with its key)."""
    found = []
    for item in files_way(network.ask_in).read():
        found.append(item.envelope.open({"net1.relay1": network.key_ask}, recipient="ask").message)
    return found


def test_no_message_of_the_retrieval_asks_for_a_receipt(network: Network, serve: ServeSide) -> None:
    connector = open_connector(network.ask_settings(), clock=lambda: CLOCK)
    try:
        connector.send(RETRIEVAL, KIND_REQUEST, REQUEST)
        assert connector.waiting_count == 0
        (item,) = files_way(network.ask_out).read()
        assert (
            item.envelope.open({"ask": network.key_ask}, recipient="net1.relay1").message.receipt
            is False
        )
        network.relay_step()
        serve.poll()
        network.relay_step()
    finally:
        connector.close()
    answers = _answers(network)
    assert {m.kind for m in answers} == {KIND_FILE, KIND_RESULT}
    assert all(m.receipt is False for m in answers)
    assert all(m.priority == "normal" for m in answers)
    assert all(m.sender == RETRIEVAL and m.recipient == ASKER for m in answers)
    assert serve.connector.waiting_count == 0


def test_each_file_is_one_message_with_the_file_as_its_attachment(
    network: Network, serve: ServeSide
) -> None:
    delivery = stepwise(network, serve, REQUEST)
    assert sorted(delivery.written) == [
        "EURUSD_CONTRACT_20260105_20260106.json",
        "EURUSD_H1_20260105_20260106.json",
        "EURUSD_TICKS_20260105_20260106.json",
    ]
    content = delivery.written["EURUSD_H1_20260105_20260106.json"]
    assert (content.data, content.rows, content.omitted) == ("H1", 24, {})
    assert delivery.written["EURUSD_CONTRACT_20260105_20260106.json"].rows is None
    assert delivery.result is not None
    assert sorted(delivery.result.files) == sorted(delivery.written)


# --- the wait and the failures of the request ----------------------------------------------------


def test_without_an_answer_the_request_ends_after_the_wait_time_with_exit_code_1(
    tmp_path: Path, network: Network
) -> None:
    now = [0.0]

    def sleep(seconds: float) -> None:
        now[0] += seconds

    out, err = io.StringIO(), io.StringIO()
    code = main(
        [
            *("request", "-c", str(network.ask_ini), "--address", RETRIEVAL, "--broker", "B"),
            *("--from", "2026-01-05", "--to", "2026-01-06", "-o", str(tmp_path / "t")),
            *("--wait", "2", "EURUSD"),
        ],
        relay_hooks=RelayHooks(sleep=sleep, monotonic=lambda: now[0], poll_interval=7.0),
        out=out,
        err=err,
    )
    assert code == 1
    assert "Nach 2 Minuten ist kein Ergebnis der Anfrage eingetroffen." in err.getvalue()
    assert out.getvalue() == ""
    assert 120 <= now[0] <= 127  # it waited the two minutes, not much longer


def test_an_undeliverable_notice_ends_the_request_with_the_reason(
    tmp_path: Path, network: Network
) -> None:
    def sleep(_seconds: float) -> None:
        (item,) = files_way(network.ask_out).read()
        request = item.envelope.open({"ask": network.key_ask}, recipient="net1.relay1").message
        notice = Message(
            id=uuid4(),
            sender="relay.net1.relay1",
            recipient=ASKER,
            priority="normal",
            kind="relay.undeliverable",
            content=UndeliverableContent.of(
                UndeliverableReason.UNKNOWN_RECIPIENT, RETRIEVAL, KIND_REQUEST
            ).to_content(),
            reference_id=request.id,
            created_at=CLOCK,
        )
        network.put_into_inbox_of_ask(notice)  # from the relay, not from the retrieval

    out, err = io.StringIO(), io.StringIO()
    code = main(
        [
            *("request", "-c", str(network.ask_ini), "--address", RETRIEVAL, "--broker", "B"),
            *("--from", "2026-01-05", "--to", "2026-01-06", "-o", str(tmp_path / "t"), "EURUSD"),
        ],
        relay_hooks=RelayHooks(sleep=sleep, monotonic=time.monotonic, poll_interval=0.01),
        out=out,
        err=err,
    )
    assert code == 1, err.getvalue()
    assert "unknown_recipient" in err.getvalue()
    assert "Die Anfrage ließ sich nicht zustellen" in err.getvalue()
    assert names(tmp_path / "t") == []


def test_a_request_that_cannot_be_handed_to_the_relay_ends_with_exit_code_1(
    tmp_path: Path, network: Network
) -> None:
    network.ask_out.rmdir()
    out, err = io.StringIO(), io.StringIO()
    code = main(
        [
            *("request", "-c", str(network.ask_ini), "--address", RETRIEVAL, "--broker", "B"),
            *("--from", "2026-01-05", "--to", "2026-01-06", "-o", str(tmp_path / "t"), "EURUSD"),
        ],
        relay_hooks=RelayHooks(sleep=lambda _s: None, poll_interval=0.01),
        out=out,
        err=err,
    )
    assert code == 1
    assert "nicht an das Relay übergeben" in err.getvalue()


# --- the answer in detail (the component that receives) ---------------------------------------


def make_delivery(tmp_path: Path) -> tuple[Delivery, io.StringIO]:
    out = io.StringIO()
    directory = tmp_path / "files"
    directory.mkdir()
    delivery = Delivery(directory=directory, retrieval=RETRIEVAL, designation="EURUSD", out=out)
    delivery.request_id = uuid4()
    return delivery, out


def answer(
    delivery: Delivery,
    kind: str,
    content: dict[str, Any],
    attachment: tuple[str, bytes] | None = None,
    *,
    sender: str = RETRIEVAL,
    reference: Any = "request",
) -> ReceivedMessage:
    message = Message(
        id=uuid4(),
        sender=sender,
        recipient=ASKER,
        priority="normal",
        kind=kind,
        content=content,
        reference_id=delivery.request_id if reference == "request" else reference,
        created_at=CLOCK,
        attachments=() if attachment is None else (Attachment.of(*attachment),),
    )
    received = ReceivedMessage(message, (), () if attachment is None else (attachment[1],))
    delivery.store(received)
    return received


H1 = "EURUSD_H1_20260105_20260106.json"
TICKS = "EURUSD_TICKS_20260105_20260106.json"


def file_content(name: str = H1, data: str = "H1") -> dict[str, Any]:
    return {"name": name, "data": data, "rows": 3, "omitted": {}}


def result_content(files: list[str]) -> dict[str, Any]:
    return {"files": files, "failed": []}


def test_the_result_may_arrive_before_the_last_file(tmp_path: Path) -> None:
    delivery, out = make_delivery(tmp_path)
    answer(delivery, KIND_FILE, file_content(), (H1, b"one"))
    answer(delivery, KIND_RESULT, result_content([H1, TICKS]))
    assert delivery.missing == [TICKS]
    assert not delivery.complete
    answer(delivery, KIND_FILE, file_content(TICKS, "TICKS"), (TICKS, b"two"))
    assert delivery.missing == []
    assert delivery.complete
    assert (tmp_path / "files" / TICKS).read_bytes() == b"two"
    assert out.getvalue().count("Geschrieben:") == 2


def test_a_file_that_arrives_again_is_not_written_again(tmp_path: Path) -> None:
    delivery, out = make_delivery(tmp_path)
    answer(delivery, KIND_FILE, file_content(), (H1, b"one"))
    path = tmp_path / "files" / H1
    first_time = path.stat().st_mtime_ns
    path.write_bytes(b"changed by the test")
    answer(delivery, KIND_FILE, file_content(), (H1, b"one"))  # a new message, the same name
    assert path.read_bytes() == b"changed by the test"  # not written a second time
    assert path.stat().st_mtime_ns >= first_time
    assert out.getvalue().count("Geschrieben:") == 1


def test_a_message_that_answers_another_request_is_ignored(tmp_path: Path) -> None:
    delivery, out = make_delivery(tmp_path)
    answer(delivery, KIND_FILE, file_content(), (H1, b"late"), reference=uuid4())
    answer(delivery, KIND_RESULT, result_content([H1]), reference=None)
    assert delivery.written == {}
    assert delivery.result is None
    assert list((tmp_path / "files").iterdir()) == []
    assert out.getvalue() == ""


def test_a_message_from_another_sender_is_ignored(tmp_path: Path) -> None:
    delivery, _ = make_delivery(tmp_path)
    answer(delivery, KIND_FILE, file_content(), (H1, b"x"), sender="other.net1.relay2")
    assert delivery.written == {}
    assert list((tmp_path / "files").iterdir()) == []


@pytest.mark.parametrize(
    ("content", "attachment"),
    [
        ({"name": H1, "data": "H1", "extra": 1}, (H1, b"x")),
        ({"name": "../evil.json", "data": "H1"}, ("evil.json", b"x")),
        ({"name": H1, "data": "TICKS"}, (H1, b"x")),
        ({"name": H1, "data": "H1"}, ("OTHER_H1_20260105_20260106.json", b"x")),
        ({"name": H1, "data": "H1"}, None),
    ],
)
def test_an_invalid_file_message_is_not_written_and_is_a_problem(
    tmp_path: Path, content: dict[str, Any], attachment: tuple[str, bytes] | None
) -> None:
    delivery, _ = make_delivery(tmp_path)
    answer(delivery, KIND_FILE, content, attachment)
    assert delivery.written == {}
    assert len(delivery.problems) == 1
    assert list((tmp_path / "files").iterdir()) == []
    answer(delivery, KIND_RESULT, result_content([]))
    assert delivery.complete
    err = io.StringIO()
    from pipwerk_fetch_mt5.relay.request import report

    assert report(delivery, tmp_path, out=io.StringIO(), err=err) == 1


def test_a_failure_to_write_leaves_the_message_in_the_inbox(tmp_path: Path) -> None:
    delivery, _ = make_delivery(tmp_path)
    (tmp_path / "files").rmdir()
    from pipwerk_fetch_mt5.errors import FetchError

    with pytest.raises(FetchError):
        answer(delivery, KIND_FILE, file_content(), (H1, b"x"))
    assert delivery.written == {}


# --- interruption (specification 8, disturbance 3) -----------------------------------------------


class Crash(BaseException):  # a hard stop of the process is no ordinary exception
    """The process dies: not an ``Exception``, so nothing catches it on the way."""


class CrashingConnector:
    """A connector that dies before the n-th message it is asked to send."""

    def __init__(self, real: Connector, die_at: int) -> None:
        self._real = real
        self._die_at = die_at
        self._sent = 0

    def send(self, *args: Any, **kwargs: Any) -> Message:
        self._sent += 1
        if self._sent == self._die_at:
            raise Crash
        return self._real.send(*args, **kwargs)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._real, name)


@pytest.mark.parametrize("die_at", [1, 2, 3, 4])
def test_after_a_hard_stop_during_the_delivery_nothing_is_missing_and_no_file_is_written_twice(
    tmp_path: Path, network: Network, die_at: int
) -> None:
    serve = ServeSide(network, archive())
    asking = open_connector(network.ask_settings(), clock=lambda: CLOCK)
    out = io.StringIO()
    target = tmp_path / "files"
    target.mkdir()
    delivery = Delivery(directory=target, retrieval=RETRIEVAL, designation="EURUSD", out=out)
    try:
        delivery.request_id = asking.send(RETRIEVAL, KIND_REQUEST, REQUEST).id
        network.relay_step()
        # the retrieval dies before it hands over message number ``die_at``
        crashing = RequestHandler(
            cast(Connector, CrashingConnector(serve.connector, die_at)),
            Mt5Gateway(serve.config.metatrader, serve.module),
            serve.config,
            clock=lambda: CLOCK,
            out=io.StringIO(),
        )
        with pytest.raises(Crash):
            serve.connector.poll(crashing)
        network.relay_step()
        asking.poll(delivery)
        assert len(delivery.written) == die_at - 1  # what had been sent arrived
        serve.restart()  # the retrieval starts again
        for _ in range(3):
            serve.poll()
            network.relay_step()
            asking.poll(delivery)
            network.relay_step()
    finally:
        asking.close()
        serve.close()
    assert delivery.complete
    assert delivery.problems == []
    assert sorted(delivery.written) == [
        "EURUSD_CONTRACT_20260105_20260106.json",
        H1,
        TICKS,
    ]
    assert names(target) == sorted(delivery.written)
    lines = [line for line in out.getvalue().splitlines() if line.startswith("Geschrieben:")]
    assert len(lines) == 3  # every file is written once
    assert len(set(lines)) == 3
    assert files_way(network.fetch_in).read() == []  # the request is answered and acknowledged


def test_a_request_is_answered_once_after_the_retrieval_has_finished_it(
    network: Network, serve: ServeSide
) -> None:
    stepwise(network, serve, REQUEST)
    network.relay_step()
    assert serve.poll().delivered == 0  # nothing is left in the inbox
    assert files_way(network.fetch_in).read() == []


def test_when_the_directory_of_the_relay_is_not_reachable_the_request_is_answered_later(
    network: Network, serve: ServeSide
) -> None:
    connector = open_connector(network.ask_settings(), clock=lambda: CLOCK)
    delivery = Delivery(
        directory=network.root / "received",
        retrieval=RETRIEVAL,
        designation="EURUSD",
        out=io.StringIO(),
    )
    (network.root / "received").mkdir()
    try:
        delivery.request_id = connector.send(RETRIEVAL, KIND_REQUEST, REQUEST).id
        network.relay_step()
        network.fetch_out.rename(network.root / "gone")  # the shared directory is not reachable
        assert serve.poll().failed == 1  # the request stays; nothing was lost
        (network.root / "gone").rename(network.fetch_out)
        assert serve.poll().delivered == 1
        for _ in range(2):
            network.relay_step()
            connector.poll(delivery)
    finally:
        connector.close()
    assert delivery.complete
    assert len(delivery.written) == 3


# --- serve as a program ------------------------------------------------------------------


def test_serve_runs_answers_requests_and_ends_when_it_is_told_to(
    tmp_path: Path, network: Network
) -> None:
    stop = threading.Event()
    out, err = io.StringIO(), io.StringIO()
    codes: list[int] = []

    def run_serve() -> None:
        codes.append(
            main(
                ["serve", "-c", str(network.fetch_ini)],
                module=archive(),
                clock=lambda: CLOCK,
                out=out,
                err=err,
                relay_hooks=RelayHooks(stop=stop, poll_interval=0.01),
            )
        )

    thread = threading.Thread(target=run_serve, daemon=True)
    pump = Pump(network)
    thread.start()
    pump.start()
    try:
        # Two connections of one process do not migrate their databases at the same time
        # (alembic keeps its state in the module); in practice each runs in a process of its own.
        deadline = time.monotonic() + 10
        while "wartet auf Anfragen" not in out.getvalue() and time.monotonic() < deadline:
            time.sleep(0.01)
        asked = io.StringIO(), io.StringIO()
        code = main(
            [
                *("request", "-c", str(network.ask_ini), "--address", RETRIEVAL),
                *("--broker", "Broker-Live-1", "--from", "2026-01-05", "--to", "2026-01-06"),
                *("-u", "H1", "-o", str(tmp_path / "received"), "--wait", "1", "EURUSD"),
            ],
            relay_hooks=RelayHooks(sleep=lambda _s: time.sleep(0.01), poll_interval=0.01),
            out=asked[0],
            err=asked[1],
        )
        assert code == 0, asked[1].getvalue()
    finally:
        stop.set()
        thread.join(timeout=10)
        pump.stop()
    assert not thread.is_alive()
    assert pump.errors == []
    assert codes == [0], err.getvalue()
    assert names(tmp_path / "received") == [
        "EURUSD_CONTRACT_20260105_20260106.json",
        H1,
    ]
    assert f"Adresse {RETRIEVAL}, wartet auf Anfragen" in out.getvalue()
    assert "beantwortet: 2 Dateien gesendet, 0 Teile nicht geholt" in out.getvalue()
    assert out.getvalue().rstrip().endswith("beendet.")


def test_the_result_names_what_was_delivered_in_the_form_of_the_schema(
    network: Network, serve: ServeSide
) -> None:
    delivery = stepwise(network, serve, REQUEST)
    result = delivery.result
    assert isinstance(result, FetchResultContent)
    again = load_content(FetchResultContent, json.loads(result.model_dump_json(by_alias=True)))
    assert again == result
    one = load_content(FetchFileContent, json.loads(delivery.written[H1].model_dump_json()))
    assert one == delivery.written[H1]


def test_the_year_limits_of_the_command_line_hold_for_the_message(
    network: Network, serve: ServeSide
) -> None:
    delivery = stepwise(network, serve, {**REQUEST, "to": "2101-01-01T00:00:00Z"})
    assert delivery.result is not None
    assert delivery.result.error is not None
    assert delivery.result.error.code == "request_invalid"
