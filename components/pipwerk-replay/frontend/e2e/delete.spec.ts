import type { Page } from '@playwright/test';

import {
  beginProcess,
  endProcess,
  expect,
  openApp,
  seedStock,
  seriesOf,
  test,
} from './fixtures';

// Deleting from the data stock against the real backend (specification 5.5): a series, a period,
// the contract data, all data of a broker; each time the question comes first and nothing is
// deleted before it is confirmed. `seedStock` makes five rows: at `Test-Broker` EURUSD H1 (a
// gap, 9 candles), EURUSD ticks, EURUSD contract data, GBPUSD H4 (3 candles); at `Zweiter-Broker`
// USDJPY D1 and GBPUSD contract data.

function row(page: Page, instrument: string, data: string, broker?: string) {
  const brokerPart = broker === undefined ? '' : `[data-broker="${broker}"]`;
  return page.locator(`[data-testid="stock-row"][data-instrument="${instrument}"][data-data="${data}"]${brokerPart}`);
}

async function question(page: Page): Promise<void> {
  await expect(page.getByTestId('delete-question')).toBeVisible();
  await expect(page.getByTestId('delete-irreversible')).toHaveText('Das Löschen lässt sich nicht rückgängig machen.');
}

test('deletes a whole series after the question and shows what was deleted; cancelling the question deletes nothing', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await expect(page.getByTestId('stock-row')).toHaveCount(5);
  await row(page, 'GBPUSD', 'h4').click();

  await page.getByTestId('delete-open').click();
  await expect(page.getByTestId('dialog-delete')).toBeVisible();
  await page.getByTestId('delete-next').click();
  await question(page);
  await expect(page.getByRole('heading', { name: 'Reihe löschen?' })).toBeVisible();
  await expect(page.getByTestId('delete-fact-broker')).toHaveText('Test-Broker');
  await expect(page.getByTestId('delete-fact-instrument')).toHaveText('GBPUSD');
  await expect(page.getByTestId('delete-fact-data')).toHaveText('Kerzen H4');
  await expect(page.getByTestId('delete-extent')).toHaveText('Gelöscht werden 3 Kerzen.');

  // Cancelling the question: nothing is deleted.
  await page.getByTestId('delete-cancel').click();
  await expect(page.getByTestId('dialog-delete')).toHaveCount(0);
  expect((await seriesOf(stack.backendUrl)).total).toBe(5);
  await expect(page.getByTestId('stock-row')).toHaveCount(5);
  await expect(page.getByTestId('delete-notice')).toHaveCount(0);

  // Again, and now confirmed.
  await page.getByTestId('delete-open').click();
  await page.getByTestId('delete-next').click();
  await question(page);
  await page.getByTestId('delete-confirm').click();

  await expect(page.getByTestId('dialog-delete')).toHaveCount(0);
  await expect(page.getByTestId('delete-notice')).toHaveText('Gelöscht: Kerzen H4 von GBPUSD bei Test-Broker.');
  await expect(page.getByTestId('stock-row')).toHaveCount(4);
  await expect(row(page, 'GBPUSD', 'h4')).toHaveCount(0);
  await expect(page.getByTestId('stock-detail')).toHaveCount(0);
  expect((await seriesOf(stack.backendUrl)).total).toBe(4);
});

test('deletes a period of a series: the candles in it, and the period is a gap afterwards', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await row(page, 'EURUSD', 'h1').click();
  await expect(page.getByTestId('gap-item')).toHaveCount(1);

  await page.getByTestId('delete-open').click();
  await page.getByTestId('delete-scope-period').click();
  await expect(page.getByTestId('delete-next')).toBeDisabled();
  await page.getByTestId('delete-start').fill('2026-01-05T09:00');
  await page.getByTestId('delete-end').fill('2026-01-05T11:00');
  await page.getByTestId('delete-next').click();

  await question(page);
  await expect(page.getByRole('heading', { name: 'Zeitraum löschen?' })).toBeVisible();
  await expect(page.getByTestId('delete-fact-period')).toHaveText('05.01.2026 09:00 – 05.01.2026 11:00');
  await expect(page.getByTestId('delete-extent')).toHaveText('Gelöscht werden 2 Kerzen.');
  expect((await seriesOf(stack.backendUrl, '&instrument=EURUSD&data=h1')).items[0]).toMatchObject({ gap_count: 1 });
  await page.getByTestId('delete-confirm').click();

  await expect(page.getByTestId('dialog-delete')).toHaveCount(0);
  await expect(page.getByTestId('delete-notice')).toContainText('von 05.01.2026 09:00 bis 05.01.2026 11:00 (UTC)');
  // The series stays with its details open, now with a second gap.
  await expect(row(page, 'EURUSD', 'h1')).toHaveAttribute('data-gaps', '2');
  await expect(page.getByTestId('gap-item')).toHaveCount(2);
  expect((await seriesOf(stack.backendUrl, '&instrument=EURUSD&data=h1')).items[0]).toMatchObject({ gap_count: 2 });
});

