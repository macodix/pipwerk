"""An expression read as a sentence in German or English (specification 3.4, 5.3, 5.4): what
the drawing area and the property view show for an expression, for example "EMA 20 ist größer
als EMA 50"."""

from pipwerk_domain.expressions.blocks import Block, BlockKind
from pipwerk_domain.expressions.exprtypes import ExprType, labels_of, type_of
from pipwerk_domain.expressions.symbols import SymbolKind

_COMPARISON = {
    "=": ("ist gleich", "equals"),
    "<>": ("ist ungleich", "does not equal"),
    ">": ("ist größer als", "is greater than"),
    ">=": ("ist größer oder gleich", "is greater than or equal to"),
    "<": ("ist kleiner als", "is less than"),
    "<=": ("ist kleiner oder gleich", "is less than or equal to"),
}
_ARITHMETIC = {
    "+": ("plus", "plus"),
    "-": ("minus", "minus"),
    "*": ("mal", "times"),
    "/": ("geteilt durch", "divided by"),
    "^": ("hoch", "to the power of"),
    "&": ("verbunden mit", "joined with"),
}
_ARITHMETIC_PRECEDENCE = {"&": 2, "+": 3, "-": 3, "*": 4, "/": 4, "^": 5}
_VALUE_PROPERTIES = ("wert", "ergebnis")
_EMPTY = "…"
_MINUS = chr(0x2212)  # the minus sign, not the hyphen


def _result_literals(block: Block) -> list[Block]:
    """The fixed values that can be the result of ``block``: the block itself and the value
    branches of ``IF`` and ``IFNA``."""
    found: list[Block] = []
    stack = [block]
    while stack:
        current = stack.pop()
        if current.kind is BlockKind.LITERAL and current.datatype == "text":
            found.append(current)
        elif current.kind is BlockKind.IF:
            stack.extend(current.children[1:])
        elif current.kind is BlockKind.FUNCTION and current.function == "IFNA":
            stack.extend(current.children)
    return found


def _walk(root: Block) -> list[Block]:
    order: list[Block] = []
    stack = [root]
    while stack:
        block = stack.pop()
        order.append(block)
        stack.extend(block.children)
    return order


def literal_choices(root: Block, expected: ExprType | None = None) -> dict[int, ExprType]:
    """The fixed texts that stand for a value of a choice, by ``id`` of the block, with the
    type of the choice."""
    found: dict[int, ExprType] = {}
    for block in _walk(root):
        if block.kind is BlockKind.NAME and block.call and block.symbols:
            for spec, argument in zip(block.symbols[-1].arguments, block.children, strict=False):
                wanted = type_of(
                    spec.datatype,
                    tuple(item.id for item in spec.choices),
                    spec.object_type,
                    labels_of(spec.choices),
                )
                if wanted.labels and wanted.choices:
                    for literal in _result_literals(argument):
                        found.setdefault(id(literal), wanted)
        if block.kind is BlockKind.COMPARISON and block.operator in ("=", "<>"):
            first, second = block.children
            for side, other in ((first, second), (second, first)):
                if side.type is not None and side.type.labels and side.type.choices:
                    for literal in _result_literals(other):
                        found.setdefault(id(literal), side.type)
    if expected is not None and expected.labels and expected.choices:
        for literal in _result_literals(root):
            found.setdefault(id(literal), expected)
    return found


def _number(value: int | float, language: str) -> str:
    text = str(value)
    return text.replace(".", ",") if language == "de" else text


def _name_text(block: Block, language: str, parts: list[str] | None = None) -> str:
    """A name: the main value of an object is called by its name, any other value by its
    label and the object. A method is called by its label with its arguments and the object:
    "Wert vor (3) von EMA 20"."""
    de = language == "de"
    symbols = block.symbols
    if block.call:
        arguments = "; ".join(parts or ())
        if len(symbols) < len(block.path) or len(symbols) < 2:
            plain = ".".join(block.path) if block.path else _EMPTY
            return f"{plain}({arguments})"
        shown = [item.display_name(language) for item in symbols]
        owner = _owner_text(shown[:-1], [item.name for item in symbols[:-1]], de)
        method = f"{shown[-1]} ({arguments})" if arguments else shown[-1]
        return f"{method} von {owner}" if de else f"{method} of {owner}"
    if not symbols:
        return ".".join(block.path) if block.path else _EMPTY
    shown = [item.display_name(language) for item in symbols]
    if len(symbols) == 1:
        return shown[0]
    if (
        symbols[0].kind is SymbolKind.APPLICATION_OBJECT
        and symbols[0].members_factory is not None
        and symbols[1].kind is SymbolKind.PARAMETER
        and len(symbols) == 2
    ):
        return f"Strategieparameter {shown[1]}" if de else f"strategy parameter {shown[1]}"
    return _owner_text(shown, [item.name for item in symbols], de)


def _owner_text(shown: list[str], keys: list[str], de: bool) -> str:
    if len(shown) == 1:
        return shown[0]
    if keys[-1].lower() in _VALUE_PROPERTIES:
        return _owner_text(shown[:-1], keys[:-1], de)
    owner = _owner_text(shown[:-1], keys[:-1], de)
    return f"{shown[-1]} von {owner}" if de else f"{shown[-1]} of {owner}"


