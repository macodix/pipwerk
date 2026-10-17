# Testbericht Sicherheit – Auftrag 02, Durchlauf 1

- Bezug: `strategiedesign/wp01`, Prüfauftrag `development/strategiedesign/wp01/tests/02-1-order.md` (Zweig `strategiedesign/wp01`)
- geprüfter Commit: `c663d9d5b7414db24b4678bc1a07b493f114b6cb` (Zweig `strategiedesign/wp01-02`), im eigenen Arbeitsverzeichnis ausgecheckt und mit `git rev-parse HEAD` bestätigt
- Prüfgrundlagen: Auftrag `orders/02.md`, Spezifikation Abschnitte 4.1, 4.2, 7, 8, 9, `docs/technical/development-test-security-rules.md` (Abschnitte 5, 6, 8, 9), `docs/technical/pipwerk-studio.md`, BSI-Grundschutz (CON.8, APP.7, OPS.1.1.6), OWASP ASVS, OWASP API Security Top 10
- Umfang: erster Durchlauf, vollständig nach `docs/technical/entwicklungsverfahren.md` „Umfang der Prüfungen“

## Ergebnis: nicht bestanden

Ein blockierender Befund (S1: Migration beim Start nicht atomar). Dazu Hinweise H1 bis H7, die das Bestehen nicht verhindern.

## Durchgeführte Prüfungen und Nachweise

