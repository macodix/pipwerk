# pipwerk replay – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-21
- komponente: `pipwerk-replay`
- vorhaben: `backtest`, Arbeitspaket `wp02`, Auftrag 01

## 1. Gegenstand

Dieses Dokument beschreibt den technischen Aufbau von pipwerk replay (dem Strategietester), die Einrichtung einer Entwicklungsumgebung, den Start im Entwicklungsbetrieb und als Testumgebung und die Prüfungen. Grundlage ist die Spezifikation des Vorhabens `backtest` (E3, E6, 6.2, 7, 11); Aufbau, Startkonfiguration, Alembic und die Prüfung des Kopfs `Host` folgen pipwerk Studio ([technische Dokumentation pipwerk Studio](pipwerk-studio.md), Abschnitte 2.1, 2.2 und 2.10).

Der beschriebene Stand ist das Gerüst aus Auftrag 01: das Backend startet aus der Startkonfiguration, legt seine Datenbank mit Alembic an, prüft den Kopf `Host`, begrenzt die Größe von Anfragen, verwaltet Testkonten und die Einstellung Sprache und läuft als Testumgebung aus einem Commit. Die Teile für den Datenbestand historischer Kursdaten, den Import und die Beschaffung (Aufträge 02 bis 04), die Oberfläche (Auftrag 05) und den Testlauf (Arbeitspaket `wp03`) fehlen noch und werden hier ergänzt, sobald sie umgesetzt sind.

## 2. Aufbau der Komponente

pipwerk replay liegt im Verzeichnis `components/pipwerk-replay/` (das frühere Verzeichnis enthielt nur eine Platzhalter-README).

| Verzeichnis oder Datei | Inhalt |
| --- | --- |
| `backend/` | Python-Paket `pipwerk_replay` mit der HTTP-Anwendung, den Backend-Tests, `pyproject.toml` und der Lockdatei `uv.lock` |
| `backend/pipwerk-replay.example.ini` | Beispiel der Startkonfiguration |
| `scripts/testenv` | Testumgebungsskript (Abschnitt 4a) |
| `frontend/` | Browseroberfläche; noch nicht vorhanden (Auftrag 05) |
| `.gitignore` | schließt `backend/.venv/`, lokale Konfiguration und Datenbank und `.testenv/` aus |

### 2.1 Module des Backends

Die Funktion `create_app()` in `backend/src/pipwerk_replay/app.py` erzeugt die FastAPI-Anwendung, Uvicorn startet sie. Die Aufteilung folgt pipwerk Studio:

| Modul | Aufgabe |
| --- | --- |
| `cli.py` | Kommandozeile `pipwerk-replay` (Abschnitt 4.2) |
| `config.py` | liest die INI-Startkonfiguration (Abschnitt 2.2) |
| `host_check.py` | Prüfung des Kopfs `Host` (Abschnitt 2.4) |
| `body_limit.py` | Begrenzung der Größe von Anfragen (Abschnitt 5.2) |
| `docs_page.py` | die Seite `/docs` (Abschnitt 2.5) |
| `storage.py` | SQLAlchemy: Engine und ORM-Zeilen `SettingsRecord` und `AccountRecord` |
| `migrate.py`, `migrations/` | Versionierung der Datenbank mit Alembic (Abschnitt 2.3) |
| `accounts.py` | Testkonto: Modelle `AccountInput` und `Account`, Dienst `AccountService` (Abschnitt 2.6) |
| `settings_service.py` | Einstellung Sprache |
| `web_api.py` | Web-API unter `/api/v1/` (Abschnitt 5.2) |
| `contract.py` | erzeugt die Beschreibung unter `contracts/api/` (Abschnitt 5.3) |

Was nur pipwerk Studio betrifft (Objektverzeichnis, Strategien, Stand der Fußzeile, gemeinsame Bibliothek `pipwerk_domain`), ist nicht übernommen. Das Backend hängt in diesem Stand nur von FastAPI, SQLAlchemy, Alembic und Uvicorn ab; die gemeinsame Bibliothek und `packages/market-data` kommen mit den Aufträgen, die sie brauchen, als Pfadabhängigkeit hinzu.

### 2.2 Startkonfiguration

pipwerk replay startet nicht ohne gültige INI-Startkonfiguration. Eine implizite Ersatzdatenbank gibt es nicht. Die Datei heißt `pipwerk-replay.ini`:

```ini
[database]
url = sqlite:///./pipwerk-replay.db

[server]
host = 127.0.0.1
port = 8000
allowed_hosts = replay.example, 192.0.2.7
max_body_bytes = 2097152
```

| Abschnitt und Eintrag | Bedeutung | Vorgabe |
| --- | --- | --- |
| `[database]` `url` (Pflicht) | SQLAlchemy-Datenbank-URL; leer nicht zulässig | – |
| `[server]` `host` | Adresse, an die sich das Backend bindet | `127.0.0.1` |
| `[server]` `port` | Port des Backends, ganze Zahl von 1 bis 65535 | `8000` |
| `[server]` `allowed_hosts` | weitere Namen und IP-Adressen im Kopf `Host`, durch Kommas getrennt (Abschnitt 2.4) | keine |
| `[server]` `max_body_bytes` | größter Body einer Anfrage in Bytes, 1024 bis 1073741824 | 2 097 152 (2 MiB) |

