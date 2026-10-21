# Arbeitspaketplan Vorhaben backtest

## Status

- status: `draft`
- stand: 2026-10-21
- komponenten: `packages/domain-core`, `packages/market-data` (neu), `packages/ui-components`, `components/pipwerk-replay` (neu, bisher `components/pipwerk-backtest`), `components/pipwerk-fetch-mt5` (neu), `components/pipwerk-studio`, `contracts/`
- grundlage: [specification.md](specification.md), bestätigt vom Auftraggeber im Chat am 2026-10-21 ([Präsentation](presentations/specification-1.html))
- prüfung: Durchlauf 1 [plan-1.md](reviews/plan-1.md) nicht bestanden (B1), eingearbeitet; Durchlauf 2 [plan-2.md](reviews/plan-2.md), Nachprüfung, bestanden, Hinweise ohne weitere Prüfung eingearbeitet

## Übersicht

| Paket | Titel | hängt ab von | Stand |
|---|---|---|---|
| `wp01` | Auslöser „Manuell“ in Bibliothek und pipwerk Studio | `strategiedesign/wp02` | `open` |
| `wp02` | Datenbestand und Testkonten | – | `open` |
| `wp03` | Backtest | `wp01`, `wp02`, Referenzwerte aus MetaTrader 5 | `open` |
| `wp04` | Einzelschritt-Test | `wp03`, `strategiedesign/wp03` | `open` |

Die Pakete folgen dem, was der Auftraggeber selbst prüfen kann. `wp02` braucht nichts aus `strategiedesign` und beginnt sofort: pipwerk replay mit Datenbestand, Import, Beschaffung und Testkonten. `wp01` stellt Bibliothek und pipwerk Studio auf die Entscheidungen vom 2026-10-21 um und braucht dafür das Format 2.0 aus `strategiedesign/wp02`. `wp03` bringt die Ausführung der Strategie und den Backtest; es endet mit dem Nachweis, dass `str-01` und `str-03` im Backtest laufen. `wp04` bringt den Einzelschritt-Test und dafür die Darstellung der Strategie als gemeinsamen Baustein.

`wp04` hängt auch von `strategiedesign/wp03` ab. Grund: Es verlegt Zeichenfläche, Elemente, Verbindungen und Eigenschaftenansicht von pipwerk Studio nach `packages/ui-components` (Spezifikation 8.2). `strategiedesign/wp03` ändert dieselben Teile; beide gleichzeitig ergäben zwei Fassungen derselben Bausteine.

Pakete aus `strategiedesign` meldet der Entwicklungsleiter dort mit `integrated` an den Projektleiter. Der Projektleiter stößt danach die Pakete dieses Plans an, deren Abhängigkeiten damit erfüllt sind.

Abschnittsangaben beziehen sich auf die [Spezifikation](specification.md). Endpunkte, Grenzwerte gegen Überlast, Schwellen für Lücken (5.2), die Höchstzahl von Kerzen je Anfrage (8.2) und die Einzelheiten der Tests legen die Aufträge fest.

## wp01 – Auslöser „Manuell“ in Bibliothek und pipwerk Studio

### Ziel

Bibliothek und pipwerk Studio folgen den Entscheidungen des Auftraggebers vom 2026-10-21: Der Auslöser heißt „Manuell“ und ist in einer Verwaltung ein Fehler, das Element „Parameter setzen“ gibt es nicht mehr. Der `ZigZag` hat die Eigenschaften, die `str-01` verwendet.

### Umfang

