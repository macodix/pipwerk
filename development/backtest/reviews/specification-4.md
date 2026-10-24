# Prüfbericht Spezifikation, Durchlauf 4

- Vorhaben: `backtest`
- geprüfter Commit: `8ca391262012564dfdbf5b2fb99739453b00a6cf` (`main`)
- Gegenstand: geänderte Stellen der Spezifikation (5.1, 5.2, 5.3, 5.5, 7, 8.3, 10, 11, 12, 13) gegen req-system-025, req-system-026, req-test-003 und die Mängel M1, M2, M3, M5, M6 aus `wp02/acceptance/2.md`. M4 und `order-04` nicht geprüft (zurückgestellt).

## Ergebnis: nicht bestanden

M1, M2, M3 und M5 sind vollständig und ohne Widerspruch umgesetzt. M6 ist nicht vollständig umgesetzt (B1).

## Blockierende Befunde

**B1 – Feiertage zwischen zwei Dateien sind weiterhin Lücken (5.2, dritter Punkt; Zuordnung: folgt aus einer Festlegung – req-test-003, Satz „Zeiten, in denen beim Broker nicht gehandelt wird, zum Beispiel Wochenenden, Feiertage und Handelspausen, sind keine Lücken“; M6)**

- Sachverhalt: 5.2 erklärt nur eine Zeit *innerhalb* eines abgedeckten Zeitraums für lückenfrei. Zwischen zwei abgedeckten Zeiträumen derselben Reihe (zwei Dateien) ist ein Zeitraum nur dann keine Lücke, wenn er ganz außerhalb der Handelszeiten der Quelle oder, fehlen diese, in einem Wochenende liegt. Feiertage zählt 5.2 hier nicht dazu; Grund laut 5.2: kein Kalender der Feiertage.
- Folge: Liegen zwei CSV-Dateien einer Reihe nebeneinander, etwa eine Datei bis 31.12. und die nächste ab dem ersten Handelstag nach dem 1.1., oder endet eine Datei vor Weihnachten und beginnt die nächste danach, zeigt der Datenbestand Weihnachten beziehungsweise Silvester/Neujahr weiter als Lücke. Das ist die Beobachtung aus M6. Bei CSV gilt als abgedeckt nur „vom ersten Eintrag bis zum Ende des letzten Eintrags“.
- Dasselbe gilt für die Prüfung vor dem Testlauf (5.2, letzter Punkt): Beginnt der Testzeitraum an einem Feiertag am Anfang der abgedeckten Daten, fehlt „ein Teil“ und der Testlauf startet nicht (req-test-003: „sind sie lückenhaft, startet der Testlauf nicht“).
- Frage: Wie erfüllt die Spezifikation req-test-003 und M6 für Feiertage zwischen zwei Dateien und am Rand des Testzeitraums? Das Abnahmekriterium 9 in `wp02` prüft nur den Fall innerhalb einer Datei.

## Hinweise (nicht blockierend)

- H1 – 5.2 dritter Punkt gegen 5.5: Ein gelöschter Zeitraum ist „innerhalb der Reihe eine Lücke“, außer er fällt ganz in eine Zeit ohne Handel. Plan `wp02` Kriterium 8 sagt ohne diese Ausnahme, er „erscheint als Lücke“. Löscht der Anwender nur ein Wochenende, gilt das nicht.
- H2 – 5.5 und 5.3: „Während eines Imports“ wird Löschen abgelehnt, aber der Vorgang besteht aus einzelnen Anfragen (5.3). Zwischen zwei Dateien läuft im Backend kein Import. Der Auftrag muss festlegen, woran das Backend einen laufenden Vorgang erkennt.
- H3 – 5.1 und 5.5: Löschen aller Daten eines Brokers leert die Wahl „Broker für Testläufe“. Verschwindet ein Broker durch einzelnes Löschen seiner Reihen, bleibt die gespeicherte Wahl stehen und gilt nach erneutem Import des Brokers wieder. Ob das gewollt ist, ist nicht beschrieben.
