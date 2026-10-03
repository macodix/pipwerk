# Pipwerk Studio – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-01
- komponente: `pipwerk-studio`

## 1. Gegenstand

Dieses Dokument beschreibt den technischen Aufbau von Pipwerk Studio, die Einrichtung einer Entwicklungsumgebung, den Start im Entwicklungsbetrieb und die vorgeschriebenen Prüfungen.

Der beschriebene Stand ist das technische Grundgerüst aus dem Arbeitspaket AP1. Pipwerk Studio zeigt eine leere Designer-Arbeitsfläche, kann die Oberflächensprache zwischen Deutsch und Englisch wechseln, prüft, ob das Backend erreichbar ist, und zeigt Name und Version der Anwendung in der Fußzeile an. Fachliche Objekte, Strategien, Speicherung und Ausführung sind noch nicht enthalten.

## 2. Aufbau der Komponente

Pipwerk Studio liegt im Verzeichnis `components/pipwerk-studio/` und besteht aus zwei Teilen.

| Verzeichnis | Inhalt |
| --- | --- |
| `backend/` | Python-Paket `pipwerk_studio` mit der HTTP-Anwendung, den Backend-Tests und der Python-Lockdatei `uv.lock` |
| `frontend/` | Browseroberfläche mit React und TypeScript, Vite-Konfiguration, Frontend-Tests, Playwright-Tests und der npm-Lockdatei `package-lock.json` |

### 2.1 Backend

Das Backend ist eine FastAPI-Anwendung. Die Funktion `create_app()` in `backend/src/pipwerk_studio/app.py` erzeugt die Anwendung. Sie wird mit dem ASGI-Server Uvicorn gestartet.

Das Backend enthält derzeit keine Fachlogik. Es stellt ausschließlich die in Abschnitt 5 beschriebenen technischen Endpunkte bereit: die Verbindungsprüfung und die Anwendungsinformation.

Die Version des Backends wird ausschließlich in `backend/pyproject.toml` im Feld `project.version` gepflegt. Zur Laufzeit liest `app.py` sie über die Metadaten des installierten Pakets (`importlib.metadata.version`). Dadurch gibt es keine zweite Versionsangabe im Programmcode. Fehlen die Paketmetadaten, meldet das Backend die Ersatzangabe `0+unknown`.

### 2.2 Oberfläche

Die Oberfläche ist eine React-Anwendung in TypeScript. Vite dient im Entwicklungsbetrieb als Entwicklungsserver und erzeugt bei Bedarf die auslieferbaren Dateien.

Die Oberfläche besteht aus folgenden Bestandteilen:

| Datei | Aufgabe |
| --- | --- |
| `src/main.tsx` | Startpunkt; bindet Übersetzung, TanStack Query und die Anwendung ein |
| `src/App.tsx` | Seitenaufbau aus Kopfzeile, Arbeitsfläche und Fußzeile; setzt das Attribut `lang` des Dokuments auf die gewählte Sprache |
| `src/DesignerCanvas.tsx` | leere Designer-Arbeitsfläche auf Grundlage von React Flow |
| `src/LanguageSelect.tsx` | Auswahlfeld für die Oberflächensprache |
| `src/BackendStatus.tsx` | Anzeige, ob das Backend erreichbar ist |
| `src/ApplicationVersion.tsx` | Anzeige von Name und Version der Anwendung in der Fußzeile |
| `src/api.ts` | Abruf und Prüfung der Antworten der Verbindungsprüfung und der Anwendungsinformation |
| `src/i18n.ts` | Einrichtung von i18next mit den unterstützten Sprachen |
| `src/locales/de.json`, `src/locales/en.json` | deutsche und englische Oberflächentexte |
| `src/styles.css` | Gestaltung der Oberfläche |

Die Arbeitsfläche enthält keine Knoten und keine Verbindungen. React-Flow-Objekte werden in diesem Stand weder erzeugt noch gespeichert.

### 2.3 Mehrsprachigkeit

Alle sichtbaren Texte der Oberfläche werden über Übersetzungsschlüssel aus den Dateien in `src/locales/` geladen. Beide Dateien müssen dieselben Schlüssel enthalten; ein Frontend-Test prüft das.

Der Produktname „Pipwerk Studio“ wird nicht übersetzt. Die Sprachnamen im Auswahlfeld werden in ihrer eigenen Sprache angezeigt, also „Deutsch“ und „English“.

Beim Start ist Deutsch eingestellt. Die gewählte Sprache wird nicht gespeichert und gilt nur bis zum Neuladen der Seite.

### 2.4 Verbindung zwischen Oberfläche und Backend

