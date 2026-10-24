# Prüfauftrag QA, Arbeitspaket wp02, Durchlauf 4

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: QA
- zu prüfender Commit: `66cf5c77310e3ce95cbc11872b8c93fb057a7c04` (Zweig `backtest/wp02`, Aufträge 18, 19 und 20)
- Testumgebung: Oberfläche `http://127.0.0.1:5175/`, Backend `http://127.0.0.1:8002/` (läuft auf genau diesem Commit, leerer Datenbestand). Verändere sie nicht für fremde Zwecke; für Prüfungen mit eigener Konfiguration starte eine eigene Umgebung mit `components/pipwerk-replay/scripts/testenv` aus deinem Arbeitsverzeichnis auf anderen Ports und beende sie danach.

## Gegenstand

Nachprüfung nach den Regeln „Umfang der Prüfungen“. Durchlauf 3 (`tests/` des Berichtsverzeichnisses, Bericht `3.md`, bestanden) galt dem Commit `ae414f2bb94ad6e06469e6087bc3d200f985c6ac`. Der Auftraggeber hat danach die Abnahmekriterien 11 bis 13 von `wp02` ergänzt (`development/backtest/plan.md`, Abschnitt `wp02`, Kriterien 11 bis 13; `development/backtest/wp02/acceptance/2.md` und `specification.md` 5.3, 5.6, 5.7, 8.3).

Prüfe aus Kundensicht:

- Kriterium 11: `pipwerk-fetch-mt5` und Strg+C (Beschreibung in `docs/technical/pipwerk-fetch-mt5.md`; ohne MetaTrader 5 und ohne Windows nur soweit möglich, den Rest benenne als nicht prüfbar).
- Kriterium 12: Dialog „Datei importieren“, Kästchen „Dateien behalten“ (Vorbelegung, Erklärung beim Zeigen, Ablageverzeichnis), Wirkung im Ablageverzeichnis, Anwenderdokumentation (`docs/user/pipwerk-replay.md`).
- Kriterium 13: Ansicht „Einstellungen“ mit vier Werten, Ablehnung eines relativen Pfads mit Grund, erneutes Öffnen, Auswahl aus dem Importverzeichnis (Unterverzeichnis) zusammen mit einer hochgeladenen Datei in einem Vorgang, Dateien danach unverändert im Importverzeichnis, auch mit „Dateien behalten“.
- Ob die Änderungen bisher bestandene Kriterien (1 bis 10) verschlechtern: stichprobenartig.

Hinweis: Der Playwright-Browser fehlt auf diesem Rechner; die Browsertests von Auftrag 20 sind deshalb nie gelaufen. Prüfe, soweit dir ein Weg offensteht (Bedienung der Oberfläche, Web-API mit `curl`, Dateisystem der eigenen Umgebung), und benenne ehrlich, was du nicht ausführen konntest. Wegwerfdateien nur im Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/` (Unterverzeichnis `qa4tmp`), nie in einem Git-Arbeitsverzeichnis.

Beachte die Regeln „Umfang der Prüfungen“ (nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen).

## Prüfgrundlagen

- `development/backtest/plan.md` (Abschnitt `wp02`), `development/backtest/specification.md`, `development/backtest/wp02/acceptance/2.md`
- `docs/user/pipwerk-replay.md`, `docs/technical/pipwerk-replay.md`, `docs/technical/pipwerk-fetch-mt5.md`
- Berichte `tests/18-functiontest-1.md`, `tests/20-functiontest-1.md`, `tests/20-functiontest-2.md`, `tests/securitytest-4.md`
- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `4.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Testumgebung und konkrete Befunde mit Fundstelle.
