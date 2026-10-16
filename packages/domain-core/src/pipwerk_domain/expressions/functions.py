"""The functions of the expressions with signature and result type as queryable data
(specification 3.4, section 10 point 3). Names are written as in the OpenFormula norm."""

from dataclasses import dataclass
from enum import StrEnum

from pipwerk_domain.typedesc import Label


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
    name: str
    kind: ArgumentKind
    optional: bool = False


@dataclass(frozen=True, slots=True)
class FunctionSignature:
    """Signature of a function. ``variadic`` is the kind of all arguments after the
    listed parameters, if any number of them is allowed."""

    name: str
    parameters: tuple[FunctionParameter, ...]
    result: ResultKind
    description: Label
    variadic: ArgumentKind | None = None

    @property
    def min_arguments(self) -> int:
        return sum(1 for item in self.parameters if not item.optional)

    @property
    def max_arguments(self) -> int | None:
        return None if self.variadic is not None else len(self.parameters)


def _p(name: str, kind: ArgumentKind, *, optional: bool = False) -> FunctionParameter:
    return FunctionParameter(name, kind, optional)


_NUMBER = ArgumentKind.NUMBER
_BOOL = ArgumentKind.BOOLEAN
_ANY = ArgumentKind.ANY

FUNCTIONS: tuple[FunctionSignature, ...] = (
    FunctionSignature(
        "IF",
        (_p("condition", _BOOL), _p("then", _ANY), _p("else", _ANY, optional=True)),
        ResultKind.BRANCHES,
        Label(
            "Fallunterscheidung: Wert bei wahrer, sonst bei falscher Bedingung.",
            "Case distinction: value if the condition is true, else if it is false.",
        ),
    ),
    FunctionSignature(
        "AND",
        (_p("value", _BOOL),),
        ResultKind.BOOLEAN,
        Label("Wahr, wenn alle Werte wahr sind.", "True if all values are true."),
        variadic=_BOOL,
    ),
    FunctionSignature(
        "OR",
        (_p("value", _BOOL),),
        ResultKind.BOOLEAN,
        Label("Wahr, wenn mindestens ein Wert wahr ist.", "True if at least one value is true."),
        variadic=_BOOL,
    ),
    FunctionSignature(
        "NOT",
        (_p("value", _BOOL),),
        ResultKind.BOOLEAN,
        Label("Kehrt einen Wahrheitswert um.", "Negates a truth value."),
    ),
    FunctionSignature(
        "MIN",
        (_p("value", _NUMBER),),
        ResultKind.NUMBER,
        Label("Kleinster der Werte.", "Smallest of the values."),
        variadic=_NUMBER,
    ),
    FunctionSignature(
        "MAX",
        (_p("value", _NUMBER),),
        ResultKind.NUMBER,
        Label("Größter der Werte.", "Largest of the values."),
        variadic=_NUMBER,
    ),
    FunctionSignature(
        "ABS",
        (_p("value", _NUMBER),),
        ResultKind.NUMBER,
        Label("Betrag einer Zahl.", "Absolute value of a number."),
    ),
    FunctionSignature(
        "FLOOR",
        (_p("value", _NUMBER), _p("step", _NUMBER)),
        ResultKind.NUMBER,
        Label(
            "Rundet ab auf ein Vielfaches der Schrittweite.",
            "Rounds down to a multiple of the step.",
        ),
    ),
    FunctionSignature(
        "CEILING",
        (_p("value", _NUMBER), _p("step", _NUMBER)),
        ResultKind.NUMBER,
        Label(
            "Rundet auf auf ein Vielfaches der Schrittweite.",
            "Rounds up to a multiple of the step.",
        ),
    ),
    FunctionSignature(
        "ISNA",
        (_p("value", _ANY),),
        ResultKind.BOOLEAN,
        Label(
            "Wahr, wenn der Wert „nicht verfügbar“ ist.", 'True if the value is "not available".'
        ),
    ),
    FunctionSignature(
        "IFNA",
        (_p("value", _ANY), _p("replacement", _ANY)),
        ResultKind.BRANCHES,
        Label(
            "Der Wert, bei „nicht verfügbar“ der Ersatzwert.",
            'The value, the replacement if it is "not available".',
        ),
    ),
    FunctionSignature(
        "ISBLANK",
        (_p("value", _ANY),),
        ResultKind.BOOLEAN,
        Label("Wahr, wenn der Wert „leer“ ist.", 'True if the value is "empty".'),
    ),
    FunctionSignature(
        "PREVIOUS",
        (_p("property", ArgumentKind.NAME), _p("count", ArgumentKind.INTEGER, optional=True)),
        ResultKind.FIRST_ARGUMENT,
        Label(
            "Wert einer Eigenschaft bei einer früheren Auswertung (Standard: der vorherigen).",
            "Value of a property at an earlier evaluation (default: the previous one).",
        ),
    ),
    FunctionSignature(
        "TRUE",
        (),
        ResultKind.BOOLEAN,
        Label("Der Wahrheitswert wahr.", "The truth value true."),
    ),
    FunctionSignature(
        "FALSE",
        (),
        ResultKind.BOOLEAN,
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
