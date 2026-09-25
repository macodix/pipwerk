# Strategiesammlung für den Trading-Strategiedesigner

**Stand:** 20.09.2026\
**Status:** Arbeitsdokument v0.5\
**Zweck:** Aufbau eines belegten Strategie-Testkorpus für den
Trading-Strategiedesigner und Gewinnung von Fachbegriffen als Kandidaten
für das spätere Fachmodell und Glossar.

### Inhaltsverzeichnis

- **1. Methodik**
- **2. Trend- und Breakout-Strategien**
  - 2.1 Moving-Average-Crossover
  - 2.2 Price-to-Moving-Average-Crossover
  - 2.3 Donchian-/Channel-Breakout
  - 2.4 Turtle Trading -- System 1 und System 2
  - 2.5 Time-Series Momentum
  - 2.6 Moving Momentum
- **3. Momentum- und Relative-Stärke-Strategien**
  - 3.1 Cross-Sectional Momentum -- Winners minus Losers
  - 3.2 52-Week-High Momentum
  - 3.3 Currency Momentum
  - 3.4 Volumenbestätigtes Momentum
  - 3.5 Cross-Asset Value and Momentum
- **4. Mean-Reversion- und Contrarian-Strategien**
  - 4.1 RSI(2) Mean Reversion
  - 4.2 Pairs Trading
  - 4.3 `str-04` – Mean Reversion mit Bollinger-Bändern und RSI
- **5. Volatilitätsstrategien**
  - 5.1 Bollinger Band Squeeze
  - 5.2 TTM Squeeze
- **6. Multi-Timeframe-Strategien**
  - 6.1 CCI Correction
  - 6.2 Ichimoku Cloud Strategy
  - 6.3 `str-07` – Multi-Timeframe-Trend und Entry
- **7. Intraday- und Session-Strategien**
  - 7.1 Opening Range Breakout (ORB)
  - 7.2 Gap Trading
  - 7.3 `str-05` – Zeitgebundener Volatilitätsausbruch
- **8. Indikator- und Zustandsstrategien**
  - 8.1 Parabolic SAR / Stop and Reverse
  - 8.2 Directional Movement / ADX mit DI-Crossover
  - 8.3 MACD Signal-Line Crossover
  - 8.4 `str-08` – Regimeabhängige Strategie
- **9. Ereignis- und Fundamentaldatenstrategien**
  - 9.1 Post-Earnings-Announcement Drift (PEAD)
  - 9.2 Value / Fundamental Contrarian
  - 9.3 Quality Minus Junk
  - 9.4 News-/Textsignal aus Earnings Conference Calls
- **10. Währungsstrategien**
  - 10.1 Currency Carry Trade
- **11. Portfolio- und Querschnittsstrategien**
  - 11.1 Betting Against Beta (BAB)
  - 11.2 Tactical Asset Allocation nach Faber
- **12. Rohstoff- und Futuresstrategien**
  - 12.1 Commodity Momentum + Term Structure
  - 12.2 Commodity Triple Screen: Momentum, Term Structure, Volatilität
- **13. Kalender- und Zeitstrategien**
  - 13.1 Turn-of-the-Month
  - 13.2 Saisonale Querschnittsstrategie
- **14. Markttechnik / Price Action**
  - 14.1 1-2-3-Markttechnik als Strategiegrundlage
  - 14.2 `str-01` – Scalping Punkt-2-Ausbruch, einfache Strategie
  - 14.3 `str-02` – Punkt-2-Ausbruch mit erweiterter Stop-Anpassung
  - 14.4 Chartpattern-Erkennung: Head-and-Shoulders / Double Bottom
  - 14.5 Candlestick-basierte Handelsregeln
- **15. Options- und Derivatestrategien**
  - 15.1 Volatilitätsrisikoprämie mit Optionen
  - 15.2 0DTE-Optionsstrategien
- **16. Markt-Mikrostruktur- und Liquiditätsstrategien**
  - 16.1 Avellaneda-Stoikov Market Making
  - 16.2 Order-Flow als Strategiegrundlage
- **17. Ereignis- und Relative-Value-Arbitrage**
  - 17.1 Merger Arbitrage / Risk Arbitrage
  - 17.2 Pairs Trading als Relative-Value-Arbitrage
- **18. Vorläufiger Begriffspool**
- **19. Erste Erkenntnisse für den Designer -- noch keine Festlegungen**

---

# 1. Methodik

Dieses Dokument sammelt **beschriebene Handelsstrategien**, nicht bloß
Strategienamen. Jede aufgenommene Strategie benötigt mindestens eine
nachvollziehbare Quelle. Bevorzugt werden Originalpublikationen,
wissenschaftliche Arbeiten, Bücher der Urheber oder fachlich belastbare
Dokumentationen.

Die Aufnahme einer Strategie bedeutet **nicht**, dass ihre
Profitabilität behauptet wird. Historische Backtests, empirische Studien
und veröffentlichte Ergebnisse sind Nachweise dafür, dass eine Strategie
beschrieben oder untersucht wurde. Sie sind kein allgemeiner oder
zeitunabhängiger Beweis zukünftiger Profitabilität.

Für den Trading-Strategiedesigner interessiert vor allem:

1.  Welche Eingangsdaten benötigt eine Strategie?
2.  Welche fachlichen Größen werden daraus gebildet?
3.  Welche Zustände, Bedingungen und Ereignisse werden ausgewertet?
4.  Wie entstehen Entry und Exit?
5.  Welche Positions-, Risiko- und Zeitregeln gehören zur Strategie?
6.  Welche Fachbegriffe treten dabei auf?

Die am Ende jeder Strategie genannten **Begriffskandidaten** sind
zunächst eine Rohsammlung. Sie sind ausdrücklich noch nicht als
fachliche Objekte klassifiziert. Ein Kandidat kann sich später z. B. als
Objekt, Eigenschaft, Wert, Ereignis, Bedingung, Berechnung oder Relation
herausstellen.

------------------------------------------------------------------------

# 2. Trend- und Breakout-Strategien

## 2.1 Moving-Average-Crossover

**Herkunft:** extern belegte Strategie; zugleich fachliche Grundlage des früheren Projekt-Testfalls `str-03` („Trendfolge mit gleitenden Durchschnitten“).

### Grundidee

Zwei gleitende Durchschnitte unterschiedlicher Länge werden auf
derselben Wertreihe berechnet. Der kürzere Durchschnitt reagiert
schneller auf Preisänderungen als der längere. Ein Kreuzen der beiden
Durchschnitte dient als Richtungs- bzw. Handelssignal.

Eine typische Long-Regel lautet: Der kurzfristige gleitende Durchschnitt
kreuzt den langfristigen von unten nach oben. Für Short wird die Logik
umgekehrt. Varianten verwenden statt zweier Durchschnitte den Preis und
einen einzelnen gleitenden Durchschnitt.

Die Periodenlängen sind Parameter der Strategie. Sie verändern
Reaktionsgeschwindigkeit und Signaldichte und gehören deshalb nicht zur
allgemeinen Definition des Verfahrens.

### Für den Designer interessant

Die Strategie benötigt mindestens eine Wertreihe, zwei parametrisierte
Berechnungen, eine Kreuzungsbedingung, eine Richtung und Regeln zur
Eröffnung bzw. Beendigung einer Position. Eine Kreuzung ist dabei mehr
als ein einfacher Vergleich zweier aktueller Werte: Sie beschreibt einen
Zustandswechsel zwischen zwei aufeinanderfolgenden Auswertungen.

### Begriffskandidaten

Preis, Wertreihe, gleitender Durchschnitt, Periode, kurzfristiger
Durchschnitt, langfristiger Durchschnitt, Kreuzung, Signal, Long, Short,
Position, Entry, Exit.

### Quellen

-   StockCharts ChartSchool: *Moving Average Trading Strategies*.
    https://chartschool.stockcharts.com/table-of-contents/trading-strategies-and-models/trading-strategies/moving-average-trading-strategies
-   Brock, W.; Lakonishok, J.; LeBaron, B. (1992): *Simple Technical
    Trading Rules and the Stochastic Properties of Stock Returns*.
    Journal of Finance 47(5).

------------------------------------------------------------------------

## 2.2 Price-to-Moving-Average-Crossover

### Grundidee

Hier wird nicht das Verhältnis zweier gleitender Durchschnitte
gehandelt, sondern das Verhältnis zwischen Preis und gleitendem
Durchschnitt. Ein Wechsel des Preises von unterhalb nach oberhalb des
Durchschnitts kann als Long-Signal interpretiert werden; die
Gegenrichtung als Short- oder Exit-Signal.

In konkreten Ausprägungen können zusätzliche Filter verwendet werden,
etwa Richtung des Durchschnitts, Volumen, RSI oder Stochastic
Oscillator.

### Für den Designer interessant

Die Strategie verbindet Rohdaten und abgeleitete Wertreihen unmittelbar
miteinander. Sie zeigt außerdem, dass ein Signal aus einem Basissignal
und zusätzlichen Bestätigungen bestehen kann.

### Begriffskandidaten

Preis, Schlusskurs, gleitender Durchschnitt, Kreuzung, Trend,
Trendrichtung, Filter, Bestätigung, Volumen, Momentum, Signal, Entry,
Exit.

### Quelle

-   StockCharts ChartSchool: *How To Trade Price-to-Moving Average
    Crossovers*.
    https://chartschool.stockcharts.com/table-of-contents/trading-strategies-and-models/trading-strategies/moving-average-trading-strategies/how-to-trade-price-to-moving-average-crossovers

------------------------------------------------------------------------

## 2.3 Donchian-/Channel-Breakout

### Grundidee

Für einen definierten Rückblickzeitraum werden das höchste Hoch und das
tiefste Tief bestimmt. Daraus entsteht ein Preiskanal. Ein Ausbruch über
das obere Kanalniveau erzeugt ein Long-Signal, ein Ausbruch unter das
untere Kanalniveau ein Short-Signal.

Die Strategie ist ein klassisches Beispiel dafür, dass eine
Handelsentscheidung nicht zwingend einen explizit berechneten „Trend"
voraussetzt. Die Richtung ergibt sich aus dem Ausbruch.

### Für den Designer interessant

Benötigt werden Fensterberechnungen über High-/Low-Reihen, dynamische
Grenzen, ein Ausbruchsereignis und getrennte Regeln für beide
Handelsrichtungen.

