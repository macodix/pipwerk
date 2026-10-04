# Pipwerk Studio – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-04
- komponente: `pipwerk-studio`

## 1. Gegenstand

Dieses Dokument beschreibt den technischen Aufbau von Pipwerk Studio, die Entwicklungsumgebung, den Start und die vorgeschriebenen Prüfungen. Pipwerk Studio zeigt derzeit eine leere Designer-Arbeitsfläche, unterstützt Deutsch und Englisch, speichert die komponentenweit gewählte Oberflächensprache dauerhaft und prüft die Verbindung zwischen Oberfläche und Backend. Fachliche Strategieobjekte und Strategieausführung sind noch nicht enthalten.

## 2. Aufbau der Komponente

Pipwerk Studio liegt unter `components/pipwerk-studio/` und besteht aus dem Python-Backend in `backend/` sowie der React-/TypeScript-Oberfläche in `frontend/`.

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

### 2.3 Oberfläche und Serverzustand

Die wichtigsten Frontend-Dateien sind:

| Datei | Aufgabe |
| --- | --- |
| `src/main.tsx` | bindet i18next, TanStack Query und React ein |
| `src/App.tsx` | Seitenaufbau und `lang`-Attribut des Dokuments |
| `src/DesignerCanvas.tsx` | leere React-Flow-Arbeitsfläche |
| `src/LanguageSelect.tsx` | Sprachauswahl und sichtbarer Fehlerzustand |
| `src/useStudioLanguage.ts` | Lesen und Schreiben des autoritativen Serverzustands mit TanStack Query |
| `src/settingsApi.ts` | streng geprüfte Antworten der Spracheinstellungs-API |
| `src/BackendStatus.tsx`, `src/api.ts` | Verbindungsprüfung |
| `src/i18n.ts`, `src/locales/*.json` | Übersetzungen für Deutsch und Englisch |

Beim Laden wird die Sprache vom Backend gelesen. Bis die erste Antwort vorliegt, ist die Auswahl deaktiviert. Eine Auswahl wird sofort sichtbar und per Mutation gespeichert. Nach Erfolg wird der Query-Cache mit der Backendantwort synchronisiert. Bei einem Fehler bleibt beziehungsweise wird die zuletzt vom Backend bestätigte Sprache wieder aktiv und eine verständliche Meldung erscheint. Der Sprachwechsel berührt keinen anderen Zustand.

Vite leitet im Entwicklungsbetrieb `/api` an das Backend weiter. Daher ist keine CORS-Freigabe eingerichtet.

## 3. Voraussetzungen und Einrichtung

| Programm | Mindestversion |
| --- | --- |
| Python | 3.14 |
| uv | Lockdatei-kompatible aktuelle Version |
| Node.js | 24 |
| npm | mit Node.js bereitgestellt |

```sh
cd components/pipwerk-studio/backend
uv sync --frozen

cd ../frontend
npm ci
```

Python-Pakete liegen isoliert unter `backend/.venv`, Node-Pakete unter `frontend/node_modules`.

## 4. Start im Entwicklungsbetrieb

Backend mit expliziter Beispielkonfiguration:

```sh
cd components/pipwerk-studio/backend
cp pipwerk-studio.example.ini pipwerk-studio.ini
uv run --frozen pipwerk-studio -c pipwerk-studio.ini --host 127.0.0.1 --port 8000
```

Alternativ kann `-c` entfallen und einer der dokumentierten Suchpfade verwendet werden. Das Frontend läuft in einem zweiten Terminal:

```sh
cd components/pipwerk-studio/frontend
npm run dev
```

Danach ist die Oberfläche unter `http://127.0.0.1:5173/` erreichbar. Für ein Backend auf einer anderen Entwicklungsadresse:

```sh
PIPWERK_STUDIO_BACKEND_URL=http://127.0.0.1:8100 npm run dev
```

Beide Server binden standardmäßig nur an `127.0.0.1`. Der Vite-Server ist kein Produktionsserver. `npm run build` schreibt die auslieferbaren Dateien nach `frontend/dist`; das Backend liefert sie noch nicht selbst aus.

## 5. Interne HTTP-Schnittstellen

