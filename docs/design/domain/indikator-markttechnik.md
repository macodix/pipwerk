# Indikator Markttechnik

## Dokumentstatus

- status: `draft`
- zweck: Fachliche Beschreibung des Indikators, der Trend, Phase und Punkte nach der Markttechnik von Michael Voigt aus ZigZag-Wendepunkten bestimmt
- zuletzt aktualisiert: `2026-10-19`

## 1. Zweck

Der Indikator `Markttechnik` ist ein Indikator von pipwerk nach req-fach-013. Er wird vom Punkt-2-Ausbruch (`str-01`) benötigt. Er wird einmal angelegt und kann auf verschiedenen Zeiteinheiten verwendet werden. In der Oberfläche heißt er „1-2-3-Trend (Markttechnik)“ und steht bei den Trends. Er baut auf dem mitgelieferten Indikator `ZigZag` auf (Fachmodell req-fach-054): Er rechnet selbst nach dessen Verfahren und hat dessen Parameter (Abschnitt 2), eine eigene Instanz von `ZigZag` braucht er nicht.

## 2. Parameter

| Parameter | Bedeutung | Standardwert |
|---|---|---|
| Instrument | Instrument, auf dem der Indikator rechnet (Fachmodell req-fach-053) | Instrument der Anwendung |
| Zeiteinheit | Zeiteinheit der Kerzen, auf denen der Indikator rechnet (Fachmodell req-fach-054) | -- |
| Depth | Mindestanzahl Kerzen zwischen zwei Wendepunkten | 12 |
| Deviation | Mindestbewegung in Punkten für einen neuen Wendepunkt | 5 |
| Backstep | Mindestabstand in Kerzen zwischen einem Hoch und einem Tief | 3 |

Die Parameter sind die des in MetaTrader 5 mitgelieferten ZigZag-Indikators. Der Indikator rechnet nach demselben Verfahren und liefert bei gleichen Kursdaten und Parametern dieselben Wendepunkte.

## 3. Grundlage: Wendepunkte

Der ZigZag liefert eine Folge von Wendepunkten, abwechselnd Hoch und Tief. Der jüngste Wendepunkt ist vorläufig: Er kann sich verschieben, bis der ZigZag den nächsten entgegengesetzten Wendepunkt gesetzt hat. Alle früheren Wendepunkte sind endgültig.

## 4. Eigenschaften

| Eigenschaft | Werte | Bestimmung |
|---|---|---|
| `Trendrichtung` | `aufwärts`, `abwärts`, `kein Trend` | siehe 4.1 und 4.2 |
| `Punkt 2` | Kurs | siehe 4.1, nur bei Trendrichtung aufwärts oder abwärts belegt |
| `Punkt 1/3` | Kurs | siehe 4.1, nur bei Trendrichtung aufwärts oder abwärts belegt |
| `Punkt 1/3 endgültig` | `ja`, `nein` | `ja`, wenn der Wendepunkt von Punkt 1/3 endgültig ist (Abschnitt 3) |

Alle Angaben gelten für den Aufwärtstrend. Für den Abwärtstrend gilt alles spiegelbildlich, Hoch und Tief sowie über und unter vertauscht.

Ob ein Trend gebrochen ist und ob sich der Markt in Bewegung oder Korrektur befindet, liefert der Indikator nicht als eigene Eigenschaft. Beides ergibt sich aus `Trendrichtung`, den Punkten und dem Kurs (4.3).

### 4.1 Entstehung des Trends und Punkte

Ein Aufwärtstrend entsteht aus den Punkten 1, 2 und 3:

- `Punkt 1`: ein Tief,
- `Punkt 2`: das folgende Hoch,
- `Punkt 3`: das folgende Tief, das über Punkt 1 liegt.

Bestätigt ist der Aufwärtstrend erst, wenn eine Kerze über Punkt 2 schließt (4.4). Ab dann ist `Trendrichtung` gleich `aufwärts`. Vorher ist sie `kein Trend`.

Im bestätigten Trend gilt:

