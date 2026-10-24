"""The command line of pipwerk relay (specification 4.5).

::

    pipwerk-relay [-c <PATH>] run
    pipwerk-relay [-c <PATH>] config load <FILE>
    pipwerk-relay [-c <PATH>] config show
    pipwerk-relay [-c <PATH>] key new <FILE>
    pipwerk-relay [-c <PATH>] queue
    pipwerk-relay [-c <PATH>] migrate
    pipwerk-relay probe listen|send -c <PATH> ...

Exit codes: 0 done, 1 the command failed, 2 invalid call or invalid startup configuration.
Text for the operator goes to the standard output, errors to the standard error output. Neither
shows content of a message, a key or a value of a configuration. The relay opens no port.

``probe`` is a component of its own (``probe.py``) with a startup configuration of its own, given
after the action; it does not read ``pipwerk-relay.ini``.
"""

import argparse
import sys
import threading
from collections.abc import Sequence
from datetime import UTC, datetime
from pathlib import Path

import sqlalchemy as sa
from pipwerk_relaycore import (
    DatabaseMigrationError,
    KeyHandlingError,
    SecretsAccessError,
    SecretsDirectory,
)

from pipwerk_relay.attachments import AttachmentStore
from pipwerk_relay.configuration import load_configuration, show_configuration
from pipwerk_relay.database import create_engine, ensure_current_schema, migrate
from pipwerk_relay.errors import (
    ConfigRejected,
    NotConfigured,
    RelayError,
    StartupConfigError,
)
from pipwerk_relay.operating import MAX_CONFIG_BYTES
from pipwerk_relay.probe import add_probe_parser, run_probe
from pipwerk_relay.relay import Relay
from pipwerk_relay.service import (
    configure_logging,
    remove_logging,
    run_until_stopped,
    stop_on_signals,
)
from pipwerk_relay.startup import StartupConfig, load_startup_config
from pipwerk_relay.store import QueueEntry, RelayStore

PROG = "pipwerk-relay"
EXIT_OK = 0
EXIT_FAILED = 1
EXIT_USAGE = 2


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=PROG, description="pipwerk relay: forwards messages between components and relays."
    )
    parser.add_argument(
        "-c",
        "--config",
        metavar="PATH",
        help="startup configuration (pipwerk-relay.ini); without it the relay searches the "
        "standard locations",
    )
    commands = parser.add_subparsers(dest="command", required=True, metavar="COMMAND")
    commands.add_parser("run", help="run until stopped")
    config = commands.add_parser("config", help="operating configuration")
    actions = config.add_subparsers(dest="action", required=True, metavar="ACTION")
    load = actions.add_parser("load", help="check a JSON file and make it the configuration")
    load.add_argument("file", metavar="FILE", type=Path)
    actions.add_parser("show", help="print the configuration in use")
    key = commands.add_parser("key", help="keys of connections")
    key_actions = key.add_subparsers(dest="action", required=True, metavar="ACTION")
    new = key_actions.add_parser("new", help="create a key file in the directory for secrets")
    new.add_argument("file", metavar="FILE", help="file name of the key (not a path)")
    commands.add_parser("queue", help="list the messages in the queue (without content)")
    commands.add_parser("migrate", help="bring the database to the newest schema")
    add_probe_parser(commands)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    """Run a command; returns the exit code."""
    arguments = _parser().parse_args(argv)  # an invalid call ends with exit code 2
    if arguments.command == "probe":
        return run_probe(arguments)  # the probe has a startup configuration of its own
    try:
        startup = load_startup_config(arguments.config)
    except StartupConfigError as error:
        print(f"{PROG}: {error}", file=sys.stderr)
        return EXIT_USAGE
    try:
        return _dispatch(arguments, startup)
    except (RelayError, KeyHandlingError, DatabaseMigrationError) as error:
        print(f"{PROG}: {error}", file=sys.stderr)
        return EXIT_FAILED
    except sa.exc.SQLAlchemyError as error:
        print(f"{PROG}: the database cannot be used ({type(error).__name__})", file=sys.stderr)
        return EXIT_FAILED


