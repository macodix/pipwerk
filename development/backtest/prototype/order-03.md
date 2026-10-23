# Auftrag Prototyp Strategietester (pipwerk replay), Ansicht „Datenbestand“

- Vorhaben: `backtest`, Rückkopplung aus der Abnahme von `wp02` ([Abnahmebericht](../wp02/acceptance/1.md))
- zuständig: Entwickler Oberfläche
- Zweig: `backtest/proto-replay`, Prototyp, wird nicht übernommen
- Ausgangscommit: `de8a0d7bd7fc8a736c25b81171a54dc44b043aa2`
- Stand: 2026-10-23

## Ziel

Der Auftraggeber hat die Ansicht „Datenbestand“ in der Abnahme von `wp02` abgelehnt und ihren Aufbau festgelegt (Abnahmebericht, Mängel M1 bis M4). Außerdem gibt es bis pipwerk relay keine Beschaffung aus pipwerk replay, weder von Hand noch beim Start eines Testlaufs. Der Prototyp wird an diese Festlegungen angepasst. Alles andere bleibt, wie es bestätigt ist.

## Grundlagen

- Abnahmebericht `development/backtest/wp02/acceptance/1.md`, Mängel M1 bis M4. Die Festlegungen dort gelten wörtlich.
- `docs/design/requirements/anforderungen-gesamtsystem.md`, req-system-026 und req-system-027
- `docs/design/requirements/anforderungen-strategietester.md`, req-test-003
- `development/backtest/specification.md`, Abschnitte 5.3 und 8.3, Zeile „Datenbestand“, in der Fassung dieses Auftrags (unten „Festlegungen der Spezifikation“)

## Umfang

1. Ansicht „Datenbestand“ neu nach M1:
   - Oben eine Leiste mit dem Knopf „Datei importieren …“ und dem Auswahlfeld „Broker für Testläufe“. Das Auswahlfeld bietet nur Broker an, die im Datenbestand vorkommen. Die Wahl ist die Vorbelegung des Brokers in „Testlauf vorbereiten“.
   - Darunter eine kompakte Tabelle, eine Zeile je Datenreihe mit den Spalten Broker, Instrument, Daten (zum Beispiel „Kerzen H1“, „Ticks“), Zeitraum (erster bis letzter Tag), Lücken (Anzahl). Die Tabelle ist filterbar nach Broker, Instrument und Daten und wird seitenweise gezeigt.
   - Ein Klick auf eine Zeile zeigt die Einzelheiten der Reihe: alle Lücken mit Beginn und Ende und die Kontraktdaten des Instruments bei diesem Broker. Fehlen die Kontraktdaten, sagt das ein Satz, mit dem Hinweis, dass ein Testlauf mit diesem Instrument dann nicht startet.
   - Der Bereich „Angaben zum Instrument je Broker“ und der Bereich zur Beschaffung entfallen.
2. Texte nach M2: kurze, sachliche Überschriften und Bezeichnungen, zum Beispiel „Datenbestand“, „Datei importieren“, „Kontraktdaten“, „Lücken“. Kein Text verweist auf Bereiche „unten“ oder „oben“. Leere Zustände nennen weiter den nächsten Schritt, zum Beispiel „Noch keine Kursdaten. Importieren Sie Dateien mit „Datei importieren …“.“ Erklärungen beim Zeigen bleiben an jedem Feld.
3. Dialog „Datei importieren“ nach M3:
   - Auswahl beliebig vieler Dateien auf einmal, JSON und CSV gemischt.
   - Broker einmal für alle Dateien: Eingabefeld mit Vorschlägen aus den Brokern des Datenbestands, ein neuer Name lässt sich eingeben. Nennen alle gewählten JSON-Dateien denselben Broker, ist er vorbelegt.
   - Zeitzone einmal für alle CSV-Dateien, nur zu sehen, wenn eine CSV-Datei gewählt ist.
   - Liste der Dateien mit Instrument und Daten (Zeiteinheit, Ticks oder Kontraktdaten), vorbelegt aus dem Dateinamen beziehungsweise bei JSON aus dem Inhalt, je Datei änderbar; Datei aus der Liste entfernen. Eine Datei ohne erkennbares Instrument oder Daten ist markiert und sperrt den Import, bis die Angabe ergänzt ist.
   - Ein Knopf „Importieren“ importiert alle Dateien. Danach zeigt die Liste je Datei das Ergebnis: übernommene Zeilen, Zeitraum, abgelehnte Zeilen mit Grund. Eine fehlerhafte Datei hindert die übrigen nicht.
   - Die Beispieldatei des Prototyps bleibt erhalten, als Möglichkeit im Dialog, und ergänzt um eine zweite Beispieldatei, damit sich der Import mehrerer Dateien ohne eigene Dateien ausprobieren lässt.
