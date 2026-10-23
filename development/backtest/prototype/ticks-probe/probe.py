"""Measurements of two storage models for ticks in SQLite (one operation per process).

Variants: ``a`` one row per tick (table marketdata_tick of today, written by the function of the
library); ``b-raw`` / ``b-z`` / ``b-delta`` one row per series and clock hour (UTC) in the table
``marketdata_tickblock``: raw packed arrays, the same compressed with zlib level 1, or prices as
integers (scaled by the decimals of the data) and differences, compressed with zlib level 1.

Every subcommand prints one JSON line per measurement (see ``common.report``).
Run with the environment of ``packages/market-data``.
"""

import argparse
import os
import signal
import subprocess
import sys
import threading
import time
import zlib
from array import array
from bisect import bisect_left
from datetime import datetime
from itertools import accumulate
from operator import sub

import sqlalchemy as sa
from common import (
    HOUR_MS,
    CsvTickReader,
    Timer,
    ms_to_datetime,
    read_chunks,
    report,
)
from pipwerk_marketdata import tables
from pipwerk_marketdata.migrate import migrate_database
from pipwerk_marketdata.records import CompletenessRules, Interval, Tick
from pipwerk_marketdata.store import MarketDataStore
from pipwerk_marketdata.timeunits import TICKS

BROKER, INSTRUMENT, ZONE = "Broker", "DAX", "Europe/Athens"

blocks = sa.Table(
    "marketdata_tickblock",
    sa.MetaData(),
    sa.Column("series_id", sa.Integer(), nullable=False),
    sa.Column("block_start", sa.BigInteger(), nullable=False),  # ms since 1970 UTC, clock hour
    sa.Column("first_ms", sa.BigInteger(), nullable=False),
    sa.Column("last_ms", sa.BigInteger(), nullable=False),
    sa.Column("n", sa.Integer(), nullable=False),
    sa.Column("codec", sa.String(8), nullable=False),
    sa.Column("payload", sa.LargeBinary(), nullable=False),
    sa.PrimaryKeyConstraint("series_id", "block_start"),
)


class Cancelled(Exception):
    pass


def make_engine(path: str) -> sa.Engine:
    # as create_database_engine of pipwerk_replay.storage does for SQLite
    return sa.create_engine(
        f"sqlite:///{path}", connect_args={"check_same_thread": False, "timeout": 30}
    )


def ms_utc(text: str) -> int:
    return int(datetime.fromisoformat(text).timestamp() * 1000)


def series_id(connection: sa.Connection, create: bool) -> int | None:
    return MarketDataStore._series_id(connection, BROKER, INSTRUMENT, TICKS, create)


# --- codecs of variant b -------------------------------------------------------------------


def _digits(values: array) -> int:
    best = 0
    for value in values[:64]:
        text = repr(value)
        if "e" in text:
            return -1
        best = max(best, len(text.split(".")[1].rstrip("0")) if "." in text else 0)
    return best


def encode_block(codec: str, start: int, ms: array, bid: array, ask: array) -> tuple[str, bytes]:
    if codec in ("raw", "z"):
        raw = (
            array("i", [m - start for m in ms]).tobytes() + bid.tobytes() + ask.tobytes()
        )
        return codec, zlib.compress(raw, 1) if codec == "z" else raw
    digits = max(_digits(bid), _digits(ask))
    if 0 <= digits <= 8:
        scale = 10**digits
        ints_bid = [round(v * scale) for v in bid]
        ints_ask = [round(v * scale) for v in ask]
        exact = all(i / scale == v for i, v in zip(ints_bid, bid, strict=True)) and all(
            i / scale == v for i, v in zip(ints_ask, ask, strict=True)
        )
        if exact:
            try:
                parts = [
                    array("i", [ms[0] - start, *map(sub, ms[1:], ms[:-1])]),
                    array("i", [ints_bid[0], *map(sub, ints_bid[1:], ints_bid[:-1])]),
                    array("i", [ints_ask[0], *map(sub, ints_ask[1:], ints_ask[:-1])]),
                ]
            except OverflowError:
                parts = []
            if parts:
                body = bytes([digits]) + b"".join(p.tobytes() for p in parts)
                return "delta", zlib.compress(body, 1)
    return encode_block("z", start, ms, bid, ask)


def decode_block(codec: str, start: int, n: int, payload: bytes) -> tuple[list, list, list]:
    if codec == "delta":
        body = zlib.decompress(payload)
        scale = 10 ** body[0]
        arrays = []
        for k in range(3):
            part: array = array("i")
            part.frombytes(body[1 + 4 * n * k : 1 + 4 * n * (k + 1)])
            arrays.append(list(accumulate(part)))
        return (
            [start + d for d in arrays[0]],
            [i / scale for i in arrays[1]],
            [i / scale for i in arrays[2]],
        )
    raw = zlib.decompress(payload) if codec == "z" else payload
    deltas: array = array("i")
    deltas.frombytes(raw[: 4 * n])
    bid: array = array("d")
    bid.frombytes(raw[4 * n : 12 * n])
    ask: array = array("d")
    ask.frombytes(raw[12 * n : 20 * n])
    return [start + d for d in deltas], list(bid), list(ask)


class BlockWriter:
    """Collects the ticks of a stream into blocks of one clock hour and writes each block once."""

    def __init__(self, connection: sa.Connection, sid: int, codec: str) -> None:
        self.connection, self.sid, self.codec = connection, sid, codec
        self.key: int | None = None
        self.first_key: int | None = None
        self.file_first: int | None = None
        self.file_last: int | None = None
        self.ms: array = array("q")
        self.bid: array = array("d")
        self.ask: array = array("d")
        self.written = 0

    def add(self, ms: array, bid: array, ask: array) -> None:
        i, n = 0, len(ms)
        if n and self.file_first is None:
            self.file_first = ms[0]
        while i < n:
            key = ms[i] // HOUR_MS
            if key != self.key:
                self.flush(final=False)
                self.key = key
                if self.first_key is None:
                    self.first_key = key
            j = bisect_left(ms, (key + 1) * HOUR_MS, i)
            self.ms.extend(ms[i:j])
            self.bid.extend(bid[i:j])
            self.ask.extend(ask[i:j])
            i = j
        if n:
            self.file_last = ms[-1]

    def flush(self, final: bool) -> None:
        if self.key is None or not len(self.ms):
            return
        start = self.key * HOUR_MS
        ms, bid, ask = self.ms, self.bid, self.ask
        if self.key == self.first_key or final:
            existing = self.connection.execute(
                sa.select(blocks.c.n, blocks.c.codec, blocks.c.payload).where(
                    blocks.c.series_id == self.sid, blocks.c.block_start == start
                )
            ).first()
            if existing is not None:
                old_ms, old_bid, old_ask = decode_block(existing.codec, start, *self._np(existing))
                keep = [
                    k
                    for k, m in enumerate(old_ms)
                    if (self.key == self.first_key and m < (self.file_first or 0))
                    or (final and m > (self.file_last or 0))
                ]
                merged = sorted(
                    [(old_ms[k], old_bid[k], old_ask[k]) for k in keep]
                    + list(zip(ms, bid, ask, strict=True))
                )
                ms = array("q", [t[0] for t in merged])
                bid = array("d", [t[1] for t in merged])
                ask = array("d", [t[2] for t in merged])
        codec, payload = encode_block(self.codec, start, ms, bid, ask)
        self.connection.execute(
            sa.delete(blocks).where(blocks.c.series_id == self.sid, blocks.c.block_start == start)
        )
        self.connection.execute(
            sa.insert(blocks).values(
                series_id=self.sid,
                block_start=start,
                first_ms=ms[0],
                last_ms=ms[-1],
                n=len(ms),
                codec=codec,
                payload=payload,
            )
        )
        self.written += len(ms)
        self.ms, self.bid, self.ask = array("q"), array("d"), array("d")

    @staticmethod
    def _np(row: sa.Row) -> tuple[int, bytes]:
        return row.n, row.payload


# --- operations ----------------------------------------------------------------------------


def op_init(args: argparse.Namespace) -> None:
    engine = make_engine(args.db)
    migrate_database(engine)
    if args.variant != "a":
        blocks.create(engine)
    report("init", db=args.db)


