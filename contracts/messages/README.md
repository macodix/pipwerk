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
| `v1/examples/` | valid examples: messages (`message-request.json`, `message-with-attachment.json`, `message-receipt.json`, `message-undeliverable.json`, `message-probe.json`), contents (`content-*.json`), `envelope.json` |
| `v1/examples/invalid/` | invalid examples; every one is rejected by schema and model |

The schemas are generated from the models: `pipwerk-relaycore-schemas <directory>` writes them, `--check` reports a file that differs. The tests compare the files with the models and check that schema and model judge the examples and a series of border cases alike.

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

### Rules that only the model checks

- the names of the attachments of a message differ,
- `created_at` is a time in UTC (offset 0),
- `created_at` has the form of a time, and `id` and `reference_id` the form of a UUID: a JSON schema validator checks `format` only if it is told to (`format: date-time` needs an additional library in most validators).

The patterns end with `$`. In some regular expression dialects (for example that of Python) `$` also matches before a final line feed, so a validator may accept a name with a line feed at the end; the model rejects it.
