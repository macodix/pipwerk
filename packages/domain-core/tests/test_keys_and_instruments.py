"""Keys of objects (specification 3.3) and designations of fixed instruments (specification 3.1)."""

import pytest

from pipwerk_domain import catalog
from pipwerk_domain.defaults import default_registry
from pipwerk_domain.identifiers import (
    form_key,
    is_valid_key,
    name_from_programming_name,
)
from pipwerk_domain.instruments import (
    CURRENCY_CODES,
    has_isin_check_digit,
    is_currency_pair,
    is_isin,
    is_valid_designation,
    normalize_designation,
)
from pipwerk_domain.model import Element, Instance, Strategy, StrategyParameter, Template
from pipwerk_domain.operations import ScopeError, new_key
from pipwerk_domain.typedesc import DataType
from tests.helpers import calculation, ema, rule, ruleset, template, uid

# keys ----------------------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("name", "taken", "fallback", "expected"),
    [
        ("EMA 20", [], "ema", "ema_20"),
        ("Stop-Abstand", [], "parameter", "stop_abstand"),
        ("Größe ß", [], "parameter", "groesse_ss"),
        ("Punkt 1/3", [], "x", "punkt_13"),
        ("Kerze", ["kerze"], "kerze", "kerze_2"),
        ("Kerze", ["KERZE", "kerze_2"], "kerze", "kerze_3"),
        ("", [], "bedingung", "bedingung"),
        ("???", [], "berechnung", "berechnung"),
        ("", ["bedingung"], "bedingung", "bedingung_2"),
        ("1. Versuch", [], "x", "n_1_versuch"),
        ("123", [], "x", "n_123"),
        ("_x", [], "x", "n__x"),
        ("Konto", ["Konto"], "x", "konto_2"),  # an object of the application
        ("IF", ["if"], "x", "if_2"),  # a function
    ],
)
def test_a_key_is_formed_from_the_first_name(
    name: str, taken: list[str], fallback: str, expected: str
) -> None:
    key = form_key(name, taken, fallback)
    assert key == expected
    assert is_valid_key(key)


def test_the_key_is_unique_without_regard_to_case() -> None:
    assert form_key("ABC", ["abc"]) == "abc_2"


def test_a_key_is_never_longer_than_the_limit() -> None:
    key = form_key("x" * 500, [])
    assert len(key) <= 200
    assert is_valid_key(key)


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("a", True),
        ("_a", True),
        ("ema_20", True),
        ("EMA20", True),
        ("", False),
        ("1a", False),
        ("a b", False),
        ("größe", False),
        ("a.b", False),
        ("a" * 200, True),
        ("a" * 201, False),
    ],
)
def test_what_a_key_can_be(text: str, expected: bool) -> None:
    assert is_valid_key(text) is expected


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("stop_abstand", "Stop abstand"),
        ("order_ausgefuehrt", "Order ausgefuehrt"),
        ("EMA20", "EMA20"),
        ("Stop abstand", "Stop abstand"),  # a space: not programming spelling
        ("Stop_abstand neu", "Stop_abstand neu"),
        ("_a__b_", "A b"),
        ("", ""),
        ("Größe", "Größe"),
    ],
)
def test_names_in_programming_spelling_are_written_with_spaces(text: str, expected: str) -> None:
    assert name_from_programming_name(text) == expected


# keys for new objects through the operations ---


def test_new_keys_in_the_namespace_of_a_strategy() -> None:
    strategy = Strategy(
        id=uid(900),
        name="t",
        elements=[
            Element(id=uid(1), type="EMA", instance=ema("ema_20")),
            calculation(2, "stop", "1"),
        ],
        rules=[rule("risiko", "TRUE()")],
        parameters=[StrategyParameter("Zeit", DataType.TIME_UNIT, "h1")],
    )
    assert (
        new_key(strategy, "/elements", "EMA 20", kind="instance", object_type="EMA") == "ema_20_2"
    )
    assert new_key(strategy, "/elements", "Stop") == "stop_2"
    assert new_key(strategy, "/elements", "Risiko") == "risiko_2"
    assert new_key(strategy, "/rules", "Kerze") == "kerze_2"  # the object of the application
    assert new_key(strategy, "/elements", "", kind="condition") == "bedingung"
    assert new_key(strategy, "/elements", "", kind="calculation") == "berechnung"
    assert new_key(strategy, "/elements", "", kind="instance", object_type="ZigZag") == "zigzag"
    assert new_key(strategy, "/parameters", "Zeit") == "zeit_2"
    assert new_key(strategy, "/parameters", "") == "parameter"
    assert new_key(strategy, "/parameters", "Kerze") == "kerze"  # behind "Strategie." no clash
    assert new_key(strategy, "/parameters", "Name") == "name_2"  # a property of `Strategie`


