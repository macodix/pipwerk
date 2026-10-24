"""``serve`` and ``request`` across two real relays (order 6, specification relay 8, "Abruf" and
the disturbances 1 and 3).

The relays are the real ones of the component pipwerk relay (``real_relays.RealNetwork``): each
has its database, its queue and its operating configuration, and they exchange envelopes through a
directory. ``MetaTrader5`` is the replica of the tests of the component. No socket may be opened
while a test runs (``no_sockets``): every connection is a directory.
"""

import io
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest
from pipwerk_marketdata import MarketDataStore, migrate_database
from pydantic import JsonValue
from real_relays import RELAY_1, RELAY_2, CrashPlan, RealNetwork
from relay_support import CLOCK, RETRIEVAL, ServeSide
from sqlalchemy import create_engine
from support import make_config
from test_cli import archive, config_file, names, no_sockets  # noqa: F401 - fixture

from pipwerk_fetch_mt5.cli import main
from pipwerk_fetch_mt5.relay.connection import open_connector
from pipwerk_fetch_mt5.relay.contents import KIND_REQUEST
from pipwerk_fetch_mt5.relay.request import Delivery

REQUEST: dict[str, JsonValue] = {
    "broker": "Broker-Live-1",
    "symbol": "EURUSD",
    "time_units": ["H1"],
    "ticks": True,
    "from": "2026-01-05T00:00:00Z",
    "to": "2026-01-06T00:00:00Z",
}
FILES = [
    "EURUSD_CONTRACT_20260105_20260106.json",
    "EURUSD_H1_20260105_20260106.json",
    "EURUSD_TICKS_20260105_20260106.json",
]


@pytest.fixture
def network(tmp_path: Path) -> Iterator[RealNetwork]:
    root = tmp_path / "net"
    root.mkdir()
    real = RealNetwork(root)
    yield real
    real.close()


@pytest.fixture
def serve(network: RealNetwork) -> Iterator[ServeSide]:
    side = ServeSide(network, archive())
    yield side
    side.close()


class Outcome:
    def __init__(self, code: int, out: str, err: str) -> None:
        self.code, self.out, self.err = code, out, err


def ask(
    network: RealNetwork,
    serve: ServeSide,
    target: Path,
    *arguments: str,
    wait: str = "30",
    broker: str = "Broker-Live-1",
    address: str = RETRIEVAL,
) -> Outcome:
    """``pipwerk-fetch-mt5 request`` while the relays and the retrieval work between its pauses."""
    out, err = io.StringIO(), io.StringIO()
    code = main(
        [
            "request", "-c", str(network.ask_ini), "--address", address, "--broker", broker,
            "--from", "2026-01-05", "--to", "2026-01-06", "-o", str(target), "--wait", wait,
            *arguments,
        ],
        relay_hooks=network.hooks(serve.poll),
        out=out,
        err=err,
    )  # fmt: skip
    return Outcome(code, out.getvalue(), err.getvalue())


def nothing_waits(network: RealNetwork) -> None:
    """Every envelope is handed over and both queues are empty."""
    assert network.in_transit() == []
    assert network.relay_1.queue_size() == 0
    assert network.relay_2.queue_size() == 0


# --- the whole way across two relays ----------------------------------------------------------


def test_a_valid_request_delivers_the_files_of_the_call_on_the_command_line(
    tmp_path: Path, network: RealNetwork, serve: ServeSide
) -> None:
    target = tmp_path / "received"
    result = ask(network, serve, target, "-u", "H1", "--ticks", "EURUSD")
    assert result.code == 0, result.err
    assert names(target) == FILES
    assert "3 Dateien geschrieben" in result.out
    assert result.err == ""
    local = tmp_path / "local"
    code = main(
        [
            *("-c", str(config_file(tmp_path)), "--from", "2026-01-05", "--to", "2026-01-06"),
            *("-u", "H1", "--ticks", "-o", str(local), "EURUSD"),
        ],
        module=archive(),
        clock=lambda: CLOCK,
        out=io.StringIO(),
        err=io.StringIO(),
    )
    assert code == 0
    for name in FILES:
        assert (target / name).read_bytes() == (local / name).read_bytes(), name
    nothing_waits(network)


