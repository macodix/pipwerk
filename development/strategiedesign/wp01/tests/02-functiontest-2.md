# Testbericht Tester Funktion – Auftrag 02, Durchlauf 2 (Nachprüfung)

- Bezug: `strategiedesign/wp01`, Auftrag `development/strategiedesign/wp01/orders/02.md`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/02-2-order.md`
- geprüfter Commit: `cdf326f56ec585015c76385e55d51cb0cb19ffb3` (Zweig `strategiedesign/wp01-02`), vor der Prüfung mit `git rev-parse HEAD` im eigenen Arbeitsverzeichnis bestätigt
- vorher geprüfter Commit: `c663d9d5b7414db24b4678bc1a07b493f114b6cb` (Bericht `02-functiontest-1.md`)
- Prüfskript: `components/pipwerk-studio/scripts/check` im geprüften Commit `cdf326f56ec585015c76385e55d51cb0cb19ffb3`. Keine Änderung am Prüfskript, kein Zweig `strategiedesign/wp01-functiontest` angelegt.
- Umfang: Nachprüfung nach `docs/technical/entwicklungsverfahren.md` – Befunde aus Durchlauf 1 behoben? Neue Fehler an den dafür geänderten Stellen?
- Datum: 2026-10-16

## Ergebnis: nicht bestanden

B1 und B2 aus Durchlauf 1 sind behoben. Die Änderung für Sicherheit S1 in `storage.py` verursacht einen neuen blockierenden Fehler (N1): Gleichzeitiges Speichern auf derselben SQLite-Datei scheitert jetzt sofort mit „database is locked“ und HTTP 500. Vorher wartete es. Das betrifft auch den bestehenden Endpunkt der Sprache (Abnahmekriterium 5).

## Befunde (blockierend)

### N1 Gleichzeitige Schreibzugriffe scheitern nach der geänderten Transaktionssteuerung mit HTTP 500

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/storage.py` Zeilen 60–61 und 66–84 (`_make_sqlite_transactions_explicit`: `isolation_level = None`, `BEGIN` bei jedem Beginn einer Transaktion); betroffen sind `settings_service.py` `_update_record` (Zeilen 199–219, `session.get` und danach `session.commit`), damit `set_language` und `set_object_directory`, und `app.py` `write_language` (Zeile 271–273, fängt `OperationalError` nicht). Kommentar `storage.py` Zeilen 55–57 („a busy timeout makes concurrent write transactions wait for the SQLite file lock instead of failing immediately“).
- Sachverhalt: Jede Transaktion beginnt jetzt mit einem einfachen `BEGIN` (aufgeschoben), auch das Lesen der Zeile vor dem Ändern. Zwei gleichzeitige Schreibvorgänge halten danach beide eine Lesesperre und wollen beide schreiben. SQLite meldet in diesem Fall „database is locked“ sofort und wartet nicht die eingestellten 30 Sekunden ab. Vorher begann der Treiber die Transaktion erst vor der ändernden Anweisung; das Lesen hielt keine Sperre, und gleichzeitige Schreibvorgänge warteten aufeinander. Das Speichern der Sprache verhält sich damit nicht mehr unverändert (Abnahmekriterium 5): Gleichzeitige `PUT /api/studio/settings/language` enden zum Teil mit HTTP 500 `Internal Server Error`. Dasselbe gilt zwischen mehreren Backend-Prozessen auf derselben Datei und für das Speichern des Objektverzeichnisses. Der Kommentar in `storage.py` Zeilen 55–57 beschreibt das Verhalten nicht mehr zutreffend. Die technische Dokumentation Abschnitt 2.1 sagt „Das gilt für alle Verbindungen der Engine“, nennt diese Folge aber nicht. Kein Test prüft echte gleichzeitige Schreibvorgänge; der Test `test_lost_race_on_first_write_falls_back_to_update` stellt den Wettlauf nur nach.
- Nachweis (eigene Proben mit dem Python der Backend-Umgebung, temporäre SQLite-Datei, Zeile mit Sprache vorhanden):
  - 8 Threads mit je 200 Aufrufen von `SettingsService.set_language` auf einer Engine aus `create_studio_engine`: 690 von 1600 Aufrufen scheitern mit `OperationalError: database is locked`.
  - Gleiche Probe, Engine wie im vorher geprüften Commit (gleiche `connect_args`, Migration, ohne die beiden Ereignisse `connect` und `begin`): 0 Fehler.
  - 4 Prozesse mit je eigener Engine aus `create_studio_engine`, je 200 Aufrufe: 314 von 800 scheitern mit `database is locked`.
  - Über HTTP (`TestClient(create_app(…), raise_server_exceptions=False)`), 8 Threads mit je 100 `PUT /api/studio/settings/language`: 656 × HTTP 200, 144 × HTTP 500.

## Kontrolle der Befunde aus Durchlauf 1

