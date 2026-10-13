# Frage ablauftest-03

- von: Softwarearchitekt
- an: Projektleiter
- Bezug: Prüfschleife zwischen QA und Softwarearchitekt zur Spezifikation `development/ablauftest/specification.md`, Grenze von drei Durchläufen nach `docs/technical/entwicklungsverfahren.md`, Abschnitt „Schleifen und Eskalation“
- Anlass: Die Prüfschleife, die mit der Antwort auf Frage [ablauftest-02](ablauftest-02.md) begonnen hat, ist nach drei Durchläufen nicht bestanden: [specification-4.md](../reviews/specification-4.md), [specification-5.md](../reviews/specification-5.md), [specification-6.md](../reviews/specification-6.md).
- unterbrochene Aufgabe: `specify` für das Vorhaben `ablauftest`, fortgesetzt mit der Meldung `answer` zu Frage ablauftest-02
- Stand der Aufgabe: Alle Befunde aus den Durchläufen 3 bis 6 sind in der Spezifikation eingearbeitet. Der letzte Befund H1 aus Durchlauf 6 ist eingearbeitet, aber noch von keiner Prüfung der QA bestätigt. Fehlt nur noch die Bestätigung von H1, gibt der Softwarearchitekt die Spezifikation danach mit `present` an den Projektleiter.

## Sachverhalt

Nach der Antwort auf Frage ablauftest-02 hat die QA die Spezifikation dreimal geprüft. Jeder Durchlauf hat die Befunde des vorherigen als behoben bestätigt und einen kleineren neuen Befund gefunden. Alle Befunde waren technisch. Keiner betraf eine Anforderung oder eine Entscheidung des Auftraggebers. Zwischen QA und Softwarearchitekt gibt es keinen Streitpunkt.

| Durchlauf | Befunde | Inhalt |
|---|---|---|
| 4 | F1, F2 | Widerspruch zur späteren Installation; fehlender Test des Testumgebungsskripts |
| 5 | G1, G2, G3 | Bedingung für das Backend; Prüfung des ganzen Repositorys; Aufbau des Tests |
| 6 | H1 | Verhalten des neuen Tests, wenn der Arbeitsbereich kein Git-Arbeitsbereich ist |

Durchlauf 6 bestätigt G1, G2 und G3 als behoben. H1 ist eine Lücke in einem einzelnen Satz der Spezifikation (Abschnitt 4.3): Wann wird ein Test übersprungen? Der Softwarearchitekt hat die Lücke geschlossen. Der Test wird jetzt auch übersprungen, wenn der Arbeitsbereich kein Git-Arbeitsbereich ist. Das ist dieselbe Regel wie beim bestehenden Browsertest.

## Frage

Nach drei nicht bestandenen Durchläufen darf der Softwarearchitekt keinen weiteren Durchlauf beginnen. Gibt der Projektleiter einen weiteren Prüfdurchlauf der QA frei (Durchlauf 7), um die Änderung zu H1 zu bestätigen?

Vorschlag des Softwarearchitekten: Weiteren Durchlauf freigeben. Nach positivem Prüfbericht geht die Spezifikation mit `present` an den Projektleiter. Findet die QA in Durchlauf 7 erneut einen Befund, kommt der Fall wieder an den Projektleiter.

Antwort:
