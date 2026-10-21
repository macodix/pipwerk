"""Static types of expressions and the rules of compatibility (specification 3.1, 3.4)."""

from dataclasses import dataclass

from pipwerk_domain.instruments import is_valid_designation
from pipwerk_domain.typedesc import (
    APPLICATION_INSTRUMENT,
    INSTRUMENT_TYPE,
    NUMERIC_TYPES,
    TIME_UNITS,
    Choice,
    DataType,
    Label,
    choice_ids,
)


@dataclass(frozen=True, slots=True)
class ExprType:
    """The type of an expression or name.

    ``datatype`` is ``None`` if it is not known (after an error, or for an unresolved name);
    an unknown type is compatible with everything so that one error does not cause others.
    ``choices`` are the allowed values of a choice or time unit (``labels`` their names in
    German and English, one for each value, if they are known), ``literals`` the fixed
    texts the value can have if all possible results are fixed texts, ``object_type``
    the type of an object-valued property.
    """

    datatype: DataType | None
    choices: tuple[str, ...] | None = None
    literals: frozenset[str] | None = None
    object_type: str | None = None
    labels: tuple[Label, ...] | None = None

    @property
    def is_unknown(self) -> bool:
        return self.datatype is None

    @property
    def is_numeric(self) -> bool:
        return self.datatype in NUMERIC_TYPES

    @property
    def is_text_like(self) -> bool:
        return self.datatype in (DataType.TEXT, DataType.CHOICE, DataType.TIME_UNIT)

    def describe(self) -> str:
        return "unknown" if self.datatype is None else self.datatype.value


UNKNOWN = ExprType(None)
NUMBER = ExprType(DataType.NUMBER)
INTEGER = ExprType(DataType.INTEGER)
PERCENT = ExprType(DataType.PERCENT)
BOOLEAN = ExprType(DataType.BOOLEAN)
TEXT = ExprType(DataType.TEXT)
TIMESTAMP = ExprType(DataType.TIMESTAMP)
DATE = ExprType(DataType.DATE)


def type_of(
    datatype: DataType,
    choices: tuple[str, ...] = (),
    object_type: str | None = None,
    labels: tuple[Label, ...] | None = None,
) -> ExprType:
    """The expression type for a data type of a parameter or property."""
    if datatype is DataType.TIME_UNIT:
        return ExprType(
            datatype,
            choices=choice_ids(datatype, ()),
            labels=tuple(item.label for item in TIME_UNITS),
        )
    if datatype is DataType.CHOICE:
        return ExprType(datatype, choices=choices, labels=labels)
    if datatype is DataType.OBJECT:
        return ExprType(datatype, object_type=object_type)
    if datatype is DataType.EXPRESSION:
        return UNKNOWN
    return ExprType(datatype)


def labels_of(choices: tuple[Choice, ...]) -> tuple[Label, ...]:
    """The labels of choices, one for each."""
    return tuple(item.label for item in choices)


def families_match(left: ExprType, right: ExprType) -> bool:
    """Whether two values can be compared: numbers with numbers, texts (including choices
    and time units) with texts, truth values, points in time and dates with their own kind."""
    if left.is_unknown or right.is_unknown:
        return True
    if left.is_numeric and right.is_numeric:
        return True
    if left.is_text_like and right.is_text_like:
        return True
    return left.datatype is right.datatype and left.datatype is not DataType.OBJECT


def _same_object_type(left: ExprType, right: ExprType) -> bool:
    """Objects of known different types are not compatible."""
    return (
        left.object_type is None
        or right.object_type is None
        or left.object_type == right.object_type
    )


def unify(left: ExprType, right: ExprType) -> ExprType | None:
    """The common type of two values, ``None`` if there is none."""
    if left.is_unknown:
        return right
    if right.is_unknown:
        return left
    if left.is_numeric and right.is_numeric:
        return left if left.datatype is right.datatype else NUMBER
    if left.is_text_like and right.is_text_like:
        literals = (
            None
            if left.literals is None or right.literals is None
            else left.literals | right.literals
        )
        if left.datatype is right.datatype and left.datatype is not DataType.TEXT:
            return ExprType(left.datatype, left.choices, literals, None, left.labels)
        return ExprType(DataType.TEXT, None, literals)
    if left.datatype is right.datatype:
        return left if left.object_type == right.object_type else None
    return None


@dataclass(frozen=True, slots=True)
class Mismatch:
    """Why a value cannot be used where a type is expected."""

    reason: str  # "type", "choice_value" or "instrument"
    values: tuple[str, ...] = ()
    allowed: tuple[str, ...] = ()


def mismatch_with(
    expected: ExprType, actual: ExprType, accept_labels: bool = False
) -> Mismatch | None:
    """``None`` if ``actual`` can be used where ``expected`` is required, else the reason.

    Fixed texts are checked against the allowed values of a choice and, where an instrument
    is expected, against the designations of instruments (specification 3.1). With
    ``accept_labels`` (the display form) the names of the values of a choice are values too.
    """
    if expected.is_unknown or actual.is_unknown:
        return None
    expected_type = expected.datatype
    if expected_type in NUMERIC_TYPES:
        return None if actual.is_numeric else Mismatch("type")
    if expected_type in (DataType.CHOICE, DataType.TIME_UNIT):
        if not actual.is_text_like:
            return Mismatch("type")
        return _check_literals(expected, actual, accept_labels)
    if expected_type is DataType.TEXT:
        return None if actual.is_text_like else Mismatch("type")
    if expected_type is DataType.OBJECT:
        if actual.datatype is DataType.OBJECT:
            return None if _same_object_type(expected, actual) else Mismatch("type")
        if expected.object_type == INSTRUMENT_TYPE and actual.is_text_like:
            return _check_instrument_texts(actual)
        return Mismatch("type")
    return None if actual.datatype is expected_type else Mismatch("type")


def _check_instrument_texts(actual: ExprType) -> Mismatch | None:
    """A fixed text in the place of an instrument must be a valid designation. A text that
    arises only at the execution is checked there."""
    if actual.literals is None:
        return None
    bad = tuple(
        sorted(
            value
            for value in actual.literals
            if value != APPLICATION_INSTRUMENT and not is_valid_designation(value)
        )
    )
    return Mismatch("instrument", bad) if bad else None


def _spelled(text: str) -> str:
    return " ".join(text.split()).casefold()


def _check_literals(
    expected: ExprType, actual: ExprType, accept_labels: bool = False
) -> Mismatch | None:
    """With ``accept_labels`` (an expression in the display form) a text that is the name of a
    value in German or English is a value too."""
    if expected.choices is None or actual.literals is None:
        return None
    named: set[str] = set()
    if accept_labels and expected.labels is not None:
        for label in expected.labels:
            named.update((_spelled(label.de), _spelled(label.en)))
    bad = tuple(
        sorted(
            value
            for value in actual.literals
            if value not in expected.choices and _spelled(value) not in named
        )
    )
    if bad:
        return Mismatch("choice_value", bad, expected.choices)
    return None


def literal_mismatch(
    choice_side: ExprType, other: ExprType, accept_labels: bool = False
) -> Mismatch | None:
    """Mismatch of the fixed texts of ``other`` with the values of the choice
    ``choice_side``; ``None`` if ``choice_side`` is no choice."""
    if choice_side.datatype not in (DataType.CHOICE, DataType.TIME_UNIT):
        return None
    return _check_literals(choice_side, other, accept_labels)
