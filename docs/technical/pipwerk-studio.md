# Pipwerk Studio – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-09
- komponente: `pipwerk-studio`

## 1. Gegenstand

Dieses Dokument beschreibt den technischen Aufbau von Pipwerk Studio, die Einrichtung einer Entwicklungsumgebung, den Start im Entwicklungsbetrieb und die vorgeschriebenen Prüfungen.

Der beschriebene Stand ist das technische Grundgerüst aus dem Arbeitspaket AP1, erweitert um die dauerhafte Oberflächensprache (WO-2026-10-04-001), die Anzeige des Stands (WO-2026-10-08-001) und den Tooltip der Standanzeige mit Commit und Commit-Datum (WO-2026-10-09-004). Pipwerk Studio zeigt eine leere Designer-Arbeitsfläche, kann die Oberflächensprache zwischen Deutsch und Englisch wechseln, speichert die gewählte Sprache dauerhaft im Backend, prüft, ob das Backend erreichbar ist, und zeigt in der Fußzeile den Stand (Kurzform des Commits), aus dem es läuft; ein Tooltip nennt den vollständigen Commit und dessen Datum. Fachliche Objekte, Strategien und Ausführung sind noch nicht enthalten.

## 2. Aufbau der Komponente

Pipwerk Studio liegt im Verzeichnis `components/pipwerk-studio/` und besteht aus zwei Teilen.

| Verzeichnis | Inhalt |
| --- | --- |
| `backend/` | Python-Paket `pipwerk_studio` mit der HTTP-Anwendung, den Backend-Tests und der Python-Lockdatei `uv.lock` |
| `frontend/` | Browseroberfläche mit React und TypeScript, Vite-Konfiguration, Frontend-Tests, Playwright-Tests und der npm-Lockdatei `package-lock.json` |

### 2.1 Backend, Konfiguration und Persistenz

Das Backend ist eine FastAPI-Anwendung. Die Funktion `create_app()` in `backend/src/pipwerk_studio/app.py` erzeugt die Anwendung. Sie wird mit dem ASGI-Server Uvicorn gestartet. `cli.py` ist der eigenständige Startpunkt, `config.py` liest die INI-Startkonfiguration, `settings_service.py` bildet die anwendungsseitige Servicegrenze, `storage.py` kapselt SQLAlchemy und das relationale Speichermodell und `revision.py` ermittelt den Stand (Abschnitt 2.6).

Die Oberflächensprache ist eine einzige betriebliche Einstellung der Komponente, nicht benutzerbezogen und kein Bestandteil von Strategiedaten. Der Browser ist nicht autoritativ und verwendet dafür weder Local Storage noch Session Storage noch Cookies. Ohne gespeicherten Wert liefert der Service Deutsch (`de`). Die Datenbank enthält höchstens einen zentralen Datensatz in `studio_settings`.

Enthält der gespeicherte Wert keine unterstützte Sprache (technisch fehlerhafter Speicherinhalt, zum Beispiel nach händischer Änderung der Datenbank), wird keine Ersatzsprache angenommen. Der Lesezugriff schlägt mit HTTP 503 und der Meldung `The stored Studio language is invalid.` fehl und der Fehler wird im Backend protokolliert; die Oberfläche zeigt dann die Meldung zum fehlgeschlagenen Lesen (Abschnitt 2.4). Ein gültiger Schreibzugriff ersetzt den fehlerhaften Wert und behebt den Zustand.

SQLAlchemy bleibt hinter der Service-/Infrastrukturgrenze; ORM-Objekte werden nicht als API-Modelle verwendet. Das kleine initiale Schema wird beim Start angelegt. Da für dieses neue, einzeilige Schema noch keine Schemaänderung oder Bestandsmigration existiert, wird Alembic derzeit nicht eingesetzt. Vor einer späteren Schemaänderung ist eine versionierte Migration einzuführen.

### 2.2 Zweistufige Konfiguration

Die INI-Startkonfiguration enthält ausschließlich die SQLAlchemy-Datenbank-URL:

```ini
[database]
url = sqlite:///./pipwerk-studio.db
```

Pipwerk Studio startet nicht ohne gültige INI-Startkonfiguration (Nutzerentscheidung vom 2026-10-06, gilt für Pipwerk Studio). Die INI gehört zur Installation und muss mindestens die für den Start erforderliche Datenbankverbindung definieren. Eine implizite Ersatzdatenbank bei fehlender INI gibt es nicht. Ohne `-c` und ohne Datei an allen Suchorten endet der Start mit Exitcode 1 und einer Meldung, die die durchsuchten Orte und den Parameter `-c <PATH>` nennt:

```text
pipwerk-studio: No startup configuration found. Pipwerk Studio does not start without one. Searched: <Suchorte>. Provide a startup configuration file with -c <PATH>.
```

Als ungültig gelten außerdem eine fehlende Datei bei `-c`, eine nicht lesbare oder nicht auswertbare Datei, ein fehlender Abschnitt `[database]`, ein fehlender oder leerer (auch nur aus Leerzeichen bestehender) Eintrag `url` und eine `url`, mit der keine Datenbank-Engine erzeugt werden kann oder die Datenbank nicht erreichbar ist. Der Start über `create_app()` ohne Argument (zum Beispiel `uvicorn --factory`) verwendet dieselbe Suche und bricht bei fehlender Konfiguration mit `StartupConfigError` ab.

Ein vollständiges Beispiel liegt in `backend/pipwerk-studio.example.ini`. Die Sprache steht ausdrücklich nicht in der INI, sondern im konfigurierten Speicher.

Eine mit `-c <PATH>` angegebene Datei hat höchste Priorität. Ohne `-c` wird genau die erste vorhandene Datei namens `pipwerk-studio.ini` in dieser Reihenfolge verwendet; Inhalte werden nicht zusammengeführt:

1. `$HOME/pipwerk/etc/pipwerk-studio.ini`
2. `$HOME/.config/pipwerk/pipwerk-studio.ini`
3. `/etc/pipwerk/pipwerk-studio.ini`

