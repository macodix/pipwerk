# Testbericht Sicherheit – Auftrag 02, Durchlauf 4 (Nachprüfung)

- Bezug: `strategiedesign/wp01`, Prüfauftrag `development/strategiedesign/wp01/tests/02-4-order.md` (Zweig `strategiedesign/wp01`)
- geprüfter Commit: `f4d21322ec345bf05598bb2025004470512d2816` (Zweig `strategiedesign/wp01-02`, auf `origin/strategiedesign/wp01-02` vorhanden). Ich habe ihn im eigenen Arbeitsverzeichnis ausgecheckt und mit `git rev-parse HEAD` bestätigt.
- vorher geprüfter Commit: `7e261d0d90645670678c2ffc77e53fd1e2a7394b`, Bericht `development/strategiedesign/wp01/tests/02-securitytest-3.md`
- Prüfgrundlagen: Auftrag `orders/02.md` (Technische Abnahmekriterien 1, 5 und 6), Festlegung des Softwarearchitekten im Prüfauftrag, `docs/technical/entwicklungsverfahren.md` Abschnitte „Umfang der Prüfungen“ (Zeilen 251–252) und „Grenze der Durchläufe“ (Zeilen 258–259), `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md` Abschnitte 2.1, 6.1 und 8, BSI-Grundschutz (CON.8, APP.7), OWASP ASVS
- Umfang: Nachprüfung. Geprüft habe ich, ob S3 aus Durchlauf 3 behoben ist, ob S1 und S2 behoben bleiben und ob die geänderten Stellen neue Fehler enthalten. Laut `git diff --stat 7e261d0…f4d2132` sind nur diese Dateien geändert: `migrate.py`, `storage.py`, `tests/test_memory_databases.py` und `docs/technical/pipwerk-studio.md`.
- Datum: 2026-10-16

## Ergebnis: bestanden

S3 ist behoben. Alle Formen einer Datenbank im Speicher, die die Dokumentation nennt, behalten nach dem Start ihr Schema. Die Endpunkte antworten mit HTTP 200. S1 bleibt behoben: Die Migration bleibt atomar, auch wenn der Prozess abbricht. S2 bleibt behoben: Bei Datenbankdateien scheitert gleichzeitiges Schreiben nicht, weder in Threads noch in Prozessen.

Die Umsetzung entspricht der Festlegung des Softwarearchitekten. Die Migration nimmt genau eine Verbindung der übergebenen Engine. Nur für diese Verbindung schaltet sie bei SQLite `AUTOCOMMIT` ein. Sie führt selbst `BEGIN IMMEDIATE`, `COMMIT` und `ROLLBACK` aus (`migrate.py` Zeilen 92–118). Sie hat keine eigene Engine und unterscheidet nicht nach der URL. Die angenommene Abweichung mit `StaticPool` steht in `storage.py` (Zeilen 58–78).

Es gibt keinen blockierenden Befund. Ich habe zwei neue Hinweise (H9, H10). Sie betreffen nur Datenbanken im Speicher. Sie sind keine Sicherheitslücke und keine Verschlechterung gegenüber `c663d9d`.

## Durchgeführte Prüfungen und Nachweise