- Bibliothek: Name, englischer Name, Beschreibung und Erklärung des Auslösers bei unveränderter Kennung `trigger.manual_start`; Befund `trigger.manual_in_management`; Entfall von `flow.set_parameter` aus Katalog, Konsistenzprüfung und Operationen (3.6).
- Bibliothek: Typbeschreibung des `ZigZag` um die Eigenschaften `letztes_hoch`, `vorletztes_hoch`, `letztes_tief`, `vorletztes_tief` ergänzt (3.3, letzter Satz des zweiten Absatzes), damit `str-01` ohne Befund geprüft werden kann. Die Berechnung folgt in `wp03`.
- pipwerk Studio: Texte, Tests und Anwenderdokumentation, die einen der beiden Begriffe nennen (3.6); die neuen Eigenschaften des `ZigZag` erscheinen über den Katalog.
- Testfalldokumente `str-01` und `str-03` unter `contracts/strategies/v2/testcases/`, soweit sie eines der beiden Elemente enthalten; `str-01` nach der Fassung des Testfalls vom 2026-10-21 (Abschnitt 9).
- Tests nach Abschnitt 10, Punkt „Testfälle“, Teil Befund `trigger.manual_in_management`.
- Dokumentation (Abschnitt 12): `docs/technical/pipwerk-domain.md` zu Auslöser `Manuell` und Entfall von `flow.set_parameter`, Anwenderdokumentation von pipwerk Studio.

### Nicht-Umfang

- Ausführung von Strategien (`wp03`)
- Umwandlung alter Strategiedokumente mit „Parameter setzen“ (3.6)

### Umgesetzte Teile der Spezifikation

3.3 Typbeschreibung des `ZigZag`, 3.6 vollständig, Abschnitt 9 Testfalldokument `str-01`, Abschnitt 10 Befund `trigger.manual_in_management`, Abschnitt 12 Punkt 1 für `pipwerk-domain.md` (Auslöser, `flow.set_parameter`, Eigenschaften des `ZigZag`) und Punkt 2.

### Abhängigkeiten

`strategiedesign/wp02` (Format 2.0, Oberfläche von pipwerk Studio)

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung von pipwerk Studio selbst prüfen:

1. Bedienbarkeit: Der Auftraggeber legt ohne Anleitung, so wie im bestätigten Prototyp von pipwerk Studio, eine Strategie mit dem Auslöser „Manuell“ an und verwendet in einer Bedingung `letztes Hoch` eines `ZigZag`. Die Konsistenzprüfung meldet keinen Fehler.
2. Die Elementbibliothek zeigt den Auslöser „Manuell“, in Englisch „Manual“, mit Erklärung. Ein Element „Parameter setzen“ gibt es nicht.
3. Ein Auslöser „Manuell“ in der Verwaltung einer Order ist ein Fehler am Auslöser; im Hauptablauf ist er keiner.
4. Eine vor diesem Paket gespeicherte Strategie mit dem Auslöser öffnet sich und zeigt ihn als „Manuell“.
5. Die Testfälle `str-01` und `str-03` öffnen sich ohne Fehler der Konsistenzprüfung.
6. Die Anwenderdokumentation von pipwerk Studio nennt den Auslöser „Manuell“ und kein Element „Parameter setzen“.

Technische Nachweise im Prüfbericht der QA: Das Prüfskript endet mit Exitcode 0 auf dem bereitgestellten Commit. Positive Testberichte beider Tester liegen vor.

## wp02 – Datenbestand und Testkonten

### Ziel

pipwerk replay läuft als eigene Komponente. Der Anwender sieht den Datenbestand historischer Kursdaten, importiert Dateien, beschafft Kursdaten aus MetaTrader 5 und verwaltet Testkonten.

### Umfang

