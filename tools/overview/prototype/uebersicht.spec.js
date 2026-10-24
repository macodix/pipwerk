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

// Die drei Ebenen: Anker, Dateiname des Bildschirmbilds
const ebenen = [
  { name: 'ebene1-vorhaben', anker: '', kasten: 7 },
  { name: 'ebene2-phasen', anker: '#backtest', kasten: 6 },
  { name: 'ebene3-pakete', anker: '#backtest/4', kasten: 3 },
];

function konsole(page) {
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

async function paareOhneUeberlappung(page, selektor, name) {
  const rechtecke = await page.evaluate((s) =>
    [...document.querySelectorAll(s)].filter((e) => e.offsetParent !== null).map((e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height, t: e.className || e.tagName };
    }), selektor);
  for (let i = 0; i < rechtecke.length; i++)
    for (let j = i + 1; j < rechtecke.length; j++)
      expect(schneiden(rechtecke[i], rechtecke[j]), `${name}: ${rechtecke[i].t} und ${rechtecke[j].t} ueberlappen`).toBe(false);
  return rechtecke.length;
}

test('Datei oeffnet sich ohne Fehler in der Konsole', async ({ page }) => {
  const meldungen = konsole(page);
  await page.goto(seite);
  await expect(page.getByRole('heading', { name: 'Stand der Vorhaben' })).toBeVisible();
  for (const e of ebenen) {
    await page.goto(seite + e.anker);
    await expect(page.locator('.kasten')).toHaveCount(e.kasten);
  }
  expect(meldungen).toEqual([]);
});

for (const [b, h] of groessen) {
  for (const e of ebenen) {
    test(`Fenster ${b} x ${h}, ${e.name}`, async ({ page }, info) => {
      await page.setViewportSize({ width: b, height: h });
      const meldungen = konsole(page);
      await page.goto(seite + e.anker);
      await expect(page.locator('.kasten')).toHaveCount(e.kasten);

      // keine waagerechte Bildlaufleiste, nichts ragt rechts oder links hinaus
      const mass = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        hinaus: [...document.querySelectorAll('body *')]
          .filter((x) => { const r = x.getBoundingClientRect();
            return r.width > 0 && (r.right > document.documentElement.clientWidth + 0.5 || r.left < -0.5); })
          .map((x) => x.tagName + '.' + x.className),
        // Text in einem Kasten laeuft nicht aus dem Kasten
        ausgelaufen: [...document.querySelectorAll('.kasten')]
          .filter((x) => x.scrollWidth > x.clientWidth + 1 || x.scrollHeight > x.clientHeight + 1)
          .map((x) => x.textContent.slice(0, 30)),
      }));
      expect(mass.scroll).toBeLessThanOrEqual(mass.client);
      expect(mass.hinaus).toEqual([]);
      expect(mass.ausgelaufen).toEqual([]);

      // nichts liegt uebereinander: Kopf, Legende, Pfadleiste, Ueberschrift und Kaestchen
      await paareOhneUeberlappung(page, 'header.kopf, .legende, nav.pfad, main > h2, .kasten', 'Block');
      // und die Teile in jedem Kaestchen
      const innen = await page.evaluate(() => [...document.querySelectorAll('.kasten')].map((k) =>
        [...k.children].map((c) => { const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })));
      innen.forEach((liste, i) => {
        for (let x = 0; x < liste.length; x++)
          for (let y = x + 1; y < liste.length; y++)
            expect(schneiden(liste[x], liste[y]), `Kasten ${i}: Teile ${x}/${y} ueberlappen`).toBe(false);
      });

      expect(meldungen).toEqual([]);

      // Bildschirmbild der ganzen Seite (nur im Chromium-Lauf)
      if (info.project.name === 'chromium') {
        fs.mkdirSync(bilder, { recursive: true });
        await page.screenshot({ path: path.join(bilder, `${e.name}-${b}x${h}.png`), fullPage: true });
      }
    });
  }
}

