# Prüfauftrag Funktionstest, Auftrag 02, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- zu prüfender Commit: `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1` (Zweig `ablauftest/wp01-02`, aufgesetzt auf `13ad9c7475c117e738652b534c69a394c4baa0ef`)
- Auftrag: `development/ablauftest/wp01/orders/02.md` auf dem Zweig `ablauftest/wp01`

## Gegenstand

Prüfe den Commit gegen Auftrag 02 und die Spezifikation: Funktion, Grenzfälle, automatische Tests, Programmierregeln und technische Dokumentation. Schwerpunkte: Dialog (Abschnitte 3.2 bis 3.6, E1 bis E9), Ermittlung des Stands beim Bau, Frontend-Tests nach 4.1 und Browsertests nach 4.2 einschließlich der Umstellung auf die gebaute Oberfläche, unveränderte Tests von Fußzeile und Tooltip, Dokumentation nach Abschnitt 7 der Spezifikation.

Dein Prüfskript liegt im Ausgangscommit. Führe den zu prüfenden Commit in deinen Zweig `ablauftest/wp01-functiontest` zusammen, passe Prüfskript und Abschnitt 6.4 an, wenn die neuen Tests es verlangen, übertrage den Zweig und nenne den Commit des Prüfskripts im Bericht.

Entscheidungen des Softwarearchitekten zu Rückfragen des Entwicklers (kein Befund, sofern sonst richtig umgesetzt und dokumentiert):

- `server.fs.allow` enthält die Datei `LICENSE` und dieselbe Datei mit dem Zusatz `?raw`, weil Vite den Import mit Zusatz prüft. Freigegeben ist damit weiter genau die Datei `LICENSE` nach Abschnitt 3.6; kein Verzeichnis.
- Den Fokus auf „Schließen“ beim Öffnen setzt der Code ausdrücklich nach `showModal()` statt über `autoFocus`. Verlangt ist das Verhalten aus Abschnitt 3.2.
- `allowImportingTsExtensions` in `tsconfig.json` ist zulässig.
- `pip-audit` und `npm audit` laufen weiter nur mit `--with-audit`.

## Prüfgrundlagen

- `development/ablauftest/wp01/orders/02.md`
- `development/ablauftest/specification.md`, `development/ablauftest/plan.md`
- `docs/technical/pipwerk-studio.md`, `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `02-functiontest-1.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/functiontest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
