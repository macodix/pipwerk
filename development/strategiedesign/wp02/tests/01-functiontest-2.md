# Testbericht Funktion – Auftrag 01, Durchlauf 2

- Bezug: `strategiedesign/wp02`, Prüfauftrag `development/strategiedesign/wp02/tests/01-2-order.md`
- geprüfter Commit: `a9aa37fc67852ba842b5039ef344208808e7c9c2` (Zweig `strategiedesign/wp02-01`; enthält den Merge-Commit `112af2f40f66655550666121a2c317e2de1dd400` mit Auftrag 03, Merge-Commit `eb2853aa768d9a6bbb411d92a2b117c6b3898f39`)
- Commit des Prüfskripts: `a9aa37fc67852ba842b5039ef344208808e7c9c2` – `components/pipwerk-studio/scripts/check` unverändert. Das Prüfskript deckt die Prüfungen aus Abnahmekriterium 1 und 2 weiter ab (Bibliothek, Backend, Schreibweise, `npm ci`, Typprüfung, Vitest, Build, Browsertest in drei Browsern). Eine Änderung war nicht nötig. Deshalb gibt es keinen Zweig `strategiedesign/wp02-functiontest`.
- Durchlauf: 2. Nachprüfung von B1 bis B3 und H1 bis H6 aus Durchlauf 1. Die Punkte 20 und 26 des Nachtrags habe ich vollständig geprüft.

## Ergebnis: nicht bestanden

