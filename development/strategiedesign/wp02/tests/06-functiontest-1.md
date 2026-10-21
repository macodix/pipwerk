# Testbericht Tester Funktion, Auftrag 06, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `8023d25b0bc3102c7f4267b018c141671ec799ae` (Zweig `strategiedesign/wp02-06`), ausgecheckt im eigenen Arbeitsverzeichnis, kontrolliert mit `git rev-parse HEAD`
- Ausgangscommit des Auftrags: `1bd5e49c14d5330a39c5ad93c747699ec078a3a8`
- Prüfskript: unverändert. Es wurde keine Änderung nötig, daher gibt es keinen Commit des Prüfskripts und keinen Zweig `strategiedesign/wp02-functiontest`. Verwendet wurde das Prüfskript auf dem Stand des geprüften Commits.
- Durchlauf: erster, vollständig.

## Prüfskript

`components/pipwerk-studio/scripts/check --backend-port 18791 --frontend-port 18792` endet mit **Exitcode 0** („check: all checks passed“). Die Schritte im Einzelnen:

| Schritt | Ergebnis |
|---|---|
| Bibliothek: `uv sync --frozen`, pytest, ruff check, ruff format, mypy | bestanden; pytest 1445 Tests |
| Schemata gleich `contracts/strategies/v2` und `v1` | bestanden |
| Backend: pytest, ruff, mypy | bestanden; pytest 937 Tests |
| Schreibweise des Namens im Repository | 481 Nennungen, alle richtig |
| Oberfläche: `npm ci`, Typprüfung, Vitest | bestanden; Vitest 40 Dateien, 474 Tests |
| Oberfläche: Build | bestanden |
| Browsertests Chromium, Firefox, WebKit gegen das Backend | 210 von 210 bestanden (10,4 min) |

Das stimmt mit den Angaben des Entwicklers überein. Die Ports 5174 und 8001 wurden nicht benutzt.

## Prüfung gegen den Auftrag

Technische Abnahmekriterien:

1. `npm ci`, Typprüfung und Vitest enden mit Exitcode 0: erfüllt (Prüfskript).
2. Browsertests in allen drei Browsern gegen das Backend bestehen: erfüllt. Die Browsertests von `str-01` und `str-03` (`e2e/testcases.spec.ts`) und `e2e/builder.ts` geben keinen Ausdruck als Text ein. Ausdruckstext tippen nur die Tests des Formeleditors in `e2e/expressions.spec.ts`. Die Suche nach `formula` und „Fortgeschrittene“ in `testcases.spec.ts`, `builder.ts` und `contents.spec.ts` ergab keinen Treffer.
3. Prüfskript auf freien Ports mit Exitcode 0: erfüllt.
4. Kein fester Pfad, Port oder Rechnername im Code: erfüllt. Die Suche nach `/srv/`, `/home/`, `localhost:<Port>`, `127.0.0.1:<Port>` und den Ports 5173, 5174, 8001 in `frontend/src` und `frontend/e2e` fand nichts.
5. Dokumentation stimmt mit dem Code überein und enthält keine Pfade, Benutzernamen oder Rechnernamen des Entwicklungsrechners: erfüllt. Die Treffer in den drei geprüften Dokumenten sind nur die Adresse des Repositorys und das erfundene Beispiel `/home/beispiel/pipwerk` im Glossar.
6. Ein Commit auf `strategiedesign/wp02-06`: der geprüfte Commit liegt als `origin/strategiedesign/wp02-06` vor und wurde ausgecheckt.

Umfang:

| Punkt | Nachweis |
|---|---|
| 1 Bausteine | `expression/BlockEditor.tsx`, `blocks.ts`, `options.ts` mit Vitest (`blocks.test.ts`, `options.test.ts`); Browsertests `testcases.spec.ts` |
| 2 Formelansicht | `FormulaEditor.tsx`, `formulaAssist.ts` mit Vitest; Browsertests `expressions.spec.ts` (Vorschläge nach dem Namen einer Berechnung, Fehler an der Stelle, Argumente einer Funktion, Klammern) |
| 3 Regeln zuordnen | `properties/Instances.tsx`; Browsertest `contents.spec.ts` (Regel mit Parametern, Ausdruck, bestimmter Eigenschaft, Vergleich) |
| 4 Trend, eigener Indikator, eigenes Regelwerk | Browsertests `contents.spec.ts` |
| 5 Umbenennen und Entfernen | `state/removal.ts` mit Vitest; Browsertests `expressions.spec.ts` (verbundenes Objekt, Lücke im Ablauf) |
| 6 Geführter Aufbau | `wizard/Wizard.tsx` mit Vitest (`Wizard.test.tsx`); Browsertests `expressions.spec.ts` |
| 7 Befund führt zur Stelle | Browsertest `expressions.spec.ts` („a finding in an expression leads to the spot“) |
| 8 Tests | `str-01` in 1366 × 768, `str-03` in 1366 × 768 und in 390 × 844; Bausteine, Formeleditor und geführter Aufbau in 390 × 844 und 844 × 390 (nach `e2e/expressions.spec.ts`, Zeile 230); alle bestanden, auch in WebKit |
| 9 Dokumentation | siehe unten |

## Dokumentation

- `docs/user/pipwerk-studio.md`: enthält Aufbau der Oberfläche, Elementbibliothek, Zeichenfläche, Eigenschaftenansicht mit Belegungen, Regeln, Umbenennen und Entfernen (6.6 bis 6.8), die Arbeitsabläufe von `wp02` (Abschnitt 6), Bausteine und Formelansicht mit der Schreibweise (Abschnitt 7: Namen, eckige Klammern, Werte einer Auswahl, Funktionen, Trennzeichen `;`, „leer“ und „nicht verfügbar“), die Befunde mit Behebung und „Zur Stelle“ (Abschnitt 8), den geführten Aufbau (Abschnitt 9), Bedienung ohne Ziehen (Abschnitt 10), Einschränkungen und Glossar. Die Teile von `wp03` (Neues Objekt, Ansicht einer Vorlage, Als Vorlage speichern, Löschen einer Vorlage) fehlen wie vorgesehen und sind als Einschränkung genannt. Test- und Abnahmeanleitungen stehen nicht darin; das „Web-API ausprobieren“ ist nach `docs/technical/pipwerk-studio.md` (5.4) verwiesen. Gegen Auftrag Punkt 9 und Spezifikation Abschnitt 9 vollständig.
- `docs/user/README.md` nennt den Grundsatz (keine Test- oder Abnahmeanleitungen, keine Pfade des Entwicklungsrechners).
- `docs/technical/pipwerk-studio-testfaelle.md` (neu): Aufbau von `str-01` und `str-03` Schritt für Schritt mit Strategieparametern, Objekten, Hauptablauf, Verwaltung, Speichern und Prüfen; verweist auf `e2e/testcases.spec.ts`, `builder.ts`, `compare.ts`. Übereinstimmung mit Spezifikation Abschnitt 6 stichprobenhaft geprüft, keine Abweichung gefunden.
- `docs/technical/pipwerk-studio.md`: Abschnitt zu Bausteinen, Formelansicht und geführtem Aufbau vorhanden.
- `docs/technical/glossar.md`: „Baustein“, „leerer Platz“, „Formelansicht“ u. a. ergänzt.

## Befunde

Blockierende Befunde: keine.

Nicht blockierende Befunde: keine.

Einschränkung der Prüfung: Die Oberfläche wurde nur über das Prüfskript und die Browsertests geprüft. Optische Eigenschaften (Farben, Lesbarkeit) habe ich nicht bewertet; sie gehören zur QA.