test('asks for a period without data and shows the reason', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await row(page, 'EURUSD', 'h1').click();
  await page.getByTestId('delete-open').click();
  await page.getByTestId('delete-scope-period').click();
  await page.getByTestId('delete-start').fill('2027-03-01T08:00');
  await page.getByTestId('delete-end').fill('2027-03-01T09:00');

  await page.getByTestId('delete-next').click();

  await expect(page.getByTestId('delete-ask-error')).toContainText('Die Reihe hat in diesem Zeitraum keine Daten.');
  await expect(page.getByTestId('delete-ask-error')).toContainText('Nächster Schritt');
  await expect(page.getByTestId('delete-confirm')).toHaveCount(0);
  expect((await seriesOf(stack.backendUrl)).total).toBe(5);
});

test('deletes the contract data of an instrument; the series stays and says that the contract data are missing', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await row(page, 'EURUSD', 'h1').click();
  await expect(page.getByTestId('contract-contractSize')).toBeVisible();

  await page.getByTestId('delete-contract-open').click();

  await question(page);
  await expect(page.getByRole('heading', { name: 'Kontraktdaten löschen?' })).toBeVisible();
  await expect(page.getByTestId('delete-extent')).toHaveText('Gelöscht werden die Kontraktdaten von EURUSD bei diesem Broker.');
  await page.getByTestId('delete-confirm').click();

  await expect(page.getByTestId('dialog-delete')).toHaveCount(0);
  await expect(page.getByTestId('delete-notice')).toHaveText('Gelöscht: Kontraktdaten von EURUSD bei Test-Broker.');
  await expect(page.getByTestId('contract-missing')).toContainText('Ein Testlauf mit diesem Instrument startet dann nicht.');
  await expect(page.getByTestId('delete-contract-open')).toHaveCount(0);
  // The row of contract data of EURUSD is gone, the series of EURUSD are not.
  await expect(row(page, 'EURUSD', 'ticks')).toHaveCount(1);
  expect((await seriesOf(stack.backendUrl, '&data=contract')).total).toBe(1);
});

test('deletes all data of the broker the table is filtered by; the broker for test runs is then not chosen and the display says so', async ({
  page,
  stack,
}) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  const select = page.getByTestId('select-test-broker');
  await select.selectOption('Zweiter-Broker');
  await expect(select).toHaveValue('Zweiter-Broker');
  await expect(page.getByTestId('test-broker-applies')).toHaveCount(0);

  // Without a filter on one broker there is no such button.
  await expect(page.getByTestId('delete-broker-open')).toHaveCount(0);
  await page.getByTestId('filter-broker').fill('Zweiter');
  await expect(page.getByTestId('stock-row')).toHaveCount(2);
  await page.getByTestId('delete-broker-open').click();

  await question(page);
  await expect(page.getByRole('heading', { name: 'Alle Daten dieses Brokers löschen?' })).toBeVisible();
  await expect(page.getByTestId('delete-extent')).toHaveText(
    'Es werden gelöscht: 1 Reihe mit 1 Kerze und 0 Ticks sowie die Kontraktdaten von 1 Instrument.',
  );
  await expect(page.getByTestId('delete-broker-goes')).toContainText('Zweiter-Broker keine Daten mehr');
  await expect(page.getByTestId('delete-test-broker')).toContainText('als „Broker für Testläufe“ gewählt');
  expect((await seriesOf(stack.backendUrl)).total).toBe(5);
  await page.getByTestId('delete-confirm').click();

  await expect(page.getByTestId('dialog-delete')).toHaveCount(0);
  await expect(page.getByTestId('delete-notice')).toHaveText(
    'Gelöscht: alle Daten von Zweiter-Broker. Es ist jetzt kein Broker für Testläufe gewählt.',
  );
  expect((await seriesOf(stack.backendUrl)).total).toBe(3);
  // No broker is chosen; the display says so and names the broker that applies.
  await expect(select).toHaveValue('');
  await expect(select.locator('option')).toHaveText(['– keiner gewählt –', 'Test-Broker']);
  await expect(page.getByTestId('test-broker-applies')).toContainText('Test-Broker');
  expect(await (await fetch(`${stack.backendUrl}/api/replay/settings/test-run-broker`)).json()).toEqual({
    broker: 'Test-Broker',
    chosen: false,
  });
  // The filter stays and no row matches it any more.
  await expect(page.getByTestId('stock-nomatch')).toBeVisible();
  await page.getByTestId('filter-broker').fill('');
  await expect(page.getByTestId('stock-row')).toHaveCount(3);
});