Der Abschnitt `[server]` und jeder seiner Einträge sind freiwillig. Ein ungültiger Wert lässt den Start mit Exitcode 1 scheitern; die Meldung nennt die Datei und den Eintrag, nie den Wert. Die Aufrufparameter `--host` und `--port` überschreiben `host` und `port`; `--allowed-host` ergänzt `allowed_hosts`. Die Einträge `fetch_url` und `fetch_key` der Quelle für die Beschaffung (Auftrag 04) gibt es noch nicht. Die Sprache und alle anderen Einstellungen stehen nicht in der INI, sondern in der Datenbank.

Die Suche nach der Datei ist dieselbe wie bei pipwerk Studio, mit dem Dateinamen `pipwerk-replay.ini`. Eine mit `-c <PATH>` angegebene Datei hat höchste Priorität; ohne `-c` gilt die erste vorhandene Datei in dieser Reihenfolge, Inhalte werden nicht zusammengeführt:

1. `$HOME/pipwerk/etc/pipwerk-replay.ini`
2. `$HOME/.config/pipwerk/pipwerk-replay.ini`
3. `/etc/pipwerk/pipwerk-replay.ini`

Unter Windows gelten `%USERPROFILE%\pipwerk\etc`, `%APPDATA%\pipwerk` und `%PROGRAMDATA%\pipwerk`. Ist eine der Umgebungsvariablen nicht gesetzt, leer oder kein absoluter Pfad, entfallen die davon abhängigen Suchorte; es werden nie Pfade relativ zum Startverzeichnis durchsucht. Ohne Datei endet der Start mit Exitcode 1 und der Meldung:

```text
pipwerk-replay: No startup configuration found. pipwerk replay does not start without one. Searched: <Suchorte>. Provide a startup configuration file with -c <PATH>.
```

Als ungültig gelten außerdem eine fehlende Datei bei `-c`, eine nicht lesbare oder nicht auswertbare Datei, ein fehlender Abschnitt `[database]`, ein fehlender oder leerer Eintrag `url`, eine `url`, mit der keine Datenbank-Engine erzeugt werden kann oder die Datenbank nicht erreichbar ist, und jeder ungültige Eintrag von `[server]`. `create_app()` ohne Argument verwendet dieselbe Suche und bricht bei fehlender Konfiguration mit `StartupConfigError` ab. Anders als bei pipwerk Studio gibt `load_startup_config()` keine Herkunft der Datei zurück: pipwerk replay hat kein Objektverzeichnis, dessen Vorgabe davon abhängt.

### 2.3 Datenbank und Migration

pipwerk replay hat eine eigene Datenbank. Die Spezifikation (E4) erlaubt, dass die Datenbank des Datenbestands dieselbe ist; das ergibt sich erst in Auftrag 04. Das Schema wird mit Alembic versioniert. Die Migrationen liegen im Paket `pipwerk_replay.migrations` (`env.py`, `versions/v0001_initial.py`) und werden mit der Installation ausgeliefert. Es gibt keine Konfigurationsdatei von Alembic mit fester URL: `migrate_database(engine)` in `migrate.py` übergibt Alembic die Verbindung der Engine (`config.attributes["connection"]`); Offline-Modus wird nicht unterstützt. `create_replay_engine()` ruft sie beim Start auf; es gibt kein `create_all`.

Revision `0001` legt an:

| Tabelle | Spalten |
| --- | --- |
| `replay_settings` | `id` (ganze Zahl, Schlüssel; höchstens eine Zeile mit `id` = 1), `language` (Text, höchstens 8 Zeichen) |
| `test_accounts` | `id` (Text, 36 Zeichen, Schlüssel), `name` (Text, höchstens 100 Zeichen), `initial_capital` (Fließkommazahl), `currency` (Text, 3 Zeichen), `leverage` (ganze Zahl), `spread_mode` (Text, höchstens 8 Zeichen), `spread_points` (Fließkommazahl, NULL erlaubt), `commission_per_lot_side` (Fließkommazahl) |

Das Verhalten der Migration ist das von pipwerk Studio ([technische Dokumentation pipwerk Studio](pipwerk-studio.md), Abschnitt 2.1), ohne den Fall „Schema vor Alembic“, den es hier nicht gibt:

- Eine neue Datenbank erhält alle Migrationen; eine aktuelle bleibt unverändert; eine Datenbank, deren Revision dieser Stand nicht kennt (zum Beispiel von einer neueren Version), lässt den Start mit `DatabaseMigrationError`, Exitcode 1 und der festen Meldung „The database schema cannot be updated by this version of pipwerk replay.“ scheitern. Die Datenbank bleibt unverändert; die Meldung nennt weder Pfad noch Inhalt.
- Alle Migrationen eines Starts laufen mit der Versionstabelle in einer Transaktion. Scheitert eine, wird sie zurückgenommen (Meldung „A migration of the pipwerk replay database schema failed. The changes of this start were rolled back.“, ohne Ausnahmetext). Bei SQLite nimmt `migrate_database()` genau eine Verbindung der Engine, schaltet für diese Verbindung die Transaktionssteuerung des Treibers ab (`AUTOCOMMIT`) und führt `BEGIN IMMEDIATE`, `COMMIT` und `ROLLBACK` selbst aus; ein zweiter Prozess, der gleichzeitig startet, wartet (30 Sekunden) und findet den migrierten Stand vor. Beim Zurückgeben der Verbindung stellt SQLAlchemy die Einstellung des Treibers wieder her. Bei anderen Datenbanken gilt die übliche Transaktion von SQLAlchemy.
- Die Engine des Betriebs behält das Standardverhalten des Treibers. SQLite-Datenbanken im Speicher (`sqlite://`, `:memory:`, URI mit `mode=memory`) verwenden `StaticPool`, damit alle Threads dieselbe Datenbank sehen; das ist für Tests gedacht.
- Ein Fehler beim Aufbau der Verbindung bleibt ein Fehler von SQLAlchemy und wird als Problem der Datenbankverbindung gemeldet.

