import { describe, expect, it } from 'vitest';

import { loadTestcase } from '../testing/fixtures';
import {
  addConnection,
  addElement,
  addRule,
  addStrategyParameter,
  fixed,
  getInstance,
  getRule,
  hasConnection,
  moveRule,
  removeConnections,
  removeElements,
  withDatatype,
  removeRule,
  removeStrategyParameter,
  rulesOf,
  setElementBinding,
  setInstanceBinding,
  setStrategyText,
  updateElement,
  updateInstance,
  updateRule,
  updateStrategyParameter,
} from './ops';
import type { InstanceDocument, StrategyDocument } from './types';

function rule(name: string, rules: InstanceDocument[] = []): InstanceDocument {
  return { name, object_type: 'Regel', rules };
}

function withRules(): StrategyDocument {
  const document = loadTestcase('str-03');
  return {
    ...document,
    rules: [rule('a'), rule('b'), rule('set', [rule('x'), rule('y')])],
  };
}

describe('operations leave their argument unchanged', () => {
  it('returns new documents', () => {
    const document = loadTestcase('str-03');
    const before = JSON.stringify(document);

    setStrategyText(document, 'title', 'T');
    addStrategyParameter(document, 'p');
    updateElement(document, document.elements[0]!.id, { x: 99 });
    removeElements(document, new Set([document.elements[0]!.id]));
    addRule(document, { kind: 'strategy' }, rule('n'));

    expect(JSON.stringify(document)).toBe(before);
  });
});

describe('strategy', () => {
  it('sets the title and the description', () => {
    const document = loadTestcase('str-03');

    expect(setStrategyText(document, 'title', 'Neu').title).toBe('Neu');
    expect(setStrategyText(document, 'description', 'D').description).toBe('D');
  });

  it('adds, changes and removes parameters; a new one gets a free name', () => {
    let document = loadTestcase('str-03');

    document = addStrategyParameter(document, 'zeiteinheit');
    expect(document.parameters.map((parameter) => parameter.name)).toEqual(['zeiteinheit', 'stop_abstand', 'zeiteinheit1']);
    document = updateStrategyParameter(document, 2, { datatype: 'integer', value: 7 });
    expect(document.parameters[2]).toMatchObject({ datatype: 'integer', value: 7, name: 'zeiteinheit1' });
    document = removeStrategyParameter(document, 0);
    expect(document.parameters.map((parameter) => parameter.name)).toEqual(['stop_abstand', 'zeiteinheit1']);
  });
});

describe('elements', () => {
  it('changes one element', () => {
    const document = loadTestcase('str-03');
    const id = document.elements[1]!.id;

    const next = updateElement(document, id, { title: 'neu' });

    expect(next.elements[1]?.title).toBe('neu');
    expect(next.elements[0]).toBe(document.elements[0]);
  });

  it('sets and removes the binding of a parameter or a property', () => {
    const document = loadTestcase('str-03');
    const order = document.elements.find((element) => element.type === 'flow.place_order')!;

    let next = setElementBinding(document, order.id, 'properties', 'volumen', fixed(0.5));
    expect(next.elements.find((element) => element.id === order.id)?.properties.volumen).toEqual({ kind: 'fixed', value: 0.5 });
    next = setElementBinding(next, order.id, 'properties', 'volumen', null);
    expect(next.elements.find((element) => element.id === order.id)?.properties).toEqual(order.properties);
    expect(setElementBinding(document, 'unknown', 'parameters', 'p', fixed(1))).toBe(document);
  });

  it('removes elements with their connections and moves the elements of their managements to the main flow', () => {
    const document = loadTestcase('str-03');
    const order = document.elements.find((element) => element.type === 'flow.place_order')!;

    const next = removeElements(document, new Set([order.id]));

    expect(next.elements.find((element) => element.id === order.id)).toBeUndefined();
    expect(next.connections.some((connection) => connection.source === order.id || connection.target === order.id)).toBe(false);
    expect(next.elements.every((element) => element.management_of === null)).toBe(true);
    expect(next.elements).toHaveLength(document.elements.length - 1);
  });

  it('adds an element at the end', () => {
    const document = loadTestcase('str-03');

    const next = addElement(document, { ...document.elements[0]!, id: 'new' });

    expect(next.elements.at(-1)?.id).toBe('new');
  });
});

describe('connections', () => {
  it('adds a connection once and removes by position', () => {
    const document = loadTestcase('str-03');
    const connection = { source: document.elements[3]!.id, output: 'weiter', target: document.elements[5]!.id };

    const once = addConnection(document, connection);
    const twice = addConnection(once, { ...connection });

    expect(once.connections).toHaveLength(document.connections.length + 1);
    expect(twice).toBe(once);
    expect(hasConnection(once, connection)).toBe(true);
    expect(removeConnections(once, new Set([once.connections.length - 1])).connections).toEqual(document.connections);
  });
});

