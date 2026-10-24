# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 2 (Nachprüfung)

- Vorhaben: `relay`
- Phase: 1 Anforderung, Nachprüfung der Dokumente des Auftraggebers vor der Präsentation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `2736fa181ea1b072c2e80bbb7f58a9ed7f24ed49`
- vorheriger Prüfbericht: `development/relay/reviews/requirements-1.md` (Commit `bec2b0f664786433ae0f01bd6fb320d296c21db1`)

## Gegenstand

Dies ist eine Nachprüfung. Prüfe nur:

1. ob die blockierenden Befunde B1 bis B3 aus `requirements-1.md` erledigt sind,
2. ob Hinweis H5 (Glossar, Begriff „Instanz“ und fehlende Begriffe) erledigt ist,
3. ob die dafür geänderten Stellen neue Fehler enthalten.

Die Entscheidungen des Auftraggebers stehen in `development/relay/scope.md`, Abschnitt „Stand“, Eintrag nach `requirements-1.md`. Geänderte Stellen seit `bec2b0f664786433ae0f01bd6fb320d296c21db1` (mit `git diff` nachvollziehbar):

- `development/relay/scope.md`: Beschreibung, Nachweis des Vorhabens, geltende Dokumente (Strategietester entfällt), Abhängigkeit
- `development/backtest/scope.md`: neuer offener Punkt zu Broker und Symbol (B1)
- `docs/design/requirements/anforderungen-nachrichtensystem.md`: req-relay-005, req-relay-007, Änderungsnachweis
- `docs/design/requirements/anforderungen-handelssystem.md`: req-grund-004, Übermittlung der Order, Änderungsnachweis
- `docs/technical/glossar.md`: Einträge Beschaffung, Nachrichtensystem, Nachricht, Relay, Übertragungsweg, Adressbuch, Standard-Relay, Laufende Komponente, Adresse, pipwerk-Netz, Betreiber

Prüfe außerdem, ob sich der geänderte Nachweis des Vorhabens laut `scope.md` mit den beschriebenen Objekten und Arbeitsabläufen vollständig abbilden lässt.

Nicht Gegenstand: alle übrigen Stellen, die übrigen Hinweise aus `requirements-1.md` (H1 bis H4, H6 bis H11) und die als offen gekennzeichneten Punkte. Melde sie nicht erneut.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: Phase 1, „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“). Beachte besonders: Jeder weitere Durchlauf ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Eine Nachprüfung nennt nur die noch offenen und die neuen Befunde. Höchstens etwa 60 Zeilen.
- `development/relay/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-2.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
