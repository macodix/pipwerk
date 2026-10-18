import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type APIRequestContext, expect, type Locator, type Page, test } from '@playwright/test';

// Helpers shared by the browser tests of the Strategy Designer (`designer.spec.ts`,
// `testcases.spec.ts`, `workflows.spec.ts`): the documents of the test cases, the
// operations on the pages that every test needs, and the comparison of a stored
// document with a test case document.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

export type Binding = { kind: string; value?: unknown };

export type InstanceDocument = {
  name: string;
  object_type: string;
  origin: { object_type: string; template_id: string | null; template_title: string | null };
  parameter_values: Record<string, Binding>;
  [field: string]: unknown;
};

export type ElementDocument = {
  id: string;
  type: string;
  title: string;
  name: string | null;
  x: number;
  y: number;
  parameters: Record<string, Binding>;
  properties: Record<string, Binding>;
  rules: InstanceDocument[];
  management_of: string | null;
  instance: InstanceDocument | null;
  [field: string]: unknown;
};

export type StrategyDocument = {
  id: string;
  title: string;
  description: string;
  parameters: Record<string, unknown>[];
  rules: InstanceDocument[];
  elements: ElementDocument[];
  connections: { source: string; output: string; target: string }[];
  [field: string]: unknown;
};

/** A document of the directory `contracts/strategies/v1/testcases/`. */
export function testcase(name: string): StrategyDocument {
  return JSON.parse(
    readFileSync(resolve(root, `contracts/strategies/v1/testcases/${name}.strategy.json`), 'utf-8'),
  ) as StrategyDocument;
}

/** A document of the directory `contracts/strategies/v1/examples/`. */
export function example(name: string): StrategyDocument {
  return JSON.parse(
    readFileSync(resolve(root, `contracts/strategies/v1/examples/${name}.strategy.json`), 'utf-8'),
  ) as StrategyDocument;
}

/** The object directory of the run. */
export async function objectDirectory(page: Page): Promise<string> {
  const response = await page.request.get('/api/studio/settings/object-directory');
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { path: string }).path;
}

/** Sets the object directory back to `path` without moving files (internal endpoint of the Studio, not the Web API). */
export async function restoreObjectDirectory(request: APIRequestContext, path: string): Promise<void> {
  const restored = await request.put('/api/studio/settings/object-directory', { data: { path, move: false } });
  expect(restored.ok()).toBe(true);
}

/**
 * Registers what every test of a file needs: the language German before the test, and after
 * it the object directory of the run as it was (a test that changes it notes the directory
 * with an annotation of the type `object-directory`) and empty, so that the next browser
 * starts clean.
 */
export function useCleanRun(): void {
  test.beforeEach(async ({ request }) => {
    const response = await request.put('/api/studio/settings/language', { data: { language: 'de' } });
    expect(response.ok()).toBe(true);
  });

  test.afterEach(async ({ request }, testInfo) => {
    const directory = testInfo.annotations.find((annotation) => annotation.type === 'object-directory')?.description;
    if (directory !== undefined) {
      await restoreObjectDirectory(request, directory);
    }
    const list = (await (await request.get('/api/v1/strategies')).json()) as { items: { id: string }[] };
    for (const item of list.items) {
      await request.delete(`/api/v1/strategies/${item.id}`);
    }
  });
}

/** The page is loaded when the type descriptions are there, which enables "Neue Strategie". */
export async function loadedPage(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Neue Strategie' })).toBeEnabled();
}

/** The stored strategies, read through the Web API (only to check what the user interface stored). */
export async function storedStrategies(page: Page): Promise<StrategyDocument[]> {
  const list = (await (await page.request.get('/api/v1/strategies')).json()) as { items: { id: string }[] };
  const documents: StrategyDocument[] = [];
  for (const item of list.items) {
    documents.push((await (await page.request.get(`/api/v1/strategies/${item.id}`)).json()) as StrategyDocument);
  }
  return documents;
}

/** The property view on the right. */
export function panel(page: Page): Locator {
  return page.getByRole('complementary', { name: 'Eigenschaften' });
}

