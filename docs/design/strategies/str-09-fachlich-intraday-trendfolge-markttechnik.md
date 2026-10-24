# Intraday-Trendfolge mit Markttechnik

## Status

- strategie-id: `str-09`
- status: `draft`
- quelle: `Chat-Session 2026-10-24 (Claude Code)`
- zuletzt geprüft: `2026-10-24`

## Handelsidee

Der Markt bildet im Intraday-Verlauf wiederkehrende Trendphasen mit messbaren Rückläufen. Die Strategie nutzt diese Rückläufe, indem sie Positionen nicht in Stärke hinein eröffnet, sondern an markttechnisch relevanten Zonen wartet, bis der übergeordnete Trend eine Gegenbewegung abschließt. Der Einstieg erfolgt erst nach Bestätigung durch ein Kerzenmuster. So werden Trendbewegungen von einem definierten Punkt aus mitgenommen, ohne gegen den laufenden Impuls einzusteigen.

## Voraussetzungen

- Märkte: DAX Future, EUR/USD, GBP/USD
- Zeitrahmen (Analyse): H4 (Marktkontext), H1 (Trendrichtung), M15 (Einstieg), M5 (Trigger-Feintuning)
- Handelszeit: 09:30–17:30 Uhr MEZ (nach der Opening-Phase)
- Voraussetzung Trendstruktur: Higher Highs & Higher Lows (Long) oder Lower Highs & Lower Lows (Short) auf H1 und H4 müssen übereinstimmen
- Seitwärtsmärkte auf H1/H4: Strategie pausieren
- Kein Trade innerhalb der ersten 30 Minuten nach Marktöffnung (Opening-Chaos)
- Kein Trade bei anstehendem Nachrichtenereignis innerhalb der nächsten 60 Minuten

## Ablauf

### 1. Markt beobachten

Top-Down-Analyse vor Handelsbeginn:
1. H4: Trendrichtung bestimmen (HH/HL oder LH/LL). Bei Seitwärtsmarkt: keine Trades.
2. H1: Bestätigt H1 die H4-Richtung? Nächste markttechnische Levels und Zonen markieren.
3. Opening Range (erste 15–30 Minuten): Beobachten, nicht handeln. Ober- und Untergrenze als Referenzniveaus markieren.

### 2. Handelsmöglichkeit erkennen

Eine Handelsmöglichkeit besteht, wenn:
- Der Preis einen Rücklauf in Richtung einer der folgenden markttechnischen Zonen vollzieht:
  - **S/R-Flip**: Alter Widerstand, der nach Durchbruch zum Support wird (Priorität: sehr hoch)
  - **Swing-Low-Retest**: Letztes bestätigtes Higher Low im Aufwärtstrend (Priorität: sehr hoch)
  - **Trendlinien-Retest**: Gebrochene Trendstruktur, die erneut getestet wird (Priorität: hoch)
  - **Opening-Range-Grenze**: Ober- oder Untergrenze der ersten 30 Minuten (Priorität: hoch)
  - **Gleitender Durchschnitt (50/200)**: Nur als Zusatzfilter, nicht als alleiniger Grund (Priorität: mittel)
- Die Zone wurde noch nicht mehr als einmal getestet (mehr als zweimaliger Test gilt als verbraucht).

### 3. Trade planen

**Richtung**: Ausschließlich in Richtung der H1/H4-Trendstruktur.

**Trigger (Einstiegssignal)**:
Kein Einstieg ohne einen der folgenden Trigger auf M5 oder M15:
- Bullische Engulfing-Kerze an der Zone
- Pin Bar (Hammer) mit langem unterem Docht an Support
- Bruch des letzten kurzfristigen Swing-Highs nach Pullback (M5-Strukturbruch)
- Klares bullisches Kerzenschluss über das S/R-Niveau

**Entry**: Schluss der Trigger-Kerze.

**Stop-Loss**: Knapp unterhalb der markttechnischen Zone (mindestens 10–15 Punkte im DAX / 10–15 Pips im Forex). Stop wird nicht nach unten bewegt.

**Take-Profit**:
- TP1 (50 % der Position): Nächste markttechnische Zone / Swing-High
- TP2 (50 % der Position): Übernächste Zone oder Trailing-Stop
- Nach Erreichen von TP1: Stop auf Break-Even setzen.

**Mindest-Risk/Reward**: 1:2. Bevorzugt 1:3. Kein Trade bei R/R unter 1:2.

