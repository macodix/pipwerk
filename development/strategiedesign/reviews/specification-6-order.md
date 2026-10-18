# Prüfauftrag Spezifikation und Plan, Durchlauf 6 (Nachprüfung)

- Vorhaben: `strategiedesign`, Anlass aus Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Phase: 4, Änderung von Spezifikation und Plan nach Entscheidung des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-6-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-5.md` auf Commit `dc65da1a3d067f7a680737d896095118d94c8c75`, nicht bestanden (B1, H1 bis H7)

## Gegenstand

Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Ist B1 behoben? Enthalten die dafür und für die Hinweise geänderten Stellen neue Fehler? Maßstab ist `git diff dc65da1a3d067f7a680737d896095118d94c8c75 <zu prüfender Commit> -- development/strategiedesign/specification.md development/strategiedesign/plan.md`.

Erledigung laut Softwarearchitekt:

- B1: Spezifikation 3.6, letzte Zeile der Tabelle und Absatz darunter. Der Hinweis „kein Element ‚Order aufgeben‘ erreichbar“ entfällt nur noch für eine Strategie ohne Elemente. Grundlage ist das Abnahmekriterium 2 von `wp02`. Der Auftraggeber hat es über den Projektleiter vorgegeben, wörtlich in der Meldung `development/messages/architect/20261018000127-projectlead-01.md` (Stand `main`, Commit `e7f0876d4be0043f5ec64cf95917f9d41f702d5a`): „Plan `wp02` Abnahmekriterium 2 neu: ‚Neue Strategie‘ zeigt eine leere Zeichenfläche, ‚Prüfen‘ meldet dafür keinen Befund.“ Eine Strategie mit Elementen und ohne Auslöser erhält den Hinweis nach req-ablauf-007. Plan `wp02` Umfang angeglichen.
- H1: Abschnitt 10, „Folgen der fachlichen Festlegungen“, letzter Punkt
- H2: Abschnitt 5.3, zweiter Punkt (keine Verbindung vom Ausgang `gestellt`)
- H3: Abschnitt 3.6, Zeile zu `Kerze`: Element und seine Regeln, Verwaltung ohne eigene Auslöser, Regel der Strategie und Instanz auf der Zeichenfläche mit allen Auslösern der Strategie
- H4: Status, Zeile „ergänzung in Phase 4“
- H5: Plan `wp02`, technische Nachweise
- H6: Plan, Tabelle der Abdeckung, Zeile „1 Abweichungen von den Vorlagen“
- H7: nicht in Spezifikation oder Plan; das Glossar liegt mit `reviews/requirements-8.md` B1 beim Projektleiter

Nicht Gegenstand: wie in `reviews/specification-5-order.md`, insbesondere die Dokumente des Auftraggebers und das Glossar, die offene Frage zum Beginn der Auswertung ohne Auslöser und Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente, `development/strategiedesign/reviews/specification-5.md`, die oben genannte Meldung

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-6.md` in das Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
