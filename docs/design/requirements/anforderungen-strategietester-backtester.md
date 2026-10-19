# Anforderungen an Strategietester und Backtester

## Dokumentstatus

- status: `draft`
- zweck: Anforderungen an das schrittweise Prüfen einer Strategie (Strategietester) und an den Test einer Strategie über einen Zeitraum (Backtester), beide mit historischen Kursdaten
- zuletzt aktualisiert: `2026-10-19`
- abgestimmt: Festlegungen des Auftraggebers im Chat am 19. Oktober 2026. Prüfung durch die QA und Präsentation stehen aus.

## 1. Zweck und Abgrenzung

Dieses Dokument enthält die Anforderungen an zwei Funktionen:

- **Strategietester:** Eine Strategie läuft an historischen Kursdaten Schritt für Schritt ab. Der Anwender sieht dabei Ablauf, Werte der Objekte und Chart und prüft so, ob die Strategie arbeitet wie gedacht.
- **Backtester:** Eine Strategie läuft an historischen Kursdaten ohne Unterbrechung über einen Testzeitraum. Ergebnis sind Kontoentwicklung, Trades und Kennzahlen.

Die historischen Kursdaten, ihre Beschaffung und ihr Import sind in `anforderungen-gesamtsystem.md`, Abschnitt 3, festgelegt. Wiederverwendbare Definitionen der Objekte stehen in `fachmodell.md`. Ob die beiden Funktionen eine oder zwei Hauptkomponenten bilden, ist offen (Abschnitt 5).

## 2. Gemeinsame Anforderungen

### req-test-001 -- Testlauf

Ein Testlauf wendet eine Strategie auf ein Instrument in einem Testzeitraum an und verwendet dafür ein Testkonto (req-test-005). Instrument und Testzeitraum wählt der Anwender aus den historischen Kursdaten.

### req-test-002 -- Testzeitraum

Jeder Testlauf hat einen Testzeitraum. Er ist vorbelegt und endet mit dem letzten vollständigen Handelstag:

- Strategietester: die letzten 30 Tage
- Backtester: die letzten 2 Jahre

### req-test-003 -- Kursdaten eines Testlaufs

Strategietester und Backtester lesen Kursdaten nur aus dem Datenbestand historischer Kursdaten (Gesamtsystem req-system-025).

Vor dem Start eines Testlaufs wird geprüft, ob die Kursdaten für das Instrument, jede in der Strategie verwendete Zeiteinheit und den Testzeitraum vollständig im Datenbestand liegen, ebenso die Angaben zum Instrument. Fehlende Daten werden automatisch beschafft und importiert (Gesamtsystem req-system-027), auch wenn nur ein Teil des Zeitraums fehlt.

Fehlen danach Daten oder sind sie lückenhaft, startet der Testlauf nicht. Eine Meldung nennt die fehlenden Daten und den Grund, warum sie nicht beschafft werden konnten.

Zeiten, in denen beim Broker nicht gehandelt wird, zum Beispiel Wochenenden, Feiertage und Handelspausen, sind keine Lücken.

### req-test-004 -- Interne Abwicklung von Orders

Strategietester und Backtester haben keine Verbindung zu einem Broker. Jede Order, die die Strategie aufgibt, ist eine interne Order. pipwerk wickelt sie gegen die historischen Kurse und mit den Werten des Testkontos ab: Ausführung, Positionen, Stop-Loss, Kursziel, Kosten und Kontostand entstehen rechnerisch. Strategietester und Backtester wickeln Orders auf dieselbe Weise ab.

### req-test-005 -- Testkonto

Ein Testkonto ist ein benannter, gespeicherter Satz von Werten für die Abwicklung eines Testlaufs. Der Anwender kann Testkonten anlegen, bearbeiten, speichern und löschen. Ein Standard-Testkonto ist mitgeliefert, damit ein Testlauf ohne Vorarbeit starten kann.

Ein Testkonto enthält:

- Anfangskapital und Kontowährung
- Hebel
- Spread: aus den Kerzen des Brokers oder ein fester Wert
- Kommission

Die Angaben zum Instrument (Kontraktgröße, Volumenschritte, Swap, Margin-Anforderung) werden aus dem Datenbestand vorbelegt und können im Testlauf geändert werden.

Ein Testlauf verwendet genau ein Testkonto. Ändert der Anwender im Testlauf einen Wert, bleibt das gespeicherte Testkonto unverändert, außer er speichert die Änderung ausdrücklich.

### req-test-006 -- Testbarkeit

Was das Handelssystem mit einer Strategie ausführen kann, ist im Strategietester und im Backtester testbar.

## 3. Strategietester