### 4. Risiko und Handelbarkeit prüfen

- Risiko je Trade: 1 % des Kontostands
- Positionsgröße: (Kontostand × 0,01) ÷ Stop-Loss in Punkten
- Tages-Verlustlimit: 3 % des Kontostands; bei Erreichen: kein weiterer Trade am selben Tag
- Maximale Anzahl Trades pro Tag: 3
- Kein Trade, wenn eine der Filterregeln zutrifft (siehe Abschnitt Ablauf Schritt 1 und Parameter).

### 5. Order stellen

Marktorder zum Schluss der Trigger-Kerze. Stop-Loss und Take-Profit werden unmittelbar nach Ausführung platziert.

### 6. Ausstehende Order überwachen

Entfällt bei Marktorder.

### 7. Ausführung verarbeiten

Nach Ausführung: Stop-Loss und beide Take-Profit-Level im System hinterlegen. Position und Levels im Journal erfassen.

### 8. Aktiven Trade verwalten

- Stop-Loss wird nach Erreichen von TP1 auf Break-Even (Einstiegskurs) nachgezogen.
- Danach kein weiteres manuelles Eingreifen, außer TP2 wurde als Trailing-Stop konfiguriert.
- Stop wird nicht nach unten (gegen die Position) bewegt.

### 9. Trade beenden

Trade endet durch:
- Erreichen von TP1 und TP2 (Planausführung)
- Auslösung des Stop-Loss
- Ende der Handelszeit (17:30 Uhr MEZ): alle offenen Positionen schließen

Nach Trade-Ende: Journaleintrag vervollständigen (Ergebnis, Qualitätsbewertung 1–5, Auffälligkeiten).

## Parameter

| Parameter | Bedeutung | Wert oder Regel | Status |
|---|---|---|---|
| Zeitrahmen Analyse | H4, H1, M15, M5 | Top-Down: H4→H1→M15→M5 | bestätigt |
| Handelszeit | Handelsfenster MEZ | 09:30–17:30 Uhr | bestätigt |
| Opening-Phase | Kein Trade in Eröffnungsphase | erste 30 Minuten | bestätigt |
| Risiko je Trade | Kapitalanteil pro Trade | 1 % des Kontostands | bestätigt |
| Tages-Verlustlimit | Maximaler Tagesverlust | 3 % des Kontostands | bestätigt |
| Max. Trades/Tag | Anzahl Trades je Handelstag | 3 | bestätigt |
| Min. Risk/Reward | Mindestanforderung R/R-Verhältnis | 1:2 | bestätigt |
| Stop-Loss-Abstand DAX | Mindestabstand zur Zone | 10–15 Punkte | bestätigt |
| Stop-Loss-Abstand Forex | Mindestabstand zur Zone | 10–15 Pips | bestätigt |
| Zone max. Tests | Ab wann gilt eine Zone als verbraucht | mehr als 2 Tests | bestätigt |
| News-Sperrfrist | Kein Trade vor Nachrichtenereignis | 60 Minuten | bestätigt |
| TP1-Anteil | Positionsanteil bei TP1-Ausstieg | 50 % | bestätigt |
| TP2-Anteil | Positionsanteil bei TP2-Ausstieg | 50 % | bestätigt |

## Offene fachliche Fragen

1. Gilt die Handelszeit-Regel auch für Forex (kein festes Börsenschluss)? Unklar, ob 17:30 Uhr als Grenze auch bei Forex-Paaren verbindlich ist.
2. Wie wird bei teilweiser TP1-Ausführung mit dem verbleibenden Teil verfahren, wenn der Markt anschließend sofort dreht, ohne TP2 zu erreichen?
3. Ist der Trailing-Stop für TP2 als prozentualer Abstand oder als strukturbasierter Trailing (nächstes Swing-Low) definiert?

## Bestätigungsvermerk

- fachlich geprüft durch: `offen`
- Ergebnis: `offen`
- Datum: `–`

## Originalbeschreibung

Quelle: Chat-Session vom 2026-10-24 (Claude Code, Session `https://claude.ai/code/session_01URo8MSuJtC86bq1tPAmjrp`). Kein separates Originaldokument vorhanden – die Strategie wurde im Dialog erarbeitet. Handelsplan-Dokument: `trading-plan-intraday-trendfolge.md` im selben Verzeichnis.
