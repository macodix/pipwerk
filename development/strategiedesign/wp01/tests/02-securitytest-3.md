# Testbericht Sicherheit – Auftrag 02, Durchlauf 3 (Nachprüfung)

- Bezug: `strategiedesign/wp01`, Prüfauftrag `development/strategiedesign/wp01/tests/02-3-order.md` (Zweig `strategiedesign/wp01`)
- geprüfter Commit: `7e261d0d90645670678c2ffc77e53fd1e2a7394b` (Zweig `strategiedesign/wp01-02`, auf `origin/strategiedesign/wp01-02` vorhanden), im eigenen Arbeitsverzeichnis ausgecheckt und mit `git rev-parse HEAD` bestätigt
- vorher geprüfter Commit: `cdf326f56ec585015c76385e55d51cb0cb19ffb3`, Bericht `development/strategiedesign/wp01/tests/02-securitytest-2.md`
- Prüfgrundlagen: Auftrag `orders/02.md` (Technische Abnahmekriterien 5 und 6), Festlegung des Softwarearchitekten im Prüfauftrag, `docs/technical/entwicklungsverfahren.md` Abschnitt „Umfang der Prüfungen“ und „Grenze der Durchläufe“, `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md` Abschnitte 2.1, 2.8, 6.1, 8, BSI-Grundschutz (CON.8, APP.7), OWASP ASVS
- Umfang: Nachprüfung. Geprüft wurde, ob S2 und H8 aus Durchlauf 2 behoben sind und ob die dafür geänderten Stellen neue Fehler enthalten. Geändert sind laut `git diff --stat cdf326f…7e261d0` nur `migrate.py`, `storage.py`, `tests/test_concurrent_writes.py` und `docs/technical/pipwerk-studio.md`.
- Datum: 2026-10-16

## Ergebnis: nicht bestanden

S2 ist behoben: Gleichzeitiges Schreiben scheitert in meinen Proben nicht mehr. Die Migration bleibt atomar (S1 bleibt behoben). H8 ist behoben.

Die neue eigene Engine der Migration verursacht einen neuen Befund an der korrigierten Stelle (S3): Ist die Datenbank eine SQLite-Datenbank im Speicher, die als URI mit `mode=memory` angegeben ist, legt die Migration die Tabellen in einer Datenbank an, die mit dem Verwerfen ihrer Engine verschwindet. Alle Endpunkte mit Datenbankzugriff antworten dann mit HTTP 500. An den Commits `c663d9d` und `cdf326f` antworten sie mit 200. Die Dokumentation sagt, für eine Datenbank im Speicher werde keine eigene Engine verwendet. Das widerspricht den Abnahmekriterien 5 und 6. Ich stufe den Befund deshalb als blockierend ein. Die Auswirkung ist auf diese Form der Datenbank-URL beschränkt; Datenbankdateien sind nicht betroffen.

Zahl der blockierenden Befunde: Durchlauf 2 hatte einen (S2), Durchlauf 3 hat einen (S3, neu an einer korrigierten Stelle). Nach `entwicklungsverfahren.md` Abschnitt „Grenze der Durchläufe“ (Zeilen 258 und 259) ist die Zahl nicht gesunken. Ob der Fall deshalb eine Ebene höher geht, entscheidet der Softwarearchitekt.

## Durchgeführte Prüfungen und Nachweise