def _dispatch(arguments: argparse.Namespace, startup: StartupConfig) -> int:
    command: str = arguments.command
    if command == "key":
        return _key_new(startup, arguments.file)
    engine = create_engine(startup.database_url)
    try:
        if command == "migrate":
            migrate(engine)
            print("The database is at the newest version of the schema.")
            return EXIT_OK
        ensure_current_schema(engine)
        store = RelayStore(engine)
        if command == "queue":
            return _queue(store)
        if command == "config":
            if arguments.action == "show":
                print(show_configuration(store))
                return EXIT_OK
            return _config_load(startup, store, arguments.file)
        return _run(startup, store)
    finally:
        engine.dispose()


def _key_new(startup: StartupConfig, file_name: str) -> int:
    SecretsDirectory(startup.secrets_directory).new_key(file_name)
    print(
        f"Created the key file '{file_name}'. Give a copy of it to the other side of the "
        "connection by a safe way; it must not be shown or sent in the open."
    )
    return EXIT_OK


def _config_load(startup: StartupConfig, store: RelayStore, file: Path) -> int:
    try:
        with file.open("rb") as stream:
            document = stream.read(MAX_CONFIG_BYTES + 1)
    except OSError:
        print(f"{PROG}: the file {file} cannot be read", file=sys.stderr)
        return EXIT_FAILED
    try:
        version = load_configuration(
            store, SecretsDirectory(startup.secrets_directory), document, datetime.now(UTC)
        )
    except ConfigRejected as error:
        print(f"{PROG}: the file is rejected as a whole, nothing was changed:", file=sys.stderr)
        for problem in error.problems:
            print(f"  {problem}", file=sys.stderr)
        return EXIT_FAILED
    print(f"Operating configuration {version} loaded. A running relay takes it over by itself.")
    return EXIT_OK


def _queue(store: RelayStore) -> int:
    entries = store.all_entries()
    totals = store.totals()
    header = (
        "seq",
        "message",
        "kind",
        "sender",
        "recipient",
        "state",
        "attempts",
        "since",
        "next attempt",
        "last error",
    )
    rows = [header, *(_queue_row(entry) for entry in entries)]
    widths = [max(len(row[column]) for row in rows) for column in range(len(header))]
    for row in rows:
        print(
            "  ".join(cell.ljust(width) for cell, width in zip(row, widths, strict=True)).rstrip()
        )
    print(
        f"{totals.messages} messages in the queue, {totals.attachment_bytes} bytes of attachments"
    )
    return EXIT_OK


def _queue_row(entry: QueueEntry) -> tuple[str, ...]:
    return (
        str(entry.seq),
        str(entry.message_id),
        entry.kind,
        entry.sender,
        entry.recipient,
        entry.state,
        str(entry.attempts),
        entry.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        entry.next_attempt_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        entry.last_error or "-",
    )


def _run(startup: StartupConfig, store: RelayStore) -> int:
    secrets = SecretsDirectory(startup.secrets_directory)
    try:
        secrets.check()  # the relay does not start with a directory others can read
    except SecretsAccessError as error:
        print(f"{PROG}: not started: {error}", file=sys.stderr)
        return EXIT_FAILED
    attachments = AttachmentStore(startup.attachments_directory)
    try:
        attachments.ensure_directory()
        handler = configure_logging(startup.log_level, startup.log_file)
    except OSError as error:
        print(
            f"{PROG}: not started: a directory or the log file cannot be used "
            f"({type(error).__name__})",
            file=sys.stderr,
        )
        return EXIT_FAILED
    stop = threading.Event()
    try:
        with stop_on_signals(stop):
            relay = Relay(store, attachments, secrets)
            try:
                relay.cycle()  # a missing or unusable configuration ends here, before the loop
            except (NotConfigured, ConfigRejected) as error:
                print(f"{PROG}: not started: {error}", file=sys.stderr)
                return EXIT_FAILED
            run_until_stopped(relay, stop)
    finally:
        remove_logging(handler)
    return EXIT_OK
