# Prüfauftrag QA, Arbeitspaket wp02, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: QA
- zu prüfender Commit: `6b952294f441dd5a8d2313ffc06b29884a21ca2d` (Arbeitszweig `backtest/wp02`, alle Aufträge und die Prüfskripte der Tester Funktion zusammengeführt; spätere Commits des Zweigs ändern nur Dateien unter `development/`)
- Testumgebung: läuft aus dem Arbeitsverzeichnis `test/backtest-wp02/` im Entwicklungsverzeichnis auf genau diesem Commit, gestartet mit `components/pipwerk-replay/scripts/testenv start --frontend-port 5175 --backend-port 8002 --source-url http://127.0.0.1:8766 --source-key-file <Schlüsseldatei>`. Oberfläche: `http://127.0.0.1:5175/`. Backend: `127.0.0.1:8002`. Als Quelle läuft die nachgebildete Quelle `pipwerk_fetch_mt5.fake_source` auf `127.0.0.1:8766` (Instrumente `EURUSD`, `GBPUSD`, `USDJPY`; unbekannte Bezeichnungen ergeben „Symbol beim Broker unbekannt“); ihre Beschreibung steht in `components/pipwerk-fetch-mt5/README.md`. Ein echtes MetaTrader 5 steht nicht zur Verfügung.

## Gegenstand

Prüfe das Arbeitspaket `wp02` in der laufenden Testumgebung aus Kundensicht. Prüfe die Abnahmekriterien 1 bis 6 aus `development/backtest/plan.md`, Abschnitt `wp02`, und die Verständlichkeit und Vollständigkeit der Anwenderdokumentation `docs/user/pipwerk-replay.md`.

Hinweise zur Durchführung:

- Starte, beende oder verändere die Testumgebung in `test/backtest-wp02/` nicht und lass die nachgebildete Quelle laufen. Sie bleiben für die Abnahme durch den Auftraggeber stehen.
- Kriterium 1 und 2: Die CSV-Datei mit Kerzen im Exportformat von MetaTrader 5 stellst du selbst her (Format und Spalten beschreibt `docs/user/pipwerk-replay.md`), mit Broker, Instrument, Zeiteinheit und Zeitzone als Angaben beim Import; eine fehlerhafte Datei ebenso. Beachte: Das Format ist ohne echte Exportdatei nach bestem Wissen umgesetzt; weicht ein echter Export ab, prüft das der Auftraggeber in der Abnahme.
- Kriterium 3: Das Einrichten von `pipwerk-fetch-mt5` auf einem Rechner mit MetaTrader 5 unter Windows kannst du nicht ausführen. Prüfe stattdessen die Beschreibung der Einrichtung in der Anwenderdokumentation auf Verständlichkeit und Vollständigkeit, und die Beschaffung von Hand (Kerzen, Ticks, Angaben, unbekanntes Symbol mit Meldung und Grund) gegen die nachgebildete Quelle. Nenne die Einschränkung im Bericht.
- Kriterium 4: Prüfe den Neustart des Backends und die Wiederkehr des Standard-Testkontos in deinem eigenen Arbeitsverzeichnis `work/backtest/wp02/qa/` auf demselben Commit mit anderen, freien Ports und eigener Datenbank (eigenes `testenv`), nicht in der Testumgebung. Die nachgebildete Quelle kannst du für deine Umgebung mitbenutzen (Adresse `http://127.0.0.1:8766`, Schlüsseldatei `test/backtest-wp02-source.key`).
- Kriterium 5: Prüfe die sechs Fenstergrößen 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768 und 1920 × 1080 und Texte in Deutsch und Englisch mit Erklärung bei jedem Feld.
- Technische Nachweise laut Plan: Führe das Prüfskript `components/pipwerk-replay/scripts/check` in deinem Arbeitsverzeichnis aus (Aufruf und Parameter in Abschnitt 6.3 der technischen Dokumentation `docs/technical/pipwerk-replay.md`; Installation und Browsertests laufen im Hintergrund) und prüfe, ob der Abschnitt mit dem Skript übereinstimmt. Prüfe außerdem, ob für jeden zusammengeführten Auftrag positive Testberichte beider Tester vorliegen: `development/backtest/wp02/tests/` auf dem Arbeitszweig, letzter Durchlauf je Auftrag und Prüfgebiet (Funktion `01` bis `05`, Sicherheit `securitytest-1.md`; die Korrekturaufträge 06 bis 10 sind in den Berichten ihrer Aufträge geprüft). Die vom Plan verlangten Prüfskripte `packages/market-data/scripts/check` und `components/pipwerk-fetch-mt5/scripts/check` laufen im Zweig ebenfalls; führe sie aus.
- Der bekannte Hinweis zu `vite` (nur Entwicklungsserver, `npm audit` „high“) ist vom Entwicklungsleiter und vom Tester Sicherheit eingeordnet und nicht Gegenstand des Pakets.

## Prüfgrundlagen

- `development/backtest/plan.md`, Abschnitt `wp02`
- `development/backtest/scope.md` und die dort genannten Dokumente des Auftraggebers
- `development/backtest/specification.md`
- `development/backtest/prototype/README.md` (bestätigter Prototyp, Vorlage für Aufbau und Bedienung)
- `docs/user/pipwerk-replay.md`, `docs/technical/pipwerk-replay.md`
- Briefing QA, Phase 4, in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Oberfläche und des Backends der Testumgebung und alle Befunde mit Fundstelle.
