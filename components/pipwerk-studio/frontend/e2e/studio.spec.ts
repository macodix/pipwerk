import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const packageDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../backend/src/pipwerk_studio',
);

function git(...args: string[]): string {
  return execFileSync('git', ['-C', packageDirectory, ...args], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

// The backend determines its revision from the Git working tree of its package.
// The expected value comes from the same working tree; without Git it is unknown.
function expectedShortRevision(): string | null {
  try {
    const hash = git('rev-parse', 'HEAD');
    return /^[0-9a-f]{40}$/.test(hash) ? hash.slice(0, 7) : null;
  } catch {
    return null;
  }
}

// The time zone of the test browser; the expected date is computed in it.
const TEST_TIME_ZONE = 'Asia/Kolkata';

// Full commit hash and committer date of the working tree, with the date
// rendered in TEST_TIME_ZONE independently of the production code (`Intl`
// instead of the date parts of the Studio user interface).
function expectedCommit(): { commit: string; local: Record<string, string> } | null {
  try {
    const commit = git('rev-parse', 'HEAD');
    const committedAt = git('log', '-1', '--no-show-signature', '--format=%cI', commit);
    if (!/^[0-9a-f]{40}$/.test(commit) || Number.isNaN(Date.parse(committedAt))) {
      return null;
    }
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: TEST_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(committedAt));
    const local = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return { commit, local };
  } catch {
    return null;
  }
}

test.use({ timezoneId: TEST_TIME_ZONE });

test.beforeEach(async ({ request }) => {
  const response = await request.put('/api/studio/settings/language', {
    data: { language: 'de' },
  });
  expect(response.ok()).toBe(true);
});

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

test('persists the Studio language across page reloads (req-ui-008)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Sprache')).toHaveValue('de');

  await page.getByLabel('Sprache').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  // Reload: the authoritative language must come back from the backend, not
  // from any browser-side storage.
  await page.reload();
  await expect(page.getByLabel('Language')).toHaveValue('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  // Switch back to German and verify it is restored after another reload,
  // without affecting anything else on the page.
  await page.getByLabel('Language').selectOption('de');
  await page.reload();
  await expect(page.getByLabel('Sprache')).toHaveValue('de');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('shows the revision in the footer next to the backend status and switches its label', async ({
  page,
}) => {
  const short = expectedShortRevision();
  const german = short === null ? 'Stand: unbekannt' : `Stand: ${short}`;
  const english = short === null ? 'Revision: unknown' : `Revision: ${short}`;

  await page.goto('/');

  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('status')).toHaveText('Backend: verbunden');
  await expect(footer.getByText(german, { exact: true })).toBeVisible();
  if (short !== null) {
    await expect(footer.locator('.studio-revision')).toHaveText(/^Stand: [0-9a-f]{7}$/);
  }
  // The revision is right of the backend status.
  const backendBox = await footer.getByRole('status').boundingBox();
  const revisionBox = await footer.getByText(german, { exact: true }).boundingBox();
  expect(backendBox).not.toBeNull();
  expect(revisionBox).not.toBeNull();
  expect(revisionBox!.x).toBeGreaterThan(backendBox!.x + backendBox!.width - 1);

  await page.getByLabel('Sprache').selectOption('en');

  await expect(footer.getByText(english, { exact: true })).toBeVisible();
  await expect(footer.getByText(german, { exact: true })).toHaveCount(0);

  await page.getByLabel('Language').selectOption('de');

  await expect(footer.getByText(german, { exact: true })).toBeVisible();
});

test('shows commit and commit date as tooltip and accessible description', async ({ page }) => {
  const expected = expectedCommit();
  await page.goto('/');

  const display = page.locator('.studio-revision');
  await expect(page.getByRole('contentinfo').getByRole('status')).toHaveText('Backend: verbunden');
  if (expected === null) {
    await expect(display).toContainText('Stand: unbekannt');
    await expect(display).not.toHaveAttribute('title', /.*/);
    await expect(display).not.toHaveAttribute('aria-describedby', /.*/);
    return;
  }
  const { commit, local } = expected;
  const german = `Commit ${commit} vom ${local.day}.${local.month}.${local.year}, ${local.hour}:${local.minute} Uhr`;
  const english = `Commit ${commit} from ${local.year}-${local.month}-${local.day} ${local.hour}:${local.minute}`;

  await expect(display).toHaveAttribute('title', german);
  await expect(display).toHaveAccessibleDescription(german);

  await page.getByLabel('Sprache').selectOption('en');

  await expect(display).toHaveAttribute('title', english);
  await expect(display).toHaveAccessibleDescription(english);

  await page.getByLabel('Language').selectOption('de');

  await expect(display).toHaveAttribute('title', german);
  await expect(display).toHaveAccessibleDescription(german);
});

test('shows no tooltip without a Git working tree', async ({ page }) => {
  test.skip(expectedShortRevision() !== null, 'The test workspace is a Git working tree.');
  await page.goto('/');

  const display = page.locator('.studio-revision');
  await expect(display).toContainText('Stand: unbekannt');
  await expect(display).not.toHaveAttribute('title', /.*/);
  await expect(display).not.toHaveAttribute('aria-describedby', /.*/);
});
