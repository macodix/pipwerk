# Testbericht Funktionstest, Auftrag 02, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- Übergabedokument: `ablauftest/wp01:development/ablauftest/wp01/tests/02-functiontest-1-order.md`
- geprüfter Commit: `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1` (Zweig `ablauftest/wp01-02`, aufgesetzt auf `13ad9c7475c117e738652b534c69a394c4baa0ef`)
- Commit des Prüfskripts: `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1` (Zweig `ablauftest/wp01-functiontest`, auf GitHub übertragen). Der geprüfte Commit wurde ohne eigenen Zusammenführungscommit in den Zweig übernommen (Vorspulen von `4fc779e38b1f32899dcb6dee7facdafc618275ef`). Prüfskript und Abschnitt 6.4 sind unverändert.
- Datum: 2026-10-14

## Ergebnis

**nicht bestanden**

Alle Prüfungen des Prüfskripts bestehen in Chromium, Firefox und WebKit. Code und Tests erfüllen Auftrag 02 im Wesentlichen. Die technische Dokumentation enthält aber eine falsche und eine veraltete Stelle (F1, F2). Nach der Dokumentationspflicht gebe ich deshalb nicht frei. Dazu kommen zwei Abweichungen der Browsertests von Abschnitt 4.2 der Spezifikation (F3, F4) und ein Formfehler (F5). F3 braucht eine Entscheidung des Softwarearchitekten.

## Befunde

| Nr. | Art | Fundstelle | Sachverhalt |
| --- | --- | --- | --- |
| F1 | Dokumentation falsch | `docs/technical/pipwerk-studio.md`, Abschnitt 6.2, Zeile 383 | Der Satz „`npm audit` prüft die npm-Abhängigkeiten auf bekannte Sicherheitslücken.“ stand im Ausgangscommit am Ende des Absatzes über `npm run typecheck` und `npm test` (Zeile 328 in `13ad9c7`). Jetzt hängt er ohne Satzende direkt am letzten Listenpunkt zu `buildinfo/viteConfig.test.ts`: „… eine andere Datei des Wurzelverzeichnisses nicht) `npm audit` prüft …“. Der Satz liest sich damit als Teil der Beschreibung dieses Tests. Im Absatz über die Befehle von Abschnitt 6.2 fehlt er. |
| F2 | Dokumentation veraltet | `docs/technical/pipwerk-studio.md`, Abschnitt 4a, Zeile 262 | „Oberfläche und Backend stammen damit aus demselben Commit, den Fußzeile und später der Dialog nennen.“ Der Dialog ist mit diesem Commit umgesetzt. „später“ trifft nicht mehr zu. |
| F3 | Test weicht von der Spezifikation ab, Dokumentation widerspricht dem Verhalten | `components/pipwerk-studio/frontend/e2e/studio.spec.ts`, Zeilen 397 und 401; `docs/technical/pipwerk-studio.md`, Zeile 176 (E8) und Zeile 413 | Abschnitt 4.2 der Spezifikation verlangt bei der Sperrung: „der Fokus bleibt im Dialog“. Der Test lässt nach jedem Tastendruck auch den Fokus auf `body` oder `html` zu (`position.inDialog \|\| position.isDocument`). Meine Messung (siehe „Eigene Proben“) zeigt: In Chromium und WebKit liegt der Fokus nach Tab vom letzten Element des Dialogs auf `BODY`, also nicht im Dialog. Erst der nächste Tab führt zurück in den Dialog. Sprachauswahl und Schaltfläche erreicht der Fokus nie. Die Anforderung aus 4.2 ist mit dem nativen `<dialog>` (E8) in diesen Browsern so nicht erfüllbar. Der Test prüft deshalb eine schwächere Bedingung. Eine Entscheidung dazu ist nirgends festgehalten. Die technische Dokumentation sagt in E8 (Zeile 176), der Browser „hält den Fokus im Dialog“. Das widerspricht der Messung. Zeile 413 beschreibt die schwächere Prüfung, ohne zu sagen, dass der Fokus auf das Dokument gehen kann. Benötigte Entscheidung (Softwarearchitekt, Eigentümer der Spezifikation): Ist der Fokus auf dem Dokument zwischen zwei Durchläufen durch den Dialog zulässig? Danach müssen Test und technische Dokumentation (E8, Abschnitt 6.3) dazu passen. |
| F4 | Test weicht von der Spezifikation ab | `components/pipwerk-studio/frontend/e2e/studio.spec.ts`, Zeilen 299 und 312; `docs/technical/pipwerk-studio.md`, Zeile 410 | Abschnitt 4.2 der Spezifikation verlangt für den Dialog: „Ohne Git-Arbeitsbereich „unbekannt“ (übersprungen, wenn der Arbeitsbereich ein Git-Arbeitsbereich ist, wie beim bestehenden Test der Fußzeile)“. Umgesetzt ist der Fall als Verzweigung innerhalb des Tests zum Stand. In einem Git-Arbeitsbereich läuft der Zweig „unbekannt“ nie. Der Test meldet trotzdem „bestanden“ und keinen übersprungenen Fall. Im Lauf des Prüfskripts sind nur die 3 Fälle „shows no tooltip without a Git working tree“ übersprungen, keiner zum Dialog. Dass die Prüfung „unbekannt“ nicht gelaufen ist, ist im Ergebnis nicht zu sehen. Zeile 410 der technischen Dokumentation nennt den Fall als geprüft, ohne zu sagen, dass er in einem Git-Arbeitsbereich nicht läuft. |
| F5 | Programmierregel, Form | `components/pipwerk-studio/frontend/tsconfig.json`, Zeile 20 | In der Liste `include` fehlt das Leerzeichen nach dem Komma: `"e2e","vite.config.ts"`. Alle anderen Einträge der Datei sind mit Komma und Leerzeichen getrennt. |

