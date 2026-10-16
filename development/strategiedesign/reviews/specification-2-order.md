# Prüfauftrag Spezifikation, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `73d9b210c54935652c007c2bc9ca219b1338dab3`
- Vergleichsstand: `f48d259fa257f5c1fb83f172f0e1cef44134319a` (Durchlauf 1)

## Gegenstand

`development/strategiedesign/specification.md`. Anlass: Prüfbericht Durchlauf 1 (`development/strategiedesign/reviews/specification-1.md`) nicht bestanden mit B1 bis B4 und den Hinweisen S1 bis S15. Die Zuordnung der Bearbeitung zu den Abschnitten steht im Abschnitt „Status“ der Spezifikation. Maßstab der Bearbeitung ist `git diff f48d259fa257f5c1fb83f172f0e1cef44134319a 73d9b210c54935652c007c2bc9ca219b1338dab3 -- development/strategiedesign/specification.md`.

## Umfang der Nachprüfung

1. Prüfe, ob B1 bis B4 erledigt sind.
2. Prüfe für S1 bis S15, ob sie bearbeitet sind. Ein Hinweis ist kein blockierender Befund.
3. Prüfe, ob die geänderten Stellen neue Fehler enthalten, auch Widersprüche zu nicht geänderten Stellen der Spezifikation und zu den Dokumenten laut `scope.md`.
4. Prüfe für die geänderten Stellen, ob beide Testfälle sich weiterhin vollständig gestalten, speichern und laden lassen und ohne Fehler der Konsistenzprüfung bleiben.
5. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen oder Gestaltung, Speichern oder Laden eines Testfalls verhindern.

Nicht Gegenstand: die Ausführung von Strategien, die in `scope.md` und den Dokumenten als offen gekennzeichneten Punkte, die Vorlagen unter `docs/design/planning/`, die Frage, ob die Prüfschleife eine Ebene höher geht.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis. Testdetails, Formulierungen, Schreibweisen und vollständige Listen von Kennungen gehören in die Aufträge.
- `development/strategiedesign/scope.md`, `development/strategiedesign/reviews/specification-1.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `specification-2.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, für B1 bis B4 jeweils „erledigt“ oder nicht, für S1 bis S15 jeweils „bearbeitet“ oder nicht, alle neuen Befunde und getrennt davon die Hinweise.
