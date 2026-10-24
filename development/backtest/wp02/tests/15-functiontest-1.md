# Testbericht Funktionstest, Auftrag 15, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `98808466e503a9ee1a67b7b6ee04c46dd76704cc` (Zweig `backtest/wp02-15`)
- Commit des Prüfskripts: unverändert, kein eigener Zweig nötig; Stand des geprüften Commits (`98808466e503a9ee1a67b7b6ee04c46dd76704cc`)
- Ausgecheckt und mit `git rev-parse HEAD` kontrolliert.

## Ausgeführte Prüfungen

- `packages/market-data/scripts/check`: Exitcode 0 (uv sync, 605 Tests bestanden, ruff check, ruff format, mypy).
- Backend von `components/pipwerk-replay`: einzeln ausgeführt (`uv run --frozen`): 867 Tests bestanden, ruff check, ruff format --check und mypy ohne Befund. Das Komponentenskript `scripts/check` wurde nicht als Ganzes gestartet, weil es für die Oberfläche Ports und Browsertests braucht; die Oberfläche ist nicht Gegenstand (Auftrag 17).
- Suche nach den entfernten Namen (`max_files_per_import`, `max_import_bytes`) in Code, Beispielkonfiguration, `contracts/` und technischer Dokumentation: keine Treffer. Die Dokumentation nennt nur in Sätzen, dass es keine Grenze gibt. Treffer nur in der Oberfläche (siehe H1).

## Durch Lesen des Codes und der Tests geprüft

- Lücken (5.2): `completeness.py` setzt Lücken nur zwischen zwei abgedeckten Zeiträumen und nur außerhalb von Wochenende, Handelszeiten der Quelle und Tagen ohne Handel (`MM-TT`, 22:00 UTC bis 22:00 UTC, 29. Februar nur in Schaltjahren). Tests decken Feiertage im Zeitraum, 24./26. Dezember, 31. Dezember/2. Januar, nicht importierten Handelstag und die Prüfung vor dem Testlauf ab (`test_completeness.py`, `test_market_gaps.py`).
- Tage ohne Handel und Frist: `config.py` prüft die Werte, `pipwerk-replay.example.ini` und `pipwerk-replay.md` beschreiben sie, Bibliothek erhält sie als Parameter.
- Löschen: `deletion.py` für Reihe, Zeitraum, Kontraktdaten, Broker; Vorabangabe und Löschen im Dienst unter `exclusive()`, damit 409 während eines Vorgangs und kein Beginn eines Vorgangs mitten im Löschen. „Broker für Testläufe“ wird zurückgesetzt und von einem späteren Import nicht wieder gewählt (`_forget_missing_broker`).
- Import-Vorgang: eine Anfrage je Datei, eigene Transaktion, Abbrechen, Ende nach Frist (Uhr einspeisbar, `test_import_processes.py`); Grenze je Datei mit Meldung in lesbarer Einheit (`file_too_large`), kein Ersatz für Zahl oder Gesamtgröße.
- Migration `v0002_covered_whole_days.py`: erweitert gespeicherte Zeiträume auf ganze Tage in UTC, Wahl dokumentiert, getestet (`test_migrations.py`).
- Web-API: alle neuen Pfade stehen in `contracts/api/pipwerk-replay/v1/openapi.json`; Vertragstests (`test_contract.py`, `test_marketdata_contract.py`) bestanden.

Nicht geprüft: ein Lauf gegen eine laufende Testumgebung mit `curl`; die Fälle sind durch die Tests gegen die Web-API (TestClient) belegt.

## Blockierende Befunde

Keine.

## Hinweise (verhindern das Bestehen nicht)

- H1: Die Oberfläche (`components/pipwerk-replay/frontend/src/locales/de.json:48,232,233`, `en.json:232`) und `docs/user/pipwerk-replay.md:203` enthalten noch Meldungen zu „zu viele Dateien“ und „Gesamtgröße“; Gegenstand von Auftrag 17.
- H2: `deletion.py` `_delete_period`: Entfällt die letzte Zeile einer Reihe durch das Löschen eines Zeitraums, entfällt die ganze Reihe samt ihren übrigen abgedeckten Zeiträumen ohne Zeilen. Entspricht dem Wortlaut „Reihe ohne verbleibende Daten entfällt“, ist aber in der Dokumentation nicht ausdrücklich genannt.
- H3: `marketdata_service.py` `_delete`: Das Zurücksetzen von „Broker für Testläufe“ läuft in einer eigenen Transaktion nach dem Löschen; bei Abbruch dazwischen wird die Wahl beim nächsten Lesen oder Import durch `_forget_missing_broker` bereinigt. Kein Fehler, nur Hinweis.
