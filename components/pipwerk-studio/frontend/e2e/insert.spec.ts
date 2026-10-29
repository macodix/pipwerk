import { randomUUID } from 'node:crypto';

import type { Page } from '@playwright/test';

import { newStrategyFromScratch } from './builder';
import { storedStrategy } from './compare';
import { choose, clickMenu, expect, expectSaved, library, openApp, showArea, test } from './support';

// Order 19, K1 (specification E2, 3.3, 4.2): a template is inserted with the instance that `POST /api/v1/insert` delivers.
// A strategy with the rule "Mindestvolumen" and a stored ruleset that holds a rule of the same name: the inserted ruleset is
// named "<ruleset> Mindestvolumen" for its rule, the keys and the expressions follow, and the check finds no `name.duplicate`.
// They run against the real backend.

test.use({ actionTimeout: 10_000 });

type Stored = {
  rules: {
    name: string;
    key: string;
    result_expression?: string | null;
    origin?: { template_id?: string | null };
    rules?: { name: string; key: string; expression: string }[];
  }[];
};

function rulesetDocument(id: string, name: string): Record<string, unknown> {
  return {
    format: 'pipwerk.ruleset',
    format_version: '2.0',
    id,
    name,
    description: '',
    object_type: 'Regelwerk',
    rules: [
      {
        name: 'Mindestvolumen',
        key: 'mindestvolumen',
        object_type: 'Regel',
        origin: { object_type: 'Regel' },
        expression: 'Order.volumen >= 1',
      },
    ],
    result_expression: 'mindestvolumen.ergebnis',
  };
}

const DIRECTORY = '/api/studio/settings/object-directory';

/**
 * The tests share one backend and a stored template cannot be deleted in this version, so the test works in an object
 * directory of its own and gives the original one back at its end (`PUT` with the returned path). The other tests see
 * neither the template nor the strategy.
 */
async function useOwnDirectory(page: Page, project: string): Promise<string> {
  const current = (await (await page.request.get(DIRECTORY)).json()) as { path: string };
  const own = await page.request.put(DIRECTORY, { data: { path: `${current.path}-insert-${project}`, move: false } });
  expect(own.ok()).toBe(true);
  return current.path;
}

/** Stores the ruleset; the backend gives it its own identifier, which is returned. */
async function storeRuleset(page: Page, name: string): Promise<string> {
  const answer = await page.request.post('/api/v1/rulesets', { data: rulesetDocument(randomUUID(), name) });
  expect(answer.ok()).toBe(true);
  return ((await answer.json()) as { id: string }).id;
}

/** The key the backend forms from a name that has only plain letters and spaces. */
const keyOf = (name: string): string => name.toLowerCase().replace(/ü/g, 'ue').replace(/ /g, '_');

/** A strategy with the rule "Mindestvolumen" of its own, and the properties view with the rules open. */
async function strategyWithRule(page: Page, name: string): Promise<void> {
  await newStrategyFromScratch(page, name);
  await showArea(page, 'canvas');
  await page.getByTestId('status-pill').click();
  await showArea(page, 'props');
  const section = page.getByTestId('sec-rules');
  await choose(section.getByTestId('rule-add-select'), { label: 'eigene Regel' });
  await section.getByTestId('rule-card').last().getByTestId('instance-name').fill('Mindestvolumen');
}

async function expectResult(page: Page, strategy: string, ruleset: string, rulesetId: string): Promise<void> {
  await clickMenu(page, 'save');
  await expectSaved(page);
  const stored = (await storedStrategy(page, strategy)) as unknown as Stored;
  expect(stored.rules.map((rule) => rule.name)).toEqual(['Mindestvolumen', ruleset]);
  const inserted = stored.rules[1];
  expect(inserted).toMatchObject({ key: keyOf(ruleset), origin: { template_id: rulesetId } });
  expect(inserted?.rules?.[0]).toMatchObject({
    name: `${ruleset} Mindestvolumen`,
    key: `${keyOf(ruleset)}_mindestvolumen`,
    expression: 'Order.volumen >= 1',
  });
  expect(inserted?.result_expression).toBe(`${keyOf(ruleset)}_mindestvolumen.ergebnis`);
  const checked = (await (await page.request.post('/api/v1/check', { data: stored })).json()) as { findings: { code: string }[] };
  expect(checked.findings.map((finding) => finding.code)).not.toContain('name.duplicate');
}

