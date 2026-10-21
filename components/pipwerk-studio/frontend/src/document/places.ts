import { clone } from './build';
import { jsonPointerPart } from '../model/describe';
import { setBinding, type BindingScope } from './ops';
import { getOwn } from './own';
import type { Binding, InstanceDocument, StrategyDocument } from './types';
import type { TypeIndex } from '../model/typeIndex';

/**
 * Where things lie in the document that the properties view edits: an instance (a rule, a ruleset, an indicator, a
 * trend) wherever it stands, and the places of expressions in it. Addresses use keys, not list positions, so that they
 * stay valid when the order of a list changes. The pointers for the expression endpoint are formed from them.
 */

/** Where a chain of instances starts: the rules of the strategy, the rules of an element, or the instance an element shows. */
export type InstanceRoot = { kind: 'strategy' } | { kind: 'element'; id: string } | { kind: 'object'; id: string };

/** One step down into an instance: one of its lists and the key of the entry. */
export type InstanceStep = { list: 'rules' | 'instances'; key: string };

/**
 * An instance. With the root `strategy` or `element` the first step names the rule or ruleset in the list of rules of
 * the strategy or the element; with the root `object` the instance of the element itself is meant, and the steps
 * lead into the instances and rules it contains.
 */
export type InstanceRef = { root: InstanceRoot; steps: readonly InstanceStep[] };

export type FoundInstance = { instance: InstanceDocument; pointer: string };

function find(list: readonly InstanceDocument[] | undefined, key: string): number {
  return (list ?? []).findIndex((candidate) => candidate.key === key);
}

/** The instance a reference names with its JSON Pointer, or `null` if it is not there (any more). */
export function resolveInstance(document: StrategyDocument, ref: InstanceRef): FoundInstance | null {
  let steps = ref.steps;
  let instance: InstanceDocument | undefined;
  let pointer: string;
  if (ref.root.kind === 'object') {
    const id = ref.root.id;
    const index = document.elements.findIndex((candidate) => candidate.id === id);
    instance = document.elements[index]?.instance ?? undefined;
    pointer = `/elements/${index}/instance`;
  } else {
    const first = steps[0];
    if (first === undefined) {
      return null;
    }
    steps = steps.slice(1);
    if (ref.root.kind === 'strategy') {
      const index = find(document.rules, first.key);
      instance = document.rules[index];
      pointer = `/rules/${index}`;
    } else {
      const id = ref.root.id;
      const elementIndex = document.elements.findIndex((candidate) => candidate.id === id);
      const rules = document.elements[elementIndex]?.rules;
      const index = find(rules, first.key);
      instance = rules?.[index];
      pointer = `/elements/${elementIndex}/rules/${index}`;
    }
  }
  for (const step of steps) {
    if (instance === undefined) {
      return null;
    }
    const list: readonly InstanceDocument[] | undefined = instance[step.list];
    const index = find(list, step.key);
    instance = list?.[index];
    pointer = `${pointer}/${step.list}/${index}`;
  }
  return instance === undefined ? null : { instance, pointer };
}

/** The JSON Pointer of a list of instances (for the key of a new entry), or `null` if the owner is not in the document. */
export function listPointer(
  document: StrategyDocument,
  list: { root: InstanceRoot; steps: readonly InstanceStep[]; list: 'rules' | 'instances' },
): string | null {
  if (list.steps.length === 0 && list.root.kind === 'strategy') {
    return list.list === 'rules' ? '/rules' : null;
  }
  if (list.steps.length === 0 && list.root.kind === 'element') {
    const id = list.root.id;
    const index = document.elements.findIndex((candidate) => candidate.id === id);
    return index < 0 || list.list !== 'rules' ? null : `/elements/${index}/rules`;
  }
  const found = resolveInstance(document, { root: list.root, steps: list.steps });
  return found === null ? null : `${found.pointer}/${list.list}`;
}

/** A copy of the document in which the instance is changed by `change` (the document stays as it is if the instance is missing). */
export function updateInstance(
  document: StrategyDocument,
  ref: InstanceRef,
  change: (instance: InstanceDocument) => void,
): StrategyDocument {
  const next = clone(document);
  const found = resolveInstance(next, ref);
  if (found === null) {
    return document;
  }
  change(found.instance);
  return next;
}

export function sameRef(a: InstanceRef, b: InstanceRef): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** The reference of a contained instance or rule. */
export function child(ref: InstanceRef, list: InstanceStep['list'], key: string): InstanceRef {
  return { root: ref.root, steps: [...ref.steps, { list, key }] };
}

// ---- places of expressions ----------------------------------------------------------------------------------------

/** A place that holds an expression. */
export type ExpressionPlace =
  /** The assignment of a parameter or property of an element (or of the instance it shows). */
  | { kind: 'binding'; element: string; scope: BindingScope; key: string }
  /** The expression of a rule, or the expression for the overall result of a ruleset. */
  | { kind: 'rule'; ref: InstanceRef; field: 'expression' | 'result_expression' }
  /** The expression of an own property of an instance. */
  | { kind: 'property'; ref: InstanceRef; key: string }
  /** The assignment of a parameter of an instance (a rule, a contained instance). */
  | { kind: 'parameter'; ref: InstanceRef; key: string };

export function placeId(place: ExpressionPlace): string {
  return JSON.stringify(place);
}

