# Spezifikation Vorhaben ablauftest

## Status

- status: `draft`
- stand: 2026-10-13
- komponente: `pipwerk-studio`
- grundlage: [scope.md](scope.md), req-ui-010 in [Anforderungen an den Trading-Strategiedesigner](../../docs/design/requirements/anforderungen-strategiedesigner.md), Antworten in [questions/ablauftest-01.md](questions/ablauftest-01.md)
- prüfung: Durchlauf 1 [specification-1.md](reviews/specification-1.md) nicht bestanden, Befunde S1 bis S6 eingearbeitet, S7 und S8 in Abschnitt 9

## 1. Gegenstand

pipwerk studio erhält den Dialog „Über pipwerk studio“ nach req-ui-010. Der Dialog zeigt Name, Stand, Lizenz und die Adresse des Repositorys. Er wird über eine Schaltfläche in der Kopfzeile geöffnet. Die Standanzeige in der Fußzeile mit ihrem Tooltip bleibt unverändert.

Die Spezifikation beschreibt den technischen Aufbau. Bedienablauf und Inhalte stehen in req-ui-010 und werden hier nicht wiederholt, sondern den technischen Bausteinen zugeordnet.

## 2. Architekturentscheidungen

| Nr. | Entscheidung | Begründung |
|---|---|---|
| E1 | Der Dialog ist ein reiner Bestandteil der Oberfläche. Das Backend und seine Schnittstellen bleiben unverändert. | Alle Angaben des Dialogs entstehen beim Bau der Oberfläche (E3, E6, E7). Der Dialog braucht zur Anzeige keine Anfrage. |
| E2 | Datum und Uhrzeit des Stands sind das Committer-Datum des Commits. | So ermittelt es das Backend bereits für den Tooltip (`git log -1 --format=%cI`, technische Dokumentation Abschnitt 2.6). Dialog und Tooltip nennen damit für denselben Commit dasselbe Datum. Beantwortet den Kritikpunkt aus B2 des Prüfberichts [requirements-1.md](reviews/requirements-1.md). |
| E3 | Kennung und Datum des Commits werden beim Bau der Oberfläche aus Git ermittelt und als Wert in die ausgelieferten Dateien geschrieben (Vite-Option `define`). Der Entwicklungsserver ermittelt sie ebenso bei seinem Start. | req-ui-010: Die Angaben sind in der bereitgestellten Software selbst enthalten, für die Anzeige wird keine Internetverbindung genutzt. Die gebaute Oberfläche braucht zur Laufzeit weder Git noch Netz noch Backend. |
| E4 | Der Dialog zeigt den Stand nur, wenn Kennung und Datum beide vorliegen und gültig sind. Sonst zeigt er „unbekannt“. Eine Abfrage bei GitHub oder einem anderen Dienst gibt es nicht. | Antwort auf Frage 2 in [questions/ablauftest-01.md](questions/ablauftest-01.md): Eine Kennung ohne Datum wird nicht angezeigt. |
| E5 | Die Ermittlung beim Bau verwendet dieselben Git-Aufrufe und dieselben Prüfregeln wie das Backend (technische Dokumentation Abschnitt 2.6). Jeder Fehler ergibt „nicht ermittelbar“ und bricht den Bau nicht ab. | Gleiche Regeln an beiden Stellen. Ein Bau ohne Git, zum Beispiel aus einem entpackten Archiv des Repositorys, bleibt möglich und zeigt „unbekannt“. |
| E6 | Die Adresse des Repositorys steht genau einmal: im Feld `repository` der `package.json` der Oberfläche. | Kein fester Wert im Programmcode. Eine Änderung der Adresse ist eine Änderung an einer Stelle. |
| E7 | Der Lizenztext ist die Datei `LICENSE` im Wurzelverzeichnis des Repositorys. Die Oberfläche bindet sie zur Bauzeit als Text ein. Fehlt die Datei, bricht der Bau mit einer Fehlermeldung ab. | Eine einzige Quelle. Keine Kopie, die vom Original abweichen kann. Der Dialog braucht für den Lizenztext keine Anfrage. Eine Oberfläche ohne den vollständigen Lizenztext erfüllt req-ui-010 nicht und wird deshalb nicht gebaut. Die gebaute Oberfläche enthält den Text selbst; installiert und gestartet wird sie ohne Zugriff auf das Repository (req-system-006, req-system-008). Gebaut wird sie aus dem Repository, nicht aus dem Verzeichnis der Komponente allein. |
| E8 | Der Dialog ist das HTML-Element `<dialog>`, geöffnet mit `showModal()`. | Der Browser sperrt damit die übrige Oberfläche für Maus, Tastatur und Hilfstechnik, hält den Fokus im Dialog und schließt ihn mit der Escape-Taste. Ein Klick neben den Dialog schließt ihn nicht. Das entspricht req-ui-010 ohne eigene Sperrlogik. |
| E9 | Der Commit, aus dem pipwerk studio läuft, ist der Commit des Arbeitsverzeichnisses, aus dem Oberfläche und Backend gemeinsam bereitgestellt werden. Jede vorgesehene Bereitstellung baut die Oberfläche und startet das Backend aus demselben Arbeitsverzeichnis auf demselben Commit: das Testumgebungsskript (Abschnitt 6.1), der Browsertest und der Start im Entwicklungsbetrieb (technische Dokumentation Abschnitt 4.2). Dialog und Fußzeile nennen dann denselben Commit; der Browsertest weist das nach (Abschnitt 4.2). Ein Betrieb aus Oberfläche und Backend verschiedener Stände ist keine vorgesehene Bereitstellung. | pipwerk studio ist eine Komponente aus einem Repository und wird als Ganzes bereitgestellt. Damit gibt es genau einen Commit, aus dem es läuft. |

Grenze im Entwicklungsbetrieb: Backend und Entwicklungsserver ermitteln den Stand bei ihrem Start. Wird das Arbeitsverzeichnis danach auf einen anderen Commit gesetzt, lädt der Entwicklungsserver den geänderten Code nach, Dialog und Fußzeile nennen aber beide weiter den Stand beim Start, bis beide neu gestartet sind. Für die Fußzeile gilt das bereits heute (technische Dokumentation Abschnitt 2.6). Die Grenze wird in der technischen Dokumentation (Abschnitt 9) und in der Anwenderdokumentation beschrieben. Das Testumgebungsskript ist davon nicht betroffen, weil es die gebaute Oberfläche ausliefert.

## 3. Oberfläche

### 3.1 Neue und geänderte Dateien

Die Tabelle nennt alle Dateien, die das Vorhaben anlegt oder ändert. Pfade, die mit `components/` oder `docs/` beginnen, gelten ab dem Wurzelverzeichnis des Repositorys, alle anderen ab `components/pipwerk-studio/frontend/`.

| Datei | Aufgabe |
|---|---|
| `components/pipwerk-studio/scripts/testenv` | Testumgebungsskript (Abschnitt 6.1) |
| `components/pipwerk-studio/scripts/check` | Prüfskript des Testers Funktion (Abschnitt 6.2) |
| `components/pipwerk-studio/.gitignore` | Eintrag `.testenv/` (Abschnitt 6.1) |
| `components/pipwerk-studio/README.md` | Satz zum Dialog (Abschnitt 7) |
| `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md` | Dokumentation (Abschnitt 7) |
| `src/test-setup.ts` | Ergänzung von `showModal()` und `close()` für jsdom (Abschnitt 4.1) |
| `src/AboutDialog.test.tsx`, `src/buildRevision.test.ts`, `src/repository.test.ts`, `src/commitDate.test.ts`, `src/timestamp.test.ts` | neue Frontend-Tests (Abschnitt 4.1) |
| `src/App.test.tsx` | Tests der Schaltfläche in der Kopfzeile (Abschnitt 4.1) |
| `buildinfo/gitRevision.test.ts` | Tests der Ermittlung beim Bau (Abschnitt 4.1) |
| `e2e/studio.spec.ts` oder eine neue Datei `e2e/about.spec.ts` | Browsertests (Abschnitt 4.2) |
| `buildinfo/gitRevision.ts` | Ermittlung von Kennung und Datum beim Bau (Abschnitt 3.4). Läuft nur in Node.js, nie im Browser. |
| `src/AboutDialog.tsx` | Dialog „Über pipwerk studio“ mit den Eigenschaften `open` und `onClose` |
| `src/buildRevision.ts` | Lesen und Prüfen des beim Bau eingesetzten Werts (Abschnitt 3.4) |
| `src/repository.ts` | Adresse des Repositorys aus `package.json` mit Prüfung (Abschnitt 3.5) |
| `src/commitDate.ts` | Zerlegung eines Zeitstempels in Jahr, Monat, Tag, Stunde, Minute in Ortszeit. Die Funktion `localParts` aus `RevisionDisplay.tsx` wird hierher verschoben und von beiden Stellen verwendet. |
| `src/timestamp.ts` | Prüfung eines Zeitstempels auf Muster, echtes Kalenderdatum und gültige Uhrzeit. Die Prüfung `isTimestamp` aus `revisionApi.ts` wird hierher verschoben und von `revisionApi.ts`, `src/buildRevision.ts` und `buildinfo/gitRevision.ts` verwendet. |
| `src/vite-env.d.ts` | Typangabe des beim Bau eingesetzten Werts |
| `src/RevisionDisplay.tsx`, `src/revisionApi.ts` | nur die Verschiebungen oben, Verhalten unverändert |
| `src/locales/de.json`, `src/locales/en.json` | Texte des Dialogs und der Schaltfläche unter dem Schlüssel `about` |
| `src/styles.css` | Gestaltung von Dialog und Schaltfläche |
| `src/App.tsx` | Schaltfläche in der Kopfzeile und Einbindung des Dialogs (Abschnitt 3.6) |
| `package.json` | Feld `repository` (Abschnitt 3.5) |
| `vite.config.ts` | Einsetzen von Kennung und Datum (Abschnitt 3.4), Zugriff des Entwicklungsservers auf `LICENSE` (Abschnitt 3.6), Testdateien unter `buildinfo/` |
| `tsconfig.json` | `buildinfo` in `include` |

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

