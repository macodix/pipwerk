# pipwerk replay – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-23
- komponente: `pipwerk-replay`
- vorhaben: `backtest`, Arbeitspaket `wp02`, Aufträge 01, 04, 05 und 12

## 1. Gegenstand

Dieses Dokument beschreibt den technischen Aufbau von pipwerk replay (dem Strategietester), die Einrichtung einer Entwicklungsumgebung, den Start im Entwicklungsbetrieb und als Testumgebung und die Prüfungen. Grundlage ist die Spezifikation des Vorhabens `backtest` (E3 bis E6, 5.1 bis 5.4, 6.2, 7, 10, 11); Aufbau, Startkonfiguration, Alembic und die Prüfung des Kopfs `Host` folgen pipwerk Studio ([technische Dokumentation pipwerk Studio](pipwerk-studio.md), Abschnitte 2.1, 2.2 und 2.10).

Der beschriebene Stand sind das Backend aus den Aufträgen 01, 04 und 12 und die Oberfläche aus Auftrag 05. Auftrag 01: Das Backend startet aus der Startkonfiguration, legt seine Datenbank mit Alembic an, prüft den Kopf `Host`, begrenzt die Größe von Anfragen, verwaltet Testkonten und läuft als Testumgebung aus einem Commit. Auftrag 04: Es bindet den Datenbestand historischer Kursdaten ein ([technische Dokumentation des Datenbestands](pipwerk-marketdata.md), Paket `pipwerk_marketdata` aus Auftrag 02) und bietet dafür die Web-API für Import und Vollständigkeit und die internen Endpunkte für die Einstellung der Sprache und für den Stand. Auftrag 05: Die Browseroberfläche (`frontend/`, Abschnitt 9) bietet die Ansichten „Datenbestand“ und „Testkonten“ nach dem bestätigten Prototyp, angeschlossen an diese Web-API; das Testumgebungsskript baut und startet sie (Abschnitt 4a). Auftrag 12 (Behebung der Mängel M1, M3 und M4 des Abnahmeberichts): Das Backend beschafft nichts mehr (Spezifikation 5.4, Abschnitt 2.9). Die Web-API des Datenbestands bietet die Liste der Reihen (gefiltert, seitenweise, mit Gesamtzahl), die Einzelheiten einer Reihe, die Liste der Broker, den Import mehrerer Dateien in einem Vorgang und eine Vorschau, was die Dateien über sich sagen; die Einstellung „Broker für Testläufe“ (bisher Standardquelle) ersetzt die Standardquelle (Abschnitt 2.7). **Die Oberfläche ist in Auftrag 12 unverändert geblieben** (Nicht-Umfang des Auftrags): Sie spricht noch die entfallenen Pfade an und wird mit Auftrag 14 angepasst; bis dahin sind ihre Ansicht „Datenbestand“, ihre Vitest-Tests der Datenansicht und ihre Browsertests nicht mit dem Backend dieses Stands abgestimmt (Abschnitt 9). Der Testlauf (Arbeitspaket `wp03`) und die gespeicherten Backtests fehlen noch und werden hier ergänzt, sobald sie umgesetzt sind.

## 2. Aufbau der Komponente

pipwerk replay liegt im Verzeichnis `components/pipwerk-replay/` (das frühere Verzeichnis enthielt nur eine Platzhalter-README).

| Verzeichnis oder Datei | Inhalt |
| --- | --- |
| `backend/` | Python-Paket `pipwerk_replay` mit der HTTP-Anwendung, den Backend-Tests, `pyproject.toml` und der Lockdatei `uv.lock` |
| `backend/pipwerk-replay.example.ini` | Beispiel der Startkonfiguration |
| `scripts/testenv` | Testumgebungsskript (Abschnitt 4a) |
| `frontend/` | Browseroberfläche: React, TypeScript, Vite, Vitest, Playwright (Abschnitt 9) |
| `README.md` | Kurzbeschreibung der Komponente |
| `.gitignore` | schließt `backend/.venv/`, `frontend/node_modules/`, `frontend/dist/`, `frontend/dist-e2e/`, die Ergebnisse der Browsertests, lokale Konfiguration und Datenbank und `.testenv/` aus |

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
| `settings_service.py` | Einstellungen Sprache und Broker für Testläufe (Abschnitt 2.7) |
| `names.py` | Regel für Namen von Brokern und Instrumenten |
| `marketdata_service.py` | Datenbestand: Import mehrerer Dateien, Vorschau, Liste der Reihen, Einzelheiten, Broker, Broker für Testläufe, Angaben zum Instrument, Vollständigkeit, Begrenzung gleichzeitiger Importe (Abschnitt 2.8) |
| `marketdata_models.py` | Modelle der Anfragen und Antworten des Datenbestands (Pydantic) |
| `import_form.py` | liest und prüft das Formular (`multipart/form-data`) eines Imports und seiner Vorschau; Grenzen des Bodys (Abschnitt 2.8) |
| `marketdata_examples.py` | Beispiele für die Beschreibung der Web-API (Abschnitt 5.3) |
| `revision.py` | Stand (Git-Commit), aus dem pipwerk replay läuft (Abschnitt 2.10) |
| `api_support.py` | gemeinsame Regeln der Schnittstellen: Body, Fehler, Texte (Abschnitt 5.2) |
| `web_api.py` | Testkonten der Web-API unter `/api/v1/` und Einbau aller Schnittstellen (Abschnitt 5.2) |
| `marketdata_api.py` | Web-API des Datenbestands unter `/api/v1/market-data/` (Abschnitt 5.2) |
| `internal_api.py` | interne Endpunkte unter `/api/replay/` (Abschnitt 5.1) |
| `contract.py` | erzeugt die Beschreibung unter `contracts/api/` (Abschnitt 5.3) |

