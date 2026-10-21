"""Designations of fixed instruments (specification 3.1): a currency pair of two currency
codes of ISO 4217 or an ISIN of ISO 6166, independent of the broker."""

_CURRENCY_CODE_TEXT = """
AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD
BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUP CVE CZK DJF DKK DOP DZD
EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD
IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL
MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN
PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN
SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VED VES
VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XCG XDR XOF XPD XPF XPT XSU XTS XUA XXX YER
ZAR ZMW ZWG
"""

CURRENCY_CODES = frozenset(_CURRENCY_CODE_TEXT.split())
"""The currency codes of ISO 4217 that the library brings along (state of the library; the
list is updated with new versions of the library). Every code of the list is valid, also
twice in one pair."""


def is_currency_pair(text: str) -> bool:
    """Whether the text (upper case) is two codes of ISO 4217 one behind the other."""
    return len(text) == 6 and text[:3] in CURRENCY_CODES and text[3:] in CURRENCY_CODES


def _isin_digits(text: str) -> str:
    """The letters replaced by their numbers (A = 10 to Z = 35), digits unchanged."""
    return "".join(str(int(char, 36)) for char in text)


def has_isin_check_digit(text: str) -> bool:
    """Whether the last character of a text of twelve characters is the check digit of the
    other eleven (Luhn procedure over the digits of the converted text)."""
    digits = _isin_digits(text)
    total = 0
    for position, char in enumerate(reversed(digits)):
        number = int(char)
        if position % 2 == 1:
            number *= 2
            if number > 9:
                number -= 9
        total += number
    return total % 10 == 0


def is_isin(text: str) -> bool:
    """Whether the text (upper case) is an ISIN: two letters, nine letters or digits and a
    check digit. The first two letters are not checked against a list of countries, because
    the norm allows other codes there too, for example ``XS``."""
    if len(text) != 12 or not text.isascii():
        return False
    if not (text[:2].isalpha() and text[:2].isupper()):
        return False
    body = text[2:11]
    if not all(char.isdigit() or ("A" <= char <= "Z") for char in body):
        return False
    if not text[11].isdigit():
        return False
    return has_isin_check_digit(text)


def normalize_designation(text: str) -> str:
    """The designation as it is stored: in upper case."""
    return text.upper()


def is_valid_designation(text: str) -> bool:
    """Whether the text is a valid designation of a fixed instrument. Lower case is accepted
    (:func:`normalize_designation` writes it in upper case)."""
    if not text.isascii():  # the upper case of some other letters is an ASCII letter
        return False
    designation = normalize_designation(text)
    return is_currency_pair(designation) or is_isin(designation)
