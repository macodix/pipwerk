# Prüfauftrag Sicherheitstest, Arbeitspaket wp02, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Sicherheit
- zu prüfender Commit: `6b952294f441dd5a8d2313ffc06b29884a21ca2d` (Zweig `backtest/wp02`, alle Aufträge des Pakets zusammengeführt)
- Aufträge: `development/backtest/wp02/orders/01.md` bis `10.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe die Sicherheit des Arbeitszweigs nach BSI-Grundschutz, OWASP und den Sicherheitsregeln in `docs/technical/development-test-security-rules.md` und Abschnitt 11 der Spezifikation. Schwerpunkte:

- `pipwerk-fetch-mt5` (`components/pipwerk-fetch-mt5`): Schlüssel des Zugriffs (Vergleich, Ablage, Protokolle, Fehlermeldungen), Prüfung des Kopfs `Host`, Begrenzungen von Anfrage, Antwort und Zahl der Abrufe, Zuordnungstabelle (Eingabe des Symbols), Bindung an Adressen, Skripte für Windows.
- pipwerk replay (`components/pipwerk-replay`): Web-API für Datenbestand, Import hochgeladener Dateien (Größe, Zeilenzahl, Format, Zeitzone als Eingabe, Ablehnung zusätzlicher Felder), Beschaffung (Schlüssel `fetch_key`, Adresse der Quelle als Ziel von Anfragen, Zahl gleichzeitiger Vorgänge), Testkonten, interne Endpunkte `/api/replay/`, Prüfung des Kopfs `Host`, Begrenzung der Anfragegröße, Fehlerformat ohne Informationsabfluss, SQL über SQLAlchemy.
- `packages/market-data`: Import (CSV, JSON), Umrechnung der Zeitzone, Transaktionen, Begrenzungen gegen Überlast.
- Oberfläche (`components/pipwerk-replay/frontend`): Ausgabe von Texten des Anwenders und der Quelle als Text, nie als HTML; Abhängigkeiten (`npm audit`, `pip-audit`); gespeicherte Daten im Browser; Bindung von Entwicklungs- und Vorschauserver.
- Skript `components/pipwerk-replay/scripts/testenv`: Parameter, Pfade, Quoting, Schlüsseldatei, Rechte der Dateien unter `.testenv/`, Prozesse, Aufräumen.
- Keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners im Repository.

Bekannt und vom Entwicklungsleiter beurteilt (kein Befund, es sei denn du siehst ein darüber hinausgehendes Risiko): `npm audit` meldet eine Schwachstelle der Stufe „high“ in `vite` 8.3.0 bis 8.3.2 (nur Entwicklungsserver, `npm run dev`, Behebung in 8.3.5 laut Bericht `05-functiontest-1.md`); ordne sie selbst ein und nenne, ob sie blockiert. Die Rechenzeit der Übersicht im Datenbestand ist nicht begrenzt (Hinweis im Bericht `04-functiontest-1.md`); bewerte sie unter OWASP API4.

## Prüfgrundlagen

- `development/backtest/wp02/orders/01.md` bis `10.md`
- `development/backtest/specification.md`, Abschnitte 5, 7, 11
- `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-replay.md`, `docs/technical/pipwerk-marketdata.md`, `docs/technical/pipwerk-fetch-mt5.md`
- Berichte der Tester Funktion im Verzeichnis `development/backtest/wp02/tests/`
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `securitytest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
