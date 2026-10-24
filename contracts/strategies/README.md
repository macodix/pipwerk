# Strategy Contracts

Versioned schemas and test case documents for stored and exchanged strategy definitions. The library writes the format 2.0 and reads the format 1.0 by converting it.

- `v2/`: schemas of the format 2.0; the test case documents `str-01` (with the `ZigZag`) and `str-03` in `testcases/`, both without a finding of the consistency check; and example documents in `examples/` for trying out the web API through `/docs`: two rule templates and eleven changed versions of `str-03`, each with one change that causes one finding (steps in `docs/technical/pipwerk-studio.md`, "Web-API ausprobieren"). The schemas are generated from the models of the library (`docs/technical/pipwerk-domain.md`, section 10.2).
- `v1/`: schemas of the format 1.0, unchanged; its `testcases/` and `examples/` are test data for reading the old format (the document 1.0 of `str-01` uses the indicator `Markttechnik`, which is no longer delivered and stays an unknown type when read).

Documentation: [docs/technical/pipwerk-domain.md](../../docs/technical/pipwerk-domain.md) (object model, namespace, expressions, consistency check with all findings, format 2.0 and reading 1.0, sections 5, 6, 9 and 10)
