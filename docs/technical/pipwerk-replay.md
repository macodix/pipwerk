# pipwerk replay – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-21
- komponente: `pipwerk-replay`
- vorhaben: `backtest`, Arbeitspaket `wp02`, Aufträge 01 und 04

## 1. Gegenstand

Dieses Dokument beschreibt den technischen Aufbau von pipwerk replay (dem Strategietester), die Einrichtung einer Entwicklungsumgebung, den Start im Entwicklungsbetrieb und als Testumgebung und die Prüfungen. Grundlage ist die Spezifikation des Vorhabens `backtest` (E3 bis E6, 5.1 bis 5.4, 6.2, 7, 10, 11); Aufbau, Startkonfiguration, Alembic und die Prüfung des Kopfs `Host` folgen pipwerk Studio ([technische Dokumentation pipwerk Studio](pipwerk-studio.md), Abschnitte 2.1, 2.2 und 2.10).

Der beschriebene Stand ist das Backend aus den Aufträgen 01 und 04. Auftrag 01: Das Backend startet aus der Startkonfiguration, legt seine Datenbank mit Alembic an, prüft den Kopf `Host`, begrenzt die Größe von Anfragen, verwaltet Testkonten und läuft als Testumgebung aus einem Commit. Auftrag 04: Es bindet den Datenbestand historischer Kursdaten ein ([technische Dokumentation des Datenbestands](pipwerk-marketdata.md), Paket `pipwerk_marketdata` aus Auftrag 02) und eine Quelle für die Beschaffung (`pipwerk-fetch-mt5` oder eine gleichartige, [technische Dokumentation](pipwerk-fetch-mt5.md), Auftrag 03). Es bietet dafür die Web-API für Übersicht, Import, Vollständigkeit und Beschaffung und die internen Endpunkte für die Einstellungen Sprache und Standardquelle und für den Stand. Die Oberfläche (Auftrag 05) und der Testlauf (Arbeitspaket `wp03`) fehlen noch und werden hier ergänzt, sobald sie umgesetzt sind.

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
| `storage.py` | SQLAlchemy: Engine und ORM-Zeilen `SettingsRecord` und `AccountRecord`; die Datenbank des Datenbestands (Abschnitt 2.8) |
| `migrate.py`, `migrations/` | Versionierung der Datenbank mit Alembic (Abschnitt 2.3) |
| `accounts.py` | Testkonto: Modelle `AccountInput` und `Account`, Dienst `AccountService` (Abschnitt 2.6) |
| `settings_service.py` | Einstellungen Sprache und Standardquelle (Abschnitt 2.7) |
| `names.py` | Regel für Namen von Brokern und Instrumenten |
| `marketdata_service.py` | Datenbestand: Import, Übersicht, Angaben zum Instrument, Vollständigkeit, Begrenzung gleichzeitiger Importe (Abschnitt 2.8) |
| `marketdata_models.py` | Modelle der Anfragen und Antworten des Datenbestands (Pydantic) |
| `acquisition.py` | Beschaffung: Verbindung zur Quelle (`HttpSourceClient`) und Aufträge im Hintergrund (`AcquisitionManager`) (Abschnitt 2.9) |
| `revision.py` | Stand (Git-Commit), aus dem pipwerk replay läuft (Abschnitt 2.10) |
| `api_support.py` | gemeinsame Regeln der Schnittstellen: Body, Fehler, Texte (Abschnitt 5.2) |
| `web_api.py` | Testkonten der Web-API unter `/api/v1/` und Einbau aller Schnittstellen (Abschnitt 5.2) |
| `marketdata_api.py` | Web-API des Datenbestands und der Beschaffung unter `/api/v1/market-data/` (Abschnitt 5.2) |
| `internal_api.py` | interne Endpunkte unter `/api/replay/` (Abschnitt 5.1) |
| `contract.py` | erzeugt die Beschreibung unter `contracts/api/` (Abschnitt 5.3) |

Was nur pipwerk Studio betrifft (Objektverzeichnis, Strategien, gemeinsame Bibliothek `pipwerk_domain`), ist nicht übernommen. Das Backend hängt von FastAPI, SQLAlchemy, Alembic, Uvicorn, dem HTTP-Client `httpx2` (Verbindung zur Quelle) und, als Pfadabhängigkeit mit festgeschriebener Version `==0.1.0`, von `pipwerk_marketdata` (`packages/market-data`) ab; die gemeinsame Bibliothek `pipwerk_domain` kommt mit dem Auftrag, der sie braucht.

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

[marketdata]
url = sqlite:///./pipwerk-marketdata.db
max_upload_bytes = 33554432
max_rows = 500000