Unter Windows gelten entsprechend `%USERPROFILE%\pipwerk\etc`, `%APPDATA%\pipwerk` und `%PROGRAMDATA%\pipwerk`. Eine explizit angegebene fehlende, unlesbare, nicht auswertbare oder unvollständige Datei beendet den Start mit einer Fehlermeldung. Ist eine der Umgebungsvariablen `HOME`, `USERPROFILE`, `APPDATA` oder `PROGRAMDATA` nicht gesetzt, leer oder kein absoluter Pfad, entfallen die davon abhängigen Suchorte; es werden nie Pfade relativ zum Startverzeichnis durchsucht.

### 2.3 Oberfläche

Die Oberfläche ist eine React-Anwendung in TypeScript. Vite dient im Entwicklungsbetrieb als Entwicklungsserver und erzeugt bei Bedarf die auslieferbaren Dateien.

Die Oberfläche besteht aus folgenden Bestandteilen:

| Datei | Aufgabe |
| --- | --- |
| `src/main.tsx` | Startpunkt; bindet Übersetzung, TanStack Query und die Anwendung ein |
| `src/App.tsx` | Seitenaufbau aus Kopfzeile, Arbeitsfläche und Fußzeile; setzt das Attribut `lang` des Dokuments auf die gewählte Sprache |
| `src/DesignerCanvas.tsx` | leere Designer-Arbeitsfläche auf Grundlage von React Flow |
| `src/LanguageSelect.tsx` | Auswahlfeld für die Oberflächensprache; zeigt einen Fehlerzustand, wenn das Speichern fehlschlägt |
| `src/useStudioLanguage.ts` | Lesen und Schreiben der Oberflächensprache als Serverzustand mit TanStack Query |
| `src/settingsApi.ts` | Abruf und strenge Prüfung der Antworten der Spracheinstellungs-Schnittstelle |
| `src/BackendStatus.tsx` | Anzeige, ob das Backend erreichbar ist |
| `src/api.ts` | Abruf und Prüfung der Antwort der Verbindungsprüfung |
| `src/RevisionDisplay.tsx` | Anzeige des Stands in der Fußzeile rechts neben dem Backend-Status, mit Tooltip und zugänglicher Beschreibung (Commit und Commit-Datum in Ortszeit des Browsers) |
| `src/revisionApi.ts` | Abruf und strenge Prüfung der Antwort der Stand-Schnittstelle (drei Felder, Invarianten, Format des Datums) |
| `src/i18n.ts` | Einrichtung von i18next mit den unterstützten Sprachen |
| `src/locales/de.json`, `src/locales/en.json` | deutsche und englische Oberflächentexte |
| `src/styles.css` | Gestaltung der Oberfläche |

Die Arbeitsfläche enthält keine Knoten und keine Verbindungen. React-Flow-Objekte werden in diesem Stand weder erzeugt noch gespeichert.

### 2.4 Mehrsprachigkeit

Alle sichtbaren Texte der Oberfläche werden über Übersetzungsschlüssel aus den Dateien in `src/locales/` geladen. Beide Dateien müssen dieselben Schlüssel enthalten; ein Frontend-Test prüft das.

Der Produktname „Pipwerk Studio“ wird nicht übersetzt. Die Sprachnamen im Auswahlfeld werden in ihrer eigenen Sprache angezeigt, also „Deutsch“ und „English“.

Die Oberflächensprache wird vom Backend gelesen und dort dauerhaft gespeichert (Abschnitt 2.1). Ist noch nichts gespeichert, ist Deutsch eingestellt. Der Hook `useStudioLanguage` leitet die angezeigte Sprache, den Zustand der Auswahl und die Meldung an einer Stelle aus dem Lesezustand (TanStack Query) und dem Speicherzustand (Mutation) ab. Die Auswahl und die Texte zeigen immer dieselbe Sprache. Eine „bestätigte“ Sprache ist die zuletzt vom Backend gelesene oder nach dem Speichern zurückgegebene Sprache.

| Zustand | Angezeigte Sprache | Auswahl | Meldung | Test |
| --- | --- | --- | --- | --- |
| erstes Lesen läuft | Deutsch (Standard) | deaktiviert | keine | A1 |
| erstes Lesen erfolgreich | gelesene Sprache | bedienbar | keine | A2 |
| erstes Lesen fehlgeschlagen (Fehler oder Zeitbegrenzung) | Deutsch (Standard) | bedienbar | Lesefehler | A3, A4 |
| erneutes Lesen läuft, noch keine Sprache bestätigt (Fensterfokus, Wiederverbindung) | Deutsch (Standard) | deaktiviert | keine; schlägt es wieder fehl, kehrt der Lesefehler zurück | A5 |
| erneutes Lesen läuft nach „Speichern fehlgeschlagen, keine Sprache bestätigt“ | Deutsch (Standard) | deaktiviert | Speicherfehler ohne bestätigte Sprache bleibt | B4 |
| Speichern läuft | gewählte Sprache | deaktiviert (nie zwei Speicheranfragen gleichzeitig) | keine | B1, E1 |
| Speichern erfolgreich | gespeicherte Sprache | bedienbar | keine (ein vorheriger Lese- oder Speicherfehler entfällt) | B2, B4, E2 |
| Speichern fehlgeschlagen (Fehler oder Zeitbegrenzung), Sprache bestätigt | bestätigte Sprache | bedienbar | Speicherfehler | B3, B5 |
| Speichern fehlgeschlagen, keine Sprache bestätigt | Deutsch (Standard) | bedienbar | Speicherfehler mit Hinweis, dass die gespeicherte Sprache nicht gelesen werden konnte | B4 |
| Speichern wird wiederholt | gewählte Sprache | deaktiviert | keine, bis das Ergebnis vorliegt | E2 |
| späteres Lesen erfolgreich, Sprache bestätigt | vom Backend gemeldete Sprache | unverändert | keine | C1 |
| späteres Lesen fehlgeschlagen, Sprache bestätigt | bestätigte Sprache | unverändert | keine | C2 |
| späteres Lesen erfolgreich nach fehlgeschlagenem ersten Lesen | gelesene Sprache | bedienbar | Lesefehler entfällt | C3 |
| späteres Lesen erfolgreich nach „Speichern fehlgeschlagen, keine Sprache bestätigt“ | gelesene Sprache | bedienbar | wechselt zum Speicherfehler mit bestätigter Sprache | C4 |
| Lesen läuft, Speichern ist erfolgreich | gespeicherte Sprache; die ältere Antwort wird verworfen | bedienbar | keine | D1 |
| Lesen startet während des Speicherns, Speichern ist erfolgreich | gespeicherte Sprache; die ältere Antwort wird verworfen | bedienbar | keine | D2 |
| Lesen endet während des Speicherns | gewählte Sprache bis zum Ende des Speicherns; danach bei Fehler die gelesene Sprache | deaktiviert, danach bedienbar | keine, danach Speicherfehler | D3 |
| Lesen läuft beim Beginn des Speicherns, Speichern schlägt fehl | bestätigte Sprache; die Antwort des Lesens wird danach übernommen, es wird nichts abgebrochen | bedienbar | Speicherfehler | D4 |

