"""Operating configuration of the relay (specification 4.5, schema ``relay-config.schema.json``).

The operator writes it as a JSON file and loads it with ``pipwerk-relay config load``; the relay
keeps it in its database and takes over a new one while it runs. The models are strict: no
implicit conversion, additional fields are rejected. The only free parts are the ``settings``
blocks, which belong to the way that is named next to them (specification 3.4): the relay passes
them on unchanged, and the way checks them itself.

Names of components and relays follow the rules of an address (specification 3.1). The name
``relay`` is reserved: the relay itself sends notices from ``relay.<network>.<relay>``.
"""

import json
from typing import Annotated, Self

from pipwerk_relaycore.address import NAME_REGEX
from pipwerk_relaycore.envelope import WAY_NAME_REGEX
from pydantic import BaseModel, ConfigDict, Field, JsonValue, ValidationError, model_validator

from pipwerk_relay.errors import ConfigRejected

NAME_PATTERN = rf"^{NAME_REGEX}$"
KEY_FILE_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$"
RESERVED_COMPONENT_NAME = "relay"
MAX_CONFIG_BYTES = 1024 * 1024

DEFAULT_MAX_HOPS = 8
DEFAULT_MAX_QUEUE_MESSAGES = 10_000
DEFAULT_MAX_ATTACHMENT_STORAGE_BYTES = 10 * 1024**3
DEFAULT_READ_BATCH = 100

Name = Annotated[str, Field(pattern=NAME_PATTERN)]
KeyFile = Annotated[
    str,
    Field(
        pattern=KEY_FILE_PATTERN,
        description="File name of the key of the connection in the directory for secrets.",
    ),
]
WayName = Annotated[str, Field(pattern=WAY_NAME_REGEX, description="Name of the way.")]
Settings = Annotated[
    dict[str, JsonValue],
    Field(
        description=(
            "Own settings of the way. Any fields: the way checks them itself and rejects "
            "unknown entries."
        )
    ),
]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)


class InputConfig(_Strict):
    """An inbox of the relay: where it reads the envelopes sent to it."""

    name: Annotated[Name, Field(description="Name of the inbox; it appears in the log.")]
    way: WayName
    settings: Settings = Field(default_factory=dict)


class ComponentConfig(_Strict):
    """A component that is connected to the relay (specification 4.2)."""

    name: Annotated[
        Name, Field(description="Name of the component; the first part of its address.")
    ]
    way: WayName
    settings: Settings = Field(default_factory=dict)
    key_file: KeyFile


class AddressBookEntry(_Strict):
    """A relay that this relay knows (specification 4.3)."""

    network: Annotated[Name, Field(description="pipwerk network of the other relay.")]
    relay: Annotated[Name, Field(description="Name of the other relay.")]
    way: WayName
    settings: Settings = Field(default_factory=dict)
    key_file: KeyFile
    standard: Annotated[
        bool, Field(description="Whether this is the standard relay (at most one entry).")
    ] = False

    @property
    def link_name(self) -> str:
        """The name of this side of the connection: ``<network>.<relay>``."""
        return f"{self.network}.{self.relay}"


class Periods(_Strict):
    """Periods and intervals, in seconds."""

    read_interval_seconds: Annotated[
        float, Field(gt=0, description="Pause between two rounds of reading and delivering.")
    ] = 5
    retry_first_seconds: Annotated[
        float, Field(gt=0, description="Pause before the second attempt to deliver.")
    ] = 10
    retry_max_seconds: Annotated[
        float, Field(gt=0, description="Longest pause between two attempts; it doubles up to this.")
    ] = 900
    delivery_deadline_seconds: Annotated[
        float,
        Field(
            gt=0,
            description="Time after which a message that cannot be handed over is undeliverable.",
        ),
    ] = 86_400
    seen_for_seconds: Annotated[
        float, Field(gt=0, description="How long a handover counts as seen (repetitions).")
    ] = 604_800
    attachment_grace_seconds: Annotated[
        float,
        Field(
            gt=0,
            description="Time an envelope with a missing or wrong attachment is kept before it "
            "is dropped.",
        ),
    ] = 300
    leftover_after_seconds: Annotated[
        float,
        Field(
            gt=0,
            description="Age after which unfinished files and attachments without envelope "
            "are removed.",
        ),
    ] = 3_600
    cleanup_interval_seconds: Annotated[
        float, Field(gt=0, description="Pause between two rounds of cleaning up.")
    ] = 600

    @model_validator(mode="after")
    def _the_pauses_fit(self) -> Self:
        if self.retry_max_seconds < self.retry_first_seconds:
            raise ValueError("retry_max_seconds must not be less than retry_first_seconds")
        return self


