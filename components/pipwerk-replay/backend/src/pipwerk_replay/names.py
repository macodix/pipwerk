"""The rule for names of brokers and instruments (the one of the data stock and of the source).

A name has 1 to 128 characters, no control character and no blank at its beginning or end
(``pipwerk_marketdata``, ``contracts/market-data/v1/``).
"""

from __future__ import annotations

MAX_NAME_LENGTH = 128

#: The rule as a regular expression for the models of requests (Pydantic, Rust syntax).
NAME_PATTERN = r"^\S(?:[^\x00-\x1f\x7f]*\S)?$"


def is_valid_name(name: str) -> bool:
    """Whether ``name`` follows the rule (the check of the data stock)."""
    return (
        bool(name)
        and len(name) <= MAX_NAME_LENGTH
        and name == name.strip()
        and not any(ord(char) < 32 or ord(char) == 127 for char in name)
    )