Eine Sicherung vor einer Aktualisierung ist Sache des Betreibers.

### 2.4 Prüfung des Kopfs `Host` (DNS-Rebinding)

`host_check.py` (`HostCheckMiddleware`) ist wie in pipwerk Studio die äußerste Middleware und prüft jede Anfrage auf jedem Pfad, auch vor der Begrenzung der Größe. Der Name im Kopf `Host` (ohne Port, kleingeschrieben, ohne abschließenden Punkt, IPv6 in eckigen Klammern gelesen) muss in der Liste der erlaubten Namen stehen, sonst antwortet das Backend mit HTTP 400 und dem festen Text `{"detail": "The Host header of the request is not allowed."}`. Ein fehlender, mehrfacher, leerer oder ungültiger Kopf wird ebenso abgewiesen; eine Anfrage über WebSocket wird geschlossen. Die Liste ist Einstellung des Backends: Voreinstellung `127.0.0.1`, `localhost`, `::1`, dazu die Namen von `allowed_hosts` der Startkonfiguration und des wiederholbaren Aufrufparameters `--allowed-host <Name>`. Der Eintrag `*ip` erlaubt jede IP-Adresse, aber keinen Namen. Das Testumgebungsskript ergänzt die Liste um den Wert von `--host`, bei `0.0.0.0` und `::` zusätzlich um `*ip` (Abschnitt 4a). Zur Begründung und zur Grenze der Maßnahme siehe die technische Dokumentation von pipwerk Studio, Abschnitt 2.10. Tests: `tests/test_host_check.py`.

### 2.5 Die Seite `/docs`

`/docs` zeigt Swagger UI aus dem npm-Paket `swagger-ui-dist`, wie bei pipwerk Studio (`docs_page.py`, Abschnitt 2.11 dort): `docs_url=None` und `redoc_url=None`; genau zwei fremde Ressourcen in der festen Version `SWAGGER_UI_VERSION` = `5.33.1` und mit den Attributen `integrity` und `crossorigin="anonymous"`: `https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.1/swagger-ui-bundle.js` (`sha384-ZPehFMQommnnuaZ4rpxgkgTT2DKFVp4hZC/7pLit+9Lek9T1YGSo23eHFbvNkXkw`) und `https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.1/swagger-ui.css` (`sha384-Ov4/wv3j2bmct8cDc5X4ngJZohVPzEmc6uDPH8WeljUxO5vtoykvMEfbu9Vh6RaW`). Die Prüfsummen sind die von pipwerk Studio; dort steht, wie sie berechnet und mit den Dateien des Auslieferungsnetzes verglichen wurden. Bei einer neuen Version müssen die Konstanten und beide Dokumente zusammen geändert werden. Das Symbol ist `data:,`. Ohne Zugang des Browsers zu `cdn.jsdelivr.net` bleibt `/docs` leer; `/openapi.json` und alle Endpunkte arbeiten trotzdem. Test: `tests/test_docs_page.py` (prüft auch, dass diese Dokumentation Version und Prüfsummen nennt).

### 2.6 Testkonten

Ein Testkonto (Spezifikation 6.2, req-test-005) ist ein benannter Satz von Werten für die Abwicklung eines Testlaufs. Felder und Prüfung (`accounts.py`, Modell `AccountInput`, Pydantic mit `extra="forbid"` und strengen Typen):

| Feld | Typ | Prüfung |
| --- | --- | --- |
| `name` | Text | 1 bis 100 Zeichen (Zeichen, nicht Bytes); mindestens ein sichtbares Zeichen; keine Steuerzeichen, Zeilen- und Absatztrenner (Unicode-Kategorien `Cc`, `Zl`, `Zp`) |
| `initial_capital` | Zahl | größer als 0 und höchstens 10<sup>12</sup>; weder `NaN` noch unendlich |
| `currency` | Text | genau drei Großbuchstaben A bis Z (Kontowährung, zum Beispiel `EUR`); eine Liste der Währungen gibt es nicht |
| `leverage` | ganze Zahl | 1 bis 1000; `30.0` und Texte werden abgelehnt |
| `spread_mode` | Text | `candle` (Spread aus den Kerzen) oder `fixed` (fester Wert) |
| `spread_points` | Zahl oder `null` | bei `fixed` Pflicht, 0 bis 100 000 Punkte; bei `candle` muss er `null` sein |
| `commission_per_lot_side` | Zahl | 0 bis 100 000, in der Kontowährung, je Lot und Seite |

Alle Felder sind Pflicht (auch `spread_points`, gegebenenfalls als `null`). Die Antwort `Account` enthält zusätzlich `id` (UUID) und `is_default` (nur lesend). Beide kommen nie aus einer Anfrage; ein Body mit `id` oder `is_default` wird als zusätzliches Feld abgelehnt.

