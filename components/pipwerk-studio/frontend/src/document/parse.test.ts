import { describe, expect, it } from 'vitest';

import { ResponseFormatError } from '../api/http';
import { addInput, removeElement, removeInput } from './ops';
import { newStrategy } from './build';
import { parseStrategyDocument, serializeDocument } from './parse';
import type { StrategyDocument } from './types';
import { inventedStrategy, inventedTypes, meterElement, stepElement } from '../testing/inventedTypes';

// Specification 3.3, 3.7: an input is an instance and its property or method with the values of the arguments and
// "Aktualisieren". The interface keeps the five fields as they are when it opens and saves a document, also where it
// does not show them (order 11).

const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';

function documentWithInputs(inputs: unknown[], extra: Record<string, unknown> = {}): Record<string, unknown> {
  const base = newStrategy('Eingänge');
  return {
    ...base,
    elements: [
      {
        id: UUID_A,
        type: 'zz.do',
        name: 'Tun',
        key: null,
        position: null,
        parameters: {},
        properties: {},
        inputs,
        rules: [],
        management_of: null,
      },
      {
        id: UUID_B,
        type: 'zz.meter',
        name: null,
        position: null,
        parameters: {},
        properties: {},
        inputs: [],
        rules: [],
        management_of: null,
        instance: {
          name: 'Messer',
          key: 'messer',
          object_type: 'zz.meter',
          origin: { object_type: 'zz.meter', template_id: null },
          first_use: UUID_A,
          parameter_values: {},
        },
        ...extra,
      },
    ],
  };
}

const everyKind = [
  { instance: 'messer', property: 'stand' },
  { instance: 'messer', property: 'stand', kind: 'property', arguments: [], refresh: false },
  { instance: 'messer', property: 'stand', kind: 'property', arguments: [], refresh: true },
  { instance: 'messer', property: 'mittel', kind: 'method', arguments: [3, 0.5, true, 'text'], refresh: false },
  { instance: 'messer', property: 'mittel', kind: 'method', arguments: [3], refresh: true },
];

describe('the inputs of a document (specification 3.3, 3.7)', () => {
  it('are read and written back unchanged: a property, a method with arguments, with and without "Aktualisieren"', () => {
    const raw = documentWithInputs(everyKind);

    const parsed = parseStrategyDocument(raw);
    const back = JSON.parse(serializeDocument(parsed)) as { elements: { inputs: unknown[] }[] };

    expect(parsed.elements[0]?.inputs).toEqual(everyKind);
    expect(back.elements[0]?.inputs).toEqual(everyKind);
  });

  it('keep a field the interface does not know', () => {
    const input = { instance: 'messer', property: 'stand', kind: 'property', arguments: [], refresh: false, spaeter: { a: 1 } };

    const parsed = parseStrategyDocument(documentWithInputs([input]));

    expect(parsed.elements[0]?.inputs[0]).toEqual(input);
  });

  it('keep "first_use" of an instance, a stored one and none', () => {
    const parsed = parseStrategyDocument(documentWithInputs([]));
    expect(parsed.elements[1]?.instance?.first_use).toBe(UUID_A);
    expect(JSON.parse(serializeDocument(parsed)).elements[1].instance.first_use).toBe(UUID_A);

    const without = documentWithInputs([]);
    ((without.elements as { instance: Record<string, unknown> }[])[1] as { instance: Record<string, unknown> }).instance.first_use = null;
    expect(parseStrategyDocument(without).elements[1]?.instance?.first_use).toBeNull();
  });

  it('are refused when a field has the wrong kind', () => {
    expect(() => parseStrategyDocument(documentWithInputs([{ instance: 'a', property: 'b', kind: 'column' }]))).toThrow(ResponseFormatError);
    expect(() => parseStrategyDocument(documentWithInputs([{ instance: 'a', property: 'b', arguments: 'drei' }]))).toThrow(ResponseFormatError);
    expect(() => parseStrategyDocument(documentWithInputs([{ instance: 'a', property: 'b', arguments: [{}] }]))).toThrow(ResponseFormatError);
    expect(() => parseStrategyDocument(documentWithInputs([{ instance: 'a', property: 'b', refresh: 'ja' }]))).toThrow(ResponseFormatError);
  });

  it('are added with all five fields, and an input of a method of the same name stays when the property is removed', () => {
    const parsed = parseStrategyDocument(documentWithInputs([everyKind[3]]));

    const added = addInput(parsed, UUID_A, { instance: 'messer', property: 'mittel' });
    expect(added.elements[0]?.inputs).toEqual([
      everyKind[3],
      { instance: 'messer', property: 'mittel', kind: 'property', arguments: [], refresh: false },
    ]);

    const removed = removeInput(added, UUID_A, { instance: 'messer', property: 'mittel' });
    expect(removed.elements[0]?.inputs).toEqual([everyKind[3]]);
  });

  it('give up the first use of an instance when the element of the first use is removed', () => {
    const types = inventedTypes();
    const strategy: StrategyDocument = inventedStrategy();
    const step = stepElement('zz.do', 'Eins');
    const meter = meterElement('Pegel', 'pegel');
    meter.instance = { ...(meter.instance as NonNullable<typeof meter.instance>), first_use: step.id };
    const document: StrategyDocument = { ...strategy, elements: [step, meter] };

    const next = removeElement(document, types, step.id);

    expect(next.elements.map((element) => element.instance?.first_use)).toEqual([null]);
    // the document that was given is not changed
    expect(document.elements[1]?.instance?.first_use).toBe(step.id);
  });
});
