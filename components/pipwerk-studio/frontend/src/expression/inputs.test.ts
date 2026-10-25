import { describe, expect, it } from 'vitest';

import type { ElementDocument, StrategyDocument } from '../document/types';
import { inventedStrategy, inventedTypesWithMethod } from '../testing/inventedTypes';
import { literalBlock, methodBlock, nameBlock, numberBlock, comparisonBlock, EMPTY } from './blocks';
import { ownerElement, withInputs } from './inputs';

const types = inventedTypesWithMethod();

const gauge: ElementDocument = {
  id: 'g1',
  type: 'zz.gauge',
  name: null,
  key: null,
  position: null,
  parameters: {},
  properties: {},
  inputs: [],
  rules: [],
  management_of: null,
  instance: { name: 'Pegel', key: 'pegel', object_type: 'zz.gauge', first_use: null, parameter_values: {} },
};

function strategy(): { document: StrategyDocument; step: ElementDocument; other: ElementDocument } {
  const base = inventedStrategy();
  const document: StrategyDocument = { ...base, elements: [...base.elements, gauge] };
  return {
    document,
    step: document.elements.find((element) => element.name === 'Weiche') as ElementDocument,
    other: document.elements.find((element) => element.name === 'Tun') as ElementDocument,
  };
}

const inputsOf = (document: StrategyDocument, id: string) => document.elements.find((element) => element.id === id)?.inputs ?? [];
const firstUseOf = (document: StrategyDocument, key: string) => document.elements.find((element) => element.instance?.key === key)?.instance?.first_use;

describe('the inputs that come from the values an expression names (specification 5.4)', () => {
  it('adds an input for a property, and for a method with the fixed values of its arguments', () => {
    const { document, step } = strategy();
    const blocks = comparisonBlock('>', methodBlock(['pegel', 'mittel'], [numberBlock(3), literalBlock('x', 'text')]), nameBlock(['messer', 'stand']));

    const next = withInputs(document, step.id, blocks, { types, language: 'de' });

    expect(inputsOf(next, step.id)).toEqual([
      { instance: 'pegel', property: 'mittel', kind: 'method', arguments: [3, 'x'], refresh: false },
      { instance: 'messer', property: 'stand', kind: 'property', arguments: [], refresh: false },
    ]);
  });

  it('adds no input for a method with an argument that is no fixed value, for a name the object does not supply, or for the element itself', () => {
    const { document, step } = strategy();
    const open = methodBlock(['pegel', 'mittel'], [nameBlock(['Strategie', 'laenge'])]);
    expect(inputsOf(withInputs(document, step.id, open, { types }), step.id).filter((input) => input.instance === 'pegel')).toEqual([]);
    expect(inputsOf(withInputs(document, step.id, nameBlock(['pegel', 'gibtsnicht']), { types }), step.id)).toEqual([]);
    expect(withInputs(document, null, nameBlock(['pegel', 'stand']), { types })).toBe(document);
    expect(withInputs(document, step.id, null, { types })).toBe(document);
    expect(withInputs(document, step.id, EMPTY, { types })).toEqual(document);
  });

  it('makes the element the element of the first use of an object that no element uses yet', () => {
    const { document, step } = strategy();

    const next = withInputs(document, step.id, nameBlock(['pegel', 'stand']), { types, connected: () => false });

    expect(firstUseOf(next, 'pegel')).toBe(step.id);
    // the first use of another object is not touched
    expect(firstUseOf(next, 'messer')).not.toBe(step.id);
  });

  it('keeps the element of the first use of an object that an element uses already', () => {
    const { document, step, other } = strategy();
    const used = { ...document, elements: document.elements.map((element) => (element.id === other.id ? { ...element, inputs: [{ instance: 'pegel', property: 'stand', kind: 'property' as const, arguments: [], refresh: false }] } : element)) };

    const next = withInputs(used, step.id, nameBlock(['pegel', 'stand']), { types, connected: () => true });

    expect(firstUseOf(next, 'pegel')).toBeNull();
    const stored = withInputs(
      { ...used, elements: used.elements.map((element) => (element.id === 'g1' ? { ...element, instance: { ...(element.instance as NonNullable<ElementDocument['instance']>), first_use: other.id } } : element)) },
      step.id,
      nameBlock(['pegel', 'stand']),
      { types, connected: () => false },
    );
    // a first use that is written down stays, also if the report does not know it yet
    expect(firstUseOf(stored, 'pegel')).toBe(other.id);
  });

  it('writes no first use when it is not known whether an element uses the object', () => {
    const { document, step } = strategy();
    expect(firstUseOf(withInputs(document, step.id, nameBlock(['pegel', 'stand']), { types }), 'pegel')).toBeNull();
  });

  it('knows the element whose inputs a place joins', () => {
    expect(ownerElement({ kind: 'binding', element: 'e1', scope: 'parameters', key: 'k' })).toBe('e1');
    expect(ownerElement({ kind: 'rule', ref: { root: { kind: 'element', id: 'e2' }, steps: [] }, field: 'expression' })).toBe('e2');
    expect(ownerElement({ kind: 'rule', ref: { root: { kind: 'strategy' }, steps: [] }, field: 'expression' })).toBeNull();
  });
});