Der Name „pipwerk studio“ wird nicht übersetzt und in der Schreibweise aus dem [Projektziel](../../docs/design/projektziel.md) wiedergegeben. Die Bezeichnungen „Stand“ und „Revision“ entsprechen der Fußzeile.

Alle übersetzten Texte des Dialogs werden mit `useTranslation` gesetzt und folgen der Oberflächensprache jederzeit, auch bei offenem Dialog. Die Sprachauswahl ist bei offenem Dialog gesperrt. Die Sprache kann sich trotzdem ändern, wenn die Oberfläche die gespeicherte Sprache erneut vom Backend liest und dort eine andere steht (technische Dokumentation Abschnitt 2.4, zum Beispiel nach einer Änderung in einem zweiten Browserfenster und Rückkehr in das erste). Dann wechseln die Texte des offenen Dialogs sofort. Der Dialog bleibt dabei offen, der Fokus bleibt, wo er ist. Lizenzname, Lizenztext, Name und Adresse bleiben unverändert, weil sie nicht übersetzt werden.

Der Lizenztext steht in einem `pre`-Element mit `lang="en"`, fester Höhe und eigener Bildlaufleiste. Er ist mit der Tastatur erreichbar (`tabIndex=0`) und mit den Pfeiltasten verschiebbar. Zeilenumbrüche und Einrückungen bleiben wie in `LICENSE`. Der Name der Lizenz trägt ebenfalls `lang="en"`.

Der Verweis ist ein `a`-Element mit `href` gleich der Adresse, `target="_blank"` und `rel="noopener noreferrer"`. Sein Text ist die Adresse.

Beim Öffnen erhält die Schaltfläche „Schließen“ den Fokus (`autoFocus`). Die Schaltfläche schließt den Dialog mit `close()`. Die Escape-Taste löst das Ereignis `cancel` aus; der Browser schließt den Dialog. Beide Wege enden im Ereignis `close`, das `onClose` aufruft. Andere Wege zum Schließen gibt es nicht; das Attribut `closedby` wird nicht gesetzt.

