# Anforderungs- und Bausteinmatrix der acht Teststrategien

## 1. Zweck und Stand

Die acht Strategien bilden den Testkorpus für den grafischen Strategiedesigner. Die Matrix ermittelt gemeinsame Bausteine, besondere Modellierungsanforderungen und noch offene fachliche Festlegungen.

Die beiden Punkt-2-Ausbruchstrategien sind fachliche Beschreibungen des Nutzers. Die sechs weiteren Strategien sind Testentwürfe. Keine der Strategien ist damit als profitabel oder vollständig ausführbar nachgewiesen.

## 2. Strategien

| id | Strategie | Hauptzweck im Testkorpus |
|---|---|---|
| str-01 | Punkt-2-Ausbruch, einfach | Markttechnik, ZigZag, mehrere Zeiteinheiten, Pending Order |
| str-02 | Punkt-2-Ausbruch, erweitert | dynamische Risikoprüfung und Anpassung einer Pending Order |
| str-03 | EMA-Trendfolge | Indikatoren, Kreuzungsereignisse, Trailing-Stop |
| str-04 | Bollinger-/RSI-Mean-Reversion | parallele Berechnungen, kombinierte Bedingungen, Bestätigung |
| str-05 | zeitgebundener Volatilitätsausbruch | Sitzungsfenster, gespeicherte Werte, täglicher Reset |
| str-06 | Pairs Trading | mehrere Instrumente, Synchronisation, gekoppelte Orders |
| str-07 | Multi-Timeframe-Trend und Entry | mehrere Zeiteinheiten und abgeschlossene Kerzen |
| str-08 | regimeabhängige Strategie | Klassifikation, Verzweigung, austauschbare Teilstrategien |

## 3. Fachliche Anforderungsmatrix

| Strategie | Daten und Analyse | Signal und Zustand | Order und Risiko | Besonderheit |
|---|---|---|---|---|
| str-01 | Signal- und Handelszeiteinheit; ZigZag; Voigt-Markttechnik | Trendrichtung; Bewegung/Korrektur; Punkt-2-Durchbruch auf Tick-Ebene | Stop-Entry; SL hinter Punkt 1/3; TP mit effektivem CRV 1:1; Risiko maximal 1 % | Wahl einer kleineren Handelszeiteinheit, falls das Volumen nicht handelbar ist |
| str-02 | wie str-01; zusätzlich Bewegungsgrößen aus vollständigen ZigZag-Bewegungen | Pending Order muss auf seltene Korrektur des vorläufigen Punktes 1/3 reagieren | Neuberechnung von SL, TP, Risiko, Volumen und Margin; Änderung oder Stornierung der Order | nach Aktivierung Wechsel in einen finalen, nicht mehr veränderten Trade |
| str-03 | Kursreihe; schneller und langsamer EMA; optional Trendfilter und ATR | CrossOver/CrossUnder; flat/long/short | Markt- oder Stop-Entry; ATR-Stop; Trailing-Stop; Exit bei Gegensignal | einfacher Referenzfall für laufende Indikatorberechnung |
| str-04 | Kursreihe; Bollinger-Bänder; RSI; optional Volatilitätsfilter | Überdehnung; Bestätigung; Position | Entry nach Bestätigung; Exit am Mittelband; Schutz-Stop | Setup besitzt eine zeitliche Gültigkeit |
| str-05 | Hoch und Tief innerhalb eines Zeitfensters | Range-Aufbau; Range fixiert; ausbruchsbereit; gehandelt/gesperrt | Breakout-Order; maximal ein Trade je Sitzung; Zeit-Exit | Werte werden eingefroren und täglich zurückgesetzt |
| str-06 | zwei synchronisierte Instrumente; Spread oder Verhältnis; Z-Score | flat; Entry ausstehend; Spread long/short; Leg-Risk | zwei gekoppelte Orders; Hedge-Verhältnis; Teil-Fill-Behandlung | Stabilität und Strukturbruch des Instrumentenpaars |
| str-07 | höherer und niedrigerer Zeitrahmen; Resampling | höherer Trend als Filter; Entry auf kleinerer Zeiteinheit | Stop am lokalen Extrem; Exit über Entry- oder Trendwechsel | keine Verwendung einer noch nicht abgeschlossenen höheren Kerze |
| str-08 | Daten für Regimeklassifikation | Trend; seitwärts; hohe Volatilität; Übergang | eigene Entry-, Exit- und Risikoregeln je Regime | genau ein aktiver Teilgraph; definierte Behandlung offener Positionen beim Wechsel |

## 4. Abdeckung benötigter Fähigkeiten

Legende: **x** = benötigt, **–** = nicht kennzeichnend für diesen Testfall.

