# Auftrag Probeumsetzung große Tick-Reihen im Datenbestand

- Vorhaben: `backtest`, Rückkopplung aus der Abnahme von `wp02`, Versuch 2 ([Abnahmebericht](../wp02/acceptance/2.md), Mangel M4)
- zuständig: Entwickler Backend
- Zweig: `backtest/proto-ticks`, Probeumsetzung, wird nicht übernommen
- Ausgangscommit: `b309f8ad52a015d3828ea04e0d90aaec6f4a89f5` (Stand von `backtest/wp02`)
- Stand: 2026-10-23, geändert am 2026-10-24 nach req-system-028 (Abschnitt „Speicherplatz“, Punkte 4a und 6). Gilt bei Wiederaufnahme; die abgebrochene Fassung hat rund 24 GB erzeugte Daten zurückgelassen.

## Ziel

Der Auftraggeber will eine Tick-Datei aus MetaTrader 5 von 5,8 GB importieren (req-system-026: Größe einer Datei nur durch den Speicherplatz begrenzt, Fortschritt, Abbrechen). Vor der Spezifikation ist zu messen, ob der Datenbestand `pipwerk_marketdata` Ticks in dieser Menge mit brauchbarer Geschwindigkeit speichert und für einen Backtest liest, und mit welchem Speichermodell. Ergebnis ist ein Messbericht mit Empfehlung, kein Produktcode.

Heutiger Stand (zu belegen, nicht zu übernehmen): eine Zeile je Tick in `marketdata_tick` mit Schlüssel `(series_id, moment)`, Zeitpunkt als `DateTime`; der Import liest eine Datei ganz in den Speicher (`ParsedImport.ticks`) und schreibt sie in einer Transaktion; Grenzen 32 MiB und 500 000 Zeilen je Datei (`limits.py`).

## Umfang

1. Testdaten: ein Generator, der eine Tick-Datei im CSV-Exportformat von MetaTrader 5 schreibt (Kopfzeile `<DATE>	<TIME>	<BID>	<ASK>	<LAST>	<VOLUME>	<FLAGS>`, Tabulator, Serverzeit, Millisekunden; wie in MetaTrader 5 sind in vielen Zeilen `BID` oder `ASK` leer, wenn sich nur der andere Kurs geändert hat). Prüfe am heutigen CSV-Import, ob er leere Kurse so behandelt, wie MetaTrader 5 sie meint (Wert des vorigen Ticks), und nenne das Ergebnis. Größe für die Hauptmessung: etwa 5,8 GB (rund 80 bis 100 Millionen Zeilen, über etwa zwei Jahre verteilt mit Handelspausen am Wochenende). Für schnelle Läufe zusätzlich eine Datei mit etwa 5 Millionen Zeilen.
2. Variante A: heutiges Speichermodell (eine Zeile je Tick), aber Import als Strom in Abschnitten statt ganz im Speicher.
3. Variante B: Ticks in Blöcken, eine Zeile je Reihe und Zeitabschnitt (zum Beispiel eine Stunde oder eine feste Zahl von Ticks) mit Beginn, Ende, Anzahl und gepackten Werten (Zeitpunkt als ganze Millisekunden, Geld, Brief), wahlweise komprimiert. Nur Standardbibliothek oder bereits vorhandene Abhängigkeiten; nenne es, falls eine neue Abhängigkeit deutlich besser wäre.
4. Für beide Varianten mit SQLite (Standard der Startkonfiguration) messen:
   - Import der großen Datei: Dauer, Zeilen je Sekunde, höchster Speicherbedarf des Prozesses, Größe der Datenbank im Verhältnis zur Datei, Umrechnung der Serverzeit in UTC eingeschlossen.
   - Abbrechen während des Imports: Dauer bis zum Ende, Zustand der Datenbank danach.
   - Ersetzen: erneuter Import eines Monats, der schon vorhanden ist.
   - Löschen: eine ganze Reihe und ein Zeitraum von einem Monat (req-system-025).
   - Lesen für einen Backtest: alle Ticks der zwei Jahre in Zeitordnung als Strom mit begrenztem Speicher, und ein Zeitraum von 30 Tagen; Dauer, Ticks je Sekunde, höchster Speicherbedarf.
   - Lesen für die Ansicht „Datenbestand“: abgedeckte Zeiträume und Lücken der Reihe.
