# pipwerk-fetch-mt5 – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-23
- komponente: `pipwerk-fetch-mt5`
- vorhaben: `backtest`, Arbeitspaket `wp02`, Auftrag 13 (Spezifikation: E5, 5.1, 5.4, 10, 11, 12; Abnahmebericht M4; req-system-027); in Auftrag 14 nur Abschnitte 12, 13 und 15 (Prüfskript und Abhängigkeiten) nachgeführt

## 1. Gegenstand

`pipwerk-fetch-mt5` ist die Quelle für historische Kursdaten aus MetaTrader 5 (req-system-027). Es ist ein Programm, das der Anwender auf dem Rechner von MetaTrader 5 an der Befehlszeile aufruft. Es liest dort mit dem Python-Paket `MetaTrader5` Kerzen, Ticks und die Angaben zu Instrumenten und schreibt sie als Dateien im JSON-Format des Imports (`contracts/market-data/v1/`) in ein Verzeichnis. Der Anwender importiert die Dateien in den Datenbestand von pipwerk replay.

Es ist eine Übergangslösung bis pipwerk relay (Spezifikation 5.4): Das Programm hat keinen Server, öffnet keinen Port, hat keine Anmeldung und keine Schnittstelle im Netz. pipwerk replay stößt es nicht an und beschafft nichts selbst (Abnahmebericht `wp02`, M4).

Das Programm handelt nie und schreibt nichts in MetaTrader 5; es liest. Es schreibt nur in das angegebene Zielverzeichnis.

## 2. Aufbau

Die Komponente liegt in `components/pipwerk-fetch-mt5/`. Sie hat nur ein Backend, deshalb liegen `pyproject.toml`, `uv.lock`, `src/` und `tests/` unmittelbar darin.

| Datei | Inhalt |
| --- | --- |
| `src/pipwerk_fetch_mt5/cli.py` | Startpunkt `pipwerk-fetch-mt5`: Aufruf, Prüfung der Angaben, Ausgabe, Exitcode |
| `fetch.py` | ein Aufruf: die Teile (Instrument und Daten), ihre Ergebnisse, Schreiben der Dateien |
| `files.py` | Dateinamen und atomares Schreiben |
| `config.py` | Startkonfiguration (INI), Suchorte nach req-system-017 |
| `models.py` | Pydantic-Modelle der Dateien des Imports und der Hinweise auf ausgelassene Zeilen |
| `service.py` | die Beschaffung eines Teils: Zuordnung, Umrechnung nach UTC, Grenzen, Aufbau der Dateien |
| `gateway.py` | die eigene Schnittstelle zu MetaTrader 5 (`TerminalGateway`) und ihre Datentypen |
| `mt5_gateway.py` | Umsetzung der Schnittstelle mit dem Paket `MetaTrader5` |
| `timeconv.py` | Serverzeit nach UTC und zurück, Handelszeiten nach UTC |
| `errors.py` | die Gründe, warum ein Teil nicht zu holen ist: Kennung und fester Text |
| `pipwerk-fetch-mt5.example.ini` | Beispiel der Startkonfiguration |
| `scripts/install.cmd`, `scripts/fetch.cmd` | Installation und Aufruf unter Windows (Abschnitt 10) |
| `scripts/check` | Prüfskript (Abschnitt 13) |

Fachlogik liegt in `service.py` und `fetch.py` und kennt das Paket `MetaTrader5` nicht; `mt5_gateway.py` übersetzt nur. Das Paket wird erst beim ersten Zugriff geladen (`importlib`), nie beim Import der Module.

Ein Aufruf läuft so: `cli.py` prüft die Angaben und liest die Startkonfiguration; `fetch.parts_of` bildet aus Instrumenten, Zeiteinheiten und Ticks die Teile; `fetch.fetch` holt sie nacheinander über `FetchService` und `TerminalGateway` und schreibt jede Datei mit `files.write_file`; `cli.report` gibt das Ergebnis aus. Danach trennt `Mt5Gateway.close` die Verbindung (das Terminal läuft weiter). Das Programm ist ein einziger Prozess ohne Threads und ohne Netz.

## 3. Aufruf

```
pipwerk-fetch-mt5 [-c <PATH>] --from <VON> --to <BIS> [-u <ZEITEINHEITEN>] [--ticks]
                  [-o <VERZEICHNIS>] <INSTRUMENT> [<INSTRUMENT> ...]
```

| Angabe | Bedeutung |
| --- | --- |
| `<INSTRUMENT>` (eines oder mehrere) | Bezeichnung des Instruments, zum Beispiel `EURUSD`. Erlaubt sind 1 bis 64 Buchstaben, Ziffern und `. _ # + -`, am Anfang ein Buchstabe oder eine Ziffer (Abschnitt 4). Wiederholungen zählen einmal. |
| `--from <VON>`, `--to <BIS>` | Zeitraum: `VON` eingeschlossen, `BIS` ausgeschlossen. Pflicht. Format ISO 8601: `2026-01-05` (Mitternacht), `2026-01-05T10:30` oder `2026-01-05T10:30:15`, jeweils mit `Z` oder Abweichung (`+02:00`) oder ohne Zone (dann UTC). Keine Sekundenbruchteile; Jahre von 1970 bis 2100; `VON` vor `BIS`. |
| `-u`, `--time-unit <ZEITEINHEITEN>` | Zeiteinheiten der Kerzen: eine oder mehrere der 21 Zeiteinheiten von MetaTrader 5 (`M1 M2 M3 M4 M5 M6 M10 M12 M15 M20 M30 H1 H2 H3 H4 H6 H8 H12 D1 W1 MN1`), groß oder klein geschrieben, durch Komma getrennt oder die Option wiederholt. Ohne Angabe keine Kerzen. |
| `--ticks` | Schreibt auch die Ticks. |
| `-o`, `--output-dir <VERZEICHNIS>` | Zielverzeichnis; ohne Angabe das aktuelle Verzeichnis. Fehlt es, wird es angelegt. |
| `-c`, `--config <PATH>` | Startkonfiguration (Abschnitt 5); ohne Angabe die Suchorte von req-system-017. |
| `--help` | Hilfetext. Das Programm war bisher einsprachig; der Hilfetext ist wie bisher englisch, die Ausgaben an den Anwender (Dateien, Fehler mit Grund) sind deutsch, die Angaben zu Aufruf und Startkonfiguration englisch. |

Die Angaben zum Instrument (`CONTRACT`) schreibt das Programm zu jedem Instrument immer mit, auch ohne Zeiteinheit und ohne `--ticks` (Spezifikation 5.4: ohne sie startet kein Testlauf).

