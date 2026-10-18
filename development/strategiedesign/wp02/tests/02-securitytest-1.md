# Testbericht Tester Sicherheit – Auftrag 02, Durchlauf 1

- Bezug: `strategiedesign/wp02`, Auftrag 02 (mit Abschnitt „Fortsetzung vom 2026-10-18“)
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/02-1-order.md`
- geprüfter Commit: `b9cc906c6981a927961ca9bd08cbd51f01249529` (Zweig `strategiedesign/wp02-02`), ausgecheckt und mit `git rev-parse HEAD` bestätigt
- enthaltener Arbeitszweig: `f42b0ab4fe570cf75692a4be039eabe6e6544b6d` (`git merge-base --is-ancestor` bestätigt)
- Prüfgrundlagen: Auftrag 02, `docs/technical/development-test-security-rules.md` (Abschnitte 5, 7, 8, 9), `docs/technical/entwicklungsverfahren.md` („Umfang der Prüfungen“), BSI IT-Grundschutz CON.8, APP.7, OPS.1.1.3, OPS.1.1.6, OWASP ASVS (Ausgabekodierung, Konfiguration, Abhängigkeiten), OWASP API Security Top 10
- Durchlauf: 1, vollständig

## Ergebnis: bestanden

Es gibt keinen blockierenden Befund. Die Hinweise unten verhindern das Bestehen nicht.

## Umfang der Änderung

`git diff --stat f42b0ab4fe570cf75692a4be039eabe6e6544b6d b9cc906c6981a927961ca9bd08cbd51f01249529` nennt 10 Dateien:

- Browsertests und Hilfen: `components/pipwerk-studio/frontend/e2e/builder.ts`, `designer.spec.ts`, `strategies.spec.ts`, `support.ts`, `testcases.spec.ts`, `workflows.spec.ts`
- Vitest: `components/pipwerk-studio/frontend/src/userDocumentation.test.ts`
- Dokumentation: `docs/technical/glossar.md`, `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md`

Der Vergleich der eigenen Commits des Auftrags (`4ffbcb8..2e0fd2a` und `fc58f4d..b9cc906`) ergibt dieselben Dateien.

## Prüfungen und Nachweise

| Nr. | Prüfpunkt (Übergabedokument) | Ergebnis | Nachweis |
|---|---|---|---|
| 1 | Keine Änderung am Produktionscode, die Texte als HTML auswertet | erfüllt | `git diff --name-only f42b0ab… HEAD -- components contracts` ohne `e2e/` und `*.test.ts`: keine Datei. Im Produktionscode ist nichts geändert. Suche in den hinzugefügten Zeilen nach `innerHTML`, `dangerouslySetInnerHTML`, `outerHTML`, `insertAdjacentHTML`, `DOMParser`: kein Treffer. `src/sourceRules.test.ts` (Verbot von `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `Trans`) besteht im Vitest-Lauf. |
| 2 | Abhängigkeiten unverändert | erfüllt | `git diff --stat f42b0ab… HEAD` für `package.json`, `package-lock.json`, `pyproject.toml`, `uv.lock`, `playwright.config.ts`, `vite.config.ts`: keine Änderung. `npm ci` ohne Änderung am Lockfile, `uv sync --frozen` für Bibliothek und Backend bestanden (Prüfskript). |
| 3 | `page.route` bleibt auf die Tests beschränkt | erfüllt | `grep -rn` nach `page.route`, `context.route`, `route.fulfill` in `frontend/src` und `frontend/e2e`: neu nur `e2e/workflows.spec.ts:209` und `:216` (Ersetzen der Antwort von `POST /api/v1/check` für die orange Umrandung). `e2e/studio.spec.ts:502` ist unverändert vorhanden. In `src/` kein Treffer. Der Ersatz gilt nur für die Seite dieses einen Tests. Die technische Dokumentation (Abschnitt 6.3 und Abschnitt „nicht umgesetzt“) beschreibt ihn. |
| 4 | Browsertests schreiben nicht außerhalb ihres temporären Verzeichnisses | erfüllt, mit Hinweis H1 | Das Objektverzeichnis des Backends liegt in dem Verzeichnis, das `e2e/start-backend.mjs` mit `mkdtempSync` anlegt und nach dem Ende entfernt (unverändert). Neu schreibt `strategies.spec.ts` eine nicht lesbare Datei in dieses Objektverzeichnis und entfernt sie im `finally`. `workflows.spec.ts` legt das Zielverzeichnis mit `mkdtempSync(join(tmpdir(), 'pipwerk-studio-e2e-target-'))` an und entfernt es in `afterEach` mit `rmSync`. Nach dem Lauf des Prüfskripts zeigt `git status --short` im Arbeitsverzeichnis keine Datei. Den Inhalt des Systemverzeichnisses für temporäre Dateien konnte ich in dieser Sitzung nicht ansehen (keine Leseberechtigung). Für diesen Teil stützt sich die Aussage auf den Code. |
| 5 | Browsertests stellen das Objektverzeichnis wieder her | erfüllt | `e2e/support.ts`, `useCleanRun`: Jeder der drei Tests, die das Verzeichnis ändern, merkt sich das ursprüngliche Verzeichnis als Annotation `object-directory` **vor** der Änderung (`workflows.spec.ts`). `afterEach` stellt es mit `PUT /api/studio/settings/object-directory` (`move: false`) wieder her, prüft die Antwort mit `expect(restored.ok())` und löscht danach alle Strategien. Das läuft auch, wenn der Test fehlschlägt. Alle 123 Browsertests bestehen in drei Browsern nacheinander. |
| 6 | Keine festen Ports, Pfade, Rechnernamen oder Zugangsdaten in Code, Tests und Dokumentation | erfüllt, mit Hinweis H2 | Suche in den hinzugefügten Zeilen nach `localhost`, `127.0.0.1`, `0.0.0.0`, `http:`/`https:`: kein Treffer. Nach `/srv`, `/home`, `/tmp`, `/Users`, `/var/`, `aixlab`, `~/`: kein Treffer. Nach `passw`, `secret`, `token`, `api_key`, `credential`, `bearer`, `BEGIN `: kein Treffer. Die neuen Tests verwenden relative Adressen über `baseURL` und `tmpdir()`. Dateien des Repositorys finden sie über den Ort der Testdatei (`import.meta.url`, `import.meta.dirname`). Die Anwenderdokumentation nennt Pfade nur relativ zum Repository und Ports als Platzhalter. |
| 7 | Prüfskript auf freien Ports | bestanden | `components/pipwerk-studio/scripts/check --backend-port 28417 --frontend-port 28418` (nicht 5174 und 8001; vorher mit `ss -ltn` geprüft, dass die Ports frei sind): Exitcode 0, „check: all checks passed“. Bibliothek: pytest 1013 bestanden. Frontend: Vitest 784 bestanden in 43 Dateien. Browsertests: 123 bestanden und 6 übersprungen (die bestehenden Tests ohne Git-Arbeitsbereich). Typprüfung, Build, Ruff, mypy bestanden. |
| 8 | Eingaben an der Systemgrenze, Web-API | nicht berührt | Backend und Web-API sind nicht geändert. Der Test zum unbekannten Elementtyp legt sein Dokument über die Web-API an. So erlaubt es Auftrag 02, Umfang Punkt 3. |
| 9 | Dokumentation: Sicherheitshinweise | erfüllt | Anwenderdokumentation Abschnitt 2 warnt vor `--host` (keine Anmeldung, Objektverzeichnis änderbar) und enthält Hinweis H3 (`testenv stop` entfernt Dateien nur unter `.testenv/`, Zeilen 45, 243, 954). |
| 10 | Glossar, Datenschutz | erfüllt | Neue Einträge „Zeiteinheit“ und „Datentyp“ ohne Bezug zu Personen, Rechnern oder Zugangsdaten. |

