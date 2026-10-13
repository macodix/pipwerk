# Frage ablauftest-06

- von: Softwarearchitekt
- an: Projektleiter
- Bezug: Prüfschleife zwischen QA und Softwarearchitekt zur Spezifikation `development/ablauftest/specification.md`. Durchlauf 12 wurde mit der Antwort auf Frage [ablauftest-05](ablauftest-05.md) einzeln als Nachprüfung freigegeben. Grenze von drei Durchläufen nach `docs/technical/entwicklungsverfahren.md`, Abschnitt „Schleifen und Eskalation“.
- Anlass: Durchlauf 12 ist nicht bestanden: [specification-12.md](../reviews/specification-12.md). Nach dem Vorschlag in ablauftest-05 geht der Fall bei einem neuen Befund an den Projektleiter zurück.
- unterbrochene Aufgabe: `revise` für das Vorhaben `ablauftest`, ursprünglich mit der Meldung `development/messages/architect/20261013172343-projectlead-01.md`, fortgesetzt mit den Meldungen `development/messages/architect/20261013175002-projectlead-01.md` und `development/messages/architect/20261013182152-projectlead-01.md` (`answer`)
- Stand der Aufgabe: Die QA bestätigt in Durchlauf 12, dass P1 und P2 behoben sind. An den unveränderten Stellen hat sie keinen Befund. Der neue Befund Q1 ist eingearbeitet, aber noch von keiner Prüfung der QA bestätigt. Fehlt nur noch diese Bestätigung, gibt der Softwarearchitekt die Spezifikation danach mit `present` an den Projektleiter.

## Sachverhalt

Q1 ist technisch und durch die Korrektur zu P1 entstanden. Zwischen QA und Softwarearchitekt gibt es keinen Streitpunkt.

| Befund | Inhalt | Eingearbeitet |
|---|---|---|
| Q1 | Die neue Prüfregel in Abschnitt 4.4 („richtig geschrieben“) wertet den Programmnamen `pipwerk-studio` als falsche Schreibweise. Der Programmname bleibt nach E10 aber unverändert und steht im Hilfetext (`usage: pipwerk-studio`) und vor Fehlermeldungen. Der vorgeschriebene Test hätte deshalb scheitern müssen. Außerdem war offen, ob bei der Fehlermeldung beim Start die ganze ausgegebene Zeile geprüft wird. | Abschnitt 4.4: Der Bezeichner `pipwerk-studio` in Kleinbuchstaben gilt als richtig geschrieben, wie schon bei der Suche im Repository. Geprüft wird jeweils der ausgegebene Text einschließlich des vorangestellten Programmnamens. |

## Frage

Der vom Projektleiter freigegebene Durchlauf 12 ist verbraucht. Gibt der Projektleiter einen weiteren Prüfdurchlauf der QA frei (Durchlauf 13), um die Änderung zu Q1 zu bestätigen?

Vorschlag des Softwarearchitekten: Durchlauf 13 freigeben, als Nachprüfung im selben Umfang wie Durchlauf 12, also nur Q1 und die dafür geänderten Stellen. Nach positivem Prüfbericht geht die Spezifikation mit `present` an den Projektleiter. Findet die QA erneut einen Befund, kommt der Fall wieder an den Projektleiter.

## Hinweise außerhalb der Frage

- Die Hinweise aus ablauftest-05 gelten weiter: `development/ablauftest/scope.md`, Zeile 3, schreibt noch „Pipwerk Studio“; die Fundstellen unter `docs/design/` nennt Abschnitt 9 der Spezifikation; den Programmnamen `pipwerk-studio` in Hilfetext und Fehlermeldungen behandelt E10 als technischen Namen und ändert ihn nicht. Die QA weist erneut darauf hin, dass der Auftraggeber das anders verstehen könnte.

Antwort: Durchlauf 13 freigegeben, als Nachprüfung im Umfang wie Durchlauf 12: nur Q1 und die dafür geänderten Stellen. `scope.md` Zeile 3 ist korrigiert. Der Programmname `pipwerk-studio` bleibt als technischer Name unverändert. (Projektleiter, 13. Oktober 2026)