**Standard-Testkonto, Entscheidung des Entwicklers.** Der Auftrag überlässt die Erkennung des Standard-Testkontos dem Entwickler. Entscheidung: Das Standard-Testkonto hat die feste Kennung `DEFAULT_ACCOUNT_ID` (`5b0e7c3a-1d84-4f6a-9a52-3c6d0e8f7a21`). Jedes andere Testkonto erhält seine Kennung vom Dienst (UUID Version 4); eine Anfrage kann keine Kennung vorgeben. „Standard“ ist damit keine gespeicherte Eigenschaft, die der Anwender ändern kann, und kein Name entscheidet darüber. Beim Start (`AccountService.ensure_default_account()`, aufgerufen von `create_app()`) wird das Standard-Testkonto angelegt, wenn kein Testkonto mit dieser Kennung besteht, und zwar mit den Werten 10 000, Kontowährung `EUR`, Hebel 30, `candle`, Kommission 0 und dem Namen `Standard-Testkonto` (der Name des bestätigten Prototyps; die Oberfläche zeigt für das Standard-Testkonto den englischen Text selbst). Daraus folgt:

- Ein Neustart legt genau ein Standard-Testkonto an, auch bei mehreren gleichzeitig startenden Prozessen (der Verlierer auf dem Schlüssel tut nichts).
- Ein Standard-Testkonto, das der Anwender geändert hat, wird beim Neustart nicht überschrieben; es bleibt auch nach einer Umbenennung das Standard-Testkonto (`is_default` bleibt wahr).
- Löscht der Anwender es, ist es nach dem nächsten Start mit den Ausgangswerten wieder da (Abnahmekriterium 4 von `wp02`).
- Ein vom Anwender angelegtes Konto mit demselben Namen wird weder überschrieben noch als Standard-Testkonto gezählt; Namen sind nicht eindeutig. Nach dem Löschen des Standard-Testkontos und einem Neustart gibt es dann zwei Konten desselben Namens, mit verschiedener Kennung.
- Ein Konto, das auf den Namen `Standard-Testkonto` umbenannt wird, ist nicht das Standard-Testkonto.

Weitere Festlegungen des Entwicklers (die Spezifikation nennt nur Felder und Standardwerte): Die Namen der Felder und die Grenzen der Wertebereiche stehen in der Tabelle oben. Beträge sind Fließkommazahlen (`float`, in der Datenbank `Float`); die Werte sind Eingaben des Anwenders, das Ergebnis eines Testlaufs hängt nur von denselben Zahlen ab (E7). Die Liste ist nach dem Namen ohne Beachtung der Schreibweise und dann nach der Kennung sortiert. Beim Lesen aus der Datenbank wird jede Zeile mit demselben Modell erneut geprüft; eine beschädigte Zeile (zum Beispiel nach händischer Änderung der Datenbank) wird nicht als gültiges Konto weitergegeben, sondern endet mit einem Fehler des Servers.

### 2.7 Einstellung Sprache

Die Sprache der Oberfläche (`de` oder `en`) ist eine einzige betriebliche Einstellung der Komponente, nicht benutzerbezogen und im Backend gespeichert; der Browser ist nicht autoritativ (req-ui-008). Ohne gespeicherten Wert gilt Deutsch. Die Datenbank enthält höchstens eine Zeile in `replay_settings`; gleichzeitiges erstes Schreiben legt sie einmal an. Enthält der gespeicherte Wert keine unterstützte Sprache (technisch fehlerhafter Inhalt), schlägt das Lesen mit HTTP 503 und dem Text `The stored pipwerk replay language is invalid.` fehl; ein gültiges Schreiben ersetzt den Wert. Weitere Einstellungen kommen mit Auftrag 04.

## 3. Voraussetzungen für die Entwicklung

Wie bei pipwerk Studio ([technische Dokumentation pipwerk Studio](pipwerk-studio.md), Abschnitt 3): Python 3.14 oder neuer und uv. Node.js wird erst mit der Oberfläche gebraucht. Alle Python-Pakete installiert uv in `backend/.venv`.

## 4. Einrichtung und Start im Entwicklungsbetrieb

### 4.1 Einrichtung

```sh
cd components/pipwerk-replay/backend
uv sync --frozen
```

### 4.2 Start

```sh
cp pipwerk-replay.example.ini pipwerk-replay.ini
uv run --frozen pipwerk-replay -c pipwerk-replay.ini --host 127.0.0.1 --port 8000
```

Ohne `-c` wird einer der Suchorte aus Abschnitt 2.2 verwendet. `--host` und `--port` überschreiben die Einträge der Startkonfiguration; der Port muss eine ganze Zahl von 1 bis 65535 sein. Die Beschreibung der Web-API zeigt `http://127.0.0.1:8000/docs`. Die lokal erzeugten Dateien `backend/pipwerk-replay.ini` und `backend/pipwerk-replay.db` (mit `-journal`, `-wal`, `-shm`) schließt `components/pipwerk-replay/.gitignore` aus; versioniert bleibt nur `backend/pipwerk-replay.example.ini`.

## 4a. Start als Testumgebung

Die Testumgebung ist pipwerk replay, gestartet aus genau einem Commit. Das Skript `components/pipwerk-replay/scripts/testenv` (POSIX-Shell) arbeitet auf dem Arbeitsverzeichnis, in dem es liegt, und enthält keine festen Ports, Pfade oder Rechnernamen. Es wird mit absolutem Pfad aus einem beliebigen Verzeichnis oder mit relativem Pfad aus dem Wurzelverzeichnis des Arbeitsverzeichnisses aufgerufen:

```sh
<Arbeitsverzeichnis>/components/pipwerk-replay/scripts/testenv start --frontend-port <port> --backend-port <port> [--host <adresse>]
<Arbeitsverzeichnis>/components/pipwerk-replay/scripts/testenv status
<Arbeitsverzeichnis>/components/pipwerk-replay/scripts/testenv stop
```

Voraussetzungen: Git, Python 3 (Prüfung der Ports und der Erreichbarkeit), `ps`, uv, und mit Oberfläche Node.js mit npm; ein Zugriff auf die Paketquellen für `uv sync --frozen` (und `npm ci`); freie Ports. Das Arbeitsverzeichnis muss ein Arbeitsverzeichnis von Git sein.

`start`:

1. Prüft die Parameter. `--frontend-port` und `--backend-port` sind Pflicht, ganze Zahlen von 1 bis 65535 und verschieden. `--host` ist die Adresse, an die sich die Oberfläche bindet; ohne Angabe `127.0.0.1`. Das Backend bindet sich immer an `127.0.0.1`.
2. Prüft, dass das Verzeichnis des Skripts in einem Arbeitsverzeichnis von Git liegt, und mit `git status --porcelain` für die ganze Wurzel, dass es keine nicht committeten Änderungen und keine nicht ignorierten neuen Dateien gibt. Vorher wird nichts installiert, gebaut oder gestartet.
3. Stellt fest, ob `components/pipwerk-replay/frontend/` vorhanden ist. Nur dann wird die Oberfläche gebaut und gestartet und `npm` gebraucht.
4. Prüft die Programme, dass keine laufende Testumgebung verzeichnet ist und dass die Ports frei sind (den Port der Oberfläche nur mit Oberfläche).
5. Installiert die Abhängigkeiten nach der Lockdatei (`uv sync --frozen`; mit Oberfläche `npm ci` und `npm run build`).
6. Legt unter `components/pipwerk-replay/.testenv/` eine INI-Startkonfiguration mit einer eigenen SQLite-Datei an (nur der Abschnitt `[database]`) und startet das Backend mit `-c` auf `127.0.0.1:<backend-port>`; mit `--host` mit `--allowed-host <Wert>`, bei `0.0.0.0` und `::` zusätzlich mit `--allowed-host '*ip'`. Mit Oberfläche startet es danach `vite preview` auf `<host>:<frontend-port>`; `vite preview` leitet Anfragen unter `/api` an das Backend weiter (Umgebungsvariable `PIPWERK_REPLAY_BACKEND_URL`, vom Skript gesetzt).
7. Wartet, bis `/api/health` `{"status": "ok"}` liefert (Zeitbegrenzung 120 Sekunden): mit Oberfläche über den Port der Oberfläche, sonst am Port des Backends. Danach meldet es die Adresse.

Ohne Verzeichnis `frontend/` läuft nur das Backend. Der Parameter `--frontend-port` ist trotzdem Pflicht und wird geprüft, damit sich der Aufruf nicht ändert, wenn Auftrag 05 die Oberfläche ergänzt; der Port wird nicht belegt. `start` meldet dann `pipwerk replay is running: backend only, http://127.0.0.1:<backend-port>/docs (this commit has no user interface)`.

Abbruchfälle von `start` (Exitcode ungleich 0, Ursache auf der Fehlerausgabe): ungültige oder fehlende Parameter; das Verzeichnis liegt nicht in einem Arbeitsverzeichnis von Git; eine nicht committete Änderung oder nicht ignorierte neue Datei (die Meldung nennt die ersten Dateien; bei diesen beiden Fällen wurde nichts angelegt); ein Programm fehlt, es läuft schon eine Testumgebung oder ein Port ist belegt; Installation oder Bau scheitert, ein Prozess endet beim Start oder `/api/health` antwortet nicht rechtzeitig (das Skript gibt die letzten Zeilen der Protokolle aus, beendet die gestarteten Prozesse und entfernt `.testenv/`).

`status` nennt, ob die Testumgebung läuft, und ihre Adressen. Exitcode 0 bei laufender, 1 bei nicht oder nur teilweise laufender Testumgebung. Ohne Oberfläche gibt es genau den Zustand „läuft“ mit dem Zusatz `(backend only, this commit has no user interface)`. `stop` beendet die Prozesse (zuerst SIGTERM, nach 10 Sekunden SIGKILL) und entfernt `.testenv/`, also auch die Datenbank mit den Testkonten und Einstellungen. Zustand, Prozesskennungen, Protokolle (`backend.log`, `frontend.log`), die INI und die Datenbank liegen in `components/pipwerk-replay/.testenv/`, das in `components/pipwerk-replay/.gitignore` steht. Test: `backend/tests/test_testenv.py` (Abschnitt 6.1).

Adressen: Oberfläche (mit Oberfläche) `http://<host>:<frontend-port>/`; Schnittstellenbeschreibung des Backends `http://127.0.0.1:<backend-port>/docs` und `/openapi.json`, nur auf `127.0.0.1` des Rechners der Testumgebung. Das Risiko bei `--host` außerhalb der Loopback-Adresse ist das von pipwerk Studio: Ohne Authentisierung sind alle Endpunkte, auch die schreibenden, für jeden im Netz erreichbar, sobald die Oberfläche erreichbar ist; eine solche Adresse ist nur in einem Netz zu verwenden, dem alle Teilnehmer vertraut werden.

## 5. HTTP-Schnittstelle

### 5.1 Technischer Endpunkt

