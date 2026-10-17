"""Formation rule for identifiers of properties, parameters and fixed values."""

import unicodedata

_REPLACEMENTS = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss", " ": "_", "-": "_"}


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
