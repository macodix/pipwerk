"""The register with the delivered types and the types of other packages, and the delivered
templates."""

from dataclasses import dataclass
from functools import lru_cache

from pipwerk_domain.catalog import register_delivered_types
from pipwerk_domain.model import Template
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.risk_rule import (
    RISK_PER_TRADE_EXPLANATION,
    RISK_PER_TRADE_LABEL,
    risk_per_trade_template,
)
from pipwerk_domain.typedesc import Group, Label


def create_registry(*, entry_points: bool = True) -> ElementRegistry:
    """A new register with the delivered types and, if wanted, the types that other
    packages register under the entry point group ``pipwerk.element_types``."""
    registry = ElementRegistry()
    register_delivered_types(registry)
    if entry_points:
        registry.load_entry_points()
    return registry


@lru_cache(maxsize=1)
def default_registry() -> ElementRegistry:
    """The register of this process, created on first use."""
    return create_registry()


def builtin_templates() -> tuple[Template, ...]:
    """The delivered templates (E6): "Risiko je Trade". Every call returns new objects.
    They are the same in every installation and are not stored in an object directory."""
    return (risk_per_trade_template(),)


@dataclass(frozen=True, slots=True)
class TemplateTexts:
    """The texts of a delivered template in German and English: the document stores one
    name only, the user interface shows the name in the chosen language (specification 3.7)."""

    template_id: str
    name: Label
    explanation: Label
    group: Group


def builtin_template_texts() -> tuple[TemplateTexts, ...]:
    """The names and explanations of the delivered templates, in the order of
    :func:`builtin_templates`."""
    template = risk_per_trade_template()
    return (
        TemplateTexts(template.id, RISK_PER_TRADE_LABEL, RISK_PER_TRADE_EXPLANATION, Group.RULES),
    )
