# Arbeitspaketplan Vorhaben backtest

## Status

- status: `draft`
- stand: 2026-10-23
- komponenten: `packages/domain-core`, `packages/market-data` (neu), `packages/ui-components`, `components/pipwerk-replay` (neu, bisher `components/pipwerk-backtest`), `components/pipwerk-fetch-mt5` (neu), `components/pipwerk-studio`, `contracts/`
- grundlage: [specification.md](specification.md), bestätigt vom Auftraggeber im Chat am 2026-10-21 ([Präsentation](presentations/specification-1.html))
- prüfung: Durchlauf 1 [plan-1.md](reviews/plan-1.md) nicht bestanden (B1), eingearbeitet; Durchlauf 2 [plan-2.md](reviews/plan-2.md), Nachprüfung, bestanden, Hinweise ohne weitere Prüfung eingearbeitet; Änderung Beginn von `wp01`: Durchlauf 3 [plan-3.md](reviews/plan-3.md) bestanden, Hinweise ohne weitere Prüfung eingearbeitet; Änderung nach der Abnahme von `wp02`: Durchlauf 4 [plan-4.md](reviews/plan-4.md) bestanden, Hinweise ohne weitere Prüfung eingearbeitet; Änderung nach der Abnahme von `wp02`, Versuch 2: Durchlauf 5 [plan-5.md](reviews/plan-5.md) bestanden, Hinweise eingearbeitet; Kriterium 9 nach B1 aus `specification-4.md` nachgeprüft in [specification-5.md](reviews/specification-5.md), bestanden, Hinweise eingearbeitet

## Übersicht

| Paket | Titel | hängt ab von | Stand |
|---|---|---|---|
| `wp01` | Auslöser „Manuell“ in Bibliothek und pipwerk Studio | `strategiedesign/wp02`, Beginn ohne Wartezeit, Übernahme danach | `open` |
| `wp02` | Datenbestand und Testkonten | – | `open` |
| `wp03` | Backtest | `wp01`, `wp02`, Referenzwerte aus MetaTrader 5 | `open` |
| `wp04` | Einzelschritt-Test | `wp03`, `strategiedesign/wp03` | `open` |

Die Pakete folgen dem, was der Auftraggeber selbst prüfen kann. `wp02` braucht nichts aus `strategiedesign` und beginnt sofort: pipwerk replay mit Datenbestand, Import und Testkonten, dazu das Programm `pipwerk-fetch-mt5` für den Abruf außerhalb von pipwerk replay. `wp01` stellt Bibliothek und pipwerk Studio auf die Entscheidungen vom 2026-10-21 um und braucht dafür das Format 2.0 aus `strategiedesign/wp02`. Es beginnt trotzdem sofort, auf dem von der QA geprüften Stand von `strategiedesign/wp02`, und wird erst nach diesem Paket übernommen (Abschnitt „Abhängigkeiten“ von `wp01`). `wp03` bringt die Ausführung der Strategie und den Backtest; es endet mit dem Nachweis, dass `str-01` und `str-03` im Backtest laufen. `wp04` bringt den Einzelschritt-Test und dafür die Darstellung der Strategie als gemeinsamen Baustein.

`wp04` hängt auch von `strategiedesign/wp03` ab. Grund: Es verlegt Zeichenfläche, Elemente, Verbindungen und Eigenschaftenansicht von pipwerk Studio nach `packages/ui-components` (Spezifikation 8.2). `strategiedesign/wp03` ändert dieselben Teile; beide gleichzeitig ergäben zwei Fassungen derselben Bausteine.

Pakete aus `strategiedesign` meldet der Entwicklungsleiter dort mit `integrated` an den Projektleiter. Der Projektleiter stößt danach die Pakete dieses Plans an, deren Abhängigkeiten damit erfüllt sind. Ausgenommen ist `wp01`: Es beginnt mit der Meldung `implement` des Projektleiters, ohne die Übernahme von `strategiedesign/wp02` abzuwarten.

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