Beim Erfolg eines Speicherns werden laufende Leseanfragen abgebrochen; ein Abbruch ist kein Fehler und erzeugt keine Meldung. Eine ältere Antwort kann dadurch die gespeicherte Sprache nicht überschreiben. Nach einem fehlgeschlagenen Speichern wird nichts abgebrochen, weil eine laufende Leseanfrage dann den tatsächlichen Zustand des Backends meldet. Nach dem Speichern ist die Antwort des Backends der bestätigte Zustand. Das automatische erneute Lesen löst keine Schreibaktion aus; während des Speicherns wird keine Meldung angezeigt. Die Kennungen der Tabelle stehen in den Testnamen in `src/LanguageSelect.test.tsx`.

Jede Anfrage der Oberfläche an die Spracheinstellungs-API (Lesen und Speichern) hat eine feste Zeitbegrenzung von 10 Sekunden (`LANGUAGE_REQUEST_TIMEOUT_MS` in `src/settingsApi.ts`, nicht umgebungsabhängig). Das Backend ist ein lokaler Prozess, der eine einzelne Datenbankzeile liest oder schreibt; eine längere Wartezeit gilt deshalb als Fehler. Ohne Zeitbegrenzung bliebe die Auswahl bei einer nie beantworteten Anfrage dauerhaft deaktiviert. Die Anfragen werden unabhängig vom Online-Zustand gesendet, den der Browser meldet (`networkMode: 'always'` bei Abfrage und Mutation der Sprache in `src/useStudioLanguage.ts`; der gemeinsame QueryClient bleibt unverändert): Der Hintergrunddienst ist der eigene Backendprozess der Komponente, und der Internetzustand des Browsers sagt nichts über seine Erreichbarkeit. Sonst würde TanStack Query eine Anfrage im Zustand „offline“ gar nicht senden und der Timer nie starten. Die Zeitbegrenzung gilt daher in jedem Fall (Tests A6 und B6). Eine Zeitbegrenzung ohne `AbortSignal.any` verbindet das Abbruchsignal des Aufrufers und das der Zeitbegrenzung über einen eigenen `AbortController`. Läuft die Zeit ab, wird die Anfrage abgebrochen und wie jeder andere Fehler dieser Anfrage behandelt (Lese- bzw. Speicherfehler, kein eigener Meldungstext). Nach einem abgelaufenen Speichern ist unklar, ob das Backend die Änderung noch übernommen hat; die Oberfläche zeigt die zuletzt bestätigte Sprache und gleicht sich beim nächsten erfolgreichen Lesen mit dem Backend ab.

Der Browser speichert die Sprache weder in Local Storage noch in Session Storage noch in Cookies.

### 2.5 Verbindung zwischen Oberfläche und Backend

Die Oberfläche ruft beim Laden die Verbindungsprüfung des Backends mit TanStack Query ab. Sie prüft, ob die Antwort genau den erwarteten Inhalt hat. Das Ergebnis wird in der Fußzeile angezeigt. Bei einem HTTP-Fehler, einem Netzwerkfehler oder einer unerwarteten Antwort zeigt die Oberfläche an, dass das Backend nicht erreichbar ist.

Im Entwicklungsbetrieb ruft der Browser nur den Vite-Entwicklungsserver auf. Vite leitet alle Anfragen unter `/api` an das Backend weiter. Browser und Backend verwenden dadurch aus Sicht des Browsers dieselbe Adresse. Eine CORS-Freigabe im Backend ist deshalb nicht nötig und nicht eingerichtet.

### 2.6 Anzeige des Stands

Die Fußzeile zeigt rechts neben dem Backend-Status den Stand, aus dem Pipwerk Studio läuft: die ersten 7 Zeichen des Git-Commits. Auf Deutsch lautet die Anzeige „Stand: <kurzform>“, auf Englisch „Revision: <kurzform>“; ein Sprachwechsel schaltet die Bezeichnung um. Die Texte stehen unter dem Schlüssel `revision` in `de.json` und `en.json`. Lässt sich der Stand nicht ermitteln, erscheint „Stand: unbekannt“ beziehungsweise „Revision: unknown“ ohne Tooltip.

Fährt man mit dem Mauszeiger über die Standanzeige, erscheint ein Tooltip mit dem vollständigen Commit (40 Zeichen) und dem Committer-Datum dieses Commits. Auf Deutsch lautet er „Commit <hash> vom TT.MM.JJJJ, hh:mm Uhr“, auf Englisch „Commit <hash> from YYYY-MM-DD hh:mm“; die Uhrzeit hat das 24-Stunden-Format und ist die Ortszeit des Browsers. Ist das Datum nicht ermittelbar, lautet er „Commit <hash>“. Ein Sprachwechsel schaltet den Tooltip um. Die Texte stehen unter den Schlüsseln `revision.commit` und `revision.commitAt` in `de.json` und `en.json`.

Architekturentscheidung (Softwarearchitekt, WO-2026-10-08-001):