## Durchgeführte Prüfungen

### Ausgecheckter Commit und Umfang der Änderung

`git -C <Arbeitsverzeichnis> checkout --detach 33e87d5d64ca629bd466e6fa0d338ed35ebd42c1`, danach `rev-parse HEAD`: `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1`. Elternteil ist `13ad9c7475c117e738652b534c69a394c4baa0ef` (`git log`). `git show --stat`: 31 Dateien, nur Oberfläche, `.gitignore`, `README.md` der Komponente und die beiden Dokumente unter `docs/`. Backend, Prüfskript und Abschnitt 6.4 sind nicht geändert (Nicht-Umfang eingehalten).

### Prüfskript

Aufgerufen mit absolutem Pfad unter meinem Arbeitsverzeichnis auf `33e87d5` mit `--backend-port 28311 --frontend-port 28312`: Exitcode 0, Ausgabe „all checks passed“.

| Prüfung | Ergebnis |
| --- | --- |
| `uv sync --frozen` | bestanden |
| pytest | 145 bestanden, keiner übersprungen |
| ruff check | bestanden |
| ruff format --check | bestanden, 15 Dateien |
| mypy | bestanden, 15 Dateien |
| Suche im Repository nach Abschnitt 4.4 | bestanden, 321 Treffer, alle richtig geschrieben |
| `npm ci` | bestanden |
| typecheck | bestanden |
| Vitest | 238 bestanden in 14 Dateien |
| Build | bestanden |
| Browsertest (Chromium, Firefox, WebKit) | 36 bestanden, 3 übersprungen („shows no tooltip without a Git working tree“, wie vorgesehen in einem Git-Arbeitsbereich) |

`pip-audit` und `npm audit` liefen nach der Entscheidung des Softwarearchitekten nicht mit. `npm ci` meldet eine Schwachstelle der Stufe „high“; das ist der bekannte Befund zu `source-map-js` (technische Dokumentation, Abschnitt 7). Der Build meldet einen Abschnitt über 500 kB; das ist eine Warnung von Vite, kein Fehler.

Das Prüfskript lief für die Proben unten noch zweimal mit derselben Ausgabe „all checks passed“.

### Prüfskript und Abschnitt 6.4

Keine Änderung nötig. Die neuen Tests unter `buildinfo/` laufen über die Include-Liste von Vitest mit `npm test` (`vite.config.ts`, Zeile 53; im Lauf 14 Testdateien statt 7). Die neuen Browsertests stehen in `e2e/studio.spec.ts` und laufen mit `npm run e2e`. Der Bau in `dist-e2e` startet aus `playwright.config.ts` heraus. Die Ports gibt das Skript wie bisher über `PIPWERK_STUDIO_E2E_BACKEND_PORT` und `PIPWERK_STUDIO_E2E_FRONTEND_PORT` weiter. Abschnitt 6.4 beschreibt Ablauf, Parameter und Voraussetzungen weiter richtig.

### Durchsicht des Codes gegen Spezifikation und Auftrag