### Begriffskandidaten

Hoch, Tief, höchstes Hoch, tiefstes Tief, Rückblickzeitraum, Kanal,
Kanalobergrenze, Kanaluntergrenze, Ausbruch, Long, Short, Entry, Exit.

### Quellen

-   StockCharts ChartSchool: *Donchian Trading Guidelines*.
    https://chartschool.stockcharts.com/table-of-contents/overview/donchian-trading-guidelines
-   TurtleTrader: *The Original Turtle Trading Rules*.
    https://www.turtletrader.com/rules/

------------------------------------------------------------------------

## 2.4 Turtle Trading -- System 1 und System 2

### Grundidee

Das Turtle-System ist ein vollständiger mechanischer Trendfolgeansatz.
Die öffentlich dokumentierten Regeln kombinieren Breakout-Entries,
volatilitätsabhängige Positionsgrößen, Stop-Regeln, pyramidenartiges
Hinzufügen weiterer Einheiten und definierte Exits.

System 1 verwendet einen schnelleren Breakout, System 2 einen
langsameren. In den veröffentlichten Regeln werden insbesondere 20- bzw.
55-Tage-Breakouts genannt. Die Volatilitätsgröße „N" basiert auf der
True Range bzw. Average True Range und beeinflusst Positionsgröße, Stops
und das Hinzufügen weiterer Einheiten.

### Für den Designer interessant

Das System ist als Testfall besonders wertvoll, weil eine Strategie hier
nicht nur aus Entry und Exit besteht. Marktselektion, Volatilität,
Kontogröße, Positionsgröße, mehrere Positionseinheiten, Korrelation bzw.
Expositionsbegrenzung und Zustände vorheriger Signale spielen zusammen.

### Begriffskandidaten

Markt, Breakout, 20-Tage-Hoch, 20-Tage-Tief, 55-Tage-Hoch, 55-Tage-Tief,
True Range, Average True Range, Volatilität, N, Einheit, Positionsgröße,
Kontogröße, Risiko, Stop, Pyramiding, Entry, Exit, Long, Short.

### Quellen

-   TurtleTrader: *The Original Turtle Trading Rules*.
    https://www.turtletrader.com/rules/
-   TurtleTrader: *The Original Turtle Trading Rules Explained*.
    https://www.theturtletrader.com/turtle-trading-rules/

------------------------------------------------------------------------

## 2.5 Time-Series Momentum

### Grundidee

Time-Series Momentum betrachtet die eigene Renditehistorie eines
Instruments. Vereinfacht wird eine Long-Position eingenommen, wenn die
vergangene Rendite über einen festgelegten Zeitraum positiv ist, und
eine Short-Position bei negativer vergangener Rendite.

Moskowitz, Ooi und Pedersen untersuchten diesen Ansatz für Futures auf
Aktienindizes, Währungen, Rohstoffe und Anleihen. Entscheidend ist die
Abgrenzung zum Cross-Sectional Momentum: Das Instrument wird gegen seine
eigene Vergangenheit beurteilt, nicht gegen andere Instrumente.

### Für den Designer interessant

Die Strategie benötigt Renditeberechnungen über Zeitfenster,
Richtungsbestimmung, mehrere Instrumente bzw. Märkte und potenziell
Portfolioaggregation.

### Begriffskandidaten

Instrument, Rendite, historische Rendite, Rückblickzeitraum, Momentum,
Richtung, Long, Short, Future, Assetklasse, Portfolio, Gewichtung.

### Quelle

-   Moskowitz, T. J.; Ooi, Y. H.; Pedersen, L. H. (2012): *Time Series
    Momentum*. Journal of Financial Economics 104(2). SSRN:
    https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2089463

------------------------------------------------------------------------

## 2.6 Moving Momentum

### Grundidee

Diese mehrstufige Strategie kombiniert drei unterschiedliche Aufgaben.
Ein gleitender Durchschnitt bestimmt zunächst die längerfristige
Handelsrichtung. Ein Stochastic Oscillator identifiziert eine Korrektur
gegen diese Richtung. Anschließend wird das MACD-Histogramm verwendet,
um eine kurzfristige Umkehr zurück in Richtung des übergeordneten Trends
zu erkennen.

Die Strategie zeigt damit explizit eine Sequenz: **Bias → Korrektur →
Trigger**.

### Für den Designer interessant

Dies ist ein guter Test für zusammengesetzte fachliche Zustände. Eine
Bedingung allein reicht nicht. Ein längerfristiger Zustand muss
bestehen, danach wird ein zweiter Zustand erwartet und schließlich ein
Ereignis als Trigger ausgewertet.

### Begriffskandidaten

Trading Bias, Trend, gleitender Durchschnitt, Korrektur, Stochastic
Oscillator, MACD-Histogramm, Momentum, Umkehr, Trigger, Setup, Signal.

### Quelle

-   StockCharts ChartSchool: *Moving Momentum*.
    https://chartschool.stockcharts.com/table-of-contents/trading-strategies-and-models/trading-strategies/moving-momentum

------------------------------------------------------------------------

# 3. Momentum- und Relative-Stärke-Strategien

## 3.1 Cross-Sectional Momentum -- Winners minus Losers

### Grundidee

Instrumente eines Universums werden nach ihrer vergangenen Performance
geordnet. Instrumente mit hoher vergangener Rendite werden als
„Winners", solche mit niedriger Rendite als „Losers" klassifiziert. Die
klassische Strategie kauft Gewinner und verkauft Verlierer leer.

Anders als beim Time-Series Momentum ist das Signal relativ: Ein
Instrument wird mit anderen Instrumenten desselben betrachteten
Universums verglichen.

### Für den Designer interessant

Benötigt werden ein Instrumentuniversum, eine Kennzahl pro Instrument,
Sortierung bzw. Ranking, Gruppenbildung und Portfoliooperationen. Das
ist strukturell deutlich anders als eine Strategie, die nur einen Chart
analysiert.

### Begriffskandidaten

Universum, Instrument, Rendite, Performance, Ranking, Rang, Gewinner,
Verlierer, Quantil, Portfolio, Long-Portfolio, Short-Portfolio,
Haltedauer, Formationsperiode.

### Quelle

-   Jegadeesh, N.; Titman, S. (1993): *Returns to Buying Winners and
    Selling Losers: Implications for Stock Market Efficiency*. Journal
    of Finance 48(1). https://doi.org/10.1111/j.1540-6261.1993.tb04702.x

------------------------------------------------------------------------

## 3.2 52-Week-High Momentum

### Grundidee

Der aktuelle Preis eines Instruments wird in Relation zu seinem höchsten
Preis der vergangenen 52 Wochen gesetzt. George und Hwang untersuchten,
in welchem Umfang diese relative Nähe zum 52-Wochen-Hoch
Momentum-Effekte erklärt und als Sortiergröße verwendet werden kann.

Die Strategie benötigt damit keinen klassischen Oszillator. Die zentrale
Größe ist eine Relation zwischen aktuellem Preis und einem historischen
Extremwert.

### Für den Designer interessant

Benötigt werden rollierende Extremwerte, relative Abstände bzw.
Verhältnisse, Ranking und Portfolioselektion.

### Begriffskandidaten

aktueller Preis, 52-Wochen-Hoch, historisches Hoch, Abstand, Verhältnis,
Ranking, Momentum, Gewinner, Verlierer, Portfolio.

### Quelle

-   George, T. J.; Hwang, C.-Y. (2004): *The 52-Week High and Momentum
    Investing*. Journal of Finance 59(5).
    https://doi.org/10.1111/j.1540-6261.2004.00695.x

------------------------------------------------------------------------

## 3.3 Currency Momentum

### Grundidee

Währungen werden anhand ihrer jüngeren Renditen gehandelt. In einer
einfachen Darstellung werden Währungen mit positiven vergangenen
Long-Renditen gekauft und solche mit negativen vergangenen Renditen
verkauft.

Die wissenschaftliche Literatur untersucht Currency Momentum häufig
gemeinsam mit Carry, obwohl beide Signale fachlich verschieden sind.

### Für den Designer interessant

Die Strategie führt Währungspaare, Wechselkurse, Renditen und
Portfolioselektion ein. Sie zeigt außerdem, dass dieselbe abstrakte
Momentumidee in unterschiedlichen Assetklassen andere Eingangsdaten und
Handelsinstrumente benötigt.

### Begriffskandidaten

Währung, Währungspaar, Wechselkurs, Rendite, Momentum, Long, Short,
Portfolio, Basiswährung.

### Quelle

-   Burnside, C.; Eichenbaum, M.; Rebelo, S. (2011): *Carry Trade and
    Momentum in Currency Markets*. NBER Working Paper 16942.
    https://www.nber.org/papers/w16942

------------------------------------------------------------------------


## 3.4 Volumenbestätigtes Momentum

### Grundidee

Aktien werden nicht nur nach ihrer vergangenen Rendite, sondern zusätzlich nach ihrem vergangenen Handelsvolumen unterschieden. Lee und Swaminathan untersuchen Portfolios, die beide Merkmale gemeinsam verwenden. Damit wird ein Preismomentum-Signal um eine zweite, volumenbezogene Eigenschaft ergänzt.

### Für den Designer interessant

Mehrere Merkmale desselben Instruments müssen parallel berechnet und für eine gemeinsame Querschnittsselektion verwendet werden. Das Ergebnis entsteht aus Ranking, Gruppierung und Portfoliozuordnung und nicht nur aus einer Bedingung für ein einzelnes Instrument.

### Begriffskandidaten

Handelsvolumen, vergangenes Volumen, Rendite, Momentum, Gewinner, Verlierer, Ranking, Sortierung, Gruppe, Instrumentuniversum, Querschnitt, Portfolio.

### Quelle

- Lee, C. M. C.; Swaminathan, B. (2000): *Price Momentum and Trading Volume*. Journal of Finance 55(5), 2017–2069. SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=92589

## 3.5 Cross-Asset Value and Momentum

### Grundidee

Value- und Momentum-Signale können nicht nur innerhalb eines Aktienuniversums, sondern über unterschiedliche Anlageklassen hinweg konstruiert werden. Asness, Moskowitz und Pedersen untersuchen entsprechende Strategien für Einzelaktien, Aktienindizes, Staatsanleihen, Währungen und Rohstoffe.

