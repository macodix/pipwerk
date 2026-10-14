# pipwerk Studio – Anwenderdokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-14
- komponente: `pipwerk-studio`

## 1. Wozu pipwerk Studio dient

pipwerk Studio ist der grafische Strategiedesigner von Pipwerk. Mit ihm sollen später Handelsstrategien auf einer Arbeitsfläche zusammengestellt und bearbeitet werden.

Der derzeitige Stand ist ein technisches Grundgerüst. pipwerk Studio zeigt eine leere Arbeitsfläche und unterstützt eine dauerhaft gespeicherte deutsche oder englische Oberfläche. Strategien können noch nicht angelegt, bearbeitet, gespeichert oder ausgeführt werden.

## 2. pipwerk Studio öffnen

Eine Installation für Anwender gibt es noch nicht. pipwerk Studio lässt sich auf zwei Wegen starten: als Testumgebung und im Entwicklungsbetrieb. Beide Wege brauchen eine gültige INI-Startkonfiguration. Sie legt mindestens die Datenbankverbindung fest. Die Testumgebung legt sie selbst an. Im Entwicklungsbetrieb legen Sie sie an. Ohne eine gültige INI-Startkonfiguration bricht der Start mit einer Fehlermeldung ab; eine Ersatzdatenbank wird nicht angelegt.

### Erster Weg: Testumgebung

Die Testumgebung ist pipwerk Studio, gebaut und gestartet aus genau einem Commit. Ein Commit ist ein festgehaltener Stand des Programms im Repository. In der Testumgebung läuft also genau der Stand, den die Standanzeige nennt.

Die Testumgebung wird mit dem Testumgebungsskript `components/pipwerk-studio/scripts/testenv` gestartet, abgefragt und beendet. Welche Programme dafür auf dem Rechner vorhanden sein müssen, steht in der technischen Dokumentation `docs/technical/pipwerk-studio.md` im Abschnitt „Start als Testumgebung“.

1. Starten: `testenv start --frontend-port <Port der Oberfläche> --backend-port <Port des Hintergrunddienstes>`. Beide Ports wählen Sie selbst. Sie müssen frei sein und sich unterscheiden. Der Start dauert, weil das Skript die Programmteile installiert und die Oberfläche baut. Er endet erst, wenn pipwerk Studio antwortet.
2. Öffnen: Rufen Sie im Webbrowser die Adresse `http://127.0.0.1:<Port der Oberfläche>/` auf. Nur wenn Sie beim Start mit `--host` eine andere Adresse des Rechners angegeben haben, gilt diese Adresse. Achtung: Ohne `--host` ist pipwerk Studio nur von Ihrem eigenen Rechner aus erreichbar. Geben Sie mit `--host` eine andere Adresse an, zum Beispiel `0.0.0.0`, kann jeder, der Ihren Rechner im Netz erreicht, pipwerk Studio benutzen und dessen Einstellungen, zum Beispiel die Sprache, ändern. Es gibt keine Anmeldung. Verwenden Sie `--host` deshalb nur in einem Netz, dem Sie vertrauen.
3. Abfragen: `testenv status` nennt, ob die Testumgebung läuft, und ihre Ports.
4. Beenden: `testenv stop` beendet pipwerk Studio und entfernt die Dateien der Testumgebung.

Der Start bricht mit einer Fehlermeldung ab, wenn das Arbeitsverzeichnis nicht genau einem Commit entspricht. Das ist der Fall bei einer nicht committeten Änderung an einer Datei des Repositorys und bei einer neuen Datei, die Git nicht ausdrücklich ignoriert. Die Meldung nennt die Ursache. In diesem Fall wurde nichts installiert, gebaut oder gestartet. Committen oder verwerfen Sie die Änderungen und starten Sie erneut. Der Start bricht ebenfalls ab, wenn schon eine Testumgebung läuft oder ein Port belegt ist.

### Zweiter Weg: Entwicklungsbetrieb

Im Entwicklungsbetrieb starten Sie den Hintergrunddienst und die Oberfläche von Hand in zwei getrennten Terminals. Die Schritte stehen in der technischen Dokumentation unter `docs/technical/pipwerk-studio.md` im Abschnitt „Einrichtung und Start im Entwicklungsbetrieb“. Änderungen an den Dateien wirken dort sofort. Deshalb läuft pipwerk Studio im Entwicklungsbetrieb nicht notwendig aus einem Commit.