`strategiedesign/wp02` (Format 2.0, Oberfläche von pipwerk Studio). Abweichend von der Regel, dass ein Paket erst nach Abnahme und Übernahme seiner Abhängigkeiten beginnt, gilt für `wp01`:

1. Beginn sofort. Der Arbeitszweig `backtest/wp01` wird nicht von `main` angelegt, sondern von Commit `2cac35b4a45e9d5499c92e3762670faf1021c821` auf `strategiedesign/wp02`. Diesen Commit hat die QA in Durchlauf 4 geprüft und bestanden. Die Aufträge und alle weiteren Zweige des Pakets setzen auf dem Arbeitszweig auf.
2. Neue Commits auf `strategiedesign/wp02` aus dessen Abnahme führt der Entwicklungsleiter mit einem Merge-Commit in `backtest/wp01` zusammen, spätestens bevor die QA `wp01` prüft. Ändert ein solcher Merge-Commit Code, prüfen Tester und QA danach erneut nach den Regeln von Phase 4.
3. Der Commit von `wp01`, der in die Abnahme geht, enthält den neuesten Commit von `strategiedesign/wp02` mit Änderungen an der Software.
4. Übernahme in `main` erst nach der Übernahme von `strategiedesign/wp02`. Der Projektleiter meldet `integrate` für `wp01` erst, wenn er die Meldung `integrated` zu `strategiedesign/wp02` erhalten hat; ist `wp01` vorher abgenommen, wartet es bis dahin. Weicht die Software im übernommenen Stand von `strategiedesign/wp02` von der im abgenommenen Commit von `wp01` enthaltenen ab, führt der Entwicklungsleiter `origin/main` in `backtest/wp01` zusammen, lässt Tester und QA erneut prüfen und das Paket erneut abnehmen. Übernommen wird der neu abgenommene Commit.

Begründung: Der Auftraggeber will keine Wartezeit, die Abnahme von `strategiedesign/wp02` kann sich über mehrere Runden ziehen. Umfang und Abnahmekriterien bleiben unverändert.

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

pipwerk replay läuft als eigene Komponente. Der Anwender holt Kursdaten mit `pipwerk-fetch-mt5` aus MetaTrader 5, importiert sie und andere Dateien, auch mehrere auf einmal, sieht den Datenbestand historischer Kursdaten und verwaltet Testkonten.

Änderung nach der Abnahme, Versuch 1 ([Abnahmebericht](wp02/acceptance/1.md), Mängel M1 bis M4): Ansicht „Datenbestand“ und Import nach Spezifikation 5.3 und 8.3, `pipwerk-fetch-mt5` als Programm ohne Server und Port nach E5 und 5.4, kein Abruf aus pipwerk replay. Das Paket wird auf seinem Arbeitszweig `backtest/wp02` weitergeführt.

Änderung nach der Abnahme, Versuch 2 ([Abnahmebericht](wp02/acceptance/2.md), Mängel M1, M2, M3, M5, M6): Anwenderdokumentation zu `uv` (M1), technische Dokumentation von `pipwerk-fetch-mt5` (M2), Import beliebig vieler Dateien mit Stand und Abbrechen (M3, Spezifikation 5.3), Löschen (M5, 5.5), Zeiten ohne Handel keine Lücken (M6, 5.2). M4 gehört nicht dazu (Abschnitt „Offen“). Weiter auf `backtest/wp02`.

### Umfang