### Für den Designer interessant

Dieser Ansatz erweitert das Instrumentuniversum um mehrere Assetklassen und verlangt vergleichbare, aber assetklassenspezifisch berechnete Merkmale. Ranking, Normalisierung, Portfolioaggregation und Long-/Short-Zuordnung müssen über heterogene Instrumenttypen funktionieren.

### Begriffskandidaten

Assetklasse, Aktienindex, Staatsanleihe, Währung, Rohstoff, Value, Momentum, Bewertung, Ranking, Normalisierung, Cross-Asset, Portfolio, Long, Short.

### Quelle

- Asness, C. S.; Moskowitz, T. J.; Pedersen, L. H. (2013): *Value and Momentum Everywhere*. Journal of Finance 68(3). Frühere Fassung: https://users.nber.org/~confer/2008/si2008/AP/pedersen.pdf

---

# 4. Mean-Reversion- und Contrarian-Strategien

## 4.1 RSI(2) Mean Reversion

### Grundidee

Die von Larry Connors beschriebene RSI(2)-Strategie sucht kurzfristige
Gegenbewegungen innerhalb eines längerfristigen Trends. Ein
langfristiger gleitender Durchschnitt bestimmt den übergeordneten Bias.
Ein RSI mit zwei Perioden identifiziert eine kurzfristig stark
überverkaufte bzw. überkaufte Situation.

In der dokumentierten Variante wird beispielsweise oberhalb des
200-Tage-SMA nach Long-Gelegenheiten gesucht, wenn RSI(2) sehr niedrig
ist. Der Exit kann über einen kurzfristigen gleitenden Durchschnitt
erfolgen.

### Für den Designer interessant

Die Strategie trennt explizit **Trendfilter**, **kurzfristigen
Zustand**, **Entry** und **Exit**. Außerdem arbeiten die beteiligten
Berechnungen mit unterschiedlichen Perioden.

### Begriffskandidaten

RSI, Periode, überkauft, überverkauft, gleitender Durchschnitt,
Trendfilter, Pullback, Long, Short, Entry, Exit.

### Quelle

-   StockCharts ChartSchool: *RSI(2)*.
    https://chartschool.stockcharts.com/table-of-contents/trading-strategies-and-models/trading-strategies/rsi-2

------------------------------------------------------------------------

## 4.2 Pairs Trading

**Herkunft:** extern belegte Strategie; zugleich fachliche Grundlage des früheren Projekt-Testfalls `str-06` („Pairs Trading / statistische Arbitrage“). Der Projekt-Testfall ergänzt insbesondere Z-Score, Hedge-Verhältnis, gekoppelte Orders, Teil-Fills und Leg-Risk als Modellierungsthemen.

### Grundidee

Pairs Trading handelt nicht primär die absolute Richtung zweier Aktien,
sondern die Abweichung ihrer relativen Preisentwicklung. Gatev,
Goetzmann und Rouwenhorst bilden Aktienpaare anhand der Ähnlichkeit
normalisierter historischer Preisverläufe.

Weicht das Paar während der Handelsperiode hinreichend stark
auseinander, wird die relativ schwächere Aktie gekauft und die relativ
stärkere leerverkauft. Bei Konvergenz wird die Position geschlossen.

### Für den Designer interessant

Die Strategie verlangt mehrere synchronisierte Wertreihen,
Normalisierung, Paarbildung, Distanzmaß, Spread bzw. relative
Abweichung, Schwellenwerte und gekoppelte Positionen.

### Begriffskandidaten

Aktie, Paar, normalisierter Preis, Preisverlauf, Distanz, Spread,
Divergenz, Konvergenz, Schwellenwert, Long-Leg, Short-Leg, Paarposition,
Handelsperiode, Formationsperiode.

### Quellen

-   Gatev, E.; Goetzmann, W. N.; Rouwenhorst, K. G. (1999): *Pairs
    Trading: Performance of a Relative Value Arbitrage Rule*. NBER
    Working Paper 7032. https://www.nber.org/papers/w7032
-   Gatev, E.; Goetzmann, W. N.; Rouwenhorst, K. G. (2006): *Pairs
    Trading: Performance of a Relative-Value Arbitrage Rule*. Review of
    Financial Studies 19(3).
    https://academic.oup.com/rfs/article-abstract/19/3/797/1646694

------------------------------------------------------------------------

## 4.3 `str-04` – Mean Reversion mit Bollinger-Bändern und RSI

### Grundidee

Bollinger-Bänder und RSI werden parallel aus derselben Kursreihe berechnet. Ein Long-Setup entsteht im Projekt-Testfall, wenn der Schlusskurs unter dem unteren Bollinger-Band liegt und der RSI einen unteren Grenzwert unterschreitet. Short wird spiegelbildlich definiert.

Der Entry erfolgt nicht unmittelbar bei der Überdehnung, sondern erst nach einer Bestätigung, beispielsweise durch Rückkehr des Kurses innerhalb der Bänder. Das mittlere Bollinger-Band kann als dynamisches Exit-Ziel dienen. Ein Schutz-Stop liegt außerhalb eines jüngsten Extrempunkts oder wird ATR-basiert bestimmt.

### Für den Designer interessant

Der Testfall kombiniert parallele Indikatoren, AND-Verknüpfungen, einen mehrstufigen Ablauf aus Überdehnung und Bestätigung sowie ein dynamisches Exit-Ziel. Ein Setup besitzt außerdem eine begrenzte zeitliche Gültigkeit.

### Begriffskandidaten

Bollinger-Band, oberes Band, unteres Band, Mittelband, RSI, Überdehnung, überkauft, überverkauft, Bestätigung, Rückkehr, Grenzwert, Extrempunkt, ATR, Schutz-Stop, Setup-Gültigkeit, dynamisches Ziel.

### Quellen

- Projekt-Testfall: `Teststrategien_fuer_den_grafischen_Strategiedesigner.md`.
- Fachliche Grundlagen: StockCharts ChartSchool, *Bollinger Bands* und *Relative Strength Index (RSI)*.

---

---

# 5. Volatilitätsstrategien

## 5.1 Bollinger Band Squeeze

### Grundidee

Bollinger Bands werden enger, wenn die gemessene Volatilität sinkt. Ein
„Squeeze" bezeichnet eine Phase relativ geringer Bandbreite. Die
Strategie wartet anschließend auf einen Ausbruch des Preises über das
obere oder unter das untere Band.

Der Squeeze selbst liefert keine Richtung. Die Richtung entsteht erst
durch den nachfolgenden Ausbruch oder durch zusätzliche Filter.

### Für den Designer interessant

Die Strategie unterscheidet sauber zwischen einem **Setup ohne
Richtung** und einem späteren **Richtungsereignis**. Das ist für unser
Fachmodell wichtig: Ein Setup muss nicht bereits Long oder Short sein.

### Begriffskandidaten

Bollinger Band, Mittelband, oberes Band, unteres Band,
Standardabweichung, Volatilität, BandWidth, Squeeze,
Volatilitätskontraktion, Volatilitätsexpansion, Ausbruch, Setup,
Richtung.

### Quellen

-   StockCharts ChartSchool: *Bollinger Band Squeeze*.
    https://chartschool.stockcharts.com/table-of-contents/trading-strategies-and-models/trading-strategies/bollinger-band-squeeze
-   StockCharts ChartSchool: *Bollinger Bands*.
    https://chartschool.stockcharts.com/table-of-contents/technical-indicators-and-overlays/technical-overlays/bollinger-bands

------------------------------------------------------------------------

## 5.2 TTM Squeeze

### Grundidee

Der TTM Squeeze kombiniert Bollinger Bands und Keltner Channels. Liegen
die Bollinger Bands vollständig innerhalb des Keltner Channels, wird
dies als Kompressionszustand interpretiert. Wenn sich die Bollinger
Bands wieder aus dem Keltner Channel herausbewegen, gilt der Squeeze als
ausgelöst. Ein Momentum-Histogramm dient zur Richtungsbestimmung.

### Für den Designer interessant

Hier werden mehrere Indikatoren zu einem neuen zusammengesetzten
fachlichen Zustand verbunden. Zusätzlich existiert ein Zustandswechsel
„Squeeze an" → „Squeeze ausgelöst".

### Begriffskandidaten

Bollinger Band, Keltner Channel, Kompression, Squeeze, Zustand,
Zustandswechsel, Momentum, Histogramm, Volatilität, Ausbruch,
Long-Signal, Short-Signal.

### Quelle

-   StockCharts ChartSchool: *TTM Squeeze*.
    https://chartschool.stockcharts.com/table-of-contents/technical-indicators-and-overlays/technical-indicators/ttm-squeeze

------------------------------------------------------------------------

# 6. Multi-Timeframe-Strategien

## 6.1 CCI Correction

### Grundidee

Die CCI-Correction-Strategie verwendet den Commodity Channel Index auf
zwei Zeitebenen. Der Wochen-CCI legt den Trading Bias fest. Der
Tages-CCI wird anschließend für konkrete Handelssignale innerhalb dieses
Bias verwendet.

Damit sind Signalzeiteinheit und übergeordnete Analysezeiteinheit
explizit verschieden.

### Für den Designer interessant

Dies ist ein unmittelbarer Testfall für unsere bereits diskutierte
Trennung von Zeiteinheiten. Ein Indikator desselben Typs wird auf
unterschiedlichen Aggregationen berechnet und erfüllt dort
unterschiedliche fachliche Rollen.

### Begriffskandidaten

CCI, Zeiteinheit, Wochenchart, Tageschart, Trading Bias,
Signalzeiteinheit, Analysezeiteinheit, Trend, Extremwert, Entry, Exit.

### Quelle

-   StockCharts ChartSchool: *CCI Correction*.
    https://chartschool.stockcharts.com/table-of-contents/trading-strategies-and-models/trading-strategies/cci-correction

------------------------------------------------------------------------

## 6.2 Ichimoku Cloud Strategy

### Grundidee

Ichimoku kombiniert mehrere aus Hochs und Tiefs berechnete Linien und
eine vorausprojizierte „Cloud". Handelsregeln können Position des
Preises relativ zur Cloud, Kreuzungen der Tenkan- und Kijun-Linie sowie
weitere Bestätigungen kombinieren.

Konkrete Varianten ergänzen Volumenbestätigung sowie Stop-Regeln, etwa
über vorherige Hochs/Tiefs, Parabolic SAR oder ATR.

