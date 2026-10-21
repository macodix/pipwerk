import type { Choice, DataType, Label, TypeDescription } from '../api/elementTypes';
import type { ElementDocument, InstanceDocument, StrategyDocument } from '../document/types';
import { isConnectionValue } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import type { Usage } from '../arrange/scene';
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
      choices: (own.choices ?? []).map((id) => ({ id, label: { de: id, en: id } })),
      objectType: null,
      own: true,
    });
  }
  return rows;
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

/**
 * The values that the user connected or that expressions use, for the lines of the drawing area. `references` holds,
 * per element, the properties its expressions address (from the answer of the expression endpoint).
 */
export function collectUsage(
  document: StrategyDocument,
  references: ReadonlyMap<string, readonly ExpressionReference[]>,
): Usage[] {
  const byKey = instanceElementByKey(document);
  const found = new Map<string, Usage>();
  const add = (instanceKey: string, property: string, dst: string, solid: boolean): void => {
    const source = byKey.get(instanceKey.toLowerCase());
    if (source === undefined || source.id === dst) {
      return;
    }
    const key = `${source.id}|${property}|${dst}`;
    const existing = found.get(key);
    if (existing === undefined) {
      found.set(key, { src: source.id, prop: property, dst, solid });
    } else if (solid) {
      existing.solid = true;
    }
  };
  for (const element of document.elements) {
    for (const input of element.inputs) {
      add(input.instance, input.property, element.id, true);
    }
    const bindings = [
      ...Object.values(element.parameters),
      ...Object.values(element.properties),
      ...Object.values(element.instance?.parameter_values ?? {}),
    ];
    for (const binding of bindings) {
      if (binding.kind === 'connection' && isConnectionValue(binding.value)) {
        add(binding.value.instance, binding.value.property, element.id, true);
      }
    }
    for (const reference of references.get(element.id) ?? []) {
      add(reference.instance, reference.property, element.id, false);
    }
  }
  return [...found.values()];
}
