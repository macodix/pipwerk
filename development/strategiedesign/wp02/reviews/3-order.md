# Prüfauftrag QA, Arbeitspaket `wp02`, Durchlauf 3 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Phase: 4 Umsetzung
- Rolle: QA
- zu prüfender Commit: `bb200ef3abffed8aab9e55f8ef508971d624145f` auf dem Arbeitszweig `strategiedesign/wp02` (Merge-Commit des Auftrags 07; spätere Commits ändern nur `development/`). Vorheriger Durchlauf: `development/strategiedesign/wp02/reviews/2.md` auf `strategiedesign/wp02`.
- Testumgebung: läuft auf genau diesem Commit (neu gestartet), Oberfläche `http://127.0.0.1:5174/`, Backend `http://127.0.0.1:8001/`. Beende oder starte sie nicht neu. Was du darin anlegst, entfernst du am Ende wieder; Objektverzeichnis und Sprache (Deutsch) wie vorgefunden; die gesicherte „EMA-Trendfolge“ bleibt unverändert (nicht speichern).

## Umfang der Prüfung

Nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md` ist dies eine Nachprüfung: Prüfe, ob die blockierenden Befunde B1 (Erscheinungsbild des geführten Aufbaus, Kriterium 12, in allen Größen aus Spezifikation 5.1) und B2 (Regelvorlage in der gewählten Sprache, Kriterium 5, in Bibliothek, Regelliste und Regelkarte) behoben sind und ob die dafür geänderten Stellen neue blockierende Fehler enthalten (Auftrag `orders/07.md`, Testbericht `tests/07-functiontest-1.md`, Sicherheit `tests/sec-securitytest-2.md`). Prüfe die Anwenderdokumentation zum geführten Aufbau (Hinweis H5 des Durchlaufs 2) gegen die Oberfläche, insbesondere die Aussage zu den Wahlkarten in 390 × 844. Führe das Prüfskript `check` auf freien Ports (nicht 5174, 8001) aus, ohne `--with-audit`. Weitere Hinweise des Durchlaufs 2 sind keine Befunde. Nur blockierende Befunde verhindern das Bestehen.

## Ablage

Schreibe den Prüfbericht als `3.md` in das Berichtsverzeichnis `work/strategiedesign/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Testumgebung (Oberfläche 5174, Backend 8001), das Ergebnis je Befund, neue Befunde und getrennt davon die Hinweise.