Der Dialog passt sich der Fensterbreite an (höchstens 48rem breit, mindestens 16px Abstand zum Fensterrand) und ist höchstens 90 % der Fensterhöhe hoch. Bei kleinem Fenster schrumpft das Lizenzfeld, die Schaltfläche bleibt sichtbar.

### 3.3 Stand

Der Dialog liest den Stand aus `src/buildRevision.ts` (Abschnitt 3.4). Er stellt dafür keine Anfrage.

| Zustand | Anzeige Deutsch | Anzeige Englisch |
|---|---|---|
| Kennung und Datum gültig | „<commit> vom TT.MM.JJJJ, hh:mm Uhr“ | „<commit> from YYYY-MM-DD hh:mm“ |
| sonst: kein Wert eingesetzt, Kennung oder Datum fehlt oder ist ungültig | „unbekannt“ | „unknown“ |

`<commit>` ist die vollständige Kennung mit 40 Zeichen. Datum und Uhrzeit sind die Ortszeit des Browsers im 24-Stunden-Format. Die Formatierung erfolgt wie beim Tooltip mit eigenen, mit Nullen aufgefüllten Bestandteilen (`localParts` in `src/commitDate.ts`), nicht über `Intl` oder `toLocaleString` (technische Dokumentation Abschnitt 2.6).

### 3.4 Kennung und Datum beim Bau

`lookupGitRevision(directory)` in `buildinfo/gitRevision.ts`:

- `directory` ist das Verzeichnis von `vite.config.ts`, dort aus `import.meta.url` berechnet. Kein fester Pfad.
- Erster Aufruf: `git -C <directory> rev-parse HEAD`. Gültig ist nur eine Ausgabe, die nach Entfernen des abschließenden Zeilenumbruchs genau 40 Hexadezimalzeichen in Kleinbuchstaben ist.
- Nur bei gültiger Kennung zweiter Aufruf: `git -C <directory> log -1 --no-show-signature --format=%cI <commit>`. Gültig ist nur eine Ausgabe, die nach Entfernen des abschließenden Zeilenumbruchs genau ein Zeitstempel mit Zeitzonenangabe ist und die Prüfung aus `src/timestamp.ts` besteht.
- Beide Aufrufe mit `execFileSync`, fester Argumentliste, ohne Shell, Eingabe aus `ignore`, Zeitbegrenzung 5 Sekunden, Ausgabe als Text.
- Ergebnis ist `{ commit, committedAt }`, wenn beide Aufrufe gültig sind, sonst `null`. Jeder Fehler (Git nicht ausführbar, kein Git-Arbeitsbereich, Zeitüberschreitung, Exitcode ungleich 0, ungültige Ausgabe, Ausnahme) ergibt `null` und genau eine Warnung auf der Fehlerausgabe mit festem Text, zum Beispiel `pipwerk studio: revision for the About dialog could not be determined`. Die Warnung enthält weder Git-Ausgabe noch Ausnahmetext noch Pfad noch Kennung. Der Bau läuft weiter.

`vite.config.ts` ruft `lookupGitRevision` einmal beim Laden der Konfiguration auf und setzt das Ergebnis mit `define` als `__PIPWERK_STUDIO_BUILD_REVISION__` ein (`JSON.stringify` des Ergebnisses). Das gilt für `vite build`, `vite` und `vite preview` gleichermaßen; `vite preview` liefert die bereits gebauten Dateien mit dem beim Bau eingesetzten Wert aus.

`src/buildRevision.ts` liest `__PIPWERK_STUDIO_BUILD_REVISION__` und prüft den Wert erneut: ein Objekt mit genau den Feldern `commit` (40 Hexadezimalzeichen in Kleinbuchstaben) und `committedAt` (Prüfung aus `src/timestamp.ts`), sonst `null`. Exportiert wird eine Funktion `parseBuildRevision(value: unknown)` und ihr Ergebnis für den eingesetzten Wert. Der Dialog verwendet nur dieses Ergebnis.

### 3.5 Adresse des Repositorys