class Limits(_Strict):
    """Limits against overload (specification 4.5)."""

    max_hops: Annotated[
        int,
        Field(
            ge=1,
            le=63,
            description="A message whose list of relays has this length is undeliverable (loop).",
        ),
    ] = DEFAULT_MAX_HOPS
    read_batch: Annotated[
        int, Field(ge=1, le=1000, description="Envelopes read from an inbox in one step.")
    ] = DEFAULT_READ_BATCH
    max_queue_messages: Annotated[
        int,
        Field(
            ge=1,
            description="Messages in the queue; at this number the relay accepts nothing more.",
        ),
    ] = DEFAULT_MAX_QUEUE_MESSAGES
    max_attachment_storage_bytes: Annotated[
        int,
        Field(
            ge=1,
            description="Space for the attachments of the queue; when it would be exceeded the "
            "relay accepts nothing more.",
        ),
    ] = DEFAULT_MAX_ATTACHMENT_STORAGE_BYTES


class RelayConfig(_Strict):
    """The operating configuration of one relay."""

    network: Annotated[Name, Field(description="Name of the pipwerk network of this relay.")]
    name: Annotated[Name, Field(description="Name of this relay in its network.")]
    inputs: tuple[InputConfig, ...] = ()
    components: tuple[ComponentConfig, ...] = ()
    address_book: tuple[AddressBookEntry, ...] = ()
    periods: Periods = Field(default_factory=Periods)
    limits: Limits = Field(default_factory=Limits)

    @property
    def own_link_name(self) -> str:
        """The name of this relay as a side of a connection: ``<network>.<relay>``."""
        return f"{self.network}.{self.name}"

    @property
    def standard_relay(self) -> AddressBookEntry | None:
        return next((entry for entry in self.address_book if entry.standard), None)

    @model_validator(mode="after")
    def _the_entries_fit_together(self) -> Self:
        problems: list[str] = []
        _unique([item.name for item in self.inputs], "inputs", "name", problems)
        names = [item.name for item in self.components]
        _unique(names, "components", "name", problems)
        if RESERVED_COMPONENT_NAME in names:
            problems.append(f"components: the name '{RESERVED_COMPONENT_NAME}' is reserved")
        links = [entry.link_name for entry in self.address_book]
        _unique(links, "address_book", "network and relay", problems)
        if self.own_link_name in links:
            problems.append("address_book: this relay is not an entry of its own address book")
        if sum(entry.standard for entry in self.address_book) > 1:
            problems.append("address_book: at most one entry is the standard relay")
        key_files = [item.key_file for item in self.components]
        key_files += [entry.key_file for entry in self.address_book]
        _unique(key_files, "components and address_book", "key_file", problems)
        if problems:
            raise ValueError("; ".join(problems))
        return self


def _unique(values: list[str], where: str, what: str, problems: list[str]) -> None:
    if len(set(values)) != len(values):
        problems.append(f"{where}: {what} must differ")


def describe_validation_error(error: ValidationError) -> tuple[str, ...]:
    """Name every problem of a rejected document by its place, never by its value."""
    problems: list[str] = []
    for item in error.errors(include_input=False, include_url=False):
        place = ".".join(str(part) for part in item["loc"]) or "(document)"
        text = str(item["msg"]).removeprefix("Value error, ")
        problems.append(f"{place}: {text}")
    return tuple(dict.fromkeys(problems))


def parse_config(document: str | bytes) -> RelayConfig:
    """Read an operating configuration from JSON text; raises ``ConfigRejected``."""
    size = (
        len(document) if isinstance(document, bytes) else len(document.encode("utf-8", "replace"))
    )
    if size > MAX_CONFIG_BYTES:
        raise ConfigRejected((f"(document): larger than {MAX_CONFIG_BYTES} bytes",))
    try:
        return RelayConfig.model_validate_json(document)
    except ValidationError as error:
        raise ConfigRejected(describe_validation_error(error)) from None


def render_config(config: RelayConfig) -> str:
    """The text of a configuration as stored: JSON without insignificant white space."""
    return config.model_dump_json()


def pretty_config(document: str) -> str:
    """The stored configuration as indented JSON (``config show``)."""
    return json.dumps(json.loads(document), indent=2, ensure_ascii=False)
