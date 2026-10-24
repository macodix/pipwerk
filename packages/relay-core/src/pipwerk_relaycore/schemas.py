"""The JSON schemas of the message formats, generated from the models.

Usage::

    pipwerk-relaycore-schemas <directory>          writes the schema files
    pipwerk-relaycore-schemas --check <directory>  reports schema files that differ

The schemas under ``contracts/messages/v1/`` are the files that this module writes.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from pipwerk_relaycore.contents import CONTENT_MODELS
from pipwerk_relaycore.envelope import Envelope, EnvelopeBody
from pipwerk_relaycore.message import Message

SCHEMA_DIALECT = "https://json-schema.org/draft/2020-12/schema"
SCHEMA_NAMES = ("message", "envelope", *CONTENT_MODELS)
"""The schemas by name; the file is ``<name>.schema.json``.

Besides the message and the envelope there is one schema for the content of each kind of message
that the library knows (``relay.receipt``, ``relay.undeliverable``, ``probe.message``)."""


def schema_file_name(name: str) -> str:
    return f"{name}.schema.json"


def generate_schema(name: str) -> dict[str, Any]:
    """The JSON schema of a format.

    The schema ``envelope`` holds the structure of the body under ``$defs/Body``: the body is a
    text, so a JSON schema validator cannot check it in place; a reader checks the parsed body
    against ``#/$defs/Body``.
    """
    if name == "message":
        return {"$schema": SCHEMA_DIALECT, **Message.model_json_schema()}
    if name == "envelope":
        schema = Envelope.model_json_schema()
        body = EnvelopeBody.model_json_schema()
        definitions: dict[str, Any] = {**schema.get("$defs", {}), **body.pop("$defs", {})}
        definitions["Body"] = body
        schema["$defs"] = definitions
        return {"$schema": SCHEMA_DIALECT, **schema}
    if name in CONTENT_MODELS:
        return {"$schema": SCHEMA_DIALECT, **CONTENT_MODELS[name].model_json_schema()}
    raise KeyError(name)


def render_schema(name: str) -> str:
    """The text of the schema file: JSON, indented, with a final line feed."""
    return json.dumps(generate_schema(name), indent=2, ensure_ascii=False) + "\n"


def write_schemas(directory: Path) -> list[Path]:
    """Write all schema files into a directory (created if needed)."""
    directory.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for name in SCHEMA_NAMES:
        path = directory / schema_file_name(name)
        path.write_text(render_schema(name), encoding="utf-8")
        written.append(path)
    return written


def differing_schemas(directory: Path) -> list[str]:
    """Names of the schemas whose file is missing or differs from the generated text."""
    differing: list[str] = []
    for name in SCHEMA_NAMES:
        path = directory / schema_file_name(name)
        if not path.is_file() or path.read_text(encoding="utf-8") != render_schema(name):
            differing.append(name)
    return differing


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="pipwerk-relaycore-schemas",
        description="Generate the JSON schemas of the message formats of pipwerk relay.",
    )
    parser.add_argument("directory", type=Path, help="directory of the schema files")
    parser.add_argument("--check", action="store_true", help="only report schema files that differ")
    arguments = parser.parse_args(argv)
    if arguments.check:
        differing = differing_schemas(arguments.directory)
        for name in differing:
            print(f"schema differs from the models: {name}", file=sys.stderr)
        return 1 if differing else 0
    for path in write_schemas(arguments.directory):
        print(path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
