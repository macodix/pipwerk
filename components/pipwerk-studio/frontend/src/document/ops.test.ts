import { describe, expect, it } from 'vitest';

import { inventedStrategy, inventedTypes, meterElement, stepElement } from '../testing/inventedTypes';
import { emaTrendfolge, EMA_ELEMENT_IDS } from '../testing/emaTrendfolge';
import { testTypes } from '../testing/typeDescriptions';
import { newElement, newStrategy, uniqueDisplayName, withOrderDefaults } from './build';
import {
  addElement,
  addInput,
  changeInput,
  closeGapAfterRemoval,
  sameInput,
  connect,
  createSection,
  setFirstUse,
  removeElement,
  removeInput,
  removeSection,
  removeStrategyParameter,
  renameSection,
  setBinding,
  setElementName,
  setManagement,
  setPosition,
  setSection,
  type ConnectResult,
} from './ops';
import { parseStrategyDocument } from './parse';
import type { StrategyDocument } from './types';

const types = inventedTypes();

function byName(document: StrategyDocument, name: string): string {
  const found = document.elements.find((element) => element.name === name || element.instance?.name === name);
  if (found === undefined) {
    throw new Error(`no element ${name}`);
  }
  return found.id;
}

function documentOf(result: ConnectResult): StrategyDocument {
  if ('problem' in result) {
    throw new Error(`problem ${result.problem}`);
  }
  return result.document;
}

describe('connecting steps (specification 3.3)', () => {
  it('replaces the connection of an output', () => {
    const document = inventedStrategy();
    const extra = stepElement('zz.do', 'Noch ein Tun');
    const withExtra = addElement(document, types, extra, null);

    const changed = documentOf(connect(withExtra, types, byName(withExtra, 'Weiche'), 'yes', extra.id));

    const fromWhen = changed.connections.filter((connection) => connection.source === byName(withExtra, 'Weiche') && connection.output === 'yes');
    expect(fromWhen).toHaveLength(1);
    expect(fromWhen[0]?.target).toBe(extra.id);
  });

  it.each([
    ['a trigger has no input', 'Weiche', 'yes', 'Beginn', 'target_is_trigger'],
    ['an object has no connection in the flow', 'Messer', 'next', 'Weiche', 'instance'],
    ['between the main flow and a management', 'Tun', 'next', 'Tun innen', 'across_flows'],
    ['an output that the step does not have', 'Tun', 'gibtsnicht', 'Weiche', 'unknown_output'],
    ['a step with itself', 'Tun', 'next', 'Tun', 'same_element'],
  ])('refuses %s', (_name, from, output, to, problem) => {
    const document = inventedStrategy();

    const result = connect(document, types, byName(document, from), output, byName(document, to));

    expect(result).toEqual({ problem });
  });

  it('refuses a new connection from an element of an unknown type', () => {
    const document = inventedStrategy();
    const unknown = stepElement('niemand.kennt', 'Fremd');
    const withUnknown = addElement(document, types, unknown, null);

    expect(connect(withUnknown, types, unknown.id, 'x', byName(document, 'Tun'))).toEqual({ problem: 'unknown_type' });
  });

  it('connects the management output with a step of the management that has no trigger of its own, and not with one that has', () => {
    let document = inventedStrategy();
    const place = byName(document, 'Ausführen');
    const inside = byName(document, 'Tun innen');
    // the management of the invented strategy has a trigger: no connection from "done"
    expect(connect(document, types, place, 'done', inside)).toEqual({ problem: 'management_has_triggers' });
    // without the trigger it is allowed
    document = removeElement(document, types, byName(document, 'Beginn innen'));
    const result = documentOf(connect(document, types, place, 'done', inside));
    expect(result.connections.some((connection) => connection.source === place && connection.output === 'done')).toBe(true);
    // the management output does not reach a step outside of the management
    expect(connect(document, types, place, 'done', byName(document, 'Tun'))).toEqual({ problem: 'across_flows' });
  });
});