def test_the_delivered_files_can_be_imported_with_the_library_of_the_data_store(
    tmp_path: Path, network: RealNetwork, serve: ServeSide
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


def test_two_requests_one_after_the_other_both_arrive(
    tmp_path: Path, network: RealNetwork, serve: ServeSide
) -> None:
    first = ask(network, serve, tmp_path / "one", "-u", "H1", "EURUSD")
    second = ask(network, serve, tmp_path / "two", "-u", "H1", "GBPUSD")
    assert first.code == second.code == 0
    assert names(tmp_path / "one") == FILES[:2]
    assert names(tmp_path / "two") == [name.replace("EURUSD", "GBPUSD") for name in FILES[:2]]
    nothing_waits(network)


# --- refusals, parts with a reason, requests that cannot be delivered ---------------------------


def test_a_request_for_another_broker_is_refused_across_two_relays(
    tmp_path: Path, network: RealNetwork, serve: ServeSide
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
    nothing_waits(network)


def stepwise(network: RealNetwork, serve: ServeSide, content: dict[str, Any]) -> Delivery:
    """Send a request with any content and let the answer arrive."""
    connector = open_connector(network.ask_settings(), clock=lambda: CLOCK)
    directory = network.root / "stepwise"
    directory.mkdir(exist_ok=True)
    delivery = Delivery(
        directory=directory, retrieval=RETRIEVAL, designation="X", out=io.StringIO()
    )
    try:
        delivery.request_id = connector.send(RETRIEVAL, KIND_REQUEST, content).id
        for _ in range(4):
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
        {"time_units": ["H7"]},
        {"from": "2026-01-06T00:00:00Z", "to": "2026-01-05T00:00:00Z"},
        {"symbol": "EUR USD"},
        {"extra": "field"},
    ],
)
def test_an_invalid_request_is_answered_with_request_invalid_across_two_relays(
    network: RealNetwork, serve: ServeSide, change: dict[str, Any]
) -> None:
    delivery = stepwise(network, serve, {**REQUEST, **change})
    assert delivery.result is not None
    assert delivery.result.error is not None
    assert delivery.result.error.code == "request_invalid"
    assert delivery.result.files == []
    assert "copy_rates_range" not in serve.module.names()
    nothing_waits(network)


def test_parts_with_a_reason_are_named_and_the_files_that_could_be_fetched_arrive(
    tmp_path: Path, network: RealNetwork
) -> None:
    side = ServeSide(network, archive(), make_config(max_rows=10))
    try:
        target = tmp_path / "received"
        result = ask(network, side, target, "-u", "H1", "--ticks", "EURUSD")
    finally:
        side.close()
    assert result.code == 1
    assert names(target) == ["EURUSD_CONTRACT_20260105_20260106.json"]
    period = "2026-01-05 00:00:00 UTC bis 2026-01-06 00:00:00 UTC"
    assert f"Fehler: EURUSD, Kerzen H1, {period}: Zeitraum zu groß" in result.err
    assert f"Fehler: EURUSD, Ticks, {period}: Zeitraum zu groß" in result.err
    assert "1 von 3 Dateien geschrieben, 2 Teile nicht geholt (Exitcode 1)." in result.err
    nothing_waits(network)


def test_a_request_to_an_unknown_component_is_reported_with_the_reason_and_exit_code_1(
    tmp_path: Path, network: RealNetwork, serve: ServeSide
) -> None:
    result = ask(network, serve, tmp_path / "t", "EURUSD", address=f"nobody.net1.{RELAY_2}")
    assert result.code == 1
    assert "Die Anfrage ließ sich nicht zustellen" in result.err
    assert "unknown_recipient" in result.err
    assert names(tmp_path / "t") == []
    assert "initialize" not in serve.module.names()
    nothing_waits(network)