| Methode | Pfad | Erfolgsantwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/health` | HTTP 200 mit `{"status": "ok"}` | technische Prüfung, ob die Oberfläche ihr Backend erreicht |

Er gehört nicht zur Beschreibung unter `contracts/api/`, bleibt aber in `/docs` sichtbar.

### 5.2 Web-API unter `/api/v1/`

| Methode | Pfad | Erfolgsantwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/v1/accounts` | `200` mit `{"items": [Account, …]}` | alle Testkonten, nach Namen sortiert |
| `POST` | `/api/v1/accounts` | `201` mit `Account` | legt ein Testkonto unter einer neuen Kennung an |
| `GET` | `/api/v1/accounts/{id}` | `200` mit `Account` | liest ein Testkonto |
| `PUT` | `/api/v1/accounts/{id}` | `200` mit `Account` | ersetzt alle Werte eines Testkontos; legt nie eines an |
| `DELETE` | `/api/v1/accounts/{id}` | `204` ohne Body | löscht ein Testkonto, auch das Standard-Testkonto |
| `GET` | `/api/v1/settings` | `200` mit `{"language": "de"}` oder `"en"` | Einstellung Sprache lesen; ohne gespeicherten Wert `de` |
| `PUT` | `/api/v1/settings` | `200` mit `{"language": …}` | Sprache speichern; Body ausschließlich `{"language": "de"}` oder `"en"` |

`{id}` ist eine UUID. Die Modelle `AccountInput`, `Account`, `AccountList`, `Settings`, `SettingsUpdate` und für Fehler `ApiError` und `InvalidRequest` lassen keine zusätzlichen Felder zu.

Regeln (wie bei pipwerk Studio, `web_api.py`):

- Ein Body ist JSON mit dem Medientyp `application/json` (auch mit Parametern und in beliebiger Schreibweise), sonst `415`. Eine Webseite eines anderen Ursprungs kann so nicht mit einem einfachen Formular schreiben; gegen DNS-Rebinding schützt die Prüfung des Kopfs `Host` (Abschnitt 2.4).
- Der Body wird als Ganzes gelesen und streng geprüft: Ein Body, der kein JSON-Objekt ist, ein doppelter Schlüssel, `NaN` und `Infinity`, ein falscher Typ, ein zusätzliches Feld und jeder Wert außerhalb seines Bereichs ergeben `422`. Die Antwort nennt den Ort jedes Fehlers im Body und seine Art, nie den Wert.
- Die Größe des Bodys ist begrenzt (`max_body_bytes` der Startkonfiguration, Vorgabe 2 MiB), sonst `413`. `body_limit.py` (`BodyLimitMiddleware`) prüft das für alle Anfragen unter `/api/v1/`, bevor die Anwendung den Body liest: Nennt `Content-Length` mehr als das Limit, wird sofort mit `413` geantwortet; sonst zählt die Middleware die ankommenden Bytes, ohne `Content-Length` zu trauen, und bricht beim Überschreiten ab.
- Die Fehlertexte sind fest. Sie nennen weder Pfade noch Ausnahmetexte noch Werte.

| Status | Fall | Body |
| --- | --- | --- |
| 400 | der Kopf `Host` fehlt oder nennt keinen erlaubten Namen (auf jedem Pfad) | `{"detail": "The Host header of the request is not allowed."}` |
| 404 | unbekannte Kennung | `{"detail": "The test account does not exist."}` |
| 413 | Body über dem Limit | `{"detail": "The request body is larger than the limit."}` |
| 415 | der Medientyp ist nicht `application/json` | `{"detail": "The request body must be JSON (Content-Type: application/json)."}` |
| 422 | Body passt nicht zum Schema | `{"detail": "The request body does not fit the schema.", "errors": [{"location": [...], "type": "<Fehlertyp von Pydantic>"}]}`; `location` ist `[]` bei einem Body, der kein gültiges JSON ist (`type` `json_invalid`); sonst der Ort des Fehlers im Body |
| 422 | `{id}` ist keine UUID | `{"detail": "The request is invalid.", "errors": [{"location": ["path", "id"], "type": "uuid_parsing"}]}` |
| 503 | die gespeicherte Sprache ist ungültig (nur Lesen der Einstellung) | `{"detail": "The stored pipwerk replay language is invalid."}` |

Höchstens 50 Einträge in `errors`; ein Text im Ort wird bei mehr als 100 Zeichen gekürzt. Eine andere Methode auf diesen Pfaden antwortet mit `405`, ein unbekannter Pfad mit `404`.

Die Einstellung Sprache liegt auf `/api/v1/settings` und damit in der öffentlichen Beschreibung, wie es der Auftrag verlangt. Bei pipwerk Studio liegt sie unter `/api/studio/settings/language` und ist intern; Abschnitt 7 der Spezifikation spricht von „internen Endpunkten für Einstellungen wie in pipwerk Studio“. Siehe die offenen Punkte (Abschnitt 8).

### 5.3 Beschreibung der Web-API unter `contracts/api/`

Die Beschreibung (OpenAPI 3.1) liegt unter `contracts/api/pipwerk-replay/v1/openapi.json`. Sie wird aus der Anwendung erzeugt (`pipwerk_replay.contract`): `public_description()` beschränkt sie auf die Pfade unter `/api/v1/` und die Schemata, die diese Pfade verwenden; `/api/health` gehört nicht hinein. Titel ist „pipwerk replay“, `info.version` ist die Version der Web-API (`1.0.0`). Die Anwendung wird mit `separate_input_output_schemas=False` erzeugt. Der Body der Anfragen ist mit `openapi_extra` beschrieben (das Schema des Modells steht an der Stelle des Bodys), weil der Body vom Modul gelesen und geprüft wird. Der Befehl, der die Datei neu erzeugt (im Verzeichnis `components/pipwerk-replay/backend`):

