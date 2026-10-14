# Testbericht Sicherheitstest, Auftrag 02, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/02-securitytest-2-order.md` auf dem Zweig `ablauftest/wp01`; weiter geltend `development/ablauftest/wp01/tests/02-securitytest-1-order.md`
- geprüfter Commit: `92381f9525193e02566e685bae2223d518cf95bd` (Zweig `ablauftest/wp01-02`)
- Vergleichsstand: `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1` (Durchlauf 1, bestanden)
- Datum: 2026-10-14

## Ergebnis

**bestanden**

Keine Befunde. Die Änderungen seit `33e87d5` verursachen keine neuen Sicherheitsprobleme. Die Ergebnisse aus Durchlauf 1 gelten für diesen Commit weiter. Die Hinweise unten haben keinen Einfluss auf das Ergebnis.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/02.md`
- Spezifikation `development/ablauftest/specification.md`, Abschnitte 3.4 bis 3.6 und 5
- `docs/technical/development-test-security-rules.md` Abschnitte 8 und 9, `docs/technical/pipwerk-studio.md`, Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md` (jeweils Stand des geprüften Commits)
- Funktionstestbericht `development/ablauftest/wp01/tests/02-functiontest-1.md` (Anlass der Änderungen)
- BSI IT-Grundschutz CON.8 und APP.7, OWASP ASVS (Ausgabekodierung, Konfiguration, Fehlerbehandlung, Abhängigkeiten)

## Kontrolle des Commits

- `git checkout --detach 92381f9525193e02566e685bae2223d518cf95bd`, danach `git rev-parse HEAD`: `92381f9525193e02566e685bae2223d518cf95bd`.
- `git log`: Elternteil ist `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1`.
- `git diff --stat 33e87d5 92381f9`: 6 Dateien, 175 Zeilen eingefügt, 30 entfernt:
  - `components/pipwerk-studio/frontend/src/AboutDialog.tsx`
  - `components/pipwerk-studio/frontend/src/AboutDialog.test.tsx`
  - `components/pipwerk-studio/frontend/e2e/studio.spec.ts`
  - `components/pipwerk-studio/frontend/tsconfig.json`
  - `docs/technical/pipwerk-studio.md`
  - `docs/user/pipwerk-studio.md`
- Nicht geändert sind unter anderem `buildinfo/gitRevision.ts`, `vite.config.ts`, `src/buildRevision.ts`, `src/repository.ts`, `src/App.tsx`, `playwright.config.ts`, `package.json`, `package-lock.json` und `docs/technical/development-test-security-rules.md`. Es gibt also keine neuen oder geänderten Abhängigkeiten. Auch die Git-Unterprozesse beim Bau und die Freigabe in `server.fs.allow` sind nicht geändert.

## Durchgeführte Prüfungen und Nachweise

| Nr. | Prüfung | Ergebnis |
|---|---|---|
| P1 | `npm ci` im Frontend | erfolgreich |
| P2 | `npm run typecheck` (`tsc --noEmit`, `strict`) | keine Meldung |
| P3 | `npm test` (Vitest) | 14 Testdateien, 244 Tests bestanden (Durchlauf 1: 238; neu sind 6 Tests unter „AboutDialog focus“) |
| P4 | `npm run build` | erfolgreich; nur die bekannte Warnung von Vite zur Größe eines Chunks |
| P5 | `npm run e2e` (Playwright, Chromium, Firefox, WebKit, gegen die gebaute Oberfläche mit `vite preview`) | 39 bestanden, 6 übersprungen: „shows no tooltip without a Git working tree“ und der neue Test „shows unknown in the dialog without a Git working tree“, je Browser. Beides ist vorgesehen, weil das Arbeitsverzeichnis ein Git-Arbeitsbereich ist. |
| P6 | `npm audit` | 1 Meldung „high“ zu `source-map-js` (GHSA-68fv-2mgg-jv7q), unverändert gegenüber Durchlauf 1, siehe Hinweis H1 |
| P7 | Durchsicht des vollständigen Diffs `33e87d5..92381f9` und der ganzen Datei `src/AboutDialog.tsx` | siehe Bewertung |
| P8 | Suche in `src/` und `buildinfo/` nach `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function` | keine Treffer |
| P9 | Suche in der gebauten Datei `dist/assets/*.js` nach `/srv/`, `/home/`, `/tmp/`, `file://`, nach allen Adressen `http(s)://` und nach dem eingesetzten Stand | keine Pfade; dieselben Adressen wie in Durchlauf 1 (Namensräume von `www.w3.org`, Verweise in Fehlertexten von React, React Flow und react-i18next, Adressen im Lizenztext, `https://github.com/macodix/pipwerk` genau einmal); Stand siehe Bewertung, Punkt 4 |
| P10 | `git diff -i -G` zwischen beiden Commits nach `srv/`, `/home/`, `/Users/`, `password`, `passwd`, `secret`, `token`, `apikey`, `api_key`, `private key` und Rechnernamen mit `.lan` oder `.local` | keine Treffer |
| P11 | Abgleich der geänderten Sicherheits- und Verhaltensaussagen in `docs/technical/pipwerk-studio.md` (E8 Zeile 176, „Fokus im Dialog“ Zeile 185, Abschnitt 6.3 Zeilen 414 und 415) und `docs/user/pipwerk-studio.md` (Zeile 73) mit dem Code | übereinstimmend |

