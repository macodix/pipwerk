# Pipwerk Studio – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-06
- komponente: `pipwerk-studio`

## 1. Gegenstand

Dieses Dokument beschreibt den technischen Aufbau von Pipwerk Studio, die Einrichtung einer Entwicklungsumgebung, den Start im Entwicklungsbetrieb und die vorgeschriebenen Prüfungen.

Der beschriebene Stand ist das technische Grundgerüst aus dem Arbeitspaket AP1, erweitert um die dauerhafte Oberflächensprache (WO-2026-10-04-001). Pipwerk Studio zeigt eine leere Designer-Arbeitsfläche, kann die Oberflächensprache zwischen Deutsch und Englisch wechseln, speichert die gewählte Sprache dauerhaft im Backend und prüft, ob das Backend erreichbar ist. Fachliche Objekte, Strategien und Ausführung sind noch nicht enthalten.

## 2. Aufbau der Komponente

Pipwerk Studio liegt im Verzeichnis `components/pipwerk-studio/` und besteht aus zwei Teilen.

| Verzeichnis | Inhalt |
| --- | --- |
| `backend/` | Python-Paket `pipwerk_studio` mit der HTTP-Anwendung, den Backend-Tests und der Python-Lockdatei `uv.lock` |
| `frontend/` | Browseroberfläche mit React und TypeScript, Vite-Konfiguration, Frontend-Tests, Playwright-Tests und der npm-Lockdatei `package-lock.json` |

### 2.1 Backend, Konfiguration und Persistenz

`backend/src/pipwerk_studio/app.py` erzeugt die FastAPI-Anwendung. `cli.py` ist der eigenständige Startpunkt, `config.py` liest die INI-Startkonfiguration, `settings_service.py` bildet die anwendungsseitige Servicegrenze und `storage.py` kapselt SQLAlchemy und das relationale Speichermodell.

Die Oberflächensprache ist eine einzige betriebliche Einstellung der Komponente, nicht benutzerbezogen und kein Bestandteil von Strategiedaten. Der Browser ist nicht autoritativ und verwendet dafür weder Local Storage noch Session Storage noch Cookies. Ohne gespeicherten Wert liefert der Service Deutsch (`de`). Die Datenbank enthält höchstens einen zentralen Datensatz in `studio_settings`.

SQLAlchemy bleibt hinter der Service-/Infrastrukturgrenze; ORM-Objekte werden nicht als API-Modelle verwendet. Das kleine initiale Schema wird beim Start angelegt. Da für dieses neue, einzeilige Schema noch keine Schemaänderung oder Bestandsmigration existiert, wird Alembic derzeit nicht eingesetzt. Vor einer späteren Schemaänderung ist eine versionierte Migration einzuführen.

### 2.2 Zweistufige Konfiguration

Die INI-Startkonfiguration enthält ausschließlich die SQLAlchemy-Datenbank-URL:

```ini
[database]
url = sqlite:///./pipwerk-studio.db
```

Ein vollständiges Beispiel liegt in `backend/pipwerk-studio.example.ini`. Die Sprache steht ausdrücklich nicht in der INI, sondern im konfigurierten Speicher.

Eine mit `-c <PATH>` angegebene Datei hat höchste Priorität. Ohne `-c` wird genau die erste vorhandene Datei namens `pipwerk-studio.ini` in dieser Reihenfolge verwendet; Inhalte werden nicht zusammengeführt:

1. `$HOME/pipwerk/etc/pipwerk-studio.ini`
2. `$HOME/.config/pipwerk/pipwerk-studio.ini`
3. `/etc/pipwerk/pipwerk-studio.ini`

Unter Windows gelten entsprechend `%USERPROFILE%\pipwerk\etc`, `%APPDATA%\pipwerk` und `%PROGRAMDATA%\pipwerk`. Ist ohne explizite Datei an keinem Suchort eine Konfiguration vorhanden, wird ausschließlich für den Entwicklungsbetrieb `sqlite:///./pipwerk-studio.db` verwendet. Eine explizit angegebene fehlende oder unvollständige Datei beendet den Start mit einer Fehlermeldung.

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
| `src/i18n.ts` | Einrichtung von i18next mit den unterstützten Sprachen |
| `src/locales/de.json`, `src/locales/en.json` | deutsche und englische Oberflächentexte |
| `src/styles.css` | Gestaltung der Oberfläche |

