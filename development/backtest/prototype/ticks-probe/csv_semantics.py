"""How the CSV import of today treats an MT5 tick file: empty prices, same millisecond, speed.

Usage: python csv_semantics.py [FILE_WITH_ROWS_FROM_GENERATOR]
Needs the package pipwerk_marketdata (run with the environment of packages/market-data).
"""

import sys

from common import Timer, report
from pipwerk_marketdata.csvimport import CsvSeries, parse_csv
from pipwerk_marketdata.limits import ImportLimits

SERIES = CsvSeries("ticks", "Broker", "DAX", None, "Europe/Athens")
SAMPLE = (
    "<DATE>\t<TIME>\t<BID>\t<ASK>\t<LAST>\t<VOLUME>\t<FLAGS>\n"
    "2024.01.02\t10:00:00.100\t100.10\t100.20\t\t\t6\n"
    "2024.01.02\t10:00:00.200\t100.11\t\t\t\t2\n"  # only bid changed, ask empty
    "2024.01.02\t10:00:00.300\t\t100.22\t\t\t4\n"  # only ask changed, bid empty
    "2024.01.02\t10:00:00.300\t100.12\t100.23\t\t\t6\n"  # same millisecond as the row before
    "2024.01.02\t10:00:00.400\t100.13\t100.24\t\t\t6\n"
)


def main() -> None:
    parsed = parse_csv(SAMPLE.encode(), SERIES)
    report(
        "csv_semantics",
        accepted=[(t.time.isoformat(), t.bid, t.ask) for t in parsed.ticks],
        rejected=[(r.row, r.reason.value) for r in parsed.rejected],
    )
    if len(sys.argv) > 1:
        # speed of the parser of today on a slice at the limit of 500 000 rows
        with open(sys.argv[1], "rb") as handle:
            lines = [handle.readline() for _ in range(500_001)]
        data = b"".join(lines)
        limits = ImportLimits(max_bytes=len(data) + 1, max_rows=500_000)
        with Timer() as timer:
            parsed = parse_csv(data, SERIES, limits)
        report(
            "parse_csv_today",
            rows=500_000,
            accepted=len(parsed.ticks),
            rejected=parsed.rejected_count,
            seconds=round(timer.seconds, 2),
            rows_per_second=round(500_000 / timer.seconds),
        )


if __name__ == "__main__":
    main()
