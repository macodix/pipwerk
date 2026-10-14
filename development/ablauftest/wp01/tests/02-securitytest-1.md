# Testbericht Sicherheitstest, Auftrag 02, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/02-securitytest-1-order.md` auf dem Zweig `ablauftest/wp01`
- geprüfter Commit: `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1` (Zweig `ablauftest/wp01-02`)
- Vergleichsstand: `13ad9c7475c117e738652b534c69a394c4baa0ef`
- Datum: 2026-10-14

## Ergebnis

**bestanden**

Keine Befunde. Die Hinweise unten haben keinen Einfluss auf das Ergebnis.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/02.md`
- Spezifikation `development/ablauftest/specification.md`, Abschnitte 3.4 bis 3.6 und 5
- `docs/technical/development-test-security-rules.md` Abschnitt 8, `docs/technical/pipwerk-studio.md`, Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md` (jeweils Stand des geprüften Commits)
- BSI IT-Grundschutz CON.8 und APP.7, OWASP ASVS (Ausgabekodierung, Konfiguration, Fehlerbehandlung und Protokollierung, Abhängigkeiten)

## Kontrolle des Commits

- `git rev-parse HEAD` im Arbeitsverzeichnis ergab `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1`.
- `git diff --stat 13ad9c7…33e87d5` nennt 31 Dateien (1723 Zeilen eingefügt, 88 entfernt). `package-lock.json` ist nicht geändert. In `package.json` ist nur das Feld `repository` neu. Es gibt also keine neuen oder geänderten Abhängigkeiten.

## Durchgeführte Prüfungen und Nachweise

| Nr. | Prüfung | Ergebnis |
|---|---|---|
| P1 | `npm ci` im Frontend | erfolgreich |
| P2 | `npm run typecheck` (`tsc --noEmit`, `strict`) | keine Meldung |
| P3 | `npm test` (Vitest) | 14 Testdateien, 238 Tests bestanden |
| P4 | `npm run build` | erfolgreich; nur die bekannte Warnung von Vite zur Größe eines Chunks |
| P5 | `npm run e2e` (Playwright, Chromium, Firefox, WebKit, gegen die gebaute Oberfläche mit `vite preview`) | 36 bestanden, 3 übersprungen („shows no tooltip without a Git working tree“, je Browser; vorgesehen, weil das Arbeitsverzeichnis ein Git-Arbeitsbereich ist) |
| P6 | `npm audit` | 1 Meldung „high“ zu `source-map-js` 1.2.1 (GHSA-68fv-2mgg-jv7q), siehe Hinweis H1 |
| P7 | Durchsicht von `buildinfo/gitRevision.ts`, `vite.config.ts`, `src/buildRevision.ts`, `src/repository.ts`, `src/AboutDialog.tsx`, `src/App.tsx`, `src/timestamp.ts`, `src/commitDate.ts`, `src/test-setup.ts`, `playwright.config.ts` und der zugehörigen Tests | siehe Bewertung |
| P8 | Durchsicht des Quelltexts von Vite 8.3.1 in `node_modules/vite/dist/node/chunks/node.js` zu `server.fs.allow` | siehe Bewertung, Punkt 6 |
| P9 | Suche in der gebauten Datei `dist/assets/index-*.js` nach Pfaden des Entwicklungsrechners (`/srv/`, `/home/`, `/tmp/`, `file://`), nach allen Adressen `http(s)://` und nach dem eingesetzten Stand | keine Pfade; Adressen siehe Bewertung, Punkt 4; Stand siehe Punkt 2 |
| P10 | Suche in `src/` und `buildinfo/` nach `dangerouslySetInnerHTML`, `innerHTML`, `eval(`, `new Function` | keine Treffer |
| P11 | `git diff -i -G` zwischen beiden Commits nach Zugangsdaten, Schlüsseln, Rechner- und Benutzernamen, Pfaden des Entwicklungsrechners (`srv/`, `/home/`, `/Users/`, `password`, `passwd`, `secret`, `token`, `apikey`, `api_key`, `private key`) | keine Treffer |
| P12 | Abgleich der Sicherheitsaussagen in `docs/technical/pipwerk-studio.md` (Abschnitte 2.7 und 8, Zeilen 187, 191, 488) mit dem Code | übereinstimmend |

