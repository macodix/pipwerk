# EMA-Trendfolge

## Status

- strategie-id: `str-03`
- status: `draft`
- quelle: Entwurf „Trendfolge mit gleitenden Durchschnitten“ in `Teststrategien_fuer_den_grafischen_Strategiedesigner.md` und Abschnitt 2.1 „Moving-Average-Crossover“ in `trading-strategiesammlung_v0.5.md`. Ausgearbeitet vom Projektleiter als Prüffall im Auftrag des Auftraggebers.
- zuletzt geprüft: `2026-10-14`

## Zweck

Die Strategie ist ein Prüffall für den Strategiedesigner, keine Handelsempfehlung. Ihre Parameterwerte sind für den Prüffall festgelegt und nicht auf Ertrag geprüft. Gegenüber dem Punkt-2-Ausbruch enthält sie Kreuzungen zweier Indikatoren, die Marktorder, das laufende Nachziehen des Stop-Loss einer offenen Position und das Schließen einer Position.

## Handelsidee

Ein schneller und ein langsamer exponentieller gleitender Durchschnitt (EMA) werden auf den Schlusskursen derselben Zeiteinheit berechnet. Kreuzt der schnelle EMA den langsamen nach oben, beginnt ein Aufwärtstrend, kreuzt er ihn nach unten, ein Abwärtstrend. Die Strategie ist in Richtung des letzten Kreuzens im Markt.

## Voraussetzungen

Benötigt werden die Kerzen einer Zeiteinheit, der EMA-Indikator, der ATR-Indikator (Average True Range, durchschnittliche Schwankungsbreite einer Kerze) sowie Kapital des Kontos und Tickwert, Mindestvolumen und Volumenschrittweite des Instruments.

## Ablauf

### 1. Auslöser

Die Strategie wird bei jedem Kerzenschluss der Zeiteinheit ausgewertet.

### 2. Kreuzen prüfen

Geprüft wird, ob der schnelle EMA den langsamen bei diesem Kerzenschluss gekreuzt hat. Ein Kreuzen nach oben liegt vor, wenn der schnelle EMA beim vorherigen Kerzenschluss unter oder auf dem langsamen lag und jetzt darüber liegt. Ein Kreuzen nach unten gilt spiegelbildlich.

### 3. Bestehende Position schließen

Hat ein Kreuzen stattgefunden und besteht eine Position dieser Strategie in der Gegenrichtung, wird sie ganz geschlossen.

### 4. Neue Position eröffnen

Nach einem Kreuzen wird eine Marktorder in Richtung des Kreuzens aufgegeben. Der Stop-Loss liegt beim Kauf 2 ATR unter, beim Verkauf 2 ATR über dem Schlusskurs der Kerze. Ein Take-Profit wird nicht gesetzt. Das Volumen bestimmt die Risikoregel: Der Verlust bis zum Stop-Loss beträgt höchstens 1 % des Kapitals. Das Volumen wird auf die Volumenschrittweite abgerundet. Liegt es unter dem Mindestvolumen, wird die Order abgelehnt und es wird keine Position eröffnet.

### 5. Stop-Loss nachziehen

Hat kein Kreuzen stattgefunden und besteht eine Position dieser Strategie, wird ein neuer Stop-Loss berechnet: beim Kauf Schlusskurs minus 2 ATR, beim Verkauf Schlusskurs plus 2 ATR. Er wird nur übernommen, wenn er den bisherigen Stop-Loss in Richtung der Position verbessert, beim Kauf also höher, beim Verkauf niedriger liegt.

### 6. Position beenden

Die Position endet, wenn der Stop-Loss erreicht wird oder sie nach einem Kreuzen in Gegenrichtung geschlossen wird.

## Parameter

| Parameter | Bedeutung | Wert oder Regel | Status |
|---|---|---|---|
| Zeiteinheit | Kerzen für EMA, ATR und Auslöser | H1 | für den Prüffall festgelegt |
| Periode schneller EMA | Anzahl Kerzen | 20 | für den Prüffall festgelegt |
| Periode langsamer EMA | Anzahl Kerzen | 50 | für den Prüffall festgelegt |
| ATR-Periode | Anzahl Kerzen | 14 | für den Prüffall festgelegt |
| Stop-Abstand | Vielfaches der ATR für ersten und nachgezogenen Stop-Loss | 2 | für den Prüffall festgelegt |
| Risikogrenze | maximaler Verlust je Position | 1 % des Kapitals | wie Punkt-2-Ausbruch |

## Abgrenzung

Der im Entwurf genannte optionale Trendfilter entfällt. Die Strategie bleibt dadurch einfach. Das Prüfen eines Trends deckt bereits der Punkt-2-Ausbruch ab.

## Offene fachliche Fragen

Keine.

## Bestätigungsvermerk

- fachlich geprüft durch: `offen`
- Ergebnis: `offen`
- Datum: `–`
