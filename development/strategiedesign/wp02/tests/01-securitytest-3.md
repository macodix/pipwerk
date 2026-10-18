# Testbericht Sicherheit – Auftrag 01, Durchlauf 3

- Bezug: `strategiedesign/wp02`
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/01-3-order.md`
- geprüfter Commit: `0210df5d7fed3b1aa2ae46e68713af2923af4198` (Zweig `strategiedesign/wp02-01`), Elterncommit `a9aa37fc67852ba842b5039ef344208808e7c9c2`
- vorheriger Durchlauf: `01-securitytest-2.md` zum Commit `a9aa37fc…` (nicht bestanden, B1, H1 bis H3)
- Prüfskript: `components/pipwerk-studio/scripts/check` im geprüften Commit, unverändert
- Prüfgrundlagen: Auftrag `orders/01.md`, Nachtrag nach Durchlauf 2 (Punkte 27 bis 30, besonders 29); `docs/technical/development-test-security-rules.md`; `docs/technical/pipwerk-studio.md`; `docs/technical/entwicklungsverfahren.md` Abschnitt „Umfang der Prüfungen“; BSI-Grundschutz (CON.8, APP.7); OWASP ASVS
- Durchlauf: dritter, Nachprüfung. Geprüft sind B1 einschließlich der Liste der geprüften Stellen und die geänderten Stellen auf neue Fehler.

## Ergebnis: bestanden

Kein blockierender Befund. B1 ist erledigt. Zwei Hinweise bleiben offen (H1, H3).

## Durchgeführte Prüfungen und Nachweise

1. **Arbeitsverzeichnis.** Das Arbeitsverzeichnis bestand schon (`test -e …/.git`). Danach habe ich `git fetch origin` und `git checkout --detach 0210df5d…` ausgeführt. `git rev-parse HEAD` ergab `0210df5d7fed3b1aa2ae46e68713af2923af4198`. `git log --first-parent a9aa37f..HEAD` zeigt nur diesen einen Commit. `git diff --stat a9aa37f HEAD` nennt 13 Dateien: 12 im Frontend (`src/`) und `docs/technical/pipwerk-studio.md`. Backend, Bibliothek, Verträge, Skripte, `e2e/`, `package.json` und `package-lock.json` sind unverändert (`git diff --stat` für diese Pfade ist leer). Nach dem Lauf meldete `git status --short` keine Änderungen.

2. **B1 – `instanceFromTemplate` (Punkt 29).**
   - `src/document/build.ts:118-119` verwendet jetzt `hasOwn(parameterValues, definition.name)` und `setOwn(parameterValues, definition.name, …)`. `in` und die einfache Zuweisung sind entfernt.
   - `parameterValues` ist ein Teil der Kopie `clone(template)` (Z. 113-114). Geschrieben wird also nur in die Kopie, nicht in die Vorlage.
   - `own.ts`: `hasOwn` verwendet `Object.prototype.hasOwnProperty.call`, `setOwn` verwendet `Object.defineProperty`. Damit wird für `__proto__`, `constructor` und ähnliche Namen ein eigenes Feld angelegt. Der Prototyp wird nicht verändert.
   - Test `build.test.ts` (neu, Z. 125-147): Eigene Parameter `constructor`, `toString` und `__proto__` mit Standardwert erhalten je ein eigenes Feld mit `{ kind: 'fixed', value: 3 }`. Der Prototyp bleibt `Object.prototype`. Gegenprobe: Ein Wert unter `__proto__`, den die Vorlage selbst setzt, bleibt erhalten. Der Test lief im eigenen Lauf mit (Prüfung 6).

3. **Liste der geprüften Stellen (Punkt 29).** Ich habe alle Zugriffe der Form `obj[name]` mit einem Namen als Schlüssel in `frontend/src` gesucht (ohne Tests und `src/testing/`). Ebenso habe ich `in` mit Schlüssel, `delete`, `Object.assign`, `hasOwnProperty`, berechnete Schlüssel in Objekten und alle Typen `Record<string, …>` gesucht. Jede Fundstelle habe ich einzeln geprüft:
   - Umgestellt auf `getOwn`/`setOwn`: die Rahmenmaße in `canvas/layout.ts` (`syncFrames`, Z. 248, 255, 266), `canvas/flowModel.ts` (`documentToFlow`, Z. 161, 166, 205, 268; `flowToFrames`, Z. 369-375) und `state/editorState.ts` (`sameFrames`, Z. 78-79). Dazu kommt `build.ts` (Prüfung 2). Eine Stelle mit Rahmenmaßen, die noch direkt zugreift, habe ich nicht gefunden.
   - Unbedenklich, wie vom Entwickler angegeben: `buildRevision.ts:19`, `revisionApi.ts:22-24`, `repository.ts:11`, `settingsApi.ts:13`, `api.ts:9` und `http.ts:49` prüfen mit `in` nur feste Feldnamen. `parse.ts:72-73` und `libraryModel.ts:119` durchlaufen feste Listen. `findingText.ts:164` verwendet Schlüssel aus der festen Liste `knownDetails`. `ids.ts:32-33` verwendet ein einzelnes Zeichen auf einer festen Tabelle. `ops.ts:27` und `ops.ts:123` verwenden Schlüssel mit festem Typ (`'title' | 'description'` beziehungsweise `'parameters' | 'properties'`). `useStudioController.ts:100` und die übrigen Stellen mit `[index]`, `[i]`, `[position]` und `[current]` greifen auf Listen zu. Alle Stellen mit `[language]` verwenden den Typ `SupportedLanguage` (`de`, `en`). `LanguageSelect.tsx:40` verwendet `messageSuffix[error]` mit einem Fehler aus fester Menge.
   - Die Aussage in `docs/technical/pipwerk-studio.md` Zeile 96 trifft damit zu: Es bleibt kein Zugriff mit `in`, `obj[key]`, `obj[key] =` oder `delete obj[key]` übrig, dessen Schlüssel Anwender oder Backend bestimmen. `delete record[key]` steht nur in `own.ts:29` (`removeOwn`, nach `hasOwn`).

4. **Neue und geänderte Stellen auf neue Fehler.**
   - `expression/scope.ts` `datatypeLabel` (Punkt 28): Der Datentyp kommt aus Dokument oder Typbeschreibung. Er wird über `getOwn` in den Übersetzungen `datatype.*` nachgeschlagen, sonst bleibt er unverändert. Ein Datentyp wie `constructor` liefert also keine Funktion vom Prototyp, sondern den Text selbst (Test `scope.test.ts` „stays as written …“ mit `constructor` und `mystery`). Angezeigt wird der Wert als React-Text (`ExpressionInput.tsx:145`, `{suggestion.detail}`).
   - `properties/specs.ts` `definitionSpecs` und `instanceParameterSpecs` (Punkt 27): Die Zeiteinheiten kommen aus `timeUnitChoices` der Typbeschreibungen. Deren `choices` werden schon beim Abruf geprüft (Durchlauf 2, Prüfung 4). Die Liste wird kopiert (`[...timeUnits]`), nicht verändert. Die Bezeichnungen erscheinen als Text in `option`-Elementen. Die Aufrufer `RuleProperties.tsx:225` und `ElementProperties.tsx:153` übergeben die Zeiteinheiten beziehungsweise den Typindex.
   - Die hinzugefügten Zeilen des Diffs habe ich gelesen. Sie enthalten keine Rechnernamen, festen Ports, Pfade des Entwicklungsrechners, Zugangsdaten, `innerHTML`, `dangerouslySetInnerHTML`, `eval` oder `new Function`. Die geänderten Tests schreiben keine Dateien und öffnen keine Netzverbindungen außer dem Testbackend im Speicher.

5. **Dokumentation.** Die drei geänderten Stellen in `docs/technical/pipwerk-studio.md` (Zeile 96 zu `own.ts`, Zeile 141 zu den Zeiteinheiten, Zeile 157 zu den Datentypen der Vorschläge und die Testliste ab Zeile 650) stimmen mit dem Code überein (Prüfungen 2 bis 4).

6. **Eigener Lauf.** `components/pipwerk-studio/scripts/check --backend-port 18447 --frontend-port 15847` ohne `--with-audit` endete mit **Exitcode 0** und „check: all checks passed“.
   - Bibliothek: `uv sync --frozen`, 1013 Tests bestanden, ruff und mypy ohne Befund, Schemas gleich den Verträgen.
   - Backend: `uv sync --frozen`, 742 Tests bestanden, ruff und mypy ohne Befund.
   - Frontend: `npm ci`, typecheck und build bestanden; Vitest mit 42 Dateien und 734 Tests bestanden.
   - Browsertests in Chromium, Firefox und WebKit: 69 bestanden, 6 übersprungen.

## Befunde

Keine blockierenden Befunde.

- **B1 aus Durchlauf 2 – erledigt.** Belege in den Prüfungen 2 und 3.

## Hinweise

- **H1 – bekannte Schwachstelle in einer Entwicklungsabhängigkeit (Nachprüfung, unverändert).** Nach der Entscheidung des Softwarearchitekten ist sie kein Teil dieses Auftrags. Die Sperrdatei ist unverändert (Prüfung 1). `npm ci` meldete im eigenen Lauf weiter „1 high severity vulnerability“. `npm audit` habe ich nicht ausgeführt, weil das Übergabedokument den Lauf ohne `--with-audit` verlangt. Der Hinweis bleibt offen.
- **H2 – Schlüssel `__proto__` in Belegungen.** In Durchlauf 2 in B1 aufgegangen. Mit B1 erledigt.
- **H3 – Grenze der eigenen Prüfung (Nachprüfung, unverändert).** Die Browsertests und `e2e/start-backend.mjs` sind seit Durchlauf 2 unverändert. Ein Vergleich des Standardverzeichnisses unter dem Heimatverzeichnis vor und nach dem Lauf fehlt weiter. Belegt ist nur, was Code und Browsertest zeigen (Durchlauf 2, Prüfung 7).