def _do_import(args: argparse.Namespace, cancel: threading.Event) -> dict:
    engine = make_engine(args.db)
    reader = CsvTickReader(ZONE)
    first_ms = last_ms = None
    checksum = [0, 0.0, 0.0]
    with engine.begin() as connection:
        sid = series_id(connection, True)
        assert sid is not None
        writer = BlockWriter(connection, sid, args.variant[2:]) if args.variant != "a" else None
        for data in read_chunks(args.file, args.chunk_mib << 20):
            if cancel.is_set():
                raise Cancelled
            ms, bid, ask = reader.feed(data)
            _store(connection, sid, writer, ms, bid, ask)
            if len(ms):
                first_ms = ms[0] if first_ms is None else first_ms
                last_ms = ms[-1]
            checksum[0] += len(ms)
            checksum[1] += sum(bid)
            checksum[2] += sum(ask)
        ms, bid, ask = reader.feed(b"", final=True)
        _store(connection, sid, writer, ms, bid, ask)
        if len(ms):
            first_ms = ms[0] if first_ms is None else first_ms
            last_ms = ms[-1]
        checksum[0] += len(ms)
        checksum[1] += sum(bid)
        checksum[2] += sum(ask)
        if writer is not None:
            writer.flush(final=True)
        if first_ms is not None and last_ms is not None:
            MarketDataStore._add_coverage(
                connection,
                sid,
                Interval(ms_to_datetime(first_ms), ms_to_datetime(last_ms + 1)),
            )
    return {
        "rows": reader.rows,
        "rejected": reader.rejected,
        "sum_bid": checksum[1],
        "sum_ask": checksum[2],
    }


def _store(connection, sid, writer, ms, bid, ask) -> None:  # noqa: ANN001
    if writer is not None:
        writer.add(ms, bid, ask)
        return
    ticks = [
        Tick(ms_to_datetime(m), b, a) for m, b, a in zip(ms, bid, ask, strict=True)
    ]
    MarketDataStore._insert_ticks(connection, sid, ticks)


def op_import(args: argparse.Namespace) -> None:
    cancel = threading.Event()
    marks: dict[str, float] = {}
    if args.cancel_after:

        def trigger() -> None:
            time.sleep(args.cancel_after)
            marks["set"] = time.perf_counter()
            cancel.set()

        threading.Thread(target=trigger, daemon=True).start()
    size = os.path.getsize(args.file)
    outcome: dict = {}
    cancelled = False
    with Timer() as timer:
        try:
            outcome = _do_import(args, cancel)
        except Cancelled:
            cancelled = True
    done = time.perf_counter()
    db_size = os.path.getsize(args.db) if os.path.exists(args.db) else 0
    values: dict = {
        "variant": args.variant,
        "file_bytes": size,
        "seconds": round(timer.seconds, 2),
        "cpu_seconds": round(timer.cpu_seconds, 2),
        "db_bytes": db_size,
        "journal_left": os.path.exists(args.db + "-journal"),
    }
    if cancelled:
        values["cancelled"] = True
        values["seconds_from_cancel_to_end"] = round(done - marks["set"], 3)
        values["state"] = state(args)
    else:
        values.update(outcome)
        values["rows_per_second"] = round(outcome["rows"] / timer.seconds)
        values["db_to_file"] = round(db_size / size, 3)
    report("import_cancel" if cancelled else "import", **values)


def state(args: argparse.Namespace) -> dict:
    engine = make_engine(args.db)
    with engine.connect() as connection:
        ticks = connection.execute(sa.select(sa.func.count()).select_from(tables.tick)).scalar()
        result = {"tick_rows": ticks}
        if args.variant != "a":
            result["block_rows"] = connection.execute(
                sa.select(sa.func.count()).select_from(blocks)
            ).scalar()
        result["coverage_rows"] = connection.execute(
            sa.select(sa.func.count()).select_from(tables.coverage)
        ).scalar()
        result["series_rows"] = connection.execute(
            sa.select(sa.func.count()).select_from(tables.series)
        ).scalar()
    return result


