# Testbericht Tester Funktion – Auftrag 02, Durchlauf 4 (Nachprüfung)

- Bezug: `strategiedesign/wp01`, Auftrag `development/strategiedesign/wp01/orders/02.md`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/02-4-order.md`
- geprüfter Commit: `f4d21322ec345bf05598bb2025004470512d2816` (Zweig `strategiedesign/wp01-02`), vor der Prüfung mit `git rev-parse HEAD` im eigenen Arbeitsverzeichnis bestätigt
- vorher geprüfter Commit: `7e261d0d90645670678c2ffc77e53fd1e2a7394b` (Berichte `02-functiontest-3.md`, `02-securitytest-3.md`)
- Prüfskript: `components/pipwerk-studio/scripts/check` im geprüften Commit `f4d21322ec345bf05598bb2025004470512d2816`, wie in Durchlauf 1 bis 3. Keine Änderung am Prüfskript, kein Commit auf `strategiedesign/wp01-functiontest` für diesen Auftrag.
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md` (Zeilen 246–252): Sind die Befunde behoben (S3 aus dem Bericht Sicherheit, gleich H3 aus meinem Bericht zu Durchlauf 3)? Bleiben S1 und S2 behoben? Enthalten die geänderten Stellen neue Fehler? Weist der neue Test den Fehler am vorher geprüften Commit nach?
- Datum: 2026-10-16

## Ergebnis: bestanden

S3 (bei mir H3) ist behoben. Eine SQLite-Datenbank im Speicher behält nach der Migration ihr Schema, in allen drei Formen und als URI auch ohne `cache=shared`. Die Migration bleibt atomar (S1). Gleichzeitiges Schreiben auf eine SQLite-Datei scheitert nicht (S2). Gleichzeitige Starts gelingen. Der Code entspricht der Festlegung des Softwarearchitekten im Übergabedokument: eine Verbindung der übergebenen Engine, `AUTOCOMMIT` nur für diese Verbindung, `BEGIN IMMEDIATE`, `COMMIT` oder `ROLLBACK`, keine eigene Engine, keine Unterscheidung nach URL in `migrate.py`. Der neue Test `tests/test_memory_databases.py` weist den Fehler am vorher geprüften Commit nach. Die Dokumentation stimmt mit dem Code überein. Es bleiben Hinweise, keiner ist blockierend.

## Befunde (blockierend)

Keine.

## Kontrolle der vorherigen Befunde

| Befund | Ergebnis | Nachweis |
|---|---|---|
| S3 (Sicherheit, Durchlauf 3) / H3 (Funktion, Durchlauf 3): Datenbank im Speicher als URI verliert ihr Schema | behoben | `migrate.py` Zeilen 105–118: Die Migration nimmt mit `engine.connect()` eine Verbindung der übergebenen Engine. Es gibt keine eigene Engine und kein `dispose()` mehr. `storage.py` Zeilen 58–65 und 73–78: Für `sqlite://`, `:memory:` und `mode=memory` wird `StaticPool` verwendet (vom Softwarearchitekten angenommene Abweichung). Eigene Probe E (unten): `GET` und `PUT /api/studio/settings/language` sowie `GET …/object-directory` liefern für alle vier geprüften Formen HTTP 200, die geschriebene Sprache `en` wird gelesen. |
| S1 (Sicherheit, Durchlauf 1): Migration nicht atomar | bleibt behoben | `test_migrations.py` besteht (15 Tests), auch die beiden Tests mit simuliertem Fehler in Revision `0002`. Eigene Proben G und H (unten): Datei mit bisherigem Schema und Datenbank im Speicher bleiben nach dem Fehler unverändert. |
| S2 (Sicherheit, Durchlauf 2) / N1 (Funktion, Durchlauf 2): gleichzeitiges Schreiben scheitert | bleibt behoben | Eigene Proben A bis C (unten): 0 Fehler bei 1600 Schreibvorgängen über den Dienst, 1600 × HTTP 200 über HTTP. `test_concurrent_writes.py` besteht (5 Tests). |
| H1 `npm audit`, `source-map-js` 1.2.1 (GHSA-68fv-2mgg-jv7q) | unverändert, Hinweis | Ausgabe des Prüfskripts |
| H2 Quelle des `pip-audit`-Ergebnisses in Abschnitt 7 | unverändert, Hinweis | `uv.lock` in diesem Commit nicht geändert (`git diff 7e261d0 f4d2132` enthält nur `migrate.py`, `storage.py`, `tests/test_memory_databases.py`, `docs/technical/pipwerk-studio.md`). Eigener Lauf `pip-audit`: „No known vulnerabilities found“. |