/** The entry of a group of the element library. */
export function libraryEntry(page: Page, group: string, name: string | RegExp): Locator {
  return page
    .getByRole('complementary', { name: 'Elementbibliothek' })
    .getByRole('listbox', { name: group, exact: true })
    .getByRole('option', { name });
}

/** The node of an element by its identifier. */
export function nodeById(page: Page, id: string): Locator {
  return page.locator(`.react-flow__node-element[data-id="${id}"]`);
}

/** The centre of a locator in the coordinates of the page. */
export async function center(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

/** Presses the mouse at one point, moves to another one and releases it there. */
export async function drag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 20 });
  // The last movement lies on the target and gets a moment to be taken in, so that the release
  // meets the connector (the browsers differ in how soon they report the element under the pointer).
  await page.mouse.move(to.x + 1, to.y);
  await page.waitForTimeout(100);
  await page.mouse.up();
}

/** Opens a stored strategy by the list of "Öffnen". */
export async function openStored(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'Öffnen' }).click();
  await page.getByRole('dialog', { name: 'Strategie öffnen' }).getByRole('button', { name: title }).click();
  await expect(page.locator('.react-flow__node-element').first()).toBeVisible();
  // The view is fitted to the strategy and the check after opening has run.
  await expect(page.getByText(/^Befunde: \d+$/)).toBeVisible();
}

/** A new strategy with a title (and a description), saved; it stays open. */
export async function createAndSave(page: Page, title: string, description = ''): Promise<void> {
  await page.getByRole('button', { name: 'Neue Strategie' }).click();
  await panel(page).getByLabel('Bezeichnung', { exact: true }).fill(title);
  if (description !== '') {
    await panel(page).getByLabel('Beschreibung', { exact: true }).fill(description);
  }
  await save(page);
}

/** Puts an entry of the element library onto the drawing area with the keyboard (Enter); returns the new element. */
export async function insert(page: Page, group: string, name: string | RegExp): Promise<string> {
  await libraryEntry(page, group, name).focus();
  await page.keyboard.press('Enter');
  const selected = page.locator('.react-flow__node-element.selected');
  await expect(selected).toHaveCount(1);
  return (await selected.getAttribute('data-id'))!;
}

/** Presses "Speichern" and waits for the end of the request. */
export async function save(page: Page): Promise<void> {
  const saved = page.waitForResponse(
    (response) =>
      ['POST', 'PUT'].includes(response.request().method()) && /\/api\/v1\/strategies(\/[^/]+)?$/.test(response.url()),
  );
  await page.getByRole('button', { name: 'Speichern' }).click();
  expect((await saved).ok()).toBe(true);
  await expect(page.getByText(/^Befunde: \d+$/)).toBeVisible();
}

/**
 * A document without what the comparison with a test case leaves out: the identifiers
 * (those of the strategy and of the elements; the references to elements become the
 * position of the element in the list), the position on the drawing area and times.
 * The identifier of a template stays: it is the one of the shipped template.
 */
export function withoutIdentifiersAndPositions(document: StrategyDocument): Record<string, unknown> {
  const index = new Map(document.elements.map((element, position) => [element.id, position]));
  const position = (id: string | null): number | null => (id === null ? null : (index.get(id) ?? -1));
  return {
    format: document.format,
    format_version: document.format_version,
    title: document.title,
    description: document.description,
    parameters: document.parameters,
    rules: document.rules,
    elements: document.elements.map((element) => {
      const { id: _id, x: _x, y: _y, management_of: owner, ...rest } = element;
      return { ...rest, management_of: position(owner) };
    }),
    connections: document.connections
      .map((connection) => ({
        source: position(connection.source),
        output: connection.output,
        target: position(connection.target),
      }))
      .sort(
        (a, b) =>
          (a.source ?? 0) - (b.source ?? 0) ||
          a.output.localeCompare(b.output) ||
          (a.target ?? 0) - (b.target ?? 0),
      ),
  };
}
