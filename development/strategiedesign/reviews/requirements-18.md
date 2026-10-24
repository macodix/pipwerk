# Prüfbericht Dokumente des Auftraggebers, Durchlauf 18 (QA, Phase 1)

- Vorhaben: `strategiedesign`
- Geprüfter Stand: `main`, Commit `aa276cb23e82c75d088bd0623efdcd4c5c4d02ee` (jüngster Commit, der `development/strategiedesign/reviews/requirements-18-order.md` enthält)
- Maßstab: Änderung aus Commit `042703c9bd6919979b616c4e80dae5aa68e3218d` an `docs/design/requirements/anforderungen-strategiedesigner.md` (req-ui-016, req-ui-017, Änderungsnachweis 2026-10-23, letzte Zeile)
- Geprüft gegen: req-ui-014, req-ui-016, req-ui-017, Fachmodell req-fach-055, Glossar (Verbindung, Datenverbindung, Ausgang, Eigenschaft, Methode, Ergebnis, Eigenschaftenansicht), `scope.md`, Festlegung in `strategiedesign-03.md`, Abschnitt „Antwort“, Punkte 2 bis 4

## Ergebnis: bestanden

Blockierende Befunde: keine.

Die geänderten Stellen decken die Festlegung des Auftraggebers vollständig ab (Punkt 3: Beschreibung der gelieferten Eigenschaften und Methoden, Ausgang mit Namen; Punkt 4: Löschen einer Verbindung als offener Diskussionspunkt). Der neue Absatz in req-ui-017 beginnt mit „Offen, Diskussionspunkt des Auftraggebers“ und ist damit eindeutig als offen gekennzeichnet. Der Änderungsnachweis nennt Datum, Stellen und Festlegung.

Widersprüche zu req-ui-014, Glossar, Fachmodell oder `scope.md` habe ich nicht gefunden. Die Beschriftung der Datenverbindung (req-ui-014) nennt Eigenschaft oder Methode; req-ui-016 verlangt dasselbe am Ausgang. Beides verträgt sich. „Darstellung der Ein- und Ausgänge“ bleibt in req-ui-014 für die Spezifikation offen; req-ui-016 legt davon nur fest, dass der Name der Eigenschaft sichtbar ist.

## Testfälle

`str-01` und `str-03` lassen sich mit den geänderten Stellen weiterhin vollständig gestalten, speichern und laden. Die Änderungen betreffen nur die Anzeige (Beschreibung in der Eigenschaftenansicht, Beschriftung des Ausgangs) und einen offenen Punkt. Sie schränken weder Elemente noch Parameter noch Verbindungen ein. Beide Testfälle nutzen keine Funktion, die eine Methode voraussetzt.

## Hinweise (nicht blockierend)

- H1, req-ui-016, „Ein Ausgang zeigt den Namen der Eigenschaft“: Das Glossar (Ausgang) zählt für Datenverbindungen auch jede Methode zum Ausgang, außerdem gibt es Ablaufausgänge („wahr“, „falsch“). Der Satz nennt nur die Eigenschaft. Zuordnung: Sache der Spezifikation. Frage an die Spezifikation: Gilt „zeigt den Namen“ auch für den Ausgang einer Methode?
- H2, req-ui-016: Der Satz „beschreibt jede Eigenschaft und Methode“ sagt nicht, ob die Beschreibung dauerhaft in der Eigenschaftenansicht steht oder wie die übrigen Erklärungen „beim Zeigen“ erscheint. Zuordnung: Sache der Spezifikation (Darstellung).
- H3, req-ui-016 und Fachmodell req-fach-055: Welche Methoden die mitgelieferten Objekttypen haben, ist im Fachmodell offen. „Jede Methode, die es liefert“ ist deshalb zurzeit nur für Eigenschaften zu prüfen. Zuordnung: offener Punkt, bereits im Fachmodell geführt, kein neuer Befund.
- H4, req-ui-017, letzter Absatz: „Bisher geht das über die Eigenschaftenansicht“ beschreibt den Stand des Prototyps. In den geltenden Anforderungen steht an keiner Stelle, wie der Anwender eine Verbindung löscht (Suche in `anforderungen-strategiedesigner.md`: kein Treffer außer diesem Absatz; req-ui-014 nennt nur das Löschen eines verbundenen Objekts als offen für die Spezifikation). Zuordnung: Lücke, Sache der Spezifikation. Der Weg über die Eigenschaftenansicht ist damit nur durch diesen Satz belegt.
- H5, req-ui-017: Der Absatz zum Löschen einer Verbindung steht unter „Anordnung auf der Zeichenfläche“, behandelt aber die Bedienung. Zuordnung: Sache der Spezifikation, kein Widerspruch.

## Fragen an den Auftraggeber

Keine.
