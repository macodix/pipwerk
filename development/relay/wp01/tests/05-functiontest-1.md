# Testbericht Tester Funktion: Auftrag 05, Durchlauf 1

- ref: `relay/wp01`
- geprüfter Commit: `1177e14e73e214c19040b97cb7aa4d05bad1ebd1` (Zweig `relay/wp01-05`); mit `git rev-parse HEAD` im Arbeitsverzeichnis kontrolliert
- Prüfskript: unverändert, keine Änderung, kein Zweig `-functiontest`
- **Ergebnis: bestanden** (keine blockierenden Befunde)

## Ausgeführt

- `components/pipwerk-fetch-mt5/scripts/check --with-audit`: Exitcode 0. `uv sync --frozen`, pytest (1708 bestanden, 40 übersprungen: Uhrumstellungs-Tests, nicht Teil dieses Auftrags), ruff check, ruff format --check, mypy, pip-audit (keine bekannten Schwachstellen).
- `packages/relay-core/scripts/check`: Exitcode 0 (543 Tests, ruff, mypy). Die Pfadabhängigkeit ist damit nicht verändert worden.
- Aufruf an der Befehlszeile: Import von `cli`, `fetch`, `service`, `config` in einem eigenen Prozess lädt weder `pipwerk_relaycore` noch sqlalchemy, alembic, socket, asyncio, ssl, http oder httpx. `test_relay_isolation.py` prüft dasselbe.
- Probeaufrufe: `request` mit `--from` nach `--to`, mit `--wait 0`, `serve` mit fehlender Startkonfiguration: jeweils Exitcode 2 mit Meldung, ohne Eintrag eines Werts, nichts gesendet.

## Prüfung gegen Auftrag und Spezifikation

- Umfang 1 bis 7 erfüllt: Pfadabhängigkeit `pipwerk-relaycore==0.1.0` mit neuem `uv.lock`; `[relay]` und `[relay.way]`, `[relay.file_way]` wird als unbekannter Abschnitt abgewiesen; `server_time_zone` Pflicht für Aufruf und `serve`, nicht für `request` (`load_relay_settings`); drei Nachrichtenarten mit Schemas, Beispielen und ungültigen Beispielen, Schemas stimmen mit den Modellen überein (Test); `serve` prüft `request_invalid` und `broker_mismatch`, eine Nachricht je Datei, `fetch.result` mit Teilen, `range_too_large` bei `WayTooLargeError`, keine Antwort mit `receipt`; `request` mit Wartezeit 30 Minuten, `relay.undeliverable` mit Exitcode 1, Zeitüberschreitung mit Exitcode 1; Abruf-Test mit Nachbildung von `MetaTrader5`, Import mit `pipwerk-marketdata` (Test vorhanden).
- Harter Abbruch (E4, Störung 3): `serve` beantwortet in `store` von vorn, `request` schreibt einen Dateinamen je Anfrage einmal; Tests `test_after_a_hard_stop_…`, `test_when_the_directory_of_the_relay_is_not_reachable_…`.
- Feste Pfade, Ports, Namen im Code: keine gefunden (Suche in `relay/` und `config.py`).
- Bestand: `fetch.py` zerlegt in `fetch_documents` und `_write_part`; `fetch` liefert dieselben Ergebnisse, alle bisherigen Tests laufen unverändert. `service.py` ergänzt nur `broker_name` und die Zählung nach Grund. Das Verhalten des Aufrufs an der Befehlszeile ist gleich, mit einer Ausnahme: Ein Instrument mit dem Namen `serve` oder `request` an erster Stelle gilt jetzt als Befehl (bewusste Entscheidung 14, Abschnitt 3 der Dokumentation und Test vorhanden).
- `[relay.way]` mit den Vorworten `target.` und `inbox.`: vereinbar mit Spezifikation 3.4 (eigener Abschnitt, von der Abweisung ausgenommen, Weg prüft selbst) und 3.5 (Ziel und Eingang getrennt); als Entscheidung 15 in `docs/technical/pipwerk-fetch-mt5.md` (Abschnitt 14 und 16.3), im Beispiel und im README dokumentiert. Das Vorwort wird vor dem Durchreichen entfernt; die Angaben selbst bleiben unverändert.
- Dokumentation: technische Dokumentation (Abschnitte 16 bis 18 neu, 1, 2, 5, 11 bis 15 nachgeführt), README, Beispiel-INI, `contracts/messages/README.md`, Abschnitt „Abruf mit serve und request“ in `docs/user/pipwerk-relay.md`, `docs/user/pipwerk-replay.md` Abschnitt 9 (Installation mit `relay-core`). Keine Widersprüche zum Code gefunden.

## Befunde

Keine blockierenden Befunde.

## Hinweise (nicht blockierend)

1. `relay/request.py` `_store_file`: Kommt derselbe Dateiname ein zweites Mal mit anderem Inhalt, wird er stillschweigend verworfen (nur Protokoll Stufe INFO). Die Spezifikation verlangt nur Wiederholungen zu erkennen; ein Vermerk als Problem wäre genauer.
2. Windows: `serve`, `request` und die Rechteprüfung der Schlüsseldatei sind nicht ausgeführt (laut Entwickler, in der Dokumentation als offener Punkt 10 genannt).
3. Das echte Relay fehlt in diesem Stand; die Tests bilden es nach. Die Ende-zu-Ende-Nachweise folgen in Auftrag 06.