- Das Backend ermittelt den Stand einmal beim Erzeugen der Anwendung in `create_app()`, nicht je Anfrage. Der Stand ändert sich während eines Prozesses nicht; der Prozess läuft aus dem Stand, der beim Start ausgecheckt war. Eine Ermittlung je Anfrage würde den Stand eines später veränderten Arbeitsbereichs melden, aus dem der Prozess gar nicht läuft, und für jede Anfrage einen Unterprozess starten.
- Die Ermittlung (`revision.py`) führt `git -C <Verzeichnis des Pakets pipwerk_studio> rev-parse HEAD` als Unterprozess mit fester Argumentliste, ohne Shell und mit einer Zeitbegrenzung von 5 Sekunden aus. Gültig ist nur eine Ausgabe aus genau 40 Hexadezimalzeichen in Kleinbuchstaben; die Kurzform sind deren erste 7 Zeichen. `--short` wird nicht verwendet, weil Git die Kurzform bei Mehrdeutigkeit verlängert, die Anzeige aber genau 7 Zeichen hat.
- Jeder Fehler (Git nicht vorhanden, kein Git-Arbeitsbereich, Zeitüberschreitung, Exitcode ungleich 0, ungültige Ausgabe) ergibt „nicht ermittelbar“. Das Backend startet und arbeitet dann normal und schreibt genau eine Warnung ins Protokoll. Die Warnung nennt nur eine feste, allgemeine Ursache (zum Beispiel „Git could not be run“); sie enthält weder Bestandteile der Git-Ausgabe (stdout, stderr) noch den Text einer Ausnahme noch einen Pfad. Ein Test je Fehlerweg belegt das (Abschnitt 6.1).
- Die Ermittlung ist über den optionalen Parameter `revision_lookup` von `create_app()` austauschbar, damit Tests ohne echtes Git deterministisch sind. `lookup_git_revision()` nimmt das zu prüfende Verzeichnis als optionalen Parameter (Standard: Verzeichnis des Pakets); nur Tests übergeben ein anderes.
- Die Oberfläche ruft den Stand über die interne Schnittstelle `GET /api/studio/revision` (Abschnitt 5) mit TanStack Query ab. `/api/health` bleibt unverändert, weil `pipwerk-dev` genau `{"status": "ok"}` erwartet.
- Solange der Abruf läuft, fehlschlägt, eine ungültige Antwort liefert oder `null` liefert, zeigt die Oberfläche „unbekannt“ beziehungsweise „unknown“ ohne Tooltip und ohne Beschreibung. Die Anzeige trägt bewusst nicht die Rolle `status`, die allein dem Backend-Status gehört.

Der Stand ist keine Versionsnummer und kein Build-Datum. Der Tooltip nennt das Datum des Commits, nicht den Zeitpunkt des Builds oder des Starts.

Architekturentscheidung (Softwarearchitekt, WO-2026-10-09-004):

- Ermittlung im Backend, weiterhin einmal in `create_app()` und nicht je Anfrage. Der bestehende Aufruf `git rev-parse HEAD` liefert den Hash. Nur wenn er einen gültigen Hash (genau 40 Hexadezimalzeichen in Kleinbuchstaben) liefert, folgt ein zweiter Unterprozess für das Committer-Datum: `git -C <Verzeichnis des Pakets pipwerk_studio> log -1 --no-show-signature --format=%cI <hash>`, mit fester Argumentliste, ohne Shell, mit `stdin=DEVNULL` und einer Zeitbegrenzung von 5 Sekunden wie beim ersten Aufruf.
- Gültig ist nur eine Ausgabe, die nach `strip()` genau ein strenger ISO-8601-Zeitstempel mit Zeitzonenangabe ist (Format von `%cI`, zum Beispiel `2026-10-09T14:52:03+02:00`). Das Backend prüft das Muster und mit `datetime.fromisoformat`, dass die Zeitzone gesetzt ist, und gibt den Wert ohne Umrechnung als ISO-8601-Zeichenkette mit Offset weiter. Die Umrechnung in Ortszeit erfolgt allein im Browser.
- Jeder Fehler der Datumsermittlung (Git nicht ausführbar, Zeitüberschreitung, Exitcode ungleich 0, ungültige Ausgabe, Ausnahme) ergibt „Datum nicht ermittelbar“ (`null`). Der Hash bleibt erhalten, das Backend startet normal und schreibt genau eine Warnung ohne Git-Ausgabe, Ausnahmetext oder Pfad. Ist der Hash nicht ermittelbar, wird kein Datum ermittelt und keine zusätzliche Warnung geschrieben.
- Die Datumsermittlung ist über den optionalen Parameter `commit_date_lookup` von `create_app()` austauschbar (analog zu `revision_lookup`). `lookup_git_commit_date()` nimmt das Verzeichnis als optionalen Parameter (Standard: Verzeichnis des Pakets); nur Tests übergeben ein anderes. `determine_revision()` in `revision.py` verbindet beide Ermittlungen zu einem `Revision` mit Commit und Datum.
- `GET /api/studio/revision` liefert genau drei Felder (Abschnitt 5). Invarianten: `revision` ist genau dann `null`, wenn `commit` `null` ist; `revision` ist die Kurzform (erste 7 Zeichen) von `commit`; `committed_at` ist nur ungleich `null`, wenn `commit` ungleich `null` ist. Das Pydantic-Modell `StudioRevision` erzwingt das mit `extra="forbid"` und `strict`. `/api/health` bleibt unverändert.
- Die Oberfläche (`revisionApi.ts`) akzeptiert nur Antworten mit genau diesen drei Feldern und eingehaltenen Invarianten; `committed_at` muss dem Muster `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$` entsprechen und ein echtes Kalenderdatum mit gültiger Uhrzeit sein (Monat 1 bis 12, Tag gemäß Monatslänge einschließlich Schaltjahr, Stunde 0 bis 23, Minute und Sekunde 0 bis 59, Offset höchstens 23:59). Die Prüfung rechnet selbst und hängt nicht von `Date.parse` ab, weil Browser unmögliche Daten unterschiedlich umrechnen. Jede andere Antwort gilt als ungültig: „unbekannt“ ohne Tooltip.
- Der Tooltip ist das native `title`-Attribut der Standanzeige (`RevisionDisplay`). Zusätzlich verweist `aria-describedby` auf ein verstecktes Element (Attribut `hidden`) mit demselben Text, damit die zugängliche Beschreibung nicht von der Behandlung von `title` durch den Browser abhängt. Dieses Element steht unmittelbar hinter der Standanzeige und verändert die sichtbare Fußzeile nicht. Es gibt kein eigenes Tooltip-Bauteil und keine neue Abhängigkeit; die Standanzeige wird nicht fokussierbar.
- Die Formatierung erfolgt im Browser in Ortszeit mit eigenen, mit Nullen aufgefüllten Bestandteilen (`getFullYear`, `getMonth`, `getDate`, `getHours`, `getMinutes`), nicht über `Intl` oder `toLocaleString`, damit Format und 24-Stunden-Uhr unabhängig von der Browsersprache feststehen.

