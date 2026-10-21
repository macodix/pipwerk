# Testbericht Funktion, Auftrag 03, Durchlauf 1

- Ergebnis: **nicht bestanden** (1 blockierender Befund)
- geprüfter Commit: `f70759b3b9474c5814c734af058658a7246ef8d3` (Zweig `backtest/wp02-03`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Commit des Prüfskripts: `dba32a9e5469dc9dd1116e0a1660cfab56aec1e6` (Zweig `backtest/wp02-functiontest-03`, auf GitHub)

## Prüfskript

- `components/pipwerk-fetch-mt5/scripts/check` (ohne Parameter): `uv sync --frozen`, pytest, `ruff check`, `ruff format --check`, mypy. Beschrieben in `docs/technical/pipwerk-fetch-mt5.md`, Abschnitt „Prüfskript“ (Unterabschnitt von 11). Der Satz „Prüfskript … nicht Teil des Auftrags“ in Abschnitt 11 ist angepasst.
- Ausführungsbit im Index gesetzt (Modus 100755 im Commit). Im Arbeitsverzeichnis ließ sich das Bit zuerst nicht setzen (`chmod` verweigert); nach `git checkout-index -f` startet das Skript über den absoluten Pfad als Programm.
- Ergebnis auf dem geprüften Stand: alle fünf Schritte bestanden. pytest: 346 bestanden, 4 übersprungen (Dateien gegen `contracts/market-data/v1/`, laut Übergabe kein Befund). ruff: sauber, 28 Dateien formatiert. mypy: keine Fehler in 27 Dateien. Läuft auf Linux ohne `MetaTrader5`.

## Geprüft und in Ordnung

- Abnahmekriterien 2 bis 8 nach Code und Läufen: Schlüsselprüfung vor Routing und Inhalt, Vergleich über `hmac.compare_digest` der SHA-256-Werte, feste Fehlertexte ohne Eingaben, Schlüssel nicht in `repr`, Host-Prüfung, Größe 8 KiB, nur lesende Aufrufe von MetaTrader 5.
- `python -m pipwerk_fetch_mt5.contract --check` gegen `contracts/api/pipwerk-fetch/v1/openapi.json`: ohne Abweichung.
- Suche nach `/srv/`, `/home/`, `aixlab`, `macodix` in Komponente, `contracts/api` und den beiden Dokumenten: keine Treffer.
- Dokumentation entspricht dem Code, soweit geprüft; die Entscheidungen des Entwicklungsleiters in der Übergabe sind berücksichtigt.

## Befunde

### Blockierend

1. **Zeilen der ersten Stunde einer doppelten Stunde gehen still verloren, wenn ein Abschnitt an der Grenze in oder an dieser Stunde endet** (`service.py` `_place` Zeile 209, `_steps` Zeile 188 bis 202; `timeconv.py` `utc_to_server`). Das Ende eines Abschnitts wird in Serverzeit umgerechnet und als Ausschlussgrenze `server_end` verwendet. Bei Europe/Athens, 25.10.2026 (Uhr wird um 01:00 UTC von 04:00 auf 03:00 zurückgestellt) liegt `server_end` für ein Ende ab 01:00 UTC in der zweiten Stunde und ist kleiner als die Serverzeit späterer Zeilen der ersten Stunde. Diese gültigen Zeilen (UTC 00:00 bis 01:00) liegen dann nicht in `[server_start, server_end)` und werden stumm verworfen („gehört zum Nachbarabschnitt“), ohne dass ein Nachbarabschnitt sie liest und ohne Eintrag in `omitted`. Das widerspricht Dokumentation Abschnitt 5 (nur die zweite Stunde fehlt, und diese wird unter `omitted` genannt) und Spezifikation 5.1 (Zeitpunkte richtig nach UTC).
   Nachweis (Ticks, ein Tick je Minute in Reihenfolge der UTC-Zeit, Serverzeit als Uhrzeit, Zeitzone Europe/Athens, `max_rows` 1000000):
   - Zeitraum 24.10. 19:30Z bis 25.10. **01:00Z** (Ende genau am Zurückstellen): 270 Zeilen, `omitted_count` 0; alle 60 Minuten von 00:00Z bis 00:59Z fehlen.
   - bis 01:30Z: 300 Zeilen, `omitted_count` 30 (nur die zweite Stunde); 30 Minuten 00:30Z bis 00:59Z fehlen zusätzlich, ohne Eintrag.
   - bis 02:00Z: 30 Minuten 00:30Z bis 00:59Z fehlen (hier mit Eintrag `double_local_time`, obwohl sie im Zeitraum liegen und eindeutig sind).
   - Ein kurzer letzter Abschnitt hat denselben Fehler: 24.10. 18:30Z bis 25.10. 01:30Z teilt in 18:30Z bis 00:30Z und 00:30Z bis 01:30Z; der zweite Abschnitt hat die Serverzeit 03:30 bis 03:30 (leer), 30 Zeilen fehlen ohne Eintrag.
   Die vorhandenen Tests prüfen den Beginn mitten in der doppelten Stunde, nicht das Ende (`tests/test_service.py` Zeile 131 bis 177).

### Hinweise

2. Ticks: Die Zahl der Abrufe ist nicht begrenzt, nur die Zahl der Zeilen. Ein Zeitraum 1970 bis 2100 ohne Ticks löst 189928 Abrufe von MetaTrader 5 aus (gemessen mit leerer Quelle) und hält die Sperre von `Mt5Gateway` entsprechend lang; `health` wartet (`service.py` Zeile 313 bis 324, Spezifikation 5.4 „Obergrenze je Anfrage“).
3. Kerzen: Die Schätzung vor dem Lesen zählt Wochenenden mit, ein Zeitraum knapp unter der Grenze wird bei Zeiteinheiten mit Wochenendlücke früher als nötig abgewiesen (dokumentiert in 6.1, nur als Hinweis).
4. Wird ein Schlüssel in der Adresse gesendet (Antwort 401), schreibt uvicorn die Adresse samt Schlüssel in sein Zugriffsprotokoll (`cli.py` Zeile 81; Abschnitt 9 behauptet „nirgends“, der Test prüft das Protokoll des Zugriffs nicht). Unbelegt: nicht ausgeführt, nach Code von uvicorn.
5. Der Satz in Abschnitt 11 „350 Fälle“ stimmt (346 bestanden, 4 übersprungen); nach dem Zusammenführen mit Auftrag 02 sind die vier Tests einmal auszuführen.

## Anmerkung zum Arbeitsverzeichnis

Im Arbeitsverzeichnis lagen vor dem Start Reste einer früheren Prüfung (`ft-probe-02.py`, `components/pipwerk-replay/`, `packages/market-data/src|tests`, eine vorgemerkte Datei `packages/market-data/scripts/check`). Ich habe nur die Vormerkung der Datei `packages/market-data/scripts/check` zurückgenommen (Datei bleibt), damit sie nicht in meinen Commit gerät. Meine Prüfdatei `ft-probe-03.py` im Wurzelverzeichnis konnte ich nicht löschen (`rm` verweigert); sie ist nicht versioniert und kann entfernt werden.
