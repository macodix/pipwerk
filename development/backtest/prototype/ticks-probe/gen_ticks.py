"""Writes a tick file in the CSV export format of MetaTrader 5 (server time, milliseconds).

Header ``<DATE>\\t<TIME>\\t<BID>\\t<ASK>\\t<LAST>\\t<VOLUME>\\t<FLAGS>``. Like MetaTrader 5, a row leaves
BID or ASK empty when only the other price changed. Monday to Friday of the server time only
(weekends are pauses), a few holidays without ticks, and a three-hour outage on every 100th
day. The prices are in hundredths so that the text is exact. Deterministic for a given seed.

Usage: python gen_ticks.py OUTFILE ROWS [--start 2023-01-02] [--weeks 104] [--seed 1]
"""

import argparse
import math
import os
import random
import shutil
import sys
from datetime import date, timedelta
from multiprocessing import Pool

HEADER = "<DATE>\t<TIME>\t<BID>\t<ASK>\t<LAST>\t<VOLUME>\t<FLAGS>\n"
HOLIDAYS = {
    date(2023, 1, 2),
    date(2023, 4, 7),
    date(2023, 12, 25),
    date(2024, 1, 1),
    date(2024, 3, 29),
    date(2024, 12, 25),
}
PROFILE = [0.3, 0.2, 0.3, 0.6, 0.9, 1.1, 1.3, 1.6, 1.9, 1.9, 1.7, 1.5, 1.4, 1.5, 1.8, 1.9, 1.6, 1.3, 1.0, 0.8, 0.6, 0.5, 0.4, 0.3]
_SECONDS = ["%02d:%02d:%02d" % (s // 3600, s // 60 % 60, s % 60) for s in range(86400)]
_MILLIS = [".%03d" % m for m in range(1000)]
_VOLUMES = [str(v) for v in range(1, 500)]


def trading_days(start: date, weeks: int) -> list[date]:
    days = []
    for offset in range(weeks * 7):
        day = start + timedelta(days=offset)
        if day.weekday() < 5 and day not in HOLIDAYS:
            days.append(day)
    return days


def _price(cache: dict[int, str], value: int) -> str:
    text = cache.get(value)
    if text is None:
        text = "%d.%02d" % divmod(value, 100)
        cache[value] = text
    return text


def make_day(day: date, index: int, rows: int, rng: random.Random, cache: dict[int, str]) -> str:
    factor = sum(PROFILE) / 24
    base_gap = 86_400_000 / rows
    means = [base_gap * factor / weight for weight in PROFILE]
    outage = index % 100 == 7
    bid = 1_800_000 + int(20_000 * math.sin(day.toordinal() / 40))
    ask = bid + 50
    out: list[str] = []
    prefix = day.strftime("%Y.%m.%d") + "\t"
    moment = 0
    expo = rng.expovariate
    rand = rng.random
    randrange = rng.randrange
    while True:
        moment += 1 + int(expo(1.0 / means[moment // 3_600_000]))
        if moment >= 86_400_000:
            break
        if outage and 36_000_000 <= moment < 48_600_000:
            moment = 48_600_000
        choice = rand()
        if choice < 0.5:
            bid += randrange(-3, 4)
            ask += randrange(-3, 4)
            flags = 6
        elif choice < 0.75:
            bid += randrange(-3, 4)
            flags = 2
        else:
            ask += randrange(-3, 4)
            flags = 4
        if ask <= bid:
            ask = bid + 1
        sec, milli = divmod(moment, 1000)
        bid_text = _price(cache, bid) if flags & 2 else ""
        ask_text = _price(cache, ask) if flags & 4 else ""
        out.append(
            "%s%s%s\t%s\t%s\t%s\t%s\t%d\n"
            % (
                prefix,
                _SECONDS[sec],
                _MILLIS[milli],
                bid_text,
                ask_text,
                _price(cache, (bid + ask) // 2),
                _VOLUMES[randrange(0, 499)],
                flags + 24,
            )
        )
    return "".join(out)


def work(job: tuple[int, list[tuple[int, date]], int, int, str]) -> str:
    number, days, rows_per_day, seed, part = job
    rng = random.Random(seed * 1000 + number)
    cache: dict[int, str] = {}
    with open(part, "w", newline="", encoding="ascii", buffering=1 << 20) as handle:
        for index, day in days:
            handle.write(make_day(day, index, rows_per_day, rng, cache))
    return part


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("outfile")
    parser.add_argument("rows", type=int)
    parser.add_argument("--start", default="2023-01-02")
    parser.add_argument("--weeks", type=int, default=104)
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--processes", type=int, default=5)
    args = parser.parse_args()
    days = list(enumerate(trading_days(date.fromisoformat(args.start), args.weeks)))
    rows_per_day = args.rows // len(days)
    size = math.ceil(len(days) / (args.processes * 4))
    jobs = [
        (n, days[i : i + size], rows_per_day, args.seed, f"{args.outfile}.part{n:04d}")
        for n, i in enumerate(range(0, len(days), size))
    ]
    with Pool(args.processes) as pool:
        parts = pool.map(work, jobs)
    with open(args.outfile, "w", newline="", encoding="ascii") as target:
        target.write(HEADER)
        for part in parts:
            with open(part, encoding="ascii", newline="") as source:
                shutil.copyfileobj(source, target, 1 << 24)
            os.remove(part)
    print(f"days={len(days)} rows_per_day={rows_per_day} bytes={os.path.getsize(args.outfile)}")


if __name__ == "__main__":
    sys.exit(main())
