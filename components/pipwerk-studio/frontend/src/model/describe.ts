import type { TFunction } from 'i18next';

import type { Choice, DataType, ParameterDescription, PropertyDescription, TypeDescription } from '../api/elementTypes';
import type { ExpressionAnswer } from '../api/objects';
import { getOwn } from '../document/own';
import {
  isConnectionValue,
  type Binding,
  type ElementDocument,
  type InstanceDocument,
  type StrategyDocument,
} from '../document/types';
import type { SupportedLanguage } from '../i18n';
import { elementName } from './elements';
import { labelText, orderSelector, timeUnitChoices, type TypeIndex } from './typeIndex';

/**
 * Short readable texts for elements and values. Everything the texts say about a type comes from its description
 * (specification E2): labels, choices, the datatype.
 */

export function jsonPointerPart(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1');
}

/** Where an assignment lies in the document: the pointer the expression endpoint asks for. */
export function bindingPointer(elementIndex: number, scope: 'parameters' | 'properties' | 'instance', key: string): string {
  const base = `/elements/${elementIndex}`;
  if (scope === 'instance') {
    return `${base}/instance/parameter_values/${jsonPointerPart(key)}/value`;
  }
  return `${base}/${scope}/${jsonPointerPart(key)}/value`;
}

/** The place of an assignment independent of the order of the elements: element, scope and key. */
export function bindingSlot(elementId: string, scope: 'parameters' | 'properties' | 'instance', key: string): string {
  return `${elementId}|${scope}|${key}`;
}

export type AnswerLookup = (slot: string) => ExpressionAnswer | undefined;

/** The value of a fixed assignment as the user reads it. */
export function fixedText(
  value: unknown,
  datatype: DataType,
  choices: readonly Choice[],
  language: SupportedLanguage,
  t: TFunction,
  timeUnits: readonly Choice[],
): string {
  if (typeof value === 'boolean') {
    return value ? t('values.yes') : t('values.no');
  }
  if (value === null || value === undefined || value === '') {
    return '–';
  }
  const text = String(value);
  const own = choices.find((choice) => choice.id === text);
  if (own !== undefined) {
    return labelText(own.label, language);
  }
  if (datatype === 'time_unit') {
    const unit = timeUnits.find((choice) => choice.id === text);
    return unit === undefined ? text.toUpperCase() : labelText(unit.label, language);
  }
  if (datatype === 'percent' && typeof value === 'number') {
    return `${Math.round(value * 10000) / 100} %`;
  }
  return text;
}

type Entry = ParameterDescription | PropertyDescription;

/** The name of the instance on the drawing area with the identifier in expressions, or `null`. */
function instanceByKey(document: StrategyDocument, key: string): ElementDocument | undefined {
  return document.elements.find((candidate) => candidate.instance?.key.toLowerCase() === key.toLowerCase());
}

/** The label of a property of an instance: from the type of the instance, or its own property. */
export function propertyLabel(
  types: TypeIndex,
  element: ElementDocument,
  propertyId: string,
  language: SupportedLanguage,
): string {
  const type = types.byId.get(element.type);
  const found = type?.properties.find((property) => property.id === propertyId);
  if (found !== undefined) {
    return labelText(found.label, language);
  }
  const own = element.instance?.properties?.find((property) => property.key === propertyId);
  return own === undefined ? propertyId : own.name;
}

export type DescribeContext = {
  document: StrategyDocument;
  types: TypeIndex;
  language: SupportedLanguage;
  t: TFunction;
  answers: AnswerLookup;
};

/** The text of an assignment for the drawing area: its value, a strategy parameter with its value, a connected value, an expression as a sentence. */
export function bindingText(
  binding: Binding | undefined,
  entry: Pick<Entry, 'datatype' | 'choices'>,
  slot: string,
  context: DescribeContext,
): string {
  const { document, types, language, t, answers } = context;
  if (binding === undefined) {
    return '–';
  }
  switch (binding.kind) {
    case 'fixed':
      return fixedText(binding.value, entry.datatype, entry.choices, language, t, timeUnitChoices(types));
    case 'parameter': {
      const parameter = document.parameters.find((candidate) => candidate.key === binding.value);
      if (parameter === undefined) {
        return '?';
      }
      if (parameter.at_application === true) {
        return `${parameter.name} (${t('binding.atApplicationShort')})`;
      }
      return `${parameter.name} (${fixedText(parameter.value, parameter.datatype, [], language, t, timeUnitChoices(types))})`;
    }
    case 'connection': {
      if (!isConnectionValue(binding.value)) {
        return '?';
      }
      const source = instanceByKey(document, binding.value.instance);
      return source === undefined
        ? '?'
        : `${elementName(source, types, language)} › ${propertyLabel(types, source, binding.value.property, language)}`;
    }
    case 'expression': {
      const answer = answers(slot);
      return answer === undefined ? '…' : (answer.sentence ?? t('expression.hasError'));
    }
    case 'application':
      return t('binding.atApplicationShort');
  }
}

