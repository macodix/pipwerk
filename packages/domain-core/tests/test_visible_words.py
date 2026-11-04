"""The visible texts of the library use the words of specification 5.4, point "Begriffe"
(order 23, finding F4 and F5 of the fourth acceptance).

Visible texts are every :class:`Label` the library delivers: names, descriptions, explanations
and labels of the type descriptions (parameters, properties, methods, arguments, outputs,
choices), the words of the data types and kinds, the delivered templates, the functions of the
formulas and the labels of the fields of findings. The library writes no text of a finding
itself (req-ui-007): it names element and field (``describe_findings``); the sentences of the
findings belong to the user interface. Field names, codes and identifiers are not texts; they
keep the words of the specification (``expression``, ``expression.empty``, ``ausdruck``).
"""

import dataclasses
import re
from collections.abc import Iterator
from typing import Any

import pytest

from pipwerk_domain import catalog
from pipwerk_domain.consistency import describe
from pipwerk_domain.defaults import builtin_template_texts, create_registry
from pipwerk_domain.expressions import list_functions
from pipwerk_domain.typedesc import (
    APPLICATION_INSTRUMENT,
    CATEGORY_LABELS,
    DATATYPE_LABELS,
    INSTRUMENT_CHOICES,
    INSTRUMENT_PARAMETER,
    MAIN_FLOW_EXPLANATION,
    ElementKind,
    Label,
    ObjectCategory,
    category_label,
)

REGISTRY = create_registry(entry_points=False)

EXCLUDED_DE = (
    "Ausdruck",
    "Ausdrück",
    "Objekttyp",
    "Objekt der Anwendung",
    "Objekte der Anwendung",
    "Objekten der Anwendung",
    "Einstellungen des Objekts",
    "(ohne Name)",
)
"""German words that no visible text may contain (specification 5.4)."""

ENGLISH_EXPRESSION = re.compile(r"\bexpressions?\b", re.IGNORECASE)
"""The English word for "Ausdruck". There are no exceptions among the texts of the library:
the field names (``expression``) and codes are no texts."""

ENGLISH_EXCLUDED = (
    re.compile(r"\bobject types?\b", re.IGNORECASE),
    re.compile(r"\bobjects? of the application\b", re.IGNORECASE),
    re.compile(r"\bsettings of the object\b", re.IGNORECASE),
    re.compile(r"\(no name\)", re.IGNORECASE),
)


