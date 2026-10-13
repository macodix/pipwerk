# Spezifikation Vorhaben ablauftest

## Status

- status: `draft`
- stand: 2026-10-13
- komponente: `pipwerk-studio`
- grundlage: [scope.md](scope.md), req-ui-010 in [Anforderungen an den Trading-Strategiedesigner](../../docs/design/requirements/anforderungen-strategiedesigner.md)
- offen: zwei Fragen an den Auftraggeber in [questions/ablauftest-01.md](questions/ablauftest-01.md). Die betroffenen Stellen sind in Abschnitt 3.3 und 3.6 als offen gekennzeichnet.

## 1. Gegenstand

pipwerk studio erhält den Dialog „Über pipwerk studio“ nach req-ui-010. Der Dialog zeigt Name, Stand, Lizenz und die Adresse des Repositorys. Die Standanzeige in der Fußzeile mit ihrem Tooltip bleibt unverändert.

Die Spezifikation beschreibt den technischen Aufbau. Bedienablauf und Inhalte stehen in req-ui-010 und werden hier nicht wiederholt, sondern den technischen Bausteinen zugeordnet.

## 2. Architekturentscheidungen

| Nr. | Entscheidung | Begründung |
|---|---|---|
| E1 | Der Dialog ist ein reiner Bestandteil der Oberfläche. Das Backend und seine Schnittstellen bleiben unverändert. | Alle Angaben liegen der Oberfläche bereits vor oder lassen sich dort beschaffen: Stand über `GET /api/studio/revision`, Lizenztext und Adresse zur Bauzeit. |
| E2 | Datum und Uhrzeit des Stands sind das Committer-Datum des Commits. | So ermittelt es das Backend bereits für den Tooltip (`git log -1 --format=%cI`, technische Dokumentation Abschnitt 2.6). GitHub liefert dasselbe Datum als `committer.date`. Beantwortet den Kritikpunkt aus B2 des Prüfberichts [requirements-1.md](reviews/requirements-1.md). |
| E3 | „Lokal ermittelbar“ bedeutet: Das Backend liefert in `committed_at` ein gültiges Datum. Nur wenn `commit` gesetzt und `committed_at` `null` ist, fragt die Oberfläche das Datum bei GitHub ab. | Ohne Commit-Kennung gibt es nichts abzufragen. Dann gilt „unbekannt“. |
| E4 | Die Abfrage bei GitHub stellt der Browser, nicht das Backend, und erst beim Öffnen des Dialogs. | Der Fall ist selten. Die Abfrage entsteht nur, wenn der Anwender den Dialog öffnet. Das Backend bleibt ohne Netzwerkzugriff nach außen. Die GitHub-API erlaubt Abfragen aus dem Browser (Antwortkopf `Access-Control-Allow-Origin: *`, geprüft am 13.10.2026). |
| E5 | Abgefragt wird der Commit-Objekt-Endpunkt `GET https://api.github.com/repos/<eigentümer>/<repository>/git/commits/<commit>` ohne Anmeldung. | Die Antwort ist klein und enthält nur das Commit-Objekt. Der Endpunkt `…/commits/<commit>` liefert zusätzlich alle Dateiänderungen und kann groß werden. Ohne Anmeldung gilt laut Dokumentation von GitHub eine Grenze von 60 Abfragen je Stunde und Adresse (nicht selbst geprüft); für diesen Zweck genügt das. Antwort geprüft am 13.10.2026: `committer.date` in UTC mit `Z`, `sha` gleich der Kennung. |
| E6 | Die Adresse des Repositorys steht genau einmal: im Feld `repository` der `package.json` der Oberfläche. Eigentümer und Name für die GitHub-Abfrage werden daraus abgeleitet. | Kein fester Wert im Programmcode. Eine Änderung der Adresse ist eine Änderung an einer Stelle. |
| E7 | Der Lizenztext ist die Datei `LICENSE` im Wurzelverzeichnis des Repositorys. Die Oberfläche bindet sie zur Bauzeit als Text ein. | Eine einzige Quelle. Keine Kopie, die vom Original abweichen kann. Der Dialog braucht für den Lizenztext keine Anfrage. |
| E8 | Der Dialog ist das HTML-Element `<dialog>`, geöffnet mit `showModal()`. | Der Browser sperrt damit die übrige Oberfläche für Maus, Tastatur und Hilfstechnik, hält den Fokus im Dialog und schließt ihn mit der Escape-Taste. Ein Klick neben den Dialog schließt ihn nicht. Das entspricht req-ui-010 ohne eigene Sperrlogik. |

