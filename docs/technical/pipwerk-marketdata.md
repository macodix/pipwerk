# Bibliothek `pipwerk_marketdata` – technische Dokumentation

## Status

- status: `draft`
- stand: 2026-10-24
- komponente: `packages/market-data` (Python-Paket `pipwerk_marketdata`)
- grundlage: [Spezifikation backtest](../../development/backtest/specification.md), E4 und Abschnitte 5.1 bis 5.3, 5.5, 8.3 (Zeile „Datenbestand“), 10 (Datenbestand), 11; Abnahmebericht `wp02` M1, M3, M4, M5, M6; Anforderungen req-system-025 und req-system-026 in `docs/design/requirements/anforderungen-gesamtsystem.md`

## 1. Gegenstand

Die Bibliothek ist der Datenbestand historischer Kursdaten von pipwerk. Sie speichert Kerzen, Ticks und Angaben zum Instrument in einer Datenbank, importiert Dateien (JSON und CSV), prüft die Vollständigkeit, löscht auf Verlangen Daten und liefert die Daten zum Lesen.

Sie berechnet keine Kerzen aus Ticks und keine Ticks aus Kerzen (req-system-025). Sie kennt weder pipwerk replay noch eine Beschaffung. Die Beschaffung liefert Dateien im JSON-Format des Imports; woher die Daten stammen, ist für die Bibliothek ohne Bedeutung.

Abhängigkeiten: SQLAlchemy (Speicherung), Alembic (Migrationen), Pydantic (Prüfung der JSON-Dateien), `tzdata` (Zeitzonen, damit die Umrechnung nicht vom Rechner abhängt). Die Bibliothek hängt nicht von `pipwerk_domain` ab.

## 2. Aufbau

| Modul | Aufgabe |
|---|---|
| `store` | `MarketDataStore`: Import schreiben (Datei und Vorgang), Lesen, Liste der Reihen, Einzelheiten, Broker, Vollständigkeit |
| `jsonimport`, `csvimport` | Datei lesen und Zeilen prüfen, ohne die Datenbank zu berühren |
| `filehints` | Instrument und Daten aus dem Dateinamen, Broker, Instrument und Daten aus dem Inhalt einer JSON-Datei, ohne Import |
| `parsed`, `filetext` | gemeinsame Prüfungen, Zeitordnung, Entschlüsseln der Datei, Broker eines Vorgangs |
| `documents` | die JSON-Formate als Pydantic-Modelle und ihre JSON-Schemas |
| `completeness` | Zeiten ohne Handel, Lücken und Fehlendes nach 5.2 als reine Funktionen |
| `deletion` | Löschen nach 5.5 in der Transaktion, die `MarketDataStore` öffnet (Abschnitt 8.1) |
| `tables`, `migrate`, `migrations/` | Tabellen und Alembic-Migrationen |
| `records`, `limits`, `errors`, `timeunits` | Wertobjekte, Begrenzungen, Fehler, Zeiteinheiten |

Die Bibliothek erhält die Datenbank als SQLAlchemy-`Engine` vom Aufrufer. Sie öffnet nie selbst eine Datenbank. Der Aufrufer ruft zuerst `migrate_database(engine)` auf und übergibt die Engine dann an `MarketDataStore(engine)`. pipwerk replay bindet die Bibliothek als Pfadabhängigkeit mit festgeschriebener Version ein (Spezifikation E4).

Öffentliche Schnittstelle (`MarketDataStore`):

| Aufruf | Ergebnis |
|---|---|
| `import_json(daten, grenzen)` | `ImportResult` |
| `import_csv(daten, kind, broker, instrument, timezone, time_unit, grenzen)` | `ImportResult` |
| `import_files(dateien, broker, timezone, limits)` | `ImportBatchResult` (Abschnitt 4.5) |
| `read_candles(broker, instrument, unit, start, end, limit, after)` | `CandlePage` |
| `read_ticks(broker, instrument, start, end, limit, after)` | `TickPage` |
| `instrument_info(broker, instrument, as_of)` | `InstrumentInfo` oder `None` |
| `trading_hours(broker, instrument, unit)` | Liste von `TradingSession` |
| `completeness(broker, instrument, unit, start, end)` | `Completeness` |
| `list_series(broker, instrument, data, offset, limit)` | `SeriesRowPage` (Abschnitt 8) |
| `series_details(broker, instrument, data)` | `SeriesDetails` oder `None` (Abschnitt 8) |
| `brokers()` | Broker des Datenbestands, sortiert (Abschnitt 8) |
| `overview()` | `Overview` (bleibt vorerst, Abschnitt 8) |
| `plan_delete_series(broker, instrument, data)`, `delete_series(…)` | `Deletion`: was eine ganze Reihe löscht, und das Löschen (Abschnitt 8.1) |
| `plan_delete_period(broker, instrument, data, start, end)`, `delete_period(…)` | `Deletion` für einen Zeitraum einer Reihe |
| `plan_delete_contract(broker, instrument)`, `delete_contract(…)` | `Deletion` für die Angaben zu einem Instrument |
| `plan_delete_broker(broker)`, `delete_broker(…)` | `Deletion` für alle Daten eines Brokers |

Freie Funktionen, die keine Datenbank brauchen:

| Aufruf | Ergebnis |
|---|---|
| `recognize_filename(name)` | `NameHints` mit Instrument und Daten (Abschnitt 5.3) |
| `inspect_json(daten, grenzen)` | `FileHints` mit Broker, Instrument und Daten (Abschnitt 5.4) |
| `migrate_database(engine)` | Schema auf den neuesten Stand (Abschnitt 9) |

Alle Zeitpunkte, die die Bibliothek annimmt und liefert, sind Zeitpunkte mit Zeitzone (`datetime` mit `tzinfo`) und werden als UTC behandelt. Ein Zeitpunkt ohne Zeitzone ist ein `ValueError`.

## 3. Speichermodell

Alle Tabellen beginnen mit `marketdata_`. Die Bibliothek darf deshalb in einer Datenbank neben Tabellen des Aufrufers laufen (Abschnitt 9).

| Tabelle | Inhalt |
|---|---|
| `marketdata_series` | eine Reihe: Broker, Instrument, Einheit (`m1` bis `mn1` oder `ticks`), eindeutig |
| `marketdata_candle` | Kerzen: Reihe, Eröffnungszeitpunkt (UTC), Eröffnung, Hoch, Tief, Schluss, Volumen, Spread in Punkten (leer, wenn nicht geliefert) |
| `marketdata_tick` | Ticks: Reihe, Zeitpunkt (UTC, bis Mikrosekunden gespeichert), Geld, Brief |
| `marketdata_coverage` | je Reihe die abgedeckten Zeiträume (von einschließlich, bis ausschließlich) |
| `marketdata_session` | je Reihe die gelieferten Handelszeiten (Wochentag, Beginn und Ende in Minuten, UTC) |
| `marketdata_instrument` | Angaben zum Instrument je Broker mit dem Zeitpunkt der Beschaffung |

Festlegungen:

- Zeitpunkte liegen als UTC ohne Zeitzone in der Datenbank; die Bibliothek setzt UTC beim Lesen wieder auf.
- Kurse sind Geldkurse (Bid) wie von MetaTrader 5 geliefert, gespeichert als Gleitkommazahl doppelter Genauigkeit. Der Brief einer Kerze ergibt sich aus dem Spread (Spezifikation 4.1) und wird hier nicht berechnet.
- Das Volumen ist das Tick-Volumen der Kerze. Das Handelsvolumen (`<VOL>`) wird nur gelesen, wenn die CSV-Datei keine Spalte für das Tick-Volumen hat.
- Die Datenbank prüft zusätzlich: Kurse größer als null, Beziehungen zwischen Eröffnung, Hoch, Tief und Schluss, Beginn vor Ende bei Zeiträumen und Handelszeiten.
- Der Primärschlüssel von Kerze und Tick ist Reihe und Zeitpunkt. Das Ersetzen desselben Zeitpunkts (5.3) löscht den vorhandenen Eintrag und fügt den neuen ein, in derselben Transaktion.
- Angaben zum Instrument liegen je Broker, Instrument und Zeitpunkt der Beschaffung. `instrument_info` liefert die jüngsten Angaben, bei `as_of` die jüngsten, die nicht nach diesem Zeitpunkt beschafft wurden. Felder: Kontraktgröße, Währung des Tickwerts, Tickgröße, Tickwert, Punkt, Pip, Spread (als Kursdifferenz), Mindestvolumen, Volumenschritt, Swap long und short je Lot und Tag, Wochentag des dreifachen Swaps, Margin-Anforderung je Lot (leer, wenn nicht geliefert). Die Bezeichnung des Instruments ist sein Name in der Reihe.
- Abgedeckte Zeiträume (Tabelle `marketdata_coverage`, je Reihe, die Grundlage der Lücken, Abschnitt 7) sind je importierter Datei:
  - JSON mit `period`: der Zeitraum, den die Datei nennt,
  - JSON ohne `period`: vom ersten Zeitpunkt bis zum Ende der letzten Kerze beziehungsweise bis eine Millisekunde nach dem letzten Tick,
  - CSV: vom Beginn des Tages des ersten Eintrags bis zum Ende des Tages des letzten Eintrags, Tage in der beim Import angegebenen Zeitzone (Abschnitt 6). Das Ende der letzten Kerze zählt: Eine Kerze, die über das Ende ihres Eröffnungstages hinausreicht (Wochen- und Monatskerzen), verlängert den Zeitraum. Gibt es den Beginn des Tages in der Zeitzone nicht (die Uhr springt über Mitternacht), gilt der erste Zeitpunkt des Tages; kommt Mitternacht zweimal vor, der frühere.

  Ein Import fügt seinen Zeitraum hinzu; sich berührende oder überlappende Zeiträume werden zu einem zusammengefasst. Löschen eines Zeitraums nimmt ihn heraus (Abschnitt 8.1). Das Speichermodell hält die abgedeckten Zeiträume damit schon seit der ersten Fassung; für den Auftrag 15 änderte sich nur ihr Inhalt für CSV und die Daten früherer Importe (Migration `0002`, Abschnitt 9).