Ablauf und Ausgabe: Das Programm prüft zuerst alle Angaben und die Startkonfiguration; ist eine ungültig, endet es mit Exitcode 2, ohne sich mit MetaTrader 5 zu verbinden, ohne etwas zu schreiben und ohne das Zielverzeichnis anzulegen. Dann holt es die Teile nacheinander: je Instrument in der angegebenen Reihenfolge `CONTRACT`, die Zeiteinheiten in der angegebenen Reihenfolge, `TICKS`. Für jede geschriebene Datei steht auf der Standardausgabe eine Zeile (`Geschrieben: <Datei> (<Art>, <n> Zeilen)`), bei ausgelassenen Zeilen (Abschnitt 7) darunter deren Zahl nach Grund und die Serverzeiten der ersten fünf. Für jeden Teil, der sich nicht holen ließ, steht auf der Fehlerausgabe eine Zeile `Fehler: <Instrument>, <Art>, <Zeitraum>: <Grund>` (Abschnitt 9). Zum Schluss steht die Zusammenfassung.

| Exitcode | Bedeutung |
| --- | --- |
| 0 | alle Dateien geschrieben |
| 1 | mindestens ein Teil ließ sich nicht holen; die übrigen Dateien sind geschrieben |
| 2 | ungültiger Aufruf oder ungültige Startkonfiguration; nichts geholt, nichts geschrieben |

Ist MetaTrader 5 nicht erreichbar, versucht das Programm die übrigen Teile nicht mehr einzeln (jeder Versuch wartet bis zur Zeitgrenze `timeout_ms`), sondern nennt für sie denselben Grund.

## 4. Dateien

**Name:** `<Instrument>_<Daten>_<von>_<bis>.json`.

- `<Instrument>` ist die Bezeichnung aus dem Aufruf, nie das Symbol des Brokers (Abschnitt 6).
- `<Daten>` ist die Zeiteinheit in Großbuchstaben (`M1`, `H1`, `MN1` …), `TICKS` oder `CONTRACT`.
- `<von>` und `<bis>` sind die Grenzen des Zeitraums in UTC als `JJJJMMTT`, wenn es Mitternacht ist, sonst als `JJJJMMTTTHHMMSS` (`20260105T103000`). Auch die Angaben zum Instrument tragen den Zeitraum des Aufrufs im Namen, obwohl die Daten selbst keinen Zeitraum haben (Spezifikation 5.4).

Beispiele: `EURUSD_H1_20260101_20260201.json`, `EURUSD_TICKS_20260105T083000_20260105T170000.json`, `GER40.cash_CONTRACT_20260101_20260201.json`.

Eine bestehende Datei gleichen Namens wird ersetzt. Der Name entsteht nur aus geprüften Angaben (`files.file_name`): Die Bezeichnung muss `[A-Za-z0-9][A-Za-z0-9._#+-]{0,63}` entsprechen, enthält also weder Trennzeichen eines Pfads noch Leerzeichen noch Steuerzeichen und beginnt nicht mit einem Punkt; die Daten sind eine Zeiteinheit, `TICKS` oder `CONTRACT`; die Zeitpunkte kommen aus geprüften Datumsangaben. Das Symbol des Brokers aus der Zuordnungstabelle geht nur an MetaTrader 5 und nie in einen Namen. Eine Bezeichnung mit unzulässigen Zeichen weist das Programm vor allem anderen ab (Exitcode 2). Der Unterstrich ist als Zeichen der Bezeichnung zulässig; ein Leser des Namens trennt von rechts (`bis`, `von`, `Daten`, der Rest ist die Bezeichnung).

**Schreiben** (`files.write_file`): Das Programm schreibt in eine temporäre Datei im Zielverzeichnis (`.<Zufall>.tmp`), leert die Puffer, synchronisiert sie und benennt die Datei dann um (`Path.replace`, unter Windows und Linux atomar auf demselben Laufwerk). So bleibt nie eine halbe Datei; scheitert das Schreiben, bleibt eine bestehende Datei gleichen Namens unverändert und die temporäre Datei wird entfernt (Grund `write_failed`). Dateien entstehen nur unmittelbar im Zielverzeichnis. Auf Linux hat eine geschriebene Datei die Rechte der temporären Datei (nur der Benutzer liest und schreibt).

**Inhalt** (`models.py`; das JSON-Format des Imports, `contracts/market-data/v1/`; kompakt ohne Einrückung, UTF-8):

- Kerzen: `version` 1, `kind`, `broker`, `instrument`, `time_unit` (klein geschrieben wie im Schema), `period` (der angefragte Zeitraum; die Quelle deckt ihn ab, auch wo es keine Kerze gibt, zum Beispiel am Wochenende), `trading_hours` (Abschnitt 8), `candles` mit `time` (Eröffnung), `open`, `high`, `low`, `close`, `volume` (das Tickvolumen; das echte Volumen liefert das Programm nicht), `spread` (Punkte, wie geliefert). Es sind Geldkurse (Bid) wie von MetaTrader 5 geliefert.
- Ticks: wie Kerzen, mit `ticks` aus `time` (Millisekunden), `bid`, `ask`. MetaTrader 5 wird nach den Änderungen von Geld und Brief gefragt (`COPY_TICKS_INFO`). Mehrere Ticks in derselben Millisekunde bleiben alle erhalten.
- Angaben zum Instrument (`CONTRACT`): `acquired_at` (Zeitpunkt der Beschaffung), `tick_size`, `tick_value` (Wert eines Ticks je Lot in der Währung `tick_value_currency`, die der Gewinnwährung des Symbols), `point`, `pip`, `spread`, `min_volume`, `volume_step`, `contract_size`, `swap_long`, `swap_short`, `swap_triple_weekday`, `margin_per_lot`.
  - `pip`: zehn Punkte bei einem Symbol mit drei oder fünf Stellen, sonst ein Punkt. MetaTrader 5 liefert keinen Pip; das ist die übliche Regel der Broker (Entscheidung des Entwicklers).
  - `spread`: der aktuelle Spread in Punkten mal `point`, also als Kursdifferenz, wie das Schema es verlangt.
  - `margin_per_lot`: die Margin für ein Lot, wie das Terminal sie berechnet (`order_calc_margin`, Kauf eines Lots zum aktuellen Brief; es kennt den Hebel). Gelingt das nicht, gilt die Anfangsmargin des Symbols, wenn es eine nennt, sonst `null`. Die Währung der Margin steht nicht in der Datei.
  - Gibt MetaTrader 5 einen Wert, den das Schema ablehnt (Tickgröße, Tickwert, Punkt, Kontraktgröße, Mindestvolumen oder Volumenschritt nicht über null oder nicht endlich, Swap nicht endlich, Währung nicht 2 bis 10 Buchstaben oder Ziffern), nennt das Programm den Grund `invalid_broker_data` („Der Broker liefert ungültige Angaben zum Instrument“) und schreibt keine Datei, die der Import ablehnen würde.
- **Broker:** In jeder Datei der Name des Handelsservers, an dem MetaTrader 5 angemeldet ist (`account_info().server`; req-system-027, Spezifikation 5.1). Das Programm hat dafür keine Einstellung. Ist der Name nicht bestimmbar oder für das Schema unzulässig (länger als 128 Zeichen, Steuerzeichen, Leerzeichen am Rand), ist der Grund `broker_unknown`.

Kerzen und Ticks, deren Zahl `max_rows_per_file` übersteigt, schreibt das Programm nicht; der Grund ist `range_too_large` (Abschnitt 5). Ein Zeitraum ohne eine einzige Zeile ist `no_data`.

