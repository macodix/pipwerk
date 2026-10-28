# Testbericht Funktion – Auftrag 17, Durchlauf 1

- Ergebnis: **nicht bestanden** (2 blockierende Befunde, 2 Hinweise)
- geprüfter Commit: `ab452de0fb2163d880b6648034e9daa22083678d` (Zweig `strategiedesign/wp02-17`, Ausgangscommit `5d63c176a05c3c2023f7c9ac7e52846833e120d7`); im Arbeitsverzeichnis ausgecheckt und per `rev-parse HEAD` bestätigt
- Prüfskript: unverändert, kein eigener Commit am Prüfskript

## Prüfskript `components/pipwerk-studio/scripts/check`
- Lauf 1 (Ports 18810/18811) und Lauf 2 (Ports 18820/18821), beide „all checks passed“, Ausführungsrechte vorhanden.
- Je Lauf: Bibliothek (pytest, ruff, mypy, Schemas), Backend (1044 Tests, ruff, mypy), Schreibweise des Namens, `npm ci`, typecheck, Vitest (53 Dateien, 658 Tests), build, Playwright 357 bestanden (je 119 in Chromium, Firefox, WebKit), keine übersprungenen oder unsicheren Tests.
- Logs: `work/strategiedesign/wp02/ft17-check-1.log`, `ft17-check-2.log`.

## Umfang 1 bis 5 gegen Code und Tests
- Punkt 1: `fields.tsx` fragt „Woher kommt der Wert?“ (`fields.source`); die Auswahl kommt aus `kindsFor` (nur `spec.bindings` der Typbeschreibung, plus die bereits gesetzte Art). Antworten in `de.json`/`en.json` sind „fest eingeben“, „aus einem Strategieparameter“, „von einem anderen Element“, „aus einer Formel“, „beim Start der Strategie festlegen“. Instrument: `presetChoice`, Text, „anderes Instrument wählen“, Rückweg. Die Datentyp-Chips neben der Beschriftung sind in `fields.tsx` entfernt, der Typ steht in der Erklärung (`fields.expects`). Erfüllt.
- Punkt 2: „Kreuzung“ ist aus `blocks.ts`, `BlockEditor.tsx` und `CONDITION_KINDS` entfernt; „vorheriger Wert von“ bietet über `withPrevious` nur Werte mit `previousValue` an; Tests für Aufbau der Kreuzung und für das Öffnen von „EMA-Trendfolge“ sind vorhanden und bestanden. Erfüllt.
- Punkt 3: `FindingsList.tsx` zeigt Element, Instanz/Regel und Feld (`findingWhere`); Tests mit gleichlautenden Befunden und „Zur Stelle“ vorhanden. Erfüllt.
- Punkt 4: In `de.json` steht „Belegung“ nirgends mehr als Beschriftung; Schlüsselgleichheit de/en wird von `locales.test.ts` geprüft und besteht. Die Zahl der Texte und die Regeln stehen in `docs/technical/pipwerk-studio.md` (Abschnitt „Regeln der Textdurchsicht“). Siehe Befunde B2 und H2.
- Punkt 5: Tests ergänzt (`App.fields`, `App.labels`, `fields.spec.ts` u. a.).

## Keine Abschwächung der Tests
- Kein `skip`, `only`, `todo`, `fixme` in `src` und `e2e`.
- Die gelöschten Prüfungen im Diff zu `5d63c17` betreffen ausschließlich den entfernten Baustein „Kreuzung“ (`crossingBlock`, `disabledChoices`, Test „do not offer a crossing…“, `fakeExpressions`: Kreuzung als Baustein). Ersatztests prüfen das Gegenteil (keine Kreuzung wählbar, Kreuzung aus Bausteinen). Die Änderungen der Beschriftungen („Verzeichnis (vollständiger Pfad)“, „aus einem Strategieparameter“, „Noch kein Strategieparameter“) folgen der Textdurchsicht. Begründet, nicht abgeschwächt; keine verwaisten Hilfen gefunden.

## Befunde
- **B1 (blockierend), technische Dokumentation veraltet:** `docs/technical/pipwerk-studio-testfaelle.md` Zeile 35 nennt weiterhin „Kreuzung“ als Art einer Bedingung („Vergleich“, „Kreuzung“, „Alle gelten (und)“ …). Die Oberfläche bietet sie nicht mehr an; Zeilen 70 und 89 derselben Datei sind dagegen angepasst. Widerspruch in der Dokumentation.
- **B2 (blockierend), Programmierbegriffe in Texten (Auftrag Punkt 4: „Commit“ ausdrücklich genannt):** `de.json`/`en.json` Schlüssel `revision.commit` und `revision.commitAt` („Commit {{commit}} …“) werden in `RevisionDisplay.tsx` angezeigt. Außerdem sichtbar: `about.repository` („Repository“) und `backend.*` („Backend: verbunden“, „Das Backend hat die Anfrage … abgelehnt“). Die Durchsicht hat diese Begriffe nicht neu gefasst und nicht als Ausnahme begründet.
- **H1 (Hinweis), fester Port im Code:** `frontend/vite.config.ts` Zeile 12 hat den Standardwert `http://127.0.0.1:8000`. Die Datei ist in diesem Commit nicht geändert; `sourceRules.test.ts` prüft nur `src`. Kriterium 3 des Auftrags nennt keinen Port im Code.
- **H2 (Hinweis):** In `properties/Instances.tsx` (Zeilen 149, 235, 274) steht der Datentyp weiterhin als Chip neben der Beschriftung von Eigenschaften einer Instanz. Punkt 1 betrifft die Felder; ob Instanzen gemeint sind, ist dem Auftrag nicht eindeutig zu entnehmen.

## Nicht geprüft
- Optische Wirkung der Oberfläche (nicht prüfbar); Textqualität nur nach Stichproben und Schlüsselgleichheit, nicht alle Sätze einzeln.