Nach dem Start wird pipwerk Studio in einem Webbrowser unter der Adresse `http://127.0.0.1:5173/` geöffnet.

## 3. Aufbau der Oberfläche

Die Oberfläche besteht aus drei Bereichen.

Oben steht die Kopfzeile. Sie zeigt links den Namen „pipwerk Studio“ und rechts das Auswahlfeld für die Sprache. Der Name lautet in Deutsch und in Englisch gleich. Auch der Titel der Seite im Browser lautet „pipwerk Studio“.

In der Mitte liegt die Designer-Arbeitsfläche. Sie ist mit einem Punktraster hinterlegt. Oben links steht der Hinweis „Die Arbeitsfläche ist leer.“ Die Arbeitsfläche kann mit der Maus verschoben und mit dem Mausrad vergrößert oder verkleinert werden. Weitere Funktionen hat sie noch nicht.

Unten steht die Fußzeile. Sie zeigt links, ob pipwerk Studio seinen Hintergrunddienst erreicht, und rechts daneben den Stand, aus dem pipwerk Studio läuft. Der Hintergrunddienst ist der Teil von pipwerk Studio, der außerhalb des Browsers läuft.

| Anzeige | Bedeutung |
| --- | --- |
| „Backend: Verbindung wird geprüft“ | pipwerk Studio fragt gerade beim Hintergrunddienst an. |
| „Backend: verbunden“ | Der Hintergrunddienst hat geantwortet. pipwerk Studio ist bereit. |
| „Backend: nicht erreichbar“ | Der Hintergrunddienst hat nicht oder nicht richtig geantwortet. In diesem Fall muss geprüft werden, ob er gestartet ist. Danach wird die Seite im Browser neu geladen. |

Der Stand ist die Kurzform des Commits, also die ersten 7 Zeichen der Kennung des Arbeitsstands, aus dem pipwerk Studio gestartet wurde. Damit ist bei einer Prüfung erkennbar, welcher Stand bereitgestellt ist. Er ist keine Versionsnummer. Die Bezeichnung folgt der gewählten Sprache.

| Anzeige | Bedeutung |
| --- | --- |
| „Stand: <kurzform>“ (Deutsch), „Revision: <kurzform>“ (Englisch) | pipwerk Studio läuft aus dem Commit, dessen Kennung mit diesen 7 Zeichen beginnt. |
| „Stand: unbekannt“ (Deutsch), „Revision: unknown“ (Englisch) | Der Stand lässt sich nicht ermitteln, zum Beispiel weil pipwerk Studio außerhalb eines Git-Arbeitsbereichs oder ohne Git gestartet wurde. Dasselbe wird kurz angezeigt, solange die Anfrage läuft, und wenn sie fehlschlägt. Es erscheint kein Tooltip. pipwerk Studio arbeitet unabhängig davon normal. |

Fahren Sie mit dem Mauszeiger über die Standanzeige, erscheint ein Tooltip mit der vollständigen Kennung des Commits (40 Zeichen) und dem Datum dieses Commits. Auf Deutsch lautet er „Commit <kennung> vom TT.MM.JJJJ, hh:mm Uhr“, auf Englisch „Commit <kennung> from YYYY-MM-DD hh:mm“. Die Uhrzeit steht im 24-Stunden-Format in der Ortszeit Ihres Browsers. Das Datum ist das Datum des Commits, nicht der Zeitpunkt, an dem pipwerk Studio gebaut oder gestartet wurde. Lässt sich nur das Datum nicht ermitteln, lautet der Tooltip „Commit <kennung>“. Der Tooltip wechselt mit der Sprache. Hilfstechnik wie ein Bildschirmleser liest denselben Text als Beschreibung der Standanzeige vor. Lässt sich der Stand nicht ermitteln, gibt es keinen Tooltip.

Der Stand wird einmal beim Start von pipwerk Studio ermittelt. Wird der Arbeitsbereich danach auf einen anderen Commit gesetzt, zeigt ein weiterlaufendes pipwerk Studio weiter den Stand beim Start; nach einem Neustart zeigt es den neuen Stand.

## 4. Sprache wechseln

pipwerk Studio kann auf Deutsch und auf Englisch angezeigt werden. Ohne zuvor gespeicherte Auswahl ist beim Öffnen Deutsch eingestellt.

