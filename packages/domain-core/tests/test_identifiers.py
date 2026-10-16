import pytest

from pipwerk_domain.identifiers import identifier_from_name


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("Trend intakt", "trend_intakt"),
        ("Punkt 1/3", "punkt_13"),
        ("Punkt 1/3 endgültig", "punkt_13_endgueltig"),
        ("aufwärts", "aufwaerts"),
        ("Stop-Loss", "stop_loss"),
        ("Take-Profit", "take_profit"),
        ("Order-ID", "order_id"),
        ("Tickgröße", "tickgroesse"),
        ("Währung", "waehrung"),
        ("Straße", "strasse"),
        ("nicht gestellt", "nicht_gestellt"),
        ("geändert", "geaendert"),
        ("Ergebnis", "ergebnis"),
        ("bis auf Widerruf", "bis_auf_widerruf"),
        ("offener Gewinn oder Verlust", "offener_gewinn_oder_verlust"),
        ("ÄÖÜ", "aeoeue"),
        ("A (B)", "a_b"),
        ("", ""),
    ],
)
def test_identifier_formation(name: str, expected: str) -> None:
    assert identifier_from_name(name) == expected


def test_identifier_is_stable_for_identifiers() -> None:
    assert identifier_from_name(identifier_from_name("Punkt 1/3")) == "punkt_13"


def test_decomposed_umlaut_is_treated_like_the_composed_one() -> None:
    assert identifier_from_name("ä") == "ae"