describe('adding steps', () => {
  it('connects a step behind the selected step at its first free output', () => {
    const document = inventedStrategy();
    const added = stepElement('zz.do', 'Neu');

    const changed = addElement(document, types, added, byName(document, 'Weiche'));

    const connection = changed.connections.find((candidate) => candidate.target === added.id);
    expect(connection?.source).toBe(byName(document, 'Weiche'));
    expect(connection?.output).toBe('no');
  });

  it('does not connect behind a step of another flow', () => {
    const document = inventedStrategy();
    const added = stepElement('zz.do', 'Neu');

    const changed = addElement(document, types, added, byName(document, 'Tun innen'));

    expect(changed.connections.some((candidate) => candidate.target === added.id)).toBe(false);
  });

  it('connects the first step of a management without trigger with the management output; a trigger removes that connection', () => {
    let document = newStrategy('S');
    const place = stepElement('zz.place', 'Ausführen', { parameters: { sorte: { kind: 'fixed', value: 'zz.kind_a' } } });
    document = addElement(document, types, place, null);
    const first = stepElement('zz.do', 'Erster', { management_of: place.id });

    document = addElement(document, types, first, null);

    expect(document.connections).toEqual([expect.objectContaining({ source: place.id, output: 'done', target: first.id })]);

    document = addElement(document, types, stepElement('zz.start', 'Beginn', { management_of: place.id }), null);

    expect(document.connections).toEqual([]);
  });

  it('adds an object without a connection', () => {
    const document = inventedStrategy();
    const changed = addElement(document, types, meterElement('Zweiter Messer', 'messer_2'), byName(document, 'Weiche'));

    expect(changed.connections).toHaveLength(document.connections.length);
  });
});

describe('removing an element (specification 5.4)', () => {
  it('connects predecessor and successor of a step with one way in and one way out', () => {
    const document = inventedStrategy();

    const changed = removeElement(document, types, byName(document, 'Tun'));

    expect(changed.elements.some((element) => element.name === 'Tun')).toBe(false);
    expect(changed.connections.some((connection) => connection.source === byName(document, 'Weiche') && connection.output === 'yes' && connection.target === byName(document, 'Ausführen'))).toBe(true);
  });

  it('takes the steps of the management with the element and removes sections and folded frames that no longer exist', () => {
    let document = inventedStrategy();
    const place = byName(document, 'Ausführen');
    document = createSection(document, types, byName(document, 'Tun innen'), 'Innen');
    document = { ...document, collapsed_managements: [place] };

    const changed = removeElement(document, types, place);

    expect(changed.elements.map((element) => element.name ?? element.instance?.name)).toEqual(['Messer', 'Beginn', 'Weiche', 'Tun']);
    expect(changed.sections).toEqual([]);
    expect(changed.collapsed_managements).toEqual([]);
    expect(changed.connections.every((connection) => changed.elements.some((element) => element.id === connection.source))).toBe(true);
  });

  it('removes the inputs and data connections that took values from a removed instance', () => {
    let document = inventedStrategy();
    document = addInput(document, byName(document, 'Tun'), { instance: 'messer', property: 'stand' });
    document = setBinding(document, types, byName(document, 'Tun'), 'parameters', 'menge', { kind: 'connection', value: { instance: 'messer', property: 'stand' } });

    const changed = removeElement(document, types, byName(document, 'Messer'));

    const doIt = changed.elements.find((element) => element.name === 'Tun');
    expect(doIt?.inputs).toEqual([]);
    expect(doIt?.parameters.menge).toBeUndefined();
  });
});