## 3. Oberfläche

### 3.1 Neue und geänderte Dateien

| Datei | Aufgabe |
|---|---|
| `src/AboutDialog.tsx` | Dialog „Über pipwerk studio“ mit den Eigenschaften `open` und `onClose` |
| `src/githubCommitApi.ts` | Abfrage und strenge Prüfung des Commit-Datums bei GitHub (Abschnitt 3.4) |
| `src/repository.ts` | Adresse des Repositorys aus `package.json`, Prüfung und Ableitung von Eigentümer und Name (Abschnitt 3.5) |
| `src/commitDate.ts` | Zerlegung eines Zeitstempels in Jahr, Monat, Tag, Stunde, Minute, in Ortszeit oder in UTC. Die Funktion `localParts` aus `RevisionDisplay.tsx` wird hierher verschoben und von beiden Stellen verwendet. |
| `src/timestamp.ts` | Prüfung eines Zeitstempels auf echtes Kalenderdatum und gültige Uhrzeit. Die Prüfung aus `revisionApi.ts` wird hierher verschoben und von beiden Abfragen verwendet. |
| `src/RevisionDisplay.tsx`, `src/revisionApi.ts` | nur die Verschiebungen oben, Verhalten unverändert |
| `src/locales/de.json`, `src/locales/en.json` | Texte des Dialogs unter dem Schlüssel `about` |
| `src/styles.css` | Gestaltung des Dialogs |
| `src/App.tsx` | Einbindung des Dialogs an der Aufrufstelle (Abschnitt 3.6) |
| `package.json` | Feld `repository` (Abschnitt 3.5) |
| `vite.config.ts` | Zugriff des Entwicklungsservers auf `LICENSE` (Abschnitt 3.3) |

### 3.2 Aufbau des Dialogs

Der Dialog enthält von oben nach unten:

| Bestandteil | Inhalt Deutsch | Inhalt Englisch |
|---|---|---|
| Überschrift (`h2`, zugleich zugänglicher Name des Dialogs über `aria-labelledby`) | „Über pipwerk studio“ | „About pipwerk studio“ |
| Name | „pipwerk studio“ | „pipwerk studio“ |
| Stand | Bezeichnung „Stand“, Wert nach Abschnitt 3.3 | Bezeichnung „Revision“, Wert nach Abschnitt 3.3 |
| Lizenz | Bezeichnung „Lizenz“, Name „GNU General Public License, Version 3“, darunter der vollständige Lizenztext | Bezeichnung „License“, Name und Text identisch |
| Repository | Bezeichnung „Repository“, Verweis mit der Adresse als Text | Bezeichnung „Repository“, Verweis identisch |
| Schaltfläche | „Schließen“ | „Close“ |

Der Name „pipwerk studio“ wird nicht übersetzt und in der Schreibweise aus dem [Projektziel](../../docs/design/projektziel.md) wiedergegeben. Die Bezeichnungen „Stand“ und „Revision“ entsprechen der Fußzeile. Ein Sprachwechsel bei offenem Dialog ist nicht möglich, weil die übrige Oberfläche gesperrt ist. Beim nächsten Öffnen gilt die dann eingestellte Sprache.

Der Lizenztext steht in einem `pre`-Element mit `lang="en"`, fester Höhe und eigener Bildlaufleiste. Er ist mit der Tastatur erreichbar (`tabIndex=0`) und mit den Pfeiltasten verschiebbar. Zeilenumbrüche und Einrückungen bleiben wie in `LICENSE`. Der Name der Lizenz trägt ebenfalls `lang="en"`.

