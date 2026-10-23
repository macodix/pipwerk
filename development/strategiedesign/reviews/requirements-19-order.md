# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 19 (Prüfung der geänderten Stellen)

- Vorhaben: `strategiedesign`, Anlass Abstimmung der Spezifikation am 2026-10-23, Vermerk der Bestätigung auf der letzten Folie von `development/strategiedesign/presentations/specification-3.html`: Punkte 23 und 24 vom Auftraggeber geändert
- Phase: 1 Anforderung, Rückweg mit geänderter Anforderung, Prüfung beschränkt auf die geänderten Stellen
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (der jüngste Commit, der diese Datei enthält: `git log -1 --format=%H -- development/strategiedesign/reviews/requirements-19-order.md`). Nenne ihn im Bericht vollständig.

## Gegenstand

Nach Durchlauf 18 hat der Projektleiter nach Festlegung des Auftraggebers geändert:

- `docs/design/domain/fachmodell.md`, req-fach-055:
  - neuer Satz im ersten Absatz: Eine Instanz ist nur an Stellen verwendbar, die eine Auswertung ausschließlich über die Stelle ihrer ersten Verwendung erreicht; auf jedem anderen Weg ist es eine andere Instanz mit eigenem Namen (Punkt 24).
  - Absatz „Methoden“: Die mitgelieferten Objekttypen haben vorerst keine Methoden; Aktualisieren sehen alle mitgelieferten Objekttypen und `Konto`, `Instrument`, `Kerze`, `Tick` vor, eine eigene Vorlage übernimmt es von ihrem Objekttyp (Punkt 23).
  - zwei offene Punkte entfallen (Methoden und Aktualisieren; Verwendung auf einem Weg, der die erste Verwendung nicht durchläuft).
  - zwei Zeilen vom 2026-10-23 im Änderungsnachweis.
- `docs/design/requirements/anforderungen-strategiedesigner.md`, req-ui-014: Bausteine und Verbinden bieten an einer Stelle nur dort verwendbare Instanzen an; steht eine andere trotzdem in einem Ausdruck, meldet die Konsistenzprüfung einen Fehler (Punkt 24). Dazu die letzte Zeile im Änderungsnachweis.

Maßstab ist die Änderung selbst: `git diff 9368ef6fa3cbaa44844ca23e09265e879e346490^ 429bf6f219c198e48ea674dc917a9c45405506c8 -- docs/design`.

## Umfang der Prüfung

Prüfe nur:

1. ob die geänderten Stellen Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen oder Umsetzungsdetails enthalten oder den übrigen geltenden Dokumenten laut `scope.md` und dem Glossar (`docs/technical/glossar.md`) widersprechen, insbesondere den übrigen Sätzen von req-fach-055 (Namensraum, Beispiele mit zwei Instanzen, Aktualisieren, die verbleibenden offenen Punkte), req-fach-014 (früherer Wert, „vorheriger Wert von“), req-ui-014 bis req-ui-016 und req-ablauf-003 (Verwendung im Ausdruck gilt als Verbindung),
2. ob die geänderten Stellen den Vermerk der Bestätigung in `specification-3.html` zu den Punkten 23 und 24 vollständig wiedergeben,
3. ob sich beide Testfälle (`str-01`, `str-03`) mit den geänderten Stellen weiterhin vollständig gestalten, speichern und wieder laden lassen, insbesondere die Verwendung von Instanzen des Hauptablaufs in den Verwaltungen mit eigenen Auslösern.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md` zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Beachte die Regeln „Keine Einschränkung ohne Erfordernis“ und „Lücken“ im selben Abschnitt.

Nicht Gegenstand:

- alle nicht geänderten Stellen, außer sie widersprechen den geänderten Stellen (Punkt 1) oder dem Vermerk (Punkt 2)
- `docs/design/requirements/anforderungen-handelssystem.md`, `anforderungen-strategietester.md`, `anforderungen-nachrichtensystem.md` und die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan, Prototyp und der Code von `wp01` und `wp02`. Die Spezifikation gleicht der Softwarearchitekt nach dieser Prüfung an.
- die als offen gekennzeichneten Punkte inhaltlich; geprüft wird nur, ob sie eindeutig als offen gekennzeichnet sind
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Prüfung nur der geänderten Stellen, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, jeden in einer Zeile. Bericht höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/presentations/specification-3.html`, Folie „Bestätigung“ mit dem Vermerk
- `development/strategiedesign/reviews/requirements-18.md`

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-19.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