- Komponente `components/pipwerk-replay` durch Umbenennen von `components/pipwerk-backtest` mit allen Verweisen; Backend mit Startkonfiguration, eigener Datenbank, Alembic und Prüfung des Kopfs `Host` wie pipwerk Studio (E3, E6); Prüfskript und Testumgebungsskript.
- Bibliothek `packages/market-data`: Speichermodell, Import JSON und CSV mit Zeitzone, Prüfung auf Vollständigkeit, Lesen (E4, 5.1 bis 5.3); Schema `contracts/market-data/v1/`.
- `components/pipwerk-fetch-mt5` mit Zuordnungstabelle, Zeitzone und gemeinsamem Schlüssel (E5, 5.4); Beschreibung `contracts/api/pipwerk-fetch/v1/`.
- Testkonten mit Standard-Testkonto (6.2).
- Web-API (Abschnitt 7) für Datenbestand, Beschaffung von Hand, Testkonten und Einstellungen, darunter die Standardquelle (5.1).
- Oberfläche nach dem bestätigten Prototyp (8.1, 8.2): Kopfzeile mit Menü, „Über pipwerk replay“, Sprachwahl, Fußzeile mit Stand und Erreichbarkeit des Backends; Ansichten „Datenbestand“ und „Testkonten“ (8.3); Fenstergrößen nach 8.4 Punkt 1 für diese Ansichten.
- Sicherheit nach Abschnitt 11 für Import, Beschaffung und Schlüssel.
- Tests nach Abschnitt 10, Punkte Datenbestand und Beschaffung; Backend, Oberfläche und Browsertests für dieses Paket.
- Dokumentation (Abschnitt 12): `docs/technical/pipwerk-replay.md` für dieses Paket, `docs/technical/pipwerk-marketdata.md`, `docs/technical/pipwerk-fetch-mt5.md`, Beschreibungen unter `contracts/`; `docs/user/pipwerk-replay.md` zu Testkonten, Datenbestand, Import, Beschaffung und Einrichtung von `pipwerk-fetch-mt5`; Glossar: Testkonto, Datenbestand historischer Kursdaten, Beschaffung, Quelle.

### Nicht-Umfang

- Testlauf, Backtest und Einzelschritt-Test (`wp03`, `wp04`); die Menüeinträge dafür und die Umschaltung der Betriebsart erscheinen erst mit diesen Paketen.
- Beschaffung beim Start eines Testlaufs (`wp03`)

### Umgesetzte Teile der Spezifikation

E3 bis E6 (E6 ohne Ergebnisse und gespeicherte Backtests), Abschnitt 5 vollständig (5.2 als Prüfung im Datenbestand), 6.2, Abschnitt 7 für die genannten Teile, 8.1 und 8.2 erster Punkt, 8.3 Kopfzeile ohne Betriebsart, Ansichten „Datenbestand“ und „Testkonten“, 8.4 Punkt 1 und Bedienerführung für diese Ansichten, Abschnitt 10 Punkte Datenbestand und Beschaffung, Abschnitt 11 für diese Teile, Abschnitt 12 wie im Umfang.

### Abhängigkeiten

keine

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung selbst prüfen:

1. Bedienbarkeit: Der Auftraggeber importiert ohne Anleitung, so wie im bestätigten Prototyp, eine CSV-Datei mit Kerzen aus dem Export von MetaTrader 5 mit Broker, Instrument, Zeiteinheit und Zeitzone. Der Datenbestand zeigt die Reihe mit Zeitraum und Lücken.
2. Der Import einer fehlerhaften Datei nennt die abgelehnten Zeilen mit Grund. Ein erneuter Import desselben Zeitraums ersetzt die Kerzen.
3. Voraussetzung: MetaTrader 5 auf einem Rechner des Auftraggebers, der die Testumgebung über das Netz erreicht. Nach Einrichtung von `pipwerk-fetch-mt5` auf diesem Rechner mit MetaTrader 5 nach der Anwenderdokumentation beschafft er von Hand Kerzen, Ticks und Angaben zu einem Instrument. Ein unbekanntes Symbol ergibt eine Meldung mit Grund.
4. Er legt ein Testkonto an, ändert, speichert und löscht es. Nach Löschen des Standard-Testkontos und Neustart ist es wieder da.
5. In den Fenstergrößen nach 8.4 Punkt 1 liegt nichts übereinander, alle Bereiche, Menü und Dialoge sind erreichbar. Alle Texte erscheinen in Deutsch und Englisch, jedes Feld hat eine Erklärung beim Zeigen.
6. Die Anwenderdokumentation beschreibt Testkonten, Datenbestand, Import, Beschaffung und die Einrichtung von `pipwerk-fetch-mt5` verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Das Prüfskript endet mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 10 für Datenbestand und Beschaffung und die Browsertests. Positive Testberichte beider Tester liegen vor.

## wp03 – Backtest

### Ziel

Der Anwender bereitet einen Testlauf vor und testet eine Strategie im Backtest über einen Testzeitraum mit Kontoentwicklung, Trades, abgelehnten Orders und Kennzahlen. Er speichert, vergleicht und löscht Backtests. `str-01` und `str-03` laufen im Backtest über den vorbelegten Testzeitraum, ohne die Strategie zu bearbeiten.

