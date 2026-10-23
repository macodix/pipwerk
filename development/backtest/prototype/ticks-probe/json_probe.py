"""Item 4a: tick files in JSON (ticks.schema.json) read as a stream.

Subcommands
  gen      write a JSON tick file from the ticks of a CSV file (same ticks, UTC, header first)
  import   stream a JSON file into the block store (variant b-delta) with ``--parser``:
             stdlib  json.JSONDecoder.raw_decode on a text buffer, one array element at a time
             ijson   ijson.items(..., "ticks.item") (new dependency, C backend if present)
  parse    the same without a database
  today    the function of the library of today (``MarketDataStore.import_json``) on a file
Run with the environment of packages/market-data; ``--parser ijson`` needs ijson in that
environment (the run script of this directory uses a separate environment for it).
"""

import argparse
import codecs
import json
import os
import re
import sys
from array import array
from datetime import UTC, datetime

import sqlalchemy as sa
from common import MAX_MS, CsvTickReader, Timer, ms_to_datetime, read_chunks, report
from probe import BROKER, INSTRUMENT, ZONE, BlockWriter, blocks, make_engine, series_id
from pipwerk_marketdata.migrate import migrate_database
from pipwerk_marketdata.records import Interval
from pipwerk_marketdata.store import MarketDataStore

