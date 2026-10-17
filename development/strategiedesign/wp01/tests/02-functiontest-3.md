# Testbericht Tester Funktion – Auftrag 02, Durchlauf 3 (Nachprüfung)

- Bezug: `strategiedesign/wp01`, Auftrag `development/strategiedesign/wp01/orders/02.md`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/02-3-order.md`
- geprüfter Commit: `7e261d0d90645670678c2ffc77e53fd1e2a7394b` (Zweig `strategiedesign/wp01-02`), vor der Prüfung mit `git rev-parse HEAD` im eigenen Arbeitsverzeichnis bestätigt
- vorher geprüfter Commit: `cdf326f56ec585015c76385e55d51cb0cb19ffb3` (Bericht `02-functiontest-2.md`)
- Prüfskript: `components/pipwerk-studio/scripts/check` im geprüften Commit `7e261d0d90645670678c2ffc77e53fd1e2a7394b`, wie in Durchlauf 1 und 2. Keine Änderung am Prüfskript, kein Commit auf `strategiedesign/wp01-functiontest` für diesen Auftrag.
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Ist N1 behoben? Enthalten die dafür geänderten Stellen neue Fehler? Weist der neue Test den Fehler aus N1 am vorher geprüften Commit nach?
- Datum: 2026-10-16

## Ergebnis: bestanden

N1 ist behoben. Gleichzeitiges Schreiben auf dieselbe SQLite-Datei scheitert nicht mehr, weder in Threads noch in mehreren Prozessen noch über HTTP. Der neue Test `tests/test_concurrent_writes.py` weist den Fehler am vorher geprüften Commit nach: Dort scheitern alle 5 Tests. Die geänderten Stellen enthalten keinen blockierenden Fehler. Die Dokumentation stimmt mit dem Code überein. Es bleiben drei Hinweise.

## Befunde (blockierend)

Keine.

## Kontrolle der Befunde aus Durchlauf 2

| Befund | Ergebnis | Nachweis |
|---|---|---|
| N1 Gleichzeitige Schreibzugriffe scheitern mit HTTP 500 | behoben | `storage.py` Zeilen 51–61: `create_studio_engine()` setzt weder `isolation_level = None` noch `BEGIN`. Die Engine des Betriebs entspricht damit wieder `c663d9d…` (gleiche `connect_args`). `migrate.py` Zeilen 77–118: Nur für eine SQLite-Datei entsteht eine eigene Engine mit `BEGIN IMMEDIATE`. Sie wird nur für die Migration benutzt und danach mit `dispose()` verworfen (`finally`, auch bei Fehler). Das entspricht der Festlegung des Softwarearchitekten im Übergabedokument. Eigene Proben am geprüften Commit (Python 3.14.4, temporäre SQLite-Dateien, siehe unten): 0 Fehler in allen Fällen. In Durchlauf 2 gab es bei denselben Proben 690 von 1600, 314 von 800 und 144 von 800 Fehlern. |

## Nachweis durch den neuen Test am vorher geprüften Commit

Im eigenen Arbeitsverzeichnis habe ich `cdf326f…` ausgecheckt und nur `tests/test_concurrent_writes.py` aus `7e261d0…` hinzugenommen. Aufruf: `uv --directory …/components/pipwerk-studio/backend run --frozen pytest -p no:cacheprovider tests/test_concurrent_writes.py`. Ergebnis: 5 von 5 gescheitert.

| Test | Ergebnis an `cdf326f…` |
|---|---|
| `test_concurrent_writes_of_the_language_through_the_service_do_not_fail` | gescheitert, 7 Fehler `OperationalError … database is locked` |
| `test_concurrent_writes_of_the_language_over_http_do_not_fail` | gescheitert, 5 Fehler `OperationalError … database is locked` |
| `test_concurrent_writes_of_the_object_directory_without_moving_do_not_fail` | gescheitert, 5 Fehler `OperationalError … database is locked` |
| `test_two_starts_at_the_same_time_on_a_new_database_both_succeed` | gescheitert, 8 × `DatabaseMigrationError` |
| `test_the_engine_of_the_operation_keeps_the_default_transaction_behaviour` | gescheitert, `isolation_level` ist `None` statt `""` |

Am geprüften Commit `7e261d0…` bestehen alle 5 Tests (Lauf des Prüfskripts). Danach habe ich das Arbeitsverzeichnis wieder auf `7e261d0…` gesetzt und mit `git rev-parse HEAD` bestätigt.

## Hinweise (nicht blockierend)

- H1 `npm audit` scheitert unverändert mit dem bekannten Altbefund `source-map-js` 1.2.1 (GHSA-68fv-2mgg-jv7q). Er ist in Abschnitt 7 und 9 dokumentiert. Das Prüfskript endet deshalb mit Exitcode 1.
- H2 (aus Durchlauf 2, unverändert) Abschnitt 7 nennt als Quelle des `pip-audit`-Ergebnisses die Prüfungen am Commit `c663d9d…`. `uv.lock` ist seitdem unverändert. Meine eigene Prüfung `check --with-audit` an `7e261d0…` meldet für 33 Pakete „No known vulnerabilities found“.
- H3 Datenbank im Speicher als URI. Fundstelle: `migrate.py` Zeile 89 und `docs/technical/pipwerk-studio.md` Abschnitt 2.1 („nur für SQLite-Dateien, nicht für eine Datenbank im Speicher“). Sachverhalt: Die Ausnahme greift nur bei leerem Namen und `:memory:`. Eine Datenbank im Speicher, die als URI angegeben ist (`sqlite:///file:<name>?mode=memory&cache=shared&uri=true`), gilt als Datei. Die Migration läuft dann auf der eigenen Engine. Nach `dispose()` ist die Datenbank im Speicher verloren. Eigene Probe: `GET /api/studio/settings/language` liefert an `7e261d0…` HTTP 500, an `cdf326f…` HTTP 200 `{"language":"de"}`. Nicht blockierend: Eine Datenbank im Speicher ist keine dokumentierte Betriebsart. Auch `sqlite://` und `sqlite:///:memory:` liefern schon an `cdf326f…` bei diesem Aufruf HTTP 500. Der Satz in Abschnitt 2.1 trifft auf die URI-Form aber nicht zu.

