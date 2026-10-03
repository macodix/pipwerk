# Modellbewertung – Evaluationssatz 01

## Dokumentstatus

- status: `draft`
- stand: `2026-10-03`
- zweck: Reproduzierbarer erster Evaluationssatz für die rollenbezogene Auswahl von Modellen im Pipwerk-Entwicklungsprozess

## 1. Grundsätze

Die Modellbewertung verwendet kleine bis sehr kleine, reale oder realistische Pipwerk-Arbeitspakete.

Konkrete Modellnamen sind keine Projektfestlegung. Sie werden nur in den jeweiligen Evaluationsläufen dokumentiert.

Bewertet wird ausschließlich die Ergebnisqualität. Kosten, Tokenverbrauch und Geschwindigkeit sind keine Auswahlkriterien.

Ein Modell bearbeitet jeden Testfall mindestens dreimal unabhängig unter möglichst gleichen Bedingungen.

Die Referenz eines Testfalls wird vor den Modellläufen festgelegt und nicht nachträglich an Modellantworten angepasst.

Für jedes Bewertungskriterium gilt:

- `0`: nicht erfüllt oder falsch
- `1`: erheblich mangelhaft
- `2`: erfüllt
- `3`: vollständig und zuverlässig erfüllt

Harte Fehler führen unabhängig von der Punktbewertung zum Nichtbestehen des betroffenen Testlaufs.

## 2. Rollenbezogene Bewertung

### Projektleiter

Bewertet werden insbesondere:

- Anforderungstreue
- Vollständigkeit und Abgrenzung des Arbeitsauftrags
- prüfbare Abnahmekriterien
- Erkennen notwendiger fachlicher Klärungen
- Einhaltung der Entscheidungsgrenzen

Harter Fehler ist insbesondere eine eigenmächtige fachliche Festlegung.

### Softwarearchitekt

Bewertet werden insbesondere:

- Architekturkonformität
- technische Korrektheit
- angemessene Einfachheit der Lösung
- Einhaltung der Entscheidungsgrenzen
- vollständige technische Übergabe und Orchestrierung

Harter Fehler ist insbesondere eine unbegründete Änderung eines Architekturgrundsatzes oder der fachlichen Anforderung.

### Entwicklung

Bewertet werden insbesondere:

- funktionale Korrektheit
- Anforderungstreue
- Code- und Testqualität
- begrenzter Änderungsumfang
- Vermeidung von Regressionen

Harter Fehler ist insbesondere die Nichterfüllung eines Abnahmekriteriums oder die Beschädigung bestehenden Verhaltens.

### QA

Bewertet werden insbesondere:

- Erkennung vorhandener Fehler
- Vollständigkeit der Prüfung der Abnahmekriterien
- Präzision und Relevanz der Befunde
- Vermeidung unbegründeter Befunde
- unabhängige Prüfung von Tests und Entwicklernachweisen

Harter Fehler ist insbesondere das Übersehen eines bekannten abnahmerelevanten Fehlers oder die Freigabe eines fehlerhaften Stands.

## 3. eval-01 – Backend-Verbindung erneut prüfen

### Nutzereingabe

> Wenn Pipwerk Studio das Backend nicht erreicht, möchte ich die Verbindung über eine Schaltfläche erneut prüfen können.

### Referenz

1. Die Schaltfläche wird nur angezeigt, wenn das Backend als nicht erreichbar erkannt wurde.
2. Betätigung startet erneut die vorhandene Health-Prüfung.
3. Während der Prüfung wird der vorhandene Prüfstatus angezeigt.
4. Nach erfolgreicher Prüfung erscheint wieder der vorhandene Status „verbunden“.
5. Bei erneutem Fehlschlag bleibt die Möglichkeit zur Wiederholung erhalten.
6. Die Schaltflächenbeschriftung steht auf Deutsch und Englisch zur Verfügung.
7. Der vorhandene Backend-Endpunkt wird nicht verändert.
8. Bestehendes Verhalten außerhalb dieser Erweiterung bleibt unverändert.

### Schwerpunkt

UI-Interaktion, Fehlerzustand, Wiederverwendung vorhandener Funktion, Internationalisierung und begrenzter Änderungsumfang.

## 4. eval-02 – Sprachauswahl beibehalten

### Nutzereingabe

> Pipwerk Studio soll sich die ausgewählte Sprache merken.

### Referenz

1. Der Nutzer kann weiterhin Deutsch oder Englisch auswählen.
2. Die Auswahl bleibt nach einem Neuladen der Anwendung erhalten.
3. Ohne gespeicherte Auswahl bleibt Deutsch die Standardsprache.
4. Ausschließlich die bereits unterstützten Werte `de` und `en` werden akzeptiert.
5. Ein ungültiger gespeicherter Wert wird ignoriert; Deutsch bleibt Standard.
6. Fachliche Daten werden weder gespeichert noch verändert.
7. Geeignete automatisierte Tests werden ergänzt.
8. Das Backend wird nicht geändert.

### Schwerpunkt

Persistenz eines UI-Zustands und Trennung zwischen fachlicher Anforderung und technischer Umsetzungsentscheidung.

Die konkrete browserseitige Speichertechnik ist keine fachliche Festlegung des Testfalls.

## 5. eval-03 – Fehlerstatus nach Wiederherstellung korrigieren

### Nutzereingabe

> Wenn die Verbindung zum Backend kurz ausfällt und danach wieder funktioniert, darf Pipwerk Studio nicht dauerhaft „Backend: nicht erreichbar“ anzeigen.

### Referenz

1. Nach einem Verbindungsfehler wird weiterhin „nicht erreichbar“ angezeigt.
2. Sobald eine erneute Health-Prüfung erfolgreich ist, wird „verbunden“ angezeigt.
3. Ein Neuladen der gesamten Anwendung ist dafür nicht erforderlich.
4. Deutsch und Englisch funktionieren unverändert.
5. Der Backend-Health-Endpunkt wird nicht geändert.
6. Fehlerfall und Wiederherstellung werden automatisiert getestet.

### Abhängigkeit

`eval-03` darf auf dem implementierten und geprüften Stand von `eval-01` aufbauen. Diese Abhängigkeit muss im jeweiligen Evaluationslauf dokumentiert werden.

### Schwerpunkt

Korrekturqualität, Zustandswechsel nach einem Fehler, Regressionserkennung und Prüfung vorhandener Funktionalität.

## 6. Durchführung

Für einen vergleichbaren Evaluationslauf werden mindestens dokumentiert:

- Testfall und Version des Evaluationssatzes
- Repository-Basis und Commit
- Rolle
- verwendete Agentenkonfiguration beziehungsweise Prompt-Version
- Modellkennung und, soweit verfügbar, Modellversion
- Provider und relevante Laufzeitparameter
- Laufnummer
- unveränderte Eingaben des Testfalls
- erzeugtes Ergebnis
- Einzelbewertungen
- harte Fehler
- Gesamturteil des Testlaufs
- Evaluator

Entwicklung und QA werden entsprechend dem festgelegten Entwicklungsprozess mit unterschiedlichen Modellen ausgeführt.

Für QA-Evaluationen werden kontrollierte PR-Stände mit vorher dokumentierten Soll-Befunden verwendet. Die Soll-Befunde werden dem zu prüfenden QA-Agenten nicht mitgeteilt.