[source]
fetch_url = http://192.0.2.10:8765
fetch_key = <der gemeinsame Schlüssel der Quelle>
```

| Abschnitt und Eintrag | Bedeutung | Vorgabe |
| --- | --- | --- |
| `[database]` `url` (Pflicht) | SQLAlchemy-Datenbank-URL; leer nicht zulässig | – |
| `[server]` `host` | Adresse, an die sich das Backend bindet | `127.0.0.1` |
| `[server]` `port` | Port des Backends, ganze Zahl von 1 bis 65535 | `8000` |
| `[server]` `allowed_hosts` | weitere Namen und IP-Adressen im Kopf `Host`, durch Kommas getrennt (Abschnitt 2.4) | keine |
| `[server]` `max_body_bytes` | größter Body einer Anfrage in Bytes, 1024 bis 1073741824 | 2 097 152 (2 MiB) |
| `[marketdata]` `url` | Datenbank des Datenbestands (Abschnitt 2.8); leer nicht zulässig | die Datenbank von `[database]` |
| `[marketdata]` `max_upload_bytes` | größte hochgeladene Datei eines Imports in Bytes, 1024 bis 1073741824 | 33 554 432 (32 MiB, Vorgabe von `pipwerk_marketdata`) |
| `[marketdata]` `max_rows` | größte Zahl der Zeilen oder Einträge einer hochgeladenen Datei, 1 bis 100 000 000 | 500 000 (Vorgabe von `pipwerk_marketdata`) |
| `[marketdata]` `max_reported_rejections` | Zahl der abgelehnten Zeilen, die das Ergebnis eines Imports nennt (gezählt werden alle), 0 bis 1 000 000 | 1000 (Vorgabe von `pipwerk_marketdata`) |
| `[marketdata]` `max_concurrent_imports` | Zahl der Importe, die gleichzeitig laufen, 1 bis 64 | 2 |
| `[marketdata]` `max_listed_items` | größte Zahl von Einträgen einer Liste in einer Antwort (Reihen, Instrumente, Zeiträume), 1 bis 1 000 000 | 1000 |
| `[marketdata]` `max_parts_per_request` | größte Zahl von Teilen in einer Anfrage nach Vollständigkeit oder Beschaffung, 1 bis 10 000 | 100 |
| `[source]` `fetch_url` | Adresse der Quelle: `http` oder `https`, ein Rechnername oder eine IP-Adresse, ohne Benutzer, Kennwort, Abfrage und Fragment; höchstens 2048 Zeichen | keine Quelle |
| `[source]` `fetch_key` | der gemeinsame Schlüssel der Quelle: 16 bis 256 druckbare ASCII-Zeichen ohne Leerzeichen (wie `shared_key` der Quelle); Prozentzeichen gelten als Zeichen | keine Quelle |
| `[source]` `timeout_seconds` | längste Wartezeit auf eine Antwort der Quelle in Sekunden, 1 bis 3600 | 300 |
| `[source]` `max_concurrent_acquisitions` | Zahl der Beschaffungen, die gleichzeitig laufen, 1 bis 64 | 2 |
| `[source]` `max_kept_acquisitions` | Zahl der Beschaffungen, deren Stand im Speicher bleibt, 1 bis 100 000 | 100 |

Die Abschnitte `[server]`, `[marketdata]` und `[source]` und jeder ihrer Einträge sind freiwillig. Ein ungültiger Wert lässt den Start mit Exitcode 1 scheitern; die Meldung nennt die Datei und den Eintrag, nie den Wert. Die Aufrufparameter `--host` und `--port` überschreiben `host` und `port`; `--allowed-host` ergänzt `allowed_hosts`. Die Sprache, die Standardquelle und alle anderen Einstellungen stehen nicht in der INI, sondern in der Datenbank.

Adresse und Schlüssel der Quelle gehören zusammen: Fehlt einer der beiden Einträge oder ist er leer, der andere aber gesetzt, scheitert der Start. Sind beide nicht gesetzt, ist keine Quelle eingerichtet: Die Beschaffung antwortet dann mit dem Fehler „Keine Quelle eingerichtet“ (Abschnitt 2.9), alles andere arbeitet. Der Schlüssel steht nur in dieser Datei, nie in der Datenbank, in keiner Antwort und in keinem Protokoll (Abschnitt 2.9). `repr()` der Konfiguration zeigt ihn nicht. Die Datei steht nie im Repository (`.gitignore` der Komponente).

Die INI wird ohne Interpolation gelesen (ein Prozentzeichen ist ein Zeichen wie jedes andere; der bisherige Zustand ließ eine Datenbank-URL mit `%` scheitern). Eine Fehlermeldung zu einer INI wiederholt nie einen Wert der Datei. Bei einem Syntaxfehler nennt sie nur die Nummer der Zeile, denn der Text von `configparser` wiederholt die Zeile und mit ihr womöglich den Schlüssel; eine Datei, die kein UTF-8 ist, heißt „not UTF-8 text“. Unbekannte Einträge ignoriert pipwerk replay wie bisher.

Die Suche nach der Datei ist dieselbe wie bei pipwerk Studio, mit dem Dateinamen `pipwerk-replay.ini`. Eine mit `-c <PATH>` angegebene Datei hat höchste Priorität; ohne `-c` gilt die erste vorhandene Datei in dieser Reihenfolge, Inhalte werden nicht zusammengeführt:

1. `$HOME/pipwerk/etc/pipwerk-replay.ini`
2. `$HOME/.config/pipwerk/pipwerk-replay.ini`
3. `/etc/pipwerk/pipwerk-replay.ini`

Unter Windows gelten `%USERPROFILE%\pipwerk\etc`, `%APPDATA%\pipwerk` und `%PROGRAMDATA%\pipwerk`. Ist eine der Umgebungsvariablen nicht gesetzt, leer oder kein absoluter Pfad, entfallen die davon abhängigen Suchorte; es werden nie Pfade relativ zum Startverzeichnis durchsucht. Ohne Datei endet der Start mit Exitcode 1 und der Meldung:

```text
pipwerk-replay: No startup configuration found. pipwerk replay does not start without one. Searched: <Suchorte>. Provide a startup configuration file with -c <PATH>.
```

Als ungültig gelten außerdem eine fehlende Datei bei `-c`, eine nicht lesbare oder nicht auswertbare Datei, ein fehlender Abschnitt `[database]`, ein fehlender oder leerer Eintrag `url`, eine `url`, mit der keine Datenbank-Engine erzeugt werden kann oder die Datenbank nicht erreichbar ist, und jeder ungültige Eintrag von `[server]`, `[marketdata]` und `[source]` (auch eine Adresse der Quelle ohne Schlüssel oder umgekehrt). `create_app()` ohne Argument verwendet dieselbe Suche und bricht bei fehlender Konfiguration mit `StartupConfigError` ab. Anders als bei pipwerk Studio gibt `load_startup_config()` keine Herkunft der Datei zurück: pipwerk replay hat kein Objektverzeichnis, dessen Vorgabe davon abhängt.

### 2.3 Datenbank und Migration

pipwerk replay hat eine eigene Datenbank. Die Spezifikation (E4) erlaubt, dass die Datenbank des Datenbestands dieselbe ist; wie beide zusammenhängen, steht in Abschnitt 2.8. Das Schema von pipwerk replay wird mit Alembic versioniert. Die Migrationen liegen im Paket `pipwerk_replay.migrations` (`env.py`, `versions/v0001_initial.py`, `versions/v0002_default_source.py`) und werden mit der Installation ausgeliefert. Es gibt keine Konfigurationsdatei von Alembic mit fester URL: `migrate_database(engine)` in `migrate.py` übergibt Alembic die Verbindung der Engine (`config.attributes["connection"]`); Offline-Modus wird nicht unterstützt. `create_replay_engine()` ruft sie beim Start auf; es gibt kein `create_all`.

Revision `0001` legt an:

| Tabelle | Spalten |
| --- | --- |
| `replay_settings` | `id` (ganze Zahl, Schlüssel; höchstens eine Zeile mit `id` = 1), `language` (Text, höchstens 8 Zeichen) |
| `test_accounts` | `id` (Text, 36 Zeichen, Schlüssel), `name` (Text, höchstens 100 Zeichen), `initial_capital` (Fließkommazahl), `currency` (Text, 3 Zeichen), `leverage` (ganze Zahl), `spread_mode` (Text, höchstens 8 Zeichen), `spread_points` (Fließkommazahl, NULL erlaubt), `commission_per_lot_side` (Fließkommazahl) |

Revision `0002` (Auftrag 04) fügt `replay_settings` die Spalte `default_source` hinzu (Text, höchstens 128 Zeichen, NULL erlaubt: die Standardquelle, Abschnitt 2.7). Vorhandene Zeilen behalten ihre Sprache und haben keine Standardquelle. Test: `tests/test_config_datastock.py` (Schritt von `0001` nach `0002` mit Zeile).

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

### 2.7 Einstellungen Sprache und Standardquelle

Die Einstellungen sind betriebliche Einstellungen der Komponente, nicht benutzerbezogen und im Backend gespeichert; der Browser ist nicht autoritativ (req-ui-008). Sie liegen in einer einzigen Zeile von `replay_settings` (`id` = 1); gleichzeitiges erstes Schreiben legt sie einmal an. Sie sind interne Endpunkte unter `/api/replay/settings/` (Abschnitt 5.1), nicht Teil der öffentlichen Web-API.

- Die Sprache der Oberfläche (`de` oder `en`). Ohne gespeicherten Wert gilt Deutsch. Enthält der gespeicherte Wert keine unterstützte Sprache (technisch fehlerhafter Inhalt), schlägt das Lesen mit HTTP 503 und dem Text `The stored pipwerk replay language is invalid.` fehl; ein gültiges Schreiben ersetzt den Wert.
- Die Standardquelle (Spezifikation 5.1): die Bezeichnung des Brokers, dessen Daten ein Testlauf verwendet (zum Beispiel der Name des Handelsservers, den eine Quelle in ihren Dateien nennt). Ohne gespeicherten Wert ist sie `null`. Der Wert folgt der Regel für Namen (1 bis 128 Zeichen, keine Steuerzeichen, kein Leerzeichen am Rand, wie bei `pipwerk_marketdata`); `null` entfernt sie. Der Broker muss im Datenbestand noch nicht vorkommen (Entscheidung des Entwicklers: Die Standardquelle kann vor dem ersten Import gesetzt werden; die Vorbereitung eines Testlaufs fragt, ob Daten da sind, und beschafft sie). Ist der gespeicherte Wert kein gültiger Name, antwortet das Lesen mit HTTP 503 und `The stored pipwerk replay default source is invalid.`; ein gültiges Schreiben ersetzt ihn. Die Standardquelle ist der Broker, den die Prüfung der Vollständigkeit verwendet, wenn die Anfrage keinen nennt (Abschnitt 2.8).

### 2.8 Datenbestand

pipwerk replay bindet den Datenbestand historischer Kursdaten ein (Spezifikation E4, 5.1 bis 5.3): die Bibliothek `pipwerk_marketdata` aus `packages/market-data`, beschrieben in der [technischen Dokumentation des Datenbestands](pipwerk-marketdata.md). pipwerk replay ändert sie nicht. Das Backend hängt von ihr als Pfadabhängigkeit mit festgeschriebener Version ab (`pipwerk-marketdata==0.1.0`, `[tool.uv.sources]` in `backend/pyproject.toml`, Lockdatei `backend/uv.lock`). Die Bibliothek fordert `pydantic==2.13.5`; die Lockdatei von pipwerk replay löst deshalb mit dieser Version auf (vorher 2.14.1).

**Datenbank und Migration.** Die Datenbank des Datenbestands ist eine eigene Angabe der Startkonfiguration (`[marketdata] url`). Fehlt sie oder gleicht sie `[database] url`, ist es dieselbe Datenbank und dieselbe Engine; sonst öffnet pipwerk replay eine zweite Engine mit denselben Einstellungen. Die Migrationen beider laufen getrennt, jede in ihrer Transaktion und mit ihrer eigenen Versionstabelle: die von pipwerk replay mit `alembic_version` (Abschnitt 2.3), die des Datenbestands mit `marketdata_alembic_version`; die Tabellen des Datenbestands beginnen mit `marketdata_`. Zuerst läuft die Migration von pipwerk replay, dann die des Datenbestands (`storage.migrate_marketdata()`). Scheitert die zweite oder kennt sie die Revision nicht (Datenbank einer neueren Version), endet der Start mit `DatabaseMigrationError` von pipwerk replay und der festen Meldung der Bibliothek; Exitcode 1, wie bei der ersten.

**Aufbau der Schnittstelle (Abschnitt 5.2).** Alle Pfade liegen unter `/api/v1/market-data/`:

- `GET overview`: die Reihen (Kerzen einer Zeiteinheit, Ticks) je Broker, Instrument und Zeiteinheit mit Zahl, erstem und letztem Zeitpunkt, abgedeckten Zeiträumen und Lücken, dazu die Instrumente mit dem Zeitpunkt der neuesten Angaben. Die Berechnung der Bibliothek liest alle Zeiten jeder Reihe (`MarketDataStore.overview()`); nur die Antwort ist begrenzt (unten).
- `GET instrument`: die neuesten Angaben zu einem Instrument bei einem Broker (Parameter `broker`, `instrument`, freiwillig `as_of`); 404 ohne Angaben.
- `POST imports/json` und `POST imports/csv`: Import einer Datei.
- `POST completeness`: Vollständigkeit einer Liste benötigter Teile.
- `POST acquisitions` und `GET acquisitions/{id}`: Beschaffung (Abschnitt 2.9).

**Import.** Entscheidung des Entwicklers: Die Datei ist der Body der Anfrage, kein Formular (`multipart`). Grund: Die Oberfläche schickt eine ausgewählte Datei mit `fetch` unverändert, und pipwerk replay braucht keine weitere Abhängigkeit für Formulare. Der Medientyp ist bei JSON `application/json`, bei CSV `text/csv` (Parameter wie `charset` sind zulässig; ein anderer ergibt 415). Beide gehören nicht zu den drei Medientypen, die eine Webseite eines anderen Ursprungs ohne Vorabfrage senden kann; die Begründung ist die des JSON-Bodys (Abschnitt 5.2). Bei CSV nennt die Anfrage in den Abfrageparametern, was die Datei nicht enthält (Pydantic, zusätzliche Parameter abgelehnt): `kind` (`candles` oder `ticks`), `broker`, `instrument`, bei Kerzen `time_unit`, und `timezone` (Name der Zeitzone nach IANA). Das Ergebnis ist das der Bibliothek: Art, Broker, Instrument, Zeiteinheit, übernommene Zeilen (`accepted`), davon ersetzte (`replaced`), Zeitraum der übernommenen Zeilen (`period_start`, `period_end`) und die abgelehnten Zeilen mit Nummer (bei CSV die Zeile, die Kopfzeile ist Zeile 1; bei JSON die Stelle des Eintrags) und Grund (`rejected`, höchstens `max_reported_rejections`, gezählt in `rejected_count`). Eine Datei, die als Ganzes abgelehnt wird (kein JSON, falsche Spalten, unbekannte Zeitzone, keine Zeilen, zu viele Zeilen), ändert nichts und ergibt HTTP 422 mit `{"detail": "The file is refused.", "code": <Kennung der Bibliothek>, "message": <fester Text>}`. Der feste Text nennt Felder, nie Inhalt der Datei. Ein Fehler der Datenbank ergibt HTTP 503 `The data stock could not be read or changed.`; das Protokoll nennt nur die Art der Ursache.

**Vollständigkeit.** Die Anfrage nennt die benötigten Teile (`parts`, 1 bis `max_parts_per_request`): Kerzen (`kind` `candles`, `instrument`, `time_unit`, `start`, `end`), Ticks (`kind` `ticks`, `instrument`, `start`, `end`) oder die Angaben zu einem Instrument (`kind` `instrument`, `instrument`). Zeiten sind Text nach ISO 8601 mit Zeitzone (eine Zahl und eine Zeit ohne Zeitzone werden abgelehnt), `start` liegt vor `end`, beide zwischen 1970-01-01 und 2100-01-01 UTC (die Grenzen der Bibliothek). Der Broker ist der Wert von `broker` der Anfrage oder, wenn er fehlt, die Standardquelle (Abschnitt 2.7); gibt es keine von beiden, antwortet pipwerk replay mit HTTP 409 `No broker is given and no default source is set.` Entscheidung des Entwicklers: Das Feld `broker` ist freiwillig, damit eine Prüfung auch für einen anderen Broker als die Standardquelle möglich ist, ohne die Einstellung zu ändern. Die Antwort nennt je Teil in der Reihenfolge der Anfrage `needed` (der Teil, wie angefragt), `present` (vorhandene Zeiträume), `missing` (fehlende Zeiträume mit Grund `not_covered` oder `gap`, Bedeutung wie in der Dokumentation des Datenbestands) und `complete`. Zeiten, in denen der Markt geschlossen ist (Wochenende, Pausen), zählen als vorhanden. Bei den Angaben zu einem Instrument sind `present` und `missing` leer; `complete` sagt, ob Angaben da sind.

**Begrenzungen gegen Überlast (Spezifikation 11).** Alle sind Parameter der Startkonfiguration mit den Vorgaben der Tabelle in Abschnitt 2.2.

| Grenze | Wirkung |
| --- | --- |
| `max_upload_bytes` | Größe der hochgeladenen Datei. `BodyLimitMiddleware` prüft sie für genau die zwei Pfade des Imports vor dem Lesen (HTTP 413 mit `{"detail": "The request body is larger than the limit."}`); für alle anderen Pfade gilt `max_body_bytes` (2 MiB). Die Bibliothek prüft die Größe noch einmal. |
| `max_rows` | Zeilen einer Datei, abgelehnte eingerechnet: Die Bibliothek lehnt die Datei als Ganzes ab (`too_many_rows`, HTTP 422). |
| `max_concurrent_imports` | Zahl der Importe (JSON und CSV zusammen), die gleichzeitig laufen. Der nächste wird nicht gewartet, sondern mit HTTP 429 `Too many imports are running. Try again later.` abgewiesen. |
| `max_listed_items` | Umfang der Antworten: Die Übersicht liefert höchstens so viele Reihen und so viele Instrumente (`limit`, `offset`; ein größeres `limit` ergibt HTTP 422); die Liste der abgedeckten und der fehlenden Zeiträume einer Reihe und je Teil der Vollständigkeit wird abgeschnitten und in `covered_count`, `missing_count`, `present_count` vollständig gezählt. |
| `max_parts_per_request` | Teile einer Anfrage nach Vollständigkeit oder Beschaffung; mehr ergibt HTTP 422 (`too_long` an der Stelle `parts`). |
| `max_reported_rejections` | abgelehnte Zeilen, die das Ergebnis nennt. |

Die hochgeladene Datei wird nie ausgeführt: Sie wird mit der Bibliothek gelesen (JSON mit dem Schema, CSV als Text), jede Zeile geprüft, und nur das Ergebnis der Prüfung wird gespeichert.

### 2.9 Beschaffung

pipwerk replay stößt die Beschaffung von Hand an (Spezifikation 5.4); der Start eines Testlaufs mit der Beschaffung aller fehlenden Teile kommt mit `wp03` und verwendet dieselbe Schnittstelle. Eine Quelle ist `pipwerk-fetch-mt5` oder ein Programm mit derselben Schnittstelle (`contracts/api/pipwerk-fetch/v1/`). pipwerk replay fragt sie mit `POST /api/v1/fetch` nach den Teilen und importiert die Dateien, die sie liefert, mit der Bibliothek (`MarketDataStore.import_json`), also mit den Prüfungen und Grenzen jedes Imports.

**Auftrag mit Abfrage des Stands (Entscheidung des Entwicklers).** Die Beschaffung läuft als Auftrag im Hintergrund, nicht in einem Aufruf. Grund: Eine Anfrage an die Quelle kann Minuten dauern (die Quelle liest bis zu `max_reads_per_request` Abschnitte von MetaTrader 5, bei Ticks etwa 125 Tage), und mehrere fehlende Teile dauern entsprechend länger; ein Aufruf bliebe so lange offen, ohne dass die Oberfläche Fortschritt zeigen könnte. Die Entscheidung gilt für jede Größe, auch für einen einzelnen Teil, damit die Oberfläche nur einen Weg kennt (Ansicht „Kursdaten beim Start“ in `wp03`).

- `POST /api/v1/market-data/acquisitions` mit `{"parts": [...]}` (1 bis `max_parts_per_request` Teile in der Form der Vollständigkeit, Abschnitt 2.8; ein Teil ist die Beschaffung von Hand, mehrere sind die fehlenden Teile eines Testlaufs) startet den Auftrag und antwortet mit HTTP 202 und seinem Stand.
- `GET /api/v1/market-data/acquisitions/{id}` liefert den Stand: `state` (`running`, bis jeder Teil gelungen oder fehlgeschlagen ist, dann `finished`), `created_at`, `finished_at` und je Teil `request` (wie angefragt), `state` (`queued`, `running`, `succeeded`, `failed`), bei Erfolg `result` (das Ergebnis des Imports wie in Abschnitt 2.8) und `omitted_count` (Zeilen, die die Quelle ausgelassen hat), bei Misserfolg `error`.
- Die Teile laufen in der Reihenfolge der Anfrage, einer nach dem anderen. Ein fehlgeschlagener Teil hält die anderen nicht an. Ein Teil, der wegen der Prüfung des Imports Zeilen ablehnt, ist gelungen; die abgelehnten Zeilen stehen im Ergebnis.
- Der Stand liegt im Speicher des Prozesses. Die letzten `max_kept_acquisitions` bleiben (die ältesten beendeten gehen zuerst; ein laufender nie); nach einem Neustart sind alle weg, und `GET` antwortet mit 404 `The acquisition does not exist.`. Daten, die ein Auftrag schon importiert hat, bleiben im Datenbestand.
- Es laufen höchstens `max_concurrent_acquisitions` Aufträge gleichzeitig; der nächste wird mit HTTP 429 `Too many acquisitions are running. Try again later.` abgewiesen.
- Ist keine Quelle eingerichtet (Abschnitt 2.2), antwortet `POST` mit HTTP 409 und `{"detail": "No source is set up.", "code": "no_source", "reason": "Keine Quelle eingerichtet"}`; alle anderen Endpunkte arbeiten.

**Keine Zerlegung großer Zeiträume (Entscheidung des Entwicklers).** Die Quelle antwortet auf einen zu großen Zeitraum mit `range_too_large` („bitte einen kleineren Zeitraum anfragen“). pipwerk replay zerlegt den Zeitraum nicht, sondern gibt den Fehler weiter. Grund: Die richtige Größe eines Abschnitts hängt von der Quelle ab (`max_rows_per_request`, `max_reads_per_request`) und ist keine Angabe, die pipwerk replay hat; eine Zerlegung wäre geraten. Wer Kerzen M1 für Monate beschafft, wählt kleinere Zeiträume. Das ist ein offener Punkt für `wp03` (Abschnitt 8).

**Fehler eines Teils.** `error` hat `code`, `reason` und, beim Import, `file_error`. Bei einem Fehler der Quelle sind `code` und `reason` die der Quelle, unverändert (`reason` auf eine Zeile von höchstens 300 Zeichen gekürzt, Steuerzeichen durch Leerzeichen ersetzt). Eine Antwort, die nicht zur Schnittstelle passt, ist `source_response_invalid`.

| Kennung | Herkunft | Text (`reason`) |
| --- | --- | --- |
| `unauthorized`, `host_not_allowed`, `body_too_large`, `invalid_request`, `not_found`, `symbol_unknown`, `no_data`, `range_too_large`, `terminal_unavailable`, `broker_error`, `broker_unknown`, `invalid_broker_data`, `internal_error` | die Quelle | der Text der Quelle (Abschnitt 6.4 von [pipwerk-fetch-mt5](pipwerk-fetch-mt5.md)), zum Beispiel „Symbol beim Broker unbekannt“ |
| `source_unreachable` | pipwerk replay | Quelle nicht erreichbar (keine Verbindung, Zeitüberschreitung nach `timeout_seconds`, abgebrochene Verbindung) |
| `source_response_invalid` | pipwerk replay | Antwort der Quelle ungültig (kein JSON, falsche Felder, eine andere Datei als angefragt, unbekannte Kennung, Umleitung) |
| `source_response_too_large` | pipwerk replay | Antwort der Quelle zu groß (mehr als `max_upload_bytes` plus 1 MiB) |
| `import_refused` | pipwerk replay | Der Import hat die Datei der Quelle abgelehnt; `file_error` nennt die Kennung der Bibliothek (zum Beispiel `no_rows`, `too_many_rows`) |
| `data_store_error` | pipwerk replay | Der Datenbestand konnte nicht geändert werden |
| `acquisition_failed` | pipwerk replay | Die Beschaffung ist fehlgeschlagen (ein Fehler im Programm; das Protokoll nennt nur seine Art) |

Die Texte sind deutsch wie die der Quelle, weil die Oberfläche sie dem Anwender zeigt; die übrigen Fehlertexte der Web-API sind englisch und fest (Abschnitt 5.2). Die Liste der Kennungen der Quelle steht in `acquisition.SOURCE_ERROR_CODES`; ein Test vergleicht sie mit der Quelle (`pipwerk_fetch_mt5.errors.ERRORS`).

**Prüfung der Antwort der Quelle.** `HttpSourceClient` liest die Antwort in Stücken und bricht bei mehr als `max_upload_bytes` plus 1 MiB ab (`ENVELOPE_ALLOWANCE`, Platz für die Hülle und die ausgelassenen Zeilen). Gültig ist nur `{"file": …, "omitted_count": …, "omitted": […]}` ohne weitere Felder, `omitted_count` eine ganze Zahl ab 0. Die Datei muss die angefragte sein (`kind`, `instrument`, bei Kerzen `time_unit`); alles andere prüft der Import. Eine Fehlerantwort ist `{"error": {"code": …, "reason": …}}` mit einer bekannten Kennung und einem Text.

**Schutz des Schlüssels (Spezifikation 5.4, 11).** Der Schlüssel steht nur in der Startkonfiguration. Er geht nur in den Kopf `Authorization: Bearer <Schlüssel>` der Anfrage an die Quelle. Er erscheint nicht in der Datenbank (nie gespeichert), in keiner Antwort der Web-API (auch nicht in `/openapi.json`, `/docs` und den Fehlern), in keinem Protokoll und in keiner Fehlermeldung des Starts:

- `SourceSettings.key` ist von `repr()` ausgeschlossen, `HttpSourceClient.__repr__` nennt nichts.
- Ein Fehler der Verbindung wird nicht mit seinem Text weitergegeben (er kann die Adresse der Quelle nennen); das Protokoll von pipwerk replay nennt nur seine Art („The source could not be reached (ConnectError).“). Ein Fehler im Programm ebenso („An acquisition failed unexpectedly (RuntimeError).“).
- Eine Umleitung der Quelle wird nicht verfolgt (`follow_redirects=False`); der Schlüssel geht so nie an eine andere Adresse.
- Die Bibliotheken `httpx2` und `httpcore2` protokollieren auf der Stufe `DEBUG` die Adresse und den Port der Quelle. Der Test setzt alle Protokolle auf `DEBUG` und findet den Schlüssel in keinem; das ist ein Nachweis für diese Versionen (Abschnitt 7), keine Zusage der Bibliotheken.

Tests (`tests/test_acquisition.py`): `test_the_key_appears_in_no_answer_no_log_no_file_and_no_text` (Erfolg, Fehler der Quelle, Quelle aus, falscher Schlüssel, Quelle nicht erreichbar; Antworten, Protokoll auf `DEBUG`, Ausgabe und Datenbankdateien) und `test_end_to_end_with_pipwerk_replay_and_the_source_as_programs` (beide Programme über echte Verbindungen, Ausgabe von pipwerk replay und Datenbank).

**Die Quelle in den Tests.** pipwerk replay testet gegen die nachgebildete Quelle `pipwerk_fetch_mt5.fake_source` (Abschnitt „Nachgebildete Quelle“ von [pipwerk-fetch-mt5](pipwerk-fetch-mt5.md)). `components/pipwerk-fetch-mt5` ist dafür eine Pfadabhängigkeit der Entwicklungsgruppe (`[dependency-groups] dev`); zur Laufzeit braucht pipwerk replay sie nicht. Die meisten Tests nutzen die Anwendung der Quelle ohne Netz (der Testclient von FastAPI ist der HTTP-Client von `HttpSourceClient`); ein Test startet die Quelle als Programm auf einem Anschluss.

### 2.10 Stand der Komponente

`GET /api/replay/revision` nennt den Stand, aus dem pipwerk replay läuft, wie `/api/studio/revision` bei pipwerk Studio ([technische Dokumentation pipwerk Studio](pipwerk-studio.md), Abschnitte 2.6 und 5.1): `revision` (die ersten 7 Zeichen des Git-Commits), `commit` (40 Zeichen) und `committed_at` (Datum des Commits, ISO 8601 mit Zeitzone); jedes Feld kann `null` sein. Die Invarianten sind die von pipwerk Studio: `revision` ist genau dann `null`, wenn `commit` `null` ist; `revision` ist die Kurzform von `commit`; `committed_at` ist nur bei vorhandenem `commit` nicht `null`. Das Modell `ReplayRevision` erzwingt sie.

`revision.py` (nach `revision.py` von pipwerk Studio) führt einmal beim Erzeugen der Anwendung `git -C <Verzeichnis des Pakets> rev-parse HEAD` und, nur bei gültigem Ergebnis, `git -C … log -1 --no-show-signature --format=%cI <commit>` aus, als Unterprozess mit fester Argumentliste, ohne Shell, mit 5 Sekunden Zeitbegrenzung. Gültig ist nur ein Hash aus genau 40 Kleinbuchstaben und Ziffern des 16er-Systems und ein Datum mit Zeitzone. Jeder Fehler (Git fehlt, kein Arbeitsverzeichnis von Git, Zeitüberschreitung, Exitcode ungleich 0, ungültige Ausgabe) ergibt „nicht ermittelbar“ (`null`) mit genau einer Warnung ohne Pfad, Ausgabe von Git und Commit; die Anwendung startet und arbeitet. Ein Datum, das sich nicht ermitteln lässt, lässt den Commit bestehen. `create_app()` hat dafür die Parameter `revision_lookup` und `commit_date_lookup` (für Tests). Tests: `tests/test_revision.py`.

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

Ohne `-c` wird einer der Suchorte aus Abschnitt 2.2 verwendet. `--host` und `--port` überschreiben die Einträge der Startkonfiguration; der Port muss eine ganze Zahl von 1 bis 65535 sein. Die Beschreibung der Web-API zeigt `http://127.0.0.1:8000/docs`. Die lokal erzeugten Dateien `backend/pipwerk-replay.ini` (sie enthält den Schlüssel der Quelle), `backend/pipwerk-replay.db` und `backend/pipwerk-marketdata.db` (jeweils mit `-journal`, `-wal`, `-shm`) schließt `components/pipwerk-replay/.gitignore` aus; versioniert bleibt nur `backend/pipwerk-replay.example.ini`.

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
6. Legt unter `components/pipwerk-replay/.testenv/` eine INI-Startkonfiguration mit einer eigenen SQLite-Datei an (nur der Abschnitt `[database]`: der Datenbestand liegt in derselben Datei, und es ist keine Quelle eingerichtet, die Beschaffung antwortet also mit „Keine Quelle eingerichtet“; offener Punkt 2 in Abschnitt 8) und startet das Backend mit `-c` auf `127.0.0.1:<backend-port>`; mit `--host` mit `--allowed-host <Wert>`, bei `0.0.0.0` und `::` zusätzlich mit `--allowed-host '*ip'`. Mit Oberfläche startet es danach `vite preview` auf `<host>:<frontend-port>`; `vite preview` leitet Anfragen unter `/api` an das Backend weiter (Umgebungsvariable `PIPWERK_REPLAY_BACKEND_URL`, vom Skript gesetzt).
7. Wartet, bis `/api/health` `{"status": "ok"}` liefert (Zeitbegrenzung 120 Sekunden): mit Oberfläche über den Port der Oberfläche, sonst am Port des Backends. Danach meldet es die Adresse.

