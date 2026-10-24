"""Address (specification 3.1): valid and invalid addresses."""

import pytest

from pipwerk_relaycore import Address, AddressError
from pipwerk_relaycore.address import check_link_name, check_name, check_relay

VALID_NAMES = ["a", "A", "0", "abc-def", "abc_def", "A1_b-2", "x" * 63, "9lives"]
INVALID_NAMES = [
    "",
    "-a",
    "_a",
    "a.b",
    "a b",
    "a/b",
    "a\\b",
    "a\n",
    "\na",
    "x" * 64,
    "ä",
    "a:b",
    "١٢",  # Arabic-Indic digits are not digits here
    "a\x00",
]


@pytest.mark.parametrize("name", VALID_NAMES)
def test_a_valid_name_is_accepted(name: str) -> None:
    assert check_name(name) == name


@pytest.mark.parametrize("name", INVALID_NAMES)
def test_an_invalid_name_is_rejected(name: str) -> None:
    with pytest.raises(AddressError):
        check_name(name)


def test_an_address_has_three_parts() -> None:
    address = Address.parse("comp.net.relay")
    assert (address.component, address.network, address.relay) == ("comp", "net", "relay")
    assert str(address) == "comp.net.relay"
    assert address.relay_name == "net.relay"


@pytest.mark.parametrize("text", ["comp.net.relay", "A.B.C", "a-1.b_2.c3", "x.y.z"])
def test_valid_addresses_are_parsed_and_written_unchanged(text: str) -> None:
    assert str(Address.parse(text)) == text


@pytest.mark.parametrize(
    "text",
    [
        "",
        "a",
        "a.b",
        "a.b.c.d",
        "a..c",
        ".b.c",
        "a.b.",
        "a.b.c\n",
        "a. b.c",
        "a.b.c d",
        "../b.c",
        "a/b.c.d",
        "a.-b.c",
        "a." + "x" * 64 + ".c",
    ],
)
def test_invalid_addresses_are_rejected(text: str) -> None:
    with pytest.raises(AddressError):
        Address.parse(text)


def test_upper_and_lower_case_count() -> None:
    assert Address.parse("Comp.net.relay") != Address.parse("comp.net.relay")


def test_a_dataclass_with_an_invalid_part_cannot_be_built() -> None:
    with pytest.raises(AddressError):
        Address("a.b", "net", "relay")


def test_names_of_relays_and_sides_of_connections() -> None:
    assert check_relay("net.relay") == "net.relay"
    assert check_link_name("component") == "component"
    assert check_link_name("net.relay") == "net.relay"
    for text in ("net", "net.relay.x", "net.", "a b.c"):
        with pytest.raises(AddressError):
            check_relay(text)
    for text in ("", "a.b.c", "a b"):
        with pytest.raises(AddressError):
            check_link_name(text)