test('refuses to delete while an import process exists, with the reason, and deletes after it has ended', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  const process = await beginProcess(stack.backendUrl);
  await openApp(page);
  await row(page, 'GBPUSD', 'h4').click();
  await page.getByTestId('delete-open').click();

  await page.getByTestId('delete-next').click();

  const error = page.getByTestId('delete-ask-error');
  await expect(error).toContainText('Es besteht ein Import-Vorgang. Solange er besteht, lässt sich nichts löschen.');
  await expect(error).toContainText('Nächster Schritt');
  await expect(page.getByTestId('delete-confirm')).toHaveCount(0);
  expect((await seriesOf(stack.backendUrl)).total).toBe(5);

  await page.getByTestId('delete-cancel').click();
  await endProcess(stack.backendUrl, process, 'abort');
  await page.getByTestId('delete-open').click();
  await page.getByTestId('delete-next').click();
  await question(page);
  await page.getByTestId('delete-confirm').click();
  await expect(page.getByTestId('delete-notice')).toBeVisible();
  expect((await seriesOf(stack.backendUrl)).total).toBe(4);
});

test('refuses the deletion itself when an import process begins after the question', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await row(page, 'GBPUSD', 'h4').click();
  await page.getByTestId('delete-open').click();
  await page.getByTestId('delete-next').click();
  await question(page);
  const process = await beginProcess(stack.backendUrl);

  await page.getByTestId('delete-confirm').click();

  await expect(page.getByTestId('delete-error')).toContainText('Es besteht ein Import-Vorgang.');
  await expect(page.getByTestId('dialog-delete')).toBeVisible();
  expect((await seriesOf(stack.backendUrl)).total).toBe(5);
  await endProcess(stack.backendUrl, process, 'finish');
  await page.getByTestId('delete-confirm').click();
  await expect(page.getByTestId('dialog-delete')).toHaveCount(0);
  expect((await seriesOf(stack.backendUrl)).total).toBe(4);
});

test('shows the reason when the series has been deleted already, for example in another window', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await row(page, 'GBPUSD', 'h4').click();
  const gone = await fetch(`${stack.backendUrl}/api/v1/market-data/deletions/series`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ broker: 'Test-Broker', instrument: 'GBPUSD', data: 'h4', confirm: true }),
  });
  expect(gone.status).toBe(200);
  await page.getByTestId('delete-open').click();

  await page.getByTestId('delete-next').click();

  await expect(page.getByTestId('delete-ask-error')).toContainText('Dieses Instrument gibt es bei diesem Broker nicht (mehr).');
});

test('shows the deletion in English', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await page.getByTestId('lang-en').click();
  await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Data stock');
  await row(page, 'GBPUSD', 'h4').click();

  await page.getByTestId('delete-open').click();
  await page.getByTestId('delete-next').click();

  await expect(page.getByTestId('delete-extent')).toHaveText('3 candles will be deleted.');
  await expect(page.getByTestId('delete-irreversible')).toHaveText('Deleting cannot be undone.');
  await page.getByTestId('delete-confirm').click();
  await expect(page.getByTestId('delete-notice')).toHaveText('Deleted: Candles H4 of GBPUSD at Test-Broker.');
});