| Prüfung | Ergebnis |
| --- | --- |
| Prüfskript `components/pipwerk-studio/scripts/check --backend-port 18731 --frontend-port 18732 --with-audit` | Bestanden: `uv sync --frozen`, pytest (337 bestanden, darunter `tests/test_memory_databases.py` mit 11 Tests), `ruff check`, `ruff format --check`, mypy, Suche nach der Schreibweise des Namens, `pip-audit` („No known vulnerabilities found“), `npm ci`, Typprüfung, Vitest (244 bestanden), Bau, Browsertest (39 bestanden, 6 übersprungen wie bisher). Gescheitert ist nur `npm audit`. Das ist der Altbefund H6 (`source-map-js`, eine Lücke der Stufe „high“). |
| Lockdateien | `backend/uv.lock`, `backend/pyproject.toml` und `frontend/package-lock.json` sind zwischen `7e261d0` und `f4d2132` unverändert (`git diff --stat` ohne Ausgabe). |
| S3: Datenbank im Speicher (eigene Probe: `create_studio_engine` und `create_app`, nacheinander `GET`/`PUT …/language`, `GET`/`PUT …/object-directory`) | Geprüfte URLs: `sqlite:///file:…?mode=memory&cache=shared&uri=true`, `sqlite:///file:…?mode=memory&uri=true`, `sqlite://`, `sqlite:///:memory:`, `sqlite+pysqlite:///:memory:`. Ergebnis für jede URL: Pool `StaticPool`, Tabellen `alembic_version` und `studio_settings`, alle Antworten HTTP 200, danach Sprache `en`. Am Commit `7e261d0` antworteten bei der URI-Form alle Endpunkte mit 500 (Durchlauf 3). |
| Einstellung des Treibers nach der Migration | Bei allen Formen im Speicher ist `isolation_level` danach `''`, also der Standard des Treibers (eigene Probe). Der Test `test_after_the_migration_the_connection_has_the_default_of_the_driver` prüft dasselbe für eine Datei und für den Speicher. |
| S2: gleichzeitiges Schreiben über HTTP, Datenbankdatei (eigene Probe: `TestClient(create_app(…), raise_server_exceptions=False)`, sechs Threads je 6 Sekunden, `PUT …/language` und `PUT …/object-directory` mit `"move": false`, jeweils danach `GET …/language`) | Zwei Läufe mit 1530 und 1502 Antworten, alle HTTP 200. Danach `/api/health` mit 200. |
| S2: gleichzeitiges Schreiben aus vier Prozessen (je eigene Anwendung auf derselben Datei, je vier Threads, 4 Sekunden `PUT …/language`) | 696, 708, 761 und 739 Antworten, keine mit einem anderen Status als 200, alle Exitcodes 0 |
| S1: Migration bricht mit Ausnahme ab (eigene Probe: `op.add_column` in Revision `0002` führt die Änderung aus, dann folgt eine Ausnahme mit Pfadtext) | Bisheriges Schema mit Sprache `en`: Meldung „A migration of the pipwerk Studio database schema failed. The changes of this start were rolled back.“, ohne Ausnahmetext und ohne Pfad. Danach Spalten `id` und `language`, keine Versionstabelle, Sprache `en`, kein Journal. Der nächste Start gelingt: Revision `0002`, Sprache `en`. Neue Datenbank: danach keine Tabellen. Der nächste Start gelingt mit Revision `0002`. |
| S1: Prozess wird während der Migration beendet (eigene Probe, `SIGKILL` unmittelbar nach `op.add_column`) | Bisheriges Schema: Das Rollback-Journal bleibt liegen, das Schema ist unverändert. Der nächste Start gelingt: Revision `0002`, Sprache `en`, kein Journal mehr. Neue Datenbank: keine Tabellen. Der nächste Start gelingt mit Revision `0002`. |
| Gleichzeitige Starts (eigene Probe: vier Prozesse rufen gleichzeitig `create_studio_engine` auf, bisheriges Schema und neue Datenbank) | In beiden Fällen enden alle vier Prozesse mit Exitcode 0. Danach Revision `0002` und kein Journal. Beim bisherigen Schema bleibt die Sprache `en` erhalten. Das entspricht Abschnitt 2.1. |
| Fehlerbehandlung in `migrate.py` | `_upgrade_in_sqlite_transaction` führt bei jeder Ausnahme `ROLLBACK` aus und gibt die Ausnahme weiter. `migrate_database` macht daraus `DatabaseMigrationError` mit festem Text (Zeilen 119–130). Die Meldungen haben sich gegenüber `7e261d0` nicht geändert. |
| Dokumentation Abschnitte 2.1, 6.1 und 8 | Sie stimmen mit Code und Proben überein: eine Verbindung der Engine, `AUTOCOMMIT` nur für diese Verbindung, `BEGIN IMMEDIATE`/`COMMIT`/`ROLLBACK`, Standard des Treibers nach Rückgabe, `StaticPool` für die drei genannten Formen im Speicher, neuer Test in 6.1. Es gibt keine Reste der früheren eigenen Engine. Die Suche nach „eigene Engine“, `_sqlite_migration_engine` und `SingletonThreadPool` findet nur die verneinende Stelle in Abschnitt 2.1. Zur Vollständigkeit der Liste siehe H9. |
| Geheimnisse und Angaben des Rechners | Die geänderten Zeilen des Diffs enthalten keine Pfade des Entwicklungsrechners, Benutzernamen, Zugangsdaten oder Schlüssel. Geprüft mit `git diff -G` auf entsprechende Muster, ohne Treffer. Autor und Committer ist `macodix`. |

Zum Vergleich habe ich in meinem Arbeitsverzeichnis kurz `c663d9d5b7414db24b4678bc1a07b493f114b6cb` ausgecheckt. Danach habe ich wieder `f4d21322ec345bf05598bb2025004470512d2816` ausgecheckt und mit `git rev-parse HEAD` bestätigt. Am geprüften Commit habe ich nichts geändert.

Das Prüfprogramm lag außerhalb des Repositorys im Testverzeichnis des Entwicklungsverzeichnisses. Ich habe es nach der Prüfung entfernt. Die Proben haben temporäre SQLite-Dateien im temporären Verzeichnis des Systems angelegt. Diese Dateien liegen nicht im Repository. Eine Bereinigung war mir in dieser Sitzung nicht erlaubt (Befehl abgelehnt).

`git status --short` zeigt in meinem Arbeitsverzeichnis wie in Durchlauf 3 die nicht verfolgten Verzeichnisse `packages/domain-core/src/` und `packages/domain-core/tests/`. Sie stammen nicht aus dieser Prüfung, und ich habe sie nicht angefasst. Sie liegen außerhalb der Komponente `pipwerk-studio`.

## Befunde aus früheren Durchläufen

