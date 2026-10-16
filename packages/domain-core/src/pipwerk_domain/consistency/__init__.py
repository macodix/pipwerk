"""Consistency check of strategies and templates (specification 3.6)."""

from pipwerk_domain.consistency.engine import Checker
from pipwerk_domain.consistency.findings import Finding, Level
from pipwerk_domain.defaults import default_registry
from pipwerk_domain.model import Strategy, Template
from pipwerk_domain.registry import ElementRegistry


def check_strategy(strategy: Strategy, registry: ElementRegistry | None = None) -> list[Finding]:
    """Check a strategy and return all findings, errors and hints."""
    return Checker(default_registry() if registry is None else registry).check_strategy(strategy)


def check_template(template: Template, registry: ElementRegistry | None = None) -> list[Finding]:
    """Check a template (indicator, trend, rule or ruleset) and return all findings."""
    return Checker(default_registry() if registry is None else registry).check_template(template)


__all__ = ["Finding", "Level", "check_strategy", "check_template"]
