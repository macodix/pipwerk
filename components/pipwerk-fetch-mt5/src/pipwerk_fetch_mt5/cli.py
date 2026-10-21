"""Command line entry point of pipwerk-fetch-mt5.

Supports the startup configuration parameter ``-c <PATH>`` (req-system-017, req-system-018).
Without it the search locations of req-system-017 are searched. Address and port come from the
startup configuration (``[server]``), not from the command line, so that what a program on
the machine of MetaTrader 5 offers to the network is always written down in one file.
"""

from __future__ import annotations

import argparse
import ipaddress
import logging
import sys
from collections.abc import Sequence

import uvicorn

from pipwerk_fetch_mt5.app import create_app
from pipwerk_fetch_mt5.config import StartupConfig, StartupConfigError, load_startup_config
from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.mt5_gateway import Mt5Gateway
from pipwerk_fetch_mt5.service import FetchService

logger = logging.getLogger(__name__)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pipwerk-fetch-mt5",
        description="Start pipwerk-fetch-mt5, the acquisition of market data from MetaTrader 5.",
    )
    parser.add_argument(
        "-c",
        "--config",
        dest="config_path",
        default=None,
        help=(
            "Path to the INI startup configuration. If omitted, the automatic search "
            "locations ($HOME/pipwerk/etc, $HOME/.config/pipwerk, /etc/pipwerk, or on Windows "
            "%%USERPROFILE%%\\pipwerk\\etc, %%APPDATA%%\\pipwerk, %%PROGRAMDATA%%\\pipwerk) "
            "are searched. pipwerk-fetch-mt5 does not start without a valid startup "
            "configuration."
        ),
    )
    return parser


def allowed_hosts_of(config: StartupConfig) -> list[str]:
    """The names allowed in the ``Host`` header: those of the startup configuration and the
    address the program is bound to (unless that is a wildcard address)."""
    hosts = list(config.allowed_hosts)
    try:
        wildcard = ipaddress.ip_address(config.host).is_unspecified
    except ValueError:
        wildcard = False
    if not wildcard:
        hosts.append(config.host)
    return hosts


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        config = load_startup_config(args.config_path)
    except StartupConfigError as error:
        print(f"pipwerk-fetch-mt5: {error}", file=sys.stderr)
        return 1

    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
    )
    gateway = Mt5Gateway(config.metatrader)
    service = FetchService(gateway, config)
    try:
        service.check_terminal()
        logger.info("MetaTrader 5 is reachable.")
    except FetchError:
        logger.warning("MetaTrader 5 is not reachable yet; every request is tried again.")
    app = create_app(service, shared_key=config.shared_key, allowed_hosts=allowed_hosts_of(config))
    uvicorn.run(app, host=config.host, port=config.port, server_header=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
