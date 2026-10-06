# Pipwerk Studio – Anwenderdokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-04
- komponente: `pipwerk-studio`

## 1. Wozu Pipwerk Studio dient

Pipwerk Studio ist der grafische Strategiedesigner von Pipwerk. Der derzeitige Stand zeigt eine leere Arbeitsfläche und unterstützt eine dauerhaft gespeicherte deutsche oder englische Oberfläche. Strategien können noch nicht angelegt, bearbeitet, gespeichert oder ausgeführt werden.

## 2. Pipwerk Studio öffnen

Pipwerk Studio kann derzeit nur in einer Entwicklungsumgebung gestartet werden. Eine Installation für Anwender gibt es noch nicht. Die Schritte zum Start stehen in der technischen Dokumentation unter `docs/technical/pipwerk-studio.md` im Abschnitt „Einrichtung und Start im Entwicklungsbetrieb“.

Nach dem Start wird Pipwerk Studio im Browser unter `http://127.0.0.1:5173/` geöffnet.

## 3. Aufbau der Oberfläche

Die Kopfzeile zeigt den Namen „Pipwerk Studio“ und rechts die Sprachauswahl. In der Mitte liegt die leere Designer-Arbeitsfläche mit Punktraster. Sie kann verschoben sowie mit dem Mausrad vergrößert und verkleinert werden. Die Fußzeile zeigt den Zustand des Hintergrunddiensts:

| Anzeige | Bedeutung |
| --- | --- |
| „Backend: Verbindung wird geprüft“ | Pipwerk Studio fragt beim Hintergrunddienst an. |
| „Backend: verbunden“ | Der Hintergrunddienst hat korrekt geantwortet. |
| „Backend: nicht erreichbar“ | Der Hintergrunddienst hat nicht oder unerwartet geantwortet. Prüfen Sie, ob er läuft, und laden Sie die Seite danach neu. |

## 4. Sprache wechseln

Pipwerk Studio unterstützt Deutsch und Englisch. Ohne zuvor gespeicherte Auswahl startet es auf Deutsch.

1. Öffnen Sie in der Kopfzeile das Auswahlfeld neben „Sprache“ beziehungsweise „Language“.
2. Wählen Sie „English“ oder „Deutsch“.

Die sichtbaren Oberflächentexte wechseln sofort. Der Produktname „Pipwerk Studio“ bleibt unverändert. Selbst vergebene Namen, frei eingegebene Texte, Strategieinhalte und andere fachliche Einstellungen werden durch den Sprachwechsel nicht übersetzt oder verändert.

Die Auswahl wird zentral im Hintergrunddienst für diese Pipwerk-Studio-Komponente gespeichert. Sie bleibt nach einem Neuladen der Browserseite und nach einem Neustart von Pipwerk Studio erhalten. Die Sprache gilt komponentenweit, nicht pro Benutzer; Benutzerkonten oder Anmeldungen gibt es in diesem Stand nicht. Die Auswahl wird nicht im Browser gespeichert.

Während die gespeicherte Sprache beim Öffnen ermittelt wird, ist die Auswahl kurz deaktiviert. Kann die Sprache nicht gelesen oder eine Änderung nicht gespeichert werden, erscheint eine Fehlermeldung. Bei einem fehlgeschlagenen Wechsel bleibt die zuletzt bestätigte Sprache aktiv. Prüfen Sie in diesem Fall den Hintergrunddienst und versuchen Sie es erneut.

## 5. Bekannte Einschränkungen

- Die Arbeitsfläche ist noch leer; Strategien können noch nicht bearbeitet werden.
- Pipwerk Studio besitzt noch kein Installationspaket für Anwender.
- Die Sprache gilt für die gesamte laufende Studio-Komponente und nicht für einzelne Personen.
- Weitere Sprachen als Deutsch und Englisch sind nicht verfügbar.
