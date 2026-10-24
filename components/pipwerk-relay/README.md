# pipwerk-relay

The relay of the message system pipwerk relay: it reads the envelopes that components and other relays put into its inboxes, checks them, keeps the messages in a queue, and hands them over to a connected component, to a relay of its address book or to the standard relay. A message that cannot be delivered ends with a notice `relay.undeliverable` to its sender. The relay opens no port and has no web interface.

- Technical documentation: [docs/technical/pipwerk-relay.md](../../docs/technical/pipwerk-relay.md) (structure, way of a message, configuration, commands, limits, security)
- Library of messages and ways: [packages/relay-core](../../packages/relay-core)
- Startup configuration: `pipwerk-relay.example.ini` (copy it to `pipwerk-relay.ini`)
- Operating configuration (JSON): `contracts/messages/v1/relay-config.schema.json` with the example `contracts/messages/v1/examples/relay-config.json`
- Linux: `scripts/install` once, then `scripts/pipwerk-relay <command>`. Windows: `scripts\install.cmd` once, then `scripts\pipwerk-relay.cmd <command>`

## Commands

```
pipwerk-relay [-c <PATH>] migrate              bring the database to the newest schema
pipwerk-relay [-c <PATH>] key new <FILE>       create the key of a connection in the directory for secrets
pipwerk-relay [-c <PATH>] config load <FILE>   check a JSON file and make it the operating configuration
pipwerk-relay [-c <PATH>] config show          print the operating configuration in use
pipwerk-relay [-c <PATH>] run                  run until stopped (Ctrl+C, SIGTERM)
pipwerk-relay [-c <PATH>] queue                list the messages in the queue, without content
```

Exit code 0: done. 1: the command failed (the text on the standard error output says why). 2: invalid call or invalid startup configuration.

Setting up for the first time: write `pipwerk-relay.ini`, run `migrate`, create a key for each connection with `key new` (and give a copy of each key to the other side of the connection), write the operating configuration, load it with `config load` and start `run`. A new operating configuration is taken over by a running relay without a restart.

## Checks

```
scripts/check [--with-audit]
```

runs `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check` and `mypy`; with `--with-audit` also `pip-audit` for the locked packages (needs access to the internet). It ends with exit code 0 only if all of them pass. The tests build relays with the real library and real components in temporary directories; one test starts the relay as a process and stops it with `SIGKILL`.
