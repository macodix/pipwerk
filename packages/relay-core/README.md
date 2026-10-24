# Relay Core

Message library of pipwerk relay (package `pipwerk_relaycore`): address, message, envelope with check value, the interface "Way" for transmission ways as extensions, and the way `files` (a directory in the file system).

Documentation: [docs/technical/pipwerk-relay.md](../../docs/technical/pipwerk-relay.md). Formats: [contracts/messages/](../../contracts/messages/README.md).

## Interface

- `Address.parse("<component>.<network>.<relay>")`: the three parts of an address, 1 to 63 letters, digits, `-` and `_` each.
- `Message` and `Attachment` (strict Pydantic models, additional fields are rejected); `Attachment.of(name, content)` describes a file by size and SHA-256.
- `Envelope.create(message, hops=..., sender=..., recipient=..., key=...)` packs and protects a message (HMAC-SHA256 over `from`, `to`, `body`); `Envelope.from_json(text)` reads one; `envelope.open(keys, recipient=...)` checks the check value and returns the content; `verify_attachments(message, contents)` checks size and SHA-256 of the files.
- `SecretsDirectory(path)`: `check()`, `new_key(file)`, `load_key(file)`; keys are 32 bytes from the secure random source, the rights of directory and files are checked (only the owner).
- `Way` (interface version 1): `send`, `read`, `acknowledge`; `load_way(name, settings)` loads the way with this name from the entry point group `pipwerk_relay.ways` and passes the block of its own settings on; the way checks it strictly (`WaySettingsError` names the entries, never the values).
- The way `files` (`FilesWay`, name `files`): settings `directory`, `max_envelope_bytes`, `max_attachment_bytes`.
- `read_connection_settings(parser, origin)` reads the sections `[relay]` and `[relay.way]` of a startup configuration in the form every component of pipwerk relay uses (`address`, `way`, `secrets_directory`, `key_file`, `database`, `relay_link`, `poll_interval_seconds`; the settings of the way as `target.<entry>` and `inbox.<entry>`); `open_connector(settings)` checks them and opens the `Connector`. Errors are `ConnectionSettingsError` and name the entry, never a value.
- `pipwerk-relaycore-schemas <directory>` writes the JSON schemas; `--check` reports files that differ from the models.

## Check

`packages/relay-core/scripts/check [--with-audit]`: `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check`, `mypy`; `--with-audit` adds `pip-audit`. The tests install a test way from the package `tests/packages/pipwerk-relay-testway` (development dependency) to prove that a way from its own package is loaded through its entry point.