- Komponente `components/pipwerk-replay` durch Umbenennen von `components/pipwerk-backtest` mit allen Verweisen; Backend mit Startkonfiguration, eigener Datenbank, Alembic und Prüfung des Kopfs `Host` wie pipwerk Studio (E3, E6); Prüfskript und Testumgebungsskript.
- Bibliothek `packages/market-data`: Speichermodell, Import JSON und CSV mit Zeitzone, Prüfung auf Vollständigkeit mit Lücken nach 5.2 einschließlich der Tage ohne Handel aus der Startkonfiguration von pipwerk replay, Löschen (5.5), Lesen (E4, 5.1 bis 5.3, 5.5); Schema `contracts/market-data/v1/`.
- Backend und Oberfläche von pipwerk replay: Import beliebig vieler Dateien, je Datei eine Anfrage, mit Stand und Abbrechen (5.3); Löschen mit Rückfrage und Ablehnung während eines Imports (5.5).
- `components/pipwerk-fetch-mt5` als Programm, das der Anwender auf dem Rechner von MetaTrader 5 aufruft, mit Zuordnungstabelle und Zeitzone, ohne Server und Port (E5, 5.4). Eine HTTP-Schnittstelle von `pipwerk-fetch-mt5` und ihre Beschreibung unter `contracts/` entfallen, ebenso Adresse und Schlüssel der Quelle in der Startkonfiguration von pipwerk replay.
- Testkonten mit Standard-Testkonto (6.2).
- Web-API (Abschnitt 7) für Datenbestand, Testkonten und Einstellungen, darunter der Broker für Testläufe (5.1).
- Oberfläche nach dem bestätigten Prototyp (8.1, 8.2): Kopfzeile mit Menü, „Über pipwerk replay“, Sprachwahl, Fußzeile mit Stand und Erreichbarkeit des Backends; Ansichten „Datenbestand“ mit Dialog „Datei importieren“ und „Testkonten“ (8.3); Fenstergrößen nach 8.4 Punkt 1 für diese Ansichten.
- Sicherheit nach Abschnitt 11 für Import und `pipwerk-fetch-mt5`.
- Tests nach Abschnitt 10, Punkte Datenbestand und Abruf; Backend, Oberfläche und Browsertests für dieses Paket.
- Dokumentation (Abschnitt 12): `docs/technical/pipwerk-replay.md` für dieses Paket, `docs/technical/pipwerk-marketdata.md`, `docs/technical/pipwerk-fetch-mt5.md` nach M2, Beschreibungen unter `contracts/`; `docs/user/pipwerk-replay.md` zu Testkonten, Datenbestand, Import beliebig vieler Dateien, Lücken, Löschen, Einrichtung von `uv` nach M1, Einrichtung und Aufruf von `pipwerk-fetch-mt5` und Import seiner Dateien; Glossar: Testkonto, Datenbestand historischer Kursdaten, Abruf, Quelle.

### Nicht-Umfang

- Testlauf, Backtest und Einzelschritt-Test (`wp03`, `wp04`); die Menüeinträge dafür und die Umschaltung der Betriebsart erscheinen erst mit diesen Paketen.
- Abruf aus pipwerk replay und Austausch über pipwerk relay (5.4)
- Import großer Dateien über die Grenze je Datei hinaus (M4, Abschnitt „Offen“)

### Umgesetzte Teile der Spezifikation

E3 bis E6 (E6 ohne Ergebnisse und gespeicherte Backtests), Abschnitt 5 (5.2 als Prüfung im Datenbestand, 5.4 ohne die Meldung beim Start eines Testlaufs, 5.5 ohne die Sperre während eines Testlaufs und ohne den Chart gespeicherter Backtests), 6.2, Abschnitt 7 für die genannten Teile, 8.1 und 8.2 erster Punkt, 8.3 Kopfzeile ohne Betriebsart, Ansichten „Datenbestand“ und „Testkonten“, 8.4 Punkt 1 und Bedienerführung für diese Ansichten, Abschnitt 10 Punkte Datenbestand und Abruf, Abschnitt 11 für diese Teile, Abschnitt 12 wie im Umfang.

### Abhängigkeiten

keine

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung selbst prüfen:

1. Bedienbarkeit: Der Auftraggeber importiert ohne Anleitung und ohne Hinweistexte, so wie im bestätigten Prototyp, mehrere CSV-Dateien mit Kerzen aus dem Export von MetaTrader 5 in einem Vorgang, mit Broker und Zeitzone einmal für alle und Instrument und Zeiteinheit je Datei. Die Tabelle des Datenbestands zeigt die Reihen mit Zeitraum und Lücken; ein Klick auf eine Reihe zeigt ihre Lücken und die Kontraktdaten. Filter und Seiten der Tabelle und das Auswahlfeld „Broker für Testläufe“ sind ohne Erklärung bedienbar.
2. Der Import einer fehlerhaften Datei nennt die abgelehnten Zeilen mit Grund, die übrigen Dateien des Vorgangs werden übernommen. Ein erneuter Import desselben Zeitraums ersetzt die Kerzen.
3. Voraussetzung: MetaTrader 5 auf einem Rechner des Auftraggebers. Nach Einrichtung von `pipwerk-fetch-mt5` auf diesem Rechner nach der Anwenderdokumentation holt er mit einem Aufruf Kerzen, Ticks und Kontraktdaten zu einem Instrument als Dateien in ein Verzeichnis und importiert sie in einem Vorgang. Der Datenbestand nennt als Broker den Namen des Handelsservers. Ein unbekanntes Symbol ergibt beim Aufruf eine Meldung mit Grund. `pipwerk-fetch-mt5` öffnet keinen Port.
4. Er legt ein Testkonto an, ändert, speichert und löscht es. Nach Löschen des Standard-Testkontos und Neustart ist es wieder da.
5. In den Fenstergrößen nach 8.4 Punkt 1 liegt nichts übereinander, alle Bereiche, Menü und Dialoge sind erreichbar. Alle Texte erscheinen in Deutsch und Englisch, mit kurzen, sachlichen Überschriften, jedes Feld hat eine Erklärung beim Zeigen.
6. Die Anwenderdokumentation beschreibt Testkonten, Datenbestand, Import beliebig vieler Dateien, Lücken, Löschen, Einrichtung und Aufruf von `pipwerk-fetch-mt5` und den Import seiner Dateien verständlich und vollständig, nur mit den Schritten des Anwenders. Zu `uv` sagt sie in einem Satz, was es ist und wozu es gebraucht wird, und nennt die Installation unter Windows mit Befehl und Prüfung (`uv --version`) (M1).
7. Er wählt viele Dateien auf einmal, zusammen größer als die Grenze je Datei (die Anwenderdokumentation nennt sie), und klickt einmal auf „Importieren“. Eine Meldung zur Größe oder Zahl der Dateien zusammen erscheint nicht. Der Dialog zeigt den Stand je Datei; nach „Abbrechen“ bleiben übernommene Dateien übernommen, die übrigen sind als „nicht importiert“ genannt (M3).
8. In den Einzelheiten einer Reihe löscht er nach Rückfrage die ganze Reihe, einen Zeitraum und die Kontraktdaten. Bei einem Filter nach Broker löscht er alle Daten dieses Brokers; der Broker kommt danach nicht mehr vor und ist nicht mehr als „Broker für Testläufe“ gewählt. Ein gelöschter Zeitraum innerhalb einer Reihe, der Handelszeit enthält, erscheint als Lücke (M5).
9. Weihnachten und Silvester/Neujahr erscheinen nicht als Lücken, weder innerhalb einer importierten CSV-Datei noch zwischen zwei Dateien, von denen eine am 24. Dezember endet und die andere am 26. Dezember beginnt, ebenso 31. Dezember und 2. Januar. Ein früher Handelsschluss am letzten Tag einer Datei ist keine Lücke. Ein nicht importierter Handelstag zwischen zwei Dateien erscheint als Lücke (M6).
10. `docs/technical/pipwerk-fetch-mt5.md` nennt vollständig, was auf dem Rechner von MetaTrader 5 installiert wird und läuft, nach Spezifikation Abschnitt 12 (M2).

Technische Nachweise im Prüfbericht der QA: Das Prüfskript endet mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 10 für Datenbestand und Abruf und die Browsertests. Positive Testberichte beider Tester liegen vor.

## wp03 – Backtest

### Ziel