def op_state(args: argparse.Namespace) -> None:
    with Timer() as timer:
        found = state(args)
    check = {}
    if args.quick_check:
        engine = make_engine(args.db)
        with Timer() as quick, engine.connect() as connection:
            check["quick_check"] = connection.exec_driver_sql("PRAGMA quick_check").scalar()
        check["quick_check_seconds"] = round(quick.seconds, 2)
    report(
        "state",
        variant=args.variant,
        seconds=round(timer.seconds, 3),
        db_bytes=os.path.getsize(args.db),
        journal_present=os.path.exists(args.db + "-journal"),
        **found,
        **check,
    )


def op_kill(args: argparse.Namespace) -> None:
    """Start an import in another process, kill it with SIGKILL, open the database again."""
    command = [
        sys.executable,
        os.path.abspath(__file__),
        "import",
        "--variant",
        args.variant,
        "--db",
        args.db,
        "--file",
        args.file,
        "--chunk-mib",
        str(args.chunk_mib),
    ]
    process = subprocess.Popen(command, stdout=subprocess.DEVNULL)  # noqa: S603
    time.sleep(args.after)
    journal_before = os.path.exists(args.db + "-journal")
    size_before = os.path.getsize(args.db)
    process.send_signal(signal.SIGKILL)
    process.wait()
    journal_after_kill = os.path.exists(args.db + "-journal")
    with Timer() as timer:
        found = state(args)
    report(
        "kill",
        variant=args.variant,
        killed_after_seconds=args.after,
        db_bytes_at_kill=size_before,
        journal_before_kill=journal_before,
        journal_after_kill=journal_after_kill,
        seconds_to_open_and_count=round(timer.seconds, 2),
        db_bytes_after=os.path.getsize(args.db),
        journal_after_open=os.path.exists(args.db + "-journal"),
        **found,
    )


def op_slice(args: argparse.Namespace) -> None:
    """Copy the lines of the source whose date starts with PREFIX (server date) to a new file."""
    prefix = args.prefix.encode()
    count = 0
    with open(args.file, "rb") as source, open(args.out, "wb") as target:
        target.write(source.readline())
        for line in source:
            if line.startswith(prefix):
                target.write(line)
                count += 1
    report("slice", lines=count, out=args.out)


def op_delete(args: argparse.Namespace) -> None:
    start, end = ms_utc(args.start), ms_utc(args.end)
    engine = make_engine(args.db)
    with Timer() as timer, engine.begin() as connection:
        sid = series_id(connection, False)
        assert sid is not None
        if args.variant == "a":
            deleted = connection.execute(
                sa.delete(tables.tick).where(
                    tables.tick.c.series_id == sid,
                    tables.tick.c.moment >= ms_to_datetime(start),
                    tables.tick.c.moment < ms_to_datetime(end),
                )
            ).rowcount
        else:
            deleted = delete_blocks(connection, sid, start, end)
    report(
        "delete",
        variant=args.variant,
        what=args.what,
        seconds=round(timer.seconds, 2),
        deleted_ticks=deleted,
        db_bytes=os.path.getsize(args.db),
    )


