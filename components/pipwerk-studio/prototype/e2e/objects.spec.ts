import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { clickNode, newStrategyFromScratch, props, wire } from './builder';
import { card, lib, node, openApp } from './support';

// Technical acceptance criteria 3 and 4: instances lie at the element of their first use, labels of the data
// connections, methods, the switch "Update", the three new findings, the groups of the element library.

type Box = { x: number; y: number; width: number; height: number };
const box = async (loc: Locator): Promise<Box> => (await loc.first().boundingBox()) as Box;

const START = [
  { sample: 'auftraggeber', name: 'EMA-Trendfolge', cards: ['EMA20', 'EMA50', 'ATR14'] },
  { sample: 'str03', name: 'EMA-Trendfolge', cards: ['EMA 20', 'EMA 50', 'ATR 14'] },
  { sample: 'str01', name: 'Scalping Punkt 2 Ausbruch – einfache Strategie', cards: ['Markttechnik Signal', 'Markttechnik Handel'] },
] as const;

async function expectAtFirstUse(page: Page, dir: 'v' | 'h', names: readonly string[]): Promise<void> {
  const shown = await page.locator('[data-testid="card"]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.nodeName as string));
  expect([...shown].sort()).toEqual([...names].sort());
  for (const name of shown) {
    const w = page.locator(`[data-testid="wire"][data-src="${name}"][data-first="1"]`);
    await expect(w, `${name} is connected with the element of its first use`).toHaveCount(1);
    const dst = (await w.getAttribute('data-dst')) as string;
    const target = node(page, dst).or(card(page, dst)).first();
    const c = await box(card(page, name));
    const n = await box(target);
    if (dir === 'v') {
      // next to the element: left of it, level with it
      expect(c.x + c.width, `${name} lies left of ${dst}`).toBeLessThanOrEqual(n.x + 2);
      expect(c.y + c.height, `${name} is level with ${dst}`).toBeGreaterThan(n.y - 3 * n.height);
      expect(c.y, `${name} is level with ${dst}`).toBeLessThan(n.y + 4 * n.height);
    } else {
      // above or below the element, over it
      const above = c.y + c.height <= n.y + 2;
      const below = c.y >= n.y + n.height - 2;
      expect(above || below, `${name} lies above or below ${dst}`).toBe(true);
      expect(Math.abs(c.x + c.width / 2 - (n.x + n.width / 2)), `${name} is over ${dst}`).toBeLessThan(2.5 * n.width);
    }
  }
}

test.describe('instances at the element of their first use (req-ui-017, req-fach-055)', () => {
  for (const s of START) {
    test(`${s.sample}: vertical and horizontal, connected, no area for objects`, async ({ page }) => {
      const errors = await openApp(page, { width: 1920, height: 1080 });
      if (s.sample !== 'auftraggeber') {
        await page.getByTestId('menu-open').click();
        await page.locator(`[data-testid="open-row"][data-sample="${s.sample}"]`).click();
      }
      await expect(page.getByTestId('status-pill')).toContainText(s.name);
      await expect(page.getByTestId('lane')).toHaveCount(0);
      await expect(page.getByTestId('lane-empty')).toHaveCount(0);
      expect(await page.locator('body').innerText()).not.toContain('Objekte und ihre Werte');
      await expectAtFirstUse(page, 'v', s.cards);
      await page.getByTestId('orient-h').click();
      await expect(page.getByTestId('canvas')).toHaveAttribute('data-orient', 'h');
      await expectAtFirstUse(page, 'h', s.cards);
      await page.getByTestId('orient-v').click();
      await expectAtFirstUse(page, 'v', s.cards);
      expect(errors).toEqual([]);
    });
  }

  test('the strategy of the client has no finding "instance without connection": the first use results from its expressions', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('menu-check').click();
    await expect(page.getByTestId('findings-count')).toContainText(/keine Befunde/);
    await clickNode(page, 'EMA20');
    await expect(page.getByTestId('first-use-text')).toContainText('Kreuzen');
    await clickNode(page, 'ATR14');
    await expect(page.getByTestId('first-use-text')).toContainText('StopLoss');
  });

  test('an instance that is dropped on free space lies there with a hint until it is connected (req-ablauf-003)', async ({ page }) => {
    await openApp(page, { width: 1920, height: 1080 });
    await newStrategyFromScratch(page, 'Frei');
    await lib(page, 'trigger.candle_close').click();
    await lib(page, 'flow.condition').click();
    const viewport = page.getByTestId('viewport');
    const vb = await box(viewport);
    await lib(page, 'EMA').dragTo(viewport, { targetPosition: { x: Math.round(vb.width / 2) - 330, y: 120 } });
    const free = page.locator('[data-testid="card"]').first();
    await expect(free.getByTestId('card-free')).toContainText('Noch nicht verbunden');
    await expect(page.locator('[data-testid="wire"]')).toHaveCount(0);
    await page.getByTestId('menu-check').click();
    await expect(page.getByTestId('findings-box').filter({ hasText: 'Instanz ohne Verbindung zum Element ihrer ersten Verwendung' })).toBeVisible();
    // dropped onto a step: connected at once
    const step = node(page, 'Bedingung');
    await lib(page, 'ATR').dragTo(step, { targetPosition: { x: 70, y: 40 } });
    await expect(wire(page, 'ATR', 'Bedingung')).toHaveAttribute('data-first', '1');
    await expect(card(page, 'ATR').getByTestId('card-free')).toHaveCount(0);
    // the other one is connected by choosing the step in its properties
    await clickNode(page, 'EMA');
    await expect(page.getByTestId('first-use-none')).toBeVisible();
    await page.getByTestId('host-select').selectOption({ label: 'Bedingung' });
    await expect(page.getByTestId('first-use-text')).toContainText('Bedingung');
    await expect(card(page, 'EMA').getByTestId('card-free')).toHaveCount(0);
    await page.getByTestId('menu-check').click();
    await expect(page.getByTestId('findings-box').filter({ hasText: 'Instanz ohne Verbindung' })).toHaveCount(0);
  });

  test('a click in the library with an element selected connects the object with it; with an object selected, with the same element', async ({ page }) => {
    await openApp(page, { width: 1920, height: 1080 });
    await newStrategyFromScratch(page, 'Klick');
    await lib(page, 'trigger.candle_close').click();
    await lib(page, 'flow.condition').click();
    await lib(page, 'Kerze').click();
    await expect(wire(page, 'Kerze', 'Bedingung')).toHaveAttribute('data-first', '1');
    await expect(wire(page, 'Kerze', 'Bedingung')).toHaveAttribute('data-label', 'Schluss');
    await lib(page, 'Instrument').click();
    await expect(wire(page, 'Instrument', 'Bedingung')).toHaveAttribute('data-first', '1');
  });
});

