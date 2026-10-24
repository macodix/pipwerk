import { describe, expect, it } from 'vitest';

import { nameBlock, numberBlock, comparisonBlock } from '../expression/blocks';
import { ownerElement, withInputs } from '../expression/inputs';
import { inventedTypes } from '../testing/inventedTypes';
import { newStrategy } from './build';
import {
  addParameterDefinition,
  addPropertyDefinition,
  addToList,
  entryRef,
  keysIn,
  moveInList,
  readList,
  removeFromList,
  removeParameterDefinition,
  renameInstance,
  setComparison,
  setDeterminedProperty,
  setInstanceBinding,
  updatePropertyDefinition,
  type ListRef,
} from './instanceOps';
import { child, listPointer, placePointer, placeStored, resolveInstance, sameRef, setPlaceStored, type ExpressionPlace, type InstanceRef } from './places';
import type { ElementDocument, InstanceDocument, StrategyDocument } from './types';

const types = inventedTypes();

const instance = (key: string, patch: Partial<InstanceDocument> = {}): InstanceDocument => ({
  name: key,
  key,
  object_type: 'x.regel',
  origin: null,
  parameter_values: {},
  parameters: [],
  properties: [],
  instances: [],
  rules: [],
  expression: '',
  determined_property: null,
  comparison: null,
  result_expression: null,
  ...patch,
});

const element = (id: string, patch: Partial<ElementDocument> = {}): ElementDocument => ({
  id,
  type: 'x.step',
  name: id,
  key: null,
  position: null,
  parameters: {},
  properties: {},
  inputs: [],
  rules: [],
  management_of: null,
  instance: null,
  ...patch,
});

function document(): StrategyDocument {
  return {
    ...newStrategy('Probe'),
    rules: [instance('risiko'), instance('grenze')],
    elements: [
      element('order', { rules: [instance('mindest')] }),
      element('trend', {
        instance: instance('trend_h1', {
          object_type: 'x.trend',
          instances: [instance('ema20', { object_type: 'x.ema' })],
          rules: [instance('innen')],
          properties: [{ key: 'richtung', name: 'Richtung', datatype: 'text', expression: '' }],
        }),
      }),
      element('ema', { instance: instance('ema50', { object_type: 'x.ema' }) }),
    ],
  };
}

const strategyRules: ListRef = { root: { kind: 'strategy' }, steps: [], list: 'rules' };
const orderRules: ListRef = { root: { kind: 'element', id: 'order' }, steps: [], list: 'rules' };
const trendInstances: ListRef = { root: { kind: 'object', id: 'trend' }, steps: [], list: 'instances' };

describe('addressing instances by keys', () => {
  it('finds the rules of the strategy, of an element and the content of an object, with their pointers', () => {
    const doc = document();
    expect(resolveInstance(doc, entryRef(strategyRules, 'grenze'))).toMatchObject({ pointer: '/rules/1', instance: { key: 'grenze' } });
    expect(resolveInstance(doc, entryRef(orderRules, 'mindest'))?.pointer).toBe('/elements/0/rules/0');
    expect(resolveInstance(doc, { root: { kind: 'object', id: 'trend' }, steps: [] })?.pointer).toBe('/elements/1/instance');
    expect(resolveInstance(doc, entryRef(trendInstances, 'ema20'))?.pointer).toBe('/elements/1/instance/instances/0');
    expect(resolveInstance(doc, child({ root: { kind: 'object', id: 'trend' }, steps: [] }, 'rules', 'innen'))?.pointer).toBe('/elements/1/instance/rules/0');
  });

  it('finds nothing for a key that is not there and keeps the address when the order changes', () => {
    const doc = document();
    expect(resolveInstance(doc, entryRef(strategyRules, 'gibtsnicht'))).toBeNull();
    const moved = moveInList(doc, strategyRules, 'grenze', -1);
    expect(resolveInstance(moved, entryRef(strategyRules, 'grenze'))?.pointer).toBe('/rules/0');
  });

  it('forms the pointer of a list for the key of a new entry', () => {
    const doc = document();
    expect(listPointer(doc, strategyRules)).toBe('/rules');
    expect(listPointer(doc, orderRules)).toBe('/elements/0/rules');
    expect(listPointer(doc, trendInstances)).toBe('/elements/1/instance/instances');
    expect(listPointer(doc, { root: { kind: 'element', id: 'fehlt' }, steps: [], list: 'rules' })).toBeNull();
  });

  it('compares references', () => {
    const a: InstanceRef = entryRef(strategyRules, 'risiko');
    expect(sameRef(a, entryRef(strategyRules, 'risiko'))).toBe(true);
    expect(sameRef(a, entryRef(strategyRules, 'grenze'))).toBe(false);
  });
});