| Fähigkeit | str-01 | str-02 | str-03 | str-04 | str-05 | str-06 | str-07 | str-08 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Tick-Ereignisse | x | x | – | – | x | – | – | – |
| Kerzenereignisse | x | x | x | x | x | x | x | x |
| mehrere Zeiteinheiten | x | x | – | – | – | – | x | – |
| mehrere Instrumente | – | – | – | – | – | x | – | – |
| technische Indikatoren | ZigZag | ZigZag | EMA/ATR | BB/RSI | – | Statistik | optional | Klassifikation |
| bestätigte/vorläufige Werte | x | x | – | x | x | x | x | x |
| gespeicherte Werte | x | x | – | x | x | x | x | x |
| explizite Zustände | x | x | x | x | x | x | x | x |
| Zeitfenster/Reset | – | – | – | optional | x | – | – | x |
| Pending Order | x | x | optional | optional | x | x | optional | abhängig vom Teilgraphen |
| Orderänderung vor Fill | x | x | – | – | optional | x | – | abhängig vom Teilgraphen |
| gekoppelte Orders | – | – | – | – | – | x | – | – |
| Teil-Fills/Leg-Risk | – | – | – | – | – | x | – | – |
| dynamische Positionsgröße | x | x | x | x | x | x | x | x |
| hierarchische Teilgraphen | sinnvoll | sinnvoll | optional | optional | sinnvoll | sinnvoll | sinnvoll | erforderlich |
| manueller Eingabepunkt | möglich | möglich | – | – | – | – | – | möglich |
| Benachrichtigung | sinnvoll | sinnvoll | optional | optional | optional | wichtig | optional | optional |

## 5. Vorläufiger Bausteinkatalog

### 5.1 Datenquellen

| id | Baustein | Ein- und Ausgaben |
|---|---|---|
| nd-data-market | Marktdaten | Instrument, Zeiteinheit → Tick- und Kerzendaten |
| nd-data-account | Konto | → Kapital, freie Margin, offene Positionen |
| nd-data-broker | Brokerregeln | → Spread, Mindestlot, Volumenschritt, Marginanforderung |
| nd-data-session | Handelszeit | Zeitplan → Sitzungsbeginn, Sitzungsende, Reset |

### 5.2 Analyse und Berechnung

| id | Baustein | Aufgabe |
|---|---|---|
| nd-ind-zigzag | ZigZag | liefert vorläufige und bestätigte Swingpunkte |
| nd-structure-123 | 1-2-3-Markttechnik | klassifiziert Swingpunkte, Trendrichtung und Marktphase |
| nd-ind-ma | gleitender Durchschnitt | erzeugt EMA- oder SMA-Reihe |
| nd-ind-atr | ATR | misst Handelsspanne/Volatilität |
| nd-ind-bbands | Bollinger-Bänder | erzeugt Mittelband und äußere Bänder |
| nd-ind-rsi | RSI | erzeugt Oszillatorwert |
| nd-stat-spread | Spread/Verhältnis | kombiniert zwei Instrumente |
| nd-stat-zscore | Z-Score | standardisiert den Spread rollierend |
| nd-calc-range | Bereichsakkumulator | sammelt Hoch und Tief in einem Zeitfenster |
| nd-calc-average-leg | Bewegungsgröße | berechnet Kennwert aus vollständigen ZigZag-Bewegungen |
| nd-class-regime | Regimeklassifikation | liefert Marktregime und Konfidenz/Status |

### 5.3 Bedingungen und Ereignisse

| id | Baustein | Aufgabe |
|---|---|---|
| nd-event-tick-cross | Tick-Durchbruch | erkennt Über- oder Unterschreitung ohne Kerzenschluss |
| nd-event-series-cross | Reihen-Kreuzung | erkennt CrossOver/CrossUnder zweier Reihen |
| nd-condition-compare | Vergleich | vergleicht Werte oder Reihen |
| nd-logic | Logik | AND, OR, NOT |
| nd-validity | Gültigkeitsfenster | begrenzt Lebensdauer eines Setups |
| nd-confirmation | Bestätigung | wartet auf n Ereignisse/Kerzen oder definierte Rückkehr |
| nd-event-value-update | Wert aktualisiert | reagiert auf Änderung eines vorläufigen Swingpunkts |

### 5.4 Zustand und Ablauf

| id | Baustein | Aufgabe |
|---|---|---|
| nd-state | Zustand | hält einen fachlichen Zustand |
| nd-transition | Übergang | wechselt bei Ereignis und Bedingung den Zustand |
| nd-memory | Speicher | hält Punkt, Preis, Zeit oder berechneten Wert |
| nd-latch | Einmal-Schalter | verhindert wiederholte Auslösung |
| nd-reset | Reset | setzt Zustände und Speicher zurück |
| nd-subgraph | Teilstrategie | kapselt und klappt einen Detailgraphen ein |
| nd-selector | Selektor | aktiviert genau einen Teilgraphen |
| nd-manual-input | manuelle Entscheidung | fordert Wert oder Freigabe vom Nutzer an |
| nd-notification | Benachrichtigung | meldet Zustand, Prüfung oder Ausnahme |

### 5.5 Order und Risiko

