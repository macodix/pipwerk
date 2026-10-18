# Prüfauftrag Spezifikation und Plan, Durchlauf 5 (geänderte Stellen)

- Vorhaben: `strategiedesign`, Anlass aus Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Phase: 4, Änderung von Spezifikation und Plan nach Entscheidung des Auftraggebers (Entwicklungsverfahren, Abschnitt „Meldungen“, Absatz nach der Tabelle)
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-5-order.md` auf `origin/main`.

## Gegenstand

Der Auftraggeber hat am 18. Oktober 2026 entschieden: Auslöser sind optional, für die Strategie und für die Verwaltung einer Order. „Neue Strategie“ öffnet eine leere Zeichenfläche. Eingetragen in `docs/design/requirements/anforderungen-strategiedesigner.md` (req-fach-015, req-ablauf-002) und `docs/design/domain/fachmodell.md` (req-fach-046, req-fach-047, req-fach-049a, req-fach-051). Die Ergänzung der Typbeschreibung aus `reviews/specification-4.md` hat er bestätigt, ausgenommen das Feld „Vorgabe der neuen Strategie“. Das Feld entfällt.

Geprüft werden nur die dafür geänderten Stellen. Maßstab ist `git diff <zu prüfender Commit>~1 <zu prüfender Commit> -- development/strategiedesign/specification.md development/strategiedesign/plan.md`:

- `specification.md`: Status (Zeilen „stand“, „ergänzung in Phase 4“, „änderung in Phase 4“), Abschnitt 1 (Tabelle der Abweichungen), 3.1 (Zeilen „Eigenschaften“ und „Ausgänge“, Zeile „Vorgabe der neuen Strategie“ entfernt, Absatz unter der Tabelle), 3.3 (Absatz „Verbindung“), 3.6 (Zeile „Strategie ohne Auslöser“ entfernt, Zeilen zu `Kerze` und „kein Element ‚Order aufgeben‘ erreichbar“, neuer Absatz unter der Tabelle), 5.2 Zeile „Strategie anlegen“
- `plan.md`: Status, `wp01` „Umgesetzte Teile der Spezifikation“, `wp02` Umfang, Nicht-Umfang, umgesetzte Teile, Abnahmekriterium 2, Tabelle der Abdeckung, Änderungsnachweis

## Umfang der Prüfung

1. Setzen die geänderten Stellen die geänderten Anforderungen richtig und vollständig um? Insbesondere: kein Befund für eine Strategie ohne Auslöser; `Kerze` ohne Instanz nach req-fach-051 in der Fassung vom 2026-10-18; leere Zeichenfläche bei „Neue Strategie“.
2. Widersprechen unveränderte Stellen von Spezifikation oder Plan den geänderten Stellen oder den geänderten Anforderungen, zum Beispiel weil sie weiterhin mindestens einen Auslöser oder einen Auslöser in der neuen Strategie voraussetzen?
3. Ist das neue Abnahmekriterium 2 von `wp02` mit der Spezifikation erfüllbar und vom Auftraggeber in der Testumgebung prüfbar? Meldet die Konsistenzprüfung nach 3.6 für eine leere Strategie wirklich keinen Befund?
4. Ist jeder geänderte Teil der Spezifikation einem Paket zugeordnet, und ist der Plan widerspruchsfrei? Sind die Hinweise H1, H4, H5 und H6 aus `reviews/specification-4.md` so erledigt, wie der Status der Spezifikation sagt?
5. Lassen sich `str-01` und `str-03` mit der geänderten Spezifikation weiterhin vollständig gestalten, speichern und laden, ohne Fehler der Konsistenzprüfung?

Nicht Gegenstand:

- die Dokumente des Auftraggebers selbst, auch das Glossar `docs/technical/glossar.md`; dazu liegt der Prüfbericht `reviews/requirements-8.md` beim Projektleiter
- die Frage, wie und wo die Auswertung ohne Auslöser beginnt; sie ist in req-fach-015, req-fach-046 und req-fach-047 offen und betrifft die Ausführung
- unveränderte Stellen, die nicht unter Punkt 2 fallen
- Code; die Umsetzung folgt in den Aufträgen von `wp02`

## Prüfgrundlagen

- Briefing QA, Phase 2 und 3, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist der erste Durchlauf zu diesen Änderungen und vollständig für die geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis. Detailtiefe nach Umfang: Testdetails und Formulierungen gehören in die Aufträge.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente in der Fassung des zu prüfenden Commits
- `development/strategiedesign/reviews/specification-4.md`, `development/strategiedesign/reviews/requirements-8.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-5.md` in das Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
