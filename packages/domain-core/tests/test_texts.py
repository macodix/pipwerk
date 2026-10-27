"""The texts of the delivered types, functions and rules (specification 3.1, 5.1; Mangel E1, E6
and E10 of the third acceptance): what the library says to the user, in German and English."""

import re
from collections.abc import Iterator

from pipwerk_domain.defaults import builtin_template_texts, default_registry
from pipwerk_domain.expressions.functions import list_functions
from pipwerk_domain.typedesc import Label

MANAGEMENT_DE = "Order- und Positionsverwaltung"
MANAGEMENT_EN = "order and position management"


def labels() -> Iterator[tuple[str, Label]]:
    """Every text of the delivered types, with the place it stands at."""
    for description in default_registry().list():
        base = description.id
        yield f"{base} name", description.name
        yield f"{base} description", description.description
        yield f"{base} explanation", description.explanation
        for parameter in description.parameters:
            yield f"{base}.{parameter.id} label", parameter.label
            yield f"{base}.{parameter.id} explanation", parameter.explanation
            for choice in parameter.choices:
                yield f"{base}.{parameter.id}={choice.id}", choice.label
        for prop in description.properties:
            yield f"{base}.{prop.id} label", prop.label
            yield f"{base}.{prop.id} explanation", prop.explanation
            for choice in prop.choices:
                yield f"{base}.{prop.id}={choice.id}", choice.label
        for output in description.outputs:
            yield f"{base}>{output.id} label", output.label
            yield f"{base}>{output.id} explanation", output.explanation
    for function in list_functions():
        yield f"{function.name} label", function.label
        yield f"{function.name} explanation", function.explanation
        for argument in function.parameters:
            yield f"{function.name}({argument.name}) label", argument.label
            yield f"{function.name}({argument.name}) explanation", argument.explanation
    for texts in builtin_template_texts():
        yield f"{texts.template_id} name", texts.name
        yield f"{texts.template_id} explanation", texts.explanation


def test_the_short_form_management_does_not_occur_in_any_text() -> None:
    """Mangel E1: "Order- und Positionsverwaltung", English "order and position management",
    no short form, also within a sentence."""
    seen = 0
    for place, label in labels():
        for text in (label.de, label.en):
            if "erwaltung" in text or "anagement" in text:
                seen += 1
        rest_de = label.de.replace(MANAGEMENT_DE, "")
        rest_en = label.en.replace(MANAGEMENT_EN, "")
        assert "erwaltung" not in rest_de, (place, label.de)
        assert "anagement" not in rest_en, (place, label.en)
    assert seen >= 4  # the texts that speak of it say it in full


def test_the_texts_that_speak_of_the_management_say_it_in_full_in_both_languages() -> None:
    registry = default_registry()
    placed = registry.get("flow.place_order")
    assert placed is not None
    gestellt = placed.output("gestellt")
    assert gestellt is not None
    assert MANAGEMENT_DE in gestellt.explanation.de
    assert MANAGEMENT_EN in gestellt.explanation.en
    manual = registry.get("trigger.manual")
    assert manual is not None
    assert MANAGEMENT_DE in manual.explanation.de and MANAGEMENT_EN in manual.explanation.en
    delete = registry.get("flow.delete_order")
    assert delete is not None
    assert MANAGEMENT_DE in delete.explanation.de and MANAGEMENT_EN in delete.explanation.en
    order = registry.get("Order")
    assert order is not None
    assert MANAGEMENT_DE in order.description.de and MANAGEMENT_EN in order.description.en


def test_a_strategy_does_not_calculate() -> None:
    """Mangel E6: it is the event that starts the strategy. No text says that a strategy
    calculates."""
    for place, label in labels():
        assert not re.search(r"Strategie rechnet", label.de), (place, label.de)
        assert not re.search(r"strategy calculates", label.en), (place, label.en)
    for type_id in ("trigger.candle_close", "trigger.tick", "trigger.manual"):
        description = default_registry().get(type_id)
        assert description is not None
        assert description.explanation.de.startswith("Startet die Strategie"), type_id
        assert description.explanation.en.startswith("Starts the strategy"), type_id


def test_no_crossing_is_named_as_an_example_of_a_condition() -> None:
    """A crossing is no building block any more (Mangel E12); the texts do not offer it."""
    condition = default_registry().get("flow.condition")
    assert condition is not None
    assert "kreuzt" not in condition.explanation.de
    assert "crosses" not in condition.explanation.en
    for place, label in labels():
        assert "Kreuzung" not in label.de and "crossing" not in label.en.lower(), place


def test_every_text_exists_in_both_languages_and_every_explanation_says_something() -> None:
    for place, label in labels():
        assert bool(label.de.strip()) == bool(label.en.strip()), place
    for description in default_registry().list():
        if description.kind.value in ("trigger", "flow", "application_object", "object_type"):
            assert description.explanation.de.strip(), description.id
            assert description.explanation.en.strip(), description.id
        for output in description.outputs:
            assert output.explanation.de.strip(), (description.id, output.id)


def test_no_text_has_an_empty_sentence_or_a_doubled_space() -> None:
    for place, label in labels():
        for text in (label.de, label.en):
            assert "  " not in text, (place, text)
            assert text == text.strip(), (place, text)