## Durchgeführte Prüfungen

### Prüfskript

Aufruf: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/functiontest/components/pipwerk-studio/scripts/check --backend-port 28741 --frontend-port 28742 --with-audit`, Exitcode 1 (nur wegen H1).

| Schritt | Ergebnis |
|---|---|
| backend: uv sync --frozen | bestanden |
| backend: pytest | bestanden, 326 Tests, davon 5 in `test_concurrent_writes.py` |
| backend: ruff check | bestanden |
| backend: ruff format --check | bestanden, 28 Dateien |
| backend: mypy | bestanden, 28 Dateien |
| Suche nach der Schreibweise des Namens | bestanden, 397 Treffer |
| backend: pip-audit | bestanden, 33 Pakete, keine bekannten Sicherheitslücken |
| frontend: npm ci, typecheck, Vitest (244 Tests), build | bestanden |
| frontend: npm audit | nicht bestanden, Altbefund H1 |
| Browsertest Chromium, Firefox, WebKit | bestanden: 39 bestanden, 6 übersprungen (Fälle ohne Git-Arbeitsbereich, wie bisher) |

Laut Übergabedokument hat der Entwickler Oberfläche und Browsertest nicht erneut ausgeführt. Das habe ich mit dem Prüfskript nachgeholt (Ergebnis siehe Tabelle).

### Eigene Lastproben am geprüften Commit

Ich habe die Proben als vorübergehende Testdatei im eigenen Arbeitsverzeichnis mit pytest ausgeführt und danach gelöscht, einschließlich der Bytecode-Datei. Sie liefen auf temporären SQLite-Dateien.

| Probe | Ergebnis |
|---|---|
| 8 Threads × 200 `SettingsService.set_language` auf einer Engine aus `create_studio_engine` | 0 Fehler von 1600 |
| 4 Prozesse mit je eigener Engine × 200 `set_language` | 0 Fehler von 800 |
| HTTP, 8 Threads × 100 `PUT /api/studio/settings/language` (`raise_server_exceptions=False`) | 800 × HTTP 200 |
| HTTP, 8 Threads × 100, abwechselnd `PUT …/object-directory` mit `"move": false` und `PUT …/language` | 800 × HTTP 200 |
| 5 × je 8 gleichzeitig gestartete Prozesse mit `create_studio_engine` auf einer neuen Datenbank | alle 40 mit Exitcode 0, danach Sprache `de` lesbar |

### Geänderte Stellen

Gelesen habe ich `git diff cdf326f…7e261d0`: `migrate.py`, `storage.py`, `tests/test_concurrent_writes.py` und `docs/technical/pipwerk-studio.md` (Abschnitte 2.1, 2.8 Punkt 5, 6.1, 8).

- `migrate.py`: Die Migration ist weiter atomar. Die Tests in `test_migrations.py` bestehen, auch mit dem simulierten Fehler in Revision `0002`. Ein Verbindungsfehler bleibt ein Fehler von SQLAlchemy außerhalb des `try` (Zeile 122). Andere Datenbanken und `:memory:` verwenden die übergebene Engine (Zeile 89, siehe H3).
- `storage.py`: Die Imports für die Ereignisse sind entfernt. Die Kommentare in den Zeilen 53–55 und 58–60 beschreiben das Verhalten jetzt zutreffend.
- Abschnitt 2.1 und 8: Sie beschreiben die eigene Engine der Migration mit `BEGIN IMMEDIATE`, ihr Verwerfen, das Warten eines zweiten Starts und das Standardverhalten der Engine des Betriebs. Das stimmt mit dem Code und den Proben überein, mit Ausnahme der URI-Form in H3.
- Abschnitt 2.8 Punkt 5: Die Beschreibung stimmt mit `object_store.py` Zeilen 258–292 überein (`os.link` mit `follow_symlinks=False`, wenn `os.link in os.supports_follow_symlinks`, sonst ohne den Schalter). Geprüft habe ich das durch Lesen des Codes, nicht durch eine eigene Probe des Zeitfensters.
- Abschnitt 6.1: Der neue Absatz stimmt mit den 5 Tests in `test_concurrent_writes.py` überein.

## Nicht geprüft

- Betrieb unter Windows, auch das dort beschriebene Verhalten von `os.link` in Abschnitt 2.8 Punkt 5.
- Andere Datenbanken als SQLite.