_DAYS = [datetime.fromtimestamp(d * 86400, UTC).strftime("%Y-%m-%d") for d in range(0, 40000)]
_SECONDS = ["%02d:%02d:%02d" % (s // 3600, s // 60 % 60, s % 60) for s in range(86400)]
_MILLIS = [".%03dZ" % m for m in range(1000)]


def op_gen(args: argparse.Namespace) -> None:
    reader = CsvTickReader(ZONE)
    until = int(datetime.fromisoformat(args.until).timestamp() * 1000)
    first = last = None
    count, sum_bid, sum_ask = 0, 0.0, 0.0
    with open(args.out, "w", encoding="ascii", newline="\n", buffering=1 << 22) as out:
        out.write(
            '{\n  "version": 1,\n  "kind": "ticks",\n'
            f'  "broker": "{BROKER}",\n  "instrument": "{INSTRUMENT}",\n'
            f'  "period": {{"start": "{args.period_start}", "end": "{args.until}"}},\n'
            '  "ticks": [\n'
        )
        done = False
        for data in read_chunks(args.file, 16 << 20):
            ms, bid, ask = reader.feed(data)
            lines = []
            for m, b, a in zip(ms, bid, ask, strict=True):
                if m >= until or (args.max_ticks and count >= args.max_ticks):
                    done = True
                    break
                day, rest = divmod(m, 86_400_000)
                sec, milli = divmod(rest, 1000)
                lines.append(
                    f'    {{"time": "{_DAYS[day]}T{_SECONDS[sec]}{_MILLIS[milli]}", '
                    f'"bid": {b!r}, "ask": {a!r}}},\n'
                )
                if first is None:
                    first = m
                last = m
                count += 1
                sum_bid += b
                sum_ask += a
            out.write("".join(lines))
            if done:
                break
        # the last element has no comma: rewrite it
        out.flush()
    with open(args.out, "rb+") as handle:
        handle.seek(-2, os.SEEK_END)
        handle.write(b"\n")
        handle.truncate()
        handle.write(b"  ]\n}\n")
    report(
        "gen_json",
        out=args.out,
        bytes=os.path.getsize(args.out),
        ticks=count,
        sum_bid=sum_bid,
        sum_ask=sum_ask,
        last=ms_to_datetime(last).isoformat() if last else None,
    )


# --- stream readers ------------------------------------------------------------------------

_SKIP = re.compile(r"[ \t\n\r,]*")
_MAX_ELEMENT = 1 << 20  # an element or header value larger than this is refused


class JsonFormatError(Exception):
    pass


def stdlib_stream(path: str, chunk: int):
    """Yield ("header", key, value) for top-level members other than ticks, and ("ticks",
    [dict, ...]) with up to 50 000 elements. Only the standard library. Any order of members
    is read; a member after ``ticks`` is yielded after the ticks."""
    decode = json.JSONDecoder().raw_decode
    decoder = codecs.getincrementaldecoder("utf-8-sig")()
    buf, pos = "", 0
    state = "start"  # start, key, array, after
    pending_key = None
    batch: list = []
    eof = False
    file = open(path, "rb")  # noqa: SIM115
    try:
        while True:
            progressed = True
            while progressed:
                progressed = False
                pos = _SKIP.match(buf, pos).end()
                if pos >= len(buf):
                    break
                char = buf[pos]
                if state == "start":
                    if char != "{":
                        raise JsonFormatError("no object")
                    pos += 1
                    state = "key"
                    progressed = True
                elif state == "key":
                    if char == "}":
                        pos += 1
                        state = "end"
                        progressed = True
                        continue
                    try:
                        key, end = decode(buf, pos)
                    except json.JSONDecodeError:
                        break
                    colon = _SKIP.match(buf, end).end()
                    if colon >= len(buf):
                        break
                    if buf[colon] != ":":
                        raise JsonFormatError("no colon")
                    after = _SKIP.match(buf, colon + 1).end()
                    if after >= len(buf):
                        break
                    if key == "ticks":
                        if buf[after] != "[":
                            raise JsonFormatError("ticks is not an array")
                        pos = after + 1
                        state = "array"
                    else:
                        try:
                            value, end = decode(buf, after)
                        except json.JSONDecodeError:
                            if len(buf) - after > _MAX_ELEMENT:
                                raise JsonFormatError("value too large") from None
                            break
                        pos = end
                        yield ("header", key, value)
                    progressed = True
                elif state == "array":
                    if char == "]":
                        pos += 1
                        if batch:
                            yield ("ticks", batch)
                            batch = []
                        state = "key"
                        progressed = True
                        continue
                    try:
                        element, end = decode(buf, pos)
                    except json.JSONDecodeError:
                        if len(buf) - pos > _MAX_ELEMENT:
                            raise JsonFormatError("element too large") from None
                        break
                    pos = end
                    batch.append(element)
                    if len(batch) >= 50_000:
                        yield ("ticks", batch)
                        batch = []
                    progressed = True
                else:  # end
                    raise JsonFormatError("data after the object")
            if eof:
                break
            data = file.read(chunk)
            if not data:
                eof = True
                buf = buf[pos:] + decoder.decode(b"", final=True)
                pos = 0
                if state != "end" and _SKIP.match(buf, 0).end() < len(buf):
                    raise JsonFormatError("incomplete")
                break
            buf = buf[pos:] + decoder.decode(data)
            pos = 0
        if state != "end":
            raise JsonFormatError("incomplete")
    finally:
        file.close()
    del pending_key


def ijson_stream(path: str, chunk: int):
    """Same output with ijson. The members before ``ticks`` are read from the head of the file
    (event parser, stops at the start of the array); the array is read with ``items``."""
    import ijson  # noqa: PLC0415

    with open(path, "rb") as head_file:
        head = head_file.read(1 << 16)
    members: dict = {}
    try:
        for prefix, event, value in ijson.parse(head, use_float=True):
            if prefix == "ticks" and event == "start_array":
                break
            if event in ("string", "number", "boolean", "null"):
                members[prefix] = value  # for example "broker" or "period.start"
    except ijson.IncompleteJSONError:
        pass
    for key, value in members.items():
        yield ("header", key, value)
    batch: list = []
    with open(path, "rb") as handle:
        for element in ijson.items(handle, "ticks.item", use_float=True, buf_size=chunk):
            batch.append(element)
            if len(batch) >= 50_000:
                yield ("ticks", batch)
                batch = []
    if batch:
        yield ("ticks", batch)


class TickConverter:
    """Dict elements of the schema to arrays; the rules of the CSV reader for the moments."""

    def __init__(self) -> None:
        self.last = -1
        self.rejected: dict[str, int] = {}
        self.rows = 0
        self._day: dict[str, int] = {}
        self._second: dict[str, int] = {}

    def _reject(self, reason: str) -> None:
        self.rejected[reason] = self.rejected.get(reason, 0) + 1

    def convert(self, batch: list) -> tuple[array, array, array]:
        from pipwerk_marketdata.jsonimport import parse_moment  # noqa: PLC0415

        ms_out, bid_out, ask_out = array("q"), array("d"), array("d")
        last = self.last
        day_cache, sec_cache = self._day, self._second
        for element in batch:
            try:
                text, bid, ask = element["time"], element["bid"], element["ask"]
            except (KeyError, TypeError):
                self._reject("field_missing")
                continue
            if len(element) != 3:
                self._reject("document_invalid")
                continue
            if len(text) == 24 and text[10] == "T" and text[19] == "." and text[23] == "Z":
                base = day_cache.get(text[:10])
                if base is None:
                    base = int(datetime.fromisoformat(text[:10]).replace(tzinfo=UTC).timestamp())
                    base *= 1000
                    day_cache[text[:10]] = base
                second = sec_cache.get(text[11:19])
                if second is None:
                    h, m, s = text[11:19].split(":")
                    second = (int(h) * 3600 + int(m) * 60 + int(s)) * 1000
                    sec_cache[text[11:19]] = second
                moment = base + second + int(text[20:23])
            else:
                parsed = parse_moment(text) if isinstance(text, str) else None
                if parsed is None:
                    self._reject("time_invalid")
                    continue
                moment = int(parsed.timestamp() * 1_000_000) // 1000
            if not 0 <= moment < MAX_MS:
                self._reject("time_out_of_range")
                continue
            if not (bid > 0 and ask > 0):
                self._reject("price_not_positive")
                continue
            if moment <= last:
                self._reject("time_duplicate" if moment == last else "time_not_ascending")
                continue
            last = moment
            ms_out.append(moment)
            bid_out.append(float(bid))
            ask_out.append(float(ask))
        self.last = last
        self.rows += len(ms_out)
        return ms_out, bid_out, ask_out


def run_stream(args: argparse.Namespace, store: bool) -> dict:
    if not store:
        return _stream(args, None)
    with make_engine(args.db).begin() as connection:
        return _stream(args, connection)


def _stream(args: argparse.Namespace, connection: sa.Connection | None) -> dict:
    stream = (ijson_stream if args.parser == "ijson" else stdlib_stream)(
        args.file, args.chunk_mib << 20
    )
    converter = TickConverter()
    header: dict = {}
    sums = [0.0, 0.0]
    first_ms = last_ms = None
    writer = None
    sid = None
    if connection is not None:
        sid = series_id(connection, True)
        assert sid is not None
        writer = BlockWriter(connection, sid, "delta")
    for item in stream:
        if item[0] == "header":
            header[item[1]] = item[2]
            continue
        ms, bid, ask = converter.convert(item[1])
        sums[0] += sum(bid)
        sums[1] += sum(ask)
        if len(ms):
            first_ms = ms[0] if first_ms is None else first_ms
            last_ms = ms[-1]
        if writer is not None:
            writer.add(ms, bid, ask)
    if writer is not None and connection is not None and sid is not None:
        writer.flush(final=True)
        if first_ms is not None and last_ms is not None:
            MarketDataStore._add_coverage(
                connection, sid, Interval(ms_to_datetime(first_ms), ms_to_datetime(last_ms + 1))
            )
    return {
        "rows": converter.rows,
        "rejected": converter.rejected,
        "sum_bid": sums[0],
        "sum_ask": sums[1],
        "header_keys": sorted(header),
    }


def op_import(args: argparse.Namespace, store: bool = True) -> None:
    if store:
        engine = make_engine(args.db)
        migrate_database(engine)
        blocks.create(engine, checkfirst=True)
    size = os.path.getsize(args.file)
    with Timer() as timer:
        outcome = run_stream(args, store)
    extra = {}
    if store:
        extra = {
            "db_bytes": os.path.getsize(args.db),
            "db_to_file": round(os.path.getsize(args.db) / size, 3),
        }
    try:
        import ijson  # noqa: PLC0415

        backend = ijson.backend
    except ImportError:
        backend = None
    report(
        "json_import" if store else "json_parse",
        parser=args.parser,
        ijson_backend=backend if args.parser == "ijson" else None,
        file_bytes=size,
        seconds=round(timer.seconds, 2),
        rows_per_second=round(outcome["rows"] / timer.seconds),
        **outcome,
        **extra,
    )


def op_today(args: argparse.Namespace) -> None:
    from pipwerk_marketdata.limits import ImportLimits  # noqa: PLC0415

    engine = sa.create_engine("sqlite://")
    migrate_database(engine)
    store = MarketDataStore(engine)
    with open(args.file, "rb") as handle:
        data = handle.read()
    limits = ImportLimits(max_bytes=len(data) + 1, max_rows=10**9)
    with Timer() as timer:
        result = store.import_json(data, limits)
    report(
        "json_today",
        file_bytes=len(data),
        accepted=result.accepted,
        seconds=round(timer.seconds, 2),
        rows_per_second=round(result.accepted / timer.seconds),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("gen")
    p.add_argument("--file", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--until", required=True, help="ISO moment, ticks from it on are left out")
    p.add_argument("--period-start", default="2023-01-01T00:00:00Z")
    p.add_argument("--max-ticks", type=int, default=0)
    p.set_defaults(function=op_gen)
    for name in ("import", "parse"):
        p = sub.add_parser(name)
        p.add_argument("--file", required=True)
        p.add_argument("--db")
        p.add_argument("--parser", choices=["stdlib", "ijson"], default="stdlib")
        p.add_argument("--chunk-mib", type=int, default=16)
        p.set_defaults(function=(op_import if name == "import" else lambda a: op_import(a, False)))
    p = sub.add_parser("today")
    p.add_argument("--file", required=True)
    p.set_defaults(function=op_today)
    args = parser.parse_args()
    args.function(args)


if __name__ == "__main__":
    sys.exit(main())