### Umfang

- Ausführung in der Bibliothek, `pipwerk_domain.execution` (E1, E7, 3.1 bis 3.5): Schnittstellen, Auswertung von Ausdrücken, `EMA`, `ATR`, `ZigZag` einschließlich Berechnung der in `wp01` beschriebenen Eigenschaften, eigene Indikatoren und Trends, Ablauf mit Auslösern und Verwaltungen, Auslöser `Manuell` zum Zeitpunkt nach 6.1, Orders und Regeln.
- Interne Abwicklung `pipwerk_replay.broker` (E2, Abschnitt 4).
- Testlauf (6.1) mit Strategien aus dem Objektverzeichnis oder als hochgeladene Datei (E6), Prüfung und Beschaffung der Kursdaten beim Start (5.4), Backtest im eigenen Prozess mit Fortschritt und Abbrechen (6.4), gespeicherte Backtests mit Liste, Löschen, Vergleich und Herunterladen der Kopie der Strategie (6.5).
- Web-API (Abschnitt 7) für diese Teile.
- Oberfläche: Menüeintrag Testlauf und Gespeicherte Backtests, Umschaltung der Betriebsart mit Backtest; Ansichten „Testlauf vorbereiten“ mit Zeitpunkt des Auslösers `Manuell`, „Kursdaten beim Start“, „Backtest“, „Gespeicherte Backtests“ ohne die Darstellung der getesteten Fassung (8.3, 8.4 Punkte 1, 4 bis 8); Kerzenchart, Kontokurve und Rückgang (8.2); Fußzeile mit dem vorbereiteten Testlauf.
- Sicherheit nach Abschnitt 11 für Ausdrücke, hochgeladene Strategien, Zahl gleichzeitiger Backtests und Umfang von Antworten.
- Tests nach Abschnitt 10: Bibliothek, Abwicklung, Testfälle im Backtest, Auslöser `Manuell` zum Beginn und zu einem eingegebenen Zeitpunkt; Backend, Oberfläche und Browsertests für dieses Paket.
- Dokumentation (Abschnitt 12): `docs/technical/pipwerk-domain.md` zu Ausführung, Indikatoren und `ZigZag`, `docs/technical/pipwerk-replay.md` für dieses Paket, `contracts/`; `docs/user/pipwerk-replay.md` zu Testlauf vorbereiten, Backtest, Ergebnis, Speichern und Vergleich, Ablehnungsgründen; Glossar: Testlauf, interne Abwicklung, Ablehnung.

### Nicht-Umfang

- Einzelschritt-Test, Darstellung der Strategie und getestete Fassung nur lesend (`wp04`)
- Strategien bearbeiten (Abschnitt 8.2)

### Umgesetzte Teile der Spezifikation

Abschnitt 1, E1, E2, E6 (Ergebnisse, gespeicherte Backtests, Lesen von Strategien), E7, 3.1 bis 3.5, Abschnitt 4, 6.1, 6.4, 6.5 ohne Darstellung der getesteten Fassung, Abschnitt 7 für diese Teile, 8.1, 8.2 Punkte 1, 3 und 4 (Backtest), 8.3 Ansichten wie im Umfang, 8.4 Punkte 1, 4 bis 8, Abschnitt 9, Abschnitt 10 Punkte Bibliothek, Abwicklung und Testfälle ohne Einzelschritt-Test, Abschnitt 11 für diese Teile, Abschnitt 12 wie im Umfang, Abschnitt 13 (H7 bis H10, H12).

### Abhängigkeiten

- `wp01`, `wp02`
- Referenzwerte aus MetaTrader 5 (3.3, Abschnitt 10): eine Kursreihe mit den Werten von `EMA`, `ATR` und `ZigZag` je Kerze, exportiert vom Auftraggeber aus seiner Installation von MetaTrader 5. Kein Entwickler und kein Tester hat MetaTrader 5. Welche Reihe, Zeiteinheit und Einstellungen, legt der Entwicklungsleiter im Auftrag fest und erbittet die Dateien mit `question` über den Projektleiter. Die übrigen Aufträge des Pakets laufen bis dahin weiter.

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung selbst prüfen:

1. Bedienbarkeit: Der Auftraggeber testet ohne Anleitung, so wie im bestätigten Prototyp, `str-03` im Backtest über den vorbelegten Testzeitraum mit dem Standard-Testkonto, ohne die Strategie zu bearbeiten. Fehlende Kursdaten werden beim Start aus MetaTrader 5 beschafft.
2. Ebenso `str-01`, einschließlich der benötigten Ticks.
3. Das Ergebnis zeigt Kennzahlen, Kontoentwicklung mit Rückgang, Chart, Trades mit Gewinn nach Spread, Kommission und Swap, Kosten und Grund der Schließung, und abgelehnte Orders mit Grund in Händlersprache auf einem eigenen Reiter. Ein Klick auf einen Trade zeigt seine Stelle im Chart.
4. Eine Strategie mit Auslöser `Manuell` handelt zum Beginn des Testzeitraums beziehungsweise zu einem eingegebenen Zeitpunkt. Ein Zeitpunkt außerhalb des Testzeitraums verhindert den Start mit Meldung.
5. Lassen sich fehlende Kursdaten nicht beschaffen, startet der Testlauf nicht; die Meldung nennt Instrument, Art, Zeitraum und Grund. Eine Strategie mit Fehler der Konsistenzprüfung oder ein Strategieparameter ohne Wert verhindert den Start mit Meldung.
6. Änderungen am Testkonto in der Vorbereitung gelten nur für den Testlauf; gespeichert werden sie nur mit „Änderung im Testkonto speichern“ oder „Als neues Testkonto speichern“. Geänderte Angaben zum Instrument werden nie gespeichert.
7. Zwei Backtests desselben Testlaufs ergeben dieselben Trades. Ein Backtest lässt sich abbrechen.
8. Gespeicherte Backtests erscheinen in der Liste, lassen sich nach Rückfrage löschen und zu zweit oder mehr mit Kennzahlen und übereinandergelegten Kontokurven vergleichen. Die Kopie der Strategie lässt sich herunterladen und in pipwerk Studio öffnen.
9. In den Fenstergrößen nach 8.4 Punkt 1 liegt nichts übereinander, alle Bereiche sind erreichbar. Alle Texte erscheinen in Deutsch und Englisch.
10. Die Anwenderdokumentation beschreibt Vorbereitung, Backtest, Ergebnis, Speichern, Vergleich und die Ablehnungsgründe verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Das Prüfskript endet mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 10 für dieses Paket, `EMA`, `ATR` und `ZigZag` gegen die Referenzwerte aus MetaTrader 5, `str-01` und `str-03` mit erwarteten Trades, und die Browsertests. Positive Testberichte beider Tester liegen vor.

## wp04 – Einzelschritt-Test

### Ziel

Der Anwender prüft den Ablauf einer Strategie im Einzelschritt-Test: Schritt für Schritt, mit Haltepunkten und Sprung zur nächsten handelnden Stelle, mit den Werten aller Objekte. Die getestete Fassung eines gespeicherten Backtests ist in der Darstellung des Strategiedesigners zu sehen. `str-01` und `str-03` lassen sich im Einzelschritt-Test prüfen.

### Umfang

- Darstellung der Strategie als gemeinsame Bausteine in `packages/ui-components`, verwendet von pipwerk Studio und pipwerk replay, in pipwerk replay nur lesend (8.2 Punkt 2).
- Einzelschritt-Sitzung im Backend mit allen Befehlen, Zustand nach jedem Befehl und Frist (E8, 6.3); Web-API dafür (Abschnitt 7).
- Oberfläche: Betriebsart Einzelschritt-Test in der Umschaltung und in „Testlauf vorbereiten“; Ansicht „Einzelschritt-Test“ (8.3, 8.4 Punkte 1 bis 4 und 9); getestete Fassung in „Gespeicherte Backtests“ nur lesend (6.5).
- Sicherheit nach Abschnitt 11 für die Zahl gleichzeitiger Sitzungen.
- Tests nach Abschnitt 10: Einzelschritt-Test ohne „Manuell auslösen“ ergibt dieselben Trades wie der Backtest; „Manuell auslösen“; Backend, Oberfläche und Browsertests für dieses Paket, Browsertests von pipwerk Studio nach dem Verlegen der Bausteine.
- Dokumentation (Abschnitt 12): `docs/technical/pipwerk-studio.md` (gemeinsame Bausteine), `docs/technical/pipwerk-replay.md` für dieses Paket; `docs/user/pipwerk-replay.md` zum Einzelschritt-Test; Glossar: handelnde Stelle, Haltepunkt.

