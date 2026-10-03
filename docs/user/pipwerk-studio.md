# Pipwerk Studio – Anwenderdokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-02
- komponente: `pipwerk-studio`

## 1. Wozu Pipwerk Studio dient

Pipwerk Studio ist der grafische Strategiedesigner von Pipwerk. Mit ihm sollen später Handelsstrategien auf einer Arbeitsfläche zusammengestellt und bearbeitet werden.

Der derzeitige Stand ist ein technisches Grundgerüst. Pipwerk Studio zeigt eine leere Arbeitsfläche und in der Fußzeile die laufende Version. Strategien können noch nicht angelegt, bearbeitet, gespeichert oder ausgeführt werden.

## 2. Pipwerk Studio öffnen

Pipwerk Studio kann derzeit nur in einer Entwicklungsumgebung gestartet werden. Eine Installation für Anwender gibt es noch nicht. Die Schritte zum Start stehen in der technischen Dokumentation unter `docs/technical/pipwerk-studio.md` im Abschnitt „Einrichtung und Start im Entwicklungsbetrieb“.

Nach dem Start wird Pipwerk Studio in einem Webbrowser unter der Adresse `http://127.0.0.1:5173/` geöffnet.

## 3. Aufbau der Oberfläche

Die Oberfläche besteht aus drei Bereichen.

Oben steht die Kopfzeile. Sie zeigt links den Namen „Pipwerk Studio“ und rechts das Auswahlfeld für die Sprache.

In der Mitte liegt die Designer-Arbeitsfläche. Sie ist mit einem Punktraster hinterlegt. Oben links steht der Hinweis „Die Arbeitsfläche ist leer.“ Die Arbeitsfläche kann mit der Maus verschoben und mit dem Mausrad vergrößert oder verkleinert werden. Weitere Funktionen hat sie noch nicht.

Unten steht die Fußzeile. Sie zeigt links, ob Pipwerk Studio seinen Hintergrunddienst erreicht. Der Hintergrunddienst ist der Teil von Pipwerk Studio, der außerhalb des Browsers läuft. Rechts zeigt die Fußzeile den Namen und die laufende Version von Pipwerk Studio, zum Beispiel „Pipwerk Studio Version 0.1.0.dev0“.

| Anzeige | Bedeutung |
| --- | --- |
| „Backend: Verbindung wird geprüft“ | Pipwerk Studio fragt gerade beim Hintergrunddienst an. |
| „Backend: verbunden“ | Der Hintergrunddienst hat geantwortet. Pipwerk Studio ist bereit. |
| „Backend: nicht erreichbar“ | Der Hintergrunddienst hat nicht oder nicht richtig geantwortet. In diesem Fall muss geprüft werden, ob er gestartet ist. Danach wird die Seite im Browser neu geladen. |

Die Versionsangabe stammt vom Hintergrunddienst. Ist er nicht erreichbar, bleibt die Fußzeile ohne Versionsangabe. Pipwerk Studio kann dann weiterhin bedient werden.

Die Versionsangabe ist hilfreich, wenn ein Fehler gemeldet wird: Sie gibt an, welcher Stand von Pipwerk Studio läuft.

## 4. Sprache wechseln

Pipwerk Studio kann auf Deutsch und auf Englisch angezeigt werden. Beim Öffnen ist Deutsch eingestellt.

So wird die Sprache gewechselt:

1. Klicken Sie in der Kopfzeile auf das Auswahlfeld neben „Sprache“.
2. Wählen Sie „English“ für Englisch oder „Deutsch“ für Deutsch.

Alle Texte der Oberfläche erscheinen sofort in der gewählten Sprache. Das gilt auch für die Versionsangabe in der Fußzeile, die auf Englisch „Pipwerk Studio version 0.1.0.dev0“ lautet. Der Name „Pipwerk Studio“ und die Versionsnummer selbst bleiben unverändert. Die gewählte Sprache wird nicht gespeichert. Nach dem Neuladen der Seite ist wieder Deutsch eingestellt.
