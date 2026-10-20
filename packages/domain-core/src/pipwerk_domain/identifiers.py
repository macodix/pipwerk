"""Formation rule for identifiers and the keys of objects (specification 3.1, 3.3)."""

import re
import unicodedata
from collections.abc import Iterable

from pipwerk_domain.limits import MAX_KEY_LENGTH

_REPLACEMENTS = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss", " ": "_", "-": "_"}

KEY_PATTERN = r"^[A-Za-z_][A-Za-z0-9_]*$"
"""A key in an expression: ASCII letters, digits and ``_``, not starting with a digit."""

_KEY = re.compile(KEY_PATTERN)


def identifier_from_name(name: str) -> str:
    """Form the language-neutral identifier from a German name (specification 3.1).

    Lower case; ä, ö, ü become ae, oe, ue and ß becomes ss; a space and a hyphen
    each become ``_``; all other characters except the digits 0-9, the letters a-z and an
    existing ``_`` are dropped (so the function applied to an identifier returns the
    identifier). "Punkt 1/3" becomes ``punkt_13``, "Stop-Loss" ``stop_loss``.
    """
    result: list[str] = []
    for char in unicodedata.normalize("NFC", name).lower():
        replacement = _REPLACEMENTS.get(char)
        if replacement is not None:
            result.append(replacement)
        elif ("a" <= char <= "z") or ("0" <= char <= "9") or char == "_":
            result.append(char)
    return "".join(result)


def is_valid_key(text: str) -> bool:
    """Whether the text can be a key: it is one simple name of an expression."""
    return len(text) <= MAX_KEY_LENGTH and _KEY.fullmatch(text) is not None


def form_key(name: str, taken: Iterable[str], fallback: str = "objekt") -> str:
    """The key of a new object formed from its first name (specification 3.3).

    The identifier of the name by the rule of :func:`identifier_from_name`; if that is
    empty the ``fallback`` (also formed by the rule); ``n_`` in front if it does not start
    with a letter; made unique against the keys in ``taken`` (compared without regard to
    upper and lower case) by appending a number: ``kerze_2``. ``taken`` contains the other
    keys of the namespace, the names of the objects of the application and the functions.
    """
    base = identifier_from_name(name) or identifier_from_name(fallback) or "objekt"
    if not ("a" <= base[0] <= "z"):
        base = f"n_{base}"
    base = base[: MAX_KEY_LENGTH - 12]
    used = {item.lower() for item in taken}
    key = base
    number = 2
    while key.lower() in used:
        key = f"{base}_{number}"
        number += 1
    return key


def name_from_programming_name(text: str) -> str:
    """The name for a name in programming spelling (specification 3.7): if the text contains
    ``_`` and no space, the ``_`` become spaces and the first letter becomes a capital:
    ``stop_abstand`` becomes "Stop abstand". Other texts stay as they are. Umlauts are not
    restored, because "ue" is not always "ü"."""
    if "_" not in text or " " in text:
        return text
    words = " ".join(part for part in text.split("_") if part)
    return words[:1].upper() + words[1:]