`package.json` erhält:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/macodix/pipwerk"
}
```

`src/repository.ts` liest `repository.url` über den JSON-Import von Vite und prüft sie gegen `^https://github\.com/[A-Za-z0-9-]+/[A-Za-z0-9._-]+$`. Exportiert werden eine Funktion `parseRepositoryUrl(value: unknown)`, die die geprüfte Adresse oder `null` liefert, und ihr Ergebnis für den Wert aus `package.json`. Die Prüfung wirft keine Ausnahme.

Besteht die Adresse die Prüfung nicht, zeigt der Dialog bei „Repository“ den Text „unbekannt“ beziehungsweise „unknown“ ohne Verweis. Die übrige Oberfläche und der Dialog arbeiten normal. Dieser Fall ist ein Programmfehler und kommt in einer geprüften Oberfläche nicht vor: Ein Frontend-Test prüft, dass die Adresse aus `package.json` genau `https://github.com/macodix/pipwerk` lautet, und lässt die Prüfung sonst scheitern.

### 3.6 Lizenztext und Aufrufstelle

Lizenztext: `AboutDialog.tsx` importiert `LICENSE` aus dem Wurzelverzeichnis des Repositorys mit dem Zusatz `?raw`. Vite schreibt den Text beim Bau in die ausgelieferten Dateien. Fehlt die Datei, schlägt der Import fehl: `npm run build` und `npm test` enden mit einem Fehler, der Entwicklungsserver meldet den Fehler beim Laden der Seite (E7). Einen Ersatztext gibt es nicht. Der Entwicklungsserver liefert Dateien außerhalb des Verzeichnisses `frontend` nur aus, wenn sie freigegeben sind. `vite.config.ts` ergänzt deshalb `server.fs.allow` um genau die Datei `LICENSE`, als Pfad relativ zur Konfigurationsdatei berechnet, und behält die Standardfreigabe des Projektverzeichnisses bei (`searchForWorkspaceRoot`). Ein Frontend-Test prüft, dass der angezeigte Text Zeichen für Zeichen mit `LICENSE` übereinstimmt.

Aufrufstelle nach req-ui-010: eine Schaltfläche (`button`, `type="button"`) in der Kopfzeile rechts neben der Sprachauswahl, Beschriftung „Über pipwerk studio“ beziehungsweise „About pipwerk studio“ nach Oberflächensprache. Sie ist mit Maus und Tastatur bedienbar. `App.tsx` hält den Zustand „offen“, öffnet den Dialog mit der Schaltfläche und schließt ihn über `onClose`. Nach dem Schließen erhält die Schaltfläche wieder den Fokus; `App.tsx` setzt ihn ausdrücklich und verlässt sich nicht auf das Verhalten des Browsers.

## 4. Tests

### 4.1 Frontend-Tests (Vitest)

jsdom bildet `showModal()` und `close()` nicht vollständig nach. `src/test-setup.ts` ergänzt beide für `HTMLDialogElement` so, dass sie das Attribut `open` setzen beziehungsweise entfernen und `close` das Ereignis `close` auslöst. Die Sperrung der übrigen Oberfläche weist der Browsertest nach (Abschnitt 4.2).

Die Include-Liste von Vitest wird um `buildinfo/**/*.test.ts` ergänzt. Diese Tests laufen in der Umgebung `node`.

Geprüft wird mindestens:

- Schaltfläche in der Kopfzeile rechts neben der Sprachauswahl, Beschriftung in Deutsch und Englisch, Öffnen mit Maus und Tastatur, Fokus nach dem Schließen wieder auf der Schaltfläche
- Überschrift, Name, Bezeichnungen und Schaltfläche „Schließen“ in Deutsch und Englisch; Name unübersetzt
- Sprachwechsel bei offenem Dialog (Sprache in i18next geändert, wie nach erneutem Lesen vom Backend): Texte wechseln sofort, Dialog bleibt offen, Lizenz, Name und Adresse unverändert
- Stand für beide Zustände aus Abschnitt 3.3: Formatierung bei fest eingestellten Zeitzonen, Auffüllen mit Nullen, Tageswechsel durch die Zeitzone, „unbekannt“ bei `null`
- `parseBuildRevision`: gültiger Wert; jede Abweichung einzeln ergibt `null` (kein Objekt, Feld fehlt, zusätzliches Feld, Kennung falsch lang, Großbuchstaben, Datum fehlt, Datum kein Text, Datum ohne Zeitzone, unmögliches Datum, Kennung ohne Datum)
- `lookupGitRevision`: echtes Git in einem temporären Repository mit festem Committer-Datum ergibt Kennung und Datum; kein Git-Arbeitsbereich (temporäres Verzeichnis außerhalb jedes Arbeitsbereichs, `GIT_DIR`, `GIT_WORK_TREE` und `GIT_CEILING_DIRECTORIES` kontrolliert; ohne installiertes Git übersprungen mit Begründung) ergibt `null`; Git nicht ausführbar, Zeitüberschreitung, Exitcode ungleich 0, ungültige Kennung, ungültiges Datum und Ausnahme ergeben je `null` und genau eine Warnung ohne Git-Ausgabe, Ausnahmetext, Pfad und Kennung (mit unverwechselbaren Markierungstexten belegt); kein zweiter Aufruf ohne gültige Kennung; Aufruf ohne Shell mit fester Argumentliste
- Lizenzname, Lizenztext identisch mit `LICENSE`, `lang="en"`, Lizenzfeld mit der Tastatur erreichbar
- Verweis mit `href`, `target="_blank"`, `rel="noopener noreferrer"` und der Adresse als Text
- Schließen mit der Schaltfläche und mit dem Ereignis `cancel`; Fokus beim Öffnen auf „Schließen“
- Der Dialog stellt keine Netzwerkanfrage (`fetch` wird beim Öffnen nicht aufgerufen)
- `repository.ts`: Adresse aus `package.json` genau `https://github.com/macodix/pipwerk`; `parseRepositoryUrl` lehnt abweichende Formen ab (anderer Rechner, `http`, zusätzlicher Pfad, Abfrageteil, Leerzeichen, kein Text) ohne Ausnahme; Dialog zeigt bei `null` „unbekannt“ ohne Verweis
- Vollständigkeit der Übersetzungen (bestehender Test)
- Fußzeile und Tooltip unverändert (bestehende Tests bestehen ohne Änderung ihrer Erwartungen)

### 4.2 Browsertest (Playwright)

In Chromium, Firefox und WebKit:

- Dialog öffnen über die Schaltfläche in der Kopfzeile mit Maus und mit Tastatur, Inhalte in beiden Sprachen
- Stand gleich `git rev-parse HEAD` und dem Datum aus `git log -1 --format=%cI` in der fest eingestellten Zeitzone des Testbrowsers; der Erwartungswert wird im Test unabhängig vom Produktionscode berechnet. Ohne Git-Arbeitsbereich „unbekannt“ (übersprungen, wenn der Arbeitsbereich ein Git-Arbeitsbereich ist, wie beim bestehenden Test der Fußzeile).
- Kennung im Dialog gleich der Kennung im Tooltip der Fußzeile (E9).
- Beim Öffnen und bei offenem Dialog entsteht keine Anfrage an eine andere Adresse als die der Testumgebung. Jede solche Anfrage lässt den Test scheitern.
- Sperrung: Bei offenem Dialog lassen sich Sprachauswahl und Schaltfläche „Über pipwerk studio“ weder mit der Maus noch mit der Tabulatortaste erreichen; der Fokus bleibt im Dialog.
- Schließen: Escape schließt, „Schließen“ schließt, ein Klick neben den Dialog schließt nicht. Danach liegt der Fokus auf der Schaltfläche „Über pipwerk studio“.
- Verweis öffnet sich in einem neuen Tab mit der Adresse (neue Seite im Browserkontext; die Seite selbst wird über `page.route` abgefangen und nicht geladen).
- Bestehende Prüfungen von Fußzeile und Tooltip bestehen unverändert.

## 5. Sicherheit

