"""Shared by the probes: a streaming reader of the CSV export of MetaTrader 5 and measuring aids.

``CsvTickReader.feed(bytes)`` takes any piece of a file and returns the ticks of the complete
lines in it as three arrays (UTC milliseconds, bid, ask); an incomplete last line is kept for the
next piece. Rules (same as the library where the library has one): server time to UTC with an
IANA zone (a local time that does not exist is rejected, an ambiguous one is the earlier),
moments from 1970 to before 2100, prices greater than zero, moments strictly ascending (a
duplicate or earlier moment is rejected). Different from the library: an empty BID or ASK is the
value of the previous tick (meaning of MetaTrader 5); times are whole milliseconds.
"""

import json
import resource
import sys
import time
from array import array
from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

MAX_MS = int(datetime(2100, 1, 1, tzinfo=UTC).timestamp() * 1000)
EPOCH = datetime(1970, 1, 1, tzinfo=UTC)
HOUR_MS = 3_600_000
HEADER = b"<DATE>\t<TIME>\t<BID>\t<ASK>"


def peak_mib() -> float:
    """Highest resident memory of this process so far, in MiB."""
    return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024


class Timer:
    def __enter__(self) -> "Timer":
        self.start = time.perf_counter()
        self.cpu = time.process_time()
        return self

    def __exit__(self, *exc: object) -> None:
        self.seconds = time.perf_counter() - self.start
        self.cpu_seconds = time.process_time() - self.cpu


def report(name: str, **values: object) -> None:
    """One line of JSON per measurement; the driver collects them."""
    print(json.dumps({"op": name, "peak_mib": round(peak_mib(), 1), **values}), flush=True)


class CsvTickReader:
    def __init__(self, zone_name: str) -> None:
        self.zone = ZoneInfo(zone_name)
        self.rest = b""
        self.header_seen = False
        self.last_ms = -1
        self.bid = 0.0
        self.ask = 0.0
        self.have_prices = False
        self.rejected: dict[str, int] = {}
        self.rows = 0
        self._day: dict[bytes, int] = {}
        self._second: dict[bytes, int] = {}
        self._offset: dict[int, int | None] = {}

    def _reject(self, reason: str) -> None:
        self.rejected[reason] = self.rejected.get(reason, 0) + 1

    def _hour_offset(self, local_ms: int) -> int | None:
        """Offset of the server time from UTC (ms) for the clock hour of ``local_ms``, or None if
        the hour is special (clock changes, ambiguous or missing times): then per row."""
        key = local_ms // HOUR_MS
        if key in self._offset:
            return self._offset[key]
        first = self._local_to_utc_ms(key * HOUR_MS)
        last = self._local_to_utc_ms(key * HOUR_MS + HOUR_MS - 1)
        offset: int | None = None
        if first is not None and last is not None:
            a = key * HOUR_MS - first
            b = key * HOUR_MS + HOUR_MS - 1 - last
            if a == b:
                offset = a
        self._offset[key] = offset
        return offset

    def _local_to_utc_ms(self, local_ms: int) -> int | None:
        """The rule of the library (``csvimport.local_to_utc``) on milliseconds."""
        local = datetime.fromtimestamp(local_ms // 1000, UTC).replace(tzinfo=None)
        aware = local.replace(tzinfo=self.zone, fold=0)
        utc = aware.astimezone(UTC)
        if utc.astimezone(self.zone).replace(tzinfo=None) != local:
            return None
        return int(utc.timestamp()) * 1000 + local_ms % 1000

    def feed(self, data: bytes, final: bool = False) -> tuple[array, array, array]:
        ms_out: array = array("q")
        bid_out: array = array("d")
        ask_out: array = array("d")
        data = self.rest + data
        lines = data.split(b"\n")
        self.rest = b"" if final else lines.pop()
        day_cache, second_cache = self._day, self._second
        last_ms, bid, ask, have = self.last_ms, self.bid, self.ask, self.have_prices
        rejected_here = 0
        for line in lines:
            parts = line.split(b"\t", 4)
            if len(parts) < 4:
                if line.strip():
                    self._reject("columns_mismatch")
                continue
            date_text, time_text, bid_text, ask_text = parts[0], parts[1], parts[2], parts[3]
            if not self.header_seen:
                self.header_seen = True
                if line.startswith(HEADER):
                    continue
            base = day_cache.get(date_text)
            if base is None:
                try:
                    y, m, d = date_text.split(b".")
                    base = date(int(y), int(m), int(d)).toordinal() - 719163
                except ValueError:
                    self._reject("time_invalid")
                    continue
                base *= 86_400_000
                day_cache[date_text] = base
            clock = time_text[:8]
            second = second_cache.get(clock)
            if second is None:
                try:
                    h, mi, s = clock.split(b":")
                    second = (int(h) * 3600 + int(mi) * 60 + int(s)) * 1000
                except ValueError:
                    self._reject("time_invalid")
                    continue
                second_cache[clock] = second
            fraction = time_text[9:]
            if len(fraction) == 3:
                local_ms = base + second + int(fraction)
            elif not fraction and len(time_text) == 8:
                local_ms = base + second
            else:
                self._reject("time_invalid")
                continue
            offset = self._hour_offset(local_ms)
            if offset is None:
                utc_ms = self._local_to_utc_ms(local_ms)
                if utc_ms is None:
                    self._reject("local_time_not_existing")
                    continue
            else:
                utc_ms = local_ms - offset
            if not 0 <= utc_ms < MAX_MS:
                self._reject("time_out_of_range")
                continue
            try:
                new_bid = float(bid_text) if bid_text else bid
                new_ask = float(ask_text) if ask_text else ask
            except ValueError:
                self._reject("value_invalid")
                continue
            if not have and not (bid_text and ask_text):
                self._reject("field_missing")
                continue
            if not (0 < new_bid < 1e300 and 0 < new_ask < 1e300):
                self._reject("price_not_positive")
                continue
            if utc_ms <= last_ms:
                self._reject("time_duplicate" if utc_ms == last_ms else "time_not_ascending")
                continue
            have = True
            bid, ask, last_ms = new_bid, new_ask, utc_ms
            ms_out.append(utc_ms)
            bid_out.append(bid)
            ask_out.append(ask)
        self.last_ms, self.bid, self.ask, self.have_prices = last_ms, bid, ask, have
        self.rows += len(ms_out)
        del rejected_here
        return ms_out, bid_out, ask_out


def read_chunks(path: str, size: int):
    with open(path, "rb") as handle:
        while True:
            data = handle.read(size)
            if not data:
                return
            yield data


def ms_to_datetime(ms: int) -> datetime:
    return datetime.fromtimestamp(ms // 1000, UTC).replace(microsecond=ms % 1000 * 1000)


if __name__ == "__main__":
    sys.exit("library module")
