"""Reading and writing documents as JSON text."""

import json
import re
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

_SURROGATE = re.compile("[\ud800-\udfff]")
_BYTE_ORDER_MARKS = (b"\xef\xbb\xbf", b"\xff\xfe", b"\xfe\xff")

_HEAD = ("format", "format_version", "id", "title", "description", "object_type")


def parse_document(data: str | bytes | dict[str, object]) -> AnyDocument:
    """Validate a document given as JSON text or as the parsed JSON object.

    Raises :class:`DocumentError` (a Pydantic ``ValidationError``) if it does not fit.
    """
    if isinstance(data, str | bytes):
        data = _load_json(data)  # type: ignore[assignment]
    _reject_lone_surrogates(data)
    return _ADAPTER.validate_python(data, strict=True)


def _reject_lone_surrogates(data: object) -> None:
    """A text with a single surrogate (U+D800 to U+DFFF without a partner, also written as
    an escape) is no text; it could not be written as UTF-8."""
    stack: list[object] = [data]
    while stack:
        item = stack.pop()
        if isinstance(item, str):
            if _SURROGATE.search(item) is not None:
                raise _error("a text with a single surrogate character")
        elif isinstance(item, dict):
            stack.extend(item.keys())
            stack.extend(item.values())
        elif isinstance(item, list):
            stack.extend(item)


def _error(message: str) -> ValidationError:
    return ValidationError.from_exception_data(
        "Document",
        [{"type": "value_error", "loc": (), "input": None, "ctx": {"error": ValueError(message)}}],
    )


def _object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate key in a JSON object")
        result[key] = value
    return result


def _constant(name: str) -> object:
    raise ValueError(f"{name} is no JSON value")


def _load_json(data: str | bytes) -> object:
    """Parse JSON text strictly: no ``NaN``, ``Infinity`` or ``-Infinity``, no key twice in
    an object. Any problem is a validation error."""
    try:
        if isinstance(data, bytes):
            # UTF-8 without a byte order mark; other encodings are no documents
            if data.startswith(_BYTE_ORDER_MARKS):
                raise ValueError("a byte order mark is not allowed")
            data = data.decode("utf-8")
        return json.loads(data, object_pairs_hook=_object, parse_constant=_constant)
    except (ValueError, RecursionError) as error:
        raise _error(str(error) if isinstance(error, ValueError) else "nested too deep") from None


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
    text = json.dumps(ordered, indent=2, ensure_ascii=False, allow_nan=False) + "\n"
    if _SURROGATE.search(text) is not None:
        raise _error("a text with a single surrogate character")
    return text


def write_document(value: Strategy | Template) -> str:
    """Translate a strategy or template into a document and write it as JSON text."""
    return document_to_json(to_document(value))