Nicht ausgeführt: Eine Abfrage des laufenden Entwicklungsservers über HTTP (zum Beispiel mit `curl`) war in meiner Umgebung nicht erlaubt. Ich habe den Entwicklungsserver gestartet (`vite` 8.3.1 auf `127.0.0.1`) und wieder beendet, ohne ihn abzufragen. Die Freigabe in `server.fs.allow` habe ich deshalb über den Quelltext von Vite (P8) und den bestehenden Test in `buildinfo/viteConfig.test.ts` (Teil von P3) geprüft.

## Bewertung nach den Schwerpunkten des Prüfauftrags

1. **Git-Unterprozesse beim Bau** (`components/pipwerk-studio/frontend/buildinfo/gitRevision.ts`, Zeilen 18 bis 47):
   - `execFileSync('git', ['-C', directory, ...args], …)`: feste Argumentliste, keine Option `shell`, also keine Shell.
   - `stdio: ['ignore', 'pipe', 'ignore']`: keine Eingabe, die Fehlerausgabe von Git wird verworfen. `timeout: 5000`, `encoding: 'utf-8'`.
   - `directory` ist das Verzeichnis von `vite.config.ts` aus `import.meta.url` (`vite.config.ts` Zeilen 18 und 30). Es gibt keine Eingabe von außen.
   - Die Kennung wird vor dem zweiten Aufruf gegen `^[0-9a-f]{40}$` geprüft (Zeilen 34 bis 37). Sie kann deshalb nicht mit `-` beginnen und nicht als Option von `git log` wirken.
   - Jeder Fehler endet im `catch` ohne Bindung der Ausnahme (Zeile 43). Die Warnung ist die feste Konstante `WARNING` (Zeile 16). Sie enthält weder Git-Ausgabe noch Ausnahmetext noch Pfad noch Kennung.
   - Die Tests in `buildinfo/gitRevision.test.ts` belegen das. Die Zeilen 137 bis 155 prüfen Argumentliste, `shell`, `timeout` und `stdio[0]`. Die Zeilen 227 bis 243 prüfen mit Markierungstexten in Ausnahme, stdout und stderr, dass keine Git-Ausgabe, kein Ausnahmetext, kein Pfad und keine Kennung in `console.warn`, `console.error` und `console.log` gelangen. Die Zeilen 186 bis 201 prüfen, dass es ohne gültige Kennung keinen zweiten Aufruf gibt.
