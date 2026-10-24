"""The JSON schemas of the contents of the retrieval, generated from the models.

Usage (from the directory of the component, with its environment)::

    python -m pipwerk_fetch_mt5.relay.schemas <directory>          writes the schema files
    python -m pipwerk_fetch_mt5.relay.schemas --check <directory>  reports files that differ

The schemas under ``contracts/messages/v1/`` (``fetch.request.schema.json``,
``fetch.file.schema.json``, ``fetch.result.schema.json``) are the files that this module writes.
The format is that of the schemas of the library of pipwerk relay (JSON Schema 2020-12, indented,
a final line feed).
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Any

from pipwerk_fetch_mt5.relay.contents import CONTENT_MODELS

SCHEMA_DIALECT = "https://json-schema.org/draft/2020-12/schema"


def schema_file_name(kind: str) -> str:
    return f"{kind}.schema.json"


def generate_schema(kind: str) -> dict[str, Any]:
    """The JSON schema of the content of a kind of message."""
    return {"$schema": SCHEMA_DIALECT, **CONTENT_MODELS[kind].model_json_schema()}


def render_schema(kind: str) -> str:
    return json.dumps(generate_schema(kind), indent=2, ensure_ascii=False) + "\n"


def write_schemas(directory: Path) -> list[Path]:
    """Write all schema files into a directory (created if needed)."""
    directory.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for kind in CONTENT_MODELS:
        path = directory / schema_file_name(kind)
        path.write_text(render_schema(kind), encoding="utf-8")
        written.append(path)
    return written


def differing_schemas(directory: Path) -> list[str]:
    """The kinds whose schema file is missing or differs from the generated text."""
    return [
        kind
        for kind in CONTENT_MODELS
        if not (directory / schema_file_name(kind)).is_file()
        or (directory / schema_file_name(kind)).read_text(encoding="utf-8") != render_schema(kind)
    ]


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m pipwerk_fetch_mt5.relay.schemas",
        description="Write the JSON schemas of the contents of fetch.request, fetch.file and "
        "fetch.result.",
    )
    parser.add_argument("directory", type=Path)
    parser.add_argument("--check", action="store_true", help="Only report files that differ.")
    args = parser.parse_args(argv)
    if args.check:
        differing = differing_schemas(args.directory)
        for kind in differing:
            print(f"differs: {schema_file_name(kind)}", file=sys.stderr)
        return 1 if differing else 0
    for path in write_schemas(args.directory):
        print(f"written: {path.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
