"""The words for the data types in trader language (specification 3.1, 5.4, Mangel E11 of the
third acceptance) and the preset of the instrument (hint 1 of the architecture review)."""

import pytest

from pipwerk_domain.consistency import Level
from pipwerk_domain.defaults import default_registry
from pipwerk_domain.model import Binding, Strategy, StrategyParameter
from pipwerk_domain.typedesc import (
    APPLICATION_INSTRUMENT,
    DATATYPE_LABELS,
    INSTRUMENT_PARAMETER,
    BindingKind,
    DataType,
    Label,
    datatype_label,
)
from tests.helpers import check, connect, place_order, trigger, uid


def test_every_data_type_has_a_word_in_both_languages() -> None:
    assert set(DATATYPE_LABELS) == set(DataType)
    for datatype, label in DATATYPE_LABELS.items():
        assert label.de.strip() and label.en.strip(), datatype
    assert len({label.de for label in DATATYPE_LABELS.values()}) == len(DATATYPE_LABELS)
    assert len({label.en for label in DATATYPE_LABELS.values()}) == len(DATATYPE_LABELS)


@pytest.mark.parametrize(
    ("datatype", "german", "english"),
    [
        (DataType.NUMBER, "Zahl", "number"),
        (DataType.INTEGER, "ganze Zahl", "whole number"),
        (DataType.PERCENT, "Prozentwert", "percentage"),
        (DataType.BOOLEAN, "Wahrheitswert", "true/false value"),
        (DataType.TEXT, "Text", "text"),
        (DataType.CHOICE, "Auswahl", "choice"),
        (DataType.TIME_UNIT, "Zeiteinheit", "time unit"),
        (DataType.TIMESTAMP, "Zeitpunkt", "point in time"),
        (DataType.DATE, "Datum", "date"),
        (DataType.EXPRESSION, "Formel", "formula"),
        (DataType.OBJECT, "Objekt", "object"),
    ],
)
def test_the_words(datatype: DataType, german: str, english: str) -> None:
    assert datatype_label(datatype) == Label(german, english)


def test_an_object_is_called_by_the_name_of_its_object_type() -> None:
    registry = default_registry()
    instrument = registry.get("Instrument")
    assert instrument is not None
    assert registry.datatype_label(DataType.OBJECT, "Instrument") == instrument.name
    assert registry.datatype_label(DataType.OBJECT, "Konto") == Label("Konto", "Account")
    assert registry.datatype_label(DataType.OBJECT, "Position") == Label("Position", "Position")
    # an object type that is not registered, or none: the general word
    assert (
        registry.datatype_label(DataType.OBJECT, "GibtEsNicht") == DATATYPE_LABELS[DataType.OBJECT]
    )
    assert registry.datatype_label(DataType.OBJECT) == DATATYPE_LABELS[DataType.OBJECT]
    # the object type does not matter for any other data type
    assert registry.datatype_label(DataType.NUMBER, "Instrument") == Label("Zahl", "number")


def test_the_name_of_an_object_type_of_the_user_is_in_both_languages() -> None:
    assert datatype_label(DataType.OBJECT, Label("Messreihe", "Series")) == Label(
        "Messreihe", "Series"
    )


def test_the_instrument_is_preset_with_the_instrument_of_the_application() -> None:
    """The type descriptions give the preset and the way back to it: the fixed value
    "Instrument der Anwendung" is the default and the one choice of the parameter."""
    registry = default_registry()
    for type_id in ("trigger.candle_close", "trigger.tick", "EMA", "Kerze", "Instrument"):
        description = registry.get(type_id)
        assert description is not None
        parameter = description.parameter(INSTRUMENT_PARAMETER)
        assert parameter is not None, type_id
        assert parameter.default == APPLICATION_INSTRUMENT
        assert [item.id for item in parameter.choices] == [APPLICATION_INSTRUMENT]
        assert parameter.choices[0].label == Label(
            "Instrument der Anwendung", "Instrument of the application"
        )
        assert set(parameter.bindings) == set(BindingKind)  # other bindings are allowed
        assert parameter.object_type == "Instrument"
        assert not parameter.required  # the user does not have to choose
    market = registry.get("MarketOrder")
    assert market is not None
    prop = market.property(INSTRUMENT_PARAMETER)
    assert prop is not None
    assert prop.default == APPLICATION_INSTRUMENT
    assert [item.id for item in prop.choices] == [APPLICATION_INSTRUMENT]


def test_the_way_back_to_the_instrument_of_the_application_is_a_valid_document() -> None:
    """Another binding of the instrument and the fixed value "Instrument der Anwendung" again:
    neither gives a finding."""
    strategy = Strategy(
        id=uid(900),
        name="Test",
        parameters=[
            StrategyParameter(
                "Mein Instrument",
                DataType.OBJECT,
                value="EURUSD",
                key="mein_instrument",
                object_type="Instrument",
            )
        ],
        elements=[trigger(1), place_order(2)],
        connections=[connect(1, "weiter", 2)],
    )
    start = strategy.elements[0]
    start.parameters[INSTRUMENT_PARAMETER] = Binding(BindingKind.PARAMETER, "mein_instrument")
    assert [item for item in check(strategy) if item.level is Level.ERROR] == []
    start.parameters[INSTRUMENT_PARAMETER] = Binding(BindingKind.FIXED, "EURUSD")
    assert [item for item in check(strategy) if item.level is Level.ERROR] == []
    start.parameters[INSTRUMENT_PARAMETER] = Binding(BindingKind.FIXED, APPLICATION_INSTRUMENT)
    assert check(strategy) == []