Die Oberfläche ruft beim Laden die Verbindungsprüfung des Backends mit TanStack Query ab. Sie prüft, ob die Antwort genau den erwarteten Inhalt hat. Das Ergebnis wird in der Fußzeile angezeigt. Bei einem HTTP-Fehler, einem Netzwerkfehler oder einer unerwarteten Antwort zeigt die Oberfläche an, dass das Backend nicht erreichbar ist.

Ebenfalls beim Laden ruft die Oberfläche die Anwendungsinformation ab und zeigt Name und Version in der Fußzeile an. Name und Version stammen vollständig aus der Antwort des Backends und werden nicht übersetzt; übersetzt wird nur der umgebende Text. Solange die Anfrage läuft oder wenn sie fehlschlägt, bleibt die Fußzeile ohne Versionsangabe. Die übrige Oberfläche bleibt in diesem Fall unverändert benutzbar.

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

Das Backend wird im Verzeichnis `components/pipwerk-studio/backend` gestartet:

```sh
uv run --frozen uvicorn --factory pipwerk_studio.app:create_app --host 127.0.0.1 --port 8000
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

Das Backend stellt derzeit zwei Endpunkte bereit.

| Methode | Pfad | Antwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/health` | HTTP 200 mit `{"status": "ok"}` | technische Prüfung, ob die Oberfläche ihr Backend erreicht |
| `GET` | `/api/info` | HTTP 200 mit `{"name": "Pipwerk Studio", "version": "<Version>"}` | Name und Version der laufenden Anwendung für die Anzeige in der Fußzeile |

Andere Methoden auf diesen Pfaden werden mit HTTP 405 abgelehnt. Die Antworten werden mit den Pydantic-Modellen `HealthStatus` und `ApplicationInfo` erzeugt, die keine zusätzlichen Felder zulassen.

Die Version in `/api/info` ist die Version des Backend-Pakets aus `backend/pyproject.toml`. Der Endpunkt gibt keine weiteren Systemdetails preis.

Beide Endpunkte sind interne Verbindungen zwischen Oberfläche und Backend. Sie sind kein Bestandteil der öffentlichen Web-API und kein versionierter Vertrag unter `contracts/`. Die von FastAPI erzeugte Schnittstellenbeschreibung ist im Entwicklungsbetrieb unter `http://127.0.0.1:8000/docs` und `http://127.0.0.1:8000/openapi.json` abrufbar.

## 6. Prüfungen

Ein Pull Request ist nur abnahmefähig, wenn alle folgenden Prüfungen bestehen.

### 6.1 Backend

Im Verzeichnis `components/pipwerk-studio/backend`:

```sh
uv run --frozen pytest
uv run --frozen ruff check
uv run --frozen ruff format --check
uv run --frozen mypy
```

pytest prüft die HTTP-Anwendung ohne gestarteten Server mit dem Testclient von FastAPI. Ruff prüft Programmierstil und typische Fehler; `ruff format --check` meldet Formatabweichungen, ohne Dateien zu ändern. mypy prüft die Typen im strengen Modus.

### 6.2 Frontend

Im Verzeichnis `components/pipwerk-studio/frontend`:

```sh
npm run typecheck
npm test
```

`npm run typecheck` führt den TypeScript-Compiler mit `strict` und ohne Ausgabe von Dateien aus. `npm test` führt die Vitest-Tests aus. Sie prüfen mit Testing Library das sichtbare Verhalten der Oberfläche: Produktname, leere Arbeitsfläche, Sprachwechsel, Anzeige des Backendzustands, Anzeige von Name und Version in der Fußzeile in beiden Sprachen, die weiterhin benutzbare Oberfläche ohne erreichbares Backend und Vollständigkeit der Übersetzungen. Die Anfragen an das Backend werden in diesen Tests durch festgelegte Antworten ersetzt.

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

Playwright startet dafür selbst ein Backend auf Port 18000 und eine Oberfläche auf Port 15173. Die Ports können mit den Umgebungsvariablen `PIPWERK_STUDIO_E2E_BACKEND_PORT` und `PIPWERK_STUDIO_E2E_FRONTEND_PORT` geändert werden. Der Test läuft in Chromium, Firefox und WebKit. Er prüft, dass die Seite ohne Fehlermeldungen im Browser erscheint, dass die leere Arbeitsfläche sichtbar ist, dass die Oberfläche eine erfolgreiche Antwort des echten Backends erhält und anzeigt, dass die Fußzeile Name und Version des echten Backends zeigt und dass der Sprachwechsel die sichtbaren Texte umschaltet.

## 7. Abhängigkeiten

Alle direkten und indirekten Abhängigkeiten sind in `backend/uv.lock` und `frontend/package-lock.json` festgeschrieben. Die direkten npm-Abhängigkeiten sind in `package.json` zusätzlich mit exakter Version angegeben.

