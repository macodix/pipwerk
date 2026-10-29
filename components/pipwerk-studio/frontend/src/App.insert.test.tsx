import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { newStrategy } from './document/build';
import { LIBRARY_DRAG_TYPE } from './library/dragType';
import { renderWithProviders } from './test-utils';
import { choose, menu, openStored, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';
import type { FakeFinding } from './testing/fakeApi';

// Specification E2, 3.3, 4.2 (order 19, K1): a template is inserted with the instance that `POST /api/v1/insert` delivers.
// The interface forms no name, key or expression of its own; two rules "Mindestvolumen" do not meet in one namespace.

type Json = Record<string, unknown>;

const STRATEGY_ID = '6f1c5c58-2b8e-4e53-9a3f-1d4a3f2d7b01';
const RULESET_ID = '0d3a9c0e-6b9c-4f1e-8a7e-2f4c5d6e7a02';

function rule(name: string, key: string, expression: string): Json {
  return {
    name,
    key,
    object_type: 'Regel',
    origin: { object_type: 'Regel', template_id: null },
    parameter_values: {},
    parameters: [],
    properties: [],
    instances: [],
    rules: [],
    expression,
    determined_property: null,
    comparison: null,
    result_expression: null,
  };
}

/** A strategy with the rule "Mindestvolumen" in its rules. */
function strategy(): Json {
  return { ...newStrategy('Prüfung'), id: STRATEGY_ID, rules: [rule('Mindestvolumen', 'mindestvolumen', 'Order.volumen >= 1')] };
}

/** An own ruleset "Prüfregeln" with the rule "Mindestvolumen" and a result that uses it. */
function ruleset(): Json {
  return {
    id: RULESET_ID,
    format: 'pipwerk.ruleset',
    format_version: '2.0',
    name: 'Prüfregeln',
    description: '',
    object_type: 'Regelwerk',
    parameter_values: {},
    parameters: [],
    properties: [],
    instances: [],
    rules: [rule('Mindestvolumen', 'mindestvolumen', 'Order.volumen >= 1')],
    expression: null,
    determined_property: null,
    comparison: null,
    result_expression: 'mindestvolumen.ergebnis',
  };
}

type Stored = { rules: (Json & { name: string; key: string; rules?: (Json & { name: string; key: string; expression: string })[]; result_expression?: string })[] };

/** The check of the test double: two rules or instances of the same name (without regard to case) are `name.duplicate`. */
function duplicates(document: Json): FakeFinding[] {
  const seen = new Set<string>();
  const found: FakeFinding[] = [];
  const visit = (items: unknown): void => {
    for (const item of Array.isArray(items) ? (items as Json[]) : []) {
      const name = String(item.name).toLowerCase();
      if (seen.has(name)) {
        found.push({ level: 'error', code: 'name.duplicate', element: null, subject: String(item.key), details: { name: item.name } });
      }
      seen.add(name);
      visit(item.instances);
      visit(item.rules);
    }
  };
  visit(document.rules);
  return found;
}

async function open(user: ReturnType<typeof userEvent.setup>, options: Parameters<typeof mockApi>[0] = {}) {
  const checked: FakeFinding[][] = [];
  const api = mockApi({
    strategies: [strategy()],
    templates: { rulesets: [ruleset()] },
    findings: (document) => {
      const findings = duplicates(document);
      checked.push(findings);
      return findings;
    },
    ...options,
  });
  renderWithProviders(<App />, 'de');
  await waitForReady();
  await waitFor(() => {
    expect(document.querySelector('[data-testid="lib-item"][data-label="Prüfregeln"]')).not.toBeNull();
  });
  await openStored(user, 'Prüfung');
  await waitFor(() => {
    expect(screen.getByTestId('status-pill')).toHaveTextContent('Prüfung');
  });
  return { api, checked };
}

const entry = (): HTMLElement => document.querySelector<HTMLElement>('[data-testid="lib-item"][data-label="Prüfregeln"]') as HTMLElement;

async function saved(user: ReturnType<typeof userEvent.setup>, api: ReturnType<typeof mockApi>): Promise<Stored> {
  await menu(user, 'save');
  await waitFor(() => {
    expect(api.requests('PUT', /strategies/)).toHaveLength(1);
  });
  return api.requests('PUT', /strategies/)[0]?.body as Stored;
}

function expectInserted(document: Stored, name: string, key: string): void {
  const inserted = document.rules.find((candidate) => candidate.name === name);
  expect(inserted).toMatchObject({ key, origin: { object_type: 'Regelwerk', template_id: RULESET_ID, template_name: 'Prüfregeln' } });
  const inner = inserted?.rules?.[0];
  expect(inner).toMatchObject({ name: `${name} Mindestvolumen`, key: `${key}_mindestvolumen`, expression: 'Order.volumen >= 1' });
  expect(inserted?.result_expression).toBe(`${key}_mindestvolumen.ergebnis`);
}

describe('inserting a template (order 19, K1)', () => {
  it('takes the instance of /api/v1/insert on a click: new names and keys, rewritten expressions, no duplicate name', async () => {
    const user = userEvent.setup();
    const { api, checked } = await open(user);

    await user.click(entry());
    await waitFor(() => {
      expect(api.requests('POST', /\/api\/v1\/insert/)).toHaveLength(1);
    });

    const request = api.requests('POST', /\/api\/v1\/insert/)[0]?.body as { document: Stored; template: { id: string }; name: string };
    expect(request.template.id).toBe(RULESET_ID);
    expect(request.name).toBe('Prüfregeln');
    expect(request.document.rules.map((candidate) => candidate.name)).toEqual(['Mindestvolumen']);
    const document = await saved(user, api);
    expect(document.rules.map((candidate) => candidate.name)).toEqual(['Mindestvolumen', 'Prüfregeln']);
    expectInserted(document, 'Prüfregeln', 'pruefregeln');
    expect(checked.flat().map((finding) => finding.code)).not.toContain('name.duplicate');
  });

  it('takes it on dropping onto the drawing area just the same', async () => {
    const user = userEvent.setup();
    const { api, checked } = await open(user);

    const viewport = await screen.findByTestId('viewport');
    fireEvent.drop(viewport, {
      clientX: 120,
      clientY: 90,
      dataTransfer: { getData: (type: string) => (type === LIBRARY_DRAG_TYPE ? (entry().dataset.lib ?? '') : ''), types: [LIBRARY_DRAG_TYPE] },
    });
    await waitFor(() => {
      expect(api.requests('POST', /\/api\/v1\/insert/)).toHaveLength(1);
    });

    const document = await saved(user, api);
    expectInserted(document, 'Prüfregeln', 'pruefregeln');
    expect(checked.flat().map((finding) => finding.code)).not.toContain('name.duplicate');
  });

  it('adds it to the rules from the list "Regel oder Regelwerk hinzufügen …" with the same call', async () => {
    const user = userEvent.setup();
    const { api, checked } = await open(user);
    await user.click(screen.getByTestId('status-pill'));
    const section = await screen.findByTestId('sec-rules');

    await choose(user, within(section).getByTestId('rule-add-select'), 'Prüfregeln (eigene)');
    await waitFor(() => {
      expect(api.requests('POST', /\/api\/v1\/insert/)).toHaveLength(1);
    });

    const document = await saved(user, api);
    expectInserted(document, 'Prüfregeln', 'pruefregeln');
    expect(checked.flat().map((finding) => finding.code)).not.toContain('name.duplicate');
  });

  it('inserts an object type through the same call, with the standard values of the type', async () => {
    const user = userEvent.setup();
    const { api } = await open(user);
    await user.click(screen.getByTestId('status-pill'));
    const section = await screen.findByTestId('sec-rules');

    await choose(user, within(section).getByTestId('rule-add-select'), 'eigene Regel');
    await waitFor(() => {
      expect(api.requests('POST', /\/api\/v1\/insert/)).toHaveLength(1);
    });

    const request = api.requests('POST', /\/api\/v1\/insert/)[0]?.body as { object_type: string; template?: unknown };
    expect(request.object_type).toBe('Regel');
    expect(request.template).toBeUndefined();
    const document = await saved(user, api);
    expect(document.rules.map((candidate) => candidate.name)).toEqual(['Mindestvolumen', 'eigene Regel']);
    expect(document.rules[1]).toMatchObject({ key: 'eigene_regel', expression: '' });
  });

  it('changes nothing in the document until the answer is there', async () => {
    const user = userEvent.setup();
    const { api } = await open(user);
    const answer = globalThis.fetch;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let asked = 0;
    vi.stubGlobal('fetch', (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      if (String(input).includes('/api/v1/insert')) {
        asked += 1;
        return gate.then(() => answer(input, init));
      }
      return answer(input, init);
    });

    await user.click(entry());
    await waitFor(() => {
      expect(asked).toBe(1);
    });
    expect(screen.getByTestId('status-pill')).not.toHaveTextContent('ungespeichert');
    release();
    await waitFor(() => {
      expect(screen.getByTestId('status-pill')).toHaveTextContent('ungespeichert');
    });
    expectInserted(await saved(user, api), 'Prüfregeln', 'pruefregeln');
  });

  it('gives two quick insertions different names: the second request starts from the document after the first', async () => {
    const user = userEvent.setup();
    const { api, checked } = await open(user);

    fireEvent.click(entry());
    fireEvent.click(entry());
    await waitFor(() => {
      expect(api.requests('POST', /\/api\/v1\/insert/)).toHaveLength(2);
    });

    const second = api.requests('POST', /\/api\/v1\/insert/)[1]?.body as { document: Stored };
    expect(second.document.rules.map((candidate) => candidate.name)).toEqual(['Mindestvolumen', 'Prüfregeln']);
    const document = await saved(user, api);
    expect(document.rules.map((candidate) => candidate.name)).toEqual(['Mindestvolumen', 'Prüfregeln', 'Prüfregeln 2']);
    expectInserted(document, 'Prüfregeln 2', 'pruefregeln_2');
    expect(checked.flat().map((finding) => finding.code)).not.toContain('name.duplicate');
  });

  it('leaves the document unchanged and tells what to do when the call fails', async () => {
    const user = userEvent.setup();
    const { api } = await open(user, { fail: { insert: { status: 500, body: { detail: 'failed', code: 'request.failed', params: {} } } } });

    await user.click(entry());

    const dialog = await screen.findByRole('alertdialog', { name: 'Der Eintrag konnte nicht eingefügt werden.' });
    expect(dialog).toHaveTextContent('In der Strategie wurde nichts geändert. Versuchen Sie es noch einmal.');
    expect(screen.getByTestId('status-pill')).not.toHaveTextContent('ungespeichert');
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    const document = await saved(user, api);
    expect(document.rules.map((candidate) => candidate.name)).toEqual(['Mindestvolumen']);
  });
});