- Die Oberfläche erhält keinen neuen Netzwerkzugriff. Der Dialog stellt keine Anfrage, weder an das Backend noch nach außen.
- Beim Bau startet `buildinfo/gitRevision.ts` bis zu zwei Git-Unterprozesse mit fester Argumentliste, ohne Shell, ohne Eingaben von außen (die Kennung stammt aus dem ersten Aufruf und wird zuvor geprüft) und mit Zeitbegrenzung. Warnungen enthalten keine Git-Ausgabe, keinen Ausnahmetext und keinen Pfad.
- Der eingesetzte Wert wird im Browser erneut geprüft; nur ein geprüfter Wert wird angezeigt. Alle Texte setzt React als Text, nie als HTML.
- Kennung und Datum des Commits stehen in den ausgelieferten Dateien. Beide sind öffentlich, weil das Repository öffentlich ist (geprüft am 13.10.2026).
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
| `docs/technical/pipwerk-studio.md` | Abschnitt zum Dialog mit den Entscheidungen E1 bis E9, Ermittlung beim Bau, Bau bricht ohne `LICENSE` ab, neue Dateien in Abschnitt 2.3, Unterprozesse beim Bau in Abschnitt 8, Tests in Abschnitt 6, Skripte der Komponente, Grenze im Entwicklungsbetrieb in Abschnitt 9 |
| `docs/user/pipwerk-studio.md` | siehe unten |
| `components/pipwerk-studio/README.md` | Satz zum Dialog in der Beschreibung des Stands |

Die Anwenderdokumentation beschreibt in ganzen Sätzen nach req-system-021:

- Aufbau der Oberfläche (Abschnitt 3): die neue Schaltfläche in der Kopfzeile
- einen neuen Abschnitt zum Dialog „Über pipwerk studio“: Öffnen mit Maus und Tastatur, alle Inhalte, die zwei Anzeigen des Stands mit Beispiel und der Bedeutung von „unbekannt“, Anzeige „unbekannt“ beim Repository, gesperrte übrige Oberfläche, Schließen mit „Schließen“ und Escape, Rückkehr des Fokus auf die Schaltfläche, Sprachwechsel bei offenem Dialog
- dass Dialog und Fußzeile denselben Stand nennen, der Dialog ihn aber vollständig mit Datum zeigt, und dass beide nach einem Wechsel des Arbeitsbereichs bis zum Neustart den Stand beim Start nennen (E9)
- dass die Anzeige im Dialog keine Internetverbindung braucht, das Öffnen des Verweises auf das Repository aber schon
- einen neuen Abschnitt „Glossar“ mit den Begriffen, die die Anwenderdokumentation verwendet und die ohne Vorwissen nicht verständlich sind, mindestens Commit, Kennung (eines Commits), Stand, Repository, Lizenz, Hintergrunddienst und Tooltip. Bestehende Erklärungen im Fließtext bleiben und verweisen auf das Glossar.

## 8. Nicht Gegenstand

- Die Schreibweise „Pipwerk Studio“ in Kopfzeile, Fußzeilentexten und Dokumentation. Der Dialog und seine Schaltfläche verwenden „pipwerk studio“ nach req-ui-010 und Projektziel. Eine Angleichung der übrigen Stellen ist nicht Teil von req-ui-010.
- Der Einstellungsbereich und der Menüpunkt „Einstellungen“ nach req-ui-009.
- Änderungen am Backend und an `GET /api/studio/revision`. Die Fußzeile bezieht ihren Stand weiter vom Backend.

## 9. Hinweise für den Auftraggeber

Die QA hat im Prüfbericht [specification-1.md](reviews/specification-1.md) zwei Fragen genannt, die über req-ui-010 hinausgehen. Die Spezifikation hängt von keiner der beiden ab. Sie werden hier zur Vorlage beim Auftraggeber festgehalten:

- S7: Kopfzeile und übrige Oberfläche schreiben „Pipwerk Studio“, Schaltfläche und Dialog nach req-ui-010 „pipwerk studio“. Auf einer Zeile stehen damit zwei Schreibweisen. Ist das gewollt, bis eine eigene Anforderung die übrigen Stellen regelt?
- S8: req-ui-010 setzt die Schaltfläche rechts neben die Sprachauswahl. req-ui-009 verlegt die Sprachauswahl später in den Einstellungsbereich. Wo steht die Schaltfläche dann?