```sh
uv run --frozen python -m pipwerk_replay.contract ../../../contracts/api/pipwerk-replay/v1/openapi.json
```

Mit `--check` schreibt der Befehl nichts und endet mit Exitcode 1, wenn die Datei von der Anwendung abweicht. Er erzeugt die Anwendung mit einer Datenbank im Speicher und braucht keine Startkonfiguration. Ein Test (`tests/test_contract.py`) vergleicht die erzeugte Beschreibung mit der Datei und schlägt bei einer Abweichung fehl. Eine Änderung an Endpunkten, Modellen oder Texten der Web-API macht die Datei veraltet; sie wird dann mit dem Befehl neu erzeugt und mit der Änderung committet. Versionierung: Die Version steht im Pfad; eine nicht rückwärtsverträgliche Änderung erhält `/api/v2/` und eine neue Datei unter `contracts/api/pipwerk-replay/v2/`.

## 6. Prüfungen

### 6.1 Backend

Im Verzeichnis `components/pipwerk-replay/backend`:

```sh
uv sync --frozen
uv run --frozen pytest
uv run --frozen ruff check
uv run --frozen ruff format --check
uv run --frozen mypy
```

Die Tests liegen in `backend/tests/`:

| Datei | Prüft |
| --- | --- |
| `test_config.py` | Startkonfiguration: Suchorte (POSIX und Windows, auch bei leerem `HOME`), Priorität, Fehlerfälle, Einträge von `[server]` mit Vorgaben und jedem ungültigen Wert |
| `test_cli.py` | Start ohne gültige INI, nicht nutzbare URL, ungültiger Eintrag, Datenbank einer neueren Version, `--host` und `--port` gegen die Konfiguration, `create_app()` ohne Konfiguration |
| `test_host_check.py` | Kopf `Host`: erlaubte und abgewiesene Namen, ungültige Köpfe, jeder Pfad, Reihenfolge vor der Begrenzung des Bodys, Liste aus Konfiguration und Kommandozeile |
| `test_body_limit.py` | Begrenzung des Bodys auf der Ebene von ASGI und an der Web-API, auch mit anderem Limit |
| `test_docs_page.py` | `/docs`: feste Version, `integrity`, nichts anderes von außen |
| `test_migrations.py`, `test_memory_databases.py` | Alembic: neue und aktuelle Datenbank, neuere Version, Rücknahme bei Fehler, Schema gleich dem ORM-Modell, Datenbanken im Speicher |
| `test_accounts_service.py` | Standard-Testkonto: erster Start, zweiter Start, Änderung, Löschen und Neustart, gleichnamiges Konto des Anwenders, gleichzeitige Starts, beschädigte Zeile |
| `test_accounts_api.py` | Testkonten: alle Vorgänge der Web-API und jeder Fehlerfall der Prüfung (jedes Feld mit jedem Fehler, fehlende und zusätzliche Felder, Name, Regel für den Spread, JSON-Fehler, Medientyp, Kennung, Methoden, Fehlerformat) |
| `test_settings.py` | Einstellung Sprache: Vorgabe, Lesen, Schreiben, ungültige Bodys, 503 und Reparatur, Neustart des Prozesses |
| `test_contract.py` | Beschreibung unter `contracts/api/`: gleich der erzeugten, Abweichung gefunden, Pfade, Schemata, Befehl |
| `test_testenv.py` | Testumgebungsskript (Abschnitt 4a): Prüfung auf nicht committete Änderungen, Parameter, Ports, nur Backend ohne `frontend/`, Oberfläche mit `frontend/`, erlaubte Namen, Ablauf `start`, `status`, `stop` |
| `test_health.py` | `/api/health`, 405, 404, Name der Anwendung |

`test_testenv.py` arbeitet auf einem Abbild der versionierten Dateien (`LICENSE`, `components/pipwerk-replay/**`) in einem temporären Verzeichnis mit Platzhaltern für `uv`, `npm` und `npx`; die Tests werden ohne installiertes Git und außerhalb eines Git-Arbeitsverzeichnisses mit Begründung übersprungen. Er liest die versionierten Dateien aus Git: Neue Dateien müssen mit `git add` vorgemerkt sein, damit das Abbild sie enthält.

Die Prüfung mit `ruff` und `mypy` entspricht der von pipwerk Studio (`strict = true`, Regeln `E`, `W`, `F`, `I`, `N`, `UP`, `B`, `S`, `A`, `C4`, `SIM`, `RUF`, Zeilenlänge 100).

### 6.2 Prüfskript

Das Prüfskript `components/pipwerk-replay/scripts/check` (POSIX-Shell) führt die Prüfungen aus Abschnitt 6.1 nacheinander aus und endet mit Exitcode 0 nur, wenn alle bestehen. Es legt und hält der Tester Funktion. Es prüft das Arbeitsverzeichnis, in dem das Skript liegt; das Verzeichnis wird aus dem Pfad des Skripts bestimmt. Das Skript wird mit absolutem Pfad aus einem beliebigen Verzeichnis aufgerufen und enthält keine festen Ports, Pfade oder Rechnernamen.

