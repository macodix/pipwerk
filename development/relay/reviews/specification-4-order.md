# Prüfauftrag Spezifikation, Durchlauf 4 (geänderte Stellen nach Einwänden des Auftraggebers)

- Vorhaben: `relay`
- Phase: 2 Konzeption, nach den Einwänden des Auftraggebers zur Präsentation `development/relay/presentations/specification-1.html` (Bestätigungsvermerk)
- Rolle: QA
- zu prüfender Stand: `main`, Commit `1525ec1d543ccf0c8e40b410d67a7287aa40ade2`
- vorheriger Prüfbericht: `development/relay/reviews/specification-3.md` (bestanden)

## Gegenstand

Der Auftraggeber hat die Spezifikation nicht bestätigt. Seine Einwände sind in die Anforderungen eingearbeitet (req-relay-012 neu, „Abruf“ statt „Beschaffung“), Nachprüfung bestanden in `development/relay/reviews/requirements-4.md`. Die Spezifikation ist danach geändert; der letzte Eintrag ihres Änderungsnachweises nennt die Stellen. Änderungen sichtbar mit `git diff 535208abbe32d54b7a37dc18fb05814cbc256d2e 1525ec1d543ccf0c8e40b410d67a7287aa40ade2 -- development/relay/specification.md` (Vorgänger ist der in `specification-3.md` bestandene Stand mit eingearbeiteten Hinweisen).

Prüfe nur die geänderten Stellen, vor allem den neuen Abschnitt 3.6:

1. Setzt die Spezifikation req-relay-012 vollständig um: beide Arten verfügbar, Festlegung, wann welche Art verwendet wird und über welche Wege Dateien übertragen werden, Erkennen einer unvollständigen oder veränderten Datei bei beiden Arten (req-relay-010)?
2. Widerspricht eine geänderte Stelle req-relay-001 bis req-relay-012, req-system-027 oder einem anderen Dokument laut `development/relay/scope.md`, zum Beispiel req-relay-003 (weitere Wege ohne Änderung von Komponenten und vorhandenen Wegen)?
3. Ist „Beschaffung“ in der Spezifikation vollständig durch „Abruf“ ersetzt, und enthält Abschnitt 6 (Abruf) keine Aussagen mehr zu pipwerk replay (Einwand „Folie 6 ohne pipwerk replay“)?
4. Lässt sich der Nachweis laut `scope.md` mit Abschnitt 8 weiterhin führen?

Nicht Gegenstand: nicht geänderte Stellen, Hinweise aus früheren Durchläufen, die Präsentation, Spezifikation und Plan von `backtest`, rein technische Einzelheiten ohne Bezug zu den Dokumenten des Auftraggebers.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Umfang der Prüfungen“ (Detailtiefe nach Umfang: Spezifikation legt nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails gehören in die Aufträge), „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“). Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `development/relay/scope.md` mit den dort genannten Anforderungsdokumenten

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-4.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
