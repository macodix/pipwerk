import type { DataType, TypeDescription } from '../api/elementTypes';
import type { ElementDocument, StrategyDocument } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import type { LibraryEntry, LibraryGroup } from '../library/libraryModel';
import { isCardElement, propertyRows } from '../model/elements';
import { contentKind } from '../model/objectContent';
import { managementOutput, orderSelector, type TypeIndex } from '../model/typeIndex';

/**
 * What the guided setup offers (specification 5.5), found in the type descriptions by their form and without knowing a
 * single type (E2): the triggers, the indicators that need nothing but parameters, the step that has a condition, the
 * step that places an order.
 */

/** The number of steps of the assistant: name, trigger, indicators, condition, order. */
export const WIZARD_STEPS = 5;

export function triggerTypes(types: TypeIndex): TypeDescription[] {
  return types.list.filter((type) => type.kind === 'trigger' && type.onCanvas);
}

/** The entries for indicators and trends that are ready to use as they are: delivered types without content of their own. */
export function indicatorEntries(groups: readonly LibraryGroup[], types: TypeIndex): LibraryEntry[] {
  return groups
    .filter((group) => group.id === 'indicators' || group.id === 'trends')
    .flatMap((group) => group.entries)
    .filter((entry) => {
      if (entry.source.kind !== 'type' || entry.target !== 'canvas') {
        return false;
      }
      const type = types.byId.get(entry.source.typeId);
      return type !== undefined && type.kind === 'object_type' && type.category !== 'trend' && contentKind(type) === null;
    });
}

/** The step with a condition: it has a result of its own and a way out for true and for false. */
export function conditionType(types: TypeIndex): TypeDescription | undefined {
  return types.list.find(
    (type) => type.kind === 'flow' && type.named && type.outputs.length > 1 && type.properties.some((property) => property.datatype === 'boolean'),
  );
}

/** The step that places an order: its output holds the management. */
export function orderStepType(types: TypeIndex): TypeDescription | undefined {
  return types.list.find((type) => type.kind === 'flow' && managementOutput(type) !== null && orderSelector(types, type) !== null);
}

/** The first delivered rule: it is offered for the order. */
export function ruleEntry(groups: readonly LibraryGroup[]): LibraryEntry | undefined {
  return groups.flatMap((group) => group.entries).find((entry) => entry.target === 'rules' && entry.source.kind === 'builtinTemplate');
}

const NUMERIC: readonly DataType[] = ['number', 'integer', 'percent'];

export type ValueChoice = { key: string; label: string; instance: string; property: string };

/** The numeric values of the objects on the drawing area: what a condition of the guided setup compares. */
export function numericValues(document: StrategyDocument, types: TypeIndex, language: SupportedLanguage): ValueChoice[] {
  const found: ValueChoice[] = [];
  for (const element of document.elements) {
    if (!isCardElement(element, types) || element.instance === null || element.instance === undefined) {
      continue;
    }
    for (const row of propertyRows(types.byId.get(element.type), element.instance, language)) {
      if (NUMERIC.includes(row.datatype)) {
        found.push({
          key: `${element.instance.key}|${row.id}`,
          label: `${element.instance.name} › ${row.label}`,
          instance: element.instance.key,
          property: row.id,
        });
      }
    }
  }
  return found;
}

/** The parameters of an element that must be given a whole number or a number (a period): the guided setup asks for them. */
export function requiredNumbers(element: ElementDocument, types: TypeIndex): { id: string; label: { de: string; en: string } }[] {
  const type = types.byId.get(element.type);
  return (type?.parameters ?? [])
    .filter((parameter) => parameter.required && (parameter.datatype === 'integer' || parameter.datatype === 'number'))
    .map((parameter) => ({ id: parameter.id, label: parameter.label }));
}
