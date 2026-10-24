# pipwerk-fetch-mt5 – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-24
- komponente: `pipwerk-fetch-mt5`
- vorhaben: `backtest`, Arbeitspaket `wp02`, Auftrag 13 (Spezifikation: E5, 5.1, 5.4, 10, 11, 12; Abnahmebericht M4; req-system-027); in Auftrag 14 nur Abschnitte 12, 13 und 15 (Prüfskript und Abhängigkeiten) nachgeführt
- vorhaben: `relay`, Arbeitspaket `wp01`, Auftrag 05 (Spezifikation relay: 3.5, 3.7, 6, 7, 8 „Abruf“; Abschnitte 16 bis 18 neu, Abschnitte 1, 2, 3, 5, 9, 10, 11, 12, 13, 14 und 15 ergänzt)

## 1. Gegenstand

`pipwerk-fetch-mt5` ist die Quelle für historische Kursdaten aus MetaTrader 5 (req-system-027). Es ist ein Programm, das der Anwender auf dem Rechner von MetaTrader 5 an der Befehlszeile aufruft. Es liest dort mit dem Python-Paket `MetaTrader5` Kerzen, Ticks und die Angaben zu Instrumenten und schreibt sie als Dateien im JSON-Format des Imports (`contracts/market-data/v1/`) in ein Verzeichnis. Der Anwender importiert die Dateien in den Datenbestand von pipwerk replay.

Der Aufruf an der Befehlszeile (Abschnitte 3 bis 11) ist ein eigenständiger Weg ohne pipwerk relay (Spezifikation backtest 5.4): Er hat keinen Server, öffnet keinen Port, hat keine Anmeldung und keine Schnittstelle im Netz, und seine Module laden die Bibliothek von pipwerk relay nicht. pipwerk replay stößt ihn nicht an und beschafft nichts selbst (Abnahmebericht `wp02`, M4).

Mit pipwerk relay (Spezifikation relay 6) hat das Programm zwei weitere Befehle (Abschnitt 16): `serve` läuft auf dem Rechner von MetaTrader 5, nimmt Anfragen über das Relay dieses Rechners entgegen und beantwortet sie; `request` läuft auf einem beliebigen Rechner, schickt eine Anfrage und schreibt die gelieferten Dateien. Auch dann öffnet das Programm keinen Port: Es verbindet sich nur über den Übertragungsweg, den `[relay]` nennt.

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
| `src/pipwerk_fetch_mt5/relay/` | die Befehle `serve` und `request` (Abschnitt 16): `commands.py` (Befehlszeile), `serve.py`, `request.py`, `connection.py` (Anschluss aus `[relay]`, ein Verweis auf `pipwerk_relaycore.connection`), `contents.py` (Inhalte der Nachrichtenarten), `schemas.py` (Erzeugen der Schemas) |

Fachlogik liegt in `service.py` und `fetch.py` und kennt das Paket `MetaTrader5` nicht; `mt5_gateway.py` übersetzt nur. Das Paket wird erst beim ersten Zugriff geladen (`importlib`), nie beim Import der Module. `fetch.py` holt die Teile als Dateien im Speicher (`fetch_documents`: der Name und die Bytes jeder Datei, oder der Grund, warum es keine gibt); `fetch` schreibt sie ins Zielverzeichnis, `serve` schickt sie als Nachrichten.

Das Paket `relay` wird nur geladen, wenn das erste Argument `serve` oder `request` ist (`cli.main` importiert `relay.commands` erst dann). Der Aufruf an der Befehlszeile lädt weder `pipwerk_relaycore` noch SQLAlchemy noch Alembic noch ein Netzmodul; `tests/test_relay_isolation.py` prüft das in einem eigenen Prozess.

Ein Aufruf läuft so: `cli.py` prüft die Angaben und liest die Startkonfiguration; `fetch.parts_of` bildet aus Instrumenten, Zeiteinheiten und Ticks die Teile; `fetch.fetch` holt sie nacheinander über `FetchService` und `TerminalGateway` und schreibt jede Datei mit `files.write_file`; `cli.report` gibt das Ergebnis aus. Danach trennt `Mt5Gateway.close` die Verbindung (das Terminal läuft weiter). Der Aufruf an der Befehlszeile ist ein einziger Prozess ohne Threads und ohne Netz.

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

Steht als erstes Argument `serve` oder `request`, ist es der Befehl (Abschnitt 16), kein Instrument. Heißt ein Instrument so, steht es nicht als erstes Argument, zum Beispiel nach einer Option (`--from … --to … serve`); dann bleibt es ein Instrument.

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

Das Programm hat keine Angaben zu Port, Schlüssel eines Servers und erlaubten Hosts, weil es keinen Server hat. Eine Datei, die sie noch enthält (`[server]`, `[security]`, `name` im Abschnitt `[broker]`), wird abgewiesen: Die Datei wird streng gelesen, ein unbekannter Abschnitt oder Eintrag lässt den Aufruf scheitern, damit sich kein Tippfehler unbemerkt auswirkt. Die Adresse und die Schlüsseldatei in `[relay]` (Abschnitt 16.3) sind keine Angaben eines Servers: Sie beschreiben die Verbindung der Komponente zu ihrem Relay.