def labels_in(value: Any) -> Iterator[Label]:
    """Every :class:`Label` inside a value made of dataclasses, tuples, lists and dicts."""
    if isinstance(value, Label):
        yield value
    elif dataclasses.is_dataclass(value) and not isinstance(value, type):
        for field in dataclasses.fields(value):
            yield from labels_in(getattr(value, field.name))
    elif isinstance(value, tuple | list):
        for item in value:
            yield from labels_in(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from labels_in(item)


def all_visible_labels() -> list[tuple[str, Label]]:
    found: list[tuple[str, Label]] = []
    for description in REGISTRY.list():
        found.extend((description.id, label) for label in labels_in(description))
    found.extend(("datatype", label) for label in labels_in(DATATYPE_LABELS))
    found.extend(("category", label) for label in labels_in(CATEGORY_LABELS))
    found.extend(("template", label) for label in labels_in(builtin_template_texts()))
    found.extend((item.name, label) for item in list_functions() for label in labels_in(item))
    found.extend(
        ("finding field", label)
        for label in (describe.CONNECTED_VALUES, describe.RULE_EXPRESSION, describe.RULESET_RESULT)
    )
    return found


def test_the_walk_finds_the_texts_of_all_types() -> None:
    found = all_visible_labels()
    assert len(found) > 700  # all delivered types with all their fields
    assert {item for item, _ in found} >= {"flow.condition", "EMA", "Order", "datatype"}


def test_no_visible_text_contains_an_excluded_word() -> None:
    for where, label in all_visible_labels():
        for word in EXCLUDED_DE:
            assert word not in label.de, (where, label.de)
        assert not ENGLISH_EXPRESSION.search(label.en), (where, label.en)
        for pattern in ENGLISH_EXCLUDED:
            assert not pattern.search(label.en), (where, label.en)


def test_the_formula_replaces_the_expression_in_condition_calculation_and_trend_method() -> None:
    condition = REGISTRY.get("flow.condition")
    calculation = REGISTRY.get("flow.calculation")
    method = REGISTRY.get(catalog.TREND_METHOD_EXPRESSION)
    assert condition is not None
    assert calculation is not None
    assert method is not None
    for description in (condition, calculation):
        parameter = description.parameter(catalog.EXPRESSION_PARAMETER)  # the identifier stays
        assert parameter is not None
        assert parameter.label == Label("Formel", "Formula")
    assert method.name == Label("Formel", "Formula")
    assert "Formel" in condition.description.de
    assert "formula" in condition.description.en
    field_label = describe.RULE_EXPRESSION
    assert field_label.de == "Formel"
    assert field_label.en == "Formula"
    trend = REGISTRY.get("Trend")
    assert trend is not None
    method_parameter = trend.parameter("berechnungsverfahren")
    assert method_parameter is not None
    assert "„Formel“" in method_parameter.explanation.de
    assert '"Formula"' in method_parameter.explanation.en


def test_the_fixed_value_of_the_instrument_has_the_label_of_the_client() -> None:
    expected = Label(
        "Voreingestelltes Instrument aus Strategie", "Default instrument from strategy"
    )
    assert INSTRUMENT_CHOICES[0].label == expected
    assert INSTRUMENT_CHOICES[0].id == APPLICATION_INSTRUMENT == "instrument_der_anwendung"
    description = REGISTRY.get("EMA")
    assert description is not None
    parameter = description.parameter(INSTRUMENT_PARAMETER)
    assert parameter is not None
    assert [item.label for item in parameter.choices] == [expected]
    market = REGISTRY.get("MarketOrder")
    assert market is not None
    prop = market.property(INSTRUMENT_PARAMETER)
    assert prop is not None
    assert [item.label for item in prop.choices] == [expected]


def test_every_text_with_the_main_flow_carries_the_explanation_as_a_sentence() -> None:
    assert MAIN_FLOW_EXPLANATION.de == (
        "Der Hauptablauf ist der Ablauf der Strategie ab ihren Auslösern, ohne die Schritte "
        "in den Order- und Positionsverwaltungen."
    )
    assert MAIN_FLOW_EXPLANATION.en == (
        "The main flow is the flow of the strategy from its triggers, without the steps "
        "inside the order and position managements."
    )
    named = [
        (where, label)
        for where, label in all_visible_labels()
        if "Hauptablauf" in label.de or "main flow" in label.en.lower()
    ]
    assert {where for where, _ in named} == {"trigger.manual"}
    for where, label in named:
        assert label.de.endswith(" " + MAIN_FLOW_EXPLANATION.de), (where, label.de)
        assert label.en.endswith(" " + MAIN_FLOW_EXPLANATION.en), (where, label.en)
        # the sentence stands once in a text, and the word in the first sentence comes before it
        assert label.de.count(MAIN_FLOW_EXPLANATION.de) == 1
        assert label.en.count(MAIN_FLOW_EXPLANATION.en) == 1


def test_the_kind_of_an_object_type_has_a_word_in_both_languages() -> None:
    words = dict(CATEGORY_LABELS)
    assert words == {
        ObjectCategory.INDICATOR: Label("Indikator", "indicator"),
        ObjectCategory.TREND: Label("Trend", "trend"),
        ObjectCategory.RULE: Label("Regel", "rule"),
        ObjectCategory.RULESET: Label("Regelwerk", "rule set"),
    }
    assert category_label(None) is None
    assert category_label(ObjectCategory.RULESET) == Label("Regelwerk", "rule set")


def test_each_object_type_of_the_catalog_names_its_kind() -> None:
    """The origin of an instance is its name, the word for the kind and the name of the type
    ("Indikator EMA")."""
    seen: set[ObjectCategory] = set()
    for description in REGISTRY.list(ElementKind.OBJECT_TYPE):
        if description.category is None:
            continue
        word = category_label(description.category)
        assert word is not None, description.id
        seen.add(description.category)
    assert seen == set(ObjectCategory)
    ema = REGISTRY.get("EMA")
    assert ema is not None
    assert category_label(ema.category) == Label("Indikator", "indicator")
    assert f"{category_label(ema.category).de} {ema.name.de}" == "Indikator EMA"  # type: ignore[union-attr]
    rule_set = REGISTRY.get("Regelwerk")
    assert rule_set is not None
    assert category_label(rule_set.category) == Label("Regelwerk", "rule set")


@pytest.mark.parametrize(
    "unnamed",
    ["(ohne Name)", "(no name)"],
)
def test_no_text_of_the_library_says_without_name_the_old_way(unnamed: str) -> None:
    """A text for an element without a name does not exist in the library; if one is added it
    reads "(noch ohne Name)" or "(no name yet)" (specification 5.4)."""
    for where, label in all_visible_labels():
        assert unnamed not in label.de, where
        assert unnamed not in label.en, where
