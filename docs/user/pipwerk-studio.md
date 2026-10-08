# Pipwerk Studio – Anwenderdokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-08
- komponente: `pipwerk-studio`

## 1. Wozu Pipwerk Studio dient

Pipwerk Studio ist der grafische Strategiedesigner von Pipwerk. Mit ihm sollen später Handelsstrategien auf einer Arbeitsfläche zusammengestellt und bearbeitet werden.

Der derzeitige Stand ist ein technisches Grundgerüst. Pipwerk Studio zeigt eine leere Arbeitsfläche und unterstützt eine dauerhaft gespeicherte deutsche oder englische Oberfläche. Strategien können noch nicht angelegt, bearbeitet, gespeichert oder ausgeführt werden.

## 2. Pipwerk Studio öffnen

Pipwerk Studio kann derzeit nur in einer Entwicklungsumgebung gestartet werden. Eine Installation für Anwender gibt es noch nicht. Die Schritte zum Start stehen in der technischen Dokumentation unter `docs/technical/pipwerk-studio.md` im Abschnitt „Einrichtung und Start im Entwicklungsbetrieb“. Pipwerk Studio startet nur mit einer gültigen INI-Startkonfiguration, die zur Installation gehört und mindestens die Datenbankverbindung festlegt. Ohne sie bricht der Start mit einer Fehlermeldung ab; eine Ersatzdatenbank wird nicht angelegt.

Nach dem Start wird Pipwerk Studio in einem Webbrowser unter der Adresse `http://127.0.0.1:5173/` geöffnet.

## 3. Aufbau der Oberfläche

Die Oberfläche besteht aus drei Bereichen.

Oben steht die Kopfzeile. Sie zeigt links den Namen „Pipwerk Studio“ und rechts das Auswahlfeld für die Sprache.

In der Mitte liegt die Designer-Arbeitsfläche. Sie ist mit einem Punktraster hinterlegt. Oben links steht der Hinweis „Die Arbeitsfläche ist leer.“ Die Arbeitsfläche kann mit der Maus verschoben und mit dem Mausrad vergrößert oder verkleinert werden. Weitere Funktionen hat sie noch nicht.

Unten steht die Fußzeile. Sie zeigt links, ob Pipwerk Studio seinen Hintergrunddienst erreicht, und rechts daneben den Stand, aus dem Pipwerk Studio läuft. Der Hintergrunddienst ist der Teil von Pipwerk Studio, der außerhalb des Browsers läuft.

| Anzeige | Bedeutung |
| --- | --- |
| „Backend: Verbindung wird geprüft“ | Pipwerk Studio fragt gerade beim Hintergrunddienst an. |
| „Backend: verbunden“ | Der Hintergrunddienst hat geantwortet. Pipwerk Studio ist bereit. |
| „Backend: nicht erreichbar“ | Der Hintergrunddienst hat nicht oder nicht richtig geantwortet. In diesem Fall muss geprüft werden, ob er gestartet ist. Danach wird die Seite im Browser neu geladen. |

Der Stand ist die Kurzform des Commits, also die ersten 7 Zeichen der Kennung des Arbeitsstands, aus dem Pipwerk Studio gestartet wurde. Damit ist bei einer Prüfung erkennbar, welcher Stand bereitgestellt ist. Er ist keine Versionsnummer und kein Datum. Die Bezeichnung folgt der gewählten Sprache.

| Anzeige | Bedeutung |
| --- | --- |
| „Stand: <kurzform>“ (Deutsch), „Revision: <kurzform>“ (Englisch) | Pipwerk Studio läuft aus dem Commit, dessen Kennung mit diesen 7 Zeichen beginnt. |
| „Stand: unbekannt“ (Deutsch), „Revision: unknown“ (Englisch) | Der Stand lässt sich nicht ermitteln, zum Beispiel weil Pipwerk Studio außerhalb eines Git-Arbeitsbereichs oder ohne Git gestartet wurde. Dasselbe wird kurz angezeigt, solange die Anfrage läuft, und wenn sie fehlschlägt. Pipwerk Studio arbeitet unabhängig davon normal. |

Der Stand wird einmal beim Start von Pipwerk Studio ermittelt. Wird der Arbeitsbereich danach auf einen anderen Commit gesetzt, zeigt ein weiterlaufendes Pipwerk Studio weiter den Stand beim Start; nach einem Neustart zeigt es den neuen Stand.

## 4. Sprache wechseln