### Für den Designer interessant

Die Strategie enthält mehrere gleichzeitig berechnete Linien,
Zeitverschiebungen bzw. Projektionen, räumliche Relationen zwischen
Preis und Bereich sowie Kreuzungsereignisse.

### Begriffskandidaten

Tenkan-sen, Kijun-sen, Senkou Span, Cloud/Kumo, Hoch, Tief, Mittelpunkt,
Projektion, Kreuzung, Bestätigung, Volumen, Stop, ATR, Parabolic SAR.

### Quelle

-   StockCharts ChartSchool: *Ichimoku Cloud Trading Strategies*.
    https://chartschool.stockcharts.com/table-of-contents/trading-strategies-and-models/trading-strategies/ichimoku-cloud-trading-strategies

------------------------------------------------------------------------

## 6.3 `str-07` – Multi-Timeframe-Trend und Entry

### Grundidee

Auf einer höheren Zeiteinheit wird ein übergeordneter Trend bestimmt. Entries auf einer kleineren Zeiteinheit sind nur in Richtung dieses Trends zulässig. Ein kurzfristiger Rücksetzer und ein anschließendes Bestätigungssignal können als Entry-Struktur dienen.

Der Stop wird am lokalen Extrempunkt der Entry-Zeiteinheit orientiert. Ein Exit kann durch ein Gegensignal auf der Entry-Zeiteinheit oder durch einen Wechsel des übergeordneten Trends entstehen.

### Für den Designer interessant

Die Strategie erzwingt eine explizite Zuordnung von Daten und Ergebnissen zu Zeiteinheiten. Insbesondere dürfen bei einer kleineren Handelszeiteinheit keine noch nicht abgeschlossenen Kerzen der höheren Zeiteinheit verwendet werden.

### Begriffskandidaten

höhere Zeiteinheit, kleinere Zeiteinheit, übergeordneter Trend, Trendfilter, Rücksetzer, Bestätigungssignal, Entry-Zeiteinheit, lokale Extremstelle, abgeschlossene Kerze, Resampling, Synchronisation, Gegensignal.

### Quelle

- Projekt-Testfall: `Teststrategien_fuer_den_grafischen_Strategiedesigner.md`.
- Verwandte extern dokumentierte Multi-Timeframe-Beispiele: siehe Abschnitt 6, insbesondere CCI Correction. Der Projekt-Testfall ist eine generische Teststrategie und keine Übernahme dieser konkreten Strategie.

---

---

# 7. Intraday- und Session-Strategien

## 7.1 Opening Range Breakout (ORB)

### Grundidee

Eine Opening Range wird aus der frühen Phase einer Handelssitzung
gebildet. Varianten unterscheiden sich bei Länge und Berechnung dieser
Range. Toby Crabel beschreibt Opening-Range-Breakouts als Trades, bei
denen oberhalb bzw. unterhalb der Opening Range um einen definierten
Abstand Entry-Orders liegen.

Neuere Veröffentlichungen Crabels verwenden beispielsweise einen aus der
vorherigen Range abgeleiteten „Stretch". Der zuerst erreichte Breakout
bestimmt die Handelsrichtung.

### Für den Designer interessant

Die Strategie benötigt Sessions, Session-Open, intraday Zeitfenster,
Range-Berechnungen, zeitabhängige Aktivierung von Orders und
konkurrierende Long-/Short-Trigger.

### Begriffskandidaten

Session, Handelsbeginn, Open, Opening Range, Range, High, Low, Stretch,
Buy Stop, Sell Stop, Breakout, Intraday, Zeitfenster, Trigger, Order.

### Quellen

-   Crabel, Toby: *Opening Range Breakout -- A Century of Evidence*
    (Working Draft, 2026).
    https://tobycrabel.substack.com/p/opening-range-breakout-a-century
-   Crabel, Toby: *Opening range breakout: early entry Part 2*, Stocks &
    Commodities. https://store.traders.com/-v06-c10-openran-pdf.html

------------------------------------------------------------------------

## 7.2 Gap Trading

### Grundidee

Ein Gap entsteht zwischen zwei Handelsperioden, wenn zwischen vorherigem
Schluss und nachfolgender Eröffnung ein Preisbereich nicht gehandelt
wurde. Gap-Strategien klassifizieren u. a. Full Gap Up, Full Gap Down,
Partial Gap Up und Partial Gap Down.

Die dokumentierten Regeln unterscheiden Long- und Short-Varianten und
verwenden beispielsweise die Handelsspanne der ersten Stunde als
Triggerbereich sowie Trailing Stops als Exitmechanismus.

### Für den Designer interessant

Die Strategie benötigt Beziehungen zwischen unterschiedlichen
Handelstagen, Open/Close/High/Low, Gap-Klassifikation, Sessionzeiten,
Intraday-Ranges und Stop-Orders.

### Begriffskandidaten

Gap, Full Gap, Partial Gap, Gap Up, Gap Down, Schlusskurs,
Eröffnungskurs, Tageshoch, Tagestief, erste Handelsstunde, Range, Buy
Stop, Sell Stop, Trailing Stop.

### Quelle

-   StockCharts ChartSchool: *Gap Trading Strategies*.
    https://chartschool.stockcharts.com/table-of-contents/trading-strategies-and-models/trading-strategies/gap-trading-strategies

------------------------------------------------------------------------

## 7.3 `str-05` – Zeitgebundener Volatilitätsausbruch

### Grundidee

Innerhalb eines festgelegten Zeitfensters werden Hoch und Tief fortlaufend ermittelt. Nach Ende des Fensters werden beide Werte als Tages-Range eingefroren. Anschließend kann der erste gültige Ausbruch über das Range-Hoch oder unter das Range-Tief einen Trade auslösen.

Pro Handelstag wird nur der erste gültige Ausbruch gehandelt. Die Position endet über Kursziel, Stop oder spätestens zu einer festgelegten Exit-Zeit. Mit Beginn des nächsten Handelstags werden Range und Tagesstatus zurückgesetzt.

### Für den Designer interessant

Der Testfall benötigt Zeitfenster, Akkumulation, Einfrieren von Werten, einen täglichen Reset, einmalige Signalgültigkeit und einen zeitbasierten Exit.

### Begriffskandidaten

Handelstag, Zeitfenster, Tages-Range, Range-Hoch, Range-Tief, eingefrorener Wert, Ausbruch, erster Ausbruch, Tagesstatus, Reset, Kursziel, Stop, Exit-Zeit, Signalanzahl.

### Quelle

- Projekt-Testfall: `Teststrategien_fuer_den_grafischen_Strategiedesigner.md`.
- Verwandte extern belegte Strategie: Opening Range Breakout, siehe Abschnitt 7.1. Der Projekt-Testfall ist nicht ohne Weiteres mit einer konkreten ORB-Variante gleichzusetzen.

---

---

# 8. Indikator- und Zustandsstrategien

## 8.1 Parabolic SAR / Stop and Reverse

### Grundidee

Welles Wilders Parabolic Time/Price System erzeugt einen nachlaufenden
SAR-Wert. In steigenden Bewegungen liegt SAR unter dem Preis, in
fallenden darüber. Wird der SAR vom Preis überschritten, wechselt das
System seine Richtung: „Stop and Reverse".

Damit verbindet das Verfahren Trendverfolgung, Stop-Berechnung und
Richtungswechsel.

### Für den Designer interessant

Die Strategie ist ein gutes Beispiel für einen zustandsabhängigen
rekursiven Indikator. Die nächste Berechnung hängt vom bestehenden
Zustand und vorherigen Werten ab. Ein Richtungswechsel verändert die
Berechnungslogik.

### Begriffskandidaten

Parabolic SAR, SAR, Stop and Reverse, Trendrichtung, steigender Zustand,
fallender Zustand, Extrempunkt, Beschleunigungsfaktor, Stop,
Richtungswechsel.

### Quelle

-   StockCharts ChartSchool: *Parabolic SAR*.
    https://chartschool.stockcharts.com/table-of-contents/technical-indicators-and-overlays/technical-overlays/parabolic-sar
-   Wilder, J. Welles (1978): *New Concepts in Technical Trading
    Systems*.

------------------------------------------------------------------------

## 8.2 Directional Movement / ADX mit DI-Crossover

### Grundidee

Wilders Directional-Movement-System berechnet +DI, -DI und ADX.
Kreuzungen von +DI und -DI können die Handelsrichtung anzeigen; ADX
dient zur Beurteilung der Stärke einer gerichteten Bewegung. Varianten
verwenden zusätzliche Trendfilter und Parabolic SAR als Stop.

### Für den Designer interessant

Richtung und Stärke sind getrennte fachliche Größen. Das ist für unser
Trend-Modell besonders interessant: Eine Richtung muss nicht identisch
mit der Stärke einer Bewegung sein.

### Begriffskandidaten

Directional Movement, +DI, -DI, ADX, Trendrichtung, Trendstärke,
Kreuzung, Filter, gleitender Durchschnitt, Parabolic SAR, Stop.

### Quelle

-   StockCharts ChartSchool: *Average Directional Index (ADX)*.
    https://chartschool.stockcharts.com/table-of-contents/technical-indicators-and-overlays/technical-indicators/average-directional-index-adx
-   Wilder, J. Welles (1978): *New Concepts in Technical Trading
    Systems*.

------------------------------------------------------------------------

## 8.3 MACD Signal-Line Crossover

### Grundidee

Der MACD bildet die Differenz zweier exponentieller gleitender
Durchschnitte. Eine Signallinie ist wiederum ein gleitender Durchschnitt
des MACD. Kreuzt die MACD-Linie die Signallinie nach oben, entsteht ein
bullisches; bei Kreuzung nach unten ein bearisches Signal.

### Für den Designer interessant

Ein Indikator kann einen weiteren Indikator als Eingang verwenden. Das
ist für die Datenflussstruktur des Designers wichtig: Nicht jede
Berechnung basiert unmittelbar auf Roh-Marktdaten.

### Begriffskandidaten

EMA, MACD, MACD-Linie, Signallinie, Differenz, Histogramm, Kreuzung,
bullisch, bearisch, Momentum, Signal.

### Quelle

