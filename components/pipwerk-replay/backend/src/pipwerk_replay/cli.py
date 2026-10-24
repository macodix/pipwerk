"""Command line entry point of the pipwerk replay backend.

Supports the documented ``-c <PATH>`` startup configuration parameter
(req-system-017, req-system-018) so pipwerk replay can be started as a
standalone program with an explicit startup configuration. When ``-c`` is
omitted, the documented automatic search locations are used. ``--host`` and
``--port`` override the entries ``host`` and ``port`` of the startup
configuration.
"""

from __future__ import annotations

import argparse
import sys

import uvicorn
from sqlalchemy.exc import SQLAlchemyError

from pipwerk_replay.app import create_app
from pipwerk_replay.config import StartupConfigError, load_startup_config
from pipwerk_replay.host_check import InvalidAllowedHostError, build_allowed_hosts
from pipwerk_replay.migrate import DatabaseMigrationError


def _port(text: str) -> int:
    if not (text.isascii() and text.isdigit()) or not 1 <= int(text) <= 65535:
        raise argparse.ArgumentTypeError("must be a number between 1 and 65535")
    return int(text)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pipwerk-replay",
        description="Start the pipwerk replay backend.",
    )
    parser.add_argument(
        "-c",
        "--config",
        dest="config_path",
        default=None,
        help=(
            "Path to the INI startup configuration. If omitted, the documented "
            "automatic search locations ($HOME/pipwerk/etc, $HOME/.config/pipwerk, "
            "/etc/pipwerk, or their Windows equivalents) are searched. "
            "pipwerk replay does not start without a valid startup configuration."
        ),
    )
    parser.add_argument(
        "--host",
        default=None,
        help="Bind address (default: the entry host of the startup configuration, 127.0.0.1).",
    )
    parser.add_argument(
        "--port",
        type=_port,
        default=None,
        help="Bind port (default: the entry port of the startup configuration, 8000).",
    )
    parser.add_argument(
        "--allowed-host",
        dest="allowed_hosts",
        action="append",
        default=[],
        metavar="NAME",
        help=(
            "Name or IP address allowed in the Host header of a request, in addition to "
            "127.0.0.1, localhost and ::1 and to the names of the startup configuration "
            "(entry allowed_hosts in the section server). May be repeated. The entry *ip "
            "allows every IP address."
        ),
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        startup_config = load_startup_config(args.config_path)
    except StartupConfigError as error:
        print(f"pipwerk-replay: {error}", file=sys.stderr)
        return 1

    try:
        allowed_hosts = [*startup_config.allowed_hosts, *args.allowed_hosts]
        build_allowed_hosts(allowed_hosts)  # reject an invalid name before anything starts
    except InvalidAllowedHostError as error:
        print(f"pipwerk-replay: invalid value of --allowed-host: {error}", file=sys.stderr)
        return 1

    try:
        app = create_app(
            startup_config.database_url,
            allowed_hosts=allowed_hosts,
            max_body_bytes=startup_config.max_body_bytes,
            marketdata=startup_config.marketdata,
            config_origin=startup_config.origin,
        )
    except SQLAlchemyError as error:
        print(
            f"pipwerk-replay: the database connection of the startup configuration "
            f"cannot be used: {error}",
            file=sys.stderr,
        )
        return 1
    except DatabaseMigrationError as error:
        print(f"pipwerk-replay: {error}", file=sys.stderr)
        return 1
    host = startup_config.host if args.host is None else args.host
    port = startup_config.port if args.port is None else args.port
    uvicorn.run(app, host=host, port=port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