Ohne Verzeichnis `frontend/` läuft nur das Backend. Der Parameter `--frontend-port` ist trotzdem Pflicht und wird geprüft, damit sich der Aufruf nicht ändert, wenn Auftrag 05 die Oberfläche ergänzt; der Port wird nicht belegt. `start` meldet dann `pipwerk replay is running: backend only, http://127.0.0.1:<backend-port>/docs (this commit has no user interface)`.

Abbruchfälle von `start` (Exitcode ungleich 0, Ursache auf der Fehlerausgabe): ungültige oder fehlende Parameter; das Verzeichnis liegt nicht in einem Arbeitsverzeichnis von Git; eine nicht committete Änderung oder nicht ignorierte neue Datei (die Meldung nennt die ersten Dateien; bei diesen beiden Fällen wurde nichts angelegt); ein Programm fehlt, es läuft schon eine Testumgebung oder ein Port ist belegt; Installation oder Bau scheitert, ein Prozess endet beim Start oder `/api/health` antwortet nicht rechtzeitig (das Skript gibt die letzten Zeilen der Protokolle aus, beendet die gestarteten Prozesse und entfernt `.testenv/`).

`status` nennt, ob die Testumgebung läuft, und ihre Adressen. Exitcode 0 bei laufender, 1 bei nicht oder nur teilweise laufender Testumgebung. Ohne Oberfläche gibt es genau den Zustand „läuft“ mit dem Zusatz `(backend only, this commit has no user interface)`. `stop` beendet die Prozesse (zuerst SIGTERM, nach 10 Sekunden SIGKILL) und entfernt `.testenv/`, also auch die Datenbank mit den Testkonten und Einstellungen. Zustand, Prozesskennungen, Protokolle (`backend.log`, `frontend.log`), die INI und die Datenbank liegen in `components/pipwerk-replay/.testenv/`, das in `components/pipwerk-replay/.gitignore` steht. Test: `backend/tests/test_testenv.py` (Abschnitt 6.1).