- `Punkt 1/3` ist das letzte Tief, an dem eine Bewegung in Trendrichtung begonnen hat. Zu Beginn ist es Punkt 3.
- `Punkt 2` ist das letzte Hoch, das der ZigZag gesetzt hat.
- Setzt der ZigZag nach `Punkt 2` ein Tief, beginnt die Korrektur. `Punkt 1/3` bleibt das bisherige Tief, solange es nicht durchbrochen ist.
- Setzt der ZigZag nach dem Tief der Korrektur ein neues Hoch, ist das Tief der Korrektur ein Wendepunkt. Es wird zum neuen `Punkt 1/3`, und das neue Hoch zum neuen `Punkt 2`.

Läuft der Kurs weiter in Trendrichtung, bleibt der Trend bestehen. Es entsteht dabei kein neuer Trend.

### 4.2 Trendbruch

Schließt eine Kerze unter `Punkt 1/3` (4.4), ist der Aufwärtstrend gebrochen. `Trendrichtung` ist dann `kein Trend`, und die Punkte sind nicht belegt, bis ein neuer Trend nach 4.1 bestätigt ist.

Seitwärts laufende Kurse sind kein Trend.

### 4.3 Bewegung und Korrektur

Im bestätigten Aufwärtstrend befindet sich der Markt in der Bewegung, solange der Kurs über `Punkt 2` liegt, und in der Korrektur, solange er unter `Punkt 2` und über `Punkt 1/3` liegt. Eine Strategie, die das braucht, vergleicht den Kurs mit den Punkten.

### 4.4 Durchbruch

Der Indikator wertet einen Durchbruch durch `Punkt 1/3` oder `Punkt 2` nur auf abgeschlossenen Kerzen aus: Die Kerze muss jenseits des Punkts schließen. Ein Docht jenseits des Punkts ist kein Durchbruch. Soll eine Strategie schon bei einem einzelnen Kurs reagieren, vergleicht sie den Kurs selbst mit dem Punkt.

## 5. Verwendung im Punkt-2-Ausbruch

Der Punkt-2-Ausbruch verwendet zwei Instanzen des Indikators. Auf der Signalzeiteinheit wird `Trendrichtung` verwendet (sie bestimmt die Handelsrichtung). Auf der Handelszeiteinheit werden `Trendrichtung` (muss mit der Signalzeiteinheit übereinstimmen), `Punkt 2`, `Punkt 1/3` und `Punkt 1/3 endgültig` verwendet.

## 6. Offen

Keine offenen Punkte.

## 7. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-14 | Erstfassung. Eigenschaften mit dem Auftraggeber im Chat abgestimmt, Bestimmung als Entwurf. |
| 2026-10-15 | Parameter Zeiteinheit, Trendrichtung auf beiden Zeiteinheiten im Punkt-2-Ausbruch. Entscheidung des Auftraggebers im Chat am 2026-10-15 (Vorhaben `strategiedesign`). |
| 2026-10-19 | Bezeichnung in der Oberfläche „1-2-3-Trend (Markttechnik)“, Gruppe Trends, Grundlage `ZigZag`. Entscheidung des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-19 | Vom Projektleiter nach dem Prüfbericht der QA (`strategiedesign`, Durchlauf 9): Parameter `Instrument` (Fachmodell req-fach-053, B5), rechnet selbst nach dem Verfahren des `ZigZag` (H9). |
| 2026-10-19 | Bestimmung bestätigt: Aufwärtstrend ab vollständigem 1-2-3-Abschnitt ohne Ausbruch über Punkt 2, vorläufiger Wendepunkt zählt mit. Durchbruch nur auf Schlusskurs abgeschlossener Kerzen (4.4), ohne eigenen Parameter. Entscheidung des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-21 | Nach Prüfbericht der QA (`backtest`, Durchlauf 1, B5, B6): Trend erst nach Schluss über Punkt 2 bestätigt, bleibt bei weiterem Lauf in Trendrichtung bestehen, nach Trendbruch `kein Trend`; Punkte folgen den Wendepunkten des ZigZag. Eigenschaften `Trend intakt` und `Phase` gestrichen, Bewegung und Korrektur aus Kurs und Punkten (4.3). Entscheidung des Auftraggebers im Chat am 2026-10-20 und 2026-10-21. |
