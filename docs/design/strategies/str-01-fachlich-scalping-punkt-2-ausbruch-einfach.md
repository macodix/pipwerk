# Scalping Punkt 2 Ausbruch – einfache Strategie

## Status

- strategie-id: `str-01`
- status: `draft`
- quelle: `scalping-punkt-2-ausbruch-einfach(1).md` und bestätigte Klärungen im Projektchat
- zuletzt geprüft: `2026-09-16`

## Handelsidee

Bei einem markttechnisch intakten Trend entstehen am Punkt 2 häufig Bewegungen in Trendrichtung. Die Strategie soll einen kleinen Teil einer solchen Bewegung mit kurzer Verweildauer im Markt nutzen.

Die größere Zeiteinheit bestimmt, ob ein intakter Trend vorliegt und sich der Markt in der Bewegung befindet. Der konkrete Trade wird anschließend auf einer kleineren Handelszeiteinheit geplant. Long und Short werden nicht als getrennte Strategien behandelt. Gehandelt wird immer in Richtung des erkannten Trends.

## Voraussetzungen

Für die Strategie werden Kursdaten einer größeren Signalzeiteinheit und mindestens einer dazu passenden kleineren Handelszeiteinheit benötigt. Die Punkte 1, 2 und 3 sowie der Trend werden nach der Markttechnik von Michael Voigt auf Grundlage eines ZigZag-EA beziehungsweise ZigZag-Indikators bestimmt.

Für die Tradeplanung werden außerdem der aktuelle Spread, die Pip- oder Tickgröße des Instruments, die Risikogrenze des Kontos, die freie Margin sowie Mindestlot und Volumenschritte des Brokers benötigt.

## Ablauf

### 1. Markt beobachten

Auf einer größeren Zeiteinheit wird geprüft, ob ein intakter markttechnischer Trend vorliegt. Diese größere Zeiteinheit dient als Signalzeiteinheit. Dafür kommen M15, H1, H4 oder D1 infrage.

Liegt kein intakter Trend vor, wird kein Trade geplant. Liegt ein intakter Trend vor, wird zusätzlich geprüft, ob sich der Markt in der Bewegung und nicht in der Korrektur befindet. Nur während der Bewegung wird die Strategie fortgesetzt.

### 2. Handelsmöglichkeit erkennen

Ausgehend von der Signalzeiteinheit wird eine kleinere Handelszeiteinheit gewählt:

| Signalzeiteinheit | mögliche Handelszeiteinheiten |
|---|---|
| M15 | M5 oder M1 |
| H1 | M15 oder M5 |
| H4 | H1 oder M15 |
| D1 | H4 oder H1 |

Auf der Handelszeiteinheit werden der letzte Punkt 2 und der letzte Punkt 1/3 bestimmt. Der Punkt 2 bildet den Bezug für den Einstieg. Der Punkt 1/3 bildet den Bezug für den Stop-Loss.

### 3. Trade planen

Der Einstieg wird in Trendrichtung kurz hinter dem letzten Punkt 2 der Handelszeiteinheit festgelegt. Bei einem Long-Trade liegt er über Punkt 2. Bei einem Short-Trade gilt die Regel spiegelbildlich. Zum Punkt 2 werden der Spread und ein Puffer von ungefähr 3 bis 5 Pips berücksichtigt.

Der Stop-Loss wird hinter dem letzten Punkt 1/3 der Handelszeiteinheit gesetzt. Auch hier wird ein Abstand von ungefähr 3 bis 5 Pips berücksichtigt.

Der Take-Profit wird vom Einstieg aus so festgelegt, dass unter Berücksichtigung des Spreads und des vorgesehenen Puffers ein effektives CRV von 1:1 entsteht.

### 4. Risiko und Handelbarkeit prüfen

Aus Einstieg, Stop-Loss, Pip- beziehungsweise Tickwert und einer Risikogrenze von maximal 1 % wird das Handelsvolumen berechnet.

Danach wird geprüft, ob dieses Volumen die Mindestlot- und Volumenschrittregeln des Brokers erfüllt und ob ausreichend freie Margin vorhanden ist.

Ist der Trade auf der gewählten Handelszeiteinheit nicht handelbar, wird eine kleinere, für die größere Zeiteinheit zulässige Handelszeiteinheit geprüft. Auf ihr muss der Trade vollständig neu geplant werden.

### 5. Order stellen

Ist der Trade handelbar, wird eine Pending Order mit dem berechneten Einstieg, Stop-Loss, Take-Profit und Volumen gestellt.

### 6. Ausstehende Order überwachen

Bis zur Ausführung werden der Kurs, die Order und die relevanten ZigZag-Punkte überwacht.

Durchbricht der Kurs den letzten Punkt 1/3, ist die zugrunde liegende Trendkonstellation nicht mehr intakt. Die Pending Order wird storniert. Der Durchbruch wird auf Tick-Ebene erkannt.

Verändert der ZigZag-Indikator den noch nicht endgültigen Punkt 1/3, werden Stop-Loss und Take-Profit angepasst. Anschließend werden Risiko, Volumen und Margin erneut geprüft. Ist der Trade danach nicht mehr regelgerecht handelbar, wird die Order storniert.

### 7. Ausführung verarbeiten

Erreicht der Kurs den Einstieg, wird die Pending Order ausgeführt und der Trade ist aktiv. Für diese einfache Strategie ist unmittelbar nach der Ausführung keine Veränderung von Stop-Loss oder Take-Profit vorgesehen.

### 8. Aktiven Trade verwalten

Der aktive Trade wird nicht mehr verändert. Stop-Loss und Take-Profit bleiben auf den bei der Planung beziehungsweise bei einer letzten Anpassung vor der Ausführung festgelegten Werten.

### 9. Trade beenden

Der Trade endet, wenn der Stop-Loss oder der Take-Profit erreicht wird.

## Parameter

| Parameter | Bedeutung | Wert oder Regel | Status |
|---|---|---|---|
| größere Zeiteinheit | Zeiteinheit für Trend und Marktphase | M15, H1, H4 oder D1 | bestätigt |
| Handelszeiteinheit | Zeiteinheit für Punkt 2, Punkt 1/3 und Tradeplanung | gemäß festgelegter Paarung | bestätigt |
| Entry-Puffer | zusätzlicher Abstand hinter Punkt 2 | ungefähr 3–5 Pips, instrumentabhängig | teilweise offen |
| Stop-Puffer | zusätzlicher Abstand hinter Punkt 1/3 | ungefähr 3–5 Pips, instrumentabhängig | teilweise offen |
| Risikogrenze | maximaler Verlust je Trade | 1 % | bestätigt |
| effektives CRV | Verhältnis von möglichem Gewinn zu möglichem Verlust | 1:1 einschließlich Spread und vorgesehenem Puffer | bestätigt |
| ZigZag-Einstellung | Bestimmung der 1-2-3-Punkte | noch nicht festgelegt | offen |

## Offene fachliche Fragen

1. Auf welche Kapitalbasis beziehen sich die 1 % Risiko?
2. Nach welcher Regel wird innerhalb der Spanne von 3 bis 5 Pips der konkrete Puffer bestimmt?
3. Welche ZigZag-Variante und welche Parameter werden verwendet?
4. Was geschieht, wenn auch auf der kleinsten zulässigen Handelszeiteinheit kein handelbares Volumen möglich ist?

## Bestätigungsvermerk

- fachlich geprüft durch: `offen`
- Ergebnis: `offen`
- Datum: `–`

## Originalbeschreibung

`scalping-punkt-2-ausbruch-einfach(1).md`
