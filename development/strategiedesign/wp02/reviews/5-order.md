# Prüfauftrag QA, Arbeitspaket `wp02`, Durchlauf 5

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Phase: 4 Umsetzung, `fix` nach Abnahmebericht 2
- Rolle: QA
- zu prüfender Commit: `bc01730bef48614847192f96700412c841f3e655` auf dem Arbeitszweig `strategiedesign/wp02`. Er enthält die zusammengeführten Aufträge 09 bis 14 zu den geänderten Anforderungen aus dem Abnahmebericht 2. Der Tester Funktion hat das Prüfskript in diesem Paket nicht geändert; es gibt keinen Zweig des Testers Funktion.
- Testumgebung: läuft auf genau diesem Commit, gestartet mit `components/pipwerk-studio/scripts/testenv start --frontend-port 5174 --backend-port 8001`. Oberfläche `http://127.0.0.1:5174/`, Backend `http://127.0.0.1:8001/`, Schnittstellenbeschreibung `http://127.0.0.1:8001/docs`. Beende oder starte die Testumgebung nicht neu; sie wird anschließend dem Auftraggeber übergeben. Was du darin anlegst, entfernst du am Ende wieder; ändere das Objektverzeichnis am Ende auf das ursprüngliche zurück, lasse die Sprache auf Deutsch, und lasse die gesicherte „EMA-Trendfolge“ unverändert.

## Gegenstand

Arbeitspaket `wp02` „Strategien gestalten in der Oberfläche“ in `development/strategiedesign/plan.md` in der Fassung vom 2026-10-23: Ziel, Umfang und alle Abnahmekriterien samt technischen Nachweisen. Maßgebend sind der Abnahmebericht `development/strategiedesign/wp02/acceptance/2.md` (Mängel M1 und M2, geänderte Anforderungen 1 bis 7) und die Spezifikation `development/strategiedesign/specification.md` (Stand 2026-10-23).

## Umfang der Prüfung

1. Prüfe in der laufenden Testumgebung aus Kundensicht jedes Abnahmekriterium des Plans für `wp02`, so wie der Auftraggeber es selbst prüfen würde: in der Oberfläche, für die Schnittstelle zusätzlich über `/docs`. Für die Bedienung darfst du eine Browsersteuerung verwenden (zum Beispiel Playwright aus den Abhängigkeiten der Oberfläche in deinem eigenen Arbeitsverzeichnis, gerichtet auf die Testumgebung). Baue `str-03` und `str-01` nach der Anleitung der Anwenderdokumentation `docs/user/pipwerk-studio.md` auf und vergleiche mit den Testfalldokumenten unter `contracts/strategies/v2/testcases/`.
2. Prüfe besonders die geänderten Anforderungen: Mangel M1 („Keine Strategie geöffnet“ genau einmal, in der Eigenschaftenansicht), Mangel M2 (kein eigener Bereich für Objekte; Objekte beim Element ihrer ersten Verwendung), Umschalten zwischen senkrechtem und waagerechtem Ablauf, ein- und ausblendbare Linien weiterer Verwendungen, Beschriftung der Linie mit Eigenschaft oder Methode, Schalter „Aktualisieren“ nur bei Typen, die es vorsehen, Gruppen der Elementbibliothek, gemeinsamer Namensraum (doppelter Name als Befund), Regeln in der Eigenschaftenansicht, Umbenennen, Entfernen mit Rückfrage, Bausteine, Formeleditor, Befunde mit Weg zur Behebung. Prüfe, dass sich die gesicherte „EMA-Trendfolge“ des Auftraggebers ohne Neubau öffnen lässt, alle Bereiche erreichbar sind und die Darstellung in den sechs Fenstergrößen nutzbar ist (390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768, 1920 × 1080).
3. Prüfe die Dokumentation: Anwenderdokumentation `docs/user/pipwerk-studio.md` und `docs/user/README.md` (verständlich, vollständig, ohne Test- und Abnahmeanleitungen), technische Dokumentation (`docs/technical/pipwerk-studio.md`, `pipwerk-studio-testfaelle.md`, `pipwerk-domain.md`) und Glossar für dieses Paket.
4. Technische Nachweise: Führe in deinem eigenen Arbeitsverzeichnis auf dem geprüften Commit das Prüfskript `components/pipwerk-studio/scripts/check` auf freien Ports (nicht 5174 und 8001) aus, ohne `--with-audit`. Prüfe, dass für jeden zusammengeführten Auftrag positive Testberichte beider Tester unter `development/strategiedesign/wp02/tests/` vorliegen (Funktion: `09-functiontest-1.md` bis `14-3-functiontest.md`; Sicherheit: `sec-securitytest-3.md`).
5. Die Hinweise der Tester zur Darstellung (Farben, Lesbarkeit) prüfst du am Bildschirm der Testumgebung selbst; ein Befund braucht einen Beleg (Aufnahme oder abgefragte Werte), keine Vermutung.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Es gilt, dass nur blockierende Befunde das Bestehen verhindern, alles andere ist ein Hinweis.
- `development/strategiedesign/plan.md` (`wp02`), `specification.md`, `scope.md` und die dort genannten Dokumente des Auftraggebers; die Aufträge unter `development/strategiedesign/wp02/orders/`.

Nenne zu jedem Befund Fundstelle und Sachverhalt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ausführung langer Befehle (verbindlich)

Befehle über 5 Minuten laufen im Hintergrund (Bash mit `run_in_background`); frage den Stand mindestens alle 5 Minuten mit einem eigenen kurzen Befehl ab.

## Ablage

Schreibe den Prüfbericht als `5.md` in das Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Testumgebung (Oberfläche 5174, Backend 8001), das Ergebnis je Abnahmekriterium, die Befunde und getrennt davon die Hinweise.
