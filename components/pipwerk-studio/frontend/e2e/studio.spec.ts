import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, type Locator, type Page, test } from '@playwright/test';

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

  await expect(page).toHaveTitle('pipwerk Studio');
  await expect(page.getByRole('heading', { level: 1, name: 'pipwerk Studio' })).toBeVisible();
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

// ---------------------------------------------------------------------------
// Dialog "Über pipwerk Studio" (req-ui-010)
// ---------------------------------------------------------------------------

const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The license text is the file LICENSE in the root directory of the repository.
const licenseText = readFileSync(resolve(frontendDirectory, '../../../LICENSE'), 'utf-8');

// The address of the repository stands only in package.json.
const repositoryUrl = (
  JSON.parse(readFileSync(resolve(frontendDirectory, 'package.json'), 'utf-8')) as {
    repository: { url: string };
  }
).repository.url;

function openButton(page: Page, name = 'Über pipwerk Studio'): Locator {
  return page.getByRole('button', { name, exact: true });
}

function revisionValue(dialog: Locator, label: string): Locator {
  return dialog.getByText(label, { exact: true }).locator('xpath=following-sibling::dd[1]');
}

async function waitForLoadedPage(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('contentinfo').getByRole('status')).toHaveText('Backend: verbunden');
  // The language select is enabled when the stored language has been read.
  await expect(page.getByLabel('Sprache')).toBeEnabled();
}

test('opens the About dialog with the mouse and shows its content in German and English', async ({
  page,
}) => {
  await waitForLoadedPage(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await openButton(page).click();

  const german = page.getByRole('dialog', { name: 'Über pipwerk Studio' });
  await expect(german).toBeVisible();
  await expect(german.getByRole('heading', { level: 2, name: 'Über pipwerk Studio' })).toBeVisible();
  await expect(german.getByText('pipwerk Studio', { exact: true })).toBeVisible();
  await expect(german.getByText('Stand', { exact: true })).toBeVisible();
  await expect(german.getByText('Lizenz', { exact: true })).toBeVisible();
  await expect(german.getByText('Repository', { exact: true })).toBeVisible();
  await expect(german.getByText('GNU General Public License, Version 3')).toBeVisible();
  // The license text is the original, character by character like LICENSE.
  const text = german.locator('pre');
  await expect(text).toHaveAttribute('lang', 'en');
  expect(await text.evaluate((element) => element.textContent)).toBe(licenseText);
  await expect(german.getByRole('link', { name: repositoryUrl })).toBeVisible();
  await expect(german.getByRole('button', { name: 'Schließen' })).toBeFocused();

  await german.getByRole('button', { name: 'Schließen' }).click();
  await page.getByLabel('Sprache').selectOption('en');
  await expect(openButton(page, 'About pipwerk Studio')).toBeVisible();
  await openButton(page, 'About pipwerk Studio').click();

  const english = page.getByRole('dialog', { name: 'About pipwerk Studio' });
  await expect(english).toBeVisible();
  await expect(english.getByRole('heading', { level: 2, name: 'About pipwerk Studio' })).toBeVisible();
  await expect(english.getByText('pipwerk Studio', { exact: true })).toBeVisible();
  await expect(english.getByText('Revision', { exact: true })).toBeVisible();
  await expect(english.getByText('License', { exact: true })).toBeVisible();
  await expect(english.getByText('Repository', { exact: true })).toBeVisible();
  await expect(english.getByText('GNU General Public License, Version 3')).toBeVisible();
  expect(await english.locator('pre').evaluate((element) => element.textContent)).toBe(licenseText);
  await expect(english.getByRole('button', { name: 'Close' })).toBeFocused();
});

test('opens the About dialog with the keyboard', async ({ page }) => {
  await waitForLoadedPage(page);

  // Tab order of the header: language select, then the button.
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Sprache')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(openButton(page)).toBeFocused();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Über pipwerk Studio' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Schließen' })).toBeFocused();
});

test('shows the commit and its date in the dialog as built, in the time zone of the browser', async ({
  page,
}) => {
  const expected = expectedCommit();
  await waitForLoadedPage(page);

  await openButton(page).click();
  let dialog = page.getByRole('dialog');
  if (expected === null) {
    await expect(revisionValue(dialog, 'Stand')).toHaveText('unbekannt');
  } else {
    const { commit, local } = expected;
    await expect(revisionValue(dialog, 'Stand')).toHaveText(
      `${commit} vom ${local.day}.${local.month}.${local.year}, ${local.hour}:${local.minute} Uhr`,
    );
  }
  await dialog.getByRole('button', { name: 'Schließen' }).click();

  await page.getByLabel('Sprache').selectOption('en');
  await openButton(page, 'About pipwerk Studio').click();
  dialog = page.getByRole('dialog');
  if (expected === null) {
    await expect(revisionValue(dialog, 'Revision')).toHaveText('unknown');
  } else {
    const { commit, local } = expected;
    await expect(revisionValue(dialog, 'Revision')).toHaveText(
      `${commit} from ${local.year}-${local.month}-${local.day} ${local.hour}:${local.minute}`,
    );
  }
});

test('shows the same commit in the dialog and in the tooltip of the footer', async ({ page }) => {
  await waitForLoadedPage(page);
  const display = page.locator('.studio-revision');
  await expect(display).toContainText(/^Stand: /);

  const title = await display.getAttribute('title');
  await openButton(page).click();

  const value = revisionValue(page.getByRole('dialog'), 'Stand');
  if (title === null) {
    await expect(value).toHaveText('unbekannt');
    return;
  }
  const match = /^Commit ([0-9a-f]{40}) /.exec(title);
  expect(match).not.toBeNull();
  await expect(value).toHaveText(new RegExp(`^${match![1]} vom `));
});

test('makes no request to another address when it opens and while it is open', async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  const foreign: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== origin) {
      foreign.push(request.url());
    }
  });
  await waitForLoadedPage(page);

  await openButton(page).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  // Gives a late request the chance to appear.
  await page.waitForTimeout(500);

  expect(foreign).toEqual([]);
});

