"""Errors of the library.

No message of an error contains a value from a message, an envelope, a settings block or a
key file. Errors name the entry, the reason or the file name, never the value.
"""

from enum import StrEnum


class RelayCoreError(Exception):
    """Base of all errors of the library."""


class AddressError(RelayCoreError, ValueError):
    """A text is not an address or not a name of a part of an address."""


class RejectionReason(StrEnum):
    """Why an envelope or one of its attachments is not accepted (specification 3.3, 4.1)."""

    MALFORMED = "malformed"
    UNSUPPORTED_FORMAT = "unsupported_format"
    TOO_LARGE = "too_large"
    UNKNOWN_LINK = "unknown_link"
    WRONG_RECIPIENT = "wrong_recipient"
    BAD_MAC = "bad_mac"
    BAD_BODY = "bad_body"
    BAD_CONTENT = "bad_content"
    STORED_NOT_SUPPORTED = "stored_not_supported"
    ATTACHMENT_MISSING = "attachment_missing"
    ATTACHMENT_UNEXPECTED = "attachment_unexpected"
    ATTACHMENT_SIZE = "attachment_size"
    ATTACHMENT_HASH = "attachment_hash"


class EnvelopeRejected(RelayCoreError):  # noqa: N818 - a state, named like the rejection it is
    """An envelope is not accepted. ``reason`` tells why; the text never contains content."""

    def __init__(self, reason: RejectionReason) -> None:
        super().__init__(f"envelope rejected: {reason.value}")
        self.reason = reason


class KeyHandlingError(RelayCoreError):
    """Base of the errors around keys of connections."""


class SecretsAccessError(KeyHandlingError):
    """The directory for secrets or a file in it is missing, not usable or readable by others."""


class KeyFileError(KeyHandlingError):
    """A key file does not hold a valid key, or a key file already exists."""


class DatabaseMigrationError(RelayCoreError):
    """The database of a connector cannot be brought to the newest schema.

    The changes of the failed migration are rolled back. The text never names a path.
    """


class WayError(RelayCoreError):
    """Base of the errors of transmission ways."""


class WayUnavailableError(WayError):
    """The target or inbox of a way is not reachable (for example a directory that is gone).

    Relay and connection of a component can repeat the call later.
    """


class WayTooLargeError(WayError):
    """An envelope or an attachment is larger than the way allows. A repetition does not help."""


class WayRefusedError(WayError):
    """A way refuses an envelope for a reason that a repetition does not remove."""


class WayLoadError(WayError):
    """A way cannot be loaded by its name: unknown, ambiguous, broken or of another version."""


class WaySettingsError(WayLoadError):
    """The own settings of a way are invalid. ``entries`` names the entries, never their values."""

    def __init__(self, way: str, entries: tuple[str, ...]) -> None:
        super().__init__(f"invalid settings for way '{way}': {', '.join(entries)}")
        self.way = way
        self.entries = entries
