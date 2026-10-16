"""Command line entry point of the pipwerk Studio backend.

Supports the documented ``-c <PATH>`` startup configuration parameter
(req-system-017, req-system-018) so pipwerk Studio can be started as an
standalone program with an explicit startup configuration. When
``-c`` is omitted, the documented automatic search locations are used.
"""

from __future__ import annotations

import argparse
import sys

import uvicorn
from sqlalchemy.exc import SQLAlchemyError

from pipwerk_studio.app import create_app
from pipwerk_studio.config import StartupConfigError, load_startup_config
from pipwerk_studio.migrate import DatabaseMigrationError


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pipwerk-studio",
        description="Start the pipwerk Studio backend.",
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
            "pipwerk Studio does not start without a valid startup configuration."
        ),
    )
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default: 127.0.0.1).")
    parser.add_argument("--port", type=int, default=8000, help="Bind port (default: 8000).")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        startup_config = load_startup_config(args.config_path)
    except StartupConfigError as error:
        print(f"pipwerk-studio: {error}", file=sys.stderr)
        return 1

    try:
        app = create_app(startup_config.database_url, config_origin=startup_config.origin)
    except SQLAlchemyError as error:
        print(
            f"pipwerk-studio: the database connection of the startup configuration "
            f"cannot be used: {error}",
            file=sys.stderr,
        )
        return 1
    except DatabaseMigrationError as error:
        print(f"pipwerk-studio: {error}", file=sys.stderr)
        return 1
    uvicorn.run(app, host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