| Gegenstand | Ergebnis |
| --- | --- |
| Abschnitt 3.2: Aufbau, `h2` mit `aria-labelledby`, Name unübersetzt, `pre` mit `lang="en"` und `tabIndex=0`, Verweis mit `target` und `rel`, „Schließen“ mit `close()`, kein `closedby` | erfüllt (`src/AboutDialog.tsx`, Zeilen 47–81) |
| Fokus auf „Schließen“ nach `showModal()` statt `autoFocus` | nach Entscheidung des Softwarearchitekten zulässig; in Code (Zeilen 28–32) und technischer Dokumentation (Zeile 184) beschrieben |
| Abschnitt 3.3: Formatierung mit `localParts`, „unbekannt“ bei `null` | erfüllt (`src/AboutDialog.tsx`, Zeilen 38–44; Texte in `de.json` und `en.json` unter `about`) |
| Abschnitt 3.4: `lookupGitRevision` mit zwei Git-Aufrufen, `execFileSync`, feste Argumentliste, ohne Shell, Eingabe `ignore`, 5 Sekunden, Text; jeder Fehler `null` und genau eine feste Warnung | erfüllt (`buildinfo/gitRevision.ts`, Zeilen 18–47). Die Fehlerausgabe von Git wird verworfen (`stdio[2] = 'ignore'`). |
| Abschnitt 3.4: `define` einmal beim Laden der Konfiguration; `parseBuildRevision` mit genau zwei Feldern | erfüllt (`vite.config.ts`, Zeilen 30–36; `src/buildRevision.ts`) |
| Abschnitt 3.5: `repository` in `package.json`, Muster in `src/repository.ts`, keine Ausnahme | erfüllt |
| Abschnitt 3.6: Import `LICENSE?raw`, `server.fs.allow` mit `searchForWorkspaceRoot`, `LICENSE` und `LICENSE?raw` | erfüllt; der Zusatz `?raw` ist nach Entscheidung des Softwarearchitekten zulässig |
| Abschnitt 3.6: Schaltfläche `type="button"` rechts neben der Sprachauswahl, Zustand „offen“ in `App.tsx`, Fokus nach dem Schließen ausdrücklich gesetzt | erfüllt (`src/App.tsx`, Zeilen 25–52) |
| Verschiebung von `localParts` und `isTimestamp` ohne Änderung des Verhaltens | erfüllt; die entfernten Zeilen aus `RevisionDisplay.tsx` und `revisionApi.ts` stehen unverändert in `src/commitDate.ts` und `src/timestamp.ts` (`git diff 13ad9c7 33e87d5`) |
| `src/test-setup.ts`: `showModal()` und `close()` für jsdom | erfüllt; `close()` löst `close` nur bei offenem Dialog aus |
| `allowImportingTsExtensions` in `tsconfig.json` | nach Entscheidung des Softwarearchitekten zulässig |
| Abnahmekriterium 3: kein fester Wert für Adresse, Pfad oder Port | erfüllt. `git grep` nach `github`, `http:` und `https:` im Programmcode der Oberfläche findet nur das Prüfmuster in `src/repository.ts` und die schon bestehenden Vorgaben in `vite.config.ts` und `playwright.config.ts`. Die Adresse steht nur in `package.json` und als Erwartungswert in Tests. |
| E10 in neuen Texten | erfüllt; Suche des Prüfskripts bestanden, keine Kurzform „Studio“ ohne „pipwerk “ in `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md` und `components/pipwerk-studio/README.md` (`grep -P "(?<!pipwerk )\bStudio\b"` ohne Treffer) |
| `.gitignore` mit `frontend/dist-e2e/` | erfüllt; nach den Läufen ist `dist-e2e` als ignoriert gelistet (`git status --ignored`) |

### Tests gegen Abschnitt 4.1 und 4.2

- Abschnitt 4.1: alle Punkte umgesetzt in `src/App.test.tsx`, `src/AboutDialog.test.tsx`, `src/buildRevision.test.ts`, `src/repository.test.ts`, `src/commitDate.test.ts`, `src/timestamp.test.ts`, `buildinfo/gitRevision.test.ts` und `buildinfo/viteConfig.test.ts`. Die Tests unter `buildinfo/` laufen in der Umgebung `node` (Kommentar `@vitest-environment node`).
- Abnahmekriterium 2: Die bestehenden Tests von Fußzeile und Tooltip sind unverändert. `git diff 13ad9c7 33e87d5` zeigt in `e2e/studio.spec.ts` vor dem neuen Teil nur zwei geänderte Importzeilen und in `src/App.test.tsx` nur neue Tests und einen Import. Keine andere bestehende Testdatei ist geändert (`git show --stat`).
- Abschnitt 4.2: alle Punkte umgesetzt, mit den Abweichungen F3 und F4. Der Browsertest läuft gegen die gebaute Oberfläche (`playwright.config.ts`, Zeile 39: `vite build --outDir dist-e2e` und `vite preview --outDir dist-e2e`; Zeitbegrenzung 180 Sekunden, Zeile 43).

### Eigene Proben