-   StockCharts ChartSchool: *MACD (Moving Average
    Convergence/Divergence) Oscillator*.
    https://chartschool.stockcharts.com/table-of-contents/technical-indicators-and-overlays/technical-indicators/macd-moving-average-convergence-divergence-oscillator

------------------------------------------------------------------------

## 8.4 `str-08` – Regimeabhängige Strategie

### Grundidee

Der Markt wird zunächst einem Regime zugeordnet, im Projekt-Testfall beispielsweise `TREND`, `SEITWÄRTS` oder `HOHE_VOLATILITÄT`. Abhängig vom aktiven Regime wird eine andere Teilstrategie verwendet: Trendfolge im Trendregime, Mean Reversion im Seitwärtsregime und beispielsweise kein Handel oder reduziertes Risiko bei hoher Volatilität.

Ein Regimewechsel wird erst nach einer definierten Bestätigung wirksam. Für bereits offene Positionen müssen eigene Übergangsregeln bestimmen, ob sie gehalten, angepasst oder geschlossen werden.

### Für den Designer interessant

Der Testfall benötigt Klassifikation, Verzweigung, austauschbare Teilstrategien, Hysterese bzw. Bestätigung und Zustandsübergänge bei bereits offenen Positionen.

### Begriffskandidaten

Marktregime, Regimeklassifikation, Trendregime, Seitwärtsregime, Volatilitätsregime, hohe Volatilität, Teilstrategie, Trendfolge, Mean Reversion, Regimewechsel, Übergang, Bestätigung, Hysterese, Risikoparameter.

### Quelle

- Projekt-Testfall: `Teststrategien_fuer_den_grafischen_Strategiedesigner.md`.

---

---

# 9. Ereignis- und Fundamentaldatenstrategien

## 9.1 Post-Earnings-Announcement Drift (PEAD)

### Grundidee

PEAD beschreibt die empirisch untersuchte Tendenz, dass sich Aktienkurse
nach einer Gewinnüberraschung über eine gewisse Zeit weiter in Richtung
dieser Überraschung bewegen. Eine daraus abgeleitete Strategie kann
Aktien mit stark positiver Gewinnüberraschung long und solche mit stark
negativer Überraschung short halten.

Entscheidend für unseren Zweck ist nicht die Frage, ob und wann der
Effekt profitabel handelbar ist. Relevant ist die Struktur: Ein
diskretes Unternehmensereignis erzeugt neue Fundamentaldaten; daraus
wird eine Überraschungsgröße berechnet; anschließend wird eine Position
über einen definierten Zeitraum gehalten.

### Für den Designer interessant

Der Designer müsste neben kontinuierlichen Marktdaten auch diskrete
Ereignisse und Fundamentaldaten verarbeiten können. Außerdem benötigt
die Strategie erwartete und tatsächliche Werte sowie deren Differenz
bzw. standardisierte Überraschung.

### Begriffskandidaten

Unternehmen, Earnings Announcement, Gewinn, Gewinnerwartung,
tatsächlicher Gewinn, Gewinnüberraschung, Ereigniszeitpunkt, Drift,
Rendite, Ranking, Long, Short, Haltedauer.

### Quellen

-   Fink, J. (2021): *A review of the Post-Earnings-Announcement Drift*.
    Journal of Behavioral and Experimental Finance 29.
    https://doi.org/10.1016/j.jbef.2020.100446
-   Chordia, T.; Goyal, A.; Sadka, R.; Shivakumar, L. (2009): *Liquidity
    and the Post-Earnings-Announcement Drift*. Financial Analysts
    Journal.
    https://business.columbia.edu/faculty/research/liquidity-and-post-earnings-announcement-drift

------------------------------------------------------------------------


## 9.2 Value / Fundamental Contrarian

### Grundidee

Value-Strategien selektieren Aktien, deren Marktpreis relativ zu fundamentalen Größen niedrig ist, beispielsweise relativ zu Gewinn, Dividende oder Buchwert. Lakonishok, Shleifer und Vishny untersuchen solche Contrarian-/Value-Strategien systematisch.

### Für den Designer interessant

Neben Marktdaten werden periodisch veröffentlichte Fundamentaldaten benötigt. Unterschiedliche Veröffentlichungsfrequenzen, Stichtage und die zeitlich korrekte Verfügbarkeit fundamentaler Informationen müssen im Backtest berücksichtigt werden. Die Strategie benötigt außerdem Querschnittsrankings und Portfolio-Rebalancing.

### Begriffskandidaten

Fundamentaldaten, Gewinn, Dividende, Buchwert, Marktpreis, Bewertungskennzahl, Value, Ranking, Quantil, Portfolio, Rebalancing, Veröffentlichungsdatum, Berichtsperiode.

### Quelle

- Lakonishok, J.; Shleifer, A.; Vishny, R. W. (1994): *Contrarian Investment, Extrapolation, and Risk*. Journal of Finance 49(5). NBER Working Paper 4360: https://www.nber.org/papers/w4360

## 9.3 Quality Minus Junk

### Grundidee

Quality Minus Junk (QMJ) sortiert Aktien anhand mehrerer Qualitätsmerkmale. Asness, Frazzini und Pedersen beschreiben Qualität unter anderem über Profitabilität, Wachstum, Sicherheit und Management-/Payout-Merkmale und konstruieren ein Long-/Short-Portfolio aus höherer gegen niedrigere Qualität.

### Für den Designer interessant

Ein fachliches Merkmal wie „Qualität“ ist selbst das Ergebnis mehrerer Unterberechnungen. Der Ansatz ist damit ein Beispiel für hierarchisch zusammengesetzte fachliche Größen, anschließendes Ranking und Portfolioselektion.

### Begriffskandidaten

Qualität, Profitabilität, Wachstum, Sicherheit, Payout, Qualitätskennzahl, zusammengesetztes Merkmal, Ranking, Quantil, Long-Portfolio, Short-Portfolio, Faktor.

### Quelle

- Asness, C. S.; Frazzini, A.; Pedersen, L. H. (2019): *Quality Minus Junk*. Review of Accounting Studies 24. SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2312432

## 9.4 News-/Textsignal aus Earnings Conference Calls

### Grundidee

Unternehmensnachrichten müssen nicht ausschließlich als numerische Überraschung vorliegen. Druz, Wagner und Zeckhauser untersuchen den sprachlichen Ton von Earnings Conference Calls. Insbesondere eine unerwartete Abweichung des Tons von dem, was aufgrund der wirtschaftlichen Situation des Unternehmens zu erwarten wäre, enthält in ihrer Untersuchung zusätzliche Information.

Als Strategiegrundlage kann deshalb ein aus Text abgeleitetes Sentiment- oder Tone-Signal zusammen mit dem Veröffentlichungsereignis und weiteren Filtern verwendet werden. Eine konkrete Handelsregel muss die Signalbildung, den Entry-Zeitpunkt und die Haltedauer explizit definieren.

### Für den Designer interessant

Damit treten unstrukturierte Textdaten, NLP-/Sentiment-Auswertungen, Veröffentlichungsereignisse und zeitlich punktuelle Informationsobjekte in das Strategiemodell ein. Das Ergebnis einer Textanalyse ist wiederum eine fachlich nutzbare Wertreihe bzw. ein Ereignismerkmal.

### Begriffskandidaten

Nachricht, Text, Conference Call, Veröffentlichung, Sentiment, Tonalität, Tone Surprise, NLP, Ereigniszeitpunkt, Unternehmensereignis, Informationssignal, Haltedauer.

### Quelle

- Druz, M.; Wagner, A. F.; Zeckhauser, R. J. (2015): *Tips and Tells from Managers: How Analysts and the Market Read Between the Lines of Conference Calls*. NBER Working Paper 20991: https://www.nber.org/papers/w20991

---

# 10. Währungsstrategien

## 10.1 Currency Carry Trade

### Grundidee

Beim klassischen Carry Trade wird eine niedrig verzinste Währung
finanziert bzw. short gehalten und eine höher verzinste Währung long
gehalten. Eine alternative Umsetzung erfolgt über Devisentermingeschäfte
und die Relation zwischen Spot- und Forwardkurs.

Damit basiert das Signal nicht primär auf einem Chartmuster, sondern auf
Zinsdifferenzen bzw. Forward-Prämien und -Abschlägen.

### Für den Designer interessant

Die Strategie erweitert das Datenmodell erheblich: Zinssätze, Währungen,
Spotkurse, Forwardkurse, Laufzeiten, Basiswährung und gekoppelte
Positionen werden relevant.

### Begriffskandidaten

Währung, Basiswährung, Zielwährung, Zinssatz, Zinsdifferenz, Spotkurs,
Forwardkurs, Forward-Prämie, Forward-Abschlag, Finanzierung, Long,
Short, Carry, Laufzeit.

### Quellen

-   Burnside, C.; Eichenbaum, M.; Rebelo, S. (2011): *Carry Trade and
    Momentum in Currency Markets*. NBER Working Paper 16942.
    https://www.nber.org/papers/w16942
-   Burnside, C.; Eichenbaum, M.; Kleshchelski, I.; Rebelo, S. (2008):
    *Do Peso Problems Explain the Returns to the Carry Trade?* NBER
    Working Paper 14054. https://www.nber.org/papers/w14054

------------------------------------------------------------------------

# 11. Portfolio- und Querschnittsstrategien

## 11.1 Betting Against Beta (BAB)

### Grundidee

Die von Frazzini und Pedersen untersuchte BAB-Strategie bildet ein
Portfolio mit Long-Positionen in Low-Beta-Instrumenten und
Short-Positionen in High-Beta-Instrumenten. Die Seiten werden
hinsichtlich ihres Beta-Risikos skaliert.

Das Signal ist damit keine zeitliche Chartbedingung, sondern eine
querschnittliche Eigenschaft eines Instruments relativ zum Markt und zu
anderen Instrumenten.

### Für den Designer interessant

Benötigt werden Benchmark-/Marktrenditen, Beta-Berechnung,
Instrumentuniversum, Sortierung, Portfoliogruppen, Hebelung und
Gewichtung.

### Begriffskandidaten

Beta, Markt, Benchmark, Instrumentuniversum, Low Beta, High Beta,
Ranking, Portfolio, Gewicht, Hebel, Long-Portfolio, Short-Portfolio,
Risikoskalierung.

### Quelle

-   Frazzini, A.; Pedersen, L. H. (2014): *Betting Against Beta*.
    Journal of Financial Economics; NBER Working Paper 16601.
    https://www.nber.org/papers/w16601

