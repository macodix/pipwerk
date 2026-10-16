# Prüfauftrag Spezifikation, Durchlauf 3 (Nachprüfung nach Einwand des Auftraggebers)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach `revise`
- Rolle: QA
- zu prüfender Stand: `main`, Commit `d90f994cb15a717786b5fefacad041ec004e28a7`
- Vergleichsstand: `2d2f96839f9b066706fb518aedfe43279225fb28` (Stand der Abstimmung)

## Gegenstand

`development/strategiedesign/specification.md`, nur die geänderten Stellen in Abschnitt 3.4, Abschnitt 3.6 und Abschnitt 10 Punkt 4 sowie der Abschnitt „Status“. Maßstab ist `git diff 2d2f96839f9b066706fb518aedfe43279225fb28 d90f994cb15a717786b5fefacad041ec004e28a7 -- development/strategiedesign/specification.md`.

Anlass ist der Einwand des Auftraggebers zu Festlegung 4, vermerkt in `development/strategiedesign/presentations/specification-1.html` („Vermerk der Bestätigung“, letzte Folie): Eine Regel, deren Ausdruck `Order` oder `Position` anspricht, darf nur stehen, wo eine Order vorhanden ist – am Element „Order aufgeben“, in dessen Verwaltung oder als Regel der Strategie. In einem Indikator, einem Trend oder im Hauptablauf ist bereits das Einfügen der Regel ein Fehler der Konsistenzprüfung, nicht erst die Verwendung ihres Ergebnisses. Der Fall „Regel wird nicht angewendet“ entfällt.

## Umfang der Nachprüfung

1. Prüfe, ob die geänderten Stellen den Einwand vollständig und richtig umsetzen.
2. Prüfe, ob die geänderten Stellen neue Fehler enthalten, auch Widersprüche zu nicht geänderten Stellen der Spezifikation (insbesondere Abschnitt 3.5, Zeile „Schließorder“) und zu den Dokumenten laut `scope.md` (insbesondere req-fach-046, req-fach-051, req-ui-012).
3. Prüfe, ob beide Testfälle sich weiterhin vollständig gestalten, speichern und laden lassen und ohne Fehler der Konsistenzprüfung bleiben.
4. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen oder Gestaltung, Speichern oder Laden eines Testfalls verhindern.

Nicht Gegenstand: die Ausführung von Strategien, die in `scope.md` und den Dokumenten als offen gekennzeichneten Punkte, die vom Auftraggeber bestätigten Festlegungen 1 bis 3 und 5 bis 8, die Vorlagen unter `docs/design/planning/`.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung, beschränkt auf die geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis. Testdetails, Formulierungen, Schreibweisen und vollständige Listen von Kennungen gehören in die Aufträge.
- `development/strategiedesign/scope.md`, `development/strategiedesign/presentations/specification-1.html`, `development/strategiedesign/reviews/specification-2.md`, `development/strategiedesign/reviews/requirements-7.md` (Hinweise H23 und H24)

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `specification-3.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, ob der Einwand umgesetzt ist, alle neuen Befunde und getrennt davon die Hinweise.