def test_a_request_to_an_unknown_relay_is_reported_with_the_reason_and_exit_code_1(
    tmp_path: Path, network: RealNetwork, serve: ServeSide
) -> None:
    result = ask(network, serve, tmp_path / "t", "EURUSD", address="fetch.net1.relay9")
    assert result.code == 1
    assert "unknown_relay" in result.err
    nothing_waits(network)


# --- disturbance 1: the relay of the retrieval is not running ------------------------------


def test_1_a_request_waits_while_the_relay_of_the_retrieval_is_ended_and_arrives_after_its_start(
    tmp_path: Path, network: RealNetwork, serve: ServeSide
) -> None:
    network.stopped.add(RELAY_2)
    started: list[int] = []
    rounds = [0]
    original = network.relay_step

    def step() -> int:
        rounds[0] += 1
        if rounds[0] == 40:  # after some pauses of the request
            started.append(len(list(network.between_12.glob("*.json"))))
            network.stopped.discard(RELAY_2)
        return original()

    network.relay_step = step  # type: ignore[method-assign]
    target = tmp_path / "received"
    result = ask(network, serve, target, "-u", "H1", "--ticks", "EURUSD")
    assert started == [1]  # the request waited in the directory of the relay that was ended
    assert result.code == 0, result.err
    assert names(target) == FILES
    assert result.out.count("Geschrieben:") == 3


# --- disturbance 3: a relay is ended hard during a delivery --------------------------------------


def run_with_crash(
    root: Path, plan: CrashPlan, relay: str, crash_at: int | None, after: bool
) -> tuple[Outcome, Path, RealNetwork]:
    """One request while the relay ``relay`` is ended hard at its step ``crash_at``."""
    root.mkdir()
    net_root = root / "net"
    net_root.mkdir()
    network = RealNetwork(net_root)
    plan.crash_at, plan.after, plan.count = crash_at, after, 0
    network.plans[relay] = plan
    serve = ServeSide(network, archive())
    target = root / "received"
    try:
        result = ask(network, serve, target, "-u", "H1,M1", "--ticks", "EURUSD")
    finally:
        serve.close()
    return result, target, network


@pytest.mark.parametrize("relay", [RELAY_1, RELAY_2])
def test_3_every_file_arrives_once_whenever_a_relay_is_ended_hard_during_the_delivery(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, relay: str
) -> None:
    expected = [
        "EURUSD_CONTRACT_20260105_20260106.json",
        "EURUSD_H1_20260105_20260106.json",
        "EURUSD_M1_20260105_20260106.json",
        "EURUSD_TICKS_20260105_20260106.json",
    ]
    plan = CrashPlan()
    plan.install(monkeypatch)
    result, reference, network = run_with_crash(tmp_path / "reference", plan, relay, None, False)
    network.close()
    assert result.code == 0, result.err
    assert names(reference) == expected
    steps = plan.count
    assert steps > 10  # the relay changed something outside of its process many times
    failures: list[str] = []
    for after in (False, True):
        for crash_at in range(1, steps + 1):
            root = tmp_path / f"crash-{'after' if after else 'before'}-{crash_at}"
            result, target, network = run_with_crash(root, plan, relay, crash_at, after)
            try:
                problems = []
                if plan.crash_at is not None:
                    problems.append("the relay was not ended")
                if result.code != 0:
                    problems.append(f"exit code {result.code}: {result.err.strip()}")
                if names(target) != expected:
                    problems.append(f"files {names(target)}")
                if result.out.count("Geschrieben:") != len(expected):
                    problems.append(f"written {result.out.count('Geschrieben:')} times")
                for name in expected:
                    if (target / name).exists() and (target / name).read_bytes() != (
                        reference / name
                    ).read_bytes():
                        problems.append(f"{name} differs")
                if network.in_transit():
                    problems.append(f"in transit {network.in_transit()}")
                if problems:
                    failures.append(f"step {crash_at} {'after' if after else 'before'}: {problems}")
            finally:
                network.close()
    assert failures == []
