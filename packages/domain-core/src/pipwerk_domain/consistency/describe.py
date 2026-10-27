"""The names that tell findings apart (specification 3.6, Mangel E3 of the third acceptance).

A finding names the affected element by its identifier and the affected instance or rule by its
key. The user sees neither: he sees the name of the element and the label of the field in the
element. :func:`describe_findings` adds both to each finding, so that several findings with the
same text can be told apart and the user interface can say where to look.

The labels are those of the type descriptions in German and English; the names are those the
user gave. Nothing here writes the text of a finding (req-ui-007).
"""

from collections.abc import Iterable

from pipwerk_domain.consistency import findings as fc
from pipwerk_domain.consistency.findings import Finding
from pipwerk_domain.model import Element, Instance, ObjectContent, Strategy, Template
from pipwerk_domain.namespaces import order_properties
from pipwerk_domain.registry import ORDER_TYPE_PARAMETER, ElementRegistry
from pipwerk_domain.typedesc import Label

CONNECTED_VALUES = Label("Verbundene Werte", "Connected values")
"""The field of a finding about an input of an element (specification 5.4)."""

RULE_EXPRESSION = Label("Ausdruck", "Expression")
"""The field of a finding about the expression of a rule."""

RULESET_RESULT = Label("Gesamtergebnis", "Overall result")
"""The field of a finding about the overall result of a ruleset."""

_INPUT_CODES = frozenset({fc.INPUT_UNUSED, fc.INPUT_REFRESH_NOT_ALLOWED})


def _named(name: str) -> Label:
    """A name of the user: the same in both languages."""
    return Label(name, name)


def _children(content: ObjectContent) -> list[Instance]:
    return [*content.instances, *content.rules]


def _find_child(candidates: Iterable[Instance], key: str) -> Instance | None:
    for item in candidates:
        if item.key.lower() == key.lower():
            return item
    return None


class _Describer:
    def __init__(self, value: Strategy | Template, registry: ElementRegistry) -> None:
        self.value = value
        self.registry = registry
        self.elements: dict[str, Element] = (
            {item.id: item for item in value.elements} if isinstance(value, Strategy) else {}
        )

    # --- element and subject ------------------------------------------------------------

    def element_of(self, finding: Finding) -> Element | None:
        return None if finding.element is None else self.elements.get(finding.element)

    def element_name(self, element: Element | None) -> Label | None:
        if element is None:
            return None
        name = element.shown_name
        if name:
            return _named(name)
        description = self.registry.get(element.type)
        return _named(element.type) if description is None else description.name

    def roots(self, element: Element | None) -> list[Instance]:
        """The instances and rules a subject path can start at."""
        if isinstance(self.value, Template):
            return _children(self.value)
        if element is not None:
            own = [] if element.instance is None else [element.instance]
            return [*own, *element.rules]
        found: list[Instance] = list(self.value.rules)
        for item in self.value.elements:
            if item.instance is not None:
                found.append(item.instance)
            found.extend(item.rules)
        return found

    def content_of(self, finding: Finding, element: Element | None) -> ObjectContent | None:
        """The instance or rule the finding concerns: the subject path read from its start."""
        subject = finding.subject
        if not subject:
            return self.value if isinstance(self.value, Template) else None
        parts = subject.split(".")
        current = _find_child(self.roots(element), parts[0])
        if current is None and element is not None:
            current = _find_child(self.roots(None), parts[0])
        for part in parts[1:]:
            if current is None:
                return None
            current = _find_child(_children(current), part)
        return current

    def subject_name(self, finding: Finding, content: ObjectContent | None) -> str | None:
        if isinstance(content, Instance):
            return content.name
        if finding.subject and isinstance(self.value, Strategy):
            for parameter in self.value.parameters:
                if parameter.key.lower() == finding.subject.lower():
                    return parameter.name
        return None

    # --- field --------------------------------------------------------------------------

    def parameter_label(
        self, identifier: str, element: Element | None, content: ObjectContent | None
    ) -> Label | None:
        if content is not None:
            for definition in content.parameters:
                if definition.key.lower() == identifier.lower():
                    return _named(definition.name)
            description = self.registry.get(content.object_type)
        elif element is not None:
            description = self.registry.get(element.type)
        else:
            return None
        found = None if description is None else description.parameter(identifier)
        return None if found is None else found.label

    def property_label(
        self, identifier: str, element: Element | None, content: ObjectContent | None
    ) -> Label | None:
        if content is not None:
            for definition in content.properties:
                if definition.key.lower() == identifier.lower():
                    return _named(definition.name)
            description = self.registry.get(content.object_type)
            found = None if description is None else description.property(identifier)
            if found is not None:
                return found.label
        if element is not None:
            description = self.registry.get(element.type)
            found = None if description is None else description.property(identifier)
            if found is not None:
                return found.label
            binding = element.parameters.get(ORDER_TYPE_PARAMETER)
            order_type = binding.value if binding is not None else None
            if isinstance(order_type, str):
                order = self.registry.get(order_type)
                found = None if order is None else order.property(identifier)
                if found is not None:
                    return found.label
        for item in order_properties(self.registry, None):
            if item.id == identifier:
                return item.label
        return None

    def field_label(
        self, finding: Finding, element: Element | None, content: ObjectContent | None
    ) -> Label | None:
        details = finding.details
        if finding.code in _INPUT_CODES or details.get("where") == "input":
            return CONNECTED_VALUES
        field = details.get("field")
        if isinstance(field, str):
            kind, _, identifier = field.partition(":")
            if kind == "parameter":
                return self.parameter_label(identifier, element, content)
            if kind == "property":
                return self.property_label(identifier, element, content)
            if kind == "property_definition":
                return self.property_label(identifier, None, content)
            if field == "expression":
                return RULE_EXPRESSION
            if field == "result_expression":
                return RULESET_RESULT
            return None
        parameter = details.get("parameter")
        if isinstance(parameter, str):
            if details.get("scope") == "strategy" and isinstance(self.value, Strategy):
                for item in self.value.parameters:
                    if item.key.lower() == parameter.lower():
                        return _named(item.name)
                return None
            return self.parameter_label(parameter, element, content)
        prop = details.get("property")
        if isinstance(prop, str):
            return self.property_label(prop, element, content)
        return None

    def describe(self, finding: Finding) -> Finding:
        element = self.element_of(finding)
        content = self.content_of(finding, element)
        return Finding(
            finding.level,
            finding.code,
            finding.element,
            finding.subject,
            finding.details,
            element_name=self.element_name(element),
            subject_name=self.subject_name(finding, content),
            field_label=self.field_label(finding, element, content),
        )


def describe_findings(
    findings: Iterable[Finding], value: Strategy | Template, registry: ElementRegistry
) -> list[Finding]:
    """The findings with ``element_name``, ``subject_name`` and ``field_label`` filled in, for
    the strategy or template they were found in."""
    describer = _Describer(value, registry)
    return [describer.describe(item) for item in findings]


__all__ = ["CONNECTED_VALUES", "RULESET_RESULT", "RULE_EXPRESSION", "describe_findings"]
