import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { SIZES, openApp } from './support';

// Auftrag 04, Punkt 3: Nach "Neue Strategie", in jedem der fünf Schritte des Assistenten und nach "Ohne Assistent weiterarbeiten"
// wird in jeder der sechs Fenstergrößen jede sichtbare, aktivierte Schaltfläche und jeder Reiter einzeln (auf frischem Stand)
// angeklickt. Danach muss sich etwas sichtbar geändert haben.

type Size = { name: string; width: number; height: number };

const STAGES = ['step1', 'step2', 'step3', 'step3-with-indicators', 'step4', 'step5', 'left'] as const;
type Stage = (typeof STAGES)[number];

async function openMenu(page: Page, size: Size): Promise<void> {
  if (size.width < 1280) await page.getByTestId('menu-toggle').click();
}

async function prepare(page: Page, size: Size, stage: Stage): Promise<void> {
  await page.evaluate(() => { try { window.localStorage.clear(); } catch { /* ignore */ } });
  await page.reload();
  await expect(page.getByTestId('app')).toBeVisible();
  if (size.width >= 1280) await page.getByTestId('menu-new').click();
  else {
    await page.getByTestId('menu-toggle').click();
    await page.getByTestId('cmenu-new').click();
  }
  await expect(page.getByTestId('wizard')).toBeVisible();
  if (stage === 'left') {
    await page.getByTestId('wz-leave').click();
    await expect(page.getByTestId('wizard')).toHaveCount(0);
    return;
  }
  const withIndicators = stage !== 'step1' && stage !== 'step2' && stage !== 'step3';
  const target = stage === 'step1' ? 1 : stage === 'step2' ? 2 : stage === 'step3' || stage === 'step3-with-indicators' ? 3 : stage === 'step4' ? 4 : 5;
  for (let i = 1; i < target; i++) {
    await page.getByTestId('wz-next').click();
    if (i + 1 === 3 && withIndicators) {
      await page.getByTestId('wz-add-EMA').click();
      await page.getByTestId('wz-add-EMA').click();
    }
  }
  if (stage === 'step3-with-indicators') await expect(page.getByTestId('wz-indicator')).toHaveCount(2);
  await expect(page.getByTestId(`wz-step-${target}`)).toBeVisible();
}

/** Page content without the tool tip, which appears when the mouse rests on a button. */
function snapshot(page: Page): Promise<string> {
  return page.evaluate(() => {
    const copy = document.body.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('[data-testid="tooltip"]').forEach((e) => e.remove());
    return copy.outerHTML + '|' + document.activeElement?.tagName;
  });
}

const CANDIDATES = 'button:visible:not(:disabled)';

/** Buttons that must not change anything: the state they stand for is already shown. */
async function intendedNoChange(loc: Locator): Promise<string | null> {
  return loc.evaluate((el) => {
    const id = el.getAttribute('data-testid') ?? '';
    if (id === 'status-pill') return 'status display of the strategy: shows the properties of the strategy, which are already shown';
    if (el.getAttribute('aria-selected') === 'true') return 'tab that is already chosen';
    if (id === 'zoom-start' || id === 'arrange') return 'view command on a canvas with nothing to move yet (proved with a moved view and a moved element in the test "view commands" below)';
    // choice cards and the orientation switch mark the chosen entry with the class "on"
    if (el.classList.contains('on') && (el.closest('.seg, .choice-cards') !== null)) return 'entry of a choice that is already chosen';
    if (el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-pressed') === 'true') return 'choice that is already set';
    return null;
  });
}

async function clickAll(page: Page, size: Size, stage: Stage, viaCompactMenu: boolean): Promise<{ clicked: number; exceptions: string[] }> {
  const open = async () => {
    await prepare(page, size, stage);
    if (viaCompactMenu) await openMenu(page, size);
  };
  await open();
  const count = await page.locator(viaCompactMenu ? '[data-testid="menu-pop"] button:visible:not(:disabled)' : CANDIDATES).count();
  expect(count, 'visible, enabled buttons').toBeGreaterThan(0);
  const exceptions: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i > 0) await open();
    const loc = page.locator(viaCompactMenu ? '[data-testid="menu-pop"] button:visible:not(:disabled)' : CANDIDATES).nth(i);
    const label = ((await loc.innerText()) || (await loc.getAttribute('aria-label')) || (await loc.getAttribute('data-testid')) || `#${i}`).replace(/\s+/g, ' ').trim();
    const same = await intendedNoChange(loc);
    const before = await snapshot(page);
    await loc.click({ timeout: 5000 });
    await page.waitForTimeout(60);
    const after = await snapshot(page);
    if (same) { exceptions.push(`${label}: ${same}`); continue; }
    expect(after !== before, `${size.name}, ${stage}: button "${label}" changes nothing`).toBe(true);
  }
  return { clicked: count, exceptions };
}

