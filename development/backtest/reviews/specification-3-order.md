# Prüfauftrag Spezifikation und Plan, Durchlauf 3 (Spezifikation) und 4 (Plan)

- Vorhaben: `backtest`
- Anlass: Abnahme von `wp02`, Versuch 1, nicht bestanden ([Abnahmebericht](../wp02/acceptance/1.md), Mängel M1 bis M4); geänderte Anforderungen req-system-026, req-system-027, req-test-003, Prüfung bestanden in [requirements-6.md](requirements-6.md)
- Rolle: QA
- zu prüfender Stand: `main`, Commit `f67c1f0eff6e4de78cc7de1a31c8bce2add665fc`
- Prototyp: Zweig `backtest/proto-replay`, Commit `d9c2edac0ec78555d43f587635e8bf1a37b4d762`, gebaute Datei auch unter `development/backtest/prototype/pipwerk-replay-prototyp.html`; Auftrag `development/backtest/prototype/order-03.md`
- Vorherige Durchläufe: [specification-2.md](specification-2.md), [plan-3.md](plan-3.md), beide bestanden

## Gegenstand

Prüfung beschränkt auf die geänderten Stellen. Sichtbar mit `git diff 86926623cded9b3acf4e61feff5cde4d165fff98 f67c1f0eff6e4de78cc7de1a31c8bce2add665fc -- development/backtest/specification.md development/backtest/plan.md`.

Prüfe:

1. Spezifikation (Änderungsnachweis, Eintrag 2026-10-23; E5, 5.1, 5.3, 5.4, 6.1, 7, 8.1, 8.3, 8.4 Punkt 6, 10, 11, 12, 13): Setzt sie req-system-026, req-system-027, req-test-003 und die Festlegungen des Auftraggebers in den Mängeln M1 bis M4 des Abnahmeberichts vollständig und ohne Widerspruch um? Widerspricht eine geänderte Stelle einer nicht geänderten?
2. Prototyp: Entspricht die Ansicht „Datenbestand“ mit Dialog „Datei importieren“ und die Ansicht „Kursdaten beim Start“ den Festlegungen in M1 bis M4 und der Spezifikation 5.3, 5.4 und 8.3? Lassen sich Import mehrerer Dateien und die Einzelheiten einer Reihe ohne Erklärung bedienen? Öffne die gebaute Datei im Browser.
3. Plan (Änderungsnachweis, Eintrag 2026-10-23; `wp02`, `wp03`, Abdeckung): Ist jede geänderte Stelle der Spezifikation durch ein Paket abgedeckt? Lassen sich die geänderten Abnahmekriterien von `wp02` und `wp03` vom Auftraggeber selbst prüfen?

Nicht Gegenstand:

- nicht geänderte Stellen, außer eine geänderte Stelle widerspricht ihnen
- die übrigen Ansichten des Prototyps
- die Umsetzung auf dem Arbeitszweig `backtest/wp02`
- die Hinweise H1, H3 und H5 aus `requirements-6.md` (Dokumente des Auftraggebers, gehen an den Projektleiter)

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Spezifikation und Plan legen nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails und Formulierungen gehören in die Aufträge. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis in einer Zeile. Jeder Bericht höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`, Abnahmebericht `development/backtest/wp02/acceptance/1.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Lege keine Korrekturlösung fest.

## Ablage

Schreibe zwei Berichte in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis:

- `specification-3.md` zu den Punkten 1 und 2
- `plan-4.md` zu Punkt 3

Jeder Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