Die Arbeitsfläche enthält keine Knoten und keine Verbindungen. React-Flow-Objekte werden in diesem Stand weder erzeugt noch gespeichert.

### 2.4 Mehrsprachigkeit

Alle sichtbaren Texte der Oberfläche werden über Übersetzungsschlüssel aus den Dateien in `src/locales/` geladen. Beide Dateien müssen dieselben Schlüssel enthalten; ein Frontend-Test prüft das.

Der Produktname „Pipwerk Studio“ wird nicht übersetzt. Die Sprachnamen im Auswahlfeld werden in ihrer eigenen Sprache angezeigt, also „Deutsch“ und „English“.

Die Oberflächensprache wird vom Backend gelesen und dort dauerhaft gespeichert (Abschnitt 2.1). Ist noch nichts gespeichert, ist Deutsch eingestellt. Bis die erste Antwort des Backends vorliegt, ist die Auswahl deaktiviert. Eine Auswahl wird sofort sichtbar und per Mutation gespeichert. Nach Erfolg wird der Query-Cache mit der Antwort des Backends abgeglichen. Bei einem Fehler bleibt beziehungsweise wird die zuletzt vom Backend bestätigte Sprache aktiv und eine Meldung erscheint. Der Browser speichert die Sprache weder in Local Storage noch in Session Storage noch in Cookies.

### 2.5 Verbindung zwischen Oberfläche und Backend

Die Oberfläche ruft beim Laden die Verbindungsprüfung des Backends mit TanStack Query ab. Sie prüft, ob die Antwort genau den erwarteten Inhalt hat. Das Ergebnis wird in der Fußzeile angezeigt. Bei einem HTTP-Fehler, einem Netzwerkfehler oder einer unerwarteten Antwort zeigt die Oberfläche an, dass das Backend nicht erreichbar ist.

Im Entwicklungsbetrieb ruft der Browser nur den Vite-Entwicklungsserver auf. Vite leitet alle Anfragen unter `/api` an das Backend weiter. Browser und Backend verwenden dadurch aus Sicht des Browsers dieselbe Adresse. Eine CORS-Freigabe im Backend ist deshalb nicht nötig und nicht eingerichtet.

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

Das Backend wird im Verzeichnis `components/pipwerk-studio/backend` gestartet. Ohne `-c` wird einer der in Abschnitt 2.2 beschriebenen Suchpfade verwendet:

```sh
cp pipwerk-studio.example.ini pipwerk-studio.ini
uv run --frozen pipwerk-studio -c pipwerk-studio.ini --host 127.0.0.1 --port 8000
```

Die Oberfläche wird im Verzeichnis `components/pipwerk-studio/frontend` gestartet:

```sh
npm run dev
```

Danach ist Pipwerk Studio im Browser unter `http://127.0.0.1:5173/` erreichbar.

Vite leitet Anfragen unter `/api` standardmäßig an `http://127.0.0.1:8000` weiter. Läuft das Backend unter einer anderen Adresse, wird diese beim Start der Oberfläche in der Umgebungsvariable `PIPWERK_STUDIO_BACKEND_URL` angegeben:

```sh
PIPWERK_STUDIO_BACKEND_URL=http://127.0.0.1:8100 npm run dev
```

Beide Server nehmen standardmäßig nur Verbindungen vom eigenen Rechner an. Der Vite-Entwicklungsserver ist nur für die Entwicklung bestimmt und keine Sicherheitsgrenze.

### 4.3 Erzeugen der Oberflächendateien

Der Befehl `npm run build` im Verzeichnis `frontend` prüft zuerst die Typen und schreibt anschließend die auslieferbaren Oberflächendateien nach `frontend/dist`. Dieses Verzeichnis wird nicht versioniert. Ein Start, bei dem das Backend diese Dateien selbst ausliefert, ist noch nicht vorhanden.

## 5. HTTP-Schnittstelle

