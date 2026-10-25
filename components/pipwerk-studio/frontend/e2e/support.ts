import { expect, test as base, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** The six window sizes of specification 5.1 (width x height in pixels). */
export const SIZES = [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'tablet-portrait', width: 820, height: 1180 },
  { name: 'tablet-landscape', width: 1180, height: 820 },
  { name: 'notebook', width: 1366, height: 768 },
  { name: 'large', width: 1920, height: 1080 },
] as const;

export function unknownTypeStrategy(): Record<string, unknown> {
  return JSON.parse(readFileSync(join(here, 'unknown-type.strategy.json'), 'utf-8')) as Record<string, unknown>;
}

type Fixtures = {
  /** The errors the page wrote to its console and the uncaught exceptions. */
  errors: string[];
};

export const test = base.extend<Fixtures>({
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => errors.push(String(error)));
    await use(errors);
  },
});

export { expect };

/** Opens the interface and waits until the type descriptions are loaded. */
export async function openApp(page: Page, size = { width: 1366, height: 768 }): Promise<void> {
  await page.setViewportSize(size);
  await page.goto('/');
  await expect(page.getByTestId('app')).toBeVisible();
  // in the narrow layouts the library is an area of its own: its entries exist but are not visible
  await expect(page.getByTestId('lib-item').first()).toBeAttached({ timeout: 15_000 });
}

/** Presses an entry of the menu: in the header at 1280 pixels and more, otherwise in the menu that opens. */
export async function clickMenu(page: Page, id: 'new' | 'open' | 'save' | 'check' | 'close' | 'delete' | 'settings'): Promise<void> {
  const full = page.getByTestId(`menu-${id}`);
  if (await full.isVisible()) {
    await full.click();
    return;
  }
  await page.getByTestId('menu-toggle').click();
  await page.getByTestId(`cmenu-${id}`).click();
}

/** "Neue Strategie" and leaving the guided setup: the user works by hand on the empty drawing area. */
export async function newStrategy(page: Page): Promise<void> {
  await clickMenu(page, 'new');
  await expect(page.getByTestId('status-pill')).toContainText('Neue Strategie');
  const leave = page.getByTestId('wz-leave');
  if (await leave.isVisible()) {
    await leave.click();
  }
}

/** Opens a stored strategy by name. */
export async function openStrategy(page: Page, name: string): Promise<void> {
  await clickMenu(page, 'open');
  await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
  await expect(page.getByTestId('status-pill')).toContainText(name);
  await expect(page.locator('[data-testid="node"], [data-testid="card"]').first()).toBeAttached();
  // the backend has told who uses which object: the cards lie beside their elements and the view is set for that
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-usage', 'report');
  await expect.poll(async () => viewOf(page)).not.toBe('');
}

/**
 * The state shown next to the name of the strategy, compared in full: "gespeichert" is not found in "ungespeichert" and
 * the name of the strategy does not count.
 */
const stateOf = (page: Page): Locator => page.getByTestId('status-pill').locator('.status-state');
export const expectSaved = async (page: Page): Promise<void> => expect(stateOf(page)).toHaveText('gespeichert');
export const expectUnsaved = async (page: Page): Promise<void> => expect(stateOf(page)).toHaveText('ungespeichert');

/** The node of a step or the card of an object by name. */
export const node = (page: Page, name: string): Locator => page.locator(`[data-testid="node"][data-node-name="${name}"]`);
export const card = (page: Page, name: string): Locator => page.locator(`[data-testid="card"][data-node-name="${name}"]`);

/** An entry of the element library by its name. */
export const library = (page: Page, name: string): Locator => page.locator(`[data-testid="lib-item"][data-label="${name}"]`);

/** Moves to a part of the interface in the narrow layouts: the library, the properties view or the drawing area. */
export async function showArea(page: Page, area: 'canvas' | 'library' | 'props'): Promise<void> {
  const width = page.viewportSize()?.width ?? 1366;
  if (width < 700) {
    await page.getByTestId(`bar-${area}`).click();
  } else if (width < 1100 && area !== 'canvas') {
    await page.locator(`[data-testid="tab-${area}"]:visible`).click();
  }
}

/** The view of the drawing area as `x,y,zoom`. */
export async function viewOf(page: Page): Promise<string> {
  return (await page.getByTestId('canvas').getAttribute('data-view')) ?? '';
}

export type Box = { x: number; y: number; width: number; height: number };

export async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error('The element has no box');
  }
  return box;
}

export function overlap(a: Box, b: Box): boolean {
  const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return ox > 1 && oy > 1;
}

/** Drags with the mouse from the middle of a locator (or a point of it) to a point of the page, in steps. */
export async function dragBy(page: Page, locator: Locator, dx: number, dy: number, from?: { x: number; y: number }): Promise<void> {
  const box = await boxOf(locator);
  const startX = box.x + (from?.x ?? box.width / 2);
  const startY = box.y + (from?.y ?? box.height / 2);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dx / 2, startY + dy / 2, { steps: 8 });
  await page.mouse.move(startX + dx, startY + dy, { steps: 8 });
  await page.mouse.up();
}
