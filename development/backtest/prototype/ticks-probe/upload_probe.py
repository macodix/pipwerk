"""Item 5: upload of a large file in pieces (one request per piece) with simultaneous import.

``run`` starts a small HTTP server (standard library) in another process and a client in this
process that sends the file piece by piece (``--chunk-mib``, default 64), one request after the
other on one connection, like a browser that cuts a file with ``Blob.slice``. The server mode:

  spool   append each piece to a file (the import would then run from the file)
  stream  hand each piece to a worker thread that parses it and writes blocks into the database
          (variant b-delta, one transaction for the whole upload); the request returns when the
          worker has taken the piece (a queue of 2 gives the back pressure)

A request ``/finish`` ends the upload and returns the figures of the server (seconds, peak
memory). ``--cancel-after-chunks N`` makes the client send ``/cancel`` after N pieces.
Run with the environment of packages/market-data.
"""

import argparse
import http.client
import json
import os
import queue
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from common import CsvTickReader, Timer, peak_mib, report


class Upload:
    def __init__(self, mode: str, directory: str, db: str | None) -> None:
        self.mode = mode
        self.started = time.perf_counter()
        self.bytes = 0
        self.pieces = 0
        self.error: str | None = None
        self.result: dict = {}
        if mode == "spool":
            self.handle = open(os.path.join(directory, "spool.bin"), "wb")  # noqa: SIM115
        else:
            self.queue: queue.Queue = queue.Queue(maxsize=2)
            self.cancelled = threading.Event()
            self.thread = threading.Thread(target=self._work, args=(db,), daemon=True)
            self.thread.start()

    def _work(self, db: str | None) -> None:
        from pipwerk_marketdata.migrate import migrate_database  # noqa: PLC0415
        from pipwerk_marketdata.records import Interval  # noqa: PLC0415
        from pipwerk_marketdata.store import MarketDataStore  # noqa: PLC0415
        from probe import ZONE, BlockWriter, blocks, make_engine, series_id  # noqa: PLC0415

        from common import ms_to_datetime  # noqa: PLC0415

        assert db is not None
        engine = make_engine(db)
        migrate_database(engine)
        blocks.create(engine, checkfirst=True)
        reader = CsvTickReader(ZONE)
        first = last = None
        try:
            with engine.begin() as connection:
                sid = series_id(connection, True)
                assert sid is not None
                writer = BlockWriter(connection, sid, "delta")
                while True:
                    piece = self.queue.get()
                    if piece is None:
                        break
                    if self.cancelled.is_set():
                        raise RuntimeError("cancelled")
                    ms, bid, ask = reader.feed(piece)
                    del piece
                    if len(ms):
                        first = ms[0] if first is None else first
                        last = ms[-1]
                    writer.add(ms, bid, ask)
                ms, bid, ask = reader.feed(b"", final=True)
                if len(ms):
                    first = ms[0] if first is None else first
                    last = ms[-1]
                writer.add(ms, bid, ask)
                writer.flush(final=True)
                if first is not None and last is not None:
                    MarketDataStore._add_coverage(
                        connection,
                        sid,
                        Interval(ms_to_datetime(first), ms_to_datetime(last + 1)),
                    )
            self.result = {"rows": reader.rows, "db_bytes": os.path.getsize(db)}
        except Exception as error:  # noqa: BLE001
            self.error = str(error)

    def piece(self, data: bytes) -> None:
        self.bytes += len(data)
        self.pieces += 1
        if self.mode == "spool":
            self.handle.write(data)
        else:
            self.queue.put(data)  # blocks while two pieces wait: back pressure

    def finish(self) -> dict:
        if self.mode == "spool":
            self.handle.close()
        else:
            self.queue.put(None)
            self.thread.join()
        return {
            "server_seconds": round(time.perf_counter() - self.started, 2),
            "server_peak_mib": round(peak_mib(), 1),
            "bytes": self.bytes,
            "pieces": self.pieces,
            "error": self.error,
            **self.result,
        }

    def cancel(self) -> dict:
        start = time.perf_counter()
        if self.mode == "spool":
            self.handle.close()
        else:
            self.cancelled.set()
            while not self.queue.empty():
                self.queue.get_nowait()
            self.queue.put(None)
            self.thread.join()
        return {
            "cancel_seconds": round(time.perf_counter() - start, 3),
            "error": self.error,
            "server_peak_mib": round(peak_mib(), 1),
        }


def serve(args: argparse.Namespace) -> None:
    upload = Upload(args.mode, args.dir, args.db)

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, *_: object) -> None:
            pass

        def do_POST(self) -> None:  # noqa: N802
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length)
            if self.path == "/piece":
                upload.piece(body)
                answer: dict = {"ok": True}
            elif self.path == "/finish":
                answer = upload.finish()
            else:
                answer = upload.cancel()
            data = json.dumps(answer).encode()
            self.send_response(200)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print("ready", flush=True)
    server.serve_forever()


def run(args: argparse.Namespace) -> None:
    port = 18000 + os.getpid() % 1000
    command = [
        sys.executable,
        os.path.abspath(__file__),
        "serve",
        "--mode",
        args.mode,
        "--dir",
        args.dir,
        "--port",
        str(port),
    ]
    if args.db:
        command += ["--db", args.db]
    server = subprocess.Popen(command, stdout=subprocess.PIPE, text=True)  # noqa: S603
    assert server.stdout is not None
    server.stdout.readline()
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3600)
    size = os.path.getsize(args.file)
    piece_size = args.chunk_mib << 20
    sent = 0
    answer: dict = {}
    with Timer() as timer:
        with open(args.file, "rb") as handle:
            while True:
                data = handle.read(piece_size)
                if not data:
                    break
                connection.request("POST", "/piece", body=data)
                connection.getresponse().read()
                sent += 1
                if args.cancel_after_chunks and sent >= args.cancel_after_chunks:
                    break
        path = "/cancel" if args.cancel_after_chunks and sent >= args.cancel_after_chunks else "/finish"
        connection.request("POST", path, body=b"")
        answer = json.loads(connection.getresponse().read())
    report(
        "upload",
        mode=args.mode,
        file_bytes=size,
        chunk_mib=args.chunk_mib,
        pieces_sent=sent,
        client_seconds=round(timer.seconds, 2),
        client_peak_mib=round(peak_mib(), 1),
        **answer,
    )
    server.kill()


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    s = sub.add_parser("serve")
    s.add_argument("--mode", choices=["spool", "stream"], required=True)
    s.add_argument("--dir", required=True)
    s.add_argument("--db")
    s.add_argument("--port", type=int, required=True)
    s.set_defaults(function=serve)
    r = sub.add_parser("run")
    r.add_argument("--mode", choices=["spool", "stream"], required=True)
    r.add_argument("--file", required=True)
    r.add_argument("--dir", required=True)
    r.add_argument("--db")
    r.add_argument("--chunk-mib", type=int, default=64)
    r.add_argument("--cancel-after-chunks", type=int, default=0)
    r.set_defaults(function=run)
    args = parser.parse_args()
    args.function(args)


if __name__ == "__main__":
    main()