Adressen: Oberfläche (mit Oberfläche) `http://<host>:<frontend-port>/`; Schnittstellenbeschreibung des Backends `http://127.0.0.1:<backend-port>/docs` und `/openapi.json`, nur auf `127.0.0.1` des Rechners der Testumgebung. Das Risiko bei `--host` außerhalb der Loopback-Adresse ist das von pipwerk Studio: Ohne Authentisierung sind alle Endpunkte, auch die schreibenden, für jeden im Netz erreichbar, sobald die Oberfläche erreichbar ist; eine solche Adresse ist nur in einem Netz zu verwenden, dem alle Teilnehmer vertraut werden.

## 5. HTTP-Schnittstelle

### 5.1 Technischer Endpunkt und interne Endpunkte

| Methode | Pfad | Erfolgsantwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/health` | HTTP 200 mit `{"status": "ok"}` | technische Prüfung, ob die Oberfläche ihr Backend erreicht |
| `GET` | `/api/replay/settings/language` | `200` mit `{"language": "de"}` oder `"en"` | Einstellung Sprache lesen; ohne gespeicherten Wert `de` |
| `PUT` | `/api/replay/settings/language` | `200` mit `{"language": …}` | Sprache speichern; Body ausschließlich `{"language": "de"}` oder `"en"` |
| `GET` | `/api/replay/settings/default-source` | `200` mit `{"broker": "<Name>"}` oder `{"broker": null}` | Standardquelle lesen; ohne gespeicherten Wert `null` |
| `PUT` | `/api/replay/settings/default-source` | `200` mit `{"broker": …}` | Standardquelle speichern; Body ausschließlich `{"broker": "<Name>"}` oder `{"broker": null}` (entfernt sie) |
| `GET` | `/api/replay/revision` | `200` mit `{"revision": "<7 Zeichen>", "commit": "<40 Zeichen>", "committed_at": "<ISO 8601 mit Zeitzone>"}`; jedes Feld kann `null` sein (Abschnitt 2.10) | Stand lesen |

Entscheidung zu Abschnitt 7 der Spezifikation („Interne Endpunkte für Einstellungen wie in pipwerk Studio“) und zu Auftrag 01: Die Einstellungen und der Stand sind interne Endpunkte unter `/api/replay/`, wie `/api/studio/` bei pipwerk Studio. Sie sind interne Verbindungen innerhalb von pipwerk replay (seine Oberfläche nutzt sie), kein Bestandteil der öffentlichen Web-API und keine versionierte Definition der Schnittstellen unter `contracts/`; sie bleiben in `/docs` sichtbar, stehen aber nicht in der Datei unter `contracts/api/`. Die früheren Pfade `GET` und `PUT /api/v1/settings` aus Auftrag 01 sind entfallen, samt ihrer Beschreibung; sie antworten wie jeder unbekannte Pfad mit `404`. Die Regeln für Bodys, Größe, Medientyp und Fehler sind die der öffentlichen Web-API (Abschnitt 5.2), `BodyLimitMiddleware` begrenzt auch den Präfix `/api/replay/` auf `max_body_bytes`, und die Prüfung des Kopfs `Host` gilt auf jedem Pfad. Die Modelle `ReplayLanguage`, `ReplayLanguageUpdate`, `DefaultSource`, `DefaultSourceUpdate` und `ReplayRevision` lassen keine zusätzlichen Felder zu. Der technische Endpunkt `/api/health` gehört ebenfalls nicht zur Beschreibung unter `contracts/api/`.

### 5.2 Web-API unter `/api/v1/`

| Methode | Pfad | Erfolgsantwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/v1/accounts` | `200` mit `{"items": [Account, …]}` | alle Testkonten, nach Namen sortiert |
| `POST` | `/api/v1/accounts` | `201` mit `Account` | legt ein Testkonto unter einer neuen Kennung an |
| `GET` | `/api/v1/accounts/{id}` | `200` mit `Account` | liest ein Testkonto |
| `PUT` | `/api/v1/accounts/{id}` | `200` mit `Account` | ersetzt alle Werte eines Testkontos; legt nie eines an |
| `DELETE` | `/api/v1/accounts/{id}` | `204` ohne Body | löscht ein Testkonto, auch das Standard-Testkonto |
| `GET` | `/api/v1/market-data/overview` | `200` mit `Overview` | Reihen mit Zeiträumen und Lücken, Instrumente (Abfrage `offset`, `limit`) |
| `GET` | `/api/v1/market-data/instrument` | `200` mit `InstrumentInfo` | neueste Angaben zu einem Instrument (Abfrage `broker`, `instrument`, freiwillig `as_of`) |
| `POST` | `/api/v1/market-data/imports/json` | `200` mit `ImportResult` | Import einer JSON-Datei (Body: die Datei, `application/json`) |
| `POST` | `/api/v1/market-data/imports/csv` | `200` mit `ImportResult` | Import einer CSV-Datei (Body: die Datei, `text/csv`; Abfrage `kind`, `broker`, `instrument`, `time_unit`, `timezone`) |
| `POST` | `/api/v1/market-data/completeness` | `200` mit `Completeness` | benötigt, vorhanden, fehlt für eine Liste von Teilen |
| `POST` | `/api/v1/market-data/acquisitions` | `202` mit `Acquisition` | startet die Beschaffung von Teilen bei der Quelle |
| `GET` | `/api/v1/market-data/acquisitions/{id}` | `200` mit `Acquisition` | Stand einer Beschaffung, Teil für Teil |

