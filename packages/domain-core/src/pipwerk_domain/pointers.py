"""JSON Pointers (RFC 6901) to places in a document."""

_SEPARATOR = "/"
_ESCAPE = {"~": "~0", _SEPARATOR: "~1"}


class PointerError(ValueError):
    """A text that is no JSON Pointer."""


def pointer(*parts: str | int) -> str:
    """The JSON Pointer to a place: the parts one behind the other, ``~`` and ``/`` in a part
    escaped. No part gives the pointer to the whole document (an empty text)."""
    texts: list[str] = []
    for part in parts:
        text = str(part)
        for char, replacement in _ESCAPE.items():
            text = text.replace(char, replacement)
        texts.append(_SEPARATOR + text)
    return "".join(texts)


def below(base: str, *parts: str | int) -> str:
    """The pointer to a place below ``base``."""
    return base + pointer(*parts)


def split_pointer(text: str) -> list[str]:
    """The parts of a JSON Pointer, unescaped. Raises :class:`PointerError` if the text is no
    pointer (it must be empty or start with ``/``, ``~`` only as ``~0`` or ``~1``)."""
    if text == "":
        return []
    if not text.startswith(_SEPARATOR):
        raise PointerError("a pointer starts with a slash")
    parts: list[str] = []
    for raw in text[1:].split(_SEPARATOR):
        result: list[str] = []
        index = 0
        while index < len(raw):
            char = raw[index]
            if char == "~":
                following = raw[index + 1 : index + 2]
                if following == "0":
                    result.append("~")
                elif following == "1":
                    result.append(_SEPARATOR)
                else:
                    raise PointerError("a tilde is followed by 0 or 1")
                index += 2
            else:
                result.append(char)
                index += 1
        parts.append("".join(result))
    return parts