2. **Erneute Prüfung im Browser** (`src/buildRevision.ts`, Zeilen 14 bis 38): Geprüft wird ein Objekt mit genau zwei Schlüsseln `commit` und `committedAt`, eine Kennung aus 40 Hexadezimalzeichen in Kleinbuchstaben und `isTimestamp`; sonst ist das Ergebnis `null`. `AboutDialog.tsx` verwendet nur das geprüfte Ergebnis (Zeilen 3 und 38 bis 44). In der gebauten Datei steht der Wert als Argument der Prüffunktion: `Rn=Ln({commit:\`33e87d5d64ca629bd466e6fa0d338ed35ebd42c1\`,committedAt:\`2026-10-14T08:28:23+02:00\`})`. Die Werte sind nach Spezifikation Abschnitt 5 öffentlich.
3. **Texte als Text, nicht als HTML**: `AboutDialog.tsx` setzt Stand, Lizenzname, Lizenztext (`<pre>{licenseText}</pre>`, Zeilen 58 bis 60), Adresse und alle übersetzten Texte als JSX-Kindknoten. Es gibt kein `dangerouslySetInnerHTML` (P10). `src/i18n.ts` Zeile 34 setzt `escapeValue: false`. Das ist für React üblich, weil React die Werte beim Setzen als Text selbst kodiert. Die interpolierten Werte (Kennung, Datumsbestandteile) sind vorher geprüft.
4. **Verweis**: `<a href={repositoryUrl} target="_blank" rel="noopener noreferrer">` (`AboutDialog.tsx` Zeile 67). `repositoryUrl` besteht die Prüfung `^https://github\.com/[A-Za-z0-9-]+/[A-Za-z0-9._-]+$` (`src/repository.ts` Zeile 3); `javascript:`- oder andere Schemata sind damit ausgeschlossen. Die Tests prüfen `rel` in `src/AboutDialog.test.tsx` Zeile 229 und `e2e/studio.spec.ts` Zeile 445. In der gebauten Datei kommt `https://github.com/macodix/pipwerk` genau einmal vor. Die übrigen Adressen (P9) sind Namensräume (`www.w3.org`), Verweise in Fehlertexten von React, React Flow und react-i18next und Adressen im Lizenztext. Keine davon wird abgefragt.
5. **Keine Netzwerkanfrage des Dialogs**: `AboutDialog.tsx` enthält keinen Aufruf von `fetch` und keine Abfrage. Die `fetch`-Aufrufe in `src/` sind die bestehenden in `revisionApi.ts`, `settingsApi.ts` und `api.ts`, alle auf relative Pfade unter `/api`. Der Lizenztext wird beim Bau eingebunden (`import licenseText from '../../../../LICENSE?raw'`). Nachweise: `src/AboutDialog.test.tsx` Zeilen 323 bis 329 (`fetch` beim Öffnen nicht aufgerufen) und `e2e/studio.spec.ts` Zeilen 340 bis 360 (keine Anfrage an eine andere Herkunft; in allen drei Browsern bestanden, P5).
6. **Freigabe in `server.fs.allow`** (`vite.config.ts` Zeilen 26 und 42): `[searchForWorkspaceRoot(frontendDirectory), licenseFile, \`${licenseFile}?raw\`]`. `licenseFile` ist `resolve(frontendDirectory, '../../../LICENSE')`; der Pfad wird berechnet und ist nicht fest eingetragen.
   - Vite 8.3.1 erlaubt eine Datei, wenn sie gleich einem Eintrag ist oder unter ihm liegt (`isFileInTargetPath`, `node.js` Zeilen 17871 bis 17873 und 17885 bis 17895). Ein Eintrag, der eine Datei ist, gibt deshalb nur diese Datei frei.
   - Bei Importen mit `?raw`, `?url`, `?inline` und bei `.svg` prüft Vite den Pfad ohne Zusatz und mit Zusatz. Beide Prüfungen müssen bestehen (`node.js` Zeilen 20127 bis 20129 und 20266 bis 20268). Der Eintrag mit `?raw` gibt also nur dann etwas frei, wenn der Pfad ohne Zusatz ebenfalls erlaubt ist. Außerhalb des Projektverzeichnisses ist das nur `LICENSE`. Eine andere Datei wird über diesen Eintrag nicht erreichbar.
   - Die Liste der verbotenen Muster (`fsDenyGlob`) wird vor der Liste der Freigaben geprüft (Zeile 17891) und bleibt wirksam.
   - Kein Verzeichnis außer der Standardfreigabe ist eingetragen. `searchForWorkspaceRoot` sucht nach `pnpm-workspace.yaml`, `lerna.json` und Arbeitsbereichen in `package.json` oder `deno.json` (`node.js` Zeilen 20737 bis 20783). Im Repository gibt es keine solche Datei über `frontend`. Geprüft habe ich `components/pipwerk-studio/`, `components/` und das Wurzelverzeichnis; dort gibt es weder `package.json` noch `pnpm-workspace.yaml`, `lerna.json` oder `deno.json`. Die Standardfreigabe ist damit das Verzeichnis `frontend`.
   - `buildinfo/viteConfig.test.ts` Zeilen 30 bis 58 prüft genau drei Einträge, dass das Wurzelverzeichnis nicht eingetragen ist, dass `LICENSE?raw` geliefert wird und dass `README.md?raw` im Wurzelverzeichnis abgelehnt wird. Der Test ist bestanden (P3).
   - Die Entscheidung des Softwarearchitekten ist damit eingehalten: Freigegeben ist nur die Datei `LICENSE`, kein Verzeichnis.
