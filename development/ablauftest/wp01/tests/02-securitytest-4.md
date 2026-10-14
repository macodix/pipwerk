# Testbericht Sicherheitstest, Auftrag 02, Durchlauf 4

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/02-securitytest-4-order.md` auf dem Zweig `ablauftest/wp01`; weiter geltend `development/ablauftest/wp01/tests/02-securitytest-1-order.md`
- geprüfter Commit: `6202ce6da499fa7443b39acef892c543804294b4` (Zweig `ablauftest/wp01-02`)
- Vergleichsstand: `d52e3ba3d687e2347467fbd4dbd81aea91f899b1` (Durchlauf 3, bestanden)
- Datum: 2026-10-14

## Ergebnis

**bestanden**

Keine Befunde. Die Änderung seit `d52e3ba` verursacht keine neuen Sicherheitsprobleme. Die Ergebnisse aus Durchlauf 1 bis 3 gelten für diesen Commit weiter. Die Hinweise unten haben keinen Einfluss auf das Ergebnis.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/02.md`, einschließlich des Abschnitts „Anpassung nach drei Durchläufen“ (Stand Zweig `ablauftest/wp01`, Commit `436de8d`)
- Spezifikation `development/ablauftest/specification.md`, Abschnitte 3.4 bis 3.6 und 5
- `docs/technical/development-test-security-rules.md` Abschnitte 8 und 9, `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md`, Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md` (jeweils Stand des geprüften Commits)
- eigener Bericht Durchlauf 3 `development/ablauftest/wp01/tests/02-securitytest-3.md`
- BSI IT-Grundschutz CON.8 und APP.7, OWASP ASVS (Ausgabekodierung, Konfiguration, Fehlerbehandlung, Abhängigkeiten)

## Kontrolle des Commits

- `git checkout --detach 6202ce6da499fa7443b39acef892c543804294b4`, danach `git rev-parse HEAD`: `6202ce6da499fa7443b39acef892c543804294b4`.
- `git log`: Elternteil ist `d52e3ba3d687e2347467fbd4dbd81aea91f899b1`, Autor `macodix`.
- `git diff --stat d52e3ba 6202ce6`: genau 1 Datei, `docs/technical/pipwerk-studio.md`, 2 Zeilen eingefügt, 2 entfernt (Zeilen 176 und 415). Die Angabe des Entwicklers im Prüfauftrag trifft zu.
- `git diff --name-only d52e3ba 6202ce6 -- components docs/technical/development-test-security-rules.md docs/user`: keine Ausgabe. Code, Tests, Konfiguration, `package.json`, `package-lock.json`, Sicherheitsregeln und Anwenderdokumentation sind nicht geändert. Es gibt keine neuen oder geänderten Abhängigkeiten.

## Durchgeführte Prüfungen und Nachweise

| Nr. | Prüfung | Ergebnis |
|---|---|---|
| P1 | `npm ci` im Frontend | erfolgreich |
| P2 | `npm run typecheck` (`tsc --noEmit`, `strict`) | keine Meldung |
| P3 | `npm test` (Vitest) | 14 Testdateien, 244 Tests bestanden (wie Durchlauf 3) |
| P4 | `npm run build` | erfolgreich; nur die bekannte Warnung von Vite zur Größe eines Chunks |
| P5 | `npm run e2e` (Playwright, Chromium, Firefox, WebKit, gegen die gebaute Oberfläche) | 39 bestanden, 6 übersprungen (wie Durchlauf 3: je Browser die beiden Tests ohne Git-Arbeitsbereich, vorgesehen, weil das Arbeitsverzeichnis ein Git-Arbeitsbereich ist). Bestanden u. a. „locks the rest of the page while the dialog is open“, „keeps the focus in the open dialog after every key press of Tab and Shift+Tab“, „makes no request to another address when it opens and while it is open“, „opens the link to the repository in a new tab“. |
| P6 | `npm audit` | 1 Meldung „high“ zu `source-map-js` (GHSA-68fv-2mgg-jv7q), unverändert, siehe Hinweis H1 |
| P7 | Durchsicht des vollständigen Diffs `d52e3ba..6202ce6` | siehe Bewertung |
| P8 | Suche in `src/` und `buildinfo/` nach `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function` | keine Treffer |
| P9 | Suche in der gebauten Datei `dist/assets/index-CQFQkIvq.js` nach `/srv/`, `/home/`, `/tmp/`, `file://`, nach der Adresse des Repositorys und nach dem eingesetzten Stand | 0 Treffer für Pfade; `https://github.com/macodix/pipwerk` genau einmal; Stand mit Commit `6202ce6da499fa7443b39acef892c543804294b4` und Datum `2026-10-14T08:53:38+02:00` als Argument der Prüffunktion (nach Spezifikation Abschnitt 5 öffentlich) |
| P10 | `git diff -i -G` zwischen beiden Commits nach `srv/`, `/home/`, `/Users/`, `password`, `passwd`, `secret`, `token`, `apikey`, `api_key`, `private key`, `.lan`, `.local` | keine Treffer |
| P11 | Abgleich der geänderten Aussagen mit Auftrag, Code und übrigen Stellen zur Fokusführung | übereinstimmend, siehe Bewertung |

