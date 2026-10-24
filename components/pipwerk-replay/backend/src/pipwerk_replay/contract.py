"""The description of the web API of pipwerk replay under ``contracts/api/``.

The description (OpenAPI) is generated from the application and limited to the
paths below ``/api/v1/``: the technical endpoint ``/api/health`` stays visible in ``/docs`` but
is not part of the contract. Only the schemas that the paths use are kept.

The command writes the file or, with ``--check``, compares it::

    python -m pipwerk_replay.contract [--check] <file>

The application is created with a database in memory, so the command needs no startup
configuration and writes nothing else.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Any

from pipwerk_replay.api_support import is_public_path
from pipwerk_replay.app import create_app

CONTRACT_VERSION = "1.0.0"
CONTRACT_DESCRIPTION = (
    "Web API of pipwerk replay, version 1: the test accounts and the data stock of historical "
    "price data (list of series, details, brokers, import processes with one request per file, "
    "uploaded or read from the import directory, the listing of the import directory, "
    "deleting with a preview of what is deleted, completeness). "
    "Data come into the data stock only through the import. "
    "The paths below /api/v1/ are versioned; the technical endpoint /api/health and the "
    "internal endpoints below /api/replay/ (settings, revision) are not part of this "
    "description."
)


def _references(node: Any) -> set[str]:
    """The names of the schemas that a part of the description refers to."""
    found: set[str] = set()
    stack: list[Any] = [node]
    prefix = "#/components/schemas/"
    while stack:
        item = stack.pop()
        if isinstance(item, dict):
            for key, value in item.items():
                if key == "$ref" and isinstance(value, str) and value.startswith(prefix):
                    found.add(value.removeprefix(prefix))
                else:
                    stack.append(value)
        elif isinstance(item, list):
            stack.extend(item)
    return found


def public_description(description: dict[str, Any]) -> dict[str, Any]:
    """Limit the description of the application to the paths below ``/api/v1/`` and the
    schemas and tags they use."""
    paths = {
        path: operations
        for path, operations in description["paths"].items()
        if is_public_path(path)
    }
    schemas: dict[str, Any] = description.get("components", {}).get("schemas", {})
    used: set[str] = set()
    pending = _references(paths)
    while pending:
        name = pending.pop()
        if name in used:
            continue
        used.add(name)
        pending |= _references(schemas[name]) - used
    tags = sorted(
        {
            tag
            for operations in paths.values()
            for operation in operations.values()
            for tag in operation.get("tags", [])
        }
    )
    return {
        "openapi": description["openapi"],
        "info": {
            "title": description["info"]["title"],
            "version": CONTRACT_VERSION,
            "description": CONTRACT_DESCRIPTION,
        },
        "paths": paths,
        "components": {"schemas": {name: schemas[name] for name in sorted(used)}},
        "tags": [{"name": tag} for tag in tags],
    }


def generate() -> str:
    """The text of the description file generated from the application."""
    app = create_app("sqlite:///:memory:")
    description = public_description(app.openapi())
    return json.dumps(description, indent=2, ensure_ascii=False) + "\n"


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m pipwerk_replay.contract",
        description="Write the description of the web API generated from the application.",
    )
    parser.add_argument("--check", action="store_true", help="only compare, write nothing")
    parser.add_argument("file", type=Path, help="the description file")
    arguments = parser.parse_args(argv)
    text = generate()
    file: Path = arguments.file
    if arguments.check:
        current = file.read_text(encoding="utf-8") if file.is_file() else None
        if current != text:
            print(f"{file.name} differs from the application", file=sys.stderr)
            return 1
        return 0
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(text, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
