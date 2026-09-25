# Teststrategien für den grafischen Strategiedesigner

## Zweck

Diese Strategien dienen zunächst als **Modellierungs- und Testfälle** für den grafischen Strategieeditor. Sie sind keine Anlageempfehlungen und noch nicht auf Handelsprofitabilität geprüft. Zusammen decken sie andere Strukturen ab als die geplanten 1-2-3-Strategien auf Basis klassischer Markttechnik.

## Gemeinsame Festlegungen vor einem Backtest

Für jede Strategie müssen später eindeutig definiert werden:

- Markt und Instrument
- Zeiteinheit und Handelszeiten
- Datenquelle und Umgang mit Datenlücken
- Signalzeitpunkt und Orderzeitpunkt
- Ordertyp sowie Fill- und Slippage-Modell
- Gebühren
- Positionsgröße und maximales Risiko
- Verhalten bei mehreren gleichzeitigen Signalen
- Regeln für Long, Short und Wiederaufnahme nach einem Exit

Ohne diese Angaben ist eine Idee beschreibbar, aber nicht reproduzierbar ausführbar.

---

## 1. Trendfolge mit gleitenden Durchschnitten

### Ziel

Einfacher Referenzfall für Indikatoren, Kreuzungsereignisse und laufendes Positionsmanagement.

### Beispielregeln

- Berechne einen schnellen und einen langsamen exponentiellen gleitenden Durchschnitt.
- Long-Setup: Der schnelle EMA kreuzt den langsamen EMA von unten nach oben.
- Short-Setup: Der schnelle EMA kreuzt den langsamen EMA von oben nach unten.
- Optionaler Trendfilter: Eine Position ist nur erlaubt, wenn ein zusätzlicher Trendindikator einen Mindestwert überschreitet.
- Initialer Stop: Abstand als Vielfaches der ATR.
- Nachziehen des Stops: abhängig von ATR oder dem seit Einstieg erreichten Extremkurs.
- Exit: Gegensignal oder Stop-Ausführung.

### Zustände

`FLAT`, `LONG`, `SHORT`

### Prüft im Editor

- parallele Indikatorberechnung
- CrossOver- und CrossUnder-Ereignisse
- typisierte Signale
- Stop-Berechnung aus einem beim Einstieg bekannten Wert
- fortlaufende Aktualisierung eines Trailing-Stops

---

## 2. Mean Reversion mit Bollinger-Bändern und RSI

### Ziel

Test von parallelen Berechnungen, kombinierten Bedingungen und Rückkehr zu einem dynamischen Mittelwert.

### Beispielregeln

- Berechne Bollinger-Bänder und RSI aus derselben Kursreihe.
- Long-Setup: Schlusskurs liegt unter dem unteren Band und der RSI unterschreitet einen unteren Grenzwert.
- Short-Setup: Schlusskurs liegt über dem oberen Band und der RSI überschreitet einen oberen Grenzwert.
- Entry erst nach einer Bestätigung, beispielsweise der Rückkehr innerhalb des Bandes.
- Exit am mittleren Bollinger-Band.
- Schutz-Stop außerhalb des jüngsten Extrempunkts oder ATR-basiert.
- Optional: kein Einstieg bei außergewöhnlich hoher Volatilität.

### Zustände

`NEUTRAL`, `ÜBERDEHNUNG_ERKANNT`, `BESTÄTIGUNG`, `IN_POSITION`

### Prüft im Editor

- Aufteilung eines Datenstroms auf mehrere Indikatoren
- AND-Verknüpfungen und symmetrische Long-/Short-Regeln
- Abfolge von Setup und Bestätigung
- dynamisches Exit-Ziel
- zeitliche Gültigkeit eines Setups

---

## 3. Zeitgebundener Volatilitätsausbruch

### Ziel

Test von Zeitfenstern, gespeicherten Werten und einmalig gültigen Ereignissen.

### Beispielregeln

- Ermittle Hoch und Tief innerhalb eines festgelegten Zeitfensters.
- Friere beide Werte am Ende des Fensters als Tages-Range ein.
- Long-Setup: Kurs überschreitet danach das Range-Hoch.
- Short-Setup: Kurs unterschreitet danach das Range-Tief.
- Pro Handelstag ist nur der erste gültige Ausbruch handelbar.
- Stop auf der Gegenseite der Range oder in definiertem Abstand innerhalb der Range.
- Exit über Kursziel, Stop oder spätestens zu einer festgelegten Uhrzeit.
- Zu Beginn des nächsten Handelstags werden Range und Status zurückgesetzt.

### Zustände

`RANGE_AUFBAU`, `RANGE_FIXIERT`, `AUSBRUCH_BEREIT`, `TRADE_AKTIV`, `FÜR_HEUTE_GESPERRT`

### Prüft im Editor

- Zeit- und Sitzungsknoten
- Akkumulation von Hoch und Tief
- Speichern und Einfrieren von Werten
- täglicher Reset
- Begrenzung der Signalanzahl

---

## 4. Pairs Trading / statistische Arbitrage

### Ziel

Test von mehreren Instrumenten, synchronisierten Daten und gekoppelten Orders.

### Beispielregeln

