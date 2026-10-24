# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 18 (Prüfung der geänderten Stellen)

- Vorhaben: `strategiedesign`, Anlass Festlegungen des Auftraggebers vom 2026-10-23 zu req-ui-016 (Beschreibung der gelieferten Eigenschaften und Methoden, Ausgang mit Namen der Eigenschaft) und req-ui-017 (offener Diskussionspunkt Löschen einer Verbindung), Einwände zum Prototyp in `development/strategiedesign/questions/strategiedesign-03.md`, Abschnitt „Antwort“, Nachtrag Punkte 2 bis 4
- Phase: 1 Anforderung, Rückweg mit geänderter Anforderung, Prüfung beschränkt auf die geänderten Stellen
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (der jüngste Commit, der diese Datei enthält: `git log -1 --format=%H -- development/strategiedesign/reviews/requirements-18-order.md`). Nenne ihn im Bericht vollständig.

## Gegenstand

Nach Durchlauf 17 hat der Projektleiter nach Festlegung des Auftraggebers in `docs/design/requirements/anforderungen-strategiedesigner.md` geändert:

- req-ui-016: zwei neue Sätze. Die Eigenschaftenansicht eines Objekts beschreibt jede Eigenschaft und Methode, die es liefert (was der Wert aussagt und wozu er dient). Ein Ausgang zeigt den Namen der Eigenschaft, nicht nur ihren Datentyp.
- req-ui-017: neuer Absatz, als offen gekennzeichnet: Löschen einer Verbindung direkt auf der Zeichenfläche ist ein Diskussionspunkt des Auftraggebers.
- dazu die letzte Zeile vom 2026-10-23 im Änderungsnachweis desselben Dokuments.

Maßstab ist die Änderung selbst: `git diff 042703c9bd6919979b616c4e80dae5aa68e3218d^ 042703c9bd6919979b616c4e80dae5aa68e3218d -- docs/design/requirements/anforderungen-strategiedesigner.md`.

Befund B1 aus `requirements-17.md` (Ort der Dialoge, Rückfragen und zu bestätigenden Fehlermeldungen) liegt dem Auftraggeber zur Entscheidung vor. Er ist nicht Gegenstand dieses Durchlaufs.

## Umfang der Prüfung

Prüfe nur:

1. ob die geänderten Stellen Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen oder Umsetzungsdetails enthalten oder den übrigen geltenden Dokumenten laut `scope.md` und dem Glossar (`docs/technical/glossar.md`) widersprechen, insbesondere den übrigen Sätzen von req-ui-016 und req-ui-017, req-ui-014 (Beschriftung der Datenverbindung, Eigenschaft oder Methode) und dem Fachmodell (Eigenschaften und Methoden der Objekte),
2. ob sich beide Testfälle (`str-01`, `str-03`) mit den geänderten Stellen weiterhin vollständig gestalten, speichern und wieder laden lassen.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md` zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Beachte die Regeln „Keine Einschränkung ohne Erfordernis“ und „Lücken“ im selben Abschnitt.

Nicht Gegenstand:

- alle nicht geänderten Stellen, außer sie widersprechen den geänderten Stellen (Punkt 1)
- Befund B1 aus `requirements-17.md`
- `docs/design/requirements/anforderungen-handelssystem.md`, `anforderungen-strategietester.md`, `anforderungen-nachrichtensystem.md` und die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan, Prototyp und der Code von `wp01` und `wp02`
- die als offen gekennzeichneten Punkte, auch der neue Absatz in req-ui-017 inhaltlich; geprüft wird nur, ob er eindeutig als offen gekennzeichnet ist
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Prüfung nur der geänderten Stellen, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, jeden in einer Zeile. Bericht höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/reviews/requirements-17.md`

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-18.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
