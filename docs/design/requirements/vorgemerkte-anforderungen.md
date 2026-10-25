# Vorgemerkte Anforderungen

## Dokumentstatus

- status: `draft`
- zweck: Anforderungen und Wünsche, die erkannt, aber noch keinem Anforderungsdokument hinzugefügt oder noch nicht umgesetzt sind, je Bereich mit Priorität
- zuletzt aktualisiert: `2026-10-25`
- abgestimmt: Aufbau und Prioritäten festgelegt vom Auftraggeber im Chat am 25. Oktober 2026

## 1. Zweck und Abgrenzung

Diese Liste hält fest, was während der Arbeit an einem Bereich für einen anderen Bereich sichtbar wird, und Überlegungen des Auftraggebers zu weiteren Funktionen, die nicht sofort umgesetzt werden.

Ein Eintrag ist keine Festlegung. Beschlossene Anforderungen stehen ausschließlich in den Anforderungsdokumenten, im Fachmodell und in den Strategiebeschreibungen. Wird ein Eintrag umgesetzt, schreibt der Projektleiter ihn in das zuständige Dokument und setzt hier den Stand auf `übernommen` mit Verweis.

Wann die Liste geprüft wird und wer einträgt, regelt das [Entwicklungsverfahren](../../technical/entwicklungsverfahren.md#vorgemerkte-anforderungen).

## 2. Prioritäten

Die Priorität legt der Auftraggeber fest.

| Priorität | Umsetzung |
|---|---|
| `dringend` | sobald möglich |
| `erforderlich` | sobald es sich anbietet, also wenn ohnehin an diesem Teil der Software gearbeitet wird, oder sobald möglich, spätestens vor dem nächsten Release |
| `gewünscht` | sobald nichts anderes mehr ansteht oder der Auftraggeber es verlangt |
| `offen` | Eintrag einer Rolle, Priorität vom Auftraggeber noch nicht festgelegt |

## 3. Aufbau eines Eintrags

| Spalte | Inhalt |
|---|---|
| Nr. | `vm-NNN`, fortlaufend über alle Bereiche, wird nicht wiederverwendet |
| Inhalt | was gebraucht oder gewünscht wird, in ein bis drei Sätzen |
| Priorität | nach Abschnitt 2 |
| Herkunft | Datum und Vorhaben oder Chat, in dem der Punkt aufkam |
| Stand | `vorgemerkt`, `übernommen in <Dokument, Kennung>` oder `verworfen` mit Grund |

Einträge mit Stand `übernommen` oder `verworfen` bleiben stehen.

## 4. Einträge

### Gesamtsystem

| Nr. | Inhalt | Priorität | Herkunft | Stand |
|---|---|---|---|---|

### Strategiedesigner (pipwerk Studio)

| Nr. | Inhalt | Priorität | Herkunft | Stand |
|---|---|---|---|---|

### Strategietester (pipwerk Backtest)

| Nr. | Inhalt | Priorität | Herkunft | Stand |
|---|---|---|---|---|

### Handelssystem (pipwerk Trader)

| Nr. | Inhalt | Priorität | Herkunft | Stand |
|---|---|---|---|---|

### Nachrichtensystem (pipwerk Relay)

| Nr. | Inhalt | Priorität | Herkunft | Stand |
|---|---|---|---|---|

### Entwicklungsverfahren und Entwicklungsumgebung

| Nr. | Inhalt | Priorität | Herkunft | Stand |
|---|---|---|---|---|

## 5. Offene Punkte

- Was ein Release ist und wann das nächste ansteht, ist nicht festgelegt. Bis dahin gilt für `erforderlich` nur „sobald es sich anbietet oder sobald möglich“. Offen.

## 6. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-25 | Liste angelegt. Prioritäten `dringend`, `erforderlich`, `gewünscht` festgelegt vom Auftraggeber im Chat am 2026-10-25. |