## Bewertung der Änderungen

1. **Eigene Fokusführung im Dialog** (`src/AboutDialog.tsx`, Zeilen 38 bis 75):
   - Ein Ereignisbehandler für `keydown` wird am Dokument nur eingehängt, solange `open` wahr ist (Zeilen 43 bis 45). Die Aufräumfunktion des Effekts entfernt ihn beim Schließen und beim Aushängen (Zeilen 72 bis 74). Zusätzlich wirkt er nur bei geöffnetem Element (`dialog.open`, Zeile 48). Der Test „does not use Tab after the dialog is closed“ (`src/AboutDialog.test.tsx`, Zeilen 388 bis 398) belegt, dass Tab nach dem Schließen nicht abgefangen wird.
   - Der Behandler reagiert nur auf die Taste Tab (Zeile 48). Escape und alle anderen Tasten bleiben unberührt. Der Weg zum Schließen mit Escape (E8) besteht weiter; der Browsertest „Schließen“ ist in allen drei Browsern bestanden (P5).
   - Der Behandler liest keine Eingabe aus und gibt nichts aus. Er setzt nur den Fokus auf Elemente im eigenen Dialog. Der Selektor in Zeile 52 ist eine feste Zeichenkette ohne eingesetzte Werte. Es gibt keine Netzwerkanfrage, kein HTML und keine Speicherung.
   - Die Sperrung der übrigen Oberfläche wird dadurch nicht geschwächt. Der Browsertest „keeps the focus in the open dialog after every key press of Tab and Shift+Tab“ (`e2e/studio.spec.ts`, Zeilen 396 bis 429) prüft nach jedem von 16 Tastendrücken, dass der Fokus im Dialog liegt und nie auf Sprachauswahl oder Schaltfläche der Kopfzeile. Er ist in Chromium, Firefox und WebKit bestanden (P5). Die Sperrung für die Maus prüft weiter der Test „locks the rest of the page while the dialog is open“, ebenfalls bestanden.
2. **Browsertests** (`e2e/studio.spec.ts`): Der Fall „unbekannt“ ist jetzt ein eigener Test mit `test.skip` (Zeilen 314 bis 325). Neue feste Adressen, Pfade, Ports oder Zugangsdaten kommen nicht hinzu (P10). Die Tests nutzen weiter isolierte Browserkontexte und das Backend aus `e2e/start-backend.mjs` mit temporärer Datenbank (Regel Abschnitt 9, Playwright).
3. **`tsconfig.json`**: nur ein Leerzeichen in der Liste `include`. `strict` und die übrigen Optionen sind unverändert (P2).
4. **Ergebnisse aus Durchlauf 1** gelten für diesen Commit weiter, weil die geprüften Dateien nicht geändert sind (siehe „Kontrolle des Commits“) und die Läufe P1 bis P10 dasselbe Bild ergeben:
   - Git-Unterprozesse beim Bau in `buildinfo/gitRevision.ts`: unverändert; die Tests dazu sind in P3 bestanden.
   - Erneute Prüfung des eingesetzten Werts im Browser: In der gebauten Datei steht `commit:\`92381f9525193e02566e685bae2223d518cf95bd\`,committedAt:\`2026-10-14T08:40:39+02:00\`` als Argument der Prüffunktion aus `src/buildRevision.ts`. Die Werte sind nach Spezifikation Abschnitt 5 öffentlich.
   - Texte als Text, nicht als HTML: unverändert, keine Treffer in P8.
   - Verweis mit `rel="noopener noreferrer"`: unverändert (`src/AboutDialog.tsx` Zeile 106).
   - Keine Netzwerkanfrage des Dialogs: Der neue Code enthält keine Anfrage. Die Tests dazu (`src/AboutDialog.test.tsx` und der Browsertest ohne Anfrage an eine andere Herkunft) sind bestanden (P3, P5).
   - Freigabe in `server.fs.allow` nur für die Datei `LICENSE`: `vite.config.ts` unverändert; `buildinfo/viteConfig.test.ts` in P3 bestanden. Die Entscheidung des Softwarearchitekten ist weiter eingehalten.
   - Keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners: keine Treffer in P9 und P10.
