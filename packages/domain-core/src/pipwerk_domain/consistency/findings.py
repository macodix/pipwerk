"""Findings of the consistency check (specification 3.6).

A finding has a level, an identifier, the affected element and the affected instance or rule
(or none of them) and data for the text. The library produces no texts (req-ui-007);
the user interface writes them from the identifier and the data.
"""

from dataclasses import dataclass, field
from enum import StrEnum


class Level(StrEnum):
    ERROR = "error"
    HINT = "hint"


# Identifiers of the findings of the table in specification 3.6
STRATEGY_NO_TRIGGER = "strategy.no_trigger"
TRIGGER_UNCONNECTED = "trigger.unconnected"
FLOW_NO_INCOMING = "flow.no_incoming"
EXPRESSION_INVALID = "expression.invalid"
RULE_RESULT_MISMATCH = "rule.result_mismatch"
FLOW_UNENDING_LOOP = "flow.unending_loop"
PARAMETER_MISSING = "parameter.missing"
ORDER_PROPERTY_MISSING = "order.property_missing"
RULESET_REFERENCE_ORDER = "ruleset.reference_order"
EXPRESSION_ORDER_OUTSIDE_MANAGEMENT = "expression.order_outside_management"
RULE_ORDER_IN_INDICATOR = "rule.order_in_indicator"
CANDLE_NO_INSTANCE = "candle.no_instance"
FLOW_MANAGEMENT_ONLY = "flow.management_only"
NAME_DUPLICATE = "name.duplicate"
TYPE_UNKNOWN = "type.unknown"
FLOW_NO_ORDER_REACHABLE = "flow.no_order_reachable"

# Further findings that the table does not list but the check needs
RULE_UNRESOLVED_NAME = "rule.unresolved_name"  # hint for a rule template (specification 3.4)
CONNECTION_INVALID = "connection.invalid"
PARAMETER_BINDING_INVALID = "parameter.binding_invalid"
NAME_INVALID = "name.invalid"
ELEMENT_RULES_NOT_ALLOWED = "element.rules_not_allowed"
ELEMENT_MANAGEMENT_INVALID = "element.management_invalid"
RULE_INVALID_TYPE = "rule.invalid_type"
RULE_COMPARISON_MISSING = "rule.comparison_missing"
TREND_DIRECTION_MISSING = "trend.direction_missing"
CALCULATION_CIRCULAR = "calculation.circular_reference"
FINDINGS_TRUNCATED = "findings.truncated"


@dataclass(frozen=True, slots=True)
class Finding:
    """A finding of the consistency check.

    ``element`` is the identifier of the affected element; ``subject`` names the affected
    instance or rule: the name, and for a part inside another instance the names joined
    with points (``regelwerk.regel``). Both are ``None`` if the finding concerns neither.
    ``details`` are the data for the text; for a faulty expression they include ``field``
    (which expression), ``start`` and ``end`` (character positions), ``issue`` and ``reason``.
    """

    level: Level
    code: str
    element: str | None = None
    subject: str | None = None
    details: dict[str, object] = field(default_factory=dict)

    def to_dict(self) -> dict[str, object]:
        return {
            "level": self.level.value,
            "code": self.code,
            "element": self.element,
            "subject": self.subject,
            "details": dict(self.details),
        }
