# Prüfauftrag Funktionstest, Auftrag 05, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `f192101aaa66a3a966cf02585ba16685962dc92d` (Zweig `backtest/wp02-05`)
- Auftrag: `development/backtest/wp02/orders/05.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 05 und die Spezifikation (E3, 5.1 bis 5.4, 6.2, 8.1 bis 8.4, 11, 12): Funktion, Grenzfälle, automatische Tests (Vitest, Browsertests, Backend), Programmierregeln, technische Dokumentation und, als Prüfung der Dokumentation nach Regel, ob die Anwenderdokumentation `docs/user/pipwerk-replay.md` zu dem passt, was die Oberfläche tut (Beurteilung der Verständlichkeit macht die QA). Prüfe das Testumgebungsskript `components/pipwerk-replay/scripts/testenv` als Programm: `start` mit Backend und Oberfläche, mit und ohne Quelle (nachgebildete Quelle `components/pipwerk-fetch-mt5/src/pipwerk_fetch_mt5/fake_source.py`), `status`, `stop`; der Schlüssel erscheint in keiner Kommandozeile, keinem Protokoll und keiner Antwort. Prüfe die Begründung der Entwicklungsentscheidungen in Abschnitt 8 von `docs/technical/pipwerk-replay.md`.

Das Prüfskript `components/pipwerk-replay/scripts/check` liegt auf dem Zweig `backtest/wp02-functiontest-04` (Commit `98b77bb0244940848dc0f82fef28784f90f4b6bf`); der geprüfte Commit enthält es nicht. Hole es von dort und ergänze es um die Schritte der Oberfläche (Typprüfung, Vitest, Build, Browsertests nach dem Muster von `components/pipwerk-studio/scripts/check`; Installation und Browsertests laufen im Hintergrund wegen der Dauer). Arbeite dafür auf einem neuen Commit im Zweig `backtest/wp02-functiontest-05`, aufgesetzt auf dem zu prüfenden Commit, übertrage ihn nach GitHub, nenne ihn im Bericht und beschreibe die Änderung im Abschnitt „Prüfskript“ von `docs/technical/pipwerk-replay.md`. Setze das Ausführungsbit im Index.

Entscheidungen des Entwicklungsleiters zu den Rückfragen des Entwicklers (kein Befund, sofern sonst richtig umgesetzt und dokumentiert): Zeitraum der Beschaffung mit Datum und Uhrzeit in UTC, „Punkte“ statt „Pips“, Kontowährung als Textfeld mit Vorschlägen, Menü ab 700 Pixel ausgeschrieben, Abfrage der Backend-Anzeige alle 10 Sekunden. Die Meldung zu `409 no_source` und die Zerlegung großer Zeiträume gehören zu `wp03`. Die gemeldete Schwachstelle der Stufe „high“ bei `npm ci` ist zu beurteilen: ordne sie ein (betrifft sie Laufzeit oder nur Entwicklungswerkzeug, gibt es eine behobene Fassung) und melde sie im Bericht; sie ist blockierend nur, wenn sie die ausgelieferte Oberfläche betrifft und behebbar ist.

## Prüfgrundlagen

- `development/backtest/wp02/orders/05.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`, Prototyp unter `development/backtest/prototype/`
- `docs/technical/pipwerk-replay.md`, `docs/user/pipwerk-replay.md`, `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `05-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