| Befund | Stand |
| --- | --- |
| S3 (blockierend, Durchlauf 3): Eine Datenbank im Speicher, als URI angegeben, verliert ihr Schema nach der Migration. | behoben (Nachweis oben, alle Endpunkte 200) |
| S2 (blockierend, Durchlauf 2): Gleichzeitige Schreibzugriffe scheitern mit HTTP 500. | bleibt behoben (Datei: Threads und Prozesse ohne Fehler) |
| S1 (blockierend, Durchlauf 1): Die Migration ist nicht atomar. | bleibt behoben (Ausnahme und `SIGKILL`, bisheriges Schema und neue Datenbank) |
| H8 | in diesem Commit nicht berührt, bleibt behoben |
| H2, H3, H5, H7 | nicht Gegenstand der Korrektur, unverändert, die Hinweise bleiben |
| H6 (`npm audit`, `source-map-js`) | unverändert, die Prüfung `npm audit` scheitert weiter. Der Hinweis bleibt. |

## Neue Befunde

Keine blockierenden Befunde.

## Hinweise

### H9: Eine Form der Datenbank im Speicher wird nicht erkannt

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/storage.py` Zeilen 73–78 (`_is_sqlite_memory`), `docs/technical/pipwerk-studio.md` Abschnitt 2.1 (Zeile 42: „`sqlite://`, `:memory:` und URI mit `mode=memory`“).
- Sachverhalt: SQLite kennt auch die URI `file::memory:` ohne `mode=memory` als Datenbank im Speicher. `_is_sqlite_memory` erkennt diese Form nicht. Die Engine erhält dann den gewöhnlichen Pool (`QueuePool`). Nacheinander gestellte Anfragen gelingen (Probe: alle 200). Bei sechs gleichzeitigen Threads antworteten 1387 von 1660 Anfragen mit HTTP 500, weil eine weitere Verbindung eine eigene, leere Datenbank öffnet. Am Commit `c663d9d` war es ebenso: 1404 Antworten mit 500, und danach antwortete `GET …/language` mit 500. Die Korrektur verursacht den Fehler also nicht. Die Dokumentation zählt die erkannten Formen auf und nennt `file::memory:` nicht. Sie sagt aber auch nicht, dass andere Formen nicht unterstützt werden.
- Einstufung: Hinweis. Das ist keine Verschlechterung durch die Korrektur und betrifft eine ungewöhnliche URL für Tests oder Versuche. Es gibt keine Sicherheitslücke, und keine Antwort nennt Details.

### H10: Datenbank im Speicher bei gleichzeitigen Zugriffen

- Fundstelle: `storage.py` Zeilen 58–63 (`StaticPool`), `docs/technical/pipwerk-studio.md` Abschnitt 2.1 („für Tests und Versuche gedacht, nicht für den Betrieb mit gleichzeitigen Zugriffen“).
- Sachverhalt: Alle Threads teilen sich eine Verbindung. Ich habe sechs Threads je 6 Sekunden gemischt lesen und schreiben lassen. URI-Form mit `mode=memory`: 1516 Antworten mit 200, 24 mit 500, 3 mit 503, 1 mit 409. `sqlite://`: 1436 Antworten mit 200, 17 mit 500, 5 mit 503, 4 mit 409. Das Backend hat dabei die Meldungen „Stored pipwerk Studio language is not a supported language: ''“ und „The stored pipwerk Studio object directory is not an absolute path.“ protokolliert. Ein Thread hat also einen Zwischenstand gelesen, der nicht dem gespeicherten Wert entspricht. Danach antworteten `/api/health` und `GET …/language` mit 200. Der Prozess ist nicht abgestürzt. Am Commit `c663d9d` endete dieselbe Probe mit der URI-Form durch einen Absturz des Prozesses („Fatal Python error: Segmentation fault“, Exitcode 1). Der neue Stand ist hier also besser.
- Einstufung: Hinweis. Der Softwarearchitekt hat die Abweichung angenommen. Die Dokumentation schließt gleichzeitige Zugriffe für diesen Fall aus. Sie nennt aber nicht, dass dann Fehlerantworten (500, 503, 409) und falsch gelesene Werte auftreten. Datenbankdateien sind nicht betroffen.

## Nicht geprüft

- Verhalten unter Windows (Rechte, Pfadregeln, `os.link` und Verknüpfungen auf NTFS): Es gibt keine Windows-Umgebung.
- Andere Datenbanken als SQLite (Zweig `connection.begin()` in `migrate_database`): Die Prüfumgebung hat keine solche Datenbank.
- Gleichzeitiges Schreiben über ein Backend, das als eigener Prozess über `pipwerk_studio.cli` läuft: Geprüft habe ich nur über den Testclient von FastAPI. Er führt die Anfragen ebenfalls in mehreren Threads aus.
- Hashes der Lockdatei außer den drei in Durchlauf 1 bestätigten Dateien: unverändert nicht gegen PyPI abgeglichen (H5).
- Ob `tests/test_memory_databases.py` den Fehler S3 am Commit `7e261d0` nachweist: Das ist laut Prüfauftrag Aufgabe des Testers Funktion. Ich habe es nicht ausgeführt.