------------------------------------------------------------------------

## 11.2 Tactical Asset Allocation nach Faber

### Grundidee

Meb Fabers quantitative Tactical-Asset-Allocation-Modelle kombinieren
mehrere Assetklassen mit einfachen trendbasierten Regeln. In der
bekannten Grundform wird für jede Assetklasse ein langfristiger
gleitender Durchschnitt als Filter verwendet. Liegt der Preis oberhalb
des Filters, wird die Assetklasse gehalten; andernfalls erfolgt eine
defensive Allokation bzw. Cash-Haltung. Das Portfolio wird periodisch
neu bewertet.

### Für den Designer interessant

Hier wird aus Einzelinstrumentsignalen eine Portfolioallokation. Der
Designer muss damit möglicherweise zwischen **Signal**, **Zielgewicht**,
**Position** und **Portfolio** unterscheiden. Außerdem tritt
periodisches Rebalancing als eigenes fachliches Ereignis auf.

### Begriffskandidaten

Assetklasse, Portfolio, Allokation, Zielgewicht, gleitender
Durchschnitt, Trendfilter, Cash, Rebalancing, Rebalancing-Zeitpunkt,
Monatsende, Position, Gewicht.

### Quelle

-   Faber, M. (2007/2013): *A Quantitative Approach to Tactical Asset
    Allocation*. Journal of Wealth Management. SSRN:
    https://papers.ssrn.com/sol3/papers.cfm?abstract_id=962461

------------------------------------------------------------------------

# 12. Rohstoff- und Futuresstrategien

## 12.1 Commodity Momentum + Term Structure

### Grundidee

Diese Strategie kombiniert zwei voneinander verschiedene Signale für
Rohstoff-Futures. Momentum bewertet die vergangene Preisentwicklung. Die
Term Structure bewertet die Struktur der Futureskurve bzw. Term Spreads.
Instrumente können nach beiden Größen sortiert und zu
Long-/Short-Portfolios kombiniert werden.

### Für den Designer interessant

Neben historischen Preisen benötigt der Designer mehrere gleichzeitig
existierende Futureskontrakte desselben Underlyings und deren
unterschiedliche Fälligkeiten. Damit entsteht eine zusätzliche Dimension
jenseits von Instrument und Zeit.

### Begriffskandidaten

Rohstoff, Future, Futureskontrakt, Underlying, Fälligkeit, Futureskurve,
Term Structure, Term Spread, Momentum, Roll Yield, Ranking, Portfolio,
Long, Short.

### Quellen

-   Fuertes, A.-M.; Miffre, J.; Rallis, G. (2010): *Tactical Allocation
    in Commodity Futures Markets: Combining Momentum and Term Structure
    Signals*. Journal of Banking & Finance 34. SSRN:
    https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1127213
-   Zaremba, A. (2016): *Strategies Based on Momentum and Term Structure
    in Financialized Commodity Markets*. SSRN:
    https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2469407

------------------------------------------------------------------------

## 12.2 Commodity Triple Screen: Momentum, Term Structure, Volatilität

### Grundidee

Fuertes, Miffre und Fernandez-Perez kombinieren Momentum, Term Structure
und idiosynkratische Volatilität. Rohstoff-Futures werden gleichzeitig
nach mehreren Merkmalen selektiert.

Die Strategie ist für den Designer weniger wegen der konkreten
Auswahlregel als wegen der Struktur interessant: Mehrere unabhängige
Rankings bzw. Filter bestimmen gemeinsam die Portfoliozugehörigkeit.

### Für den Designer interessant

Benötigt werden mehrdimensionale Sortierung, mehrere Signale je
Instrument, kombinierte Selektionsbedingungen und Portfolioaufbau.

### Begriffskandidaten

Momentum, Term Structure, idiosynkratische Volatilität, Signal, Ranking,
Mehrfachsortierung, Selektion, Future, Portfolio, Long, Short.

### Quelle

-   Fuertes, A.-M.; Miffre, J.; Fernandez-Perez, A. (2015): *Commodity
    Strategies Based on Momentum, Term Structure and Idiosyncratic
    Volatility*. Journal of Futures Markets 35(3). SSRN:
    https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1971917

------------------------------------------------------------------------

# 13. Kalender- und Zeitstrategien

## 13.1 Turn-of-the-Month

### Grundidee

Der Turn-of-the-Month-Effekt beschreibt systematische Renditemuster um
den Wechsel eines Kalendermonats. Eine daraus abgeleitete Strategie
definiert ein Kalenderfenster um Monatsende und Monatsanfang und hält
Marktpositionen nur innerhalb dieses Zeitfensters.

Für unser Projekt ist entscheidend, dass der Auslöser weder Preis noch
Indikator ist, sondern der Kalender.

### Für den Designer interessant

Der Designer benötigt Kalenderbedingungen, Handelstage, Monatsgrenzen
und die Fähigkeit, Positionen abhängig von Zeitfenstern zu öffnen bzw.
zu schließen.

### Begriffskandidaten

Kalender, Monat, Monatsende, Monatsanfang, Handelstag, Zeitfenster,
Haltedauer, Entry-Zeitpunkt, Exit-Zeitpunkt, Rendite.

### Quellen

-   Ogden, J. P. (1990): *Turn-of-Month Evaluations of Liquid Profits
    and Stock Returns: A Common Explanation for the Monthly and January
    Effects*. Journal of Finance 45(4).
    https://doi.org/10.1111/j.1540-6261.1990.tb02435.x
-   Neuere internationale Untersuchung: *Infrequent rebalancing, risk
    deferral, and equity returns at the turn of the month* (2026),
    Journal of International Financial Markets, Institutions and Money.
    https://doi.org/10.1016/j.intfin.2026.102309

------------------------------------------------------------------------


## 13.2 Saisonale Querschnittsstrategie

### Grundidee

Keloharju, Linnainmaa und Nyberg untersuchen Renditesaisonalitäten, bei denen historische Renditen derselben Kalendermonate für die Querschnittsselektion verwendet werden. Der Kalender ist hier Bestandteil der Merkmalsbildung und nicht nur ein Handelszeitfenster.

### Für den Designer interessant

Der Rückblick besteht nicht aus den unmittelbar letzten `n` Perioden, sondern aus periodisch korrespondierenden Beobachtungen wie „derselbe Monat in früheren Jahren“. Danach erfolgt ein Ranking über mehrere Instrumente.

### Begriffskandidaten

Saisonalität, Kalendermonat, historische Monatsrendite, korrespondierende Periode, saisonales Signal, Ranking, Querschnitt, Instrumentuniversum, Portfolio, Rebalancing.

### Quelle

- Keloharju, M.; Linnainmaa, J. T.; Nyberg, P. (2016): *Return Seasonalities*. Journal of Finance 71(4). NBER Working Paper 20815: https://www.nber.org/papers/w20815

---

# 14. Markttechnik / Price Action

## 14.1 1-2-3-Markttechnik als Strategiegrundlage

### Grundidee

In der von Michael Voigt beschriebenen Markttechnik werden lokale Hoch-
und Tiefpunkte zur Beschreibung von Bewegungen und Korrekturen
verwendet. Die Abfolge charakteristischer Punkte 1, 2 und 3 beschreibt
eine Marktstruktur. Insbesondere Punkt 2 hat als lokaler Hoch- bzw.
Tiefpunkt innerhalb eines Trends Bedeutung für eine mögliche Fortsetzung
der Bewegung.

Eine konkrete Handelsstrategie kann den Bruch eines Punktes 2 als
Trigger verwenden und weitere Regeln für Stop, Positionsführung und
übergeordnete Struktur ergänzen.

Diese Aufnahme ist bewusst als **Strategiegrundlage** gekennzeichnet.
„1-2-3" allein beschreibt noch nicht zwingend ein vollständiges
Handelssystem.

### Für den Designer interessant

Dieser Ansatz ist für unser Projekt zentral, weil fachliche Größen nicht
primär aus klassischen Indikatorformeln entstehen. Lokale Extrempunkte,
Bewegung, Korrektur, Struktur und ihre Beziehungen müssen als fachliche
Ergebnisse aus einer Wertreihe ableitbar sein.

### Begriffskandidaten

Markttechnik, Punkt 1, Punkt 2, Punkt 3, lokales Hoch, lokales Tief,
Bewegung, Korrektur, Trend, Trendrichtung, Struktur, Ausbruch, Order,
Stop, Positionsführung.

### Quellen

-   Voigt, Michael: *Das große Buch der Markttechnik*, FinanzBuch
    Verlag.
-   TraderFox: *Interview mit Michael Voigt über Markttechnik*.
    https://traderfox.de/blog/wissen/michael-voigt-ueber-markttechnik-7191.html

------------------------------------------------------------------------



## 14.2 `str-01` – Scalping Punkt-2-Ausbruch, einfache Strategie

### Herkunft

Diese Strategie stammt vom Nutzer und ist im Projekt als `str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` dokumentiert. Die zugrunde liegende Markttechnik orientiert sich an Michael Voigt. Die konkrete Kombination der Regeln ist eine Nutzerstrategie und darf nicht mit einer allgemeinen „1-2-3-Strategie“ gleichgesetzt werden.

### Grundidee

Auf einer größeren Signalzeiteinheit wird geprüft, ob ein markttechnisch intakter Trend vorliegt und ob sich der Markt in der Bewegung statt in der Korrektur befindet. Nur dann wird auf einer kleineren Handelszeiteinheit ein Trade vorbereitet.

Auf der Handelszeiteinheit dient der letzte Punkt 2 als Bezug für den Einstieg. Der Einstieg liegt in Trendrichtung kurz hinter Punkt 2. Der letzte Punkt 1/3 dient als Bezug für den Stop-Loss. Der Take-Profit wird so bestimmt, dass unter Berücksichtigung der vorgesehenen Kosten und Puffer ein effektives CRV von 1:1 entsteht.

Signal- und Handelszeiteinheiten sind paarweise eingeschränkt:

| Signalzeiteinheit | mögliche Handelszeiteinheiten |
|---|---|
| M15 | M5 oder M1 |
| H1 | M15 oder M5 |
| H4 | H1 oder M15 |
| D1 | H4 oder H1 |

