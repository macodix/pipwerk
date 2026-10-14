# Testbericht Sicherheitstest, Auftrag 02, Durchlauf 3

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/02-securitytest-3-order.md` auf dem Zweig `ablauftest/wp01`; weiter geltend `development/ablauftest/wp01/tests/02-securitytest-1-order.md`
- geprüfter Commit: `d52e3ba3d687e2347467fbd4dbd81aea91f899b1` (Zweig `ablauftest/wp01-02`)
- Vergleichsstand: `92381f9525193e02566e685bae2223d518cf95bd` (Durchlauf 2, bestanden)
- Datum: 2026-10-14

## Ergebnis

**bestanden**

Keine Befunde. Die Änderung seit `92381f9` verursacht keine neuen Sicherheitsprobleme. Die Ergebnisse aus Durchlauf 1 und 2 gelten für diesen Commit weiter. Die Hinweise unten haben keinen Einfluss auf das Ergebnis.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/02.md`
- Spezifikation `development/ablauftest/specification.md`, Abschnitte 3.4 bis 3.6 und 5
- `docs/technical/development-test-security-rules.md` Abschnitte 8 und 9, `docs/technical/pipwerk-studio.md`, Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md` (jeweils Stand des geprüften Commits)
- Funktionstestbericht `development/ablauftest/wp01/tests/02-functiontest-2.md`, Befunde F6 und F7 (Anlass der Änderung)
- eigener Bericht Durchlauf 2 `development/ablauftest/wp01/tests/02-securitytest-2.md`
- BSI IT-Grundschutz CON.8 und APP.7, OWASP ASVS (Ausgabekodierung, Konfiguration, Fehlerbehandlung, Abhängigkeiten)

## Kontrolle des Commits

- `git checkout --detach d52e3ba3d687e2347467fbd4dbd81aea91f899b1`, danach `git rev-parse HEAD`: `d52e3ba3d687e2347467fbd4dbd81aea91f899b1`.
- `git log`: Elternteil ist `92381f9525193e02566e685bae2223d518cf95bd`.
- `git diff --stat 92381f9 d52e3ba`: genau 1 Datei, `docs/technical/pipwerk-studio.md`, 3 Zeilen eingefügt, 3 entfernt. Die Angabe des Entwicklers im Prüfauftrag trifft zu.
- Code, Tests, Konfiguration, `package.json`, `package-lock.json` und `docs/technical/development-test-security-rules.md` sind nicht geändert. Es gibt keine neuen oder geänderten Abhängigkeiten.

## Durchgeführte Prüfungen und Nachweise

| Nr. | Prüfung | Ergebnis |
|---|---|---|
| P1 | `npm ci` im Frontend | erfolgreich |
| P2 | `npm run typecheck` (`tsc --noEmit`, `strict`) | keine Meldung |
| P3 | `npm test` (Vitest) | 14 Testdateien, 244 Tests bestanden (wie Durchlauf 2) |
| P4 | `npm run build` | erfolgreich; nur die bekannte Warnung von Vite zur Größe eines Chunks |
| P5 | `npm run e2e` (Playwright, Chromium, Firefox, WebKit, gegen die gebaute Oberfläche) | 39 bestanden, 6 übersprungen (wie Durchlauf 2: je Browser die beiden Tests ohne Git-Arbeitsbereich, vorgesehen, weil das Arbeitsverzeichnis ein Git-Arbeitsbereich ist). Bestanden u. a. „locks the rest of the page while the dialog is open“, „keeps the focus in the open dialog after every key press of Tab and Shift+Tab“, „makes no request to another address …“, „opens the link to the repository in a new tab“. |
| P6 | `npm audit` | 1 Meldung „high“ zu `source-map-js` (GHSA-68fv-2mgg-jv7q), unverändert, siehe Hinweis H1 |
| P7 | Durchsicht des vollständigen Diffs `92381f9..d52e3ba` | siehe Bewertung |
| P8 | Suche in `src/` und `buildinfo/` nach `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function` | keine Treffer |
| P9 | Suche in der gebauten Datei `dist/assets/*.js` nach `/srv/`, `/home/`, `/tmp/`, `file://`, nach der Adresse des Repositorys und nach dem eingesetzten Stand | keine Pfade; `https://github.com/macodix/pipwerk` genau einmal; Stand `commit:\`d52e3ba3d687e2347467fbd4dbd81aea91f899b1\`,committedAt:\`2026-10-14T08:47:29+02:00\`` als Argument der Prüffunktion aus `src/buildRevision.ts` (nach Spezifikation Abschnitt 5 öffentlich) |
| P10 | `git diff -i -G` zwischen beiden Commits nach `srv/`, `/home/`, `/Users/`, `password`, `passwd`, `secret`, `token`, `apikey`, `api_key`, `private key` und Rechnernamen mit `.lan` oder `.local` | keine Treffer |
| P11 | Abgleich der drei geänderten Aussagen in `docs/technical/pipwerk-studio.md` mit Code und Tests | übereinstimmend, siehe Bewertung |

## Bewertung der Änderung

1. **E8** (`docs/technical/pipwerk-studio.md` Zeile 176): Der Verweis zeigt jetzt auf den Punkt „Fokus im Dialog“ (Zeile 185), in dem der Fokus-Code beschrieben ist. Die Aussage zur Messung ist präzisiert (Dokument; in WebKit auch Dialogelement). Keine sicherheitsrelevante Aussage ist abgeschwächt: Die Sperrung durch `showModal()` und das Schließen mit Escape bleiben beschrieben wie umgesetzt.
2. **Fokus im Dialog** (Zeile 185): Die Beschreibung nennt den Selektor `a[href], button:not([disabled]), [tabindex="0"]` und die Reihenfolge Lizenzfeld, Verweis, „Schließen“. Das stimmt mit `src/AboutDialog.tsx` überein: Selektor als feste Zeichenkette in Zeile 52, Bestimmung bei jedem Tastendruck in Zeilen 51 bis 53, Behandler nur bei offenem Dialog (Zeilen 43 bis 45 und 48) und Entfernen beim Schließen (Zeilen 72 bis 74). Die Aussage, dass der Verweis bei ungültiger Adresse fehlt, entspricht der Prüfung in `src/repository.ts`, die der Punkt „Repository“ (Zeile 183) beschreibt.
3. **Abschnitt 6.3, Sperrung** (Zeile 414): Die Beschreibung entspricht dem Browsertest `e2e/studio.spec.ts` Zeilen 367 bis 394 (`document.elementFromPoint` liegt nicht in `.studio-header`, Klick setzt den Fokus nicht auf Sprachauswahl oder Schaltfläche, Dialog bleibt offen, Sprache bleibt `de`). Der Test ist in allen drei Browsern bestanden (P5).
4. **Ergebnisse aus Durchlauf 1 und 2** gelten weiter, weil kein Code geändert ist und P1 bis P10 dasselbe Bild ergeben: Git-Unterprozesse beim Bau in `buildinfo/gitRevision.ts` unverändert und getestet (P3); erneute Prüfung des eingesetzten Werts im Browser unverändert (P9); Texte als Text (P8); Verweis mit `rel="noopener noreferrer"` unverändert; keine Netzwerkanfrage des Dialogs (P5); Freigabe in `server.fs.allow` nur für die Datei `LICENSE` und dieselbe Datei mit `?raw` (`vite.config.ts` unverändert, `buildinfo/viteConfig.test.ts` bestanden in P3); keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners (P9, P10).

## Kontrolle der vorherigen Befunde

Durchlauf 2 hatte keine Befunde. Die Hinweise H1 bis H4 bestehen unverändert, weil die betroffenen Dateien nicht geändert sind.

## Befunde

Keine.

## Hinweise ohne Einfluss auf das Ergebnis

- **H1** (unverändert) `npm audit` meldet für `source-map-js` eine Schwachstelle der Stufe „high“ (GHSA-68fv-2mgg-jv7q). Das Paket kommt nur über Entwicklungsabhängigkeiten und wirkt beim Bau und in den Tests, nicht in der ausgelieferten Oberfläche. Die Entscheidung über eine Aktualisierung nach Regel 8.2 Nr. 9 und 8.3 Nr. 6 liegt beim Softwarearchitekten.
- **H2** (unverändert) Die Fehlerseite des Entwicklungsservers von Vite listet bei abgelehnten Anfragen die Einträge von `server.fs.allow` mit absolutem Pfad. Das betrifft nur den Entwicklungsserver auf `127.0.0.1`.
- **H3** (unverändert) Der Browsertest zum Verweis prüft `rel` und die Adresse des neuen Tabs, nicht `window.opener` im neuen Tab. Spezifikation Abschnitt 4.2 verlangt das nicht.
- **H4** (unverändert) Zwei Typzusicherungen in Testcode (`e2e/studio.spec.ts` Zeile 296, `src/AboutDialog.test.tsx` Zeile 377), nicht an einer Sicherheitsgrenze.
- **H5** (neu, Spezifikation, Zuständigkeit Softwarearchitekt) `development/ablauftest/specification.md` Zeile 28 (E8) sagt weiter, der Browser „hält den Fokus im Dialog“ und das entspreche req-ui-010 „ohne eigene Sperrlogik“. Die technische Dokumentation (E8, Zeile 176) und der Code halten den Fokus selbst. Für die Sicherheit ist das ohne Wirkung, weil der eigene Code die Sperrung verstärkt und nicht schwächt. Derselbe Hinweis steht schon im Funktionstestbericht `02-functiontest-2.md`.

## Arbeitsverzeichnis

Die von meinen Prüfläufen erzeugten ignorierten Dateien (`frontend/node_modules`, `frontend/dist`, `frontend/test-results`) habe ich danach mit `git clean -fdX -- components/pipwerk-studio` entfernt. Nicht versioniert sind nur meine Berichte `01-securitytest-1.md` bis `01-securitytest-3.md`, `02-securitytest-1.md`, `02-securitytest-2.md` und dieser Bericht.

## Geltung

Dieser Bericht gilt nur für den Commit `d52e3ba3d687e2347467fbd4dbd81aea91f899b1`.
