"""The JSON schema of the operating configuration, generated from the model.

Usage::

    pipwerk-relay-schemas <directory>          writes relay-config.schema.json
    pipwerk-relay-schemas --check <directory>  reports a file that differs

The schema under ``contracts/messages/v1/`` is the file that this module writes. The schemas of
the messages themselves come from the library (``pipwerk-relaycore-schemas``).
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from pipwerk_relay.operating import RelayConfig

SCHEMA_DIALECT = "https://json-schema.org/draft/2020-12/schema"
SCHEMA_FILE_NAME = "relay-config.schema.json"


def generate_schema() -> dict[str, Any]:
    """The JSON schema of the operating configuration."""
    return {"$schema": SCHEMA_DIALECT, **RelayConfig.model_json_schema()}


def render_schema() -> str:
    """The text of the schema file: JSON, indented, with a final line feed."""
    return json.dumps(generate_schema(), indent=2, ensure_ascii=False) + "\n"


def write_schema(directory: Path) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / SCHEMA_FILE_NAME
    path.write_text(render_schema(), encoding="utf-8")
    return path


def schema_differs(directory: Path) -> bool:
    path = directory / SCHEMA_FILE_NAME
    return not path.is_file() or path.read_text(encoding="utf-8") != render_schema()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="pipwerk-relay-schemas",
        description="Generate the JSON schema of the operating configuration of pipwerk relay.",
    )
    parser.add_argument("directory", type=Path, help="directory of the schema file")
    parser.add_argument("--check", action="store_true", help="only report a file that differs")
    arguments = parser.parse_args(argv)
    if arguments.check:
        if schema_differs(arguments.directory):
            print(f"schema differs from the model: {SCHEMA_FILE_NAME}", file=sys.stderr)
            return 1
        return 0
    print(write_schema(arguments.directory))
    return 0


if __name__ == "__main__":
    sys.exit(main())
