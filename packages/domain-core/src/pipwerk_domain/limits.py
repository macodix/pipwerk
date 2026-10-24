"""Limits against overload (specification section 8, OWASP API4)."""

MAX_DOCUMENT_BYTES = 2 * 1024 * 1024
"""Size of a document in bytes. The backend checks it before reading the document."""

MAX_EXPRESSION_LENGTH = 4096
"""Length of an expression in characters."""

MAX_EXPRESSION_NESTING = 64
"""Nesting of an expression: parentheses and function calls inside each other."""

MAX_BLOCK_DEPTH = 200
"""Nesting of blocks: levels of an expression as a tree of blocks, in a request and in an
answer of ``/api/v1/expressions``. An expression that makes a deeper tree (for example a sum of
very many terms) is answered without blocks, and the answer says so."""

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

MAX_NAMES_PER_CHECK = 20000
"""Recognized names that one check hands back when it is asked for them (web API
``/api/v1/check``). Further names are dropped and the result says so."""

MAX_NAME_LENGTH = 200
"""Characters of a name (of a strategy, strategy parameter, element, instance, section,
own parameter or property, or template)."""

MAX_KEY_LENGTH = 200
"""Characters of a key in an expression."""

MAX_INPUTS_PER_ELEMENT = 50
"""Inputs of one element."""

MAX_INPUT_ARGUMENTS = 20
"""Values of arguments in one input that names a method."""

MAX_ITEMS_PER_REQUEST = 50
"""Items of one request to ``/api/v1/expressions``."""

MAX_NAMES_PER_ITEM = 500
"""Visible names that the answer to an item of ``/api/v1/expressions`` lists. Further names
are dropped and the answer says so."""

MAX_PROPERTIES_PER_NAME = 200
"""Properties that the answer lists for one visible name. Further properties are dropped and
the answer says so."""