| Abschnitt | Eintrag | Bedeutung |
| --- | --- | --- |
| `[broker]` | `server_time_zone` | Pflicht für den Aufruf an der Befehlszeile und für `serve`, nicht für `request` (dieser liest MetaTrader 5 nicht). IANA-Name der Zeitzone der Serverzeit des Handelsservers (Abschnitt 7) |
| | `max_rows_per_file` | Höchstzahl der Zeilen einer Datei; Voreinstellung 200000, höchstens 5000000 |
| | `max_reads_per_file` | Höchstzahl der Abrufe von MetaTrader 5 je Datei (Abschnitt 7); Voreinstellung 500 (bei Ticks etwa 125 Tage), höchstens 100000 |
| `[metatrader5]` | `path`, `login`, `password`, `server`, `timeout_ms` | Angaben zur Verbindung; alle optional. Ohne sie hängt sich das Programm an das laufende Terminal mit dem Konto, in dem es angemeldet ist. `timeout_ms`: 1000 bis 600000, Voreinstellung 60000 |
| `[symbols]` | `<Bezeichnung> = <Symbol>` | Zuordnungstabelle (Abschnitt 6); gilt nur für den Aufruf an der Befehlszeile |
| `[relay]` | `address`, `way`, `secrets_directory`, `key_file`, `database`; wahlweise `relay_link`, `poll_interval_seconds` | Verbindung zum Relay für `serve` und `request` (Abschnitt 16.3). Der Aufruf an der Befehlszeile prüft nur die Namen der Einträge |
| `[relay.way]` | `target.<Eintrag>`, `inbox.<Eintrag>` | eigene Angaben des Wegs, unverändert durchgereicht (Abschnitt 16.3) |

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
| `request_invalid` | Die Anfrage ist ungültig | Nur bei `serve`, für die ganze Anfrage (Abschnitt 16.5): Der Inhalt von `fetch.request` entspricht nicht dem Schema oder den Regeln (zum Beispiel Zeiteinheit unbekannt, `from` nicht vor `to`, Symbol ohne Bezeichnung nicht als Dateiname zulässig). Die Anfrage ändern. |
| `broker_mismatch` | Die Anfrage nennt einen anderen Broker als den, an dem MetaTrader 5 angemeldet ist | Nur bei `serve`, für die ganze Anfrage: Der Broker der Anfrage ist nicht der Name des Handelsservers dieses MetaTrader 5. Name prüfen oder den Rechner des richtigen Brokers anfragen. |

Fehler im Aufruf oder in der Startkonfiguration (Exitcode 2) erscheinen als `pipwerk-fetch-mt5: <Text>` auf der Fehlerausgabe; der Text nennt den fehlerhaften Wert des Aufrufs (nicht der Startkonfiguration).

Zuordnung der Fehler von MetaTrader 5 (`mt5_gateway.py`, nach `last_error()` des Pakets): Fehler der Verbindung (Code −10000 und darunter) und Anmeldefehler (−6) ergeben `terminal_unavailable` und lassen das Programm beim nächsten Abruf neu verbinden; −4 (nicht gefunden) und Erfolg ohne Zeilen ergeben eine leere Liste, also `no_data`; alle anderen Fehler `broker_error`. Diese Codes stammen aus der Dokumentation des Pakets; sie sind nicht gegen ein echtes MetaTrader 5 geprüft. Das Protokoll (Fehlerausgabe, Stufe Warnung) nennt Codes und Namen von Ausnahmeklassen, nie Ausnahmetexte, Kennwort oder Anmeldung.

## 10. Einrichtung auf dem Rechner von MetaTrader 5 (Windows)

Das Paket `MetaTrader5` läuft nur unter Windows und braucht ein installiertes MetaTrader 5 auf demselben Rechner. Einmal einrichten, dann bei Bedarf aufrufen. (Dieser Abschnitt ist die Grundlage der Anwenderdokumentation `docs/user/pipwerk-replay.md`; er ist ohne Entwicklungswissen geschrieben.)

**Einmal einrichten**