Der Anwender bereitet einen Testlauf vor und testet eine Strategie im Backtest über einen Testzeitraum mit Kontoentwicklung, Trades, abgelehnten Orders und Kennzahlen. Er speichert, vergleicht und löscht Backtests. `str-01` und `str-03` laufen im Backtest über den vorbelegten Testzeitraum, ohne die Strategie zu bearbeiten.

### Umfang

- Ausführung in der Bibliothek, `pipwerk_domain.execution` (E1, E7, 3.1 bis 3.5): Schnittstellen, Auswertung von Ausdrücken, `EMA`, `ATR`, `ZigZag` einschließlich Berechnung der in `wp01` beschriebenen Eigenschaften, eigene Indikatoren und Trends, Ablauf mit Auslösern und Verwaltungen, Auslöser `Manuell` zum Zeitpunkt nach 6.1, Orders und Regeln.
- Interne Abwicklung `pipwerk_replay.broker` (E2, Abschnitt 4).
- Ablehnung des Löschens, solange ein Backtest läuft, und Chart gespeicherter Backtests mit gelöschten Kursdaten (5.5).
- Testlauf (6.1) mit Strategien aus dem Objektverzeichnis oder als hochgeladene Datei (E6), Prüfung der Kursdaten beim Start mit Meldung nach 5.4, ohne Abruf, Broker für Testläufe in der Vorbereitung änderbar (5.1), Backtest im eigenen Prozess mit Fortschritt und Abbrechen (6.4), gespeicherte Backtests mit Liste, Löschen, Vergleich und Herunterladen der Kopie der Strategie (6.5).
- Web-API (Abschnitt 7) für diese Teile.
- Oberfläche: Menüeintrag Testlauf und Gespeicherte Backtests, Umschaltung der Betriebsart mit Backtest; Ansichten „Testlauf vorbereiten“ mit Zeitpunkt des Auslösers `Manuell`, „Kursdaten beim Start“, „Backtest“, „Gespeicherte Backtests“ ohne die Darstellung der getesteten Fassung (8.3, 8.4 Punkte 1, 4 bis 8); Kerzenchart, Kontokurve und Rückgang (8.2); Fußzeile mit dem vorbereiteten Testlauf.
- Sicherheit nach Abschnitt 11 für Ausdrücke, hochgeladene Strategien, Zahl gleichzeitiger Backtests und Umfang von Antworten.
- Tests nach Abschnitt 10: Bibliothek, Abwicklung, Testfälle im Backtest, Auslöser `Manuell` zum Beginn und zu einem eingegebenen Zeitpunkt; Backend, Oberfläche und Browsertests für dieses Paket.
- Dokumentation (Abschnitt 12): `docs/technical/pipwerk-domain.md` zu Ausführung, Indikatoren und `ZigZag`, `docs/technical/pipwerk-replay.md` für dieses Paket, `contracts/`; `docs/user/pipwerk-replay.md` zu Testlauf vorbereiten, Backtest, Ergebnis, Speichern und Vergleich, Ablehnungsgründen; Glossar: Testlauf, interne Abwicklung, Ablehnung.

### Nicht-Umfang

- Einzelschritt-Test, Darstellung der Strategie und getestete Fassung nur lesend (`wp04`)
- Strategien bearbeiten (Abschnitt 8.2)

### Umgesetzte Teile der Spezifikation

Abschnitt 1, E1, E2, E6 (Ergebnisse, gespeicherte Backtests, Lesen von Strategien), E7, 3.1 bis 3.5, Abschnitt 4, 5.5 Sperre während eines Backtests und Chart gespeicherter Backtests, 6.1, 6.4, 6.5 ohne Darstellung der getesteten Fassung, Abschnitt 7 für diese Teile, 8.1, 8.2 Punkte 1, 3 und 4 (Backtest), 8.3 Ansichten wie im Umfang, 8.4 Punkte 1, 4 bis 8, Abschnitt 9, Abschnitt 10 Punkte Bibliothek, Abwicklung und Testfälle ohne Einzelschritt-Test, Abschnitt 11 für diese Teile, Abschnitt 12 wie im Umfang, Abschnitt 13 (H7 bis H10, H12).

