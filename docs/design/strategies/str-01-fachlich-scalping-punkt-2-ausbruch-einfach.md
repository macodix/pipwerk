# Scalping Punkt 2 Ausbruch – einfache Strategie

## Status

- strategie-id: `str-01`
- status: `understood`
- quelle: `scalping-punkt-2-ausbruch-einfach(1).md` und bestätigte Klärungen im Projektchat
- zuletzt geprüft: `2026-10-21`

## Handelsidee

Bei einem Trend entstehen beim Überschreiten des letzten Hochs (im Abwärtstrend: Unterschreiten des letzten Tiefs) häufig Bewegungen in Trendrichtung. Die Strategie soll einen kleinen Teil einer solchen Bewegung mit kurzer Verweildauer im Markt nutzen.

Die größere Zeiteinheit bestimmt, ob ein Trend vorliegt. Der konkrete Trade wird anschließend auf einer kleineren Handelszeiteinheit geplant. Long und Short werden nicht als getrennte Strategien behandelt. Gehandelt wird immer in Richtung des erkannten Trends.

## Voraussetzungen

Für die Strategie werden Kursdaten einer größeren Signalzeiteinheit und einer dazu passenden kleineren Handelszeiteinheit benötigt. Trend, Einstiegsbezug und Stop-Bezug werden aus den endgültigen Wendepunkten des mitgelieferten Indikators `ZigZag` bestimmt (Fachmodell req-fach-054). Verwendet werden je Zeiteinheit das letzte und das vorletzte Hoch sowie das letzte und das vorletzte Tief.

Für die Tradeplanung werden außerdem vom Instrument Spread, Pip, Tickgröße, Tickwert, Mindestvolumen und Volumenschritt und vom Konto das Kapital benötigt (Objekte der Anwendung `Konto` und `Instrument`, Fachmodell req-fach-051) sowie die Risikoregel der Strategie (Abschnitt 4).

Signalzeiteinheit, Handelszeiteinheit, Entry-Puffer und Stop-Puffer sind Strategieparameter (Fachmodell req-fach-046). Der Indikator `ZigZag` wird zweimal als Instanz verwendet: einmal auf der Signalzeiteinheit, einmal auf der Handelszeiteinheit.

## Ablauf

### 1. Auslöser und Markt beobachten

Die Strategie wird bei jedem Kerzenschluss der Handelszeiteinheit ausgewertet (Auslöser `Kerzenschluss` mit der Zeiteinheit aus dem Strategieparameter Handelszeiteinheit). Dort ändern sich die Wendepunkte des ZigZag der Handelszeiteinheit.

Auf einer größeren Zeiteinheit wird geprüft, ob ein Trend vorliegt:

- Aufwärtstrend: Das letzte Hoch liegt über dem vorletzten Hoch, und das letzte Tief liegt über dem vorletzten Tief.
- Abwärtstrend: Das letzte Hoch liegt unter dem vorletzten Hoch, und das letzte Tief liegt unter dem vorletzten Tief.
- Sonst liegt kein Trend vor.

 Diese größere Zeiteinheit dient als Signalzeiteinheit. Dafür kommen M15, H1, H4 oder D1 infrage.

Liegt kein Trend vor, wird kein Trade geplant. Eine Prüfung der Marktphase entfällt: Die Stop-Order am Einstiegsbezug wird erst ausgeführt, wenn der Kurs ihn überschreitet.

### 2. Handelsmöglichkeit erkennen

Der Anwender wählt die Handelszeiteinheit kleiner als die Signalzeiteinheit; das ist eine Vorgabe für die Werte, keine Prüfung im Ablauf oder in der Konsistenzprüfung. Welche Paarungen sich bewährt haben, zeigt die Tabelle; sie ist eine Empfehlung für die Werte der beiden Strategieparameter, nicht Teil des Ablaufs:

| Signalzeiteinheit | mögliche Handelszeiteinheiten |
|---|---|
| M15 | M5 oder M1 |
| H1 | M15 oder M5 |
| H4 | H1 oder M15 |
| D1 | H4 oder H1 |

Die Handelsrichtung ist die Trendrichtung der Signalzeiteinheit. Zeigt die Handelszeiteinheit nach derselben Prüfung keinen Trend oder einen Trend in Gegenrichtung, wird kein Trade geplant. Andernfalls gelten auf der Handelszeiteinheit:

| Bezug | Long | Short |
|---|---|---|
| Einstiegsbezug | letztes Hoch | letztes Tief |
| Stop-Bezug | letztes Tief | letztes Hoch |

Besteht aus dieser Strategie auf diesem Konto und Instrument bereits eine wartende Order oder eine offene Position, endet die Auswertung. Andernfalls würde jeder Kerzenschluss eine weitere Order am selben Einstiegsbezug stellen.

### 3. Trade planen

Einstieg, Stop-Loss und Take-Profit werden als Berechnungen im Ablauf ermittelt und der Order direkt übergeben. Long und Short werden in einem Zweig mit Fallunterscheidung behandelt.

| Wert | Long | Short |
|---|---|---|
| Einstieg | Einstiegsbezug + Spread + Entry-Puffer | Einstiegsbezug − Entry-Puffer |
| Stop-Loss | Stop-Bezug − Stop-Puffer | Stop-Bezug + Stop-Puffer + Spread |
| Take-Profit | Einstieg + (Einstieg − Stop-Loss) + Spread | Einstieg − (Stop-Loss − Einstieg) − Spread |

Entry-Puffer und Stop-Puffer sind Parameter von ungefähr 3 bis 5 Pips. Der Take-Profit ergibt damit ein effektives CRV (Chance-Risiko-Verhältnis) von 1:1.

### 4. Risiko und Handelbarkeit prüfen

Das Handelsvolumen bestimmt die Risikoregel der Strategie: eine Instanz der Regelvorlage „Risiko je Trade“ (Standardwert 1 %, Anforderungen Strategiedesigner req-core-002), die als Regel der Strategie für jede Order gilt. Sie berechnet das Volumen aus Einstieg, Stop-Loss, Tickgröße, Tickwert und einer Risikogrenze von maximal 1 % des Kapitals und rundet es auf den Volumenschritt ab. Kapital ist der Kontostand einschließlich der Gewinne und Verluste offener Positionen.

Danach wird geprüft, ob dieses Volumen das Mindestvolumen des Instruments erreicht. Eine Prüfung der freien Margin ist nicht Teil dieses Testfalls.

Ist der Trade nicht handelbar, nimmt „Order aufgeben“ den Ausgang „nicht gestellt“ und es wird keine Order gestellt. Die Strategie wechselt nicht selbst auf eine kleinere Handelszeiteinheit. Ob die Strategie in einem solchen Fall mit kleineren Zeiteinheiten erneut gestartet wird, kann bei ihrer Anwendung festgelegt werden; das ist ein Neustart mit anderen Werten der beiden Strategieparameter und nicht Teil dieses Testfalls.

### 5. Order stellen

Ist der Trade handelbar, wird eine Stop-Order in Trendrichtung mit dem berechneten Einstieg als Preis sowie Stop-Loss, Take-Profit und Volumen gestellt.

### 6. Ausstehende Order überwachen

Die Verwaltung der Order hat zwei Auslöser: `Tick` und `Kerzenschluss` der Handelszeiteinheit.

Bei jedem Tick: Durchbricht der Kurs den Stop-Bezug, ist die Grundlage des Trades entfallen. Die Order wird gelöscht.

Bei jedem Kerzenschluss der Handelszeiteinheit: Hat der ZigZag einen neuen Stop-Bezug gesetzt und weicht der daraus berechnete Stop-Loss von der Order ab (Vergleich des neu berechneten Stop-Loss mit `Order.Stop-Loss`), werden Stop-Loss und Take-Profit mit „Order ändern“ angepasst. Die Regeln der Strategie gelten dabei erneut, die Risikoregel jetzt prüfend, weil das Volumen einer wartenden Order nicht geändert werden kann. Nimmt „Order ändern“ den Ausgang „nicht geändert“, weil das bestehende Volumen die Risikogrenze nicht mehr einhält oder der Trade nicht mehr regelgerecht handelbar ist, wird die Order gelöscht. Der nächste Auslöser des Hauptablaufs plant den Trade neu.

### 7. Ausführung verarbeiten