## 5. Startkonfiguration

Name der Datei: `pipwerk-fetch-mt5.ini`. Sie wird mit `-c <PATH>` gefunden (höchste Priorität) oder an den Suchorten von req-system-017 in dieser Reihenfolge: `%USERPROFILE%\pipwerk\etc`, `%APPDATA%\pipwerk`, `%PROGRAMDATA%\pipwerk` (Windows), `$HOME/pipwerk/etc`, `$HOME/.config/pipwerk`, `/etc/pipwerk` (Linux). Es gilt genau eine Datei, Inhalte mehrerer Dateien werden nicht zusammengeführt. Ohne gültige Datei läuft das Programm nicht (Exitcode 2). Das Beispiel `pipwerk-fetch-mt5.example.ini` erklärt jeden Eintrag; die ausgefüllte Datei steht nie im Repository (`.gitignore` der Komponente).

Das Programm hat keine Angaben zu Adresse, Port, Schlüssel und erlaubten Hosts, weil es keinen Server hat. Eine Datei, die sie noch enthält (`[server]`, `[security]`, `name` im Abschnitt `[broker]`), wird abgewiesen: Die Datei wird streng gelesen, ein unbekannter Abschnitt oder Eintrag lässt den Aufruf scheitern, damit sich kein Tippfehler unbemerkt auswirkt.

| Abschnitt | Eintrag | Bedeutung |
| --- | --- | --- |
| `[broker]` | `server_time_zone` | Pflicht. IANA-Name der Zeitzone der Serverzeit des Handelsservers (Abschnitt 7) |
| | `max_rows_per_file` | Höchstzahl der Zeilen einer Datei; Voreinstellung 200000, höchstens 5000000 |
| | `max_reads_per_file` | Höchstzahl der Abrufe von MetaTrader 5 je Datei (Abschnitt 7); Voreinstellung 500 (bei Ticks etwa 125 Tage), höchstens 100000 |
| `[metatrader5]` | `path`, `login`, `password`, `server`, `timeout_ms` | Angaben zur Verbindung; alle optional. Ohne sie hängt sich das Programm an das laufende Terminal mit dem Konto, in dem es angemeldet ist. `timeout_ms`: 1000 bis 600000, Voreinstellung 60000 |
| `[symbols]` | `<Bezeichnung> = <Symbol>` | Zuordnungstabelle (Abschnitt 6) |

Die Voreinstellung von 200000 Zeilen folgt den Grenzen des Imports (`pipwerk_marketdata.limits`: 500000 Zeilen und 32 MiB je Datei): Eine Kerze braucht in der Datei etwa 130 Byte, ein Tick etwa 70; 200000 Zeilen bleiben unter 32 MiB. Wer `max_rows_per_file` erhöht, muss die Grenzen des Imports von pipwerk replay mit erhöhen, sonst lehnt der Import die Datei ab.

Fehlermeldungen zur Startkonfiguration nennen den fehlerhaften Eintrag, nie einen Wert der Datei; bei einem Syntaxfehler nennen sie nur die Zeilennummer, weil configparser sonst die Zeile wiederholt. Prozentzeichen in Werten werden nicht ausgewertet. `repr()` der Konfiguration zeigt das Kennwort nicht.

## 6. Zuordnung Bezeichnung zu Symbol

Der Anwender nennt ein Instrument mit seiner Bezeichnung (zum Beispiel `EURUSD`). Der Broker nennt es vielleicht `EURUSD.r`. Die Tabelle `[symbols]` ordnet zu; Groß- und Kleinschreibung zählen. Ohne Eintrag gilt die Bezeichnung selbst als Symbol (Spezifikation 5.4). Die Dateien nennen immer die Bezeichnung, nie das Symbol des Brokers. Kennt der Broker das Symbol nicht, ist der Grund `symbol_unknown`. Bevor das Programm Daten liest, wählt es das Symbol im Marktfenster von MetaTrader 5 aus (`symbol_select`); das Symbol bleibt dort danach stehen. Das ist eine Veränderung der Ansicht des Anwenders in MetaTrader 5, aber keine am Konto.

## 7. Zeitzone und Zeitpunkte

MetaTrader 5 liefert die Serverzeit des Brokers. Das Paket gibt sie als Sekunden seit 1970 zurück, als wäre die Serverzeit UTC; Zeitpunkte, die man ihm übergibt, liest es ebenso. `Mt5Gateway` liest `time` deshalb als Sekunden der Uhr des Servers und übergibt Serverzeiten als Datum mit `UTC` nur als Träger, ohne Umrechnung. Die Umrechnung nach UTC macht allein `service.py` mit der Zeitzone aus `server_time_zone` (Spezifikation 5.1), mit Sommerzeit:

- Eine Ortszeit, die beim Zurückstellen der Uhr doppelt vorkommt, gilt als die frühere (Regel des Imports).
- Eine Ortszeit, die beim Vorstellen der Uhr fehlt, lässt sich nicht umrechnen. Die Zeile wird ausgelassen und gezählt (`time_does_not_exist`).

Folge der ersten Regel: Die zweite Stunde einer doppelten Stunde bekäme dieselben UTC-Zeitpunkte wie die erste. Das Programm erkennt die zweite Stunde an der Reihenfolge der Zeilen eines Abrufs (`_Order`) und lässt sie aus (`double_local_time`), statt zwei Zeilen für einen UTC-Zeitpunkt zu schreiben. Die erste Stunde geht nie verloren; nur die Daten der zweiten fehlen in der Datei, und die Ausgabe nennt sie (offener Punkt 1). Das gilt, wo auch immer der Zeitraum oder ein Abschnitt (siehe unten) die doppelte Stunde schneidet, in jeder Zeitzone.

Der Aufruf nennt `--from` (eingeschlossen) und `--to` (ausgeschlossen); sie werden nach UTC umgerechnet. Alle Zeitpunkte in den Dateien sind UTC, `2026-01-05T10:00:00.000Z` (Millisekunden, abschließendes `Z`).

Ein großer Zeitraum wird in mehrere Abrufe zerlegt: Kerzen in Schritte von höchstens 10000 Kerzen, Ticks in Schritte von 6 Stunden. Die Schritte werden in UTC geschnitten. Jede Zeile gehört dem Schritt, in dem ihr UTC-Zeitpunkt liegt (`_place`); nicht die Serverzeit der Grenze entscheidet, denn beim Zurückstellen der Uhr liegt die Serverzeit am Ende eines Schritts unter der Serverzeit von Zeilen davor (Beispiel Athen, 25.10.2026: Ende 01:30Z ist 03:30 Serverzeit, aber die erste Stunde 03:00 bis 03:59 liegt bei 00:00Z bis 00:59Z). Das Fenster, das an das Paket geht, ist deshalb der Schritt in Serverzeit (`timeconv.server_window`), erweitert dort, wo sich der Versatz der Zeitzone nahe dem Schritt ändert: um das Doppelte der Verschiebung (eine Stunde in Athen) nach beiden Seiten, sodass ein Schritt mit einer Zeile der doppelten Stunde die ganze doppelte Stunde mit beiden Durchläufen liest und die zweite an der Reihenfolge erkennt. Ohne Änderung des Versatzes ist das Fenster genau der Schritt. Was das Paket zusätzlich liefert, gehört dem Schritt, in dem sein UTC-Zeitpunkt liegt, oder keinem. Die zweite Stunde zählt der Schritt, in dem ihr wirklicher UTC-Zeitpunkt (die spätere Uhr) liegt, eine fehlende Ortszeit der Schritt, in dem ihr rechnerischer UTC-Zeitpunkt (die Uhr vor dem Sprung) liegt; jede ausgelassene Zeile wird deshalb genau einmal genannt. Tests (`test_service_clock_change.py`) bilden ein Paket nach, das aus wahren UTC-Zeitpunkten Serverzeiten macht, und prüfen für Ticks und Kerzen, für Europe/Athens (Herbst 2026, Frühjahr 2027), Australia/Lord_Howe (halbe Stunde), America/New_York und eine Zeitzone ohne Sommerzeit, für jeden Beginn und jedes Ende um den Wechsel und für viele Schnittlängen, dass jede gültige Zeile ankommt und nur die zweite Stunde ausgelassen wird.