describe('rules', () => {
  it('lists the rules of the strategy and of an element', () => {
    const document = withRules();
    const order = document.elements.find((element) => element.type === 'flow.place_order')!;

    expect(rulesOf(document, { kind: 'strategy' }).map((r) => r.name)).toEqual(['a', 'b', 'set']);
    expect(rulesOf(document, { kind: 'element', id: order.id }).map((r) => r.name)).toEqual(['mindestvolumen']);
    expect(rulesOf(document, { kind: 'element', id: 'unknown' })).toEqual([]);
  });

  it('finds a rule at a path, also inside a rule set, and nothing where the path leads nowhere', () => {
    const document = withRules();
    const owner = { kind: 'strategy' } as const;

    expect(getRule(document, { owner, indices: [1] })?.name).toBe('b');
    expect(getRule(document, { owner, indices: [2, 1] })?.name).toBe('y');
    expect(getRule(document, { owner, indices: [5] })).toBeUndefined();
    expect(getRule(document, { owner, indices: [0, 0] })).toBeUndefined();
  });

  it('adds a rule to the owner and to a rule set', () => {
    const document = withRules();
    const owner = { kind: 'strategy' } as const;

    const next = addRule(addRule(document, owner, rule('c')), owner, rule('z'), [2]);

    expect(next.rules.map((r) => r.name)).toEqual(['a', 'b', 'set', 'c']);
    expect(next.rules[2]?.rules?.map((r) => r.name)).toEqual(['x', 'y', 'z']);
  });

  it('adds a rule to an element', () => {
    const document = withRules();
    const order = document.elements.find((element) => element.type === 'flow.place_order')!;

    const next = addRule(document, { kind: 'element', id: order.id }, rule('n'));

    expect(next.elements.find((element) => element.id === order.id)?.rules.map((r) => r.name)).toEqual(['mindestvolumen', 'n']);
  });

  it('removes and moves, inside the list of the owner and inside a rule set', () => {
    const document = withRules();
    const owner = { kind: 'strategy' } as const;

    expect(removeRule(document, { owner, indices: [0] }).rules.map((r) => r.name)).toEqual(['b', 'set']);
    expect(removeRule(document, { owner, indices: [2, 0] }).rules[2]?.rules?.map((r) => r.name)).toEqual(['y']);
    expect(moveRule(document, { owner, indices: [0] }, 1).rules.map((r) => r.name)).toEqual(['b', 'a', 'set']);
    expect(moveRule(document, { owner, indices: [2, 1] }, -1).rules[2]?.rules?.map((r) => r.name)).toEqual(['y', 'x']);
  });

  it('does not move a rule out of its list', () => {
    const document = withRules();
    const owner = { kind: 'strategy' } as const;

    expect(moveRule(document, { owner, indices: [0] }, -1).rules.map((r) => r.name)).toEqual(['a', 'b', 'set']);
    expect(moveRule(document, { owner, indices: [2] }, 1).rules.map((r) => r.name)).toEqual(['a', 'b', 'set']);
  });

  it('changes a rule and the values of its parameters', () => {
    const document = withRules();
    const path = { owner: { kind: 'strategy' } as const, indices: [2, 1] };

    const renamed = updateRule(document, path, { name: 'yy', expression: 'a' });
    expect(getRule(renamed, path)).toMatchObject({ name: 'yy', expression: 'a' });

    const bound = setInstanceBinding(renamed, { kind: 'rule', path }, 'p', fixed(3));
    expect(getRule(bound, path)?.parameter_values).toEqual({ p: { kind: 'fixed', value: 3 } });
    expect(getRule(setInstanceBinding(bound, { kind: 'rule', path }, 'p', null), path)?.parameter_values).toEqual({});
  });

  it('changes the instance of an element and its values', () => {
    const document = loadTestcase('str-03');
    const ema = document.elements.find((element) => element.type === 'EMA')!;
    const target = { kind: 'element', id: ema.id } as const;

    const renamed = updateInstance(document, target, { name: 'schnell' });
    const bound = setInstanceBinding(renamed, target, 'periode', fixed(9));

    expect(getInstance(bound, target)).toMatchObject({ name: 'schnell' });
    expect(getInstance(bound, target)?.parameter_values?.periode).toEqual({ kind: 'fixed', value: 9 });
    expect(updateInstance(document, { kind: 'element', id: document.elements.find((e) => e.type === 'flow.condition')!.id }, { name: 'x' })).toBe(document);
    expect(getInstance(document, { kind: 'element', id: 'unknown' })).toBeUndefined();
  });
});

describe('withDatatype', () => {
  it('removes the choices when the datatype changes to another one than choice, and sets the patch', () => {
    const changed = withDatatype({ name: 'p', datatype: 'choice' as const, choices: ['a'], extra: 1 }, 'time_unit', {});

    expect(changed).toEqual({ name: 'p', datatype: 'time_unit', extra: 1 });
    expect('choices' in changed).toBe(false);
  });

  it('keeps the choices for the datatype choice and leaves an unchanged datatype alone', () => {
    const definition = { name: 'p', datatype: 'time_unit' as const, choices: ['k1'] };

    expect(withDatatype(definition, 'time_unit', { name: 'x' })).toBe(definition);
    expect(withDatatype(definition, 'choice', {}).choices).toEqual(['k1']);
  });
});
