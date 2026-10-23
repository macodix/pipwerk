# Prüfauftrag Arbeitspaketplan, Durchlauf 1

- Vorhaben: `backtest`
- Phase: 3 Planung
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gekommen ist. Nenne ihn vollständig im Bericht.

## Gegenstand

`development/backtest/plan.md`

## Umfang der Prüfung

1. Prüfe, ob jede Anforderung der Dokumente laut `development/backtest/scope.md` durch die Spezifikation `development/backtest/specification.md` abgedeckt ist. Ausgenommen sind die in `scope.md` und den Dokumenten als offen gekennzeichneten Punkte und was Abschnitt 1 der Spezifikation ausschließt.
2. Prüfe, ob jeder Teil der Spezifikation durch ein Arbeitspaket abgedeckt ist (Abschnitte „Umfang“, „Umgesetzte Teile der Spezifikation“ und „Abdeckung der Spezifikation“ des Plans).
3. Prüfe, ob jedes Paket Ziel, Umfang, Nicht-Umfang, umgesetzte Teile der Spezifikation, Abhängigkeiten und Abnahmekriterien enthält und mit einem Ergebnis endet, das der Auftraggeber in der Testumgebung selbst prüfen kann. Ein Paket mit Oberfläche hat ein Abnahmekriterium zur Bedienbarkeit nach dem bestätigten Prototyp.
4. Prüfe, ob die Abhängigkeiten stimmen: Jedes Paket lässt sich mit den Ergebnissen der Pakete umsetzen und abnehmen, von denen es abhängt, auch der Pakete aus `development/strategiedesign/plan.md`.
5. Prüfe, ob die Abnahmekriterien der Spezifikation und den Anforderungen entsprechen.

Nicht Gegenstand: die vom Auftraggeber bestätigte Spezifikation selbst, außer sie lässt eine Anforderung unabgedeckt (Prüfpunkt 1); die Dokumente des Auftraggebers; der Prototyp.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Der Plan legt nur Pakete, Abdeckung und Abnahmekriterien fest. Testdetails, vollständige Listen von Kennungen und Endpunkten, Grenzwerte und Formulierungen gehören in die Aufträge und sind kein Befund. Der Bericht umfasst höchstens etwa 60 Zeilen.
- Abschnitt „Phase 3 – Planung“ in `docs/technical/entwicklungsverfahren.md`
- `development/backtest/scope.md` und die dort genannten Dokumente
- `development/backtest/specification.md`, `development/backtest/presentations/specification-1.html` (Vermerk der Bestätigung)
- `development/strategiedesign/plan.md` (Pakete, von denen dieser Plan abhängt)

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers. Eine Testumgebung brauchst du nicht.

## Ablage

Schreibe den Prüfbericht als Datei `plan-1.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle Befunde und getrennt davon die Hinweise.
