"""Address (specification 3.1): ``<running component>.<pipwerk network>.<responsible relay>``."""

import re
from dataclasses import dataclass

from pipwerk_relaycore.errors import AddressError

NAME_REGEX = r"[A-Za-z0-9][A-Za-z0-9_-]{0,62}"
"""One part of an address: 1 to 63 letters, digits, ``-``, ``_``; the first is a letter or digit."""

ADDRESS_REGEX = rf"^{NAME_REGEX}\.{NAME_REGEX}\.{NAME_REGEX}$"
RELAY_REGEX = rf"^{NAME_REGEX}\.{NAME_REGEX}$"
"""A relay as ``<pipwerk network>.<relay>`` (entries of ``hops``)."""

LINK_NAME_REGEX = rf"^{NAME_REGEX}(\.{NAME_REGEX})?$"
"""Name of one side of a connection: a component or ``<pipwerk network>.<relay>``."""

_NAME = re.compile(NAME_REGEX)


def check_name(text: str) -> str:
    """Return the text if it is a valid part of an address, else raise ``AddressError``.

    ``fullmatch`` is used on purpose: ``$`` would accept a trailing line feed.
    """
    if not _NAME.fullmatch(text):
        raise AddressError("not a valid name of a part of an address")
    return text


def is_name(text: str) -> bool:
    return _NAME.fullmatch(text) is not None


def check_relay(text: str) -> str:
    """Return the text if it is ``<pipwerk network>.<relay>``."""
    parts = text.split(".")
    if len(parts) != 2 or not all(is_name(part) for part in parts):
        raise AddressError("not a valid relay name '<pipwerk network>.<relay>'")
    return text


def check_link_name(text: str) -> str:
    """Return the text if it names a side of a connection (component or relay)."""
    parts = text.split(".")
    if len(parts) > 2 or not all(is_name(part) for part in parts):
        raise AddressError("not a valid name of a side of a connection")
    return text


@dataclass(frozen=True, slots=True)
class Address:
    """The address of a running component. Upper and lower case count."""

    component: str
    network: str
    relay: str

    def __post_init__(self) -> None:
        check_name(self.component)
        check_name(self.network)
        check_name(self.relay)

    @classmethod
    def parse(cls, text: str) -> Address:
        """Read an address from text; raises ``AddressError`` if it is not valid."""
        parts = text.split(".")
        if len(parts) != 3:
            raise AddressError("an address has exactly three parts separated by dots")
        return cls(*parts)

    @property
    def relay_name(self) -> str:
        """The responsible relay as ``<pipwerk network>.<relay>``."""
        return f"{self.network}.{self.relay}"

    def __str__(self) -> str:
        return f"{self.component}.{self.network}.{self.relay}"