7. **Keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners**: keine Treffer im Diff (P11) und in der gebauten Datei (P9). Die Tests verwenden `/nonexistent/marker-directory` und temporäre Verzeichnisse aus `tmpdir()`. Für Git-Commits im Test steht `test@example.invalid`.
8. **Browsertest gegen die gebaute Oberfläche** (`playwright.config.ts` Zeile 39): Der Befehl ist eine feste Zeichenkette. Eingesetzt wird nur der Port, der wie bisher Parameter ist. Das Ausgabeverzeichnis `frontend/dist-e2e/` steht in `components/pipwerk-studio/.gitignore`.

## Befunde

Keine.

## Hinweise ohne Einfluss auf das Ergebnis

- **H1** `npm audit` meldet für `source-map-js` 1.2.1 eine Schwachstelle der Stufe „high“ (GHSA-68fv-2mgg-jv7q: Blockieren der Ereignisschleife durch Abschnittsversätze in Source Maps). Das Paket kommt nur über die Entwicklungsabhängigkeiten `vite` → `postcss` und `jsdom` → `css-tree` (`npm ls source-map-js --all`). Es wirkt beim Bau und in den Tests, nicht in der ausgelieferten Oberfläche. Der geprüfte Commit ändert `package-lock.json` nicht. Die Meldung ist also nicht durch diesen Commit entstanden. Nach Regel 8.2 Nr. 9 und 8.3 Nr. 6 der Sicherheitsregeln braucht es eine Entscheidung, ob und wann die Abhängigkeit aktualisiert wird. Sie liegt außerhalb dieses Auftrags. Zuständig ist der Softwarearchitekt.
- **H2** Bei einer abgelehnten Anfrage zeigt der Entwicklungsserver von Vite eine Fehlerseite. Sie listet alle Einträge von `server.fs.allow` mit absolutem Pfad auf (`respondWithAccessDenied`, `node.js` Zeilen 17901 bis 17911). Das ist Verhalten von Vite und gilt nur für den Entwicklungsserver auf `127.0.0.1` (`vite.config.ts` Zeile 38). Der Commit ergänzt nur den Pfad von `LICENSE`, der neben dem Projektverzeichnis liegt. Eine Änderung ist nach dem Prüfauftrag nicht verlangt.
- **H3** Der Browsertest zum Verweis (`e2e/studio.spec.ts` Zeilen 435 bis 451) prüft das Attribut `rel` und die Adresse des neuen Tabs. Er prüft nicht, dass im neuen Tab `window.opener` leer ist. Spezifikation Abschnitt 4.2 verlangt diese Prüfung nicht. Die Wirkung von `noopener` ist Verhalten des Browsers.

## Arbeitsverzeichnis

Die von meinen Prüfläufen erzeugten ignorierten Dateien (`frontend/node_modules`, `frontend/dist`, `frontend/dist-e2e`, `frontend/test-results`, `backend/.venv`, `__pycache__`) habe ich danach mit `git clean -fdX -- components/pipwerk-studio` entfernt. Den Entwicklungsserver aus der Prüfung habe ich beendet. Nicht versioniert sind nur meine Berichte `01-securitytest-1.md` bis `01-securitytest-3.md` aus Auftrag 01 und dieser Bericht.

## Geltung

Dieser Bericht gilt nur für den Commit `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1`.
