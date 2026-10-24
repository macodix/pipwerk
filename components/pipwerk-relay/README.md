# pipwerk-relay

The relay of the message system pipwerk relay: it reads the envelopes that components and other relays put into its inboxes, checks them, keeps the messages in a queue, and hands them over to a connected component, to a relay of its address book or to the standard relay. A message that cannot be delivered ends with a notice `relay.undeliverable` to its sender. The relay opens no port and has no web interface.

- Technical documentation: [docs/technical/pipwerk-relay.md](../../docs/technical/pipwerk-relay.md) (structure, way of a message, configuration, commands, limits, security)
- Library of messages and ways: [packages/relay-core](../../packages/relay-core)
- Startup configuration: `pipwerk-relay.example.ini` (copy it to `pipwerk-relay.ini`); of the probe: `pipwerk-relay-probe.example.ini`
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

## The probe

`pipwerk-relay probe listen` and `pipwerk-relay probe send` are a component of pipwerk relay of their own (an address, a key and a connection to a relay, stated in the startup configuration `pipwerk-relay-probe.ini`, see `pipwerk-relay-probe.example.ini`). They prove the basic mechanism without the retrieval and without MetaTrader 5.

```
pipwerk-relay probe listen -c <PATH> -o <DIRECTORY>      receive until stopped; write every message with its files into the directory
pipwerk-relay probe send   -c <PATH> --address <ADDRESS> --text <TEXT> [--file <FILE> ...] [--receipt] [--wait <SECONDS>]
                                                          send one message and show what comes back
```

`-c` stands after the action: the probe does not read `pipwerk-relay.ini`. `send` ends with exit code 0 when the receipt arrived (or none was asked for and no notice came), 1 when a notice `relay.undeliverable` with its reason came, the receipt did not come within the deadline or the message could not be handed to the relay, 2 for an invalid call.

## The test environment

```
scripts/testenv start --network <NAME> --relay-a <NAME> --relay-b <NAME> --broker <NAME>
scripts/testenv status | stop
scripts/testenv send <a|b> <parameters of "probe send">
scripts/testenv request <parameters of "pipwerk-fetch-mt5 request">
scripts/testenv queue <a|b>
scripts/testenv fault <1..7> [<action>]
```

`start` sets up two relays with a directory in common (the stand-in for the network drive), a listening and a sending probe on each, `serve` of `pipwerk-fetch-mt5` with a replica of MetaTrader 5 (`scripts/replica/MetaTrader5.py`) and the requesting program, from exactly one commit. `fault` brings about the disturbances 1 to 7 of the specification and puts them right again. There are no ports; `status` names the directories. See `docs/technical/pipwerk-relay.md`, section 32, and `docs/user/pipwerk-relay.md`.

Setting up for the first time: write `pipwerk-relay.ini`, run `migrate`, create a key for each connection with `key new` (and give a copy of each key to the other side of the connection), write the operating configuration, load it with `config load` and start `run`. A new operating configuration is taken over by a running relay without a restart.

## Checks

```
scripts/check [--with-audit]
```

runs `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check` and `mypy`; with `--with-audit` also `pip-audit` for the locked packages (needs access to the internet). It ends with exit code 0 only if all of them pass. The tests build relays with the real library and real components in temporary directories; two tests start the relay as a process and stop it with `SIGKILL`. `tests/test_disturbances.py` brings about the disturbances 1 to 7 with two relays, a directory in common and the probe.
