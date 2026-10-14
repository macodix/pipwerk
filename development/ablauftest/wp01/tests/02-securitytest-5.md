# Testbericht Sicherheitstest, Auftrag 02, Durchlauf 5

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/02-securitytest-5-order.md` auf dem Zweig `ablauftest/wp01`; weiter geltend `development/ablauftest/wp01/tests/02-securitytest-1-order.md`
- geprüfter Commit: `dcf3d5097706084b183001edeba8a434276a3cca` (Zweig `ablauftest/wp01-02`)
- Vergleichsstand: `6202ce6da499fa7443b39acef892c543804294b4` (Durchlauf 4, bestanden)
- Datum: 2026-10-14

## Ergebnis

**bestanden**

Keine Befunde. Die Änderung seit `6202ce6` betrifft nur einen Kommentar und verursacht keine neuen Sicherheitsprobleme. Die Ergebnisse aus Durchlauf 1 bis 4 gelten für diesen Commit weiter. Die Hinweise unten haben keinen Einfluss auf das Ergebnis.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/02.md`, einschließlich des Abschnitts „Anpassung nach drei Durchläufen“ (Stand Zweig `ablauftest/wp01`)
- Spezifikation `development/ablauftest/specification.md`, Abschnitte 3.4 bis 3.6 und 5
- `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md`, Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md` (jeweils Stand des geprüften Commits)
- eigener Bericht Durchlauf 4 `development/ablauftest/wp01/tests/02-securitytest-4.md`
- BSI IT-Grundschutz CON.8 und APP.7, OWASP ASVS (Ausgabekodierung, Konfiguration, Fehlerbehandlung, Abhängigkeiten)

## Kontrolle des Commits

- `git checkout --detach dcf3d5097706084b183001edeba8a434276a3cca`, danach `git rev-parse HEAD`: `dcf3d5097706084b183001edeba8a434276a3cca`.
- `git log`: Elternteil ist `6202ce6da499fa7443b39acef892c543804294b4`, Autor `macodix`.
- `git diff --stat 6202ce6 dcf3d50`: genau 1 Datei, `components/pipwerk-studio/frontend/src/AboutDialog.tsx`, 4 Zeilen eingefügt, 4 entfernt.
- Der Diff ändert ausschließlich die Kommentarzeilen 38 bis 41 vor dem `useEffect`, der den Fokus im Dialog hält. Kein Code, keine Tests, keine Konfiguration, keine Abhängigkeiten, keine Dokumentation sind geändert. Die Angabe des Entwicklers im Prüfauftrag trifft zu.

## Durchgeführte Prüfungen und Nachweise

| Nr. | Prüfung | Ergebnis |
|---|---|---|
| P1 | `npm ci` im Frontend | erfolgreich |
| P2 | `npm run typecheck` (`tsc --noEmit`) | keine Meldung |
| P3 | `npm test` (Vitest) | 14 Testdateien, 244 Tests bestanden (wie Durchlauf 4) |
| P4 | `npm run build` | erfolgreich; nur die bekannte Warnung von Vite zur Größe eines Chunks |
| P5 | `npm run e2e` (Playwright, Chromium, Firefox, WebKit, gegen die gebaute Oberfläche) | 39 bestanden, 6 übersprungen (wie Durchlauf 4: je Browser die beiden Tests ohne Git-Arbeitsbereich). Bestanden u. a. „locks the rest of the page while the dialog is open“, „keeps the focus in the open dialog after every key press of Tab and Shift+Tab“, „makes no request to another address when it opens and while it is open“, „opens the link to the repository in a new tab“. |
| P6 | `npm audit` | 1 Meldung „high“ zu `source-map-js` (GHSA-68fv-2mgg-jv7q), unverändert, siehe Hinweis H1 |
| P7 | Durchsicht des vollständigen Diffs `6202ce6..dcf3d50` | nur Kommentar, siehe Bewertung |
| P8 | Suche in `src/` und `buildinfo/` nach `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function` | keine Treffer |
| P9 | Suche in der gebauten Datei `dist/assets/index-Bfv_xQNy.js` nach `/srv/`, `/home/`, `/tmp/`, `file://`, nach der Adresse des Repositorys und nach dem eingesetzten Stand | 0 Treffer für Pfade; `https://github.com/macodix/pipwerk` genau einmal; Stand mit Commit `dcf3d5097706084b183001edeba8a434276a3cca` und Datum `2026-10-14T08:58:29+02:00` genau einmal, als Argument der Prüffunktion (nach Spezifikation Abschnitt 5 öffentlich) |
| P10 | `git diff -i -G` zwischen beiden Commits nach `srv/`, `/home/`, `/Users/`, `password`, `passwd`, `secret`, `token`, `apikey`, `api_key`, `private key`, `.lan`, `.local` | keine Treffer |
| P11 | Abgleich des neuen Kommentars mit E8 (`docs/technical/pipwerk-studio.md` Zeile 176) und Abschnitt 6.3 (Zeile 415) | übereinstimmend, siehe Bewertung |