- Handelszeiten ersetzt jede Datei, die welche liefert, für ihre Reihe vollständig. Eine Datei ohne Handelszeiten lässt sie unverändert, eine leere Liste löscht sie.

## 4. Import

### 4.1 Ablauf

1. Prüfung von Größe und Zeichenkodierung der Datei.
2. JSON: Prüfung des Kopfes der Datei als Ganzes, dann jeder Eintrag für sich. CSV: Prüfung der Kopfzeile, dann jeder Zeile für sich.
3. Zeilen mit Fehler werden abgelehnt und mit Zeilennummer und Grund im Ergebnis genannt. Die übrigen Zeilen werden in einer Transaktion übernommen.
4. Ein Fehler der Datenbank macht nichts sichtbar. Die Bibliothek meldet `MarketDataStoreError` mit fester Meldung, die den Fehler der Datenbank als Ursache trägt.

Die Datei wird nie ausgeführt. JSON liest die Standardbibliothek in einfache Daten (`NaN` und `Infinity` sind abgelehnt), Pydantic prüft sie mit Ablehnung zusätzlicher Felder und ohne Umwandlung von Werten (ein Text ist keine Zahl). CSV liest das Modul `csv`; Zahlen und Zeitangaben prüft ein festes Muster.

`ImportResult`: übernommene Zeilen (`accepted`), davon ersetzte (`replaced`), Zeitraum (`period_start` und `period_end`: Zeitpunkt der ersten und der letzten übernommenen Zeile), abgelehnte Zeilen (`rejected`: Zeilennummer und Grund) und ihre Anzahl (`rejected_count`). Die Zeilennummer ist bei CSV die Zeile der Datei (die Kopfzeile ist Zeile 1), bei JSON die Stelle des Eintrags in der Liste ab 1.

### 4.2 Gründe für abgelehnte Zeilen

Geprüft wird in dieser Reihenfolge: Spalten, Zeitpunkt, Felder, Kurse, Beziehungen der Kerze, Zeitordnung. Der erste Fehler gilt.

| Grund (`RejectReason`) | Fall |
|---|---|
| `columns_mismatch` | CSV: Zeile hat weniger Spalten als die Kopfzeile verlangt |
| `entry_invalid` | JSON: Eintrag ist kein Objekt |
| `field_unknown` | JSON: zusätzliches Feld im Eintrag |
| `field_missing` | Pflichtfeld fehlt, bei CSV ist die Zelle leer (zum Beispiel Geld oder Brief eines Ticks) |
| `value_invalid` | Wert ist keine Zahl, keine ganze Zahl, nicht endlich, Volumen oder Spread negativ oder größer als 2 147 483 647 (Abschnitt 4.4), falscher Typ |
| `time_invalid` | Zeitpunkt entspricht dem Muster nicht oder ist kein wirkliches Datum und keine wirkliche Uhrzeit |
| `time_out_of_range` | Zeitpunkt liegt vor 1970-01-01T00:00:00Z oder ab 2100-01-01T00:00:00Z (Abschnitt 4.4); bei CSV zählt der Zeitpunkt nach der Umrechnung nach UTC |
| `local_time_not_existing` | CSV: die Ortszeit gibt es beim Wechsel der Sommerzeit nicht (Uhr vorgestellt) |
| `price_not_positive` | ein Kurs ist null oder kleiner |
| `high_below_open` | Hoch kleiner als Eröffnung |
| `high_below_low` | Hoch kleiner als Tief |
| `high_below_close` | Hoch kleiner als Schluss |
| `low_above_open` | Tief größer als Eröffnung |
| `low_above_close` | Tief größer als Schluss |
| `time_duplicate` | Zeitpunkt gleich dem der letzten übernommenen Zeile |
| `time_not_ascending` | Zeitpunkt vor dem der letzten übernommenen Zeile |

Die Beziehungen der Kerze folgen der Spezifikation 5.3 (Hoch ≥ Eröffnung, Schluss ≥ Tief). Die Bibliothek prüft zusätzlich Hoch ≥ Tief, Hoch ≥ Schluss und Tief ≤ Eröffnung, weil eine Kerze, die dagegen verstößt, in sich widersprüchlich ist und den Weg des Kurses innerhalb der Kerze (Spezifikation 4.1) unbestimmt macht.

### 4.3 Gründe für eine abgelehnte Datei

Die Bibliothek meldet `ImportFileError` mit `code` (`FileErrorCode`) und fester Meldung. Es wird nichts verändert.

| Code | Fall |
|---|---|
| `too_large` | Datei größer als die Begrenzung |
| `too_many_rows` | mehr Zeilen oder Einträge als die Begrenzung |
| `not_decodable` | Datei ist kein UTF-8- oder UTF-16-Text, oder enthält ein Nullzeichen |
| `json_invalid` | kein gültiges JSON |
| `document_invalid` | JSON entspricht dem Schema nicht (Kopf, zusätzliche Felder, Typen, Handelszeiten), oder die CSV-Datei ist nicht lesbar |
| `header_invalid` | CSV: Kopfzeile ohne Trennzeichen, mit doppelter oder fehlender Spalte |
| `series_invalid` | Broker, Instrument oder Zeiteinheit unzulässig (leer, länger als 128 Zeichen, Steuerzeichen, Leerzeichen am Anfang oder Ende, unbekannte Zeiteinheit) |
| `timezone_unknown` | CSV: Zeitzone ist kein IANA-Name |
| `period_invalid` | JSON: Zeitraum endet nicht nach seinem Beginn, liegt nicht zwischen 1970-01-01T00:00:00Z und 2100-01-01T00:00:00Z (Abschnitt 4.4) oder enthält nicht alle Einträge |
| `no_rows` | die Datei enthält keine Zeile und keinen Zeitraum |
| `store_failed` | nur im Vorgang (Abschnitt 4.5): die Datenbank hat die Datei nicht angenommen; die Transaktion dieser Datei wurde zurückgerollt |

### 4.4 Begrenzungen gegen Überlast

`ImportLimits` begrenzt eine einzelne Datei. Standardwerte gelten, wenn der Aufrufer keine übergibt:

| Parameter | Standardwert |
|---|---|
| `max_bytes` | 33 554 432 (32 MiB) |
| `max_rows` | 500 000 Zeilen oder Einträge, abgelehnte eingeschlossen |
| `max_reported_rejections` | 1000 aufgelistete abgelehnte Zeilen; `rejected_count` zählt alle |

Für die Zahl der Dateien und die Gesamtgröße eines Vorgangs gibt es keine Grenze (Spezifikation 5.3, Abnahmebericht `wp02`, Versuch 2, M3). Eine Datei über der Grenze wird mit `too_large` beziehungsweise `too_many_rows` abgelehnt; die Meldung nennt die Grenze in der Einheit des Anwenders: `The file is larger than the limit of 32 MiB per file.` (Funktion `format_size`: Bytes, KiB, MiB oder GiB, höchstens eine Nachkommastelle) und `The file has more rows than the limit of 500000 rows per file.` (bei JSON `entries`). Die übrigen Dateien des Vorgangs sind davon nicht berührt.

