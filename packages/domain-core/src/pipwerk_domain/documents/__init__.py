"""Documents (specification 3.7): the only package that uses Pydantic. The library writes the
format 2.0 and reads the formats 2.0 and 1.0 (the latter by converting it)."""

from pipwerk_domain.documents.convert import (
    from_document,
    strategy_from_document,
    strategy_to_document,
    template_from_document,
    template_to_document,
    to_document,
)
from pipwerk_domain.documents.io import (
    DocumentError,
    document_to_json,
    parse_document,
    read_document,
    write_document,
)
from pipwerk_domain.documents.models import (
    DOCUMENT_MODELS,
    FORMAT_VERSION,
    SUPPORTED_MAJOR_VERSION,
    AnyDocument,
    IndicatorDocument,
    RuleDocument,
    RulesetDocument,
    StrategyDocument,
    TrendDocument,
)
from pipwerk_domain.documents.upgrade import upgrade_document

__all__ = [
    "DOCUMENT_MODELS",
    "FORMAT_VERSION",
    "SUPPORTED_MAJOR_VERSION",
    "AnyDocument",
    "DocumentError",
    "IndicatorDocument",
    "RuleDocument",
    "RulesetDocument",
    "StrategyDocument",
    "TrendDocument",
    "document_to_json",
    "from_document",
    "parse_document",
    "read_document",
    "strategy_from_document",
    "strategy_to_document",
    "template_from_document",
    "template_to_document",
    "to_document",
    "upgrade_document",
    "write_document",
]
