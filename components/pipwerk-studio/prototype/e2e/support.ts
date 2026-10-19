import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const BUILT = pathToFileURL(join(here, '..', 'dist', 'pipwerk-studio-prototyp.html')).href;

export const SIZES = [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'tablet-portrait', width: 820, height: 1180 },
  { name: 'tablet-landscape', width: 1180, height: 820 },
  { name: 'notebook', width: 1366, height: 768 },
  { name: 'large', width: 1920, height: 1080 },
] as const;

/** Opens the built file with empty storage and collects console errors. */
export async function openApp(page: Page, size = { width: 1366, height: 768 }): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setViewportSize(size);
  await page.goto(BUILT);
  await page.evaluate(() => { try { window.localStorage.clear(); } catch { /* ignore */ } });
  await page.goto(BUILT);
  await expect(page.getByTestId('app')).toBeVisible();
  return errors;
}

export const node = (page: Page, name: string): Locator => page.locator(`[data-testid="node"][data-node-name="${name}"]`);
export const card = (page: Page, name: string): Locator => page.locator(`[data-testid="card"][data-node-name="${name}"]`);
export const lib = (page: Page, key: string): Locator => page.locator(`[data-testid="lib-item"][data-lib="${key}"]`);

export async function addFromLibrary(page: Page, key: string): Promise<void> {
  await lib(page, key).click();
}

/** Selects an element by clicking its node on the canvas. */
export async function selectNode(page: Page, name: string): Promise<void> {
  const n = node(page, name).or(card(page, name)).first();
  await n.click({ position: { x: 40, y: 12 } });
}

export async function setName(page: Page, name: string): Promise<void> {
  await page.getByTestId('element-name').fill(name);
}