| Prüfung | Ergebnis |
| --- | --- |
| Prüfskript `components/pipwerk-studio/scripts/check --backend-port 18731 --frontend-port 18732 --with-audit` | bestanden: `uv sync --frozen`, pytest, `ruff check`, `ruff format --check`, mypy, Suche nach der Schreibweise des Namens, `pip-audit`, `npm ci`, Typprüfung, Vitest, Bau, Browsertest (39 bestanden, 6 übersprungen wie bisher). Gescheitert: `npm audit` (Altbefund H6, `source-map-js` 1.0.0–1.2.1, GHSA-68fv-2mgg-jv7q, eigene Ausgabe von `npm audit`). |
| Backend-Tests einzeln (`uv run --frozen pytest -q`) | 326 bestanden; `tests/test_concurrent_writes.py` und `tests/test_migrations.py` zusammen 20 bestanden |
| Lockdateien | `backend/uv.lock`, `backend/pyproject.toml` und `frontend/package-lock.json` zwischen `cdf326f` und `7e261d0` unverändert (`git diff --stat` ohne Ausgabe) |
| `storage.py` gegen `c663d9d` | `git diff c663d9d…7e261d0 -- storage.py` zeigt nur drei neue Kommentarzeilen. Die Engine des Betriebs ist wie in `c663d9d`, wie vom Softwarearchitekten festgelegt. |
| S2: gleichzeitiges Schreiben über den Dienst (eigene Probe, eine Engine aus `create_studio_engine`, vier Threads, je 6 Sekunden `set_language` und `get_language`) | zwei Läufe: 2795 und 2784 Durchläufe, 0 Fehler. In Durchlauf 2 waren es am Commit `cdf326f` 435 und 458 Fehler „database is locked“. |
| S2: gleichzeitiges Schreiben über HTTP (eigene Probe, `TestClient(create_app(…), raise_server_exceptions=False)`, sechs Threads, je 6 Sekunden `PUT …/language` gemischt mit `PUT …/object-directory` mit `"move": false`) | zwei Läufe: 1139 + 333 und 1137 + 332 Antworten, alle HTTP 200, keine 500. Danach `/api/health` 200. |
| S2: gleichzeitiges Schreiben aus vier Prozessen, je eigene Engine, je vier Threads, 4 Sekunden | 594, 670, 788 und 645 Durchläufe, 0 Fehler, alle Exitcodes 0 |
| S1: Migration bricht mit Ausnahme ab (eigene Probe: `op.add_column` in Revision `0002` führt die Änderung aus, dann Ausnahme mit Pfadtext) | Bisheriges Schema mit Sprache `en`: Meldung „A migration of the pipwerk Studio database schema failed. The changes of this start were rolled back.“ ohne Ausnahmetext und Pfad; danach Spalten `id`, `language`, keine Versionstabelle, Sprache `en`, kein Journal. Nächster Start erfolgreich, Revision `0002`, Sprache `en`. Neue Datenbank: danach keine Tabellen; nächster Start erfolgreich, Revision `0002`. |
| S1: Prozess wird während der Migration beendet (eigene Probe, `SIGKILL` unmittelbar nach `op.add_column`) | beide Ausgangslagen: Rollback-Journal bleibt liegen; nächster Start erfolgreich, Revision `0002`, Sprache `en` erhalten (bisheriges Schema), kein Journal mehr |
| Gleichzeitige Starts (eigene Probe, bisheriges Schema mit Sprache `en`, vier Prozesse rufen gleichzeitig `create_studio_engine` auf) | alle vier erfolgreich, danach Revision `0002`, Sprache `en` erhalten, kein Journal. Entspricht Abschnitt 2.1 („wartet er … und findet danach den migrierten Stand vor“). |
| Datenbank im Speicher (eigene Probe, siehe S3) | `sqlite:///file:probe?mode=memory&cache=shared&uri=true`, nur `create_app`: am Commit `7e261d0` `GET …/language`, `PUT …/language`, `GET …/object-directory` je HTTP 500; an `c663d9d` und an `cdf326f` je HTTP 200. Mit `create_studio_engine` allein am Commit `7e261d0`: Pool `SingletonThreadPool`, nach dem Start keine Tabellen; an `c663d9d` Tabellen `alembic_version`, `studio_settings`. `sqlite://` (ohne URI): an `7e261d0` und an `c663d9d` gleich (Tabellen vorhanden, Endpunkte 500, weil jeder Thread eine eigene Datenbank im Speicher bekommt); keine Änderung durch diesen Commit. |
| H8: Abschnitt 2.8 Punkt 5 | beschreibt jetzt beide Fälle: Austausch vor der Prüfung mit `lstat` lässt das Verschieben scheitern; Austausch im Zeitfenster danach wird nicht verfolgt, das Verschieben scheitert nicht, die Verknüpfung kommt unter Linux ins neue Verzeichnis. Windows als nicht geprüft gekennzeichnet. Stimmt mit `object_store.py` überein (in diesem Commit nicht geändert) und mit meiner Probe aus Durchlauf 2. |
| Dokumentation Abschnitte 2.1, 6.1, 8 | stimmen für SQLite-Dateien mit Code und Proben überein. Abweichung bei einer Datenbank im Speicher als URI, siehe S3. |
| Geheimnisse und Angaben des Rechners | Die hinzugefügten Zeilen des Diffs enthalten keine Pfade des Entwicklungsrechners, Benutzernamen, Zugangsdaten oder Schlüssel (Suche im Diff). Autor und Committer `macodix`. |
| Fehlerausgabe der Migration | Die eigene Engine der Migration ändert die Meldungen nicht: `DatabaseMigrationError` mit festen Texten, Verbindungsfehler bleiben Fehler von SQLAlchemy (`migrate.py` Zeilen 121–140, `cli.py` unverändert). |

Für die Vergleiche habe ich in meinem Arbeitsverzeichnis kurz `c663d9d5b7414db24b4678bc1a07b493f114b6cb` und `cdf326f56ec585015c76385e55d51cb0cb19ffb3` ausgecheckt. Danach habe ich wieder `7e261d0d90645670678c2ffc77e53fd1e2a7394b` ausgecheckt und mit `git rev-parse HEAD` bestätigt. Am geprüften Commit wurde nichts geändert. Die Prüfprogramme lagen in einem eigenen Verzeichnis außerhalb des Repositorys und sind entfernt.

`git status --short` zeigt in meinem Arbeitsverzeichnis die nicht verfolgten Verzeichnisse `packages/domain-core/src/` und `packages/domain-core/tests/`. Sie gehören nicht zum geprüften Commit und stammen nicht aus dieser Prüfung (sie waren vor dem Auschecken des geprüften Commits vorhanden). Ich habe sie nicht angefasst. Sie liegen außerhalb der Komponente `pipwerk-studio` und gehen nicht in deren Prüfungen ein.