test('locks the rest of the page while the dialog is open', async ({ page }) => {
  await waitForLoadedPage(page);
  const select = page.getByLabel('Sprache');
  const button = openButton(page);
  await button.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Mouse: at the place of the select and the button there is something else.
  for (const target of [select, button]) {
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;
    const insideHeader = await page.evaluate(
      ([pointX, pointY]) =>
        document.elementFromPoint(pointX as number, pointY as number)?.closest('.studio-header') != null,
      [x, y],
    );
    expect(insideHeader).toBe(false);
    await page.mouse.click(x, y);
    await expect(target).not.toBeFocused();
    await expect(dialog).toBeVisible();
  }
  await expect(select).toHaveValue('de');

  // Tab key: the focus never reaches the select or the button.
  for (const key of ['Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    const position = await page.evaluate(() => {
      const active = document.activeElement;
      const modal = document.querySelector('dialog');
      return {
        inHeader: active?.closest('.studio-header') != null,
        inDialog: modal?.contains(active) === true,
        isDocument: active === document.body || active === document.documentElement,
      };
    });
    expect(position.inHeader).toBe(false);
    expect(position.inDialog || position.isDocument).toBe(true);
  }
  await expect(dialog).toBeVisible();
});

test('closes with Escape and with the button but not with a click beside the dialog', async ({
  page,
}) => {
  await waitForLoadedPage(page);
  const button = openButton(page);
  const dialog = page.getByRole('dialog');

  await button.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(button).toBeFocused();

  await button.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Schließen' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(button).toBeFocused();

  await button.click();
  await expect(dialog).toBeVisible();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  await page.mouse.click(3, 3);
  await page.mouse.click(viewport!.width - 3, viewport!.height - 3);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Schließen' })).toBeVisible();
});

test('opens the link to the repository in a new tab', async ({ page, context }) => {
  // The page itself is not loaded; the request is answered here.
  await context.route(`${repositoryUrl}**`, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>repository</title>' }),
  );
  await waitForLoadedPage(page);
  await openButton(page).click();
  const link = page.getByRole('dialog').getByRole('link', { name: repositoryUrl });
  await expect(link).toHaveAttribute('href', repositoryUrl);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');

  const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);

  await expect(popup).toHaveURL(repositoryUrl);
  await expect(page.getByRole('dialog')).toBeVisible();
});
