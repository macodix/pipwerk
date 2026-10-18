# Testbericht Tester Funktion – Auftrag 02, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/02-1-order.md`
- geprüfter Commit: `b9cc906c6981a927961ca9bd08cbd51f01249529` (Zweig `strategiedesign/wp02-02`), im eigenen Arbeitsverzeichnis ausgecheckt und mit `git rev-parse HEAD` bestätigt
- Prüfskript: `components/pipwerk-studio/scripts/check` unverändert auf dem geprüften Commit; letzter Commit, der das Prüfskript ändert: `f7e234cb3e5dd34e0934f6e9b817dc353c247d52`. Eine Änderung war nicht nötig. Die neuen Tests laufen ohne Änderung mit: Vitest nimmt `src/**/*.test.{ts,tsx}` auf (`vite.config.ts`, Zeile 53), der Browsertest nimmt alle Dateien unter `e2e/` auf. Deshalb gibt es keinen Zweig `strategiedesign/wp02-functiontest`.
- Umfang: erster, vollständiger Durchlauf nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ergebnis

**nicht bestanden**

Ein blockierender Befund (B1): Die technische Dokumentation beschreibt das Zielverzeichnis des Browsertests „Objektverzeichnis ändern“ anders, als der Code es anlegt. Das widerspricht dem technischen Abnahmekriterium 5 und dem Wortlaut von Umfang Punkt 2 des Auftrags. Alle übrigen Prüfungen sind bestanden. Die Hinweise H1 bis H3 verhindern das Bestehen nicht.

## Ausgeführte Prüfungen

### Prüfskript

Aufruf: `components/pipwerk-studio/scripts/check --backend-port 18741 --frontend-port 18742`, ohne `--with-audit`. Die Ports waren vorher frei (Ausgabe von `ss -ltn`) und sind weder 5174 noch 8001.

| Schritt | Ergebnis |
| --- | --- |
| library: uv sync, pytest, ruff check, ruff format --check, mypy, Schemata gleich `contracts/strategies/v1` | bestanden; pytest 1013 passed |
| backend: uv sync, pytest, ruff check, ruff format --check, mypy | bestanden; pytest 742 passed |
| Schreibweise des Namens | bestanden |
| frontend: npm ci, typecheck, Vitest, build | bestanden; Vitest 43 Testdateien, 784 Tests bestanden |
| Browsertest (Chromium, Firefox, WebKit) | bestanden; 123 passed, 6 skipped |
| Gesamt | „check: all checks passed“, **Exitcode 0** |

Die 6 übersprungenen Browsertests sind genau die bestehenden Tests, die vom Git-Arbeitsbereich abhängen, je Browser zwei: `e2e/studio.spec.ts:230` („shows no tooltip without a Git working tree“) und `e2e/studio.spec.ts:352` („shows unknown in the dialog without a Git working tree“). Technische Abnahmekriterien 1 und 2 sind damit erfüllt. Die Angaben des Entwicklers (784 Vitest, 123 bestanden und 6 übersprungen) stimmen.

### Technisches Abnahmekriterium 3: Tests aus Punkt 1 bis 3 und Vergleich

- **Aufbau nur über Bedienhandlungen** (`e2e/testcases.spec.ts`, `e2e/builder.ts`): Der Ablauf ist „Neue Strategie“ mit Prüfung auf 0 Knoten, Bezeichnung und Beschreibung, „Parameter hinzufügen“, „Vorlage aus der Elementbibliothek“ mit „Hinzufügen“, Ziehen der Einträge der Elementbibliothek auf die Zeichenfläche (`dragTo`) und in den Rahmen, Bindungsart und Werte in der Eigenschaftenansicht, Ausdrücke in der Ausdruckseingabe (combobox), „Neue Regel“ und Verbindungen mit der Maus (`drag`). Die Web-API wird nur gelesen: `GET /api/v1/element-types` für die Beschriftungen und nach dem Speichern `GET /api/v1/strategies…` und `POST /api/v1/check` für den Vergleich. Es wird kein Dokument eingespielt. Erfüllt.
- **Vergleich vollständig** (`withoutIdentifiersAndPositions` in `e2e/support.ts`, Zeilen 200 bis 227): Verglichen werden alle Felder der obersten Ebene des Schemas außer `id`: `format`, `format_version`, `title`, `description`, `parameters`, `rules`, `elements`, `connections`. Das deckt sich mit `contracts/strategies/v1/strategy.schema.json` (Zeilen 513 bis 571, `additionalProperties: false`). Bei den Elementen fallen nur `id`, `x` und `y` weg. `management_of` und die Verbindungen werden zur Stelle in der Liste umgerechnet. Alles andere vergleicht `toEqual`, auch Instanzen, Belegungen, Regeln und `origin.template_id`. Zeitpunkte stehen nicht im Dokument. Erfüllt. Der Test läuft in allen drei Browsern grün (Ausgabe des Prüfskripts, Tests 122 und 123 in WebKit und die entsprechenden in Chromium und Firefox). Damit ergibt der Vergleich für beide Testfälle Gleichheit. Nach dem Speichern meldet `POST /api/v1/check` keinen Befund, in der Oberfläche ist kein Element umrandet.
- **`str-01` mit Rahmen**: Einklappen und Aufklappen über „Verwaltung „Order aufgeben“ einklappen/aufklappen“ mit Prüfung der Zahl der Knoten und von `aria-expanded`, vor dem Speichern und nach dem Öffnen. „Schließen“ fragt danach nicht. Erfüllt.
- **Abdeckung der Abnahmekriterien von `wp02`**:

| Abnahmekriterium | Test |
| --- | --- |
| 2 leere Zeichenfläche, „Prüfen“ ohne Befund | `e2e/designer.spec.ts:78` (aus Auftrag 01); Befund der fehlenden Zeiteinheit an „Kerzenschluss“ aus der Bibliothek: `e2e/workflows.spec.ts:157` |
| 5 rot, orange, Text bei Auswahl, Befund ohne Element bei der Strategie, keine Meldung | `e2e/workflows.spec.ts:157` und `:203` (orange mit ersetzter Antwort, begründet und dokumentiert) |
| 7 Rückfragen vor „Schließen“, „Neue Strategie“, „Öffnen“ | `e2e/strategies.spec.ts:34`, `:51`, `:66`, `:88` |
| 8 Liste mit Bezeichnung, Beschreibung, letzter Änderung; Löschen nach Rückfrage | `e2e/strategies.spec.ts:106`, `:139` |
| 9 Objektverzeichnis mit und ohne Verschieben, Sprache nach Neuladen | `e2e/workflows.spec.ts:49`, `:72`, `:104`, `:125` (siehe B1) |
| 10 Regeln der Strategie und von „Order aufgeben“, Befund bei der Regel, Herkunft | `e2e/strategies.spec.ts:167`, `:221`, `:251` |
| 11 unbekannter Elementtyp | `e2e/strategies.spec.ts:265` |

### Technisches Abnahmekriterium 4: Ausdrücke der Anleitung