- Lade zeitlich synchronisierte Kursreihen zweier Instrumente.
- Berechne ein Preisverhältnis oder einen abgesicherten Spread.
- Standardisiere den Spread als rollierenden Z-Score.
- Entry: Der absolute Z-Score überschreitet einen festgelegten Grenzwert.
- Gleichzeitig: Kaufe das relativ schwache und verkaufe das relativ starke Instrument.
- Exit: Der Z-Score kehrt in die Nähe seines Mittelwerts zurück.
- Notausstieg: Der Z-Score überschreitet eine zweite Grenze oder die Beziehung der Instrumente verliert ihre Gültigkeit.
- Beide Orderteile bilden eine gemeinsame Transaktionseinheit.

### Zustände

`FLAT`, `ENTRY_AUSSTEHEND`, `SPREAD_LONG`, `SPREAD_SHORT`, `LEG_RISK`, `EXIT_AUSSTEHEND`

### Prüft im Editor

- mehrere Instrumente und Datenquellen
- Zeitsynchronisation
- rollierende Statistik
- gekoppelte Positionsgrößen
- Teil-Fills und einseitiges Ausführungsrisiko
- gemeinsames Positions- und Risikomodell

### Fachlicher Hinweis

Ein Z-Score allein belegt keine stabile statistische Beziehung. Vor einem realen Test braucht die Strategie Regeln für Auswahl, Stabilität und mögliche Strukturbrüche des Instrumentenpaars.

---

## 5. Multi-Timeframe-Trend und Entry

### Ziel

Test von mehreren Zeitebenen und eindeutiger zeitlicher Zuordnung bereits abgeschlossener Kerzen.

### Beispielregeln

- Bestimme den übergeordneten Trend in einem Stundenchart.
- Erzeuge Entries in einem 5-Minuten-Chart nur in Richtung dieses Trends.
- Beispiel Long: Stunden-Trend positiv, kurzfristiger Rücksetzer und anschließendes Long-Bestätigungssignal.
- Beispiel Short: spiegelbildliche Regeln.
- Stop unter beziehungsweise über dem lokalen Extrempunkt des Entry-Charts.
- Exit über Gegensignal im Entry-Chart oder Wechsel des übergeordneten Trends.

### Zustände

`HTF_NEUTRAL`, `HTF_LONG`, `HTF_SHORT`, jeweils kombiniert mit `FLAT` oder `IN_POSITION`

### Prüft im Editor

- Datenströme verschiedener Zeiteinheiten
- Resampling und Zeitachsen-Synchronisation
- klare Trennung zwischen Filter und Entry
- Verwendung ausschließlich abgeschlossener höherer Kerzen
- Vermeidung von Look-ahead-Fehlern

---

## 6. Regimeabhängige Strategie

### Ziel

Test von Klassifikation, Verzweigung und mehreren austauschbaren Teilstrategien.

### Beispielregeln

- Klassifiziere das Marktregime als `TREND`, `SEITWÄRTS` oder `HOHE_VOLATILITÄT`.
- Im Zustand `TREND` ist eine Trendfolgestrategie aktiv.
- Im Zustand `SEITWÄRTS` ist eine Mean-Reversion-Strategie aktiv.
- Im Zustand `HOHE_VOLATILITÄT` wird nicht gehandelt oder das Risiko reduziert.
- Ein Regimewechsel wird erst nach definierter Bestätigung wirksam, um häufiges Umschalten zu begrenzen.
- Offene Positionen werden nach einer eigenen Übergangsregel gehalten, angepasst oder geschlossen.

### Zustände

`TREND`, `SEITWÄRTS`, `HOHE_VOLATILITÄT`, `ÜBERGANG`

### Prüft im Editor

- Klassifikationsknoten
- Auswahl genau eines aktiven Teilgraphen
- hierarchische und einklappbare Strategiemodule
- Hysterese oder zeitliche Bestätigung
- Übergangsregeln bei offenen Positionen
- getrennte Risikoparameter je Regime

### Fachlicher Hinweis

Die Regimeklassifikation ist Teil der Strategie und nicht objektiv vorgegeben. Definition und Umschaltregeln müssen vollständig sichtbar und backtestbar sein.

---

## Abdeckung der Testfälle

| Strategie | Zentrale Modellierungsanforderung |
|---|---|
| EMA-Trendfolge | Indikatoren, Kreuzungen, Trailing-Stop |
| Bollinger/RSI Mean Reversion | parallele Berechnungen, kombinierte Bedingungen |
| Volatilitätsausbruch | Zeitfenster, Speicher, Reset |
| Pairs Trading | mehrere Instrumente, gekoppelte Orders |
| Multi-Timeframe | mehrere Zeitachsen, Synchronisation |
| Regimeabhängig | Zustandsautomat, Teilstrategien, Hierarchie |
| 1-2-3-Markttechnik des Nutzers | Marktstruktur, Reihenfolge, Referenzpunkte, Invalidierung |

## Status

Die sechs Strategien sind derzeit **fachliche Entwürfe für die Modellierung**. Parameterwerte, exakte Ausführungsregeln und Märkte bleiben bewusst offen. Diese Details werden erst festgelegt, wenn die Strategien in ein eindeutiges, ausführbares Strategiemodell überführt werden.
