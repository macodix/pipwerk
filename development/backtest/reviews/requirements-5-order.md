# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 5

- Vorhaben: `backtest`
- Phase: 2 Konzeption, Schritt 1: Nachprüfung der Dokumente des Auftraggebers nach der Abstimmung
- Rolle: QA
- zu prüfender Stand: `main`, Commit `e80090ca20e7794523c386e79bc6e38b06c0286a`
- Vorheriger Durchlauf: [requirements-4.md](requirements-4.md), geprüft auf Commit `42b60dbdf678d37fdccaecc5341a81fe9dc9902d`, bestanden, Hinweise H6 bis H10
- Abstimmung: Präsentation [requirements-1.html](../presentations/requirements-1.html), bestätigt vom Auftraggeber am 21. Oktober 2026

## Gegenstand

Dies ist eine Nachprüfung. Prüfe nur:

1. ob die blockierenden Befunde der Phase 1 erledigt sind. Laut [requirements-4.md](requirements-4.md) sind alle erledigt. Prüfe, ob das auf dem genannten Commit noch gilt, also ob seit Commit `42b60dbdf678d37fdccaecc5341a81fe9dc9902d` eine Änderung einen erledigten Befund wieder öffnet.
2. ob der Hinweis H6 aus `requirements-4.md` (Glossar, Eintrag „leer“) umgesetzt ist. Festlegung: Anforderungen Strategietester req-test-008, Entscheidung des Auftraggebers vom 2026-10-21.
3. ob die seit Durchlauf 4 geänderten Stellen neue Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen, auch Widersprüche zu nicht geänderten Stellen derselben Dokumente.

Die geänderten Stellen zeigt `git diff 42b60dbdf678d37fdccaecc5341a81fe9dc9902d e80090ca20e7794523c386e79bc6e38b06c0286a` für diese Dateien:

- `docs/design/requirements/anforderungen-strategietester.md` (Status)
- `docs/technical/glossar.md` (Eintrag „leer“)
- `development/backtest/scope.md` (Abschnitt „Stand“)

Nicht Gegenstand:

- Stellen, die seit Durchlauf 4 nicht geändert wurden, außer eine geänderte Stelle widerspricht ihnen
- die Hinweise H7 bis H10 aus `requirements-4.md` und die Hinweise früherer Durchläufe, die Sache der Spezifikation sind. Sie werden in der Spezifikation entschieden. Melde sie nicht erneut.
- die Präsentation selbst
- `docs/design/domain/indikator-markttechnik.md` (zurückgestellt) und die technischen Dokumente unter `docs/technical/` außer dem Glossar

## Prüfgrundlagen

- Briefing QA, Phase 2 Nachprüfung, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Dies ist eine Nachprüfung: Nenne nur noch offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-5.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, zu den Punkten 1 und 2 „erledigt“ oder „offen“, alle neuen blockierenden Befunde und getrennt davon die Hinweise.