| Befund | Ergebnis | Nachweis |
|---|---|---|
| B1 Prüfung der neuen Abhängigkeiten | behoben | Abschnitt 7 nennt das Ergebnis von `pip-audit` für 33 Pakete einschließlich alembic 1.20.0, mako 1.4.3, markupsafe 3.0.4; Tabelle 7.1 nennt Veröffentlichungsdaten; der Satz „nachzuholen“ ist aus Abschnitt 7 und 9 entfernt. Eigene Prüfung: `check --with-audit` Schritt „backend: pip-audit“ meldet für die 33 exportierten Pakete „No known vulnerabilities found“; die Zahl 33 stimmt mit der Ausgabe von `uv export` überein. Die Veröffentlichungsdaten (2026-09-11, 2026-09-22, 2026-10-02) habe ich nicht gegen PyPI geprüft (Netzabruf in meiner Umgebung nicht zugelassen). |
| B2 PUT mit „verschieben“ bei ungültigem gespeichertem Wert | behoben | Eigene Probe (gespeicherter Wert per SQL `relative`): `GET` → 503; `PUT move=true` → 409 mit dem Text aus Abschnitt 5, Wert bleibt `relative`, Zielverzeichnis nicht angelegt; danach `PUT move=false` → 200, `GET` liefert den neuen Pfad. Tests in `test_object_directory_api.py` und `test_object_directory_move.py` vorhanden und bestanden; Abschnitte 2.8 und 5 stimmen mit dem Code überein. |
| H3 Text bei nicht anlegbarem Ziel | behoben | Eigene Probe (Ziel unterhalb einer regulären Datei): HTTP 500 mit „The new object directory could not be created. Nothing was moved and the object directory is unchanged.“, Einstellung unverändert; entspricht Abschnitt 2.8 Punkt 6 und Abschnitt 5. |
| H1, H2, H4, H5 | nicht Gegenstand der Korrektur | H2 (`npm audit`, `source-map-js`) besteht unverändert; H1, H4, H5 unverändert. |

## Hinweise (nicht blockierend)

- H1 `npm audit` scheitert unverändert mit dem bekannten Altbefund `source-map-js` 1.2.1 (GHSA-68fv-2mgg-jv7q), in Abschnitt 7 und 9 dokumentiert. Das Prüfskript endet deshalb mit Exitcode 1.
- H2 Abschnitt 7 nennt als Quelle des `pip-audit`-Ergebnisses die Prüfungen der Tester am vorher geprüften Commit `c663d9d…`. Das Ergebnis gilt für die unveränderte `uv.lock`; der geprüfte Commit ändert `uv.lock` nicht (`git diff --stat` zwischen beiden Commits).

## Durchgeführte Prüfungen

### Prüfskript

Aufruf: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/functiontest/components/pipwerk-studio/scripts/check --backend-port 28741 --frontend-port 28742 --with-audit`, Exitcode 1.

| Schritt | Ergebnis |
|---|---|
| backend: uv sync --frozen | bestanden |
| backend: pytest | bestanden, 321 Tests |
| backend: ruff check | bestanden |
| backend: ruff format --check | bestanden, 27 Dateien |
| backend: mypy | bestanden, 27 Dateien |
| Suche nach der Schreibweise des Namens | bestanden, 397 Treffer |
| backend: pip-audit | bestanden, keine bekannten Sicherheitslücken |
| frontend: npm ci, typecheck, Vitest (244 Tests), build | bestanden |
| frontend: npm audit | nicht bestanden, Altbefund H1 |
| Browsertest Chromium, Firefox, WebKit | bestanden, 39 bestanden, 6 übersprungen (Fälle ohne Git-Arbeitsbereich, wie bisher) |

### Geänderte Stellen

`git diff c663d9d…cdf326f` gelesen: `app.py`, `migrate.py`, `object_store.py`, `storage.py`, `scripts/testenv`, die Tests `test_migrations.py`, `test_object_directory_api.py`, `test_object_directory_move.py`, `test_testenv.py` und `docs/technical/pipwerk-studio.md` (Abschnitte 2.1, 2.8, 4a, 5, 6.1, 7, 8, 9).

- Migration in einer Transaktion: Die neuen Tests (Fehler in Revision `0002` für das bisherige Schema und eine neue Datenbank, Abbruch des Starts mit Meldung, nicht erreichbare Datenbank) sind vorhanden und bestehen; Abschnitt 2.1 beschreibt das Verhalten passend zum Code.
- Kein Verfolgen von Verknüpfungen beim Verschieben und Zurückholen (`_link`, `O_NOFOLLOW`, erneute Prüfung mit `lstat`): Tests vorhanden und bestanden; Abschnitt 2.8 Punkt 5 stimmt mit dem Code überein.
- `python -I` im Testumgebungsskript: Test in `test_testenv.py` vorhanden und bestanden; Abschnitt 4a stimmt.
- Neue Fehlerantworten (409 bei ungültigem gespeichertem Wert mit „verschieben“, 500 bei nicht anlegbarem Ziel): feste Texte ohne Pfad und Ausnahmetext; Abschnitt 5 und die Beschreibung des Endpunkts in `app.py` stimmen überein.
- Transaktionssteuerung der Engine, Auswirkung auf das Speichern der Sprache: Befund N1.

## Nicht geprüft

- Veröffentlichungsdaten von alembic 1.20.0, mako 1.4.3 und markupsafe 3.0.4 gegen PyPI (Netzabruf in meiner Umgebung nicht zugelassen).
- Betrieb unter Windows.
