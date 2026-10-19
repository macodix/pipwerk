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
| `Trendrichtung` | `aufwärts`, `abwärts`, `kein Trend` | siehe 4.1 |
| `Trend intakt` | `ja`, `nein` | siehe 4.2 |
| `Phase` | `Bewegung`, `Korrektur` | siehe 4.3, nur bei Trendrichtung aufwärts oder abwärts belegt |
| `Punkt 2` | Kurs | siehe 4.1 |
| `Punkt 1/3` | Kurs | siehe 4.1 |
| `Punkt 1/3 endgültig` | `ja`, `nein` | `ja`, wenn der Wendepunkt von Punkt 1/3 endgültig ist (Abschnitt 3) |

Alle Angaben gelten für den Aufwärtstrend. Für den Abwärtstrend gilt alles spiegelbildlich, Hoch und Tief sowie über und unter vertauscht.

### 4.1 Trendrichtung und Punkte

Ein Aufwärtstrend besteht aus den Punkten 1, 2 und 3:

- `Punkt 1`: ein Tief,
- `Punkt 2`: das folgende Hoch,
- `Punkt 3`: das folgende Tief, das über Punkt 1 liegt.

Steigt der Kurs danach über Punkt 2, wird Punkt 3 zum Punkt 1 des nächsten Abschnitts. Deshalb heißt das jeweils letzte Korrekturtief `Punkt 1/3`.

`Trendrichtung` ist `aufwärts`, wenn die letzten drei endgültigen oder vorläufigen Wendepunkte ein Tief, ein höheres Hoch und ein höheres Tief bilden oder der Kurs danach über das Hoch gestiegen ist. `Punkt 2` ist das jüngste Hoch dieser Folge, `Punkt 1/3` das jüngste Tief. Liegt weder ein Aufwärts- noch ein Abwärtstrend vor, ist die Trendrichtung `kein Trend` und die Punkte sind nicht belegt.

### 4.2 Trend intakt

Der Aufwärtstrend ist intakt, solange der Kurs nicht unter `Punkt 1/3` gefallen ist. Fällt der Kurs unter Punkt 1/3, ist `Trend intakt` gleich `nein`, bis ein neuer Trend nach 4.1 entstanden ist.

### 4.3 Phase

`Bewegung`: Der Kurs ist über `Punkt 2` gestiegen und der ZigZag hat seitdem kein neues Hoch gesetzt.

`Korrektur`: Der ZigZag hat nach `Punkt 2` ein Hoch gesetzt und der Kurs liegt unter diesem Hoch und über `Punkt 1/3`. Dieses Hoch ist dann der neue `Punkt 2`.

## 5. Verwendung im Punkt-2-Ausbruch

Der Punkt-2-Ausbruch verwendet zwei Instanzen des Indikators. Auf der Signalzeiteinheit werden `Trendrichtung` (sie bestimmt die Handelsrichtung), `Trend intakt` und `Phase` verwendet. Auf der Handelszeiteinheit werden `Trendrichtung` (muss mit der Signalzeiteinheit übereinstimmen), `Punkt 2`, `Punkt 1/3` und `Punkt 1/3 endgültig` verwendet.

## 6. Offen

Die Bestimmung in Abschnitt 4 ist vom Projektleiter aus der Markttechnik nach Voigt abgeleitet und vom Auftraggeber noch nicht bestätigt. Insbesondere offen: ob für `aufwärts` ein vollständiger 1-2-3-Abschnitt verlangt wird oder bereits ein höheres Hoch und ein höheres Tief genügen, und ob der Durchbruch unter Punkt 1/3 auf Schlusskurs- oder Tick-Basis gilt.

## 7. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-14 | Erstfassung. Eigenschaften mit dem Auftraggeber im Chat abgestimmt, Bestimmung als Entwurf. |
| 2026-10-15 | Parameter Zeiteinheit, Trendrichtung auf beiden Zeiteinheiten im Punkt-2-Ausbruch. Entscheidung des Auftraggebers im Chat am 2026-10-15 (Vorhaben `strategiedesign`). |
| 2026-10-19 | Bezeichnung in der Oberfläche „1-2-3-Trend (Markttechnik)“, Gruppe Trends, Grundlage `ZigZag`. Entscheidung des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-19 | Vom Projektleiter nach dem Prüfbericht der QA (`strategiedesign`, Durchlauf 9): Parameter `Instrument` (Fachmodell req-fach-053, B5), rechnet selbst nach dem Verfahren des `ZigZag` (H9). |