function entryLabel(entry: Entry, language: SupportedLanguage): string {
  return labelText(entry.label, language);
}

/**
 * What a step of the flow says about itself on the drawing area: the sentence of its expression if its type has one
 * (condition, calculation), otherwise its parameters and the properties of its order with their values.
 */
export function stepSummary(element: ElementDocument, type: TypeDescription | undefined, context: DescribeContext): string {
  const { language, t, types } = context;
  if (type === undefined) {
    return t('canvas.unknownTypeSummary', { type: element.type });
  }
  const parts: string[] = [];
  const expressionEntries = type.parameters.filter((parameter) => parameter.datatype === 'expression');
  const primary = expressionEntries[0];
  if (primary !== undefined && type.named) {
    const binding = getOwn(element.parameters, primary.id);
    if (binding === undefined || binding.kind !== 'expression' || binding.value === '' || binding.value === undefined) {
      return t('canvas.expressionEmpty');
    }
    return bindingText(binding, primary, bindingSlot(element.id, 'parameters', primary.id), context);
  }
  const selector = orderSelector(types, type);
  for (const parameter of type.parameters) {
    const binding = getOwn(element.parameters, parameter.id);
    if (binding === undefined) {
      continue;
    }
    const text = bindingText(binding, parameter, bindingSlot(element.id, 'parameters', parameter.id), context);
    if (parameter.datatype === 'expression' || (selector !== null && parameter.id === selector.parameter.id)) {
      parts.push(parameter === selector?.parameter ? text : `${entryLabel(parameter, language)} ← ${text}`);
    } else {
      parts.push(`${entryLabel(parameter, language)}: ${text}`);
    }
  }
  if (selector !== null) {
    const chosen = getOwn(element.parameters, selector.parameter.id)?.value;
    const orderType = selector.orderTypes.find((candidate) => candidate.id === chosen);
    for (const property of orderType?.properties ?? []) {
      const binding = getOwn(element.properties, property.id);
      if (binding !== undefined && property.setByUser) {
        parts.push(`${entryLabel(property, language)}: ${bindingText(binding, property, bindingSlot(element.id, 'properties', property.id), context)}`);
      }
    }
  }
  if (parts.length === 0) {
    return labelText(type.explanation, language);
  }
  return parts.join(', ');
}

/** The second line of a card: the type, then the settings that characterise the object (time unit, numbers). */
export function cardSubtitle(element: ElementDocument, type: TypeDescription | undefined, context: DescribeContext): string {
  const { language, t, types } = context;
  const instance: InstanceDocument | null | undefined = element.instance;
  const typeName = type === undefined ? element.type : labelText(type.name, language);
  const parts: string[] = [];
  for (const parameter of type?.parameters ?? []) {
    if (parts.length >= 2) {
      break;
    }
    if (!(['time_unit', 'number', 'integer'] as DataType[]).includes(parameter.datatype)) {
      continue;
    }
    const binding = getOwn(instance?.parameter_values, parameter.id);
    if (binding === undefined) {
      continue;
    }
    let text: string;
    if (binding.kind === 'parameter') {
      const source = context.document.parameters.find((candidate) => candidate.key === binding.value);
      text =
        source === undefined || source.at_application === true
          ? '…'
          : fixedText(source.value, source.datatype, [], language, t, timeUnitChoices(types));
    } else {
      text = bindingText(binding, parameter, '', context);
    }
    parts.push(parameter.datatype === 'time_unit' ? text : `${entryLabel(parameter, language)} ${text}`);
  }
  return [typeName, ...parts].join(' · ');
}
