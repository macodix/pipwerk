"""Normalization of all expressions of a strategy or a template.

The expressions are stored in the normalized spelling (specification 3.4): names in the
spelling of their identifier, functions in the spelling of the norm. These functions apply
:func:`pipwerk_domain.expressions.normalize_expression` to every expression of a document,
each in the namespace where it stands.
"""

from copy import deepcopy

from pipwerk_domain.consistency.engine import Checker
from pipwerk_domain.defaults import default_registry
from pipwerk_domain.model import (
    Binding,
    ObjectContent,
    PropertyDefinition,
    Strategy,
    Template,
)
from pipwerk_domain.registry import ElementRegistry


def _apply(owner: object, field: str, text: str) -> None:
    if isinstance(owner, Binding):
        owner.value = text
    elif isinstance(owner, PropertyDefinition):
        owner.expression = text
    elif isinstance(owner, ObjectContent):
        if field == "result_expression":
            owner.result_expression = text
        else:
            owner.expression = text


def normalize_strategy(strategy: Strategy, registry: ElementRegistry | None = None) -> Strategy:
    """A copy of the strategy with all expressions in the normalized spelling. An expression
    with a syntax problem and names that are not recognized stay as they are."""
    result = deepcopy(strategy)
    checker = Checker(default_registry() if registry is None else registry)
    checker.check_strategy(result)
    for owner, field, text in checker.normalizations():
        _apply(owner, field, text)
    return result


def normalize_template(template: Template, registry: ElementRegistry | None = None) -> Template:
    """A copy of the template with all expressions in the normalized spelling."""
    result = deepcopy(template)
    checker = Checker(default_registry() if registry is None else registry)
    checker.check_template(result)
    for owner, field, text in checker.normalizations():
        _apply(owner, field, text)
    return result
