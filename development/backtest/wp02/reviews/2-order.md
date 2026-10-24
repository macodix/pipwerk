# Prüfauftrag QA, Arbeitspaket wp02, Durchlauf 2

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: QA
- zu prüfender Commit: `d994dfaf02a49aa1ac0ea954c35e6ce64d8a0f2d` (Arbeitszweig `backtest/wp02`, alle Aufträge einschließlich 11 bis 14 und die Prüfskripte der Tester Funktion zusammengeführt; spätere Commits des Zweigs ändern nur Dateien unter `development/`)
- Testumgebung: läuft aus dem Arbeitsverzeichnis `test/backtest-wp02/` im Entwicklungsverzeichnis auf genau diesem Commit, gestartet mit `components/pipwerk-replay/scripts/testenv start --frontend-port 5175 --backend-port 8002`. Oberfläche: `http://127.0.0.1:5175/`. Backend: `127.0.0.1:8002`. Die Datenbank ist leer. Eine Quelle gibt es nicht mehr, ein echtes MetaTrader 5 steht nicht zur Verfügung.

## Gegenstand

Der Auftraggeber hat `wp02` in der Abnahme (Versuch 1, `development/backtest/wp02/acceptance/1.md`) mit den Mängeln M1 bis M4 nicht abgenommen. Sie sind behoben. Prüfe das Arbeitspaket `wp02` in der laufenden Testumgebung aus Kundensicht nach den Abnahmekriterien 1 bis 6 in `development/backtest/plan.md`, Abschnitt `wp02` (Fassung vom 2026-10-23), und die Verständlichkeit und Vollständigkeit der Anwenderdokumentation `docs/user/pipwerk-replay.md`. Der Durchlauf 1 (`reviews/1.md`) galt der früheren Fassung; prüfe vollständig. Besonders: die Mängel M1 bis M4 des Abnahmeberichts wörtlich (Aufbau der Ansicht „Datenbestand“ ohne Hinweise auf Bereiche „oben“ und „unten“, kurze sachliche Überschriften, Import beliebig vieler Dateien in einem Dialog mit Broker und Zeitzone einmal und Instrument und Zeiteinheit je Datei, keine Beschaffung aus der Oberfläche), und ob die Ansicht ohne Erklärung bedienbar ist.

Hinweise zur Durchführung:

- Starte, beende oder verändere die Testumgebung in `test/backtest-wp02/` nicht. Sie bleibt für die Abnahme durch den Auftraggeber stehen. Lege deine Daten in dieser Testumgebung nur an, wenn du sie danach wieder entfernst (Datenbestand und Testkonten sollen für den Auftraggeber leer beziehungsweise im Ausgangszustand sein); besser arbeitest du in deiner eigenen Umgebung im Arbeitsverzeichnis `work/backtest/wp02/qa/` auf demselben Commit mit anderen, freien Ports und eigener Datenbank (eigenes `testenv`), und prüfst in der Testumgebung nur, dass sie läuft und die Oberfläche sich zeigt.
- Kriterium 1 und 2: Mehrere CSV-Dateien mit Kerzen im Exportformat von MetaTrader 5 stellst du selbst her (Format beschreibt `docs/user/pipwerk-replay.md`), dazu eine JSON-Datei im Format des Imports (Schema `contracts/market-data/v1/`) und eine fehlerhafte Datei. Das Format der CSV ist ohne echte Exportdatei nach bestem Wissen umgesetzt; weicht ein echter Export ab, prüft das der Auftraggeber in der Abnahme.
- Kriterium 3: MetaTrader 5 steht nicht zur Verfügung. Prüfe die Beschreibung der Einrichtung und des Aufrufs von `pipwerk-fetch-mt5` in der Anwenderdokumentation auf Verständlichkeit und Vollständigkeit, und führe das Programm gegen eine nachgebildete Schnittstelle von `MetaTrader5` aus, soweit die Tests in `components/pipwerk-fetch-mt5/tests/` das vorsehen (Prüfskript `components/pipwerk-fetch-mt5/scripts/check`); die Dateien, die es schreibt, importierst du in deiner Umgebung. Prüfe, dass es keinen Port öffnet und dass die Oberfläche nichts beschafft. Nenne die Einschränkung im Bericht.
- Kriterium 4: Neustart des Backends und Wiederkehr des Standard-Testkontos in deiner eigenen Umgebung.
- Kriterium 5: sechs Fenstergrößen 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768 und 1920 × 1080, Texte in Deutsch und Englisch, kurze sachliche Überschriften, Erklärung bei jedem Feld.
- Technische Nachweise laut Plan: Führe die Prüfskripte `components/pipwerk-replay/scripts/check` (Aufruf in Abschnitt 6.3 von `docs/technical/pipwerk-replay.md`; Installation und Browsertests laufen im Hintergrund), `packages/market-data/scripts/check` und `components/pipwerk-fetch-mt5/scripts/check` in deinem Arbeitsverzeichnis aus und prüfe, ob für jeden zusammengeführten Auftrag positive Testberichte beider Tester vorliegen (`development/backtest/wp02/tests/` auf dem Arbeitszweig: Funktion `01` bis `05` und `11` bis `14`, Sicherheit `securitytest-1.md` und `securitytest-2.md`; die Korrekturaufträge 06 bis 10 sind in den Berichten ihrer Aufträge geprüft).
- Beachte die Regeln „Umfang der Prüfungen“: Der Durchlauf ist vollständig; nur blockierende Befunde verhindern das Bestehen; Bericht höchstens etwa 60 Zeilen.

## Prüfgrundlagen

- `development/backtest/plan.md`, Abschnitt `wp02`
- `development/backtest/wp02/acceptance/1.md`
- `development/backtest/scope.md` und die dort genannten Dokumente des Auftraggebers (Anforderungen req-system-026, req-system-027, req-test-003)
- `development/backtest/specification.md` (5.1, 5.3, 5.4, 8.3 Zeile „Datenbestand“)
- `development/backtest/prototype/README.md` (Prototyp, Vorlage für Aufbau und Bedienung)
- `docs/user/pipwerk-replay.md`, `docs/technical/pipwerk-replay.md`
- Briefing QA, Phase 4, in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `2.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Oberfläche und des Backends der Testumgebung und alle Befunde mit Fundstelle.