Pipwerk Studio kann auf Deutsch und auf Englisch angezeigt werden. Ohne zuvor gespeicherte Auswahl ist beim Öffnen Deutsch eingestellt.

So wird die Sprache gewechselt:

1. Klicken Sie in der Kopfzeile auf das Auswahlfeld neben „Sprache“ beziehungsweise „Language“.
2. Wählen Sie „English“ für Englisch oder „Deutsch“ für Deutsch.

Alle Texte der Oberfläche erscheinen sofort in der gewählten Sprache. Der Name „Pipwerk Studio“ bleibt unverändert. Selbst vergebene Namen, frei eingegebene Texte, Strategieinhalte und andere fachliche Einstellungen werden durch den Sprachwechsel nicht übersetzt oder verändert.

Die Auswahl wird zentral im Hintergrunddienst für diese Pipwerk-Studio-Komponente gespeichert. Sie bleibt nach einem Neuladen der Browserseite und nach einem Neustart von Pipwerk Studio erhalten. Die Sprache gilt komponentenweit, nicht pro Benutzer; Benutzerkonten oder Anmeldungen gibt es in diesem Stand nicht. Die Auswahl wird nicht im Browser gespeichert.

Das Auswahlfeld ist deaktiviert, solange die gespeicherte Sprache gelesen wird (beim Öffnen und bei einem erneuten Lesen im Hintergrund, solange noch keine Sprache bestätigt ist) und solange eine Änderung gespeichert wird. Beim Speichern zeigen Auswahlfeld und Texte bereits die neu gewählte Sprache. Antwortet der Hintergrunddienst nicht innerhalb von 10 Sekunden, gilt das Lesen beziehungsweise Speichern als fehlgeschlagen und es erscheint die entsprechende Fehlermeldung. Das gilt auch, wenn der Browser meldet, dass keine Internetverbindung besteht: Der Hintergrunddienst läuft auf dem eigenen Rechner, und Anfragen an ihn werden trotzdem gesendet. Es gibt drei Fehlermeldungen:

| Meldung | Bedeutung |
| --- | --- |
| „Die gespeicherte Sprache konnte nicht gelesen werden. Es wird die Standardsprache Deutsch angezeigt.“ | Beim Öffnen konnte die gespeicherte Sprache nicht vom Hintergrunddienst gelesen werden. Pipwerk Studio zeigt Deutsch an. Die Auswahl bleibt bedienbar. Wird im Hintergrund erneut gelesen (zum Beispiel nach einem Wechsel zurück ins Browserfenster), ist sie währenddessen kurz deaktiviert und die Meldung verschwindet, bis das Lesen erneut fehlschlägt. Prüfen Sie, ob der Hintergrunddienst läuft, und laden Sie die Seite neu. Ist die Sprache beim Öffnen bereits gelesen worden, erscheint diese Meldung später nicht mehr: Schlägt ein erneutes Lesen im Hintergrund fehl (zum Beispiel nach einem Wechsel zurück ins Browserfenster), bleibt die zuletzt bestätigte Sprache angezeigt. |
| „Die Sprache konnte nicht gespeichert werden. Die zuletzt bestätigte Sprache bleibt aktiv.“ | Eine Änderung wurde nicht gespeichert. Pipwerk Studio zeigt wieder die zuletzt bestätigte Sprache an. Prüfen Sie den Hintergrunddienst und versuchen Sie es erneut. |
| „Die Sprache konnte nicht gespeichert werden. Es wird die Standardsprache Deutsch angezeigt, weil die gespeicherte Sprache nicht gelesen werden konnte.“ | Beim Öffnen konnte die gespeicherte Sprache nicht gelesen werden und die Änderung ließ sich ebenfalls nicht speichern. Es gibt keine bestätigte Sprache; Pipwerk Studio zeigt Deutsch an. Prüfen Sie den Hintergrunddienst und versuchen Sie es erneut. |

Wird die Sprache später erfolgreich gelesen oder eine Änderung erfolgreich gespeichert, verschwinden Meldungen, die darauf beruhten, dass keine Sprache bestätigt war.

## 5. Bekannte Einschränkungen

- Die Arbeitsfläche ist noch leer; Strategien können noch nicht bearbeitet werden.
- Pipwerk Studio besitzt noch kein Installationspaket für Anwender.
- Die Sprache gilt für die gesamte laufende Studio-Komponente und nicht für einzelne Personen.
- Weitere Sprachen als Deutsch und Englisch sind nicht verfügbar.
