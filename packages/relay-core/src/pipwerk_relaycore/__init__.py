"""Message library of pipwerk relay.

Address, message, envelope with check value, the interface "Way" for transmission ways as
extensions and the way ``files`` (a directory in the file system). Technical documentation:
``docs/technical/pipwerk-relay.md``.
"""

from pipwerk_relaycore.address import Address
from pipwerk_relaycore.envelope import (
    FORMAT,
    Envelope,
    EnvelopeBody,
    Link,
    OpenedEnvelope,
    StoredAttachment,
    compute_mac,
    verify_attachments,
)
from pipwerk_relaycore.errors import (
    AddressError,
    EnvelopeRejected,
    KeyFileError,
    KeyHandlingError,
    RejectionReason,
    RelayCoreError,
    SecretsAccessError,
    WayError,
    WayLoadError,
    WayRefusedError,
    WaySettingsError,
    WayTooLargeError,
    WayUnavailableError,
)
from pipwerk_relaycore.keys import ConnectionKey, SecretsDirectory
from pipwerk_relaycore.loader import WAYS_GROUP, available_ways, load_way, load_way_class
from pipwerk_relaycore.message import Attachment, Message
from pipwerk_relaycore.way import (
    WAY_API_VERSION,
    FaultyEnvelope,
    Incoming,
    ReceivedEnvelope,
    Way,
    WaySettings,
)

__all__ = [
    "FORMAT",
    "WAYS_GROUP",
    "WAY_API_VERSION",
    "Address",
    "AddressError",
    "Attachment",
    "ConnectionKey",
    "Envelope",
    "EnvelopeBody",
    "EnvelopeRejected",
    "FaultyEnvelope",
    "Incoming",
    "KeyFileError",
    "KeyHandlingError",
    "Link",
    "Message",
    "OpenedEnvelope",
    "ReceivedEnvelope",
    "RejectionReason",
    "RelayCoreError",
    "SecretsAccessError",
    "SecretsDirectory",
    "StoredAttachment",
    "Way",
    "WayError",
    "WayLoadError",
    "WayRefusedError",
    "WaySettings",
    "WaySettingsError",
    "WayTooLargeError",
    "WayUnavailableError",
    "available_ways",
    "compute_mac",
    "load_way",
    "load_way_class",
    "verify_attachments",
]
