# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 3

- Vorhaben: `backtest`
- Phase: 1 Anforderung, Nachprüfung vor der Präsentation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `4356fa63ccbe5d7b90364871f3d2a6eaf7688526`
- Vorheriger Durchlauf: [requirements-2.md](requirements-2.md), geprüft auf Commit `5a1072494849c0110f86804686ecb092dd9b6d3a`, nicht bestanden (N1)
- Bearbeitung durch den Projektleiter: Abschnitt „Stand“ in `development/backtest/scope.md`, Eintrag vom 2026-10-21 zu Durchlauf 2

## Gegenstand

Dies ist eine Nachprüfung. Prüfe nur:

1. ob der blockierende Befund N1 aus `requirements-2.md` erledigt ist. Entscheidung des Auftraggebers vom 2026-10-21: Der Indikator `Markttechnik` ist zurückgestellt und gehört nicht mehr zu den geltenden Dokumenten des Vorhabens. `str-01` bestimmt Trend, Einstiegsbezug und Stop-Bezug aus dem letzten und vorletzten endgültigen Hoch und Tief des `ZigZag` (Fachmodell req-fach-054). Prüfe, ob `str-01` damit im Einzelschritt-Test und im Backtest so ausführbar ist, wie es beschrieben ist.
2. ob die Hinweise N5 und N6 umgesetzt sind,
3. ob die dafür geänderten Stellen neue Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen, auch Widersprüche zu nicht geänderten Stellen derselben Dokumente und verbliebene Verweise auf den zurückgestellten Indikator in den geprüften Dokumenten.

Die geänderten Stellen zeigt `git diff 5a1072494849c0110f86804686ecb092dd9b6d3a 4356fa63ccbe5d7b90364871f3d2a6eaf7688526` für diese Dateien:

- `docs/design/requirements/anforderungen-strategietester.md` (umbenannt aus `anforderungen-strategietester-backtester.md`)
- `docs/design/domain/fachmodell.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`
- `docs/design/projektziel.md` (Produktname pipwerk replay, nur soweit er die geprüften Dokumente berührt)
- `docs/technical/glossar.md`
- `development/backtest/scope.md`

Nicht Gegenstand:

- `docs/design/domain/indikator-markttechnik.md`; er ist zurückgestellt und kein geltendes Dokument dieses Vorhabens mehr
- Stellen, die seit Durchlauf 2 nicht geändert wurden, außer eine geänderte Stelle widerspricht ihnen
- die Hinweise N2, N3, N4 (Sache der Spezifikation) und N7 (offener Punkt) aus `requirements-2.md`. Melde sie nicht erneut.
- Änderungen in `anforderungen-strategiedesigner.md` und `development/strategiedesign/scope.md`; sie gehören zum Vorhaben `strategiedesign`. Ein Befund ist es nur, wenn eine Änderung dort einem geprüften Dokument widerspricht.
- die technischen Dokumente unter `docs/technical/` außer dem Glossar

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Dies ist eine Nachprüfung: Nenne nur noch offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Kommt ein Befund aus Durchlauf 2 unverändert wieder, kennzeichne ihn so.

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-3.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, zu N1, N5 und N6 „erledigt“ oder „offen“, alle neuen blockierenden Befunde und getrennt davon die Hinweise.