def test_new_keys_in_the_namespaces_of_elements_and_templates() -> None:
    order = Element(id=uid(1), type="flow.place_order", rules=[rule("mindest", "TRUE()")])
    strategy = Strategy(id=uid(900), name="t", elements=[order])
    assert new_key(strategy, "/elements/0/rules", "Mindest") == "mindest_2"
    value = template(
        catalog.TYPE_INDICATOR,
        instances=[ema("ema20")],
        rules=[ruleset("werk", [])],
    )
    assert new_key(value, "/instances", "EMA20") == "ema20_2"
    assert new_key(value, "/rules", "Werk") == "werk_2"
    assert new_key(value, "/parameters", "Instrument") == "instrument_2"  # brought by the type
    assert new_key(value, "/parameters", "Zeiteinheit") == "zeiteinheit_2"
    assert new_key(value, "/properties", "Wert") == "wert"
    assert new_key(value, "/properties", "", kind="property") == "eigenschaft"


def test_a_pointer_that_names_no_list_is_refused() -> None:
    strategy = Strategy(id=uid(900), name="t")
    for scope in ("", "/nope", "/elements/3/rules", "/elements/x/rules", "elements", "/a~2"):
        with pytest.raises(ScopeError):
            new_key(strategy, scope, "x")
    with pytest.raises(ScopeError):
        new_key(Template(id=uid(1), name="t", object_type="Regel"), "/elements", "x")


def test_a_key_is_formed_when_no_key_is_given_in_the_model() -> None:
    assert Instance(name="Ä Ö", object_type="x").key == "ae_oe"


def test_the_registry_knows_the_reserved_words() -> None:
    assert default_registry().get("Konto") is not None


# designations of instruments ------------------------------------------------------------------


@pytest.mark.parametrize("text", ["EURUSD", "USDJPY", "GBPCHF", "EUREUR", "XAUUSD", "usdjpy"])
def test_currency_pairs_of_two_codes_of_the_list_are_valid(text: str) -> None:
    assert is_valid_designation(text)


@pytest.mark.parametrize(
    "text",
    ["", "EUR", "EURUS", "EURUSDX", "EUR/USD", "EUR USD", "EURUSD ", "ABCDEF", "EURXYZ", "123456"],
)
def test_other_currency_pairs_are_invalid(text: str) -> None:
    assert not is_valid_designation(text)


def test_the_list_of_currency_codes() -> None:
    assert {"EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD", "XAU", "XAG"} <= CURRENCY_CODES
    assert all(len(code) == 3 and code.isupper() and code.isascii() for code in CURRENCY_CODES)
    assert is_currency_pair("USDUSD")  # every code of the list, also twice
    assert not is_currency_pair("usdeur")  # the stored text is in upper case


@pytest.mark.parametrize(
    "text",
    [
        "US0378331005",  # Apple
        "DE000BAY0017",  # Bayer
        "GB0002634946",  # BAE Systems
        "XS0000000009",  # a prefix that is no country
        "us0378331005",  # lower case is accepted on input
    ],
)
def test_isin_with_a_correct_check_digit_is_valid(text: str) -> None:
    assert is_valid_designation(text)


@pytest.mark.parametrize(
    "text",
    [
        "US0378331006",  # wrong check digit
        "DE000BAY0018",
        "US037833100",  # too short
        "US03783310055",  # too long
        "0S0378331005",  # no letters at the start
        "US037833100A",  # the check digit is a digit
        "US03783-1005",
        "ÜS0378331005",
    ],
)
def test_isin_with_a_wrong_form_or_check_digit_is_invalid(text: str) -> None:
    assert not is_valid_designation(text)


def test_the_check_digit_of_the_known_isin() -> None:
    assert has_isin_check_digit("US0378331005")
    assert not has_isin_check_digit("US0378331004")
    assert is_isin("DE000BAY0017")
    assert not is_isin("de000bay0017")  # the function takes the stored text in upper case


def test_a_designation_is_stored_in_upper_case() -> None:
    assert normalize_designation("eurusd") == "EURUSD"
    assert normalize_designation("us0378331005") == "US0378331005"


def test_a_letter_whose_upper_case_is_ascii_does_not_make_a_designation() -> None:
    assert not is_valid_designation("ſusdeur")  # long s: upper case is S
    assert not is_valid_designation("ıso")