| Methode | Pfad | Erfolgsantwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/health` | `{"status":"ok"}` | technische Verbindungsprüfung |
| `GET` | `/api/studio/settings/language` | `{"language":"de"}` oder `{"language":"en"}` | autoritative Sprache lesen |
| `PUT` | `/api/studio/settings/language` | `{"language":"de"}` oder `{"language":"en"}` | Sprache zentral speichern |

Der PUT-Body enthält ausschließlich `{"language":"de"}` oder `{"language":"en"}`. Andere Werte, Typen und zusätzliche Felder werden mit HTTP 422 abgelehnt. Getrennte strikte Pydantic-Lese- und Schreibmodelle bilden die API-Grenze. Das Frontend akzeptiert seinerseits nur eine Antwort mit genau einem gültigen `language`-Feld.

Diese Endpunkte sind interne Verbindungen innerhalb von Pipwerk Studio und noch keine öffentliche versionierte API unter `contracts/`. FastAPIs OpenAPI-Darstellung ist im Entwicklungsbetrieb unter `/docs` beziehungsweise `/openapi.json` verfügbar.

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

pytest prüft die HTTP-Anwendung ohne gestarteten Server mit dem Testclient von FastAPI sowie die Konfiguration. Die Tests decken Konfigurationspriorität und Fehlerfälle, API-Validierung, Standardwert, Umschalten, Trennung verschiedener Datenbanken und die Wiederherstellung von Englisch und Deutsch nach echten Stop-/Startzyklen separater Backendprozesse mit derselben temporären INI und SQLite-Datei ab. Ruff prüft Programmierstil und typische Fehler; `ruff format --check` meldet Formatabweichungen, ohne Dateien zu ändern. mypy prüft die Typen im strengen Modus.

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

`npm run typecheck` führt den TypeScript-Compiler mit `strict` und ohne Ausgabe von Dateien aus. `npm test` führt die Vitest-Tests aus. Sie prüfen mit Testing Library das sichtbare Verhalten der Oberfläche: Produktname, leere Arbeitsfläche, Sprachwechsel einschließlich Fehlerfällen und Speichern per Mutation, Anzeige des Backendzustands und Vollständigkeit der Übersetzungen. Die Anfragen an das Backend werden in diesen Tests durch festgelegte Antworten ersetzt. `npm audit` prüft die npm-Abhängigkeiten auf bekannte Sicherheitslücken.

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

Playwright startet ein isoliertes Backend auf Port 18000 und Vite auf Port 15173. Andere Ports können über `PIPWERK_STUDIO_E2E_BACKEND_PORT` und `PIPWERK_STUDIO_E2E_FRONTEND_PORT` gewählt werden. `e2e/write-backend-config.mjs` erzeugt je Lauf ein temporäres Verzeichnis mit INI und SQLite-Datei; `e2e/start-backend.sh` startet ausschließlich über die dokumentierte Option `-c`. Es gibt keine zusätzliche Datenbank-Umgebungsvariable.

Die E2E-Tests prüfen echte Browserabläufe einschließlich Sprachwechsel und Wiederherstellung nach einem Seiten-Reload. Sie behaupten keinen Backendneustart; dieser wird im Backend-Komponententest durch echte Prozessneustarts nachgewiesen. Der Test läuft in Chromium, Firefox und WebKit.

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
| @tanstack/react-query | 5.104.0 | MIT | 2026-09-26 | Abruf und Schreiben des Backendzustands | nur in `BackendStatus.tsx`, `useStudioLanguage.ts` und `settingsApi.ts` |

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

Backend und Entwicklungsserver sind im Entwicklungsbetrieb nur an die Adresse `127.0.0.1` gebunden. Das Backend enthält eine schreibende Funktion: das Speichern der Oberflächensprache. Es nimmt dafür nur die Werte `de` und `en` an; andere Werte, Typen und zusätzliche Felder werden abgelehnt. Es enthält keine ausführenden oder handelsbezogenen Funktionen und verwendet keine Zugangsdaten. Eine Authentifizierung ist in diesem Stand nicht eingerichtet; sie ist nicht Bestandteil von AP1 und von WO-2026-10-04-001.

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