Obergrenze für Zahlen: `volume` und `spread` einer Kerze sind ganze Zahlen von 0 bis 2 147 483 647 (2^31 − 1, Konstante `MAX_INTEGER_VALUE` in `limits`), in JSON und in CSV gleich. Ein größerer Wert macht die Zeile zu einer abgelehnten Zeile (`value_invalid`). Grund: Die Spalte `spread` der Datenbank ist eine 32-Bit-Zahl; die Grenze sorgt dafür, dass jeder übernommene Wert in jeder Datenbank in die Spalte passt und nie eine Ausnahme beim Speichern entsteht. Das Schema nennt sie als `maximum`. Kurse und die Zahlen der Angaben zum Instrument sind Gleitkommazahlen: Nicht endliche Werte lehnt die Prüfung ab, jeder endliche Wert passt in die Spalte (geprüft bis 1,7 · 10^308) und braucht keine Obergrenze.

Obergrenze und Untergrenze für Zeitpunkte: Zeitpunkte von Kerzen, Ticks und Angaben zum Instrument liegen ab 1970-01-01T00:00:00Z (`MIN_MOMENT` in `limits`, einschließlich) bis vor 2100-01-01T00:00:00Z (`MAX_MOMENT`, ausschließlich); ein Zeitraum (`period`) darf bis `MAX_MOMENT` reichen. In JSON und in CSV gilt dasselbe. Eine Kerze oder ein Tick außerhalb ist eine abgelehnte Zeile (`time_out_of_range`), die Folgezeilen bleiben erhalten. Ein Zeitraum außerhalb ist `period_invalid`, `acquired_at` außerhalb ist `document_invalid`. Bei CSV zählt der Zeitpunkt nach der Umrechnung nach UTC; eine Ortszeit mehr als einen Tag außerhalb der Grenzen wird vor der Umrechnung abgelehnt, damit die Umrechnung selbst nicht überläuft. Das Schema nennt die Grenzen in der Beschreibung der Zeitpunkte; das Muster erlaubt jedes vierstellige Jahr, die Prüfung der Grenzen gehört zum Import. Grund: Die Untergrenze ist der Beginn der Zeitzählung von MetaTrader 5 (Sekunden seit 1970); keine Quelle liefert frühere Zeiten. Die Obergrenze liegt weit über jeder Kursreihe. Beides stellt sicher, dass das Addieren der Dauer einer Zeiteinheit oder einer Millisekunde zu einem übernommenen Zeitpunkt nie den Bereich von `datetime` verlässt (Jahr 9999) und nie `OverflowError` entsteht. Das Ende einer Kerze, das hinter `MAX_MOMENT` läge, wird für abgedeckten Zeitraum und Zeitraumprüfung auf `MAX_MOMENT` begrenzt. `completeness` verlangt einen Zeitraum innerhalb der Grenzen (`ValueError` sonst), weil die Handelszeiten tageweise berechnet werden. Das Lesen (`read_candles`, `read_ticks`, `instrument_info`) rechnet nicht mit den Zeitpunkten und nimmt jeden Zeitpunkt mit Zeitzone an; ein Zeitpunkt, der nach der Umrechnung nach UTC außerhalb des Bereichs von `datetime` läge, gilt als dessen nächste Grenze und trifft keine Zeile.

Grund der Begrenzungen von `ImportLimits`: Die Datei wird vollständig im Speicher geprüft, bevor die Transaktion beginnt; deshalb ist die einzelne Datei begrenzt und nicht der Vorgang, denn die Dateien eines Vorgangs liegen nie gleichzeitig im Speicher. 500 000 Zeilen decken ein Jahr M1-Kerzen ab. Tickdaten sind viel umfangreicher; die Beschaffung teilt sie in mehrere Dateien (Zeiträume), jede mit eigener Begrenzung. Größere Dateien braucht ein anderes Speichermodell (Abnahmebericht `wp02`, Versuch 2, M4, zurückgestellt). Zusätzlich begrenzt `max_page_size` (Standard 10 000) die Zahl der Kerzen oder Ticks je Leseaufruf.

### 4.5 Vorgang mit mehreren Dateien

`import_files(dateien, broker=None, timezone=None, limits=None)` importiert die Dateien eines Vorgangs (Spezifikation 5.3). Eine Datei ist ein `ImportFile`: `name`, `content` (Bytes), `format` (`FileFormat.JSON` oder `FileFormat.CSV`) und für CSV `instrument` und `data`. `data` ist eine Zeiteinheit (`m1` bis `mn1`) oder `ticks`; Angaben zum Instrument gibt es als CSV nicht. Bei JSON-Dateien nennt der Inhalt Instrument und Daten:
- `instrument` ist dort optional und ersetzt das Instrument des Inhalts (auch in den Angaben zum Instrument); ohne Angabe gilt der Inhalt. Ein unzulässiger Name lehnt die Datei ab (`series_invalid`).
- `data` bleibt durch den Inhalt bestimmt (Zeiteinheit, `ticks` oder `contract`). Fehlt es oder ist es gleich den Daten des Inhalts (so belegt die Oberfläche es mit `inspect_json` vor), hat es keine Wirkung. Eine andere Angabe lehnt die Datei ab (`series_invalid`, feste Meldung); es wird nichts übernommen.

- `broker` gilt für den ganzen Vorgang. Er ist der Broker aller CSV-Dateien und ersetzt bei JSON-Dateien den Broker, den die Datei nennt, auch in den Angaben zum Instrument. Ohne `broker` behält eine JSON-Datei ihren Broker und eine CSV-Datei wird abgelehnt (`series_invalid`).
- `timezone` (IANA-Name, Abschnitt 6) gilt für alle CSV-Dateien. Fehlt sie oder ist sie unbekannt, wird jede CSV-Datei abgelehnt (`timezone_unknown`); JSON-Dateien bleiben unberührt.
- Jede Datei läuft für sich: prüfen, dann in einer eigenen Transaktion übernehmen (Abschnitt 4.1). Reihenfolge wie übergeben; betrifft eine spätere Datei dieselben Zeitpunkte wie eine frühere, ersetzt sie diese (`replaced`).
- Das Ergebnis `ImportBatchResult.files` hat je Datei ein `FileOutcome` in der übergebenen Reihenfolge: `name` (nur zurückgemeldet, nie als Pfad benutzt), bei Übernahme `result` (`ImportResult` mit übernommenen Zeilen, Zeitraum, abgelehnten Zeilen mit Grund), bei ganz abgelehnter Datei `error` (`FileErrorCode`) und `message`. `FileOutcome.refused` und `accepted` fassen das zusammen. Eine abgelehnte Datei hindert die übrigen nicht, auch nicht bei einem Fehler der Datenbank (`store_failed`, feste Meldung).
- Vor dem Lesen jeder Datei prüft `import_files`, ob es Dateien gibt: keine Dateien (`no_files`) lehnt den Aufruf ab. Dann meldet die Bibliothek `ImportBatchError` mit `code` (`BatchErrorCode`) und fester Meldung, und es wird nichts gelesen oder verändert. Weitere Gründe gibt es nicht: Zahl der Dateien und Gesamtgröße sind nicht begrenzt (Abschnitt 4.4). Größe und Zeilenzahl je Datei prüft der Import der Datei (`too_large`, `too_many_rows`), als Ablehnung dieser Datei.
- pipwerk replay ruft `import_files` je Datei einzeln auf (eine Anfrage je Datei, Spezifikation 5.3); der Vorgang besteht dort zwischen den Aufrufen (`pipwerk-replay.md`).

`import_json` und `import_csv` bleiben unverändert für den Import einer einzelnen Datei.

## 5. Dateiformate

### 5.1 JSON

Schemas unter `contracts/market-data/v1/`: `candles.schema.json`, `ticks.schema.json`, `instrument.schema.json`, mit Beispielen unter `examples/` ([Beschreibung](../../contracts/market-data/README.md)). Die Schemas entstehen aus den Modellen in `documents.py` (`pipwerk-marketdata-schemas <Verzeichnis>`; `--check` vergleicht). Eine Datei enthält genau eine Reihe oder die Angaben zu genau einem Instrument; das Feld `kind` nennt es (`candles`, `ticks`, `instrument`). Der Broker jeder Datei ist bei Dateien von `pipwerk-fetch-mt5` der Name des Handelsservers von MetaTrader 5; er ist ein Pflichtfeld des Schemas und ein zulässiger Name (Abschnitt 4.3). Beim Import eines Vorgangs ersetzt der Broker des Vorgangs ihn (Abschnitt 4.5). Zeitpunkte stehen in UTC mit `Z` (`2024-01-02T10:15:00Z`, bis sechs Nachkommastellen der Sekunde). Das Feld `period` nennt den Zeitraum, den die Quelle abdeckt, auch wo sie keine Kerze oder keinen Tick liefert. Das Feld `trading_hours` nennt die wöchentlichen Handelszeiten in UTC, am Mitternachtswechsel geteilt.

### 5.2 CSV im Exportformat von MetaTrader 5