## Nachweis durch den neuen Test am vorher geprüften Commit

Im eigenen Arbeitsverzeichnis habe ich `7e261d0…` ausgecheckt und nur `tests/test_memory_databases.py` aus `f4d2132…` hinzugenommen. Aufruf: `uv --directory …/components/pipwerk-studio/backend run --frozen pytest -p no:cacheprovider -q -rA tests/test_memory_databases.py`. Ergebnis: 3 gescheitert, 8 bestanden.

| Test | Ergebnis an `7e261d0…` |
|---|---|
| `test_a_database_in_memory_keeps_its_schema_and_serves_the_settings[sqlite:///file:…?mode=memory&cache=shared&uri=true]` | gescheitert, `OperationalError: no such table: studio_settings` (das ist S3) |
| `test_a_database_in_memory_keeps_its_schema_and_serves_the_settings[sqlite://]` und `[sqlite:///:memory:]` | gescheitert (jeder Thread erhält eine eigene leere Datenbank; schon vor diesem Auftrag so, siehe H3 in Durchlauf 3) |
| übrige 8 Tests (zweimaliges Migrieren, Einstellung des Treibers nach der Migration) | bestanden |

Die Tests zur Einstellung des Treibers bestehen auch am vorher geprüften Commit, weil dort die Engine des Betriebs nicht verändert wurde. Sie sichern die neue Bauart ab, weisen aber keinen früheren Fehler nach. Danach habe ich wieder `f4d2132…` ausgecheckt und mit `git rev-parse HEAD` bestätigt. `git status --short` zeigt danach nur die beiden fremden, nicht verfolgten Verzeichnisse `packages/domain-core/src/` und `packages/domain-core/tests/`. Sie waren vor meiner Prüfung vorhanden. Ich habe sie nicht angefasst.

## Hinweise (nicht blockierend)

- H1 und H2 wie oben, unverändert.
- H4 Gleichzeitige Zugriffe auf eine Datenbank im Speicher. Fundstelle: `storage.py` Zeilen 58–63 (`StaticPool`), `docs/technical/pipwerk-studio.md` Abschnitt 2.1 Zeile 42. Sachverhalt: Alle Threads teilen sich eine Verbindung des Treibers. Bei gleichzeitigen Anfragen greifen die Transaktionen ineinander. Eigene Probe F (8 Threads × 50 Runden, abwechselnd `PUT …/object-directory` mit `"move": false` und `PUT …/language`, nach jedem `PUT` ein `GET …/language`): URI-Form 10 × `PUT` HTTP 500 und 3 × `GET` HTTP 503 von 800 Anfragen; `sqlite://` 6 × `PUT` HTTP 500, 3 × `PUT` HTTP 409, 2 × `GET` HTTP 503 und 2 × `GET` HTTP 500. Nacheinander ausgeführt gibt es keine Fehler (Probe E). Nicht blockierend: Abschnitt 2.1 sagt ausdrücklich, dass eine Datenbank im Speicher „für Tests und Versuche gedacht, nicht für den Betrieb mit gleichzeitigen Zugriffen“ ist. Eine Datenbank im Speicher ist keine Betriebsart der Startkonfiguration. Am vorher geprüften Commit lieferte die URI-Form schon bei einer einzelnen Anfrage HTTP 500.
- H5 Der Test `test_the_migration_leaves_the_setting_of_an_engine_that_is_not_changed_by_it` (`tests/test_memory_databases.py` Zeilen 72–82) prüft mit `engine.pool.__class__.__name__ != "StaticPool"` eine Eigenschaft der Engine, die er selbst mit `create_engine` ohne `poolclass` erzeugt. Die Zusicherung kann nicht scheitern und sagt über die Migration nichts aus. Die Zusicherung zu `isolation_level` davor ist wirksam.