## Befundliste

Blockierende Befunde: keine.

### Hinweise

- **H1 – Lage des Zielverzeichnisses im Test „Objektverzeichnis ändern“.** Fundstelle: `components/pipwerk-studio/frontend/e2e/workflows.spec.ts`, `beforeEach` im Block „settings: the object directory“ (`mkdtempSync(join(tmpdir(), 'pipwerk-studio-e2e-target-'))`). Sachverhalt: Das Zielverzeichnis ist ein eigenes temporäres Verzeichnis neben dem Verzeichnis des Laufs, das `start-backend.mjs` anlegt. Es liegt nicht in diesem Verzeichnis. Der Kommentar im Test sagt das so („next to the object directory of the backend“). Auftrag 02, Umfang Punkt 2, und `docs/technical/pipwerk-studio.md` Abschnitt 6.3 sprechen dagegen von „einem anderen Verzeichnis im temporären Verzeichnis des Laufs“. Die Dokumentation stimmt hier nicht mit dem Code überein. Sicherheitlich ist das keine Lücke: `mkdtempSync` legt das Verzeichnis eindeutig an, und `afterEach` entfernt es. Wird der Lauf hart abgebrochen (`SIGKILL`), bleibt das Verzeichnis zurück, anders als das Verzeichnis des Laufs, das `start-backend.mjs` beim Beenden entfernt. Zusätzlich: `afterEach` des Blocks entfernt das Zielverzeichnis, bevor `useCleanRun` das Objektverzeichnis wiederherstellt. Schlägt das Wiederherstellen fehl, zeigt das Backend bis zum Ende des Laufs auf ein entferntes Verzeichnis außerhalb des Verzeichnisses des Laufs. Der Test schlägt dann sichtbar fehl.
- **H2 – fester Port in der Anwenderdokumentation (Bestand).** Fundstelle: `docs/user/pipwerk-studio.md` Zeile 127 („`http://127.0.0.1:5173/`“, Entwicklungsbetrieb). Sachverhalt: Die Zeile war schon auf `f42b0ab…` vorhanden (dort Zeile 112). Dieser Commit hat sie nicht eingeführt. Sie nennt den Standardport des Entwicklungsservers, keinen Wert des Entwicklungsrechners.
- **H3 – bekannte Schwachstelle in einer Entwicklungsabhängigkeit (Bestand).** Fundstelle: `components/pipwerk-studio/frontend/package-lock.json`. Sachverhalt: `npm audit` meldet `source-map-js` 1.2.1, Stufe „high“, GHSA-68fv-2mgg-jv7q (Blockade der Ereignisschleife durch präparierte Source-Maps). Über `vite` → `postcss` und `jsdom` → `css-tree` wird sie eingebunden (`npm ls source-map-js`). Das Lockfile ist in diesem Commit unverändert. Zuletzt geändert wurde es in `41386583f37a2a50960829c5e761a2daf6bade59`. Betroffen sind nur Build- und Testwerkzeuge, nicht die ausgelieferte Oberfläche. Die Aktualisierung der Abhängigkeit gehört nicht zu Auftrag 02 (Abhängigkeiten sollen unverändert bleiben). Eine Entscheidung darüber liegt beim Softwarearchitekten (Regel 8.2 Punkt 9, OPS.1.1.3).

## Bereinigung

Im Arbeitsverzeichnis habe ich nichts committet und keinen Code geändert. `npm ci` und das Prüfskript haben nur ignorierte Verzeichnisse erzeugt oder ersetzt (`node_modules`, `dist`, `dist-e2e`, `test-results`, Caches). `git status --short` ist leer.