1. **uv installieren.** uv ist ein kleines Programm, das Python und die nötigen Pakete holt (https://docs.astral.sh/uv/). Es verändert das Python des Systems nicht. Nach der Installation ein neues Eingabeaufforderungsfenster öffnen.
2. **Programm auf den Rechner legen.** Die Ordner `components\pipwerk-fetch-mt5` und `packages\relay-core` des Repositorys so kopieren, dass sie unter einem gemeinsamen Ordner liegen wie im Repository, zum Beispiel `C:\pipwerk\components\pipwerk-fetch-mt5` und `C:\pipwerk\packages\relay-core`. Der zweite Ordner ist die Bibliothek von pipwerk relay: `pyproject.toml` nennt sie als Pfadabhängigkeit (`../../packages/relay-core`), `install.cmd` braucht sie, auch wenn der Aufruf an der Befehlszeile sie nicht lädt.
3. **Installieren.** Im Ordner `pipwerk-fetch-mt5` `scripts\install.cmd` ausführen (Doppelklick oder in der Eingabeaufforderung). Es lädt Python 3.14 und die Pakete, mit `MetaTrader5`, in den Unterordner `.venv`. Dafür ist einmal eine Internetverbindung nötig. Danach braucht das Programm kein Netz mehr.
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

`serve` und `request` richtet Abschnitt 16.8 ein.

Auf Linux lässt sich alles bis auf den Zugriff auf MetaTrader 5 installieren und starten (Entwicklung und Tests): `uv --directory components/pipwerk-fetch-mt5 sync --frozen` und `… run pipwerk-fetch-mt5 --help`. Das Paket `MetaTrader5` kommt dabei nicht auf den Rechner (Abschnitt 12).

## 11. Sicherheit

Grundlage: Spezifikation 5.4 und 11, `development-test-security-rules.md`, OWASP.

- **Kein Server, kein Port (Spezifikation 11, req-system-027).** Das Programm bindet keinen Socket und hört nicht. Der Aufruf an der Befehlszeile verbindet sich mit nichts außer dem lokalen Terminal über das Paket `MetaTrader5`. Er hat keine Anmeldung und keinen Schlüssel, weil er nichts im Netz anbietet. Ein Test sichert zu, dass beim Aufruf kein Socket geöffnet und kein Name aufgelöst wird (`test_cli.py`, Fixture `no_sockets` für jeden Aufruf), ein anderer, dass kein Modul des Programms ein Webframework, einen Server, `socket`, `http`, `asyncio` oder `ssl` importiert, und dass weder `pyproject.toml` noch `uv.lock` ein Webframework oder einen Server nennen (`test_repository.py`). Dass der Aufruf an der Befehlszeile die Bibliothek von pipwerk relay, SQLAlchemy, Alembic und die Netzmodule nicht lädt, prüft `test_relay_isolation.py` in einem eigenen Prozess. `serve` und `request` bauen auch keine Verbindung ins Netz auf, außer über den Übertragungsweg aus `[relay]` (Abschnitt 17).
- **Nur lesen.** Das Programm ruft keine Funktion des Pakets auf, die handelt (`order_send` und andere). Es berechnet die Margin mit `order_calc_margin`, das nichts auslöst. Es schreibt nur in das Zielverzeichnis.
- **Dateinamen (Spezifikation 11).** Der Name einer Datei entsteht nur aus geprüften Teilen (Abschnitt 4): Eine Bezeichnung mit Trennzeichen eines Pfads, `..` am Anfang, Leerzeichen, Steuerzeichen oder anderen Zeichen außer `A-Z a-z 0-9 . _ # + -` wird vor jeder Verbindung abgewiesen. Das Symbol des Brokers aus der Zuordnungstabelle (kann beliebige Zeichen enthalten) geht nur an MetaTrader 5. `write_file` lehnt zusätzlich jeden Namen ab, der ein Pfad ist. Tests: `test_files.py` und `test_cli.py` (auch ein Symbol `../../evil` in der Tabelle).
- **Schreiben.** Atomar (Abschnitt 4); die Datei wird mit den Rechten des Benutzers angelegt. Eine bestehende Datei gleichen Namens wird ersetzt; ein Verzeichnis dieses Namens wird nicht angetastet (`write_failed`).
- **Kennwort.** Anmeldedaten für MetaTrader 5 stehen nur in der Startkonfiguration (optional, Klartext; die Datei so schützen, dass nur der Benutzer sie liest) und werden nicht protokolliert und nicht in Fehlermeldungen genannt. Ausnahmetexte werden nicht ausgegeben; das Protokoll nennt den Namen der Ausnahmeklasse oder den Code von MetaTrader 5.
- **Grenzen.** `max_rows_per_file` und `max_reads_per_file` begrenzen Zeilen und Abrufe je Datei; ein Zeitraum von Jahrzehnten mit Ticks löst nicht Hunderttausende Abrufe aus (Abschnitt 7).
- **Abhängigkeiten.** Siehe Abschnitt 12.

## 12. Abhängigkeiten

Alle direkten und indirekten Abhängigkeiten stehen in `uv.lock`. Laufzeit: `pipwerk-relaycore` (Pfadabhängigkeit `packages/relay-core`, Version 0.1.0 festgeschrieben; mit Auftrag 05; die Bibliothek von pipwerk relay für `serve` und `request`; sie bringt `sqlalchemy` 2.1.5, `alembic` 1.20.0 und deren Pakete mit, deren Lizenz, Pflege, Sicherheit und Kopplung `pipwerk-relay.md` Abschnitt 14 prüft), `pydantic` (genau die Version, die `pipwerk-marketdata` festlegt, damit die Dateien dieselbe Prüfung durchlaufen) und `tzdata` (nötig, weil Windows keine Zeitzonendatenbank hat, aus der `zoneinfo` lesen könnte). Das Öffnen des Anschlusses fängt Fehler von SQLAlchemy beim Öffnen der Datenbank selbst ab; das tut `pipwerk_relaycore.connection` (Abschnitt 16.2), dieses Programm nennt SQLAlchemy nicht. Optional, nur Windows: `MetaTrader5` (Extra `mt5`, Markierung `sys_platform == 'win32'`), das `numpy` mitbringt. Entwicklung und Tests: `pytest`, `ruff`, `mypy`, `jsonschema` und `types-jsonschema` (prüft die Dateien gegen die Schemata des Imports), `pipwerk-marketdata` (Pfadabhängigkeit `packages/market-data`, nur für Tests: die geschriebenen Dateien werden mit der Bibliothek importiert) und `sqlalchemy` (für die Datenbank dieser Tests).

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

Die Tests (pytest, 1748 Fälle, davon 1708 bestanden; 40 überspringen sich selbst, Lord Howe mit H1 in der Tabelle der Einheiten, abgedeckt durch einen eigenen Test; davon sind 166 Fälle mit Auftrag 05 neu, die vier Dateien `test_relay_*.py`). Das Paket `MetaTrader5` ist in allen Tests eine Nachbildung (`tests/support.py`):

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
| `test_relay_abruf.py` | **der Abruf über pipwerk relay** (Abschnitt 16), gegen die Nachbildung von `MetaTrader5` und die Schritte, die ein Relay nachbilden (`relay_support.py`): gültige Anfrage mit denselben Bytes der Dateien wie der Aufruf an der Befehlszeile und Import mit `pipwerk_marketdata`; Bezeichnung und Symbol, Tabelle `[symbols]` unbeachtet; Broker fremd; ungültige Anfrage in 16 Abwandlungen und mit jeweils fehlendem Feld; Teile mit Grund (gleiche Fehlerausgabe wie der Aufruf an der Befehlszeile), Symbol unbekannt, MetaTrader 5 nicht erreichbar; zwei Anfragen nacheinander; keine Nachricht mit `receipt`; Wartezeit, `relay.undeliverable`, Anfrage nicht übergeben; das Ergebnis vor der letzten Datei, eine Datei zweimal, fremde Antwort, ungültige Datei-Nachricht, Fehler beim Schreiben; hartes Ende von `serve` vor jeder der vier Nachrichten; Weg zum Relay nicht erreichbar; `serve` als Programm in einem Thread mit Beenden |
| `test_relay_config.py` | `[relay]` und `[relay.way]` lesen, jede Ablehnung, `request` ohne Zeitzone, das Beispiel, Start von `serve` und `request` mit ungültigen Angaben (Exitcode 2, nichts gesendet, kein Wert in Meldungen), Hilfetexte, Instrument mit dem Namen eines Befehls |
| `test_relay_contents.py` | Modelle und Schemas der drei Nachrichtenarten: Schemadateien gleich dem Erzeugten, Beispiele gültig und ungültig für Schema und Modell gleich beurteilt, Regeln des Modells, Namen und Gründe gleich denen des Programms |
| `test_relay_isolation.py` | der Aufruf an der Befehlszeile lädt `pipwerk_relaycore`, SQLAlchemy, Alembic und die Netzmodule nicht (eigener Prozess), kein Import der Bibliothek auf Modulebene (`config.py` lädt sie erst in `_relay`), die Abhängigkeit mit festgeschriebener Version, `request` ohne `Mt5Gateway` |
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

Fest gelegt vom Entwickler, soweit die Spezifikation relay es offenlässt (Auftrag 05):

14. Befehle `serve` und `request` als erstes Argument; der Aufruf an der Befehlszeile bleibt ohne Befehl (Abschnitt 3). Das Paket `relay` wird erst geladen, wenn ein Befehl aufgerufen wird.
15. `[relay.way]` hat Einträge mit dem Vorwort `target.` und `inbox.` (Abschnitt 16.3), weil Ziel und Eingang eigene Angaben brauchen und die Spezifikation einen Abschnitt nennt.
16. Die Bezeichnung der Dateien, die Nachrichtenart `fetch.request` und die Namen der Felder: Abschnitt 16.4 (`data` für die Art der Datei, `error` für den Grund der ganzen Anfrage). Zeiteinheiten in der Nachricht in Großbuchstaben, wie in den Namen der Dateien.
17. Jede Datei ist die einzige Anlage einer Nachricht `fetch.file`; die Nachricht nennt die Zahl der Zeilen und die ausgelassenen Zeilen mit ihrer vollständigen Zahl nach Grund (`FetchService` zählt sie dafür nach Grund; die Namen der ersten fünf Serverzeiten, die der Aufruf an der Befehlszeile ausgibt, stehen nicht in der Nachricht).
18. Zwei neue Gründe: `request_invalid` und `broker_mismatch` (Abschnitt 9), nur für die ganze Anfrage.
19. `serve` beantwortet eine Anfrage in `store` von vorn bis zum Ende; eine Unterbrechung heißt Wiederholung der ganzen Antwort, die Dateien erkennt `request` am Namen (Abschnitt 16.7). Die Alternative, eine Anfrage in der Datenbank zu verwalten und die gesendeten Dateien zu merken, wurde nicht gewählt: Sie brauchte eine zweite Datenbank neben der des Anschlusses und kann dieselbe Doppelzustellung bei einem Ende zwischen Senden und Vermerken nicht ausschließen.
20. Die Abfrage des Eingangs alle 2 Sekunden (einstellbar, 1 bis 3600) und die Wartezeit von 30 Minuten (Spezifikation 6.3).
21. Der Aufruf von `request` legt das Zielverzeichnis erst an, wenn Angaben, Startkonfiguration, Schlüssel und Weg gültig sind.

Fest gelegt vom Entwickler (Auftrag 04, Prüfkomponente von pipwerk relay):

22. Das Lesen von `[relay]` und `[relay.way]` (Vorworte `target.` und `inbox.`) und das Öffnen des Anschlusses liegen in `pipwerk_relaycore.connection`, damit die Prüfkomponente dasselbe Format verwendet und nichts doppelt steht. Die Fehlertexte, die Namen der Einträge und das Verhalten bleiben; `RelaySettings` heißt jetzt `ConnectionSettings`, `RelayStartError` ist `ConnectionSettingsError`. Die Bibliothek ändert nur durch Ergänzung (neues Modul), ihre bisherige Schnittstelle bleibt.

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
10. **Abruf über pipwerk relay nur gegen Nachbildungen** (Auftrag 05). `serve` und `request` sind mit der Nachbildung von `MetaTrader5` und mit Schritten geprüft, die ein Relay nachbilden (`tests/relay_support.py`). Das echte Relay (Auftrag 03) und die Durchgänge über zwei Relays (Auftrag 06) sind nicht Teil dieses Auftrags. Unter Windows sind `serve` und `request` nicht ausgeführt; die Bibliothek prüft dort die Zugriffsrechte der Schlüsseldatei über Zugriffslisten (`pipwerk-relay.md` Abschnitt 6), auch das ist auf dem Entwicklungsrechner nicht ausgeführt.
11. **Wer anfragt, wird nicht geprüft.** `serve` beantwortet jede Anfrage, die das Relay zustellt. Wer an das Relay senden darf, bestimmt das Relay über die Schlüssel der Verbindungen (Spezifikation relay E5). Eine Liste erlaubter Absender hat `serve` nicht, weil weder die Anforderungen noch die Spezifikation sie verlangen.
12. **Eine Anfrage je Adresse zur selben Zeit.** Zwei `request` mit derselben Adresse und derselben Datenbank lesen denselben Eingang; jeder verwirft die Antworten, die nicht zu seiner Anfrage gehören (Abschnitt 16.6). Zwei Anfragen gleichzeitig brauchen zwei Adressen.
13. **Alembic ist nicht für mehrere Anschlüsse in einem Prozess gleichzeitig ausgelegt.** Zwei Anschlüsse, die im selben Prozess in verschiedenen Threads zugleich ihre Datenbank migrieren, können einander stören (der Test von `serve` öffnet sie deshalb nacheinander). Im Betrieb läuft jeder Anschluss in einem eigenen Prozess; die Beobachtung geht als Hinweis an die Bibliothek (`packages/relay-core`), die dieser Auftrag nicht ändert.

## 16. Abruf über pipwerk relay (`serve` und `request`)

Grundlage: Spezifikation relay 3.5, 3.7, 6 und 7, E4. Der Abruf ist eine laufende Komponente von pipwerk relay mit der Adresse `<Name>.<Netz>.<Relay>` (Spezifikation 3.1). Er sendet und empfängt Nachrichten über den `Connector` der Bibliothek `pipwerk_relaycore` (`pipwerk-relay.md` Abschnitt 11): Die Bibliothek prüft Prüfwert, Verbindung, Empfänger, Anlagen und Schema der bekannten Arten, verwirft Wiederholungen und quittiert; die Komponente speichert. Das Relay selbst ist nicht Teil dieses Abschnitts.

### 16.1 Aufruf

```
pipwerk-fetch-mt5 serve [-c <PATH>]

pipwerk-fetch-mt5 request [-c <PATH>] --address <ADRESSE> --broker <BROKER> [--instrument <BEZEICHNUNG>]
                          --from <VON> --to <BIS> [-u <ZEITEINHEITEN>] [--ticks]
                          [-o <VERZEICHNIS>] [--wait <MINUTEN>] <SYMBOL>
```

| Angabe von `request` | Bedeutung |
| --- | --- |
| `<SYMBOL>` | das Symbol beim Broker, wie MetaTrader 5 es kennt (1 bis 64 Zeichen ohne Steuerzeichen) |
| `--address` | Adresse des laufenden `serve` (Pflicht) |
| `--broker` | Name des Handelsservers, an dem MetaTrader 5 angemeldet ist (Pflicht). Er muss mit dem Namen übereinstimmen, den `serve` aus MetaTrader 5 liest |
| `--instrument` | Bezeichnung für die Dateien (Abschnitt 4); ohne Angabe das Symbol. Hat das Symbol Zeichen, die in einem Dateinamen nicht zulässig sind, ist die Angabe Pflicht |
| `--from`, `--to`, `-u`, `--ticks`, `-o`, `-c` | wie beim Aufruf an der Befehlszeile (Abschnitt 3); die Zeitpunkte werden als UTC in die Anfrage geschrieben, ganze Sekunden |
| `--wait` | Wartezeit in Minuten, Voreinstellung 30; mindestens 1 |

Exitcodes von `request` wie beim Aufruf an der Befehlszeile: 0 alle Dateien geschrieben; 1 ein Teil ließ sich nicht holen (die übrigen Dateien sind geschrieben), die Anfrage wurde abgelehnt, ließ sich nicht übergeben oder nicht zustellen, die Wartezeit ist abgelaufen oder eine Nachricht war ungültig; 2 ungültiger Aufruf oder ungültige Startkonfiguration (nichts gesendet). `serve` endet mit 0, wenn es beendet wird (Strg+C oder ein Beendigungssignal), mit 2 bei ungültiger Startkonfiguration. Wie beim Aufruf an der Befehlszeile prüft jeder Befehl zuerst alle Angaben, Startkonfiguration, Schlüssel und Weg, und endet mit 2, ohne etwas zu senden oder das Zielverzeichnis anzulegen. Der Hilfetext ist englisch.

### 16.2 Der Anschluss

Das Lesen von `[relay]` und `[relay.way]` und das Öffnen des Anschlusses sind für jede Komponente von pipwerk relay gleich und liegen deshalb in der Bibliothek (`pipwerk_relaycore.connection`, `pipwerk-relay.md` Abschnitt 11.1; Auftrag 04): `read_connection_settings` liest die beiden Abschnitte, `open_connector` öffnet den Anschluss. Die Prüfkomponente von pipwerk relay verwendet dasselbe Format. `relay/connection.py` verweist nur auf diese Teile (`RelayStartError` ist `ConnectionSettingsError`). Das Öffnen baut aus `[relay]` die `ConnectorConfig`: die Adresse (`Address.parse`), den Schlüssel (`SecretsDirectory.load_key`, mit Prüfung der Rechte des Verzeichnisses und der Datei), den Weg mit den Angaben für Ziel und Eingang (`WayConfig`), die Datenbank des Anschlusses (das Verzeichnis wird angelegt, die Datenbank migriert). Jeder Fehler (ungültige Adresse, fehlende oder zu offene Schlüsseldatei, unbekannter Weg, Angabe des Wegs, die er nicht kennt, nicht öffenbare Datenbank) ist ein `RelayStartError`; sein Text nennt den Eintrag oder die Datei, nie einen Wert und nie den Schlüssel, und der Befehl endet mit 2. Die Fristen des Anschlusses (Wiederholungen 7 Tage, Schonfrist für Anlagen 5 Minuten) haben die Voreinstellungen der Bibliothek; keine Nachricht des Abrufs verlangt eine Bestätigung (Abschnitt 16.4), die Frist auf eine Bestätigung kommt nicht ins Spiel.

### 16.3 Startkonfiguration

Zusätzlich zu Abschnitt 5, wenn `serve` oder `request` läuft:

| Abschnitt | Eintrag | Bedeutung |
| --- | --- | --- |
| `[relay]` | `address` | Pflicht. Eigene Adresse `<Komponente>.<Netz>.<Relay>`. Der Name der Komponente und das Netz sind Namen des Betreibers (Spezifikation 3.1) |
| | `way` | Pflicht. Name des Übertragungswegs (Einstiegspunkt der Gruppe `pipwerk_relay.ways`), in `wp01` `files` |
| | `secrets_directory` | Pflicht. Verzeichnis für Geheimnisse; nur der eigene Benutzer darf es erreichen (Linux 700 und 600, Windows Zugriffsliste), sonst startet der Befehl nicht |
| | `key_file` | Pflicht. Name der Datei mit dem Schlüssel der Verbindung mit dem Relay im Verzeichnis für Geheimnisse |
| | `database` | Pflicht. Pfad der SQLite-Datei des Anschlusses (gesehene Nachrichten-IDs und wartende Bestätigungen, `pipwerk-relay.md` Abschnitt 13); auf einem Laufwerk dieses Rechners, nicht auf einem Netzlaufwerk |
| | `relay_link` | wahlweise. Name der Relay-Seite der Verbindung `<Netz>.<Relay>`; ohne Angabe das Relay der Adresse |
| | `poll_interval_seconds` | wahlweise, 1 bis 3600, Voreinstellung 2. Abstand, in dem der Eingang gelesen wird |
| `[relay.way]` | `target.<Eintrag>` | die eigenen Angaben des Wegs für das Ziel (wo das Relay liest, was diese Komponente sendet), ohne das Vorwort durchgereicht |
| | `inbox.<Eintrag>` | die eigenen Angaben des Wegs für den Eingang (wo das Relay ablegt, was für diese Komponente bestimmt ist) |

`[relay.way]` ist von der Abweisung unbekannter Einträge ausgenommen (Spezifikation 3.4): Die Komponente prüft nur das Vorwort `target.` oder `inbox.` und reicht den Rest unverändert weiter. Der Weg prüft sie streng mit seinem eigenen Modell (beim Weg `files`: `directory`, `max_envelope_bytes`, `max_attachment_bytes`) und nennt einen Fehler mit dem Eintrag, nie mit dem Wert. Entscheidung des Entwicklers: Ziel und Eingang brauchen verschiedene Angaben (zwei Verzeichnisse), die Spezifikation nennt aber einen Abschnitt `[relay.way]`; das Vorwort ergibt aus einem Abschnitt beide Blöcke. `[relay.file_way]` gehört nicht zu `wp01` und wird wie jeder unbekannte Abschnitt abgewiesen.

`load_relay_settings` (für `request`) und `load_startup_config` (Aufruf an der Befehlszeile und `serve`) lesen dieselbe Datei und prüfen dieselben Namen. `load_relay_settings` gibt die `ConnectionSettings` der Bibliothek zurück; `config.py` lädt die Bibliothek erst dort (in `_relay`, nicht auf Modulebene), damit der Aufruf an der Befehlszeile sie nicht lädt. Die Namen der Einträge von `[relay]`, die der Aufruf an der Befehlszeile ohne die Bibliothek prüft, stehen deshalb in `config.py` ein zweites Mal; `tests/test_relay_config.py` prüft, dass sie die der Bibliothek sind (`RELAY_OPTIONS`). `serve` ruft beide auf. `request` verlangt `[relay]` und nicht `server_time_zone`; ist sie angegeben, prüft es sie wie überall. Ohne `[relay]` endet `serve`/`request` mit 2. Der Aufruf an der Befehlszeile liest die Werte von `[relay]` nicht und prüft nur die Namen der Einträge.

### 16.4 Nachrichtenarten

Spezifikation relay 6.2. Jeder Inhalt ist ein JSON-Objekt, geprüft mit einem strengen Modell (`relay/contents.py`, zusätzliche Felder werden abgelehnt); die Schemas unter `contracts/messages/v1/` (`fetch.request.schema.json`, `fetch.file.schema.json`, `fetch.result.schema.json`) werden aus den Modellen erzeugt (`python -m pipwerk_fetch_mt5.relay.schemas <Verzeichnis>`, mit `--check` Vergleich; `tests/test_relay_contents.py` prüft, dass die Dateien genau das Erzeugte sind), Beispiele liegen unter `examples/` (`content-fetch-*.json`, ungültige unter `examples/invalid/`). Zeitpunkte sind UTC mit ganzen Sekunden und `Z` (`2026-01-05T00:00:00Z`), Jahre 1970 bis 2100 wie beim Aufruf an der Befehlszeile.

| Art | Feld | Inhalt |
| --- | --- | --- |
| `fetch.request` | `broker` | Name des Handelsservers (1 bis 128 Zeichen, keine Steuerzeichen, kein Leerzeichen am Rand) |
| | `symbol` | Symbol beim Broker (1 bis 64 Zeichen, keine Steuerzeichen) |
| | `instrument` | wahlweise. Bezeichnung für die Dateien (Abschnitt 4); ohne Angabe gilt das Symbol, das dann ebenfalls die Regeln der Bezeichnung erfüllen muss |
| | `time_units` | Liste der Zeiteinheiten in Großbuchstaben (`M1` … `MN1`), ohne Wiederholung, leer möglich |
| | `ticks` | ja oder nein |
| | `from`, `to` | Zeitraum, `from` eingeschlossen, `to` ausgeschlossen, `from` vor `to` |
| `fetch.file` | `name` | Name der Datei nach Abschnitt 4; zugleich der Name der einen Anlage der Nachricht |
| | `data` | Art: Zeiteinheit, `TICKS` oder `CONTRACT`; muss zum Namen passen |
| | `rows` | Zahl der Zeilen; fehlt bei `CONTRACT` |
| | `omitted` | ausgelassene Zeilen nach Grund (`time_does_not_exist`, `double_local_time`, `duplicate_time`, `invalid_price`) mit ihrer vollständigen Zahl |
| `fetch.result` | `files` | die Namen aller Dateien, die gesendet wurden |
| | `failed` | je Teil, der sich nicht holen ließ: `data`, `from`, `to`, `code` und `text` (Kennung und fester Text nach Abschnitt 9) |
| | `error` | wahlweise. Wurde die Anfrage als Ganzes nicht ausgeführt: `code` (`request_invalid`, `broker_mismatch`, `terminal_unavailable`, `broker_unknown`, `internal_error`) und `text`; dann sind `files` und `failed` leer |

Entscheidung des Entwicklers: Ein Fehler der ganzen Anfrage steht im Feld `error`, nicht in `failed`, weil er zu keinem Teil gehört. Die Datei ist die Anlage der Nachricht `fetch.file`; die Bibliothek prüft Größe und SHA-256 (`pipwerk-relay.md` Abschnitt 5). Alle Antworten gehen an den Absender der Anfrage, mit deren Nachrichten-ID als Bezug-Nachrichten-ID, Priorität `normal`. Keine Art setzt `receipt`: Die Antwort ist die Bestätigung (Spezifikation 3.7).

### 16.5 `serve`

`serve` liest den Eingang im Abstand von `poll_interval_seconds` (`serve_forever`, bis der Befehl beendet wird; ein Beendigungssignal beendet die Wartezeit sofort). Eine Nachricht der Art `fetch.request` beantwortet `RequestHandler.store`:

1. Der Inhalt wird geprüft (`FetchRequestContent`). Ist er ungültig, ist die Antwort ein einziges `fetch.result` mit `error.code` = `request_invalid`. MetaTrader 5 wird dafür nicht gelesen.
2. Der Broker der Anfrage muss gleich dem Namen des Handelsservers sein, an dem MetaTrader 5 angemeldet ist (`FetchService.broker_name`, Abschnitt 4). Sonst ist die Antwort ein einziges `fetch.result` mit `broker_mismatch`; kein Symbol wird gewählt und keine Zeile gelesen. Ist der Name nicht bestimmbar oder MetaTrader 5 nicht erreichbar, ist der Grund `broker_unknown` beziehungsweise `terminal_unavailable`.
3. Sonst werden die Teile geholt wie beim Aufruf an der Befehlszeile, in derselben Reihenfolge und mit denselben Grenzen (`fetch_documents`; die Angaben zum Instrument immer). Die Bezeichnung der Dateien ist `instrument` der Anfrage, sonst das Symbol; das Symbol geht unverändert an MetaTrader 5. Die Tabelle `[symbols]` der Startkonfiguration gilt nicht (Spezifikation 6.2): `serve` setzt für die Anfrage eine Tabelle mit nur diesem einen Eintrag ein. Jede Datei, sobald sie fertig ist, geht als eine Nachricht `fetch.file` mit der Datei als Anlage an den Absender.
4. Zum Schluss geht ein `fetch.result` mit den Namen aller gesendeten Dateien und allen Teilen, die sich nicht holen ließen. Eine Datei, die für den Weg zum Relay zu groß ist (`WayTooLargeError`), zählt als Teil mit `range_too_large`; der Anfragende teilt den Zeitraum auf. Verweigert der Weg eine Datei aus anderem Grund (`WayRefusedError`), ist der Grund `internal_error`. Beides wird nicht wiederholt.

Anfragen werden nacheinander bearbeitet: `Connector.poll` ruft `store` für eine Nachricht nach der anderen, und MetaTrader 5 wird über eine Verbindung gelesen. Eine Nachricht anderer Art wird im Protokoll vermerkt und verworfen; eine `relay.undeliverable`-Meldung zu einer Antwort erscheint als Zeile in der Ausgabe und im Protokoll. Die Ausgabe nennt je Anfrage eine Zeile (`Anfrage von <Adresse> beantwortet: n Dateien gesendet, m Teile nicht geholt.` oder `… abgelehnt: <Grund>.`).

### 16.6 `request`

`request` prüft die Angaben und baut den Inhalt (dieselben Regeln wie `serve`: `FetchRequestContent.of`), liest `[relay]`, legt das Zielverzeichnis an und öffnet den Anschluss; dann sendet es die Anfrage und liest den Eingang im Abstand von `poll_interval_seconds`, bis die Antwort vollständig ist oder die Wartezeit abläuft (`run_request`):

- Jede `fetch.file`, die zur Anfrage gehört (Bezug auf ihre ID, Absender die Adresse des Abrufs), wird mit `write_file` (Abschnitt 4) ins Zielverzeichnis geschrieben; je Datei eine Zeile `Geschrieben: <Datei> (<Art>, <n> Zeilen[, <m> Zeilen ausgelassen])` und darunter je Grund `ausgelassen (<n>x): <Text>` wie beim Aufruf an der Befehlszeile (ohne die Serverzeiten der ersten fünf, die die Nachricht nicht trägt).
- Eine Datei, deren Name für diese Anfrage schon geschrieben ist, wird nicht noch einmal geschrieben (Abschnitt 16.7).
- `fetch.result` beendet die Antwort. Es kann vor der letzten Datei eintreffen, weil die Nachrichten eigene Wege nehmen; `request` wartet auf jede Datei, die das Ergebnis nennt. Dann folgen auf der Fehlerausgabe eine Zeile `Fehler: <Bezeichnung>, <Art>, <Zeitraum>: <Grund>` je Teil, der sich nicht holen ließ, und die Zusammenfassung (`<n> von <m> Dateien geschrieben, <k> Teile nicht geholt (Exitcode 1).` beziehungsweise `<n> Dateien geschrieben nach <Verzeichnis>.`), also dieselben Zeilen wie beim Aufruf an der Befehlszeile. Ein `error` im Ergebnis erscheint als `Fehler: Die Anfrage wurde nicht ausgeführt: <Text>` mit Exitcode 1.
- `relay.undeliverable` mit Bezug auf die Anfrage (Absender ein Relay, Name `relay`) beendet den Befehl mit `Fehler: Die Anfrage ließ sich nicht zustellen: <Text> (<Kennung>).` und Exitcode 1 (req-relay-008). Vorher geschriebene Dateien bleiben.
- Kommt innerhalb der Wartezeit kein Ergebnis, endet der Befehl mit `Fehler: Nach <n> Minuten ist kein Ergebnis der Anfrage eingetroffen.` und Exitcode 1; fehlen nach dem Ergebnis noch Dateien, mit `Fehler: Nach <n> Minuten fehlen noch Dateien des Ergebnisses: <Namen>.`
- Ließ sich die Anfrage nicht an das Relay übergeben (der Weg meldet einen Fehler, zum Beispiel ein nicht erreichbares Verzeichnis), meldet der Befehl das und endet mit Exitcode 1; es wartet nichts.
- Eine Nachricht, die nicht zu dieser Anfrage gehört (anderer Bezug, anderer Absender als der Abruf), wird verworfen und im Protokoll vermerkt: Im Eingang einer Adresse können späte Antworten einer früheren Anfrage liegen. Eine ungültige `fetch.file` (Schema, Name der Anlage ungleich `name`, keine oder mehrere Anlagen) wird nicht geschrieben, zählt als Fehler und ergibt Exitcode 1; sie bleibt nicht im Eingang liegen.
- Scheitert das Schreiben einer Datei (`write_failed`), bleibt die Nachricht im Eingang und wird beim nächsten Lesen noch einmal versucht, bis die Wartezeit abläuft.

`request` braucht weder MetaTrader 5 noch das Paket `MetaTrader5` und baut keinen `Mt5Gateway` auf (`test_relay_isolation.py`). Es läuft unter Windows und Linux. Der Befehl kennt Strg+C: Er meldet `Abgebrochen.` und endet mit Exitcode 1; die gesendete Anfrage bleibt beim Abruf, dessen Antwort wird beim nächsten Lauf verworfen.

### 16.7 Unterbrechung und Wiederholung (Spezifikation E4, Abschnitt 8 Störung 3)

Der Anschluss vermerkt eine Anfrage erst als gesehen und quittiert sie erst, wenn `store` zurückgekehrt ist. `store` kehrt erst zurück, nachdem das `fetch.result` übergeben ist. Daraus folgt:

- **Hartes Ende von `serve` während einer Lieferung** (Prozess beendet, Strom weg): Die Anfrage liegt noch im Eingang und ist nicht als gesehen vermerkt. Nach dem Neustart beantwortet `serve` sie von vorn. Es fehlt nichts. Dateien, die schon gesendet waren, kommen noch einmal, als neue Nachrichten mit denselben Namen und demselben Inhalt; die Bibliothek erkennt sie nicht als Wiederholung, weil jede Nachricht eine neue ID hat. `request` schreibt eine Datei mit einem Namen, den es für diese Anfrage schon geschrieben hat, deshalb nicht noch einmal: jede Datei wird einmal geschrieben, jede Ausgabezeile erscheint einmal.
- **Hartes Ende des Relays:** Das Relay behält die Nachrichten bis zur Bestätigung des nächsten Wegs (Spezifikation E4). Kommt eine Nachricht doppelt an, verwirft die Bibliothek des Empfängers sie an der Nachrichten-ID.
- **Weg zum Relay nicht erreichbar, während `serve` antwortet** (Störung 2): `send` meldet `WayUnavailableError`, `store` löst die Ausnahme aus, die Anfrage bleibt im Eingang und wird beim nächsten Lesen von vorn beantwortet; die Datei- und Ergebnisnachrichten, die schon übergeben waren, kommen noch einmal, wie oben. `serve` läuft weiter und vermerkt den Fehler im Protokoll.

Getestet in `tests/test_relay_abruf.py`: Beendigung vor der Übergabe jeder der vier Nachrichten (`Crash` ist eine `BaseException`, die kein `except Exception` fängt), Neustart auf derselben Datenbank, danach sind alle drei Dateien da, `request` hat jede einmal geschrieben, und der Eingang von `serve` ist leer; ein nicht erreichbares Verzeichnis vor der Antwort.

### 16.8 Einrichtung

`serve` auf dem Rechner von MetaTrader 5, nach Abschnitt 10 und mit der Datei `pipwerk-fetch-mt5.ini` ergänzt um `[relay]` und `[relay.way]` (Beispiel in `pipwerk-fetch-mt5.example.ini`): `scripts\fetch.cmd serve`. Das Relay des Rechners muss laufen und die Verbindung mit der Komponente kennen (Schlüssel, Eingang und Ziel; `pipwerk-relay.md`). `request` auf dem anfragenden Rechner mit derselben Installation (ohne `MetaTrader5` genügt `uv sync --frozen`; `install.cmd` installiert unter Windows das Paket mit, es wird nicht verwendet): `scripts\fetch.cmd request …`. Die Anwenderdokumentation steht in `docs/user/pipwerk-relay.md`, Abschnitt „Abruf mit serve und request“.

## 17. Sicherheit des Abrufs über pipwerk relay

Grundlage: Spezifikation relay 7, `development-test-security-rules.md`, `pipwerk-relay.md` Abschnitt 14 (Teile der Bibliothek).

| Anforderung | Umsetzung | Test |
| --- | --- | --- |
| Eingaben an der Grenze prüfen (Regel 8.2 Nr. 2; ASVS V5) | Inhalt jeder Art: strenges Pydantic-Modell, zusätzliche Felder abgelehnt, feste Muster für Broker, Symbol, Bezeichnung, Dateiname, Zeitpunkt; höchstens 21 Zeiteinheiten, 64 Dateien; `serve` prüft die Anfrage vor jedem Zugriff auf MetaTrader 5 | `test_relay_contents.py`, `test_relay_abruf.py` |
| Dateinamen nur aus geprüften Teilen (Regel 8.3 Nr. 5; ASVS V12) | `request` schreibt nur Namen, die dem Muster `<Bezeichnung>_<Art>_<von>_<bis>.json` entsprechen, gleich dem Namen der einen Anlage sind und zur Art passen; `write_file` lehnt zusätzlich jeden Namen ab, der ein Pfad ist; das Zielverzeichnis wird nie aus einer Nachricht bestimmt | `test_relay_abruf.py` (`test_an_invalid_file_message_…`), `test_files.py` |
| Fälschung, Wiederholung, Größe der Anlagen | durch die Bibliothek vor der Übergabe an die Komponente (Prüfwert je Verbindung, SHA-256 der Anlage, Nachrichten-ID) | `packages/relay-core/tests/` |
| Wer antwortet | `request` nimmt nur Nachrichten an, die auf seine Anfrage verweisen und vom Abruf stammen (Meldungen der Art `relay.undeliverable` von einem Relay); alles andere wird verworfen | `test_relay_abruf.py` |
| Geheimnisse (Regel 8.2 Nr. 1; ASVS V2.10) | Schlüssel nur als Datei im Verzeichnis für Geheimnisse, Rechte geprüft vor dem Lesen; Fehlertexte nennen Eintrag oder Datei, nie Wert oder Schlüssel; `[relay.way]`-Werte erscheinen in keiner Meldung | `test_relay_config.py` |
| Kein Port, Netzzugriffe begrenzen (Regel 8.2 Nr. 7) | `serve` und `request` öffnen keinen Socket und lösen keinen Namen auf; sie sprechen nur über den Weg `files` (Verzeichnis) | `test_relay_abruf.py` (Fixture `no_sockets`) |
| Aufruf an der Befehlszeile unverändert | lädt weder die Bibliothek noch ein Netzmodul | `test_relay_isolation.py` |
| Protokollierung ohne Inhalt (Regel 8.3 Nr. 4; ASVS V7) | Zeilen mit Nachrichten-ID, Art, Absender, Zahlen; nie Inhalt der Anfrage, Dateien, Schlüssel; Ausnahmen nur mit dem Namen der Klasse | Durchsicht |
| Nur lesen | `serve` ruft dieselben Funktionen von MetaTrader 5 auf wie der Aufruf an der Befehlszeile; keine, die handelt | `test_mt5_gateway.py` |
| Begrenzung von Ressourcen (OWASP API4) | Zahl der Teile je Anfrage höchstens 23 (21 Zeiteinheiten, Ticks, Angaben zum Instrument), Zeilen und Abrufe je Datei wie beim Aufruf an der Befehlszeile, Größe von Umschlag und Anlage durch den Weg | `test_relay_abruf.py`, `test_service.py` |

Grenzen: `serve` beantwortet jede Anfrage, die das Relay zustellt (Abschnitt 15, Punkt 11). Der Schutz von Absender zu Empfänger über alle Relays gehört nicht zum Umfang (Spezifikation E5). Die Zugriffsrechte der Schlüsseldatei sind unter Windows nicht ausgeführt.

Abhängigkeiten (Regel 12): neu ist `pipwerk-relaycore` (eigenes Paket des Repositorys, GPL-3.0). Es bringt SQLAlchemy 2.1.5, Alembic 1.20.0, Mako und MarkupSafe mit; Lizenz, Wartungszustand, Sicherheit und Kopplung prüft `pipwerk-relay.md` Abschnitt 14. `pip-audit` (`scripts/check --with-audit`) deckt sie über `uv.lock` ab.

## 18. Prüfung dieses Teils

Die Tests von `serve` und `request` sind in Abschnitt 13 aufgeführt. Sie bilden das Relay mit `tests/relay_support.py` nach (`Network`: Verzeichnisse und Schlüssel der beiden Komponenten, zwei Schritte, die ein Relay nachbilden, und ein Verzeichnis zwischen den Relays; `ServeSide`: `serve` ohne seine Schleife, damit der Test bestimmt, wann etwas geschieht; `pump_hooks`: jede Pause von `request` ist eine Runde von Relay, Abruf und Relay, die Uhr ist nachgebildet). Eine Ausnahme ist der Test von `serve` als Programm: Er startet `main(["serve", …])` in einem Thread, bewegt die Umschläge mit einem eigenen Thread und beendet `serve` mit einem Ereignis. Die Ende-zu-Ende-Tests über zwei echte Relays folgen mit Auftrag 06.