### Abhängigkeiten

- `wp01`, `wp02`
- Referenzwerte aus MetaTrader 5 (3.3, Abschnitt 10): eine Kursreihe mit den Werten von `EMA`, `ATR` und `ZigZag` je Kerze, exportiert vom Auftraggeber aus seiner Installation von MetaTrader 5. Kein Entwickler und kein Tester hat MetaTrader 5. Welche Reihe, Zeiteinheit und Einstellungen, legt der Entwicklungsleiter im Auftrag fest und erbittet die Dateien mit `question` über den Projektleiter. Die übrigen Aufträge des Pakets laufen bis dahin weiter.

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung selbst prüfen:

1. Bedienbarkeit: Der Auftraggeber testet ohne Anleitung, so wie im bestätigten Prototyp, `str-03` im Backtest über den vorbelegten Testzeitraum mit dem Standard-Testkonto, ohne die Strategie zu bearbeiten. Die Kursdaten hat er vorher mit `pipwerk-fetch-mt5` geholt und importiert (`wp02`).
2. Ebenso `str-01`, einschließlich der benötigten Ticks.
3. Das Ergebnis zeigt Kennzahlen, Kontoentwicklung mit Rückgang, Chart, Trades mit Gewinn nach Spread, Kommission und Swap, Kosten und Grund der Schließung, und abgelehnte Orders mit Grund in Händlersprache auf einem eigenen Reiter. Ein Klick auf einen Trade zeigt seine Stelle im Chart.
4. Eine Strategie mit Auslöser `Manuell` handelt zum Beginn des Testzeitraums beziehungsweise zu einem eingegebenen Zeitpunkt. Ein Zeitpunkt außerhalb des Testzeitraums verhindert den Start mit Meldung.
5. Fehlen Kursdaten, startet der Testlauf nicht; die Meldung nennt Instrument, Art und Zeitraum, den Weg über `pipwerk-fetch-mt5` und den Import und führt zur Ansicht „Datenbestand“. Eine Strategie mit Fehler der Konsistenzprüfung oder ein Strategieparameter ohne Wert verhindert den Start mit Meldung.
6. Änderungen am Testkonto in der Vorbereitung gelten nur für den Testlauf; gespeichert werden sie nur mit „Änderung im Testkonto speichern“ oder „Als neues Testkonto speichern“. Geänderte Angaben zum Instrument werden nie gespeichert.
7. Zwei Backtests desselben Testlaufs ergeben dieselben Trades. Ein Backtest lässt sich abbrechen. Während ein Backtest läuft, wird Löschen im Datenbestand mit Meldung abgelehnt.
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
- Ablehnung des Löschens, solange eine Einzelschritt-Sitzung besteht (5.5).
- Tests nach Abschnitt 10: Einzelschritt-Test ohne „Manuell auslösen“ ergibt dieselben Trades wie der Backtest; „Manuell auslösen“; Backend, Oberfläche und Browsertests für dieses Paket, Browsertests von pipwerk Studio nach dem Verlegen der Bausteine.
- Dokumentation (Abschnitt 12): `docs/technical/pipwerk-studio.md` (gemeinsame Bausteine), `docs/technical/pipwerk-replay.md` für dieses Paket; `docs/user/pipwerk-replay.md` zum Einzelschritt-Test; Glossar: handelnde Stelle, Haltepunkt.

### Nicht-Umfang

- Zurückgehen um einzelne Schritte (E8)
- Bearbeiten der Strategie in pipwerk replay (8.2)

### Umgesetzte Teile der Spezifikation

