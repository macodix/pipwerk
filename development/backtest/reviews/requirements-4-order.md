# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 4

- Vorhaben: `backtest`
- Phase: 1 Anforderung, Nachprüfung vor der Präsentation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `42b60dbdf678d37fdccaecc5341a81fe9dc9902d`
- Vorheriger Durchlauf: [requirements-3.md](requirements-3.md), geprüft auf Commit `4356fa63ccbe5d7b90364871f3d2a6eaf7688526`, nicht bestanden (M1, M2)
- Bearbeitung durch den Projektleiter: Abschnitt „Stand“ in `development/backtest/scope.md`, Eintrag vom 2026-10-21 zu Durchlauf 3
- Fortsetzung der Schleife über die Grenze der Durchläufe hinaus: Entscheidung des Projektleiters

## Gegenstand

Dies ist eine Nachprüfung. Prüfe nur:

1. ob der blockierende Befund M1 aus `requirements-3.md` erledigt ist. Festlegung des Auftraggebers vom 2026-10-21: Anforderungen Strategietester req-test-008 (Indikatoren ohne Werte) und `str-01` Abschnitt 1 („Sonst liegt kein Trend vor, auch solange …“).
2. ob der blockierende Befund M2 aus `requirements-3.md` erledigt ist. Festlegung des Auftraggebers vom 2026-10-21: Anforderungen Strategietester req-test-004 (Abwicklung wie ein Broker, Ablehnung mit sichtbarem Grund) und `str-01` Abschnitt 1 (letzter Absatz).
3. ob der Hinweis H4, soweit er das Fachmodell betrifft (Beispiele der Punkt-Schreibweise), umgesetzt ist,
4. ob die dafür geänderten Stellen neue Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen, auch Widersprüche zu nicht geänderten Stellen derselben Dokumente und zum Glossar (Eintrag „leer“).

Die geänderten Stellen zeigt `git diff 4356fa63ccbe5d7b90364871f3d2a6eaf7688526 42b60dbdf678d37fdccaecc5341a81fe9dc9902d` für diese Dateien:

- `docs/design/requirements/anforderungen-strategietester.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`
- `development/backtest/scope.md`

Nicht Gegenstand:

- Stellen, die seit Durchlauf 3 nicht geändert wurden, außer eine geänderte Stelle widerspricht ihnen
- die Hinweise H1, H2, H3 (Sache der Spezifikation), H5 und die übrigen Teile von H4 aus `requirements-3.md`. Melde sie nicht erneut.
- `docs/design/domain/indikator-markttechnik.md` (zurückgestellt) und die technischen Dokumente unter `docs/technical/` außer dem Glossar
- wie die interne Abwicklung im Einzelnen entscheidet, welche Order ein Broker ablehnen würde, und wie der Grund der Ablehnung dargestellt wird; das ist Sache der Spezifikation

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Dies ist eine Nachprüfung: Nenne nur noch offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Kommt ein Befund aus Durchlauf 3 unverändert wieder, kennzeichne ihn so.

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-4.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, zu M1, M2 und H4 (Fachmodell) „erledigt“ oder „offen“, alle neuen blockierenden Befunde und getrennt davon die Hinweise.