| id | Baustein | Aufgabe |
|---|---|---|
| nd-entry-price | Einstiegspreis | berechnet Entry einschließlich Spread und Puffer |
| nd-stop-loss | Stop-Loss | berechnet SL aus Struktur, ATR oder festem Abstand |
| nd-take-profit | Take-Profit | berechnet TP aus Einstieg und effektivem CRV |
| nd-position-size | Positionsgröße | berechnet Volumen aus Risiko und Stop-Abstand |
| nd-tradability | Handelbarkeitsprüfung | prüft Mindestlot, Volumenschritt und Margin |
| nd-order-place | Order platzieren | erzeugt Markt-, Stop- oder Limit-Order |
| nd-order-modify | Order ändern | ändert Preis, SL, TP oder Volumen vor Ausführung |
| nd-order-cancel | Order stornieren | entfernt eine ausstehende Order |
| nd-order-group | Ordergruppe | koordiniert gekoppelte Orders |
| nd-fill-monitor | Ausführungsüberwachung | verarbeitet Fill, Teil-Fill und Ablehnung |
| nd-position-manage | Positionsverwaltung | verändert oder beendet eine offene Position |

## 6. Erforderliche Verbindungstypen

| Typ | Inhalt | Beispiele |
|---|---|---|
| market-data | Marktwerte mit Instrument und Zeitbezug | Tick, Kerze, Kursreihe |
| numeric | einzelner numerischer Wert | Preis, Spread, ATR, Risiko |
| series | zeitlich geordnete Wertreihe | EMA, RSI, Z-Score |
| boolean | wahr/falsch | Trend intakt, Margin ausreichend |
| event | einmaliges Ereignis | Tick-Durchbruch, neue Kerze, Fill |
| state | fachlicher Zustand | flat, order pending, trade active |
| level | Preisniveau mit Herkunft und Status | Punkt 2, Range-Hoch, Stop-Level |
| order | Orderentwurf oder Brokerorder | Pending Order, gekoppelte Order |
| position | offene Position mit Ausführungsdaten | Long-, Short- oder Spread-Position |
| instrument-context | Instrument-, Pip- und Brokerbezug | Symbol, Tickgröße, Pipwert |

## 7. Gemeinsame Laufzeitregeln

Aus den Strategien ergeben sich bereits folgende Anforderungen an das Ausführungsmodell:

1. Jeder Wert trägt Instrument, Zeiteinheit und Zeitstempel.
2. Vorläufige und bestätigte Werte werden getrennt behandelt.
3. Tick- und Kerzenereignisse dürfen nicht stillschweigend gleichgesetzt werden.
4. Eine Order ist vor ihrer Ausführung ein veränderbares Objekt mit eigener Identität.
5. Nach jeder Änderung von Entry oder Stop erfolgt eine erneute Risiko- und Handelbarkeitsprüfung.
6. Backtest und Live-Betrieb verwenden dieselben fachlichen Regeln.
7. Der Backtest darf ausschließlich Werte verwenden, die zum jeweiligen Zeitpunkt bereits bekannt waren.
8. Menschliche Entscheidungen werden als protokollierte Ereignisse modelliert.
9. Komplexe Fachbereiche können als Teilgraph gekapselt und ein- oder ausgeklappt werden.
10. Long und Short können als Richtung eines gemeinsamen Regelwerks modelliert werden, sofern keine fachlich abweichenden Regeln bestehen.

## 8. Noch offene Festlegungen

### str-01 und str-02

- konkrete ZigZag-Variante und ihre Parameter
- genaue formale Abbildung der ZigZag-Punkte auf die 1-2-3-Markttechnik
- Regel zur Bestätigung eines Swingpunkts
- Puffer am Einstieg und hinter Punkt 1/3 je Instrument
- Anzahl der vollständigen Bewegungen für str-02
- Kennwert für diese Bewegungen: Mittelwert, Median oder andere Regel
- Verhalten, wenn die nächstkleinere Handelszeiteinheit ebenfalls kein handelbares Volumen erlaubt

### str-03 bis str-08

Diese Strategien sind Testentwürfe. Märkte, Parameter, exakte Entry-/Exit-Regeln und Ausführungsdetails sind noch nicht festgelegt. Für die Ableitung der Editorstruktur genügt zunächst ihre strukturelle Verschiedenheit. Vor einem ausführbaren Prototyp müssen sie jeweils präzisiert werden.

## 9. Ergebnis

Die acht Strategien decken gemeinsam die wesentlichen Strukturklassen des geplanten Designers ab:

- Datenfluss und Indikatoren
- Marktstruktur und veränderliche Swingpunkte
- Tick- und Kerzenereignisse
- Zustände und zeitliche Reihenfolgen
- mehrere Zeiteinheiten und Instrumente
- Pending Orders, Orderänderungen und gekoppelte Ausführung
- Risiko-, Margin- und Volumenprüfung
- manuelle Eingaben und Benachrichtigungen
- hierarchische und umschaltbare Teilstrategien

Der nächste belastbare Entwurf kann daher auf diesem Bausteinkatalog aufbauen. Weitere Strategien werden erst dann benötigt, wenn ein neuer Testfall eine bislang nicht abgedeckte Struktur einführt.