| Prüfung | Ergebnis |
| --- | --- |
| Prüfskript `components/pipwerk-studio/scripts/check --with-audit` | Backend: `uv sync --frozen`, pytest (310 bestanden), `ruff check`, `ruff format --check`, mypy bestanden; Suche nach der Schreibweise des Namens bestanden; Oberfläche: `npm ci`, Typprüfung, Vitest (244 bestanden), Bau bestanden; Browsertest 39 bestanden, 6 übersprungen. `npm audit` gescheitert (siehe H6). |
| `pip-audit` (über das Prüfskript, alle 33 festgeschriebenen Python-Pakete einschließlich `alembic` 1.20.0, `mako` 1.4.3, `markupsafe` 3.0.4) | „No known vulnerabilities found“ |
| Lockdatei `backend/uv.lock` | `uv lock --locked` endet mit Exitcode 0. Die drei neuen Pakete wurden ohne Cache neu von PyPI geladen (`uv sync --frozen --no-cache --reinstall-package …`); uv hat die Hashes der Lockdatei angenommen. Damit sind die Hashes der für Linux x86_64 und Python 3.14 verwendeten Dateien bestätigt (alembic- und mako-Wheel `py3-none-any`, markupsafe `cp314-cp314-manylinux…x86_64`). Die übrigen Hashes (sdists, andere Plattformen) sind nicht geprüft (H5). Keine weiteren neuen transitiven Abhängigkeiten. |
| Lizenzen | aus den Metadaten der installierten Pakete: alembic MIT, Mako MIT, MarkupSafe BSD-3-Clause; stimmt mit Abschnitt 7.1 der technischen Dokumentation überein |
| Dateinamen | eigene Proben gegen `object_file_name`: abgelehnt wurden `../etc/passwd`, UUID in Großbuchstaben, UUID mit Zeilenumbruch, mit `/../x`, ohne Bindestriche, in Klammern, mit arabisch-indischer Ziffer, leer; Arten `strategy/../x`, `Strategy`, `strategy ` (Leerzeichen), `json`, leer, `rule.json`. Kein Dateiname entsteht aus anderer Eingabe (Code `object_store.py` Zeilen 119–140). |
| Rechte | mit `umask 0`: neues Objektverzeichnis Rechte `0700` (nur Benutzer; das gesetzte Setgid-Bit stammt vom übergeordneten Testverzeichnis), Objektdatei `0600`, Datei nach Kopieren über Dateisystemgrenze `0600`, beim Verschieben neu angelegtes Ziel `0700`. Windows nicht prüfbar (keine Windows-Umgebung); Python ≥ 3.14 wertet `mode=0o700` unter Windows aus (ungeprüft). |
| Symbolische Verknüpfungen | Verknüpfung unter Objektnamen: nicht aufgelistet, Lesen „missing“, Löschen ohne Wirkung, Schreiben scheitert mit `ObjectWriteError`, Ziel unverändert; verwaiste Verknüpfung: Schreiben scheitert, Ziel wird nicht angelegt; keine temporären Dateien bleiben liegen. Beim Verschieben bleiben Verknüpfungen und fremde Dateien in der Quelle. Ausnahme bei nachträglichem Austausch: H1. |
| Keine Überschreibung beim Verschieben | `_move_file` mit vorhandenem Ziel: `FileExistsError`, Ziel und Quelle unverändert; ebenso über den Kopierweg (`os.link` mit `EXDEV` simuliert). Verknüpfung im Ziel unter Objektnamen: HTTP 409, nichts verschoben. |
| Eingaben der neuen Endpunkte | `PUT /api/studio/settings/object-directory`: HTTP 422 mit festem Text für zusätzliches Feld, `move` als Text oder Zahl, `path` als Zahl oder Liste, fehlendes Feld, Pfad > 4096 Zeichen, Pfad mit 20 MiB, Array, `null`, kein JSON, Formular, JSON mit `text/plain`; HTTP 422 mit festem Text für relativen Pfad, `.`, leer, `C:\objects` unter POSIX, Nullzeichen, `~/objects`. Keine Antwort wiederholt die Eingabe. `POST`, `DELETE`, `PATCH`: 405. Absoluter Pfad mit `..` wird angenommen und unverändert gespeichert (zulässig nach Spezifikation 8). |
| Fehlermeldungen | Ziel nicht anlegbar: 500 mit festem Text, kein Pfad, kein Ausnahmetext, Einstellung unverändert; gespeicherter relativer Wert: GET 503 mit festem Text, PUT mit „verschieben“ 500 „Internal Server Error“ ohne Details; Datenbank mit neuerer Revision: `DatabaseMigrationError` mit festem Text, Datei unverändert. Ausnahmetexte und Pfade stehen nur im Protokoll des Backends. Die Antwort bei gescheitertem Zurückholen nennt beide Verzeichnisse und Dateinamen, wie der Auftrag verlangt. |
| Sperren | Code: `ObjectStore.lock` (`RLock`) in jeder Funktion der Ablage und in `set_object_directory` vom Bestimmen der Quelle bis zum Speichern (`settings_service.py` Zeilen 268–281); nur im Prozess, dokumentiert in Abschnitt 2.8 und 9. |
| Migrationen (Regel 8.2 Nr. 10) | eigene Proben mit simuliertem Fehler in Revision `0002`: siehe S1. Unbekanntes Schema ohne Versionstabelle und neuere Revision lassen die Datenbank unverändert. |
| Testumgebungsskript | Übergabe von Datenbank-URL und Pfad an das Python-Programm über `sys.argv`, keine Auswertung durch die Shell; `.testenv/` mit `chmod 700`. Siehe H4. |
| CSRF über einfache Browseranfrage | JSON mit `Content-Type: text/plain` wird mit 422 abgelehnt; kein CORS eingerichtet. Siehe H3. |

Die Prüfprogramme lagen in einem eigenen Verzeichnis außerhalb des Repositorys und wurden nach der Prüfung entfernt. Am geprüften Commit wurde nichts geändert.

## Befunde

