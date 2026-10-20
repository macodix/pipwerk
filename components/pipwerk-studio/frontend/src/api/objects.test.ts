import { afterEach, describe, expect, it, vi } from 'vitest';

import { newStrategy } from '../document/build';
import { ResponseFormatError } from './http';
import {
  MAX_EXPRESSIONS_PER_REQUEST,
  createKey,
  parseFindings,
  parseObjectList,
  requestExpressions,
} from './objects';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('lists and findings of the Web API', () => {
  it('reads the list with name, description, kind and time, and marks a file that cannot be read', () => {
    const list = parseObjectList({
      items: [
        { id: 'a', name: 'Eins', description: 'Text', object_type: null, modified: '2026-10-20T10:00:00Z', unreadable: false },
        { id: 'b', name: null, description: null, object_type: null, modified: '2026-10-20T10:00:00Z', unreadable: true },
      ],
    });

    expect(list).toEqual([
      { id: 'a', name: 'Eins', description: 'Text', objectType: null, modified: '2026-10-20T10:00:00Z', unreadable: false },
      { id: 'b', name: null, description: null, objectType: null, modified: '2026-10-20T10:00:00Z', unreadable: true },
    ]);
  });

  it.each([[{}], [{ items: [{ id: 'a' }] }], [{ items: [{ id: 1, name: 'x', modified: 'y' }] }]])('rejects %j', (value) => {
    expect(() => parseObjectList(value)).toThrow(ResponseFormatError);
  });

  it('reads findings with level, identifier, element, subject and the data for the text', () => {
    expect(parseFindings([{ level: 'hint', code: 'x.y', element: 'e', subject: null, details: { a: 1 } }])).toEqual([
      { level: 'hint', code: 'x.y', element: 'e', subject: null, details: { a: 1 } },
    ]);
    expect(() => parseFindings([{ level: 'bad', code: 'x', element: null, subject: null }])).toThrow(ResponseFormatError);
  });
});

describe('identifiers and expressions (specification 3.3, 3.4, E2)', () => {
  it('asks the backend for the identifier of a new name: the interface forms none', async () => {
    const calls: { url: string; body: unknown }[] = [];
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body)) });
      return Promise.resolve(new Response(JSON.stringify({ key: 'kerze_2' }), { status: 200 }));
    });
    const document = newStrategy('S');

    await expect(createKey(document, '/elements', 'Kerze 2')).resolves.toBe('kerze_2');

    expect(calls).toEqual([{ url: '/api/v1/keys', body: { document, scope: '/elements', name: 'Kerze 2' } }]);
  });

  it('reads sentence, display form and blocks of an expression and keeps the order of the query', async () => {
    vi.stubGlobal('fetch', (_url: string, init?: RequestInit) => {
      const items = (JSON.parse(String(init?.body)) as { items: { pointer: string; stored: string }[] }).items;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            items: items.map((item) => ({
              stored: item.stored,
              display: item.stored.toUpperCase(),
              sentence: `Satz ${item.stored}`,
              blocks: item.stored === 'kaputt' ? null : { kind: 'name', path: ['ema20', 'wert'] },
              findings: [],
            })),
          }),
          { status: 200 },
        ),
      );
    });

    const answers = await requestExpressions(newStrategy('S'), 'de', [
      { pointer: '/elements/0/parameters/ausdruck/value', stored: 'a' },
      { pointer: '/elements/1/parameters/ausdruck/value', stored: 'kaputt' },
    ]);

    expect(answers.map((answer) => answer.sentence)).toEqual(['Satz a', 'Satz kaputt']);
    expect(answers[0]?.blocks).toEqual({ kind: 'name', path: ['ema20', 'wert'] });
    expect(answers[1]?.blocks).toBeNull();
  });

  it('splits more than the allowed number of expressions into several requests', async () => {
    let requests = 0;
    vi.stubGlobal('fetch', (_url: string, init?: RequestInit) => {
      requests += 1;
      const items = (JSON.parse(String(init?.body)) as { items: unknown[] }).items;
      expect(items.length).toBeLessThanOrEqual(MAX_EXPRESSIONS_PER_REQUEST);
      return Promise.resolve(
        new Response(JSON.stringify({ items: items.map(() => ({ stored: 'a', display: 'a', sentence: 'a', blocks: null })) }), { status: 200 }),
      );
    });
    const queries = Array.from({ length: 120 }, (_, index) => ({ pointer: `/elements/${index}/parameters/x/value`, stored: 'a' }));

    const answers = await requestExpressions(newStrategy('S'), 'en', queries);

    expect(answers).toHaveLength(120);
    expect(requests).toBe(3);
  });

  it('refuses an answer with a different number of entries', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify({ items: [] }), { status: 200 })));

    await expect(requestExpressions(newStrategy('S'), 'de', [{ pointer: '/x', stored: 'a' }])).rejects.toThrow(ResponseFormatError);
  });
});
