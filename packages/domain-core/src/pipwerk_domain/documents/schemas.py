"""JSON schemas of the document formats, generated from the Pydantic models.

The files under ``contracts/strategies/v1/`` are generated with::

    python -m pipwerk_domain.documents.schemas <directory>

``--check`` writes nothing and ends with exit code 1 if a file differs from the models.
"""

import argparse
import json
import sys
from pathlib import Path

from pipwerk_domain.documents.models import (
    AnyDocument,
    IndicatorDocument,
    RuleDocument,
    RulesetDocument,
    StrategyDocument,
    TrendDocument,
)

SCHEMA_DIALECT = "https://json-schema.org/draft/2020-12/schema"

SCHEMA_MODELS: dict[str, type[AnyDocument]] = {
    "strategy": StrategyDocument,
    "indicator": IndicatorDocument,
    "trend": TrendDocument,
    "rule": RuleDocument,
    "ruleset": RulesetDocument,
}
"""The models by name of the schema; the file is ``<name>.schema.json``."""


def schema_file_name(name: str) -> str:
    return f"{name}.schema.json"


def generate_schema(name: str) -> dict[str, object]:
    """The JSON schema of a document format."""
    schema = SCHEMA_MODELS[name].model_json_schema()
    return {"$schema": SCHEMA_DIALECT, **schema}


def render_schema(name: str) -> str:
    """The text of the schema file: JSON, indented, with a final line feed."""
    return json.dumps(generate_schema(name), indent=2, ensure_ascii=False) + "\n"


def write_schemas(directory: Path) -> list[Path]:
    """Write all schema files into a directory (created if needed)."""
    directory.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for name in SCHEMA_MODELS:
        path = directory / schema_file_name(name)
        path.write_text(render_schema(name), encoding="utf-8")
        written.append(path)
    return written


def differing_schemas(directory: Path) -> list[str]:
    """Names of the schemas whose file is missing or differs from the generated text."""
    result: list[str] = []
    for name in SCHEMA_MODELS:
        path = directory / schema_file_name(name)
        if not path.is_file() or path.read_text(encoding="utf-8") != render_schema(name):
            result.append(name)
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="pipwerk-domain-schemas",
        description="Generate the JSON schemas of the strategy documents.",
    )
    parser.add_argument("directory", type=Path, help="directory of the schema files")
    parser.add_argument("--check", action="store_true", help="only compare, write nothing")
    arguments = parser.parse_args(argv)
    if arguments.check:
        differing = differing_schemas(arguments.directory)
        for name in differing:
            print(f"schema differs from the models: {name}", file=sys.stderr)
        return 1 if differing else 0
    for path in write_schemas(arguments.directory):
        print(f"written: {path.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
