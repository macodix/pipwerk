import { describe, expect, it } from 'vitest';

import { ResponseFormatError } from '../api/http';
import { loadTestcaseRaw } from '../testing/fixtures';
import { parseStrategyDocument, serializeDocument } from './parse';

describe.each(['str-01', 'str-03'] as const)('parseStrategyDocument with %s', (name) => {
  it('gives the document back unchanged', () => {
    const raw = loadTestcaseRaw(name);

    expect(parseStrategyDocument(raw)).toEqual(raw);
  });
});

function minimal(): Record<string, unknown> {
  return { format: 'pipwerk.strategy', format_version: '1.0', id: 'x', title: 'T' };
}

describe('parseStrategyDocument', () => {
  it('fills what the format defaults', () => {
    const document = parseStrategyDocument({
      ...minimal(),
      elements: [{ id: 'e', type: 'flow.condition' }],
    });

    expect(document).toEqual({
      ...minimal(),
      description: '',
      parameters: [],
      rules: [],
      connections: [],
      elements: [
        {
          id: 'e',
          type: 'flow.condition',
          title: '',
          name: null,
          x: 0,
          y: 0,
          parameters: {},
          properties: {},
          rules: [],
          management_of: null,
        },
      ],
    });
  });

  it('keeps fields it does not know, at the document, the element, the binding and the instance', () => {
    const raw = {
      ...minimal(),
      future: { a: 1 },
      elements: [
        {
          id: 'e',
          type: 'EMA',
          parameters: { p: { kind: 'fixed', value: 1, unit: 'pips' } },
          vendor: true,
          instance: { name: 'ema', object_type: 'EMA', extra: [1], parameter_values: { q: { kind: 'application', note: 'n' } } },
        },
      ],
    };

    const document = parseStrategyDocument(raw);

    expect(document.future).toEqual({ a: 1 });
    expect(document.elements[0]?.vendor).toBe(true);
    expect(document.elements[0]?.parameters.p).toEqual({ kind: 'fixed', value: 1, unit: 'pips' });
    expect(document.elements[0]?.instance).toEqual(raw.elements[0]?.instance);
  });

  it.each([
    ['another format', { ...minimal(), format: 'pipwerk.rule' }],
    ['no identifier', { format: 'pipwerk.strategy', format_version: '1.0', title: 'T' }],
    ['no title', { format: 'pipwerk.strategy', format_version: '1.0', id: 'x' }],
    ['a list that is no list', { ...minimal(), elements: {} }],
    ['an element without a type', { ...minimal(), elements: [{ id: 'e' }] }],
    ['a position that is no number', { ...minimal(), elements: [{ id: 'e', type: 't', x: '3' }] }],
    ['a binding of an unknown kind', { ...minimal(), elements: [{ id: 'e', type: 't', parameters: { p: { kind: 'magic' } } }] }],
    ['a binding value that is an object', { ...minimal(), elements: [{ id: 'e', type: 't', parameters: { p: { kind: 'fixed', value: {} } } }] }],
    ['an instance without a name', { ...minimal(), elements: [{ id: 'e', type: 't', instance: { object_type: 'EMA' } }] }],
    ['a rule that is no instance', { ...minimal(), rules: [3] }],
    ['a connection without a target', { ...minimal(), connections: [{ source: 'a', output: 'b' }] }],
    ['a strategy parameter of an unknown datatype', { ...minimal(), parameters: [{ name: 'p', datatype: 'quantum' }] }],
    ['a document that is no object', []],
  ])('rejects %s', (_name, value) => {
    expect(() => parseStrategyDocument(value)).toThrow(ResponseFormatError);
  });
});

describe('serializeDocument', () => {
  it('is the same for equal documents and different after a change', () => {
    const a = parseStrategyDocument(minimal());
    const b = parseStrategyDocument(minimal());

    expect(serializeDocument(a)).toBe(serializeDocument(b));
    expect(serializeDocument({ ...a, title: 'other' })).not.toBe(serializeDocument(a));
  });
});
