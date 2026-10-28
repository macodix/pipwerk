import type { Choice, DataType, Label, TypeDescription } from '../api/elementTypes';
import type { ElementDocument, InstanceDocument, StrategyDocument } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import { holdsInstance, labelText, managementOutput, type TypeIndex } from './typeIndex';

/** The name the user sees for an element: the name of its instance, its own name, or the name of its type. */
export function elementName(element: ElementDocument, types: TypeIndex, language: SupportedLanguage): string {
  if (element.instance !== undefined && element.instance !== null) {
    return element.instance.name;
  }
  if (typeof element.name === 'string' && element.name !== '') {
    return element.name;
  }
  const type = types.byId.get(element.type);
  return type === undefined ? element.type : labelText(type.name, language);
}

/** Whether the element is shown as a card (an object with its values) and not as a step of the flow. */
export function isCardElement(element: ElementDocument, types: TypeIndex): boolean {
  const type = types.byId.get(element.type);
  return type !== undefined && holdsInstance(type) && element.instance !== undefined && element.instance !== null;
}

/** A row of a card or of the list of values an object supplies. */
export type PropertyRow = {
  id: string;
  label: string;
  explanation: string;
  datatype: DataType;
  /** The word for the data type the type description carries (`datatype_label`); `null` for an own property. */
  datatypeLabel: Label | null;
  choices: Choice[];
  objectType: string | null;
  /** The user defined the property in the instance. */
  own: boolean;
};

function labelOrText(label: Label, language: SupportedLanguage): string {
  return labelText(label, language);
}

/** The properties an object supplies: those of its type and the own properties of the instance. */
export function propertyRows(
  type: TypeDescription | undefined,
  instance: InstanceDocument | null | undefined,
  language: SupportedLanguage,
): PropertyRow[] {
  const rows: PropertyRow[] =
    type?.properties.map((property) => ({
      id: property.id,
      label: labelOrText(property.label, language),
      explanation: labelOrText(property.explanation, language),
      datatype: property.datatype,
      datatypeLabel: property.datatypeLabel,
      choices: property.choices,
      objectType: property.objectType,
      own: false,
    })) ?? [];
  for (const own of instance?.properties ?? []) {
    rows.push({
      id: own.key,
      label: own.name,
      explanation: '',
      datatype: own.datatype,
      datatypeLabel: null,
      choices: (own.choices ?? []).map((id) => ({ id, label: { de: id, en: id } })),
      objectType: null,
      own: true,
    });
  }
  return rows;
}

/** A row of a card: a property or a method of the object, with its name and the datatype or the word "Methode". */
export type CardRow = PropertyRow & {
  /** The row is a method; the datatype is the one of its result. */
  method: boolean;
};

/**
 * The rows of the card of an object (specification 5.3): its properties, then its methods, then the own properties of
 * the instance. Each is one row with its name and a connection point.
 */
export function cardRows(
  type: TypeDescription | undefined,
  instance: InstanceDocument | null | undefined,
  language: SupportedLanguage,
): CardRow[] {
  const rows = propertyRows(type, instance, language);
  const own = rows.filter((row) => row.own);
  const supplied = rows.filter((row) => !row.own);
  const methods: CardRow[] = (type?.methods ?? []).map((method) => ({
    id: method.id,
    label: labelOrText(method.label, language),
    explanation: labelOrText(method.explanation, language),
    datatype: method.datatype,
    datatypeLabel: method.datatypeLabel,
    choices: method.choices,
    objectType: method.objectType,
    own: false,
    method: true,
  }));
  return [...supplied.map((row) => ({ ...row, method: false })), ...methods, ...own.map((row) => ({ ...row, method: false }))];
}

/** The outputs of an element: those of its type, for an unknown type the ones with a stored connection. */
export function outputsOf(
  element: ElementDocument,
  type: TypeDescription | undefined,
  document: StrategyDocument,
  language: SupportedLanguage,
): { id: string; label: string; explanation: string; management: boolean }[] {
  if (type !== undefined) {
    return type.outputs.map((output) => ({
      id: output.id,
      label: labelText(output.label, language),
      explanation: labelText(output.explanation, language),
      management: output.holdsManagement,
    }));
  }
  const ids: string[] = [];
  for (const connection of document.connections) {
    if (connection.source === element.id && !ids.includes(connection.output)) {
      ids.push(connection.output);
    }
  }
  return ids.map((id) => ({ id, label: id, explanation: '', management: false }));
}

/** The element that owns the management an element belongs to, if that element exists and has a frame. */
export function managementOwner(
  element: ElementDocument,
  document: StrategyDocument,
  types: TypeIndex,
): string | null {
  const owner = element.management_of;
  if (owner === null || owner === undefined) {
    return null;
  }
  // follow the chain of owners; a chain that does not end in the main flow counts as the main flow
  const seen = new Set<string>([element.id]);
  let current: string | null = owner;
  while (current !== null) {
    if (seen.has(current)) {
      return null;
    }
    seen.add(current);
    const next: ElementDocument | undefined = document.elements.find((candidate) => candidate.id === current);
    if (next === undefined || !ownsManagement(next, document, types)) {
      return null;
    }
    current = next.management_of;
  }
  return owner;
}

/** Whether an element has a management (a frame): its type has an output that holds it (specification 3.1). */
export function ownsManagement(element: ElementDocument, _document: StrategyDocument, types: TypeIndex): boolean {
  return managementOutput(types.byId.get(element.type)) !== null;
}

/** The element of a document that carries the instance with the given identifier in expressions (compared without regard to case). */
export function instanceElementByKey(document: StrategyDocument): Map<string, ElementDocument> {
  const map = new Map<string, ElementDocument>();
  for (const element of document.elements) {
    if (element.instance !== undefined && element.instance !== null) {
      map.set(element.instance.key.toLowerCase(), element);
    }
  }
  return map;
}

/** A property of an instance that an expression addresses: the identifiers of the instance and the property. */
export type ExpressionReference = { instance: string; property: string };
