# Prüfauftrag QA, Arbeitspaket `wp01`, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Phase: 4 Umsetzung
- Rolle: QA
- zu prüfender Commit: `2ec5418da46e03ea8dbbfca9e50230440856db9f` auf dem Arbeitszweig `strategiedesign/wp01`. Er enthält die zusammengeführten Aufträge 01, 02 und 03 und das Prüfskript des Testers Funktion.
- Testumgebung: läuft auf genau diesem Commit, gestartet mit `components/pipwerk-studio/scripts/testenv start --frontend-port 5174 --backend-port 8001`. Oberfläche `http://127.0.0.1:5174/`, Backend `http://127.0.0.1:8001/`, Schnittstellenbeschreibung `http://127.0.0.1:8001/docs`. Beende oder starte die Testumgebung nicht neu; sie wird anschließend dem Auftraggeber übergeben. Was du darin anlegst, entfernst du am Ende wieder über die Web-API.

## Gegenstand

Arbeitspaket `wp01` „Bibliothek und Web-API“ in `development/strategiedesign/plan.md`: Ziel, Umfang und Abnahmekriterien 1 bis 8 sowie die technischen Nachweise unter den Abnahmekriterien.

## Umfang der Prüfung

1. Prüfe in der laufenden Testumgebung aus Kundensicht jedes Abnahmekriterium 1 bis 7 so, wie der Auftraggeber es selbst prüfen würde: über `/docs` am Port des Backends und die Oberfläche. Für Kriterium 4 und 5 verwendest du die Testfalldokumente `contracts/strategies/v1/testcases/str-01.strategy.json` und `str-03.strategy.json` und daraus abgewandelte Fassungen.
2. Prüfe Abnahmekriterium 8: technische Dokumentation (`docs/technical/pipwerk-domain.md`, `docs/technical/pipwerk-studio.md`) und Anwenderdokumentation (`docs/user/pipwerk-studio.md`) auf Verständlichkeit und Vollständigkeit für dieses Paket.
3. Technische Nachweise: Führe in deinem eigenen Arbeitsverzeichnis auf dem geprüften Commit das Prüfskript `components/pipwerk-studio/scripts/check` auf freien Ports (nicht 5174 und 8001) aus, einmal ohne und einmal mit `--with-audit`. Hinweis: `npm audit` scheitert am bekannten Befund `source-map-js` (GHSA-68fv-2mgg-jv7q), der in `docs/technical/pipwerk-studio.md` Abschnitt 7 und 9 genannt ist und die Oberfläche betrifft, die dieses Paket nicht ändert. Bewerte das nach den Abnahmekriterien. Prüfe, dass für jeden zusammengeführten Auftrag positive Testberichte beider Tester unter `development/strategiedesign/wp01/tests/` vorliegen (Auftrag 01: `01-*-6.md`, Auftrag 02: `02-*-4.md`, Auftrag 03: `03-*-2.md`).

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis.
- `development/strategiedesign/plan.md` (`wp01`), `development/strategiedesign/specification.md`, `development/strategiedesign/scope.md` und die dort genannten Dokumente des Auftraggebers
- die Aufträge unter `development/strategiedesign/wp01/orders/` mit den darin festgehaltenen Entscheidungen des Softwarearchitekten

Nenne zu jedem Befund Fundstelle und Sachverhalt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/1.md`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Testumgebung (Oberfläche 5174, Backend 8001), das Ergebnis je Abnahmekriterium, die Befunde und getrennt davon die Hinweise.