4a. Dateiformat (Fassung vom 2026-10-24): Version 1 des JSON-Formats wird nicht gemessen; sie belegt das 1,4- bis 1,7-Fache der CSV-Datei und wird ersetzt (Spezifikation 5.6). Miss stattdessen den Import derselben Ticks in den Kandidaten für Version 2 nach Spezifikation 5.6 (JSON oder CSV nach req-system-026, Angaben der Reihe einmal am Anfang, eine Zeile je Tick nur mit Zeitpunkt in ganzen Millisekunden UTC, Geld und Brief) als Strom mit begrenztem Speicher: Dauer, Speicherbedarf, Größe der Datei im Verhältnis zur CSV-Datei. Der Messbericht empfiehlt einen Kandidaten mit genauem Aufbau und begründet die Wahl mit den Messwerten (req-system-028: effizientestes Format für Platzbedarf und Verarbeitung). Dasselbe gilt für die Wahl zwischen Variante A und B.
5. Übertragung: Miss, ob das Hochladen der großen Datei vom Browser in Stücken (zum Beispiel je 64 MiB in eigenen Anfragen) mit gleichzeitigem Einlesen auf dem Server praktikabel ist, oder ob der Server die Datei zuerst vollständig zwischenspeichern muss. Eine einfache Messung mit einem Skript als Gegenstelle genügt, ohne Oberfläche.
6. Messbericht `development/backtest/prototype/ticks-probe.md` auf dem Zweig: Rechner (Kerne, Speicher), Größen, Messwerte beider Varianten in einer Tabelle, Bewertung gegen die Richtwerte unten, Empfehlung mit Begründung (Speichermodell, Größe der Blöcke, Übertragung, Abbrechen), was die Empfehlung für Schema, Migration bestehender Datenbanken, Grenzen und Lesen in `wp03` bedeutet. Höchstens etwa 80 Zeilen. Messskripte liegen auf dem Zweig unter `development/backtest/prototype/ticks-probe/`, damit die Messung wiederholbar ist. Generierte Dateien und Datenbanken werden nicht committet; für ihr Entfernen gilt der Abschnitt „Speicherplatz“.

## Speicherplatz

Nach req-system-028, Fassung vom 2026-10-24:

- Alle erzeugten Dateien, Datenbanken und Teilstücke liegen in genau einem Datenverzeichnis, das der Startauftrag des Entwicklers nennt. Die Skripte nehmen es als Angabe beim Aufruf und schreiben nirgends sonst hin, auch nicht in das Verzeichnis für temporäre Dateien.
- Höchstens 20 GB zusammen (Testdatei 5,8 GB, dieselben Ticks in Version 2 und eine Datenbank höchstens so groß wie die Datei). Vor jedem Schritt berechnet das Skript den Platzbedarf des Schritts, nennt ihn in der Ausgabe und bricht ohne zu schreiben ab, wenn das Datenverzeichnis danach über der Grenze läge oder auf dem Datenträger weniger als 10 GB frei blieben. Der Messbericht nennt den Platzbedarf jedes Schritts. Gemessen wird nacheinander: Die Datenbank einer Variante wird nach ihren Messungen entfernt, bevor die nächste entsteht.
- Jedes Skript entfernt, was es erzeugt hat, am Ende, bei Fehler und bei Abbruch mit Strg+C oder Signal. Beim Start entfernt es Reste eines früheren abgebrochenen oder abgestürzten Laufs im Datenverzeichnis. Die Testdatei aus Punkt 1 darf für weitere Messungen liegen bleiben, bis der Messbericht fertig ist.
- Nach dem Messbericht ist das Datenverzeichnis leer; der Entwickler prüft das mit einem Befehl und nennt die Ausgabe in seinem Ergebnis.
- Bei Punkt 5 legt die Gegenstelle empfangene Teilstücke nur im Datenverzeichnis ab und entfernt jedes nach seiner Übernahme, beim Abbrechen und beim nächsten Start nach einem Absturz.

Richtwerte für „brauchbar“ (Festlegung des Softwarearchitekten, zu bestätigen oder mit Messwerten zu widerlegen):

- Import von 5,8 GB in höchstens 30 Minuten, Speicherbedarf des Prozesses höchstens 1 GB, unabhängig von der Größe der Datei.
- Datenbank höchstens so groß wie die Datei.
- Lesen aller Ticks der zwei Jahre als Strom in höchstens 5 Minuten, 30 Tage in höchstens 10 Sekunden, Speicherbedarf höchstens 500 MB.
- Abbrechen und Löschen eines Monats in höchstens 1 Minute.

## Nicht-Umfang

- Oberfläche, Web-API und Produktcode; nichts davon wird übernommen.
- Ausführung der Strategie im Backtest (`wp03`); gemessen wird nur das Lesen.
- andere Datenbanken als SQLite. Falls die Messung zeigt, dass SQLite nicht reicht, nenne es mit Begründung.

## Ablage

Messbericht und Skripte als ein benannter Commit auf `backtest/proto-ticks`, übertragen nach `origin`. Kein Testbericht, keine Tester.