Ein blockierender Befund (N1, neu an einer für Punkt 20 geänderten Stelle), drei Hinweise (N2 bis N4). B1 bis B3 und H1 bis H6 aus Durchlauf 1 sind erledigt.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| Ausgecheckter Commit | `a9aa37fc67852ba842b5039ef344208808e7c9c2` | `git rev-parse HEAD` im Arbeitsverzeichnis |
| Prüfskript `check --backend-port 18531 --frontend-port 18532` (ohne `--with-audit`) | Exitcode 0, „check: all checks passed“ | Bibliothek pytest 1013 passed; Backend pytest 742 passed (darunter `test_frontend_type_copy.py`, 3 Tests); ruff, ruff format, mypy, Schemata und Schreibweise bestanden; Vitest 42 Dateien, 728 Tests bestanden; Typprüfung und Build bestanden; Playwright 69 passed, 6 skipped (die Tests „ohne Git-Arbeitsbereich“, im Git-Arbeitsbereich vorgesehen übersprungen). Die Zahlen stimmen mit den Angaben des Entwicklers überein. |
| Zusammenführung mit Auftrag 03 | richtig | `git show --remerge-diff 112af2f…`: einziger Konflikt `src/testing/element-types.json`, gelöst mit der Fassung aus Auftrag 03. `git diff eb2853a a9aa37f -- …/src/testing/element-types.json` ist leer. `git diff --stat eb2853a 112af2f` zeigt nur Dateien der Oberfläche, `components/pipwerk-studio/README.md` und die drei Dokumente aus Auftrag 01. Bibliothek, Backend und Vertrag sind gleich der Fassung aus Auftrag 03. |
| Kriterium 3 (keine Typkenntnis in der Darstellung) | erfüllt | `src/sourceRules.test.ts` besteht. Eigene Suche im Code außerhalb der Tests nach `flow.*`, `trigger.*`, `gestellt`, `Kerzenschluss`, `candle_close`, `place_order`, `'Strategie'`, `'Order'`, `'Kerze'`: einziger Treffer ist die Kennung eines Befunds (`findings/findingText.ts:205`, `flow.unending_loop`). `defaultTrigger` und `src/model/timeUnits.ts` sind entfernt. |
| Punkt 20: Rahmen am Ausgang aus der Typbeschreibung, keine Verbindung von diesem Ausgang | erfüllt | `model/typeIndex.ts` `managementOutput` (Feld `holds_management`); `canvas/flowModel.ts:228`, `:271` (Kante beginnt am Ausgang); `canvas/layout.ts:62-63` (`connectable` falsch); `canvas/canvasEditing.ts:102-103` (`isValidConnection`). Tests mit erfundenem Typ `zz.launch`, Ausgang mit der Verwaltung an zweiter Stelle: `flowModel.test.ts:449-492`, `canvasEditing.test.ts`, `Studio.properties.test.tsx:545-556`. Die Zugehörigkeit steht weiter in `management_of`. |
| Punkt 20: Namensfeld nach `named` | erfüllt | `model/typeIndex.ts` `hasNameField`; `expression/scope.ts:165`. Test mit erfundenen Typen, auch gegen die Form der Beschreibung (`typeIndex.test.ts`, `Studio.properties.test.tsx:532-543`). |
| Punkt 20: Zeiteinheiten aus `choices` | nicht vollständig erfüllt, siehe N1 | Parameter von Elementen, Strategieparameter und Standardwert eigener Regelparameter erfüllt (Tests `Studio.properties.test.tsx:507-530`). Die Wertzeile eigener Parameter von Regeln und Instanzen bietet keine Zeiteinheit an. |
| Punkt 20: Strategieparameter in der Ausdruckseingabe | erfüllt | `expression/scope.ts:132-142` (Feld `strategy_parameters`); `scope.test.ts` mit erfundenem Objekt `Planet` und Gegenprobe ohne das Feld; Browsertest `designer.spec.ts:161` in drei Browsern bestanden |
| Punkt 26: leere neue Strategie, „Prüfen“ ohne Befund | erfüllt | `document/build.ts` `newStrategy()` ohne Elemente; Vitest `Studio.workflow.test.tsx` (leere Zeichenfläche, kein Auslöser, „Befunde: 0“); Browsertest `designer.spec.ts:139` in drei Browsern bestanden. Testumgebung (Ports 18541/18542): `POST /api/v1/check` mit leerem Dokument → 200, `{"findings":[],…}`. |
| Punkt 26: Übersetzungen der Befunde | erfüllt | `strategy.no_trigger` in `de.json` und `en.json` entfernt; `findingText.test.ts` vergleicht die Kennungen aus `docs/technical/pipwerk-domain.md` mit der Bibliothek und den Übersetzungen, mit Gegenprobe; die entfallene Kennung erscheint mit dem allgemeinen Text „Befund strategy.no_trigger“. |
| Punkt 26: Tests und Browsertests mit Auslöser aus der Elementbibliothek | erfüllt | `testing/actions.ts` `insertFromLibrary`; `Studio.workflow.test.tsx`, `designer.spec.ts:177-186` |
| Ableitung Dokument → Zeichenfläche → Dokument | erfüllt für `str-01` und `str-03` | `flowModel.test.ts:41-51` (`toEqual` und `toBe`), bestanden |
| Technische Dokumentation und Anwenderdokumentation zu den geänderten Stellen | bis auf N1 stimmig | `docs/technical/pipwerk-studio.md` Abschnitte 2.3, 6.2, 6.3, 9; `docs/user/pipwerk-studio.md` Abschnitte 3 und 6; `docs/technical/glossar.md` „Auslöser“, „Verwaltung (Rahmen)“. Keine Pfade, Benutzernamen oder Rechnernamen. Die Suche nach `no_trigger`, `defaultTrigger`, `timeUnits`, „ohne Zeiteinheit“ und „mindestens einen Auslöser“ in `docs/technical` und im Code der Oberfläche findet nur noch richtige Stellen. |
| Eigene Nachprüfung N1 | Befund bestätigt | vorübergehender Vitest-Test, nach der Prüfung entfernt; Ablauf unter N1 |
| Eigene Nachprüfung B1 | behoben | Testumgebung mit `curl`, Ablauf unter B1 |

Die Testumgebung habe ich danach mit `testenv stop` beendet. Dabei wird ihr Verzeichnis `.testenv/` mit beiden Objektverzeichnissen entfernt. Der vorübergehende Test und ein dabei entstandener Zwischenspeicher von Vitest sind entfernt. `git status --short` zeigt keine Ausgabe.

## Blockierende Befunde

### N1 – Eigener Parameter einer Regel oder Instanz vom Datentyp Zeiteinheit: Die Wertzeile bietet keine Zeiteinheit an