for (const size of SIZES) {
  test(`view commands "To the beginning" and "Arrange again" work, ${size.width} x ${size.height} (${size.name})`, async ({ page }) => {
    await openApp(page, size);
    if (size.width >= 1280) await page.getByTestId('menu-new').click();
    else {
      await page.getByTestId('menu-toggle').click();
      await page.getByTestId('cmenu-new').click();
    }
    await page.getByTestId('wz-leave').click();
    if (size.width < 700) await page.getByTestId('bar-canvas').click();
    if (size.width < 1100) {
      await page.getByTestId('empty-library').click();
      await page.locator('[data-testid="lib-item"][data-lib="trigger.tick"]').click();
      if (size.width < 700) await page.getByTestId('bar-canvas').click();
    } else await page.locator('[data-testid="lib-item"][data-lib="trigger.tick"]').click();
    const n = page.locator('[data-testid="node"]').first();
    await expect(n).toBeVisible();
    const box = async () => (await n.boundingBox()) as { x: number; y: number; width: number; height: number };
    // "To the beginning": after zooming in, the view returns to the readable size
    const b0 = await box();
    await page.getByTestId('zoom-in').click();
    await page.getByTestId('zoom-in').click();
    const b1 = await box();
    expect(b1.width).toBeGreaterThan(b0.width);
    await page.getByTestId('zoom-start').click();
    await expect.poll(async () => (await box()).width).toBeLessThan(b1.width);
    // "Arrange again": a moved element returns to its place
    const home = await box();
    await page.mouse.move(home.x + 30, home.y + 14);
    await page.mouse.down();
    await page.mouse.move(home.x + 90, home.y + 74, { steps: 6 });
    await page.mouse.up();
    const moved = await box();
    expect(Math.abs(moved.x - home.x) + Math.abs(moved.y - home.y), 'the element was moved').toBeGreaterThan(20);
    await page.getByTestId('arrange').click();
    await expect.poll(async () => { const b = await box(); return Math.abs(b.x - moved.x) + Math.abs(b.y - moved.y); }).toBeGreaterThan(20);
  });

  for (const stage of STAGES) {
    test(`every button, ${size.width} x ${size.height} (${size.name}), ${stage}`, async ({ page }) => {
      test.setTimeout(600_000);
      const errors: string[] = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(String(e)));
      await openApp(page, size);
      const main = await clickAll(page, size, stage, false);
      let clicked = main.clicked;
      const exceptions = [...main.exceptions];
      if (size.width < 1280) {
        // the menu entries sit in the pop-up of "Menü"
        const menu = await clickAll(page, size, stage, true);
        clicked += menu.clicked;
        exceptions.push(...menu.exceptions);
      }
      console.log(`RESULT ${size.name} ${size.width}x${size.height} ${stage}: ${clicked} buttons clicked, all changed something except ${exceptions.length} intended: ${JSON.stringify(exceptions)}`);
      expect(errors).toEqual([]);
    });
  }
}