/** The JSON Pointer of the place for the expression endpoint, or `null` if the place is not in the document. */
export function placePointer(document: StrategyDocument, place: ExpressionPlace): string | null {
  switch (place.kind) {
    case 'binding': {
      const index = document.elements.findIndex((candidate) => candidate.id === place.element);
      if (index < 0) {
        return null;
      }
      const base = `/elements/${index}`;
      return place.scope === 'instance'
        ? `${base}/instance/parameter_values/${jsonPointerPart(place.key)}/value`
        : `${base}/${place.scope}/${jsonPointerPart(place.key)}/value`;
    }
    case 'rule': {
      const found = resolveInstance(document, place.ref);
      return found === null ? null : `${found.pointer}/${place.field}`;
    }
    case 'property': {
      const found = resolveInstance(document, place.ref);
      const index = found?.instance.properties?.findIndex((candidate) => candidate.key === place.key) ?? -1;
      return found === null || index < 0 ? null : `${found.pointer}/properties/${index}/expression`;
    }
    case 'parameter': {
      const found = resolveInstance(document, place.ref);
      return found === null ? null : `${found.pointer}/parameter_values/${jsonPointerPart(place.key)}/value`;
    }
  }
}

/** Every place of the document that holds an expression (empty ones are left out). */
export function expressionPlaces(document: StrategyDocument): ExpressionPlace[] {
  const found: ExpressionPlace[] = [];
  const visit = (ref: InstanceRef, instance: InstanceDocument, withParameters: boolean): void => {
    if (typeof instance.expression === 'string' && instance.expression !== '') {
      found.push({ kind: 'rule', ref, field: 'expression' });
    }
    if (typeof instance.result_expression === 'string' && instance.result_expression !== '') {
      found.push({ kind: 'rule', ref, field: 'result_expression' });
    }
    for (const property of instance.properties ?? []) {
      if (property.expression !== '') {
        found.push({ kind: 'property', ref, key: property.key });
      }
    }
    if (withParameters) {
      for (const [key, binding] of Object.entries(instance.parameter_values ?? {})) {
        if (binding.kind === 'expression' && typeof binding.value === 'string' && binding.value !== '') {
          found.push({ kind: 'parameter', ref, key });
        }
      }
    }
    for (const inner of instance.instances ?? []) {
      visit(child(ref, 'instances', inner.key), inner, true);
    }
    for (const rule of instance.rules ?? []) {
      visit(child(ref, 'rules', rule.key), rule, true);
    }
  };
  for (const rule of document.rules) {
    visit({ root: { kind: 'strategy' }, steps: [{ list: 'rules', key: rule.key }] }, rule, true);
  }
  for (const element of document.elements) {
    const records: [BindingScope, Record<string, Binding> | undefined][] = [
      ['parameters', element.parameters],
      ['properties', element.properties],
      ['instance', element.instance?.parameter_values],
    ];
    for (const [scope, record] of records) {
      for (const [key, binding] of Object.entries(record ?? {})) {
        if (binding.kind === 'expression' && typeof binding.value === 'string' && binding.value !== '') {
          found.push({ kind: 'binding', element: element.id, scope, key });
        }
      }
    }
    if (element.instance !== undefined && element.instance !== null) {
      visit({ root: { kind: 'object', id: element.id }, steps: [] }, element.instance, false);
    }
    for (const rule of element.rules) {
      visit({ root: { kind: 'element', id: element.id }, steps: [{ list: 'rules', key: rule.key }] }, rule, true);
    }
  }
  return found;
}

/** The element a place belongs to; `null` for the rules of the strategy. */
export function placeOwner(place: ExpressionPlace): string | null {
  switch (place.kind) {
    case 'binding':
      return place.element;
    default:
      return place.ref.root.kind === 'strategy' ? null : place.ref.root.id;
  }
}

/** The stored expression at the place; the empty text if there is none. */
export function placeStored(document: StrategyDocument, place: ExpressionPlace): string {
  switch (place.kind) {
    case 'binding': {
      const element = document.elements.find((candidate) => candidate.id === place.element);
      const record =
        place.scope === 'instance' ? element?.instance?.parameter_values : place.scope === 'parameters' ? element?.parameters : element?.properties;
      const binding = getOwn(record, place.key);
      return binding?.kind === 'expression' && typeof binding.value === 'string' ? binding.value : '';
    }
    case 'rule': {
      const value = resolveInstance(document, place.ref)?.instance[place.field];
      return typeof value === 'string' ? value : '';
    }
    case 'property':
      return resolveInstance(document, place.ref)?.instance.properties?.find((candidate) => candidate.key === place.key)?.expression ?? '';
    case 'parameter': {
      const binding: Binding | undefined = getOwn(resolveInstance(document, place.ref)?.instance.parameter_values, place.key);
      return binding?.kind === 'expression' && typeof binding.value === 'string' ? binding.value : '';
    }
  }
}

/** The document with the stored expression at the place changed. */
export function setPlaceStored(document: StrategyDocument, types: TypeIndex, place: ExpressionPlace, stored: string): StrategyDocument {
  switch (place.kind) {
    case 'binding':
      return setBinding(document, types, place.element, place.scope, place.key, { kind: 'expression', value: stored });
    case 'rule':
      return updateInstance(document, place.ref, (instance) => {
        instance[place.field] = stored;
      });
    case 'property':
      return updateInstance(document, place.ref, (instance) => {
        const own = instance.properties?.find((candidate) => candidate.key === place.key);
        if (own !== undefined) {
          own.expression = stored;
        }
      });
    case 'parameter':
      return updateInstance(document, place.ref, (instance) => {
        instance.parameter_values ??= {};
        instance.parameter_values[place.key] = { kind: 'expression', value: stored };
      });
  }
}