- Grundlage: Auftrag Punkt 5 (je Parameter eine Eingabe nach Datentyp, auch Zeiteinheit), Punkt 6 (neue Regel mit Parametern), Punkt 20 (Werte der Zeiteinheit aus der Typbeschreibung statt aus einer eigenen Liste); technisches Abnahmekriterium 6 (Dokumentation stimmt mit dem Code überein).
- Fundstellen:
  - `components/pipwerk-studio/frontend/src/properties/specs.ts:109`: `definitionSpecs` setzt `choices` nur aus `definition.choices`. Bei einer selbst definierten Zeiteinheit ist das eine leere Liste.
  - `src/properties/ValueInput.tsx:129-151`: `time_unit` wird jetzt wie eine Auswahl nur aus `choices` gefüllt. Vor diesem Commit füllte die eigene Liste `TIME_UNITS` die Eingabe unabhängig von `choices`. Der Diff `112af2f..a9aa37f` entfernt diesen Zweig und `src/model/timeUnits.ts`.
  - `timeUnitChoices` wird nur in `StrategyProperties.tsx:135-139` und für den Standardwert in `RuleProperties.tsx:119-123` eingesetzt, nicht in `definitionSpecs`.
  - Wege, die `definitionSpecs` nutzen: die Wertzeile einer Regel (`RuleProperties.tsx:207`) und die eigenen Parameter einer Instanz (`specs.ts:173`, `instanceParameterSpecs`).
- Sachverhalt, mit einem vorübergehenden Vitest-Test nachgewiesen (Oberfläche mit dem Backend im Speicher und den echten Typbeschreibungen):
  1. `str-03` öffnen, in der Strategie „Neue Regel“ wählen.
  2. „Parameter hinzufügen“ wählen und den Datentyp „Zeiteinheit“ setzen.
  3. Ergebnis: Der „Standardwert von parameter“ bietet „bitte wählen|M1|M2|…|MN1“ an.
  4. „Bindungsart von parameter“ auf „fester Wert“ stellen.
  5. Ergebnis: Die Wertzeile `parameter` bietet nur `["bitte wählen"]` an.
  Der Anwender kann einem eigenen Parameter einer Regel deshalb keine Zeiteinheit als festen Wert geben. Für eigene Parameter einer Instanz gilt dasselbe, weil sie denselben Weg nehmen (`specs.ts:173`). Diesen Fall habe ich aus dem Code abgeleitet und nicht eigens ausgeführt.
- Dokumentation: `docs/technical/pipwerk-studio.md` Abschnitt 2.3, Punkt „Werte der Zeiteinheit“, sagt: „Für einen Strategieparameter oder Parameter einer Regel vom Datentyp Zeiteinheit, zu dem es keine Beschreibung gibt, nimmt `timeUnitChoices` die `choices` …“. Für die Wertzeile eines Parameters einer Regel trifft das nicht zu.
- Kein Test deckt die Wertzeile eines eigenen Parameters vom Datentyp Zeiteinheit ab. `Studio.properties.test.tsx:507-530` prüft nur den Parameter eines Typs und den Strategieparameter.

## Hinweise (verhindern das Bestehen nicht)

### N2 – Vorschläge der Ausdruckseingabe zeigen den Datentyp als Kennung

`src/expression/scope.ts:138` (neu für die Strategieparameter) setzt `detail: parameter.datatype`. `ExpressionInput.tsx:145` zeigt das neben dem Vorschlag an, also zum Beispiel `time_unit` oder `number` auch in der deutschen Oberfläche. Die Übersetzungen dafür gibt es (`de.json:47-54`, `datatype.*`). Dieselbe Art steht schon vorher bei Eigenschaften und eigenen Parametern (`scope.ts:48`, `:111`, `:184`).

### N3 – Fachdokumente nennen weiter „mindestens einen Auslöser“

`docs/design/requirements/anforderungen-strategiedesigner.md:135` und `docs/design/domain/fachmodell.md:331` sagen „Eine Strategie hat mindestens einen Auslöser“. Das widerspricht der Entscheidung vom 2026-10-18 (Spezifikation 3.6 und 5.2) und dem berichtigten Glossar. Diese Dokumente gehören nicht zum Umfang von Auftrag 01. Nach dem Änderungsvermerk der Spezifikation liegt der Abgleich (H7, `reviews/requirements-8.md` B1) beim Projektleiter.