E8, 5.5 Sperre während einer Einzelschritt-Sitzung, 6.3, 6.5 Darstellung der getesteten Fassung, Abschnitt 7 Einzelschritt-Sitzungen, 8.2 Punkt 2 und Punkt 4 (Einzelschritt-Test), 8.3 Ansicht „Einzelschritt-Test“ und Betriebsart, 8.4 Punkte 1 bis 4 und 9, Abschnitt 10 Punkt „Testfälle“ für den Einzelschritt-Test und „Manuell auslösen“, Abschnitt 11 Zahl gleichzeitiger Sitzungen, Abschnitt 12 wie im Umfang.

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
| 5.1 bis 5.4 | `wp02`; Broker in der Vorbereitung eines Testlaufs (5.1) und Prüfung und Meldung beim Start eines Testlaufs (5.4, letzter Absatz) `wp03` |
| 5.5 | `wp02`; Sperre während eines Backtests und Chart gespeicherter Backtests `wp03`, Sperre während einer Einzelschritt-Sitzung `wp04` |
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
| 10 Datenbestand, Abruf | `wp02` |
| 10 Testfälle | `wp01` (Befund), `wp03` (Backtest, `Manuell` zum Beginn und Zeitpunkt), `wp04` (Einzelschritt-Test, „Manuell auslösen“) |
| 10 Backend, Oberfläche, Browsertests | `wp02`, `wp03`, `wp04` |
| 11 | `wp02`, `wp03`, `wp04` je nach Teil |
| 12 | `wp01` bis `wp04` je nach Teil |
| 13 | `wp01` (Entscheidungen 1 und 2 in der Bibliothek), `wp02` (Hinweise aus `requirements-7.md` und `requirements-8.md` mit 5.1 bis 5.5), `wp03` (H7 bis H10, H12), `wp04` (Entscheidung 1 im Einzelschritt-Test); H11 ohne Umsetzung |

## Offen

