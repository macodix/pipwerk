"""Consistency check of strategies and templates (specification 3.6)."""

from pipwerk_domain.consistency.engine import Checker, ExpressionContext
from pipwerk_domain.consistency.findings import (
    CheckResult,
    ExpressionNames,
    Finding,
    Level,
    NameOccurrence,
    NameSegment,
)
from pipwerk_domain.defaults import default_registry
from pipwerk_domain.model import Strategy, Template
from pipwerk_domain.registry import ElementRegistry


def check_strategy(strategy: Strategy, registry: ElementRegistry | None = None) -> list[Finding]:
    """Check a strategy and return all findings, errors and hints."""
    return Checker(default_registry() if registry is None else registry).check_strategy(strategy)


def check_template(template: Template, registry: ElementRegistry | None = None) -> list[Finding]:
    """Check a template (indicator, trend, rule or ruleset) and return all findings."""
    return Checker(default_registry() if registry is None else registry).check_template(template)


def check_strategy_with_names(
    strategy: Strategy, registry: ElementRegistry | None = None
) -> CheckResult:
    """Check a strategy and return the findings and, for each expression, the names it
    recognized (what the check endpoint of the web API returns)."""
    checker = Checker(default_registry() if registry is None else registry, collect_names=True)
    findings = checker.check_strategy(strategy)
    return CheckResult(findings, checker.expression_names, checker.names_truncated)


def check_template_with_names(
    template: Template, registry: ElementRegistry | None = None
) -> CheckResult:
    """Check a template and return the findings and, for each expression, the names it
    recognized."""
    checker = Checker(default_registry() if registry is None else registry, collect_names=True)
    findings = checker.check_template(template)
    return CheckResult(findings, checker.expression_names, checker.names_truncated)


def check_with_contexts(
    value: Strategy | Template, registry: ElementRegistry | None = None
) -> Checker:
    """Check a strategy or template and keep the context of every place of an expression by its
    JSON pointer (``Checker.contexts``): what the endpoint of the expressions needs."""
    checker = Checker(default_registry() if registry is None else registry, record_contexts=True)
    if isinstance(value, Strategy):
        checker.check_strategy(value)
    else:
        checker.check_template(value)
    return checker


__all__ = [
    "CheckResult",
    "Checker",
    "ExpressionContext",
    "ExpressionNames",
    "Finding",
    "Level",
    "NameOccurrence",
    "NameSegment",
    "check_strategy",
    "check_strategy_with_names",
    "check_template",
    "check_template_with_names",
    "check_with_contexts",
]