Der Aufrufer nennt `kind` (`candles` oder `ticks`), Broker, Instrument, bei Kerzen die Zeiteinheit (`m1` bis `mn1`, kleingeschrieben) und die Zeitzone, weil die Datei sie nicht enthält.

Die erste nicht leere Zeile ist die Kopfzeile. Das Trennzeichen ist das erste der Zeichen Tabulator, Semikolon, Komma, das die Kopfzeile enthält (MetaTrader 5 schreibt den Tabulator). Die Spalten werden nach dem Namen der Kopfzeile erkannt, unabhängig von Groß- und Kleinschreibung, Leerzeichen, Unterstrich und den Klammern `<` `>`. Unbekannte Spalten werden überlesen. Reihenfolge der Spalten ist beliebig. Zeilen können mehr Spalten haben als die Kopfzeile verlangt. Leere Zeilen werden überlesen. Dezimalzeichen ist der Punkt. Die Zeichenkodierung ist UTF-8 (mit oder ohne Kennung) oder UTF-16 mit Kennung.

Kerzen (Kopfzeile wie `<DATE> <TIME> <OPEN> <HIGH> <LOW> <CLOSE> <TICKVOL> <VOL> <SPREAD>`):

| Spalte | Bedeutung |
|---|---|
| `DATE` | Datum `JJJJ.MM.TT`, auch `JJJJ-MM-TT` und `JJJJ/MM/TT` |
| `TIME` | Uhrzeit `HH:MM`, `HH:MM:SS` oder `HH:MM:SS.mmm` |
| `OPEN`, `HIGH`, `LOW`, `CLOSE` | Kurse, Pflicht |
| `TICKVOL` (auch `TICK VOLUME`) | Volumen, ganze Zahl, leer erlaubt |
| `VOL` (auch `VOLUME`) | nur Volumen, wenn es keine Spalte `TICKVOL` gibt |
| `SPREAD` | Spread in Punkten, ganze Zahl, leer erlaubt |

Beide Varianten, in denen MetaTrader 5 Kerzen schreibt, sind abgedeckt:

1. Datum und Uhrzeit getrennt: Spalten `DATE` und `TIME`, zum Beispiel `2024.01.02	10:00:00`.
2. Ein Zeitfeld: eine Spalte `TIME` (oder `DATETIME`) ohne Spalte `DATE`, Wert wie `2024.01.02 10:00:00`.

Fehlt die Uhrzeit (nur `DATE`, wie bei Tageskerzen), gilt 00:00:00.

Ticks (Kopfzeile wie `<DATE> <TIME> <BID> <ASK> <LAST> <VOLUME> <FLAGS>`): Zeitpunkt wie bei Kerzen, mit Millisekunden; Pflicht sind `BID` und `ASK`, die übrigen Spalten werden überlesen. Ein Tick mit leerem Geld- oder Briefkurs ist eine abgelehnte Zeile (`field_missing`); die Bibliothek ergänzt keinen Kurs aus dem vorigen Tick.

Beleg: Das Format ist nach dem bekannten Aussehen der Exportdateien von MetaTrader 5 beschrieben (Kopfzeile mit `<...>`, Tabulator, Datum `JJJJ.MM.TT`). Eine Quelle des Herstellers oder eine echte Exportdatei lag bei der Umsetzung nicht vor. Die Spaltennamen und die beiden Varianten sind darum tolerant gelesen (siehe oben); die Tests verwenden nachgebaute Dateien. Der Auftraggeber prüft das Format in der Abnahme mit einer echten Exportdatei von MetaTrader 5 (Abschnitt 11).

### 5.3 Erkennung aus dem Dateinamen

`recognize_filename(name)` liefert zu einem Dateinamen `NameHints(instrument, data)`, soweit der Name sie enthält. `data` ist die Kennung einer Zeiteinheit (`m1` bis `mn1`), `ticks` oder `contract` (Angaben zum Instrument); das Instrument steht so da, wie es im Namen geschrieben ist. Die Funktion liest nur: sie öffnet nichts und benutzt den Namen nie als Pfad (Spezifikation 11). Gilt kein Muster, ist das Ergebnis `NameHints(None, None)`; die Oberfläche lässt dann beide Angaben leer.

