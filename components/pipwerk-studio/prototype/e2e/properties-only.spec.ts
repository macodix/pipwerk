import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { SIZES, openApp, selectNode } from './support';

// Auftrag 05: Hinweise, Assistent und kurze Meldungen stehen nur in der Eigenschaftenansicht (req-ui-016).

type Size = { name: string; width: number; height: number };

async function menu(page: Page, size: Size, id: string): Promise<void> {
  if (size.width >= 1280) await page.getByTestId(`menu-${id}`).click();
  else {
    await page.getByTestId('menu-toggle').click();
    await page.getByTestId(`cmenu-${id}`).click();
  }
}

async function setLang(page: Page, size: Size, lang: 'de' | 'en'): Promise<void> {
  if (lang === 'de') return;
  await menu(page, size, 'settings');
  await page.getByTestId('lang-en').click();
  await page.getByTestId('settings-apply').click();
}

/** The canvas shows no hint text and no button of a hint, also when it is hidden (text content, not visible text). */
async function canvasHasNoHint(page: Page, where: string): Promise<void> {
  const text = (await page.getByTestId('canvas').textContent()) ?? '';
  expect(text, `${where}: text on the canvas`).not.toMatch(/Keine Strategie|No strategy|Nächster Schritt|Next step|Assistent|Assistant|Strategie ist leer|strategy is empty|Elementbibliothek zeigen|Show element library/);
  await expect(page.getByTestId('canvas').locator('[data-testid^="empty-"], .empty-card, .hint-box'), `${where}: hint or button of a hint on the canvas`).toHaveCount(0);
}

/** How often the text occurs in the visible text of the page without the footer. */
async function occurrences(page: Page, text: string): Promise<number> {
  return page.evaluate((t) => {
    const count = (s: string) => s.split(t).length - 1;
    const footer = document.querySelector('[data-testid="footer"]') as HTMLElement | null;
    return count(document.body.innerText) - (footer ? count(footer.innerText) : 0);
  }, text);
}

for (const size of SIZES) {
  for (const lang of ['de', 'en'] as const) {
    test(`hints and assistant only in the properties view, ${size.width} x ${size.height} (${size.name}), ${lang}`, async ({ page }) => {
      const errors = await openApp(page, size);
      await setLang(page, size, lang);
      const none = lang === 'de' ? 'Keine Strategie geöffnet' : 'No strategy open';

      // without an open strategy
      await menu(page, size, 'close');
      await expect(page.getByTestId('props-none')).toBeVisible();
      await canvasHasNoHint(page, 'no strategy');
      expect(await occurrences(page, none), 'once, in the properties view').toBe(1);
      await expect(page.getByTestId('empty-new')).toBeVisible();

      // "New strategy": the assistant is visible without another click, in every step
      await page.getByTestId('empty-new').click();
      for (let step = 1; step <= 5; step++) {
        await expect(page.getByTestId(`wz-step-${step}`), `step ${step} visible`).toBeVisible();
        await expect(page.getByTestId('wizard')).toBeVisible();
        await canvasHasNoHint(page, `step ${step}`);
        expect(await occurrences(page, none), `step ${step}`).toBe(0);
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

      // after "Continue without assistant" on an empty strategy: the hint stands above the fields of the strategy
      await menu(page, size, 'new');
      await page.getByTestId('dirty-discard').click();
      await expect(page.getByTestId('wizard')).toBeVisible();
      await page.getByTestId('wz-leave').click();
      await expect(page.getByTestId('empty-hint')).toBeVisible();
      await expect(page.getByTestId('empty-wizard')).toBeVisible();
      await canvasHasNoHint(page, 'after leaving the assistant');
      expect(await occurrences(page, none)).toBe(0);
      const hint = await page.getByTestId('empty-hint').boundingBox();
      const name = await page.getByTestId('strategy-name').boundingBox();
      expect((hint as { y: number }).y, 'hint above the fields').toBeLessThan((name as { y: number }).y);
      if (size.width < 1100) {
        await expect(page.getByTestId('empty-library')).toBeVisible();
      } else {
        await expect(page.getByTestId('empty-library')).toBeHidden();
      }
      // "Start assistant" shows the assistant at once
      await page.getByTestId('empty-wizard').click();
      await expect(page.getByTestId('wz-step-1')).toBeVisible();
      await canvasHasNoHint(page, 'after "Start assistant"');
      expect(errors).toEqual([]);
    });
  }

  test(`selection while the assistant runs, ${size.width} x ${size.height} (${size.name})`, async ({ page }) => {
    const errors = await openApp(page, size);
    await menu(page, size, 'new');
    await page.getByTestId('wz-next').click(); // step 2: trigger
    await page.getByTestId('wz-next').click(); // step 3: the trigger now lies on the canvas
    await expect(page.getByTestId('wz-step-3')).toBeVisible();
    if (size.width < 700) await page.getByTestId('bar-canvas').click();
    await selectNode(page, 'Kerzenschluss');
    if (size.width < 700) await page.getByTestId('bar-props').click();
    await expect(page.getByTestId('props-element')).toBeVisible();
    await expect(page.getByTestId('wizard')).toBeHidden();
    await expect(page.getByTestId('wz-resume')).toContainText('Assistent, Schritt 3 von 5');
    const strip = await page.getByTestId('wz-resume').boundingBox();
    const field = await page.getByTestId('element-name').boundingBox();
    expect((strip as { y: number }).y, 'line above the fields').toBeLessThan((field as { y: number }).y);
    // back into the same step
    await page.getByTestId('wz-resume-btn').click();
    await expect(page.getByTestId('wz-step-3')).toBeVisible();
    await expect(page.getByTestId('wz-resume')).toHaveCount(0);
    // the strategy chosen: the same line, step 4 this time
    await page.getByTestId('wz-next').click();
    await expect(page.getByTestId('wz-step-4')).toBeVisible();
    await page.getByTestId('status-pill').click();
    await expect(page.getByTestId('props-strategy')).toBeVisible();
    await expect(page.getByTestId('wz-resume')).toContainText('Assistent, Schritt 4 von 5');
    await expect(page.getByTestId('empty-hint')).toHaveCount(0);
    await page.getByTestId('wz-resume-btn').click();
    await expect(page.getByTestId('wz-step-4')).toBeVisible();
    // end the assistant
    await page.getByTestId('wz-leave').click();
    await expect(page.getByTestId('wizard')).toHaveCount(0);
    await expect(page.getByTestId('wz-resume')).toHaveCount(0);
    // library and canvas stay usable while it runs, also with the line shown (library: see assistant.spec.ts)
    expect(errors).toEqual([]);
  });

  test(`short message in the properties view, mark when it is hidden, ${size.width} x ${size.height} (${size.name})`, async ({ page }) => {
    const errors = await openApp(page, size);
    const narrow = size.width < 700;
    const mid = size.width >= 700 && size.width < 1100;
    // hide the properties view where that is possible
    if (narrow) await expect(page.getByTestId('bar-canvas')).toBeVisible();
    if (mid) await page.locator('[data-testid="tab-library"]:visible').click();
    await menu(page, size, 'save');
    if (narrow || mid) {
      const tab = narrow ? page.getByTestId('bar-props') : page.locator('[data-testid="tab-props"]:visible');
      await expect(tab.getByTestId('props-mark'), 'mark on the tab of the properties view').toBeVisible();
      await expect(page.getByTestId('toast')).toBeHidden();
      // the mark stays until the message is gone, then it goes
      await expect(tab.getByTestId('props-mark')).toHaveCount(0, { timeout: 8000 });
      // look at the properties view once the message is there: it is shown at the top
      await menu(page, size, 'save');
      await tab.click();
      await expect(page.getByTestId('props').getByTestId('toast')).toBeVisible();
    } else {
      await expect(page.getByTestId('props').getByTestId('toast')).toBeVisible();
      // the properties view is shown, so no tab carries a mark
      await expect(page.locator('[data-testid="props-mark"]:visible')).toHaveCount(0);
    }
    await expect(page.getByTestId('toast')).toHaveCount(1);
    const t = await page.getByTestId('toast').boundingBox();
    const p = await page.getByTestId('props').boundingBox();
    expect((t as { y: number }).y - (p as { y: number }).y, 'at the top of the properties view').toBeLessThan(120);
    await expect(page.getByTestId('toast')).toHaveCount(0, { timeout: 8000 });
    expect(errors).toEqual([]);
  });
}
