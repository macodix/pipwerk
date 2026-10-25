# Testbericht Tester Funktion – Auftrag 13, Durchlauf 1

- Bezug: `strategiedesign/wp02`, Zweig `strategiedesign/wp02-13`
- geprüfter Commit: `4b5dfe3f69bf1f3e3bff28c8c24cc3a5bfc2cf9a` (Ausgangscommit `264c2acbaee7de846f0198d88faafb8bf8ae01e3`), ausgecheckt und per `rev-parse` kontrolliert
- Prüfskript unverändert, kein eigener Commit am Prüfskript
- **Ergebnis: bestanden** (kein blockierender Befund; 1 Hinweis zu Kriterium 1)

## Ausgeführt (Prüfskript `check --backend-port 8431 --frontend-port 5431`, Ausgabe `work/strategiedesign/wp02/ft13-check.log`)

- Bibliothek (pytest, ruff, mypy, Schemas v1/v2), Backend (1032 Tests, ruff, mypy), Schreibweise des Namens: bestanden
- Frontend: `npm ci`, `typecheck`, `build` bestanden; Vitest 50 Dateien, 615 Tests bestanden
- Playwright (Chromium, Firefox, WebKit): 267 bestanden, 3 fehlgeschlagen (je Browser `str-01`). Das Skript endet deshalb mit Exitcode 1 beim Schritt „browser test“.
- Chromium: alle übrigen Tests bestanden, darunter `str-03` (Desktop und 390 × 844), `expressions.spec.ts`, `used.spec.ts`, `objects.spec.ts`, `canvas.spec.ts`.

## Zuordnung der 3 Fehlschläge `str-01`

- Ursache laut Log: `locator.click` wartet auf `[data-lib-item "1-2-3-Trend (Markttechnik)"]`, Fundstelle `e2e/builder.ts:126` aus `testcases.spec.ts:154` (`buildStr01`). Der Eintrag steht nicht mehr in der Bibliothek.
- Der Fehler tritt auch im Lauf am Ausgangscommit auf (`ft12-check.log`: `str-01` in allen drei Browsern). Der Commit verursacht ihn nicht. `str-03` fehlte dort ebenfalls und besteht jetzt.
- Auftrag 14 Punkt 1 nennt den Aufbau von `str-01` und `str-03` in allen drei Browsern; Auftrag 13 schließt Browsertests der vollständigen Testfälle aus (Nicht-Umfang). Die Zuordnung stimmt.

## Prüfung der Punkte 1 bis 11 und der Ergänzung

- Punkte 1 bis 10: umgesetzt; belegt durch `UsedValues.tsx`, `usedValues.ts`, `BlockEditor.tsx`, `FormulaEditor.tsx`, `formulaAssist.ts`, `removal.ts` und die neuen Tests (`App.usedValues.test.tsx`, `usedValues.test.ts`, `inputs.test.ts`, `ops.test.ts`, `used.spec.ts`). Die Playwright-Fälle für Formeleditor, Umbenennen/Entfernen, Eigenschaft wählen und „Aktualisieren“ bestehen in Chromium.
- Ergänzung (`first_use`): `expression/inputs.ts` (`withInputs` → `setFirstUse`, wenn kein Element die Instanz verwendet, gespeicherter Wert bleibt), `useStudioController.ts` (`connectValue`, `connectMember`, `chooseFirstUse`). `str-03` gleicht den Vergleich mit dem Testfall aus.
- Angepasste Tests, Diff gegen Ausgangscommit: `compare.ts` führt `first_use` als Kennung über `mapId` (wie `source`/`target`) – keine Abschwächung. `testcases.spec.ts`/`builder.ts` ergänzen nur `refreshValue` (Bedienung des Schalters „Aktualisieren“, Testfalldokument nennt es jetzt), kein Ausdruck als Text. `canvas`/`objects`/`expressions.spec.ts`: Chips `input-chip` durch `used-row`/`used-group` ersetzt, Prüfinhalt gleich oder stärker (Entfernen der Verbindung geprüft). Begründet.
- Als Text gesetzt: kein `innerHTML` und kein `dangerouslySetInnerHTML` in `src` (ohne Tests). Kein fester Pfad, Port oder Rechnername in `src`.
- Dokumentation: technisch (`pipwerk-studio.md`), Anwender (`docs/user/pipwerk-studio.md`: Verwendete Werte, Aktualisieren, „Vorheriger Wert von“, Element der ersten Verwendung, Glossar mit Baustein, Anzeigeform, Aktualisieren, Eingang, Angabe ohne Wert) und `glossar.md` vorhanden; „Element der ersten Verwendung“ einheitlich. Keine Pfade, Benutzer- oder Rechnernamen des Entwicklungsrechners; Treffer sind die Repository-Adresse und ein erfundenes Pfadbeispiel (`/home/beispiel/…`), beide bereits vorher vorhanden.

## Hinweise (nicht blockierend)

1. Kriterium 1 des Auftrags verlangt „Playwright in Chromium besteht“; `str-01` in Chromium besteht nicht. Wegen der Zuordnung zu Auftrag 14 und der Bestehensregel nicht blockierend. Der Entwicklungsleiter sollte das ausdrücklich bestätigen.
2. Der Eintrag „1-2-3-Trend (Markttechnik)“ fehlt in der Bibliothek, `testcases.spec.ts:154,156` und `pipwerk-studio-testfaelle.md:121,122` nennen ihn noch. Auftrag 14 muss Test und Testfalldokument angleichen.
3. Nicht einzeln durchgespielt: sichtbare Darstellung (Farben, Lesbarkeit); die Browsertests prüfen nur Struktur und Texte.
