import { test, expect } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const verzeichnis = path.dirname(fileURLToPath(import.meta.url));
const seite = pathToFileURL(path.join(verzeichnis, 'uebersicht-prototyp.html')).href;
const bilder = path.join(verzeichnis, 'screenshots');

const groessen = [
  [390, 844],
  [844, 390],
  [820, 1180],
  [1180, 820],
  [1366, 768],
  [1920, 1080],
];

function seiteOeffnen(page) {
  const meldungen = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') meldungen.push(m.text());
  });
  page.on('pageerror', (e) => meldungen.push(String(e)));
  return meldungen;
}

function schneiden(a, b) {
  return a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 &&
         a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
}

test('Datei oeffnet sich ohne Fehler in der Konsole', async ({ page }) => {
  const meldungen = seiteOeffnen(page);
  await page.goto(seite);
  await expect(page.getByRole('heading', { name: 'Stand der Vorhaben' })).toBeVisible();
  expect(meldungen).toEqual([]);
});

for (const [b, h] of groessen) {
  test(`Fenster ${b} x ${h}`, async ({ page }, info) => {
    await page.setViewportSize({ width: b, height: h });
    const meldungen = seiteOeffnen(page);
    await page.goto(seite);

    // keine waagerechte Bildlaufleiste, kein Element ragt rechts hinaus
    const mass = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      zuBreit: [...document.querySelectorAll('body *')]
        .filter((e) => e.getBoundingClientRect().width > 0 &&
                       e.getBoundingClientRect().right > document.documentElement.clientWidth + 0.5 &&
                       !e.closest('thead'))
        .map((e) => e.tagName + '.' + e.className),
    }));
    expect(mass.scroll).toBeLessThanOrEqual(mass.client);
    expect(mass.zuBreit).toEqual([]);

    // nichts liegt uebereinander: Bloecke der obersten Ebene und Zeilen je Vorhaben
    const bloecke = await page.evaluate(() => {
      const r = (e) => { const x = e.getBoundingClientRect(); return { x: x.x, y: x.y, width: x.width, height: x.height }; };
      const oben = [...document.querySelectorAll('header, .wartet, article.vorhaben:not(details *), details.abgeschlossen > summary')].map(r);
      const zeilen = [...document.querySelectorAll('article.vorhaben')].map((a) =>
        [...a.querySelectorAll('.kopf, tbody tr, .einzel')].filter((e) => e.offsetParent !== null).map(r));
      const zellen = [...document.querySelectorAll('tbody tr')].filter((t) => t.offsetParent !== null).map((t) =>
        [...t.children].map(r));
      return { oben, zeilen, zellen };
    });
    const paare = (liste, name) => {
      for (let i = 0; i < liste.length; i++)
        for (let j = i + 1; j < liste.length; j++)
          expect(schneiden(liste[i], liste[j]), `${name} ${i}/${j} ueberlappen`).toBe(false);
    };
    paare(bloecke.oben, 'Block');
    bloecke.zeilen.forEach((z, i) => paare(z, `Zeile in Vorhaben ${i}`));
    // Zellen einer Zeile nebeneinander: nur auf breiten Fenstern, auf schmalen stehen sie untereinander
    bloecke.zellen.forEach((z, i) => paare(z, `Zelle in Zeile ${i}`));

    // Bereich "Wartet auf Sie" ohne Bildlauf sichtbar, vollstaendig
    const wartet = await page.locator('.wartet').boundingBox();
    expect(wartet.y).toBeGreaterThanOrEqual(0);
    expect(wartet.y + wartet.height).toBeLessThanOrEqual(h);
    await expect(page.locator('.wartet')).toBeInViewport({ ratio: 1 });

    // alle Beispieleintraege vorhanden
    await expect(page.locator('.wartet li')).toHaveCount(2);
    await expect(page.locator('article.vorhaben:not(details *)')).toHaveCount(5);

    expect(meldungen).toEqual([]);

    // Bildschirmbild der ganzen Seite (nur im Chromium-Lauf)
    if (info.project.name === 'chromium') {
      fs.mkdirSync(bilder, { recursive: true });
      await page.screenshot({ path: path.join(bilder, `uebersicht-${b}x${h}.png`), fullPage: true });
    }
  });
}

test('abgeschlossene Vorhaben klappen auf und zu', async ({ page }) => {
  await page.goto(seite);
  const details = page.locator('details.abgeschlossen');
  const titel = page.getByText('Über-Dialog');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(titel).toBeHidden();
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');
  await expect(titel).toBeVisible();
  await details.locator('summary').click();
  await expect(details).not.toHaveAttribute('open', '');
  await expect(titel).toBeHidden();
});

test('Seite enthaelt keine Links und keine Pfade', async ({ page }) => {
  await page.goto(seite);
  await expect(page.locator('a, link[href], script[src]')).toHaveCount(0);
  const text = await page.content();
  expect(text).not.toMatch(/\/srv\/|\/home\/|\/var\/|localhost|127\.0\.0\.1|:\d{4}\b/);
});

test('Hervorhebung nicht allein ueber Farbe', async ({ page }) => {
  await page.goto(seite);
  await expect(page.locator('tr.auftraggeber .marke')).toHaveText('Wartet auf Sie');
  await expect(page.locator('.einzel.auftraggeber .marke')).toHaveText('Wartet auf Sie');
  const rahmen = await page.locator('.wartet').evaluate((e) => getComputedStyle(e).borderTopWidth);
  expect(parseFloat(rahmen)).toBeGreaterThanOrEqual(2);
});
