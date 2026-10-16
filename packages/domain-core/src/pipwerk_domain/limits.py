"""Limits against overload (specification section 8, OWASP API4)."""

MAX_DOCUMENT_BYTES = 2 * 1024 * 1024
"""Size of a document in bytes. The backend checks it before reading the document."""

MAX_EXPRESSION_LENGTH = 4096
"""Length of an expression in characters."""

MAX_EXPRESSION_NESTING = 64
"""Nesting of an expression: parentheses and function calls inside each other."""

MAX_ELEMENTS = 1000
"""Elements of a strategy."""

MAX_CONNECTIONS = 4000
"""Connections of a strategy."""

MAX_RULES_PER_LIST = 200
"""Rules in one list (of a strategy, an element, an indicator, a trend or a ruleset)."""

MAX_STRATEGY_PARAMETERS = 200
"""Strategy parameters of a strategy."""

MAX_INSTANCE_NESTING = 16
"""Levels of instances inside instances. The instance of an element is level 1."""

MAX_FINDINGS_PER_EXPRESSION = 50
"""Findings reported for one expression. Further findings of the expression are dropped and
the finding ``findings.truncated`` is added."""

MAX_FINDINGS_PER_CHECK = 1000
"""Findings of one check of a strategy or template. At the limit the check ends and adds the
finding ``findings.truncated``."""
