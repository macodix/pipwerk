# Prüfbericht Spezifikation, Durchlauf 3 (Nachprüfung)

- Vorhaben: `verfahren`, Phase 2 Konzeption
- Ergebnis: **bestanden** (keine offenen und keine neuen blockierenden Befunde)
- Geprüfter Commit: `bd564cfc4343badf94dbe0fe29ca9306e97f3394`
- Gegenstand: Änderungen an `development/verfahren/specification.md` seit `7a2b232bb03dd81e763dcb8ef63a1125af8af3dd`
- Geprüft gegen `scope.md` (Festlegungen 2, 3, 6 und „Ablauf dieses Vorhabens“), `reviews/specification-2.md` und die Regel „Grenze der Durchläufe“. Rein technische Punkte stehen nur als Hinweis.

## 1. Stand von N1 und N2

- N1 erledigt. 4.3 Punkt 2 und 7.2 (Fußnote \*, „Wartet auf den Auftraggeber“) machen `waiting.md` zur einzigen Quelle für „bei wem: Auftraggeber“. Die Übersicht braucht keinen Meldungstext mehr. Eine entfernte Meldung ohne Zeile wird nicht mehr als „Auftraggeber“ gezeigt. Damit stimmt die Hervorhebung mit Festlegung 6 überein. E5, 7.4 Punkte 3, 6, 7 und die Tabelle in Abschnitt 8 sind nachgezogen.
- N2 erledigt. Abschnitt 10 legt für das Vorhaben ohne Plan Meldungen (`ref` `verfahren`), Arbeitszweig, Testumgebung (`test/verfahren-umsetzung/`) und die Präsentation des Ergebnisses fest (über `acceptance` und `waiting.md`). 7.2 sagt, wann eine Phase 4 bis 6 grün wird. 7.4 Punkte 5 und 7 sagen, was die Übersicht ohne Plan zeigt. Das entspricht „Ablauf dieses Vorhabens“.

## 2. Neue blockierende Befunde

Keine. Die Änderungen widersprechen keiner Festlegung und keinem Dokument des Auftraggebers.

## Hinweise (rein technisch, der Softwarearchitekt entscheidet)

- H15. 7.2 Tabelle gegen Fußnote: Die Zeilen mit \* (`review`, `present`, `question`, `acceptance`) zeigen „Projektleiter“, auch nachdem er sie ohne Antwortmeldung und ohne Zeile in `waiting.md` erledigt hat (Eintrag in einem Dokument, `transfer/`, 4.3 Punkt 1). Die Übersicht bliebe dann bei „Projektleiter“ stehen. Der frühere Satz zur Antwortmeldung im selben Commit ist entfallen.
- H16. 4.3 Punkt 2 ordnet `acceptance` der Handlung „Abnahme durchführen“ zu, Abschnitt 10 trägt für `acceptance` dieses Vorhabens „Präsentation bestätigen“ ein. Die Zuordnung der Handlung zur Meldung ist nicht eindeutig.
- H17. 7.4 Punkt 4: „weder fertig noch wartend“ meint die Pakete mit Phase „wartet“. Mit `waiting.md` gibt es nun ein zweites „Warten“ (auf den Auftraggeber). Ob solche Pakete in „bei wem“ der ersten Ebene eingehen, sagt der Text nicht ausdrücklich.
- H18. 4.3 Punkt 2: Zwischen der Antwort des Auftraggebers im Chat und dem Entfernen der Zeile steht die Übersicht weiter auf „Wartet auf Sie“. Gewollt oder nicht, steht nicht da.