test.describe('labels of the data connections, methods, update (req-ui-014, req-fach-055)', () => {
  test('a line names the property or the method with its arguments, and all values of one object that an element uses', async ({ page }) => {
    await openApp(page, { width: 1920, height: 1080 });
    await expect(wire(page, 'EMA20', 'Kreuzen')).toHaveAttribute('data-label', 'Wert');
    await clickNode(page, 'Richtung');
    // a method of the indicator, chosen in the list of the element
    const use = props(page).getByTestId('use-row').filter({ hasText: 'EMA20' });
    await use.getByTestId('use-member').selectOption({ label: 'Wert vor … Kerzen (Methode)' });
    await expect(use.getByTestId('use-arg')).toHaveValue('1');
    await expect(wire(page, 'EMA20', 'Richtung')).toHaveAttribute('data-label', 'Wert vor 1 Kerze');
    await use.getByTestId('use-arg').fill('3');
    await expect(wire(page, 'EMA20', 'Richtung')).toHaveAttribute('data-label', 'Wert vor 3 Kerzen');
    await expect(wire(page, 'EMA20', 'Richtung').locator('.wire-label text')).toHaveText('Wert vor 3 Kerzen');
    // the sentence and the formula follow
    await expect(page.getByTestId('expr-sentence')).toContainText('Wert vor 3 Kerzen von EMA20');
    await page.getByTestId('view-formula').click();
    await expect(page.getByTestId('formula-input')).toHaveValue(/\[EMA20\]\.\[Wert vor\]\(3\)|EMA20\.\[Wert vor\]\(3\)/);
    await page.getByTestId('view-blocks').click();
    // a second value of the same object: the label names both
    await props(page).getByTestId('input-add').selectOption({ label: 'EMA20 › Wert' });
    await expect(wire(page, 'EMA20', 'Richtung')).toHaveAttribute('data-label', 'Wert, Wert vor 3 Kerzen');
  });

  test('methods appear in the blocks, in the formula editor after "Object." and in the description of the type', async ({ page }) => {
    await openApp(page);
    await clickNode(page, 'Kreuzen');
    // blocks: the list offers the method, its argument is a number next to it
    const left = props(page).locator('[data-testid="cond-block"]').first();
    await left.getByTestId('cross-a').locator(':scope > .select select').selectOption({ label: 'EMA20 › Wert vor … Kerzen (Methode)' });
    await expect(left.getByTestId('cross-a-arg')).toHaveValue('1');
    await left.getByTestId('cross-a-arg').fill('2');
    await expect(page.getByTestId('expr-sentence')).toContainText('Wert vor 2 Kerzen von EMA20 kreuzt EMA50');
    // formula editor: suggestions after "EMA20." name the method as a method, next to the properties
    await page.getByTestId('view-formula').click();
    const ta = page.getByTestId('formula-input');
    await ta.fill('EMA20.');
    const sug = page.getByTestId('formula-suggestions');
    await expect(sug).toContainText('Wert vor … Kerzen');
    await expect(sug).toContainText('Methode');
    await expect(sug).toContainText('Wert');
    // a method call is accepted, without a mistake in the formula
    await ta.fill('EMA20.[Wert vor](2) > EMA50.Wert');
    await expect(page.getByTestId('formula-error')).toHaveCount(0);
    await ta.fill('EMA20.[Wert vor] > EMA50.Wert');
    await expect(page.getByTestId('formula-error')).toContainText('Methode');
    // description of the type: the method stands next to the properties, marked as a method
    await page.locator('[data-testid="lib-item"][data-lib="EMA"] [data-testid="lib-open-template"]').click();
    const rows = page.getByTestId('tpl-delivers').locator('.prop-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Wert');
    await expect(rows.nth(1)).toContainText('Wert vor … Kerzen');
    await expect(rows.nth(1)).toContainText('Methode');
    await expect(page.getByTestId('tpl-refresh')).toContainText('Aktualisieren');
  });

  test('the switch "Update" at a use, with an explanation on hover; the line shows it on the canvas', async ({ page }) => {
    await openApp(page, { width: 1920, height: 1080 });
    await clickNode(page, 'Richtung');
    const use = props(page).getByTestId('use-row').filter({ hasText: 'EMA20' });
    const sw = use.locator('.use-refresh');
    await expect(sw).toContainText('Aktualisieren');
    await sw.hover();
    await expect(page.getByTestId('tooltip')).toContainText('ermittelt seine Werte neu');
    await expect(wire(page, 'EMA20', 'Richtung')).toHaveAttribute('data-refresh', '0');
    await sw.click();
    await expect(use.getByTestId('use-refresh')).toBeChecked();
    const w = wire(page, 'EMA20', 'Richtung');
    await expect(w).toHaveAttribute('data-refresh', '1');
    await expect(w).toHaveClass(/refresh/);
    await expect(w).toHaveAttribute('data-label', '↻ Wert');
    // the other uses of the same value are not affected
    await expect(wire(page, 'EMA20', 'Kreuzen')).toHaveAttribute('data-refresh', '0');
    // switched off again
    await sw.click();
    await expect(w).toHaveAttribute('data-refresh', '0');
  });

  test('every delivered object type and the objects of the application provide "Update"; a template takes it from its type', async ({ page }) => {
    await openApp(page);
    await newStrategyFromScratch(page, 'Aktualisieren');
    await lib(page, 'trigger.candle_close').click();
    await lib(page, 'flow.condition').click();
    for (const key of ['EMA', 'ATR', 'ZigZag', 'Markttechnik', 'Konto', 'Instrument', 'Kerze', 'Tick']) {
      await clickNode(page, 'Bedingung');
      await lib(page, key).click();
      await clickNode(page, 'Bedingung');
      await expect(props(page).getByTestId('use-row').last().getByTestId('use-refresh'), `update at ${key}`).toHaveCount(1);
    }
    await page.locator('[data-testid="lib-item"][data-label="Schneller EMA 9"] [data-testid="lib-open-template"]').click();
    await expect(page.getByTestId('tpl-refresh-inherited')).toContainText('Aktualisieren');
  });
});