### S1 (blockierend): Migration beim Start auf SQLite nicht atomar, Start danach dauerhaft unmöglich

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/migrate.py` Zeilen 70–82 (`migrate_database`, `engine.begin()` mit `command.stamp` und `command.upgrade`), `storage.py` Zeilen 47–60 (SQLite-Engine ohne eigene Transaktionssteuerung), `docs/technical/pipwerk-studio.md` Abschnitt 2.1 (Zeile 42) und 8.
- Sachverhalt: Mit dem Treiber `sqlite3` in der Voreinstellung laufen DDL-Anweisungen außerhalb der Transaktion von `engine.begin()` und werden sofort festgeschrieben. Scheitert die Migration unterwegs, wird nur ein Teil zurückgenommen. Nachweis mit simuliertem Fehler in `op.add_column` (Revision `0002`):
  - Datenbank des bisherigen Schemas mit Sprache `en`: danach Tabellen `alembic_version` (leer) und `studio_settings` (Spalten `id`, `language`, Sprache erhalten). Der nächste Start scheitert mit `sqlite3.OperationalError: table studio_settings already exists`, weil die leere Versionstabelle die Erkennung als Revision `0001` verhindert und Alembic von vorn beginnt. Das wiederholt sich bei jedem Start.
  - neue Datenbank: derselbe Zustand und derselbe dauerhafte Fehler.
- Auswirkung: Ein Fehler während der Migration beim ersten Start nach der Aktualisierung (zum Beispiel volle Platte, gesperrte Datenbank nach Ablauf der Wartezeit von 30 Sekunden, Abbruch des Prozesses) macht die Komponente ohne Eingriff von Hand in die Datenbank dauerhaft nicht startbar. Die gespeicherten Daten bleiben erhalten. Die CLI meldet dann „the database connection of the startup configuration cannot be used“ mit dem Text der SQL-Ausnahme, was die Ursache nicht trifft.
- Bezug: Regel 8.2 Nr. 10 (Datenbankmigrationen benötigen Sicherungs-, Rücksetz- oder Wiederherstellungsverfahren entsprechend dem Schadensrisiko), Regel 9 Zeile Alembic, BSI CON.8/OPS.1.1.6 (Verfügbarkeit). Die technische Dokumentation nennt nur „Eine Sicherung vor dem Start ist Sache des Betreibers“; ein Rücksetzen findet auf SQLite nicht statt, und ein Wiederherstellungsweg für eine abgebrochene Migration ist nicht beschrieben. Die Tests (`tests/test_migrations.py`) prüfen keinen Fehlerfall der Migration.

## Hinweise

### H1: Verschieben folgt einer symbolischen Verknüpfung, die nach dem Auflisten entsteht

- Fundstelle: `object_store.py` Zeile 258 (`os.link(source, target)`, in Python mit `follow_symlinks=True` als Voreinstellung) und Zeile 240 (`source.open("rb")` im Kopierweg); `_move_back` Zeile 283 verwendet denselben Weg in Gegenrichtung.
- Sachverhalt: `_scan` prüft mit `lstat`, verschoben wird später ohne erneute Prüfung. Wird eine Objektdatei zwischen Auflisten und Verschieben durch eine Verknüpfung ersetzt, legt `os.link` eine harte Verknüpfung auf das Ziel der Verknüpfung an (Nachweis: gleiche Inode wie die Zieldatei, Verknüpfungszähler 2). Der Kopierweg kopiert den Inhalt des Ziels in das neue Verzeichnis. Das widerspricht der Aussage „Symbolische Verknüpfungen werden nicht verfolgt“ (Auftrag Punkt 3, technische Dokumentation Abschnitte 2.8 und 8) für diesen Wettlauf.
- Einordnung: Ausnutzbar nur mit Schreibrecht im Quellverzeichnis (beim Zurückholen im Zielverzeichnis). Das neu angelegte Verzeichnis hat Rechte nur für den Benutzer; ein vom Anwender gewähltes gemeinsam beschreibbares Verzeichnis vergrößert das Risiko. Deshalb Hinweis.

### H2: Objektverzeichnis an beliebigem Ort, auch in fremd beschreibbaren Verzeichnissen

- Fundstelle: `settings_service.py` `check_object_directory`, `object_store.py` Zeilen 208 und 326.
- Sachverhalt: Ein vorhandenes Verzeichnis behält seine Rechte (dokumentiert, Abschnitt 2.8). Ein Verzeichnis, das andere Benutzer beschreiben dürfen, wird ohne Prüfung angenommen; dort können andere Benutzer Namen vorab belegen (Ablehnung mit 409) oder den Wettlauf aus H1 nutzen. Übergeordnete Verzeichnisse entstehen mit den üblichen Rechten (mit `umask 0`: `0777`), dokumentiert.

### H3: Backend ohne Prüfung des Kopfs `Host` (DNS-Rebinding) im Entwicklungsbetrieb

- Fundstelle: `app.py` (keine Middleware für zulässige Hosts), `docs/technical/pipwerk-studio.md` Abschnitt 8.
- Sachverhalt: Im Entwicklungsbetrieb ist das Backend direkt an `127.0.0.1:<port>` erreichbar und prüft `Host` nicht. Eine Webseite im Browser des Anwenders kann über DNS-Rebinding gleichartige Anfragen stellen und damit `PUT /api/studio/settings/object-directory` aufrufen (Dateien verschieben, Verzeichnisse anlegen). Das bestand schon für die Sprache; der neue Endpunkt erhöht die Wirkung. Abschnitt 8 nennt das Risiko nur für `--host` außerhalb der Loopback-Adresse und den Schutz von `vite preview`, nicht für den Port des Backends. Nach Spezifikation 8 ist der Betrieb ohne Anmeldung zugelassen, deshalb Hinweis.

### H4: Python-Aufruf im Testumgebungsskript lädt Module aus dem aktuellen Verzeichnis

- Fundstelle: `components/pipwerk-studio/scripts/testenv` Zeilen 273–283 (`python -c '…'`).
- Sachverhalt: `python -c` setzt das aktuelle Verzeichnis des Aufrufers an den Anfang von `sys.path`. Liegt dort ein Paket `pipwerk_studio` oder `sqlalchemy`, wird es statt des installierten geladen. Das Skript wird aus einem beliebigen Verzeichnis aufgerufen (Abschnitt 4a).

### H5: Lockdatei teilweise ungeprüft und abweichend erzeugt

- Fundstelle: `backend/uv.lock` Einträge `alembic`, `mako`, `markupsafe`; technische Dokumentation Abschnitt 7.
- Sachverhalt: Die Einträge sind von Hand übernommen und haben anders als die übrigen Einträge kein `upload-time`. Bestätigt sind nur die Hashes der drei unter Linux x86_64 verwendeten Dateien (siehe Tabelle); die Hashes der sdists und der Wheels anderer Plattformen (unter anderem Windows) konnte ich nicht gegen PyPI abgleichen, weil der Abruf von PyPI in meiner Umgebung nicht erlaubt war. Eine neuere uv-Version kann die Datei beim nächsten `uv lock` umschreiben. Abschnitt 7 nennt die Veröffentlichungsdaten „nicht ermittelt“ und `pip-audit` als nachzuholen; `pip-audit` ist mit diesem Bericht für den geprüften Commit nachgewiesen (keine bekannten Lücken), die Veröffentlichungsdaten habe ich nicht ermittelt. Die Aussagen in Abschnitt 7 und 9 („nachzuholen“) treffen nach diesem Bericht für `pip-audit` nicht mehr zu.

### H6: `npm audit` meldet `source-map-js` 1.2.1 (GHSA-68fv-2mgg-jv7q, hoch)

- Sachverhalt: Befund besteht unverändert seit vor diesem Auftrag, betrifft nur Entwicklungsabhängigkeiten, ist in Abschnitt 7 und 9 dokumentiert. An der Oberfläche wurde in diesem Commit nichts geändert.

### H7: Keine Begrenzung der Größe des Request-Body

- Sachverhalt: Ein Body mit 20 MiB wird vollständig gelesen und erst von Pydantic abgelehnt (422). Die Grenze von 2 MiB nach Spezifikation 8 (OWASP API4) legt Auftrag 03 für Dokumente fest; für die internen Endpunkte gibt es keine Grenze. Bestand vorher für die Sprache ebenso.

## Nicht geprüft

- Verhalten unter Windows (Rechte des angelegten Verzeichnisses, Pfadregeln, `os.link` auf NTFS): keine Windows-Umgebung.
- Hashes der Lockdatei außer den drei verwendeten Dateien und Veröffentlichungsdaten der neuen Pakete: Abruf von PyPI in dieser Umgebung nicht erlaubt (siehe H5).