## Bewertung der Änderung

1. Der neue Kommentar in `components/pipwerk-studio/frontend/src/AboutDialog.tsx` Zeilen 38 bis 41 gibt die Begründung aus E8 wieder: Ohne eigenen Code verlässt der Fokus den Dialog oder landet auf dem Dialogelement selbst; gemessen in Chromium, Firefox und WebKit; der Dialog hält den Fokus deshalb selbst, Tab und Umschalt+Tab setzen an den Enden am anderen Ende fort. Das stimmt mit dem Code in Zeilen 42 bis 74 überein.
2. Der Kommentar enthält keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade (P10). Kommentare gelangen nicht in die gebaute Datei (P9 ohne Pfadtreffer).
3. Die Logik der Fokusführung (Zeilen 42 bis 74) ist unverändert und im Browsertest in allen drei Browsern bestanden (P5).

## Bestätigung der bisherigen Ergebnisse

Die Ergebnisse aus Durchlauf 1 bis 4 gelten für diesen Commit weiter, weil kein Code geändert ist und P1 bis P10 dasselbe Bild ergeben: Git-Unterprozesse beim Bau in `buildinfo/gitRevision.ts` unverändert und getestet (P3); erneute Prüfung des eingesetzten Werts im Browser unverändert (P9); Texte als Text (P8); Verweis mit `rel="noopener noreferrer"` unverändert; keine Netzwerkanfrage des Dialogs (P5); Freigabe in `server.fs.allow` nur für die Datei `LICENSE` und dieselbe Datei mit `?raw` (`vite.config.ts` unverändert, `buildinfo/viteConfig.test.ts` bestanden in P3); keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners (P9, P10).

## Kontrolle der vorherigen Befunde

Durchlauf 4 hatte keine Befunde. Die Hinweise H1 bis H5 bestehen unverändert, weil die betroffenen Dateien nicht geändert sind.

## Befunde

Keine.

## Hinweise ohne Einfluss auf das Ergebnis

- **H1** (unverändert) `npm audit` meldet für `source-map-js` eine Schwachstelle der Stufe „high“ (GHSA-68fv-2mgg-jv7q). Das Paket kommt nur über Entwicklungsabhängigkeiten und wirkt beim Bau und in den Tests, nicht in der ausgelieferten Oberfläche. Die Entscheidung über eine Aktualisierung nach Regel 8.2 Nr. 9 und 8.3 Nr. 6 liegt beim Softwarearchitekten.
- **H2** (unverändert) Die Fehlerseite des Entwicklungsservers von Vite listet bei abgelehnten Anfragen die Einträge von `server.fs.allow` mit absolutem Pfad. Das betrifft nur den Entwicklungsserver auf `127.0.0.1`.
- **H3** (unverändert) Der Browsertest zum Verweis prüft `rel` und die Adresse des neuen Tabs, nicht `window.opener` im neuen Tab. Spezifikation Abschnitt 4.2 verlangt das nicht.
- **H4** (unverändert) Zwei Typzusicherungen in Testcode (`e2e/studio.spec.ts` Zeile 296, `src/AboutDialog.test.tsx` Zeile 377), nicht an einer Sicherheitsgrenze.
- **H5** (unverändert, Spezifikation, Zuständigkeit Softwarearchitekt) `development/ablauftest/specification.md` Zeile 28 (E8, Stand Zweig `ablauftest/wp01`) sagt weiter, der Browser „hält den Fokus im Dialog“, und das entspreche req-ui-010 „ohne eigene Sperrlogik“. Der angepasste Auftrag 02, die technische Dokumentation (E8, Zeile 176) und jetzt auch der Kommentar im Code sagen, dass der Dialog den Fokus selbst hält. Für die Sicherheit ist das ohne Wirkung, weil der eigene Code die Sperrung verstärkt und nicht schwächt.

## Arbeitsverzeichnis

Die von meinen Prüfläufen erzeugten ignorierten Dateien (`frontend/node_modules`, `frontend/dist`, `frontend/dist-e2e`, `frontend/test-results`, `backend/.venv`, `backend/src/pipwerk_studio/__pycache__`) habe ich danach mit `git clean -fdX -- components/pipwerk-studio` entfernt. Nicht versioniert sind nur meine Berichte `01-securitytest-1.md` bis `01-securitytest-3.md`, `02-securitytest-1.md` bis `02-securitytest-4.md` und dieser Bericht.

## Geltung

Dieser Bericht gilt nur für den Commit `dcf3d5097706084b183001edeba8a434276a3cca`.
