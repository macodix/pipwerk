# Frage ablauftest-07

- von: Softwarearchitekt
- an: Projektleiter
- Bezug: Prüfschleife zwischen QA und Softwarearchitekt zur Spezifikation `development/ablauftest/specification.md`. Durchlauf 13 wurde mit der Antwort auf Frage [ablauftest-06](ablauftest-06.md) einzeln als Nachprüfung freigegeben. Grenze von drei Durchläufen nach `docs/technical/entwicklungsverfahren.md`, Abschnitt „Schleifen und Eskalation“.
- Anlass: Durchlauf 13 ist nicht bestanden: [specification-13.md](../reviews/specification-13.md). Nach dem Vorschlag in ablauftest-06 geht der Fall bei einem neuen Befund an den Projektleiter zurück.
- unterbrochene Aufgabe: `revise` für das Vorhaben `ablauftest`, ursprünglich mit der Meldung `development/messages/architect/20261013172343-projectlead-01.md`, fortgesetzt mit den Meldungen `development/messages/architect/20261013175002-projectlead-01.md`, `development/messages/architect/20261013182152-projectlead-01.md` und `development/messages/architect/20261013184754-projectlead-01.md` (`answer`)
- Stand der Aufgabe: Die QA bestätigt in Durchlauf 13, dass Q1 behoben ist. An den unveränderten Stellen hat sie keinen Befund. Der neue Befund R1 ist eingearbeitet, aber noch von keiner Prüfung der QA bestätigt. Fehlt nur noch diese Bestätigung, gibt der Softwarearchitekt die Spezifikation danach mit `present` an den Projektleiter.

## Sachverhalt

R1 ist technisch und durch die Korrektur zu Q1 entstanden. Zwischen QA und Softwarearchitekt gibt es keinen Streitpunkt.

| Befund | Inhalt | Eingearbeitet |
|---|---|---|
| R1 | Seit Q1 wird der Hilfetext der Kommandozeile so geprüft, wie das Programm ihn ausgibt. Die Bibliothek argparse bricht den Hilfetext nach der Breite des Terminals um. Bei manchen Breiten stünde „pipwerk“ am Ende einer Zeile und „Studio“ am Anfang der nächsten. Das Ergebnis des Tests hinge dann von der Umgebung ab. | E1, Abschnitte 3.1, 4.4, 5 und 8: Der Hilfetext wird mit festen Zeilenumbrüchen ausgegeben (`argparse.RawTextHelpFormatter`). Der Name steht darin bei jeder Breite ungetrennt. Der Test prüft bei den Breiten 40, 80 und 200 Zeichen. Bricht ein Terminal eine zu lange Zeile bei der Anzeige um, ist das eine Darstellung des Terminals, keine Ausgabe von pipwerk Studio. |

## Frage

Der vom Projektleiter freigegebene Durchlauf 13 ist verbraucht. Gibt der Projektleiter einen weiteren Prüfdurchlauf der QA frei (Durchlauf 14), um die Änderung zu R1 zu bestätigen?

Vorschlag des Softwarearchitekten: Durchlauf 14 freigeben, als Nachprüfung im selben Umfang wie Durchlauf 13, also nur R1 und die dafür geänderten Stellen. Nach positivem Prüfbericht geht die Spezifikation mit `present` an den Projektleiter. Findet die QA erneut einen Befund, kommt der Fall wieder an den Projektleiter.

## Hinweise außerhalb der Frage

- Die QA fragt in R1, ob ein Umbruch des Namens beim Anwender gegen req-ui-010 verstößt („Überall, wo pipwerk Studio seinen Namen … ausgibt, lautet er ‚pipwerk Studio‘“). Mit der Änderung trennt pipwerk Studio den Namen in seiner Ausgabe nicht mehr. Ein Umbruch durch das Terminal bei der Anzeige ist keine Ausgabe von pipwerk Studio. Der Softwarearchitekt sieht deshalb keine Entscheidung des Auftraggebers als nötig an. Sieht der Auftraggeber das anders, ist es eine Frage zu req-ui-010.

Antwort: Durchlauf 14 freigegeben, als Nachprüfung nur für R1 und die dafür geänderten Stellen. Findet die QA darin nur noch Befunde zur Ausgestaltung einzelner Tests, ist die Spezifikation bestanden; solche Befunde stehen im Prüfbericht als Hinweise für die Umsetzung und werden in Phase 4 von Entwickler und Tester gelöst. (Projektleiter, 13. Oktober 2026)
