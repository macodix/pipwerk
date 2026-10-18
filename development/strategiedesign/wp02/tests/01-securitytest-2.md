# Testbericht Sicherheit – Auftrag 01, Durchlauf 2

- Bezug: `strategiedesign/wp02`
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/01-2-order.md`
- geprüfter Commit: `a9aa37fc67852ba842b5039ef344208808e7c9c2` (Zweig `strategiedesign/wp02-01`). Er enthält `fd2dddad6a934932c3dfacd5e95e834544f1f5ff` (erster Teil des Nachtrags) und den Merge-Commit `112af2f40f66655550666121a2c317e2de1dd400` mit dem Arbeitszweig und Auftrag 03 (`eb2853aa768d9a6bbb411d92a2b117c6b3898f39`).
- vorheriger Durchlauf: `01-securitytest-1.md` zum Commit `f22b0a98f3ef22d649fd1dc85bdeb2f91436a3b4` (bestanden, H1 bis H3)
- Prüfskript: `components/pipwerk-studio/scripts/check` im geprüften Commit, unverändert
- Prüfgrundlagen: Auftrag `orders/01.md`, Nachtrag Punkte 17 bis 26, besonders 20, 24 und 26; `docs/technical/development-test-security-rules.md`; `docs/technical/pipwerk-studio.md`; `docs/technical/entwicklungsverfahren.md` Abschnitt „Umfang der Prüfungen“; BSI-Grundschutz (CON.8, APP.7); OWASP ASVS und API Security Top 10
- Durchlauf: zweiter. Für H1 bis H3 ist er eine Nachprüfung. Die neuen Stellen aus dem Übergabedokument habe ich vollständig geprüft.

## Ergebnis: nicht bestanden

Ein blockierender Befund (B1). Drei Hinweise (H1 bis H3).

## Durchgeführte Prüfungen und Nachweise

1. **Arbeitsverzeichnis.** Das Arbeitsverzeichnis bestand schon (`test -e …/.git`). Danach habe ich `git fetch origin` und `git checkout --detach a9aa37fc…` ausgeführt. `git rev-parse HEAD` ergab `a9aa37fc67852ba842b5039ef344208808e7c9c2`. `f22b0a98…` ist ein Vorfahre des Commits. Die Commits auf dem ersten Elternpfad seit Durchlauf 1 sind `fd2ddda`, `112af2f` und `a9aa37f`. Nach allen Läufen meldete `git status --short` keine Änderungen.

2. **Zusammenführung mit Auftrag 03.** `git diff eb2853a 112af2f` außerhalb von `components/pipwerk-studio/frontend` und `docs` ändert nur `components/pipwerk-studio/README.md`. Die Änderung ist eine Beschreibung ohne Pfade oder Rechnernamen. Backend, Bibliothek, Verträge und Skripte entsprechen also genau dem geprüften Stand von Auftrag 03. `git diff eb2853a a9aa37f -- …/src/testing/element-types.json` ist leer. Die Testkopie stammt also unverändert aus Auftrag 03.

3. **H2 – Schlüssel `__proto__` in Belegungen (Punkt 24).**
   - `src/document/own.ts` bietet `hasOwn`, `getOwn`, `setOwn` und `removeOwn`. `setOwn` verwendet `Object.defineProperty`, `getOwn` liest nur eigene Felder. Das ist korrekt.
   - Umgestellt sind `parse.ts:42`, `ops.ts:104-106` (`setBindingIn`), `build.ts` `defaultBindings` (Z. 28, 35), `RuleProperties.tsx` (Umbenennen und Entfernen eines Parameters, Lesen der Belegung), `ElementProperties.tsx`, `specs.ts` und `expression/fields.ts`.
   - Kopien entstehen mit Objekt-Spread (`{ ...bindings }`) und `JSON.parse(JSON.stringify(…))`. Beide legen `__proto__` als eigenes Feld an. `useLiveNames.ts` vergleicht jetzt ohne `x`/`y` der Elemente und lässt keine Belegungen mehr aus.
   - `src/document/own.test.ts` lädt ein Dokument mit `__proto__` an Element, Instanz und Regel. Der Test ändert es, leitet ab und vergleicht. Er prüft auch den Prototyp und hat eine Gegenprobe.
   - Eine Stelle derselben Art ist nicht umgestellt, siehe **B1**.
   - Weitere Zugriffe mit Schlüsseln habe ich durchsucht. Sie sind unbedenklich: `findingText.ts:164` (Schlüssel aus fester Liste), `libraryModel.ts:119` (Art aus fester Liste), `ids.ts:32` (einzelnes Zeichen) sowie die Rahmenmaße in `layout.ts`/`flowModel.ts`/`editorState.ts`. Die Rahmenmaße sind nach Kennungen von Elementen geordnet; diese sind im Format UUIDs, und das Backend prüft sie.

4. **Neue Felder der Typbeschreibung in den Antworten des Backends (Punkt 20).** `api/elementTypes.ts` liest `outputs[].holds_management`, `named` und `strategy_parameters` über `optionalBoolean`. Ein fehlendes Feld gilt als `false`, jeder andere Wert als Boolean führt zu `ResponseFormatError` (`expectBoolean`, `http.ts:153-158`). Die Zeiteinheiten kommen jetzt aus den `choices` der Typbeschreibung (`timeUnitChoices`, `typeIndex.ts`); `choices` war schon vorher geprüft. Die feste Liste `model/timeUnits.ts` ist entfernt. Vom Ausgang mit `holds_management` lässt sich keine Verbindung ziehen (`canvasEditing.ts` `isValidConnection`, `layout.ts` `connectable`). Der Browser ist dabei keine Sicherheitsgrenze; die maßgebliche Prüfung bleibt im Backend.

5. **Texte nur als Text.** Ich habe `frontend/src`, `frontend/e2e` und `index.html` nach `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function`, `DOMParser`, `srcdoc`, `javascript:` und `<Trans` durchsucht. Treffer gibt es nur in den Suchmustern von `sourceRules.test.ts`. `de.json` und `en.json` enthalten kein `<` und kein `t(` (je 0 Treffer). Neu angezeigte Daten sind die Namen der Strategieparameter in den Vorschlägen (`scope.ts`) und die Bezeichnungen der Zeiteinheiten aus der Typbeschreibung. Beide werden als React-Text gesetzt. Der Text zu `strategy.no_trigger` ist in beiden Dateien entfernt. Unbekannte Kennungen erscheinen weiter mit dem allgemeinen Text.

6. **Keine festen Ports, Pfade, Rechnernamen oder Zugangsdaten.** Ich habe die hinzugefügten Zeilen von `git diff f22b0a98 a9aa37f` in Frontend, Dokumentation und README durchsucht.
   - Nach `localhost`, `127.0.0`, `0.0.0.0`, `/srv/`, `/home/` und `/tmp/` gibt es nur einen Treffer. Er steht in `docs/technical/pipwerk-studio.md` (aus Auftrag 03, schon dort geprüft) und nennt die allgemeinen Voreinstellungen der erlaubten Namen, keinen Wert des Entwicklungsrechners.
   - Nach Begriffen für Zugangsdaten und nach festen Ports im Frontend gibt es keinen Treffer.

7. **Browsertests schreiben nur in ihr temporäres Verzeichnis.** `e2e/start-backend.mjs` und `playwright.config.ts` sind seit Durchlauf 1 unverändert. Dort war belegt: Objektverzeichnis unter `mkdtemp(tmpdir())`, gesetzt ohne Shell und ohne Umgebungsvariable. `e2e/designer.spec.ts` liest im neuen Stand nur Dateien in diesem Verzeichnis (`readdirSync`, `readFileSync`). Der Test wartet auf die Antwort des zweiten `PUT` und prüft danach die Datei. Er löscht nur über die Web-API. Die neuen Tests zu Punkt 26 schreiben keine Dateien.

8. **Abhängigkeiten unverändert.** `git diff f22b0a98 a9aa37f` und `git diff eb2853a a9aa37f` sind leer für `package.json`, `package-lock.json`, `playwright.config.ts`, `vite.config.ts` und `index.html`. Bibliothek und Backend entsprechen Auftrag 03 (Prüfung 2). `uv sync --frozen` und `npm ci` liefen aus den unveränderten Sperrdateien.

9. **Eigener Lauf.** `components/pipwerk-studio/scripts/check --backend-port 18437 --frontend-port 15837` ohne `--with-audit` endete mit **Exitcode 0** und „check: all checks passed“.
   - Bibliothek: 1013 Tests bestanden, ruff und mypy ohne Befund, Schemas gleich den Verträgen.
   - Backend: 742 Tests bestanden, ruff und mypy ohne Befund.
   - Frontend: `npm ci`, typecheck und build bestanden; Vitest mit 42 Dateien und 728 Tests bestanden.
   - Browsertests in Chromium, Firefox und WebKit: 69 bestanden, 6 übersprungen.

## Befunde

- **B1 – Eine Stelle derselben Art liest und schreibt Belegungen noch über den Prototyp (blockierend).**
  - Fundstelle: `components/pipwerk-studio/frontend/src/document/build.ts:118-119` in `instanceFromTemplate`: `!(definition.name in parameterValues)` und `parameterValues[definition.name] = …`.
  - `parameterValues` sind die Belegungen der Vorlage, nach dem Namen des eigenen Parameters geordnet. Diesen Namen wählt der Anwender. Erlaubt ist jeder Name nach `[A-Za-z_][A-Za-z0-9_]*` (`packages/domain-core/src/pipwerk_domain/namespaces.py:31`).
  - Der Operator `in` findet auch geerbte Felder von `Object.prototype`. Das folgt aus der Sprachdefinition; ein eigener Lauf mit `node` war in der Ausführungsumgebung nicht zugelassen. Bei einem eigenen Parameter mit Standardwert ohne Belegung, der `constructor`, `toString`, `valueOf`, `hasOwnProperty` oder `__proto__` heißt, entsteht deshalb beim Einfügen der Vorlage keine Belegung mit dem Standardwert. Bei jedem anderen Namen entsteht sie.
  - Der Prototyp wird dabei nicht verändert, weil der Zweig für diese Namen nie ausgeführt wird. Es liegt also keine Sicherheitslücke vor. Die Stelle widerspricht aber Punkt 24 des Auftrags („jede weitere Stelle derselben Art“) und `docs/technical/pipwerk-studio.md` Zeile 96 („Belegungen werden nur darüber gelesen und geändert“). Außerdem beeinträchtigt sie die Funktion (fehlender Standardwert).
  - Erreichbar ist die Stelle über mitgelieferte und gespeicherte Vorlagen (`library/insert.ts:66`, `build.ts:198`). Gespeicherte Vorlagen kann jeder über die Web-API anlegen.
  - Kein Test deckt `instanceFromTemplate` mit einem solchen Namen ab (`build.test.ts:98,119` verwenden nur gewöhnliche Namen).

## Hinweise

- **H1 – bekannte Schwachstelle in einer Entwicklungsabhängigkeit (Nachprüfung).** Nach der Entscheidung des Softwarearchitekten ist sie kein Teil dieses Auftrags. Die Sperrdatei ist unverändert (Prüfung 8), der Stand ist also derselbe wie in Durchlauf 1. Die Dokumentation nennt den Befund weiter: `docs/technical/pipwerk-studio.md` Zeile 743 (Abschnitt 7) und Zeile 808 (Abschnitt 9). `npm audit` habe ich in diesem Durchlauf nicht ausgeführt; das Übergabedokument verlangt den Lauf ohne `--with-audit`. Der Hinweis bleibt offen.
- **H2 – Schlüssel `__proto__` in Belegungen (Nachprüfung).** Die drei genannten Stellen und die weiteren Lesestellen sind umgestellt und getestet (Prüfung 3). Eine Stelle ist noch offen und wird als B1 geführt. Damit geht der Hinweis in B1 auf.
- **H3 – Grenze der eigenen Prüfung (Nachprüfung, unverändert).** Auch in diesem Durchlauf hat die Ausführungsumgebung das Auflisten des Standardverzeichnisses unter dem Heimatverzeichnis abgelehnt. Ein Vergleich vor und nach dem Lauf fehlt weiter. Belegt ist nur, was Code und Browsertest zeigen (Prüfung 7).
