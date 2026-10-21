# Testbericht Tester Funktion, Auftrag 07, Durchlauf 1

- Ergebnis: **bestanden** (keine blockierenden Befunde)
- Vorhaben `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- geprüfter Commit: `40c5b7f695ea89a61c98f2aaf4ca4b5a03dbbe6a` (Zweig `strategiedesign/wp02-07`). Das Arbeitsverzeichnis stand nach `git rev-parse HEAD` auf genau diesem Commit.
- Prüfskript: keine Änderung, daher kein Commit im Zweig `strategiedesign/wp02-functiontest`.

## Nachweise

| Nachweis | Ergebnis |
|---|---|
| `components/pipwerk-studio/scripts/check --backend-port 18391 --frontend-port 18392` | Exitcode **0**, „check: all checks passed“ |
| Bibliothek | pytest 1445 bestanden, ruff, ruff format, mypy, Schemaabgleich v2 und v1 |
| Backend | pytest, ruff, ruff format, mypy bestanden; Suche nach der Schreibweise des Namens bestanden |
| Oberfläche | `npm ci`, Typprüfung, Vitest 479 Tests in 41 Dateien, Build bestanden |
| Browsertests | 231 bestanden (Chromium, Firefox, WebKit) in 10,7 Minuten, darunter `appearance.spec.ts` (sechs Größen und Regelvorlage in Englisch), `str-03` und `str-01` |
| Gebautes Stylesheet `dist/assets/index-*.css` | Regeln vorhanden für `.wz-body`, `.wz-foot`, `.wz-leave`, `.steps` (mit `li`, `.on`, `.done`), `.choice-cards` (mit Schaltfläche, `:hover`, `.on`, Symbol), `.spacer`; ebenso `.count-pill.hints-only` in `src/styles.css` |

## Abnahmekriterien und Umfang

1. B1 (Umfang 1): Die Regeln stehen im gebauten Stylesheet (siehe oben). Die Marken der Schritte haben `list-style: none` und eine Nummer im Kreis, der aktuelle Schritt ist hervorgehoben; Wahlkarten mit Rahmen, Radius, Abstand; Fußzeile mit Linie. Der Browsertest prüft berechnete Eigenschaften und fehlende waagerechte Bildlaufleiste in allen sechs Größen aus 5.1. Erfüllt.
2. B2 (Umfang 2): `api/elementTypes.ts` liest `template_texts` (Name und Erklärung in `de` und `en`), `libraryModel.ts` verwendet `labelText(template.explanation, …)`, `Instances.tsx` und `ElementView.tsx` verwenden `labelText(delivered.label, …)`. Vitest (`elementTypes.test.ts`, `libraryModel.test.ts`) und Browsertest prüfen „Risk per trade“ in Bibliothek, Liste und Karte der Regel; „Risiko je Trade“ darf bei Englisch nicht vorkommen. Erfüllt. Ohne Eintrag in `template_texts` fällt der Code auf das Dokument zurück.
3. Tests (Umfang 3): Vitest und Browsertests für B1 und B2 vorhanden und bestanden. Erfüllt.
4. Dokumentation (Umfang 4): `docs/technical/pipwerk-studio.md` Abschnitt 9 berichtigt (H6), Abschnitte 2.3, Schnittstelle und Testübersicht ergänzt; `docs/user/pipwerk-studio.md` beschreibt den geführten Aufbau ausführlich (H5). Die Beschreibung der Fußzeile stimmt mit `Wizard.tsx` überein („Zurück“ ab Schritt 2, „Überspringen“ in Schritt 2 bis 4, „Weiter“/„Fertig“). Erfüllt.
5. Befundzahl (Umfang 5): `Header.tsx` vergibt `bad` bei Fehlern, `hints-only` (orange) bei Hinweisen allein, sonst `good`; Tooltip mit Einzahl und Mehrzahl in `de.json` und `en.json`; Test in `App.flows.test.tsx` bestanden. Erfüllt.
6. Kein fester Pfad, Port oder Rechnername in den geänderten Dateien; Backend unverändert (Diff: 12 Dateien, nur Oberfläche und Dokumentation). Erfüllt.
7. Keine bestehende Prüfung abgeschwächt: Der Diff gegen den Ausgangscommit `dd9b705` enthält in den Testdateien nur Ergänzungen (`appearance.spec.ts` neu, Ergänzungen in `App.flows.test.tsx`, `elementTypes.test.ts`, `libraryModel.test.ts`); Prüfskript, Playwright-Konfiguration und Schwellen sind unverändert. Die Anzahl der Tests stieg von 474 auf 479 (Vitest) und von 210 auf 231 (Browser).

## Befunde

Keine blockierenden Befunde.

## Hinweise (nicht blockierend)

- **H1**: Für die Klasse `wizard` (Wurzel in `Wizard.tsx`, Zeile 183, zusammen mit `props`) gibt es weiterhin keine eigene Regel im Stylesheet. Sie dient nur als Marke; das Aussehen kommt von `props`.
- **H2**: Der Auftrag verlangt, alle Klassen in `src/**/*.tsx` auf fehlende Regeln zu prüfen. Eine vollständige maschinelle Gegenprüfung konnte ich nicht ausführen (Skript und Python-Aufruf waren in der Umgebung nicht freigegeben); geprüft sind nur die Klassen von `Wizard.tsx` und die neu ergänzten. Der Entwickler nennt in den Dateien keine weiteren fehlenden Klassen; die Browsertests und der Vergleich der QA fanden keine.
- **H3**: Die Anwenderdokumentation sagt, die Karten füllen in 390 × 844 die Breite und stehen untereinander. `.choice-cards` ist ein Raster `repeat(auto-fit, minmax(min(150px, 100%), 1fr))`; bei einer Breite von etwa 350 Pixeln können zwei Karten nebeneinander stehen. Ich habe die Oberfläche nicht optisch geprüft; der Browsertest prüft nur, dass die Karten im Fenster liegen. Die Aussage ist unbelegt.
- **H4**: Bildschirmbilder (Abnahmekriterium 5 des Auftrags) sind Sache des Entwicklers und nicht Teil dieser Prüfung; ich habe die Oberfläche nicht gesehen.