Der Verweis ist ein `a`-Element mit `href` gleich der Adresse, `target="_blank"` und `rel="noopener noreferrer"`. Sein Text ist die Adresse.

Beim Öffnen erhält die Schaltfläche „Schließen“ den Fokus (`autoFocus`). Die Schaltfläche schließt den Dialog mit `close()`. Die Escape-Taste löst das Ereignis `cancel` aus; der Browser schließt den Dialog. Beide Wege enden im Ereignis `close`, das `onClose` aufruft. Andere Wege zum Schließen gibt es nicht; das Attribut `closedby` wird nicht gesetzt.

Der Dialog passt sich der Fensterbreite an (höchstens 48rem breit, mindestens 16px Abstand zum Fensterrand) und ist höchstens 90 % der Fensterhöhe hoch. Bei kleinem Fenster schrumpft das Lizenzfeld, die Schaltfläche bleibt sichtbar.

### 3.3 Stand

Der Dialog liest den Stand mit derselben Abfrage wie die Fußzeile (TanStack Query, Schlüssel `['revision']`, `fetchRevision`). Es entsteht keine zweite Anfrage an das Backend, solange das Ergebnis im Zwischenspeicher liegt.

| Zustand | Anzeige Deutsch | Anzeige Englisch |
|---|---|---|
| Abfrage läuft, fehlgeschlagen, ungültige Antwort oder `commit` ist `null` | „unbekannt“ | „unknown“ |
| `commit` und `committed_at` gesetzt | „<commit> vom TT.MM.JJJJ, hh:mm Uhr“ in Ortszeit des Browsers | „<commit> from YYYY-MM-DD hh:mm“ in Ortszeit des Browsers |
| `commit` gesetzt, `committed_at` `null`, Abfrage bei GitHub erfolgreich | „<commit> vom TT.MM.JJJJ, hh:mm Uhr UTC“ in UTC | „<commit> from YYYY-MM-DD hh:mm UTC“ in UTC |
| `commit` gesetzt, `committed_at` `null`, Abfrage bei GitHub läuft | „<commit>“ | „<commit>“ |
| `commit` gesetzt, `committed_at` `null`, Abfrage bei GitHub fehlgeschlagen | **offen**, Frage 2 in [questions/ablauftest-01.md](questions/ablauftest-01.md). Vorschlag: „<commit>“ ohne Datum. | wie Deutsch |

`<commit>` ist die vollständige Kennung mit 40 Zeichen. Die Uhrzeit hat das 24-Stunden-Format. Die Formatierung erfolgt wie beim Tooltip mit eigenen, mit Nullen aufgefüllten Bestandteilen, nicht über `Intl` oder `toLocaleString` (technische Dokumentation Abschnitt 2.6). Für UTC werden die Bestandteile mit `getUTCFullYear`, `getUTCMonth`, `getUTCDate`, `getUTCHours` und `getUTCMinutes` gebildet. Die Angabe der Zeitzone ist die feste Zeichenfolge „UTC“, weil GitHub das Datum immer in UTC liefert (Abschnitt 3.4).

### 3.4 Abfrage des Commit-Datums bei GitHub

`fetchGithubCommitDate(commit, signal)` in `src/githubCommitApi.ts`:

- Wird nur aufgerufen, wenn der Dialog offen ist, `commit` gesetzt ist und `committed_at` `null` ist (TanStack Query mit `enabled`). Schlüssel `['githubCommitDate', commit]`.
- Vor der Abfrage wird `commit` erneut auf genau 40 Hexadezimalzeichen in Kleinbuchstaben geprüft. Eigentümer und Name stammen aus `src/repository.ts`. Die Adresse wird aus diesen geprüften Teilen zusammengesetzt; es gelangt kein anderer Text in die Adresse.
- `fetch` mit `method: 'GET'`, `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `redirect: 'error'`, `mode: 'cors'` und den Kopfzeilen `Accept: application/vnd.github+json` und `X-GitHub-Api-Version: 2022-11-28`. Keine Anmeldung, kein Schlüssel.
- Zeitbegrenzung 10 Sekunden wie bei der Spracheinstellung, mit eigenem `AbortController`, der das Abbruchsignal von TanStack Query und das der Zeitbegrenzung verbindet. Die Abfrage wird unabhängig vom Online-Zustand des Browsers gesendet (`networkMode: 'always'`), damit die Zeitbegrenzung immer gilt.
- Gültig ist nur eine Antwort mit HTTP 200, deren Inhalt ein JSON-Objekt ist, in dem `sha` gleich `commit` ist und `committer.date` eine Zeichenfolge im Muster `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$` mit echtem Kalenderdatum und gültiger Uhrzeit ist (`src/timestamp.ts`). Weitere Felder werden ignoriert. Jede andere Antwort, jeder Netzwerkfehler und das Ende der Zeitbegrenzung gelten als „fehlgeschlagen“.
- Kein automatisches Wiederholen (`retry: false`). Ein Erfolg bleibt für die Laufzeit der Seite gültig (`staleTime: Infinity`), weil sich das Datum eines Commits nicht ändert. Ein Fehlschlag wird beim nächsten Öffnen des Dialogs erneut abgefragt.
- Fehler werden nicht angezeigt und enthalten keine Antwortinhalte. Der Dialog zeigt dann den Zustand aus Abschnitt 3.3.

### 3.5 Adresse des Repositorys

`package.json` erhält:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/macodix/pipwerk"
}
```

`src/repository.ts` liest `repository.url` über den JSON-Import von Vite und prüft sie beim Laden des Moduls gegen `^https://github\.com/([A-Za-z0-9-]+)/([A-Za-z0-9._-]+)$`. Exportiert werden die Adresse, der Eigentümer und der Name. Ein Frontend-Test prüft, dass die Adresse genau `https://github.com/macodix/pipwerk` lautet und die Prüfung eine abweichende Form ablehnt. Ein Wert, der nicht passt, ist ein Programmfehler und bricht den Bau über diesen Test ab.

### 3.6 Lizenztext und Aufrufstelle

Lizenztext: `AboutDialog.tsx` importiert `LICENSE` aus dem Wurzelverzeichnis des Repositorys mit dem Zusatz `?raw`. Vite schreibt den Text beim Bau in die ausgelieferten Dateien. Der Entwicklungsserver liefert Dateien außerhalb des Verzeichnisses `frontend` nur aus, wenn sie freigegeben sind. `vite.config.ts` ergänzt deshalb `server.fs.allow` um genau die Datei `LICENSE`, als Pfad relativ zur Konfigurationsdatei berechnet, und behält die Standardfreigabe des Projektverzeichnisses bei (`searchForWorkspaceRoot`). Ein Frontend-Test prüft, dass der angezeigte Text Zeichen für Zeichen mit `LICENSE` übereinstimmt.

Aufrufstelle: **offen**, Frage 1 in [questions/ablauftest-01.md](questions/ablauftest-01.md). `AboutDialog` hat keine eigene Aufrufstelle. `App.tsx` hält den Zustand „offen“ und gibt ihn mit `onClose` an den Dialog. Wo das Bedienelement zum Öffnen sitzt und wie es beschriftet ist, wird nach der Antwort ergänzt.

## 4. Tests

### 4.1 Frontend-Tests (Vitest)

jsdom bildet `showModal()` und `close()` nicht vollständig nach. `src/test-setup.ts` ergänzt beide für `HTMLDialogElement` so, dass sie das Attribut `open` setzen beziehungsweise entfernen und `close` das Ereignis `close` auslöst. Die Sperrung der übrigen Oberfläche weist der Browsertest nach (Abschnitt 4.2).

Geprüft wird mindestens:

- Überschrift, Name, Bezeichnungen und Schaltfläche in Deutsch und Englisch; Name unübersetzt
- Stand für jeden Zustand aus Abschnitt 3.3, Formatierung bei fest eingestellten Zeitzonen in Ortszeit und in UTC, Auffüllen mit Nullen, Tageswechsel durch die Zeitzone
- keine Abfrage bei GitHub, wenn `committed_at` gesetzt oder `commit` `null` ist, und keine, solange der Dialog geschlossen ist
- Abfrage bei GitHub: Adresse, Kopfzeilen und Optionen; gültige Antwort; jede Abweichung einzeln als fehlgeschlagen (HTTP-Fehler, kein JSON, kein Objekt, `sha` fehlt oder abweichend, `committer` fehlt, `date` fehlt, kein Text, Zeitstempel mit Offset statt `Z`, unmögliches Datum, Netzwerkfehler, Zeitbegrenzung mit künstlicher Uhr); erneute Abfrage nach Fehlschlag beim nächsten Öffnen; keine erneute Abfrage nach Erfolg
- Lizenzname, Lizenztext identisch mit `LICENSE`, `lang="en"`, Lizenzfeld mit der Tastatur erreichbar
- Verweis mit `href`, `target="_blank"`, `rel="noopener noreferrer"` und der Adresse als Text
- Schließen mit der Schaltfläche und mit dem Ereignis `cancel`; Fokus beim Öffnen auf „Schließen“
- `repository.ts`: Adresse, Eigentümer, Name, Ablehnung abweichender Formen
- Vollständigkeit der Übersetzungen (bestehender Test)
- Fußzeile und Tooltip unverändert (bestehende Tests bestehen ohne Änderung ihrer Erwartungen)

Kein Test spricht GitHub tatsächlich an; alle Antworten sind festgelegt.

### 4.2 Browsertest (Playwright)

In Chromium, Firefox und WebKit:

- Dialog öffnen über die Aufrufstelle (nach Antwort auf Frage 1), Inhalte in beiden Sprachen
- Stand mit echtem Backend gleich `git rev-parse HEAD` und dem Datum aus `git log -1 --format=%cI` in der fest eingestellten Zeitzone des Testbrowsers
- Fall „Datum lokal nicht ermittelbar“: Antwort von `/api/studio/revision` über `page.route` mit `committed_at: null` ersetzt, Antwort von GitHub über `page.route` festgelegt; Anzeige in UTC. Ebenso der Fall „GitHub fehlgeschlagen“.
- Jede andere Anfrage an `api.github.com` wird im Test abgewiesen und lässt den Test scheitern. Der Test spricht GitHub nie an.
- Sperrung: Bei offenem Dialog lässt sich die Sprachauswahl weder mit der Maus noch mit der Tabulatortaste erreichen; der Fokus bleibt im Dialog.
- Schließen: Escape schließt, „Schließen“ schließt, ein Klick neben den Dialog schließt nicht.
- Verweis öffnet sich in einem neuen Tab mit der Adresse (neue Seite im Browserkontext; die Seite selbst wird über `page.route` abgefangen und nicht geladen).
- Bestehende Prüfungen von Fußzeile und Tooltip bestehen unverändert.

## 5. Sicherheit

- Einziger neuer Netzwerkzugriff ist die Abfrage aus Abschnitt 3.4: nur `GET` an `https://api.github.com`, nur zum festen Endpunkt mit geprüfter Kennung, ohne Anmeldedaten, ohne Cookies, ohne Referrer, ohne Weiterleitungen, mit Zeitbegrenzung. Sie entsteht nur bei offenem Dialog und fehlendem lokalem Datum. GitHub erfährt dabei die Adresse des Browsers und die Kennung des Commits. Die Kennung ist öffentlich, weil das Repository öffentlich ist (geprüft am 13.10.2026).
- Antworten von GitHub werden streng geprüft; nur ein geprüfter Zeitstempel wird weiterverwendet. Inhalte der Antwort gelangen nie als HTML in die Seite, alle Texte werden von React als Text gesetzt.
- Der Verweis öffnet den neuen Tab mit `noopener noreferrer`; die geöffnete Seite erhält keinen Zugriff auf pipwerk studio.
- Der Lizenztext wird als Text gesetzt, nicht als HTML.
- Das Backend bleibt unverändert. Die Freigabe in `server.fs.allow` gilt nur für die Datei `LICENSE`.

