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

Die historischen Kursdaten, ihre Beschaffung und ihr Import sind in `anforderungen-gesamtsystem.md`, Abschnitt 3, festgelegt. Wiederverwendbare Definitionen der Objekte stehen in `fachmodell.md`. Beide Funktionen gehören zu einer Hauptkomponente, dem Strategietester (Gesamtsystem req-system-001, Modul pipwerk backtest im Projektziel), als zwei Betriebsarten.

## 2. Gemeinsame Anforderungen

### req-test-001 -- Testlauf

Ein Testlauf wendet eine Strategie in einem Testzeitraum an und verwendet dafür ein Testkonto (req-test-005). Der Anwender wählt das Instrument der Anwendung (Fachmodell req-fach-053) und den Testzeitraum. Fehlende Kursdaten werden nach req-test-003 beschafft. Instrumente des Testlaufs sind das Instrument der Anwendung und jedes weitere Instrument, das die Strategie verwendet, fest oder über einen Strategieparameter vom Objekttyp `Instrument`.

### req-test-002 -- Testzeitraum

Jeder Testlauf hat einen Testzeitraum. Er ist vorbelegt und endet mit dem letzten vollständigen Handelstag:

- Strategietester: die letzten 30 Tage
- Backtester: die letzten 2 Jahre

### req-test-003 -- Kursdaten eines Testlaufs

Strategietester und Backtester lesen Kursdaten nur aus dem Datenbestand historischer Kursdaten (Gesamtsystem req-system-025).

Vor dem Start eines Testlaufs wird geprüft, ob die Kursdaten für jedes Instrument des Testlaufs, jede in der Strategie verwendete Zeiteinheit und den Testzeitraum vollständig im Datenbestand liegen, ebenso die Angaben zu jedem Instrument des Testlaufs. Hat die Strategie oder eine Verwaltung einer Order den Auslöser `Tick`, gehören die Ticks der betroffenen Instrumente für den Testzeitraum zu den benötigten Kursdaten. pipwerk bildet keine Ticks aus Kerzen nach. Fehlende Daten werden automatisch beschafft und importiert (Gesamtsystem req-system-027), auch wenn nur ein Teil des Zeitraums fehlt.

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

Die Angaben zu jedem Instrument des Testlaufs (Gesamtsystem req-system-025) werden aus dem Datenbestand vorbelegt und können im Testlauf geändert werden.

Ein Testlauf verwendet genau ein Testkonto. Ändert der Anwender im Testlauf einen Wert, bleibt das gespeicherte Testkonto unverändert, außer er speichert die Änderung ausdrücklich.

Ein Testkonto ist an kein Instrument gebunden und speichert keine Angaben zum Instrument. Geänderte Angaben zum Instrument gelten nur für den laufenden Testlauf. Jeder neue Testlauf beginnt mit den Angaben aus dem Datenbestand.

### req-test-006 -- Testbarkeit

Was das Handelssystem mit einer Strategie ausführen kann, ist im Strategietester und im Backtester testbar.

### req-test-007 -- Strategieparameter je Testlauf

Beim Start eines Testlaufs sind die Strategieparameter mit den Werten aus der Strategie vorbelegt. Der Anwender kann sie für diesen Testlauf ändern. Die Strategie bleibt unverändert. Das gilt auch für Strategieparameter vom Objekttyp `Instrument`.

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
- zur nächsten handelnden Stelle springen. Der Strategietester hält dort wie beim Start am ersten Element des Ablaufs an. Liegt vorher ein Haltepunkt (req-test-013), hält er dort.

### req-test-013 -- Haltepunkte

Der Anwender kann an jedem Element einen Haltepunkt setzen und entfernen. Beim Sprung nach req-test-012 hält der Strategietester an der nächsten handelnden Stelle oder am nächsten Haltepunkt, je nachdem, was zuerst erreicht wird. Haltepunkte gelten nur für den laufenden Testlauf und werden nicht in der Strategie gespeichert.

