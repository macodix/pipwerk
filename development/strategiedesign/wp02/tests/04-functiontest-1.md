# Testbericht Tester Funktion, Auftrag 04, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `feb2832c9bacc90932db0550b8e0f5262223b505` (Zweig `strategiedesign/wp02-04`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Prüfskript: unverändert, keine Änderung im Zweig `strategiedesign/wp02-functiontest`. Es liegt im geprüften Commit (`components/pipwerk-studio/scripts/check`, mit v2/v1-Schemaabgleich).

## Prüfskript `check --backend-port 18751 --frontend-port 18752`

Exitcode **1**. Bestanden: Bibliothek (`uv sync --frozen`, pytest 1445 Tests, ruff check, ruff format --check, mypy, Schemaabgleich v2 und v1); Backend (`uv sync --frozen`, pytest, ruff check, ruff format --check, mypy); Suche nach der Schreibweise des Namens (498 Nennungen); Oberfläche `npm ci`, Typprüfung, Build. Gescheitert sind nur zwei Schritte der bisherigen Oberfläche:

1. Vitest: 2 Tests und 24 Testdateien, alle mit derselben Ursache. `src/api/elementTypes.ts:193` wirft `ResponseFormatError: types[0].parameters[0].bindings`, weil die Oberfläche die Bindungsart `connection` nicht kennt.
   - Tests: `src/api/elementTypes.test.ts` › „reads the answer of the backend“ und „keeps conditions of parameters“.
   - Dateien (laden `src/testing/fixtures.ts`, 0 Tests ausgeführt): `Studio.canvas`, `Studio.expression`, `Studio.properties`, `Studio.settings`, `Studio.workflow`, `sourceRules`, `userDocumentation`, `api/objects`, `canvas/canvasEditing`, `canvas/flowModel`, `document/build`, `document/ops`, `document/own`, `document/parse`, `expression/fields`, `expression/scope`, `expression/useLiveNames`, `findings/findingText`, `findings/findingsModel`, `library/ElementLibrary`, `library/libraryModel`, `model/typeIndex`, `properties/specs`, `state/editorState`.
2. Browsertest: 108 von 129 Tests scheitern (36 je Chromium, Firefox, WebKit), 15 bestanden, 6 übersprungen. Alle 108 haben dieselbe Meldung: `expect(getByRole('button', { name: 'Neue Strategie' })).toBeEnabled()` schlägt fehl, weil die Oberfläche die Typbeschreibungen nicht lädt (gleiche Ursache wie 1). Je Browser: `designer.spec.ts` 9, `strategies.spec.ts` 10, `studio.spec.ts` 9, `testcases.spec.ts` 2, `workflows.spec.ts` 6.

Es scheitert nichts anderes. Der Auftrag 05 ersetzt diese Oberfläche; Abnahmekriterium 4 erlaubt dies ausdrücklich bei Nennung der einzelnen Fehlschläge.

## Eigene Prüfungen an der laufenden Testumgebung (`testenv start`, Ports 18751/18752, danach `testenv stop`)

- `GET /api/v1/element-types`: 32 Typen; Gruppen `when` 3, `actions` 8, `market` 4, `indicators` 4, `trends` 2, `rules` 2, `null` 9; kein Name, keine Beschriftung und keine Erklärung leer oder in Programmierschreibweise (maschinelle Prüfung über beide Sprachen). `trigger.manual_start` „Start von Hand“ (`when`), `ZigZag`, „Strategieparameter ändern“, „1-2-3-Trend (Markttechnik)“ (`trends`) vorhanden; Parameter `instrument` bei 11 Typen als `object`/`Instrument` mit der einzigen Auswahl und dem Standard `instrument_der_anwendung`; Bindungsart `connection` vorhanden.
- Testumgebung legt die gesicherte „EMA-Trendfolge“ in `.testenv/objects` ab. `GET /api/v1/strategies` listet sie mit `name`; Lesen liefert Format 2.0; `POST /api/v1/check` meldet keinen Befund; die Datei auf der Platte bleibt unverändert (Format 1.0, keine Änderung der Größe oder Zeit).
- `POST /api/v1/expressions`: gespeicherte Form, Anzeigeform (eckige Klammern), Bausteine (Kreuzung `up` ergibt `AND(PREVIOUS …)`), Schreibfehler (`blocks: null`, Befund `expression.invalid` mit Stelle), leerer Platz, ungültiger Zeiger (422, `expressions.pointer_invalid`), 51 Einträge (422). `POST /api/v1/keys`: „Stop abstand“ ergibt `stop_abstand_2` (Kennung belegt), Name über 200 Zeichen ergibt 422. Fehlerantworten tragen `code` und `params`.
- Tests nach Abschnitt 7 der Spezifikation sind vorhanden (Bibliothek: `test_forms_and_blocks`, `test_keys_and_instruments`, `test_consistency_v2`, `test_upgrade`, `test_testcases` mit null Befunden für `str-01`/`str-03`; Backend: `test_web_api_expressions`, `_keys`, `_format`, `_element_types`, `test_error_codes`, `test_testenv`, `test_web_api_documentation_examples`) und bestanden.
- Dokumentation (Punkt 13): `pipwerk-domain.md` (Abschnitte 6 bis 11, 10.1 Lesen von 1.0), `pipwerk-studio.md` (5.2.1 `/expressions`, 5.4 „Web-API ausprobieren“, Testumgebung), Glossar (alle genannten Begriffe) vorhanden; Anwenderdokumentation verweist auf die neue Stelle. Kein Pfad, Benutzername oder Rechnername des Entwicklungsrechners in Code, Dokumentation oder Verträgen (Suche); nur die Adresse des GitHub-Repositorys.

## Befunde

- Blockierend: keine.
- Hinweis: Der Exitcode des Prüfskripts bleibt 1, bis Auftrag 05 die Oberfläche ersetzt; Kriterium 4 des Auftrags gilt damit erst dann ohne Ausnahme.
- Hinweis: Ein Name aus Format 1.0 wie „zeiteinheit“ bleibt klein geschrieben (Umwandlung ohne `_`, Spezifikation 3.7 lässt das so); „Risiko je trade“ und „Kreuzen gegen die position“ stammen aus den alten Bezeichnungen.
- Nicht geprüft: Aussehen der Oberfläche (nicht Teil des Auftrags).
