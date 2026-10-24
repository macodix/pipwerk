# Prüfauftrag Spezifikation, Durchlauf 5 (Ergänzung um req-relay-013)

- Vorhaben: `relay`
- Phase: 2 Konzeption, Ergänzung um eine neue Anforderung des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `ce20832e30435a5c0f279bdb114ba51a0a4778f3`
- vorheriger Prüfbericht: `development/relay/reviews/specification-4.md` (bestanden)

## Gegenstand

Der Auftraggeber hat eine Empfangsbestätigung auf Wunsch des Absenders festgelegt (req-relay-013 in `docs/design/requirements/anforderungen-nachrichtensystem.md`), Nachprüfung bestanden in `development/relay/reviews/requirements-5.md`. Die Spezifikation ist darum ergänzt; der letzte Eintrag ihres Änderungsnachweises nennt die Stellen. Änderungen sichtbar mit `git diff aad3ec705857c4e5d7d03ba7a4c21d214471aa5d ce20832e30435a5c0f279bdb114ba51a0a4778f3 -- development/relay/specification.md`.

Prüfe nur die geänderten Stellen, vor allem den neuen Abschnitt 3.7:

1. Setzt die Spezifikation req-relay-013 vollständig um: Wahl je Nachricht durch den Absender, automatische Bestätigung durch die empfangende laufende Komponente nach dem Speichern, Nachrichten-ID der bestätigten Nachricht, Meldung an den Anwender nach Ablauf einer Frist, Antwort als Bestätigung einer Anfrage, keine Prüfung des Abholens durch das Relay?
2. Widerspricht eine geänderte Stelle req-relay-001 bis req-relay-013, req-grund-003 bis req-grund-006 oder einem anderen Dokument laut `development/relay/scope.md`?
3. Lässt sich der Nachweis laut `scope.md` mit Abschnitt 8 weiterhin führen?

Nicht Gegenstand: nicht geänderte Stellen, Hinweise aus früheren Durchläufen, die Präsentation, Spezifikation und Plan von `backtest`, rein technische Einzelheiten ohne Bezug zu den Dokumenten des Auftraggebers.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Umfang der Prüfungen“ (Detailtiefe nach Umfang: Spezifikation legt nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails gehören in die Aufträge), „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“). Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `development/relay/scope.md` mit den dort genannten Anforderungsdokumenten

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-5.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
