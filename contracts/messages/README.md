# Message Contracts

Versioned inter-component message formats.

## v1: messages of pipwerk relay

Defined by the library `packages/relay-core` (package `pipwerk_relaycore`), described in [docs/technical/pipwerk-relay.md](../../docs/technical/pipwerk-relay.md).

| File | Content |
|---|---|
| `v1/message.schema.json` | the message: `id`, `sender`, `recipient`, `priority`, `kind`, `content`, `reference_id`, `created_at`, `attachments`, `receipt` |
| `v1/envelope.schema.json` | the envelope that lies on every transmission way: `format`, `body`, `link`; `$defs/Body` defines the JSON text in `body` |
| `v1/relay.receipt.schema.json` | the content of a message of the kind `relay.receipt`: empty |
| `v1/relay.undeliverable.schema.json` | the content of a message of the kind `relay.undeliverable`: `reason`, `text`, `recipient`, `kind` |
| `v1/probe.message.schema.json` | the content of a message of the kind `probe.message`: `text` |
| `v1/relay-config.schema.json` | the operating configuration of a relay (JSON file for `pipwerk-relay config load`): `network`, `name`, `inputs`, `components`, `address_book`, `periods`, `limits`; see below |
| `v1/examples/` | valid examples: messages (`message-request.json`, `message-with-attachment.json`, `message-receipt.json`, `message-undeliverable.json`, `message-probe.json`), contents (`content-*.json`), `envelope.json`, the operating configuration `relay-config.json` |
| `v1/examples/invalid/` | invalid examples; every one is rejected by schema and model |

The schemas are generated from the models: `pipwerk-relaycore-schemas <directory>` writes the schemas of the messages, `pipwerk-relay-schemas <directory>` the schema of the operating configuration; `--check` reports a file that differs. The tests compare the files with the models and check that schema and model judge the examples and a series of border cases alike.

### Envelope and check value

`body` is a text that holds the JSON of the body (`message`, `hops`, `stored`). A JSON schema validator cannot look into a text, so a reader parses `body` and checks the result against `#/$defs/Body`.

`link.mac` is HMAC-SHA256 with the key of the connection `link.from`, in lower case hexadecimal, over the UTF-8 bytes of

```
<link.from> LF <link.to> LF <body>
```

(`LF` is a line feed, `<body>` the text of `body` exactly as it is). Test vector: key `000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f`, `from` = `app-a`, `to` = `net1.relay1`, `body` = `{}` gives `e0e7f9f8af085df155f63c5ae69761d8dee65e349c2d9cf044ff44e107ee90a2`. This key belongs to the examples (`examples/envelope.json` is protected with it) and protects nothing.

A receiver checks `mac` before it reads `body`. `stored` is reserved for the attachments that go over a way for files; the first version of the library rejects an envelope in which it is set.

### Kinds of messages and their contents

The field `kind` names the kind of a message; `content` is a JSON object that follows the schema of the kind. The library knows three kinds and ships a schema for each; the content of every other kind (for example `fetch.request`) is defined by the component that uses it.

| Kind | Sent by | Content |
|---|---|---|
| `relay.receipt` | the connector of the receiving component, after the component has stored a message that asked for a receipt | empty `{}`; `reference_id` is the id of the confirmed message; the priority is that of the confirmed message |
| `relay.undeliverable` | the relay at which delivery fails | `reason` (one of `sender_invalid`, `loop`, `unknown_recipient`, `unknown_relay`, `relay_unreachable`, `recipient_unreachable`, `too_large`), `text` (the fixed text of the reason, 1 to 200 characters), `recipient` (address of the recipient of the message that could not be delivered), `kind` (kind of that message); `reference_id` is its id |
| `probe.message` | the test component | `text` (1 to 1000 characters) |

A message of the kind `relay.receipt` or `relay.undeliverable` never asks for a receipt: `receipt` must be `false` (otherwise receipts of receipts would arise). The schema `message.schema.json` states this with `if`/`then`.

### Operating configuration of a relay

`relay-config.schema.json` describes the file that the operator loads with `pipwerk-relay config load <FILE>`; the relay keeps it in its database and takes a new one over while it runs. Described in [docs/technical/pipwerk-relay.md](../../docs/technical/pipwerk-relay.md), section 21.

| Field | Content |
|---|---|
| `network`, `name` | pipwerk network and name of the relay (rules of the parts of an address) |
| `inputs` | the inboxes the relay reads: `name`, `way`, `settings` |
| `components` | the connected components: `name` (not `relay`), `way` and `settings` (where the relay puts what is meant for the component), `key_file` |
| `address_book` | the known relays: `network`, `relay`, `way` and `settings` (the inbox of that relay), `key_file`, `standard` (at most one entry) |
| `periods` | intervals and periods in seconds (reading, pauses between attempts, period to deliver, seen handovers, grace period, leftovers, cleaning up), all with defaults |
| `limits` | `max_hops`, `read_batch`, `max_queue_messages`, `max_attachment_storage_bytes`, all with defaults |

Every object rejects additional fields except `settings`: that block belongs to the way named next to it. The relay passes it on unchanged, and the way checks it itself with its own model and rejects unknown entries (so a new way needs no change of this schema). A `key_file` is a file name in the directory for secrets, never a path or a key. The file contains no secrets.

The relay rejects an invalid file as a whole. Besides the schema it checks what a schema cannot express: the names of inputs, components and entries of the address book differ, the name `relay` is reserved for the relay itself, the relay is not in its own address book, at most one entry is the standard relay, every key file belongs to one connection only, and `retry_max_seconds` is not less than `retry_first_seconds`. It also loads every named way with its settings and every key file; a file that names a way or a key that does not exist is rejected.

### Rules that only the model checks

- the rules of the operating configuration just named (uniqueness, the reserved name, the single standard relay, `retry_max_seconds`),
- the names of the attachments of a message differ,
- `created_at` is a time in UTC (offset 0),
- `created_at` has the form of a time, and `id` and `reference_id` the form of a UUID: a JSON schema validator checks `format` only if it is told to (`format: date-time` needs an additional library in most validators).

The patterns end with `$`. In some regular expression dialects (for example that of Python) `$` also matches before a final line feed, so a validator may accept a name with a line feed at the end; the model rejects it.