## Durchgeführte Prüfungen

### Prüfskript

Aufruf: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/functiontest/components/pipwerk-studio/scripts/check --backend-port 28741 --frontend-port 28742 --with-audit`, Exitcode 1 (nur wegen H1). Die erste Zeile der Ausgabe nennt den Commit `f4d21322ec345bf05598bb2025004470512d2816`.

| Schritt | Ergebnis |
|---|---|
| backend: uv sync --frozen | bestanden |
| backend: pytest | bestanden, 337 Tests, davon 11 in `test_memory_databases.py`, 5 in `test_concurrent_writes.py`, 15 in `test_migrations.py` |
| backend: ruff check | bestanden |
| backend: ruff format --check | bestanden, 29 Dateien |
| backend: mypy | bestanden, 29 Dateien |
| Suche nach der Schreibweise des Namens | bestanden, 397 Treffer |
| backend: pip-audit | bestanden, keine bekannten Sicherheitslücken |
| frontend: npm ci, typecheck, Vitest (244 Tests), build | bestanden |
| frontend: npm audit | nicht bestanden, Altbefund H1 |
| Browsertest Chromium, Firefox, WebKit | bestanden: 39 bestanden, 6 übersprungen (Fälle ohne Git-Arbeitsbereich, wie bisher) |

Laut Übergabedokument hat der Entwickler Oberfläche und Browsertest nicht erneut ausgeführt. Das habe ich mit dem Prüfskript nachgeholt (Ergebnis siehe Tabelle).

### Eigene Proben am geprüften Commit

Ich habe die Proben als vorübergehende Testdatei im eigenen Arbeitsverzeichnis mit pytest ausgeführt (Python 3.14.4, SQLAlchemy 2.1.3) und danach gelöscht, einschließlich der Bytecode-Datei. Dateien lagen in temporären Verzeichnissen von pytest.

| Probe | Ergebnis |
|---|---|
| A: 8 Threads × 200 `SettingsService.set_language` auf einer Engine aus `create_studio_engine` (SQLite-Datei) | 0 Fehler von 1600 |
| B: HTTP, 8 Threads × 100 `PUT …/language` mit anschließendem `GET` (`raise_server_exceptions=False`) | 800 × `PUT` HTTP 200, 800 × `GET` HTTP 200 |
| C: wie B, abwechselnd `PUT …/object-directory` mit `"move": false` und `PUT …/language` | 800 × HTTP 200, 800 × HTTP 200 |
| D: 5 Runden mit je 8 gleichzeitig gestarteten Prozessen, die `create_studio_engine` auf einer neuen Datei aufrufen | alle 40 mit Exitcode 0, danach je Runde `{"language": "de"}` lesbar |
| E: `create_app` mit `sqlite:///file:…?mode=memory&cache=shared&uri=true`, `sqlite://`, `sqlite:///:memory:`, `sqlite+pysqlite:///file:…?mode=memory&uri=true`; nacheinander `GET language`, `PUT language en`, `GET language`, `GET object-directory` | in allen vier Formen 200, 200, `{"language": "en"}`, 200 |
| F: Datenbank im Speicher mit gleichzeitigen Anfragen | siehe H4 |
| G: `migrate_database` auf `sqlite://` mit `StaticPool`, Revision `0002` scheitert nach `add_column` | feste Meldung „A migration … were rolled back.“; danach keine Tabelle; Verbindung mit `isolation_level == ""` und `in_transaction == False`; zweiter Aufruf ohne Fehler, Tabellen `alembic_version`, `studio_settings` |
| H: `migrate_database` auf einer Datei mit bisherigem Schema (Sprache `en`), Engine ohne `create_studio_engine`, Revision `0002` scheitert | Spalten `id`, `language`, keine Versionstabelle, Zeile `(1, 'en')`, kein Journal im Verzeichnis; Verbindung des Pools danach mit `isolation_level == ""`, `in_transaction == False` |
| I: eine andere Verbindung hält die Schreibsperre (`BEGIN IMMEDIATE`) länger als die Wartezeit | `create_studio_engine` endet nach 30,1 Sekunden mit `DatabaseMigrationError` und der festen Meldung; Schema unverändert (`id`, `language`); nach Freigabe gelingt der nächste Start |
| J: Engine des Betriebs nach der Migration, Sitzung schreibt, `flush()`, `rollback()` | Schreiben ist zurückgenommen (Zeile danach nicht vorhanden). Die Verbindung arbeitet nach der Migration wieder in Transaktionen, nicht im Modus `AUTOCOMMIT`. |

