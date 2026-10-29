import { afterEach, describe, expect, it, vi } from 'vitest';

import { newStrategy } from '../document/build';
import { ResponseFormatError } from './http';
import {
  MAX_EXPRESSIONS_PER_REQUEST,
  createKey,
  parseFindings,
  parseObjectList,
  requestExpressions,
  requestRemoval,
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

  it('reads the names a finding carries: the element, the object or rule inside it, and the label of the field (E3)', () => {
    const [finding] = parseFindings([
      {
        level: 'error',
        code: 'expression.empty',
        element: 'e1',
        subject: null,
        details: { field: 'parameter:ausdruck' },
        element_name: { de: 'Bedingung', en: 'Condition' },
        subject_name: 'EMA 20',
        field_label: { de: 'Bedingung', en: 'Condition' },
      },
    ]);

    expect(finding).toMatchObject({
      elementName: { de: 'Bedingung', en: 'Condition' },
      subjectName: 'EMA 20',
      fieldLabel: { de: 'Bedingung', en: 'Condition' },
    });
    expect(() => parseFindings([{ level: 'hint', code: 'x', element: null, subject: null, details: {}, field_label: 'Text' }])).toThrow(ResponseFormatError);
  });

  it.each([[{}], [{ items: [{ id: 'a' }] }], [{ items: [{ id: 1, name: 'x', modified: 'y' }] }]])('rejects %j', (value) => {
    expect(() => parseObjectList(value)).toThrow(ResponseFormatError);
  });

  it('reads findings with level, identifier, element, subject and the data for the text', () => {
    expect(parseFindings([{ level: 'hint', code: 'x.y', element: 'e', subject: null, details: { a: 1 } }])).toEqual([
      { level: 'hint', code: 'x.y', element: 'e', subject: null, details: { a: 1 }, elementName: null, subjectName: null, fieldLabel: null },
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

  it('accepts the blocks as the backend writes them: every field is there, those that do not apply are null', async () => {
    const name = { kind: 'name', path: ['ema20', 'wert'], value: null, operator: null, direction: null, children: [] };
    // a crossing as the backend writes it: "and" of two comparisons, the first one with "previous value of" (no block of its own)
    const previous = { kind: 'function', path: null, value: null, operator: null, function: 'PREVIOUS', direction: null, children: [name] };
    const before = { kind: 'comparison', path: null, value: null, operator: '<=', direction: null, children: [previous, previous] };
    const now = { kind: 'comparison', path: null, value: null, operator: '>', direction: null, children: [name, name] };
    const crossing = { kind: 'logic', path: null, value: null, operator: 'and', direction: null, children: [before, now] };
    vi.stubGlobal('fetch', () =>
      Promise.resolve(new Response(JSON.stringify({ items: [{ stored: 'a', display: 'a', sentence: 's', blocks: crossing }] }), { status: 200 })),
    );

    const answers = await requestExpressions(newStrategy('S'), 'de', [{ pointer: '/x', stored: 'a' }]);

    expect(answers[0]?.blocks?.path).toBeUndefined();
    expect(answers[0]?.blocks?.kind).toBe('logic');
    expect(answers[0]?.blocks?.children?.map((child) => child.kind)).toEqual(['comparison', 'comparison']);
    expect(answers[0]?.blocks?.children?.[0]?.children?.map((child) => child.function)).toEqual(['PREVIOUS', 'PREVIOUS']);
    expect(answers[0]?.blocks?.children?.[1]?.children?.map((child) => child.path)).toEqual([
      ['ema20', 'wert'],
      ['ema20', 'wert'],
    ]);
  });

  it('knows no block "crossing": the backend writes none any more (E12)', async () => {
    const crossing = { kind: 'crossing', path: null, value: null, operator: null, direction: 'any', children: [] };
    vi.stubGlobal('fetch', () =>
      Promise.resolve(new Response(JSON.stringify({ items: [{ stored: 'a', display: 'a', sentence: 's', blocks: crossing }] }), { status: 200 })),
    );

    await expect(requestExpressions(newStrategy('S'), 'de', [{ pointer: '/x', stored: 'a' }])).rejects.toThrow(ResponseFormatError);
  });

  it('reads the result of a method as a name with `call` whose children are the arguments, and the methods of a visible name', async () => {
    const call = { kind: 'name', path: ['pegel', 'mittel'], value: null, operator: null, direction: null, call: true, children: [{ kind: 'literal', value: 3, datatype: 'integer', call: false, children: [] }] };
    const names = [
      {
        display: 'Pegel',
        path: ['pegel'],
        kind: 'instance',
        datatype: null,
        properties: [],
        methods: [
          {
            key: 'mittel',
            label: { de: 'Mittel', en: 'Average' },
            datatype: 'number',
            datatype_label: { de: 'Zahl', en: 'number' },
            explanation: { de: 'Der Mittelwert.', en: 'The mean.' },
            choices: [],
            previous_value: true,
            arguments: [
              { key: 'anzahl', label: { de: 'Anzahl', en: 'Count' }, datatype: 'integer', datatype_label: { de: 'ganze Zahl', en: 'whole number' }, required: true, default: null, explanation: { de: 'Wie viele.', en: 'How many.' }, choices: [] },
              { key: 'gewicht', label: { de: 'Gewicht', en: 'Weight' }, datatype: 'number', required: false, default: 1, explanation: null, choices: [] },
            ],
          },
        ],
        properties_truncated: false,
        contents: [],
      },
    ];
    vi.stubGlobal('fetch', () =>
      Promise.resolve(new Response(JSON.stringify({ items: [{ stored: 'a', display: 'a', sentence: 's', blocks: call, names }] }), { status: 200 })),
    );

    const [answer] = await requestExpressions(newStrategy('S'), 'de', [{ pointer: '/x', stored: 'a' }]);

    expect(answer?.blocks).toEqual({ kind: 'name', path: ['pegel', 'mittel'], call: true, children: [{ kind: 'literal', value: 3, datatype: 'integer' }] });
    const method = answer?.names[0]?.methods[0];
    expect(method).toMatchObject({ key: 'mittel', datatype: 'number', previousValue: true, datatypeLabel: { de: 'Zahl', en: 'number' } });
    expect(method?.arguments[0]?.datatypeLabel).toEqual({ de: 'ganze Zahl', en: 'whole number' });
    expect(method?.arguments.map((argument) => [argument.key, argument.required, argument.default, argument.explanation?.de ?? null])).toEqual([
      ['anzahl', true, null, 'Wie viele.'],
      ['gewicht', false, 1, null],
    ]);
  });

  it('asks who uses a thing before it is removed, and reads the strategy without it', async () => {
    const calls: { url: string; body: unknown }[] = [];
    const document = newStrategy('S');
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body)) });
      const apply = (JSON.parse(String(init?.body)) as { apply: boolean }).apply;
      return Promise.resolve(
        new Response(JSON.stringify({ used_by: ['e1', 'e2'], used_by_rules: ['regel'], removed: apply ? ['e0'] : [], document: apply ? document : null }), { status: 200 }),
      );
    });

    const asked = await requestRemoval(document, 'element', 'e0', false);
    const done = await requestRemoval(document, 'strategy_parameter', 'p', true);

    expect(asked).toEqual({ usedBy: ['e1', 'e2'], usedByRules: ['regel'], removed: [], document: null });
    expect(done.removed).toEqual(['e0']);
    expect(done.document?.name).toBe('S');
    expect(calls.map((call) => call.url)).toEqual(['/api/v1/removals', '/api/v1/removals']);
    expect(calls[1]?.body).toEqual({ document, kind: 'strategy_parameter', target: 'p', apply: true });
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