def _literal_text(block: Block, language: str, choice: ExprType | None) -> str:
    de = language == "de"
    value = block.value
    if block.datatype == "boolean":
        return ("wahr" if de else "true") if value else ("falsch" if de else "false")
    if block.datatype == "text":
        text = str(value)
        if choice is not None and choice.choices and choice.labels:
            for identifier, label in zip(choice.choices, choice.labels, strict=False):
                if identifier == text:
                    text = label.de if de else label.en
                    break
        return f"„{text}“" if de else f"“{text}”"
    if isinstance(value, bool) or value is None or isinstance(value, str):
        return _EMPTY
    if block.datatype == "percent":
        return f"{_number(value, language)} %" if de else f"{_number(value, language)}%"
    return _number(value, language)


def sentence(root: Block, language: str, expected: ExprType | None = None) -> str:
    """The sentence of an expression given as blocks. ``language`` is ``de`` or ``en``."""
    de = language == "de"
    choices = literal_choices(root, expected)
    order: list[Block] = []
    stack = [root]
    while stack:
        block = stack.pop()
        order.append(block)
        stack.extend(block.children)
    order.reverse()
    texts: dict[int, str] = {}
    for block in order:
        parts = [texts[id(item)] for item in block.children]
        texts[id(block)] = _sentence_of(block, parts, language, de, choices)
    return texts[id(root)]


def _argument(parts: list[str], index: int) -> str:
    return parts[index] if index < len(parts) else _EMPTY


def _sentence_of(
    block: Block, parts: list[str], language: str, de: bool, choices: dict[int, ExprType]
) -> str:
    kind = block.kind
    if kind is BlockKind.EMPTY:
        return _EMPTY
    if kind is BlockKind.NAME:
        return _name_text(block, language, parts)
    if kind is BlockKind.LITERAL:
        return _literal_text(block, language, choices.get(id(block)))
    if kind is BlockKind.COMPARISON:
        words = _COMPARISON.get(block.operator or "", (block.operator or "", block.operator or ""))
        return f"{_argument(parts, 0)} {words[0] if de else words[1]} {_argument(parts, 1)}"
    if kind is BlockKind.ARITHMETIC:
        return _arithmetic_sentence(block, parts, de)
    if kind is BlockKind.IF:
        a, b, c = (_argument(parts, index) for index in range(3))
        if de:
            return f"wenn {a}, dann {b}, sonst {c}"
        return f"if {a}, then {b}, otherwise {c}"
    if kind is BlockKind.LOGIC:
        return _logic_sentence(block, parts, de)
    return _function_sentence(block, parts, de)


def _arithmetic_sentence(block: Block, parts: list[str], de: bool) -> str:
    operator = block.operator or ""
    if len(parts) == 1:
        return f"{operator}{_argument(parts, 0)}".replace("-", _MINUS)
    words = _ARITHMETIC.get(operator, (operator, operator))
    precedence = _ARITHMETIC_PRECEDENCE.get(operator, 0)
    texts = []
    for child, text in zip(block.children, parts, strict=False):
        lower = (
            child.kind is BlockKind.ARITHMETIC
            and len(child.children) == 2
            and _ARITHMETIC_PRECEDENCE.get(child.operator or "", 9) < precedence
        )
        texts.append(f"({text})" if lower else text)
    return f"{_argument(texts, 0)} {words[0] if de else words[1]} {_argument(texts, 1)}"


def _logic_sentence(block: Block, parts: list[str], de: bool) -> str:
    operator = block.operator
    if operator == "not":
        text = _argument(parts, 0)
        return f"nicht ({text})" if de else f"not ({text})"
    word = (
        (" und " if operator == "and" else " oder ")
        if de
        else (" and " if operator == "and" else " or ")
    )
    texts = []
    for child, text in zip(block.children, parts, strict=False):
        mixed = (
            child.kind is BlockKind.LOGIC
            and child.operator in ("and", "or")
            and child.operator != operator
            and len(child.children) > 1
        )
        texts.append(f"({text})" if mixed else text)
    return word.join(texts)


def _function_sentence(block: Block, parts: list[str], de: bool) -> str:
    function = (block.function or "").upper()
    first = _argument(parts, 0)
    second = _argument(parts, 1)
    joined = (" und " if de else " and ").join(parts) if parts else _EMPTY
    if function == "PREVIOUS":
        return f"vorheriger Wert von {first}" if de else f"previous value of {first}"
    if function == "MIN":
        return f"der kleinste Wert aus {joined}" if de else f"the smallest of {joined}"
    if function == "MAX":
        return f"der größte Wert aus {joined}" if de else f"the largest of {joined}"
    if function == "ABS":
        return f"Betrag von {first}" if de else f"absolute value of {first}"
    if function == "FLOOR":
        return f"{first} abgerundet auf {second}" if de else f"{first} rounded down to {second}"
    if function == "CEILING":
        return f"{first} aufgerundet auf {second}" if de else f"{first} rounded up to {second}"
    if function == "ISNA":
        return f"{first} ist nicht verfügbar" if de else f"{first} is not available"
    if function == "IFNA":
        return f"{first}, ersatzweise {second}" if de else f"{first}, otherwise {second}"
    if function == "ISBLANK":
        return f"{first} ist leer" if de else f"{first} is empty"
    return f"{function}({'; '.join(parts)})"
