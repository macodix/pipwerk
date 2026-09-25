# Zeitgebundener Volatilitätsausbruch

## Status

- strategie-id: `str-05`
- status: `draft`
- quelle: `Teststrategien_fuer_den_grafischen_Strategiedesigner.md`, Testentwurf des Assistenten
- zuletzt geprüft: `2026-09-16`

## Handelsidee

Innerhalb eines festgelegten Zeitfensters entsteht eine Handelsspanne. Nach dem Ende dieses Fensters werden das höchste Hoch und das tiefste Tief als feste Tages-Range verwendet.

Der erste gültige Ausbruch über das Range-Hoch oder unter das Range-Tief soll in Ausbruchsrichtung gehandelt werden. Pro Handelstag darf nur ein solcher Ausbruch einen Trade auslösen.

Die Strategie dient zunächst als Testfall für den Strategiedesigner. Ihre Profitabilität ist nicht nachgewiesen.

## Voraussetzungen

Benötigt werden fortlaufende Kursdaten mit eindeutigen Zeitstempeln. Vor dem Einsatz müssen Instrument, Zeiteinheit, Zeitzone, Definition des Handelstags sowie Beginn und Ende des Range-Zeitfensters festgelegt werden.

Für einen ausführbaren Trade werden außerdem Regeln für Stop-Loss, Kursziel, Risiko, Positionsgröße, Orderart, Spread, Slippage und Gebühren benötigt. Diese Regeln sind im bisherigen Entwurf noch nicht vollständig festgelegt.

## Ablauf

### 1. Markt beobachten

Zu Beginn eines neuen Handelstags werden die gespeicherte Range und der Tagesstatus zurückgesetzt. Während des festgelegten Range-Zeitfensters werden das höchste Hoch und das tiefste Tief fortlaufend aktualisiert.

In dieser Phase wird noch kein Ausbruch gehandelt.

### 2. Handelsmöglichkeit erkennen

Am Ende des Range-Zeitfensters werden Range-Hoch und Range-Tief eingefroren. Nachträgliche Kurse verändern diese Tages-Range nicht mehr.

Anschließend wird geprüft, ob der Kurs das Range-Hoch überschreitet oder das Range-Tief unterschreitet:

- Überschreitung des Range-Hochs: mögliche Long-Gelegenheit
- Unterschreitung des Range-Tiefs: mögliche Short-Gelegenheit

Nur der erste gültige Ausbruch des Handelstags darf einen Trade auslösen.

### 3. Trade planen

Beim ersten gültigen Ausbruch werden Einstieg, Stop-Loss und Kursziel festgelegt.

Der bisherige Entwurf lässt für den Stop zwei Alternativen offen:

- Stop auf der gegenüberliegenden Seite der Range
- Stop in einem definierten Abstand innerhalb der Range

Für das Kursziel ist bislang nur festgelegt, dass der Trade über ein Kursziel beendet werden kann. Eine konkrete Berechnungsregel fehlt noch.

### 4. Risiko und Handelbarkeit prüfen

Vor einer Order müssen maximaler Risikobetrag und Positionsgröße berechnet sowie die Broker- und Marginbedingungen geprüft werden.

Der bisherige Strategieentwurf enthält dafür noch keine konkrete Regel. Ohne diese Festlegung ist die Strategie nicht vollständig ausführbar.

### 5. Order stellen

Beim ersten gültigen Ausbruch wird eine Order in Ausbruchsrichtung gestellt beziehungsweise ausgeführt.

Welche Orderart verwendet wird und wie Kurslücken, Slippage oder eine nicht vollständige Ausführung behandelt werden, ist noch offen.

### 6. Ausstehende Order überwachen

Dieser Abschnitt hängt von der noch festzulegenden Orderart ab. Bei einer sofort ausgeführten Marktorder existiert keine länger ausstehende Order. Bei Stop- oder Limit-Orders müssen Gültigkeit, Änderung und Stornierung gesondert geregelt werden.

### 7. Ausführung verarbeiten

Nach der Ausführung ist eine Position in Ausbruchsrichtung aktiv. Gleichzeitig werden weitere Einstiege für diesen Handelstag gesperrt.

Ob bereits das Erkennen des Ausbruchs oder erst die tatsächliche Orderausführung den Handelstag sperrt, ist noch festzulegen.

### 8. Aktiven Trade verwalten

Die aktive Position wird auf drei mögliche Exit-Ereignisse überwacht:

- Kursziel erreicht
- Stop-Loss erreicht
- festgelegte späteste Exit-Zeit erreicht

Der bisherige Entwurf sieht keine weitere Anpassung von Stop-Loss oder Kursziel vor. Ob dies eine feste Regel oder nur noch nicht beschrieben ist, bleibt offen.

### 9. Trade beenden

Die Position wird geschlossen, sobald Kursziel, Stop-Loss oder späteste Exit-Zeit erreicht wird. Das zuerst eintretende Ereignis entscheidet.

Bis zum Beginn des nächsten Handelstags bleiben weitere Entries gesperrt. Mit dem neuen Handelstag werden Range und Tagesstatus zurückgesetzt.

## Parameter

| Parameter | Bedeutung | Wert oder Regel | Status |
|---|---|---|---|
| Instrument | gehandelter Markt | nicht festgelegt | offen |
| Marktdaten-Zeiteinheit | Auflösung für Range und Ausbruch | nicht festgelegt | offen |
| Zeitzone | Grundlage aller Zeitpunkte | nicht festgelegt | offen |
| Handelstag | Beginn und Ende der täglichen Strategieperiode | nicht festgelegt | offen |
| Range-Zeitfenster | Zeitraum zur Bildung von Hoch und Tief | nicht festgelegt | offen |
| Ausbruchskriterium | Zeitpunkt, an dem eine Range-Grenze als überschritten gilt | nicht festgelegt | offen |
| Stop-Regel | Lage des Stop-Loss | Gegenseite oder Abstand innerhalb der Range | offen |
| Zielregel | Berechnung des Kursziels | nicht festgelegt | offen |
| späteste Exit-Zeit | zwangsweises Ende einer offenen Position | nicht festgelegt | offen |
| maximales Risiko | zulässiger Verlust je Trade | nicht festgelegt | offen |
| Trades je Handelstag | maximale Zahl gültiger Ausbrüche | 1 | bestätigt |

## Offene fachliche Fragen

1. Für welchen Markt und welche Zeiteinheit soll die Strategie gelten?
2. Wie werden Handelstag, Zeitzone und Range-Zeitfenster definiert?
3. Werden Range-Hoch und Range-Tief aus Ticks oder Kerzen bestimmt?
4. Reicht ein Tick außerhalb der Range oder ist ein Kerzenschluss erforderlich?
5. Welche Orderart wird verwendet?
6. Welche der beiden Stop-Regeln soll gelten?
7. Wie werden Kursziel, Risiko und Positionsgröße bestimmt?
8. Sperrt bereits das Ausbruchssignal oder erst eine ausgeführte Order weitere Entries?
9. Wie werden Fehlausbruch, Kurslücke, Slippage und Teil-Ausführung behandelt?
10. Bleiben Stop-Loss und Kursziel nach der Ausführung unverändert?

## Bestätigungsvermerk

- fachlich geprüft durch: `offen`
- Ergebnis: `offen`
- Datum: `–`

## Originalbeschreibung

`Teststrategien_fuer_den_grafischen_Strategiedesigner.md`, Abschnitt „3. Zeitgebundener Volatilitätsausbruch“