describe('changing lists', () => {
  it('adds, moves and removes entries without changing the document it was given', () => {
    const doc = document();
    const added = addToList(doc, strategyRules, instance('neu'));
    expect(keysIn(added, strategyRules)).toEqual(['risiko', 'grenze', 'neu']);
    expect(keysIn(doc, strategyRules)).toEqual(['risiko', 'grenze']);
    expect(keysIn(moveInList(added, strategyRules, 'neu', -1), strategyRules)).toEqual(['risiko', 'neu', 'grenze']);
    expect(keysIn(moveInList(added, strategyRules, 'risiko', -1), strategyRules)).toEqual(['risiko', 'grenze', 'neu']);
    expect(keysIn(removeFromList(added, strategyRules, 'grenze'), strategyRules)).toEqual(['risiko', 'neu']);
  });

  it('adds to the list of rules of an element and to the contained instances of an object', () => {
    const doc = document();
    expect(readList(addToList(doc, orderRules, instance('zweite')), orderRules).map((entry) => entry.key)).toEqual(['mindest', 'zweite']);
    expect(readList(addToList(doc, trendInstances, instance('ema9', { object_type: 'x.ema' })), trendInstances).map((entry) => entry.key)).toEqual(['ema20', 'ema9']);
  });

  it('leaves the document as it is when the owner is not there', () => {
    const doc = document();
    expect(addToList(doc, { root: { kind: 'element', id: 'fehlt' }, steps: [], list: 'rules' }, instance('x'))).toBe(doc);
    expect(readList(doc, { root: { kind: 'element', id: 'fehlt' }, steps: [], list: 'rules' })).toEqual([]);
  });
});

describe('changing an instance', () => {
  const ref = entryRef(strategyRules, 'risiko');

  it('renames it without changing its key (the uses follow the key)', () => {
    const renamed = renameInstance(document(), ref, 'Risiko je Trade');
    expect(resolveInstance(renamed, ref)?.instance).toMatchObject({ name: 'Risiko je Trade', key: 'risiko' });
  });

  it('sets and removes the assignment of a parameter', () => {
    const set = setInstanceBinding(document(), ref, 'risikogrenze', { kind: 'fixed', value: 0.02 });
    expect(resolveInstance(set, ref)?.instance.parameter_values).toEqual({ risikogrenze: { kind: 'fixed', value: 0.02 } });
    const removed = setInstanceBinding(set, ref, 'risikogrenze', null);
    expect(resolveInstance(removed, ref)?.instance.parameter_values).toEqual({});
  });

  it('sets the determined property with the comparison "höchstens" and removes both together', () => {
    const determined = setDeterminedProperty(document(), ref, 'volumen');
    expect(resolveInstance(determined, ref)?.instance).toMatchObject({ determined_property: 'volumen', comparison: 'hoechstens' });
    const changed = setComparison(determined, ref, 'mindestens');
    expect(resolveInstance(changed, ref)?.instance.comparison).toBe('mindestens');
    const cleared = setDeterminedProperty(changed, ref, null);
    expect(resolveInstance(cleared, ref)?.instance).toMatchObject({ determined_property: null, comparison: null });
  });

  it('adds an own parameter with its default as the assignment and removes both again', () => {
    const added = addParameterDefinition(document(), ref, { key: 'grenze', name: 'Grenze', datatype: 'percent', required: true, default: 0.01, choices: [] });
    expect(resolveInstance(added, ref)?.instance.parameter_values).toEqual({ grenze: { kind: 'fixed', value: 0.01 } });
    const removed = removeParameterDefinition(added, ref, 'grenze');
    expect(resolveInstance(removed, ref)?.instance.parameters).toEqual([]);
    expect(resolveInstance(removed, ref)?.instance.parameter_values).toEqual({});
  });

  it('adds, changes and keeps own properties', () => {
    const trend: InstanceRef = { root: { kind: 'object', id: 'trend' }, steps: [] };
    const added = addPropertyDefinition(document(), trend, { key: 'staerke', name: 'Stärke', datatype: 'number', expression: '' });
    expect(resolveInstance(added, trend)?.instance.properties?.map((property) => property.key)).toEqual(['richtung', 'staerke']);
    const changed = updatePropertyDefinition(added, trend, 'staerke', { name: 'Stärke des Trends' });
    expect(resolveInstance(changed, trend)?.instance.properties?.[1]?.name).toBe('Stärke des Trends');
  });
});