## 3. Voraussetzungen für die Entwicklung

Für die Entwicklung werden folgende Programme benötigt:

| Programm | Version | Herkunft |
| --- | --- | --- |
| Python | 3.14 oder neuer | Ubuntu-Paketquelle (Ubuntu 26.04: Python 3.14) |
| uv | geprüft mit 0.5.9 | Installation nach der Anleitung des Herstellers unter https://docs.astral.sh/uv/ |
| Node.js mit npm | 24 oder neuer | geprüft mit Node.js 24.19.0 und npm 11.17.0 aus der konfigurierten Paketquelle |

Alle Python-Pakete werden von uv in eine eigene virtuelle Umgebung unter `backend/.venv` installiert. Alle Node-Pakete werden von npm in `frontend/node_modules` installiert. Die systemweite Python- und Node-Umgebung wird dabei nicht verändert.

Für die Playwright-Tests werden zusätzlich die Testbrowser von Playwright benötigt (siehe Abschnitt 6.3).

## 4. Einrichtung und Start im Entwicklungsbetrieb

### 4.1 Einrichtung

Die Abhängigkeiten werden genau in den Versionen der Lockdateien installiert:

```sh
cd components/pipwerk-studio/backend
uv sync --frozen

cd ../frontend
npm ci
```

### 4.2 Start

Im Entwicklungsbetrieb laufen Backend und Oberfläche als zwei Prozesse. Beide werden in je einem eigenen Terminal gestartet.

Das Backend wird im Verzeichnis `components/pipwerk-studio/backend` gestartet. Ohne `-c` wird einer der in Abschnitt 2.2 beschriebenen Suchpfade verwendet; ohne gültige INI startet das Backend nicht (Abschnitt 2.2). Das Beispiel kopiert die Beispiel-INI und gibt sie ausdrücklich an:

```sh
cp pipwerk-studio.example.ini pipwerk-studio.ini
uv run --frozen pipwerk-studio -c pipwerk-studio.ini --host 127.0.0.1 --port 8000
```

Die Oberfläche wird im Verzeichnis `components/pipwerk-studio/frontend` gestartet:

```sh
npm run dev
```

Danach ist Pipwerk Studio im Browser unter `http://127.0.0.1:5173/` erreichbar.

Die lokal erzeugten Dateien `backend/pipwerk-studio.ini` und `backend/pipwerk-studio.db` (einschließlich `-journal`, `-wal`, `-shm`) werden von `components/pipwerk-studio/.gitignore` ausgeschlossen und können nicht versehentlich committet werden. Versioniert bleibt nur `backend/pipwerk-studio.example.ini`.

Vite leitet Anfragen unter `/api` standardmäßig an `http://127.0.0.1:8000` weiter. Läuft das Backend unter einer anderen Adresse, wird diese beim Start der Oberfläche in der Umgebungsvariable `PIPWERK_STUDIO_BACKEND_URL` angegeben:

```sh
PIPWERK_STUDIO_BACKEND_URL=http://127.0.0.1:8100 npm run dev
```

Beide Server nehmen standardmäßig nur Verbindungen vom eigenen Rechner an. Der Vite-Entwicklungsserver ist nur für die Entwicklung bestimmt und keine Sicherheitsgrenze.

### 4.3 Erzeugen der Oberflächendateien

Der Befehl `npm run build` im Verzeichnis `frontend` prüft zuerst die Typen und schreibt anschließend die auslieferbaren Oberflächendateien nach `frontend/dist`. Dieses Verzeichnis wird nicht versioniert. Ein Start, bei dem das Backend diese Dateien selbst ausliefert, ist noch nicht vorhanden.

## 5. HTTP-Schnittstelle

Das Backend stellt derzeit vier Endpunkte bereit.

| Methode | Pfad | Erfolgsantwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/health` | HTTP 200 mit `{"status": "ok"}` | technische Prüfung, ob die Oberfläche ihr Backend erreicht |
| `GET` | `/api/studio/settings/language` | HTTP 200 mit `{"language": "de"}` oder `{"language": "en"}` | autoritative Oberflächensprache lesen; ohne gespeicherten Wert `de` |
| `PUT` | `/api/studio/settings/language` | HTTP 200 mit `{"language": "de"}` oder `{"language": "en"}` | Oberflächensprache zentral speichern |
| `GET` | `/api/studio/revision` | HTTP 200 mit `{"revision": "<7 Zeichen>", "commit": "<40 Zeichen>", "committed_at": "<ISO 8601 mit Offset>"}`; jedes Feld kann `null` sein (Invarianten in Abschnitt 2.6) | Stand lesen: Kurzform und vollständiger Commit sind `null`, wenn der Stand nicht ermittelbar ist; das Datum ist `null`, wenn es nicht ermittelbar ist (Abschnitt 2.6) |

Andere Methoden auf diesen Pfaden werden mit HTTP 405 abgelehnt. Die Antworten werden mit den Pydantic-Modellen `HealthStatus`, `StudioLanguage` und `StudioRevision` erzeugt, die keine zusätzlichen Felder zulassen. Der Schreibzugriff verwendet das getrennte Modell `StudioLanguageUpdate`: Der Body enthält ausschließlich `{"language": "de"}` oder `{"language": "en"}`; andere Werte, andere Typen, fehlende oder zusätzliche Felder und ein Body, der kein JSON ist, werden mit HTTP 422 abgelehnt. Ist der gespeicherte Wert ungültig, antwortet das Lesen mit HTTP 503 (Abschnitt 2.1). Das Frontend akzeptiert seinerseits nur eine Antwort mit genau einem gültigen `language`-Feld beziehungsweise bei der Stand-Schnittstelle genau den drei Feldern `revision` (7 Hexadezimalzeichen in Kleinbuchstaben oder `null`), `commit` (40 Hexadezimalzeichen in Kleinbuchstaben oder `null`) und `committed_at` (ISO-8601-Zeitstempel mit Zeitzonenangabe, der ein echtes Kalenderdatum mit gültiger Uhrzeit ist, oder `null`) unter Einhaltung der Invarianten aus Abschnitt 2.6.

Die Endpunkte sind interne Verbindungen innerhalb von Pipwerk Studio (auch `/api/studio/revision`). Sie sind kein Bestandteil der öffentlichen Web-API und kein versionierter Vertrag unter `contracts/`. Die von FastAPI erzeugte Schnittstellenbeschreibung ist im Entwicklungsbetrieb unter `http://127.0.0.1:8000/docs` und `http://127.0.0.1:8000/openapi.json` abrufbar.