### Nicht-Umfang

- Zurückgehen um einzelne Schritte (E8)
- Bearbeiten der Strategie in pipwerk replay (8.2)

### Umgesetzte Teile der Spezifikation

E8, 6.3, 6.5 Darstellung der getesteten Fassung, Abschnitt 7 Einzelschritt-Sitzungen, 8.2 Punkt 2 und Punkt 4 (Einzelschritt-Test), 8.3 Ansicht „Einzelschritt-Test“ und Betriebsart, 8.4 Punkte 1 bis 4 und 9, Abschnitt 10 Punkt „Testfälle“ für den Einzelschritt-Test und „Manuell auslösen“, Abschnitt 11 Zahl gleichzeitiger Sitzungen, Abschnitt 12 wie im Umfang.

### Abhängigkeiten

`wp03`, `strategiedesign/wp03`

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung selbst prüfen:

1. Bedienbarkeit: Der Auftraggeber prüft ohne Anleitung, so wie im bestätigten Prototyp, `str-03` im Einzelschritt-Test bis zur ersten Eröffnung einer Position und sieht dabei die Werte der Objekte und den Unterschied zum vorigen Schritt.
2. Ebenso `str-01` bis zu einer abgelehnten Stop-Order, in einem Testlauf, in dem eine solche Ablehnung eintritt; diesen Testlauf nennt der Entwicklungsleiter zur Abnahme; der Grund steht am Element, in der Eigenschaftenansicht, im Protokoll und als rotes Kreuz im Chart, die Auswertung trägt vorab ihre Marke.
3. Start hält an der ersten handelnden Stelle. „Nächste handelnde Stelle“ hält auch an einem Haltepunkt; Haltepunkte lassen sich an jedem Element setzen und entfernen. „Einzelschritt“ geht am Ende einer Auswertung zur nächsten.
4. „Zum Testbeginn“ zeigt die ersten Auswertungen, in denen Indikatoren noch keine Werte haben; Haltepunkte bleiben.
5. Fallen Verwaltung und Hauptablauf auf denselben Zeitpunkt, zeigt die Leiste die Reihenfolge, zuerst die Verwaltung.
6. Bei einer Strategie mit Auslöser `Manuell` erscheint er als eigene Auswertung und im Chart mit eigenem Zeichen; „Manuell auslösen“ ist jederzeit bedienbar, mitten in einer Auswertung mit Meldung.
7. Einzelschritt-Test bis zum Ende und Backtest desselben Testlaufs ergeben dieselben Trades, wenn „Manuell auslösen“ nicht verwendet wird.
8. Die getestete Fassung eines gespeicherten Backtests ist in der Darstellung des Strategiedesigners zu sehen und lässt sich nicht bearbeiten.
9. pipwerk Studio arbeitet nach dem Verlegen der Bausteine wie vorher.
10. In den Fenstergrößen nach 8.4 Punkt 1 liegt nichts übereinander, alle Bereiche sind erreichbar, auf dem hohen Tablet bleibt der Chart oben.
11. Die Anwenderdokumentation beschreibt den Einzelschritt-Test verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von pipwerk replay und pipwerk Studio enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 10 für dieses Paket und die Browsertests beider Oberflächen. Positive Testberichte beider Tester liegen vor.

## Abdeckung der Spezifikation