## 6. Skripte der Komponente

Das [Entwicklungsverfahren](../../docs/technical/entwicklungsverfahren.md#skripte-je-komponente) verlangt je Komponente ein Testumgebungsskript und ein Prüfskript. pipwerk studio hat beide noch nicht.

### 6.1 Testumgebungsskript (Entwickler)

`components/pipwerk-studio/scripts/testenv`, POSIX-Shell, aufgerufen aus einem beliebigen Verzeichnis mit absolutem Pfad:

```text
testenv start --frontend-port <port> --backend-port <port> [--host <adresse>]
testenv stop
testenv status
```

- Arbeitet auf dem Arbeitsverzeichnis, in dem das Skript liegt; das Verzeichnis wird aus dem Pfad des Skripts bestimmt.
- `start` installiert die Abhängigkeiten nach den Lockdateien (`uv sync --frozen`, `npm ci`), baut die Oberfläche (`npm run build`), legt unter `components/pipwerk-studio/.testenv/` eine INI mit eigener SQLite-Datei an, startet das Backend mit `-c` auf `127.0.0.1:<backend-port>` und die gebaute Oberfläche mit `vite preview` auf `<host>:<frontend-port>`. `vite preview` leitet `/api` an das Backend weiter (`PIPWERK_STUDIO_BACKEND_URL`). `--host` ist ohne Angabe `127.0.0.1`.
- Prozesskennungen und Protokolle liegen in `.testenv/`. `start` bricht ab, wenn dort schon eine laufende Testumgebung verzeichnet ist oder ein Port belegt ist. `start` endet erst, wenn `/api/health` über den Port der Oberfläche `{"status": "ok"}` liefert, sonst mit Fehler und beendeten Prozessen.
- `stop` beendet beide Prozesse und entfernt `.testenv/`. `status` nennt, ob die Testumgebung läuft, und ihre Ports.
- `.testenv/` steht in `components/pipwerk-studio/.gitignore`.
- Keine festen Ports, Pfade oder Rechnernamen im Skript.
- Beschreibung in der technischen Dokumentation der Komponente.

### 6.2 Prüfskript (Tester Funktion)

`components/pipwerk-studio/scripts/check` führt die Prüfungen aus Abschnitt 6.1 bis 6.3 der technischen Dokumentation aus und endet mit Exitcode 0 nur, wenn alle bestehen. Ports des Browsertests sind Parameter. Das Skript legt der Tester Funktion in seinem Zweig an; der Entwickler schreibt es nicht.

## 7. Dokumentation

| Dokument | Änderung |
|---|---|
| `docs/technical/pipwerk-studio.md` | Abschnitt zum Dialog mit den Entscheidungen E1 bis E8, neue Dateien in Abschnitt 2.3, Netzwerkzugriff in Abschnitt 8, Tests in Abschnitt 6, Skripte der Komponente |
| `docs/user/pipwerk-studio.md` | Dialog „Über pipwerk studio“: Aufruf, Inhalte, Zustände des Stands, Abfrage bei GitHub, Schließen |
| `components/pipwerk-studio/README.md` | Satz zum Dialog in der Beschreibung des Stands |

## 8. Nicht Gegenstand

- Die Schreibweise „Pipwerk Studio“ in Kopfzeile, Fußzeilentexten und Dokumentation. Der Dialog verwendet „pipwerk studio“ nach req-ui-010 und Projektziel. Eine Angleichung der übrigen Stellen ist nicht Teil von req-ui-010.
- Der Einstellungsbereich nach req-ui-009.
- Änderungen am Backend und an `GET /api/studio/revision`.
