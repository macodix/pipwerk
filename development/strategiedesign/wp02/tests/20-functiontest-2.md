# Testbericht Auftrag 20, Durchlauf 2 (Nachprüfung)

- Geprüfter Commit: `f3bfcf548676ae7cc0a10c9612eb2600ac0bfbf0` (Zweig `strategiedesign/wp02-20`, Vorgänger `afe466008c6357fcf7a5ab02b3b6a442f8958063`)
- Prüfauftrag: `development/strategiedesign/wp02/tests/20-2-order.md`
- Prüfer: Tester Funktion

## Ergebnis: nicht bestanden

B1, B2 und B3 aus Durchlauf 1 sind in Code und Dokumentation behoben. Das Prüfskript endet trotzdem mit Exitcode 1, weil ein Browsertest in Chromium fehlschlägt (Befund N1). Das Abnahmekriterium 2 (Prüfskript mit Exitcode 0) ist damit nicht erfüllt. Ich habe den Test nicht wiederholt, weil der Auftrag genau einen vollständigen Lauf vorsieht.

## Automatische Tests (Prüfskript, einmal vollständig, Ports 18961/18962)

`components/pipwerk-studio/scripts/check --backend-port 18961 --frontend-port 18962` endet mit Exitcode 1. Das Protokoll liegt in `work/strategiedesign/wp02/check-20-2.log`.

| Schritt | Ergebnis |
|---|---|
| Bibliothek: uv sync, pytest, ruff, mypy, Schemas v1/v2 | bestanden |
| Backend: uv sync, pytest (1044), ruff, ruff format, mypy | bestanden |
| Schreibweise des Namens | bestanden (500 Nennungen) |
| Frontend: npm ci, typecheck, build | bestanden (B1 behoben) |
| Frontend: Vitest | bestanden (55 Dateien, 693 Tests) |
| Browsertest Chromium, Firefox, WebKit | **FAILED**: 425 bestanden, 1 fehlgeschlagen |

Dateimodus im Commit: `check` und `testenv` je `100755`. In Ordnung.

## Befund

**N1 – Browsertest `testcases.spec.ts:300` „str-01 Scalping Punkt 2 Ausbruch is built by operating the interface and equals the test case“ schlägt in Chromium fehl.**
Fehler: `locator.check: Clicking the checkbox did not change its state` in `e2e/builder.ts:234` (`refreshValue`, Schalter „Aktualisieren“ unter „Verwendete Werte“ bei „ZigZag Handel“, `used-zigzag_2-letztes_hoch-refresh`). In Firefox und WebKit besteht derselbe Test (Test 412, 1,1 min).

Einordnung (keine Gewissheit):
- Der Commit ändert weder `builder.ts`, `testcases.spec.ts` noch den Code der Eigenschaftenansicht oder der verwendeten Werte (Diff: `library.spec.ts`, `roles.spec.ts`, `Canvas.tsx`, `de.json`, `en.json`, `docs/technical/pipwerk-studio.md`).
- Im Durchlauf 1 bestand derselbe Test in Chromium.
- Das spricht für einen unregelmäßigen Fehler des Tests (Wettlauf beim Klick auf den Schalter), nicht für einen Fehler dieses Commits. Belegt ist das nicht, weil ich den Test nicht wiederholt habe.

Ob der Test zu wiederholen oder dem Entwickler zu übergeben ist, entscheidet der Entwicklungsleiter.

## Prüfung der Befunde aus Durchlauf 1

- **B1 behoben.** Der Import `clickMenu` ist in `e2e/library.spec.ts` entfernt; `typecheck` und `build` bestehen.
- **B2 behoben.** `library.spec.ts:61` erzwingt den Klick (`click({ force: true })`) und drückt danach Eingabetaste und Leertaste. Er prüft jeweils, dass keine Meldung erscheint, der Zustand der Zeichenfläche `no-strategy` bleibt und der Satz sichtbar ist. Der Test besteht in Chromium, Firefox und WebKit (WebKit: Test 363). Er prüft wirklich, dass nichts geschieht.
- **B3 behoben.** In `Canvas.tsx` merkt `onConnectStart` den Ausgangspunkt. Ein Loslassen auf dem eigenen Element gilt nur dann als Versuch, wenn der Zeiger mehr als 8 Pixel entfernt ist.
  - Schritt auf sich selbst: `connectSteps` liefert den Grund `same_element`.
  - Wert auf die eigene Karte: neuer Grund `value_to_self`.
  - Klick auf einen Ausgang: bleibt ohne Meldung und legt nur den Ausgang fest. Der Test in `roles.spec.ts:147` prüft das (Banner sichtbar, keine Meldung).
  - Zurückziehen auf den eigenen Schritt: zeigt „Ein Schritt lässt sich nicht mit sich selbst verbinden.“ und erzeugt keine Linie. `roles.spec.ts:147` besteht in allen drei Browsern (WebKit: Test 391).
  - Andere Verbindungswege sind unverändert, soweit der Diff sie zeigt. Der Schwellenwert `moved` wird nur im Zweig `sourceId === targetId` ausgewertet. Ziehen auf ein anderes Element, Verbinden mit Klick (`Canvas.tsx` Zeilen 350 und 387, nicht im Diff) und Datenverbindungen auf andere Ziele laufen unverändert. `objects.spec.ts` und `roles.spec.ts` bestehen in allen drei Browsern.
  - Schlüsselgleichheit: `value_to_self` steht in `de.json` und `en.json`. Der Vitest zur Schlüsselgleichheit besteht.
  - Dokumentation: `docs/technical/pipwerk-studio.md` beschreibt die Schwelle von 8 Pixeln, den Klick und `value_to_self`. `docs/user/pipwerk-studio.md` (Punkt 5, „ein Schritt mit sich selbst“) passt jetzt zum Verhalten.
- **Keine Abschwächung.** Der Diff zum Vorgänger enthält nur Ergänzungen an Tests (`library.spec.ts` strenger, `roles.spec.ts` ein neuer Test). Kein Test wurde entfernt, übersprungen oder deaktiviert.

## Nicht geprüft

- Das Loslassen mit Berührung (Touch) auf dem eigenen Element: Der Code liest `event.touches[0]`; ich habe es nur im Code gesehen, nicht im Browser mit Touch.
- Die optische Darstellung (kein Bild gesehen).
- Ob `moved` bei einem Loslassen nach `touchend` richtig bestimmt wird. `onConnectEnd` liest den Punkt aus dem Ereignis, ich habe das nur im Diff gesehen.
- Die Wiederholung von N1.

## Für den Entwicklungsleiter

N1 ist der einzige offene Punkt. Wiederholt ein einzelner Lauf von `testcases.spec.ts:300` in Chromium, besteht er wohl. Dann liegt der Fehler nicht an diesem Commit. Das entscheidest du.

Bericht: bestanden: **nein** – **nicht bestanden**.
