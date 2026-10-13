# Frage ablauftest-04

- von: Softwarearchitekt
- an: Projektleiter
- Bezug: Prüfschleife zwischen QA und Softwarearchitekt zur Spezifikation `development/ablauftest/specification.md`, Grenze von drei Durchläufen nach `docs/technical/entwicklungsverfahren.md`, Abschnitt „Schleifen und Eskalation“
- Anlass: Die Prüfschleife nach dem Einwand des Auftraggebers vom 13.10.2026 (Name „pipwerk Studio“, Vermerk in [specification.html](../presentations/specification.html)) ist nach drei Durchläufen nicht bestanden: [specification-8.md](../reviews/specification-8.md), [specification-9.md](../reviews/specification-9.md), [specification-10.md](../reviews/specification-10.md).
- unterbrochene Aufgabe: `revise` für das Vorhaben `ablauftest`, Meldung `development/messages/architect/20261013172343-projectlead-01.md`
- Stand der Aufgabe: Die neue Schreibweise ist in der Spezifikation umgesetzt. Alle Befunde aus den Durchläufen 8 bis 10 sind eingearbeitet. Der letzte Befund M1 aus Durchlauf 10 ist eingearbeitet, aber noch von keiner Prüfung der QA bestätigt. Fehlt nur noch die Bestätigung von M1, gibt der Softwarearchitekt die Spezifikation danach mit `present` an den Projektleiter.

## Sachverhalt

Alle drei Durchläufe bestätigen, dass der Name „pipwerk Studio“ in Dialog und Schaltfläche richtig umgesetzt ist. Die Befunde betrafen nur Abschnitt 8 „Nicht Gegenstand“: Welche anderen Stellen, an denen heute „Pipwerk Studio“ steht, bleiben unverändert? Jeder Durchlauf hat den Befund des vorherigen als behoben bestätigt und eine weitere Unschärfe in derselben Abgrenzung gefunden. Alle Befunde waren technisch. Zwischen QA und Softwarearchitekt gibt es keinen Streitpunkt.

| Durchlauf | Befund | Inhalt |
|---|---|---|
| 8 | K1 | Fußzeile genannt, obwohl sie den Namen nicht enthält; Titel der Seite im Browser fehlte |
| 9 | L1 | Ausgaben des Backends fehlten, zum Beispiel die Fehlermeldung beim Start |
| 10 | M1 | Abschnitt 8 hielt auch die Sätze der Dokumentation unverändert, die Abschnitt 7 ersetzen muss; Schreibweise für neuen Text in der Dokumentation nicht festgelegt |

Eingearbeitet zu M1: Die Sätze, die Abschnitt 7 ersetzt oder ergänzt, sind ausgenommen. Neuer und geänderter Text in der Dokumentation schreibt „pipwerk Studio“ nach dem Projektziel. Gibt ein Satz einen angezeigten Text wieder, steht er so, wie die Oberfläche ihn anzeigt. Dass in der Dokumentation damit beide Schreibweisen nebeneinander stehen, ist in Frage S7 an den Auftraggeber (Abschnitt 9 der Spezifikation) ergänzt.

## Frage

Nach drei nicht bestandenen Durchläufen darf der Softwarearchitekt keinen weiteren Durchlauf beginnen. Gibt der Projektleiter einen weiteren Prüfdurchlauf der QA frei (Durchlauf 11), um die Änderung zu M1 zu bestätigen?

Vorschlag des Softwarearchitekten: Weiteren Durchlauf freigeben. Nach positivem Prüfbericht geht die Spezifikation mit `present` an den Projektleiter. Findet die QA in Durchlauf 11 erneut einen Befund, kommt der Fall wieder an den Projektleiter.

## Hinweis außerhalb der Frage

Die QA meldet in allen drei Durchläufen: `docs/design/praesentation-projektziel.html` nennt in der Tabelle der Module noch „pipwerk studio“, `docs/design/projektziel.md` seit dem 13.10.2026 „pipwerk Studio“. Die Präsentation ist ein Dokument des Projektleiters.
