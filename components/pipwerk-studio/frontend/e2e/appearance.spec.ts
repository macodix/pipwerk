import { choose, clickMenu, expect, library, offered, openApp, openStrategy, showArea, test } from './support';

// Order 07, B2: the delivered rule template is named and explained in the language of the interface. (The designed lists
// of choices are tested in `choices.spec.ts`.)

test('the delivered rule template appears in English in the library and in the rules of the strategy', async ({ page }) => {
  await openApp(page);
  await clickMenu(page, 'settings');
  await choose(page.getByRole('dialog').getByLabel('Sprache'), 'English');
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  try {
    // the library: name and explanation
    const entry = library(page, 'Risk per trade');
    await expect(entry).toHaveCount(1);
    await expect(library(page, 'Risiko je Trade')).toHaveCount(0);
    await expect(entry).toHaveAttribute('data-tip', /^Limits the loss up to the stop loss/);

    // the strategy: the card of the rule and the list that adds a rule
    await openStrategy(page, 'EMA-Trendfolge');
    await showArea(page, 'canvas');
    await page.getByTestId('status-pill').click();
    await showArea(page, 'props');
    const origin = page.getByTestId('rule-card').first().getByTestId('instance-origin');
    await expect(origin).toContainText('Risk per trade');
    await expect(origin).not.toContainText('Risiko je Trade');
    const options = await offered(page.getByTestId('rule-add-select').first());
    expect(options.some((text) => text.includes('Risk per trade'))).toBe(true);
    expect(options.some((text) => text.includes('Risiko je Trade'))).toBe(false);
  } finally {
    await clickMenu(page, 'settings');
    await choose(page.getByRole('dialog').getByLabel('Language'), 'Deutsch');
    await page.getByRole('dialog').getByRole('button', { name: 'Schließen' }).click();
    await expect(page.getByTestId('param-strip')).toContainText('Strategieparameter');
  }
});