describe('moving a step between flows (specification 3.3, 5.3)', () => {
  it('removes the connections that would lie between flows, hands the place back to the arrangement and leaves the section', () => {
    let document = inventedStrategy();
    const insideDo = byName(document, 'Tun innen');
    document = createSection(document, types, insideDo, 'Innen');
    document = setPosition(document, insideDo, { x: 5, y: 5 });

    const changed = setManagement(document, types, insideDo, null);

    const moved = changed.elements.find((element) => element.id === insideDo);
    expect(moved?.management_of).toBeNull();
    expect(moved?.position).toBeNull();
    expect(changed.sections).toEqual([]);
    expect(changed.connections.some((connection) => connection.target === insideDo || connection.source === insideDo)).toBe(false);
  });

  it('does not put an element into its own management', () => {
    const document = inventedStrategy();
    const place = byName(document, 'Ausführen');

    expect(setManagement(document, types, place, place)).toBe(document);
  });

  it('does not put a step into a step that has no management', () => {
    const document = inventedStrategy();

    expect(setManagement(document, types, byName(document, 'Tun'), byName(document, 'Weiche'))).toBe(document);
  });

  it('removes the connection from the management output when a trigger is moved into the management', () => {
    let document = newStrategy('S');
    const place = stepElement('zz.place', 'Ausführen', { parameters: { sorte: { kind: 'fixed', value: 'zz.kind_a' } } });
    const first = stepElement('zz.do', 'Erster', { management_of: place.id });
    const trigger = stepElement('zz.start', 'Beginn');
    document = addElement(addElement(addElement(document, types, place, null), types, first, null), types, trigger, null);
    expect(document.connections).toHaveLength(1);

    document = setManagement(document, types, trigger.id, place.id);

    expect(document.connections).toEqual([]);
  });
});

describe('sections (specification 3.3)', () => {
  it('forms a section of the flow of the step, renames it, and removes it without removing its steps', () => {
    let document = inventedStrategy();
    const when = byName(document, 'Weiche');

    document = createSection(document, types, when, 'Entscheidung');
    const section = document.sections[0];
    expect(section).toMatchObject({ name: 'Entscheidung', flow: null, elements: [when], collapsed: false });
    document = renameSection(document, section?.id ?? '', 'Wahl');
    expect(document.sections[0]?.name).toBe('Wahl');
    document = removeSection(document, section?.id ?? '');

    expect(document.sections).toEqual([]);
    expect(document.elements.some((element) => element.id === when)).toBe(true);
  });

  it('lets a step belong to one section only', () => {
    let document = inventedStrategy();
    const when = byName(document, 'Weiche');
    const doIt = byName(document, 'Tun');
    document = createSection(document, types, when, 'Eins');
    document = createSection(document, types, doIt, 'Zwei');
    const first = document.sections[0];

    document = setSection(document, doIt, first?.id ?? '');

    expect(document.sections).toHaveLength(1);
    expect(document.sections[0]?.elements).toEqual([when, doIt]);
  });
});