| Teil der Spezifikation | Paket |
|---|---|
| 1 Gegenstand, Nachweis mit `str-01` und `str-03` | `wp03` (Backtest), `wp04` (Einzelschritt-Test) |
| 2 E1, E2, E7 | `wp03` |
| 2 E3 bis E5 | `wp02` |
| 2 E6 | `wp02` (Testkonten), `wp03` (Ergebnisse, gespeicherte Backtests, Strategien) |
| 2 E8 | `wp04` |
| 3.1 bis 3.5 | `wp03`; Typbeschreibung des `ZigZag` (3.3) `wp01` |
| 3.6 | `wp01` |
| 4 | `wp03` |
| 5.1 bis 5.4 | `wp02`; Beschaffung beim Start eines Testlaufs `wp03` |
| 6.1, 6.4 | `wp03` |
| 6.2 | `wp02` |
| 6.3 | `wp04` |
| 6.5 | `wp03`; Darstellung der getesteten Fassung `wp04` |
| 7 | `wp02`, `wp03`, `wp04` je nach Teil |
| 8.1 | `wp02`, `wp03`, `wp04` je nach Ansicht |
| 8.2 Punkt 1 | `wp02` |
| 8.2 Punkt 2 | `wp04` |
| 8.2 Punkte 3, 4 | `wp03`; Einzelschritt-Test `wp04` |
| 8.3 Datenbestand, Testkonten | `wp02` |
| 8.3 Testlauf vorbereiten, Kursdaten beim Start, Backtest, Gespeicherte Backtests | `wp03` |
| 8.3 Einzelschritt-Test | `wp04` |
| 8.4 Punkt 1 | `wp02`, `wp03`, `wp04` je nach Ansicht |
| 8.4 Punkte 2, 3, 9 | `wp04` |
| 8.4 Punkt 4 | `wp03` (Ergebnis), `wp04` (Einzelschritt-Test) |
| 8.4 Punkte 5 bis 8 | `wp03` |
| 9 | `wp01` (Testfalldokument `str-01`), `wp03` (Backtest), `wp04` (Einzelschritt-Test) |
| 10 Bibliothek, Abwicklung | `wp03` |
| 10 Datenbestand, Beschaffung | `wp02` |
| 10 Testfälle | `wp01` (Befund), `wp03` (Backtest, `Manuell` zum Beginn und Zeitpunkt), `wp04` (Einzelschritt-Test, „Manuell auslösen“) |
| 10 Backend, Oberfläche, Browsertests | `wp02`, `wp03`, `wp04` |
| 11 | `wp02`, `wp03`, `wp04` je nach Teil |
| 12 | `wp01` bis `wp04` je nach Teil |
| 13 | `wp01` (Entscheidungen 1 und 2 in der Bibliothek), `wp03` (H7 bis H10, H12), `wp04` (Entscheidung 1 im Einzelschritt-Test); H11 ohne Umsetzung |

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-21 | Plan angelegt: vier Pakete. `wp02` ohne Abhängigkeit, `wp01` nach `strategiedesign/wp02`, `wp03` nach `wp01` und `wp02`, `wp04` nach `wp03` und `strategiedesign/wp03`. |
| 2026-10-21 | Nach dem Prüfbericht [plan-1.md](reviews/plan-1.md): B1 Typbeschreibung des `ZigZag` mit den Eigenschaften für `str-01` in `wp01` (Umfang, umgesetzte Teile, Abdeckung), Berechnung bleibt in `wp03`. Hinweise: 1 Kriterium 1 zur Bedienbarkeit in `wp01` (übrige Kriterien um eins weitergezählt); 2 Testlauf mit Ablehnung in `wp04` Kriterium 2; 5 Voraussetzung in `wp02` Kriterium 3. Verworfen: 3 (`wp01` ändert in pipwerk Studio nur Texte, keine Bausteine, die `strategiedesign/wp03` umbaut), 4 (der Weg ist beschrieben, den Zeitpunkt bestimmt der Entwicklungsleiter), 6 (Testdetail). |
| 2026-10-21 | Hinweise aus [plan-2.md](reviews/plan-2.md) (bestanden), ohne weitere Prüfung: 1 Formulierung der Berechnung in `wp03`; 2 Eigenschaften des `ZigZag` im Ziel von `wp01`. Verworfen: 3 (pipwerk Studio führt Strategien nicht aus; Kriterium 1 betrifft nur die Konsistenzprüfung). |
