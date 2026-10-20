"""JSON schemas of the document formats, generated from the Pydantic models.

The files under ``contracts/strategies/v2/`` are generated from the models of the format 2.0,
the files under ``contracts/strategies/v1/`` from the models of the format 1.0 (which the
library only reads), with::

    python -m pipwerk_domain.documents.schemas [--format-version 1|2] <directory>

``--check`` writes nothing and ends with exit code 1 if a file differs from the models.
"""

import argparse
import json
import sys
from pathlib import Path

from pipwerk_domain.documents import models as models_v2
from pipwerk_domain.documents import v1 as models_v1

SCHEMA_DIALECT = "https://json-schema.org/draft/2020-12/schema"

type SchemaModels = dict[str, type[models_v2.AnyDocument] | type[models_v1.AnyDocument]]

SCHEMA_MODELS_BY_VERSION: dict[int, SchemaModels] = {
    2: {
        "strategy": models_v2.StrategyDocument,
        "indicator": models_v2.IndicatorDocument,
        "trend": models_v2.TrendDocument,
        "rule": models_v2.RuleDocument,
        "ruleset": models_v2.RulesetDocument,
    },
    1: {
        "strategy": models_v1.StrategyDocument,
        "indicator": models_v1.IndicatorDocument,
        "trend": models_v1.TrendDocument,
        "rule": models_v1.RuleDocument,
        "ruleset": models_v1.RulesetDocument,
    },
}
"""The models by major version of the format and by name of the schema; the file is
``<name>.schema.json``."""

SCHEMA_MODELS = SCHEMA_MODELS_BY_VERSION[2]
"""The models of the format that the library writes."""


def schema_file_name(name: str) -> str:
    return f"{name}.schema.json"


def generate_schema(name: str, version: int = 2) -> dict[str, object]:
    """The JSON schema of a document format."""
    schema = SCHEMA_MODELS_BY_VERSION[version][name].model_json_schema()
    return {"$schema": SCHEMA_DIALECT, **schema}


def render_schema(name: str, version: int = 2) -> str:
    """The text of the schema file: JSON, indented, with a final line feed."""
    return json.dumps(generate_schema(name, version), indent=2, ensure_ascii=False) + "\n"


def write_schemas(directory: Path, version: int = 2) -> list[Path]:
    """Write all schema files into a directory (created if needed)."""
    directory.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for name in SCHEMA_MODELS_BY_VERSION[version]:
        path = directory / schema_file_name(name)
        path.write_text(render_schema(name, version), encoding="utf-8")
        written.append(path)
    return written


def differing_schemas(directory: Path, version: int = 2) -> list[str]:
    """Names of the schemas whose file is missing or differs from the generated text."""
    result: list[str] = []
    for name in SCHEMA_MODELS_BY_VERSION[version]:
        path = directory / schema_file_name(name)
        if not path.is_file() or path.read_text(encoding="utf-8") != render_schema(name, version):
            result.append(name)
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="pipwerk-domain-schemas",
        description="Generate the JSON schemas of the strategy documents.",
    )
    parser.add_argument("directory", type=Path, help="directory of the schema files")
    parser.add_argument("--check", action="store_true", help="only compare, write nothing")
    parser.add_argument(
        "--format-version",
        type=int,
        choices=sorted(SCHEMA_MODELS_BY_VERSION),
        default=2,
        help="major version of the document format (default 2)",
    )
    arguments = parser.parse_args(argv)
    version: int = arguments.format_version
    if arguments.check:
        differing = differing_schemas(arguments.directory, version)
        for name in differing:
            print(f"schema differs from the models: {name}", file=sys.stderr)
        return 1 if differing else 0
    for path in write_schemas(arguments.directory, version):
        print(f"written: {path.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