describe('assignments, names and strategy parameters', () => {
  it('renames an instance and an element without touching the identifier in expressions', () => {
    let document = inventedStrategy();
    document = setElementName(document, byName(document, 'Messer'), 'Mein Messer');
    document = setElementName(document, byName(document, 'Weiche'), 'Meine Weiche');

    const meter = document.elements.find((element) => element.instance !== undefined);
    const when = document.elements.find((element) => element.type === 'zz.when');
    expect(meter?.instance?.name).toBe('Mein Messer');
    expect(meter?.instance?.key).toBe('messer');
    expect(when?.name).toBe('Meine Weiche');
    expect(when?.key).toBe('weiche');
  });

  it('gives the properties of a newly chosen kind of order their standard values and keeps the ones that exist', () => {
    let document = newStrategy('S');
    const place = stepElement('zz.place', 'Ausführen', { parameters: { sorte: { kind: 'fixed', value: 'zz.kind_a' } } });
    document = addElement(document, types, withOrderDefaults(place, types), null);
    expect(document.elements[0]?.properties).toEqual({ stufe: { kind: 'fixed', value: 'low' } });
    document = setBinding(document, types, place.id, 'properties', 'wunsch', { kind: 'fixed', value: 'viel' });

    document = setBinding(document, types, place.id, 'parameters', 'sorte', { kind: 'fixed', value: 'zz.kind_b' });

    expect(document.elements[0]?.properties).toEqual({
      stufe: { kind: 'fixed', value: 'low' },
      wunsch: { kind: 'fixed', value: 'viel' },
      extra: { kind: 'fixed', value: 5 },
    });
  });

  it('removes a strategy parameter and the assignments that used it, in elements and in instances', () => {
    let document = inventedStrategy();
    document = { ...document, parameters: [{ key: 'p', name: 'P', datatype: 'number', value: 1 }] };
    document = setBinding(document, types, byName(document, 'Tun'), 'parameters', 'menge', { kind: 'parameter', value: 'p' });
    document = setBinding(document, types, byName(document, 'Messer'), 'instance', 'laenge', { kind: 'parameter', value: 'p' });

    const changed = removeStrategyParameter(document, 'p');

    expect(changed.parameters).toEqual([]);
    expect(changed.elements.find((element) => element.name === 'Tun')?.parameters.menge).toBeUndefined();
    expect(changed.elements.find((element) => element.instance !== undefined)?.instance?.parameter_values?.laenge).toBeUndefined();
  });

  it('adds an input once and removes it', () => {
    let document = inventedStrategy();
    const doIt = byName(document, 'Tun');
    document = addInput(document, doIt, { instance: 'messer', property: 'stand' });
    document = addInput(document, doIt, { instance: 'messer', property: 'stand' });
    expect(document.elements.find((element) => element.id === doIt)?.inputs).toHaveLength(1);

    document = removeInput(document, doIt, { instance: 'messer', property: 'stand' });

    expect(document.elements.find((element) => element.id === doIt)?.inputs).toEqual([]);
  });

  it('keeps the inputs of a method with other arguments apart, and removes only the one that is meant', () => {
    let document = inventedStrategy();
    const doIt = byName(document, 'Tun');
    const three = { instance: 'pegel', property: 'mittel', kind: 'method', arguments: [3] } as const;
    document = addInput(document, doIt, three);
    document = addInput(document, doIt, { ...three, arguments: [7] }, true);
    document = addInput(document, doIt, { instance: 'pegel', property: 'mittel' });
    const inputs = () => document.elements.find((element) => element.id === doIt)?.inputs;
    expect(inputs()).toEqual([
      { instance: 'pegel', property: 'mittel', kind: 'method', arguments: [3], refresh: false },
      { instance: 'pegel', property: 'mittel', kind: 'method', arguments: [7], refresh: true },
      { instance: 'pegel', property: 'mittel', kind: 'property', arguments: [], refresh: false },
    ]);

    document = removeInput(document, doIt, { ...three, arguments: [7] });
    expect(inputs()?.map((input) => [input.kind, input.arguments])).toEqual([['method', [3]], ['property', []]]);
    // the name is compared without regard to case
    expect(sameInput({ instance: 'Pegel', property: 'Mittel', kind: 'method', arguments: [3] }, three)).toBe(true);
    expect(sameInput({ ...three, arguments: [4] }, three)).toBe(false);
  });

  it('changes the value an input names or its "Aktualisieren" in its place, and adds the input if it is not there', () => {
    let document = inventedStrategy();
    const doIt = byName(document, 'Tun');
    document = addInput(document, doIt, { instance: 'messer', property: 'stand' });
    document = addInput(document, doIt, { instance: 'pegel', property: 'stand' });
    const stand = { instance: 'messer', property: 'stand' };
    const hoch = { instance: 'messer', property: 'hoch' };

    document = changeInput(document, doIt, stand, hoch, true);
    expect(document.elements.find((element) => element.id === doIt)?.inputs.map((input) => [input.property, input.refresh])).toEqual([['hoch', true], ['stand', false]]);

    // another input with the same value is replaced, not doubled
    document = changeInput(document, doIt, { instance: 'pegel', property: 'stand' }, hoch, false);
    expect(document.elements.find((element) => element.id === doIt)?.inputs).toEqual([{ ...hoch, kind: 'property', arguments: [], refresh: false }]);

    document = changeInput(document, doIt, stand, { instance: 'messer', property: 'tief' }, true);
    expect(document.elements.find((element) => element.id === doIt)?.inputs.map((input) => input.property)).toEqual(['hoch', 'tief']);
  });

  it('leaves its argument unchanged', () => {
    const document = inventedStrategy();
    const before = JSON.stringify(document);

    removeElement(document, types, byName(document, 'Tun'));
    setBinding(document, types, byName(document, 'Tun'), 'parameters', 'menge', { kind: 'fixed', value: 3 });
    setManagement(document, types, byName(document, 'Tun'), byName(document, 'Ausführen'));

    expect(JSON.stringify(document)).toBe(before);
  });
});