test.describe('the new findings of the simulated check (req-ablauf-007)', () => {
  test('a name that is used twice in the strategy is an error with the way to fix it and a jump to the place', async ({ page }) => {
    await openApp(page);
    await clickNode(page, 'EMA50');
    await page.getByTestId('element-name').fill('EMA20');
    await page.getByTestId('menu-check').click();
    await expect(page.getByTestId('findings-count')).toContainText(/Befund/);
    const f = props(page).getByTestId('finding').filter({ hasText: 'Name doppelt vergeben' });
    await expect(f).toHaveCount(1);
    await expect(f).toContainText('mehr als einmal');
    await expect(f).toContainText('So beheben Sie es');
    await page.getByTestId('status-pill').click();
    const g = page.getByTestId('findings-box').getByTestId('finding').filter({ hasText: 'Name doppelt vergeben' });
    await g.getByTestId('finding-goto').click();
    await expect(page.getByTestId('element-name')).toHaveValue('EMA20');
  });

  test('a use on a path that does not pass the place of the first use is an error with the way to fix it and a jump to the place', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('menu-check').click();
    await expect(page.getByTestId('findings-count')).toContainText(/keine Befunde/);
    // the first use is moved to a step that comes later: the crossing condition is reached without passing it
    await clickNode(page, 'EMA20');
    await page.getByTestId('host-select').selectOption({ label: 'StopLoss' });
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    const f = page.getByTestId('findings-box').getByTestId('finding').filter({ hasText: 'Verwendung auf einem Weg ohne die Stelle der ersten Verwendung' });
    await expect(f.first()).toBeVisible();
    await expect(f.first()).toContainText('nicht jeder Weg');
    await expect(f.first()).toContainText('So beheben Sie es');
    await f.first().getByTestId('finding-goto').click();
    await expect(props(page).getByTestId('findings-box')).toContainText('StopLoss');
    // the management uses the instances of the main flow: the order lies behind the first use, so that is fine
    await clickNode(page, 'EMA20');
    await page.getByTestId('host-select').selectOption({ label: 'Kreuzen' });
    await page.getByTestId('menu-check').click();
    await expect(page.getByTestId('findings-count')).toContainText(/keine Befunde/);
  });

  test('removing the element of the first use says which instances are not connected afterwards', async ({ page }) => {
    await openApp(page);
    await clickNode(page, 'ATR14');
    await clickNode(page, 'StopLoss');
    await page.getByTestId('remove-element').click();
    const dlg = page.getByTestId('dialog-remove-element');
    await expect(dlg.getByTestId('hosted-list')).toContainText('ATR14');
    await page.getByTestId('remove-confirm').click();
    // the instance is still used by the management: it lies there now
    await expect(card(page, 'ATR14')).toHaveCount(1);
    await clickNode(page, 'ATR14');
    await expect(page.getByTestId('first-use-text')).toContainText('Neuer Stop-Loss');
  });
});