### req-test-014 -- Anzeige der Werte

Wählt der Anwender ein Element an, zeigt die Eigenschaftenansicht wie im Strategiedesigner dessen Parameter, Eigenschaften und Ergebnisse mit den Werten des aktuellen Schritts. Beim Überfahren eines Elements mit der Maus erscheinen seine wichtigsten Werte als kurze Einblendung. Werte, die sich seit dem letzten Schritt geändert haben, sind hervorgehoben.

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

Ein Backtest wird nur gespeichert, wenn der Anwender es ausdrücklich verlangt. Gespeichert werden eine Kopie der getesteten Strategie, die verwendeten Werte der Strategieparameter, das Testkonto mit den verwendeten Werten, Instrument mit den verwendeten Angaben zum Instrument, Testzeitraum und Ergebnis. Die getestete Fassung der Strategie lässt sich im Strategiedesigner ansehen.

Der Anwender sieht eine Liste der gespeicherten Backtests und kann zwei oder mehr davon nebeneinander vergleichen, mit den Kennzahlen und mit übereinandergelegten Kontokurven.

## 5. Noch offene Punkte

1. Anzeige der Unterschiede zwischen Fassungen einer Strategie. Nicht Teil der Anforderungen, darf durch den Aufbau aber nicht ausgeschlossen werden.
2. An welcher Stelle eines Testlaufs der Auslöser „Start von Hand“ eintritt (Fachmodell req-fach-053), zum Beispiel einmal zu Beginn des Testzeitraums. Nicht zu verwechseln mit dem Start des Testlaufs (req-test-012).

## 6. Änderungsnachweis

| Datum | Änderung |
| --- | --- |
| 2026-10-19 | Erstanlage: Testlauf, Testzeitraum, Kursdaten eines Testlaufs, interne Abwicklung, Testkonto, schrittweiser Ablauf im Strategietester, Ergebnis, Speichern und Vergleich im Backtester. Festlegungen des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-19 | req-test-006 Testbarkeit. Strategie ohne Auslöser an das Handelssystem verwiesen. Festlegung des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-19 | Offene Punkte entschieden: eine Hauptkomponente mit zwei Betriebsarten, req-test-007 Strategieparameter je Testlauf, req-test-013 Haltepunkte, req-test-014 Anzeige der Werte, Angaben zum Instrument nicht im Testkonto (req-test-005), Umfang eines gespeicherten Backtests (req-test-022). Bestimmung im Indikator 1-2-3-Trend nach `indikator-markttechnik.md` verschoben. Festlegungen des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-20 | Offener Punkt „Auswertung ohne Auslöser“ erledigt: Auslöser „Start von Hand“ (Anforderungen an den Strategiedesigner req-fach-015, Fachmodell req-fach-053). Entscheidung des Auftraggebers im Chat am 2026-10-20 (Abstimmung der Spezifikation `strategiedesign`, Punkt 17). |
| 2026-10-20 | Nach Prüfbericht der QA (`backtest`, Durchlauf 1), vom Projektleiter: Instrumente des Testlaufs einschließlich weiterer Instrumente der Strategie (req-test-001, -003, -005, -007; B4), Angaben zum Instrument nach req-system-025 (B1), Auswahl von Instrument und Testzeitraum (H8). |
| 2026-10-20 | Offener Punkt 2: Eintreten von „Start von Hand“ im Testlauf. Vom Projektleiter nach den Hinweisen T1-H1 bis T1-H6 aus `development/strategiedesign/reviews/specification-9.md`, Folge der Entscheidungen vom selben Tag. |
| 2026-10-21 | req-test-003: Ticks gehören zu den benötigten Kursdaten, wenn ein Auslöser `Tick` verwendet wird, keine Nachbildung aus Kerzen. Entscheidung des Auftraggebers im Chat am 2026-10-20 (B2). |