## 6. Prüfungen

Ein Pull Request ist nur abnahmefähig, wenn alle folgenden Prüfungen bestehen.

### 6.1 Backend

Im Verzeichnis `components/pipwerk-studio/backend`:

```sh
uv sync --frozen
uv run --frozen pytest
uv run --frozen ruff check
uv run --frozen ruff format --check
uv run --frozen mypy
```

pytest prüft die HTTP-Anwendung ohne gestarteten Server mit dem Testclient von FastAPI sowie die Konfiguration. Die Tests decken Konfigurationspriorität, Suchpfade (POSIX und Windows, auch bei leerem `HOME`; vom Rechner unabhängig), Fehlerfälle, API-Validierung, Start ohne gültige INI (kein Ersatzwert, Exitcode, Meldung, leere `url`, nicht nutzbare Datenbank-URL, `create_app()` ohne Konfiguration), falsche Methoden, ungültigen gespeicherten Wert, den Ausweg bei gleichzeitigem ersten Schreiben, Standardwert, Umschalten, Trennung verschiedener Datenbanken, den Stand und sein Datum (`tests/test_revision.py`, jeder Fall getrennt: gültiger Hash ergibt 7 Zeichen und den vollständigen Commit, gültiges Datum wird unverändert weitergegeben, kein Aufruf der Datumsermittlung ohne gültigen Hash und dann keine zusätzliche Warnung; Git nicht ausführbar, Zeitüberschreitung, Exitcode ungleich 0 bei vorhandenem Arbeitsbereich (gemockt, mit Ausgabe auf stderr) und ungültige Ausgabe ergeben je `null`; kein Arbeitsbereich mit echtem Git in einem temporären Verzeichnis außerhalb jedes Git-Arbeitsbereichs (`GIT_DIR`, `GIT_WORK_TREE` und `GIT_CEILING_DIRECTORIES` werden kontrolliert; ohne installiertes Git wird der Test mit Begründung übersprungen) ergibt `null` und genau eine Warnung; die Anwendung startet bei nicht ermittelbarem Stand normal, `/api/health` liefert `{"status": "ok"}` und `/api/studio/revision` liefert alle drei Felder als `null`; für jeden Fehlerweg (Git nicht ausführbar, Exitcode ungleich 0, Zeitüberschreitung, ungültige Ausgabe, Ausnahme der Ermittlung) genau eine Warnung, die mit unverwechselbaren Markierungstexten in stdout, stderr und Ausnahme belegt weder Git-Ausgabe noch Ausnahmetext noch Pfad enthält; einmalige Ermittlung; für jeden Fehlerweg der Datumsermittlung getrennt (Git nicht ausführbar, Zeitüberschreitung, Exitcode ungleich 0, ungültige und leere Ausgabe, Zeitstempel ohne Offset, mehrere Zeilen, unmögliches Datum, anderes Format, Ausnahme der Ermittlung): Hash bleibt, Datum `null`, Anwendung startet, genau eine Warnung ohne Git-Ausgabe, Ausnahmetext, Pfad und Hash; echtes Git in einem temporären Repository mit festem Committer-Datum; Antwortmodell mit seinen Invarianten; falsche Methoden; Aufruf ohne Shell mit fester Argumentliste, bei beiden Unterprozessen) und die Wiederherstellung von Englisch und Deutsch nach echten Stop-/Startzyklen separater Backendprozesse mit derselben temporären INI und SQLite-Datei ab. Ruff prüft Programmierstil und typische Fehler; `ruff format --check` meldet Formatabweichungen, ohne Dateien zu ändern. mypy prüft die Typen im strengen Modus.

Die Prüfung der Python-Abhängigkeiten auf bekannte Sicherheitslücken erfolgt mit `pip-audit`, das über `uvx` ohne Installation in die Projektumgebung ausgeführt wird. Die Anforderungsliste wird aus der Lockdatei erzeugt:

```sh
AUDIT_REQUIREMENTS="$(mktemp)"
uv export --frozen --no-hashes --no-emit-project -o "$AUDIT_REQUIREMENTS"
uvx pip-audit -r "$AUDIT_REQUIREMENTS" --no-deps --disable-pip
rm "$AUDIT_REQUIREMENTS"
```

Die temporäre Anforderungsliste enthält auch die Entwicklungsgruppe und wird nicht im Repository abgelegt.

### 6.2 Frontend

