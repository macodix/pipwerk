# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 8 (geänderte Stellen)

- Vorhaben: `strategiedesign`, Anlass aus Arbeitspaket `wp02`
- Phase: 1 Anforderung, Prüfung geänderter Stellen der Dokumente des Auftraggebers (Rückkopplung aus Phase 4)
- Rolle: QA
- zu prüfender Stand: `main`, Commit `0bc0a862b8be5b56dda496535b6d59db1588bc50`

## Gegenstand

Der Auftraggeber hat am 18. Oktober 2026 entschieden: Auslöser sind optional, für die Strategie und für die Verwaltung einer Order. „Neue Strategie“ öffnet eine leere Zeichenfläche. Die Auswertung ohne Auslöser ist ausdrücklich offen und betrifft die Ausführung. Anlass war die Ergänzung der Spezifikation in `wp02` (`development/strategiedesign/reviews/specification-4.md`).

Geprüft werden nur die dafür geänderten Stellen:

- `docs/design/requirements/anforderungen-strategiedesigner.md`: req-fach-015, req-ablauf-002
- `docs/design/domain/fachmodell.md`: req-fach-046, req-fach-047, req-fach-049a, req-fach-051
- `development/strategiedesign/scope.md`: neuer Eintrag unter „Offene Punkte des Auftraggebers“

Maßstab sind die Änderungen selbst: `git diff 0bc0a862b8be5b56dda496535b6d59db1588bc50~1 0bc0a862b8be5b56dda496535b6d59db1588bc50 -- docs/design development/strategiedesign/scope.md`, zusammen mit den Einträgen vom 2026-10-18 in den Änderungsnachweisen beider Dokumente.

## Umfang der Prüfung

1. Prüfe die geänderten Stellen auf Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails.
2. Prüfe, ob unveränderte Stellen der Dokumente laut `scope.md` (Abschnitt „Geltende Dokumente“, einschließlich Anforderungen an das Gesamtsystem, Glossar `docs/technical/glossar.md` und der beiden Testfälle) den geänderten Stellen widersprechen, zum Beispiel weiterhin mindestens einen Auslöser voraussetzen oder beim Anlegen einer Strategie ein Auslöser-Element vorsehen.
3. Prüfe, ob sich beide Testfälle (`str-01`, `str-03`) mit den geänderten Stellen weiterhin vollständig gestalten, speichern und wieder laden lassen.
4. Neue Befunde an unveränderten Stellen, die nicht unter Punkt 2 fallen, meldest du nur, wenn sie einer Anforderung widersprechen oder die Gestaltung, das Speichern oder das Laden eines Testfalls verhindern.

Nicht Gegenstand:

- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die die Ausführung von Strategien betreffen (Debuggen, Testen, Handeln). Dazu gehört die als offen gekennzeichnete Frage, wie eine Strategie oder Verwaltung ohne Auslöser ausgewertet wird.
- die Vorlagen unter `docs/design/planning/`
- Spezifikation und Plan (`development/strategiedesign/specification.md`, `plan.md`). Ihre Anpassung folgt danach mit `specify`.
- die in `scope.md` unter „Offene Punkte des Auftraggebers“ und in den Dokumenten ausdrücklich als offen gekennzeichneten Punkte. Ein Befund ist es nur, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist.
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 1 und „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist der erste Durchlauf zu diesen Änderungen und vollständig für die geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/reviews/specification-4.md` (Anlass)

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-8.md` in das Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