Die Abhängigkeiten wurden am 2026-09-27 geprüft. Die Spalte „Veröffentlicht“ nennt das Datum der verwendeten Version und dient als Hinweis auf den Wartungszustand. `npm audit` meldete für die npm-Abhängigkeiten keine bekannten Sicherheitslücken. `pip-audit` meldete für die festgeschriebenen Python-Abhängigkeiten keine bekannten Sicherheitslücken.

### 7.1 Laufzeitabhängigkeiten

| Paket | Version | Lizenz | Veröffentlicht | Zweck | Kopplung |
| --- | --- | --- | --- | --- | --- |
| fastapi | 0.141.1 | MIT | 2026-07-29 | HTTP-Schnittstelle des Backends | nur in `app.py`; keine Fachlogik |
| uvicorn | 0.54.0 | BSD-3-Clause | 2026-09-25 | ASGI-Server zum Start des Backends | nur beim Start verwendet |
| pydantic | 2.13.5 | MIT | 2026-08-28 | Antwortmodell der Schnittstelle; indirekt über FastAPI | nur an der HTTP-Grenze |
| react, react-dom | 19.3.0 | MIT | 2026-09-09 | Browseroberfläche | Oberfläche |
| @xyflow/react (React Flow) | 12.12.0 | MIT | 2026-09-24 | Designer-Arbeitsfläche | nur in `DesignerCanvas.tsx` |
| i18next | 26.4.2 | MIT | 2026-09-03 | Übersetzung der Oberflächentexte | nur Darstellung |
| react-i18next | 17.0.15 | MIT | 2026-09-21 | Einbindung von i18next in React | nur Darstellung |
| @tanstack/react-query | 5.104.0 | MIT | 2026-09-26 | Abruf des Backendzustands | nur in `BackendStatus.tsx` |

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

Backend und Entwicklungsserver sind im Entwicklungsbetrieb nur an die Adresse `127.0.0.1` gebunden. Das Backend enthält keine schreibenden, ausführenden oder handelsbezogenen Funktionen. Es verarbeitet keine Eingaben von außen, speichert keine Daten und verwendet keine Zugangsdaten. Eine Authentifizierung ist deshalb in diesem Stand nicht eingerichtet; sie ist nicht Bestandteil von AP1.

Die Oberfläche übernimmt die Antwort des Backends nur, wenn sie genau dem erwarteten Inhalt entspricht. Fehlermeldungen der Oberfläche enthalten keine technischen Details des Backends.

## 9. Bekannte Einschränkungen

Die folgenden Punkte sind im Stand AP1 bewusst noch nicht umgesetzt oder noch nicht festgelegt:

- Es gibt keine INI-Startkonfiguration und keinen Aufrufparameter `-c <PATH>`. Adresse und Port werden beim Start direkt angegeben.
- Das Backend liefert die Oberflächendateien nicht selbst aus. Im Entwicklungsbetrieb laufen deshalb zwei Prozesse.
- Installation, Paketierung und Start außerhalb der Entwicklungsumgebung sind nicht festgelegt.
- Die öffentliche Web-API und ihre Versionierung sind nicht festgelegt.
- Die voreingestellte Sprache beim Start ist Deutsch. Eine Erkennung der Browsersprache und eine Speicherung der gewählten Sprache sind nicht vorhanden.

## 10. Glossar

| Begriff | Bedeutung |
| --- | --- |
| ASGI-Server | Programm, das eine Python-Webanwendung ausführt und ihr die HTTP-Anfragen aus dem Netzwerk übergibt. |
| Backend | Der Teil einer Anwendung, der auf dem Rechner als eigener Prozess läuft und Anfragen der Oberfläche beantwortet. |
| CORS | Regeln, mit denen ein Server erlaubt, dass eine Webseite von einer anderen Adresse aus auf ihn zugreift. |
| Endpunkt | Eine Adresse der HTTP-Schnittstelle, die eine bestimmte Anfrage entgegennimmt. |
| End-to-End-Test | Ein Test, der die Anwendung in einem echten Browser bedient und dabei alle beteiligten Teile gemeinsam prüft. |
| Entwicklungsserver | Ein Programm, das die Oberfläche während der Entwicklung im Browser bereitstellt und Änderungen sofort sichtbar macht. |
| Lockdatei | Datei, in der die genauen Versionen aller installierten Pakete festgehalten sind, damit jede Installation dieselben Versionen erhält. |
| Oberfläche | Der im Browser angezeigte und bedienbare Teil von Pipwerk Studio. |
| Übersetzungsschlüssel | Ein sprachneutraler Name für einen sichtbaren Text. Zu jedem Schlüssel gibt es einen Text je Sprache. |
| Virtuelle Umgebung | Ein eigenes Verzeichnis mit Python-Paketen für ein Projekt, getrennt von den Paketen des Betriebssystems. |
