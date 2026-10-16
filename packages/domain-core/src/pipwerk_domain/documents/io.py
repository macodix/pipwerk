"""Reading and writing documents as JSON text."""

import json
from typing import Annotated

from pydantic import Field, TypeAdapter, ValidationError

from pipwerk_domain.documents.convert import from_document, to_document
from pipwerk_domain.documents.models import (
    AnyDocument,
    IndicatorDocument,
    RuleDocument,
    RulesetDocument,
    StrategyDocument,
    TrendDocument,
)
from pipwerk_domain.model import Strategy, Template

DocumentError = ValidationError
"""The error for a document that does not fit the format: a missing or additional field, a
wrong type, a higher major version or an exceeded limit."""

_ADAPTER: TypeAdapter[AnyDocument] = TypeAdapter(
    Annotated[
        StrategyDocument | IndicatorDocument | TrendDocument | RuleDocument | RulesetDocument,
        Field(discriminator="format"),
    ]
)

_HEAD = ("format", "format_version", "id", "title", "description", "object_type")


def parse_document(data: str | bytes | dict[str, object]) -> AnyDocument:
    """Validate a document given as JSON text or as the parsed JSON object.

    Raises :class:`DocumentError` (a Pydantic ``ValidationError``) if it does not fit.
    """
    if isinstance(data, dict):
        return _ADAPTER.validate_python(data, strict=True)
    return _ADAPTER.validate_json(data, strict=True)


def read_document(data: str | bytes) -> Strategy | Template:
    """Read a document and translate it into the object model."""
    return from_document(parse_document(data))


def document_to_json(document: AnyDocument) -> str:
    """The JSON text of a document: the head fields (``format``, ``format_version``, ``id``,
    ``title``, ``description``, ``object_type``) first, then the other fields in the order
    of the model, indented, with a final line feed."""
    data = document.model_dump(mode="json")
    ordered = {key: data[key] for key in _HEAD if key in data}
    ordered.update({key: value for key, value in data.items() if key not in _HEAD})
    return json.dumps(ordered, indent=2, ensure_ascii=False) + "\n"


def write_document(value: Strategy | Template) -> str:
    """Translate a strategy or template into a document and write it as JSON text."""
    return document_to_json(to_document(value))
