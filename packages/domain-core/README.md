# Domain Core

Shared Python domain model and domain logic (package `pipwerk_domain`): type descriptions and
the element register, the object model, expressions with type check, the consistency check and
the reading and writing of strategy documents.

Technical documentation: [docs/technical/pipwerk-domain.md](../../docs/technical/pipwerk-domain.md)
(structure, object model, identifiers, namespaces, expressions, findings, document format,
limits, checks with commands, dependencies).

Checks (in this directory, each ends with exit code 0):

```sh
uv sync --frozen
uv run --frozen pytest
uv run --frozen ruff check
uv run --frozen ruff format --check
uv run --frozen mypy
```
