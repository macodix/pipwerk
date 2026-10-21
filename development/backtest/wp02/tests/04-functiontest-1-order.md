# Prüfauftrag Funktionstest, Auftrag 04, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `72308c0ad60c7c5399524b319eaaa4fff7114f4c` (Zweig `backtest/wp02-04`)
- Auftrag: `development/backtest/wp02/orders/04.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 04 und die Spezifikation (E3 bis E5, 5.1 bis 5.4, Abschnitt 7, 10 Punkte Datenbestand und Beschaffung, Abschnitt 11): Funktion, Grenzfälle, automatische Tests, Programmierregeln, Schutz des Schlüssels, Begrenzungen und technische Dokumentation. Prüfe auch ein Zusammenspiel: pipwerk replay gegen die nachgebildete Quelle über echte Verbindungen und gegen ein laufendes `pipwerk-fetch-mt5` mit der nachgebildeten Fassung von `MetaTrader5`, soweit das ohne Windows möglich ist.

Das Prüfskript `components/pipwerk-replay/scripts/check` liegt auf dem Zweig `backtest/wp02-functiontest` (Commit `2c3214e758bf33710643e631cdc9ddf9b9cb04b6`); der geprüfte Commit enthält es nicht. Hole es dir von dort und führe es auf dem zu prüfenden Commit aus. Ergänze es, wenn der Umfang von Auftrag 04 es verlangt (zum Beispiel Prüfung von `openapi.json`), auf einem neuen Commit im Zweig `backtest/wp02-functiontest-04`, aufgesetzt auf dem zu prüfenden Commit, übertrage ihn nach GitHub und nenne ihn im Bericht; beschreibe Änderungen im Abschnitt „Prüfskript“ in `docs/technical/pipwerk-replay.md`.

Entscheidungen des Entwicklungsleiters zu den Rückfragen des Entwicklers (kein Befund, sofern sonst richtig umgesetzt und dokumentiert):

- Beschaffung als Hintergrundauftrag mit Stand im Speicher, Datei als Body des Uploads, HTTP 429 bei Überschreiten der Zahl gleichzeitiger Vorgänge, deutsche Fehlertexte, das freiwillige Feld `broker` bei Vollständigkeit und die INI ohne Interpolation sind technische Festlegungen.
- Die Zerlegung großer Zeiträume und der Schlüssel der Quelle in der Testumgebung sind nicht Gegenstand von Auftrag 04 (Auftrag 05 und `wp03`).
- Die Rechenzeit der Übersicht beurteilt der Entwicklungsleiter selbst; Hinweis genügt.

## Prüfgrundlagen

- `development/backtest/wp02/orders/04.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/pipwerk-replay.md`, `docs/technical/pipwerk-marketdata.md`, `docs/technical/pipwerk-fetch-mt5.md`, `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `04-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
