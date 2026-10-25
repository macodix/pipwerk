# Prüfauftrag Funktionstest, Auftrag 23, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `2cfd9f6afe42a54e568cb9dd9043cddd636ea724` (Zweig `backtest/wp02`: Auftrag 22 mit positivem Testbericht `tests/22-functiontest-1.md` und Auftrag 23, Zweig `backtest/wp02-23` Commit `acf99e8fb6d85c597ea0e17e9d61300d6bd08371`, zusammengeführt)
- Auftrag: `development/backtest/wp02/orders/23.md` auf dem Zweig `backtest/wp02`
- Prüfgrundlagen: Auftrag 23; Spezifikation `development/backtest/specification.md` 5.3, 5.6, 5.7, 8.4, 10; `development/backtest/wp02/amend-01.md`; `docs/technical/pipwerk-replay.md`; Backend mit dem Feld `kept_as` (Auftrag 22) liegt in diesem Commit

## Gegenstand

1. Oberfläche nach Auftrag 23: `kept_as` lesen (fehlendes oder falsch typisiertes Feld wird abgelehnt), Name der behaltenen Datei im Dialog, wenn er abweicht, als Text; Erklärung des Kästchens ohne „ersetzt“, mit der Regel in Deutsch und Englisch; keine Einschränkung von Ablage- und Importverzeichnis gegeneinander.
2. Prüfe, dass jeder Fall aus Umfang 5 des Auftrags durch Vitest und Browsertests nachgewiesen ist und dass bestehende Tests nicht abgeschwächt wurden (`git diff` gegen `f9a8536ff2c4fa99da0f622f640c43e2f472c0dc` für `components/pipwerk-replay/frontend`).
3. Führe das Prüfskript `components/pipwerk-replay/scripts/check` selbst vollständig aus (verlangt `--backend-port` und `--frontend-port`; nimm freie Ports; im Hintergrund, Exitcode 0 einschließlich aller Browsertests). Fehlt ein Browser, nenne die Fehlermeldung wörtlich und wiederhole nicht. Rufe nie `playwright install` auf. Im Entwicklerlauf auf dem Stand ohne Backend scheiterten 24 Browsertests am fehlenden `kept_as`; sie müssen jetzt laufen.
4. Dokumentation (`docs/technical/pipwerk-replay.md`, README, Änderungsnachweise) auf Widersprüche prüfen, besonders zu „ersetzt“ bei behaltenen Dateien (`pipwerk-fetch-mt5` ersetzt eigene Dateien weiterhin und ist nicht Gegenstand).

Beachte die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`, Abschnitt „Umfang der Prüfungen“.

## Ablage

Schreibe den Testbericht ohne Commit als Datei `23-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`, höchstens etwa 40 Zeilen, mit „bestanden“ oder „nicht bestanden“, dem geprüften Commit vollständig, den Ergebnissen der Browsertests (Anzahl) und den Befunden.
