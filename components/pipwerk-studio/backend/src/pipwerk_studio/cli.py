"""Command line entry point of the Pipwerk Studio backend.

Supports the documented ``-c <PATH>`` startup configuration parameter
(req-system-017, req-system-018) so Pipwerk Studio can be started as an
eigenständiges Programm with an explicit startup configuration. When
``-c`` is omitted, the documented automatic search locations are used.
"""

from __future__ import annotations

import argparse
import sys

import uvicorn

from pipwerk_studio.app import create_app
from pipwerk_studio.config import StartupConfigError, load_database_url


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pipwerk-studio",
        description="Start the Pipwerk Studio backend.",
    )
    parser.add_argument(
        "-c",
        "--config",
        dest="config_path",
        default=None,
        help=(
            "Path to the INI startup configuration. If omitted, the documented "
            "automatic search locations ($HOME/pipwerk/etc, $HOME/.config/pipwerk, "
            "/etc/pipwerk, or their Windows equivalents) are used."
        ),
    )
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default: 127.0.0.1).")
    parser.add_argument("--port", type=int, default=8000, help="Bind port (default: 8000).")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        database_url = load_database_url(args.config_path)
    except StartupConfigError as error:
        print(f"pipwerk-studio: {error}", file=sys.stderr)
        return 1

    app = create_app(database_url)
    uvicorn.run(app, host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
