# Strategy Contracts

Versioned schemas and test case documents for stored and exchanged strategy definitions.

- `v1/testcases/`: the test case documents `str-01` and `str-03`.
- `v1/examples/`: example documents for trying out the web API through `/docs`: a rule template with a changed version, and seven changed versions of `str-03` that provoke one finding each. The user documentation `docs/user/pipwerk-studio.md` ("Web-API ausprobieren") describes the steps; the backend tests `test_user_documentation_examples.py` check them.

Documentation: [docs/technical/pipwerk-domain.md](../../docs/technical/pipwerk-domain.md)
