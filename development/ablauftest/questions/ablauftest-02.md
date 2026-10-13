# Frage ablauftest-02

- von: Softwarearchitekt
- an: Auftraggeber über den Projektleiter
- Bezug: req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, Satz „die vollständige Kennung des Commits, aus dem pipwerk studio läuft“; Entscheidung E9 in `development/ablauftest/specification.md`
- Anlass: Die Prüfschleife zwischen QA und Softwarearchitekt zur Spezifikation ist nach drei Durchläufen nicht bestanden ([specification-1.md](../reviews/specification-1.md), [specification-2.md](../reviews/specification-2.md), [specification-3.md](../reviews/specification-3.md)). Der verbliebene Streitpunkt betrifft den Inhalt von req-ui-010.
- unterbrochene Aufgabe: `specify` für das Vorhaben `ablauftest`
- Stand der Aufgabe: Die Spezifikation liegt als Entwurf in `development/ablauftest/specification.md`. Alle Befunde der QA sind eingearbeitet außer D1 und D2 aus Durchlauf 3. Beide hängen von der Antwort ab. Nach der Antwort passt der Softwarearchitekt E9, den Absatz „Grenze im Entwicklungsbetrieb“, den Browsertest, die Vorgaben zur Anwenderdokumentation und Abschnitt 9 an und lässt die Spezifikation erneut von der QA prüfen.

## Sachverhalt

pipwerk studio lässt sich heute auf zwei Wegen starten.

1. **Entwicklungsbetrieb.** Zwei Programme werden von Hand gestartet. Das Programm für die Oberfläche übernimmt jede Änderung an den Dateien sofort, auch Änderungen, die noch nicht als Commit gespeichert sind. Die Anwenderdokumentation beschreibt heute nur diesen Weg.
2. **Testumgebung.** Ein Skript baut die Oberfläche aus genau einem Commit und startet sie. Das Skript entsteht in diesem Vorhaben. Über diesen Weg erhält der Auftraggeber künftig jedes Arbeitspaket zur Abnahme.

In der Testumgebung zeigt der Dialog immer genau den Commit, aus dem pipwerk studio läuft.

Im Entwicklungsbetrieb gilt das nicht immer. Wechselt man dort nach dem Start auf einen anderen Commit oder ändert Dateien, ohne einen Commit anzulegen, läuft bereits der geänderte Code. Der Dialog nennt aber weiter den Commit vom Start. Die Standanzeige in der Fußzeile verhält sich heute schon genauso. Eine genaue Anzeige ist bei nicht gespeicherten Änderungen nicht möglich, weil der laufende Code dann zu keinem Commit gehört.

## Frage

Für welchen Weg muss der Dialog den Commit genau anzeigen?

Vorschlag des Softwarearchitekten: Genau muss er in der Testumgebung sein und in jeder späteren Installation. Im Entwicklungsbetrieb nennt er den Commit vom Start der Programme; die Abweichung wird in der Anwenderdokumentation erklärt. Die Anwenderdokumentation beschreibt zusätzlich die Testumgebung als Weg, pipwerk studio zu starten.

Antwort:
