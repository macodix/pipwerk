# Bearbeitung des Prüfberichts, Durchlauf 4 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Prüfbericht: [requirements-4.md](requirements-4.md)
- Rolle: Projektleiter
- Stand: 2026-10-16

Der blockierende Befund N7 geht auf eine Bearbeitung des Projektleiters zurück (H2 aus Durchlauf 3), nicht auf eine Entscheidung des Auftraggebers. Er wurde ohne Rückfrage korrigiert. Die Hinweise wurden vom Projektleiter bearbeitet. Zur Abgrenzung in den Änderungsnachweisen (H8): Einträge nennen jetzt getrennt, was der Auftraggeber entschieden und was der Projektleiter nach Hinweisen der QA bearbeitet hat.

| Befund | Bearbeitung |
|---|---|
| N7 | Die Einschränkung „nur in der Verwaltung“ ist zurückgenommen. req-fach-051 und req-ablauf-003: In Ausdrücken einer Regel bezeichnen `Order` und `Position` die Order beziehungsweise Position, auf die die Regel angewendet wird (req-fach-040), auch bei „Order aufgeben“ im Hauptablauf. In Ausdrücken des Ablaufs sind sie in der Verwaltung einer Order verfügbar; die Konsistenzprüfung meldet nur die Verwendung im Ablauf außerhalb einer Verwaltung. Glossar angeglichen. |
| H1 | req-fach-019: `Preis` als allgemeine Eigenschaft jeder Order, mit Festlegung für `StopLimitOrder` (Limitpreis) und `CloseOrder` (aktueller Kurs). req-fach-028 verweist darauf. |
| H2 | req-fach-021: Prüfung nach der Ausführung mit dem Ausführungspreis für Orders mit angenommenem Preis, Maßnahme bei negativem Ergebnis als offen gekennzeichnet. Satz in `str-03` Abschnitt 4 entfernt, in den offenen Fragen klargestellt, dass die Ausführung prüft, nicht der Ablauf. |
| H3 | req-core-002: Eingangswerte der prüfenden Rolle getrennt für „Order ändern“ (Order) und „Position ändern“ (Position), Unterscheidung im Ausdruck durch Fallunterscheidung. |
| H4 | req-fach-046: Grundsatz gilt für Regeln der Strategie und der Elemente gleichermaßen, ohne Fehler oder Meldung. |
| H5 | req-fach-051: Order, Position und Strategie werden nicht als Instanz auf die Zeichenfläche gelegt. |
| H6 | req-fach-001: doppelte Nennung entfernt. |
| H7 | req-ui-005: Ein vom Anwender angelegter Indikator hat den Objekttyp „Indikator“, ein mitgelieferter ist selbst ein Objekttyp. Schreibweise `EMA21` vereinheitlicht. |
| H8 | Änderungsnachweise vom 2026-10-16 in Fachmodell und Strategiedesigner neu gefasst: Entscheidungen des Auftraggebers und Bearbeitungen des Projektleiters getrennt. |
| H9 | Änderungsnachweise nach Datum geordnet: Fachmodell und Strategiedesigner aufsteigend, Glossar absteigend. |
| H10 | `str-03` Abschnitt 3: „das Volumen“ statt „es“. |
| H11 | `str-01` Abschnitt 4: Tickgröße ergänzt. |
| H12 | req-fach-049: Regel zur freien Margin als offen gekennzeichnet. `scope.md`: offene Punkte aus den Nachprüfungen aufgenommen. |