describe('the places of expressions', () => {
  const rulePlace: ExpressionPlace = { kind: 'rule', ref: entryRef(strategyRules, 'grenze'), field: 'expression' };
  const trendRef: InstanceRef = { root: { kind: 'object', id: 'trend' }, steps: [] };
  const propertyPlace: ExpressionPlace = { kind: 'property', ref: trendRef, key: 'richtung' };

  it('forms the pointers the expression endpoint takes', () => {
    const doc = document();
    expect(placePointer(doc, rulePlace)).toBe('/rules/1/expression');
    expect(placePointer(doc, { kind: 'rule', ref: entryRef(strategyRules, 'risiko'), field: 'result_expression' })).toBe('/rules/0/result_expression');
    expect(placePointer(doc, propertyPlace)).toBe('/elements/1/instance/properties/0/expression');
    expect(placePointer(doc, { kind: 'binding', element: 'order', scope: 'properties', key: 'richtung' })).toBe('/elements/0/properties/richtung/value');
    expect(placePointer(doc, { kind: 'binding', element: 'order', scope: 'parameters', key: 'ausdruck' })).toBe('/elements/0/parameters/ausdruck/value');
    expect(placePointer(doc, { kind: 'parameter', ref: entryRef(strategyRules, 'risiko'), key: 'x' })).toBe('/rules/0/parameter_values/x/value');
    expect(placePointer(doc, { kind: 'rule', ref: entryRef(strategyRules, 'fehlt'), field: 'expression' })).toBeNull();
    expect(placePointer(doc, { kind: 'binding', element: 'fehlt', scope: 'parameters', key: 'a' })).toBeNull();
  });

  it('writes the stored expression to the place and reads it back', () => {
    const doc = document();
    const written = setPlaceStored(doc, types, rulePlace, 'Order.volumen >= 1');
    expect(placeStored(written, rulePlace)).toBe('Order.volumen >= 1');
    expect(placeStored(doc, rulePlace)).toBe('');
    const property = setPlaceStored(written, types, propertyPlace, 'IF(a; "auf"; "ab")');
    expect(placeStored(property, propertyPlace)).toBe('IF(a; "auf"; "ab")');
    const parameter: ExpressionPlace = { kind: 'parameter', ref: entryRef(strategyRules, 'risiko'), key: 'wert' };
    expect(placeStored(setPlaceStored(property, types, parameter, 'a + 1'), parameter)).toBe('a + 1');
  });
});

describe('the inputs that join an element when a value of an object is chosen', () => {
  const doc: StrategyDocument = {
    ...newStrategy('Probe'),
    elements: [element('cond'), element('ema', { instance: instance('ema20', { object_type: 'x.ema' }) })],
  };

  it('names the element that owns the place', () => {
    expect(ownerElement({ kind: 'binding', element: 'cond', scope: 'parameters', key: 'ausdruck' })).toBe('cond');
    expect(ownerElement({ kind: 'rule', ref: { root: { kind: 'element', id: 'cond' }, steps: [] }, field: 'expression' })).toBe('cond');
    expect(ownerElement({ kind: 'rule', ref: { root: { kind: 'strategy' }, steps: [] }, field: 'expression' })).toBeNull();
  });

  it('adds one input per value of an object and none for anything else', () => {
    const tree = comparisonBlock('>', nameBlock(['ema20', 'wert']), numberBlock(1));
    const joined = withInputs(doc, 'cond', tree);
    // an input is written with all five fields of the format (specification 3.3): a property, no arguments, no refresh
    expect(joined.elements[0]?.inputs).toEqual([{ instance: 'ema20', property: 'wert', kind: 'property', arguments: [], refresh: false }]);
    expect(withInputs(joined, 'cond', tree).elements[0]?.inputs).toHaveLength(1);
    expect(withInputs(doc, 'cond', comparisonBlock('>', nameBlock(['Kerze', 'schluss']), numberBlock(1)))).toBe(doc);
    expect(withInputs(doc, null, tree)).toBe(doc);
    expect(withInputs(doc, 'cond', null)).toBe(doc);
  });
});