def delete_blocks(connection: sa.Connection, sid: int, start: int, end: int) -> int:
    """Delete the ticks in [start, end): whole blocks by key, the edge blocks are rewritten."""
    codec_of: dict[str, str] = {}
    inside_from = -(-start // HOUR_MS) * HOUR_MS
    inside_to = end // HOUR_MS * HOUR_MS
    deleted = 0
    if inside_to > inside_from:
        condition = sa.and_(
            blocks.c.series_id == sid,
            blocks.c.block_start >= inside_from,
            blocks.c.block_start < inside_to,
        )
        deleted = connection.execute(sa.select(sa.func.sum(blocks.c.n)).where(condition)).scalar() or 0
        connection.execute(sa.delete(blocks).where(condition))
    edges = {start // HOUR_MS * HOUR_MS, (end - 1) // HOUR_MS * HOUR_MS} - set(
        range(inside_from, inside_to, HOUR_MS)
    )
    for key in sorted(edges):
        row = connection.execute(
            sa.select(blocks.c.n, blocks.c.codec, blocks.c.payload).where(
                blocks.c.series_id == sid, blocks.c.block_start == key
            )
        ).first()
        if row is None:
            continue
        ms, bid, ask = decode_block(row.codec, key, row.n, row.payload)
        kept = [(m, b, a) for m, b, a in zip(ms, bid, ask, strict=True) if not start <= m < end]
        deleted += row.n - len(kept)
        connection.execute(
            sa.delete(blocks).where(blocks.c.series_id == sid, blocks.c.block_start == key)
        )
        if kept:
            codec_of["c"] = row.codec
            new_codec, payload = encode_block(
                "raw" if row.codec == "raw" else ("z" if row.codec == "z" else "delta"),
                key,
                array("q", [t[0] for t in kept]),
                array("d", [t[1] for t in kept]),
                array("d", [t[2] for t in kept]),
            )
            connection.execute(
                sa.insert(blocks).values(
                    series_id=sid,
                    block_start=key,
                    first_ms=kept[0][0],
                    last_ms=kept[-1][0],
                    n=len(kept),
                    codec=new_codec,
                    payload=payload,
                )
            )
    return int(deleted)


def op_delete_series(args: argparse.Namespace) -> None:
    engine = make_engine(args.db)
    with Timer() as timer, engine.begin() as connection:
        sid = series_id(connection, False)
        assert sid is not None
        table = tables.tick if args.variant == "a" else blocks
        connection.execute(sa.delete(table).where(table.c.series_id == sid))
        connection.execute(sa.delete(tables.coverage).where(tables.coverage.c.series_id == sid))
        connection.execute(sa.delete(tables.series).where(tables.series.c.id == sid))
    report(
        "delete_series",
        variant=args.variant,
        seconds=round(timer.seconds, 2),
        db_bytes=os.path.getsize(args.db),
    )


def read_stream(engine: sa.Engine, variant: str, sid: int, start: int, end: int, as_ticks: bool):
    """Yield batches of (ms, bid, ask) lists (variant b) or single ticks (variant a)."""
    if variant == "a":
        statement = (
            sa.select(tables.tick.c.moment, tables.tick.c.bid, tables.tick.c.ask)
            .where(
                tables.tick.c.series_id == sid,
                tables.tick.c.moment >= ms_to_datetime(start),
                tables.tick.c.moment < ms_to_datetime(end),
            )
            .order_by(tables.tick.c.moment)
        )
        with engine.connect() as connection:
            result = connection.execution_options(yield_per=20_000).execute(statement)
            for row in result:
                yield Tick(row[0], row[1], row[2]) if as_ticks else row
        return
    statement = (
        sa.select(blocks.c.block_start, blocks.c.n, blocks.c.codec, blocks.c.payload)
        .where(
            blocks.c.series_id == sid,
            blocks.c.block_start >= start // HOUR_MS * HOUR_MS,
            blocks.c.block_start < end,
        )
        .order_by(blocks.c.block_start)
    )
    with engine.connect() as connection:
        result = connection.execution_options(yield_per=8).execute(statement)
        for row in result:
            ms, bid, ask = decode_block(row.codec, row.block_start, row.n, row.payload)
            lo, hi = bisect_left(ms, start), bisect_left(ms, end)
            if lo != 0 or hi != len(ms):
                ms, bid, ask = ms[lo:hi], bid[lo:hi], ask[lo:hi]
            if as_ticks:
                for m, b, a in zip(ms, bid, ask, strict=True):
                    yield Tick(ms_to_datetime(m), b, a)
            else:
                yield from zip(ms, bid, ask, strict=True)


def op_read(args: argparse.Namespace) -> None:
    start, end = ms_utc(args.start), ms_utc(args.end)
    engine = make_engine(args.db)
    count, sum_bid, sum_ask = 0, 0.0, 0.0
    ordered = True
    with engine.connect() as connection:
        sid = series_id(connection, False)
    assert sid is not None
    previous = -1
    with Timer() as timer:
        for item in read_stream(engine, args.variant, sid, start, end, args.as_ticks):
            if args.as_ticks:
                moment, bid, ask = item.time, item.bid, item.ask
                stamp = moment.microsecond
            else:
                moment, bid, ask = item[0], item[1], item[2]
                stamp = moment if args.variant != "a" else moment.microsecond
            count += 1
            sum_bid += bid
            sum_ask += ask
            if args.variant != "a" and not args.as_ticks:
                ordered &= stamp > previous
                previous = stamp
    report(
        "read",
        variant=args.variant,
        what=args.what,
        as_ticks=args.as_ticks,
        ticks=count,
        seconds=round(timer.seconds, 2),
        ticks_per_second=round(count / timer.seconds) if timer.seconds else 0,
        sum_bid=sum_bid,
        sum_ask=sum_ask,
        ordered=ordered if args.variant != "a" and not args.as_ticks else None,
    )


def op_gaps(args: argparse.Namespace) -> None:
    from pipwerk_marketdata.completeness import combine, tick_gaps  # noqa: PLC0415

    start, end = ms_utc(args.start), ms_utc(args.end)
    engine = make_engine(args.db)
    store = MarketDataStore(engine)
    request = Interval(ms_to_datetime(start), ms_to_datetime(end))
    with Timer() as timer:
        if args.variant == "a":
            result = store.completeness(BROKER, INSTRUMENT, TICKS, request.start, request.end)
            missing = [(m.start, m.end, m.reason.value) for m in result.missing]
            covered = len(result.present)
        else:
            rules = CompletenessRules()
            with engine.connect() as connection:
                sid = series_id(connection, False)
                assert sid is not None
                cov = store._coverage(connection, sid)
                rows = connection.execute(
                    sa.select(blocks.c.first_ms, blocks.c.last_ms)
                    .where(blocks.c.series_id == sid)
                    .order_by(blocks.c.block_start)
                ).yield_per(10_000)

                def moments():
                    for first, last in rows:
                        yield ms_to_datetime(first)
                        yield ms_to_datetime(last)

                gaps = []
                for part in cov:
                    window = Interval(max(part.start, request.start), min(part.end, request.end))
                    if window.start < window.end:
                        gaps.extend(tick_gaps(moments(), window, None, rules))
                present, missing_parts = combine(request, cov, gaps, None, rules)
            missing = [(m.start, m.end, m.reason.value) for m in missing_parts]
            covered = len(present)
    report(
        "gaps",
        variant=args.variant,
        seconds=round(timer.seconds, 2),
        present_parts=covered,
        missing_parts=len(missing),
        missing_digest=hash_digest(missing),
        first_missing=[(a.isoformat(), b.isoformat(), c) for a, b, c in missing[:3]],
    )


def hash_digest(items: list) -> str:
    import hashlib  # noqa: PLC0415

    return hashlib.sha256(repr(items).encode()).hexdigest()[:16]


def op_parse(args: argparse.Namespace) -> None:
    """Parse only (no database): the speed of the reader and its memory."""
    reader = CsvTickReader(ZONE)
    total = 0
    with Timer() as timer:
        for data in read_chunks(args.file, args.chunk_mib << 20):
            total += len(reader.feed(data)[0])
        total += len(reader.feed(b"", final=True)[0])
    report(
        "parse_only",
        rows=total,
        rejected=reader.rejected,
        seconds=round(timer.seconds, 2),
        rows_per_second=round(total / timer.seconds),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    sub_ = parser.add_subparsers(dest="command", required=True)

    def add(name: str, function, *options: str) -> argparse.ArgumentParser:  # noqa: ANN001
        p = sub_.add_parser(name)
        p.set_defaults(function=function)
        p.add_argument("--variant", default="a", choices=["a", "b-raw", "b-z", "b-delta"])
        p.add_argument("--db")
        p.add_argument("--file")
        p.add_argument("--chunk-mib", type=int, default=16)
        for option in options:
            p.add_argument(option)
        return p

    add("init", op_init)
    add("parse", op_parse)
    p = add("import", op_import)
    p.add_argument("--cancel-after", type=float, default=0)
    p = add("state", op_state)
    p.add_argument("--quick-check", action="store_true")
    p = add("kill", op_kill)
    p.add_argument("--after", type=float, required=True)
    p = add("slice", op_slice, "--out", "--prefix")
    p = add("delete", op_delete, "--start", "--end", "--what")
    add("delete-series", op_delete_series)
    p = add("read", op_read, "--start", "--end", "--what")
    p.add_argument("--as-ticks", action="store_true")
    add("gaps", op_gaps, "--start", "--end")
    args = parser.parse_args()
    args.function(args)


if __name__ == "__main__":
    main()