Alle Probedateien habe ich nach dem Lauf gelöscht; `git status` zeigt danach nur meine Berichtsdateien.

1. Bau ohne `LICENSE`: `LICENSE` im Arbeitsverzeichnis umbenannt, `npm run build` ausgeführt: Der Bau endet mit einem Fehler von Rolldown zum nicht auflösbaren Import in `src/AboutDialog.tsx`. Danach `LICENSE` zurückbenannt. Die Aussage zu E7 in der technischen Dokumentation (Zeile 189) stimmt für `npm run build`.
2. Gegenprobe zu `buildinfo/viteConfig.test.ts`: Mit einer vorübergehenden Testdatei geprüft, dass `searchForWorkspaceRoot` hier das Verzeichnis `frontend` liefert, dass der Entwicklungsserver `README.md` aus dem Wurzelverzeichnis ausliefert, wenn das Wurzelverzeichnis freigegeben ist, und `LICENSE` ablehnt, wenn nur `frontend` freigegeben ist. Der Test erkennt also eine zu weite und eine fehlende Freigabe.
3. Fokus bei offenem Dialog: Mit einer vorübergehenden Datei unter `e2e/` den Dialog geöffnet, sechsmal Tab und viermal Umschalt+Tab gedrückt und jeweils `document.activeElement` aufgezeichnet. Chromium: `BODY, PRE, A, BUTTON, BODY, PRE, BODY, BUTTON, A, PRE`. WebKit: `BODY, DIALOG, PRE, A, BUTTON, BODY, BUTTON, A, PRE, DIALOG`. Firefox: Fokus bleibt nach Tab auf „Schließen“, mit Umschalt+Tab `A, PRE, DIALOG`. Grundlage von F3.
4. Größe des Dialogs (Abschnitt 3.2) bei den Fenstergrößen 1280×720, 800×400, 800×300, 360×640 und 320×240 in allen drei Browsern gemessen: Abstand zum linken Rand 19 px und mehr, Lizenzfeld schrumpft bis auf 48 px, „Schließen“ liegt immer im sichtbaren Bereich des Dialogs und des Fensters. Bei 320×240 bekommt der Dialog selbst eine Bildlaufleiste; „Schließen“ ist trotzdem sichtbar. Ein automatischer Test dafür ist in Abschnitt 4.2 nicht verlangt.

### Dokumentation

- `docs/technical/pipwerk-studio.md`: Abschnitt 2.7 mit E1 bis E9, Aufbau, Ermittlung beim Bau, Abbruch ohne `LICENSE`, Freigabe für den Entwicklungsserver und Grenze im Entwicklungsbetrieb vorhanden. Neue Dateien in Abschnitt 2.3 vorhanden. Abschnitt 6.2 mit den Frontend-Tests des Dialogs, Abschnitt 6.3 mit dem verlangten Titel und den Browsertests des Dialogs, Unterprozesse beim Bau in Abschnitt 8 und Grenze in Abschnitt 9 vorhanden. Abschnitt 6.4 ist nicht geändert. Mängel: F1, F2 und die Aussagen in F3 und F4.
- `docs/user/pipwerk-studio.md`: neue Schaltfläche in Abschnitt 3, neuer Abschnitt 4 zum Dialog mit Öffnen, Inhalt, beiden Anzeigen des Stands mit Beispiel, „unbekannt“ bei Stand und Repository, Sperrung, Schließen, Fokus, Sprachwechsel, Stand in der Testumgebung, allen drei Punkten der Grenze und Internetverbindung. Glossar in Abschnitt 7 mit allen zwölf Begriffen aus Abschnitt 7 der Spezifikation. Die bestehenden Erklärungen verweisen auf das Glossar. Die Verweise auf Abschnittsnummern stimmen nach der Umnummerierung. Die Verständlichkeit für Anwender prüft die QA.
- `components/pipwerk-studio/README.md`: Satz zum Dialog in der Beschreibung des Stands vorhanden.

## Nicht geprüft

- Die Aussage der technischen Dokumentation, Vite lade die Konfiguration im Entwicklungsbetrieb bei Änderungen an `vite.config.ts` und an davon geladenen Dateien neu (Zeile 187). Sie ist dort selbst als „nicht am Rechner geprüft“ gekennzeichnet.
- Ein Bau ohne Git-Arbeitsbereich von Hand. Abgedeckt ist er durch den Test „returns null with one warning outside of any Git working tree“ in `buildinfo/gitRevision.test.ts` mit echtem Git.
- Das Aussehen des Dialogs. Gemessen habe ich nur Lage und Größe (Probe 4).

## Geltung

Dieser Bericht gilt nur für den Commit `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1`.
