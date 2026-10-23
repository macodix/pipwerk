# Testbericht Funktionstest, Auftrag 13, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `1018c9d39dacf38b496e3935884dc18fe67f045f` (Zweig `backtest/wp02-13`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Commit des Prüfskripts: `40646f50011458bb33f50c44c85802688b9e68a6` (Zweig `backtest/wp02-functiontest-13`, aufgesetzt auf dem geprüften Commit, gepusht)
- Gegenstand: Auftrag 13, Spezifikation E5, 5.1, 5.4, 10 (Beschaffung), 11, 12

## Prüfungen

- Prüfskript `components/pipwerk-fetch-mt5/scripts/check` (Commit oben): `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check`, `mypy` bestanden. 1542 Tests bestanden, 40 überspringen sich selbst (`test_service_clock_change_hourly.py:97`, Lord Howe mit H1, durch einen eigenen Test abgedeckt, in der Dokumentation Abschnitt 13 so genannt).
- `check --with-audit` (neu, siehe Skriptänderung): `pip-audit` meldet keine bekannten Schwachstellen für die gesperrten Pakete. Übersprungen wird nur die Pfadabhängigkeit `pipwerk-marketdata` (keine Version aus der URL ableitbar).
- Aufruf (5.4): Instrumente, `--from`/`--to`, `-u`, `--ticks`, `-o` (ohne Angabe aktuelles Verzeichnis, wird angelegt), `-c` in `cli.py` umgesetzt. `CONTRACT` wird je Instrument immer geschrieben (`fetch.parts_of`).
- Dateien: Name `<Instrument>_<Daten>_<von>_<bis>.json` (`files.file_name`), Broker aus dem Namen des Handelsservers (`broker_unknown` sonst), Ersetzen, atomares Schreiben (temporäre Datei, `fsync`, `replace`, Aufräumen bei Fehler), Name nur aus geprüften Teilen (Muster für das Instrument, `write_file` lehnt Pfade ab). Alles in `test_files.py` und `test_cli.py` belegt.
- Fehler: Teil mit Instrument, Art, Zeitraum und Grund auf der Fehlerausgabe, übrige Dateien geschrieben, Exitcode 1; ungültiger Aufruf oder Konfiguration Exitcode 2 vor jedem Zugriff; Exitcode 0 mit Zusammenfassung.
- Konfiguration: Zuordnungstabelle `[symbols]`, Pflicht `server_time_zone`, alte Angaben (Adresse, Port, Schlüssel, Hosts) werden abgewiesen; Beispiel-INI entspricht dem Code.
- Entfernt: `app.py`, `auth.py`, `body_limit.py`, `host_check.py`, `start.cmd`, `fake_source.py`, `contracts/api/pipwerk-fetch/` sind nicht mehr im Baum; `pyproject.toml` und `uv.lock` ohne Webframework und Server (0 Treffer für `fastapi|uvicorn|starlette|httpx`; `test_repository.py`). Die Verweise in `contracts/market-data/README.md` nennen das Programm nur als Quelle von Dateien, keine HTTP-Schnittstelle.
- Kein Socket: Fixture `no_sockets` in `test_cli.py` für jeden Aufruf; kein Modul importiert `socket`, `http`, `asyncio`, `ssl`.
- Importierbarkeit: `test_import.py` prüft jede Datei gegen die Schemata unter `contracts/market-data/v1/` und importiert sie ohne Änderung mit `pipwerk_marketdata`.
- Zeitzone und Wechsel der Sommerzeit: `test_timeconv.py`, `test_service*.py` bestanden. Das Restrisiko bei Ticks im dünnen Markt ist in Dokumentation, Beispiel-INI und Einrichtung offen genannt.
- Programmierregeln: `ruff` und `mypy --strict` ohne Meldung; Sprache der Ausgaben wie vom Entwicklungsleiter entschieden (Hilfetext und Meldungen zu Aufruf und Startkonfiguration englisch, Dateien, Fehler mit Grund und Zusammenfassung deutsch) und in Dokumentation Abschnitt 3 und 14 Punkt 11 festgehalten; das Programm war bisher einsprachig, die Festlegung passt dazu.
- Technische Dokumentation (`docs/technical/pipwerk-fetch-mt5.md`, README): Aufruf, Dateien, Konfiguration, Einrichtung mit Rat zur Zeitzone und zu Ticks, Fehlerbilder, Entscheidungen stimmen mit dem Code überein (Testzahl 1582/1542/40 stimmt). Keine Pfade des Entwicklungsrechners, keine Zugangsdaten.

## Befunde

Blockierende Befunde: keine.

Hinweise (verhindern das Bestehen nicht):

1. `docs/technical/pipwerk-fetch-mt5.md` Abschnitt 13 „Prüfskript“ (Zeile 260) und `components/pipwerk-fetch-mt5/README.md` Zeile 33 sagen, das Skript nehme keine Parameter und führe fünf Prüfungen aus; mit dem Prüfskript-Commit gibt es `--with-audit` (sechste Prüfung `pip-audit`). Beim nächsten Anlass angleichen.
2. `docs/technical/pipwerk-fetch-mt5.md` Zeile 227 und offener Punkt 6 (Zeile 287): „`pip-audit` lief nicht / steht aus“. Es lief im Durchlauf dieses Berichts ohne Fund; Lizenz und Wartungszustand von `MetaTrader5` bleiben ungeprüft.
3. Nicht geprüft: Aufruf des installierten Programms von Hand an der Befehlszeile (die Ausführung war in dieser Sitzung nicht freigegeben). Aufruf, Exitcodes und Ausgaben sind durch `test_cli.py` gegen die Nachbildung von `MetaTrader5` belegt; `fetch.cmd` und Windows sowie ein echtes MetaTrader 5 prüft der Auftraggeber in der Abnahme (Dokumentation, offene Punkte 7 und 8).
4. Offener Punkt 9 der Dokumentation (Verweise auf die frühere Schnittstelle in pipwerk replay und Glossar) ist laut Entscheidung des Entwicklungsleiters Sache der Aufträge 12 und 14, kein Befund.