Die Positionsgröße wird aus einer Risikogrenze von maximal 1 %, dem Stop-Abstand sowie den Instrument- und Brokerdaten bestimmt. Ist auf der gewählten Handelszeiteinheit kein regelgerechtes Volumen handelbar, wird eine kleinere zulässige Handelszeiteinheit geprüft und der Trade dort vollständig neu geplant.

Vor der Ausführung bleibt die Pending Order von der zugrunde liegenden Marktstruktur abhängig. Durchbricht der Markt den letzten Punkt 1/3, wird die Order storniert. Ändert der ZigZag-Indikator einen noch vorläufigen Punkt 1/3, werden Stop-Loss, Take-Profit, Risiko, Volumen und Margin erneut geprüft. Nach Ausführung wird der Trade in dieser einfachen Variante nicht mehr verändert und endet am Stop-Loss oder Take-Profit.

### Für den Designer interessant

Die Strategie verbindet Markttechnik, ZigZag-basierte Strukturpunkte, Signal- und Handelszeiteinheit, vorläufige und bestätigte Werte, Pending Orders, dynamische Neuberechnung vor Ausführung sowie Risiko-, Margin- und Brokerbedingungen.

### Begriffskandidaten

Signalzeiteinheit, Handelszeiteinheit, Trend, intakter Trend, Trendrichtung, Bewegung, Korrektur, Punkt 1, Punkt 2, Punkt 3, Punkt 1/3, ZigZag, Einstieg, Pending Order, Spread, Puffer, Stop-Loss, Take-Profit, CRV, Risikogrenze, Positionsgröße, Volumen, Mindestlot, Volumenschritt, Margin, freie Margin, Pip, Tick, Pipwert, Tickwert, vorläufiger Punkt, bestätigter Punkt, Orderänderung, Orderstornierung, Position.

### Quellen

- Projektdatei: `str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`; konkrete Strategie des Nutzers.
- Voigt, Michael: *Das große Buch der Markttechnik*, FinanzBuch Verlag; fachlicher Hintergrund der verwendeten Markttechnik.

---

---

## 14.3 `str-02` – Punkt-2-Ausbruch mit erweiterter Stop-Anpassung

### Herkunft

Diese zweite Punkt-2-Ausbruchstrategie stammt ebenfalls vom Nutzer. Sie wurde im bisherigen Projektbestand als `str-02` getrennt von `str-01` geführt. Beide Strategien dürfen nicht miteinander vermischt werden.

### Grundidee

Wie bei `str-01` wird in Richtung eines markttechnisch bestimmten Trends gehandelt und der Punkt 2 als Auslöser für den Einstieg verwendet. Signal- und Handelszeiteinheit bleiben fachlich getrennt.

Die wesentliche zusätzliche Struktur liegt in der Stop-Bestimmung und Stop-Anpassung. Für die anfängliche Planung wird eine aus vollständigen ZigZag-Bewegungen abgeleitete durchschnittliche Bewegungsgröße verwendet. Nach Aktivierung des Trades wird der Stop auf den letzten Punkt 1/3 der Handelszeiteinheit bezogen. Das Kursziel wird ab Einstieg so bestimmt, dass ein effektives CRV von 1:1 entsteht.

Solange eine Order noch nicht ausgeführt ist, können Veränderungen eines vorläufigen ZigZag-Punktes eine erneute Berechnung von Stop-Loss, Take-Profit, Risiko, Volumen und Margin auslösen. Eine danach nicht mehr regelgerechte Order wird nicht unverändert weitergeführt.

### Für den Designer interessant

`str-02` benötigt historische Bewegungsgrößen als Eingabe für eine aktuelle Handelsentscheidung und unterscheidet mehrere Phasen der Stop-Logik. Damit entsteht ein Testfall für zustandsabhängige Berechnungsverfahren, veränderliche Referenzpunkte und eine klare Trennung zwischen Orderphase und aktiver Position.

### Begriffskandidaten

Trend, Trendrichtung, Signalzeiteinheit, Handelszeiteinheit, ZigZag, Bewegung, vollständige Bewegung, Bewegungsgröße, durchschnittliche Bewegungsgröße, Punkt 1/3, Punkt 2, Entry, Pending Order, Stop-Loss, Stop-Anpassung, Take-Profit, CRV, Risiko, Volumen, Margin, Orderänderung, Orderstornierung, Aktivierung, Position.

### Quellen

- Projektbestand: `strategieregister.md`, Eintrag `str-02`, sowie die im Projekt dokumentierten bestätigten Klärungen zur Nutzerstrategie.
- Projektbestand: `anforderungs-und-bausteinmatrix-der-acht-teststrategien.md` ausschließlich als ergänzender Nachweis des bisherigen Arbeitsstands; die dort vermerkte Warnung vor einer Vermischung von `str-01` und `str-02` bleibt gültig.
- Voigt, Michael: *Das große Buch der Markttechnik*, FinanzBuch Verlag; fachlicher Hintergrund der verwendeten Markttechnik.

---

---


## 14.4 Chartpattern-Erkennung: Head-and-Shoulders / Double Bottom

### Grundidee

Lo, Mamaysky und Wang formulieren eine systematische, algorithmische Erkennung klassischer Chartmuster. Untersucht werden unter anderem Head-and-Shoulders und Double Bottoms. Für den Designer ist entscheidend, dass ein Chartpattern als aus einer Wertreihe abgeleitete fachliche Struktur behandelt werden kann und nicht auf eine manuell gezeichnete Figur beschränkt ist.

Eine konkrete Handelsstrategie kann das erkannte Muster mit Bestätigung, Breakout, Invalidierung, Stop und Exit verbinden. Das Pattern selbst ist zunächst ein Analyseergebnis.

### Für den Designer interessant

Benötigt werden Mustererkennung über Folgen lokaler Extrempunkte, geometrische bzw. relative Beziehungen zwischen Punkten, Toleranzen und ein Pattern-Zustand. Das ist strukturell näher an der 1-2-3-Markttechnik als an einem skalaren Indikator.

### Begriffskandidaten

Chartpattern, Muster, Head-and-Shoulders, Double Bottom, lokales Hoch, lokales Tief, Extrempunkt, Sequenz, Symmetrie, Toleranz, Neckline, Bestätigung, Invalidierung, Breakout.

### Quelle

- Lo, A. W.; Mamaysky, H.; Wang, J. (2000): *Foundations of Technical Analysis: Computational Algorithms, Statistical Inference, and Empirical Implementation*. Journal of Finance 55(4). SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=217470

## 14.5 Candlestick-basierte Handelsregeln

### Grundidee

Candlestick-Regeln klassifizieren eine oder mehrere Kerzen anhand der Relationen von Open, High, Low und Close und leiten daraus ein Muster bzw. Signal ab. Marshall, Young und Rose untersuchen solche Regeln quantitativ für große US-Aktien und finden für die isolierte Anwendung in ihrer Stichprobe keine allgemeine Profitabilität.

Die Aufnahme erfolgt deshalb nicht als Profitabilitätsbehauptung, sondern weil Candlestick-Regeln einen klar abgrenzbaren Typ von Musterstrategie darstellen.

### Für den Designer interessant

Der Designer muss einzelne Kerzen und Folgen mehrerer Kerzen anhand relativer Körper-, Schatten- und Gap-Eigenschaften klassifizieren können. Ein Pattern kann anschließend als Bedingung, Ereignis oder Bestandteil eines komplexeren Setups dienen.

### Begriffskandidaten

Candlestick, Kerze, Kerzenkörper, oberer Schatten, unterer Schatten, Open, High, Low, Close, Gap, Kerzenfolge, Pattern, Bestätigung.

### Quelle

- Marshall, B. R.; Young, M. R.; Rose, L. C. (2008): *Market Timing with Candlestick Technical Analysis*. Journal of Financial Transformation / SSRN-Fassung: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=980583

---


# 15. Options- und Derivatestrategien

## 15.1 Volatilitätsrisikoprämie mit Optionen

### Grundidee

Optionsstrategien können die Differenz zwischen impliziter und später realisierter Volatilität bzw. eine Volatilitätsrisikoprämie handeln. Eine Umsetzung kann Optionen verkaufen und das dabei entstehende Richtungsrisiko über das Underlying oder Futures hedgen.

### Für den Designer interessant

Optionsketten, Strike, Verfall, implizite und realisierte Volatilität, Greeks, mehrere Legs und dynamisches Hedging erweitern das bisherige Positionsmodell erheblich. Eine Position kann aus mehreren Instrumenten bestehen, deren Risiken gemeinsam bewertet werden.

### Begriffskandidaten

Option, Call, Put, Strike, Verfall, Optionskette, implizite Volatilität, realisierte Volatilität, Volatilitätsrisikoprämie, Delta, Gamma, Vega, Hedge, Delta-Hedge, Leg, Multi-Leg-Position, Underlying.

### Quellen

- Da Fonseca, J.; Xu, Y. (2017): *Variance and Skew Risk Premiums for the Volatility Market: The VIX Evidence*. SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2811433

## 15.2 0DTE-Optionsstrategien

### Grundidee

Zero-Days-to-Expiration-Strategien handeln Optionen am Verfallstag. Vilkov untersucht einzelne Optionen und mehrbeinige Strukturen sowie bedingte Handelsregeln. Die extrem kurze Restlaufzeit macht Zeit, Ausführungszeitpunkt, Transaktionskosten und Tail-Risiko zu zentralen Strategiegrößen.

### Für den Designer interessant

Erforderlich sind intraday-genaue Optionsdaten, Restlaufzeit, Multi-Leg-Strukturen und zeitabhängige Aktivierungs- und Exit-Regeln.

### Begriffskandidaten

0DTE, Verfallstag, Restlaufzeit, Intraday, Optionsstruktur, Multi-Leg, Straddle, Spread, Put-Write, Delta-Hedge, Tail-Risiko, Ausführungszeitpunkt, Transaktionskosten, Slippage.

### Quelle

- Vilkov, G. (2023, revidiert 2026): *0DTE Trading Rules*. SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4641356

# 16. Markt-Mikrostruktur- und Liquiditätsstrategien

## 16.1 Avellaneda-Stoikov Market Making

### Grundidee

Ein Market Maker stellt gleichzeitig Bid- und Ask-Limitorders und versucht, den Spread zu verdienen, während das durch Ausführungen entstehende Inventarrisiko kontrolliert wird. Avellaneda und Stoikov modellieren die optimalen Quotes in Abhängigkeit unter anderem von Mid-Price, Inventar, Risikoaversion, Resthorizont und Ausführungsintensität.

