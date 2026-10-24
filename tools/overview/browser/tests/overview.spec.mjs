// Browsertest der erzeugten Übersicht (Spezifikation 7.4 und req-system-024).
// Die Seite erzeugt global-setup.mjs aus einem Test-Repository (make_fixture.py);
// ihr Pfad steht in OVERVIEW_PAGE.
import { expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';

const PAGE = process.env.OVERVIEW_PAGE;
if (!PAGE) {
  throw new Error('OVERVIEW_PAGE fehlt: Aufruf über run-browser-test oder playwright test');
}
const BASE = pathToFileURL(PAGE).href;

const SIZES = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 820, height: 1180 },
  { width: 1180, height: 820 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];

// Je Ebene Beispiele, darunter ein Vorhaben mit sehr langem Namen.
const ANKER = [
  '',
  'backtest',
  'backtest/4',
  'backtest/5',
  'verfahren',
  'verfahren/2',
  'beispiel',
  'beispiel/1',
  'berichte/3',
  'ablauftest/6',
  'langname',
  'langname/4',
  'relay/4',
];

const RGB_BLAU = 'rgb(28, 79, 156)';
const STAND_WORT = {
  grau: '○ Nicht begonnen',
  gelb: '◐ Begonnen',
  gruen: '● Erledigt',
};

async function open(page, anker = '') {
  await page.goto(anker === '' ? BASE : `${BASE}#${anker}`);
  await expect(page.locator('main > section:not([hidden])')).toHaveCount(1);
}

function sichtbarerAbschnitt(page) {
  return page.locator('main > section:not([hidden])');
}

for (const size of SIZES) {
  test.describe(`Fenster ${size.width} x ${size.height}`, () => {
    test.use({ viewport: size, locale: 'de-DE', timezoneId: 'Europe/Berlin' });

    for (const anker of ANKER) {
      test(`Layout #${anker}`, async ({ page }) => {
        await open(page, anker);
        const befund = await page.evaluate(() => {
          const out = [];
          const wurzel = document.scrollingElement;
          if (wurzel.scrollWidth > wurzel.clientWidth) {
            out.push(`waagerechter Bildlauf: ${wurzel.scrollWidth} > ${wurzel.clientWidth}`);
          }
          const sichtbar = (el) => el.checkVisibility();
          const rechteck = (el) => el.getBoundingClientRect();
          const schneiden = (a, b) =>
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
          const name = (el) => (el.textContent || '').trim().slice(0, 30);

          // Kästchen untereinander
          const kaesten = Array.from(document.querySelectorAll('.kasten')).filter(sichtbar);
          for (let i = 0; i < kaesten.length; i++) {
            for (let j = i + 1; j < kaesten.length; j++) {
              if (schneiden(rechteck(kaesten[i]), rechteck(kaesten[j]))) {
                out.push(`Kästchen übereinander: ${name(kaesten[i])} / ${name(kaesten[j])}`);
              }
            }
          }
          // Inhalt liegt im Kästchen und im Fenster
          for (const kasten of kaesten) {
            const k = rechteck(kasten);
            if (k.left < -0.5 || k.right > window.innerWidth + 0.5) {
              out.push(`Kästchen ragt aus dem Fenster: ${name(kasten)}`);
            }
            if (kasten.scrollWidth > kasten.clientWidth + 1) {
              out.push(`Inhalt breiter als das Kästchen: ${name(kasten)}`);
            }
            for (const kind of kasten.children) {
              const c = rechteck(kind);
              if (c.right > k.right + 0.5 || c.left < k.left - 0.5 || c.bottom > k.bottom + 0.5) {
                out.push(`Teil ragt aus dem Kästchen: ${name(kind)}`);
              }
            }
            // Zeilen eines Kästchens untereinander
            const teile = Array.from(kasten.children).filter(sichtbar);
            for (let i = 0; i < teile.length; i++) {
              for (let j = i + 1; j < teile.length; j++) {
                if (schneiden(rechteck(teile[i]), rechteck(teile[j]))) {
                  out.push(`Zeilen übereinander: ${name(teile[i])} / ${name(teile[j])}`);
                }
              }
            }
          }
          // Kopf, Legende, Pfadleiste und Inhalt folgen untereinander
          const bloecke = ['header.kopf', '.legende', 'nav.pfad', 'main']
            .map((s) => document.querySelector(s))
            .filter(sichtbar);
          for (let i = 1; i < bloecke.length; i++) {
            if (rechteck(bloecke[i]).top < rechteck(bloecke[i - 1]).bottom - 0.5) {
              out.push(`Block übereinander: ${bloecke[i].tagName} ${bloecke[i].className}`);
            }
          }
          // Phasen auf schmalen Fenstern in Reihen oder untereinander: höchstens drei je Reihe
          if (window.innerWidth < 1100) {
            const phasen = Array.from(document.querySelectorAll('.ebene2 > li')).filter(sichtbar);
            const reihen = new Map();
            for (const p of phasen) {
              const oben = Math.round(rechteck(p).top);
              reihen.set(oben, (reihen.get(oben) || 0) + 1);
            }
            for (const [oben, anzahl] of reihen) {
              if (anzahl > 3) { out.push(`mehr als drei Phasen in einer Reihe bei ${oben}`); }
            }
          }
          return out;
        });
        expect(befund).toEqual([]);
        expect(await sichtbarerAbschnitt(page).locator('.kasten').count()).toBeGreaterThan(0);
      });
    }

    test('Kontrast mindestens 4,5 : 1 auf allen Ebenen', async ({ page }) => {
      const alle = [];
      for (const anker of ANKER) {
        await open(page, anker);
        const befund = await page.evaluate(() => {
          const zerlegen = (text) => {
            const m = text.match(/rgba?\(([^)]+)\)/);
            if (!m) { return null; }
            const t = m[1].split(',').map((x) => parseFloat(x));
            return { r: t[0], g: t[1], b: t[2], a: t.length > 3 ? t[3] : 1 };
          };
          const hell = (c) => {
            const f = (v) => {
              const x = v / 255;
              return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
          };
          const grund = (el) => {
            for (let e = el; e; e = e.parentElement) {
              const c = zerlegen(getComputedStyle(e).backgroundColor);
              if (c && c.a === 1) { return c; }
              if (c && c.a > 0) { return null; }
            }
            return { r: 255, g: 255, b: 255, a: 1 };
          };
          const out = [];
          let geprueft = 0;
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (!n.textContent.trim()) { continue; }
            const el = n.parentElement;
            if (!el.checkVisibility() || el.closest('script,style')) { continue; }
            const vorder = zerlegen(getComputedStyle(el).color);
            const hinter = grund(el);
            if (!vorder || !hinter) { out.push(`Grund nicht bestimmbar: ${n.textContent.trim().slice(0, 30)}`); continue; }
            geprueft++;
            const a = hell(vorder) + 0.05;
            const b = hell(hinter) + 0.05;
            const verhaeltnis = Math.max(a, b) / Math.min(a, b);
            if (verhaeltnis < 4.5) {
              out.push(`${verhaeltnis.toFixed(2)} : 1 bei "${n.textContent.trim().slice(0, 30)}"`);
            }
          }
          if (geprueft < 8) { out.push(`nur ${geprueft} Texte geprüft`); }
          return out;
        });
        for (const b of befund) { alle.push(`#${anker}: ${b}`); }
      }
      expect(alle).toEqual([]);
    });
  });
}

