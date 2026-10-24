# Prüfauftrag Spezifikation, Durchlauf 1

- Vorhaben: `relay`
- Phase: 2 Konzeption
- Rolle: QA
- zu prüfender Stand: `main`, Commit `ec024e38a87127acd8752a5620c9b41904f5b003`
- Gegenstand: `development/relay/specification.md` (Erstfassung)

## Gegenstand

Prüfe die Spezifikation gegen die Dokumente des Auftraggebers laut `development/relay/scope.md`:

1. Setzt sie jede Anforderung an das Nachrichtensystem (req-relay-001 bis req-relay-011), req-system-005, req-system-026 und req-system-027 sowie req-grund-003 bis req-grund-006 vollständig und ohne Widerspruch um? Die als offen gekennzeichneten Punkte (Laufzeiten, Prioritäten, Verschlüsselung) müssen nicht entschieden sein, dürfen aber nicht verhindert werden.
2. Lässt sich der Nachweis laut `scope.md` mit der Spezifikation abbilden (Abschnitt 8), einmal über Matrix und einmal über Dateien?
3. Sind die Hinweise der Gruppe Spezifikation aus `reviews/requirements-1.md` (H1 bis H4, H6 bis H11), `reviews/requirements-2.md` (N1 bis N3) und `reviews/requirements-3.md` (H1, H2) entschieden (Abschnitt 10)?
4. Schränkt die Spezifikation etwas ein, was die Dokumente des Auftraggebers nicht einschränken, ohne dokumentierte technische Begründung?
5. Widerspricht sie den Technikregeln (`docs/technical/development-test-security-rules.md`) oder der Spezifikation `development/backtest/specification.md` (Abschnitte E5, 5.4 zu `pipwerk-fetch-mt5`)?

Nicht Gegenstand: die Dokumente des Auftraggebers selbst, Testdetails, Formulierungen und Werte, die nach der Spezifikation die Aufträge festlegen.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: Phase 2, „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“) und „Grenze der Durchläufe“. Beachte besonders: Spezifikation und Plan legen nur Bausteine, Entscheidungen und Abnahmekriterien fest. Der erste Durchlauf meldet alle Befunde auf einmal. Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `development/relay/scope.md` mit den dort genannten Anforderungsdokumenten, `docs/technical/glossar.md`
- Zum Stand von `pipwerk-fetch-mt5`: Zweig `backtest/wp02`, `docs/technical/pipwerk-fetch-mt5.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Ordne Befunde, die Dokumente des Auftraggebers betreffen, nach „Fragen an den Auftraggeber“ zu. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-1.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
