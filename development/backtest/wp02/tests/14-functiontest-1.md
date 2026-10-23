# Testbericht Funktionstest, Auftrag 14, Durchlauf 1

- Ergebnis: **bestanden**
- Geprüfter Commit: `85f271635a86ce0eae28581f4d79b5fde841c7c7` (Zweig `backtest/wp02-14`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Commit des Prüfskripts: keine Änderung; es gilt `components/pipwerk-replay/scripts/check` im geprüften Commit (Blob `822bc8dab780ad9edfb47d57246f06b17436d0b9`, Modus 100755). Der Zweig `backtest/wp02-functiontest-14` wurde nicht angelegt.

## Ausgeführt

`check --backend-port 18141 --frontend-port 18142 --with-audit`: Exitcode 0, alle 15 Schritte bestanden.

- Backend: 752 Tests, ruff check, ruff format, mypy, `openapi.json` gleich der Anwendung, Suche nach alten Namen, „keine Beschaffung im Backend“, `pip-audit` ohne Fund.
- Oberfläche: `npm ci`, Typprüfung, Vitest (17 Dateien, 281 Tests), Build, `npm audit` (0 Schwachstellen; `vite` und `vitest` gehoben).
- Browsertest: 64 bestanden. Chromium führt alle aus, Firefox und WebKit den Start ohne Konsolenfehler. Enthalten sind alle Fälle aus Umfang 5: Import zweier Dateien mit neuem Broker und geänderter Zeiteinheit, fehlerhafte neben gültiger Datei, erneuter Import, viele Dateien mit Filter und Seiten, Zeilendetails, Broker für Testläufe, Prüfung der Herkunft (403) über den Proxy, Backend weg beim Import, Sprachprüfung Deutsch und Englisch, Erklärungen beim Zeigen, sechs Fenstergrößen, entfallene Überschriften (`texts.spec.ts`, `checks/noAcquisition.test.ts`).

## Durch Lesen geprüft

- `DataView.tsx` und `ImportDialog.tsx` entsprechen Umfang 1 und 2: Leiste, Tabelle (serverseitiger Filter, Seiten zu 10), Einzelheiten mit Lücken und Kontraktdaten, Sperre von „Importieren“ bei fehlender Angabe, Zeitzone nur bei CSV, Ergebnis je Datei, abgelehnte Datei hindert die übrigen nicht.
- Dateinamen und Namen des Anwenders werden als Text gesetzt. Es gibt kein `innerHTML`. Vitest und Browsertest prüfen `<img onerror>` und `<b>` als Text.
- Die Kennungen für Dateifehler, Importfehler und abgelehnte Zeilen in `errors.ts` stimmen mit `FileErrorCode`, `BatchErrorCode` und `RejectReason` in `packages/market-data/src/pipwerk_marketdata/records.py` überein.
- Eine Beschaffung kommt in der Oberfläche nicht mehr vor. Die Texte nennen `pipwerk-fetch-mt5` und den Import.
- Technische Dokumentation (`docs/technical/pipwerk-replay.md`, README, `pipwerk-fetch-mt5.md`): stimmt mit dem Code überein. Die Hinweise aus Auftrag 12 und 13 sind erledigt. In den Abschnitten 6.2 und 9 stehen Aufbau, Tests und Entscheidungen.
- Anwenderdokumentation `docs/user/pipwerk-replay.md`: passt zu dem, was die Oberfläche tut. Die Texte und Beispiele der Oberfläche stimmen überein. Die Aufrufe von `pipwerk-fetch-mt5` (`--from`, `--to`, `-u`, `--ticks`, `-o`, `scripts\fetch.cmd`) stimmen mit `cli.py` überein. Die Verständlichkeit beurteilt die QA.
- Abweichungen vom Prototyp (`d9c2edac…`):
  - Die Filter sind Textfelder mit Vorschlägen. Das ist eine Entscheidung des Entwicklungsleiters.
  - Eine Zeile „intro“ unter der Überschrift fehlt dort nicht.
  - Die Kontraktdaten zeigen die Margin je Lot, den Wochentag des dreifachen Swaps und den Zeitpunkt der Lieferung. Der Prototyp zeigte nur die Margin in Prozent.
  - Das Auswahlfeld „Broker für Testläufe“ hat bei leerem Datenbestand eine Option „keiner“ und zeigt Fehler als Hinweis.
  - Der Rest von Aufbau und Reihenfolge folgt dem Prototyp.

## Befunde

Keine blockierenden Befunde.

## Hinweise (verhindern das Bestehen nicht)

1. `dataQueries.ts` Zeile 30 (`dataFilterParam`): Der Filtertext „Kerzen“ oder „Candles“ allein ergibt einen leeren Filter. Es erscheinen alle Reihen, auch Ticks und Kontraktdaten, nicht nur Kerzen.
2. `package.json` hat kein `lint`. Ein Stilwerkzeug (ESLint oder Prettier) gibt es für die Oberfläche nicht, und `development-test-security-rules.md` verlangt keines. Hinweis nur zur Vollständigkeit.
3. Hinweis 4 aus Auftrag 12 (Fehlertexte der Abfrage) bleibt Hinweis, wie vom Entwicklungsleiter entschieden.
4. Die Datei `probe_ft11.py` steht weiter ungetrackt im Arbeitsverzeichnis `functiontest`. Sie wurde nicht angefasst und hat die Prüfung nicht beeinflusst.
