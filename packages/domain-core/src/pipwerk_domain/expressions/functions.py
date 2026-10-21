"""The functions of the expressions with signature and result type as queryable data
(specification 3.4, section 10 point 3). Names are written as in the OpenFormula norm. Each
function has a label and an explanation in trader language, each argument a name and an
explanation, in German and English (specification 3.1, req-ui-015)."""

from dataclasses import dataclass
from enum import StrEnum

from pipwerk_domain.typedesc import NO_TEXT, Label


class ArgumentKind(StrEnum):
    """What an argument must be."""

    NUMBER = "number"
    INTEGER = "integer"
    BOOLEAN = "boolean"
    ANY = "any"
    NAME = "name"  # a name of a property, for example ``ema20.wert``


class ResultKind(StrEnum):
    """How the result type of a function follows."""

    NUMBER = "number"
    BOOLEAN = "boolean"
    BRANCHES = "branches"  # the common type of the value arguments
    FIRST_ARGUMENT = "first_argument"  # the type of the first argument


@dataclass(frozen=True, slots=True)
class FunctionParameter:
    """An argument of a function: its identifier, kind, name and explanation."""

    name: str
    kind: ArgumentKind
    optional: bool = False
    label: Label = NO_TEXT
    explanation: Label = NO_TEXT


@dataclass(frozen=True, slots=True)
class FunctionSignature:
    """Signature of a function. ``variadic`` is the kind of all arguments after the
    listed parameters, if any number of them is allowed."""

    name: str
    parameters: tuple[FunctionParameter, ...]
    result: ResultKind
    label: Label
    explanation: Label
    variadic: ArgumentKind | None = None

    @property
    def min_arguments(self) -> int:
        return sum(1 for item in self.parameters if not item.optional)

    @property
    def max_arguments(self) -> int | None:
        return None if self.variadic is not None else len(self.parameters)


def _p(
    name: str,
    kind: ArgumentKind,
    de: str,
    en: str,
    explanation: tuple[str, str],
    *,
    optional: bool = False,
) -> FunctionParameter:
    return FunctionParameter(name, kind, optional, Label(de, en), Label(*explanation))


_NUMBER = ArgumentKind.NUMBER
_BOOL = ArgumentKind.BOOLEAN
_ANY = ArgumentKind.ANY

