import { describe, expect, it } from 'vitest';

import { testTypes } from '../testing/typeDescriptions';
import { getOwn, hasOwn, removeOwn, setOwn } from './own';
import { removeStrategyParameter, setBinding } from './ops';
import { parseStrategyDocument, serializeDocument } from './parse';
import type { Bindings, StrategyDocument } from './types';

describe('own fields', () => {
  it('keep `__proto__` as a field of its own and leave the prototype alone', () => {
    const record: Bindings = {};

    setOwn(record, '__proto__', { kind: 'fixed', value: 1 });

    expect(hasOwn(record, '__proto__')).toBe(true);
    expect(Object.keys(record)).toEqual(['__proto__']);
    expect(Object.getPrototypeOf(record)).toBe(Object.prototype);
    expect(getOwn(record, '__proto__')).toEqual({ kind: 'fixed', value: 1 });
    removeOwn(record, '__proto__');
    expect(Object.keys(record)).toEqual([]);
  });

  it('read nothing where there is no own field (counter-check: the plain read finds the prototype)', () => {
    const record: Bindings = {};

    expect(record['__proto__']).toBe(Object.prototype);
    expect(getOwn(record, '__proto__')).toBeUndefined();
    expect(getOwn(record, 'toString')).toBeUndefined();
    expect(getOwn(undefined, 'a')).toBeUndefined();
  });
});

const BINDING = '{"kind":"fixed","value":7}';

/** A document with the binding `__proto__` at an element, at its instance and at a rule (written as text: a literal would set the prototype). */
const PROTO_DOCUMENT = `{
  "format": "pipwerk.strategy", "format_version": "2.0", "id": "doc", "name": "T",
  "rules": [{
    "name": "regel", "key": "regel", "object_type": "Regel",
    "parameters": [{ "key": "__proto__", "name": "p", "datatype": "number" }],
    "parameter_values": { "__proto__": ${BINDING} }
  }],
  "elements": [{
    "id": "e1", "type": "unbekannt",
    "parameters": { "__proto__": ${BINDING}, "andere": ${BINDING} },
    "properties": { "__proto__": ${BINDING} },
    "instance": { "name": "inst", "key": "inst", "object_type": "X", "parameter_values": { "__proto__": ${BINDING} } }
  }]
}`;

function ownKeys(record: object | undefined): string[] {
  return record === undefined ? [] : Object.keys(record);
}

describe('a binding named `__proto__`', () => {
  it('is a field of its own in the raw test document (premise of the tests)', () => {
    const raw = JSON.parse(PROTO_DOCUMENT) as { elements: { parameters: object }[] };

    expect(ownKeys(raw.elements[0]?.parameters)).toEqual(['__proto__', 'andere']);
  });

  it('is kept when the document is read, changed and compared', () => {
    const types = testTypes();
    const document = parseStrategyDocument(JSON.parse(PROTO_DOCUMENT));
    const element = document.elements[0]!;

    // Read: every binding is a field of its own.
    expect(ownKeys(element.parameters)).toEqual(['__proto__', 'andere']);
    expect(ownKeys(element.properties)).toEqual(['__proto__']);
    expect(ownKeys(element.instance?.parameter_values)).toEqual(['__proto__']);
    expect(ownKeys(document.rules[0]?.parameter_values)).toEqual(['__proto__']);
    expect(Object.getPrototypeOf(element.parameters)).toBe(Object.prototype);

    // Changed: another binding changes and `__proto__` stays.
    let changed: StrategyDocument = setBinding(document, types, 'e1', 'parameters', 'neu', JSON.parse(BINDING));
    changed = setBinding(changed, types, 'e1', 'instance', 'neu', JSON.parse(BINDING));
    expect(ownKeys(changed.elements[0]?.parameters)).toEqual(['__proto__', 'andere', 'neu']);
    expect(ownKeys(changed.elements[0]?.instance?.parameter_values)).toEqual(['__proto__', 'neu']);
    expect(ownKeys(changed.rules[0]?.parameter_values)).toEqual(['__proto__']);
    expect(getOwn(changed.elements[0]?.parameters, '__proto__')).toEqual({ kind: 'fixed', value: 7 });
    expect(serializeDocument(changed)).not.toBe(serializeDocument(document));

    // `__proto__` itself is changed and removed like any other binding.
    const replaced = setBinding(changed, types, 'e1', 'parameters', '__proto__', { kind: 'application' });
    expect(getOwn(replaced.elements[0]?.parameters, '__proto__')).toEqual({ kind: 'application' });
    expect(Object.getPrototypeOf(replaced.elements[0]?.parameters)).toBe(Object.prototype);
    const removed = setBinding(replaced, types, 'e1', 'parameters', '__proto__', null);
    expect(ownKeys(removed.elements[0]?.parameters)).toEqual(['andere', 'neu']);

    // Removing a strategy parameter that nothing uses leaves the fields as they are.
    const without = removeStrategyParameter(document, 'gibt-es-nicht');
    expect(ownKeys(without.elements[0]?.parameters)).toEqual(['__proto__', 'andere']);

    // The text of the document keeps the field, and reading it again gives the same document.
    expect(serializeDocument(document)).toContain('"__proto__":{"kind":"fixed","value":7}');
    const reread = parseStrategyDocument(JSON.parse(serializeDocument(document)));
    expect(serializeDocument(reread)).toBe(serializeDocument(document));
  });
});