## Befunde aus Durchlauf 2

| Befund | Stand |
| --- | --- |
| S2 (blockierend): gleichzeitige Schreibzugriffe scheitern mit HTTP 500 | behoben (Nachweise oben: 0 Fehler über Dienst, HTTP und Prozesse). Die Korrektur verursacht S3. |
| H8: Dokumentation des Verschiebens bei Austausch durch eine Verknüpfung | behoben (Abschnitt 2.8 Punkt 5) |
| S1 aus Durchlauf 1: Migration nicht atomar | bleibt behoben (Proben oben mit der neuen Engine der Migration) |
| H2, H3, H7 aus Durchlauf 1 | nicht Gegenstand der Korrektur, unverändert, Hinweise bleiben |
| H5 (Hashes der Lockdatei teilweise ungeprüft) | Lockdatei unverändert, Hinweis bleibt |
| H6 (`npm audit`, `source-map-js` 1.2.1) | unverändert, dokumentiert, Hinweis bleibt |

## Neue Befunde

### S3 (blockierend): Datenbank im Speicher als URI verliert ihr Schema nach der Migration

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/migrate.py` Zeile 89 (`_sqlite_migration_engine`: Ausnahme nur für `engine.url.database in (None, "", ":memory:")`), Zeilen 91 und 113–118 (eigene Engine, nach der Migration mit `dispose()` verworfen). Dokumentation `docs/technical/pipwerk-studio.md` Abschnitt 2.1 (Zeile 42: „nur für SQLite-Dateien, nicht für eine Datenbank im Speicher“) und Docstring `migrate.py` Zeilen 86–87 („``None`` for every other database and for an in-memory database“).
- Sachverhalt: SQLite kennt eine Datenbank im Speicher auch in der URI-Form, zum Beispiel `sqlite:///file:name?mode=memory&cache=shared&uri=true`. SQLAlchemy behandelt sie als Datenbank im Speicher (Pool `SingletonThreadPool`, Probe). `_sqlite_migration_engine` prüft nur den Namen der Datenbank und erkennt diese Form nicht. Die Migration läuft deshalb auf einer eigenen Engine. Deren Verbindung wird mit `dispose()` geschlossen. Damit verschwindet die Datenbank im Speicher samt Schema, weil keine andere Verbindung sie offen hält. Die Engine des Betriebs öffnet danach eine leere Datenbank ohne Tabellen.
- Nachweis: siehe Tabelle, Zeile „Datenbank im Speicher“. Am Commit `7e261d0` antworten `GET` und `PUT /api/studio/settings/language` sowie `GET /api/studio/settings/object-directory` mit HTTP 500. An `c663d9d` und `cdf326f` antworten sie mit HTTP 200. Der Start selbst meldet keinen Fehler.
- Auswirkung: Mit dieser Datenbank-URL verhalten sich die bestehenden Endpunkte anders als vorher (Abnahmekriterium 5). Die Dokumentation sagt für eine Datenbank im Speicher etwas anderes, als der Code tut (Abnahmekriterium 6). Verfügbarkeit (BSI CON.8, APP.7): Das Backend startet scheinbar normal und ist dann nicht nutzbar. Keine Daten gehen verloren, die über einen Neustart hinaus bestünden, und keine Antwort nennt Details. Datenbankdateien, die übliche Form der Startkonfiguration, sind nicht betroffen. Kein Test deckt diese Form der URL ab.
- Bezug: Auftrag 02, Abnahmekriterien 5 und 6; Entwicklungsverfahren, „Umfang der Prüfungen“ (neuer Fehler an einer korrigierten Stelle, widerspricht einem Abnahmekriterium).

## Hinweise

Keine neuen Hinweise. Die Hinweise H2, H3, H5, H6 und H7 aus Durchlauf 1 bestehen unverändert (siehe Tabelle oben).

## Nicht geprüft

- Verhalten unter Windows (Rechte, Pfadregeln, `os.link` und Verknüpfungen auf NTFS): keine Windows-Umgebung.
- Andere Datenbanken als SQLite (Migration auf der übergebenen Engine): keine solche Datenbank in der Prüfumgebung.
- Gleichzeitiges Schreiben über ein Backend, das als eigener Prozess über `pipwerk_studio.cli` läuft: In diesem Durchlauf nur über den Testclient von FastAPI geprüft, der die Anfragen ebenfalls in mehreren Threads ausführt.
- Hashes der Lockdatei außer den drei in Durchlauf 1 bestätigten Dateien und die Veröffentlichungsdaten in Abschnitt 7: unverändert nicht gegen PyPI abgeglichen (H5).
- Ob der neue Test `tests/test_concurrent_writes.py` den Fehler S2 am Commit `cdf326f` nachweist: Aufgabe des Testers Funktion laut Prüfauftrag, von mir nicht ausgeführt.
