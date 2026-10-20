# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 9 (geänderte Stellen)

- Vorhaben: `strategiedesign`, Anlass Abnahme von Arbeitspaket `wp02` (nicht abgenommen)
- Phase: 1 Anforderung, Prüfung geänderter Stellen der Dokumente des Auftraggebers (Rückkopplung aus Phase 5)
- Rolle: QA
- zu prüfender Stand: `main`, Commit `69fbbc52d1000277accf1028ce44d3e5e99826b4`

## Gegenstand

Der Auftraggeber hat `wp02` am 19. Oktober 2026 nicht abgenommen (`development/strategiedesign/wp02/acceptance/1.md`, Mängel M1 bis M17) und dabei seine Dokumente geändert. Geprüft werden nur die am 18. und 19. Oktober 2026 geänderten Stellen, aufgezählt im letzten Absatz von `development/strategiedesign/scope.md`:

- `docs/design/requirements/anforderungen-gesamtsystem.md`: req-system-024 (neu)
- `docs/design/requirements/anforderungen-strategiedesigner.md`: req-fach-015, req-ablauf-002, req-ui-014 bis req-ui-017 (neu), req-ablauf-003, req-ablauf-007
- `docs/design/domain/fachmodell.md`: req-fach-046, req-fach-049, req-fach-049a, req-fach-051, req-fach-053, req-fach-054
- `docs/design/domain/indikator-markttechnik.md`: Abschnitt 1

Maßstab sind die Änderungen selbst: `git diff 0bc0a862b8be5b56dda496535b6d59db1588bc50~1 69fbbc52d1000277accf1028ce44d3e5e99826b4 -- docs/design`, zusammen mit den Einträgen vom 2026-10-18 und 2026-10-19 in den Änderungsnachweisen der vier Dokumente. Die Stellen vom 2026-10-18 (Auslöser optional) hat Durchlauf 8 (`development/strategiedesign/reviews/requirements-8.md`) bereits geprüft. Für sie prüfst du nur, ob die Änderungen vom 2026-10-19 ihnen widersprechen.

## Umfang der Prüfung

1. Prüfe die geänderten Stellen auf Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails.
2. Prüfe, ob unveränderte Stellen der Dokumente laut `scope.md` (Abschnitt „Geltende Dokumente“, einschließlich der beiden Testfälle) und das Glossar `docs/technical/glossar.md` den geänderten Stellen widersprechen. Beispiele für zu prüfende Zusammenhänge, ohne Vorgabe eines Ergebnisses: ein Name statt Name und Bezeichnung (req-ui-016) gegenüber Stellen mit `Bezeichnung`; Werte über Datenverbindungen (req-ui-014) gegenüber Stellen, die Objekte nur über Ausdrücke verwenden; der Parameter `Instrument` (req-fach-053) gegenüber Stellen, nach denen das Instrument aus der Anwendung kommt; `Markttechnik` in der Gruppe der Trends (req-fach-054) gegenüber Stellen, die ihn als Indikator führen.
3. Prüfe, ob sich beide Testfälle (`str-01`, `str-03`) mit den geänderten Stellen weiterhin vollständig gestalten, speichern und wieder laden lassen, insbesondere `str-03` ohne Formeltext (req-ui-015).
4. Neue Befunde an unveränderten Stellen, die nicht unter Punkt 2 fallen, meldest du nur, wenn sie einer Anforderung widersprechen oder die Gestaltung, das Speichern oder das Laden eines Testfalls verhindern.
5. Ordne jeden Befund nach „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md` zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Ausdrücklich der Spezifikation oder dem Prototyp überlassen sind die mit „Offen für die Spezifikation“ und „Offen für den Prototyp“ gekennzeichneten Punkte in req-ui-014 und req-ui-017 sowie die geprüften Fenstergrößen in req-system-024.

Nicht Gegenstand:

- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die die Ausführung von Strategien betreffen (Debuggen, Testen, Handeln).
- die Vorlagen unter `docs/design/planning/`
- Spezifikation und Plan (`development/strategiedesign/specification.md`, `plan.md`) und der Code von `wp02`. Ihre Anpassung folgt in Phase 2 und 3.
- der Abnahmebericht `development/strategiedesign/wp02/acceptance/1.md` als Prüfgegenstand. Er ist Anlass und Hintergrund; seine Mängel betreffen die Umsetzung.
- die in `scope.md` unter „Offene Punkte des Auftraggebers“ und in den Dokumenten ausdrücklich als offen gekennzeichneten Punkte. Ein Befund ist es nur, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist.
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 1, „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Dies ist der erste Durchlauf zu den Änderungen vom 2026-10-19 und vollständig für diese Stellen. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/wp02/acceptance/1.md` (Anlass)

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-9.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