`{id}` ist eine UUID. Die Modelle `AccountInput`, `Account`, `AccountList`, die des Datenbestands (`marketdata_models.py`: `Overview`, `SeriesOverview`, `InstrumentEntry`, `InstrumentInfo`, `ImportResult`, `RejectedRow`, `FileRefused`, `CompletenessRequest`, `Completeness`, `PartCompleteness`, `CandlesPart`, `TicksPart`, `InstrumentPart`, `AcquisitionRequest`, `Acquisition`, `AcquisitionPart`, `PartFailure`, `AcquisitionRefused`, `Period`, `MissingPeriod`) und für Fehler `ApiError` und `InvalidRequest` lassen keine zusätzlichen Felder zu. Die Eingaben des Datenbestands sind Pydantic-Modelle mit `extra="forbid"`: der Body der Vollständigkeit und der Beschaffung (strenge Typen; eine Zeit ist Text nach ISO 8601 mit Zeitzone, eine Zahl oder eine Zeit ohne Zeitzone wird abgelehnt) und die Abfrageparameter von Übersicht, Angaben zum Instrument und CSV-Import (ein unbekannter Parameter ergibt `422`).

Regeln (wie bei pipwerk Studio, `api_support.py`):

- Ein Body ist JSON mit dem Medientyp `application/json` (auch mit Parametern und in beliebiger Schreibweise), sonst `415`. Eine Webseite eines anderen Ursprungs kann so nicht mit einem einfachen Formular schreiben; gegen DNS-Rebinding schützt die Prüfung des Kopfs `Host` (Abschnitt 2.4).
- Der Body wird als Ganzes gelesen und streng geprüft: Ein Body, der kein JSON-Objekt ist, ein doppelter Schlüssel, `NaN` und `Infinity`, ein falscher Typ, ein zusätzliches Feld und jeder Wert außerhalb seines Bereichs ergeben `422`. Die Antwort nennt den Ort jedes Fehlers im Body und seine Art, nie den Wert.
- Die Größe des Bodys ist begrenzt (`max_body_bytes` der Startkonfiguration, Vorgabe 2 MiB), sonst `413`. `body_limit.py` (`BodyLimitMiddleware`) prüft das für alle Anfragen unter `/api/v1/` und `/api/replay/`, bevor die Anwendung den Body liest: Nennt `Content-Length` mehr als das Limit, wird sofort mit `413` geantwortet; sonst zählt die Middleware die ankommenden Bytes, ohne `Content-Length` zu trauen, und bricht beim Überschreiten ab. Die zwei Pfade des Imports haben ein eigenes Limit, `max_upload_bytes` (Abschnitt 2.8; die Middleware kennt Abweichungen für genau einen Pfad, `overrides`).
- Eine hochgeladene Datei (Import) ist der Body selbst und hat ihren Medientyp (`application/json` oder `text/csv`, sonst `415` mit `{"detail": "The request body must be a file of the media type <Medientyp>."}`). Beide gehören nicht zu den Medientypen, die ein einfaches Formular einer fremden Webseite senden kann.
- Die Fehlertexte sind fest. Sie nennen weder Pfade noch Ausnahmetexte noch Werte.

| Status | Fall | Body |
| --- | --- | --- |
| 400 | der Kopf `Host` fehlt oder nennt keinen erlaubten Namen (auf jedem Pfad) | `{"detail": "The Host header of the request is not allowed."}` |
| 404 | unbekannte Kennung eines Testkontos | `{"detail": "The test account does not exist."}` |
| 404 | keine Angaben zu diesem Instrument | `{"detail": "There are no data of this instrument."}` |
| 404 | unbekannte Beschaffung | `{"detail": "The acquisition does not exist."}` |
| 409 | Vollständigkeit ohne Broker und ohne Standardquelle | `{"detail": "No broker is given and no default source is set."}` |
| 409 | Beschaffung ohne eingerichtete Quelle | `{"detail": "No source is set up.", "code": "no_source", "reason": "Keine Quelle eingerichtet"}` |
| 413 | Body über dem Limit | `{"detail": "The request body is larger than the limit."}` |
| 415 | der Medientyp ist nicht `application/json` | `{"detail": "The request body must be JSON (Content-Type: application/json)."}` |
| 415 | der Medientyp einer hochgeladenen Datei stimmt nicht | `{"detail": "The request body must be a file of the media type <Medientyp>."}` |
| 422 | Body passt nicht zum Schema | `{"detail": "The request body does not fit the schema.", "errors": [{"location": [...], "type": "<Fehlertyp von Pydantic>"}]}`; `location` ist `[]` bei einem Body, der kein gültiges JSON ist (`type` `json_invalid`); sonst der Ort des Fehlers im Body |
| 422 | mehr Teile als `max_parts_per_request`, `limit` über `max_listed_items` | wie oben, mit `{"location": ["parts"], "type": "too_long"}` beziehungsweise `{"location": ["query", "limit"], "type": "less_than_equal"}` |
| 422 | Abfrageparameter oder `{id}` passen nicht | `{"detail": "The request is invalid.", "errors": [{"location": ["path", "id"], "type": "uuid_parsing"}]}` (bei Abfrageparametern `["query", "<Name>"]`) |
| 422 | hochgeladene Datei als Ganzes abgelehnt | `{"detail": "The file is refused.", "code": "<Kennung>", "message": "<fester Text>"}` (Abschnitt 2.8) |
| 429 | zu viele gleichzeitige Importe | `{"detail": "Too many imports are running. Try again later."}` |
| 429 | zu viele gleichzeitige Beschaffungen | `{"detail": "Too many acquisitions are running. Try again later."}` |
| 503 | die gespeicherte Sprache ist ungültig (nur Lesen der Einstellung) | `{"detail": "The stored pipwerk replay language is invalid."}` |
| 503 | die gespeicherte Standardquelle ist ungültig (Lesen der Einstellung und Vollständigkeit ohne `broker`) | `{"detail": "The stored pipwerk replay default source is invalid."}` |
| 503 | Fehler der Datenbank des Datenbestands | `{"detail": "The data stock could not be read or changed."}` |

Höchstens 50 Einträge in `errors`; ein Text im Ort wird bei mehr als 100 Zeichen gekürzt. Eine andere Methode auf diesen Pfaden antwortet mit `405`, ein unbekannter Pfad mit `404`. Die Fehler der Beschaffung eines einzelnen Teils stehen nicht hier, sondern im Stand der Beschaffung (Abschnitt 2.9).

### 5.3 Beschreibung der Web-API unter `contracts/api/`

Die Beschreibung (OpenAPI 3.1) liegt unter `contracts/api/pipwerk-replay/v1/openapi.json`. Sie wird aus der Anwendung erzeugt (`pipwerk_replay.contract`): `public_description()` beschränkt sie auf die Pfade unter `/api/v1/` und die Schemata, die diese Pfade verwenden; `/api/health` und die internen Endpunkte unter `/api/replay/` gehören nicht hinein. Sie beschreibt die Testkonten und den Datenbestand mit Beschaffung. `info.version` bleibt `1.0.0`: Der Wegfall von `/api/v1/settings` aus Auftrag 01 und die neuen Pfade gehören zum selben Arbeitspaket `wp02`, das noch nicht abgenommen ist. Die hochgeladene Datei eines Imports steht als Body mit seinem Medientyp (`string`, `format: binary`), die Abfrageparameter des CSV-Imports als Parameter. Titel ist „pipwerk replay“, `info.version` ist die Version der Web-API (`1.0.0`). Die Anwendung wird mit `separate_input_output_schemas=False` erzeugt. Der Body der Anfragen ist mit `openapi_extra` beschrieben (das Schema des Modells steht an der Stelle des Bodys), weil der Body vom Modul gelesen und geprüft wird. Der Befehl, der die Datei neu erzeugt (im Verzeichnis `components/pipwerk-replay/backend`):

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
| `test_config_datastock.py` | Einträge von `[marketdata]` und `[source]`: Vorgaben, jeder Eintrag, jeder ungültige Wert, Adresse und Schlüssel (gültig, ungültig, nur eines von beiden), keine Wiederholung eines Werts in Fehlermeldungen, `repr()` ohne Schlüssel, Syntaxfehler nur mit Zeilennummer, Beispieldatei; die Einstellungen kommen in der Anwendung an; eine oder zwei Datenbanken, getrennte Migrationen, Schritt von Revision `0001` nach `0002`, neuere Version des Datenbestands |
| `test_marketdata_api.py` | Datenbestand: Import JSON und CSV (Ergebnis, Ersetzen, abgelehnte Zeilen mit Grund, Ablehnung als Ganzes, Zeilen- und Größengrenze, Medientypen, jede ungültige Abfrage), Begrenzung gleichzeitiger Importe, Übersicht (Lücken, Ausschnitt, Obergrenzen), Angaben zum Instrument, Vollständigkeit (jede Art Teil, Broker, Standardquelle, Grenzen, ungültige Anfragen) |
| `test_acquisition.py` | Beschaffung gegen die nachgebildete Quelle: Kerzen, Ticks, Angaben, mehrere Teile, jeder Fehlergrund der Quelle, „Keine Quelle eingerichtet“, „Quelle nicht erreichbar“, jede Kennung der Quelle, ungültige Antworten, Anfrage an die Quelle, Import, der Zeilen oder die ganze Datei ablehnt, Fehler der Datenbank, Grenzen (gleichzeitig, behalten, Teile), der Schlüssel nirgends, Ende zu Ende mit beiden Programmen |
| `test_marketdata_contract.py` | Beschreibung des Datenbestands: Aufzählungen gleich denen der Bibliothek, Kennungen der Quelle, Body und Parameter der Importe, Teile mit `kind`, zusätzliche Felder abgelehnt |
| `test_internal_api.py` | interne Endpunkte: Standardquelle (Vorgabe, Schreiben, Entfernen, ungültige Bodys, 503 und Reparatur), Medientyp, Methoden, Begrenzung des Bodys, Kopf `Host`, keine Aufnahme in die Beschreibung |
| `test_revision.py` | Stand: Ermittlung, jeder Fehlerweg, Warnungen ohne Pfad und Commit, einmalige Ermittlung, echtes Git, Antwortmodell mit Invarianten |
| `test_cli.py` | Start ohne gültige INI, nicht nutzbare URL, ungültiger Eintrag, Datenbank einer neueren Version, `--host` und `--port` gegen die Konfiguration, `create_app()` ohne Konfiguration |
| `test_host_check.py` | Kopf `Host`: erlaubte und abgewiesene Namen, ungültige Köpfe, jeder Pfad, Reihenfolge vor der Begrenzung des Bodys, Liste aus Konfiguration und Kommandozeile |
| `test_body_limit.py` | Begrenzung des Bodys auf der Ebene von ASGI und an der Web-API, auch mit anderem Limit und mit eigenem Limit für einen Pfad |
| `test_docs_page.py` | `/docs`: feste Version, `integrity`, nichts anderes von außen |
| `test_migrations.py`, `test_memory_databases.py` | Alembic: neue und aktuelle Datenbank (Revision `0002`), neuere Version, Rücknahme bei Fehler, Schema gleich dem ORM-Modell, Datenbanken im Speicher |
| `test_accounts_service.py` | Standard-Testkonto: erster Start, zweiter Start, Änderung, Löschen und Neustart, gleichnamiges Konto des Anwenders, gleichzeitige Starts, beschädigte Zeile |
| `test_accounts_api.py` | Testkonten: alle Vorgänge der Web-API und jeder Fehlerfall der Prüfung (jedes Feld mit jedem Fehler, fehlende und zusätzliche Felder, Name, Regel für den Spread, JSON-Fehler, Medientyp, Kennung, Methoden, Fehlerformat) |
| `test_settings.py` | Einstellung Sprache (`/api/replay/settings/language`): Vorgabe, Lesen, Schreiben, ungültige Bodys, 503 und Reparatur, Neustart des Prozesses, kein Pfad `/api/v1/settings` |
| `test_contract.py` | Beschreibung unter `contracts/api/`: gleich der erzeugten, Abweichung gefunden, Pfade (nur `/api/v1/`), Schemata, Befehl |
| `test_testenv.py` | Testumgebungsskript (Abschnitt 4a): Prüfung auf nicht committete Änderungen, Parameter, Ports, nur Backend ohne `frontend/`, Oberfläche mit `frontend/`, erlaubte Namen, Ablauf `start`, `status`, `stop` |
| `test_health.py` | `/api/health`, 405, 404, Name der Anwendung |