Vorbereitung: Es zählt nur der Teil nach dem letzten `/` oder `\`, ohne die Endung `.json`, `.csv` oder `.txt`. Groß- und Kleinschreibung der Daten spielt keine Rolle. Das Instrument muss ein zulässiger Name sein (Abschnitt 4.3, `series_invalid`), sonst gilt der Name als nicht erkannt. Namen über 255 Zeichen werden nicht erkannt.

Muster, in dieser Reihenfolge, jeweils der ganze Name:

| Nr. | Muster | Beispiele |
|---|---|---|
| 1 | `<Instrument>_<Daten>_<von>_<bis>` mit `<von>` und `<bis>` aus Ziffern, Buchstaben und Bindestrich, beginnend mit einer Ziffer | `EURUSD_H1_202301020000_202312292300.csv` (Export von MetaTrader 5), `EURUSD_M1_20240101_20240131.json`, `GBPUSD_TICKS_20240101_20240131.json`, `XAUUSD_CONTRACT_20240101_20240131.json` (`pipwerk-fetch-mt5`) |
| 2 | `<Instrument>,<Daten>`, auch mit `_` oder einem Leerzeichen statt des Kommas | `EURUSD,H1.csv` (Export von MetaTrader 5), `EURUSD_H4.csv`, `EURUSD H12.csv` |

`<Daten>` ist eine Zeiteinheit (`M1`, `M2`, … `H1`, … `D1`, `W1`, `MN1`), `TICKS` oder `CONTRACT`. `<Instrument>` ist alles bis zum Trennzeichen vor `<Daten>`; Muster 1 nimmt das letzte Vorkommen von `_<Daten>_<von>_<bis>` am Ende, ein Instrument darf also Unterstriche und Punkte enthalten (`US500.cash`). Ein Name mit nur einem Instrument (`EURUSD.csv`) oder mit unbekannter Zeiteinheit (`EURUSD_H5_….csv`, `EURUSD,Weekly.csv`) wird nicht erkannt.

Beleg und Grenze: Die Muster stützen sich auf die Namen, die der Export von MetaTrader 5 für Kerzen schreibt (Muster 1 und 2, bekanntes Aussehen der Exportdateien) und auf die Spezifikation 5.4 für `pipwerk-fetch-mt5`. Eine Quelle des Herstellers oder echte Exportdateien lagen bei der Umsetzung nicht vor (wie Abschnitt 5.2); eine Datei mit anderem Namen ist kein Fehler, der Anwender gibt Instrument und Daten ein. Der Namensbestandteil `CONTRACT` ist bei CSV ohne Folge, weil es CSV mit Angaben zum Instrument nicht gibt: der Import lehnt eine solche Datei ab (`series_invalid`).

### 5.4 Hinweise aus dem Inhalt einer JSON-Datei

`inspect_json(daten, grenzen)` liefert `FileHints(broker, instrument, data, error)` aus den Kopffeldern einer JSON-Datei, ohne sie zu importieren; die Oberfläche belegt damit den Broker und das Instrument je Datei vor. `data` ist wie in Abschnitt 5.3 die Kennung der Zeiteinheit (`time_unit` einer Kerzenreihe), `ticks` (Ticks) oder `contract` (Angaben zum Instrument). Die Funktion prüft nur die Felder `kind`, `broker`, `instrument` und `time_unit`; die Einträge prüft erst der Import. Ein Wert, den der Import nicht annehmen würde (falscher Typ, unzulässiger Name, unbekannte Zeiteinheit), ist `None`. Lässt sich die Datei nicht lesen, sind alle Werte `None` und `error` nennt den Code, den auch der Import gäbe (`too_large`, `not_decodable`, `json_invalid`, `document_invalid`). Die Datei wird nie ausgeführt und die Funktion verändert nichts.

Die Oberfläche vergleicht die Broker der JSON-Dateien eines Vorgangs: nennen alle denselben, ist er vorbelegt (Spezifikation 5.3).

## 6. Zeitzonen

MetaTrader 5 und sein CSV-Export liefern die Serverzeit des Brokers. Der Import rechnet sie mit der Zeitzone, die der Aufrufer angibt (Name nach IANA, zum Beispiel `Europe/Athens`; der Name der Zeitzonen-Datenbank gilt, ohne Pfad), nach UTC um:

- Eine Ortszeit, die beim Wechsel der Sommerzeit doppelt vorkommt (Uhr zurückgestellt), gilt als die frühere.
- Eine Ortszeit, die es nicht gibt (Uhr vorgestellt), ist eine abgelehnte Zeile (`local_time_not_existing`).

Folge für den Export mit Sommerzeit: Beim Zurückstellen der Uhr steht die doppelte Stunde zweimal in der Datei. Die zweite Fassung wird nach der Regel als die frühere gelesen und ist dann eine abgelehnte Zeile (`time_not_ascending` für Zeitpunkte vor der letzten übernommenen Zeile, `time_duplicate` bei gleichem Zeitpunkt). Die Daten der zweiten Stunde gehen verloren, bis die Ortszeit wieder über die doppelte Stunde hinausläuft. Das ist die Folge der Regel in Spezifikation 5.1 und für den Aufrufer an den abgelehnten Zeilen sichtbar.
JSON-Dateien enthalten UTC und werden nicht umgerechnet.

## 7. Vollständigkeit

`completeness(broker, instrument, unit, start, end)` untersucht eine Reihe (`unit`: Zeiteinheit oder `ticks`) in `[start, end)`. Das Ergebnis (`Completeness`):

- `present`: die vorhandenen Teile (Zeiträume),
- `missing`: die fehlenden Teile, je mit Beginn, Ende und Grund (`not_covered`: kein Import deckt den Teil ab, und er liegt vor dem ersten oder nach dem letzten abgedeckten Zeitraum der Reihe; `gap`: Lücke zwischen zwei abgedeckten Zeiträumen der Reihe, auch um einen gelöschten Zeitraum),
- `uses_trading_hours`: ob die gelieferten Handelszeiten galten oder die Ersatzregel.

`present` und `missing` überlappen nicht und ergeben zusammen den gefragten Zeitraum. Zeiten, in denen nicht gehandelt wird, gehören zu `present`. pipwerk replay leitet „benötigt, vorhanden, fehlt“ je Teil daraus ab: benötigt ist `[start, end)`, vorhanden ist `present`, fehlt ist `missing` mit Grund.

Regeln (Spezifikation 5.2, Abnahmebericht `wp02`, Versuch 2, M6). `CompletenessRules` legt die Werte fest; es sind Standardwerte, die der Aufrufer ändern kann (`MarketDataStore(engine, rules=...)`):

| Wert | Standardwert |
|---|---|
| Wochenende ohne Handelszeiten | Freitag 22:00 bis Sonntag 22:00 UTC (`weekend_start_minute` 7080, `weekend_end_minute` 9960, in Minuten ab Montag 00:00) |
| Tage ohne Handel (`no_trading_days`) | keine; die Bibliothek hat keine Feiertagsliste. Der Aufrufer übergibt eine Liste von `CalendarDay(month, day)`, die jedes Jahr gilt; pipwerk replay übergibt die Liste seiner Startkonfiguration (vorbelegt mit 25. Dezember und 1. Januar). 29. Februar zählt nur in Schaltjahren |
| Grenze eines Tages ohne Handel (`no_trading_day_boundary_minute` 1320) | 22:00 UTC: ein Tag reicht von 22:00 UTC des Vortags bis 22:00 UTC |

1. **Abgedeckte Zeiträume.** Was ein Import für seinen Zeitraum liefert, gilt als vollständig (Abschnitt 3: Zeiträume je Datei). Innerhalb eines abgedeckten Zeitraums gibt es keine Lücke; eine Zeit ohne Kerzen oder Ticks darin ist eine Zeit, in der beim Broker nicht gehandelt wurde. Ein früher Handelsschluss am letzten Tag einer CSV-Datei ist deshalb keine Lücke.
2. **Zeit ohne Handel** ist das Wochenende, mit gelieferten Handelszeiten stattdessen jede Zeit außerhalb dieser Handelszeiten (Wochentag, Beginn und Ende in UTC), und in beiden Fällen jeder Tag ohne Handel.
3. **Lücke** (`gap`) ist die Zeit zwischen zwei abgedeckten Zeiträumen derselben Reihe, soweit sie nicht ganz in einer Zeit ohne Handel liegt. Sie reicht vom ersten bis zum letzten Handelszeitpunkt dieser Zeit; ein Wochenende oder Tag ohne Handel darin gehört zur Lücke, wenn davor und danach Handelszeit liegt. Ein gelöschter Zeitraum (Abschnitt 8.1) ist nicht mehr abgedeckt und ist deshalb innerhalb der Reihe eine Lücke, außer er fällt ganz in eine Zeit ohne Handel.
4. **Nicht abgedeckt** (`not_covered`) ist, was vor dem ersten und nach dem letzten abgedeckten Zeitraum der Reihe liegt, wieder nur, soweit zu der Zeit gehandelt wird; jedes Stück Handelszeit ist ein eigener fehlender Teil. Eine unbekannte Reihe ist ganz nicht abgedeckt.
5. **Prüfung vor dem Testlauf** (Spezifikation 5.2, letzter Punkt): Für einen Testlauf fehlt ein Teil, wenn der Testzeitraum nicht ganz in abgedeckten Zeiträumen und Zeiten ohne Handel liegt. `completeness` liefert genau das: `missing` ist leer, wenn der Testzeitraum vollständig ist. Ein Testzeitraum, der an einem Tag ohne Handel beginnt, braucht für diesen Tag keine Daten. Dieselbe Regel gilt für die Zahl der Lücken in der Liste der Reihen und für ihre Einzelheiten.

Die Regeln lesen keine Kerzen oder Ticks; sie stützen sich auf die abgedeckten Zeiträume und die Handelszeiten der Reihe.

Grenzen der Regeln (Spezifikation 5.2, Einschränkungen): Wochenende und Tage ohne Handel sind fest in UTC angesetzt; die Grenze 22:00 UTC entspricht Mitternacht eines Handelsservers mit UTC+2. Bei einem Handelsserver in anderer Zeitzone oder mit Sommerzeit kann am Rand eines solchen Zeitraums eine Lücke von bis zu einigen Stunden bleiben (der Datenbestand speichert die Zeitzone einer Reihe nicht). Fehlt in einer Datei selbst ein Zeitraum, erkennt der Datenbestand ihn nicht als Lücke. Mit gelieferten Handelszeiten entfällt das Problem am Wochenende.

## 8. Lesen

- `read_candles` und `read_ticks` liefern Einträge von `start` (einschließlich) bis `end` (ausschließlich), aufsteigend. Eine Seite hat höchstens `limit` Einträge, nie mehr als `max_page_size` (Standard 10 000; ein größerer oder nicht positiver `limit` ist ein `ValueError`). Folgen weitere Einträge, nennt `next_after` den Zeitpunkt des letzten gelieferten; er ist als `after` des nächsten Aufrufs zu übergeben. Ohne weitere Einträge ist `next_after` leer.
- `list_series(broker, instrument, data, offset, limit)` liefert die Reihen für die Ansicht „Datenbestand“ seitenweise (`SeriesRowPage`: `items` und `total`). Je Zeile (`SeriesRow`): Broker, Instrument, Daten (Kennung der Zeiteinheit, `ticks` oder `contract`), Zeitpunkt der ersten und der letzten Kerze oder des letzten Ticks (`first`, `last`; die Oberfläche zeigt den Tag) und die Anzahl der Lücken (`gap_count`).
  - Filter: je Broker, Instrument und Daten eine Teilzeichenfolge, ohne Unterscheidung von Groß- und Kleinschreibung (`str.casefold`); kein Muster, `%`, `_` und `.*` sind gewöhnlicher Text. Leer oder `None` heißt kein Filter. Daten werden gegen die Kennung verglichen (`h1`, `ticks`, `contract`).
  - Sortierung, fest und stabil: Broker, dann Instrument, jeweils alphabetisch ohne Unterscheidung von Groß- und Kleinschreibung (bei gleichem Text nach dem Text selbst), dann Daten in der Reihenfolge `m1` bis `mn1` (kurz nach lang), `ticks`, `contract`. Der erste Broker dieser Reihenfolge ist der erste Broker in alphabetischer Reihenfolge nach Spezifikation 5.1.
  - Seiten: `offset` (ab 0) und `limit` (höchstens `max_page_size`, sonst `ValueError`; ohne Angabe `max_page_size`). `total` zählt alle Zeilen, die zum Filter passen.
  - Kontraktdaten: Liegen für ein Instrument eines Brokers Angaben zum Instrument vor, aber keine Reihe, gibt es für dieses Paar eine Zeile mit Daten `contract`, ohne Zeitraum (`first`, `last` leer) und mit 0 Lücken (Spezifikation 8.3). Hat das Paar eine Reihe, gibt es keine eigene Zeile; seine Angaben zum Instrument zeigt `series_details`.
  - Lücken: `gap_count` zählt die Lücken (`gap`) über den ganzen abgedeckten Bereich der Reihe nach den Regeln aus Abschnitt 7, also die Zeiten zwischen abgedeckten Zeiträumen, die nicht ganz in eine Zeit ohne Handel fallen. Die Berechnung liest nur die abgedeckten Zeiträume der Reihen der Seite.
- `series_details(broker, instrument, data)` liefert die Einzelheiten einer Zeile (`SeriesDetails`): die Zeile selbst, alle Lücken (`gaps`, je mit Beginn, Ende und Grund `gap`; ihre Zahl ist `gap_count`) und die jüngsten Angaben zum Instrument bei diesem Broker (`contract`, `None`, wenn es keine gibt). Gibt es die Zeile in der Liste nicht, ist das Ergebnis `None`; für `contract` gibt es sie nur, wenn Angaben und keine Reihe vorliegen. Eine unbekannte Zeiteinheit ist ein `ValueError`.
- `brokers()` liefert die Broker, die im Datenbestand vorkommen (Reihen oder Angaben zum Instrument), in der Sortierung der Liste, ohne Wiederholung. Sie sind die Vorschläge für den Dialog und die Auswahl „Broker für Testläufe“ (Spezifikation 5.1).
- `overview` bleibt vorerst: pipwerk replay stützt seine Web-API noch darauf, und die Bibliothek darf nicht brechen, solange eine Komponente sie braucht. Der Auftrag 12 stellt pipwerk replay auf `list_series`, `series_details` und `brokers` um; danach entfällt `overview` (mit `Overview`, `SeriesOverview`, `InstrumentOverview`). `overview` liefert je Reihe Broker, Instrument, Einheit, Anzahl, ersten und letzten Zeitpunkt, abgedeckte Zeiträume, fehlende Teile (über den ganzen abgedeckten Bereich, nach den Regeln aus Abschnitt 7) und ob Handelszeiten vorliegen, dazu je Broker und Instrument den Zeitpunkt der jüngsten Angaben zum Instrument.
- `instrument_info` liefert die Angaben zum Instrument (Abschnitt 3).

### 8.1 Löschen

Löschen nach Spezifikation 5.5 und Abnahmebericht `wp02`, Versuch 2, M5. Es gibt vier Arten (`DeletionKind`), je mit einer Funktion, die nur angibt, was gelöscht würde (`plan_delete_…`, ändert nichts), und der Funktion, die löscht (`delete_…`):

| Art (`DeletionKind`) | Funktionen | Löscht |
|---|---|---|
| `series` | `plan_delete_series`, `delete_series` (Broker, Instrument, Daten) | die ganze Reihe: Kerzen einer Zeiteinheit oder Ticks mit ihren abgedeckten Zeiträumen und Handelszeiten |
| `period` | `plan_delete_period`, `delete_period` (Broker, Instrument, Daten, `start`, `end`) | die Kerzen oder Ticks im Zeitraum von `start` (einschließlich) bis `end` (ausschließlich) und nimmt den Zeitraum aus den abgedeckten Zeiträumen (Abschnitt 7) |
| `contract` | `plan_delete_contract`, `delete_contract` (Broker, Instrument) | alle Angaben zu diesem Instrument bei diesem Broker, alle Fassungen; sie haben keinen Zeitbezug und werden nur ganz gelöscht |
| `broker` | `plan_delete_broker`, `delete_broker` (Broker) | alle Reihen und alle Angaben zu Instrumenten dieses Brokers |

- `Daten` ist die Kennung einer Zeiteinheit (`m1` bis `mn1`) oder `ticks`. Namen werden genau (mit Groß- und Kleinschreibung) verglichen.
- Der Zeitraum eines Zeitraums ist in UTC und auf die Minute genau (keine Sekunden, keine Teile von Sekunden); er endet nach seinem Beginn und liegt zwischen 1970-01-01T00:00:00Z und 2100-01-01T00:00:00Z. Ein Zeitpunkt ohne Zeitzone ist ein `ValueError`. Hat die Reihe im Zeitraum weder Kerzen oder Ticks noch einen abgedeckten Zeitraum, ist der Zeitraum leer (`period_empty`). Eine Kerze gehört zum Zeitraum, wenn ihr Eröffnungszeitpunkt darin liegt.
- Eine Reihe ohne verbleibende Kerzen oder Ticks entfällt, mit ihren abgedeckten Zeiträumen und Handelszeiten (Löschen eines Zeitraums, der alle enthält). Ein Broker ergibt sich aus seinen Daten (Abschnitt 8, `brokers()`): Nach dem Löschen der letzten Reihe und der letzten Angaben zu Instrumenten kommt er nicht mehr vor.
- Jede Funktion läuft in einer Transaktion; schlägt etwas fehl, ist nichts gelöscht (`MarketDataStoreError`). Die Tabellen werden einzeln geleert und nicht über `ON DELETE CASCADE`, weil SQLite Fremdschlüssel nur auf Wunsch prüft.
- Das Ergebnis ist ein `Deletion`: `kind`, `broker`, `instrument`, `data`, `start`, `end` (je nach Art, sonst leer), `candle_count` und `tick_count` (gelöschte Kerzen beziehungsweise Ticks), `series_count` (Reihen, die danach nicht mehr vorkommen: bei `series` 1, bei `period` 1 genau dann, wenn keine Kerze oder kein Tick bleibt, sonst 0, bei `broker` alle), `instrument_count` (Instrumente, deren Angaben gelöscht werden) und `broker_removed` (der Broker kommt danach nicht mehr vor). `plan_delete_…` liefert dasselbe vor dem Löschen; `delete_…` liefert, was es gelöscht hat.
- Eine unbekannte Angabe ist ein `DeletionError` mit `code` (`DeletionErrorCode`) und fester Meldung; es wird nichts verändert:

| Code | Fall |
|---|---|
| `broker_unknown` | der Broker kommt im Datenbestand nicht vor |
| `instrument_unknown` | der Broker hat weder eine Reihe noch Angaben zu diesem Instrument |
| `series_unknown` | das Instrument hat bei diesem Broker diese Reihe nicht (unbekannte oder nicht vorhandene Zeiteinheit, `ticks` ohne Ticks, `contract`) |
| `contract_unknown` | das Instrument hat bei diesem Broker keine Angaben |
| `period_invalid` | der Zeitraum endet nicht nach seinem Beginn, liegt nicht auf der Minute oder außerhalb der unterstützten Zeiten |
| `period_empty` | die Reihe hat im Zeitraum weder Daten noch einen abgedeckten Zeitraum |

Die Bibliothek kennt weder den „Broker für Testläufe“ noch einen Import-Vorgang noch einen Backtest: Dass nicht gelöscht wird, solange etwas läuft, und das Zurücksetzen der Wahl des Brokers regelt pipwerk replay (`pipwerk-replay.md`).

### 8.2 Platz der Datenbank

Nach Spezifikation 5.6 gibt der Datenbestand den freien Platz nach dem Löschen (Abschnitt 8.1) und nach dem Ersetzen von Daten (Abschnitt 4) an das Dateisystem zurück; bei einer SQLite-Datei wird sie kleiner. Das Modul `pipwerk_marketdata.space` stellt zwei Funktionen bereit, `MarketDataStore` ruft die zweite nach dem Commit auf (bei einem Löschen nur mit Ausführung, bei einem Import nur, wenn er Daten ersetzt hat):

- `enable_space_return(engine)` setzt `auto_vacuum` einer SQLite-Datei auf `INCREMENTAL`; eine Datei mit anderem Modus wird einmal mit `VACUUM` umgestellt (der Modus wirkt erst damit). Der Aufrufer ruft es einmal beim Start nach den Migrationen. Es gibt `True` zurück, wenn ein `VACUUM` nötig war.
- `return_space(engine)` gibt die freien Seiten in Schritten zu 4096 Seiten frei (`PRAGMA incremental_vacuum`); jeder Schritt ist eine kurze Transaktion für sich. Ein Fehler wird ohne Pfad protokolliert und nicht weitergegeben: Die Änderung ist bereits bestätigt, der nächste Aufruf holt es nach.

Beide tun nichts bei einer Datenbank, die keine SQLite-Datei ist (Speicher, Server). Begründung des Verfahrens (`incremental_vacuum` statt `VACUUM`): kurze Sperren statt einer langen, kein zweites Exemplar der Datei und kein freier Platz von der Größe der Datei nötig, gleichmäßige Arbeit je Löschung; nur die Umstellung einer alten Datei braucht einmal ein `VACUUM`. Tests: `packages/market-data/tests/test_space.py`.

## 9. Migrationen

`migrate_database(engine)` bringt die Datenbank auf den neuesten Stand, ganz oder gar nicht, wie bei pipwerk Studio (`pipwerk-studio.md`, Abschnitt 2.2): eine Verbindung, eine Transaktion; bei SQLite mit `BEGIN IMMEDIATE`, weil der Treiber DDL sonst außerhalb der Transaktion bestätigt. Schlägt eine Migration fehl, wird zurückgerollt und `DatabaseMigrationError` gemeldet. Die Migrationen liegen im Paket (`pipwerk_marketdata.migrations`) und werden mit ihm ausgeliefert. Die Adresse der Datenbank kommt vom Aufrufer; es gibt keine Alembic-Konfigurationsdatei mit fester Adresse.

Neben anderen Tabellen: Die Migrationen legen nur Tabellen `marketdata_*` an und führen ihren Stand in der eigenen Versionstabelle `marketdata_alembic_version`. Eine Versionstabelle `alembic_version` des Aufrufers bleibt unberührt. Ein Test vergleicht das migrierte Schema mit den Tabellendefinitionen in `tables.py`.

Versionen:

| Version | Inhalt |
|---|---|
| `0001` | Tabellen (Abschnitt 3) |
| `0002` | Daten, kein neues Schema: Die abgedeckten Zeiträume von Reihen, die vorher importiert wurden, reichten vom ersten bis zum letzten Eintrag. Die Migration weitet jeden gespeicherten Zeitraum auf ganze Tage in UTC (Beginn auf den Beginn seines Tages, Ende auf den Beginn des folgenden Tages, wenn es nicht schon auf einer Tagesgrenze liegt, höchstens bis 2100-01-01T00:00:00Z) und fasst danach berührende oder überlappende Zeiträume zusammen. Die Zeitzone eines früheren Imports ist nicht gespeichert; UTC ist die Wahl, die ohne Annahme auskommt. Folge: Ein früher Handelsschluss am letzten Tag einer früheren CSV-Datei ist keine Lücke mehr (5.2). Zeiträume, die ein JSON mit `period` genau genannt hat, werden ebenfalls auf ganze Tage geweitet (die Datenbank unterscheidet sie nicht von denen einer CSV-Datei). Das Zurückstufen ändert nichts. |

Zugriffe auf eine Reihe, die zugleich von zwei Prozessen angelegt wird, können mit einem Fehler der Datenbank enden; es wird nichts sichtbar (`MarketDataStoreError`).

## 10. Sicherheit

- Dateien werden nie ausgeführt; Größe und Zeilenzahl sind begrenzt (Abschnitt 4.4); JSON mit Ablehnung zusätzlicher Felder und ohne Typumwandlung; Zahlen müssen endlich sein.
- Alle Datenbankzugriffe sind parametrisierte Ausdrücke von SQLAlchemy, kein zusammengesetztes SQL.
- Meldungen und Fehler nennen keine Inhalte der Datei und keine Einzelheiten der Datenbank. Gründe abgelehnter Zeilen sind feste Kennungen.
- Der Zeitzonenname geht an die Zeitzonen-Datenbank, die Pfade ablehnt.
- Abhängigkeiten sind mit `uv.lock` festgeschrieben.

## 11. Grenzen und offene Punkte

- Das Format der CSV-Dateien von MetaTrader 5 ist nicht an einer Quelle des Herstellers belegt (Abschnitt 5.2). Die Abnahme mit einer echten Exportdatei steht aus.
- Der Import ersetzt nur gleiche Zeitpunkte; Daten löschen die Funktionen aus Abschnitt 8.1.
- Preise sind Gleitkommazahlen; die Bibliothek rechnet nicht damit.
- Eine Datei wird als Ganzes im Speicher geprüft und ist darum je Datei begrenzt (Abschnitt 4.4); sehr große Tickdateien teilt die Beschaffung nach Zeiträumen. Größere Dateien sind zurückgestellt (M4).
- Lücken innerhalb einer Datei erkennt der Datenbestand nicht (5.2): Was eine Datei für ihren Zeitraum liefert, gilt als vollständig. Wochenende und Tage ohne Handel stehen fest in UTC (Abschnitt 7, Grenzen).
- Bewegliche Feiertage (zum Beispiel Karfreitag) kennt die Liste der Tage ohne Handel nicht: Sie nimmt Tage des Jahres, kein Datum mit Jahr (Spezifikation 5.2).

## 12. Tests

`packages/market-data/tests/`, Aufruf `uv run pytest` im Verzeichnis des Pakets; dazu `uv run ruff check`, `uv run ruff format --check` und `uv run mypy`.

| Datei | Prüft |
|---|---|
| `test_import_json.py` | gültige Dateien, jeder Ablehnungsgrund bei JSON, jeder Dateifehler, Ersetzen, Fehler der Datenbank (nichts sichtbar), Begrenzungen, Handelszeiten, mehrere Reihen nebeneinander |
| `test_import_csv.py` | beide Kerzenvarianten, Ticks, Kopfzeilen und Trennzeichen, Kodierungen, Zeitzonen mit Sommerzeitwechsel (doppelte und fehlende Ortszeit), jeder Ablehnungsgrund bei CSV, Begrenzungen |
| `test_completeness.py` | Lücken nach Abschnitt 7: kein Loch innerhalb eines abgedeckten Zeitraums, Feiertage innerhalb eines Zeitraums, Wochenenden und Tage ohne Handel zwischen Zeiträumen, früher Handelsschluss am Ende einer CSV-Datei, 24./26. Dezember und 31. Dezember/2. Januar zwischen zwei CSV-Dateien, nicht importierter Handelstag, Prüfung mit Testzeitraum ab einem Tag ohne Handel, Handelszeiten, Zeitzone des Imports, die Funktionen und Werte der Regeln |
| `test_delete.py` | Löschen einer Reihe, eines Zeitraums (Lücke danach, Rand, Zeit ohne Handel, ganze Reihe entfällt), der Angaben zum Instrument, eines Brokers; Vorabangabe ändert nichts; unbekannte Angaben mit Grund; eine Transaktion |
| `test_read.py` | Seiten mit Fortsetzung, Obergrenze, Übersicht, Angaben zum Instrument |
| `test_import_files.py` | Vorgang mit JSON und CSV gemischt, gemeinsamer Broker und gemeinsame Zeitzone, Broker ersetzt den der JSON-Datei (auch bei Angaben zum Instrument), abgelehnte Datei neben übernommenen, abgelehnte Zeilen je Datei, Ersetzen, fehlende Angaben bei CSV, viele Dateien ohne Grenze für Zahl und Gesamtgröße, Grenze je Datei mit Meldung in der Einheit des Anwenders, Fehler der Datenbank, Dateiname nie als Pfad |
| `test_filehints.py` | alle Muster der Dateinamen, jede Zeiteinheit, Nichterkennung, Pfade im Namen, Hinweise aus dem Inhalt einer JSON-Datei und ihre Fehler |
| `test_series_list.py` | Liste der Reihen mit Filter, Seiten, Sortierung und Zeile „Kontraktdaten“, Einzelheiten mit Lücken und Angaben zum Instrument, Broker |
| `test_time_limits.py` | Zeitpunkte am Rand (Jahr 1, 1970, 2100, Jahr 9999) in JSON und CSV, Kerzen und Ticks, jede Zeiteinheit, Zeitraum, Angaben zum Instrument, Lesen, Vollständigkeit und Übersicht ohne `OverflowError` |
| `test_migrations.py` | leere Datenbank, Wiederholung, fremde Tabellen und fremde Versionstabelle, Schema gleich Tabellendefinition, Rückrollen, Migration `0002` (ganze Tage, Zusammenfassen, Obergrenze, leere Datenbank) |
| `test_contract.py` | Schemas gleich den Modellen, Beispiele gegen Schema und Import, Schema und Import stimmen bei Fehlern überein |
| `test_documentation.py` | Gründe, Standardwerte, Tabellen und Schwellen stehen in diesem Dokument |

### Prüfskript

`packages/market-data/scripts/check` führt alle automatischen Prüfungen des Pakets aus und endet nur mit Exit-Code 0, wenn alle bestehen: `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check` und `mypy`. Das Paketverzeichnis ergibt sich aus dem Pfad des Skripts; es kann aus jedem Verzeichnis aufgerufen werden.

```
packages/market-data/scripts/check [--with-audit]
```

`--with-audit` ergänzt `pip-audit` über die in `uv.lock` festgeschriebenen Pakete. Das Skript enthält keine festen Ports, Pfade oder Rechnernamen. Muster: `components/pipwerk-studio/scripts/check`.

## 13. Entscheidungen

Rein technische Einzelheiten, die die Spezifikation offenlässt:

| Entscheidung | Grund |
|---|---|
| Kerzen und Ticks liegen in je einer Tabelle für alle Reihen, Reihe über `marketdata_series` | wenige Tabellen, Migrationen bleiben klein, neue Reihen brauchen kein Schema |
| Zeiteinheiten heißen `m1` bis `mn1` (klein) wie in `pipwerk_domain` | gleiche Kennungen in Strategie und Datenbestand |
| Abgedeckte Zeiträume als eigene Tabelle, aus Datei oder Daten abgeleitet | „fehlt“ und „Lücke“ unterscheiden sich für den Anwender: nie beschafft oder beschafft ohne Daten |
| Ablehnung einer Zeile statt der Datei bei Fehlern in einer Zeile | Spezifikation 5.3: Ergebnis nennt abgelehnte Zeilen; die übrigen werden übernommen |
| Zeitordnung gegen die letzte übernommene Zeile | eine abgelehnte Zeile soll die folgenden nicht mitreißen |
| Zusätzliche Prüfung Hoch ≥ Tief, Hoch ≥ Schluss, Tief ≤ Eröffnung | Abschnitt 4.2 |
| Tick mit leerem Geld oder Brief wird abgelehnt, nicht aus dem vorigen ergänzt | die Bibliothek erfindet keine Kurse |
| Vollständigkeit: Lücke vom ersten bis zum letzten Handelszeitpunkt der Zeit zwischen zwei abgedeckten Zeiträumen | eine Lücke über ein Wochenende hinweg ergibt ein Stück statt vieler |
| Auftrag 15: keine Lücke innerhalb eines abgedeckten Zeitraums; die Schwellen für fehlende Kerzen, für M1 in der Stunde und für die Stille bei Ticks entfallen | Spezifikation 5.2 und M6: weder MetaTrader 5 noch sein Export liefern einen Kalender der Feiertage, ob in einer Zeit gehandelt wurde, weiß nur der Broker. Eine Schwelle hätte Feiertage und frühen Handelsschluss als Lücke gemeldet |
| Tage ohne Handel als `CalendarDay(month, day)`, jedes Jahr, Parameter von `CompletenessRules`; Vorgabe der Bibliothek: keine | Spezifikation 5.2: „Liste von Kalendertagen in der Startkonfiguration“, vorbelegt mit 25. Dezember und 1. Januar; die Vorbelegung gehört in die Konfiguration von pipwerk replay, die Bibliothek hat keinen festen Wert. Ein Tag mit Jahr (bewegliche Feiertage) ist in der Spezifikation nicht vorgesehen |
| Tage ohne Handel gelten auch, wenn die Quelle Handelszeiten liefert | ein Feiertag ohne Handel ist es unabhängig davon, wie die Quelle die Wochentage beschreibt; sonst hinge die Lücke vom Format der Datei ab |
| CSV: Beginn des Tages in der Zeitzone des Imports bei Mitternacht, die es nicht gibt, der erste vorhandene Zeitpunkt des Tages | Zeitzonen mit Umstellung um Mitternacht; Spezifikation 5.1 regelt nur Zeilen |
| Löschen: `plan_delete_…` und `delete_…` rechnen dieselbe Planung und unterscheiden sich nur im Ausführen | Die Vorabangabe kann nicht von dem abweichen, was gelöscht wird |
| Löschen: Eine Reihe entfällt, wenn keine Kerze oder kein Tick bleibt, auch wenn abgedeckte Zeiträume blieben | Spezifikation 5.5: „Ohne verbleibende Daten entfällt die Reihe“ |
| Löschen: Kerzen, die im Zeitraum eröffnen, gehören dazu | die Kerze ist durch ihren Eröffnungszeitpunkt bestimmt (Abschnitt 3) |
| Migration `0002` weitet die gespeicherten Zeiträume auf ganze Tage in UTC | Auftrag 15: die Zeitzone früherer Importe ist nicht gespeichert; die Wahl braucht keine Annahme |
| Keine Prüfung, ob Eröffnungszeitpunkte auf die Zeiteinheit fallen | die Serverzeit des Brokers fällt nach der Umrechnung nicht auf volle UTC-Grenzen, zum Beispiel bei H4 und D1 |
| Zeitpunkte nur von 1970 bis vor 2100, sonst abgelehnte Zeile `time_out_of_range` | Abschnitt 4.4: keine Zeit am Rand von `datetime`, nie `OverflowError`; die Grenzen liegen außerhalb jeder Kursreihe |
| Alembic-Versionstabelle `marketdata_alembic_version` | die Bibliothek darf neben Tabellen des Aufrufers laufen |
| Auftrag 11: Vorgang als eigene Funktion `import_files`, die Einzelfunktionen bleiben | der Vorgang verwendet dieselben Prüfungen und denselben Schreibvorgang je Datei; die Einzelfunktionen sind der kleinere Aufruf |
| Fehler der Datenbank bei einer Datei ist ein Ergebnis dieser Datei (`store_failed`), keine Ausnahme des Vorgangs | der Anwender sieht, welche Dateien übernommen sind; ohne das ginge das Ergebnis der bereits übernommenen Dateien verloren |
| Auftrag 15: keine Grenze für Zahl und Gesamtgröße der Dateien eines Vorgangs, kein Ersatz | Spezifikation 5.3, M3: eine Grenze je Anfrage ist eine technische Frage, der Anwender wählt beliebig viele Dateien. Die Dateien eines Vorgangs liegen nie gleichzeitig im Speicher, die Grenze je Datei genügt |
| Bei JSON-Dateien ersetzt der Broker des Vorgangs die Angabe der Datei | Auftrag 11 und Spezifikation 5.3 (der angegebene Broker gilt auch für JSON-Dateien) |
| Bei JSON-Dateien lässt sich das Instrument je Datei überschreiben, die Daten nicht (Entscheidung des Entwicklungsleiters zu Spezifikation 5.3, „je Datei änderbar“) | Das Instrument ist ein Name, den der Anwender ändern können muss, etwa bei anderer Bezeichnung beim Broker. Zeiteinheit, Ticks und Kontraktdaten bestimmen die Form des Inhalts; eine andere Angabe wäre ein Widerspruch zum Inhalt und ist darum eine abgelehnte Datei mit Grund (`series_invalid`), keine stille Umdeutung. Eine Angabe gleich dem Inhalt ist kein Widerspruch, damit die Oberfläche alle Felder vorbelegen darf |
| Liste der Reihen filtert und sortiert im Speicher über alle (Broker, Instrument, Daten) der Datenbank, die Lücken nur für die Zeilen der Seite | die Zahl der Reihen ist klein (Broker mal Instrumente mal Zeiteinheiten); die Lücken sind die teure Berechnung. Sortierung nach Zeiteinheit (kurz nach lang) lässt sich in SQL nicht sinnvoll ausdrücken |
| Muster der Dateinamen nach Abschnitt 5.3; ein Name nur mit Instrument wird nicht erkannt | ein vorbelegtes falsches Instrument aus einem beliebigen Namen (`Bericht.csv`) wäre schlimmer als ein leeres Feld |
| `overview()` bleibt bis Auftrag 12 | pipwerk replay stützt seine Web-API noch darauf (Abschnitt 8) |
| Schema `contracts/market-data/v1/` unverändert: Broker bleibt Pflichtfeld | geprüft: Der Name des Handelsservers passt in Schema und Beispiele (`Name`: 1 bis 128 Zeichen, Leerzeichen innen erlaubt, keine Steuerzeichen, kein Leerzeichen am Rand). `pipwerk-fetch-mt5` schreibt den Broker immer (Spezifikation 5.4), und eine Pflicht zu streichen bräche den Vertrag der Dateien, die Programme schreiben; der Broker des Vorgangs ersetzt den der Datei beim Import, ohne dass das Schema ihn freigibt |

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-21 | Erstfassung zu Auftrag 02 des Arbeitspakets `wp02` im Vorhaben `backtest`. |
| 2026-10-24 | Auftrag 18: Platz der Datenbank nach Löschen und Ersetzen (Abschnitt 8.2, `space.py`). |
| 2026-10-21 | Auftrag 08: Grenzen für Zeitpunkte (1970 bis vor 2100), Grund `time_out_of_range`, Vollständigkeit nur innerhalb der Grenzen. |
| 2026-10-21 | Abschnitt „Prüfskript“ zu `packages/market-data/scripts/check` (Tester Funktion). |
| 2026-10-23 | Auftrag 11 (Mängel M1, M3, M4 des Abnahmeberichts `wp02`): Import eines Vorgangs mit mehreren Dateien (4.5), Grenzen für Zahl und Gesamtgröße (4.4), Erkennung aus Dateinamen und Hinweise aus JSON (5.3, 5.4), Liste der Reihen, Einzelheiten und Broker (8), Entscheidungen (13). |
| 2026-10-23 | Auftrag 11, Ergänzung: Instrument je Datei auch bei JSON überschreibbar, Daten bei JSON nicht (4.5, 13). |
| 2026-10-24 | Auftrag 15 (Mängel M3, M5, M6 des Abnahmeberichts `wp02`, Versuch 2): Lücken nach Spezifikation 5.2 mit Tagen ohne Handel (3, 7, 13), CSV deckt ganze Tage der Zeitzone des Imports ab (3), Migration `0002` (9), Löschen nach 5.5 (8.1), Grenzen für Zahl und Gesamtgröße der Dateien eines Vorgangs entfallen, Meldung zur Grenze je Datei in der Einheit des Anwenders (4.4, 4.5). |
