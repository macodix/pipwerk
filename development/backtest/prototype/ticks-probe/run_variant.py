"""Runs the whole series of measurements for one variant on one file (one process per step).

Usage: python run_variant.py VARIANT CSVFILE DATADIR LABEL [--cancel-after S] [--kill-after S]
Results (JSON lines) go to DATADIR/results-LABEL-VARIANT.jsonl and to the output. Databases and
slices are created in DATADIR and removed at the end.
"""

import argparse
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROBE = os.path.join(HERE, "probe.py")


def run(out, *args: str) -> None:
    done = subprocess.run(  # noqa: S603
        [sys.executable, PROBE, *args], capture_output=True, text=True, check=False
    )
    for line in (done.stdout + done.stderr).splitlines():
        print(line, flush=True)
        out.write(line + "\n")
        out.flush()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("variant")
    parser.add_argument("file")
    parser.add_argument("datadir")
    parser.add_argument("label")
    parser.add_argument("--cancel-after", type=float, default=0)
    parser.add_argument("--kill-after", type=float, default=0)
    parser.add_argument("--quick-check", action="store_true")
    parser.add_argument("--skip-main", action="store_true")
    args = parser.parse_args()
    v = args.variant
    db = os.path.join(args.datadir, f"{args.label}-{v}.db")
    cancel_db = os.path.join(args.datadir, f"{args.label}-{v}-cancel.db")
    kill_db = os.path.join(args.datadir, f"{args.label}-{v}-kill.db")
    month = os.path.join(args.datadir, f"{args.label}-month.csv")
    full = ("2023-01-01T00:00:00+00:00", "2025-01-01T00:00:00+00:00")
    thirty = ("2024-03-01T00:00:00+00:00", "2024-03-31T00:00:00+00:00")
    with open(os.path.join(args.datadir, f"results-{args.label}-{v}.jsonl"), "a") as out:
        common = ["--variant", v]
        if not args.skip_main:
            for stale in (db,):
                if os.path.exists(stale):
                    os.remove(stale)
            run(out, "init", *common, "--db", db)
            run(out, "import", *common, "--db", db, "--file", args.file)
            run(out, "state", *common, "--db", db, *(["--quick-check"] if args.quick_check else []))
            run(out, "read", *common, "--db", db, "--what", "all", "--start", full[0], "--end", full[1])
            run(out, "read", *common, "--db", db, "--what", "30d", "--start", thirty[0], "--end", thirty[1])
            if v != "a":
                run(out, "read", *common, "--db", db, "--what", "all", "--as-ticks",
                    "--start", full[0], "--end", full[1])
                run(out, "read", *common, "--db", db, "--what", "30d", "--as-ticks",
                    "--start", thirty[0], "--end", thirty[1])
            run(out, "gaps", *common, "--db", db, "--start", full[0], "--end", full[1])
            if not os.path.exists(month):
                run(out, "slice", "--file", args.file, "--out", month, "--prefix", "2024.03.")
            run(out, "import", *common, "--db", db, "--file", month)  # replace a month
            run(out, "state", *common, "--db", db)
            run(out, "delete", *common, "--db", db, "--what", "month",
                "--start", "2024-03-01T00:00:00+00:00", "--end", "2024-04-01T00:00:00+00:00")
            run(out, "delete-series", *common, "--db", db)
            os.remove(db)
        if args.cancel_after:
            for stale in (cancel_db,):
                if os.path.exists(stale):
                    os.remove(stale)
            run(out, "init", *common, "--db", cancel_db)
            run(out, "import", *common, "--db", cancel_db, "--file", args.file,
                "--cancel-after", str(args.cancel_after))
            run(out, "state", *common, "--db", cancel_db)
            os.remove(cancel_db)
        if args.kill_after:
            if os.path.exists(kill_db):
                os.remove(kill_db)
            run(out, "init", *common, "--db", kill_db)
            run(out, "kill", *common, "--db", kill_db, "--file", args.file,
                "--after", str(args.kill_after))
            run(out, "state", *common, "--db", kill_db, "--quick-check")
            os.remove(kill_db)
        if os.path.exists(month) and args.label.endswith("-last"):
            os.remove(month)


if __name__ == "__main__":
    main()
