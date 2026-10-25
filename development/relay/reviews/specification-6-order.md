# Prüfauftrag Spezifikation, Durchlauf 6 (Überarbeitung nach der Abnahme von wp01)

- Vorhaben: `relay`
- Phase: 2 Konzeption, Überarbeitung nach einer nicht bestandenen Abnahme mit Ursache in der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag enthält (`git log -1 --format=%H -- development/relay/reviews/specification-6-order.md`); nenne ihn im Bericht vollständig
- vorheriger Prüfbericht: `development/relay/reviews/specification-5.md` (bestanden); Nachprüfung der Dokumente des Auftraggebers bestanden in `development/relay/reviews/requirements-6.md`

## Gegenstand

Der Auftraggeber hat `wp01` nicht abgenommen: Einrichtung und Bedienung sind für ihn nicht annehmbar (`development/relay/wp01/acceptance/1.md`, Mängel M1 bis M7). Die Spezifikation `development/relay/specification.md` ist überarbeitet; der letzte Eintrag des Änderungsnachweises nennt die Stellen, Abschnitt 10 ordnet jedem Mangel seine Entscheidung zu. Änderungen sichtbar mit `git diff 5871ed93f1d26e96a50c3d53bfd0da58a8cd395d <geprüfter Commit> -- development/relay/specification.md`.

Für die geänderten Stellen ist dies ein erster, vollständiger Durchlauf. Prüfe:

1. Behebt die Spezifikation jeden Mangel M1 bis M7 so, wie der Abnahmebericht ihn beschreibt? Ein Mangel, der nicht behoben ist, ist blockierend.
2. Design (Briefing QA, Phase 2, und Entwicklungsregeln Abschnitt 5 Nr. 15): Hat jedes Programm genau eine Aufgabe und ist nach ihr benannt, ohne Unterbefehle für verschiedene Aufgaben? Sind Betrieb, Verwaltung (Einrichtung, Schlüsselerzeugung) und Werkzeuge für Tests getrennte Programme? Ist jede Entscheidung zum Aufbau begründet? Sind Installation und Einrichtung aus Sicht des Anwenders beschrieben (Abschnitt 4.6) und ohne vermeidbare Handarbeit an Dateien, Befehle ohne erklärten Zweck oder Kopieren von Schlüsseln? Ein Verstoß ist blockierend.
3. Widerspricht eine geänderte Stelle req-relay-001 bis req-relay-013, req-grund-003 bis req-grund-006 oder einem anderen Dokument laut `development/relay/scope.md`, insbesondere req-relay-010 (Schutz gegen Fälschung) bei der Entscheidung E5 für Komponenten auf demselben Rechner, req-system-016 bis req-system-018 (Konfiguration) und req-system-006 (Installation)?
4. Lässt sich der Nachweis laut `scope.md` mit Abschnitt 8 weiterhin führen, und weisen die Durchgänge 1 bis 4 pipwerk relay ohne MetaTrader 5 und ohne `pipwerk-fetch-mt5` nach (M6)?

Abschnitt 4.6 ist ein Vorschlag zum Bedienablauf, den der Auftraggeber noch bestätigt. Prüfe ihn gegen die Mängel und die Anforderungen; ob er dem Auftraggeber gefällt, ist nicht Gegenstand.

Nicht Gegenstand: nicht geänderte Stellen, Hinweise aus früheren Durchläufen, der Plan (eigener Prüfauftrag `plan-3-order.md`), der Code auf dem Arbeitszweig `relay/wp01`, Spezifikation und Plan von `backtest`, rein technische Einzelheiten ohne Bezug zu den Dokumenten des Auftraggebers, zum Abnahmebericht oder zum Design.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Umfang der Prüfungen“ (Detailtiefe nach Umfang: Spezifikation legt nur Bausteine, Entscheidungen und Abnahmekriterien fest; Wortlaut, Pfade und Testdetails gehören in die Aufträge), „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“). Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `docs/technical/development-test-security-rules.md`, Abschnitt 5 Nr. 15
- `development/relay/scope.md` mit den dort genannten Anforderungsdokumenten
- `development/relay/wp01/acceptance/1.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Ordne Befunde, die nur der Auftraggeber entscheiden kann, ausdrücklich der Gruppe „Entscheidung des Auftraggebers“ zu. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-6.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
