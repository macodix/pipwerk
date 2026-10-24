"""An installation as an operator has it: startup configuration, directories, keys."""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import sqlalchemy as sa
from pipwerk_relaycore import (
    Address,
    Connector,
    ConnectorConfig,
    SecretsDirectory,
    WayConfig,
)

from pipwerk_relay.attachments import AttachmentStore
from pipwerk_relay.cli import main
from pipwerk_relay.database import create_engine
from pipwerk_relay.relay import Relay
from pipwerk_relay.store import RelayStore
from tests.support import RecordingHandler


@dataclass
class Install:
    """A startup configuration with its directories, as an operator has them."""

    root: Path
    ini: Path
    secrets: Path
    attachments: Path
    database: Path
    log: Path

    def run(self, *arguments: str) -> int:
        return main(["-c", str(self.ini), *arguments])

    def write_config(self, document: dict[str, Any]) -> Path:
        path = self.root / "operating.json"
        path.write_text(json.dumps(document), encoding="utf-8")
        return path

    def document(self, **changes: Any) -> dict[str, Any]:
        document: dict[str, Any] = {
            "network": "net1",
            "name": "relay1",
            "inputs": [
                {"name": "main", "way": "files", "settings": {"directory": str(self.root / "in")}}
            ],
            "components": [
                {
                    "name": name,
                    "way": "files",
                    "settings": {"directory": str(self.root / f"out-{name}")},
                    "key_file": f"component-{name}",
                }
                for name in ("app-a", "app-b")
            ],
            "periods": {"read_interval_seconds": 0.05},
        }
        document.update(changes)
        return document

    def prepare(self, **changes: Any) -> None:
        """Migrate, create the keys and the directories, load the configuration."""
        assert self.run("migrate") == 0
        for name in ("app-a", "app-b"):
            assert self.run("key", "new", f"component-{name}") == 0
            (self.root / f"out-{name}").mkdir()
        (self.root / "in").mkdir()
        assert self.run("config", "load", str(self.write_config(self.document(**changes)))) == 0

    def component(self, name: str) -> tuple[Connector, RecordingHandler]:
        key = SecretsDirectory(self.secrets).load_key(f"component-{name}")
        config = ConnectorConfig(
            address=Address(name, "net1", "relay1"),
            key=key,
            target=WayConfig("files", {"directory": str(self.root / "in")}),
            inbox=WayConfig("files", {"directory": str(self.root / f"out-{name}")}),
            database=self.root / f"{name}.db",
        )
        return Connector(config), RecordingHandler()

    def relay(self) -> tuple[Relay, sa.Engine]:
        engine = create_engine(sa.make_url(f"sqlite:///{self.database}"))
        attachments = AttachmentStore(self.attachments)
        attachments.ensure_directory()
        relay = Relay(RelayStore(engine), attachments, SecretsDirectory(self.secrets))
        return relay, engine


def make_install(root: Path) -> Install:
    secrets = root / "secrets"
    secrets.mkdir()
    secrets.chmod(0o700)
    database = root / "relay.db"
    log = root / "relay.log"
    ini = root / "pipwerk-relay.ini"
    ini.write_text(
        f"[database]\nurl = sqlite:///{database}\n"
        f"[storage]\nattachments_directory = {root / 'attachments'}\n"
        f"[secrets]\ndirectory = {secrets}\n"
        f"[log]\nfile = {log}\n",
        encoding="utf-8",
    )
    return Install(root, ini, secrets, root / "attachments", database, log)
