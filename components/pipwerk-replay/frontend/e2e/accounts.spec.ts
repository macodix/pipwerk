import { chooseView, expect, openApp, test } from './fixtures';

test.beforeEach(async ({ page }) => {
  await openApp(page);
  await chooseView(page, 'accounts');
});

test('shows the default test account with its values', async ({ page }) => {
  await expect(page.getByTestId('account-item')).toHaveCount(1);
  await expect(page.getByTestId('account-item')).toContainText('Standard-Testkonto');
  await expect(page.getByTestId('account-item')).toContainText('10.000 EUR · 1:30');
  await expect(page.getByTestId('account-item')).toContainText('mitgeliefert');
  await expect(page.getByTestId('account-name')).toHaveValue('Standard-Testkonto');
  await expect(page.getByTestId('account-capital')).toHaveValue('10000');
  await expect(page.getByTestId('account-currency')).toHaveValue('EUR');
  await expect(page.getByTestId('account-leverage')).toHaveValue('30');
  await expect(page.getByTestId('account-commission')).toHaveValue('0');
  await expect(page.getByTestId('account-spread-candle')).toHaveAttribute('aria-checked', 'true');
});

test('creates, changes, saves and deletes a test account', async ({ page }) => {
  await page.getByTestId('account-new').click();
  await expect(page.getByTestId('account-name')).toHaveValue('Neues Testkonto');
  await expect(page.getByTestId('account-delete')).toBeDisabled();

  await page.getByTestId('account-name').fill('Scalping');
  await page.getByTestId('account-capital').fill('2500');
  await page.getByTestId('account-currency').fill('usd');
  await page.getByTestId('account-leverage').fill('100');
  await page.getByTestId('account-commission').fill('3.5');
  await page.getByTestId('account-spread-fixed').click();
  await page.getByTestId('account-spread').fill('12');
  await page.getByTestId('account-save').click();

  await expect(page.getByTestId('account-saved')).toContainText('Testkonto „Scalping“ ist gespeichert.');
  await expect(page.getByTestId('account-item')).toHaveCount(2);
  const item = page.locator('[data-testid="account-item"][data-name="Scalping"]');
  await expect(item).toContainText('2.500 USD · 1:100');
  await expect(item).toHaveAttribute('aria-current', 'true');
  await expect(page.getByTestId('account-currency')).toHaveValue('USD');
  await expect(page.getByTestId('account-spread')).toHaveValue('12');

  // Change and save.
  await page.getByTestId('account-leverage').fill('50');
  await expect(page.getByTestId('account-dirty')).toBeVisible();
  await page.getByTestId('account-save').click();
  await expect(item).toContainText('1:50');
  await expect(page.getByTestId('account-dirty')).toHaveCount(0);

  // Another account and back: the saved values are shown.
  await page.getByTestId('account-item').first().click();
  await page.locator('[data-testid="account-item"][data-name="Scalping"]').click();
  await expect(page.getByTestId('account-capital')).toHaveValue('2500');
  await expect(page.getByTestId('account-leverage')).toHaveValue('50');
  await expect(page.getByTestId('account-spread-fixed')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('account-spread')).toHaveValue('12');

  // Delete after the question.
  await page.getByTestId('account-delete').click();
  const dialog = page.getByTestId('dialog-delete-account');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Das Testkonto „Scalping“ wird gelöscht.');
  await dialog.getByTestId('delete-cancel').click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('account-item')).toHaveCount(2);
  await page.getByTestId('account-delete').click();
  await dialog.getByTestId('delete-ok').click();
  await expect(page.getByTestId('account-item')).toHaveCount(1);
  await expect(page.locator('[data-testid="account-item"][data-name="Scalping"]')).toHaveCount(0);
});

test('keeps the test accounts after a restart of the backend', async ({ page, stack }) => {
  await page.getByTestId('account-new').click();
  await page.getByTestId('account-name').fill('Bleibt');
  await page.getByTestId('account-save').click();
  await expect(page.getByTestId('account-saved')).toBeVisible();

  await stack.restartBackend();
  await page.reload();
  await chooseView(page, 'accounts');

  await expect(page.getByTestId('account-item')).toHaveCount(2);
  await expect(page.locator('[data-testid="account-item"][data-name="Bleibt"]')).toHaveCount(1);
});

test('has the default test account again after it is deleted and the backend is restarted', async ({ page, stack }) => {
  await page.getByTestId('account-delete').click();
  await page.getByTestId('delete-ok').click();
  await expect(page.getByTestId('accounts-empty')).toContainText('Nächster Schritt: Legen Sie ein neues an.');
  await expect(page.getByTestId('account-item')).toHaveCount(0);

  await stack.restartBackend();
  await page.reload();
  await chooseView(page, 'accounts');

  await expect(page.getByTestId('account-item')).toHaveCount(1);
  await expect(page.getByTestId('account-item')).toContainText('Standard-Testkonto');
  await expect(page.getByTestId('account-item')).toContainText('10.000 EUR · 1:30');
  await expect(page.getByTestId('account-item')).toContainText('mitgeliefert');
});

test('keeps a changed default test account after a restart of the backend', async ({ page, stack }) => {
  await page.getByTestId('account-name').fill('Mein Standard');
  await page.getByTestId('account-leverage').fill('10');
  await page.getByTestId('account-save').click();
  await expect(page.getByTestId('account-saved')).toBeVisible();

  await stack.restartBackend();
  await page.reload();
  await chooseView(page, 'accounts');

  await expect(page.getByTestId('account-item')).toHaveCount(1);
  await expect(page.getByTestId('account-item')).toContainText('Mein Standard');
  await expect(page.getByTestId('account-item')).toContainText('1:10');
  await expect(page.getByTestId('account-item')).toContainText('mitgeliefert');
});

test('does not save invalid values and says why', async ({ page }) => {
  await page.getByTestId('account-leverage').fill('0');

  await expect(page.getByTestId('account-invalid')).toContainText('Der Hebel muss eine ganze Zahl von 1 bis 1000 sein.');
  await expect(page.getByTestId('account-save')).toBeDisabled();

  await page.getByTestId('account-leverage').fill('30');
  await expect(page.getByTestId('account-invalid')).toHaveCount(0);
  await expect(page.getByTestId('account-save')).toBeDisabled();
});

test('discards changes', async ({ page }) => {
  await page.getByTestId('account-name').fill('Anders');
  await expect(page.getByTestId('account-dirty')).toBeVisible();

  await page.getByTestId('account-revert').click();

  await expect(page.getByTestId('account-name')).toHaveValue('Standard-Testkonto');
  await expect(page.getByTestId('account-dirty')).toHaveCount(0);
});

test('sets the name of a test account as text and never as HTML', async ({ page }) => {
  const name = '<img src=x onerror="window.injected=1">';
  await page.getByTestId('account-new').click();
  await page.getByTestId('account-name').fill(name);
  await page.getByTestId('account-save').click();
  await expect(page.getByTestId('account-saved')).toBeVisible();

  await expect(page.getByTestId('account-list').locator('img')).toHaveCount(0);
  await expect(page.getByTestId('account-list')).toContainText(name);
  expect(await page.evaluate(() => (window as unknown as { injected?: number }).injected)).toBeUndefined();
});