`src/userDocumentation.test.ts` liest `docs/user/pipwerk-studio.md` und vergleicht die Kästen ```` ```ausdruck ```` der Abschnitte 9 und 10 Zeichen für Zeichen und in der Reihenfolge mit den Ausdrücken der Testfalldokumente. Ausgenommen sind die Kopien der Vorlage „Risiko je Trade“, die der Anwender nicht tippt. Außerdem prüft der Test Bezeichnungen, Namen, Werte und Verbindungen und hat Gegenproben. Der Test besteht im Vitest-Lauf. Stichprobe von Hand: Die Ausdrücke in Abschnitt 9.2 und 9.4 der Anleitung stimmen mit `contracts/strategies/v1/testcases/str-03.strategy.json` überein (Zeilen 218, 236, 254, 277, 282, 299, 336, 354, 385, 403, 421). Erfüllt.

### Technisches Abnahmekriterium 5 und Dokumentation

- Im Diff `f42b0ab..b9cc906` stehen keine Pfade, Benutzernamen oder Rechnernamen des Entwicklungsrechners (Suche nach `/home/`, `/srv/`, `/tmp/`, Rechner- und Benutzernamen, festen Adressen mit Port: kein Treffer).
- Anwenderdokumentation gegen Oberfläche und Code, Stichproben: Texte der Oberfläche wie „Vorlage aus der Elementbibliothek“, „Zurück zu …“, „Eigenschaften der Order“, „keine (nur prüfend)“, „nicht belegt“ (auch beim „Vergleich beim Prüfen“, `RuleProperties.tsx`, Zeile 343), „Verwaltung „…“ einklappen“, „Name des Parameters …“, „Datentyp von …“ stimmen mit `src/locales/de.json` überein. Weitere Stichproben stimmen mit dem Code überein: „Ordertyp: Marktorder, voreingestellt“ (`document/build.ts`, Zeilen 29 bis 35: erster Wert der Auswahl bei Pflichtparameter nur mit festem Wert), die Zeiteinheiten als `H1`/`M15` (`typedesc.py`, Zeilen 215 bis 217), die Gruppen und Einträge der Elementbibliothek, Prozent als Prozent (`ValueInput.tsx`).
- Glossar: Die Anwenderdokumentation stimmt bei „Auslöser“ (freiwillig, auch in der Verwaltung, Abschnitte 3, 6.1, 6.2 Punkt 2, Glossar Abschnitt 12) und „Verwaltung“ (Ausgang „gestellt“, kann eigene Auslöser haben) mit `docs/technical/glossar.md` (Zeilen 37, 39, 40) überein. Die Einträge „Zeiteinheit“ und „Datentyp“ sind ergänzt, mit Zeile im Änderungsnachweis.
- Hinweis H3 aus `plan-2.md` steht in der Anwenderdokumentation (Abschnitte 2, 5 und 11). Hinweis H4 steht in der technischen Dokumentation (Abschnitt 2.3, Absatz „Nachweise zur Speicherung der Sprache“, mit Test des Backends). Der genannte Test `test_language_persists_across_real_backend_process_restarts` gehört zum bestandenen Backend-Lauf.
- Abschnitt 6.3 der technischen Dokumentation beschreibt die neuen Browsertests und `src/userDocumentation.test.ts`. Abweichung siehe B1.

### Programmierregeln

Keine Verstöße gefunden: Die Ports kommen aus Umgebungsvariablen des Prüfskripts. Die Tests sind isoliert (`useCleanRun`: Sprache vor jedem Test, danach Wiederherstellen und Leeren des Objektverzeichnisses). Die temporären Verzeichnisse werden entfernt. `page.route` steht nur in einem Test. Es gibt keine Änderung am Produktionscode. Abhängigkeiten sind unverändert (`package.json` und `package-lock.json` sind nicht im Diff). Im Arbeitsverzeichnis blieben nach dem Lauf nur von Git ignorierte Bau- und Zwischenspeicherdateien (`git status --short --ignored`).

## Befunde

### B1 (blockierend): Zielverzeichnis des Tests „Objektverzeichnis ändern“ liegt nicht im temporären Verzeichnis des Laufs, die technische Dokumentation sagt das Gegenteil

- Fundstelle Code: `components/pipwerk-studio/frontend/e2e/workflows.spec.ts`, Zeilen 40 bis 43: `target = mkdtempSync(join(tmpdir(), 'pipwerk-studio-e2e-target-'))`. Das ist ein eigenes, neues Verzeichnis direkt im temporären Verzeichnis des Betriebssystems. Es liegt nicht in dem temporären Verzeichnis des Laufs, das `e2e/start-backend.mjs` (Zeile 32) anlegt und beim Ende des Backends entfernt. Der Kommentar in Zeile 41 („A directory of the run, next to the object directory of the backend“) trifft deshalb ebenfalls nicht zu.
- Fundstelle Dokumentation: `docs/technical/pipwerk-studio.md`, Zeile 699: „in den Einstellungen das Verzeichnis auf ein anderes Verzeichnis im temporären Verzeichnis des Laufs ändern“. Zeile 690 bestimmt das „temporäre Verzeichnis je Lauf“ als das Verzeichnis von `start-backend.mjs`.
- Sachverhalt: Die Dokumentation stimmt hier nicht mit dem Code überein (technisches Abnahmekriterium 5). Der Test erfüllt außerdem nicht den Wortlaut von Umfang Punkt 2 des Auftrags („auf ein anderes Verzeichnis im temporären Verzeichnis des Laufs“). Folge im Betrieb: Wird ein Lauf hart abgebrochen, laufen die `afterEach`-Hooks nicht. Das Zielverzeichnis bleibt dann im temporären Verzeichnis des Betriebssystems liegen, weil das Aufräumen von `start-backend.mjs` es nicht erfasst.

## Hinweise (nicht blockierend)

- **H1**: `docs/technical/pipwerk-studio.md`, Zeile 699: „stellt es danach über die Web-API wieder her“. `useCleanRun` (`e2e/support.ts`, Zeilen 86 bis 88) verwendet aber den internen Endpunkt `PUT /api/studio/settings/object-directory`, nicht die öffentliche Web-API unter `/api/v1/`. Das Dokument trennt beide sonst (Abschnitt 1 und 5).
- **H2**: Der Eintrag „Datentyp“ im Glossar der Anwenderdokumentation (`docs/user/pipwerk-studio.md`, Zeile 982) nennt „Objekt“ nicht. `docs/technical/glossar.md` und `DataType` in `packages/domain-core/src/pipwerk_domain/typedesc.py` (Zeile 22) enthalten es.
- **H3**: Abnahmekriterium 7 von `wp02`: Vor „Öffnen“ und „Neue Strategie“ wird nur die Antwort „Speichern“ im Browser geprüft. „Verwerfen“ und „Abbrechen“ sind nur vor „Schließen“ geprüft (`e2e/strategies.spec.ts`, Zeilen 34 bis 86). Laut technischer Dokumentation (Abschnitt 6.3, Vitest-Tests der Arbeitsabläufe) sind die Rückfragen in Vitest abgedeckt.

## Vorherige Befunde

Keine, erster Durchlauf.