test('"Connection" in the library connects the selected step with the step that is clicked next (req-ui-018)', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await newStrategyFromScratch(page, 'Verbindung');
  await lib(page, 'trigger.candle_close').click();
  // a calculation that nothing leads to: the strategy is selected, so the library connects nothing
  await page.getByTestId('status-pill').click();
  await lib(page, 'flow.calculation').click();
  await expect(page.locator('[data-testid="flow-edge"]')).toHaveCount(0);
  // without a selected step the tool says what to do first
  await page.getByTestId('status-pill').click();
  await lib(page, 'flow.connection').click();
  await expect(page.getByTestId('toast')).toContainText('Wählen Sie zuerst den Schritt');
  await expect(page.getByTestId('armed-banner')).toHaveCount(0);
  // with the trigger selected: the next click on a step ends the connection
  await clickNode(page, 'Kerzenschluss');
  await lib(page, 'flow.connection').click();
  await expect(page.getByTestId('armed-banner')).toBeVisible();
  await clickNode(page, 'Berechnung');
  await expect(page.getByTestId('armed-banner')).toHaveCount(0);
  await expect(page.locator('[data-testid="flow-edge"]')).toHaveCount(1);
});

test('rules stay in the properties view and are not shown on the canvas (req-ui-012)', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('[data-testid="node"][data-type="Regel"], [data-testid="node"][data-type="Regelwerk"]')).toHaveCount(0);
  await expect(page.getByTestId('sec-rules').locator('.rule-edit')).toHaveCount(1);
  await clickNode(page, 'Order aufgeben');
  await expect(page.getByTestId('sec-element-rules').locator('.rule-edit')).toHaveCount(1);
});