### Geänderte Stellen

Gelesen habe ich `git diff 7e261d0…f4d2132` und die Dateien `migrate.py`, `storage.py`, `migrations/env.py`, `tests/test_memory_databases.py`, `tests/test_concurrent_writes.py` und `tests/test_migrations.py` (Zeilen 1–60, 200–259).

- `migrate.py` Zeilen 92–102: `ROLLBACK` wird bei jeder Ausnahme versucht. Ein Fehler beim `ROLLBACK` (zum Beispiel weil SQLite die Transaktion schon beendet hat) wird nur als `DBAPIError` unterdrückt, die ursprüngliche Ausnahme geht weiter. Ein Fehler bei `BEGIN IMMEDIATE` liegt im `try` von `migrate_database` und wird zur festen Meldung (Probe I). Der Aufbau der Verbindung liegt weiter außerhalb des `try` (Zeile 112): Ein nicht erreichbarer Ort bleibt ein Fehler von SQLAlchemy (`test_an_unreachable_database_is_still_reported_as_a_connection_problem` besteht).
- `migrate.py` Zeilen 114–118: Andere Datenbanken als SQLite verwenden `connection.begin()`. Nicht ausgeführt, weil keine solche Datenbank in der Prüfumgebung ist.
- `storage.py` Zeilen 73–78: `_is_sqlite_memory` erkennt alle vier Formen aus Probe E. `make_url` wirft bei einer ungültigen URL denselben Fehler, den vorher `create_engine` geworfen hat.
- Docstring `migrate.py` Zeilen 16–27 und Kommentare `storage.py` Zeilen 59–62 und 66–68 beschreiben das Verhalten zutreffend.
- `docs/technical/pipwerk-studio.md` Abschnitt 2.1 (Zeile 42): beschreibt eine Verbindung der Engine, `AUTOCOMMIT` nur für sie, `BEGIN IMMEDIATE`, `COMMIT`, `ROLLBACK`, Wartezeit 30 Sekunden, Wiederherstellen der Einstellung beim Zurückgeben, `StaticPool` für alle drei Formen im Speicher und die Einschränkung auf Tests und Versuche. Das stimmt mit Code und Proben überein. Die Suche nach „eigene Engine“, „eigenen Engine“, `_sqlite_migration_engine` und „own engine“ in `docs/` und in der Komponente findet nur den Satz „keine eigene Engine“ in Abschnitt 2.1. Es gibt keine veraltete Stelle mehr.
- Abschnitt 6.1: Der neue Absatz stimmt mit den 11 Tests in `test_memory_databases.py` überein.
- Abschnitt 8: „`BEGIN IMMEDIATE` auf einer einzigen Verbindung der Engine, nur für die Migration“ stimmt mit `migrate.py` überein.
- Hinzugefügte Zeilen des Diffs: keine Pfade des Entwicklungsrechners, Benutzernamen, Zugangsdaten oder Schlüssel. Die Tests verwenden `tmp_path` und Datenbanken im Speicher.

## Nicht geprüft

- Andere Datenbanken als SQLite (Zweig `connection.begin()` in `migrate.py`): keine solche Datenbank in der Prüfumgebung.
- Betrieb unter Windows.
- Ob die Wiederherstellung von `isolation_level` beim Zurückgeben an den Pool auch bei anderen Versionen von SQLAlchemy als 2.1.3 gilt: geprüft nur mit der Version aus `uv.lock`.