### req-test-010 -- Darstellung

Der Strategietester zeigt die Strategie so wie der Strategiedesigner und dazu den Chart des Instruments in jeder Zeiteinheit, die die Strategie verwendet. Orders, Positionen und Kontostand sind im Chart und als Werte sichtbar. Die Werte der Objekte sind mit dem Stand des aktuellen Schritts sichtbar.

Die Darstellung der Kerzen KANN so sein: steigende Kerzen grün, fallende Kerzen rot, jeweils mit schwarzem Rahmen und schwarzem Docht.

### req-test-011 -- Handelnde Stellen

Eine handelnde Stelle ist eine Auswertung, in der der Ablauf ein handelndes Element erreicht: „Order aufgeben“, „Order ändern“, „Order löschen“, „Position ändern“ oder „Position schließen“. Handelnde Stellen sind im Chart markiert.

### req-test-012 -- Schrittweiser Ablauf

Beim Start läuft der Strategietester bis zur ersten handelnden Stelle im Testzeitraum. Er hält am ersten Element des Ablaufs dieser Auswertung an, mit dem Zustand, den die Objekte zu diesem Zeitpunkt haben.

Von dort kann der Anwender:

- mit einem Einzelschritt zum nächsten Element des Ablaufs gehen. Das gerade ausgeführte Element ist hervorgehoben.
- zur nächsten handelnden Stelle springen. Der Strategietester hält dort wie beim Start am ersten Element des Ablaufs an.

## 4. Backtester

### req-test-020 -- Ablauf

Der Backtester lässt die Strategie ohne Unterbrechung über den Testzeitraum laufen.

### req-test-021 -- Ergebnis

Das Ergebnis eines Backtests zeigt:

- die Kontoentwicklung als Kurve über den Testzeitraum, darunter den Rückgang vom jeweiligen Höchststand
- die Liste der Trades mit Eröffnung, Schließung, Richtung, Volumen, Preisen, Gewinn oder Verlust und Kosten
- die Kennzahlen Nettogewinn, Anzahl der Trades, Trefferquote, Verhältnis von Gesamtgewinn zu Gesamtverlust, größter Rückgang vom Höchststand, durchschnittlicher Gewinn und durchschnittlicher Verlust je Trade
- den Chart mit den Trades als Markierungen. Ein Klick auf einen Trade in der Liste zeigt seine Stelle im Chart.

### req-test-022 -- Backtest speichern und vergleichen

Ein Backtest wird nur gespeichert, wenn der Anwender es ausdrücklich verlangt. Gespeichert werden eine Kopie der getesteten Strategie, das Testkonto mit den verwendeten Werten, Instrument, Testzeitraum und Ergebnis. Die getestete Fassung der Strategie lässt sich im Strategiedesigner ansehen.

Der Anwender sieht eine Liste der gespeicherten Backtests und kann zwei oder mehr davon nebeneinander vergleichen, mit den Kennzahlen und mit übereinandergelegten Kontokurven.

## 5. Noch offene Punkte

1. Ob Strategietester und Backtester eine oder zwei Hauptkomponenten bilden. Gesamtsystem req-system-001 führt beide Funktionen derzeit unter `Strategietester`.
2. Haltepunkte an Elementen, an denen der Strategietester zusätzlich anhält.
3. Wie die Werte der Objekte angezeigt werden, zum Beispiel beim Überfahren mit der Maus.
4. Ob Strategieparameter je Testlauf gesetzt werden.
5. Ob ein Testkonto auch geänderte Angaben zum Instrument speichert.
6. Anzeige der Unterschiede zwischen Fassungen einer Strategie. Nicht Teil der Anforderungen, darf durch den Aufbau aber nicht ausgeschlossen werden.
7. Auswertung einer Strategie ohne Auslöser, zum Beispiel durch Start von Hand (Fachmodell req-fach-015). Wird mit den Anforderungen an das Handelssystem geklärt. Ist sie dort möglich, ist sie nach req-test-006 auch testbar.
8. Bestimmung von Trend, Phase und Punkten im Indikator 1-2-3-Trend (Markttechnik).

## 6. Änderungsnachweis

| Datum | Änderung |
| --- | --- |
| 2026-10-19 | Erstanlage: Testlauf, Testzeitraum, Kursdaten eines Testlaufs, interne Abwicklung, Testkonto, schrittweiser Ablauf im Strategietester, Ergebnis, Speichern und Vergleich im Backtester. Festlegungen des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-19 | req-test-006 Testbarkeit. Strategie ohne Auslöser an das Handelssystem verwiesen. Festlegung des Auftraggebers im Chat am 2026-10-19. |