- Import großer Dateien (req-system-026, Abnahmebericht `wp02`, Versuch 2, M4): Tick-Dateien von mehreren GB, Größe einer Datei nur durch den Speicherplatz begrenzt, Fortschritt und Abbrechen innerhalb einer Datei, Lesen großer Tick-Reihen im Backtest. Vom Auftraggeber am 2026-10-23 zurückgestellt, mit der Probeumsetzung [prototype/order-04.md](prototype/order-04.md); wird später gesondert getestet. Messskripte und Teilergebnisse der abgebrochenen Probeumsetzung liegen ohne Messbericht auf dem Zweig `backtest/proto-ticks` (Commit `1fdbce4ea3d87c54601878e645870127d7a7502c`). Für ein späteres Arbeitspaket; Spezifikation und Plan werden dafür ergänzt. Bis dahin gilt die Grenze je Datei (Spezifikation 5.3).

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-21 | Plan angelegt: vier Pakete. `wp02` ohne Abhängigkeit, `wp01` nach `strategiedesign/wp02`, `wp03` nach `wp01` und `wp02`, `wp04` nach `wp03` und `strategiedesign/wp03`. |
| 2026-10-21 | Nach dem Prüfbericht [plan-1.md](reviews/plan-1.md): B1 Typbeschreibung des `ZigZag` mit den Eigenschaften für `str-01` in `wp01` (Umfang, umgesetzte Teile, Abdeckung), Berechnung bleibt in `wp03`. Hinweise: 1 Kriterium 1 zur Bedienbarkeit in `wp01` (übrige Kriterien um eins weitergezählt); 2 Testlauf mit Ablehnung in `wp04` Kriterium 2; 5 Voraussetzung in `wp02` Kriterium 3. Verworfen: 3 (`wp01` ändert in pipwerk Studio nur Texte, keine Bausteine, die `strategiedesign/wp03` umbaut), 4 (der Weg ist beschrieben, den Zeitpunkt bestimmt der Entwicklungsleiter), 6 (Testdetail). |
| 2026-10-21 | Hinweise aus [plan-2.md](reviews/plan-2.md) (bestanden), ohne weitere Prüfung: 1 Formulierung der Berechnung in `wp03`; 2 Eigenschaften des `ZigZag` im Ziel von `wp01`. Verworfen: 3 (pipwerk Studio führt Strategien nicht aus; Kriterium 1 betrifft nur die Konsistenzprüfung). |
| 2026-10-21 | Auf Wunsch des Auftraggebers (Meldung `plan` des Projektleiters): `wp01` beginnt sofort auf Commit `2cac35b4a45e9d5499c92e3762670faf1021c821` von `strategiedesign/wp02`, übernimmt spätere Änderungen aus dessen Abnahme und wird erst nach `strategiedesign/wp02` übernommen (Übersicht, Erläuterung, Abhängigkeiten von `wp01`). Rein technisch: Umfang und Abnahmekriterien unverändert. |
| 2026-10-21 | Hinweise aus [plan-3.md](reviews/plan-3.md) (bestanden), ohne weitere Prüfung: 1 Punkt 4 misst wie Punkt 3 an der Software; 2 `integrate` für `wp01` erst nach `integrated` zu `strategiedesign/wp02`; 3 Satz „in der Abnahme“ gestrichen; 4 Übersicht „Beginn ohne Wartezeit“; 5 Beginn mit `implement` statt „nach Bestätigung“, den Vermerk führt der Projektleiter. |
| 2026-10-23 | Nach der Abnahme von `wp02`, Versuch 1 (Mängel M1 bis M4), und der geänderten Spezifikation (E5, 5.1, 5.3, 5.4, 8.3): `wp02` Ziel, Umfang, Nicht-Umfang, umgesetzte Teile und Abnahmekriterien 1, 2, 3, 5 und 6 (Import mehrerer Dateien, Ansicht „Datenbestand“, `pipwerk-fetch-mt5` ohne Server und Port, keine Beschaffung aus pipwerk replay); `wp03` Umfang und Abnahmekriterien 1 und 5 ohne Beschaffung beim Start; Abdeckung 5.1 bis 5.4. Prüfung bestanden in [plan-4.md](reviews/plan-4.md). |
| 2026-10-23 | Hinweise aus [plan-4.md](reviews/plan-4.md) (bestanden) ohne weitere Prüfung eingearbeitet: H1 Broker in der Vorbereitung in `wp03` (Umfang, Abdeckung 5.1); H2 Erläuterung der Übersicht zu `wp02`. |
| 2026-10-23 | „Abruf“ statt „Beschaffung“, nur Bezeichnung (Übersicht, `wp02`, `wp03`, Abdeckung). Folgt aus der Entscheidung des Auftraggebers vom 2026-10-23 (Abstimmung `relay/presentations/specification-1.html`, Nachprüfung bestanden in `relay/reviews/requirements-4.md`). |
| 2026-10-23 | Nach der Abnahme von `wp02`, Versuch 2 (Mängel M1, M2, M3, M5, M6), und der geänderten Spezifikation (5.1 bis 5.3, 5.5, 10 bis 13): `wp02` Ziel, Umfang, Nicht-Umfang, umgesetzte Teile, Abnahmekriterium 6 und neue Kriterien 7 bis 10; `wp03` und `wp04` Sperre des Löschens (Umfang, umgesetzte Teile, `wp03` Kriterium 7); Abdeckung 5.5 und 13; Abschnitt „Offen“ mit M4, vom Auftraggeber zurückgestellt. Prüfung bestanden in [plan-5.md](reviews/plan-5.md). |
| 2026-10-23 | Hinweise aus [plan-5.md](reviews/plan-5.md) (bestanden) eingearbeitet: H1 `wp02` Kriterium 9 auch zwischen zwei Dateien, nach B1 aus `specification-4.md`; H2 Kriterium 8 gelöschter Zeitraum mit Handelszeit; H3 Kriterium 7 Grenze je Datei in der Anwenderdokumentation. |
| 2026-10-23 | Hinweise aus [specification-5.md](reviews/specification-5.md) (Nachprüfung bestanden, auch Kriterium 9) ohne weitere Prüfung eingearbeitet: H1 Randtage in Kriterium 9; H3 Tage ohne Handel im Umfang von `wp02`, früher Handelsschluss in Kriterium 9. Den Schlüssel in der Startkonfiguration legt der Auftrag fest. |