FUNCTIONS: tuple[FunctionSignature, ...] = (
    FunctionSignature(
        "IF",
        (
            _p(
                "condition",
                _BOOL,
                "Bedingung",
                "condition",
                ("Was geprüft wird.", "What is checked."),
            ),
            _p(
                "then",
                _ANY,
                "Wert, wenn wahr",
                "value if true",
                ("Der Wert, wenn die Bedingung zutrifft.", "The value if the condition holds."),
            ),
            _p(
                "else",
                _ANY,
                "Wert, wenn falsch",
                "value if false",
                (
                    "Der Wert, wenn die Bedingung nicht zutrifft.",
                    "The value if the condition does not hold.",
                ),
                optional=True,
            ),
        ),
        ResultKind.BRANCHES,
        Label("wenn … dann … sonst", "if … then … else"),
        Label(
            "Wählt je nach Bedingung einen von zwei Werten.",
            "Picks one of two values depending on the condition.",
        ),
    ),
    FunctionSignature(
        "AND",
        (
            _p(
                "value",
                _BOOL,
                "Bedingung",
                "condition",
                ("Eine Bedingung, die zutreffen muss.", "A condition that has to hold."),
            ),
        ),
        ResultKind.BOOLEAN,
        Label("und", "and"),
        Label("Wahr, wenn alle Bedingungen wahr sind.", "True if all conditions are true."),
        variadic=_BOOL,
    ),
    FunctionSignature(
        "OR",
        (
            _p(
                "value",
                _BOOL,
                "Bedingung",
                "condition",
                ("Eine Bedingung, die zutreffen kann.", "A condition that may hold."),
            ),
        ),
        ResultKind.BOOLEAN,
        Label("oder", "or"),
        Label(
            "Wahr, wenn mindestens eine Bedingung wahr ist.",
            "True if at least one condition is true.",
        ),
        variadic=_BOOL,
    ),
    FunctionSignature(
        "NOT",
        (
            _p(
                "value",
                _BOOL,
                "Bedingung",
                "condition",
                ("Die Bedingung, die umgekehrt wird.", "The condition that is reversed."),
            ),
        ),
        ResultKind.BOOLEAN,
        Label("nicht", "not"),
        Label("Kehrt wahr und falsch um.", "Reverses true and false."),
    ),
    FunctionSignature(
        "MIN",
        (
            _p(
                "value",
                _NUMBER,
                "Wert",
                "value",
                ("Ein Wert, der verglichen wird.", "A value that is compared."),
            ),
        ),
        ResultKind.NUMBER,
        Label("kleinster Wert", "smallest value"),
        Label("Der kleinste der Werte.", "The smallest of the values."),
        variadic=_NUMBER,
    ),
    FunctionSignature(
        "MAX",
        (
            _p(
                "value",
                _NUMBER,
                "Wert",
                "value",
                ("Ein Wert, der verglichen wird.", "A value that is compared."),
            ),
        ),
        ResultKind.NUMBER,
        Label("größter Wert", "largest value"),
        Label("Der größte der Werte.", "The largest of the values."),
        variadic=_NUMBER,
    ),
    FunctionSignature(
        "ABS",
        (
            _p(
                "value",
                _NUMBER,
                "Wert",
                "value",
                ("Der Wert, dessen Vorzeichen wegfällt.", "The value whose sign is dropped."),
            ),
        ),
        ResultKind.NUMBER,
        Label("Betrag", "absolute value"),
        Label("Der Betrag eines Werts ohne Vorzeichen.", "The absolute value without sign."),
    ),
    FunctionSignature(
        "FLOOR",
        (
            _p(
                "value",
                _NUMBER,
                "Wert",
                "value",
                ("Der Wert, der abgerundet wird.", "The value that is rounded down."),
            ),
            _p(
                "step",
                _NUMBER,
                "Schrittweite",
                "step",
                (
                    "Das Vielfache, auf das abgerundet wird, zum Beispiel 0,01.",
                    "The multiple to round down to, for example 0.01.",
                ),
            ),
        ),
        ResultKind.NUMBER,
        Label("abrunden auf", "round down to"),
        Label(
            "Rundet auf ein Vielfaches der Schrittweite ab.",
            "Rounds down to a multiple of the step.",
        ),
    ),
    FunctionSignature(
        "CEILING",
        (
            _p(
                "value",
                _NUMBER,
                "Wert",
                "value",
                ("Der Wert, der aufgerundet wird.", "The value that is rounded up."),
            ),
            _p(
                "step",
                _NUMBER,
                "Schrittweite",
                "step",
                (
                    "Das Vielfache, auf das aufgerundet wird, zum Beispiel 0,01.",
                    "The multiple to round up to, for example 0.01.",
                ),
            ),
        ),
        ResultKind.NUMBER,
        Label("aufrunden auf", "round up to"),
        Label(
            "Rundet auf ein Vielfaches der Schrittweite auf.",
            "Rounds up to a multiple of the step.",
        ),
    ),
    FunctionSignature(
        "ISNA",
        (
            _p(
                "value",
                _ANY,
                "Wert",
                "value",
                ("Der Wert, der geprüft wird.", "The value that is checked."),
            ),
        ),
        ResultKind.BOOLEAN,
        Label("ist nicht verfügbar", "is not available"),
        Label(
            "Wahr, wenn der Wert „nicht verfügbar“ ist.",
            'True if the value is "not available".',
        ),
    ),
    FunctionSignature(
        "IFNA",
        (
            _p(
                "value",
                _ANY,
                "Wert",
                "value",
                ("Der Wert, der gelten soll.", "The value that is meant to apply."),
            ),
            _p(
                "replacement",
                _ANY,
                "Ersatzwert",
                "replacement",
                (
                    "Der Wert, der gilt, wenn der erste „nicht verfügbar“ ist.",
                    'The value that applies if the first is "not available".',
                ),
            ),
        ),
        ResultKind.BRANCHES,
        Label("Wert, ersatzweise", "value, otherwise"),
        Label(
            "Der Wert, bei „nicht verfügbar“ der Ersatzwert.",
            'The value, the replacement if it is "not available".',
        ),
    ),
    FunctionSignature(
        "ISBLANK",
        (
            _p(
                "value",
                _ANY,
                "Wert",
                "value",
                ("Der Wert, der geprüft wird.", "The value that is checked."),
            ),
        ),
        ResultKind.BOOLEAN,
        Label("ist leer", "is empty"),
        Label("Wahr, wenn der Wert „leer“ ist.", 'True if the value is "empty".'),
    ),
    FunctionSignature(
        "PREVIOUS",
        (
            _p(
                "property",
                ArgumentKind.NAME,
                "Wert",
                "value",
                (
                    "Der Wert, dessen früheren Stand Sie brauchen, zum Beispiel die "
                    "Eigenschaft eines Indikators oder das Ergebnis einer Bedingung.",
                    "The value whose earlier state you need, for example the property of an "
                    "indicator or the result of a condition.",
                ),
            ),
            _p(
                "count",
                ArgumentKind.INTEGER,
                "Anzahl zurück",
                "number back",
                (
                    "Wie viele Auswertungen zurück. Ohne Angabe die vorherige.",
                    "How many evaluations back. Without a number, the previous one.",
                ),
                optional=True,
            ),
        ),
        ResultKind.FIRST_ARGUMENT,
        Label("vorheriger Wert von", "previous value of"),
        Label(
            "Der Wert bei einer früheren Auswertung, zum Beispiel bei der vorherigen Kerze.",
            "The value at an earlier evaluation, for example at the previous candle.",
        ),
    ),
    FunctionSignature(
        "TRUE",
        (),
        ResultKind.BOOLEAN,
        Label("wahr", "true"),
        Label("Der Wahrheitswert wahr.", "The truth value true."),
    ),
    FunctionSignature(
        "FALSE",
        (),
        ResultKind.BOOLEAN,
        Label("falsch", "false"),
        Label("Der Wahrheitswert falsch.", "The truth value false."),
    ),
)

_BY_NAME = {item.name: item for item in FUNCTIONS}


def list_functions() -> tuple[FunctionSignature, ...]:
    """All functions with signature and result type."""
    return FUNCTIONS


def find_function(name: str) -> FunctionSignature | None:
    """The function with this name; upper and lower case are not distinguished."""
    return _BY_NAME.get(name.upper())