```sh
<Arbeitsverzeichnis>/components/pipwerk-replay/scripts/check [--backend-port <port> --frontend-port <port>] [--with-audit]
```

| Parameter | Bedeutung |
| --- | --- |
| `--backend-port <port>` | Port des Backends im Browsertest, ganze Zahl von 1 bis 65535. Pflicht, sobald `frontend/` vorhanden ist; sonst darf er fehlen. |
| `--frontend-port <port>` | Port der Oberfläche im Browsertest, ganze Zahl von 1 bis 65535, verschieden vom Port des Backends. Pflicht, sobald `frontend/` vorhanden ist; sonst darf er fehlen. |
| `--with-audit` | Optional. Führt zusätzlich `pip-audit` für `backend/uv.lock` und mit Oberfläche `npm audit` aus (Zugriff auf das Internet nötig). |

Reihenfolge der Prüfungen:

1. Backend im Verzeichnis `backend`: `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check`, `mypy`
2. Suche im Repository (`git grep`) nach den alten Bezeichnern der Komponente (Muster `pipwerk[-_ ]?backtest`, ohne Beachtung der Schreibweise) in allen versionierten Dateien außerhalb von `docs/design/` und `development/`; ein Treffer lässt die Prüfung scheitern (Auftrag 01, Abnahmekriterium 1)
3. mit `--with-audit`: `pip-audit` für das Backend
4. Oberfläche im Verzeichnis `frontend`: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`; mit `--with-audit` zusätzlich `npm audit`; danach der Browsertest `npm run e2e` mit den beiden Ports (Umgebungsvariablen `PIPWERK_REPLAY_E2E_BACKEND_PORT`, `PIPWERK_REPLAY_E2E_FRONTEND_PORT`). Ohne Verzeichnis `frontend/` überspringt das Skript diese Schritte mit Hinweis in der Ausgabe; das gilt nicht als Fehler.

Am Ende nennt das Skript die bestandenen, die übersprungenen und die gescheiterten Prüfungen. Exitcode 2 bei ungültigen Parametern oder fehlenden Programmen.

## 7. Abhängigkeiten

Laufzeit (festgeschrieben in `backend/uv.lock`): `alembic`, `fastapi` (mit `pydantic` und `starlette`), `sqlalchemy`, `uvicorn`. Entwicklung und Prüfung: `httpx2` (Testclient von FastAPI), `mypy`, `pytest`, `ruff`. Mindestversionen stehen in `backend/pyproject.toml`: alembic 1.20.0, fastapi 0.141.1, sqlalchemy 2.1.3, uvicorn 0.54.0, httpx2 2.13.1, mypy 2.3.1, pytest 9.1.1, ruff 0.16.9; gelockt sind im Stand dieses Auftrags unter anderem alembic 1.20.0, fastapi 0.156.8, pydantic 2.14.1, starlette 1.9.0, sqlalchemy 2.1.5, uvicorn 0.54.0. Die Seite `/docs` lädt Swagger UI von `cdn.jsdelivr.net` (Abschnitt 2.5).

## 8. Entscheidungen und offene Punkte

Entscheidungen des Entwicklers in Auftrag 01 (die Spezifikation lässt sie offen oder der Auftrag überlässt sie ihm):

- Erkennung des Standard-Testkontos über eine feste Kennung (Abschnitt 2.6).
- Felder, Namen und Wertebereiche der Testkonten; Beträge als Fließkommazahlen; `PUT` ersetzt alle Werte; `is_default` nur lesend; Namen nicht eindeutig (Abschnitt 2.6).
- Startkonfiguration mit `[server]` `host`, `port`, `allowed_hosts` und `max_body_bytes` (Abschnitt 2.2); Kommandozeile überschreibt `host` und `port`.
- Keine Herkunft der Startkonfiguration (`ConfigOrigin`) und keine Abhängigkeit von `pipwerk_domain`: beides braucht dieser Stand nicht.
- Das Testumgebungsskript verlangt `--frontend-port` auch ohne Oberfläche (Abschnitt 4a).
- Die Beschreibung der Anfrage-Bodys steht inline im Pfad statt als benanntes Schema (Abschnitt 5.3).

Offene Punkte, die der Entwicklungsleiter entscheidet:

1. Pfad der Einstellung Sprache: Der Auftrag nennt `/api/v1/settings`, die Spezifikation (Abschnitt 7) „interne Endpunkte für Einstellungen wie in pipwerk Studio“, also außerhalb von `/api/v1/` und ohne Aufnahme in die Beschreibung. Umgesetzt ist der Wortlaut des Auftrags (öffentlich). Eine Änderung betrifft den Pfad, `web_api.py`, die Tests und die Beschreibung.
2. Der Auftrag nennt in der Startkonfiguration „Stand der Quelle“ ohne weitere Erklärung; der Satz wurde nicht eindeutig lesbar umgesetzt. Nicht umgesetzt ist daher ein Endpunkt für den Stand (Commit) wie `/api/studio/revision` bei pipwerk Studio, den die Fußzeile der Oberfläche (Plan `wp02`, Auftrag 05) brauchen wird. Er lässt sich mit `revision.py` von pipwerk Studio ergänzen.
3. Datenbestand, Import, Beschaffung, die Einträge `fetch_url` und `fetch_key` und weitere Einstellungen folgen mit den Aufträgen 02 bis 04, die Oberfläche mit Auftrag 05.