test.describe('Bedienung', () => {
  test.use({ viewport: { width: 1366, height: 768 }, locale: 'de-DE', timezoneId: 'Europe/Berlin' });

  test('Navigation über alle drei Ebenen mit Pfadleiste und Zurück-Taste', async ({ page }) => {
    await open(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stand der Vorhaben');
    await expect(sichtbarerAbschnitt(page)).toHaveAttribute('data-ebene', '1');
    await expect(page.locator('#pfad li')).toHaveText(['Alle Vorhaben']);
    // 1 -> 2
    await sichtbarerAbschnitt(page).locator('a.kasten', { hasText: 'Strategietester' }).click();
    await expect(page).toHaveURL(/#backtest$/);
    await expect(sichtbarerAbschnitt(page)).toHaveAttribute('data-ebene', '2');
    await expect(sichtbarerAbschnitt(page).locator('.ebene2 > li')).toHaveCount(6);
    await expect(page.locator('#pfad li')).toHaveText(['Alle Vorhaben', 'Strategietester']);
    // 2 -> 3
    await sichtbarerAbschnitt(page).locator('a.kasten', { hasText: 'Umsetzung' }).click();
    await expect(page).toHaveURL(/#backtest\/4$/);
    await expect(sichtbarerAbschnitt(page)).toHaveAttribute('data-ebene', '3');
    await expect(sichtbarerAbschnitt(page).locator('.kasten')).toHaveCount(3);
    await expect(page.locator('#pfad li')).toHaveText(['Alle Vorhaben', 'Strategietester', 'Umsetzung']);
    // Zurück-Taste führt eine Ebene zurück
    await page.goBack();
    await expect(sichtbarerAbschnitt(page)).toHaveAttribute('data-ebene', '2');
    await page.goBack();
    await expect(sichtbarerAbschnitt(page)).toHaveAttribute('data-ebene', '1');
    // Pfadleiste: von Ebene 3 direkt zu 2 und zu 1
    await page.goto(`${BASE}#backtest/5`);
    await page.locator('#pfad a', { hasText: 'Strategietester' }).click();
    await expect(page).toHaveURL(/#backtest$/);
    await expect(sichtbarerAbschnitt(page)).toHaveAttribute('data-ebene', '2');
    await page.locator('#pfad a', { hasText: 'Alle Vorhaben' }).click();
    await expect(sichtbarerAbschnitt(page)).toHaveAttribute('data-ebene', '1');
    // Unbekannter Anker führt auf die erste Ebene
    await page.goto(`${BASE}#gibt-es-nicht`);
    await expect(sichtbarerAbschnitt(page)).toHaveAttribute('data-ebene', '1');
  });

  test('Tastatur: Kästchen sind Verweise, erreichbar, Fokus sichtbar, Enter öffnet', async ({ page }) => {
    await open(page);
    const verweise = await page.locator('main > section:not([hidden]) a.kasten').count();
    expect(verweise).toBe(await page.locator('main > section:not([hidden]) .kasten').count());
    const gesehen = [];
    for (let i = 0; i < verweise; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const e = document.activeElement;
        const s = getComputedStyle(e);
        return {
          ziel: e.getAttribute('href'),
          klasse: e.className,
          kontur: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 3,
          schatten: s.boxShadow !== 'none',
        };
      });
      expect(info.klasse).toContain('kasten');
      expect(info.kontur).toBe(true);
      expect(info.schatten).toBe(true);
      gesehen.push(info.ziel);
    }
    expect(new Set(gesehen).size).toBe(verweise);
    // Enter auf dem Kästchen "Strategietester"
    await page.goto(BASE);
    const ziel = sichtbarerAbschnitt(page).locator('a.kasten', { hasText: 'Strategietester' });
    await ziel.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#backtest$/);
    // Fokus liegt danach auf der Überschrift der neuen Ebene
    await expect(page.locator('main > section:not([hidden]) h2')).toBeFocused();
    // Weiter mit Tab zum ersten Kästchen und Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#backtest\/1$/);
    // Pfadleiste mit der Tastatur
    await page.locator('#pfad a').nth(1).focus();
    await page.keyboard.press('Enter');
    await expect(sichtbarerAbschnitt(page)).toHaveAttribute('data-ebene', '2');
    await page.locator('#pfad a').first().focus();
    await page.keyboard.press('Enter');
    await expect(sichtbarerAbschnitt(page)).toHaveAttribute('data-ebene', '1');
  });

  test('Stand als Farbe und als Wort mit Zeichen, Legende', async ({ page }) => {
    await open(page);
    const legende = page.getByRole('group', { name: 'Legende' });
    await expect(legende).toContainText('grau: nicht begonnen');
    await expect(legende).toContainText('gelb: begonnen');
    await expect(legende).toContainText('grün: erledigt');
    await expect(legende).toContainText('blauer Rahmen: wartet auf Sie');
    const farben = new Set();
    for (const anker of ['', 'backtest', 'backtest/5', 'verfahren/1', 'verfahren/3']) {
      await open(page, anker);
      const kaesten = await page.locator('main > section:not([hidden]) .kasten').evaluateAll((els) =>
        els.map((e) => ({
          klasse: e.className,
          wort: e.querySelector('.stand')?.textContent,
          grund: getComputedStyle(e).backgroundColor,
        })),
      );
      for (const k of kaesten) {
        const stand = (k.klasse.match(/s-(grau|gelb|gruen)/) || [])[1];
        expect(stand).toBeTruthy();
        expect(k.wort).toBe(STAND_WORT[stand]);
        farben.add(`${stand}=${k.grund}`);
      }
    }
    // drei verschiedene Hintergrundfarben für die drei Stände
    expect(new Set([...farben].map((f) => f.split('=')[1])).size).toBe(3);
    expect(farben.size).toBe(3);
  });

  test('Hervorhebung "Wartet auf Sie" auf allen drei Ebenen', async ({ page }) => {
    // Ebene 1: Vorhaben mit Eintrag in waiting.md
    await open(page);
    const warten1 = sichtbarerAbschnitt(page).locator('.kasten.wartet');
    await expect(warten1).toHaveCount(2);
    await expect(warten1.filter({ hasText: 'Strategietester' }).locator('.marke')).toHaveText(
      /Wartet auf Sie: Abnahme durchführen/,
    );
    await expect(warten1.filter({ hasText: 'Neues Vorhaben' }).locator('.marke')).toHaveText(
      /Wartet auf Sie: Frage beantworten/,
    );
    // Rahmen kräftig, blau, verschieden von den drei Farben des Stands
    const rahmen = await warten1.first().evaluate((e) => {
      const s = getComputedStyle(e);
      return { farbe: s.borderTopColor, breite: parseFloat(s.borderTopWidth) };
    });
    expect(rahmen.farbe).toBe(RGB_BLAU);
    expect(rahmen.breite).toBeGreaterThanOrEqual(4);
    const standRahmen = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.kasten:not(.wartet)')).map((e) => getComputedStyle(e).borderTopColor),
    );
    expect(standRahmen).not.toContain(RGB_BLAU);

    // Ebene 2: genau die Phase, in der der Eintrag liegt
    await open(page, 'backtest');
    const warten2 = sichtbarerAbschnitt(page).locator('.kasten.wartet');
    await expect(warten2).toHaveCount(1);
    await expect(warten2).toContainText('Phase 5');
    await expect(warten2.locator('.marke')).toHaveText(/Wartet auf Sie: Abnahme durchführen/);

    // Ebene 3: das Paket behält die Marke in jeder Phasenansicht
    for (const nr of [4, 5, 6]) {
      await open(page, `backtest/${nr}`);
      const warten3 = sichtbarerAbschnitt(page).locator('.kasten.wartet');
      await expect(warten3).toHaveCount(1);
      await expect(warten3).toContainText('Einzelschritt-Test');
      await expect(warten3.locator('.marke')).toHaveText(/Wartet auf Sie: Abnahme durchführen/);
    }
    // Vorhaben ohne Plan: Phase und Schritt
    await open(page, 'beispiel');
    await expect(sichtbarerAbschnitt(page).locator('.kasten.wartet')).toHaveCount(1);
    await expect(sichtbarerAbschnitt(page).locator('.kasten.wartet')).toContainText('Phase 1');
    await open(page, 'beispiel/1');
    await expect(sichtbarerAbschnitt(page).locator('.kasten.wartet .marke')).toHaveText(
      /Wartet auf Sie: Frage beantworten/,
    );
    // Ohne Eintrag keine Hervorhebung
    await open(page, 'relay/4');
    await expect(sichtbarerAbschnitt(page).locator('.kasten.wartet')).toHaveCount(0);
  });

  test('Zeitpunkte: UTC im Dokument, im Browser in Ortszeit ausgeschrieben', async ({ browser }) => {
    const utc = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
    await utc.goto(BASE);
    await expect(utc.locator('.zeit')).toHaveText('erzeugt am 2026-10-24 12:00 UTC');
    // Ohne Skript stehen alle Ebenen untereinander, die Pfadleiste bleibt verborgen
    expect(await utc.locator('main > section:not([hidden])').count()).toBeGreaterThan(10);
    await expect(utc.locator('nav.pfad')).toBeHidden();
    await utc.context().close();

    for (const [zone, erwartet] of [
      ['Europe/Berlin', '24.10.2026, 14:00 Uhr'],
      ['America/New_York', '24.10.2026, 08:00 Uhr'],
    ]) {
      const kontext = await browser.newContext({ locale: 'de-DE', timezoneId: zone });
      const seite = await kontext.newPage();
      await seite.goto(BASE);
      await expect(seite.locator('.zeit')).toHaveText(`erzeugt am ${erwartet}`);
      const texte = await seite.locator('time.zeitpunkt').allTextContents();
      expect(texte.length).toBeGreaterThan(3);
      for (const t of texte) {
        expect(t).toMatch(/^\d\d\.\d\d\.\d{4}, \d\d:\d\d Uhr$/);
      }
      // Die Zeile in waiting.md (UTC 09:05) steht beim Vorhaben "Neues Vorhaben"
      const seit = seite.locator('#ebene-alle .kasten', { hasText: 'Neues Vorhaben' }).locator('time.zeitpunkt');
      await expect(seit).toHaveText(zone === 'Europe/Berlin' ? '24.10.2026, 11:05 Uhr' : '24.10.2026, 05:05 Uhr');
      await kontext.close();
    }
  });

  test('Nichts aus dem Netz, keine Fehler in der Konsole', async ({ page }) => {
    const anfragen = [];
    const fehler = [];
    page.on('request', (r) => anfragen.push(r.url()));
    page.on('console', (m) => { if (m.type() === 'error') { fehler.push(m.text()); } });
    page.on('pageerror', (e) => fehler.push(String(e)));
    for (const anker of ANKER) { await open(page, anker); }
    expect(anfragen.filter((u) => !u.startsWith('file:') && !u.startsWith('data:'))).toEqual([]);
    expect(fehler).toEqual([]);
    const html = await page.content();
    expect(html).not.toMatch(/<(script|link|img|iframe)[^>]+(src|href)=["']https?:/i);
    expect(html).not.toMatch(/@import|url\(/);
  });
});
