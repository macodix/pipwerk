# Prüfauftrag QA, Arbeitspaket `wp02`, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Phase: 4 Umsetzung
- Rolle: QA
- zu prüfender Commit: `e2d15e80dbeb9e35014b738665de8ef52166cbeb` auf dem Arbeitszweig `strategiedesign/wp02`. Er enthält die zusammengeführten Aufträge 01, 02 und 03. Der Tester Funktion hat das Prüfskript in diesem Paket nicht geändert; es gibt keinen Zweig des Testers Funktion.
- Testumgebung: läuft auf genau diesem Commit, gestartet mit `components/pipwerk-studio/scripts/testenv start --frontend-port 5174 --backend-port 8001`. Oberfläche `http://127.0.0.1:5174/`, Backend `http://127.0.0.1:8001/`, Schnittstellenbeschreibung `http://127.0.0.1:8001/docs`. Beende oder starte die Testumgebung nicht neu; sie wird anschließend dem Auftraggeber übergeben. Was du darin anlegst, entfernst du am Ende wieder; ändere das Objektverzeichnis am Ende auf das ursprüngliche zurück und lasse die Sprache auf Deutsch.

## Gegenstand

Arbeitspaket `wp02` „Strategien gestalten in der Oberfläche“ in `development/strategiedesign/plan.md`: Ziel, Umfang und Abnahmekriterien 1 bis 12 sowie die technischen Nachweise unter den Abnahmekriterien.

## Umfang der Prüfung

1. Prüfe in der laufenden Testumgebung aus Kundensicht jedes Abnahmekriterium 1 bis 11 so, wie der Auftraggeber es selbst prüfen würde: in der Oberfläche, für Kriterium 11 zusätzlich über `/docs`. Für die Bedienung der Oberfläche darfst du eine Browsersteuerung verwenden, zum Beispiel Playwright aus den Abhängigkeiten der Oberfläche in deinem eigenen Arbeitsverzeichnis, gerichtet auf die Testumgebung. Für Kriterium 3 und 4 baust du `str-03` und `str-01` nach der Anleitung der Anwenderdokumentation `docs/user/pipwerk-studio.md` auf und vergleichst das Ergebnis mit `contracts/strategies/v1/testcases/str-03.strategy.json` und `str-01.strategy.json`.
2. Prüfe Abnahmekriterium 12: Die Anwenderdokumentation beschreibt die Arbeitsabläufe dieses Pakets, die Schreibweise von Ausdrücken mit „leer“ und „nicht verfügbar“, die Befunde und beide Testfälle verständlich und vollständig. Prüfe auch die technische Dokumentation (`docs/technical/pipwerk-studio.md`, `docs/technical/pipwerk-domain.md`) und das Glossar (`docs/technical/glossar.md`) für dieses Paket.
3. Technische Nachweise: Führe in deinem eigenen Arbeitsverzeichnis auf dem geprüften Commit das Prüfskript `components/pipwerk-studio/scripts/check` auf freien Ports (nicht 5174 und 8001) aus, ohne `--with-audit`. Die bekannte Schwachstelle `source-map-js` (GHSA-68fv-2mgg-jv7q) in Entwicklungsabhängigkeiten aus dem Bestand ist nicht Gegenstand dieses Pakets (Auftrag 02, Punkt 7). Prüfe, dass für jeden zusammengeführten Auftrag positive Testberichte beider Tester unter `development/strategiedesign/wp02/tests/` vorliegen (Auftrag 01: `01-*-5.md`, Auftrag 02: `02-*-2.md`, Auftrag 03: `03-*-6.md`).

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis.
- `development/strategiedesign/plan.md` (`wp02`), `development/strategiedesign/specification.md`, `development/strategiedesign/scope.md` und die dort genannten Dokumente des Auftraggebers
- die Aufträge unter `development/strategiedesign/wp02/orders/` mit den darin festgehaltenen Entscheidungen des Softwarearchitekten

Nenne zu jedem Befund Fundstelle und Sachverhalt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als `1.md` in das Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Testumgebung (Oberfläche 5174, Backend 8001), das Ergebnis je Abnahmekriterium, die Befunde und getrennt davon die Hinweise.