Grenze der Abrufe: Die Zahl der Schritte eines Zeitraums steht vor dem ersten Abruf fest (Zeitraum geteilt durch die Länge eines Schritts). Ist sie größer als `max_reads_per_file` (Voreinstellung 500), nennt das Programm für den Teil den Grund `range_too_large` („Zeitraum zu groß“), bevor MetaTrader 5 etwas liest; das gilt für Kerzen und Ticks. Ohne diese Grenze löste ein Zeitraum von 1970 bis 2100 mit Ticks 189928 Abrufe aus. Die Zeilenzahl (`max_rows_per_file`) bleibt daneben bestehen: Die Zahl der Kerzen eines Zeitraums wird vor dem Lesen geschätzt (Zeitraum geteilt durch die Dauer der Zeiteinheit, ein Monat zu 30 Tagen); ist sie größer, ist der Grund `range_too_large`, ohne dass gelesen wird. Ticks werden beim Lesen gezählt.

Ausgelassene Zeilen und ihre Gründe: `time_does_not_exist`, `double_local_time`, `duplicate_time` (Kerze mit der Zeit der vorigen), `invalid_price` (Preis nicht endlich oder nicht über null). Die Ausgabe nennt je Datei die Zahl nach Grund und die Serverzeit der ersten fünf (das Modell hält bis zu 100).

Erkennung der zweiten Stunde (gilt für jede Zeiteinheit): Die Zeilen eines Abrufs kommen nach Serverzeit aufsteigend. In der doppelten Stunde zeigt die Uhr jede Zeit zweimal, einmal je Durchlauf. Eine Zeile gehört zum zweiten Durchlauf, wenn ihre Serverzeit unter die höchste bisher gesehene fällt (bleibt der zweite Durchlauf, bis die Zeit die höchste überschreitet). Bei Kerzen gilt zusätzlich: Eine Serverzeit der doppelten Stunde kommt je Durchlauf höchstens einmal vor, denn es gibt je Serverzeit nur eine Kerze. Eine Kerze mit der gleichen Serverzeit wie die vorige, die in der doppelten Stunde liegt, ist deshalb der zweite Durchlauf. Das ist nötig bei H1 und gröber: dort hat jeder Durchlauf nur eine Zeile, die zweite hat dieselbe Serverzeit wie die erste, und die Zeit fällt nie. Außerhalb der doppelten Stunde ist eine gleiche Serverzeit keine zweite Stunde, sondern `duplicate_time`. Bei Ticks gilt die Gleichheit nicht (mehrere Ticks in derselben Millisekunde sind zulässig); dort zählt nur das Zurückgehen. Die Lage im Fenster allein genügt nicht: das Fenster enthält beide Durchläufe, sagt aber nicht, in welchem eine Zeile liegt; nur die Reihenfolge der Zeilen sagt es. Auch die Zuordnung zum Abschnitt (`_place`) ändert sich nicht: die zweite Zeile zählt der Abschnitt, in dem ihr späterer UTC-Zeitpunkt liegt, und nur wenn dieser im angefragten Zeitraum liegt. Tests: `test_service_clock_change.py` und `test_service_clock_change_hourly.py` (Kerzen H1, H4, D1, M30, M1 in Athen, London, New York und Lord Howe; die drei Fälle des Berichts mit Prüfung der ausgelassenen Zeilen).

Rest-Risiko der Erkennung (Ticks im dünnen Markt, Zeitzonen mit Rückstellung der Uhr): Die Erkennung hat nur die Zeilen eines Abrufs mit ihrer Serverzeit. Hat die erste Stunde keine Zeile nach der ersten Zeile der zweiten, zum Beispiel weil der Markt zu der Zeit geschlossen ist, lässt sich nicht erkennen, dass eine zweite Stunde vorliegt. Die Folge ist nicht nur, dass nichts gemeldet wird: Liegt die letzte Zeile der ersten Stunde vor der Serverzeit einer Zeile der zweiten (Beispiel Athen, 25.10.2026: letzter Tick der ersten Stunde 00:54Z = 03:54, Tick der zweiten Stunde 01:57Z = 03:57), dann steigt die Serverzeit durchgehend, und das Programm schreibt die Zeile der zweiten Stunde als Zeile der ersten, mit einem UTC-Zeitpunkt, der um eine Stunde zu früh liegt (00:57Z), und ohne Hinweis. Geprüft wurde, ob sich der Fall erkennen lässt, etwa durch Abfrage mit einem erweiterten Fenster und Vergleich der Reihenfolge der Abrufe. Es lässt sich nicht: MetaTrader 5 liefert für ein Fenster in Serverzeit nur Zeilen mit Serverzeit; jede Abfrage, auch mit anderem Fenster, gibt für die Zeile 03:57 dieselbe Zeit und keine Angabe, in welchem Durchlauf sie liegt. Eine Zeile 03:57 ist als Zeile der ersten Stunde (00:57Z) nicht von einer der zweiten (01:57Z) zu unterscheiden, solange keine Zeile mit niedrigerer Serverzeit nach ihr kommt. Der Fall betrifft nur Ticks (bei Kerzen hat jede Serverzeit der doppelten Stunde eine Zeile je Durchlauf, und die Wiederholung der Serverzeit zeigt den zweiten Durchlauf) und nur Zeitzonen, in denen die Uhr zurückgestellt wird; der Wechsel liegt bei Brokern meist am Wochenende ohne Handel. **Rat für die Einrichtung** (er steht auch im Beispiel der Startkonfiguration und in Abschnitt 10): Wo der Broker einen Handelsserver ohne Sommerzeit anbietet, dessen Zeitzone in `server_time_zone` eintragen (zum Beispiel `Etc/GMT-2` für UTC+2 das ganze Jahr), sonst Ticks nicht über den Wechsel der Uhr hinweg holen: der Zeitraum endet vor der doppelten Stunde oder beginnt nach ihr, mit einem Abstand von mindestens zwei Stunden zum Wechsel.