describe('first use of an instance (specification 3.3, 5.3)', () => {
  it('writes the element with which an instance was connected first, and clears it', () => {
    let document = inventedStrategy();
    document = addElement(document, types, meterElement('Zweiter', 'zweiter'), null);
    const meter = byName(document, 'Zweiter');
    const step = byName(document, 'Tun');

    document = setFirstUse(document, meter, step);
    expect(document.elements.find((element) => element.id === meter)?.instance?.first_use).toBe(step);
    document = setFirstUse(document, meter, null);
    expect(document.elements.find((element) => element.id === meter)?.instance?.first_use).toBeNull();
    // an element without an instance stays as it is
    expect(setFirstUse(document, step, meter)).toEqual(document);
  });
});

describe('new names (specification 3.3)', () => {
  it('counts up with a space and ignores the case', () => {
    expect(uniqueDisplayName('Kerze', [])).toBe('Kerze');
    expect(uniqueDisplayName('Kerze', ['kerze'])).toBe('Kerze 2');
    expect(uniqueDisplayName('Kerze', ['Kerze', 'Kerze 2'])).toBe('Kerze 3');
  });

  it('forms the element of a type with the standard values of its parameters', () => {
    const element = newElement(types.byId.get('zz.do') as never, { name: 'Tun', managementOf: null });

    expect(element.parameters).toEqual({ menge: { kind: 'fixed', value: 1 } });
    expect(element.name).toBe('Tun');
    expect(element.position).toBeNull();
  });
});

describe('the strategy "EMA-Trendfolge" and the operations', () => {
  it('opens as a document of format 2.0 without changes by parsing', () => {
    const raw = emaTrendfolge();
    const document = parseStrategyDocument(raw);

    expect(JSON.parse(JSON.stringify(document))).toEqual(raw);
  });

  it('removes a step of the management and bridges the flow', () => {
    const document = parseStrategyDocument(emaTrendfolge());
    const real = testTypes();

    const changed = removeElement(document, real, EMA_ELEMENT_IDS.newStop);

    expect(changed.connections.some((connection) => connection.source === EMA_ELEMENT_IDS.crossAgainst && connection.output === 'falsch' && connection.target === EMA_ELEMENT_IDS.improved)).toBe(true);
  });

  it('closes the gap in the strategy the backend returned after it removed a step, like removing it here', () => {
    const document = parseStrategyDocument(emaTrendfolge());
    const real = testTypes();
    // the backend removes the element and every connection of it, but does not join its neighbours
    const withoutIt: StrategyDocument = {
      ...document,
      elements: document.elements.filter((element) => element.id !== EMA_ELEMENT_IDS.newStop),
      connections: document.connections.filter((connection) => connection.source !== EMA_ELEMENT_IDS.newStop && connection.target !== EMA_ELEMENT_IDS.newStop),
    };

    const closed = closeGapAfterRemoval(document, withoutIt, real, EMA_ELEMENT_IDS.newStop);

    const expected = removeElement(document, real, EMA_ELEMENT_IDS.newStop);
    const ends = (doc: StrategyDocument) => doc.connections.map(({ source, output, target }) => `${source}/${output}/${target}`).sort();
    expect(ends(closed)).toEqual(ends(expected));
    expect(closed.elements).toEqual(expected.elements);
  });

  it('closes no gap behind a step with a management or with other than one way in and one way out', () => {
    const document = parseStrategyDocument(emaTrendfolge());
    const real = testTypes();
    const withoutOrder: StrategyDocument = { ...document, elements: document.elements.filter((element) => element.id !== EMA_ELEMENT_IDS.order) };
    expect(closeGapAfterRemoval(document, withoutOrder, real, EMA_ELEMENT_IDS.order)).toBe(withoutOrder);
    expect(closeGapAfterRemoval(document, withoutOrder, real, 'not-an-element')).toBe(withoutOrder);
  });
});