### Für den Designer interessant

Dies ist strukturell grundlegend anders als Entry-Position-Exit-Strategien. Es existieren gleichzeitig mehrere veränderliche Quotes. Fills verändern das Inventar und führen unmittelbar zu neuen Quote-Berechnungen. Orderbuch, Bid/Ask, Inventar und kontinuierliche Orderänderung werden zu primären fachlichen Größen.

### Begriffskandidaten

Market Maker, Limit Order Book, Bid, Ask, Quote, Spread, Mid-Price, Inventar, Inventarrisiko, Risikoaversion, Reservation Price, Order Arrival, Ausführungsintensität, Limitorder, Cancel/Replace, Fill.

### Quelle

- Avellaneda, M.; Stoikov, S. (2008): *High-frequency trading in a limit order book*. Quantitative Finance 8(3), 217–224. DOI: https://doi.org/10.1080/14697680701381228

## 16.2 Order-Flow als Strategiegrundlage

### Grundidee

Order Flow bzw. signiertes Handelsvolumen unterscheidet kauf- und verkaufsinitiierte Aktivität. Anders als bei klassischen OHLCV-Strategien wird damit die Richtung des Handelsflusses selbst zum Eingangssignal.

Die empirische Literatur liefert nicht automatisch eine allgemein belastbare einfache Handelsregel. Der Ansatz wird deshalb als Strategiegrundlage aufgenommen: konkrete Strategien müssen Aggregation, Schwellen, Kontext, Entry und Exit zusätzlich definieren.

### Für den Designer interessant

Benötigt werden Daten unterhalb klassischer Kerzenebene, Trade-Klassifikation und Aggregationen von aggressiver Kauf- und Verkaufsaktivität.

### Begriffskandidaten

Order Flow, Net Order Flow, signiertes Volumen, Kaufvolumen, Verkaufsvolumen, aggressiver Käufer, aggressiver Verkäufer, Trade, Tick, Markt-Mikrostruktur, Aggregationsfenster, Liquidität.

### Quelle

- Aydogdu, M. (2001): *Order Flow, Trading Volume, and Short-Term Stock Returns*. SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=263939

# 17. Ereignis- und Relative-Value-Arbitrage

## 17.1 Merger Arbitrage / Risk Arbitrage

### Grundidee

Nach Ankündigung einer Übernahme handelt die Zielgesellschaft typischerweise mit einem Abschlag gegenüber dem angebotenen Übernahmepreis. Merger Arbitrage versucht, diesen Spread zu vereinnahmen. Bei einem Cash Deal kann dies beispielsweise eine Long-Position im Zielunternehmen bedeuten; bei einem Stock Deal kann zusätzlich eine gegenläufige Position im Erwerber zur Absicherung des Umtauschverhältnisses erforderlich sein.

Das zentrale Risiko ist der Deal-Abbruch: Dann kann sich der Spread nicht nur nicht schließen, sondern der Zielkurs deutlich fallen.

### Für den Designer interessant

Die Strategie benötigt Unternehmensereignisse, Deal-Status, Angebotspreis bzw. Umtauschverhältnis, mehrere Instrumente, gekoppelte Positionen und diskrete Zustandsänderungen wie Ankündigung, regulatorische Freigabe, Abschluss oder Abbruch.

### Begriffskandidaten

Übernahme, Fusion, Zielunternehmen, Erwerber, Deal, Cash Deal, Stock Deal, Angebotspreis, Umtauschverhältnis, Arbitrage Spread, Deal-Status, Abschluss, Abbruch, Hedge, gekoppelte Position, Ereignisrisiko.

### Quelle

- Mitchell, M.; Pulvino, T. (2001): *Characteristics of Risk and Return in Risk Arbitrage*. Journal of Finance 56(6), 2135–2175. SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=268144

## 17.2 Pairs Trading als Relative-Value-Arbitrage

Pairs Trading ist bereits unter Abschnitt 4.2 beschrieben. Für diese Strukturklasse ist dort insbesondere relevant, dass zwei Instrumente gemeinsam selektiert, synchronisiert, bewertet und als gekoppelte Long-/Short-Position behandelt werden. Es wird hier nicht dupliziert.


# 18. Vorläufiger Begriffspool

Die folgende Rohsammlung ist **noch kein Glossar und kein
Objektmodell**. Sie enthält bewusst Dubletten und Begriffe
unterschiedlicher Kategorien. Erst nach einer größeren Strategiesammlung
wird normalisiert und klassifiziert.

**Markt und Instrumente:**\
Markt, Instrument, Aktie, Währung, Währungspaar, Rohstoff, Future,
Futureskontrakt, Underlying, Assetklasse, Benchmark, Basiswährung.

**Preisdaten und Zeitreihen:**\
Preis, Wertreihe, Open, High, Low, Close, Eröffnungskurs, Schlusskurs,
Tageshoch, Tagestief, historisches Hoch, historisches Tief, Rendite,
historische Rendite, normalisierter Preis.

**Zeit:**\
Periode, Rückblickzeitraum, Zeiteinheit, Signalzeiteinheit,
Analysezeiteinheit, Session, Handelsbeginn, Handelstag, Zeitfenster,
Kalender, Monat, Monatsanfang, Monatsende, Haltedauer,
Formationsperiode, Handelsperiode, Fälligkeit.

**Marktstruktur:**\
Trend, Trendrichtung, Trendstärke, Bewegung, Korrektur, lokales Hoch,
lokales Tief, Punkt 1, Punkt 2, Punkt 3, Range, Trading Range, Kanal,
Unterstützung, Widerstand, Gap, Spread, Divergenz, Konvergenz.

**Berechnungen und Indikatoren:**\
gleitender Durchschnitt, SMA, EMA, RSI, CCI, MACD, Stochastic
Oscillator, ADX, +DI, -DI, ATR, True Range, Parabolic SAR, Bollinger
Band, BandWidth, Keltner Channel, Ichimoku, Beta, Standardabweichung,
Volatilität, Momentum.

**Zustände und Ereignisse:**\
Kreuzung, Ausbruch, Breakout, Squeeze, Kompression, Expansion,
Richtungswechsel, überkauft, überverkauft, Pullback, Umkehr,
Bestätigung, Trigger, Signal, Setup, Trading Bias.

**Portfolio und Selektion:**\
Universum, Ranking, Rang, Quantil, Gewinner, Verlierer, Selektion,
Portfolio, Long-Portfolio, Short-Portfolio, Allokation, Zielgewicht,
Gewicht, Rebalancing, Paar, Long-Leg, Short-Leg.

**Handel und Position:**\
Long, Short, Entry, Exit, Position, Positionsgröße, Einheit, Order, Buy
Stop, Sell Stop, Stop, Stop-Loss, Trailing Stop, Pyramiding, Hebel,
Cash.

**Risiko:**\
Risiko, Volatilität, Kontogröße, Risikoskalierung, Exposition,
Korrelation.

**Fundamentale und Ereignisdaten:**\
Unternehmen, Earnings Announcement, Gewinn, Gewinnerwartung,
Gewinnüberraschung, Ereigniszeitpunkt.

**Währungen und Zinsen:**\
Zinssatz, Zinsdifferenz, Spotkurs, Forwardkurs, Forward-Prämie,
Forward-Abschlag, Finanzierung, Carry.

**Futuresstruktur:**\
Futureskurve, Term Structure, Term Spread, Roll Yield.

------------------------------------------------------------------------



Zusätzliche Kandidaten aus den erweiterten Strategieklassen: Fundamentaldaten, Bewertungskennzahl, Qualität, Text, Sentiment, Tonalität, NLP, Chartpattern, Candlestick, Optionskette, Strike, Verfall, Greek, Delta, Gamma, Vega, Multi-Leg-Position, Market Maker, Limit Order Book, Quote, Inventar, Order Flow, Übernahme, Fusion, Arbitrage Spread, Deal-Status, Umtauschverhältnis.

# 19. Erste Erkenntnisse für den Designer -- noch keine Festlegungen

Aus dem bisherigen Korpus ergeben sich bereits einige prüfbare
Beobachtungen:

1.  Strategien arbeiten nicht ausschließlich mit einzelnen Instrumenten.
    Pairs Trading, Momentum-Portfolios und BAB benötigen Relationen
    zwischen mehreren Instrumenten.
2.  Nicht jedes Setup besitzt von Anfang an eine Richtung. Der Bollinger
    Band Squeeze ist zunächst richtungsneutral.
3.  Strategien benötigen neben kontinuierlichen Marktdaten teilweise
    diskrete Ereignisse, Fundamentaldaten, Zinsdaten oder
    Kalenderinformationen.
4.  Ein Signal kann aus einer Sequenz fachlicher Zustände entstehen.
    „Moving Momentum" ist ein Beispiel für Trend/Bias → Korrektur →
    Trigger.
5.  Mehrere Zeiteinheiten können innerhalb einer Strategie
    unterschiedliche Rollen besitzen. CCI Correction ist ein klarer
    Testfall.
6.  Ein Indikator kann das Ergebnis eines anderen Indikators
    verarbeiten. MACD und Signallinie zeigen, dass Berechnungen
    verkettet werden müssen.
7.  Portfolio-Strategien benötigen Operationen wie Ranking, Gruppierung,
    Gewichtung und Rebalancing, die über eine einzelne Entry-/Exit-Regel
    hinausgehen.
8.  Zeit kann selbst ein Signalgeber sein. Turn-of-the-Month und Opening
    Range Breakout benötigen Kalender- bzw. Sessionlogik.
9.  Zustandsbehaftete Verfahren wie Parabolic SAR benötigen vorherige
    Werte und einen bestehenden fachlichen Zustand.
10. Die bereits diskutierten Begriffe `Trend`, `Bewegung`, `Korrektur`,
    `Wertreihe`, `Indikator`, `Berechnung`, `Bedingung`, `Signal`,
    `Position` und `Zeiteinheit` tauchen in realen
    Strategiebeschreibungen in unterschiedlichen Rollen wieder auf.

Diese Punkte sind **Beobachtungen aus dem Testkorpus**, noch keine
endgültigen Anforderungen oder Entscheidungen zum Objektmodell.

------------------------------------------------------------------------