5. **Dokumentation**: Die geänderte Aussage in E8 (`docs/technical/pipwerk-studio.md` Zeile 176) stellt richtig, dass der Browser den Fokus nicht vollständig im Dialog hält. Sie entspricht damit dem Code. Der neue Punkt „Fokus im Dialog“ (Zeile 185) beschreibt den Behandler so, wie er umgesetzt ist (nur Tab, nur bei offenem Dialog, Weiterleitung an den Enden). Der Satz zu `npm audit` steht wieder im Absatz über die Befehle von Abschnitt 6.2 (Zeile 374). Abschnitt 8 der technischen Dokumentation ist nicht geändert und muss es nicht sein, weil keine neuen Unterprozesse oder Netzwerkzugriffe hinzukommen.

## Befunde

Keine.

## Hinweise ohne Einfluss auf das Ergebnis

- **H1** (aus Durchlauf 1, unverändert) `npm audit` meldet für `source-map-js` eine Schwachstelle der Stufe „high“ (GHSA-68fv-2mgg-jv7q). Das Paket kommt nur über Entwicklungsabhängigkeiten und wirkt beim Bau und in den Tests, nicht in der ausgelieferten Oberfläche. `package-lock.json` ist in diesem Commit nicht geändert. Die Entscheidung über eine Aktualisierung nach Regel 8.2 Nr. 9 und 8.3 Nr. 6 liegt beim Softwarearchitekten.
- **H2** (aus Durchlauf 1, unverändert) Die Fehlerseite des Entwicklungsservers von Vite listet bei abgelehnten Anfragen die Einträge von `server.fs.allow` mit absolutem Pfad. Das betrifft nur den Entwicklungsserver auf `127.0.0.1`.
- **H3** (aus Durchlauf 1, unverändert) Der Browsertest zum Verweis prüft `rel` und die Adresse des neuen Tabs, nicht `window.opener` im neuen Tab. Spezifikation Abschnitt 4.2 verlangt das nicht.
- **H4** (neu) Die geänderten Tests verwenden zwei Typzusicherungen: `expected!` in `e2e/studio.spec.ts` Zeile 296 (nach `test.skip` für `expected === null`, also nur bei vorhandenem Wert erreicht) und `document.activeElement as HTMLElement` in `src/AboutDialog.test.tsx` Zeile 377 (dieselbe Form stand schon in Zeile 214). Beide stehen in Testcode und nicht an einer Sicherheitsgrenze. Die Regel für TypeScript in Abschnitt 9 der Sicherheitsregeln (kein Umgehen kritischer Typfehler) ist dadurch nicht verletzt.

## Arbeitsverzeichnis

Die von meinen Prüfläufen erzeugten ignorierten Dateien (`frontend/node_modules`, `frontend/dist`, `frontend/dist-e2e`, `frontend/test-results`, `backend/.venv`, `__pycache__`) habe ich danach mit `git clean -fdX -- components/pipwerk-studio` entfernt. Nicht versioniert sind nur meine Berichte `01-securitytest-1.md` bis `01-securitytest-3.md`, `02-securitytest-1.md` und dieser Bericht.

## Geltung

Dieser Bericht gilt nur für den Commit `92381f9525193e02566e685bae2223d518cf95bd`.
