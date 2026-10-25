# Prüfauftrag Funktionstest, Auftrag 21, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `7f388d4166325f4224c01c13ab969ad6e2248749` (Zweig `backtest/wp02-21`, aufgesetzt auf `520d925af4dd7ef388d1d8b01f362e618116eff8`)
- Auftrag: `development/backtest/wp02/orders/21.md` auf dem Zweig `backtest/wp02`
- Vorgeschichte: `development/backtest/wp02/tests/20-functiontest-2.md` (Befund B1: Playwright-Browser fehlte; Browsertests von Auftrag 20 liefen nie)

## Gegenstand

1. Playwright-Anhebung auf 1.64.1 nach Auftrag 21 (`package.json`, `package-lock.json`, Dokumentation). Es gibt keinen Aufruf von `playwright install`.
2. Zum ersten Mal laufen die Browsertests von Auftrag 20 (`e2e/settings.spec.ts`, `e2e/importdirectory.spec.ts`, Ergänzungen in `layout`, `language`, `texts`) gegen das echte Backend. Prüfe sie vollständig gegen die Abnahmekriterien 1 bis 3 von Auftrag 20 (`orders/20.md`) und Spezifikation 5.3, 5.6, 5.7, 8.4. Der Entwickler hat vier Browsertests geändert (`importdirectory.spec.ts`, `language.spec.ts`, `layout.spec.ts`; `git diff 520d925af4dd7ef388d1d8b01f362e618116eff8 7f388d4166325f4224c01c13ab969ad6e2248749`). Prüfe, dass jede Änderung die Prüfung nicht abschwächt (keine entfernte oder entschärfte Aussage) und dass der Code der Oberfläche nicht geändert wurde.
3. Führe das Prüfskript `components/pipwerk-replay/scripts/check` selbst aus (Exitcode 0 einschließlich aller Browsertests; das Skript verlangt `--backend-port` und `--frontend-port`, nimm freie Ports). Fehlt ein Browser, nenne die Fehlermeldung wörtlich im Bericht und wiederhole nicht. Rufe nie `playwright install` auf.
4. Hinweis: Nach Antwort des Projektleiters ersetzt „Dateien behalten“ eine vorhandene Datei gleichen Namens künftig nicht mehr, sondern vergibt einen eindeutigen Namen. Die Spezifikation wird dazu ergänzt; der Code bleibt hier unverändert. Melde dazu keinen Befund.
5. `components/pipwerk-studio` ist nicht Gegenstand (nennt weiter Playwright 1.63.0).

Beachte die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`, Abschnitt „Umfang der Prüfungen“.

## Ablage

Schreibe den Testbericht ohne Commit als Datei `21-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`, höchstens etwa 40 Zeilen, mit „bestanden“ oder „nicht bestanden“, dem geprüften Commit vollständig, den Ergebnissen der Browsertests (Anzahl je Browser) und den Befunden.
