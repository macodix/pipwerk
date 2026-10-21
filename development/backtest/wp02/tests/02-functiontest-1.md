# Testbericht Funktionstest, Auftrag 02, Durchlauf 1

- Vorhaben/Arbeitspaket: `backtest` / `wp02`
- Ergebnis: **nicht bestanden** (ein blockierender Befund)
- geprüfter Commit: `f01929341030104b7612d795154ab19069823c1b` (Zweig `backtest/wp02-02`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Commit des Prüfskripts: `28b21bbf329aacc204079f55e00f72a50387e4f0` (Zweig `backtest/wp02-functiontest-02`, auf GitHub)

## Prüfskript

- Neu: `packages/market-data/scripts/check [--with-audit]` (uv sync --frozen, pytest, ruff check, ruff format --check, mypy), Abschnitt „Prüfskript“ in `docs/technical/pipwerk-marketdata.md` (unter Abschnitt 12).
- Einschränkung: In dieser Sitzung durfte ich das Skript selbst nicht starten (Ausführung von Skripten und `chmod` abgelehnt). Ich habe seine fünf Schritte einzeln mit `uv --directory … run --frozen …` ausgeführt. Das Skript ist deshalb nicht ausgeführt, sondern nur nach dem Muster von Studio geschrieben. Das Ausführungsbit ist über `git update-index --chmod=+x` gesetzt.

## Ergebnisse der Prüfungen (Commit f019293)

- `uv sync --frozen`: ok. `pytest`: 230 bestanden. `ruff check`: ok. `ruff format --check`: 29 Dateien formatiert. `mypy`: keine Fehler in 28 Dateien.
- Eigene Grenzfälle (Probe-Skripte, nicht im Repository): doppelte und fehlende Ortszeit (Europe/Athens, 2024-10-27 und 2024-03-31) wie dokumentiert; Variante mit einem Zeitfeld, UTF-16, Semikolon, CRLF, leere Zeilen; Ticks mit leerem Brief abgelehnt (Zeile 3); Zeitzonen `../etc/passwd`, `/etc/localtime`, leer, unbekannt → `timezone_unknown`; JSON mit bool, Text, Kommazahl, NaN, Zeit mit Versatz oder ohne Zone, doppelten Schlüsseln, tiefer Schachtelung → abgelehnt; M1-Loch über Stundengrenze → Lücke; 500 000 Zeilen CSV (21 MB) in 12,7 s importiert, Wiederholung ersetzt 500 000, Vollständigkeit 0,8 s.
- Entscheidungen des Entwicklungsleiters: CSV-Format und fehlende Quelle sind in 5.2 und 11 genannt. Zweite Fassung der doppelten Ortszeit (Abschnitt 6, Test `test_clock_set_back_…`, `test_time_order_in_csv`), leerer Geld oder Brief (5.2, 13, `test_ticks_with_empty_bid_or_ask_are_rejected`), zusätzliche Kerzenprüfungen (4.2, 13, Tests zu `candle_violation`), festes Wochenende in UTC (7, Tests in `test_completeness.py`) sind dokumentiert und getestet. Kein Befund.

## Befunde

Blockierend:

1. JSON-Import: `volume` und `spread` einer Kerze haben keine Obergrenze (`src/pipwerk_marketdata/documents.py`, Zeilen 100 und 101: `Annotated[int, Field(ge=0)]`). Eine Datei mit `"volume": 1000000000000000000000000000000` wird nicht als abgelehnte Zeile gemeldet. Der Schreibvorgang endet mit `OverflowError: Python int too large to convert to SQLite INTEGER`. Das ist weder `ImportFileError` noch `MarketDataStoreError` noch eine abgelehnte Zeile. Erwartet nach Auftrag 02, Abnahmekriterium 1 und Spezifikation 5.3: „jede Fehlerart ergibt abgelehnte Zeilen mit Grund“, Prüfung an der Systemgrenze (Regeln 8.2 Nr. 2 und 3). Bei CSV ist der Wert auf 18 Ziffern begrenzt (`csvimport.py`, `_INTEGER`), bei JSON nicht. Kein Test deckt das ab. Der Grenzwert ist auch im Schema und in der Dokumentation nicht genannt. Die Transaktion wird zurückgerollt, es wird nichts sichtbar.

Hinweise (nicht blockierend):

2. Der Import von 500 000 CSV-Zeilen dauert rund 13 s (Standardbegrenzung `max_rows`); Tick-Dateien in dieser Größe sind ähnlich. Zur Kenntnis, keine Anforderung verletzt.
3. Das Dokument beschreibt Tests in Abschnitt 12 mit `uv run …`; `packages/market-data/README.md` nennt dasselbe, aber noch nicht das Prüfskript. Beim nächsten Anlass auf das Skript verweisen.
4. Im Arbeitsverzeichnis liegt `components/pipwerk-replay/` unversioniert vor; sie stammt nicht aus dem geprüften Commit und ist nicht Gegenstand dieser Prüfung.

## Weiteres

- Umfang des Commits entspricht dem Auftrag (43 Dateien, nur `contracts/market-data/`, `docs/technical/README.md` mit einer Zeile, `docs/technical/pipwerk-marketdata.md`, `packages/market-data/`). Keine Zugangsdaten oder Rechnernamen gefunden.
- Dokumentation sonst vollständig und mit dem Code konsistent (Abschnitte 1 bis 13, Gründe, Schwellen, Begrenzungen; `test_documentation.py` bestanden).