So wird die Sprache gewechselt:

1. Klicken Sie in der Kopfzeile auf das Auswahlfeld neben „Sprache“ beziehungsweise „Language“.
2. Wählen Sie „English“ für Englisch oder „Deutsch“ für Deutsch.

Alle Texte der Oberfläche erscheinen sofort in der gewählten Sprache. Der Name „pipwerk Studio“ bleibt unverändert. Selbst vergebene Namen, frei eingegebene Texte, Strategieinhalte und andere fachliche Einstellungen werden durch den Sprachwechsel nicht übersetzt oder verändert.

Die Auswahl wird zentral im Hintergrunddienst für die Komponente pipwerk Studio gespeichert. Sie bleibt nach einem Neuladen der Browserseite und nach einem Neustart von pipwerk Studio erhalten. Die Sprache gilt komponentenweit, nicht pro Benutzer; Benutzerkonten oder Anmeldungen gibt es in diesem Stand nicht. Die Auswahl wird nicht im Browser gespeichert.

Das Auswahlfeld ist deaktiviert, solange die gespeicherte Sprache gelesen wird (beim Öffnen und bei einem erneuten Lesen im Hintergrund, solange noch keine Sprache bestätigt ist) und solange eine Änderung gespeichert wird. Beim Speichern zeigen Auswahlfeld und Texte bereits die neu gewählte Sprache. Antwortet der Hintergrunddienst nicht innerhalb von 10 Sekunden, gilt das Lesen beziehungsweise Speichern als fehlgeschlagen und es erscheint die entsprechende Fehlermeldung. Das gilt auch, wenn der Browser meldet, dass keine Internetverbindung besteht: Der Hintergrunddienst läuft auf dem eigenen Rechner, und Anfragen an ihn werden trotzdem gesendet. Es gibt drei Fehlermeldungen:

| Meldung | Bedeutung |
| --- | --- |
| „Die gespeicherte Sprache konnte nicht gelesen werden. Es wird die Standardsprache Deutsch angezeigt.“ | Beim Öffnen konnte die gespeicherte Sprache nicht vom Hintergrunddienst gelesen werden. pipwerk Studio zeigt Deutsch an. Die Auswahl bleibt bedienbar. Wird im Hintergrund erneut gelesen (zum Beispiel nach einem Wechsel zurück ins Browserfenster), ist sie währenddessen kurz deaktiviert und die Meldung verschwindet, bis das Lesen erneut fehlschlägt. Prüfen Sie, ob der Hintergrunddienst läuft, und laden Sie die Seite neu. Ist die Sprache beim Öffnen bereits gelesen worden, erscheint diese Meldung später nicht mehr: Schlägt ein erneutes Lesen im Hintergrund fehl (zum Beispiel nach einem Wechsel zurück ins Browserfenster), bleibt die zuletzt bestätigte Sprache angezeigt. |
| „Die Sprache konnte nicht gespeichert werden. Die zuletzt bestätigte Sprache bleibt aktiv.“ | Eine Änderung wurde nicht gespeichert. pipwerk Studio zeigt wieder die zuletzt bestätigte Sprache an. Prüfen Sie den Hintergrunddienst und versuchen Sie es erneut. |
| „Die Sprache konnte nicht gespeichert werden. Es wird die Standardsprache Deutsch angezeigt, weil die gespeicherte Sprache nicht gelesen werden konnte.“ | Beim Öffnen konnte die gespeicherte Sprache nicht gelesen werden und die Änderung ließ sich ebenfalls nicht speichern. Es gibt keine bestätigte Sprache; pipwerk Studio zeigt Deutsch an. Prüfen Sie den Hintergrunddienst und versuchen Sie es erneut. |

Wird die Sprache später erfolgreich gelesen oder eine Änderung erfolgreich gespeichert, verschwinden Meldungen, die darauf beruhten, dass keine Sprache bestätigt war.

## 5. Bekannte Einschränkungen

- Die Arbeitsfläche ist noch leer; Strategien können noch nicht bearbeitet werden.
- pipwerk Studio besitzt noch kein Installationspaket für Anwender.
- Die Sprache gilt für die gesamte laufende Komponente pipwerk Studio und nicht für einzelne Personen.
- Weitere Sprachen als Deutsch und Englisch sind nicht verfügbar.