Erreicht der Kurs den Einstieg, wird die Order ausgeführt und der Trade ist aktiv. Für diese einfache Strategie ist unmittelbar nach der Ausführung keine Veränderung von Stop-Loss oder Take-Profit vorgesehen.

### 8. Aktiven Trade verwalten

Der aktive Trade wird nicht mehr verändert. Stop-Loss und Take-Profit bleiben auf den bei der Planung beziehungsweise bei einer letzten Anpassung vor der Ausführung festgelegten Werten.

### 9. Trade beenden

Der Trade endet, wenn der Stop-Loss oder der Take-Profit erreicht wird.

## Parameter

| Parameter | Bedeutung | Wert oder Regel | Status |
|---|---|---|---|
| Signalzeiteinheit | Strategieparameter, Zeiteinheit für den Trend | M15, H1, H4 oder D1 | bestätigt |
| Handelszeiteinheit | Strategieparameter, Zeiteinheit für Auslöser, Einstiegsbezug, Stop-Bezug, Tradeplanung und Verwaltung der Order | kleiner als die Signalzeiteinheit, Empfehlung nach der Paarungstabelle in Abschnitt 2 | bestätigt |
| Entry-Puffer | zusätzlicher Abstand hinter dem Einstiegsbezug | Strategieparameter, Wert im Bereich von ungefähr 3–5 Pips, kann instrumentabhängig sein | bestätigt |
| Stop-Puffer | zusätzlicher Abstand hinter dem Stop-Bezug | Strategieparameter, Wert im Bereich von ungefähr 3–5 Pips, kann instrumentabhängig sein | bestätigt |
| Risikogrenze | maximaler Verlust je Trade, Regelvorlage „Risiko je Trade“ | 1 % des Kapitals | bestätigt |
| effektives CRV | Verhältnis von möglichem Gewinn zu möglichem Verlust | 1:1 einschließlich Spread und vorgesehenem Puffer | bestätigt |
| ZigZag-Einstellung | Bestimmung der Wendepunkte | ZigZag nach dem Verfahren des in MetaTrader 5 mitgelieferten Indikators, Parameter Depth (Standard 12), Deviation (Standard 5), Backstep (Standard 3) | bestätigt |

Entry-Puffer und Stop-Puffer werden in der Praxis nach Erfahrung gewählt, etwa größer bei hoher Volatilität ohne ausgeprägtes Trendverhalten. Diese Einschätzung ist nicht als Regel fassbar. Deshalb sind beide Puffer Parameter. Geeignete Werte werden im Backtesting ermittelt.

Der ZigZag-Indikator ist ein Indikator von pipwerk. Er rechnet nach demselben Verfahren wie der in MetaTrader 5 mitgelieferte ZigZag-Indikator und liefert bei gleichen Kursdaten und Parametern dieselben Punkte. Er ist damit unabhängig von MetaTrader und auch im Backtesting verfügbar.

## Offene fachliche Fragen

- Beim Short-Trade enthält der Stop-Loss den Spread zum Zeitpunkt der Planung. Ändert sich nur der Spread, weicht der in Abschnitt 6 neu berechnete Stop-Loss von `Order.Stop-Loss` ab, obwohl der Stop-Bezug gleich geblieben ist. Ob die Order dann angepasst werden soll, ist offen. Für die Gestaltung im Strategiedesigner ohne Bedeutung.

## Bestätigungsvermerk

- fachlich geprüft durch: Auftraggeber
- Ergebnis: bestätigt im Chat am 2026-10-14, Präzisierungen nach dem Prüfbericht der QA bestätigt im Chat am 2026-10-15, Klarstellungen zur Handelszeiteinheit (kein Wechsel im Ablauf) und zur Risikoregel (bestimmt das Volumen) im Chat am 2026-10-15, Margin-Prüfung aus dem Testfall genommen im Chat am 2026-10-16, Prüfung der Bewegung gestrichen und Trend aus den Wendepunkten des ZigZag statt Indikator Markttechnik im Chat am 2026-10-21
- Datum: `2026-10-21`

## Herkunft

Die Beschreibung geht auf die Datei `scalping-punkt-2-ausbruch-einfach(1).md` des Auftraggebers zurück. Diese Datei liegt nicht im Repository. Maßgeblich ist allein dieses Dokument.