test('Weg per Klick: Vorhaben, Phase, Pakete und zurueck ueber Pfadleiste und Zurueck-Taste', async ({ page }) => {
  await page.goto(seite);
  await expect(page.locator('#pfad')).toHaveText('Alle Vorhaben');
  await page.locator('a.kasten', { hasText: 'Strategietester' }).click();
  await expect(page).toHaveURL(/#backtest$/);
  await expect(page.locator('#pfad')).toContainText('Alle Vorhaben');
  await expect(page.locator('#pfad')).toContainText('Strategietester');
  await expect(page.locator('.ebene2 .kasten')).toHaveCount(6);
  await page.locator('a.kasten', { hasText: 'Umsetzung' }).click();
  await expect(page).toHaveURL(/#backtest\/4$/);
  await expect(page.locator('#pfad')).toHaveText(/Alle Vorhaben\s*Strategietester\s*Umsetzung/);
  await expect(page.locator('.ebene3 .kasten')).toHaveCount(3);

  // Rueckweg ueber die Pfadleiste
  await page.locator('#pfad a', { hasText: 'Strategietester' }).click();
  await expect(page).toHaveURL(/#backtest$/);
  await expect(page.locator('.ebene2')).toBeVisible();
  await page.locator('#pfad a', { hasText: 'Alle Vorhaben' }).click();
  await expect(page.locator('.ebene1')).toBeVisible();
  await expect(page.locator('#pfad')).toHaveText('Alle Vorhaben');

  // Rueckweg ueber die Zurueck-Taste des Browsers
  await page.locator('a.kasten', { hasText: 'Strategietester' }).click();
  await expect(page.locator('.ebene2')).toBeVisible();
  await page.locator('.ebene2 a.kasten', { hasText: 'Umsetzung' }).click();
  await expect(page.locator('.ebene3')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.ebene2')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.ebene1')).toBeVisible();
});

test('Weg per Tastatur: Tab, Eingabetaste, Rueckweg ueber die Pfadleiste', async ({ page }) => {
  await page.goto(seite);
  // das erste Kaestchen ist "Entwicklungsverfahren verbessern"; Strategietester ist das zweite
  await page.keyboard.press('Tab');
  await expect(page.locator('a.kasten').first()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('a.kasten', { hasText: 'Strategietester' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#backtest$/);
  // Der Fokus liegt auf der Ueberschrift; danach kommen die Kaestchen der Phasen
  await expect(page.locator('main > h2')).toBeFocused();
  const phasen = ['Anforderung', 'Konzeption', 'Planung', 'Umsetzung'];
  for (const p of phasen) {
    await page.keyboard.press('Tab');
    await expect(page.locator('a.kasten', { hasText: p }).first()).toBeFocused();
  }
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#backtest\/4$/);
  await expect(page.locator('.ebene3 .kasten')).toHaveCount(3);
  // Rueckweg per Tastatur: der Fokus liegt auf der Ueberschrift, davor steht die Pfadleiste
  await expect(page.locator('main > h2')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#pfad a', { hasText: 'Strategietester' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#backtest$/);
  await expect(page.locator('.ebene2')).toBeVisible();
  await expect(page.locator('main > h2')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#pfad a', { hasText: 'Alle Vorhaben' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ebene1')).toBeVisible();
});

test('Marke "Wartet auf Sie" fuer backtest/wp02 auf allen drei Ebenen', async ({ page }) => {
  await page.goto(seite);
  const k1 = page.locator('a.kasten', { hasText: 'Strategietester' });
  await expect(k1.locator('.marke')).toHaveText(/Wartet auf Sie: Abnahme durchführen/);
  await k1.click();
  const k2 = page.locator('a.kasten', { hasText: 'Abnahme' });
  await expect(k2.locator('.marke')).toHaveText(/Wartet auf Sie: Abnahme durchführen/);
  // genau eine Phase des Vorhabens ist hervorgehoben
  await expect(page.locator('.ebene2 .kasten.wartet')).toHaveCount(1);
  await page.locator('#pfad a', { hasText: 'Alle Vorhaben' }).click();
  await page.locator('a.kasten', { hasText: 'Strategietester' }).click();
  await expect(page.locator('.ebene2')).toBeVisible();
  await page.locator('.ebene2 a.kasten', { hasText: 'Umsetzung' }).click();
  const k3 = page.locator('.ebene3 .kasten:has(.name:text-is("Einzelschritt-Test"))');
  await expect(k3.locator('.marke')).toHaveText(/Wartet auf Sie: Abnahme durchführen/);
  await expect(page.locator('.ebene3 .kasten.wartet')).toHaveCount(1);
  // das Paket ist in Abnahme; in der Phase Umsetzung steht es als erledigt, die Marke bleibt am Paket
  await expect(k3).toHaveClass(/s-gruen/);
  await expect(k3).toContainText('jetzt in Abnahme');
  // Unterscheidung von den Farben des Stands: Rahmen mindestens 4 px und blau
  const rahmen = await k3.evaluate((e) => ({ b: getComputedStyle(e).borderTopWidth, f: getComputedStyle(e).borderTopColor }));
  expect(parseFloat(rahmen.b)).toBeGreaterThanOrEqual(4);
  expect(rahmen.f).toBe('rgb(28, 79, 156)');
});

test('Marke am Paket auch in der Phase Abnahme', async ({ page }) => {
  await page.goto(seite + '#backtest/5');
  const k = page.locator('.ebene3 .kasten:has(.name:text-is("Einzelschritt-Test"))');
  await expect(k.locator('.marke')).toHaveText(/Wartet auf Sie: Abnahme durchführen/);
  await expect(k).toHaveClass(/s-gelb/);
});

test('Stand je Ebene: Farbe und Wort', async ({ page }) => {
  await page.goto(seite);
  const stand = async (text) => page.locator('.kasten', { hasText: text }).first().evaluate((e) => ({
    klasse: [...e.classList].find((c) => c.startsWith('s-')), wort: e.querySelector('.stand').textContent }));
  expect(await stand('Berichte')).toEqual({ klasse: 's-grau', wort: '○ Nicht begonnen' });
  expect(await stand('Strategiedesigner')).toEqual({ klasse: 's-gelb', wort: '◐ Begonnen' });
  expect(await stand('Über-Dialog')).toEqual({ klasse: 's-gruen', wort: '● Erledigt' });

  await page.goto(seite + '#backtest');
  const klassen = await page.locator('.ebene2 .kasten').evaluateAll((l) => l.map((e) => [...e.classList].find((c) => c.startsWith('s-'))));
  expect(klassen).toEqual(['s-gruen', 's-gruen', 's-gruen', 's-gelb', 's-gelb', 's-grau']);

  await page.goto(seite + '#backtest/5');
  const pakete = await page.locator('.ebene3 .kasten').evaluateAll((l) => l.map((e) => [...e.classList].find((c) => c.startsWith('s-'))));
  expect(pakete).toEqual(['s-gruen', 's-gelb', 's-grau']);
  await expect(page.locator('.ebene3 .kasten').nth(2)).toContainText('wartet auf Einzelschritt-Test (wp02)');
});

test('Phasen 1 bis 3 zeigen den Schritt, in dem das Vorhaben steht', async ({ page }) => {
  await page.goto(seite + '#beispiel/1');
  const k = page.locator('.ebene3 .kasten');
  await expect(k).toHaveCount(1);
  await expect(k).toContainText('Auftraggeber');
  await expect(k.locator('.marke')).toHaveText(/Frage beantworten/);
  await page.goto(seite + '#verfahren/2');
  await expect(page.locator('.ebene3 .kasten')).toContainText('Softwarearchitekt');
  await expect(page.locator('.ebene3 .kasten.wartet')).toHaveCount(0);
});

test('Seite enthaelt keine Links nach aussen und keine Pfade', async ({ page }) => {
  await page.goto(seite);
  await expect(page.locator('link[href], script[src], img, iframe')).toHaveCount(0);
  for (const e of ebenen) {
    await page.goto(seite + e.anker);
    const ziele = await page.locator('a').evaluateAll((l) => l.map((a) => a.getAttribute('href')));
    for (const z of ziele) expect(z.startsWith('#')).toBe(true);
  }
  const text = await page.evaluate(() => document.documentElement.outerHTML);
  expect(text).not.toMatch(/https?:|\/srv\/|\/home\/|\/var\/|localhost|127\.0\.0\.1|:\d{4}\b/);
});