Grenze bei Zeitzonen mit Verschiebung von einer halben Stunde (Lord Howe): Kerzen von H1 und gröber liegen beim echten Broker auf der Serverstunde. Eine Kerze zu einer Serverzeit, die nur im zweiten Durchlauf geliefert wird (die erste fehlt), ist nicht erkennbar; wo die Quelle Kerzen auf ein Raster in UTC statt in Serverzeit legt, ist das ein Mangel der Quelle, nicht des Programms.

## 8. Handelszeiten

Das Paket `MetaTrader5` bietet keine Funktion für die Handelszeiten eines Symbols (die gibt es nur in MQL5). Das Programm schreibt deshalb für MetaTrader 5 keine: `trading_hours` ist `null`, und der Import lässt die gespeicherten Handelszeiten der Reihe dann unverändert. `TerminalGateway.sessions()` ist für Quellen vorgesehen, die welche kennen. Wochensitzungen der Serverzeit lassen sich nur dann nach UTC bringen, wenn der Versatz der Zeitzone das ganze Jahr gleich ist; bei Sommerzeit wäre die Sitzung in UTC im Sommer und im Winter eine andere, und das Programm schreibt dann `null` statt einer falschen Liste. Sitzungen über Mitternacht werden an der Mitternacht geteilt (Format des Schemas).

## 9. Fehler und Fehlerbilder

Ein Teil, der sich nicht holen lässt, wird mit Instrument, Art, Zeitraum und Grund auf der Fehlerausgabe genannt, zum Beispiel:

```
Fehler: EURUSD, Kerzen H1, 2026-01-05 00:00:00 UTC bis 2026-01-06 00:00:00 UTC: Symbol beim Broker unbekannt
```

Die übrigen Teile werden geholt und geschrieben; der Exitcode ist 1. Die Gründe sind feste Texte (`errors.py`); sie nennen weder Werte des Aufrufs noch Ausnahmetexte noch Angaben der Startkonfiguration.

| Kennung | Text | Wann, was tun |
| --- | --- | --- |
| `symbol_unknown` | Symbol beim Broker unbekannt | Der Broker kennt das Symbol nicht. Schreibweise prüfen; heißt das Instrument beim Broker anders (`EURUSD.r`), in `[symbols]` zuordnen. |
| `no_data` | Daten beim Broker nicht vorhanden | Für den Zeitraum liefert MetaTrader 5 keine Zeile (zu weit zurück, Feiertag, Wochenende, Verlauf nicht geladen). Zeitraum ändern; in MetaTrader 5 den Verlauf des Symbols laden (Diagramm öffnen und zurückblättern). |
| `range_too_large` | Zeitraum zu groß … | Mehr Zeilen als `max_rows_per_file` oder mehr Abrufe als `max_reads_per_file`. Kürzeren Zeitraum wählen und mehrmals aufrufen, oder die Grenze in der Startkonfiguration anheben. |
| `terminal_unavailable` | MetaTrader 5 nicht erreichbar | MetaTrader 5 läuft nicht, ist nicht angemeldet oder nicht mit dem Handelsserver verbunden, das Paket `MetaTrader5` ist nicht installiert (`install.cmd` ausführen) oder die Anmeldung aus `[metatrader5]` schlug fehl. Terminal starten und anmelden. |
| `broker_error` | MetaTrader 5 hat die Abfrage mit einem Fehler beendet | MetaTrader 5 meldete bei der Abfrage einen Fehlercode (im Protokoll auf der Fehlerausgabe). |
| `broker_unknown` | Der Name des Brokers ist nicht bestimmbar | Das Terminal nennt keinen Handelsserver, oder der Name ist für das Schema unzulässig. Anmeldung prüfen. |
| `invalid_broker_data` | Der Broker liefert ungültige Angaben zum Instrument | Die Angaben zum Instrument enthalten Werte, die das Schema ablehnt. |
| `write_failed` | Die Datei konnte nicht geschrieben werden | Zielverzeichnis nicht beschreibbar oder voll, Datei gesperrt. Es bleibt keine halbe Datei. |
| `internal_error` | Interner Fehler im Programm | Ein Fehler im Programm; der Teil fällt aus, die anderen laufen weiter. Das Protokoll nennt den Namen der Ausnahme. |

Fehler im Aufruf oder in der Startkonfiguration (Exitcode 2) erscheinen als `pipwerk-fetch-mt5: <Text>` auf der Fehlerausgabe; der Text nennt den fehlerhaften Wert des Aufrufs (nicht der Startkonfiguration).

Zuordnung der Fehler von MetaTrader 5 (`mt5_gateway.py`, nach `last_error()` des Pakets): Fehler der Verbindung (Code −10000 und darunter) und Anmeldefehler (−6) ergeben `terminal_unavailable` und lassen das Programm beim nächsten Abruf neu verbinden; −4 (nicht gefunden) und Erfolg ohne Zeilen ergeben eine leere Liste, also `no_data`; alle anderen Fehler `broker_error`. Diese Codes stammen aus der Dokumentation des Pakets; sie sind nicht gegen ein echtes MetaTrader 5 geprüft. Das Protokoll (Fehlerausgabe, Stufe Warnung) nennt Codes und Namen von Ausnahmeklassen, nie Ausnahmetexte, Kennwort oder Anmeldung.

## 10. Einrichtung auf dem Rechner von MetaTrader 5 (Windows)

Das Paket `MetaTrader5` läuft nur unter Windows und braucht ein installiertes MetaTrader 5 auf demselben Rechner. Einmal einrichten, dann bei Bedarf aufrufen. (Dieser Abschnitt ist die Grundlage der Anwenderdokumentation `docs/user/pipwerk-replay.md`; er ist ohne Entwicklungswissen geschrieben.)

**Einmal einrichten**