## Bewertung der Änderung

1. **E8** (`docs/technical/pipwerk-studio.md` Zeile 176): Geändert ist nur die Begründung, warum der Dialog den Fokus selbst hält. Sie lautet jetzt wie im Auftrag 02, Abschnitt „Anpassung nach drei Durchläufen“, vorgegeben: ohne Aufzählung, wohin der Fokus geht, mit Nennung der Messung in Chromium, Firefox und WebKit. Die sicherheitsrelevanten Aussagen sind unverändert: Sperrung der übrigen Oberfläche durch `showModal()`, Schließen nur mit Escape und „Schließen“, kein Schließen durch Klick neben den Dialog, eigene Fokusführung mit Verweis auf den Punkt „Fokus im Dialog“ (Zeile 185, unverändert). Keine Aussage ist abgeschwächt.
2. **Abschnitt 6.3, Fokus im Dialog** (Zeile 415): Die Prüfpunkte des Browsertests (Fokus nach jedem Tastendruck im Dialog, nie auf `body`, `html`, Dialogelement, Sprachauswahl oder Schaltfläche; Umlauf an beiden Enden) sind unverändert. Geändert ist nur der begründende Satz, gleichlautend mit E8. Der Test besteht in allen drei Browsern (P5).
3. **Übrige Stellen zur Fokusführung**: Abschnitt 2.7 Zeile 185, Abschnitt 6.2 Zeile 379 und `docs/user/pipwerk-studio.md` Zeile 73 nennen keine browserbezogene Begründung und widersprechen der neuen Aussage nicht.
4. **Ergebnisse aus Durchlauf 1 bis 3** gelten weiter, weil kein Code geändert ist und P1 bis P10 dasselbe Bild ergeben: Git-Unterprozesse beim Bau in `buildinfo/gitRevision.ts` unverändert und getestet (P3); erneute Prüfung des eingesetzten Werts im Browser unverändert (P9); Texte als Text (P8); Verweis mit `rel="noopener noreferrer"` unverändert; keine Netzwerkanfrage des Dialogs (P5); Freigabe in `server.fs.allow` nur für die Datei `LICENSE` und dieselbe Datei mit `?raw` (`vite.config.ts` unverändert, `buildinfo/viteConfig.test.ts` bestanden in P3); keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners (P9, P10).

## Kontrolle der vorherigen Befunde

Durchlauf 3 hatte keine Befunde. Die Hinweise H1 bis H4 bestehen unverändert, weil die betroffenen Dateien nicht geändert sind. H5 besteht ebenfalls unverändert.

## Befunde

Keine.

## Hinweise ohne Einfluss auf das Ergebnis

- **H1** (unverändert) `npm audit` meldet für `source-map-js` eine Schwachstelle der Stufe „high“ (GHSA-68fv-2mgg-jv7q). Das Paket kommt nur über Entwicklungsabhängigkeiten und wirkt beim Bau und in den Tests, nicht in der ausgelieferten Oberfläche. Die Entscheidung über eine Aktualisierung nach Regel 8.2 Nr. 9 und 8.3 Nr. 6 liegt beim Softwarearchitekten.
- **H2** (unverändert) Die Fehlerseite des Entwicklungsservers von Vite listet bei abgelehnten Anfragen die Einträge von `server.fs.allow` mit absolutem Pfad. Das betrifft nur den Entwicklungsserver auf `127.0.0.1`.
- **H3** (unverändert) Der Browsertest zum Verweis prüft `rel` und die Adresse des neuen Tabs, nicht `window.opener` im neuen Tab. Spezifikation Abschnitt 4.2 verlangt das nicht.
- **H4** (unverändert) Zwei Typzusicherungen in Testcode (`e2e/studio.spec.ts` Zeile 296, `src/AboutDialog.test.tsx` Zeile 377), nicht an einer Sicherheitsgrenze.
- **H5** (unverändert, Spezifikation, Zuständigkeit Softwarearchitekt) `development/ablauftest/specification.md` Zeile 28 (E8, Stand Zweig `ablauftest/wp01`, Commit `436de8d`) sagt weiter, der Browser „hält den Fokus im Dialog“, und das entspreche req-ui-010 „ohne eigene Sperrlogik“. Der angepasste Auftrag 02 und die technische Dokumentation (E8, Zeile 176) sagen, dass der Dialog den Fokus selbst hält. Für die Sicherheit ist das ohne Wirkung, weil der eigene Code die Sperrung verstärkt und nicht schwächt.

## Arbeitsverzeichnis

Die von meinen Prüfläufen erzeugten ignorierten Dateien (`frontend/node_modules`, `frontend/dist`, `frontend/dist-e2e`, `frontend/test-results`, `backend/.venv`, `backend/src/pipwerk_studio/__pycache__`) habe ich danach mit `git clean -fdX -- components/pipwerk-studio` entfernt. Nicht versioniert sind nur meine Berichte `01-securitytest-1.md` bis `01-securitytest-3.md`, `02-securitytest-1.md` bis `02-securitytest-3.md` und dieser Bericht.

## Geltung

Dieser Bericht gilt nur für den Commit `6202ce6da499fa7443b39acef892c543804294b4`.
