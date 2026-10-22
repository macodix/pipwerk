import { test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clickNode, newStrategyFromScratch, reveal } from './builder';
import { SIZES, lib, node, openApp } from './support';

// Acceptance criterion 4: screenshots of the prototype. Run with: npm run screenshots
const here = dirname(fileURLToPath(import.meta.url));
const out = (name: string) => join(here, '..', 'screenshots', name);
const shot = async (page: Page, name: string, keepHover = false) => {
  if (!keepHover) {
    const vp = page.viewportSize() as { width: number; height: number };
    await page.mouse.move(1, vp.height - 1);
  }
  await page.waitForTimeout(450);
  await page.screenshot({ path: out(name) });
};

for (const size of SIZES) {
  test(`EMA-Trendfolge in ${size.width} x ${size.height}`, async ({ page }) => {
    await openApp(page, { width: size.width, height: size.height });
    await page.waitForTimeout(300);
    await shot(page, `ema-trendfolge-${size.width}x${size.height}.png`);
  });
}

test.describe('notebook 1366 x 768', () => {
  test('EMA-Trendfolge vertical and horizontal', async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    await page.waitForTimeout(300);
    await shot(page, 'ema-trendfolge-senkrecht-1366x768.png');
    await page.getByTestId('orient-h').click();
    await page.waitForTimeout(300);
    // the horizontal flow is wide: zoomed out twice, so that more of the strategy is in the picture
    await page.getByTestId('zoom-out').click();
    await page.getByTestId('zoom-out').click();
    await page.waitForTimeout(300);
    await shot(page, 'ema-trendfolge-waagerecht-1366x768.png');
    // and the whole strategy at once (small)
    await page.getByTestId('zoom-fit').click();
    await page.waitForTimeout(300);
    await shot(page, 'ema-trendfolge-waagerecht-gesamt-1366x768.png');
  });

  test('properties view of a use with a method and "Update"', async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    await clickNode(page, 'Richtung');
    const use = page.getByTestId('props-element').getByTestId('use-row').filter({ hasText: 'EMA20' });
    await use.getByTestId('use-member').selectOption({ label: 'Wert vor … Kerzen (Methode)' });
    await use.getByTestId('use-arg').fill('3');
    await use.locator('.use-refresh').click();
    await page.getByTestId('sec-inputs').scrollIntoViewIfNeeded();
    await page.getByTestId('sec-inputs').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot(page, 'verwendung-methode-aktualisieren-1366x768.png');
  });

  test('element library with the groups', async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    // overview: all eight groups with the number of their entries
    for (const head of await page.locator('[data-testid="lib-group"] .lib-group-head').all()) await head.click();
    await page.waitForTimeout(200);
    await shot(page, 'bibliothek-gruppen-1366x768.png');
    // the groups with their entries: market data, account and actions open
    for (const g of ['marketdata', 'account', 'actions']) await page.locator(`[data-testid="lib-group"][data-group="${g}"] .lib-group-head`).click();
    await page.getByTestId('library').locator('.lib-scroll').evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await shot(page, 'bibliothek-gruppen-offen-1366x768.png');
  });

  test('library with explanation on hover', async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    await lib(page, 'EMA').hover();
    await page.waitForTimeout(500);
    await shot(page, 'bibliothek-erklaerung-1366x768.png', true);
  });

  test('condition from blocks', async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    await clickNode(page, 'Kreuzen');
    await page.getByTestId('sec-ausdruck').scrollIntoViewIfNeeded();
    await page.getByTestId('expr-panel').first().scrollIntoViewIfNeeded();
    await shot(page, 'bedingung-bausteine-1366x768.png');
  });

  test('formula editor with suggestions and error', async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    await clickNode(page, 'StopLoss');
    await page.getByTestId('view-formula').click();
    const ta = page.getByTestId('formula-input');
    await ta.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('IF(Richtung.Ergebnis = "buy"; Kerze.Schluss - Strategie.[Stop-Abstand] * ATR14.Wert; Kerze.Schluss + ');
    await page.keyboard.type('Richtung.');
    await page.waitForTimeout(300);
    await page.getByTestId('formula-editor').scrollIntoViewIfNeeded();
    await shot(page, 'formeleditor-vorschlaege-1366x768.png');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+A');
    await page.keyboard.type('IF(Richtung.Ergebnis = "buy"; Kerze.Schluss - Strategie.[Stop-Abstand] * ATR14.Wert; Kerze.Schluss + Strategie.[Stop-Abstand] * ATR14.Wertt)');
    await page.waitForTimeout(300);
    await page.locator('.tk-error').first().hover();
    await page.waitForTimeout(500);
    await shot(page, 'formeleditor-fehler-1366x768.png', true);
  });

  test('guided setup', async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    await page.getByTestId('menu-new').click();
    await page.getByTestId('wz-name').fill('Meine erste Strategie');
    await page.getByTestId('wz-next').click();
    await page.getByTestId('wz-next').click();
    await page.getByTestId('wz-add-EMA').click();
    await page.getByTestId('wz-add-EMA').click();
    await page.getByTestId('wz-next').click();
    await page.getByTestId('wz-a').selectOption({ index: 1 });
    await page.getByTestId('wz-b').selectOption({ index: 2 });
    await shot(page, 'gefuehrter-aufbau-1366x768.png');
  });

  test('finding with hint how to fix it', async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    await lib(page, 'flow.condition').click();
    await page.getByTestId('element-name').fill('Trend prüfen');
    await page.getByTestId('menu-check').click();
    await page.waitForTimeout(300);
    const n = node(page, 'Trend prüfen');
    await reveal(page, n);
    await shot(page, 'befund-1366x768.png');
  });

  test('properties view of an inserted trend template with the proposed names (order 03)', async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    await newStrategyFromScratch(page, 'Namensvorschlag');
    await lib(page, 'trigger.candle_close').click();
    await lib(page, 'flow.condition').click();
    await page.locator('[data-testid="lib-item"][data-label="Trend H1"]').click();
    await page.waitForTimeout(300);
    await page.getByTestId('own-includes').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot(page, 'vorlage-einfuegen-namen-1366x768.png');
  });

  test('template view', async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    await page.locator('[data-testid="lib-item"][data-label="Schneller EMA 9"] [data-testid="lib-open-template"]').click();
    await shot(page, 'vorlage-1366x768.png');
  });

  test('settings', async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    await page.getByTestId('menu-settings').click();
    await shot(page, 'einstellungen-1366x768.png');
  });
});
