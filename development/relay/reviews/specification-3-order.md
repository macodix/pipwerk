# Prüfauftrag Spezifikation, Durchlauf 3 (Nachprüfung)

- Vorhaben: `relay`
- Phase: 2 Konzeption
- Rolle: QA
- zu prüfender Stand: `main`, Commit `1ef0244f7253f5d2dfe02f6f4d35b13832cf080d`
- vorheriger Prüfbericht: `development/relay/reviews/specification-2.md` (nicht bestanden, geprüfter Commit `90ac2bd6937c6b8b66a23f3f2e2e3c780c00e59b`)

## Gegenstand

Dritter Durchlauf. In Durchlauf 2 ist die Zahl der blockierenden Befunde nicht gesunken. Der Softwarearchitekt hat N1 und N2 als rein technische Streitpunkte selbst entschieden (`docs/technical/entwicklungsverfahren.md`, „Grenze der Durchläufe“ und „Rein technische Streitpunkte“); die Entscheidungen stehen in Abschnitt 3.4 (N1) und E2, E3, 5, 7, 8 (N2), der Änderungsnachweis nennt sie. Vermerke beide im Bericht als entschieden.

Änderungen sichtbar mit `git diff 90ac2bd6937c6b8b66a23f3f2e2e3c780c00e59b 1ef0244f7253f5d2dfe02f6f4d35b13832cf080d -- development/relay/specification.md`.

Prüfe ab diesem Durchlauf nur noch Befunde, die Dokumente des Auftraggebers, bestätigte Festlegungen, Abnahmekriterien oder den Umfang berühren:

1. Erfüllen die geänderten Stellen req-relay-003 (weitere Wege ohne Änderung von Komponenten und vorhandenen Wegen) und req-system-009 (Web-API der Hauptkomponente)?
2. Widerspricht eine geänderte Stelle (E2, E3, E4, 3.4, 4.1 Schritte 3 und 4, 4.4, 5, 7, 8) einem Dokument laut `development/relay/scope.md`, zum Beispiel req-system-011 oder req-system-027?

Nicht Gegenstand: rein technische Fragen ohne Bezug zu diesen Dokumenten, nicht geänderte Stellen, Hinweise aus früheren Durchläufen.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“), „Grenze der Durchläufe“ und „Rein technische Streitpunkte“. Nachprüfung: nur offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `development/relay/scope.md` mit den dort genannten Anforderungsdokumenten

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-3.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
