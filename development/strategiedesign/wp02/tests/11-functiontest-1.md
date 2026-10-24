# Testbericht Tester Funktion, Auftrag 11, Durchlauf 1

- Bezug: `strategiedesign/wp02`, Auftrag `strategiedesign/wp02:development/strategiedesign/wp02/orders/11.md`
- geprüfter Commit: `313361f801c2d2d23d8f9000b21cbbc79f726b5b` (Zweig `strategiedesign/wp02-11`, auf GitHub vorhanden, Autor `macodix`, kein Claude-Trailer)
- Ausgangscommit: `37ecdeca4868b656bf5747ba8223e0374bcefab3`
- Ergebnis: **bestanden** (blockierende Befunde: keine)
- Prüfskript: unverändert (kein Commit im Zweig `…-functiontest`)

## Ergebnisse

| Prüfung | Ergebnis |
|---|---|
| `npm ci` | bestanden (Exitcode 0) |
| `typecheck` | bestanden |
| Vitest | bestanden: 45 Dateien, 534 Tests (einzeln und im Prüfskript) |
| `build` | bestanden |
| Prüfskript `check --backend-port 18111 --frontend-port 15111`: Bibliothek (1748 Tests, ruff, mypy, Schemata), Backend (1032 Tests, ruff, mypy), Schreibweise des Namens, `npm ci`, typecheck, Vitest, build | bestanden |
| Playwright Chromium (77 Tests im Prüfskript) | 74 bestanden, 3 fehlgeschlagen, alle in `e2e/testcases.spec.ts` (siehe unten) |
| Playwright Firefox/WebKit | nicht abgewartet: Das Prüfskript startet alle drei Browser; Auftrag 11 verlangt Chromium. Ich habe das Skript nach den Chromium-Tests beendet (Firefox lief bis dahin ohne Fehlschlag, bis Test 93). Das Prüfskript endet daher nicht mit Exitcode 0 (siehe H3). |
| Diff der bisherigen Tests gegen den Ausgangscommit | alle Anpassungen begründet: Vitest `App.flows`, `App.expressions`, `App.generic`, `instances.test`, `Wizard.test` (neue Gruppen, `props-none` statt `canvas-no-strategy`, Eingänge mit fünf Feldern, Assistent wartet); Browsertests `builder`, `canvas`, `library`, `workflows` (Hinweise nur in der Eigenschaftenansicht, `message` statt `toast`, neue Gruppen, „Manuell“) |
| Auftragspunkte 1 bis 8 | durch neue Tests belegt: `App.types.test`, `App.hints.test`, `parse.test` (Dokument hin und zurück mit Eingängen jeder Art), `libraryModel.test`, `findingText.test`, `locales.test` |
| `locales.test.ts` und Befundtexte | bestanden: Texte und Weg zur Behebung in Deutsch und Englisch für alle Kennungen aus `pipwerk-domain.md` 9.1 und 9.2 (der Test liest die Kennungen aus dem Dokument), dazu Texte aller Fehlerkennungen aus `errors.py` |
| Texte des Anwenders als Text | bestanden: `git grep` nach `innerHTML`/`dangerouslySetInnerHTML` in `src` ohne Treffer |
| Fester Pfad, Port, Rechnername im Code | bestanden: Suche in den geänderten Zeilen ohne Treffer |
| Hinweise nur in der Eigenschaftenansicht | bestanden: „Keine Strategie geöffnet“ kommt einmal vor (`PropertiesPanel.tsx`), `Canvas.tsx` enthält keinen Hinweis; Browsertests `library.spec`, `workflows.spec` prüfen `canvas` auf Abwesenheit |
| Dokumentation Punkt 9 | bestanden: `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md` (Gruppen, „Verbindung“, Hinweise, Assistent, neue Befundtexte) stimmen mit Code und Tests überein; keine Pfade, Benutzer- oder Rechnernamen |
| Glossar „Assistent“ gegen Spezifikation 5.5 | stimmt (Eigenschaftenansicht, Bibliothek und Zeichenfläche bedienbar, Zeile „Assistent, Schritt n von 5“, „Assistent fortsetzen“) |

## Zuordnung der drei fehlgeschlagenen Browsertests

Einzellauf `testcases.spec.ts` in Chromium auf den Ports 18000/15173: dieselben drei Tests scheitern.

- `str-03` (1366 × 768 und 390 × 844): Abweichung genau in `first_use` (erwartet UUID, erhalten `null`) bei k5, k6, k7 und in `refresh` (erwartet `true`, erhalten `false`) bei den Eingängen der Verwaltung. `first_use` legt das erste Verbinden fest: Auftrag 12, Punkt 5. „Aktualisieren“ ist ein Schalter unter „Verwendete Werte“: Auftrag 13, Nicht-Umfang von Auftrag 11. Zuordnung stimmt.
- `str-01`: Zeitüberschreitung beim Eintrag „1-2-3-Trend (Markttechnik)“ (`e2e/testcases.spec.ts:149`). Der Typ `Markttechnik` ist seit Auftrag 10 entfernt (Auftrag 11, Punkt 1); der Aufbau über Trend, Bausteine und „Aktualisieren“ hängt von Auftrag 13 ab, die Neufassung der Testfälle ist Umfang von Auftrag 14, Punkt 1. Zuordnung stimmt. Der Auftrag lässt `testcases.spec.ts` bis Auftrag 14 stehen.
- Kein Fehlschlag hängt nicht von den Aufträgen 12 bis 14 ab.

## Befunde

Blockierend: keine.

Hinweise:
- H1: Die Abnahme von Auftrag 12 bis 14 muss die drei Tests grün zeigen (kein deaktivierter oder gelöschter Test).
- H2: `package.json` hebt `@playwright/test` von 1.63.0 auf 1.64.1 an (Commit „Playwright auf 1.64.1“). Der Auftrag nennt das nicht; `npm ci` und die Tests laufen damit.
- H3: Das Prüfskript führt Chromium, Firefox und WebKit aus; Auftrag 11 verlangt nur Chromium. Wegen der drei bekannten Fehlschläge (je Browser) ist ein Exitcode 0 des Skripts erst nach Auftrag 14 zu erwarten (Kriterium 2 des Auftrags 11 „läuft auf freien Ports“ gilt als erfüllt: Das Skript läuft bis zu den Browsertests durch).
- H4: `e2e/unknown-type.strategy.json` verwendet für den bekannten Teil noch die bisherige Kennung `trigger.manual_start`; sie wird als `trigger.manual` gelesen. Der Test bleibt gültig, weil sein unbekannter Typ `erweiterung.fremder_typ` ist.

## Kriterien

1 erfüllt (`npm ci`, `typecheck`, `build`, Vitest Exitcode 0; Playwright in Chromium: 74 von 77 bestanden, 3 begründet auf die Aufträge 12 bis 14 zurückgeführt, vom Auftrag zugelassen). 2 erfüllt, soweit das Skript bis zu den Browsertests durchläuft (H3). 3 erfüllt. 4 erfüllt. 5 erfüllt (Commit auf `origin/strategiedesign/wp02-11`).