Im Verzeichnis `components/pipwerk-studio/frontend`:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm audit
```

`npm run typecheck` führt den TypeScript-Compiler mit `strict` und ohne Ausgabe von Dateien aus. `npm test` führt die Vitest-Tests aus. Sie prüfen mit Testing Library das sichtbare Verhalten der Oberfläche: Produktname, leere Arbeitsfläche, Sprachwechsel einschließlich Fehlerfällen und Speichern per Mutation, Anzeige des Backendzustands, Anzeige des Stands (Deutsch und Englisch, Sprachwechsel, `null`, Fehler, ungültige Antwort einschließlich verletzter Invarianten, Position rechts neben dem Backend-Status), den Tooltip und die zugängliche Beschreibung (Deutsch und Englisch, Sprachwechsel, nur Commit ohne Datum, kein Tooltip bei `null`, Fehler und ungültiger Antwort, unmögliche Kalenderdaten und Uhrzeiten (31.02., 31.04., 29.02. im Nicht-Schaltjahr, 24:00, Sekunde 60, ungültiger Offset) sowie ein gültiger Schalttag, Umrechnung in die Ortszeit bei fest eingestellten Zeitzonen, Auffüllen mit Nullen, nicht fokussierbar) und Vollständigkeit der Übersetzungen. Die Anfragen an das Backend werden in diesen Tests durch festgelegte Antworten ersetzt. `npm audit` prüft die npm-Abhängigkeiten auf bekannte Sicherheitslücken.

### 6.3 Browser-End-to-End-Test

Die Testbrowser von Playwright werden einmalig im Verzeichnis `frontend` installiert:

```sh
npx playwright install chromium firefox webkit
```

Die für die Playwright-Browser erforderliche Testumgebung einschließlich benötigter Betriebssystemabhängigkeiten muss auf dem Entwicklungs- beziehungsweise Testsystem vorhanden sein. Die allgemeinen Systemanforderungen dafür sind in `docs/technical/development-test-security-rules.md` festgelegt.

Der Test wird mit folgendem Befehl ausgeführt:

```sh
npm run e2e
```

Playwright startet ein isoliertes Backend auf Port 18000 und Vite auf Port 15173. Andere Ports können über `PIPWERK_STUDIO_E2E_BACKEND_PORT` und `PIPWERK_STUDIO_E2E_FRONTEND_PORT` gewählt werden. `e2e/start-backend.mjs` erzeugt je Lauf ein temporäres Verzeichnis mit INI und SQLite-Datei, startet das Backend ausschließlich über die dokumentierte Option `-c` und entfernt das Verzeichnis, wenn Playwright das Backend beendet (`gracefulShutdown` mit SIGTERM). Es gibt keine zusätzliche Datenbank-Umgebungsvariable.

Der Test läuft in Chromium, Firefox und WebKit. Er prüft, dass die Seite ohne Fehlermeldungen im Browser erscheint, dass die leere Arbeitsfläche sichtbar ist, dass die Oberfläche eine erfolgreiche Antwort des echten Backends erhält und anzeigt, dass der Sprachwechsel die sichtbaren Texte umschaltet, dass die Fußzeile rechts neben dem Backend-Status den Stand zeigt (7 Hexadezimalzeichen, gleich den ersten 7 Zeichen von `git rev-parse HEAD` des Arbeitsbereichs, in dem der Test läuft; ohne Git-Arbeitsbereich „unbekannt“) und beim Sprachwechsel die Bezeichnung umschaltet, dass `title` und zugängliche Beschreibung der Standanzeige genau den vollständigen Commit aus `git rev-parse HEAD` und das Datum aus `git log -1 --format=%cI` in der Zeitzone des Testbrowsers enthalten (fest eingestellte `timezoneId`; der Erwartungswert wird im Test unabhängig vom Produktionscode berechnet) und beim Sprachwechsel umschalten, dass es ohne Git-Arbeitsbereich keinen Tooltip gibt (dieser Test wird übersprungen, wenn der Arbeitsbereich ein Git-Arbeitsbereich ist), und dass die gewählte Sprache nach einem Neuladen der Seite erhalten bleibt. Einen Backend-Neustart weist der Browsertest nicht nach; dieser wird im Backend-Komponententest durch echte Prozessneustarts nachgewiesen (Abschnitt 6.1).

## 7. Abhängigkeiten

Alle direkten und indirekten Abhängigkeiten sind in `backend/uv.lock` und `frontend/package-lock.json` festgeschrieben. Die direkten npm-Abhängigkeiten sind in `package.json` zusätzlich mit exakter Version angegeben.

Die Abhängigkeiten wurden am 2026-10-06 geprüft. Die Spalte „Veröffentlicht“ nennt das Datum der verwendeten Version und dient als Hinweis auf den Wartungszustand. `pip-audit` (Aufruf in Abschnitt 6.1) meldete für die festgeschriebenen Python-Abhängigkeiten keine bekannten Sicherheitslücken. `npm audit` meldete einen Befund mit hoher Schwere: `source-map-js` 1.2.1 (GHSA-68fv-2mgg-jv7q), indirekt über vite/postcss und jsdom. Betroffen sind nur Entwicklungsabhängigkeiten; `npm audit --omit=dev` meldet keine bekannten Sicherheitslücken. Der Befund besteht unverändert bereits im Stand von `main` und ist nicht Gegenstand von WO-2026-10-04-001.

### 7.1 Laufzeitabhängigkeiten

| Paket | Version | Lizenz | Veröffentlicht | Zweck | Kopplung |
| --- | --- | --- | --- | --- | --- |
| fastapi | 0.141.1 | MIT | 2026-07-29 | HTTP-Schnittstelle des Backends | nur in `app.py`; keine Fachlogik |
| uvicorn | 0.54.0 | BSD-3-Clause | 2026-09-25 | ASGI-Server zum Start des Backends | nur beim Start in `cli.py` verwendet |
| sqlalchemy | 2.1.3 | MIT | 2026-10-02 | konfigurierbare relationale Persistenz der Betriebskonfiguration (req-system-015) | nur in `storage.py` und `settings_service.py`; ORM-Klassen verlassen die Servicegrenze nicht und sind keine API-Modelle |
| pydantic | 2.13.5 | MIT | 2026-08-28 | Lese- und Schreibmodelle der Schnittstelle; indirekt über FastAPI | nur an der HTTP-Grenze |
| react, react-dom | 19.3.0 | MIT | 2026-09-09 | Browseroberfläche | Oberfläche |
| @xyflow/react (React Flow) | 12.12.0 | MIT | 2026-09-24 | Designer-Arbeitsfläche | nur in `DesignerCanvas.tsx` |
| i18next | 26.4.2 | MIT | 2026-09-03 | Übersetzung der Oberflächentexte | nur Darstellung |
| react-i18next | 17.0.15 | MIT | 2026-09-21 | Einbindung von i18next in React | nur Darstellung |
| @tanstack/react-query | 5.104.0 | MIT | 2026-09-26 | Abruf und Schreiben des Backendzustands | nur in `BackendStatus.tsx`, `RevisionDisplay.tsx`, `useStudioLanguage.ts` und `settingsApi.ts` |

### 7.2 Entwicklungs- und Prüfwerkzeuge

| Paket | Version | Lizenz | Veröffentlicht | Zweck |
| --- | --- | --- | --- | --- |
| hatchling | 1.32.4 | MIT | 2026-09-20 | Bau des Python-Pakets |
| pytest | 9.1.1 | MIT | 2026-06-19 | Backend-Tests |
| httpx2 | 2.13.1 | BSD-3-Clause | 2026-09-23 | HTTP-Client für den Testclient von FastAPI |
| ruff | 0.16.9 | MIT | 2026-09-24 | Python-Stil- und Fehlerprüfung |
| mypy | 2.3.1 | MIT | 2026-08-15 | Python-Typprüfung |
| vite | 8.3.1 | MIT | 2026-09-24 | Entwicklungsserver und Erzeugen der Oberflächendateien |
| @vitejs/plugin-react | 6.1.1 | MIT | 2026-08-28 | React-Unterstützung für Vite |
| typescript | 7.0.2 | Apache-2.0 | 2026-07-08 | TypeScript-Typprüfung |
| vitest | 5.0.2 | MIT | 2026-09-25 | Frontend-Tests |
| @testing-library/react, /dom, /user-event, /jest-dom | 16.3.3, 10.4.2, 14.6.7, 7.0.1 | MIT | 2026-08-09 bis 2026-09-13 | benutzernahe Prüfung der Oberfläche |
| jsdom | 30.1.1 | MIT | 2026-09-22 | nachgebildete Browserumgebung für Vitest |
| @playwright/test | 1.63.0 | Apache-2.0 | 2026-09-04 | Browser-End-to-End-Tests |
| @types/react, @types/react-dom, @types/node | 19.3.0, 19.3.0, 26.6.3 | MIT | – | Typdefinitionen für TypeScript |

Für das Backend-Testwerkzeug wird `httpx2` statt `httpx` verwendet, weil Starlette die Verwendung von `httpx` mit seinem Testclient als veraltet meldet.

## 8. Sicherheit

Backend und Entwicklungsserver sind im Entwicklungsbetrieb nur an die Adresse `127.0.0.1` gebunden. Das Backend enthält eine schreibende Funktion: das Speichern der Oberflächensprache. Es nimmt dafür nur die Werte `de` und `en` an; andere Werte, Typen und zusätzliche Felder werden abgelehnt. Es startet beim Erzeugen der Anwendung bis zu zwei Unterprozesse, `git rev-parse HEAD` und, nur bei gültigem Hash, `git log -1 --no-show-signature --format=%cI <hash>` (Abschnitt 2.6), jeweils mit fester Argumentliste, ohne Shell, ohne Eingaben von außen (der Hash stammt aus dem ersten Aufruf und wird zuvor auf 40 Hexadezimalzeichen geprüft) und mit Zeitbegrenzung. Es enthält keine ausführenden oder handelsbezogenen Funktionen und verwendet keine Zugangsdaten. Eine Authentifizierung ist in diesem Stand nicht eingerichtet; sie ist nicht Bestandteil von AP1 und von WO-2026-10-04-001.

Die Datenbank-URL der INI-Startkonfiguration kann Zugangsdaten enthalten. Die INI gehört deshalb in einen administrativ geschützten Ort und nicht in das Repository. Die Tests verwenden ausschließlich temporäre lokale SQLite-Dateien.

Die Oberfläche übernimmt Antworten des Backends nur, wenn sie genau dem erwarteten Inhalt entsprechen. Fehlermeldungen der Oberfläche enthalten keine technischen Details des Backends.

## 9. Bekannte Einschränkungen

Die folgenden Punkte sind bewusst noch nicht umgesetzt oder noch nicht festgelegt:

- Das Backend liefert die Oberflächendateien nicht selbst aus. Im Entwicklungsbetrieb laufen deshalb zwei Prozesse.
- Installation, Paketierung und Start außerhalb der Entwicklungsumgebung sind nicht festgelegt.
- Die öffentliche Web-API und ihre Versionierung sind nicht festgelegt.
- Eine Erkennung der Browsersprache gibt es nicht. Die Oberflächensprache gilt komponentenweit und nicht benutzerbezogen; Benutzerkonten sind nicht Bestandteil von WO-2026-10-04-001.
- Alembic wird nicht eingesetzt, da das Schema aus einer einzigen Tabelle mit einer Zeile besteht. Vor einer Schemaänderung ist eine versionierte Migration einzuführen.
- Der Browser-End-to-End-Test weist keinen Backend-Neustart nach. Die Wiederherstellung nach einem Neustart weist der Backend-Komponententest mit echten Prozessneustarts nach (Abschnitt 6.1).
- Der `npm audit`-Befund zu `source-map-js` (Abschnitt 7) ist nicht behoben.

## 10. Glossar

| Begriff | Bedeutung |
| --- | --- |
| ASGI-Server | Programm, das eine Python-Webanwendung ausführt und ihr die HTTP-Anfragen aus dem Netzwerk übergibt. |
| autoritativ | Maßgebliche Quelle; hier ist dies das Backend und nicht der Browser. |
| Backend | Der Teil einer Anwendung, der auf dem Rechner als eigener Prozess läuft und Anfragen der Oberfläche beantwortet. |
| Betriebskonfiguration | Im Speicher der Komponente abgelegte Einstellungen, die zur Laufzeit verwendet werden, zum Beispiel die Oberflächensprache. |
| CORS | Regeln, mit denen ein Server erlaubt, dass eine Webseite von einer anderen Adresse aus auf ihn zugreift. |
| Endpunkt | Eine Adresse der HTTP-Schnittstelle, die eine bestimmte Anfrage entgegennimmt. |
| End-to-End-Test | Ein Test, der die Anwendung in einem echten Browser bedient und dabei alle beteiligten Teile gemeinsam prüft. |
| Entwicklungsserver | Ein Programm, das die Oberfläche während der Entwicklung im Browser bereitstellt und Änderungen sofort sichtbar macht. |
| Lockdatei | Datei, in der die genauen Versionen aller installierten Pakete festgehalten sind, damit jede Installation dieselben Versionen erhält. |
| Oberfläche | Der im Browser angezeigte und bedienbare Teil von Pipwerk Studio. |
| SQLAlchemy-URL | Zeichenfolge, die Art und Adresse eines Datenbankspeichers beschreibt. |
| Startkonfiguration | Administrativ verwaltete INI-Datei mit den Angaben, die zum Start und zum Auffinden des Speichers nötig sind. |
| Übersetzungsschlüssel | Ein sprachneutraler Name für einen sichtbaren Text. Zu jedem Schlüssel gibt es einen Text je Sprache. |
| Virtuelle Umgebung | Ein eigenes Verzeichnis mit Python-Paketen für ein Projekt, getrennt von den Paketen des Betriebssystems. |
