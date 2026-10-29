# Testbericht Tester Funktion, Auftrag 19, Durchlauf 1

- Bezug: `strategiedesign/wp02`, Zweig `strategiedesign/wp02-19`
- geprüfter Commit: `63a9bfa6bdf1c20c9b2b6c927073fb56bbcee17c` (Vorgänger `106f6388b83343e4ae86243f7e316ca1240b544b`); ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Prüfskript: kein Commit des Prüfskripts nötig, es wurde nicht geändert

## Ergebnis: bestanden

Keine blockierenden Befunde.

## Prüfskript

`components/pipwerk-studio/scripts/check --backend-port 19411 --frontend-port 19412` lief einmal vollständig und endete mit Exitcode 0 („all checks passed“):

- Backend: pytest 1044 bestanden, ruff check, ruff format, mypy bestanden
- Schreibweise des Namens im Repository: bestanden
- Frontend: `npm ci`, typecheck, Vitest (54 Dateien, 671 Tests), build bestanden
- Playwright in Chromium, Firefox und WebKit: bestanden, keine fehlgeschlagenen Tests (kein `✘` in der Ausgabe). Die Tests von `e2e/insert.spec.ts` laufen in allen drei Browsern.
- Dateimodus im Commit: `check` und `testenv` je `100755`

## K1: Einfügen über `POST /api/v1/insert`

- Erfüllt. `requestInsert` (`api/objects.ts`) ruft `/api/v1/insert` mit Dokument, Vorlage oder Objekttyp und Namen auf. `insertNow` (`state/useStudioController.ts`) nutzt es für jede Vorlage (mitgelieferte und eigene), für Regeln und Instanzlisten und für Objekttypen, die eine Instanz bilden. Klick, Ziehen und die Liste „Regel oder Regelwerk hinzufügen …“ laufen über dieselbe Funktion.
- `instanceFromTemplate`, `instanceFromType` und `newTemplateElement` sind entfernt. `withStandardValues` und `elementForInstance` (`document/build.ts`) ändern keine Namen, Kennungen oder Ausdrücke. Sie setzen nur Standardwerte der Parameter und für eine Regel aus einem Objekttyp den leeren Ausdruck.
- Ausnahmen, die in der UI bleiben und im Rahmen des Auftrags berechtigt sind: Auslöser und Schritte des Ablaufs (Name des Typs über `uniqueDisplayName`, kein Objekt mit Instanz). Der Schlüssel einer Bedingung oder Berechnung kommt von `/api/v1/keys` (`createKey`) und nicht aus der UI.
- Das Dokument ändert sich erst mit der Antwort (`edit` nach `await requestInsert`). Bei einem Fehler zeigt `showError('errors.insertFailed', …, 'errors.insertFailedHint')` die Ursache mit Abhilfe, und das Dokument bleibt unverändert (Browsertest `insert.spec.ts:151`).
- Zwei rasche Einfügungen laufen über `insertQueue` nacheinander. Die zweite Anfrage geht vom Dokument nach der ersten aus. Die Vitest-Datei `App.insert.test.tsx` deckt das ab.
- `testing/fakeInsert.ts` gibt die Namens- und Schlüsselbildung von `insert_instance` und `_localize` in `packages/domain-core/.../operations.py` wieder (Vergleich der Funktionen Zeile für Zeile). Eine eigene Regel enthält es nicht.
- Der Fall zwei Regeln „Mindestvolumen“ (Ergebnis „Prüfregeln Mindestvolumen“, `pruefregeln_mindestvolumen`, kein `name.duplicate`) besteht in Vitest und im Browsertest, beide mit der Fake-API. Das Prüfskript startet das echte Backend. Ob der Browsertest `insert.spec.ts` gegen das echte Backend oder gegen die Fake-API läuft, habe ich nicht gesondert nachgewiesen. Das Backend prüft denselben Fall in seinen eigenen Tests (pytest bestanden).
- Texte: `de.json` und `en.json` je um einen Schlüssel erweitert (Schlüsselgleichheit bleibt).

## K2: Dokumentation zum Prototyp

- Erfüllt. `docs/technical/pipwerk-studio.md` Abschnitt 2.3 nennt den Prototyp „Hilfsmittel, keine bestätigte Vorlage“ und nennt die Maßgeblichkeit von Abschnitt 5 der Spezifikation. Die Tabelle „Code des Prototyps“ nennt `arrange/layout.ts`, `arrange/scene.ts`, `styles.css`, `ui/Icon.tsx`, `ui/TipLayer.tsx`. Die zweite Gruppe (Aufbau, Klassennamen und `data-testid` folgen dem Prototyp) nennt neun Dateien. Die Kopfkommentare dieser Dateien stimmen damit überein (Abgleich mit `git grep`).
- Im Quelltext und in der Dokumentation steht keine Aussage mehr, der Prototyp sei bestätigt oder die Bedienung stamme von dort (`git grep` nach „bestätigt“ und „confirmed“ findet nur den Sprachwechsel „bestätigte Sprache“, der damit nichts zu tun hat).
- Die Beschreibung von `build.ts`, `fakeInsert.ts`, `useStudioController.ts` und `api/objects.ts` stimmt mit dem Code überein.

## Weitere Prüfungen

- Kein Test abgeschwächt, übersprungen oder deaktiviert: Der Diff zu `106f638` enthält kein `.skip`, `.only`, `xit`, `fixme` oder `todo`. Keine bestehende Testdatei wurde gelöscht oder gekürzt (nur `insert.spec.ts` und `App.insert.test.tsx` kamen neu hinzu).
- Kein fester Pfad, Port oder Rechnername im geänderten Code (Suche im Diff).

## Hinweise (nicht blockierend)

- Die Stelle in der Kette, an der ein Einfügen aus einem Objekttyp nur den Standardwert der Parameter nachträgt (`withStandardValues`), ist eine kleine Logik in der UI, die das Backend nicht hat. Sie bildet keine Namen, Kennungen oder Ausdrücke und liegt damit im Rahmen des Auftrags.

## Befundliste

Keine Befunde.
