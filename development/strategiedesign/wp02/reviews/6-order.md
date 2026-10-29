# Prüfauftrag QA, Arbeitspaket `wp02`, Durchlauf 6

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Phase: 4 Umsetzung, `implement` nach Abnahmebericht 3
- Rolle: QA
- zu prüfender Commit: `5f4df690807d7864bd8701ea577504f24fc8d3e5` auf dem Arbeitszweig `strategiedesign/wp02`. Er enthält die zusammengeführten Aufträge 15 bis 18 zu den Mängeln E1 bis E13 aus dem Abnahmebericht 3. Der Tester Funktion hat das Prüfskript in diesem Paket nicht geändert; es gibt keinen Zweig des Testers Funktion.
- Testumgebung: läuft auf genau diesem Commit, gestartet mit `components/pipwerk-studio/scripts/testenv start --frontend-port 5174 --backend-port 8001`. Oberfläche `http://127.0.0.1:5174/`, Backend `http://127.0.0.1:8001/`, Schnittstellenbeschreibung `http://127.0.0.1:8001/docs`. Beende oder starte die Testumgebung nicht neu; sie wird anschließend dem Auftraggeber übergeben. Was du darin anlegst, entfernst du am Ende wieder; ändere das Objektverzeichnis am Ende auf das ursprüngliche zurück, lasse die Sprache auf Deutsch, und lasse die gesicherte „EMA-Trendfolge“ unverändert.

## Gegenstand

Arbeitspaket `wp02` „Strategien gestalten in der Oberfläche“ in `development/strategiedesign/plan.md` (Fassung vom 2026-10-27): Ziel, Umfang und alle Abnahmekriterien samt technischen Nachweisen. Maßgebend sind der Abnahmebericht `development/strategiedesign/wp02/acceptance/3.md` (Mängel E1 bis E13) und die Spezifikation `development/strategiedesign/specification.md` (Stand 2026-10-27).

## Umfang der Prüfung

1. Prüfe in der laufenden Testumgebung aus Kundensicht jedes Abnahmekriterium des Plans für `wp02`, so wie der Auftraggeber es selbst prüfen würde: in der Oberfläche, für die Schnittstelle zusätzlich über `/docs`. Für die Bedienung darfst du eine Browsersteuerung verwenden (zum Beispiel Playwright aus den Abhängigkeiten der Oberfläche in deinem eigenen Arbeitsverzeichnis, gerichtet auf die Testumgebung). Baue `str-03` und `str-01` nach der Anwenderdokumentation `docs/user/pipwerk-studio.md` auf und vergleiche mit den Testfalldokumenten unter `contracts/strategies/v2/testcases/`.
2. Prüfe besonders die Mängel E1 bis E13 des Abnahmeberichts 3 einzeln und nenne zu jedem das Ergebnis: Begriff „Order- und Positionsverwaltung“ statt „Verwaltung“ (E1), Befundzahl führt zur Liste (E2), gleichlautende Befunde mit Element (E3), Auswahllisten (E4), Anwenderdokumentation ohne Prüf- und Abnahmeanleitung (E5), die Strategie „rechnet“ (E6), kein Assistent in `wp02` (E9), Texte der Oberfläche verständlich (E10), Eigenschaften der Elemente verständlich (E11), kein Baustein „Kreuzung“ (E12), Erklärung ersetzt statt angehängt (E13). Prüfe außerdem, dass sich die gesicherte „EMA-Trendfolge“ ohne Neubau öffnen lässt, alle Bereiche erreichbar sind und die Darstellung in den sechs Fenstergrößen nutzbar ist (390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768, 1920 × 1080), und dass eine Verbindung in ihrer Eigenschaftenansicht gelöscht werden kann.
3. Prüfe die Dokumentation: Anwenderdokumentation `docs/user/pipwerk-studio.md` und `docs/user/README.md` (verständlich, vollständig, ohne Test- und Abnahmeanleitungen, in der Sprache eines Händlers), technische Dokumentation (`docs/technical/pipwerk-studio.md`, `pipwerk-studio-testfaelle.md`, `pipwerk-domain.md`) und Glossar für dieses Paket.
4. Technische Nachweise: Prüfe, dass für jeden zusammengeführten Auftrag positive Testberichte beider Tester unter `development/strategiedesign/wp02/tests/` vorliegen (Funktion: `15-1-functiontest.md` bis `18-2-functiontest.md`, jeweils der letzte bestanden; Sicherheit: `sec-securitytest-4.md`). Führe das Prüfskript `check` nicht aus: Es läuft rund 17 Minuten, die Tester Funktion haben es in den Berichten auf diesem Stand bestanden, und es darf nicht neben der Testumgebung laufen.
5. Die Hinweise der Tester zur Darstellung (Farben, Lesbarkeit) prüfst du am Bildschirm der Testumgebung selbst; ein Befund braucht einen Beleg (Aufnahme oder abgefragte Werte), keine Vermutung.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis.
- `development/strategiedesign/plan.md` (`wp02`), `specification.md`, `scope.md` und die dort genannten Dokumente des Auftraggebers; die Aufträge unter `development/strategiedesign/wp02/orders/`.

Nenne zu jedem Befund Fundstelle und Sachverhalt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ausführung langer Befehle (verbindlich)

Befehle über 5 Minuten laufen im Hintergrund (Bash mit `run_in_background`); frage den Stand mindestens alle 5 Minuten mit einem eigenen kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet. Schreibe den Bericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

## Ablage

Schreibe den Prüfbericht als `6.md` in das Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Testumgebung (Oberfläche 5174, Backend 8001), das Ergebnis je Abnahmekriterium und je Mangel E1 bis E13, die Befunde und getrennt davon die Hinweise.