test('a click inserts the ruleset with the instance of /api/v1/insert: new names and keys, rewritten expressions', async ({ page }, testInfo) => {
  const strategy = `Einfügen Klick ${testInfo.project.name}`;
  const ruleset = `Prüfregeln ${testInfo.project.name}`;
  const original = await useOwnDirectory(page, testInfo.project.name);
  const rulesetId = await storeRuleset(page, ruleset);
  try {
    await openApp(page);
    await strategyWithRule(page, strategy);
    const asked: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('/api/v1/insert')) {
        asked.push(request.postData() ?? '');
      }
    });

    await showArea(page, 'library');
    await library(page, ruleset).click();
    await showArea(page, 'props');
    // the rule of the strategy, the inserted ruleset and the rule inside of it
    await expect(page.getByTestId('sec-rules').getByTestId('rule-card')).toHaveCount(3);

    expect(asked).toHaveLength(1);
    expect(JSON.parse(asked[0] ?? '{}')).toMatchObject({ template: { id: rulesetId }, name: ruleset });
    await expectResult(page, strategy, ruleset, rulesetId);
  } finally {
    await page.request.put(DIRECTORY, { data: { path: original, move: false } });
  }
});

test('dragging onto the drawing area inserts the ruleset the same way', async ({ page }, testInfo) => {
  const strategy = `Einfügen Ziehen ${testInfo.project.name}`;
  const ruleset = `Prüfwerk ${testInfo.project.name}`;
  const original = await useOwnDirectory(page, testInfo.project.name);
  const rulesetId = await storeRuleset(page, ruleset);
  try {
    await openApp(page);
    await strategyWithRule(page, strategy);
    await showArea(page, 'canvas');
    const answered = page.waitForResponse((response) => response.url().endsWith('/api/v1/insert') && response.ok());

    await library(page, ruleset).dragTo(page.getByTestId('viewport'), { targetPosition: { x: 400, y: 250 } });
    await answered;

    await showArea(page, 'props');
    // the rule of the strategy, the inserted ruleset and the rule inside of it
    await expect(page.getByTestId('sec-rules').getByTestId('rule-card')).toHaveCount(3);
    await expectResult(page, strategy, ruleset, rulesetId);
  } finally {
    await page.request.put(DIRECTORY, { data: { path: original, move: false } });
  }
});

test('leaves the strategy unchanged and says what to do when the call of /api/v1/insert fails', async ({ page }, testInfo) => {
  const strategy = `Einfügen Fehler ${testInfo.project.name}`;
  const ruleset = `Prüfsatz ${testInfo.project.name}`;
  const original = await useOwnDirectory(page, testInfo.project.name);
  await storeRuleset(page, ruleset);
  try {
    await openApp(page);
    await strategyWithRule(page, strategy);
    await page.route('**/api/v1/insert', (route) =>
      route.fulfill({ status: 500, json: { detail: 'The request could not be processed.', code: 'request.failed', params: {} } }),
    );

    await showArea(page, 'library');
    await library(page, ruleset).click();

    const dialog = page.getByRole('alertdialog', { name: 'Der Eintrag konnte nicht eingefügt werden.' });
    await expect(dialog).toContainText('In der Strategie wurde nichts geändert. Versuchen Sie es noch einmal.');
    await dialog.getByRole('button', { name: 'OK' }).click();
    await showArea(page, 'props');
    await expect(page.getByTestId('sec-rules').getByTestId('rule-card')).toHaveCount(1);
    await clickMenu(page, 'save');
    await expectSaved(page);
    const stored = (await storedStrategy(page, strategy)) as unknown as Stored;
    expect(stored.rules.map((rule) => rule.name)).toEqual(['Mindestvolumen']);
  } finally {
    await page.request.put(DIRECTORY, { data: { path: original, move: false } });
  }
});
