# Prüfauftrag Funktionstest, Auftrag 19, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `36d44790842a0f22bdd1bcc8df3e87ef2258bad5` (Zweig `backtest/wp02-19`)
- Auftrag: `development/backtest/wp02/orders/19.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 19 und die Spezifikation (5.4, 5.6 letzter Punkt, 10 Punkt Speicherplatz): Entfernen der Zwischendatei bei jedem Ende (Erfolg, Fehler, Strg+C, Signal), Aufräumen früherer Zwischendateien beim Start (nur Muster, nie fertige oder fremde Dateien), bestehende Datei bleibt nach Abbruch unverändert, Programmierregeln, Tests, technische Dokumentation `docs/technical/pipwerk-fetch-mt5.md`. Das Prüfskript `components/pipwerk-fetch-mt5/scripts/check` führst du selbst aus. Befehle über 10 Minuten im Hintergrund.

Die Festlegungen des Entwicklers (Exitcode 130, Namensmuster `.pipwerk-fetch-mt5-<8 Zeichen>.tmp`) gelten als technische Entscheidung des Entwicklungsleiters; melde nur, wenn sie der Spezifikation widersprechen.

Beachte die Regeln „Umfang der Prüfungen“ (erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen).

## Prüfgrundlagen

- `development/backtest/wp02/orders/19.md`, `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `19-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