1. **uv installieren.** uv ist ein kleines Programm, das Python und die nötigen Pakete holt (https://docs.astral.sh/uv/). Es verändert das Python des Systems nicht. Nach der Installation ein neues Eingabeaufforderungsfenster öffnen.
2. **Programm auf den Rechner legen.** Den Ordner `components\pipwerk-fetch-mt5` des Repositorys an einen beliebigen Ort kopieren, zum Beispiel `C:\pipwerk\pipwerk-fetch-mt5`.
3. **Installieren.** In diesem Ordner `scripts\install.cmd` ausführen (Doppelklick oder in der Eingabeaufforderung). Es lädt Python 3.14 und die Pakete, mit `MetaTrader5`, in den Unterordner `.venv`. Dafür ist einmal eine Internetverbindung nötig. Danach braucht das Programm kein Netz mehr.
4. **Startkonfiguration anlegen.** Die Datei `pipwerk-fetch-mt5.example.ini` aus dem Ordner als `pipwerk-fetch-mt5.ini` in den Ordner `%USERPROFILE%\pipwerk\etc` kopieren (den Ordner anlegen, falls er fehlt; `%USERPROFILE%` ist der Ordner des angemeldeten Benutzers, zum Beispiel `C:\Users\Name`). In der Datei **`server_time_zone`** eintragen, die Zeitzone des Handelsservers Ihres Brokers (siehe unten). Wenn Ihr Broker ein Instrument anders nennt, als Sie es nennen wollen, im Abschnitt `[symbols]` eine Zeile `EURUSD = EURUSD.r` ergänzen. Mehr ist nicht nötig.

**Die Zeitzone**

MetaTrader 5 zeigt die Zeit des Handelsservers, nicht Ihre Ortszeit und nicht UTC. Das Programm rechnet sie mit `server_time_zone` nach UTC um; ist sie falsch, sind alle Daten um die Differenz verschoben, ohne dass es auffällt.

- So finden Sie sie: Vergleichen Sie in MetaTrader 5 die Uhrzeit im Fenster „Marktübersicht“ mit der aktuellen UTC-Zeit. Viele Broker verwenden `Europe/Athens` (UTC+2, im Sommer UTC+3) oder `Europe/Berlin`. Die Zeitzone muss mit Sommerzeit des Servers übereinstimmen; sie ist ein Name wie `Europe/Athens`, kein Versatz wie „+2“.
- **Rat zu Ticks über den Wechsel der Sommerzeit:** Einmal im Jahr, wenn die Uhr des Servers zurückgestellt wird, kommt eine Stunde der Serverzeit zweimal vor. Bei Kerzen erkennt das Programm die zweite Stunde sicher und lässt sie aus (die Ausgabe nennt sie). Bei Ticks erkennt es sie nur, wenn der Markt in dieser Zeit dicht genug ist; in einem ruhigen Markt können Ticks der zweiten Stunde um eine Stunde zu früh in die Datei gelangen, ohne Hinweis (Abschnitt 7). Deshalb: Bietet Ihr Broker einen Handelsserver ohne Sommerzeit an, nutzen Sie diesen und tragen dessen Zeitzone ein (zum Beispiel `Etc/GMT-2` für UTC+2 das ganze Jahr). Sonst holen Sie Ticks nicht über den Wechsel der Uhr hinweg: Der Zeitraum soll vor der doppelten Stunde enden oder nach ihr beginnen, mit mindestens zwei Stunden Abstand zum Wechsel. Der Wechsel liegt bei den meisten Brokern an einem Wochenende (Ende Oktober beziehungsweise Ende März).

**Aufrufen**

1. MetaTrader 5 starten und am Konto anmelden. Der Algo-Handel muss nicht eingeschaltet sein; das Programm handelt nie.
2. Eine Eingabeaufforderung öffnen und `scripts\fetch.cmd` mit den Angaben aufrufen, zum Beispiel für den Januar 2026, Kerzen H1 und D1 und Ticks, in den Ordner `daten`:

   ```
   scripts\fetch.cmd --from 2026-01-01 --to 2026-02-01 -u H1,D1 --ticks -o daten EURUSD GBPUSD
   ```

   Ohne `-o` landen die Dateien im Ordner, aus dem Sie aufrufen. Das Programm schreibt eine Zeile je Datei und nennt Teile, die sich nicht holen ließen, mit dem Grund (Abschnitt 9). Es endet von selbst; es öffnet keinen Port.
3. Die Dateien (`EURUSD_H1_20260101_20260201.json` und so weiter) auf den Rechner von pipwerk replay bringen und dort in der Ansicht „Datenbestand“ importieren (mehrere Dateien in einem Vorgang).

Das Programm gehört auf den Rechner von MetaTrader 5, weil das Paket `MetaTrader5` nur dort ein Terminal erreicht. Es liest nur und öffnet kein Netz.

Auf Linux lässt sich alles bis auf den Zugriff auf MetaTrader 5 installieren und starten (Entwicklung und Tests): `uv --directory components/pipwerk-fetch-mt5 sync --frozen` und `… run pipwerk-fetch-mt5 --help`. Das Paket `MetaTrader5` kommt dabei nicht auf den Rechner (Abschnitt 12).

## 11. Sicherheit

Grundlage: Spezifikation 5.4 und 11, `development-test-security-rules.md`, OWASP.

- **Kein Server, kein Port (Spezifikation 11, req-system-027).** Das Programm bindet keinen Socket, hört nicht und verbindet sich mit nichts außer dem lokalen Terminal über das Paket `MetaTrader5`. Es hat keine Anmeldung und keinen Schlüssel, weil es nichts im Netz anbietet. Ein Test sichert zu, dass beim Aufruf kein Socket geöffnet und kein Name aufgelöst wird (`test_cli.py`, Fixture `no_sockets` für jeden Aufruf), ein anderer, dass kein Modul des Programms ein Webframework, einen Server, `socket`, `http`, `asyncio` oder `ssl` importiert, und dass weder `pyproject.toml` noch `uv.lock` ein Webframework oder einen Server nennen (`test_repository.py`).
- **Nur lesen.** Das Programm ruft keine Funktion des Pakets auf, die handelt (`order_send` und andere). Es berechnet die Margin mit `order_calc_margin`, das nichts auslöst. Es schreibt nur in das Zielverzeichnis.
- **Dateinamen (Spezifikation 11).** Der Name einer Datei entsteht nur aus geprüften Teilen (Abschnitt 4): Eine Bezeichnung mit Trennzeichen eines Pfads, `..` am Anfang, Leerzeichen, Steuerzeichen oder anderen Zeichen außer `A-Z a-z 0-9 . _ # + -` wird vor jeder Verbindung abgewiesen. Das Symbol des Brokers aus der Zuordnungstabelle (kann beliebige Zeichen enthalten) geht nur an MetaTrader 5. `write_file` lehnt zusätzlich jeden Namen ab, der ein Pfad ist. Tests: `test_files.py` und `test_cli.py` (auch ein Symbol `../../evil` in der Tabelle).
- **Schreiben.** Atomar (Abschnitt 4); die Datei wird mit den Rechten des Benutzers angelegt. Eine bestehende Datei gleichen Namens wird ersetzt; ein Verzeichnis dieses Namens wird nicht angetastet (`write_failed`).
- **Kennwort.** Anmeldedaten für MetaTrader 5 stehen nur in der Startkonfiguration (optional, Klartext; die Datei so schützen, dass nur der Benutzer sie liest) und werden nicht protokolliert und nicht in Fehlermeldungen genannt. Ausnahmetexte werden nicht ausgegeben; das Protokoll nennt den Namen der Ausnahmeklasse oder den Code von MetaTrader 5.
- **Grenzen.** `max_rows_per_file` und `max_reads_per_file` begrenzen Zeilen und Abrufe je Datei; ein Zeitraum von Jahrzehnten mit Ticks löst nicht Hunderttausende Abrufe aus (Abschnitt 7).
- **Abhängigkeiten.** Siehe Abschnitt 12.

## 12. Abhängigkeiten

Alle direkten und indirekten Abhängigkeiten stehen in `uv.lock`. Laufzeit: `pydantic` (genau die Version, die `pipwerk-marketdata` festlegt, damit die Dateien dieselbe Prüfung durchlaufen) und `tzdata` (nötig, weil Windows keine Zeitzonendatenbank hat, aus der `zoneinfo` lesen könnte). Optional, nur Windows: `MetaTrader5` (Extra `mt5`, Markierung `sys_platform == 'win32'`), das `numpy` mitbringt. Entwicklung und Tests: `pytest`, `ruff`, `mypy`, `jsonschema` und `types-jsonschema` (prüft die Dateien gegen die Schemata des Imports), `pipwerk-marketdata` (Pfadabhängigkeit `packages/market-data`, nur für Tests: die geschriebenen Dateien werden mit der Bibliothek importiert) und `sqlalchemy` (für die Datenbank dieser Tests).

Entfallen sind `fastapi`, `uvicorn` und alles, was sie mitbrachten (`starlette`, `h11`, `httpx2` und weitere); `uv.lock` ist neu erzeugt.

Installation und Tests auf Linux brauchen `MetaTrader5` nicht: Es ist nur über das Extra erreichbar, und die Tests ersetzen das Paket durch eine Nachbildung des Moduls (`tests/support.py`, `FakeMt5Module` und `ArchiveMt5Module`). Ein Test sichert zu, dass kein Modul des Programms das Paket beim Import lädt.

Geprüft ist, dass sich die Auflösung durchführen lässt und `MetaTrader5` 5.0.6231 ein Rad für Python 3.14 unter Windows hat (`cp314-win_amd64`). `pip-audit` (Prüfskript mit `--with-audit`, Abschnitt 13) lief im Durchlauf 1 des Testberichts zu Auftrag 13 ohne Fund für die gesperrten Pakete; ausgenommen ist die Pfadabhängigkeit `pipwerk-marketdata`, aus der sich keine Version ableiten lässt. Lizenz und Wartungszustand von `MetaTrader5`, `tzdata`, `jsonschema` und der neuen Pakete sind nicht geprüft (offener Punkt 6).

## 13. Prüfungen

Im Verzeichnis `components/pipwerk-fetch-mt5` (Linux, ohne das Paket `MetaTrader5`):

```
uv sync --frozen
uv run --frozen pytest
uv run --frozen ruff check
uv run --frozen ruff format --check
uv run --frozen mypy
```

Das Prüfskript führt diese Prüfungen zusammen aus (Abschnitt „Prüfskript“ unten). Ein Test gegen ein echtes MetaTrader 5 gibt es nicht; ihn macht der Auftraggeber in der Abnahme.

Die Tests (pytest, 1582 Fälle, davon 1542 bestanden; 40 überspringen sich selbst, Lord Howe mit H1 in der Tabelle der Einheiten, abgedeckt durch einen eigenen Test). Das Paket `MetaTrader5` ist in allen Tests eine Nachbildung (`tests/support.py`):

| Datei | Inhalt |
| --- | --- |
| `test_cli.py` | der ganze Aufruf gegen `ArchiveMt5Module`: Dateinamen, Inhalt, Broker als Name des Handelsservers, Zielverzeichnis (angegeben, aktuelles, angelegt), Ersetzen bestehender Dateien, Zuordnungstabelle (auch ein Symbol mit Pfadzeichen), Zeitzone mit Sommer- und Winterzeit und zweite Stunde der doppelten Stunde, Teile mit Grund und Exitcode (Symbol unbekannt, keine Daten, Fehler von MetaTrader 5, Zeitraum zu groß, nicht erreichbar mit nur einem Versuch, Paket fehlt, unerwarteter Fehler), unzulässige Zeichen im Instrument, ungültiger Zeitraum, Zeiteinheit und Zielverzeichnis, ungültige Startkonfiguration, Hilfetext, **kein Socket geöffnet** (Fixture `no_sockets` für alle Aufrufe) |
| `test_import.py` | **Nachweis der Importierbarkeit**: jede geschriebene Datei gegen das Schema unter `contracts/market-data/v1/` und ohne Änderung mit `pipwerk_marketdata` importiert (Kerzen, Ticks, Angaben zum Instrument, erneuter Import ersetzt, Zeitzone mit Sommerzeit) |
| `test_files.py` | Dateinamen (Zeiteinheit, `TICKS`, `CONTRACT`, Zeitpunkte in UTC, unzulässige Bezeichnungen), atomares Schreiben, Ersetzen, Fehlschlag ohne halbe Datei, Verzeichnis statt Datei |
| `test_config.py` | jeder Eintrag, Pflichtangaben, ungültige Werte, unbekannte und entfallene Einträge, Suchorte und Reihenfolge (POSIX und Windows), kein Wert in Fehlermeldungen |
| `test_timeconv.py` | Winter- und Sommerzeit, fehlende und doppelte Ortszeit am Wechsel (Europe/Athens, 2026), Millisekunden |
| `test_service.py` | jede Art, Zeitzone mit Sommerzeitwechsel im Frühjahr und im Herbst (auch bei Beginn mitten in der doppelten Stunde), Grenzen, Aufteilung in Abrufe ohne Lücke und Überlappung, ausgelassene Zeilen, Zuordnungstabelle, Handelszeiten, `period`, Pip und Spread, Margin, Name des Brokers, jeder Fehlergrund des Dienstes |
| `test_service_clock_change.py` | Wechsel der Uhr mit einem Paket, das aus wahren UTC-Zeitpunkten Serverzeiten macht: Ticks und Kerzen, Athen im Herbst und im Frühjahr, Lord Howe, New York, Zeitzone ohne Sommerzeit, Beginn und Ende vor, an und nach dem Wechsel, viele Schnittlängen; Fenster der Abrufe; Grenze der Abrufe (1970 bis 2100 ohne einen Abruf abgewiesen) |
| `test_service_clock_change_hourly.py` | Kerzen M1, M30, H1, H4, D1 beim Zurückstellen der Uhr (Athen, London, New York, Lord Howe), jede Schnittlänge; die drei Fälle des Berichts (Athen H1) mit Prüfung der ausgelassenen Zeilen nach Grund, Zahl und Serverzeit; gleiche Serverzeit außerhalb der doppelten Stunde bleibt `duplicate_time`; Ticks mit gleicher Serverzeit; Ticks im dünnen Markt (Rest-Risiko, Abschnitt 7) |
| `test_mt5_gateway.py` | Übersetzung zum Paket gegen eine Nachbildung des Moduls: Verbindung, Wiederverbindung, Trennen, Fehlercodes, Zeiten als Serverzeit, Ende ausgeschlossen, Tickflags, Margin; kein Import des Pakets beim Laden |
| `test_repository.py` | Beispiel der INI, `MetaTrader5` nur als Extra für Windows, `pipwerk-marketdata` nur für Tests, **kein Webframework und kein Server** in `pyproject.toml`, `uv.lock` und im Quelltext, keine HTTP-Schnittstelle in Komponente, `contracts/` und diesem Dokument, Skripte für Windows, kein Kennwort und keine Angaben des Entwicklungsrechners in den Dateien |

### Prüfskript

`components/pipwerk-fetch-mt5/scripts/check [--with-audit]` führt die automatischen Prüfungen der Komponente aus: `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check` und `mypy`; mit `--with-audit` zusätzlich als sechste Prüfung `pip-audit` für die gesperrten Pakete (Zugriff auf das Internet nötig). Es hat sonst keine Parameter, braucht `uv` und das Paket `MetaTrader5` nicht. Aufruf mit dem Pfad des Skripts aus beliebigem Verzeichnis, zum Beispiel `<Arbeitsverzeichnis>/components/pipwerk-fetch-mt5/scripts/check`; das Arbeitsverzeichnis ergibt sich aus dem Pfad des Skripts. Jede Prüfung läuft, auch wenn eine vorige scheitert; der Exit-Code ist nur 0, wenn alle bestehen (1 bei einer gescheiterten Prüfung, 2 bei falschem Aufruf).

## 14. Entscheidungen

Fest gelegt vom Entwickler, soweit die Spezifikation es offenlässt (Auftrag 13):

1. Aufbau flach, ohne Unterverzeichnis `backend/`.
2. Die Dateien sind genau die des Imports (`contracts/market-data/v1/`); `models.py` schreibt sie aus, damit das Programm von keiner anderen Komponente abhängt. Die Hinweise auf ausgelassene Zeilen haben in der Datei keinen Platz (das Schema lehnt zusätzliche Felder ab) und stehen in der Ausgabe.
3. Aufruf: Instrumente als Argumente, `--from`/`--to` Pflicht, `-u` für Zeiteinheiten (Komma oder wiederholt, groß oder klein), `--ticks`, `-o` (Voreinstellung aktuelles Verzeichnis, wird angelegt), `-c`. Zeitpunkte ISO 8601, ohne Zone UTC, ohne Sekundenbruchteile.
4. Dateiname wie Spezifikation 5.4; Zeitpunkte `JJJJMMTT` bei Mitternacht UTC, sonst `JJJJMMTTTHHMMSS`; Bezeichnung nur `[A-Za-z0-9][A-Za-z0-9._#+-]{0,63}`, sonst Exitcode 2 vor jedem Zugriff. Der Name der Angaben zum Instrument trägt den Zeitraum des Aufrufs, wie die Spezifikation es verlangt.
5. Exitcodes: 0 alles geschrieben, 1 mindestens ein Teil fehlt, 2 ungültiger Aufruf oder ungültige Startkonfiguration. Ein ungültiger Aufruf ist kein „Teil“: Er bricht vor dem ersten Zugriff ab, damit nie eine Mischung aus Dateien eines fehlerhaften Aufrufs entsteht.
6. Der Broker ist immer der Name des Handelsservers (Spezifikation 5.1); die frühere Einstellung `name` entfällt.
7. Ist MetaTrader 5 nicht erreichbar, werden die übrigen Teile nicht erneut versucht, sondern mit demselben Grund genannt (Abschnitt 3).
8. Begrenzungen: `max_rows_per_file` 200000 (so, dass eine Datei die Grenzen des Imports einhält), `max_reads_per_file` 500; Schritte von 10000 Kerzen und 6 Stunden; die Ausgabe nennt die Serverzeit der ersten fünf ausgelassenen Zeilen je Datei. Die Namen der Einträge ändern sich gegenüber der Schnittstelle (`…_per_request` wurde `…_per_file`).
9. `volume` einer Kerze ist das Tickvolumen. `pip` und `spread` wie in Abschnitt 4; Margin vom Terminal berechnet.
10. Die Zeitzone ist Pflicht; ohne sie läuft das Programm nicht. Es gibt keine Voreinstellung, weil eine falsche Zeitzone die Daten still verschiebt.
11. Ausgabe an den Anwender (Dateien, Fehler mit Grund, Zusammenfassung) deutsch, Hilfetext und Meldungen zu Aufruf und Startkonfiguration englisch wie bisher.
12. Windows-Skript `scripts/fetch.cmd` ersetzt `scripts/start.cmd`; `scripts/install.cmd` bleibt unverändert.
13. Die Nachbildung für Tests ist eine Nachbildung des Pakets `MetaTrader5` (`tests/support.py`) und liegt nur in den Tests; `fake_source.py` entfällt. Andere Komponenten, die `fake_source` verwendeten (pipwerk replay), brauchen es nicht mehr (Auftrag 12).

## 15. Offene Punkte

1. **Doppelte Stunde.** Nach der Regel „doppelte Ortszeit gilt als die frühere“ fehlt die zweite Stunde beim Zurückstellen der Uhr (einmal im Jahr, Abschnitt 7); die erste Stunde kommt vollständig an. Genauer wäre, die zweite Stunde an der Reihenfolge zu erkennen und als die spätere zu rechnen. Das ist eine Änderung der Festlegung in 5.1; sie braucht eine Entscheidung.
2. **Handelszeiten** liefert das Paket nicht (Abschnitt 8). Die Ersatzregel des Datenbestands (Wochenende Freitag 22:00 bis Sonntag 22:00 UTC) gilt dann; bei Brokern mit anderer Schließzeit entstehen Lücken, die keine sind (`pipwerk-marketdata.md`, Grenzen der Ersatzregel).
3. **Fehlende Angaben im Schema.** Das Schema der Angaben zum Instrument hat keine Felder für die Art des Swaps (`swap_mode`: Punkte, Währung, Prozent, …) und für die Währung der Margin. Die Werte `swap_long` und `swap_short` sind deshalb in der Einheit des Brokers und ohne ihre Art nicht sicher zu deuten. Das Programm kennt beide Angaben (`SymbolInfo`) und schreibt sie nicht.
4. **Leere Reihe.** Ein Zeitraum ohne Zeile ist `no_data`. Das Schema erlaubt eine leere Reihe mit `period`; dann würde zum Beispiel ein Feiertag nicht als fehlend gelten. Wegen Spezifikation 5.4 (Fehler „Daten beim Broker nicht vorhanden“) ist es ein Fehler.
5. **Serverzeit des Pakets.** Dass das Paket die Serverzeit als Sekunden „wie UTC“ liefert und annimmt (Abschnitt 7), ist aus der Dokumentation und dem bekannten Verhalten abgeleitet, nicht an einem echten MetaTrader 5 geprüft. Ebenso die Fehlercodes (Abschnitt 9) und `swap_rollover3days` (0 ist Sonntag). Prüfung in der Abnahme: eine Kerze M1 mit bekannter Serverzeit holen.
6. **Abhängigkeiten** (Abschnitt 12): `pip-audit` lief ohne Fund (`check --with-audit`). Lizenz und Wartungszustand von `MetaTrader5` sind ungeprüft.
7. **Echtes MetaTrader 5.** Aufruf, Name des Handelsservers (`account_info().server`), Fehlercodes und Zeitzone sind nur gegen die Nachbildung geprüft; der Auftraggeber prüft sie in der Abnahme.
8. **Windows.** Das Skript `fetch.cmd` und das atomare Umbenennen unter Windows sind auf dem Entwicklungsrechner (Linux) nicht ausgeführt; `Path.replace` ersetzt unter Windows eine bestehende Datei, scheitert aber, wenn eine andere Anwendung sie geöffnet hält (dann `write_failed`).
9. Erledigt: pipwerk replay (Backend in Auftrag 12, Oberfläche und Anwenderdokumentation in Auftrag 14) und das Glossar verweisen nicht mehr auf die frühere Schnittstelle.
