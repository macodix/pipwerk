# Testbericht Sicherheit – Auftrag 01, Durchlauf 1

- Bezug: `strategiedesign/wp02`
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/01-1-order.md`
- geprüfter Commit: `f22b0a98f3ef22d649fd1dc85bdeb2f91436a3b4` (Zweig `strategiedesign/wp02-01`, Elterncommit `b158eae2636f3f210e11fb2bcbfa27d3cfcd80fa`)
- Prüfskript: `components/pipwerk-studio/scripts/check` im geprüften Commit `f22b0a98f3ef22d649fd1dc85bdeb2f91436a3b4`, unverändert
- Prüfgrundlagen: Auftrag `orders/01.md` (Punkte 11, 12, 15; Abnahmekriterien 1, 5, 6), `docs/technical/development-test-security-rules.md` Abschnitte 5, 8, 9, `docs/technical/pipwerk-studio.md`, BSI-Grundschutz (CON.8, APP.7), OWASP ASVS und API Security Top 10
- Durchlauf: erster, vollständig

## Ergebnis: bestanden

Keine blockierenden Befunde. Drei Hinweise (H1 bis H3).

## Durchgeführte Prüfungen und Nachweise

1. **Arbeitsverzeichnis.** Mit `git worktree add --detach` angelegt. `git rev-parse HEAD` ergab `f22b0a98f3ef22d649fd1dc85bdeb2f91436a3b4`. Der Elterncommit ist Vorfahre. Der Bereich enthält genau einen Commit. Nach allen Läufen meldete `git status --short` keine Änderungen.

2. **Texte nur als Text (Punkt 11, Kriterium 5).**
   - Suche in `frontend/src`, `frontend/e2e` und `index.html` nach `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function`, `Trans`, `DOMParser`, `srcdoc` und `javascript:`. Treffer gibt es nur in `src/sourceRules.test.ts`, als Suchmuster der Prüfung, und in `src/i18n.ts:34`.
   - `src/i18n.ts:34` setzt `escapeValue: false`. Die Datei wurde mit diesem Commit nicht geändert. Das ist unbedenklich, weil alle Ergebnisse von `t()` als React-Text oder React-Attribut gesetzt werden. Die Dokumentation sagt dasselbe (`docs/technical/pipwerk-studio.md` Zeile 165).
   - Die Übersetzungsdateien `de.json` und `en.json` enthalten kein `<` und kein Verschachteln `$t(` (je 0 Treffer).
   - Die Platzhalter der Befundtexte stammen aus einer festen Liste (`knownDetails`, `findingText.ts:163`). Angaben des Backends können deshalb keine Steueroptionen von i18next einschleusen.
   - `className` wird nur aus geprüften Werten gebildet: Stufe `error`/`hint`, Art des Knotens. Es gibt kein `style` aus Daten des Dokuments.
   - Der einzige Verweis ist der bestehende in `AboutDialog.tsx:106`, mit `rel="noopener noreferrer"`.
   - `src/sourceRules.test.ts` prüft die Regeln dauerhaft und hat eine Gegenprobe.

3. **Antworten des Backends (Punkt 12).**
   - `api/http.ts`: Jede Anfrage hat eine Zeitgrenze von 10 s. Die Zeitgrenze und der Abbruch durch den Aufrufer laufen über einen eigenen `AbortController`. Ein Status außerhalb 2xx führt zu `HttpError`. Übernommen wird nur ein `detail`, das ein String ist. Validierungsfehler 422 von FastAPI geben deshalb keine Eingaben wieder.
   - Eine Antwort, die kein JSON ist, führt zu `ResponseFormatError`.
   - Alle Antworten werden vor der Verwendung geprüft: Typbeschreibungen (`elementTypes.ts`, Aufzählungen gegen feste Listen), Listen, Befunde, Prüfergebnis mit Namen und Stellen (`objects.ts`), Strategiedokument (`document/parse.ts`) und Objektverzeichnis (`objectDirectory.ts`).
   - Kennungen in Pfaden werden mit `encodeURIComponent` eingesetzt (`objects.ts:162,172,189,198`). Die Art kommt aus einer festen Liste.
   - Fehlermeldungen zeigen nur übersetzte Ursachen und den festen Text des Backends (`errors.ts`), keine Ausnahmetexte.
   - Ältere Antworten von `check` werden verworfen (`useLiveNames.ts`, Zählung und Abbruch). Eine Prüfung nach dem Öffnen wirkt nur auf die Strategie, für die sie gestartet wurde (`strategyToken`).

4. **Eingaben des Anwenders.**
   - Abgelegte Daten beim Ziehen werden nur als JSON gelesen und nach Art und Feldtypen geprüft (`libraryModel.ts:145`). Sie werden nur verwendet, wenn sie einem vorhandenen Eintrag der Elementbibliothek entsprechen (`findEntry`, `useStudioController.ts:233`, `RulesSection.tsx:49`). Daten aus anderen Fenstern werden damit verworfen; ein Test deckt das ab (`Studio.canvas.test.tsx:168-170`).
   - Ausdrücke werden nur als Text bearbeitet und angezeigt (`completions.ts`, `ExpressionInput.tsx`, `<code>{shown}</code>`). Sie werden nicht ausgewertet.
   - Die maßgebliche Prüfung bleibt im Backend (`/api/v1/check`, Speichern). Der Browser ist keine Sicherheitsgrenze (Regel 8.2.4).

5. **Pfadeingabe des Objektverzeichnisses.**
   - `SettingsDialog.tsx` sendet den Pfad unverändert als JSON-String an `PUT /api/studio/settings/object-directory`. Ändern ist erst nach der Rückfrage möglich.
   - Die Prüfung (absoluter Pfad, Länge, Nullzeichen) bleibt serverseitig. Das Backend wurde mit diesem Commit nicht geändert.
   - Fehlertexte und die Angaben zu einem gescheiterten Zurückholen (Verzeichnisse, Dateinamen) werden nach Typprüfung (`causeOf`) als Text gezeigt.
   - Tests decken Verschieben, Nichtverschieben, Abbrechen, Fehler, gescheitertes Zurückholen und nicht erreichbares Backend ab (`Studio.settings.test.tsx`).

6. **Keine festen Ports, Pfade, Rechnernamen oder Zugangsdaten (Kriterien 5 und 6).**
   - Im hinzugefügten Code und in der Dokumentation kommen `localhost`, `127.0.0.1`, `0.0.0.0`, `/srv/`, `/home/` und Namen des Entwicklungsrechners nur in den Suchmustern von `sourceRules.test.ts` vor (`git diff -G`).
   - Die Suche nach Zugangsdaten und Benutzernamen in den hinzugefügten Zeilen fand nur den Testparameternamen `secret` mit dem Wert `3` (`Studio.properties.test.tsx`). Das ist kein Geheimnis.
   - Die Standardports in `playwright.config.ts` bestehen schon vorher und lassen sich überschreiben. Die Datei wurde mit diesem Commit nicht geändert.

7. **Browsertests schreiben nur in ihr temporäres Verzeichnis (Punkt 15).**
   - `e2e/start-backend.mjs` legt die Datenbank, die INI und `objects/` unter `mkdtemp(tmpdir())` an. Das Objektverzeichnis wird vor dem Start über `SettingsService.set_object_directory` gesetzt: `execFileSync` mit fester Argumentliste, `python -I`, ohne Shell und ohne Umgebungsvariable. Das Verzeichnis wird beim Ende des Backends entfernt.
   - `e2e/designer.spec.ts:90-128` weist nach, dass das Verzeichnis unter `tmpdir()` liegt und dass nach „Speichern“ genau eine Datei darin liegt. Der Test liest Dateien nur. Er löscht nur über die Web-API des eigenen Backends.
   - Eigener Lauf: bestanden in Chromium, Firefox und WebKit (siehe 9).

8. **Abhängigkeiten unverändert.** `git diff --name-only` des Commits für `package.json`, `package-lock.json`, `components/pipwerk-studio/backend`, `vite.config.ts`, `playwright.config.ts`, `index.html`, `scripts`, `libraries` und `contracts` ist leer. `npm ci` installierte 134 Pakete aus der unveränderten Sperrdatei.

9. **Eigene Läufe.**
   - `npm run typecheck`: Exitcode 0.
   - `npm test`: 40 Testdateien, 674 Tests bestanden.
   - `components/pipwerk-studio/scripts/check --backend-port 18431 --frontend-port 15831`, ohne `--with-audit`: Exitcode 0, „check: all checks passed“. Enthalten sind Bibliothek und Backend (pytest, ruff, mypy), Frontend (npm ci, typecheck, Vitest, build) und die Browsertests: 63 bestanden, 6 übersprungen. Übersprungen wurden die Tests „ohne Git-Arbeitsbereich“ in drei Browsern.

## Befunde

Keine blockierenden Befunde.

## Hinweise

- **H1 – bekannte Schwachstelle in einer Entwicklungsabhängigkeit (schon vorher vorhanden).** `npm audit` meldet `source-map-js` 1.2.1 mit Schweregrad hoch (GHSA-68fv-2mgg-jv7q, Dienstverweigerung durch präparierte Source Maps). Die Abhängigkeitspfade sind `vite > postcss > source-map-js` und `jsdom > css-tree > source-map-js`. Beide betreffen Bau und Test, nicht die ausgelieferte Oberfläche. Die Sperrdatei ist durch diesen Commit unverändert; der Stand besteht also schon vorher. Nach Regel 5.7 und 8.2.9 ist die Aktualisierung eine eigene geprüfte Änderung.
- **H2 – Schlüssel `__proto__` in Belegungen.** `document/parse.ts:41` (`result[key] = …`) übernimmt die Schlüssel der Belegungen aus einem gelesenen Dokument durch Zuweisung an ein gewöhnliches Objekt. Das gilt ebenso für die Zuweisungen in `document/ops.ts:105` und `properties/RuleProperties.tsx:56`. Ein Schlüssel `__proto__` ändert dann nur den Prototyp dieses einen Objekts; das ist keine globale Prototype Pollution. Die Belegung fehlt danach bei den eigenen Feldern und ginge beim nächsten Speichern verloren. Nicht geprüft habe ich, ob Backend oder Bibliothek einen solchen Parameternamen annehmen. Ist das ausgeschlossen, entfällt der Hinweis.
- **H3 – Grenze der eigenen Prüfung.** Den Inhalt des Standardverzeichnisses unter dem Heimatverzeichnis konnte ich vor und nach dem Lauf nicht auflisten; die Ausführungsumgebung hat den Zugriff abgelehnt. Belegt ist deshalb nur, was Code und Browsertest zeigen (Prüfung 7): Das Objektverzeichnis des Laufs liegt unter `tmpdir()`, und alle Schreibzugriffe gehen dorthin. Ein Vergleich des Standardverzeichnisses vor und nach dem Lauf fehlt.
