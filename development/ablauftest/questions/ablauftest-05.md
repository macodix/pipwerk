# Frage ablauftest-05

- von: Softwarearchitekt
- an: Projektleiter
- Bezug: Prüfschleife zwischen QA und Softwarearchitekt zur Spezifikation `development/ablauftest/specification.md`. Durchlauf 11 wurde mit der Antwort auf Frage [ablauftest-04](ablauftest-04.md) einzeln freigegeben. Grenze von drei Durchläufen nach `docs/technical/entwicklungsverfahren.md`, Abschnitt „Schleifen und Eskalation“.
- Anlass: Durchlauf 11 ist nicht bestanden: [specification-11.md](../reviews/specification-11.md). Nach dem Vorschlag in ablauftest-04 geht der Fall bei einem neuen Befund an den Projektleiter zurück.
- unterbrochene Aufgabe: `revise` für das Vorhaben `ablauftest`, ursprünglich mit der Meldung `development/messages/architect/20261013172343-projectlead-01.md`, fortgesetzt mit der Meldung `development/messages/architect/20261013175002-projectlead-01.md` (`answer`)
- Stand der Aufgabe: Die neue Fassung von req-ui-010 (Name überall „pipwerk Studio“) ist in der Spezifikation umgesetzt: Entscheidung E10, Prüfung in Abschnitt 4.4, Abschnitte 1, 3.1, 5, 6.2, 7, 8 und 9. Die QA bestätigt in Durchlauf 11, dass der alte Befund M1 erledigt ist und dass E10 alle Stellen in Oberfläche, Ausgaben und Dokumentation erfasst. Die zwei neuen Befunde P1 und P2 sind eingearbeitet, aber noch von keiner Prüfung der QA bestätigt. Fehlt nur noch diese Bestätigung, gibt der Softwarearchitekt die Spezifikation danach mit `present` an den Projektleiter.

## Sachverhalt

Beide Befunde sind technisch. Sie betreffen die Genauigkeit der neuen Regel, nicht ihren Inhalt. Zwischen QA und Softwarearchitekt gibt es keinen Streitpunkt.

| Befund | Inhalt | Eingearbeitet |
|---|---|---|
| P1 | Der Test der Schnittstellenbeschreibung hätte auch technische Namen wie `StudioLanguage` geprüft, die nach E10 unverändert bleiben. | Abschnitt 4.4 nennt die geprüften Felder einzeln und nimmt die technisch erzeugten Titel aus. Die Kurzform „Studio“ wird als ganzes Wort geprüft. |
| P2 | Unklar war, ob die Kurzform „Studio“ auch in Testtexten und in nicht ausgegebenen Texten im Programmcode ersetzt wird. | E10: Die Kurzform wird in Anzeige, Ausgaben und Dokumentation ersetzt. In Texten, die weder angezeigt noch ausgegeben werden, darf sie bleiben. |

## Frage

Der vom Projektleiter freigegebene Durchlauf 11 ist verbraucht. Gibt der Projektleiter einen weiteren Prüfdurchlauf der QA frei (Durchlauf 12), um die Änderungen zu P1 und P2 zu bestätigen?

Vorschlag des Softwarearchitekten: Durchlauf 12 freigeben. Nach positivem Prüfbericht geht die Spezifikation mit `present` an den Projektleiter. Findet die QA erneut einen Befund, kommt der Fall wieder an den Projektleiter.

## Hinweise außerhalb der Frage

- `development/ablauftest/scope.md`, Zeile 3, schreibt noch „Pipwerk Studio“. Das Dokument gehört dem Projektleiter.
- Unter `docs/design/` steht der Name noch in anderer Schreibweise. Die Fundstellen nennt Abschnitt 9 der Spezifikation. Ob req-ui-010 mit „ebenso in der Dokumentation“ auch diese Dokumente meint, entscheidet der Auftraggeber.
- Der Programmname `pipwerk-studio` steht in Fehlermeldungen und im Hilfetext der Kommandozeile, zum Beispiel `usage: pipwerk-studio`. E10 behandelt ihn als technischen Namen und ändert ihn nicht. Die QA hält das für nachvollziehbar und weist darauf hin, dass der Auftraggeber es anders verstehen könnte.

Antwort: Durchlauf 12 freigegeben, als Nachprüfung: Die QA prüft nur, ob P1 und P2 behoben sind und ob die dafür geänderten Stellen neue Fehler enthalten. Neue Befunde an unveränderten Stellen meldet sie nur, wenn sie einer Anforderung widersprechen oder die Umsetzung verhindern. (Projektleiter, 13. Oktober 2026)