Was nur pipwerk Studio betrifft (Objektverzeichnis, Strategien, gemeinsame Bibliothek `pipwerk_domain`), ist nicht übernommen. Das Backend hängt von FastAPI, SQLAlchemy, Alembic, Uvicorn, `python-multipart` (Lesen des Formulars eines Imports) und, als Pfadabhängigkeit mit festgeschriebener Version `==0.1.0`, von `pipwerk_marketdata` (`packages/market-data`) ab; die gemeinsame Bibliothek `pipwerk_domain` kommt mit dem Auftrag, der sie braucht. Eine Abhängigkeit auf `pipwerk-fetch-mt5` gibt es nicht mehr.

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
max_files_per_import = 100
max_import_bytes = 268435456
```

| Abschnitt und Eintrag | Bedeutung | Vorgabe |
| --- | --- | --- |
| `[database]` `url` (Pflicht) | SQLAlchemy-Datenbank-URL; leer nicht zulässig | – |
| `[server]` `host` | Adresse, an die sich das Backend bindet | `127.0.0.1` |
| `[server]` `port` | Port des Backends, ganze Zahl von 1 bis 65535 | `8000` |
| `[server]` `allowed_hosts` | weitere Namen und IP-Adressen im Kopf `Host`, durch Kommas getrennt (Abschnitt 2.4) | keine |
| `[server]` `max_body_bytes` | größter Body einer Anfrage in Bytes, 1024 bis 1073741824 | 2 097 152 (2 MiB) |
| `[marketdata]` `url` | Datenbank des Datenbestands (Abschnitt 2.8); leer nicht zulässig | die Datenbank von `[database]` |
| `[marketdata]` `max_upload_bytes` | größte Datei eines Imports in Bytes, 1024 bis 1073741824 | 33 554 432 (32 MiB, Vorgabe von `pipwerk_marketdata`) |
| `[marketdata]` `max_rows` | größte Zahl der Zeilen oder Einträge einer Datei, 1 bis 100 000 000 | 500 000 (Vorgabe von `pipwerk_marketdata`) |
| `[marketdata]` `max_files_per_import` | größte Zahl der Dateien eines Imports, 1 bis 1000 | 100 |
| `[marketdata]` `max_import_bytes` | größte Gesamtgröße der Dateien eines Imports in Bytes, 1024 bis 4294967296; nicht kleiner als `max_upload_bytes` (sonst scheitert der Start). Die Grenze für den Body der Anfrage ist diese Größe plus die Hülle des Formulars (Abschnitt 2.8) | das Größere von 268 435 456 (256 MiB) und `max_upload_bytes` |
| `[marketdata]` `max_reported_rejections` | Zahl der abgelehnten Zeilen, die das Ergebnis eines Imports nennt (gezählt werden alle), 0 bis 1 000 000 | 1000 (Vorgabe von `pipwerk_marketdata`) |
| `[marketdata]` `max_concurrent_imports` | Zahl der Importe, die gleichzeitig laufen, 1 bis 64 | 2 |
| `[marketdata]` `max_listed_items` | größte Zahl von Einträgen einer Liste in einer Antwort (Reihen, Lücken, Zeiträume), 1 bis 1 000 000 | 1000 |
| `[marketdata]` `max_parts_per_request` | größte Zahl von Teilen in einer Anfrage nach Vollständigkeit, 1 bis 10 000 | 100 |

Die Abschnitte `[server]` und `[marketdata]` und jeder ihrer Einträge sind freiwillig. Ein ungültiger Wert lässt den Start mit Exitcode 1 scheitern; die Meldung nennt die Datei und den Eintrag, nie den Wert. Die Aufrufparameter `--host` und `--port` überschreiben `host` und `port`; `--allowed-host` ergänzt `allowed_hosts`. Die Sprache, der Broker für Testläufe und alle anderen Einstellungen stehen nicht in der INI, sondern in der Datenbank.

Die INI wird ohne Interpolation gelesen (ein Prozentzeichen ist ein Zeichen wie jedes andere; der bisherige Zustand ließ eine Datenbank-URL mit `%` scheitern). Eine Fehlermeldung zu einer INI wiederholt nie einen Wert der Datei. Bei einem Syntaxfehler nennt sie nur die Nummer der Zeile, denn der Text von `configparser` wiederholt die Zeile und mit ihr womöglich einen Wert; eine Datei, die kein UTF-8 ist, heißt „not UTF-8 text“. Unbekannte Abschnitte und Einträge ignoriert pipwerk replay wie bisher.

**Startkonfiguration aus der Zeit der Beschaffung (Entscheidung des Entwicklers in Auftrag 12).** Eine vorhandene Datei mit dem früheren Abschnitt für die Quelle verhindert den Start nicht. Sie folgt der bestehenden Regel für Unbekanntes: Was das Backend nicht kennt, hat keine Wirkung und wird nicht geprüft; der Abschnitt wird also auch dann ignoriert, wenn seine Werte nach den früheren Regeln ungültig waren. Das Backend meldet den ignorierten Abschnitt nicht. Grund: Die Regel gilt für jeden unbekannten Eintrag gleich (zum Beispiel einen Tippfehler), und ein Sonderfall für einen entfallenen Abschnitt wäre eine zweite Regel. Test: `tests/test_config_datastock.py` (`test_the_old_section_source_is_ignored_like_every_unknown_section`, `test_the_backend_starts_with_the_old_configuration_and_serves_the_data_stock`). Ein Schlüssel, der in einer alten Datei steht, bleibt dort; er wird nirgends gelesen. Der Betreiber kann die Einträge löschen.

Die Suche nach der Datei ist dieselbe wie bei pipwerk Studio, mit dem Dateinamen `pipwerk-replay.ini`. Eine mit `-c <PATH>` angegebene Datei hat höchste Priorität; ohne `-c` gilt die erste vorhandene Datei in dieser Reihenfolge, Inhalte werden nicht zusammengeführt:

1. `$HOME/pipwerk/etc/pipwerk-replay.ini`
2. `$HOME/.config/pipwerk/pipwerk-replay.ini`
3. `/etc/pipwerk/pipwerk-replay.ini`

Unter Windows gelten `%USERPROFILE%\pipwerk\etc`, `%APPDATA%\pipwerk` und `%PROGRAMDATA%\pipwerk`. Ist eine der Umgebungsvariablen nicht gesetzt, leer oder kein absoluter Pfad, entfallen die davon abhängigen Suchorte; es werden nie Pfade relativ zum Startverzeichnis durchsucht. Ohne Datei endet der Start mit Exitcode 1 und der Meldung:

```text
pipwerk-replay: No startup configuration found. pipwerk replay does not start without one. Searched: <Suchorte>. Provide a startup configuration file with -c <PATH>.
```

Als ungültig gelten außerdem eine fehlende Datei bei `-c`, eine nicht lesbare oder nicht auswertbare Datei, ein fehlender Abschnitt `[database]`, ein fehlender oder leerer Eintrag `url`, eine `url`, mit der keine Datenbank-Engine erzeugt werden kann oder die Datenbank nicht erreichbar ist, und jeder ungültige Eintrag von `[server]` und `[marketdata]` (auch ein `max_import_bytes` unter `max_upload_bytes`). `create_app()` ohne Argument verwendet dieselbe Suche und bricht bei fehlender Konfiguration mit `StartupConfigError` ab. Anders als bei pipwerk Studio gibt `load_startup_config()` keine Herkunft der Datei zurück: pipwerk replay hat kein Objektverzeichnis, dessen Vorgabe davon abhängt.

### 2.3 Datenbank und Migration

pipwerk replay hat eine eigene Datenbank. Die Spezifikation (E4) erlaubt, dass die Datenbank des Datenbestands dieselbe ist; wie beide zusammenhängen, steht in Abschnitt 2.8. Das Schema von pipwerk replay wird mit Alembic versioniert. Die Migrationen liegen im Paket `pipwerk_replay.migrations` (`env.py`, `versions/v0001_initial.py`, `versions/v0002_default_source.py`, `versions/v0003_test_run_broker.py`) und werden mit der Installation ausgeliefert. Es gibt keine Konfigurationsdatei von Alembic mit fester URL: `migrate_database(engine)` in `migrate.py` übergibt Alembic die Verbindung der Engine (`config.attributes["connection"]`); Offline-Modus wird nicht unterstützt. `create_replay_engine()` ruft sie beim Start auf; es gibt kein `create_all`.

Revision `0001` legt an:

| Tabelle | Spalten |
| --- | --- |
| `replay_settings` | `id` (ganze Zahl, Schlüssel; höchstens eine Zeile mit `id` = 1), `language` (Text, höchstens 8 Zeichen) |
| `test_accounts` | `id` (Text, 36 Zeichen, Schlüssel), `name` (Text, höchstens 100 Zeichen), `initial_capital` (Fließkommazahl), `currency` (Text, 3 Zeichen), `leverage` (ganze Zahl), `spread_mode` (Text, höchstens 8 Zeichen), `spread_points` (Fließkommazahl, NULL erlaubt), `commission_per_lot_side` (Fließkommazahl) |

Revision `0002` (Auftrag 04) fügt `replay_settings` die Spalte `default_source` hinzu (Text, höchstens 128 Zeichen, NULL erlaubt: die frühere Standardquelle). Vorhandene Zeilen behalten ihre Sprache und haben keine Standardquelle.

Revision `0003` (Auftrag 12) löst `default_source` durch `test_run_broker` ab (Text, höchstens 128 Zeichen, NULL erlaubt: der Broker für Testläufe, Abschnitt 2.7): Sie legt die neue Spalte an, **übernimmt den Wert der alten** (`UPDATE replay_settings SET test_run_broker = default_source`) und löscht die alte Spalte. Eine frühere Wahl bleibt also erhalten; Zeilen ohne Wert und eine leere Tabelle bleiben ohne Wert. Der Wert wird nicht geprüft, ob der Broker im Datenbestand vorkommt: Was gilt, wenn der gewählte Broker nicht mehr vorkommt, steht in Abschnitt 2.7. Die Rücknahme (`downgrade`) tut dasselbe in der Gegenrichtung. Die Spalte wird mit `batch_alter_table` angelegt und gelöscht, damit die Migration auch auf SQLite läuft. Tests: `tests/test_migrations.py` (`test_the_migration_takes_over_the_default_source_as_the_broker_for_test_runs`, `…keeps_a_setting_without_a_default_source…`, `test_the_migration_back_gives_the_value_to_the_old_column`, `test_the_old_name_of_the_setting_is_gone_from_the_schema`) und `tests/test_config_datastock.py` (Schritt von `0001` bis `0003` mit Zeile).

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

### 2.7 Einstellungen Sprache und Broker für Testläufe

Die Einstellungen sind betriebliche Einstellungen der Komponente, nicht benutzerbezogen und im Backend gespeichert; der Browser ist nicht autoritativ (req-ui-008). Sie liegen in einer einzigen Zeile von `replay_settings` (`id` = 1); gleichzeitiges erstes Schreiben legt sie einmal an. Sie sind interne Endpunkte unter `/api/replay/settings/` (Abschnitt 5.1), nicht Teil der öffentlichen Web-API.

- Die Sprache der Oberfläche (`de` oder `en`). Ohne gespeicherten Wert gilt Deutsch. Enthält der gespeicherte Wert keine unterstützte Sprache (technisch fehlerhafter Inhalt), schlägt das Lesen mit HTTP 503 und dem Text `The stored pipwerk replay language is invalid.` fehl; ein gültiges Schreiben ersetzt den Wert.
- Der Broker für Testläufe (Spezifikation 5.1; bisher „Standardquelle“): die Bezeichnung des Brokers, dessen Daten ein Testlauf verwendet (bei MetaTrader 5 der Name des Handelsservers). Gespeichert wird die Wahl (Spalte `test_run_broker`, ohne Wahl `NULL`); der Wert folgt der Regel für Namen (1 bis 128 Zeichen, keine Steuerzeichen, kein Leerzeichen am Rand, wie bei `pipwerk_marketdata`). **Der Broker, der gilt**, ergibt sich aus der Wahl und dem Datenbestand (`MarketDataService.test_run_broker()`): Kommt der gewählte Broker im Datenbestand vor (in einer Reihe oder in Angaben zu einem Instrument), gilt er; ist keiner gewählt oder kommt er nicht mehr vor, gilt der erste Broker des Datenbestands in alphabetischer Reihenfolge (ohne Beachtung der Schreibweise, wie die Liste der Broker); hat der Datenbestand keinen Broker, gilt keiner (`null`). Die Web-API nennt den geltenden Broker und ob er die Wahl ist (`chosen`). Die Wahl bleibt gespeichert, auch wenn der Broker nicht mehr vorkommt; sie gilt wieder, sobald seine Daten wieder da sind. Setzen lässt sich nur ein Broker, der im Datenbestand vorkommt; sonst antwortet die Web-API mit HTTP 422 `The broker has no data in the data stock.` (Ort `broker`, Art `broker_not_in_data_stock`) und ändert nichts; `null` entfernt die Wahl. Ist der gespeicherte Wert kein gültiger Name, antwortet das Lesen mit HTTP 503 und `The stored pipwerk replay broker for test runs is invalid.`; ein gültiges Schreiben ersetzt ihn. Der geltende Broker ist der Broker, den die Prüfung der Vollständigkeit verwendet, wenn die Anfrage keinen nennt (Abschnitt 2.8). **Entscheidung des Entwicklers:** Die Prüfung, ob der Broker im Datenbestand vorkommt, liegt im Dienst des Datenbestands und nicht in `SettingsService`, der den Datenbestand nicht kennt; die Bezeichnung „Broker für Testläufe“ steht überall an der Stelle von „Standardquelle“ (Spalte, Pfad, Modelle, Texte).

### 2.8 Datenbestand

pipwerk replay bindet den Datenbestand historischer Kursdaten ein (Spezifikation E4, 5.1 bis 5.3): die Bibliothek `pipwerk_marketdata` aus `packages/market-data`, beschrieben in der [technischen Dokumentation des Datenbestands](pipwerk-marketdata.md). pipwerk replay ändert sie nicht. Das Backend hängt von ihr als Pfadabhängigkeit mit festgeschriebener Version ab (`pipwerk-marketdata==0.1.0`, `[tool.uv.sources]` in `backend/pyproject.toml`, Lockdatei `backend/uv.lock`). Die Bibliothek fordert `pydantic==2.13.5`; die Lockdatei von pipwerk replay löst deshalb mit dieser Version auf (vorher 2.14.1).

**Datenbank und Migration.** Die Datenbank des Datenbestands ist eine eigene Angabe der Startkonfiguration (`[marketdata] url`). Fehlt sie oder gleicht sie `[database] url`, ist es dieselbe Datenbank und dieselbe Engine; sonst öffnet pipwerk replay eine zweite Engine mit denselben Einstellungen. Die Migrationen beider laufen getrennt, jede in ihrer Transaktion und mit ihrer eigenen Versionstabelle: die von pipwerk replay mit `alembic_version` (Abschnitt 2.3), die des Datenbestands mit `marketdata_alembic_version`; die Tabellen des Datenbestands beginnen mit `marketdata_`. Zuerst läuft die Migration von pipwerk replay, dann die des Datenbestands (`storage.migrate_marketdata()`). Scheitert die zweite oder kennt sie die Revision nicht (Datenbank einer neueren Version), endet der Start mit `DatabaseMigrationError` von pipwerk replay und der festen Meldung der Bibliothek; Exitcode 1, wie bei der ersten.

**Aufbau der Schnittstelle (Abschnitt 5.2).** Alle Pfade liegen unter `/api/v1/market-data/` und sind öffentlich; die Einstellung „Broker für Testläufe“ ist ein interner Endpunkt (Abschnitt 5.1).

- `GET series`: die Liste der Reihen, gefiltert, seitenweise, mit Gesamtzahl (unten).
- `GET series/details`: die Einzelheiten einer Reihe: alle Lücken und die Kontraktdaten (unten).
- `GET brokers`: die Broker, die im Datenbestand vorkommen.
- `GET instrument`: die neuesten Angaben zu einem Instrument bei einem Broker (Parameter `broker`, `instrument`, freiwillig `as_of`); 404 ohne Angaben. Der Endpunkt bleibt, weil `as_of` die Angaben zu einem Zeitpunkt liefert, was die Einzelheiten einer Reihe nicht tun; die Einzelheiten nennen die neuesten Angaben bei demselben Broker.
- `POST imports`: Import mehrerer Dateien in einem Vorgang (unten).
- `POST imports/preview`: was die Dateien über sich sagen, ohne zu importieren (unten).
- `POST completeness`: Vollständigkeit einer Liste benötigter Teile.

Entfallen sind `GET overview`, `POST imports/json`, `POST imports/csv` und die Endpunkte der Beschaffung (Entscheidung des Entwicklers: Der Vorgang ersetzt die Einzeldatei-Importe vollständig, und die Liste der Reihen mit den Einzelheiten ersetzt die Übersicht; `instrument` und `completeness` ersetzt nichts, beide bleiben). Sie antworten wie jeder unbekannte Pfad mit 404.

**Öffentlich oder intern (Entscheidung des Entwicklers).** Reihen, Einzelheiten, Broker, Import und Vorschau sind Daten und Vorgänge des Datenbestands und stehen wie bisher in der öffentlichen Web-API unter `/api/v1/` und in der Beschreibung unter `contracts/api/`. Der Broker für Testläufe ist eine Einstellung der Komponente; die Einstellungen liegen wie bisher unter `/api/replay/settings/` (Abschnitt 5.1). Grund: Spezifikation 7 nennt „Interne Endpunkte für Einstellungen“, und die bisherige Standardquelle lag dort.

**Liste der Reihen.** `GET series` mit den Abfrageparametern `broker`, `instrument`, `data` (jeweils ein Teil des Texts, ohne Beachtung der Schreibweise; leer oder fehlend trifft alles), `offset` (ab 0) und `limit` (1 bis `max_listed_items`, ohne Angabe `max_listed_items`). Eine Zeile steht für einen Broker, ein Instrument und eine Art von Daten und nennt `broker`, `instrument`, `data`, `first` und `last` (erste und letzte Kerze oder Tick, UTC) und `gap_count` (Zahl der Lücken). `data` ist die **Kennung** der Daten, immer kleingeschrieben: eine Zeiteinheit (`m1` bis `mn1`), `ticks` oder `contract` (die Angaben zu einem Instrument; die Zeile gibt es nur für ein Instrument, das bei diesem Broker Angaben, aber keine Reihe hat; `first` und `last` sind dort `null`, `gap_count` ist 0). Die Oberfläche übersetzt die Kennung in die Anzeige („Kerzen H1“, „Kontraktdaten“). Die Zeilen sind nach Broker, Instrument und Daten sortiert (Zeiteinheiten von kurz nach lang, dann Ticks, dann Kontrakt). `total` zählt alle Zeilen, die zum Filter passen; `offset` und `limit` der Antwort sind die angewendeten. Eine Kennung im Filter, die keine Zeile hat, auch eine unbekannte, ergibt eine leere Liste und keinen Fehler (Hinweis des Testers zu Auftrag 11). Lücken und Zeiträume berechnet die Bibliothek nur für die Zeilen der Seite (`MarketDataStore.list_series()`). Das Backend setzt `max_page_size` der Bibliothek auf `max_listed_items`, damit `limit` nie über der Grenze der Bibliothek liegt.

**Einzelheiten einer Reihe.** `GET series/details` mit `broker`, `instrument` und `data` (die Kennung wie in der Liste). Die Antwort hat `row` (die Zeile der Liste), `gaps` (die Lücken in zeitlicher Reihenfolge mit `start`, `end` und `reason`; höchstens `max_listed_items`, `row.gap_count` zählt alle) und `contract` (die neuesten Angaben zum Instrument bei diesem Broker; **`null`, wenn es keine gibt**, das ist der Hinweis, dass sie fehlen). Gibt es die Zeile nicht, antwortet das Backend mit 404 `There is no such row in the list of series.`; das gilt auch für eine Kennung, die es nicht gibt (`H1` statt `h1`, `Kerzen H1`). Entscheidung des Entwicklers zum Hinweis des Testers (Auftrag 11: `series_details` wirft bei unbekannter Kennung einen `ValueError`): Das Backend prüft die Kennung vor dem Aufruf der Bibliothek (`DATA_IDENTIFIERS`) und antwortet 404, nie mit einem Serverfehler. 404 und nicht 422, weil eine Reihe mit dieser Kennung nicht existiert; ein Parameter, der fehlt oder zu lang ist, ergibt 422.

**Broker.** `GET brokers` nennt die Broker des Datenbestands, sortiert ohne Beachtung der Schreibweise (`MarketDataStore.brokers()`); die Oberfläche schlägt sie im Dialog des Imports vor und wählt unter ihnen den Broker für Testläufe.

**Import mehrerer Dateien (Spezifikation 5.3).** `POST imports` nimmt beliebig viele Dateien in einem Vorgang. Entscheidung des Entwicklers: Der Body ist ein Formular (`multipart/form-data`, Lesen mit `python-multipart` über `request.form()` von Starlette), denn mehrere Dateien mit je eigenen Angaben passen nicht in einen Body mit einem Medientyp. Das Formular (`import_form.py`):

| Feld | Anzahl | Inhalt |
| --- | --- | --- |
| `broker` | genau eines | der Broker aller Dateien des Vorgangs; er ersetzt auch den Broker, den eine JSON-Datei nennt (Spezifikation 5.3) |
| `timezone` | höchstens eines | Name der Zeitzone nach IANA für die Zeiten in allen CSV-Dateien; nur für CSV nötig (fehlt sie, wird eine CSV-Datei abgelehnt, JSON-Dateien nicht) |
| `file` | beliebig viele | je ein Teil mit Datei; der Dateiname des Teils nennt die Datei |
| `instrument` | keines oder eines je Datei | das Instrument der Datei an derselben Stelle (leerer Wert: keine Angabe); bei JSON ersetzt es das Instrument des Inhalts |
| `data` | keines oder eines je Datei | die Kennung der Daten der Datei an derselben Stelle (leerer Wert: keine Angabe): `m1` bis `mn1` oder `ticks`; bei JSON muss sie dem Inhalt gleichen (`contract` gibt es nur bei JSON) |

`instrument` und `data` gehören zu der Datei an derselben Stelle der Reihenfolge der Teile des Formulars (die Reihenfolge der Teile bleibt erhalten). Entscheidung des Entwicklers: gleichnamige Felder statt eines Felds mit JSON-Inhalt; die Oberfläche hängt sie mit `FormData.append` an. Ein anderes Feld, ein Feld `file` ohne Datei, eine Datei in einem anderen Feld, mehrere `broker` und `timezone`, eine Zahl von `instrument` oder `data` ungleich der Zahl der Dateien, ein ungültiger `broker` und eine Zeitzone über 64 Zeichen ergeben HTTP 422 mit dem Ort jedes Fehlers (`extra_forbidden`, `too_long`, `length_mismatch`, `missing`, `value_error`, `string_too_long`), nie dem Wert; ein Formular, das sich nicht lesen lässt, ergibt 422 `The form of the request is invalid.`; ein anderer Medientyp als `multipart/form-data` ergibt 415. **Formular von einer fremden Webseite (Entscheidung des Entwicklers).** `multipart/form-data` gehört zu den drei Medientypen, die eine Webseite eines anderen Ursprungs ohne Vorabfrage senden kann; ein JSON-Body und die früheren Dateien als Body (`application/json`, `text/csv`) verlangten eine Vorabfrage, die das Backend nicht freigibt. Ohne weitere Maßnahme könnte eine fremde Seite im Browser eines Anwenders Dateien in den Datenbestand schreiben (die Prüfung des Kopfs `Host` hilft nicht: der Kopf nennt das Backend selbst). Deshalb prüft `import_form.py` vor dem Lesen des Bodys den Kopf `Origin`, den ein Browser bei einem solchen Formular immer sendet: Nennt er einen anderen Namen oder Port als der Kopf `Host` (auch `null` oder leer), antwortet das Backend mit HTTP 403 `The request comes from a web page of another origin.` und ändert nichts. Fehlt `Origin` (ein Programm wie `curl`, die Tests), wird die Anfrage bedient. Das Schema der Adresse wird nicht verglichen. Die Oberfläche über `vite preview` oder den Entwicklungsserver sendet den Kopf `Host` unverändert (`changeOrigin: false`, Abschnitt 4.2), so dass beide gleich sind; ein Vorschaltserver, der `Host` ändert, müsste ihn für das Backend wieder auf den Namen des Ursprungs setzen. Test: `tests/test_market_import.py` (`test_a_form_from_a_web_page_of_another_origin_is_403_and_changes_nothing`).

Das **Format** einer Datei ergibt sich aus der Endung ihres Namens (`.json`: JSON; `.csv`, `.txt`: CSV, beides ohne Beachtung der Schreibweise), sonst aus dem Inhalt (beginnt er mit `{`, ist es JSON, sonst CSV). Der Name wird nur gelesen. Der Vorgang ruft `MarketDataStore.import_files()` auf: Jede Datei hat ihre eigene Transaktion, eine abgelehnte Datei hindert die übrigen nicht, und die Antwort (HTTP 200) hat `files` mit einem Ergebnis je Datei in der Reihenfolge des Formulars sowie `imported_count` und `refused_count`. Ein Ergebnis hat `name`, `refused` und entweder `result` (Art, Broker, Instrument, Zeiteinheit, übernommene Zeilen `accepted`, ersetzte `replaced`, Zeitraum `period_start` und `period_end`, die abgelehnten Zeilen `rejected` mit Nummer – bei CSV die Zeile, die Kopfzeile ist Zeile 1; bei JSON die Stelle des Eintrags – und Grund, höchstens `max_reported_rejections`, gezählt in `rejected_count`) oder `error` (Kennung der Bibliothek) und `message` (fester Text, nennt Felder, nie Inhalt der Datei). Als Ganzes abgelehnt werden zum Beispiel: kein JSON, falsche Spalten, unbekannte Zeitzone, keine Zeilen, zu viele Zeilen, zu große Datei, fehlende oder unbekannte Angaben (`series_invalid`), Fehler der Datenbank (`store_failed`). Eine Kennung der Daten, die es nicht gibt (zum Beispiel `H1`, `Kerzen H1`, oder `contract` bei einer CSV-Datei), lehnt **nur diese Datei** ab (`series_invalid`, 200 mit Ergebnis je Datei); das Backend wirft nie den `ValueError` der Bibliothek weiter (Hinweis des Testers zu Auftrag 11). Entscheidung des Entwicklers: Pro Datei und nicht für den ganzen Vorgang, weil der Anwender so sieht, welche Datei er korrigieren muss, und nur diese erneut importiert (Spezifikation 5.3). Der ganze Vorgang wird abgelehnt (nichts wird gelesen) bei: keiner Datei (HTTP 422, `no_files`), mehr Dateien als `max_files_per_import` oder Dateien zusammen über `max_import_bytes` (HTTP 413, `too_many_files`, `batch_too_large`), Antwort `{"detail": "The import is refused as a whole.", "code": …, "message": …}`. Ein Fehler der Datenbank beim Lesen ergibt HTTP 503 `The data stock could not be read or changed.`; das Protokoll nennt nur die Art der Ursache. Der Dateiname wird nie als Pfad verwendet: Das Ergebnis nennt ihn ohne Verzeichnis (alles bis zum letzten `/` oder `\` entfällt), ohne Steuerzeichen und auf höchstens 255 Zeichen gekürzt, `file-<n>` bei leerem Namen; der Inhalt bleibt im Speicher und geht als Bytes an die Bibliothek. Test: `tests/test_market_import.py` (Pfade wie `../../x.json`, `C:\…`, Steuerzeichen; kein Verzeichnis ändert sich).

**Vorschau.** `POST imports/preview` nimmt dasselbe Formular, aber nur die Teile `file` (und leere `instrument`/`data`) und liest, ohne etwas zu importieren, was das Backend aus Dateiname und JSON-Inhalt erkennt (für das Vorbelegen im Dialog, Auftrag 11). Je Datei: `format` (`json` oder `csv`), `broker`, `instrument`, `data` (die Kennung) und `error`. Bei JSON stehen Broker, Instrument und Daten im Inhalt (`inspect_json`; hat der Inhalt kein Instrument, gilt das des Namens); eine Angabe, die der Import nicht annähme, ist `null`; kann die Datei nicht gelesen werden (Größe, Zeichensatz, kein JSON), nennt `error` die Kennung des Imports. Bei CSV zählt nur der Name (`recognize_filename`): `<Instrument>_<Daten>_<von>_<bis>` (Dateien für den Import und der Export von MetaTrader 5, zum Beispiel `EURUSD_H1_202301020000_202312292300.csv`) oder `<Instrument>,<Daten>` (auch mit `_` oder Leerzeichen, zum Beispiel `EURUSD,H1.csv`), mit `<Daten>` gleich einer Zeiteinheit, `TICKS` oder `CONTRACT`, ohne Beachtung der Schreibweise. Der Inhalt einer CSV-Datei wird nicht gelesen; die Oberfläche kann ihn weglassen (leeren Teil senden). Die Antwort hat außerdem `broker`: den Broker, den **alle** JSON-Dateien nennen; `null`, wenn es keine JSON-Datei gibt, eine keinen nennt oder sie verschiedene nennen (Spezifikation 5.3: dann ist das Feld leer). Die Vorschau teilt die Grenzen des Imports (Zahl der Dateien, Größe, gleichzeitige Vorgänge). Test: `tests/test_market_import.py`.

**Vollständigkeit.** Die Anfrage nennt die benötigten Teile (`parts`, 1 bis `max_parts_per_request`): Kerzen (`kind` `candles`, `instrument`, `time_unit`, `start`, `end`), Ticks (`kind` `ticks`, `instrument`, `start`, `end`) oder die Angaben zu einem Instrument (`kind` `instrument`, `instrument`). Zeiten sind Text nach ISO 8601 mit Zeitzone (eine Zahl und eine Zeit ohne Zeitzone werden abgelehnt), `start` liegt vor `end`, beide zwischen 1970-01-01 und 2100-01-01 UTC (die Grenzen der Bibliothek). Der Broker ist der Wert von `broker` der Anfrage oder, wenn er fehlt, der Broker für Testläufe, der gilt (Abschnitt 2.7); hat der Datenbestand gar keinen Broker, antwortet pipwerk replay mit HTTP 409 `The data stock has no broker yet. Import data first.` Entscheidung des Entwicklers: Das Feld `broker` ist freiwillig, damit eine Prüfung auch für einen anderen Broker als den für Testläufe möglich ist, ohne die Einstellung zu ändern. Die Antwort nennt je Teil in der Reihenfolge der Anfrage `needed` (der Teil, wie angefragt), `present` (vorhandene Zeiträume), `missing` (fehlende Zeiträume mit Grund `not_covered` oder `gap`, Bedeutung wie in der Dokumentation des Datenbestands) und `complete`. Zeiten, in denen der Markt geschlossen ist (Wochenende, Pausen), zählen als vorhanden. Bei den Angaben zu einem Instrument sind `present` und `missing` leer; `complete` sagt, ob Angaben da sind.

**Begrenzungen gegen Überlast (Spezifikation 11).** Alle sind Parameter der Startkonfiguration mit den Vorgaben der Tabelle in Abschnitt 2.2.

| Grenze | Wirkung |
| --- | --- |
| `max_upload_bytes` | Größe **einer** Datei. Die Bibliothek lehnt eine größere Datei als Ganzes ab (`too_large`); die übrigen Dateien des Vorgangs werden importiert. |
| `max_files_per_import` | Zahl der Dateien eines Vorgangs. Mehr ergibt HTTP 413 (`too_many_files`) und nichts wird gelesen. Der Parser des Formulars bricht bei mehr als einer Datei über der Grenze ab (`max_files` von Starlette ist die Grenze plus eins); auch dann antwortet das Backend mit `too_many_files`. |
| `max_import_bytes` | Gesamtgröße der Dateien eines Vorgangs. Mehr ergibt HTTP 413 (`batch_too_large`). **Der Begrenzer des Bodys passt dazu:** `BodyLimitMiddleware` prüft für genau die zwei Pfade `POST imports` und `POST imports/preview` vor dem Lesen die Größe des ganzen Bodys gegen `max_import_bytes` plus die Hülle des Formulars (64 KiB fest und 4096 Bytes je erlaubter Datei plus eine: Grenzen der Teile, Kopfzeilen, die Felder `instrument` und `data`, Dateinamen bis 255 Zeichen; `import_form.body_limit()`) und antwortet sonst mit HTTP 413 `{"detail": "The request body is larger than the limit."}`. So sind die Dateien eines Vorgangs, der genau `max_import_bytes` groß ist, nicht vom Begrenzer des Bodys aufgehalten (Test `test_the_limit_of_the_body_fits_the_total_size_of_the_files`), und ein Body, der viel größer ist, wird gar nicht gelesen. Für alle anderen Pfade gilt `max_body_bytes` (2 MiB). Der Begrenzer hält den Body im Speicher, bis er ihn weitergibt, und die Dateien liegen danach noch einmal als Bytes vor (die Bibliothek liest sie als Bytes); der Spitzenbedarf je Vorgang ist ein Mehrfaches von `max_import_bytes` (nicht gemessen), bei der Vorgabe also mehrere hundert MiB, und wächst mit `max_concurrent_imports`. Ein Betreiber mit wenig Speicher senkt `max_import_bytes`. |
| `max_rows` | Zeilen einer Datei, abgelehnte eingerechnet: Die Bibliothek lehnt die Datei als Ganzes ab (`too_many_rows`). |
| `max_concurrent_imports` | Zahl der Vorgänge (Importe und Vorschauen zusammen), die gleichzeitig laufen. Der nächste wird nicht gewartet, sondern mit HTTP 429 `Too many imports are running. Try again later.` abgewiesen. |
| `max_listed_items` | Umfang der Antworten: Die Liste der Reihen liefert höchstens so viele Zeilen (`limit`, `offset`; ein größeres `limit` ergibt HTTP 422); die Lücken der Einzelheiten und die Zeiträume je Teil der Vollständigkeit werden abgeschnitten und vollständig gezählt (`row.gap_count`, `present_count`, `missing_count`). |
| `max_parts_per_request` | Teile einer Anfrage nach Vollständigkeit; mehr ergibt HTTP 422 (`too_long` an der Stelle `parts`). |
| `max_reported_rejections` | abgelehnte Zeilen, die das Ergebnis je Datei nennt. |

Die hochgeladenen Dateien werden nie ausgeführt: Sie werden mit der Bibliothek gelesen (JSON mit dem Schema, CSV als Text), jede Zeile geprüft, und nur das Ergebnis der Prüfung wird gespeichert. Die Teile des Formulars liegen bis zu 1 MiB im Speicher, darüber in einer Zwischendatei im Verzeichnis für temporäre Dateien des Betriebssystems (`SpooledTemporaryFile` von Starlette), die am Ende der Anfrage geschlossen wird; die Dateinamen kommen dabei nicht vor.

### 2.9 Keine Beschaffung

pipwerk replay beschafft nichts, weder vor dem Start eines Testlaufs noch von Hand (Spezifikation 5.4, Abnahmebericht `wp02`, Mangel M4, req-system-027): Es gibt keine Quelle, keine Adresse und keinen Schlüssel einer Quelle, keine Verbindung zu einer Quelle und keinen Auftrag im Hintergrund. Kursdaten kommen nur über den Import in den Datenbestand (Abschnitt 2.8); wer sie beschafft, tut es mit `pipwerk-fetch-mt5` auf dem Rechner von MetaTrader 5 ([pipwerk-fetch-mt5](pipwerk-fetch-mt5.md)), das Dateien im Format des Imports schreibt.

Entfallen sind in Auftrag 12: das Modul `acquisition.py` (`HttpSourceClient`, `AcquisitionManager`) und sein Test, die Endpunkte `POST /api/v1/market-data/acquisitions` und `GET …/acquisitions/{id}` samt Modellen und Beschreibung unter `contracts/api/`, der Abschnitt `[source]` der Startkonfiguration und das Beispiel dazu, die Parameter `source` und `source_client` von `create_app()`, die Abhängigkeit auf `pipwerk-fetch-mt5` (Pfadabhängigkeit und Entwicklungsgruppe) und auf `httpx2` zur Laufzeit (`httpx2` bleibt als Abhängigkeit der Entwicklungsgruppe, weil der Testclient von FastAPI sie braucht), die Parameter `--source-url` und `--source-key-file` des Testumgebungsskripts und die Zeile „source“ seiner Ausgabe `status`. Der Testlauf (`wp03`) startet nicht, wenn Daten fehlen; die Meldung nennt den Weg über `pipwerk-fetch-mt5` und den Import (Spezifikation 5.4); die Vollständigkeit liefert dafür die Liste dessen, was fehlt (Abschnitt 2.8).

Eine Startkonfiguration mit dem früheren Abschnitt für die Quelle startet weiter (Abschnitt 2.2).

### 2.10 Stand der Komponente

`GET /api/replay/revision` nennt den Stand, aus dem pipwerk replay läuft, wie `/api/studio/revision` bei pipwerk Studio ([technische Dokumentation pipwerk Studio](pipwerk-studio.md), Abschnitte 2.6 und 5.1): `revision` (die ersten 7 Zeichen des Git-Commits), `commit` (40 Zeichen) und `committed_at` (Datum des Commits, ISO 8601 mit Zeitzone); jedes Feld kann `null` sein. Die Invarianten sind die von pipwerk Studio: `revision` ist genau dann `null`, wenn `commit` `null` ist; `revision` ist die Kurzform von `commit`; `committed_at` ist nur bei vorhandenem `commit` nicht `null`. Das Modell `ReplayRevision` erzwingt sie.

`revision.py` (nach `revision.py` von pipwerk Studio) führt einmal beim Erzeugen der Anwendung `git -C <Verzeichnis des Pakets> rev-parse HEAD` und, nur bei gültigem Ergebnis, `git -C … log -1 --no-show-signature --format=%cI <commit>` aus, als Unterprozess mit fester Argumentliste, ohne Shell, mit 5 Sekunden Zeitbegrenzung. Gültig ist nur ein Hash aus genau 40 Kleinbuchstaben und Ziffern des 16er-Systems und ein Datum mit Zeitzone. Jeder Fehler (Git fehlt, kein Arbeitsverzeichnis von Git, Zeitüberschreitung, Exitcode ungleich 0, ungültige Ausgabe) ergibt „nicht ermittelbar“ (`null`) mit genau einer Warnung ohne Pfad, Ausgabe von Git und Commit; die Anwendung startet und arbeitet. Ein Datum, das sich nicht ermitteln lässt, lässt den Commit bestehen. `create_app()` hat dafür die Parameter `revision_lookup` und `commit_date_lookup` (für Tests). Tests: `tests/test_revision.py`.

## 3. Voraussetzungen für die Entwicklung

Wie bei pipwerk Studio ([technische Dokumentation pipwerk Studio](pipwerk-studio.md), Abschnitt 3): Python 3.14 oder neuer und uv, für die Oberfläche Node.js 24 oder neuer mit npm (`engines` in `frontend/package.json`). Alle Python-Pakete installiert uv in `backend/.venv`, alle Pakete der Oberfläche npm in `frontend/node_modules`. Die Browsertests brauchen Browser für Playwright: `npx playwright install chromium` (zusätzlich `firefox` und `webkit` für die Prüfung des Starts in diesen Engines).

## 4. Einrichtung und Start im Entwicklungsbetrieb

### 4.1 Einrichtung

```sh
cd components/pipwerk-replay/backend
uv sync --frozen
cd ../frontend
npm ci
```

### 4.2 Start

```sh
cp pipwerk-replay.example.ini pipwerk-replay.ini
uv run --frozen pipwerk-replay -c pipwerk-replay.ini --host 127.0.0.1 --port 8000
```

Die Oberfläche startet im Entwicklungsbetrieb in einem zweiten Terminal:

```sh
cd components/pipwerk-replay/frontend
npm run dev
```

Der Entwicklungsserver von Vite hört auf `127.0.0.1` und dem Vorgabeport von Vite (5173; ist er belegt, endet der Start, `strictPort`) und leitet Anfragen unter `/api` an das Backend weiter. Dessen Adresse steht in der Umgebungsvariablen `PIPWERK_REPLAY_BACKEND_URL` (Vorgabe `http://127.0.0.1:8000`). Der Kopf `Host` bleibt wie der Browser ihn sendet (`changeOrigin: false`); das Backend prüft ihn (Abschnitt 2.4). `npm run build` prüft die Typen (`tsc --noEmit`, `strict`) und baut nach `frontend/dist`; `npm run typecheck`, `npm test` (Vitest) und `npm run e2e` (Playwright) sind die Prüfungen (Abschnitt 6.2).

Ohne `-c` wird einer der Suchorte aus Abschnitt 2.2 verwendet. `--host` und `--port` überschreiben die Einträge der Startkonfiguration; der Port muss eine ganze Zahl von 1 bis 65535 sein. Die Beschreibung der Web-API zeigt `http://127.0.0.1:8000/docs`. Die lokal erzeugten Dateien `backend/pipwerk-replay.ini`, `backend/pipwerk-replay.db` und `backend/pipwerk-marketdata.db` (jeweils mit `-journal`, `-wal`, `-shm`) schließt `components/pipwerk-replay/.gitignore` aus; versioniert bleibt nur `backend/pipwerk-replay.example.ini`.

## 4a. Start als Testumgebung

Die Testumgebung ist pipwerk replay, gestartet aus genau einem Commit. Das Skript `components/pipwerk-replay/scripts/testenv` (POSIX-Shell) arbeitet auf dem Arbeitsverzeichnis, in dem es liegt, und enthält keine festen Ports, Pfade oder Rechnernamen. Es wird mit absolutem Pfad aus einem beliebigen Verzeichnis oder mit relativem Pfad aus dem Wurzelverzeichnis des Arbeitsverzeichnisses aufgerufen:

```sh
<Arbeitsverzeichnis>/components/pipwerk-replay/scripts/testenv start --frontend-port <port> --backend-port <port> [--host <adresse>]
<Arbeitsverzeichnis>/components/pipwerk-replay/scripts/testenv status
<Arbeitsverzeichnis>/components/pipwerk-replay/scripts/testenv stop
```

Voraussetzungen: Git, Python 3 (Prüfung der Ports und der Erreichbarkeit), `ps`, uv, und mit Oberfläche Node.js mit npm; ein Zugriff auf die Paketquellen für `uv sync --frozen` (und `npm ci`); freie Ports. Das Arbeitsverzeichnis muss ein Arbeitsverzeichnis von Git sein.

`start`:

1. Prüft die Parameter. `--frontend-port` und `--backend-port` sind Pflicht, ganze Zahlen von 1 bis 65535 und verschieden. `--host` ist die Adresse, an die sich die Oberfläche bindet; ohne Angabe `127.0.0.1`. Das Backend bindet sich immer an `127.0.0.1`. Jede andere Angabe ist ein unbekannter Parameter (Exitcode 1, Meldung `unknown parameter: <Name>`, es geschieht nichts); das gilt seit Auftrag 12 auch für `--source-url`, `--source-key-file` und `--source-key`, die Parameter für eine Quelle, die entfallen sind (Abschnitt 2.9).
2. Prüft, dass das Verzeichnis des Skripts in einem Arbeitsverzeichnis von Git liegt, und mit `git status --porcelain` für die ganze Wurzel, dass es keine nicht committeten Änderungen und keine nicht ignorierten neuen Dateien gibt. Vorher wird nichts installiert, gebaut oder gestartet.
3. Stellt fest, ob `components/pipwerk-replay/frontend/` vorhanden ist. Nur dann wird die Oberfläche gebaut und gestartet und `npm` gebraucht. Seit Auftrag 05 ist es vorhanden; der Zweig ohne Oberfläche bleibt für Stände ohne `frontend/` erhalten (siehe unten).
4. Prüft die Programme, dass keine laufende Testumgebung verzeichnet ist und dass die Ports frei sind (den Port der Oberfläche nur mit Oberfläche).
5. Installiert die Abhängigkeiten nach der Lockdatei (`uv sync --frozen`; mit Oberfläche `npm ci` und `npm run build`).
6. Legt unter `components/pipwerk-replay/.testenv/` eine INI-Startkonfiguration mit einer eigenen SQLite-Datei an (nur der Abschnitt `[database]`: der Datenbestand liegt in derselben Datei und beginnt leer; Kursdaten kommen über den Import hinein) und startet das Backend mit `-c` auf `127.0.0.1:<backend-port>`; mit `--host` mit `--allowed-host <Wert>`, bei `0.0.0.0` und `::` zusätzlich mit `--allowed-host '*ip'`. Mit Oberfläche startet es danach `vite preview` auf `<host>:<frontend-port>`; `vite preview` leitet Anfragen unter `/api` an das Backend weiter (Umgebungsvariable `PIPWERK_REPLAY_BACKEND_URL`, vom Skript gesetzt).
7. Wartet, bis `/api/health` `{"status": "ok"}` liefert (Zeitbegrenzung 120 Sekunden): mit Oberfläche über den Port der Oberfläche, also durch den Proxy bis zum Backend, sonst am Port des Backends. Danach meldet es die Adresse.

**Keine Einrichtung einer Quelle (Auftrag 12).** Das Skript richtet nichts außer dem Backend und der Oberfläche ein. Die Datei `.testenv/pipwerk-replay.ini` liegt im Verzeichnis `.testenv/` (Modus 700), das `stop` entfernt; sie enthält keine Zugangsdaten. Das Skript setzt weder `set -x` noch gibt es Werte der Konfiguration aus. Der Zustand (`.testenv/state`) hält nur Prozesskennungen, Ports und die Adresse der Oberfläche.

Ohne Verzeichnis `frontend/` läuft nur das Backend. Der Parameter `--frontend-port` ist trotzdem Pflicht und wird geprüft, damit sich der Aufruf nicht ändert; der Port wird nicht belegt. `start` meldet dann `pipwerk replay is running: backend only, http://127.0.0.1:<backend-port>/docs (this commit has no user interface)`. Mit Oberfläche meldet es `pipwerk replay is running: http://<host>:<frontend-port>/ (backend on 127.0.0.1:<backend-port>)`.

Abbruchfälle von `start` (Exitcode ungleich 0, Ursache auf der Fehlerausgabe): ungültige, fehlende oder unbekannte Parameter; das Verzeichnis liegt nicht in einem Arbeitsverzeichnis von Git; eine nicht committete Änderung oder nicht ignorierte neue Datei (die Meldung nennt die ersten Dateien; bei diesen Fällen wurde nichts angelegt); ein Programm fehlt, es läuft schon eine Testumgebung oder ein Port ist belegt; Installation oder Bau scheitert, ein Prozess endet beim Start oder `/api/health` antwortet nicht rechtzeitig (das Skript gibt die letzten Zeilen der Protokolle aus, beendet die gestarteten Prozesse und entfernt `.testenv/`).

`status` nennt, ob die Testumgebung läuft, ihre Adressen von Oberfläche und Backend. Exitcode 0 bei laufender, 1 bei nicht oder nur teilweise laufender Testumgebung; läuft nur eines der beiden Programme, meldet es `not running completely`. Ohne Oberfläche gibt es genau den Zustand „läuft“ mit dem Zusatz `(backend only, this commit has no user interface)`. `stop` beendet die Prozesse (zuerst SIGTERM, nach 10 Sekunden SIGKILL) und entfernt `.testenv/`, also auch die Datenbank mit den Testkonten und Einstellungen. Zustand, Prozesskennungen, Protokolle (`backend.log`, `frontend.log`), die INI und die Datenbank liegen in `components/pipwerk-replay/.testenv/`, das in `components/pipwerk-replay/.gitignore` steht. Test: `backend/tests/test_testenv.py` (Abschnitt 6.1).

Adressen: Oberfläche (mit Oberfläche) `http://<host>:<frontend-port>/`; Schnittstellenbeschreibung des Backends `http://127.0.0.1:<backend-port>/docs` und `/openapi.json`, nur auf `127.0.0.1` des Rechners der Testumgebung. Das Risiko bei `--host` außerhalb der Loopback-Adresse ist das von pipwerk Studio: Ohne Authentisierung sind alle Endpunkte, auch die schreibenden, für jeden im Netz erreichbar, sobald die Oberfläche erreichbar ist; eine solche Adresse ist nur in einem Netz zu verwenden, dem alle Teilnehmer vertraut werden.

## 5. HTTP-Schnittstelle

### 5.1 Technischer Endpunkt und interne Endpunkte

| Methode | Pfad | Erfolgsantwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/health` | HTTP 200 mit `{"status": "ok"}` | technische Prüfung, ob die Oberfläche ihr Backend erreicht |
| `GET` | `/api/replay/settings/language` | `200` mit `{"language": "de"}` oder `"en"` | Einstellung Sprache lesen; ohne gespeicherten Wert `de` |
| `PUT` | `/api/replay/settings/language` | `200` mit `{"language": …}` | Sprache speichern; Body ausschließlich `{"language": "de"}` oder `"en"` |
| `GET` | `/api/replay/settings/test-run-broker` | `200` mit `{"broker": "<Name>", "chosen": true}`; `broker` ist der Broker, der gilt (`null` nur, wenn der Datenbestand keinen Broker hat), `chosen` sagt, ob es der gewählte ist (sonst der erste des Datenbestands in alphabetischer Reihenfolge) | Broker für Testläufe lesen (Abschnitt 2.7) |
| `PUT` | `/api/replay/settings/test-run-broker` | `200` mit `{"broker": …, "chosen": …}` (der Broker, der danach gilt) | Broker für Testläufe wählen; Body ausschließlich `{"broker": "<Name>"}` (nur ein Broker, der im Datenbestand vorkommt, sonst `422`) oder `{"broker": null}` (entfernt die Wahl) |
| `GET` | `/api/replay/revision` | `200` mit `{"revision": "<7 Zeichen>", "commit": "<40 Zeichen>", "committed_at": "<ISO 8601 mit Zeitzone>"}`; jedes Feld kann `null` sein (Abschnitt 2.10) | Stand lesen |

Entscheidung zu Abschnitt 7 der Spezifikation („Interne Endpunkte für Einstellungen wie in pipwerk Studio“) und zu Auftrag 01: Die Einstellungen und der Stand sind interne Endpunkte unter `/api/replay/`, wie `/api/studio/` bei pipwerk Studio. Sie sind interne Verbindungen innerhalb von pipwerk replay (seine Oberfläche nutzt sie), kein Bestandteil der öffentlichen Web-API und keine versionierte Definition der Schnittstellen unter `contracts/`; sie bleiben in `/docs` sichtbar, stehen aber nicht in der Datei unter `contracts/api/`. Die früheren Pfade `GET` und `PUT /api/v1/settings` aus Auftrag 01 sind entfallen, samt ihrer Beschreibung; sie antworten wie jeder unbekannte Pfad mit `404`. Die Regeln für Bodys, Größe, Medientyp und Fehler sind die der öffentlichen Web-API (Abschnitt 5.2), `BodyLimitMiddleware` begrenzt auch den Präfix `/api/replay/` auf `max_body_bytes`, und die Prüfung des Kopfs `Host` gilt auf jedem Pfad. Die früheren Pfade `GET` und `PUT /api/replay/settings/default-source` aus Auftrag 04 sind in Auftrag 12 entfallen (Bezeichnung „Broker für Testläufe“ statt „Standardquelle“, Spezifikation 5.1); sie antworten mit `404`. Die Modelle `ReplayLanguage`, `ReplayLanguageUpdate`, `ReplayBrokerForTestRuns`, `ReplayBrokerForTestRunsUpdate` und `ReplayRevision` lassen keine zusätzlichen Felder zu. Der technische Endpunkt `/api/health` gehört ebenfalls nicht zur Beschreibung unter `contracts/api/`.

### 5.2 Web-API unter `/api/v1/`

| Methode | Pfad | Erfolgsantwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/v1/accounts` | `200` mit `{"items": [Account, …]}` | alle Testkonten, nach Namen sortiert |
| `POST` | `/api/v1/accounts` | `201` mit `Account` | legt ein Testkonto unter einer neuen Kennung an |
| `GET` | `/api/v1/accounts/{id}` | `200` mit `Account` | liest ein Testkonto |
| `PUT` | `/api/v1/accounts/{id}` | `200` mit `Account` | ersetzt alle Werte eines Testkontos; legt nie eines an |
| `DELETE` | `/api/v1/accounts/{id}` | `204` ohne Body | löscht ein Testkonto, auch das Standard-Testkonto |
| `GET` | `/api/v1/market-data/series` | `200` mit `SeriesPage` | Liste der Reihen, gefiltert (`broker`, `instrument`, `data`), seitenweise (`offset`, `limit`), mit Gesamtzahl |
| `GET` | `/api/v1/market-data/series/details` | `200` mit `SeriesDetails` | Lücken und Kontraktdaten einer Reihe (Abfrage `broker`, `instrument`, `data`) |
| `GET` | `/api/v1/market-data/brokers` | `200` mit `Brokers` | die Broker des Datenbestands |
| `GET` | `/api/v1/market-data/instrument` | `200` mit `InstrumentInfo` | neueste Angaben zu einem Instrument (Abfrage `broker`, `instrument`, freiwillig `as_of`) |
| `POST` | `/api/v1/market-data/imports` | `200` mit `ImportOutcome` | Import mehrerer Dateien in einem Vorgang (Body: Formular `multipart/form-data`, Abschnitt 2.8) |
| `POST` | `/api/v1/market-data/imports/preview` | `200` mit `ImportPreview` | was die Dateien über sich sagen, ohne zu importieren (Formular) |
| `POST` | `/api/v1/market-data/completeness` | `200` mit `Completeness` | benötigt, vorhanden, fehlt für eine Liste von Teilen |

`{id}` (Testkonten) ist eine UUID. Die Modelle `AccountInput`, `Account`, `AccountList`, die des Datenbestands (`marketdata_models.py`: `SeriesRow`, `SeriesPage`, `SeriesDetails`, `Brokers`, `InstrumentInfo`, `ImportResult`, `RejectedRow`, `FileOutcome`, `ImportOutcome`, `ImportRefused`, `FileHint`, `ImportPreview`, `CompletenessRequest`, `Completeness`, `PartCompleteness`, `CandlesPart`, `TicksPart`, `InstrumentPart`, `Period`, `MissingPeriod`) und für Fehler `ApiError` und `InvalidRequest` lassen keine zusätzlichen Felder zu. Die Eingaben des Datenbestands sind Pydantic-Modelle mit `extra="forbid"`: der Body der Vollständigkeit (strenge Typen; eine Zeit ist Text nach ISO 8601 mit Zeitzone, eine Zahl oder eine Zeit ohne Zeitzone wird abgelehnt), die Abfrageparameter von Liste, Einzelheiten und Angaben zum Instrument (ein unbekannter Parameter ergibt `422`) und das Formular des Imports (`import_form.py`, Abschnitt 2.8).

Regeln (wie bei pipwerk Studio, `api_support.py`):

- Ein Body ist JSON mit dem Medientyp `application/json` (auch mit Parametern und in beliebiger Schreibweise), sonst `415`. Eine Webseite eines anderen Ursprungs kann so nicht mit einem einfachen Formular schreiben; gegen DNS-Rebinding schützt die Prüfung des Kopfs `Host` (Abschnitt 2.4).
- Der Body wird als Ganzes gelesen und streng geprüft: Ein Body, der kein JSON-Objekt ist, ein doppelter Schlüssel, `NaN` und `Infinity`, ein falscher Typ, ein zusätzliches Feld und jeder Wert außerhalb seines Bereichs ergeben `422`. Die Antwort nennt den Ort jedes Fehlers im Body und seine Art, nie den Wert.
- Die Größe des Bodys ist begrenzt (`max_body_bytes` der Startkonfiguration, Vorgabe 2 MiB), sonst `413`. `body_limit.py` (`BodyLimitMiddleware`) prüft das für alle Anfragen unter `/api/v1/` und `/api/replay/`, bevor die Anwendung den Body liest: Nennt `Content-Length` mehr als das Limit, wird sofort mit `413` geantwortet; sonst zählt die Middleware die ankommenden Bytes, ohne `Content-Length` zu trauen, und bricht beim Überschreiten ab. Die zwei Pfade des Imports und der Vorschau haben ein eigenes Limit, die Gesamtgröße der Dateien `max_import_bytes` plus die Hülle des Formulars (Abschnitt 2.8; die Middleware kennt Abweichungen für genau einen Pfad, `overrides`).
- Die Dateien eines Imports sind die Teile eines Formulars (`multipart/form-data`; sonst `415` mit `{"detail": "The request body must be a form with files (Content-Type: multipart/form-data)."}`). Dieser Medientyp gehört zu denen, die eine Webseite eines anderen Ursprungs ohne Vorabfrage senden kann; deshalb prüft das Backend den Kopf `Origin` (`403`, Abschnitt 2.8).
- Die Fehlertexte sind fest. Sie nennen weder Pfade noch Ausnahmetexte noch Werte.

| Status | Fall | Body |
| --- | --- | --- |
| 400 | der Kopf `Host` fehlt oder nennt keinen erlaubten Namen (auf jedem Pfad) | `{"detail": "The Host header of the request is not allowed."}` |
| 403 | Formular eines Imports von einer Webseite eines anderen Ursprungs (Kopf `Origin`) | `{"detail": "The request comes from a web page of another origin."}` |
| 404 | unbekannte Kennung eines Testkontos | `{"detail": "The test account does not exist."}` |
| 404 | keine Angaben zu diesem Instrument | `{"detail": "There are no data of this instrument."}` |
| 404 | keine solche Zeile in der Liste der Reihen (auch eine Kennung der Daten, die es nicht gibt) | `{"detail": "There is no such row in the list of series."}` |
| 409 | Vollständigkeit ohne Broker, und der Datenbestand hat keinen | `{"detail": "The data stock has no broker yet. Import data first."}` |
| 413 | Body über dem Limit | `{"detail": "The request body is larger than the limit."}` |
| 413 | Import mit mehr Dateien als `max_files_per_import` oder Dateien zusammen über `max_import_bytes` | `{"detail": "The import is refused as a whole.", "code": "too_many_files"` beziehungsweise `"batch_too_large", "message": "<fester Text>"}` |
| 415 | der Medientyp ist nicht `application/json` | `{"detail": "The request body must be JSON (Content-Type: application/json)."}` |
| 415 | der Medientyp eines Imports ist nicht `multipart/form-data` | `{"detail": "The request body must be a form with files (Content-Type: multipart/form-data)."}` |
| 422 | Body passt nicht zum Schema | `{"detail": "The request body does not fit the schema.", "errors": [{"location": [...], "type": "<Fehlertyp von Pydantic>"}]}`; `location` ist `[]` bei einem Body, der kein gültiges JSON ist (`type` `json_invalid`); sonst der Ort des Fehlers im Body |
| 422 | mehr Teile als `max_parts_per_request`, `limit` über `max_listed_items` | wie oben, mit `{"location": ["parts"], "type": "too_long"}` beziehungsweise `{"location": ["query", "limit"], "type": "less_than_equal"}` |
| 422 | Abfrageparameter oder `{id}` passen nicht | `{"detail": "The request is invalid.", "errors": [{"location": ["path", "id"], "type": "uuid_parsing"}]}` (bei Abfrageparametern `["query", "<Name>"]`) |
| 422 | Formular eines Imports ist falsch (fehlender oder ungültiger `broker`, unbekanntes Feld, Zahl von `instrument` oder `data` ungleich der Zahl der Dateien, Zeitzone zu lang) | `{"detail": "The request body does not fit the schema.", "errors": [{"location": ["broker"], "type": "missing"}]}`; ein Formular, das sich nicht lesen lässt: `{"detail": "The form of the request is invalid.", …}` |
| 422 | Import ohne Datei | `{"detail": "The import is refused as a whole.", "code": "no_files", "message": "The process has no file."}` |
| 422 | Broker für Testläufe, der im Datenbestand nicht vorkommt (interner Endpunkt) | `{"detail": "The broker has no data in the data stock.", "errors": [{"location": ["broker"], "type": "broker_not_in_data_stock"}]}` |
| 429 | zu viele gleichzeitige Importe oder Vorschauen | `{"detail": "Too many imports are running. Try again later."}` |
| 503 | die gespeicherte Sprache ist ungültig (nur Lesen der Einstellung) | `{"detail": "The stored pipwerk replay language is invalid."}` |
| 503 | der gespeicherte Broker für Testläufe ist ungültig (Lesen der Einstellung und Vollständigkeit ohne `broker`) | `{"detail": "The stored pipwerk replay broker for test runs is invalid."}` |
| 503 | Fehler der Datenbank des Datenbestands | `{"detail": "The data stock could not be read or changed."}` |

Höchstens 50 Einträge in `errors`; ein Text im Ort wird bei mehr als 100 Zeichen gekürzt. Eine andere Methode auf diesen Pfaden antwortet mit `405`, ein unbekannter Pfad mit `404`. Die Gründe, aus denen eine einzelne Datei eines Imports abgelehnt wird, stehen nicht hier, sondern im Ergebnis je Datei (`error`, `message`; Abschnitt 2.8).

**Sprache der Fehlertexte (Entscheidung des Entwicklers).** Die Texte sind fest, englisch und in der Sprache des Händlers geschrieben, also ohne Namen von Ausnahmen, Pfade und Inneres (`The broker has no data in the data stock.`, `There is no such row in the list of series.`). Die Oberfläche zeigt den Anwendern ihre eigenen, nach der Kennung (`code`, `type`, `error`) übersetzten Texte in der gewählten Sprache (Auftrag 14); `detail` ist für Programme und Protokolle. Grund: Die bisherigen Texte der Web-API sind englisch (Abschnitt 5.2), die deutschen Texte kamen nur aus der Beschaffung, die entfallen ist.

### 5.3 Beschreibung der Web-API unter `contracts/api/`

Die Beschreibung (OpenAPI 3.1) liegt unter `contracts/api/pipwerk-replay/v1/openapi.json`. Sie wird aus der Anwendung erzeugt (`pipwerk_replay.contract`): `public_description()` beschränkt sie auf die Pfade unter `/api/v1/` und die Schemata, die diese Pfade verwenden; `/api/health` und die internen Endpunkte unter `/api/replay/` gehören nicht hinein. Sie beschreibt die Testkonten und den Datenbestand (Liste der Reihen, Einzelheiten, Broker, Import mehrerer Dateien mit Vorschau, Vollständigkeit); die Beschaffung gibt es nicht mehr. `info.version` bleibt `1.0.0`: Der Wegfall von `/api/v1/settings` aus Auftrag 01, der Pfade der Beschaffung, der Übersicht und der Importe einer Datei und die neuen Pfade gehören zum selben Arbeitspaket `wp02`, das noch nicht abgenommen ist. Das Formular eines Imports steht als Body `multipart/form-data` (Felder `broker`, `timezone`, `file` als Liste von `string`/`format: binary`, `instrument`, `data`), die Abfrageparameter der Liste und der Einzelheiten als Parameter. **Beispiele** (`examples` am Medientyp der Antworten und des Formulars, aus `marketdata_examples.py`): Liste der Reihen (mit Lücke und mit Kontraktdaten-Zeile, leer), Einzelheiten (mit und ohne Kontraktdaten), Broker, Import (drei Dateien, eine abgelehnt), abgelehnter Vorgang, Vorschau, das Formular. Ein Test prüft jede Antwort der Beispiele gegen ihr Modell, so dass ein Beispiel nicht von der Anwendung abweichen kann. FastAPI lässt jeden Wert `null` aus der Beschreibung weg (`exclude_none`), auch in einem Beispiel; die Beispiele schreiben `null` deshalb als Marke, die `keep_nulls_in_examples()` nach dem Erzeugen wieder einsetzt. Titel ist „pipwerk replay“, `info.version` ist die Version der Web-API (`1.0.0`). Die Anwendung wird mit `separate_input_output_schemas=False` erzeugt. Der Body der Anfragen ist mit `openapi_extra` beschrieben (das Schema des Modells steht an der Stelle des Bodys), weil der Body vom Modul gelesen und geprüft wird. Der Befehl, der die Datei neu erzeugt (im Verzeichnis `components/pipwerk-replay/backend`):

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
| `test_config_datastock.py` | Einträge von `[marketdata]`: Vorgaben, jeder Eintrag, jeder ungültige Wert, `max_import_bytes` gegen `max_upload_bytes`, keine Wiederholung eines Werts in Fehlermeldungen, Syntaxfehler nur mit Zeilennummer, Beispieldatei; **Start mit einer Startkonfiguration aus der Zeit der Beschaffung** (Abschnitt `[source]` wird ignoriert, Start über die Kommandozeile, `create_app()` ohne Quelle); die Einstellungen kommen in der Anwendung an; eine oder zwei Datenbanken, getrennte Migrationen, Schritt von Revision `0001` bis `0003`, neuere Version des Datenbestands |
| `test_market_series.py` | Liste der Reihen (leer, Zeilen, Lücken, Kontraktdaten-Zeile, Sortierung, jeder Filter, unbekannte Kennung der Daten, Seiten, Gesamtzahl, Grenze `max_listed_items`, ungültige Abfragen), Einzelheiten (Lücken, Kontraktdaten oder `null`, Kürzung, Ticks, Kontrakt-Zeile, 404 für jede Zeile, die es nicht gibt, ungültige Abfragen), Broker |
| `test_market_import.py` | Import mehrerer Dateien (JSON und CSV zusammen, gemeinsamer Broker und gemeinsame Zeitzone, Ergebnis je Datei, abgelehnte Datei neben übernommenen, abgelehnte Zeilen, Ersetzen, Angaben je Datei, unbekannte Kennung der Daten, Format nach Endung und Inhalt), Grenzen (Zeilen, Größe einer Datei, Gesamtgröße, Zahl der Dateien, keine Datei, Body über dem Limit, Passung von Begrenzer und Gesamtgröße, gleichzeitige Vorgänge), Fehler der Datenbank, falsches Formular (jeder Fehler mit Ort), Medientyp, Herkunft des Formulars (403), die alten Pfade sind weg, Dateinamen als Pfad-Einschleusung, Vorschau (Namen, JSON-Inhalt, Broker aller Dateien, nicht lesbare Dateien, nichts wird importiert, Grenzen) |
| `test_marketdata_api.py` | Angaben zum Instrument und Vollständigkeit (jede Art Teil, Broker der Anfrage, Broker für Testläufe, Grenzen, ungültige Anfragen, 503 bei ungültigem gespeichertem Wert, Fehler der Datenbank bei jedem Lesen) |
| `test_marketdata_contract.py` | Beschreibung des Datenbestands: Aufzählungen gleich denen der Bibliothek, nichts von Beschaffung oder Quelle, Formular des Imports und der Vorschau, Teile mit `kind`, zusätzliche Felder abgelehnt, Beispiele passen zu den Modellen |
| `test_internal_api.py` | interne Endpunkte: Broker für Testläufe (leerer Datenbestand, Rückfall auf den ersten Broker, Wählen, Entfernen, nur ein Broker des Datenbestands, nicht mehr vorkommender Broker, ungültige Bodys, 503 und Reparatur), Medientyp, Methoden, Begrenzung des Bodys, Kopf `Host`, keine Aufnahme in die Beschreibung |
| `test_revision.py` | Stand: Ermittlung, jeder Fehlerweg, Warnungen ohne Pfad und Commit, einmalige Ermittlung, echtes Git, Antwortmodell mit Invarianten |
| `test_cli.py` | Start ohne gültige INI, nicht nutzbare URL, ungültiger Eintrag, Datenbank einer neueren Version, `--host` und `--port` gegen die Konfiguration, `create_app()` ohne Konfiguration |
| `test_host_check.py` | Kopf `Host`: erlaubte und abgewiesene Namen, ungültige Köpfe, jeder Pfad, Reihenfolge vor der Begrenzung des Bodys, Liste aus Konfiguration und Kommandozeile |
| `test_body_limit.py` | Begrenzung des Bodys auf der Ebene von ASGI und an der Web-API, auch mit anderem Limit und mit eigenem Limit für einen Pfad |
| `test_docs_page.py` | `/docs`: feste Version, `integrity`, nichts anderes von außen |
| `test_migrations.py`, `test_memory_databases.py` | Alembic: neue und aktuelle Datenbank (Revision `0003`), Übernahme der Standardquelle als Broker für Testläufe (mit Wert, ohne Wert, leere Tabelle, Rücknahme), neuere Version, Rücknahme bei Fehler, Schema gleich dem ORM-Modell, Datenbanken im Speicher |
| `test_accounts_service.py` | Standard-Testkonto: erster Start, zweiter Start, Änderung, Löschen und Neustart, gleichnamiges Konto des Anwenders, gleichzeitige Starts, beschädigte Zeile |
| `test_accounts_api.py` | Testkonten: alle Vorgänge der Web-API und jeder Fehlerfall der Prüfung (jedes Feld mit jedem Fehler, fehlende und zusätzliche Felder, Name, Regel für den Spread, JSON-Fehler, Medientyp, Kennung, Methoden, Fehlerformat) |
| `test_settings.py` | Einstellung Sprache (`/api/replay/settings/language`): Vorgabe, Lesen, Schreiben, ungültige Bodys, 503 und Reparatur, Neustart des Prozesses, kein Pfad `/api/v1/settings` |
| `test_contract.py` | Beschreibung unter `contracts/api/`: gleich der erzeugten, Abweichung gefunden, Pfade (nur `/api/v1/`), Schemata, Befehl |
| `test_testenv.py` | Testumgebungsskript (Abschnitt 4a): Prüfung auf nicht committete Änderungen, Parameter, Ports, nur Backend ohne `frontend/`, Oberfläche mit `frontend/` (Installation und Bau, Ablauf `start`, `status`, `stop` mit Backend und Oberfläche, `status` bei ausgefallener Oberfläche), erlaubte Namen, Startkonfiguration der Testumgebung nur mit `[database]`, die Parameter einer Quelle sind unbekannte Parameter (nichts geschieht), keine Quelle im Skript |
| `test_health.py` | `/api/health`, 405, 404, Name der Anwendung |

`test_testenv.py` arbeitet auf einem Abbild der versionierten Dateien (`LICENSE`, `components/pipwerk-replay/**`, die der Oberfläche nur, wo ein Test sie verlangt) in einem temporären Verzeichnis mit Platzhaltern für `uv`, `npm` und `npx` und je einem kleinen Programm anstelle des Backends und von `vite preview`; die Tests werden ohne installiertes Git und außerhalb eines Git-Arbeitsverzeichnisses mit Begründung übersprungen. Er liest die versionierten Dateien aus Git: Neue Dateien müssen mit `git add` vorgemerkt sein, damit das Abbild sie enthält. Die Prozessliste (`ps -e -ww -o args=`) wird ohne Kürzung gelesen; `ps` kürzt Zeilen bei der Ausgabe in eine Pipe sonst auf 80 Zeichen, und die Prüfung „es läuft kein Prozess aus dem Abbild“ wäre leer.
Die Prüfung mit `ruff` und `mypy` entspricht der von pipwerk Studio (`strict = true`, Regeln `E`, `W`, `F`, `I`, `N`, `UP`, `B`, `S`, `A`, `C4`, `SIM`, `RUF`, Zeilenlänge 100).

### 6.2 Oberfläche

**Stand: Auftrag 05, in Auftrag 12 unverändert.** Die Oberfläche hat der Auftrag 12 nicht angefasst; ihre Tests der Datenansicht und die Browsertests beschreiben noch Beschaffung, Standardquelle, Import einer Datei und Übersicht, die das Backend nicht mehr hat. Die Browsertests starten außerdem die nachgebildete Quelle aus der Entwicklungsgruppe des Backends, die dort nicht mehr steht. Auftrag 14 passt Oberfläche und Tests an (Abschnitt 9). Bis dahin scheitert im Prüfskript (Abschnitt 6.3) der Browsertest; sein Backend-Teil besteht. Die Vitest-Tests der Oberfläche laufen gegen den Ersatz `FakeBackend` und sind von dem Backend unabhängig.

Im Verzeichnis `components/pipwerk-replay/frontend`:

```sh
npm ci
npm run typecheck     # tsc --noEmit, strict
npm test              # Vitest mit Testing Library (jsdom)
npm run build         # Typprüfung und Bau nach dist/
npm run e2e           # Playwright gegen die gebaute Oberfläche und ein echtes Backend
```

**Vitest** (`src/**/*.test.ts(x)`, `buildinfo/**/*.test.ts`). Die Komponenten laufen gegen `FakeBackend` (`src/test-utils.tsx`), einen Ersatz für `fetch`, der die Web-API mit ihren Antworten nachbildet und jeden Aufruf aufschreibt:

| Datei | Prüft |
| --- | --- |
| `AccountsView.test.tsx` | Liste und Formular, Standard-Testkonto (deutscher und englischer Name), neues Testkonto mit den Ausgangswerten, Speichern (Anfrage, Meldung), Ändern mit festem Spread, Verwerfen, jeder ungültige Wert mit Meldung und gesperrtem Speichern, Löschen erst nach der Rückfrage, nächstes Testkonto nach dem Löschen, Fehler beim Speichern, Namen als Text und nicht als HTML, Erklärung an jedem Feld |
| `DataView.test.tsx` | Übersicht (Reihen, Zeiträume, Lücken, Menge, Zeitformat beider Sprachen, abgeschnittene Antwort, Fehler), Angaben zum Instrument, Standardquelle (festlegen, entfernen, ungültiger Name), Import (CSV mit Anfrage und Ergebnis, Ticks ohne Zeiteinheit, JSON, falsches Format, Ablehnung als Ganzes mit Grund je Kennung, abgelehnte Zeilen in beiden Sprachen, zu große Datei, erneuter Import), Beschaffung (Teile für Kerzen, Ticks und Angaben, Fortschritt, Ergebnis, jede Fehlerart mit ihrem Text, „Keine Quelle eingerichtet“, unbekannte Kennung, Zeitraum in Minuten, ungültiger Zeitraum), Erklärung an jedem Feld, leere Zustände mit dem nächsten Schritt |
| `App.test.tsx` | Menü (nur „Datenbestand“ und „Testkonten“, kein Eintrag späterer Arbeitspakete, keine Kennzeichnung „Prototyp“), kompaktes Menü, Sprache (im Backend gespeichert, Fehler, nichts im Browser), Fußzeile (Backend erreichbar oder nicht, Stand mit Tooltip), Dialog „Über pipwerk replay“ (Inhalt, Fokus), Texte des Anwenders nur als Text |
| `useReplayLanguage.test.tsx`, `settingsApi.test.ts` | Zustand der Sprache wie bei pipwerk Studio: Standard, Lesen, Speichern, jeder Fehlerfall, Zeitbegrenzung von 10 Sekunden, Abbruch |
| `marketDataApi.test.ts`, `errors.test.ts`, `format.test.ts`, `accountForm.test.ts` | Lesen und Prüfen der Antworten, Aufbau der Anfragen (Medientyp, Abfrage, Anführungszeichen), Texte jeder Kennung in beiden Sprachen, Zeit- und Zahlenformate, Grenzen der Testkonten |
| `i18n.test.ts` | gleiche Schlüssel und Platzhalter in `de.json` und `en.json`, keine leeren Texte, keine deutschen Zeichen in den englischen Texten |
| `buildRevision.test.ts`, `commitDate.test.ts`, `timestamp.test.ts`, `repository.test.ts`, `buildinfo/*.test.ts` | Stand und Adresse des Repositorys wie bei pipwerk Studio; `vite.config.ts` (Proxy, Freigabe von `LICENSE`) |

**Playwright** (`e2e/`) arbeitet gegen die gebaute Oberfläche (`vite build --outDir dist-e2e`, dann `vite preview`) und ein echtes Backend, das die Tests selbst starten (`e2e/stack.ts`): das Backend `pipwerk-replay` mit eigener Startkonfiguration und eigener SQLite-Datei und die nachgebildete Quelle `pipwerk_fetch_mt5.fake_source` als Programm (aus der Entwicklungsgruppe des Backends, `uv run --frozen --project backend python -m pipwerk_fetch_mt5.fake_source`). Vor jedem Test beginnt das Backend mit leeren Datenbanken (`stack.reset()`); die Tests können Backend und Quelle beenden und neu starten (`restartBackend`, `stopSource`). Chromium führt alle Tests aus. Firefox und WebKit führen `smoke.spec.ts` aus (Start der gebauten Oberfläche ohne Fehler in der Konsole), soweit die Browser installiert sind.

**Ports und Datenbank sind Parameter**, keine festen Werte: `PIPWERK_REPLAY_E2E_FRONTEND_PORT`, `PIPWERK_REPLAY_E2E_BACKEND_PORT`, `PIPWERK_REPLAY_E2E_SOURCE_PORT` und `PIPWERK_REPLAY_E2E_DATA_DIR` (Verzeichnis der Datenbanken). Ein Port, der fehlt, ist ein freier Port, den `playwright.config.ts` einmal bestimmt und an Läufer und Arbeitsprozesse weitergibt; ohne Verzeichnis legen die Tests ein neues temporäres an und entfernen es am Ende. Der Schlüssel zur nachgebildeten Quelle ist ein Testwert und kein Geheimnis.

| Datei in `e2e/` | Inhalt |
| --- | --- |
| `smoke.spec.ts` | Start der gebauten Oberfläche und Öffnen beider Ansichten ohne Fehler in der Konsole (alle drei Browser) |
| `data.spec.ts` | Import einer CSV-Datei im Exportformat von MetaTrader 5 mit Anzeige der Reihe, des Zeitraums und der Lücke; Umrechnung der Zeitzone; Import einer fehlerhaften Datei mit abgelehnten Zeilen und Gründen; erneuter Import ersetzt; Datei als Ganzes abgelehnt; falsches Format; JSON mit Angaben zum Instrument; Beschaffung von Hand mit Erfolg (Kerzen, Ticks, Angaben) und mit Fehler (unbekanntes Symbol, Quelle nicht erreichbar, keine Quelle eingerichtet); ungültiger Zeitraum; Standardquelle (festlegen, nach Neustart, entfernen, als Vorschlag beim Import) |
| `accounts.spec.ts` | Standard-Testkonto; anlegen, ändern, speichern, löschen; Testkonten nach dem Neustart des Backends; Standard-Testkonto nach Löschen und Neustart wieder da; geändertes Standard-Testkonto bleibt; ungültige Werte; verwerfen; Name als Text |
| `language.spec.ts` | Sprache im Backend gespeichert, nach Neuladen und Neustart erhalten; keine deutschen Texte in der englischen Oberfläche (Datenbestand leer und gefüllt, Import mit abgelehnten Zeilen, Fehler, Testkonten, Rückfrage, Dialog), kein Englisch in der deutschen; Erklärung an jedem Feld mit Maus und Tastatur; nichts im Speicher des Browsers (`localStorage`, `sessionStorage`, Cookies, IndexedDB, Caches) |
| `layout.spec.ts` | die sechs Fenstergrößen 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768 und 1920 × 1080 für beide Ansichten, mit gefüllten Tabellen, geöffnetem Importformular, Ergebnis und Fehler: keine Bildlaufleiste der Seite, Kopfzeile, Hauptbereich und Fußzeile übereinander statt ineinander, Bedienelemente der Kopfzeile nebeneinander und im Fenster, keine Überlappung der Karten, kein Bedienelement außerhalb seiner Karte, jede Karte und das Ende der Ansicht erreichbar, Menü (voll oder kompakt), Dialoge im Fenster mit erreichbaren Schaltflächen |
| `about.spec.ts` | Dialog „Über pipwerk replay“ (Name, Stand aus dem Bau, Lizenz, Adresse), gesperrte Seite, Fokus bleibt im Dialog und kehrt zurück, Tooltip der Standanzeige, Anzeige bei nicht erreichbarem Backend |

### 6.3 Prüfskript

Das Prüfskript `components/pipwerk-replay/scripts/check` (POSIX-Shell) führt die Prüfungen aus den Abschnitten 6.1 und 6.2 nacheinander aus und endet mit Exitcode 0 nur, wenn alle bestehen. Es legt und hält der Tester Funktion. Es prüft das Arbeitsverzeichnis, in dem das Skript liegt; das Verzeichnis wird aus dem Pfad des Skripts bestimmt. Das Skript wird mit absolutem Pfad aus einem beliebigen Verzeichnis aufgerufen und enthält keine festen Ports, Pfade oder Rechnernamen.

```sh
<Arbeitsverzeichnis>/components/pipwerk-replay/scripts/check [--backend-port <port> --frontend-port <port>] [--with-audit]
```

| Parameter | Bedeutung |
| --- | --- |
| `--backend-port <port>` | Port des Backends im Browsertest, ganze Zahl von 1 bis 65535. Pflicht, sobald `frontend/` vorhanden ist; sonst darf er fehlen. |
| `--frontend-port <port>` | Port der Oberfläche im Browsertest, ganze Zahl von 1 bis 65535, verschieden vom Port des Backends. Pflicht, sobald `frontend/` vorhanden ist; sonst darf er fehlen. |
| `--with-audit` | Optional. Führt zusätzlich `pip-audit` für `backend/uv.lock` und `npm audit` für die Oberfläche aus (Zugriff auf das Internet nötig). |

Reihenfolge der Prüfungen:

1. Backend im Verzeichnis `backend`: `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check`, `mypy`
2. Vergleich der Beschreibung `contracts/api/pipwerk-replay/v1/openapi.json` mit der Anwendung (`python -m pipwerk_replay.contract … --check`)
3. Suche im Repository (`git grep`) nach den alten Bezeichnern der Komponente (Muster `pipwerk[-_ ]?backtest`, ohne Beachtung der Schreibweise) in allen versionierten Dateien außerhalb von `docs/design/` und `development/`; ein Treffer lässt die Prüfung scheitern
4. mit `--with-audit`: `pip-audit` für das Backend
5. Oberfläche im Verzeichnis `frontend` (seit Auftrag 05): `npm ci`, `npm run typecheck`, `npm test`, `npm run build`; mit `--with-audit` zusätzlich `npm audit`; danach der Browsertest `npm run e2e` mit den beiden Ports (Umgebungsvariablen `PIPWERK_REPLAY_E2E_BACKEND_PORT`, `PIPWERK_REPLAY_E2E_FRONTEND_PORT`), nach dem Muster von `components/pipwerk-studio/scripts/check`. Ohne Verzeichnis `frontend/` überspringt das Skript diese Schritte mit Hinweis in der Ausgabe; das gilt nicht als Fehler. Installation und Browsertest dauern lange; sie laufen beim Aufruf durch den Tester im Hintergrund.

Am Ende nennt das Skript die bestandenen, die übersprungenen und die gescheiterten Prüfungen. Exitcode 2 bei ungültigen Parametern oder fehlenden Programmen.

## 7. Abhängigkeiten

Laufzeit (festgeschrieben in `backend/uv.lock`): `alembic`, `fastapi` (mit `pydantic` und `starlette`), `pipwerk-marketdata` (Pfadabhängigkeit `packages/market-data`, Version `==0.1.0`, bringt `tzdata` mit), `python-multipart` (neu in Auftrag 12: Lesen des Formulars eines Imports; `request.form()` von Starlette verlangt es), `sqlalchemy`, `uvicorn`. Entwicklung und Prüfung: `httpx2` (Testclient von FastAPI; in Auftrag 04 zur Laufzeit verschoben, in Auftrag 12 mit der Beschaffung wieder in die Entwicklungsgruppe), `mypy`, `pytest`, `ruff`. `pipwerk-fetch-mt5` ist keine Abhängigkeit mehr. Mindestversionen stehen in `backend/pyproject.toml`: alembic 1.20.0, fastapi 0.141.1, python-multipart 0.0.20, sqlalchemy 2.1.3, uvicorn 0.54.0, httpx2 2.13.1, mypy 2.3.1, pytest 9.1.1, ruff 0.16.9; gelockt sind im Stand von Auftrag 12 unter anderem alembic 1.20.0, fastapi 0.156.8, httpx2 2.16.0, pydantic 2.13.5 (festgelegt durch `pipwerk-marketdata`), python-multipart 0.0.32, starlette 1.9.0, sqlalchemy 2.1.5, uvicorn 0.54.0. Die Seite `/docs` lädt Swagger UI von `cdn.jsdelivr.net` (Abschnitt 2.5).

Oberfläche (`frontend/package.json`, festgeschrieben in `frontend/package-lock.json`, Versionen wie bei pipwerk Studio): Laufzeit `react` und `react-dom` 19.3.0, `@tanstack/react-query` 5.104.0, `i18next` 26.4.2, `react-i18next` 17.0.15; Entwicklung und Prüfung `typescript` 7.0.2, `vite` 8.3.1, `@vitejs/plugin-react` 6.1.1, `vitest` 5.0.2, `jsdom` 30.1.1, `@testing-library/react` 16.3.3, `@testing-library/dom` 10.4.2, `@testing-library/jest-dom` 7.0.1, `@testing-library/user-event` 14.6.7, `@playwright/test` 1.63.0, `@types/node`, `@types/react`, `@types/react-dom`. Gegenüber pipwerk Studio fehlt `@xyflow/react`: Zeichenfläche und Eigenschaftenansicht gehören zu `wp03`. Weitere Abhängigkeiten gibt es nicht: keine Bibliothek für Tabellen, Formulare, Diagramme oder Symbole (die Symbole sind eigene SVG-Pfade in `src/ui.tsx`). Die Lizenz `GPL-3.0-only` und die Adresse des Repositorys stehen in `frontend/package.json`.

## 8. Entscheidungen und offene Punkte

Entscheidungen des Entwicklers in Auftrag 01 (die Spezifikation lässt sie offen oder der Auftrag überlässt sie ihm):

- Erkennung des Standard-Testkontos über eine feste Kennung (Abschnitt 2.6).
- Felder, Namen und Wertebereiche der Testkonten; Beträge als Fließkommazahlen; `PUT` ersetzt alle Werte; `is_default` nur lesend; Namen nicht eindeutig (Abschnitt 2.6).
- Startkonfiguration mit `[server]` `host`, `port`, `allowed_hosts` und `max_body_bytes` (Abschnitt 2.2); Kommandozeile überschreibt `host` und `port`.
- Keine Herkunft der Startkonfiguration (`ConfigOrigin`) und keine Abhängigkeit von `pipwerk_domain`: beides braucht dieser Stand nicht.
- Das Testumgebungsskript verlangt `--frontend-port` auch ohne Oberfläche (Abschnitt 4a).
- Die Beschreibung der Anfrage-Bodys steht inline im Pfad statt als benanntes Schema (Abschnitt 5.3).

Entscheidungen in Auftrag 04 (**hinfällig durch Auftrag 12, soweit sie Quelle, Beschaffung, Standardquelle, den Import einer Datei als Body und die Übersicht betreffen; siehe unten**). Aus dem Auftrag (entschieden vom Entwicklungsleiter): Die Einstellungen liegen unter internen Endpunkten `/api/replay/settings/…`, der Stand unter `/api/replay/revision`, `/api/v1/settings` entfällt (Abschnitt 5.1). Aus der Spezifikation und dem Auftrag, die den Entwickler entscheiden lassen:

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

Entscheidungen in Auftrag 05 (Oberfläche, Testumgebung; **hinfällig durch Auftrag 12 sind die zur Beschaffung von Hand, zur Standardquelle, zum Import einer Datei und zum Schlüssel der Testumgebung**). Die Spezifikation und der Auftrag lassen sie dem Entwickler; die Oberfläche folgt sonst dem bestätigten Prototyp:

- Die Oberfläche hält keinen eigenen Zustand der Daten: Alle Daten kommen aus der Web-API und liegen in der Zwischenablage von TanStack Query; Entwürfe von Formularen, die gewählte Datei und der laufende Auftrag sind Zustand der Komponenten (Abschnitt 9.2). Der Browser speichert nichts.
- Die Ansicht ist Zustand von `App`, nicht Teil der Adresse (keine Wiederherstellung nach Neuladen): Der Auftrag verlangt keine Adressen für Ansichten, und der Browser soll nichts speichern.
- Der Spread eines Testkontos heißt in der Oberfläche „Punkte“ (Spezifikation 6.2 und Feld `spread_points`), nicht „Pips“ wie im Prototyp.
- Die Kontowährung ist ein Textfeld mit Vorschlägen (EUR, USD, GBP, CHF, JPY) und der Prüfung „drei Großbuchstaben“, nicht eine Auswahl: Das Backend kennt keine Liste der Währungen (Abschnitt 2.6).
- Den englischen Namen des Standard-Testkontos setzt die Oberfläche selbst (Abschnitt 2.6); sie erkennt es an `is_default` und dem gespeicherten Namen `Standard-Testkonto`. Ein umbenanntes Standard-Testkonto zeigt seinen Namen.
- Beschaffung von Hand: Der Zeitraum sind Datum und Uhrzeit in UTC (Feld `datetime-local`, Minuten), „Bis“ ist ausgeschlossen, wie `end` der Web-API. Der Prototyp hatte ganze Tage. Grund: Die Quelle liefert höchstens `max_rows_per_request` Zeilen (Vorgabe 50 000); ein Tag Ticks hat mehr, und die Beschaffung wäre nie möglich gewesen. Vorbelegt sind die letzten sieben ganzen Tage bis 00:00 Uhr des heutigen Tages (UTC). Broker und Quelle wählt der Anwender nicht: Der Broker steht in den Dateien der Quelle, die Quelle ist die eine der Startkonfiguration.
- Die Beschaffung fragt den Stand alle 700 Millisekunden ab (`POLL_INTERVAL_MS`), solange er `running` ist. Der Fortschritt ist ein Balken ohne Prozentwert: Ein Auftrag hat hier einen Teil, und die Quelle meldet keinen Fortschritt innerhalb eines Teils. Wechselt der Anwender die Ansicht, bevor der Auftrag endet, zeigt die Oberfläche das Ergebnis nicht mehr; der Auftrag läuft im Backend zu Ende, und die Daten stehen im Datenbestand.
- Texte der Fehler zeigt die Oberfläche in der gewählten Sprache nach der Kennung (`src/errors.ts`): Kennungen der Quelle und von pipwerk replay (Abschnitt 2.9), Gründe abgelehnter Zeilen und ganzer Dateien. Nur für eine Kennung, die die Oberfläche nicht kennt, zeigt sie `reason` des Backends (deutsch). `src/errors.test.ts` prüft, dass jede Kennung der Aufzählungen beider Sprachen einen Text hat. Dem steht gegenüber, dass die deutschen Texte des Backends fest sind: Die englische Oberfläche darf keinen deutschen Text zeigen (`language.spec.ts`).
- Den Stand der Dateiliste prüft die Oberfläche nur an der Endung (`.json`, `.csv`); alles Weitere prüft der Import. Bei CSV sind Broker, Instrument und Zeitzone Pflicht, die Zeitzone ohne Vorgabe (eine Vorgabe wie `UTC` wäre ein Raten; Zeitzone und Sommerzeit sind der häufigste Fehler beim Import). Der Broker ist mit der Standardquelle vorbelegt.
- Die Kopfzeile zeigt das Menü ab 700 Pixel Breite ausgeschrieben, darunter als Liste hinter der Schaltfläche „Menü“ (der Prototyp ab 1280 Pixel, weil sein Menü vier Einträge und die Betriebsart hat). Die Betriebsart und die Menüeinträge von `wp03` und `wp04` gibt es nicht.
- Erklärungen zeigt eine eigene Ebene (`TipLayer`, nach dem Prototyp) bei Maus und Fokus, nicht das Attribut `title`; Tastatur erreicht sie über das Symbol „i“ jedes Felds (`tabindex=0`). Auch der Tooltip der Standanzeige nutzt sie (pipwerk Studio nutzt `title`); `aria-describedby` nennt denselben Text.
- Dialoge sind `<dialog>` mit `showModal()` und demselben Fokusfang wie der Dialog von pipwerk Studio (Abschnitt 9.5).
- Die Anzeige „Backend“ fragt ohne Wiederholungsversuche und danach alle 10 Sekunden (`HEALTH_INTERVAL_MS`): Ein nicht erreichbares Backend erscheint sofort (mit den Vorgaben von TanStack Query erst nach etwa 7 Sekunden Wiederholungen), und die Anzeige folgt dem Backend, wenn es zurückkommt.
- Die Angaben zu den Instrumenten liest die Oberfläche je Eintrag der Übersicht mit einer eigenen Anfrage (`GET /api/v1/market-data/instrument`); der Schlüssel der Anfrage enthält den Zeitpunkt der Beschaffung, neue Angaben ersetzen die gezeigten also von selbst. Bei sehr vielen Instrumenten sind das viele Anfragen; die Übersicht nennt höchstens `max_listed_items` (Vorgabe 1000).
- Den Prototyp-Bestandteil „Beispieldatei verwenden“ gibt es nicht: Er täuschte einen Import vor.
- Die Browsertests starten Backend und Quelle selbst (`e2e/stack.ts`) und nehmen freie Ports, wenn keine gegeben sind (Abschnitt 6.2); Firefox und WebKit führen nur den Start aus.
- Das Testumgebungsskript liest den Schlüssel nur mit eingebauten Befehlen der Shell und verlangt `--source-url` und `--source-key-file` zusammen (Abschnitt 4a).

Die Meldungen und offenen Punkte aus Auftrag 05 zur Beschaffung (Lesepfad für die eingerichtete Quelle, Zerlegung großer Zeiträume, Einrichtung einer Quelle in der Testumgebung) sind mit dem Entfall der Beschaffung (Abschnitt 2.9) erledigt.

Entscheidungen in Auftrag 12 (Behebung der Mängel M1, M3 und M4 des Abnahmeberichts). Die Spezifikation und der Auftrag lassen sie dem Entwickler:

- **Entfall der Beschaffung** mit Modul, Endpunkten, Modellen, Beschreibung, Konfiguration, Abhängigkeiten und Skriptparametern (Abschnitt 2.9). `create_app()` hat keine Parameter `source` und `source_client` mehr; Aufrufer mit ihnen scheitern mit `TypeError`.
- **Startkonfiguration mit dem früheren Abschnitt für die Quelle:** wird wie jeder unbekannte Abschnitt ignoriert, nicht geprüft und nicht gemeldet (Abschnitt 2.2).
- **Broker für Testläufe** statt Standardquelle: Spalte `test_run_broker`, Migration `0003` übernimmt den Wert, interner Endpunkt `/api/replay/settings/test-run-broker`, Antwort `{"broker", "chosen"}`, nur ein Broker des Datenbestands wählbar (422 sonst), Rückfall auf den ersten Broker in alphabetischer Reihenfolge, wenn keiner gewählt ist oder der gewählte nicht mehr vorkommt (Abschnitt 2.7). Die Wahl bleibt gespeichert, wenn der Broker nicht mehr vorkommt.
- **Aufteilung öffentlich und intern** wie bisher: Daten und Vorgänge des Datenbestands unter `/api/v1/market-data/` und in der Beschreibung, die Einstellung intern (Abschnitt 2.8).
- **Pfade:** `series`, `series/details` (Abfrageparameter statt Pfadteilen, weil Namen von Brokern und Instrumenten Zeichen wie `/` und Leerzeichen enthalten dürfen), `brokers`, `imports`, `imports/preview`. `instrument` und `completeness` bleiben.
- **Import als Formular** (`multipart/form-data`) mit Feldern `broker`, `timezone`, `file` und je Datei `instrument` und `data` als gleichnamige Felder in der Reihenfolge der Dateien; Format einer Datei nach Endung, sonst nach Inhalt; Name der Datei nur gelesen und ohne Verzeichnis zurückgegeben (Abschnitt 2.8). Neue Laufzeitabhängigkeit `python-multipart` (Abschnitt 7).
- **Herkunft des Formulars:** Der Kopf `Origin` muss zum Kopf `Host` passen (sonst 403), weil dieser Medientyp ohne Vorabfrage von einer fremden Webseite gesendet werden kann (Abschnitt 2.8). Die Spezifikation 11 verlangt das nicht ausdrücklich; es ersetzt den Schutz, den die früheren Medientypen `application/json` und `text/csv` boten.
- **Grenzen:** `max_files_per_import` (Vorgabe 100) und `max_import_bytes` (Vorgabe 256 MiB, mindestens `max_upload_bytes`) als Parameter der Startkonfiguration; Begrenzer des Bodys auf `max_import_bytes` plus Hülle (64 KiB und 4096 Bytes je Datei) für Import und Vorschau (Abschnitt 2.8). Die Werte legt der Auftrag fest; die Spezifikation 5.3 nennt keine Zahlen.
- **Ergebnis je Datei mit Status 200:** eine abgelehnte Datei, auch wegen einer unbekannten Kennung der Daten oder fehlender Angaben, steht im Ergebnis; nur ein Vorgang ohne Datei, mit zu vielen Dateien oder zu groß ergibt 4xx (Abschnitt 2.8).
- **Einzelheiten einer Reihe:** 404 für eine Zeile, die es nicht gibt, auch bei unbekannter Kennung; `contract` ist `null`, wenn Angaben fehlen; Lücken auf `max_listed_items` gekürzt (Abschnitt 2.8). Die Kennung der Daten ist klein geschrieben; eine Kennung im Filter, die keine Zeile hat, ergibt eine leere Liste.
- **Vorschau:** eigener Endpunkt `POST imports/preview` mit demselben Formular, liest nur Namen und JSON-Inhalt; `broker` der Antwort nur, wenn alle JSON-Dateien denselben nennen (Abschnitt 2.8).
- **Fehlertexte:** englisch, fest, ohne Pfade und Inneres; die Oberfläche übersetzt nach den Kennungen (Abschnitt 5.2).
- **Beispiele** in der Beschreibung der Web-API, geprüft gegen die Modelle (Abschnitt 5.3).
- Das Backend setzt `max_page_size` der Bibliothek auf `max_listed_items` (Abschnitt 2.8).

Meldungen an den Entwicklungsleiter (keine Änderung dieses Auftrags nötig):

- Die Oberfläche (`frontend/`) ist unverändert und spricht die entfallenen Pfade und `default-source` an; ihre Tests der Datenansicht und ihre Browsertests (die die nachgebildete Quelle brauchen, die in der Entwicklungsgruppe des Backends nicht mehr steht) sind bis Auftrag 14 nicht mit diesem Backend abgestimmt (Abschnitt 9).
- Die Anwenderdokumentation (`docs/user/pipwerk-replay.md`) beschreibt noch Beschaffung und Standardquelle; sie liegt außerhalb des Auftrags und braucht die neue Oberfläche.
- Die Liste der Reihen berechnet Lücken nur für die Zeilen der Seite; die Zahl der Lücken einer Zeile liest die Bibliothek aber über alle Zeiten der Reihe. Bei sehr großen Reihen (viele Millionen Ticks) dauert ein Aufruf entsprechend; begrenzt ist nur die Antwort, nicht die Rechenzeit. Eine Änderung braucht die Bibliothek (`packages/market-data`), die nicht Teil dieses Auftrags ist.

## 9. Oberfläche

**Stand: Auftrag 05; mit Auftrag 12 ist das Backend weiter, die Oberfläche nicht.** Dieser Abschnitt beschreibt die Oberfläche, wie sie ist. Die Karten „Standardquelle“, „Datei von Hand importieren“ und „Beschaffung von Hand anstoßen“ und die Übersicht sprechen Pfade an, die das Backend nicht mehr hat (Abschnitte 2.8 und 2.9). Auftrag 14 baut die Ansicht „Datenbestand“ nach Spezifikation 8.3 um (Tabelle der Reihen mit Filter und Seiten, Einzelheiten, Broker für Testläufe, Dialog „Datei importieren“ für mehrere Dateien) und ändert diesen Abschnitt.

Gegenstand dieses Abschnitts ist die Browseroberfläche in `components/pipwerk-replay/frontend/` (Auftrag 05, Spezifikation E3, 8.1 bis 8.4, 11). Stand: Kopfzeile, Fußzeile und die Ansichten „Datenbestand“ und „Testkonten“ nach dem bestätigten Prototyp, angeschlossen an die Web-API und die internen Endpunkte (Abschnitte 5.1 und 5.2). Die Ansichten für den Testlauf und die gespeicherten Backtests, die Betriebsart und die gemeinsamen Bausteine in `packages/ui-components` folgen mit `wp03` und `wp04`.

### 9.1 Aufbau

Technik wie pipwerk Studio ([technische Dokumentation pipwerk Studio](pipwerk-studio.md), Abschnitte 2.3 bis 2.7): React 19 mit TypeScript (`strict`, `noUncheckedIndexedAccess`), Vite, TanStack Query, i18next mit `src/locales/de.json` und `src/locales/en.json`, Sprache als Einstellung im Backend, Dialog „Über pipwerk replay“.

| Datei in `src/` | Aufgabe |
| --- | --- |
| `main.tsx`, `App.tsx` | Einstieg; Kopfzeile mit Menü („Datenbestand“, „Testkonten“), Schaltfläche „Über pipwerk replay“, Sprachwahl; die gewählte Ansicht; Fußzeile |
| `DataView.tsx`, `ImportCard.tsx`, `AcquireCard.tsx`, `dataQueries.ts` | Ansicht „Datenbestand“: Übersicht, Angaben zu den Instrumenten, Standardquelle, Import, Beschaffung von Hand |
| `AccountsView.tsx`, `accountForm.ts` | Ansicht „Testkonten“: Liste und Formular; `accountForm.ts` enthält die Prüfung der Werte nach den Grenzen des Backends (Abschnitt 2.6) |
| `AboutDialog.tsx`, `Modal.tsx` | Dialog „Über pipwerk replay“ und der Dialog mit dem Fokusfang (Abschnitt 9.5) |
| `BackendStatus.tsx`, `RevisionDisplay.tsx`, `LanguageSelect.tsx`, `useReplayLanguage.ts` | Fußzeile (Erreichbarkeit über `/api/health`, Stand über `/api/replay/revision` mit Tooltip) und Sprachwahl über `/api/replay/settings/language` |
| `http.ts`, `api.ts`, `accountsApi.ts`, `marketDataApi.ts`, `revisionApi.ts`, `settingsApi.ts` | Zugriff auf das Backend: `request()` sendet JSON oder eine Datei unverändert und macht aus jedem Status ab 400 einen `ApiError` mit dem Body; jede Antwort wird gelesen und geprüft (`asRecord`, `str`, `num` …), eine Antwort anderer Form ist ein Fehler der Oberfläche (`UnexpectedAnswerError`), keine falsche Anzeige |
| `errors.ts` | Texte für Fehler der Anfragen und für Kennungen (Abschnitt 8, Entscheidungen) |
| `format.ts` | Zahlen- und Zeitformate beider Sprachen; Zeiten des Datenbestands sind UTC, auf die Minute |
| `ui.tsx` | Symbole (eigene SVG-Pfade), `TipLayer`, `Btn`, `Select`, `TextInput`, `NumberInput`, `Info`, `Field` |
| `i18n.ts`, `locales/` | Texte; `timestamp.ts`, `commitDate.ts`, `buildRevision.ts`, `repository.ts` und `buildinfo/gitRevision.ts` wie bei pipwerk Studio |
| `styles.css` | Farben, Schrift, Abstände und Steuerelemente des Prototyps; Anordnung nach Fenstergröße |

`vite.config.ts` bettet beim Bau Commit und Datum des Commits ein (`__PIPWERK_REPLAY_BUILD_REVISION__`, für den Dialog), erlaubt dem Entwicklungsserver genau die Datei `LICENSE` außerhalb des Projekts (`?raw`, sie wird als Text in den Dialog eingebettet) und leitet `/api` an `PIPWERK_REPLAY_BACKEND_URL` weiter, ohne den Kopf `Host` zu ändern.

### 9.2 Zustand

- **Daten des Backends** liegen in TanStack Query (Schlüssel: `health`, `revision`, `replay-language`, `accounts`, `market-data-overview`, `market-data-instrument`, `default-source`, `acquisition`). Schreibende Aufrufe (`useMutation`) laden die betroffenen Abfragen neu: nach dem Speichern oder Löschen eines Testkontos `accounts`, nach einem Import und am Ende einer Beschaffung `market-data-overview` und `market-data-instrument`.
- **Sprache:** wie pipwerk Studio (`useReplayLanguage`): die Sprache aus dem Backend gilt, solange keine Änderung läuft; während des Speicherns gilt die gewählte; ein Fehler lässt die zuletzt bestätigte Sprache stehen. Die Anfragen haben eine Zeitbegrenzung von 10 Sekunden und werden auch gesendet, wenn der Browser „offline“ meldet.
- **Zustand der Komponenten:** gewählte Ansicht und Menü (`App`); Entwurf des Testkontos, gewähltes Testkonto, Hinweis „gespeichert“ (`AccountsView`); gewählte Datei, Felder des CSV-Imports (`ImportCard`); Felder der Beschaffung und die Kennung des laufenden Auftrags (`AcquireCard`); Eingabe der Standardquelle (`DefaultSourceCard`).
- **Der Browser speichert nichts** (kein `localStorage`, `sessionStorage`, kein Cookie, keine IndexedDB, keine Caches; `language.spec.ts` prüft das nach einer Sitzung mit Sprachwechsel, Import und Testkonto).
- **Texte des Anwenders** (Namen von Testkonten, Brokern, Instrumenten, Dateinamen) setzt React als Text; es gibt kein `dangerouslySetInnerHTML` und kein `innerHTML` (Spezifikation 11). Tests mit Namen wie `<img src=x onerror=…>` prüfen es in Vitest und im Browser.

### 9.3 Ansichten

**Datenbestand** (Spezifikation 5.1 bis 5.4, 8.3) in fünf Karten:

1. *Was vorliegt* (`GET /api/v1/market-data/overview`): je Reihe Broker, Instrument, Art (`Kerzen <Zeiteinheit>` oder `Ticks`), die abgedeckten Zeiträume (die ersten drei, dann „und N weitere“, `covered_count` zählt alle), die Lücken (Eintrag `missing`, Grund `gap`, mit Warnsymbol, oder „keine“) und die Menge. Zeiten in UTC. Wird die Antwort abgeschnitten (`series_total` größer als die Zahl der Reihen), nennt ein Hinweis die Zahlen. „Aktualisieren“ liest neu.
2. *Angaben zum Instrument je Broker*: je Eintrag der Übersicht die neuesten Angaben (`GET …/instrument`).
3. *Standardquelle* (`GET`, `PUT /api/replay/settings/default-source`): Eingabe mit Vorschlägen aus den Brokern des Datenbestands, „Als Standardquelle festlegen“, „Keine Standardquelle“; Prüfung des Namens wie `names.py` (Abschnitt 2.7).
4. *Datei von Hand importieren* (`POST …/imports/json`, `…/imports/csv`): Der Anwender wählt die Datei; die Endung entscheidet das Format. JSON braucht nichts weiter. Bei CSV sind Broker, Instrument, Art, Zeiteinheit und Zeitzone Pflicht (Spezifikation 5.1 und 5.3, 8.3); die Datei geht als Body mit dem Medientyp `text/csv`, die Angaben als Abfrageparameter. Das Ergebnis nennt übernommene und ersetzte Zeilen, Reihe, Zeitraum (erste und letzte Zeit der übernommenen Zeilen, UTC) und die abgelehnten Zeilen mit Nummer und Grund; ein ganz abgelehntes Dokument (`422`, `The file is refused.`) zeigt den Grund nach `code`.
5. *Beschaffung von Hand anstoßen* (`POST …/acquisitions`, `GET …/acquisitions/{id}`): ein Teil (Instrument, Art, Zeitraum); Fortschritt als Balken, solange der Auftrag `running` ist; danach Ergebnis oder Meldung mit Grund (Abschnitt 8).

**Testkonten** (Spezifikation 6.2, 8.3): links die Liste (`GET /api/v1/accounts`), rechts das Formular. „Neues Testkonto“ zeigt die Ausgangswerte des Standard-Testkontos und legt erst beim Speichern an (`POST`); eine Änderung speichert `PUT` mit allen Werten; „Löschen“ fragt zuerst (`DELETE`); nach dem Löschen steht das erste Testkonto im Formular. „Speichern“ ist gesperrt, solange nichts geändert oder ein Wert ungültig ist (`checkAccountForm`, jede Meldung nennt die Regel). Die Prüfung der Oberfläche entspricht der des Backends (Abschnitt 2.6); das Backend prüft nochmals, ein trotzdem abgelehnter Wert erscheint als „… konnte nicht gespeichert werden.“ mit dem Grund. Leere Zustände nennen den nächsten Schritt.

### 9.4 Anordnung und Bedienung

Das Fenster ist ein Raster aus Kopfzeile, Hauptbereich und Fußzeile (`.app`, `100dvh`); der Hauptbereich scrollt in sich (`.page-scroll`), die Seite selbst nie. Karten stehen untereinander; in „Testkonten“ stehen Liste und Formular nebeneinander ab 800 Pixel Breite, darunter untereinander. Tabellen scrollen in ihrem Rahmen (`.tbl-wrap`). Das Menü ist ab 700 Pixel Breite ausgeschrieben, darunter eine Liste hinter „Menü“. Bei einer Höhe von höchstens 460 Pixel (Querformat eines Telefons) sind Kopf- und Fußzeile und die Dialoge enger. `.page-scroll` ist `position: relative`: Das verborgene Feld für die Dateiwahl ist absolut positioniert und vergrößerte sonst die scrollbare Höhe der ganzen Seite (`e2e/layout.spec.ts` fand das). Die Bedienung folgt dem Prototyp: jeder leere Zustand nennt den nächsten Schritt, jedes Feld hat eine Erklärung in Händlersprache bei Maus und Tastatur (`Field` mit `data-tip` am Namen und am Symbol „i“, das mit `tabindex=0` den Fokus nimmt), Pflichtfelder tragen einen Stern.

Geprüft wird in den sechs Fenstergrößen der Spezifikation (8.4, Punkt 1) mit `e2e/layout.spec.ts` (Abschnitt 6.2): keine Bildlaufleiste der Seite, Kopfzeile, Hauptbereich und Fußzeile überlappen nicht, die Teile der Kopfzeile stehen nebeneinander und im Fenster, die Karten überlappen nicht, kein Bedienelement liegt außerhalb seiner Karte, jede Karte und das Ende der Ansicht sind erreichbar, Menü und Dialoge sind erreichbar. Die Prüfung sieht die Oberfläche nicht wie ein Mensch: Sie misst Rechtecke. Die Bilder der Ansichten bei 390 × 844, 844 × 390 und 1366 × 768 wurden bei der Umsetzung angesehen, sie gehören nicht zum Repository.

### 9.5 Dialog, Sprache, Stand

- **Dialog „Über pipwerk replay“** (`AboutDialog`, `Modal`): Element `<dialog>` mit `showModal()`: Die Seite dahinter ist gesperrt, Escape schließt, der Fokus geht beim Öffnen auf „Schließen“ und kehrt beim Schließen zur Schaltfläche zurück. Den Fokusfang hat der Dialog von pipwerk Studio übernommen: ohne eigenen Code verlässt der Fokus den Dialog oder landet auf dem Element selbst (in Chromium, Firefox und WebKit gemessen, dort für den Dialog von pipwerk Studio); solange der Dialog offen ist, geht Tab vom letzten Element zum ersten und Umschalt+Tab vom ersten zum letzten. Der Inhalt: Name, Stand (Commit und Datum des Commits aus dem Bau, `__PIPWERK_REPLAY_BUILD_REVISION__`), Lizenz (Name und Text aus `LICENSE`, beim Bau eingebettet) und Adresse des Repositorys (aus `package.json`, `https://github.com/<Benutzer>/<Name>` oder „unbekannt“).
- **Sprache:** `DE` und `EN` in der Kopfzeile; Zustand und Meldungen wie bei pipwerk Studio (Abschnitt 9.2). `document.documentElement.lang` folgt der Sprache.
- **Fußzeile:** „Backend: verbunden“, „… nicht erreichbar“ oder „… Verbindung wird geprüft“ (`GET /api/health`); „Stand: <7 Zeichen>“ (`GET /api/replay/revision`) mit dem Text „Commit <40 Zeichen> vom TT.MM.JJJJ, hh:mm Uhr“ (englisch „from YYYY-MM-DD hh:mm“, Ortszeit des Browsers) als Erklärung bei Maus und Fokus und als `aria-describedby`; ohne ermittelbaren Stand „Stand: unbekannt“ ohne Erklärung. Die Antwort wird wie bei pipwerk Studio streng geprüft (Form, Länge, Kurzform gleich Anfang des Commits).
