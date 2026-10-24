"""Message library of pipwerk relay.

Address, message, envelope with check value, the interface "Way" for transmission ways as
extensions, the way ``files`` (a directory in the file system) and the connector of a component
(sending and receiving with attachments, repetitions, receipts). Technical documentation:
``docs/technical/pipwerk-relay.md``.
"""

from pipwerk_relaycore.address import Address
from pipwerk_relaycore.connector import (
    DEFAULT_ATTACHMENT_GRACE,
    DEFAULT_RECEIPT_TIMEOUT,
    DEFAULT_SEEN_FOR,
    Connector,
    ConnectorConfig,
    Handler,
    PollResult,
    ReceiptArrived,
    ReceiptMissing,
    ReceivedMessage,
    WayConfig,
)
from pipwerk_relaycore.contents import (
    KIND_PROBE,
    KIND_RECEIPT,
    KIND_UNDELIVERABLE,
    ProbeContent,
    ReceiptContent,
    UndeliverableContent,
    UndeliverableReason,
)
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
    DatabaseMigrationError,
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
from pipwerk_relaycore.migrate import migrate_database
from pipwerk_relaycore.way import (
    WAY_API_VERSION,
    FaultyEnvelope,
    Incoming,
    ReceivedEnvelope,
    Way,
    WaySettings,
)

__all__ = [
    "DEFAULT_ATTACHMENT_GRACE",
    "DEFAULT_RECEIPT_TIMEOUT",
    "DEFAULT_SEEN_FOR",
    "FORMAT",
    "KIND_PROBE",
    "KIND_RECEIPT",
    "KIND_UNDELIVERABLE",
    "WAYS_GROUP",
    "WAY_API_VERSION",
    "Address",
    "AddressError",
    "Attachment",
    "ConnectionKey",
    "Connector",
    "ConnectorConfig",
    "DatabaseMigrationError",
    "Envelope",
    "EnvelopeBody",
    "EnvelopeRejected",
    "FaultyEnvelope",
    "Handler",
    "Incoming",
    "KeyFileError",
    "KeyHandlingError",
    "Link",
    "Message",
    "OpenedEnvelope",
    "PollResult",
    "ProbeContent",
    "ReceiptArrived",
    "ReceiptContent",
    "ReceiptMissing",
    "ReceivedEnvelope",
    "ReceivedMessage",
    "RejectionReason",
    "RelayCoreError",
    "SecretsAccessError",
    "SecretsDirectory",
    "StoredAttachment",
    "UndeliverableContent",
    "UndeliverableReason",
    "Way",
    "WayConfig",
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
    "migrate_database",
    "verify_attachments",
]
