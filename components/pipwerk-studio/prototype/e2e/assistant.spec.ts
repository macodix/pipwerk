import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIZES, openApp } from './support';

// Auftrag 04: Elementbibliothek nach "Neue Strategie" (Punkt 1) und Name "Assistent" (Punkt 2, req-ui-016).

type Size = { name: string; width: number; height: number };

async function newStrategy(page: Page, size: Size): Promise<void> {
  if (size.width >= 1280) await page.getByTestId('menu-new').click();
  else {
    await page.getByTestId('menu-toggle').click();
    await page.getByTestId('cmenu-new').click();
  }
  await expect(page.getByTestId('wizard')).toBeVisible();
}

/** Every way to the element library that exists in this size; wide windows show it all the time. */
function waysToLibrary(page: Page, size: Size): { name: string; run: () => Promise<void> }[] {
  const narrow = size.width < 700;
  const mid = size.width >= 700 && size.width < 1100;
  if (narrow) {
    return [
      { name: 'tab bar', run: () => page.getByTestId('bar-library').click() },
      { name: 'button in the assistant', run: () => page.getByTestId('wz-library').click() },
    ];
  }
  if (mid) {
    return [
      { name: 'tab', run: () => page.locator('[data-testid="tab-library"]:visible').click() },
      { name: 'button in the assistant', run: () => page.getByTestId('wz-library').click() },
    ];
  }
  return [{ name: 'always visible', run: async () => undefined }];
}

async function backToAssistant(page: Page, size: Size): Promise<void> {
  if (size.width < 700) await page.getByTestId('bar-props').click();
  else if (size.width < 1100) await page.locator('[data-testid="tab-props"]:visible').click();
}

async function nodeCount(page: Page): Promise<number> {
  return page.locator('[data-testid="node"]').count();
}

for (const size of SIZES) {
  test(`library while the assistant runs, ${size.width} x ${size.height} (${size.name})`, async ({ page }) => {
    const errors = await openApp(page, size);
    await newStrategy(page, size);
    for (const way of waysToLibrary(page, size)) {
      await way.run();
      await expect(page.getByTestId('library'), `library visible by ${way.name}`).toBeVisible();
      const item = page.locator('[data-testid="lib-item"][data-lib="trigger.candle_close"]');
      await expect(item).toBeVisible();
      const before = await nodeCount(page);
      await item.click();
      if (size.width < 700) await page.getByTestId('bar-canvas').click();
      await expect(page.locator('[data-testid="node"]'), `one click inserts an element (${way.name})`).toHaveCount(before + 1);
      await backToAssistant(page, size);
      await expect(page.getByTestId('wizard'), 'the assistant is still running').toBeVisible();
    }
    // later steps of the assistant: the library stays reachable
    await page.getByTestId('wz-next').click();
    await page.getByTestId('wz-next').click();
    for (const way of waysToLibrary(page, size)) {
      await way.run();
      await expect(page.getByTestId('library')).toBeVisible();
      await expect(page.locator('[data-testid="lib-item"]').first()).toBeVisible();
      await backToAssistant(page, size);
    }
    expect(errors).toEqual([]);
  });

  test(`library after leaving the assistant, ${size.width} x ${size.height} (${size.name})`, async ({ page }) => {
    const errors = await openApp(page, size);
    await newStrategy(page, size);
    await page.getByTestId('wz-leave').click();
    if (size.width < 700) await page.getByTestId('bar-canvas').click();
    await expect(page.getByTestId('canvas-empty')).toBeVisible();
    if (size.width < 1100) {
      await page.getByTestId('empty-library').click();
      await expect(page.getByTestId('library')).toBeVisible();
      await page.locator('[data-testid="lib-item"][data-lib="trigger.tick"]').click();
      if (size.width < 700) await page.getByTestId('bar-canvas').click();
    } else {
      await expect(page.getByTestId('empty-library')).toBeHidden();
      await page.locator('[data-testid="lib-item"][data-lib="trigger.tick"]').click();
    }
    await expect(page.locator('[data-testid="node"]')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

// ---- name "Assistent" ------------------------------------------------------------------------

const FORBIDDEN = /\b[Gg]ef(ü|ue)hrt|Aufbau|\b[Gg]uided/;

/** Visible text, labels for screen readers, tips and tool tips of the whole page. */
async function allText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const parts: string[] = [document.body.innerText];
    for (const el of Array.from(document.querySelectorAll('*'))) {
      for (const a of ['aria-label', 'title', 'data-tip', 'placeholder', 'alt']) {
        const v = el.getAttribute(a);
        if (v) parts.push(v);
      }
      if (el instanceof HTMLElement && el.hidden) parts.push(el.textContent ?? '');
    }
    return parts.join('\n');
  });
}

for (const lang of ['de', 'en'] as const) {
  test(`name "Assistent"/"Assistant" in every step, language ${lang}`, async ({ page }) => {
    const errors = await openApp(page);
    if (lang === 'en') {
      await page.getByTestId('menu-settings').click();
      await page.getByTestId('lang-en').click();
      await page.getByTestId('settings-apply').click();
    }
    const word = lang === 'de' ? 'Assistent' : 'Assistant';
    // before "New strategy": the empty properties view and the tip of the menu entry
    await page.getByTestId('menu-close').click();
    let text = await allText(page);
    expect(text.match(FORBIDDEN), 'closed strategy').toBeNull();
    await page.getByTestId('menu-new').hover();
    // the tip text of the menu entry
    expect(await page.getByTestId('menu-new').getAttribute('data-tip')).toMatch(new RegExp(word, 'i'));
    await page.getByTestId('menu-new').click();
    for (let step = 1; step <= 5; step++) {
      await expect(page.getByTestId(`wz-step-${step}`)).toBeVisible();
      text = await allText(page);
      expect(text.match(FORBIDDEN), `step ${step}: ${text.match(FORBIDDEN)?.[0]}`).toBeNull();
      expect(text.toLowerCase()).toContain(word.toLowerCase());
      if (step === 3) {
        await page.getByTestId('wz-add-EMA').click();
        await page.getByTestId('wz-add-EMA').click();
      }
      if (step === 4) {
        await page.getByTestId('wz-a').selectOption({ index: 1 });
        await page.getByTestId('wz-b').selectOption({ index: 2 });
      }
      if (step < 5) await page.getByTestId('wz-next').click();
    }
    await page.getByTestId('wz-next').click();
    await expect(page.getByTestId('toast')).toBeVisible();
    text = await allText(page);
    expect(text.match(FORBIDDEN), `after the last step: ${text.match(FORBIDDEN)?.[0]}`).toBeNull();
    // empty canvas after leaving the assistant
    await page.getByTestId('menu-new').click();
    await page.getByTestId('dirty-discard').click();
    await page.getByTestId('wz-leave').click();
    text = await allText(page);
    expect(text.match(FORBIDDEN), `empty canvas: ${text.match(FORBIDDEN)?.[0]}`).toBeNull();
    expect(errors).toEqual([]);
  });
}

test('source under src/: no text that calls the assistant guided setup', () => {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
  for (const f of readdirSync(dir).filter((n) => /\.(ts|tsx)$/.test(n))) {
    const code = readFileSync(join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
    // text in quotes only; identifiers such as "wizard" stay
    const strings = code.match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g) ?? [];
    for (const s of strings) expect(s.match(FORBIDDEN), `${f}: ${s}`).toBeNull();
  }
});
