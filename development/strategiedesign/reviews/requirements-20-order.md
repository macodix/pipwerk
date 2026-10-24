# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 20 (Nachprüfung)

- Vorhaben: `strategiedesign`, Nachprüfung zu Durchlauf 19 (`development/strategiedesign/reviews/requirements-19.md`, nicht bestanden, B1)
- Phase: 1 Anforderung, Rückweg mit geänderter Anforderung, Nachprüfung
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (der jüngste Commit, der diese Datei enthält: `git log -1 --format=%H -- development/strategiedesign/reviews/requirements-20-order.md`). Nenne ihn im Bericht vollständig.

## Gegenstand

Nach Durchlauf 19 hat der Projektleiter geändert (Commit `09b27c52576d2a9462fdd864c7e23cc61cb05328`):

- `docs/design/domain/fachmodell.md`, req-fach-055: zwei neue Sätze am Ende des ersten Absatzes. Die Verwaltung einer Order gilt als über das Element „Order aufgeben“ erreicht, an dem sie hängt, auch mit eigenen Auslösern (req-fach-049a). Eine Instanz des Hauptablaufs behält dort den Stand beim Aufgeben der Order; aktuelle Werte liefert sie mit Aktualisieren. Der offene Punkt „Verwaltung einer Order mit eigenen Auslösern“ entfällt. Dazu eine Zeile im Änderungsnachweis (Befund B1).
- `docs/design/requirements/anforderungen-strategiedesigner.md`, req-ablauf-007: neue Zeile in der Liste der Fehler, „Instanz in einem Ausdruck an einer Stelle, an der sie nicht verwendbar ist“. Dazu eine Zeile im Änderungsnachweis (Hinweis H1).

Maßstab ist die Änderung selbst: `git diff 9576b612aa5e1e4c5deb5f42281660e2bebd017e 09b27c52576d2a9462fdd864c7e23cc61cb05328 -- docs/design`.

## Umfang der Prüfung

Dies ist eine Nachprüfung. Prüfe nur:

1. ob B1 aus Durchlauf 19 erledigt ist: Instanzen des Hauptablaufs sind in einer Verwaltung mit eigenen Auslösern nach dem Wortlaut von req-fach-055 verwendbar, und der Stand dort sowie „Aktualisieren“ geben den Vermerk der Bestätigung in `development/strategiedesign/presentations/specification-3.html`, Punkt 24, wieder,
2. ob H1 aus Durchlauf 19 erledigt ist,
3. ob die dafür geänderten Stellen neue Fehler enthalten: Widersprüche zu den übrigen Sätzen von req-fach-055, zu req-fach-049a, req-ui-014 und req-ablauf-007 oder zum Glossar (`docs/technical/glossar.md`), mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen,
4. ob sich beide Testfälle (`str-01` Abschnitt 6, `str-03` Abschnitt 4) mit Instanzen des Hauptablaufs in ihren Verwaltungen mit eigenen Auslösern nach dem geänderten Wortlaut fehlerfrei gestalten und speichern lassen.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md` zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Beachte die Regeln „Keine Einschränkung ohne Erfordernis“ und „Lücken“ im selben Abschnitt.

Nicht Gegenstand:

- alle nicht geänderten Stellen, außer sie widersprechen den geänderten Stellen
- die Hinweise H2 bis H5 aus Durchlauf 19; H2 und H3 sind im Glossar erledigt, H4 und H5 bleiben Hinweise
- Spezifikation, Plan, Prototyp und der Code von `wp01` und `wp02`
- die als offen gekennzeichneten Punkte inhaltlich
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Nachprüfung, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, jeden in einer Zeile. Eine Nachprüfung nennt nur die noch offenen und die neuen Befunde. Bericht höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/presentations/specification-3.html`, Folie „Bestätigung“ mit dem Vermerk
- `development/strategiedesign/reviews/requirements-19.md`

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-20.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die noch offenen und neuen blockierenden Befunde und getrennt davon die Hinweise.
