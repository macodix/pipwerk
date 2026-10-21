# Testbericht Funktion, Auftrag 03, 09 und 10, Durchlauf 3 (Nachprüfung)

- Ergebnis: **bestanden** (kein blockierender Befund)
- geprüfter Commit: `1378ab5132ee5bf314280c170e26c8e538ef1634` (Zweig `backtest/wp02-10`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Commit des Prüfskripts: `dba32a9e5469dc9dd1116e0a1660cfab56aec1e6` (Zweig `backtest/wp02-functiontest-03`), unverändert. Es fehlt im geprüften Commit; die Datei `components/pipwerk-fetch-mt5/scripts/check` liegt aus der Vorprüfung vorgemerkt im Arbeitsverzeichnis und ist mit dem Commit des Prüfskripts gleich.

## Prüfskript

Alle fünf Schritte bestanden: `uv sync --frozen`; pytest 1632 bestanden, 44 übersprungen (4 Dateien gegen `contracts/market-data/v1/`, 40 überspringen sich selbst; Summe 1676 wie in der Dokumentation Abschnitt „Tests“); `ruff check` sauber; `ruff format --check` 30 Dateien; mypy keine Fehler in 29 Dateien.

## Befund 1 aus Durchlauf 2: behoben

Eigene Läufe mit einem Paket, das aus wahren UTC-Zeitpunkten Serverzeiten macht (`ft-probe-09.py`). Zeiträume: Beginn 14 Stunden vor bis 3,5 Stunden nach dem Wechsel, Ende 3 bis 20 Stunden danach, Schritt 30 Minuten (907 Fälle je Lauf). Geprüft: gelieferte Zeilen und `omitted_count` gegen die erwartete Menge. Zeitzonen: Athen (beide Wechsel), London, New York (beide Wechsel), Lord Howe (beide Wechsel), Kolkata, Tokio, UTC.

- Kerzen h1 (Raster auf der Serverstunde und um 30 Minuten und eine Stunde verschoben), h4 (vier Lagen), d1 (vier Lagen), m1, m30: keine Abweichung. Die Fälle aus Befund 1 (Athen und London, Ende vor der doppelten Stunde, Beginn in der zweiten Stunde, Zeitraum über beide) sind darin enthalten und stimmen: richtige Zeilen, `omitted_count` gleich der Zahl der Zeilen der zweiten Stunde im Zeitraum.
- Ticks im Minutenabstand: keine Abweichung. Ticks, m1, m30 in Zeitzonen ohne Wechsel: keine Abweichung.
- Keine neuen Fehler durch die Änderung: Kerzen und Ticks außerhalb der doppelten Stunde unverändert richtig; gleiche Serverzeit außerhalb der doppelten Stunde bleibt `duplicate_time` (Test `test_service_clock_change_hourly.py`).

## Abweichungen meiner Läufe, die kein Befund sind

- Ticks im Abstand von 7 Minuten (Athen, London, New York, Lord Howe im Herbst-Wechsel): die Zeile der zweiten Stunde kommt mit UTC-Zeitpunkt eine Stunde zu früh, ohne Eintrag unter `omitted`. Das ist der Fall „dünner Markt“ aus Hinweis 2. Die Beschreibung im Rest-Risiko (Abschnitt 5) stimmt mit meinem Lauf überein: gleiche Folge (Beispiel 03:57 Serverzeit wird 00:57Z), gleiche Bedingung (nur Ticks, nur Zeitzonen mit Rückstellung), Begründung und Rat für die Einrichtung vollständig; dasselbe in Abschnitt 8 Schritt 4. Die Beispiel-INI trägt laut Diff den Kommentar (`git diff`, 6 Zeilen). Als technische Grenze angenommen, wie im Übergabedokument festgelegt.
- Lord Howe, Kerzen h1 und h4 auf einem UTC-Raster: Abweichung wie beschrieben unter „Grenze bei Zeitzonen mit Verschiebung von einer halben Stunde“. Bei Raster auf der Serverstunde (Verschiebung 30 Minuten) keine Abweichung.

## Hinweise

1. In meinem Lauf mit h4 und Raster ab dem Wechselzeitpunkt (Athen, London, New York) liefert die Nachbildung zur doppelten Stunde nur eine Zeile, die zum zweiten Durchlauf gehört, die erste fehlt. Das Programm erkennt sie nicht und liefert sie mit UTC-Zeitpunkt eine Stunde zu früh. Ein echter Broker legt h4-Kerzen auf die Serverzeit (00, 04, 08 Uhr), und bei dieser Lage (andere drei Verschiebungen) stimmt alles; der Fall ist künstlich. Es ist derselbe Mechanismus wie die dokumentierte Grenze bei Lord Howe („Kerze, deren erste Serverzeit fehlt, ist nicht erkennbar“); die Dokumentation nennt sie aber nur für Zeitzonen mit halber Stunde. Kein Befund; der Entwicklungsleiter kann den Satz allgemeiner fassen.
2. Aus dem Vorbericht, unverändert: die Schätzung der Kerzenzahl zählt Wochenenden mit (dokumentiert).
3. Im Arbeitsverzeichnis liegen nicht versionierte Prüfdateien (`ft-probe-02.py` bis `ft-probe-09.py`, `components/pipwerk-replay/`, `packages/market-data/`) und die vorgemerkte Datei `scripts/check`. Am Prüfskript habe ich nichts geändert, es gibt keinen neuen Commit.

## Dokumentation

`docs/technical/pipwerk-fetch-mt5.md` stimmt mit dem Code überein: Erkennung der zweiten Stunde (`_Order`, `one_row_per_time`), Zahl der Tests, Tabelle der Testdateien einschließlich `test_service_clock_change_hourly.py`.
