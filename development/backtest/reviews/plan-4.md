# Prüfbericht Plan, Durchlauf 4

- Vorhaben: `backtest`
- Rolle: QA
- geprüfter Commit: `f67c1f0eff6e4de78cc7de1a31c8bce2add665fc` auf `main`
- Umfang: Punkt 3 des Prüfauftrags (`wp02`, `wp03`, Abdeckung, geänderte Stellen)

## Ergebnis

**bestanden**

Blockierende Befunde: keine.

## Prüfung

- Abdeckung: E5, 5.1, 5.3, 5.4 liegen bei `wp02`. Die Meldung beim Start eines Testlaufs (5.4, letzter Absatz) liegt bei `wp03` (Tabelle Abdeckung, Umfang von `wp03`). 8.3 „Datenbestand“ liegt bei `wp02`, „Kursdaten beim Start“ bei `wp03`. 8.4 Punkt 6 liegt in der Gruppe „Punkte 5 bis 8“ bei `wp03`. Abschnitt 7 und 10 (Import mehrerer Dateien, Beschaffung) liegen bei `wp02`, 11 und 12 bei `wp02` beziehungsweise `wp03` je nach Teil.
- Umfang von `wp02` entspricht den Mängeln M1 bis M4: Import mehrerer Dateien, Ansicht und Dialog, `pipwerk-fetch-mt5` ohne Server und Port, Wegfall von Adresse und Schlüssel. Der Nicht-Umfang nennt Beschaffung aus pipwerk replay und pipwerk relay.
- Abnahmekriterien `wp02` 1 bis 3, 5, 6: Alle sind für den Auftraggeber selbst prüfbar (Import mehrerer CSV-Dateien ohne Anleitung, fehlerhafte Datei neben übernommenen, Aufruf von `pipwerk-fetch-mt5` mit MetaTrader 5, Broker als Name des Handelsservers, kein offener Port). Kriterium 3 braucht MetaTrader 5, die Voraussetzung ist genannt.
- Abnahmekriterien `wp03` 1 und 5: Prüfbar. Die Kursdaten holt und importiert der Auftraggeber vorher (`wp02`, Abhängigkeit vorhanden). Die Meldung bei fehlenden Daten nennt Instrument, Art, Zeitraum und Weg und führt zur Ansicht „Datenbestand“.
- Widerspruch zwischen Plan und Spezifikation: keiner gefunden.

## Hinweise (nicht blockierend)

- H1: 5.1 verlangt, dass der „Broker für Testläufe“ in der Vorbereitung eines Testlaufs änderbar ist. `wp03` nennt das weder im Umfang noch in einem Abnahmekriterium, die Abdeckung ordnet 5.1 nur `wp02` zu.
- H2: Die Übersicht (Zeile zu `wp02`, Abschnitt „Erläuterung“) nennt noch „Datenbestand, Import, Beschaffung und Testkonten“. Die Beschaffung ist jetzt ein Programm außerhalb von pipwerk replay. Eine Angleichung genügt.