`test_testenv.py` arbeitet auf einem Abbild der versionierten Dateien (`LICENSE`, `components/pipwerk-replay/**`) in einem temporären Verzeichnis mit Platzhaltern für `uv`, `npm` und `npx`; die Tests werden ohne installiertes Git und außerhalb eines Git-Arbeitsverzeichnisses mit Begründung übersprungen. Er liest die versionierten Dateien aus Git: Neue Dateien müssen mit `git add` vorgemerkt sein, damit das Abbild sie enthält.

Die Prüfung mit `ruff` und `mypy` entspricht der von pipwerk Studio (`strict = true`, Regeln `E`, `W`, `F`, `I`, `N`, `UP`, `B`, `S`, `A`, `C4`, `SIM`, `RUF`, Zeilenlänge 100).

## 7. Abhängigkeiten

Laufzeit (festgeschrieben in `backend/uv.lock`): `alembic`, `fastapi` (mit `pydantic` und `starlette`), `httpx2` (HTTP-Client zur Quelle; vorher nur Testclient von FastAPI, deshalb aus der Entwicklungsgruppe in die Laufzeit verschoben), `pipwerk-marketdata` (Pfadabhängigkeit `packages/market-data`, Version `==0.1.0`, bringt `tzdata` mit), `sqlalchemy`, `uvicorn`. Entwicklung und Prüfung: `pipwerk-fetch-mt5` (Pfadabhängigkeit `components/pipwerk-fetch-mt5` für die nachgebildete Quelle), `mypy`, `pytest`, `ruff`. Mindestversionen stehen in `backend/pyproject.toml`: alembic 1.20.0, fastapi 0.141.1, httpx2 2.13.1, sqlalchemy 2.1.3, uvicorn 0.54.0, mypy 2.3.1, pytest 9.1.1, ruff 0.16.9; gelockt sind im Stand von Auftrag 04 unter anderem alembic 1.20.0, fastapi 0.156.8, httpx2 2.16.0, pydantic 2.13.5 (festgelegt durch `pipwerk-marketdata`), starlette 1.9.0, sqlalchemy 2.1.5, uvicorn 0.54.0. Die Seite `/docs` lädt Swagger UI von `cdn.jsdelivr.net` (Abschnitt 2.5).

## 8. Entscheidungen und offene Punkte

Entscheidungen des Entwicklers in Auftrag 01 (die Spezifikation lässt sie offen oder der Auftrag überlässt sie ihm):

- Erkennung des Standard-Testkontos über eine feste Kennung (Abschnitt 2.6).
- Felder, Namen und Wertebereiche der Testkonten; Beträge als Fließkommazahlen; `PUT` ersetzt alle Werte; `is_default` nur lesend; Namen nicht eindeutig (Abschnitt 2.6).
- Startkonfiguration mit `[server]` `host`, `port`, `allowed_hosts` und `max_body_bytes` (Abschnitt 2.2); Kommandozeile überschreibt `host` und `port`.
- Keine Herkunft der Startkonfiguration (`ConfigOrigin`) und keine Abhängigkeit von `pipwerk_domain`: beides braucht dieser Stand nicht.
- Das Testumgebungsskript verlangt `--frontend-port` auch ohne Oberfläche (Abschnitt 4a).
- Die Beschreibung der Anfrage-Bodys steht inline im Pfad statt als benanntes Schema (Abschnitt 5.3).

Entscheidungen in Auftrag 04. Aus dem Auftrag (entschieden vom Entwicklungsleiter): Die Einstellungen liegen unter internen Endpunkten `/api/replay/settings/…`, der Stand unter `/api/replay/revision`, `/api/v1/settings` entfällt (Abschnitt 5.1). Aus der Spezifikation und dem Auftrag, die den Entwickler entscheiden lassen:

- Eigene Angabe `[marketdata] url` für die Datenbank des Datenbestands, freiwillig; ohne sie dieselbe Datenbank wie die von pipwerk replay (Abschnitt 2.8). Die Spezifikation (E4) verlangt „eine eigene Angabe“; sie ist eigen, muss aber nicht gesetzt werden.
- Abschnitt `[source]` mit `fetch_url` und `fetch_key` (beide oder keines), `[marketdata]` mit den Grenzen (Abschnitt 2.2); die Grenzen, die die Bibliothek schon hat, haben ihre Vorgaben.
- Pfade der Web-API des Datenbestands unter `/api/v1/market-data/` (Abschnitt 2.8); Import als Body der Anfrage, nicht als Formular; Medientypen `application/json` und `text/csv`.
- Beschaffung als Auftrag im Hintergrund mit Abfrage des Stands, für jede Größe (Abschnitt 2.9); Stand im Speicher; ein Auftrag mit einem oder mehreren Teilen; Teile nacheinander.
- Fehler der Beschaffung mit `code` und `reason`; die Texte eigener Fehler deutsch wie die der Quelle (Abschnitt 2.9).
- Obergrenzen der Listen in Antworten, Zahl der Teile je Anfrage, gleichzeitige Importe und Beschaffungen als Parameter mit Vorgaben (Abschnitte 2.2 und 2.8); 429 bei Überschreiten, kein Warten.
- Das Feld `broker` der Vollständigkeit ist freiwillig; ohne es gilt die Standardquelle (Abschnitt 2.8).
- Die INI wird ohne Interpolation gelesen, Fehlermeldungen wiederholen keinen Wert (Abschnitt 2.2).
- `httpx2` als Laufzeitabhängigkeit; `pydantic` durch die Bibliothek auf 2.13.5 festgelegt (Abschnitte 2.8 und 7).
- `info.version` der Beschreibung bleibt `1.0.0` (Abschnitt 5.3).

Offene Punkte, die der Entwicklungsleiter entscheidet:

1. Große Zeiträume der Beschaffung: pipwerk replay zerlegt sie nicht (Abschnitt 2.9); die Quelle antwortet bei zu vielen Zeilen mit `range_too_large`. Die Beschaffung beim Start eines Testlaufs (`wp03`, Spezifikation 5.4 „auch für Teile eines Zeitraums“) braucht eine Zerlegung nach den Grenzen der Quelle oder die Meldung an den Anwender. Das gehört zu `wp03`; hier ist nichts entschieden.
2. Die Testumgebung (`scripts/testenv`) schreibt nur `[database]` in die INI und kennt weder `fetch_url` noch `fetch_key`. Abnahmekriterium 3 von `wp02` (Beschaffung bei MetaTrader 5 in der Testumgebung) braucht eine eingerichtete Quelle. Der Schlüssel darf nicht auf der Kommandozeile stehen (sie kann für andere Benutzer des Rechners sichtbar sein); denkbar ist ein Parameter, der auf eine Datei mit Adresse und Schlüssel zeigt. Der Auftrag nennt das Testumgebungsskript nicht; es ist unverändert.
3. Die Übersicht des Datenbestands berechnet die Lücken über alle Zeiten jeder Reihe (Bibliothek, Abschnitt 2.8). Bei sehr großen Reihen (viele Millionen Ticks) dauert ein Aufruf entsprechend; begrenzt ist nur die Antwort, nicht die Rechenzeit. Eine Änderung braucht die Bibliothek (`packages/market-data`), die nicht Teil dieses Auftrags ist.
