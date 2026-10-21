# Prüfauftrag QA, Arbeitspaket `wp02`, Durchlauf 2

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Phase: 4 Umsetzung (Neufassung vom 2026-10-20 mit den Aufträgen 04, 05 und 06)
- Rolle: QA
- zu prüfender Commit: `075ed1acb3a1f02a3516b43b8e4b0fcbd2906353` auf dem Arbeitszweig `strategiedesign/wp02`. Er enthält die zusammengeführten Aufträge 01 bis 06. Der Tester Funktion hat das Prüfskript nicht geändert; es gibt keinen Zweig des Testers Funktion.
- Testumgebung: läuft auf genau diesem Commit, gestartet mit `components/pipwerk-studio/scripts/testenv start --frontend-port 5174 --backend-port 8001`. Oberfläche `http://127.0.0.1:5174/`, Backend `http://127.0.0.1:8001/`, Schnittstellenbeschreibung `http://127.0.0.1:8001/docs`. Beende oder starte die Testumgebung nicht neu; sie wird anschließend dem Auftraggeber übergeben. Was du darin anlegst, entfernst du am Ende wieder; ändere das Objektverzeichnis am Ende auf das ursprüngliche zurück und lasse die Sprache auf Deutsch. Die gesicherte Strategie „EMA-Trendfolge“ liegt in der Testumgebung und bleibt unverändert (nicht speichern).

## Gegenstand

Arbeitspaket `wp02` „Strategien gestalten in der Oberfläche“ in `development/strategiedesign/plan.md`: Ziel, Umfang und alle Abnahmekriterien in der geltenden Fassung des Plans sowie die technischen Nachweise darunter. Die Abnahmekriterien gelten für die Neufassung; der Abnahmebericht `development/strategiedesign/wp02/acceptance/1.md` nennt die Mängel M1 bis M17, die behoben sein müssen.

## Umfang der Prüfung

1. Prüfe in der laufenden Testumgebung aus Kundensicht jedes Abnahmekriterium des Plans so, wie der Auftraggeber es selbst prüfen würde: in der Oberfläche, die Web-API zusätzlich über `/docs`. Für die Bedienung darfst du eine Browsersteuerung verwenden, zum Beispiel Playwright aus den Abhängigkeiten der Oberfläche in deinem eigenen Arbeitsverzeichnis, gerichtet auf die Testumgebung. `str-03` und `str-01` baust du nach der Anleitung der Anwenderdokumentation `docs/user/pipwerk-studio.md` (Schritte der Testfälle: `docs/technical/pipwerk-studio-testfaelle.md`) auf, ohne einen Ausdruck als Text einzugeben, und vergleichst das Ergebnis mit `contracts/strategies/v2/testcases/`. Öffne die gesicherte „EMA-Trendfolge“ und prüfe Anordnung, Namen und Wertlinien gegen den bestätigten Prototyp (Zweig `strategiedesign/proto-studio`, `components/pipwerk-studio/prototype/`, Bildschirmbilder dort und unter `work/strategiedesign/wp02/reports/05-screenshots/`). Prüfe die Fenstergrößen aus Spezifikation 5.1.
2. Prüfe die Anwenderdokumentation: Sie beschreibt die Bedienung von `wp02` verständlich und vollständig. Prüfe auch die technische Dokumentation (`docs/technical/pipwerk-studio.md`, `docs/technical/pipwerk-domain.md`) und das Glossar für dieses Paket.
3. Technische Nachweise: Führe in deinem eigenen Arbeitsverzeichnis auf dem geprüften Commit das Prüfskript `components/pipwerk-studio/scripts/check` auf freien Ports (nicht 5174 und 8001) aus, ohne `--with-audit`. Prüfe, dass für jeden zusammengeführten Auftrag positive Testberichte unter `development/strategiedesign/wp02/tests/` vorliegen (Aufträge 01 bis 03 aus der früheren Fassung; Auftrag 04: `04-functiontest-1.md`; 05: `05-functiontest-1.md`; 06: `06-functiontest-1.md`; Sicherheit: `sec-securitytest-1.md`).

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf der Neufassung vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis.
- `development/strategiedesign/plan.md` (`wp02`), `development/strategiedesign/specification.md`, `development/strategiedesign/scope.md` und die dort genannten Dokumente des Auftraggebers
- die Aufträge unter `development/strategiedesign/wp02/orders/`

Nenne zu jedem Befund Fundstelle und Sachverhalt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als `2.md` in das Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Testumgebung (Oberfläche 5174, Backend 8001), das Ergebnis je Abnahmekriterium, die Befunde und getrennt davon die Hinweise.