4. Keine Beschaffung aus pipwerk replay (M4, req-test-003):
   - Vorbereitung und Ansicht „Kursdaten beim Start“: Fehlende Kursdaten werden nicht beschafft. Der Stand je Datensatz ist „vorhanden“ oder „fehlt“ (mit fehlendem Zeitraum). Fehlt etwas, startet der Testlauf nicht. Die Meldung nennt je fehlendem Teil Instrument, Daten und Zeitraum und den Weg: Daten mit `pipwerk-fetch-mt5` auf dem Rechner von MetaTrader 5 holen und im Datenbestand importieren, mit einem Knopf, der zur Ansicht „Datenbestand“ führt.
   - Alle Texte, Erklärungen und Menühinweise, die eine Beschaffung aus pipwerk replay nennen, werden angepasst.
5. README: Abschnitte „Was simuliert ist“, „Bedienung in Kürze“ und die Tabelle der Browsertests passen zum neuen Stand; ein Abschnitt nennt die Entscheidungen dieses Auftrags.

## Festlegungen der Spezifikation

- Der Import einer JSON-Datei übernimmt Instrument und Daten aus dem Inhalt. Zeitpunkte in JSON-Dateien sind UTC; die Zeitzone gilt nur für CSV-Dateien.
- Jede Datei wird für sich geprüft und übernommen. Eine Datei mit Fehler in Format oder Inhalt wird ganz abgelehnt, einzelne fehlerhafte Zeilen werden mit Grund übersprungen.
- Liegen für ein Instrument eines Brokers nur Kontraktdaten und keine Kursdaten vor, zeigt die Tabelle eine Zeile mit Daten „Kontraktdaten“, ohne Zeitraum und Lücken.
- Dateinamen von `pipwerk-fetch-mt5`: `<Instrument>_<Daten>_<von>_<bis>.json` mit Daten `M1`, `H1` und so weiter, `TICKS` oder `CONTRACT`. Der Prototyp erkennt diese Namen und CSV-Namen wie die bisherige Beispieldatei.

## Nicht-Umfang

- Jede andere Änderung an Bedienung, Anordnung und Erscheinungsbild der übrigen Ansichten
- das Programm `pipwerk-fetch-mt5` selbst

## Technische Abnahmekriterien

1. Die Kriterien 1 bis 3 und 6 aus `order-01.md` gelten weiter und sind auf dem neuen Commit erfüllt, darunter alle sechs Fenstergrößen auch für die Ansicht „Datenbestand“ und den Dialog „Datei importieren“.
2. Ein Browsertest prüft nur über die Bedienung: Leiste mit „Datei importieren …“ und „Broker für Testläufe“ (nur Broker aus dem Datenbestand); Filter und Seitenwechsel der Tabelle; Klick auf eine Zeile zeigt Lücken und Kontraktdaten; Import von zwei Dateien in einem Vorgang mit neuem Brokernamen, geänderter Zeiteinheit einer Datei und Ergebnis je Datei; danach erscheinen die Reihen in der Tabelle und der neue Broker im Auswahlfeld.
3. Ein Browsertest prüft: Ein Testlauf mit fehlenden Kursdaten startet nicht; die Meldung nennt die fehlenden Teile und führt zur Ansicht „Datenbestand“.
4. Im Quelltext und in der gebauten Datei kommen die Überschriften „Was vorliegt“, „Angaben zum Instrument je Broker“, „Datei von Hand importieren“, „Beschaffung von Hand anstoßen“ und Texte zu „unten“ in der Ansicht „Datenbestand“ nicht mehr vor, ebenso keine Beschaffung aus pipwerk replay.
5. Bildschirmbilder der Ansicht „Datenbestand“ mit geöffneten Einzelheiten und des Dialogs „Datei importieren“ mit zwei Dateien, jeweils in 1366 × 768 und 390 × 844, unter `components/pipwerk-backtest/prototype/screenshots/`.
6. README nach Umfang Punkt 5. Keine Pfade des Entwicklungsrechners, keine Zugangsdaten.

## Ergebnis

Ein benannter Commit im Zweig `backtest/proto-replay` auf GitHub, darin die neu gebaute Datei `dist/pipwerk-replay-prototyp.html`. Nenne ihn vollständig im Ergebnis, dazu die erfüllten und nicht erfüllten Abnahmekriterien mit Nachweis und deine Entscheidungen.
