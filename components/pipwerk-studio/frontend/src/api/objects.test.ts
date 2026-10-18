import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadTestcase, loadTestcaseRaw } from '../testing/fixtures';
import { HttpError, ResponseFormatError } from './http';
import {
  checkDocument,
  createStrategy,
  deleteStrategy,
  listObjects,
  parseCheckResult,
  parseFindings,
  parseObjectList,
  readStrategy,
  readTemplate,
  replaceStrategy,
} from './objects';

function json(status: number, body: unknown): Response {
  return status === 204 ? new Response(null, { status }) : new Response(JSON.stringify(body), { status });
}

type Call = { url: string; method: string | undefined; body: string | undefined };

function mockFetch(answer: (call: Call) => Response): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
    const call = { url, method: init?.method, body: typeof init?.body === 'string' ? init.body : undefined };
    calls.push(call);
    return Promise.resolve(answer(call));
  });
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('lists', () => {
  it('reads the entries, also those that cannot be read', () => {
    const list = parseObjectList({
      items: [
        {
          id: 'a',
          title: 'T',
          description: 'D',
          object_type: null,
          modified: '2026-10-17T10:00:00.123456Z',
          unreadable: false,
        },
        { id: 'b', title: null, description: null, object_type: null, modified: '2026-10-17T10:00:00Z', unreadable: true },
      ],
    });

    expect(list).toEqual([
      { id: 'a', title: 'T', description: 'D', objectType: null, modified: '2026-10-17T10:00:00.123456Z', unreadable: false },
      { id: 'b', title: null, description: null, objectType: null, modified: '2026-10-17T10:00:00Z', unreadable: true },
    ]);
  });

  it.each([
    [{}],
    [{ items: {} }],
    [{ items: [{ id: 1 }] }],
    [{ items: [{ id: 'a', title: null, description: null, object_type: null, modified: 'x' }] }],
  ])('rejects %j', (value) => {
    expect(() => parseObjectList(value)).toThrow(ResponseFormatError);
  });

  it('asks the path of the kind', async () => {
    const calls = mockFetch(() => json(200, { items: [] }));

    await expect(listObjects('rulesets')).resolves.toEqual([]);

    expect(calls[0]?.url).toBe('/api/v1/rulesets');
  });
});

describe('findings and check results', () => {
  it('reads findings', () => {
    expect(
      parseFindings([{ level: 'hint', code: 'x.y', element: null, subject: 'a.b', details: { n: 1 } }]),
    ).toEqual([{ level: 'hint', code: 'x.y', element: null, subject: 'a.b', details: { n: 1 } }]);
  });

  it.each([
    [[{ level: 'info', code: 'x', element: null, subject: null, details: {} }]],
    [[{ level: 'error', code: 3, element: null, subject: null, details: {} }]],
    [[{ level: 'error', code: 'x', element: 4, subject: null, details: {} }]],
    [[{ level: 'error', code: 'x', element: null, subject: null, details: [] }]],
    [{}],
  ])('rejects %j', (value) => {
    expect(() => parseFindings(value)).toThrow(ResponseFormatError);
  });

  it('reads the recognized names with their positions', () => {
    const result = parseCheckResult({
      findings: [],
      expressions: [
        {
          element: 'e1',
          subject: null,
          field: 'parameter:ausdruck',
          names: [
            {
              start: 0,
              end: 11,
              identifier: 'Order.volumen',
              resolved: true,
              previous: false,
              segments: [
                { identifier: 'Order', start: 0, end: 5 },
                { identifier: 'volumen', start: 6, end: 13 },
              ],
            },
          ],
        },
      ],
      names_truncated: false,
    });

    expect(result.expressions[0]?.names[0]?.segments.map((segment) => segment.identifier)).toEqual(['Order', 'volumen']);
    expect(result.namesTruncated).toBe(false);
  });

  it('rejects a check answer without the flag', () => {
    expect(() => parseCheckResult({ findings: [], expressions: [] })).toThrow(ResponseFormatError);
  });
});

describe('strategies', () => {
  const document = loadTestcase('str-03');

  it('creates with POST and reads the answer', async () => {
    const calls = mockFetch(() => json(201, { id: 'x', document: loadTestcaseRaw('str-03'), findings: [] }));

    const saved = await createStrategy(document);

    expect(calls[0]).toMatchObject({ url: '/api/v1/strategies', method: 'POST' });
    expect(JSON.parse(calls[0]?.body ?? '')).toEqual(document);
    expect(saved.document).toEqual(document);
    expect(saved.findings).toEqual([]);
  });

  it('replaces with PUT on the path of the identifier', async () => {
    const calls = mockFetch(() => json(200, { id: document.id, document: loadTestcaseRaw('str-03'), findings: [] }));

    await replaceStrategy(document);

    expect(calls[0]).toMatchObject({ url: `/api/v1/strategies/${document.id}`, method: 'PUT' });
  });

  it('reads a strategy and checks the document before it is used', async () => {
    mockFetch(() => json(200, loadTestcaseRaw('str-03')));
    await expect(readStrategy('abc')).resolves.toEqual(document);

    mockFetch(() => json(200, { ...(loadTestcaseRaw('str-03') as object), format: 'pipwerk.rule' }));
    await expect(readStrategy('abc')).rejects.toBeInstanceOf(ResponseFormatError);

    mockFetch(() => json(200, { id: 'x' }));
    await expect(readStrategy('abc')).rejects.toBeInstanceOf(ResponseFormatError);
  });

  it('does not use an answer to a save that does not have the expected form', async () => {
    mockFetch(() => json(200, { id: 'x', document: { id: 'x' }, findings: [] }));

    await expect(createStrategy(document)).rejects.toBeInstanceOf(ResponseFormatError);
  });

  it('deletes with DELETE', async () => {
    const calls = mockFetch(() => json(204, null));

    await expect(deleteStrategy('abc')).resolves.toBeUndefined();

    expect(calls[0]).toMatchObject({ url: '/api/v1/strategies/abc', method: 'DELETE' });
  });

  it('fails with the error of the backend', async () => {
    mockFetch(() => json(409, { detail: 'The object file cannot be read.' }));

    await expect(deleteStrategy('abc')).rejects.toMatchObject({ status: 409, detail: 'The object file cannot be read.' });
    await expect(deleteStrategy('abc')).rejects.toBeInstanceOf(HttpError);
  });

  it('asks for the check with the whole document', async () => {
    const calls = mockFetch(() => json(200, { findings: [], expressions: [], names_truncated: false }));

    await checkDocument(document);

    expect(calls[0]).toMatchObject({ url: '/api/v1/check', method: 'POST' });
  });
});

describe('templates', () => {
  it('reads the document of a template as a record', async () => {
    const calls = mockFetch(() => json(200, { id: 'i', title: 'T', object_type: 'Regel', expression: 'a' }));

    await expect(readTemplate('rules', 'i')).resolves.toMatchObject({ expression: 'a' });

    expect(calls[0]?.url).toBe('/api/v1/rules/i');
  });

  it('does not use a template without its identifying fields', async () => {
    mockFetch(() => json(200, { id: 'i', title: 'T' }));

    await expect(readTemplate('rules', 'i')).rejects.toBeInstanceOf(ResponseFormatError);
  });
});