### N4 – Testkopie der Typbeschreibungen

Erledigt durch Auftrag 03 (Hinweis H4 aus Durchlauf 1): `components/pipwerk-studio/backend/tests/test_frontend_type_copy.py` gleicht die Kopie mit der Web-API ab und besteht. Einen eigenen Byte-Vergleich mit der Antwort der Testumgebung konnte ich in dieser Sitzung nicht ausführen; der Abruf selbst gelang (`GET /api/v1/element-types`, Ports 18541/18542).

## Nachprüfung der Befunde und Hinweise aus Durchlauf 1

| Punkt | Stand | Nachweis |
|---|---|---|
| B1 Speichern nach Verzeichniswechsel ohne Verschieben | behoben | Testumgebung: `POST /api/v1/strategies` mit `str-03` → 201 (Kennung `0128c3ff-…`). `PUT /api/studio/settings/object-directory` mit neuem Verzeichnis, `"move": false` → 200. `PUT /api/v1/strategies/0128c3ff-…` → **201**. Die Datei liegt danach im neuen Verzeichnis. Die Oberfläche nimmt 201 wie 200 an (`api/http.ts:97`, `response.ok`); Test `api/objects.test.ts:134`, Backend im Speicher `testing/backend.ts:30-31`, `:129`. |
| B2 Listen nach Verzeichniswechsel | behoben | `dialogs/SettingsDialog.tsx:61` `invalidateQueries({ queryKey: ['objects'] })`; Tests in `Studio.settings.test.tsx` mit Gegenprobe bei Abbrechen und Fehler bestanden |
| B3 Wartezeit in der Dokumentation | behoben | `pipwerk-studio.md:157` „400 Millisekunden (`NAMES_DEBOUNCE_MS`)“ = `useLiveNames.ts:11`. Übrige Zeitangaben geprüft: `REQUEST_TIMEOUT_MS` 10 Sekunden (`api/http.ts:7`), `LANGUAGE_REQUEST_TIMEOUT_MS` 10 Sekunden (`settingsApi.ts:25`). |
| H1 Stellen nach Punkt 4, zweiter Absatz | erledigt | Rahmen am Ausgang und Strategieparameter über die neuen Felder (siehe Tabelle oben); Abschnitt 2.3 nennt nur noch die zwei Ableitungen, die der Softwarearchitekt bestätigt hat |
| H2 Vergleich in `useLiveNames.ts` | erledigt | `useLiveNames.ts:26-32` lässt nur `x`/`y` der Elemente weg; Test mit Parameter `x` vorhanden und bestanden |
| H3 Prozentwerte ohne „NaN“ | erledigt | Tests in `ValueInput.test.tsx` (auch unter 1e-6) bestanden |
| H4 Testkopie ohne Abgleich | erledigt | siehe N4 |
| H5 Browsertest wartet auf das zweite `PUT` | erledigt | `designer.spec.ts` wartet auf die Antwort des `PUT`, bevor die Datei gelesen wird; bestanden in drei Browsern |
| H6 Zahleneingabe | erledigt | `.5` angenommen, Exponent abgelehnt, Hinweis am Feld; Tests in `ValueInput.test.tsx` bestanden; Anwenderdokumentation Abschnitt 3 beschreibt es |

## Vom Entwickler gemeldete Angaben

- Vitest 728, Browsertests 69 bestanden und 6 übersprungen, Bibliothek 1013, Backend 742, Prüfskript Exitcode 0: stimmt mit meinem Lauf überein.
- „Zeiteinheiten aus `choices` (`model/timeUnits.ts` entfernt)“: für Parameter von Typen und für Strategieparameter zutreffend, für eigene Parameter von Regeln und Instanzen nicht (N1).
- Keine neue npm-Abhängigkeit: `package.json` und `package-lock.json` sind im Diff `112af2f..a9aa37f` nicht enthalten.
