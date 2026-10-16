# Strategy Contracts

Versioned schemas for stored and exchanged strategy definitions.

- `v1/` contains the JSON schemas of the document formats `pipwerk.strategy`,
  `pipwerk.indicator`, `pipwerk.trend`, `pipwerk.rule` and `pipwerk.ruleset`
  (`<format>.schema.json`). They are generated from the models of the shared Python library
  and must not be edited by hand.
- `v1/testcases/` contains the test case documents `str-01.strategy.json` and
  `str-03.strategy.json`.

The format, the command that generates the schemas again, the limits and the consistency check
are described in the technical documentation of the library:
[docs/technical/pipwerk-domain.md](../../docs/technical/pipwerk-domain.md).
