# Message Contracts

Versioned inter-component message formats.

## v1: messages of pipwerk relay

Defined by the library `packages/relay-core` (package `pipwerk_relaycore`), described in [docs/technical/pipwerk-relay.md](../../docs/technical/pipwerk-relay.md).

| File | Content |
|---|---|
| `v1/message.schema.json` | the message: `id`, `sender`, `recipient`, `priority`, `kind`, `content`, `reference_id`, `created_at`, `attachments`, `receipt` |
| `v1/envelope.schema.json` | the envelope that lies on every transmission way: `format`, `body`, `link`; `$defs/Body` defines the JSON text in `body` |
| `v1/examples/` | valid examples: `message-request.json`, `message-with-attachment.json`, `envelope.json` |
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

### Rules that only the model checks

- the names of the attachments of a message differ,
- `created_at` is a time in UTC (offset 0),
- `created_at` has the form of a time, and `id` and `reference_id` the form of a UUID: a JSON schema validator checks `format` only if it is told to (`format: date-time` needs an additional library in most validators).

The patterns end with `$`. In some regular expression dialects (for example that of Python) `$` also matches before a final line feed, so a validator may accept a name with a line feed at the end; the model rejects it.
