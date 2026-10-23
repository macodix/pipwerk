# Prüfauftrag Funktionstest, Auftrag 12, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `200efe1f8b577da6265da5c4bbbcd00eb45f6f14` (Zweig `backtest/wp02-12`)
- Auftrag: `development/backtest/wp02/orders/12.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 12 und die Spezifikation (E3, E4, 5.1, 5.3, 5.4, 7, 8.3 Zeile „Datenbestand“, 10, 11, 12): Web-API Datenbestand (Reihen mit Filter und Seiten, Einzelheiten, Brokerliste, Import mehrerer Dateien als Formular, Vorschau), Broker für Testläufe mit Rückfall und Migration, vollständiger Entfall der Beschaffung (Code, Konfiguration, Vertrag, Abhängigkeiten), Testumgebungsskript `components/pipwerk-replay/scripts/testenv` ohne Quelle (als Programm: `start`, `status`, `stop`, soweit ohne Oberfläche möglich), Grenzen, Fehlerbilder, Vertrag `contracts/api/pipwerk-replay/v1/openapi.json`, automatische Tests, Programmierregeln, technische Dokumentation und Glossar.

Entscheidungen des Entwicklungsleiters (kein Befund, sofern richtig umgesetzt und dokumentiert): Die Oberfläche (`components/pipwerk-replay/frontend/`) und `docs/user/pipwerk-replay.md` bleiben in diesem Auftrag unverändert; Auftrag 14 passt sie an. Ihre Vitest- und Browsertests sind deshalb nicht Teil dieser Prüfung. Die vom Entwickler ergänzte Herkunftsprüfung (403, wenn `Origin` nicht zu `Host` passt) bleibt, solange sie dokumentiert und getestet ist; prüfe, ob sie den Betrieb hinter dem Vite-Proxy beziehungsweise dem Testumgebungsskript (Oberfläche und Backend auf verschiedenen Ports) nicht verhindert, und melde es als blockierenden Befund, wenn doch. Beachte die Hinweise aus `tests/11-functiontest-1.md` zu den Kennungen der Daten.

Das Prüfskript ist `components/pipwerk-replay/scripts/check`. Es liegt auf dem Zweig `backtest/wp02-functiontest-05` (Commit nennt der Bericht zu Auftrag 05); hole es von dort, soweit der geprüfte Commit es nicht enthält, und passe es an den Wegfall der nachgebildeten Quelle an (Schritt Backend: Tests, `ruff`, `mypy`, Vertragsprüfung; der Browsertest-Schritt der Oberfläche bleibt in der Datei, entfällt aber nicht dauerhaft: Auftrag 14 stellt ihn wieder her, melde nur, ob er an dieser Stelle scheitert). Arbeite dafür in einem Zweig `backtest/wp02-functiontest-12`, aufgesetzt auf dem zu prüfenden Commit, übertrage ihn nach GitHub und nenne den Commit im Bericht. Beachte die Regeln „Umfang der Prüfungen“ (erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen).

## Prüfgrundlagen

- `development/backtest/wp02/orders/12.md`, `development/backtest/wp02/tests/11-functiontest-1.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/pipwerk-replay.md`, `docs/technical/glossar.md`, `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `12-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
