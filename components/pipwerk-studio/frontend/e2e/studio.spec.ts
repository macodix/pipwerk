import { expect, test } from '@playwright/test';

test('starts with an empty canvas, reaches the backend and switches the language', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  const healthResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/health') && response.status() === 200,
  );

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Pipwerk Studio' })).toBeVisible();
  const canvas = page.getByRole('region', { name: 'Designer-Arbeitsfläche' });
  await expect(canvas).toBeVisible();
  await expect(canvas.locator('.react-flow__pane')).toBeVisible();
  await expect(canvas.locator('.react-flow__node')).toHaveCount(0);
  await expect(canvas.locator('.react-flow__edge')).toHaveCount(0);

  await healthResponse;
  await expect(page.getByRole('status')).toHaveText('Backend: verbunden');

  await page.getByLabel('Sprache').selectOption('en');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('region', { name: 'Designer canvas' })).toBeVisible();
  await expect(page.getByText('The canvas is empty.')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Backend: connected');

  await page.getByLabel('Language').selectOption('de');

  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByRole('region', { name: 'Designer-Arbeitsfläche' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Backend: verbunden');

  expect(errors).toEqual([]);
});
