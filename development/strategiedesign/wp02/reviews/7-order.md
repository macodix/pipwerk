# Prüfauftrag QA, Arbeitspaket `wp02`, Durchlauf 7

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Phase: 4 Umsetzung, `fix` nach der Prüfung des Entwurfs 1 (`development/strategiedesign/wp02/conformance-1.md`, Befunde K1 und K2)
- Rolle: QA
- zu prüfender Commit: `18ec1ffb94d211e6e7818e79a5b1135cb3d5f11e` auf dem Arbeitszweig `strategiedesign/wp02`. Er enthält den zusammengeführten Auftrag 19 (Commit `63a9bfa6bdf1c20c9b2b6c927073fb56bbcee17c`); der Tester Funktion hat ihn bestanden (`development/strategiedesign/wp02/tests/19-1-functiontest.md`). Es gibt keinen Zweig des Testers Funktion.
- Testumgebung: läuft auf genau diesem Commit, gestartet mit `components/pipwerk-studio/scripts/testenv start --frontend-port 5174 --backend-port 8001`. Oberfläche `http://127.0.0.1:5174/`, Backend `http://127.0.0.1:8001/`, Schnittstellenbeschreibung `http://127.0.0.1:8001/docs`. Beende oder starte die Testumgebung nicht neu; sie wird anschließend dem Auftraggeber übergeben. Was du darin anlegst, entfernst du am Ende wieder; ändere das Objektverzeichnis am Ende auf das ursprüngliche zurück, lasse die Sprache auf Deutsch, und lasse die gesicherte „EMA-Trendfolge“ unverändert.

## Gegenstand

Nachprüfung (Durchlauf 7) nach Durchlauf 6 (`development/strategiedesign/wp02/reviews/6.md`, bestanden). Geändert hat sich nur das Einfügen einer Vorlage und eines Objekttyps in der Oberfläche (sie holt die Instanz jetzt von `POST /api/v1/insert`) sowie die technische Dokumentation zum Prototyp. Plan und Abnahmekriterien sind unverändert.

## Umfang der Prüfung

1. Prüfe in der laufenden Testumgebung aus Kundensicht das Einfügen:
   - jedes Element aus der Elementbibliothek per Klick und per Ziehen (mitgelieferte Vorlagen, Indikatoren, Trends, Regeln, Regelwerke, Objekte), in eine Strategie und in ein Element mit Regeln, und über die Liste „Regel oder Regelwerk hinzufügen …“;
   - den Fall zweier Regeln mit gleichem Namen: Eine Strategie mit der Regel „Mindestvolumen“ und ein eingefügtes Regelwerk mit einer Regel „Mindestvolumen“ ergeben unterschiedliche Namen („Prüfregeln Mindestvolumen“) ohne Befund zu doppelten Namen; die Ausdrücke im eingefügten Regelwerk verweisen auf die neuen Namen;
   - gleiches Element mehrfach eingefügt (Zahl am Namen), rasch hintereinander eingefügt;
   - Verhalten bei einem Fehler (zum Beispiel Backend nicht erreichbar, falls ohne Eingriff in die Testumgebung prüfbar; sonst als nicht prüfbar nennen).
2. Prüfe als Regression, dass der Aufbau von `str-03` und `str-01` nach `docs/user/pipwerk-studio.md` weiter gelingt und mit den Testfalldokumenten unter `contracts/strategies/v2/testcases/` übereinstimmt, dass sich die gesicherte „EMA-Trendfolge“ ohne Neubau öffnen lässt und dass Speichern, Öffnen und die Befundliste weiter arbeiten.
3. Prüfe, dass `docs/technical/pipwerk-studio.md` zum Prototyp (Abschnitt 2.3) mit E8 der Spezifikation (Fassung vom 2026-10-29) übereinstimmt.
4. Die Mängel E1 bis E13 und die sechs Fenstergrößen prüfst du nicht erneut, außer eine Beobachtung bei Punkt 1 oder 2 berührt sie.
5. Führe das Prüfskript `check` nicht aus.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis.
- `development/strategiedesign/plan.md` (`wp02`), `specification.md` (Stand 2026-10-29, 3.3, 4.2, E2, E8), `development/strategiedesign/wp02/orders/19.md`.

Nenne zu jedem Befund Fundstelle und Sachverhalt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ausführung langer Befehle (verbindlich)

Befehle über 5 Minuten laufen im Hintergrund (Bash mit `run_in_background`); frage den Stand mindestens alle 5 Minuten mit einem eigenen kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet. Schreibe den Bericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

## Ablage

Schreibe den Prüfbericht als `7.md` in das Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Testumgebung (Oberfläche 5174, Backend 8001), das Ergebnis je Prüfpunkt, die Befunde und getrennt davon die Hinweise.