| Methode | Pfad | Erfolgsantwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/health` | `{"status":"ok"}` | technische Verbindungsprüfung |
| `GET` | `/api/studio/settings/language` | `{"language":"de"}` oder `{"language":"en"}` | autoritative Sprache lesen |
| `PUT` | `/api/studio/settings/language` | `{"language":"de"}` oder `{"language":"en"}` | Sprache zentral speichern |

Der PUT-Body enthält ausschließlich `{"language":"de"}` oder `{"language":"en"}`. Andere Werte, Typen und zusätzliche Felder werden mit HTTP 422 abgelehnt. Getrennte strikte Pydantic-Lese- und Schreibmodelle bilden die API-Grenze. Das Frontend akzeptiert seinerseits nur eine Antwort mit genau einem gültigen `language`-Feld.

Diese Endpunkte sind interne Verbindungen innerhalb von Pipwerk Studio und noch keine öffentliche versionierte API unter `contracts/`. FastAPIs OpenAPI-Darstellung ist im Entwicklungsbetrieb unter `/docs` beziehungsweise `/openapi.json` verfügbar.

## 6. Prüfungen

### 6.1 Backend

Im Verzeichnis `backend/`:

```sh
uv sync --frozen
uv run --frozen pytest
uv run --frozen ruff check
uv run --frozen ruff format --check
uv run --frozen mypy
```

Die Tests prüfen Konfigurationspriorität und Fehlerfälle, API-Validierung, Standardwert, Umschalten, Trennung verschiedener Datenbanken und die Wiederherstellung von Englisch sowie Deutsch nach echten Stop-/Startzyklen separater Backendprozesse mit derselben temporären INI und SQLite-Datei.

### 6.2 Frontend

Im Verzeichnis `frontend/`:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm audit
```

Vitest/Testing Library prüfen sichtbares Verhalten, Fehlerfälle, Mutationen, Übersetzungsvollständigkeit und Backendstatus.

### 6.3 Browser-End-to-End

Einmalig werden die installierbaren Playwright-Browser eingerichtet:

```sh
npx playwright install chromium firefox webkit
```

Dann:

```sh
npm run e2e
```

Playwright startet ein isoliertes Backend auf Port 18000 und Vite auf Port 15173. Andere Ports können über `PIPWERK_STUDIO_E2E_BACKEND_PORT` und `PIPWERK_STUDIO_E2E_FRONTEND_PORT` gewählt werden. `e2e/write-backend-config.mjs` erzeugt je Lauf ein temporäres Verzeichnis mit INI und SQLite-Datei; `e2e/start-backend.sh` startet ausschließlich über die dokumentierte Option `-c`. Es gibt keine zusätzliche Datenbank-Umgebungsvariable.

Die E2E-Tests prüfen echte Browserabläufe einschließlich Sprachwechsel und Wiederherstellung nach einem Seiten-Reload. Sie behaupten keinen Backendneustart; dieser wird im Backend-Komponententest durch echte Prozessneustarts nachgewiesen. Vorgesehen sind Chromium, Firefox und WebKit, soweit Browser und Betriebssystembibliotheken installiert sind.

## 7. Abhängigkeiten und Sicherheit

Direkte und indirekte Versionen sind in `uv.lock` und `package-lock.json` reproduzierbar festgelegt. SQLAlchemy dient ausschließlich der konfigurierbaren Persistenz und bleibt hinter der Servicegrenze. FastAPI/Pydantic bilden die Transportgrenze; TanStack Query verwaltet lediglich asynchronen Serverzustand; i18next übersetzt nur Darstellungstexte.

Backend und Entwicklungsserver sind lokal gebunden. Es werden keine Zugangsdaten benötigt oder gespeichert. Die Sprache ist nicht handelsrelevant, dennoch werden Eingaben und Antworten strikt validiert. Datenbank-URLs können Zugangsdaten enthalten und gehören deshalb in administrativ geschützte INI-Dateien, nicht in das Repository. Tests verwenden ausschließlich temporäre lokale SQLite-Dateien und keine externen oder produktiven Dienste.

Die Sicherheitsprüfung umfasst `npm audit`. Eine Python-Abhängigkeitsprüfung wird mit `pip-audit` ausgeführt, sofern das Werkzeug in der Umgebung vorhanden ist; fehlende Verfügbarkeit wird im Prüfnachweis ausgewiesen.

## 8. Bekannte Einschränkungen

- Strategien können noch nicht angelegt, gespeichert oder ausgeführt werden.
- Das Backend liefert das gebaute Frontend nicht selbst aus; im Entwicklungsbetrieb laufen zwei Prozesse.
- Installation und Paketierung für Anwendersysteme sind noch nicht festgelegt.
- Die interne API ist nicht als öffentliche, versionierte Web-API festgelegt.
- Die Einstellung ist bewusst komponentenweit und nicht benutzerbezogen; Benutzerkonten sind nicht Bestandteil dieses Auftrags.

## 9. Glossar

| Begriff | Bedeutung |
| --- | --- |
| Startkonfiguration | administrativ verwaltete INI mit Informationen zum Start und Auffinden des Speichers |
| Betriebskonfiguration | im Komponentenspeicher abgelegte, zur Laufzeit verwendete Einstellungen wie die Sprache |
| autoritativ | maßgebliche Quelle; hier ist dies das Backend und nicht der Browsercache |
| SQLAlchemy-URL | Zeichenfolge, die Typ und Adresse eines Datenbankspeichers beschreibt |
| End-to-End-Test | Browserprüfung der gemeinsam laufenden Oberfläche und des Backends |
| Lockdatei | festgelegte Versionen aller Abhängigkeiten für reproduzierbare Installation |
