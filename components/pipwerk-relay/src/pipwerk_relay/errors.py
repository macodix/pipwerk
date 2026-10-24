"""Errors of the relay.

No text of an error contains a value from a message, an operating configuration, a startup
configuration or a key file. Errors name the entry, the reason or the file name, never the value.
"""


class RelayError(Exception):
    """Base of the errors of the relay."""


class StartupConfigError(RelayError):
    """No valid startup configuration is available."""


class ConfigRejected(RelayError):  # noqa: N818 - a state, named like the rejection it is
    """An operating configuration is not accepted. ``problems`` names every problem found."""

    def __init__(self, problems: tuple[str, ...]) -> None:
        super().__init__("the operating configuration is not valid: " + "; ".join(problems))
        self.problems = problems


class NotConfigured(RelayError):  # noqa: N818 - a state, named like the situation it is
    """No operating configuration has been loaded yet (``pipwerk-relay config load``)."""


class SchemaOutdated(RelayError):  # noqa: N818 - a state, named like the situation it is
    """The database is not at the newest version of the schema (``pipwerk-relay migrate``)."""


class AttachmentLost(RelayError):  # noqa: N818 - a state, named like the situation it is
    """A stored attachment of a queued message is missing or damaged."""
